package store

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	_ "modernc.org/sqlite"
	"github.com/sirupsen/logrus"
)

type SQLiteStore struct {
	db  *sql.DB
	log *logrus.Logger
}

type AttendanceRecord struct {
	UUID      string    `json:"uuid"`
	UserID    string    `json:"user_id"`
	DeviceID  string    `json:"device_id"`
	Timestamp time.Time `json:"timestamp"`
	Status    int       `json:"status"`
	Synced    bool      `json:"synced"`
}

type QueueItem struct {
	ID         string    `json:"id"`
	Payload    string    `json:"payload"`
	Topic      string    `json:"topic"`
	Retries    int       `json:"retries"`
	MaxRetries int       `json:"max_retries"`
	CreatedAt  time.Time `json:"created_at"`
	NextRetry  time.Time `json:"next_retry"`
	Error      string    `json:"error"`
}

func NewSQLiteStore(dataDir string, log *logrus.Logger) (*SQLiteStore, error) {
	os.MkdirAll(dataDir, 0755)

	dbPath := filepath.Join(dataDir, "edge.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite: %w", err)
	}
	db.SetMaxOpenConns(1)

	db.Exec("PRAGMA journal_mode=WAL")
	db.Exec("PRAGMA busy_timeout=5000")

	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite: %w", err)
	}
	db.SetMaxOpenConns(1)

	store := &SQLiteStore{db: db, log: log}
	if err := store.migrate(); err != nil {
		return nil, fmt.Errorf("failed to migrate: %w", err)
	}

	return store, nil
}

func (s *SQLiteStore) migrate() error {
	schema := `
	CREATE TABLE IF NOT EXISTS attendance_records (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		uuid TEXT NOT NULL UNIQUE,
		user_id TEXT NOT NULL,
		device_id TEXT NOT NULL,
		timestamp DATETIME NOT NULL,
		status INTEGER DEFAULT 0,
		synced INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_uuid ON attendance_records(uuid);
	CREATE INDEX IF NOT EXISTS idx_attendance_synced ON attendance_records(synced);
	CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance_records(timestamp);

	CREATE TABLE IF NOT EXISTS sync_queue (
		id TEXT PRIMARY KEY,
		payload BLOB NOT NULL,
		topic TEXT NOT NULL,
		retries INTEGER DEFAULT 0,
		max_retries INTEGER DEFAULT 5,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		next_retry DATETIME,
		last_error TEXT
	);

	CREATE INDEX IF NOT EXISTS idx_queue_retry ON sync_queue(next_retry);

	CREATE TABLE IF NOT EXISTS dead_letter_queue (
		id TEXT PRIMARY KEY,
		payload BLOB NOT NULL,
		topic TEXT NOT NULL,
		retries INTEGER DEFAULT 0,
		error TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		failed_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS device_cache (
		ip TEXT PRIMARY KEY,
		serial TEXT,
		model TEXT,
		firmware TEXT,
		last_seen DATETIME,
		info_json TEXT
	);

	CREATE TABLE IF NOT EXISTS sync_state (
		serial TEXT PRIMARY KEY,
		last_sync DATETIME,
		last_user_sync DATETIME,
		cursor TEXT,
		last_event_id TEXT,
		events_imported INTEGER DEFAULT 0
	);

	CREATE TABLE IF NOT EXISTS device_credentials (
		serial TEXT PRIMARY KEY,
		encrypted_commkey TEXT,
		port INTEGER DEFAULT 4370,
		ip TEXT,
		provisioned_at DATETIME,
		last_online DATETIME
	);

	CREATE TABLE IF NOT EXISTS event_log (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		event_uuid TEXT UNIQUE,
		serial TEXT,
		event_type TEXT,
		description TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`

	_, err := s.db.Exec(schema)
	return err
}

func (s *SQLiteStore) SaveAttendance(records []AttendanceRecord) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare("INSERT OR IGNORE INTO attendance_records (uuid, user_id, device_id, timestamp, status, synced) VALUES (?, ?, ?, ?, ?, 0)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, r := range records {
		if r.UUID == "" {
			r.UUID = uuid.New().String()
		}
		if _, err := stmt.Exec(r.UUID, r.UserID, r.DeviceID, r.Timestamp, r.Status); err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (s *SQLiteStore) GetUnsyncedAttendance(limit int) ([]AttendanceRecord, error) {
	rows, err := s.db.Query(
		"SELECT uuid, user_id, device_id, timestamp, status FROM attendance_records WHERE synced = 0 ORDER BY timestamp ASC LIMIT ?",
		limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []AttendanceRecord
	for rows.Next() {
		var r AttendanceRecord
		if err := rows.Scan(&r.UUID, &r.UserID, &r.DeviceID, &r.Timestamp, &r.Status); err != nil {
			return nil, err
		}
		r.Synced = false
		records = append(records, r)
	}
	return records, nil
}

func (s *SQLiteStore) MarkSynced(uuid string) error {
	_, err := s.db.Exec("UPDATE attendance_records SET synced = 1 WHERE uuid = ?", uuid)
	return err
}

func (s *SQLiteStore) DeleteSyncedOlderThan(hours int) error {
	_, err := s.db.Exec(
		"DELETE FROM attendance_records WHERE synced = 1 AND timestamp < datetime('now', ?)",
		fmt.Sprintf("-%d hours", hours),
	)
	return err
}

func (s *SQLiteStore) Enqueue(id, topic string, payload []byte, maxRetries int) error {
	now := time.Now()
	_, err := s.db.Exec(
		"INSERT INTO sync_queue (id, payload, topic, max_retries, next_retry) VALUES (?, ?, ?, ?, ?)",
		id, payload, topic, maxRetries, now,
	)
	return err
}

func (s *SQLiteStore) Dequeue() (*QueueItem, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	row := tx.QueryRow(`
		SELECT id, payload, topic, retries, max_retries, created_at, next_retry, last_error
		FROM sync_queue
		WHERE next_retry <= CURRENT_TIMESTAMP
		ORDER BY created_at ASC LIMIT 1
	`)

	var item QueueItem
	var createdAt, nextRetry time.Time
	var lastError sql.NullString
	if err := row.Scan(&item.ID, &item.Payload, &item.Topic, &item.Retries, &item.MaxRetries, &createdAt, &nextRetry, &lastError); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	item.CreatedAt = createdAt
	item.NextRetry = nextRetry
	if lastError.Valid {
		item.Error = lastError.String
	}

	_, err = tx.Exec("DELETE FROM sync_queue WHERE id = ?", item.ID)
	if err != nil {
		return nil, err
	}

	return &item, tx.Commit()
}

func (s *SQLiteStore) RequeueOrDeadLetter(item *QueueItem, errMsg string, backoff func(int) time.Duration) error {
	item.Retries++
	item.Error = errMsg

	if item.Retries >= item.MaxRetries {
		return s.moveToDeadLetter(item)
	}

	item.NextRetry = time.Now().Add(backoff(item.Retries))
	_, err := s.db.Exec(
		"INSERT INTO sync_queue (id, payload, topic, retries, max_retries, next_retry, last_error) VALUES (?, ?, ?, ?, ?, ?, ?)",
		item.ID, item.Payload, item.Topic, item.Retries, item.MaxRetries, item.NextRetry, item.Error,
	)
	return err
}

func (s *SQLiteStore) moveToDeadLetter(item *QueueItem) error {
	_, err := s.db.Exec(
		"INSERT OR IGNORE INTO dead_letter_queue (id, payload, topic, retries, error) VALUES (?, ?, ?, ?, ?)",
		item.ID, item.Payload, item.Topic, item.Retries, item.Error,
	)
	return err
}

func (s *SQLiteStore) GetDeadLetterCount() (int, error) {
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM dead_letter_queue").Scan(&count)
	return count, err
}

func (s *SQLiteStore) GetQueueSize() (int, error) {
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM sync_queue").Scan(&count)
	return count, err
}

func (s *SQLiteStore) GetUnsyncedCount() (int, error) {
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM attendance_records WHERE synced = 0").Scan(&count)
	return count, err
}

// Credential management
func (s *SQLiteStore) SaveCredentials(serial, encryptedKey, ip string, port int) error {
	_, err := s.db.Exec(
		"INSERT OR REPLACE INTO device_credentials (serial, encrypted_commkey, ip, port, provisioned_at, last_online) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
		serial, encryptedKey, ip, port,
	)
	return err
}

func (s *SQLiteStore) GetCredentials(serial string) (encryptedKey, ip string, port int, err error) {
	row := s.db.QueryRow("SELECT encrypted_commkey, ip, port FROM device_credentials WHERE serial = ?", serial)
	err = row.Scan(&encryptedKey, &ip, &port)
	return
}

// Cursor tracking
func (s *SQLiteStore) SaveCursor(serial, cursor string) error {
	_, err := s.db.Exec(
		"INSERT OR REPLACE INTO sync_state (serial, cursor, last_sync) VALUES (?, ?, CURRENT_TIMESTAMP)",
		serial, cursor,
	)
	return err
}

func (s *SQLiteStore) GetCursor(serial string) (string, error) {
	var cursor string
	err := s.db.QueryRow("SELECT cursor FROM sync_state WHERE serial = ?", serial).Scan(&cursor)
	if err == sql.ErrNoRows {
		return "", nil
	}
	return cursor, err
}

func (s *SQLiteStore) ResetCursor(serial string) error {
	_, err := s.db.Exec("UPDATE sync_state SET cursor = NULL, last_event_id = NULL WHERE serial = ?", serial)
	return err
}

// Event replay
func (s *SQLiteStore) LogEvent(uuid, serial, eventType, description string) error {
	_, err := s.db.Exec(
		"INSERT OR IGNORE INTO event_log (event_uuid, serial, event_type, description) VALUES (?, ?, ?, ?)",
		uuid, serial, eventType, description,
	)
	return err
}

func (s *SQLiteStore) GetLatestCursor(serial string) (string, error) {
	var ev, t interface{}
	err := s.db.QueryRow("SELECT cursor, last_sync FROM sync_state WHERE serial = ?", serial).Scan(&ev, &t)
	if err == sql.ErrNoRows {
		return "", nil
	}
	if ev == nil {
		return "", nil
	}
	return ev.(string), nil
}

// Retention: cleanup synced records older than N hours
func (s *SQLiteStore) CleanupSyncedRecords(hours int) (int, error) {
	res, err := s.db.Exec(
		"DELETE FROM attendance_records WHERE synced = 1 AND timestamp < datetime('now', ?)",
		fmt.Sprintf("-%d hours", hours),
	)
	if err != nil {
		return 0, err
	}
	n, _ := res.RowsAffected()
	return int(n), nil
}

// Retention: cleanup event log older than N days
func (s *SQLiteStore) CleanupEventLog(days int) error {
	_, err := s.db.Exec(
		"DELETE FROM event_log WHERE created_at < datetime('now', ?)",
		fmt.Sprintf("-%d days", days),
	)
	return err
}

// Retry all dead letter items
func (s *SQLiteStore) RetryDeadLetters() (int, error) {
	rows, err := s.db.Query("SELECT id, payload, topic FROM dead_letter_queue")
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var id, topic string
		var payload []byte
		if err := rows.Scan(&id, &payload, &topic); err != nil {
			continue
		}
		s.db.Exec("INSERT OR REPLACE INTO sync_queue (id, payload, topic, max_retries, next_retry) VALUES (?, ?, ?, 5, CURRENT_TIMESTAMP)", id, payload, topic)
		s.db.Exec("DELETE FROM dead_letter_queue WHERE id = ?", id)
		count++
	}
	return count, nil
}

func (s *SQLiteStore) Close() error {
	return s.db.Close()
}

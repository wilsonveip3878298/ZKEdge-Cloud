package queue

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/google/uuid"
)

type QueueItem struct {
	ID        string    `json:"id"`
	Data      []byte    `json:"data"`
	CreatedAt time.Time `json:"created_at"`
	Retries   int       `json:"retries"`
}

type OfflineQueue struct {
	dir   string
	items map[string]*QueueItem
	mu    sync.RWMutex
}

func NewOfflineQueue(dataDir string) *OfflineQueue {
	qDir := filepath.Join(dataDir, "queue")
	os.MkdirAll(qDir, 0755)

	q := &OfflineQueue{
		dir:   qDir,
		items: make(map[string]*QueueItem),
	}

	q.loadFromDisk()
	return q
}

func (q *OfflineQueue) Enqueue(data []byte) error {
	item := &QueueItem{
		ID:        uuid.New().String(),
		Data:      data,
		CreatedAt: time.Now(),
		Retries:   0,
	}

	q.mu.Lock()
	q.items[item.ID] = item
	q.mu.Unlock()

	return q.saveToDisk(item)
}

func (q *OfflineQueue) Dequeue(id string) error {
	q.mu.Lock()
	delete(q.items, id)
	q.mu.Unlock()

	path := filepath.Join(q.dir, id+".json")
	return os.Remove(path)
}

func (q *OfflineQueue) Flush(send func([]byte) error) error {
	q.mu.RLock()
	items := make([]*QueueItem, 0, len(q.items))
	for _, item := range q.items {
		items = append(items, item)
	}
	q.mu.RUnlock()

	for _, item := range items {
		if err := send(item.Data); err != nil {
			return err
		}
		q.Dequeue(item.ID)
	}

	return nil
}

func (q *OfflineQueue) HasPending() bool {
	q.mu.RLock()
	defer q.mu.RUnlock()
	return len(q.items) > 0
}

func (q *OfflineQueue) loadFromDisk() {
	files, err := os.ReadDir(q.dir)
	if err != nil {
		return
	}

	for _, f := range files {
		if filepath.Ext(f.Name()) != ".json" {
			continue
		}

		data, err := os.ReadFile(filepath.Join(q.dir, f.Name()))
		if err != nil {
			continue
		}

		var item QueueItem
		if err := json.Unmarshal(data, &item); err != nil {
			continue
		}

		q.items[item.ID] = &item
	}
}

func (q *OfflineQueue) saveToDisk(item *QueueItem) error {
	data, err := json.Marshal(item)
	if err != nil {
		return err
	}

	path := filepath.Join(q.dir, item.ID+".json")
	return os.WriteFile(path, data, 0644)
}

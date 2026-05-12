package zkteco

import (
	"encoding/binary"
	"fmt"
	"net"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"github.com/sistema/agent/internal/config"
)

type Client struct {
	cfg    *config.Config
	log    *logrus.Logger
	conn   net.Conn
}

type AttendanceRecord struct {
	UUID      string
	UserID    string
	Timestamp time.Time
	DeviceID  string
	Status    int
}

type UserRecord struct {
	UserID     string
	Name       string
	CardNumber string
	Password   string
	Privilege  int
	Enabled    bool
}

func NewClient(cfg *config.Config, log *logrus.Logger) *Client {
	return &Client{
		cfg: cfg,
		log: log,
	}
}

func (c *Client) Connect(ip string) error {
	addr := fmt.Sprintf("%s:%d", ip, c.cfg.ZKTeco.TCPPort)
	conn, err := net.DialTimeout("tcp", addr, time.Duration(c.cfg.ZKTeco.Timeout)*time.Second)
	if err != nil {
		return fmt.Errorf("failed to connect to %s: %w", addr, err)
	}
	c.conn = conn
	return nil
}

func (c *Client) Disconnect() error {
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}

func (c *Client) GetAttendanceRecords(since time.Time) ([]AttendanceRecord, error) {
	if err := c.sendCommand(CMD_ATT_LOG_RQ); err != nil {
		return nil, fmt.Errorf("failed to request attendance: %w", err)
	}

	records, err := c.readAttendanceRecords()
	if err != nil {
		return nil, fmt.Errorf("failed to read attendance: %w", err)
	}

	filtered := make([]AttendanceRecord, 0)
	for _, r := range records {
		if r.UUID == "" {
			r.UUID = uuid.New().String()
		}
		if r.Timestamp.After(since) {
			filtered = append(filtered, r)
		}
	}

	return filtered, nil
}

func (c *Client) GetUsers() ([]UserRecord, error) {
	if err := c.sendCommand(CMD_USERS_RQ); err != nil {
		return nil, fmt.Errorf("failed to request users: %w", err)
	}
	return c.readUserRecords()
}

func (c *Client) CreateUser(user UserRecord) error {
	data := c.buildUserData(user)
	return c.sendData(CMD_USER_WRITE, data)
}

func (c *Client) DeleteUser(userID string) error {
	data := []byte(userID)
	return c.sendData(CMD_USER_DELETE, data)
}

func (c *Client) GetDeviceInfo() (map[string]string, error) {
	if err := c.sendCommand(CMD_DEVICE_INFO); err != nil {
		return nil, err
	}
	return c.readDeviceInfo()
}

func (c *Client) sendCommand(cmd uint16) error {
	buf := make([]byte, 8)
	binary.LittleEndian.PutUint16(buf[0:2], cmd)
	binary.LittleEndian.PutUint16(buf[2:4], 0)
	binary.LittleEndian.PutUint32(buf[4:8], 0)

	_, err := c.conn.Write(buf)
	return err
}

func (c *Client) sendData(cmd uint16, data []byte) error {
	buf := make([]byte, 8+len(data))
	binary.LittleEndian.PutUint16(buf[0:2], cmd)
	binary.LittleEndian.PutUint16(buf[2:4], uint16(len(data)))
	binary.LittleEndian.PutUint32(buf[4:8], checksum(data))
	copy(buf[8:], data)

	_, err := c.conn.Write(buf)
	return err
}

func checksum(data []byte) uint32 {
	var sum uint32
	for _, b := range data {
		sum += uint32(b)
	}
	return sum
}

func (c *Client) readAttendanceRecords() ([]AttendanceRecord, error) {
	c.log.Debug("Reading attendance records from ZKTeco device")
	return []AttendanceRecord{}, nil
}

func (c *Client) readUserRecords() ([]UserRecord, error) {
	c.log.Debug("Reading user records from ZKTeco device")
	return []UserRecord{}, nil
}

func (c *Client) readDeviceInfo() (map[string]string, error) {
	c.log.Debug("Reading device info from ZKTeco")
	return map[string]string{
		"serial_number": "SN12345",
		"firmware":      "6.60",
	}, nil
}

func (c *Client) buildUserData(user UserRecord) []byte {
	data := make([]byte, 72)
	copy(data[0:9], padString(user.UserID, 9))
	copy(data[9:40], padString(user.Name, 31))
	copy(data[40:48], padString(user.CardNumber, 8))
	return data
}

func padString(s string, length int) []byte {
	b := make([]byte, length)
	copy(b, []byte(s))
	return b
}

const (
	CMD_CONNECT       uint16 = 1000
	CMD_DISCONNECT    uint16 = 1001
	CMD_ATT_LOG_RQ    uint16 = 1500
	CMD_ATT_LOG_RSP   uint16 = 1501
	CMD_USERS_RQ      uint16 = 2000
	CMD_USERS_RSP     uint16 = 2001
	CMD_USER_WRITE    uint16 = 2002
	CMD_USER_DELETE   uint16 = 2003
	CMD_DEVICE_INFO   uint16 = 1100
)

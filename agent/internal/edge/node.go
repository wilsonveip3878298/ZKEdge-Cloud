package edge

import (
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/sistema/agent/internal/config"
	"github.com/sistema/agent/internal/store"
	"github.com/sistema/agent/internal/zkteco"
)

type NodeState string

const (
	StateOnline    NodeState = "online"
	StateOffline   NodeState = "offline"
	StateDegraded  NodeState = "degraded"
	StateRecovery  NodeState = "recovery"
)

type EdgeNode struct {
	cfg       *config.Config
	log       *logrus.Logger
	store     *store.SQLiteStore
	zkClient  *zkteco.Client
	state     NodeState
	mu        sync.RWMutex
	eventCh   chan Event
	doneCh    chan struct{}
	cb        *CircuitBreaker
	retry     RetryPolicy
	startTime time.Time
	stats     NodeStats
}

type Event struct {
	Type      string      `json:"type"`
	Source    string      `json:"source"`
	Payload   interface{} `json:"payload"`
	Timestamp time.Time   `json:"timestamp"`
}

type NodeStats struct {
	UptimeSeconds    int64   `json:"uptime_seconds"`
	RecordsStored    int     `json:"records_stored"`
	QueueSize        int     `json:"queue_size"`
	DeadLetterCount  int     `json:"dead_letter_count"`
	SyncAttempts     int64   `json:"sync_attempts"`
	SyncFailures     int64   `json:"sync_failures"`
	LastSyncTime     *time.Time `json:"last_sync_time,omitempty"`
	DevicesFound     int     `json:"devices_found"`
	MemoryUsageMB    float64 `json:"memory_usage_mb"`
	State            NodeState `json:"state"`
	InternetReachable bool   `json:"internet_reachable"`
}

func NewEdgeNode(cfg *config.Config, log *logrus.Logger, sqlite *store.SQLiteStore, zk *zkteco.Client) *EdgeNode {
	return &EdgeNode{
		cfg:       cfg,
		log:       log,
		store:     sqlite,
		zkClient:  zk,
		state:     StateOffline,
		eventCh:   make(chan Event, 1000),
		doneCh:    make(chan struct{}),
		cb:        NewCircuitBreaker(5, 30*time.Second),
		retry:     DefaultRetryPolicy(),
		startTime: time.Now(),
	}
}

func (n *EdgeNode) Start() {
	n.log.Info("Edge node starting...")
	n.state = StateOnline

	go n.eventLoop()
	go n.healthCheck()
	go n.cacheWarmup()

	n.emitEvent(Event{Type: "node.started", Source: "edge", Timestamp: time.Now()})
}

func (n *EdgeNode) Stop() {
	n.log.Info("Edge node stopping...")
	close(n.doneCh)
	n.emitEvent(Event{Type: "node.stopped", Source: "edge", Timestamp: time.Now()})
}

func (n *EdgeNode) eventLoop() {
	for {
		select {
		case ev := <-n.eventCh:
			n.processEvent(ev)
		case <-n.doneCh:
			return
		}
	}
}

func (n *EdgeNode) processEvent(ev Event) {
	n.log.WithFields(logrus.Fields{
		"type":   ev.Type,
		"source": ev.Source,
	}).Debug("Processing event")

	switch ev.Type {
	case "attendance.new":
		n.handleAttendanceEvent(ev)
	case "device.status":
		n.handleDeviceStatusEvent(ev)
	case "sync.trigger":
		n.handleSyncEvent(ev)
	}
}

func (n *EdgeNode) handleAttendanceEvent(ev Event) {
	n.mu.Lock()
	n.stats.SyncAttempts++
	n.mu.Unlock()

	if !n.cb.Allow() {
		n.log.Warn("Circuit breaker open, queuing attendance")
		return
	}

	if err := n.syncToCloud(ev); err != nil {
		n.cb.Failure()
		n.mu.Lock()
		n.stats.SyncFailures++
		n.mu.Unlock()
		n.log.WithError(err).Error("Failed to sync attendance")
	}
}

func (n *EdgeNode) handleDeviceStatusEvent(ev Event) {
	n.log.WithField("event", ev).Debug("Device status changed")
}

func (n *EdgeNode) handleSyncEvent(ev Event) {
	n.log.Info("Sync triggered")
	n.flushLocalBuffer()
}

func (n *EdgeNode) syncToCloud(ev Event) error {
	// Will be connected to the cloud sync module
	return nil
}

func (n *EdgeNode) flushLocalBuffer() {
	records, err := n.store.GetUnsyncedAttendance(100)
	if err != nil {
		n.log.WithError(err).Error("Failed to get unsynced records")
		return
	}

	if len(records) == 0 {
		return
	}

	n.log.WithField("count", len(records)).Info("Flushing local buffer")
}

func (n *EdgeNode) healthCheck() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			n.updateHealth()
		case <-n.doneCh:
			return
		}
	}
}

func (n *EdgeNode) updateHealth() {
	n.mu.Lock()
	defer n.mu.Unlock()

	n.stats.UptimeSeconds = int64(time.Since(n.startTime).Seconds())

	if qSize, err := n.store.GetQueueSize(); err == nil {
		n.stats.QueueSize = qSize
	}
	if dlCount, err := n.store.GetDeadLetterCount(); err == nil {
		n.stats.DeadLetterCount = dlCount
	}
	if uCount, err := n.store.GetUnsyncedCount(); err == nil {
		n.stats.RecordsStored = uCount
	}
}

func (n *EdgeNode) cacheWarmup() {
	n.log.Info("Starting cache warmup")
	time.Sleep(5 * time.Second)
	n.log.Info("Cache warmup complete")
}

func (n *EdgeNode) TriggerSync() {
	n.emitEvent(Event{
		Type:      "sync.trigger",
		Source:    "cloud",
		Payload:   nil,
		Timestamp: time.Now(),
	})
}

func (n *EdgeNode) emitEvent(event Event) {
	select {
	case n.eventCh <- event:
	default:
		n.log.Warn("Event channel full, dropping event")
	}
}

func (n *EdgeNode) RecordSyncResult(success bool) {
	n.mu.Lock()
	defer n.mu.Unlock()
	n.stats.SyncAttempts++
	if !success {
		n.stats.SyncFailures++
	}
}

func (n *EdgeNode) GetState() NodeState {
	n.mu.RLock()
	defer n.mu.RUnlock()
	return n.state
}

func (n *EdgeNode) GetStats() NodeStats {
	n.mu.RLock()
	defer n.mu.RUnlock()
	return n.stats
}

func (n *EdgeNode) EmitAttendance(records []store.AttendanceRecord) error {
	if err := n.store.SaveAttendance(records); err != nil {
		return fmt.Errorf("failed to save attendance: %w", err)
	}

	n.emitEvent(Event{
		Type:      "attendance.new",
		Source:    "zkteco",
		Payload:   records,
		Timestamp: time.Now(),
	})

	return nil
}

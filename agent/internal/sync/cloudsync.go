package sync

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/sirupsen/logrus"
	"github.com/sistema/agent/internal/config"
	"github.com/sistema/agent/internal/device"
	"github.com/sistema/agent/internal/edge"
	"github.com/sistema/agent/pkg/queue"
)

type CloudSync struct {
	cfg        *config.Config
	log        *logrus.Logger
	deviceMgr  *device.Manager
	edgeNode   *edge.EdgeNode
	client     *http.Client
	mqttClient mqtt.Client
	queue      *queue.OfflineQueue
	doneCh     chan struct{}
}

func NewCloudSync(cfg *config.Config, log *logrus.Logger, deviceMgr *device.Manager) *CloudSync {
	s := &CloudSync{
		cfg:       cfg,
		log:       log,
		deviceMgr: deviceMgr,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
		queue:  queue.NewOfflineQueue(cfg.Agent.DataDir),
		doneCh: make(chan struct{}),
	}

	s.connectMQTT()
	return s
}

func (s *CloudSync) SetEdgeNode(n *edge.EdgeNode) {
	s.edgeNode = n
}

func (s *CloudSync) connectMQTT() {
	opts := mqtt.NewClientOptions().
		AddBroker(s.cfg.Cloud.MQTTBroker).
		SetClientID(fmt.Sprintf("agent-%s", s.cfg.Agent.DeviceID)).
		SetUsername(s.cfg.Agent.DeviceID).
		SetPassword(s.cfg.Cloud.AuthToken).
		SetAutoReconnect(true).
		SetMaxReconnectInterval(10*time.Second).
		SetOnConnectHandler(s.onMQTTConnect).
		SetConnectionLostHandler(s.onMQTTDisconnect)

	s.mqttClient = mqtt.NewClient(opts)
	if token := s.mqttClient.Connect(); token.Wait() && token.Error() != nil {
		s.log.WithError(token.Error()).Warn("MQTT connection failed, will retry")
	}
}

func (s *CloudSync) onMQTTConnect(client mqtt.Client) {
	s.log.Info("Connected to MQTT broker")

	// Subscribe to commands from cloud
	topic := fmt.Sprintf("agent/%s/commands", s.cfg.Agent.DeviceID)
	if token := client.Subscribe(topic, 1, s.handleCommand); token.Wait() && token.Error() != nil {
		s.log.WithError(token.Error()).Error("Failed to subscribe to commands")
	} else {
		s.log.WithField("topic", topic).Info("Subscribed to commands")
	}

	s.reportStatus()
}

func (s *CloudSync) onMQTTDisconnect(client mqtt.Client, err error) {
	s.log.WithError(err).Warn("Disconnected from MQTT broker")
}

func (s *CloudSync) handleCommand(client mqtt.Client, msg mqtt.Message) {
	s.log.WithField("payload", string(msg.Payload())).Info("Command received from cloud")

	var cmd struct {
		Action    string          `json:"action"`
		Timestamp time.Time       `json:"timestamp"`
		Data      json.RawMessage `json:"data,omitempty"`
	}

	if err := json.Unmarshal(msg.Payload(), &cmd); err != nil {
		s.log.WithError(err).Error("Failed to parse command")
		return
	}

	switch cmd.Action {
	case "sync:attendance":
		s.log.Info("Cloud requested attendance sync")
		if s.edgeNode != nil {
			s.edgeNode.TriggerSync()
		}
	case "sync:users":
		s.log.Info("Cloud requested user sync")
	case "restart":
		s.log.Warn("Cloud requested agent restart - not implemented")
	case "update:config":
		s.log.WithField("data", string(cmd.Data)).Info("Config update received")
	case "ping":
		s.reportStatus()
	default:
		s.log.WithField("action", cmd.Action).Warn("Unknown command")
	}
}

func (s *CloudSync) reportStatus() {
	devices := s.deviceMgr.GetDevices()
	status := map[string]interface{}{
		"device_id":  s.cfg.Agent.DeviceID,
		"online":     true,
		"devices":    devices,
		"ip":         s.getOutboundIP(),
		"version":    "1.0.0",
		"timestamp":  time.Now().UTC(),
	}

	if s.edgeNode != nil {
		stats := s.edgeNode.GetStats()
		status["state"] = s.edgeNode.GetState()
		status["uptime_seconds"] = stats.UptimeSeconds
		status["queue_size"] = stats.QueueSize
		status["dead_letter_count"] = stats.DeadLetterCount
		status["records_stored"] = stats.RecordsStored
		status["sync_attempts"] = stats.SyncAttempts
		status["sync_failures"] = stats.SyncFailures
		status["memory_usage_mb"] = stats.MemoryUsageMB
		status["devices_found"] = stats.DevicesFound
	}

	data, _ := json.Marshal(status)
	topic := fmt.Sprintf("agent/%s/status", s.cfg.Agent.DeviceID)
	s.mqttClient.Publish(topic, 1, false, data)

	// Also send to HTTP heartbeat endpoint
	go s.sendHeartbeatHTTP(data)
}

func (s *CloudSync) sendHeartbeatHTTP(data []byte) {
	req, err := http.NewRequest("POST",
		s.cfg.Cloud.APIURL+"/edge/heartbeat",
		bytes.NewReader(data))
	if err != nil {
		return
	}
	req.Header.Set("Authorization", "Bearer "+s.cfg.Cloud.AuthToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		s.log.WithError(err).Debug("Heartbeat HTTP failed (offline?)")
		return
	}
	resp.Body.Close()
}

func (s *CloudSync) getOutboundIP() string {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return "unknown"
	}
	defer conn.Close()
	return conn.LocalAddr().(*net.UDPAddr).IP.String()
}

func (s *CloudSync) StartHeartbeat(interval time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		for {
			select {
			case <-ticker.C:
				s.reportStatus()
			case <-s.doneCh:
				ticker.Stop()
				return
			}
		}
	}()
}

func (s *CloudSync) SyncAttendance(records []AttendanceRecord) error {
	body, err := json.Marshal(records)
	if err != nil {
		return fmt.Errorf("failed to marshal records: %w", err)
	}

	req, err := http.NewRequest("POST",
		s.cfg.Cloud.APIURL+"/attendance/sync",
		bytes.NewReader(body))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+s.cfg.Cloud.AuthToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		if s.cfg.Cloud.OfflineQueue {
			return s.queue.Enqueue(body)
		}
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("sync failed with status %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Synced int `json:"synced"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err == nil {
		s.log.WithField("synced", result.Synced).Info("Attendance synced")
	}

	return nil
}

type AttendanceRecord struct {
	UUID      string    `json:"uuid"`
	UserID    string    `json:"user_id"`
	DeviceID  string    `json:"device_id"`
	Timestamp time.Time `json:"timestamp"`
	Status    int       `json:"status"`
	SyncedAt  time.Time `json:"synced_at"`
}

func (s *CloudSync) SyncUsers(users []UserRecord) error {
	body, err := json.Marshal(users)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST",
		s.cfg.Cloud.APIURL+"/users/sync",
		bytes.NewReader(body))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+s.cfg.Cloud.AuthToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	return nil
}

type UserRecord struct {
	UserID    string `json:"user_id"`
	Name      string `json:"name"`
	Card      string `json:"card_number"`
	Privilege int    `json:"privilege"`
}

func (s *CloudSync) FlushOfflineQueue() error {
	return s.queue.Flush(func(data []byte) error {
		req, err := http.NewRequest("POST",
			s.cfg.Cloud.APIURL+"/attendance/sync",
			bytes.NewReader(data))
		if err != nil {
			return err
		}
		req.Header.Set("Authorization", "Bearer "+s.cfg.Cloud.AuthToken)
		req.Header.Set("Content-Type", "application/json")

		resp, err := s.client.Do(req)
		if err != nil {
			return err
		}
		defer resp.Body.Close()
		return nil
	})
}

func (s *CloudSync) StartPeriodicSync(interval time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		for range ticker.C {
			if s.queue.HasPending() {
				if err := s.FlushOfflineQueue(); err != nil {
					s.log.WithError(err).Error("Failed to flush offline queue")
				}
			}
		}
	}()
}

func (s *CloudSync) Stop() {
	close(s.doneCh)
}

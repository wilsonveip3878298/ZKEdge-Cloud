package service

import (
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/sistema/agent/internal/config"
	"github.com/sistema/agent/internal/device"
	"github.com/sistema/agent/internal/edge"
	"github.com/sistema/agent/internal/sync"
	"github.com/sistema/agent/internal/zkteco"
	"golang.org/x/sys/windows/svc"
)

type WindowsService struct {
	cfg       *config.Config
	log       *logrus.Logger
	deviceMgr *device.Manager
	zk        *zkteco.Client
	syncer    *sync.CloudSync
	edgeNode  *edge.EdgeNode
	stopCh    chan struct{}
}

func NewWindowsService(
	cfg *config.Config,
	log *logrus.Logger,
	deviceMgr *device.Manager,
	zk *zkteco.Client,
	syncer *sync.CloudSync,
	edgeNode *edge.EdgeNode,
) *WindowsService {
	return &WindowsService{
		cfg:       cfg,
		log:       log,
		deviceMgr: deviceMgr,
		zk:        zk,
		syncer:    syncer,
		edgeNode:  edgeNode,
		stopCh:    make(chan struct{}),
	}
}

func (s *WindowsService) Run() error {
	isWindowsSvc, err := svc.IsWindowsService()
	if err != nil {
		return fmt.Errorf("failed to check if running as service: %w", err)
	}

	if isWindowsSvc {
		return svc.Run("SistemaAgent", s)
	}

	s.log.Info("Running in console mode")
	return s.runConsole()
}

func (s *WindowsService) Execute(args []string, requests <-chan svc.ChangeRequest, changes chan<- svc.Status) (bool, uint32) {
	changes <- svc.Status{State: svc.Running, Accepts: svc.AcceptStop | svc.AcceptShutdown}

	go s.runConsole()

	for req := range requests {
		switch req.Cmd {
		case svc.Stop, svc.Shutdown:
			changes <- svc.Status{State: svc.StopPending}
			s.Stop()
			return false, 0
		}
	}

	return false, 0
}

func (s *WindowsService) runConsole() error {
	s.log.Info("Starting Sistema Agent")

	s.syncer.SetEdgeNode(s.edgeNode)
	s.syncer.StartPeriodicSync(time.Duration(s.cfg.Cloud.SyncInterval) * time.Second)
	s.syncer.StartHeartbeat(30 * time.Second)

	devices, err := s.deviceMgr.Discover()
	if err != nil {
		s.log.WithError(err).Warn("Device discovery failed")
	}
	s.log.WithField("count", len(devices)).Info("Devices discovered")

	pollTicker := time.NewTicker(time.Duration(s.cfg.Agent.PollInterval) * time.Second)
	defer pollTicker.Stop()

	s.log.Info("Agent started successfully")

	for {
		select {
		case <-pollTicker.C:
			s.pollDevices()
		case <-s.stopCh:
			s.log.Info("Agent stopping...")
			return nil
		}
	}
}

func (s *WindowsService) pollDevices() {
	devices := s.deviceMgr.GetDevices()
	for _, d := range devices {
		ip := d.Identity.IP
		if err := s.zk.Connect(ip); err != nil {
			s.log.WithField("ip", ip).Debug("Device offline")
			continue
		}

		records, err := s.zk.GetAttendanceRecords(time.Now().Add(-24 * time.Hour))
		if err != nil {
			s.log.WithField("ip", ip).WithError(err).Error("Failed to get attendance")
			s.zk.Disconnect()
			continue
		}

		if len(records) > 0 {
			syncRecords := make([]sync.AttendanceRecord, len(records))
			for i, r := range records {
				syncRecords[i] = sync.AttendanceRecord{
					UUID:      r.UUID,
					UserID:    r.UserID,
					DeviceID:  r.DeviceID,
					Timestamp: r.Timestamp,
					Status:    r.Status,
					SyncedAt:  time.Now().UTC(),
				}
			}

			if err := s.syncer.SyncAttendance(syncRecords); err != nil {
				s.log.WithError(err).Error("Failed to sync attendance")
				if s.edgeNode != nil {
					s.edgeNode.RecordSyncResult(false)
				}
			} else {
				if s.edgeNode != nil {
					s.edgeNode.RecordSyncResult(true)
				}
			}
		}

		s.zk.Disconnect()
	}
}

func (s *WindowsService) Stop() {
	close(s.stopCh)
	if s.syncer != nil {
		s.syncer.Stop()
	}
}

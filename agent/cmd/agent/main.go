package main

import (
	"os"
	"os/signal"
	"syscall"

	"github.com/sirupsen/logrus"
	"github.com/sistema/agent/internal/config"
	"github.com/sistema/agent/internal/device"
	"github.com/sistema/agent/internal/edge"
	"github.com/sistema/agent/internal/health"
	"github.com/sistema/agent/internal/service"
	"github.com/sistema/agent/internal/store"
	"github.com/sistema/agent/internal/sync"
	"github.com/sistema/agent/internal/update"
	"github.com/sistema/agent/internal/zkteco"
)

const AgentVersion = "1.0.0"

func main() {
	log := logrus.New()
	log.SetFormatter(&logrus.JSONFormatter{})
	log.SetOutput(os.Stdout)
	log.SetLevel(logrus.InfoLevel)

	cfg, err := config.Load("config.yaml")
	if err != nil {
		log.WithError(err).Warn("Using default config")
		cfg = config.DefaultConfig()
	}

	if cfg.Agent.LogLevel == "debug" {
		log.SetLevel(logrus.DebugLevel)
	}

	// Initialize local SQLite store (Edge persistence)
	sqlite, err := store.NewSQLiteStore(cfg.Agent.DataDir, log)
	if err != nil {
		log.WithError(err).Fatal("Failed to initialize SQLite store")
	}
	defer sqlite.Close()

	deviceMgr := device.NewManager(cfg, log)
	zk := zkteco.NewClient(cfg, log)
	syncer := sync.NewCloudSync(cfg, log, deviceMgr)

	// Initialize Edge Node
	edgeNode := edge.NewEdgeNode(cfg, log, sqlite, zk)
	edgeNode.Start()
	defer edgeNode.Stop()

	// Initialize Health Monitor with Local Web Dashboard
	monitor := health.NewMonitor(sqlite, edgeNode, deviceMgr, zk, syncer, cfg, log, AgentVersion)
	go func() {
		if err := monitor.ServeHTTP(":8081"); err != nil {
			log.WithError(err).Warn("Health monitor stopped")
		}
	}()

	// Initialize Auto-Update checker
	updater := update.NewUpdateChecker(AgentVersion, cfg.Cloud.APIURL, log)
	updater.Start()

	// Windows Service
	svc := service.NewWindowsService(cfg, log, deviceMgr, zk, syncer, edgeNode)

	go func() {
		if err := svc.Run(); err != nil {
			log.WithError(err).Fatal("Service error")
		}
	}()

	log.WithFields(logrus.Fields{
		"version": AgentVersion,
		"data_dir": cfg.Agent.DataDir,
	}).Info("Sistema Edge Agent started")

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("Shutting down agent...")
	svc.Stop()
}

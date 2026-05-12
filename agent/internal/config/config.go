package config

import (
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Agent   AgentConfig   `yaml:"agent"`
	Cloud   CloudConfig   `yaml:"cloud"`
	ZKTeco  ZKTecoConfig  `yaml:"zkteco"`
}

type AgentConfig struct {
	DeviceID      string `yaml:"device_id"`
	PollInterval  int    `yaml:"poll_interval"`
	LogLevel      string `yaml:"log_level"`
	DataDir       string `yaml:"data_dir"`
}

type CloudConfig struct {
	APIURL        string `yaml:"api_url"`
	MQTTBroker    string `yaml:"mqtt_broker"`
	AuthToken     string `yaml:"auth_token"`
	SyncInterval  int    `yaml:"sync_interval"`
	OfflineQueue  bool   `yaml:"offline_queue"`
}

type ZKTecoConfig struct {
	TCPPort    int    `yaml:"tcp_port"`
	Timeout    int    `yaml:"timeout"`
	RetryCount int    `yaml:"retry_count"`
}

func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}

func DefaultConfig() *Config {
	return &Config{
		Agent: AgentConfig{
			PollInterval: 5,
			LogLevel:     "info",
			DataDir:      "C:\\ProgramData\\SistemaAgent",
		},
		Cloud: CloudConfig{
			MQTTBroker:   "tls://cloud.sistema.local:8883",
			SyncInterval: 30,
			OfflineQueue: true,
		},
		ZKTeco: ZKTecoConfig{
			TCPPort:    4370,
			Timeout:    10,
			RetryCount: 3,
		},
	}
}

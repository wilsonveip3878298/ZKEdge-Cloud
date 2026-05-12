package device

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/sistema/agent/internal/config"
)

type DeviceState string

const (
	StatePending      DeviceState = "pending"
	StateProvisioning DeviceState = "provisioning"
	StateActive       DeviceState = "active"
	StateOffline      DeviceState = "offline"
	StateMaintenance  DeviceState = "maintenance"
	StateReplaced     DeviceState = "replaced"
	StateBlocked      DeviceState = "blocked"
)

type DeviceIdentity struct {
	Serial     string `json:"serial"`
	MAC        string `json:"mac"`
	Model      string `json:"model"`
	Firmware   string `json:"firmware"`
	IP         string `json:"ip"`
	Port       int    `json:"port"`
}

type DeviceInfo struct {
	Identity   DeviceIdentity `json:"identity"`
	State      DeviceState    `json:"state"`
	Online     bool           `json:"online"`
	LastSeen   time.Time      `json:"last_seen"`
	LastSync   time.Time      `json:"last_sync"`
	Cursor     string         `json:"cursor"`
	CommKey    string         `json:"-"`
	BranchID   string         `json:"branch_id"`
	EdgeID     string         `json:"edge_id"`
	Version    int            `json:"version"`
}

type Manager struct {
	cfg       *config.Config
	log       *logrus.Logger
	devices   map[string]*DeviceInfo
	mu        sync.RWMutex
	secretKey []byte
}

func NewManager(cfg *config.Config, log *logrus.Logger) *Manager {
	return &Manager{
		cfg:       cfg,
		log:       log,
		devices:   make(map[string]*DeviceInfo),
		secretKey: []byte("0123456789abcdef0123456789abcdef"),
	}
}

func (m *Manager) Discover() ([]DeviceInfo, error) {
	m.log.Info("Discovering ZKTeco devices on LAN")
	found := make([]DeviceInfo, 0)
	interfaces, err := net.Interfaces()
	if err != nil {
		return nil, err
	}

	for _, iface := range interfaces {
		if iface.Flags&net.FlagLoopback != 0 || iface.Flags&net.FlagUp == 0 {
			continue
		}
		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}
		for _, addr := range addrs {
			ipnet, ok := addr.(*net.IPNet)
			if !ok || ipnet.IP.To4() == nil {
				continue
			}
			m.scanNetwork(ipnet, iface.HardwareAddr.String(), &found)
		}
	}

	m.mu.Lock()
	for _, d := range found {
		existing, exists := m.devices[d.Identity.Serial]
		if exists {
			d.State = existing.State
			d.BranchID = existing.BranchID
			d.EdgeID = existing.EdgeID
			d.Cursor = existing.Cursor
		} else {
			d.State = StateActive
		}
		m.devices[d.Identity.Serial] = &d
	}
	m.mu.Unlock()

	return found, nil
}

func (m *Manager) scanNetwork(ipnet *net.IPNet, mac string, found *[]DeviceInfo) {
	baseIP := ipnet.IP.To4()
	mask := ipnet.Mask
	network := baseIP.Mask(mask)
	ones, bits := mask.Size()
	hosts := (1 << uint(bits-ones)) - 2

	for i := 1; i <= hosts && i <= 254; i++ {
		ip := make(net.IP, 4)
		copy(ip, network)
		ip[3] = network[3] + byte(i)
		if ip.Equal(ipnet.IP) {
			continue
		}
		go m.probeDevice(ip.String(), mac, found)
	}
}

func (m *Manager) probeDevice(ip string, mac string, found *[]DeviceInfo) {
	conn, err := net.DialTimeout("tcp", ip+":4370", 2*time.Second)
	if err != nil {
		return
	}
	defer conn.Close()

	info := DeviceInfo{
		Identity: DeviceIdentity{
			IP:    ip,
			Port:  4370,
			MAC:   mac,
			Model: "ZKTeco",
		},
		Online:   true,
		LastSeen: time.Now(),
		State:    StatePending,
	}
	info.Identity.Serial = fmt.Sprintf("ZK-%s", hex.EncodeToString([]byte(ip))[:8])

	m.mu.Lock()
	if existing, ok := m.devices[info.Identity.Serial]; ok {
		info.State = existing.State
		info.Identity.Model = existing.Identity.Model
		info.Identity.Firmware = existing.Identity.Firmware
		info.Cursor = existing.Cursor
	} else {
		m.devices[info.Identity.Serial] = &info
	}
	m.mu.Unlock()

	*found = append(*found, info)
	m.log.WithFields(logrus.Fields{"ip": ip, "serial": info.Identity.Serial}).Info("Device discovered")
}

func (m *Manager) EncryptCommKey(plaintext string) (string, error) {
	block, err := aes.NewCipher(m.secretKey)
	if err != nil {
		return "", err
	}
	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonce := make([]byte, aesGCM.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}
	ciphertext := aesGCM.Seal(nonce, nonce, []byte(plaintext), nil)
	return hex.EncodeToString(ciphertext), nil
}

func (m *Manager) DecryptCommKey(encoded string) (string, error) {
	ciphertext, err := hex.DecodeString(encoded)
	if err != nil {
		return "", err
	}
	block, err := aes.NewCipher(m.secretKey)
	if err != nil {
		return "", err
	}
	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonceSize := aesGCM.NonceSize()
	if len(ciphertext) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}
	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	plaintext, err := aesGCM.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}
	return string(plaintext), nil
}

func (m *Manager) SetCommKey(serial, commKey string) error {
	encrypted, err := m.EncryptCommKey(commKey)
	if err != nil {
		return err
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	if d, ok := m.devices[serial]; ok {
		d.CommKey = encrypted
	}
	return nil
}

func (m *Manager) SetCursor(serial, cursor string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if d, ok := m.devices[serial]; ok {
		d.Cursor = cursor
		d.LastSync = time.Now()
	}
}

func (m *Manager) GetCursor(serial string) string {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if d, ok := m.devices[serial]; ok {
		return d.Cursor
	}
	return ""
}

func (m *Manager) SetState(serial string, state DeviceState) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if d, ok := m.devices[serial]; ok {
		d.State = state
	}
}

func (m *Manager) SetProvisioned(serial, model, firmware string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if d, ok := m.devices[serial]; ok {
		d.Identity.Model = model
		d.Identity.Firmware = firmware
		d.State = StateActive
		d.Online = true
		d.Version++
	}
}

func (m *Manager) GetDevices() []DeviceInfo {
	m.mu.RLock()
	defer m.mu.RUnlock()
	devices := make([]DeviceInfo, 0, len(m.devices))
	for _, d := range m.devices {
		devices = append(devices, *d)
	}
	return devices
}

func (m *Manager) GetDevice(serial string) *DeviceInfo {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if d, ok := m.devices[serial]; ok {
		return d
	}
	return nil
}

func (m *Manager) UpdateOnlineStatus(serial string, online bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if d, ok := m.devices[serial]; ok {
		d.Online = online
		d.LastSeen = time.Now()
		if !online && d.State == StateActive {
			d.State = StateOffline
		}
		if online && d.State == StateOffline {
			d.State = StateActive
		}
	}
}

func (m *Manager) GetDevicesJSON() string {
	m.mu.RLock()
	defer m.mu.RUnlock()
	data, _ := json.Marshal(m.devices)
	return string(data)
}

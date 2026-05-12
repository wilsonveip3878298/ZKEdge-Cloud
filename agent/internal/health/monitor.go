package health

import (
	"encoding/json"
	"fmt"
	"net/http"
	"runtime"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/sistema/agent/internal/config"
	"github.com/sistema/agent/internal/device"
	"github.com/sistema/agent/internal/edge"
	cloudsync "github.com/sistema/agent/internal/sync"
	"github.com/sistema/agent/internal/store"
	"github.com/sistema/agent/internal/zkteco"
)

const dashboardHTML = `<!DOCTYPE html><html lang="es"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Edge Agent</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>.st{background:#1f2937;border-radius:8px;padding:12px}</style>
</head>
<body class="bg-gray-900 text-gray-100">
<div class="max-w-6xl mx-auto p-4">
<div class="flex items-center justify-between mb-4">
<div><h1 class="text-xl font-bold text-indigo-400">Edge Agent</h1><p class="text-xs text-gray-400" id="agentInfo">Conectando...</p></div>
<div class="flex gap-2 flex-wrap">
<button onclick="scanDevices()" class="px-2 py-1 bg-indigo-600 rounded text-xs hover:bg-indigo-700">Escanear</button>
<button onclick="syncNow()" class="px-2 py-1 bg-green-700 rounded text-xs hover:bg-green-800">Sincronizar</button>
<button onclick="retryDLQ()" class="px-2 py-1 bg-yellow-700 rounded text-xs hover:bg-yellow-800">Reintentar</button>
<button onclick="restartAgent()" class="px-2 py-1 bg-red-700 rounded text-xs hover:bg-red-800">Reiniciar</button>
</div></div>

<div class="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4 text-center">
<div class="st"><p class="text-xs text-gray-400">Dispositivos</p><p class="text-xl font-bold" id="deviceCount">-</p></div>
<div class="st"><p class="text-xs text-gray-400">Cola</p><p class="text-xl font-bold" id="queueSize">-</p></div>
<div class="st"><p class="text-xs text-gray-400">DLQ</p><p class="text-xl font-bold text-red-400" id="dlqCount">-</p></div>
<div class="st"><p class="text-xs text-gray-400">MQTT</p><p class="text-xl font-bold" id="mqttStatus">-</p></div>
<div class="st"><p class="text-xs text-gray-400">Uptime</p><p class="text-xl font-bold text-green-400" id="uptime">-</p></div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
<div class="lg:col-span-2 st">
<h2 class="text-xs font-semibold mb-2">Dispositivos (serial-based)</h2>
<div id="deviceList" class="space-y-1 text-xs max-h-64 overflow-y-auto"><p class="text-gray-500">Escanea la red...</p></div>
</div>
<div class="st">
<h2 class="text-xs font-semibold mb-2">CommKey / Puerto</h2>
<div class="space-y-1">
<input id="cfgSerial" placeholder="Serial" class="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white">
<input id="cfgIp" placeholder="192.168.1.100" class="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white">
<input id="cfgPort" value="4370" class="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white">
<input id="cfgCommKey" placeholder="CommKey" class="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white">
<button onclick="testConnection()" class="w-full px-2 py-1 bg-gray-600 rounded text-xs hover:bg-gray-500">Test</button>
<button onclick="setCommKey()" class="w-full px-2 py-1 bg-blue-700 rounded text-xs hover:bg-blue-800 mt-1">Guardar</button>
<div id="testResult" class="text-xs"></div>
</div></div></div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
<div class="st">
<h2 class="text-xs font-semibold mb-2">Importacion Manual</h2>
<div class="flex gap-2 flex-wrap">
<button onclick="syncNow()" class="px-2 py-1 bg-green-700 rounded text-xs">Sincronizar ahora</button>
<button onclick="resetCursor()" class="px-2 py-1 bg-orange-700 rounded text-xs">Reset cursor</button>
<button onclick="retryDLQ()" class="px-2 py-1 bg-yellow-700 rounded text-xs">Reintentar fallidos</button>
<button onclick="reimportRange()" class="px-2 py-1 bg-purple-700 rounded text-xs">Reimportar 7d</button>
</div>
<div id="syncResult" class="text-xs mt-2 text-gray-400"></div>
</div>
<div class="st">
<h2 class="text-xs font-semibold mb-2">Resumen Dispositivos</h2>
<div id="deviceSummary" class="text-xs text-gray-400"><p>Selecciona un dispositivo...</p></div>
</div></div>

<div class="st"><h2 class="text-xs font-semibold mb-2">Logs</h2>
<pre id="logOutput" class="text-xs text-gray-400 font-mono h-32 overflow-y-auto bg-gray-950 rounded p-2">Esperando...</pre>
</div></div>

<script>
const API="/api";
async function f(u,o){const r=await fetch(u,o);return r.json()}
async function ls(){try{const h=await f(API+"/health");document.getElementById("deviceCount").textContent=h.devices_found??"-";document.getElementById("queueSize").textContent=h.store?.queue_size??"-";document.getElementById("dlqCount").textContent=h.store?.dead_letter_count??"-";document.getElementById("mqttStatus").textContent=h.mqtt??"-";document.getElementById("uptime").textContent=h.uptime??"-";if(h.device_id)document.getElementById("agentInfo").textContent=h.device_id+" v"+(h.version||"-")+" | "+(h.node_state||"")}catch{document.getElementById("agentInfo").textContent="Sin conexion"}}
async function ld(){try{const d=await f(API+"/devices");const el=document.getElementById("deviceList");const ds=document.getElementById("deviceSummary");if(!d.devices||d.devices.length===0){el.innerHTML='<p class="text-gray-500">Sin dispositivos</p>';return}
let html='',total=0,onl=0;d.devices.forEach(function(dev){var s=dev.Identity||dev;var ip=s.ip||dev.ip||'?';var serial=s.serial||dev.Serial||dev.serial||ip;var state=dev.State||'active';var on=dev.Online||dev.online||false;if(on)onl++;total++
html+='<div class="flex justify-between items-center bg-gray-700/50 rounded px-2 py-1 cursor-pointer hover:bg-gray-600" onclick="showDevice(\''+serial+'\',\''+ip+'\')"><div><span class="font-medium">'+serial+'</span><span class="text-gray-400 ml-1">'+ip+'</span></div><span class="px-1.5 py-0.5 rounded-full '+(on?'bg-green-700':'bg-gray-600')+'" style="font-size:9px">'+state+'</span></div>'});el.innerHTML=html
ds.innerHTML='<p>Total: '+total+' | Online: '+onl+' | Offline: '+(total-onl)+'</p>'}catch{document.getElementById("deviceList").innerHTML='<p class="text-red-400">Error</p>'}}
async function ll(){try{const r=await fetch(API+"/logs");document.getElementById("logOutput").textContent=await r.text()}catch{}}
function showDevice(serial,ip){document.getElementById("cfgSerial").value=serial;document.getElementById("cfgIp").value=ip;document.getElementById("testResult").textContent='Serial: '+serial}
async function scanDevices(){const btn=event.target;btn.disabled=true;btn.textContent="Escaneando...";await f(API+"/scan",{method:"POST"});setTimeout(()=>{btn.disabled=false;btn.textContent="Escanear";ld()},2000)}
async function testConnection(){const ip=document.getElementById("cfgIp").value;const port=document.getElementById("cfgPort").value||"4370";const r=document.getElementById("testResult");if(!ip){r.textContent="IP requerida";return}r.textContent="Probando...";try{const d=await f(API+"/test-connection",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ip,port:parseInt(port)})});r.innerHTML=d.success?'<span class="text-green-400">OK '+d.latency+'</span>':'<span class="text-red-400">Falló</span>'}catch{r.innerHTML='<span class="text-red-400">Error</span>'}}
async function setCommKey(){const serial=document.getElementById("cfgSerial").value;const key=document.getElementById("cfgCommKey").value;if(!serial||!key)return;await f(API+"/commkey",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({serial,commkey:key})});document.getElementById("testResult").textContent="CommKey guardado"}
async function syncNow(){const r=document.getElementById("syncResult");r.textContent="Sincronizando...";try{const d=await f(API+"/sync",{method:"POST"});r.textContent="OK: "+JSON.stringify(d)}catch{r.textContent="Error"}}
async function resetCursor(){if(!confirm("Reset cursor de todos los dispositivos?"))return;const r=document.getElementById("syncResult");r.textContent="Reseteando...";await f(API+"/reset-cursor",{method:"POST"});r.textContent="Cursor reseteado"}
async function retryDLQ(){const r=document.getElementById("syncResult");r.textContent="Reintentando...";const d=await f(API+"/retry-dlq",{method:"POST"});r.textContent="Reintentados: "+(d.retried||0)}
async function reimportRange(){const r=document.getElementById("syncResult");r.textContent="Reimportando ultimos 7 dias...";await f(API+"/reimport",{method:"POST"});r.textContent="Reimportacion iniciada"}
async function restartAgent(){if(!confirm("Reiniciar agente?"))return;await f(API+"/restart",{method:"POST"})}
setInterval(()=>{ls();ld();ll()},5000);ls();ld();ll()
</script></body></html>`

type Monitor struct {
	store     *store.SQLiteStore
	edgeNode  *edge.EdgeNode
	deviceMgr *device.Manager
	zkClient  *zkteco.Client
	syncer    *cloudsync.CloudSync
	cfg       *config.Config
	log       *logrus.Logger
	startTime time.Time
	version   string
	mu        sync.RWMutex
}

func NewMonitor(sqlite *store.SQLiteStore, edgeNode *edge.EdgeNode, deviceMgr *device.Manager, zkClient *zkteco.Client, syncer *cloudsync.CloudSync, cfg *config.Config, log *logrus.Logger, version string) *Monitor {
	return &Monitor{
		store:     sqlite,
		edgeNode:  edgeNode,
		deviceMgr: deviceMgr,
		zkClient:  zkClient,
		syncer:    syncer,
		cfg:       cfg,
		log:       log,
		startTime: time.Now(),
		version:   version,
	}
}

func (m *Monitor) ServeHTTP(addr string) error {
	mux := http.NewServeMux()
	mux.HandleFunc("/", m.handleRoot)
	mux.HandleFunc("/api/health", m.handleHealth)
	mux.HandleFunc("/api/devices", m.handleDevices)
	mux.HandleFunc("/api/scan", m.handleScan)
	mux.HandleFunc("/api/test-connection", m.handleTestConnection)
	mux.HandleFunc("/api/logs", m.handleLogs)
	mux.HandleFunc("/api/restart", m.handleRestart)
	mux.HandleFunc("/api/queue", m.handleQueue)
	mux.HandleFunc("/api/sync", m.handleSync)
	mux.HandleFunc("/api/reset-cursor", m.handleResetCursor)
	mux.HandleFunc("/api/retry-dlq", m.handleRetryDLQ)
	mux.HandleFunc("/api/reimport", m.handleReimport)
	mux.HandleFunc("/api/commkey", m.handleCommKey)

	m.log.Infof("Local dashboard: http://%s", addr)
	return http.ListenAndServe(addr, mux)
}

func (m *Monitor) handleRoot(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprint(w, dashboardHTML)
}

func (m *Monitor) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	qSize, _ := m.store.GetQueueSize()
	dlCount, _ := m.store.GetDeadLetterCount()
	uCount, _ := m.store.GetUnsyncedCount()
	stats := m.edgeNode.GetStats()
	state := m.edgeNode.GetState()
	var mem runtime.MemStats
	runtime.ReadMemStats(&mem)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "ok", "device_id": m.cfg.Agent.DeviceID, "version": m.version,
		"uptime": time.Since(m.startTime).Round(time.Second).String(),
		"node_state": state, "mqtt": "connected",
		"devices_found": stats.DevicesFound,
		"store": map[string]interface{}{"queue_size": qSize, "dead_letter_count": dlCount, "unsynced_count": uCount},
		"system": map[string]interface{}{"cpu_count": runtime.NumCPU(), "goroutines": runtime.NumGoroutine(), "memory_alloc_mb": fmt.Sprintf("%.1f", float64(mem.Alloc)/1024/1024)},
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

func (m *Monitor) handleDevices(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"devices": m.deviceMgr.GetDevices()})
}

func (m *Monitor) handleScan(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "POST required", 405); return
	}
	w.Header().Set("Content-Type", "application/json")
	go m.deviceMgr.Discover()
	json.NewEncoder(w).Encode(map[string]string{"status": "scanning"})
}

func (m *Monitor) handleTestConnection(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "POST required", 405); return
	}
	w.Header().Set("Content-Type", "application/json")
	var req struct{ IP string `json:"ip"`; Port int `json:"port"` }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "invalid request"}); return
	}
	if req.Port == 0 {
		req.Port = 4370
	}
	start := time.Now()
	if err := m.zkClient.Connect(req.IP); err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": err.Error(), "latency": time.Since(start).String()}); return
	}
	m.zkClient.Disconnect()
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "latency": time.Since(start).String()})
}

func (m *Monitor) handleLogs(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	fmt.Fprintf(w, "[%s] Edge Agent %s - %s\n", time.Now().Format(time.RFC3339), m.version, m.cfg.Agent.DeviceID)
	fmt.Fprintf(w, "  Uptime: %s | Estado: %s\n", time.Since(m.startTime).Round(time.Second), m.edgeNode.GetState())
	qSize, _ := m.store.GetQueueSize()
	dlCount, _ := m.store.GetDeadLetterCount()
	uCount, _ := m.store.GetUnsyncedCount()
	fmt.Fprintf(w, "  Cola: %d | DLQ: %d | Pendientes: %d\n", qSize, dlCount, uCount)
	for _, d := range m.deviceMgr.GetDevices() {
		fmt.Fprintf(w, "  Device: %s (online: %v)\n", d.Identity.IP, d.Online)
	}
}

func (m *Monitor) handleRestart(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "POST required", 405); return
	}
	w.Header().Set("Content-Type", "application/json")
	m.log.Warn("Restart from local dashboard")
	json.NewEncoder(w).Encode(map[string]string{"status": "restarting"})
	go func() { time.Sleep(500 * time.Millisecond); m.edgeNode.Stop(); m.edgeNode.Start() }()
}

func (m *Monitor) handleQueue(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	qSize, _ := m.store.GetQueueSize()
	dlCount, _ := m.store.GetDeadLetterCount()
	uCount, _ := m.store.GetUnsyncedCount()
	json.NewEncoder(w).Encode(map[string]interface{}{"queue_size": qSize, "dead_letter_count": dlCount, "unsynced_count": uCount})
}

func (m *Monitor) handleSync(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" { http.Error(w, "POST required", 405); return }
	w.Header().Set("Content-Type", "application/json")
	m.log.Info("Manual sync triggered from dashboard")
	qSize, _ := m.store.GetQueueSize()
	var synced int
	if qSize > 0 {
		for {
			item, err := m.store.Dequeue()
			if err != nil || item == nil {
				break
			}
			synced++
		}
	}
	go m.store.CleanupSyncedRecords(168)
	json.NewEncoder(w).Encode(map[string]interface{}{"status": "synced", "synced": synced})
}

func (m *Monitor) handleResetCursor(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" { http.Error(w, "POST required", 405); return }
	w.Header().Set("Content-Type", "application/json")
	for _, d := range m.deviceMgr.GetDevices() {
		m.store.ResetCursor(d.Identity.Serial)
	}
	m.log.Warn("All cursors reset by user")
	json.NewEncoder(w).Encode(map[string]string{"status": "cursors_reset"})
}

func (m *Monitor) handleRetryDLQ(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" { http.Error(w, "POST required", 405); return }
	w.Header().Set("Content-Type", "application/json")
	count, err := m.store.RetryDeadLetters()
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"error": err.Error()}); return
	}
	m.log.WithField("count", count).Info("Dead letters retried")
	json.NewEncoder(w).Encode(map[string]interface{}{"retried": count})
}

func (m *Monitor) handleReimport(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" { http.Error(w, "POST required", 405); return }
	w.Header().Set("Content-Type", "application/json")
	go func() {
		m.log.Info("Reimporting last 7 days")
		for _, d := range m.deviceMgr.GetDevices() {
			m.store.ResetCursor(d.Identity.Serial)
		}
	}()
	json.NewEncoder(w).Encode(map[string]string{"status": "reimport_started"})
}

func (m *Monitor) handleCommKey(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" { http.Error(w, "POST required", 405); return }
	w.Header().Set("Content-Type", "application/json")
	var req struct{ Serial, CommKey string `json:"serial" json:"commkey"` }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "invalid request"}); return
	}
	if err := m.deviceMgr.SetCommKey(req.Serial, req.CommKey); err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"error": err.Error()}); return
	}
	m.store.SaveCredentials(req.Serial, req.CommKey, "", 4370)
	json.NewEncoder(w).Encode(map[string]string{"status": "saved"})
}

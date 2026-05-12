# Edge Computing - Arquitectura Distribuida

## Visión General

Cada sucursal funciona como un **nodo edge autónomo** mediante el agente local instalado en Windows. El nodo edge opera independientemente del cloud y sincroniza cuando hay conectividad.

```
┌─────────────────────────────────────────────────────┐
│                   SUCURSAL (EDGE NODE)              │
│                                                      │
│  ┌──────────┐    ┌──────────────────────────────┐   │
│  │ ZKTeco   │◄──►│   Edge Agent (Golang)         │   │
│  │ Device 1 │TCP │                              │   │
│  └──────────┘    │  ┌────────────────────────┐  │   │
│  ┌──────────┐    │  │  SQLite Local Store    │  │   │
│  │ ZKTeco   │◄──►│  │  - Attendance Buffer   │  │   │
│  │ Device 2 │TCP │  │  - Sync Queue          │  │   │
│  └──────────┘    │  │  - Dead Letter Queue   │  │   │
│                  │  │  - Device Cache        │  │   │
│  ┌──────────┐    │  └────────────────────────┘  │   │
│  │ ZKTeco   │◄──►│                              │   │
│  │ Device 3 │TCP │  ┌────────────────────────┐  │   │
│  └──────────┘    │  │  Circuit Breaker       │  │   │
│                  │  │  Retry Policy          │  │   │
│                  │  │  Health Monitor :8080  │  │   │
│                  │  └────────────────────────┘  │   │
│                  └──────────┬───────────────────┘   │
│                             │ MQTT + HTTPS          │
│                             ▼                       │
│                      INTERNET (TLS)                 │
└─────────────────────────────┼───────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────┐
│                    CLOUD    │                       │
│                  ┌──────────▼──────────────┐        │
│                  │   Edge API Module       │        │
│                  │   - Node Management     │        │
│                  │   - Dead Letter View    │        │
│                  │   - Health Dashboard    │        │
│                  │   - Remote Commands     │        │
│                  └─────────────────────────┘        │
└─────────────────────────────────────────────────────┘
```

## Componentes Edge

### 1. SQLite Local Store (`agent/internal/store/`)
- Base de datos SQLite embebida (WAL mode)
- Tabla `attendance_records` - buffer de marcaciones
- Tabla `sync_queue` - cola de sincronización con reintentos
- Tabla `dead_letter_queue` - mensajes fallidos
- Tabla `device_cache` - caché de dispositivos ZKTeco
- Tabla `sync_state` - estado de sincronización por dispositivo

### 2. Retry Policy (`agent/internal/edge/retry.go`)
- **Exponential Backoff**: 1s → 2s → 4s → 8s → ... → 5min max
- **Jitter**: ±10% aleatorio para evitar tormentas de reintentos
- **Circuit Breaker**: 5 fallos consecutivos → open (30s reset)
- **Dead Letter**: después de `maxRetries` (5) intentos fallidos

### 3. Health Monitor (`agent/internal/health/`)
- Endpoint HTTP `:8080/health`
- Reporta: estado del nodo, tamaño de colas, uso de memoria
- Usado por el cloud para monitoreo remoto

### 4. Auto-Update (`agent/internal/update/`)
- Verifica actualizaciones cada 24h
- Descarga y reemplaza binario en caliente
- Reinicio automático del servicio

## Flujo Offline

```
1. Evento de marcación desde biométrico
2. Se almacena en SQLite (attendance_records)
3. Se encola en sync_queue para envío al cloud
4. Intento de envío al cloud:
   ├── Éxito → eliminar de sync_queue
   └── Falla → aplicar backoff, reintentar
       ├── Máximo reintentos → mover a dead_letter_queue
       └── Conexión recuperada → vaciar cola
```

## Dead Letter Queue (DLQ)

Los mensajes que exceden `maxRetries` se mueven a `dead_letter_queue`. Desde el cloud se puede:
- Visualizar mensajes fallidos con error
- Reintentar manualmente (re-encolar)
- Analizar patrones de error

## API REST (Backend)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/edge/nodes` | Listar nodos edge |
| GET | `/api/v1/edge/nodes/:id` | Detalle del nodo |
| GET | `/api/v1/edge/nodes/:id/health` | Health check |
| GET | `/api/v1/edge/dead-letter` | Listar DLQ |
| POST | `/api/v1/edge/dead-letter/:id/retry` | Reintentar DLQ |
| POST | `/api/v1/edge/nodes/:id/sync` | Forzar sincronización |
| POST | `/api/v1/edge/heartbeat` | Heartbeat del agente |
| GET | `/api/v1/edge/stats` | Estadísticas globales |

## Configuración del Agente

```yaml
agent:
  device_id: "AGENT-001"
  poll_interval: 5
  data_dir: "C:\\ProgramData\\SistemaAgent"

cloud:
  api_url: "https://cloud.sistema.local"
  mqtt_broker: "tls://cloud.sistema.local:8883"
  sync_interval: 30
  offline_queue: true

zkteco:
  tcp_port: 4370
  timeout: 10
  retry_count: 3
```

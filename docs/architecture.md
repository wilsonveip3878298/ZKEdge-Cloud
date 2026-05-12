# Arquitectura del Sistema

## Visión General

Arquitectura **Edge + Cloud SaaS** para gestión de dispositivos biométricos ZKTeco.

```
┌─────────────────────────────────────────────────────────┐
│                      SUCURSAL                           │
│  ┌──────────┐    ┌────────────┐    ┌────────────────┐  │
│  │ ZKTeco   │◄──►│Agente Local│◄──►│   Internet     │  │
│  │ Device   │TCP │  Golang    │MQTT│   (TLS)        │  │
│  └──────────┘    └────────────┘    └───────┬────────┘  │
│  ┌──────────┐                              │           │
│  │ ZKTeco   │◄──►TCP                       │           │
│  │ Device   │                              │           │
│  └──────────┘                              │           │
└────────────────────────────────────────────┼───────────┘
                                             │
┌────────────────────────────────────────────┼───────────┐
│                   CLOUD                    │           │
│  ┌─────────────────────────────────────────▼────────┐  │
│  │           Load Balancer (HAProxy/Nginx)          │  │
│  └──────────────┬──────────────────────┬────────────┘  │
│                 │                      │                │
│  ┌──────────────▼──────┐  ┌───────────▼──────────┐    │
│  │   Backend (NestJS)  │  │    WebSocket Server   │    │
│  │   API REST          │  │    Socket.IO          │    │
│  └──────────────┬──────┘  └───────────┬──────────┘    │
│                 │                      │                │
│  ┌──────────────▼──────────────────────▼──────────┐    │
│  │              PostgreSQL (Multi-tenant)         │    │
│  └────────────────────────────────────────────────┘    │
│                                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │  Redis (Cache + Pub/Sub + Session)             │    │
│  └────────────────────────────────────────────────┘    │
│                                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │  MQTT Broker (Mosquitto/EMQX)                  │    │
│  └────────────────────────────────────────────────┘    │
│                                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │  Frontend (Next.js) - Dashboard SaaS           │    │
│  └────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

## Stack Tecnológico

| Componente | Tecnología |
|------------|-----------|
| Agente Local | Golang 1.22 |
| Backend | NestJS + TypeScript |
| Base de Datos | PostgreSQL 16 |
| Cache/Queue | Redis 7 |
| Tiempo Real | Socket.IO + MQTT |
| Frontend | Next.js 14 + React + Tailwind |
| Proxy | Nginx / HAProxy |
| Contenedores | Docker + Docker Compose |
| Monitoreo | Prometheus + Grafana |

## Flujo de Comunicación

### Sincronización de Marcaciones
1. Agente descubre dispositivos ZKTeco en LAN
2. Polling periódico (cada N segundos)
3. Descarga incremental de marcaciones vía TCP
4. Encola si no hay conexión a Internet
5. Envía a Cloud vía HTTPS/MQTT
6. Backend procesa y almacena en PostgreSQL
7. WebSocket notifica al Frontend

### Gestión de Usuarios (Creación Remota)
1. Admin crea usuario en Dashboard Web
2. Backend envía comando vía MQTT al Agente
3. Agente escribe usuario en dispositivo ZKTeco vía TCP
4. Agente confirma operación
5. Backend actualiza estado

## Multiempresa (Multi-tenant)

- `companyId` en todas las tablas
- Aislamiento por fila (row-level security)
- Cada empresa tiene sus sucursales, dispositivos y empleados
- JWT contiene `companyId` para filtrar automáticamente

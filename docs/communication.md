# Comunicación con Dispositivos ZKTeco

## Protocolo TCP/IP

Los dispositivos ZKTeco usan un protocolo propietario sobre TCP (puerto 4370 por defecto).

### Comandos Principales

| Comando | Código | Descripción |
|---------|--------|-------------|
| CONNECT | 1000 | Conexión inicial |
| DISCONNECT | 1001 | Desconexión |
| ATT_LOG_RQ | 1500 | Solicitar registros de marcación |
| ATT_LOG_RSP | 1501 | Respuesta con registros |
| USERS_RQ | 2000 | Solicitar usuarios |
| USERS_RSP | 2001 | Respuesta con usuarios |
| USER_WRITE | 2002 | Escribir usuario |
| USER_DELETE | 2003 | Eliminar usuario |
| DEVICE_INFO | 1100 | Información del dispositivo |

### Formato de Paquete

```
┌────────┬────────┬──────────────┬────────────────┐
│ CMD    │ Length │ Checksum     │ Data           │
│ 2 bytes│ 2 bytes│ 4 bytes      │ Variable       │
└────────┴────────┴──────────────┴────────────────┘
```

## Comunicación Agente ↔ Cloud

### MQTT (Tiempo Real)

Topics:

```
agent/{device_id}/status     → Estado del agente (PUB)
agent/{device_id}/commands   → Comandos al agente (SUB)
agent/{device_id}/events     → Eventos en tiempo real (PUB)
company/{company_id}/notify  → Notificaciones a web (PUB)
```

### HTTPS (Sincronización Batch)

Endpoints:

```
POST /api/v1/attendance/sync   → Sincronizar marcaciones
POST /api/v1/users/sync        → Sincronizar usuarios
POST /api/v1/sync/status       → Reportar estado del agente
```

### Manejo Offline

1. Si no hay conexión Internet, el agente encola localmente
2. Cola persistente en disco (`data/queue/`)
3. Reintentos automáticos con backoff exponencial
4. Sincronización incremental al recuperar conexión
5. Compresión de datos para optimizar ancho de banda

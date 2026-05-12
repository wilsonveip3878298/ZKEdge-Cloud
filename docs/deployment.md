# Despliegue y DevOps

## Despliegue Local (Desarrollo)

```bash
# Iniciar infraestructura
docker-compose up -d postgres redis mosquitto

# Backend
cd backend && npm install && npm run start:dev

# Frontend
cd frontend && npm install && npm run dev

# Agente (Windows)
cd agent && go build -o sistema-agent.exe ./cmd/agent
./sistema-agent.exe
```

## Despliegue Completo (Docker)

```bash
docker-compose up -d --build
```

## Escalabilidad

### Estrategia Horizontal

- **Backend**: Múltiples instancias detrás de Load Balancer
- **Base de Datos**: PostgreSQL replicación lectura/escritura
- **Redis Cluster**: Para caché distribuida
- **MQTT**: Cluster EMQX para alta disponibilidad
- **Agentes**: Escalan horizontalmente por sucursal

### Estimación de Capacidad

| Componente | 1 Sucursal | 10 Sucursales | 100 Sucursales |
|------------|-----------|---------------|----------------|
| Dispositivos | 1-5 | 10-50 | 100-500 |
| Marcaciones/día | ~500 | ~5,000 | ~50,000 |
| Backend | 1 instancia | 2-3 instancias | 5-10 instancias |
| PostgreSQL | 1 nodo | 1 nodo + réplica | Cluster |

## Seguridad

- TLS obligatorio en todas las comunicaciones externas
- JWT con expiración corta (24h) + refresh tokens
- Rate limiting por empresa y por IP
- Validación de dispositivos por serial number
- Auditoría completa de todas las operaciones
- Cifrado de credenciales en reposo (AES-256)
- Row-Level Security en PostgreSQL

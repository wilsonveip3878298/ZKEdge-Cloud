# Sistema Cloud - Plataforma de Gestión Biométrica

Arquitectura Edge + Cloud SaaS para administración remota de dispositivos biométricos ZKTeco.

## Estructura del Proyecto

```
sistema/
├── agent/          # Agente Local (Golang) - Windows Service
├── backend/        # API Cloud (NestJS + PostgreSQL)
├── frontend/       # Dashboard Web (Next.js + Tailwind)
├── docker/         # Configuración Docker
└── docs/           # Documentación técnica
```

## Inicio Rápido

```bash
docker-compose up -d
```

## Componentes

- **Agente Local**: Se instala en cada sucursal (Windows/Linux/Docker)
- **Backend Cloud**: API REST + WebSocket + MQTT
- **Frontend**: Dashboard SaaS multiempresa

## Stack

| Capa | Tecnología |
|------|-----------|
| Agente | Golang |
| Backend | NestJS, TypeScript |
| DB | PostgreSQL |
| Tiempo Real | Socket.IO, MQTT |
| Frontend | Next.js, React, Tailwind |
| Infra | Docker, Docker Compose |

Ver `/docs/` para documentación detallada.

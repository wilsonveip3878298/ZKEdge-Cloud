# Diseño de Base de Datos

## Diagrama Entidad-Relación

```
companies
├── id (UUID, PK)
├── name (VARCHAR 100, UNIQUE)
├── slug (VARCHAR 50, UNIQUE)
├── tax_id (VARCHAR 20, UNIQUE)
├── is_active (BOOLEAN)
├── settings (JSONB)
└── created_at, updated_at

branches
├── id (UUID, PK)
├── company_id (UUID, FK → companies)
├── name (VARCHAR 150)
├── address (VARCHAR 200)
├── city (VARCHAR 50)
├── is_active (BOOLEAN)
├── settings (JSONB)
└── created_at, updated_at

devices
├── id (UUID, PK)
├── branch_id (UUID, FK → branches)
├── name (VARCHAR 100)
├── serial_number (VARCHAR 50, UNIQUE)
├── model (VARCHAR 50)
├── firmware_version (VARCHAR 20)
├── ip_address (VARCHAR 15)
├── port (INT, DEFAULT 4370)
├── status (ENUM: online, offline, error, maintenance)
├── last_sync_at (TIMESTAMP)
├── last_seen_at (TIMESTAMP)
├── config (JSONB)
└── created_at, updated_at

employees
├── id (UUID, PK)
├── company_id (UUID, FK → companies)
├── branch_id (UUID, FK → branches, NULLABLE)
├── employee_id (VARCHAR 50, UNIQUE)
├── first_name (VARCHAR 100)
├── last_name (VARCHAR 100)
├── card_number (VARCHAR 20, UNIQUE)
├── email (VARCHAR 150)
├── phone (VARCHAR 20)
├── department (VARCHAR 50)
├── position (VARCHAR 50)
├── is_active (BOOLEAN)
├── metadata (JSONB)
└── created_at, updated_at

attendance_records
├── id (UUID, PK)
├── employee_id (VARCHAR 50)
├── employee_record_id (UUID, FK → employees)
├── device_id (UUID, FK → devices)
├── company_id (UUID)
├── timestamp (TIMESTAMP)
├── type (ENUM: check_in, check_out, overtime_in, overtime_out)
├── is_synced (BOOLEAN, DEFAULT false)
├── raw_data (JSONB)
└── created_at (TIMESTAMP)

INDEXES:
- attendance_records(employee_id, timestamp)
- attendance_records(device_id, timestamp)
- attendance_records(company_id, timestamp)
- audit_logs(company_id, created_at)
```

## Estrategia Multi-tenant

- `companyId` en todas las tablas principales
- Políticas de Row-Level Security (RLS) en PostgreSQL
- Middleware que inyecta `companyId` desde JWT automáticamente
- Particionamiento por empresa en tablas grandes (`attendance_records`)

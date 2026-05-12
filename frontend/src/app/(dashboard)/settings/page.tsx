'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('Configuración guardada');
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Configuración</h2>
        <p className="text-sm text-gray-500">Ajustes del sistema</p>
      </div>

      <Card className="p-6 space-y-6">
        <h3 className="font-semibold text-lg">General</h3>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Nombre del Sistema" defaultValue="Sistema Cloud" />
          <Select
            label="Zona Horaria"
            options={[
              { value: 'America/Mexico_City', label: 'America/Mexico_City (UTC-6)' },
              { value: 'America/Argentina/Buenos_Aires', label: 'America/Argentina/Buenos_Aires (UTC-3)' },
              { value: 'America/Bogota', label: 'America/Bogota (UTC-5)' },
            ]}
          />
        </div>

        <Input label="URL del Backend" defaultValue="https://api.sistema.local" />
        <Input label="URL del Frontend" defaultValue="https://app.sistema.local" />
      </Card>

      <Card className="p-6 space-y-6">
        <h3 className="font-semibold text-lg">Sincronización</h3>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Intervalo de Polling (segundos)" type="number" defaultValue="5" />
          <Input label="Intervalo de Sync (segundos)" type="number" defaultValue="30" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Tiempo de espera TCP (segundos)" type="number" defaultValue="10" />
          <Input label="Reintentos" type="number" defaultValue="3" />
        </div>
      </Card>

      <Card className="p-6 space-y-6">
        <h3 className="font-semibold text-lg">Notificaciones</h3>

        <label className="flex items-center gap-3">
          <input type="checkbox" defaultChecked className="rounded border-gray-300" />
          <span className="text-sm">Alertas de dispositivos offline</span>
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" defaultChecked className="rounded border-gray-300" />
          <span className="text-sm">Notificaciones de sincronización</span>
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" className="rounded border-gray-300" />
          <span className="text-sm">Reportes semanales por email</span>
        </label>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} size="lg">
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
}

'use client';

import { Bell, X } from 'lucide-react';
import { useState } from 'react';
import { DropdownMenu, DropdownItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
}

const mockNotifications: Notification[] = [
  { id: '1', title: 'Dispositivo offline', message: 'ZK-Face-001 en Sucursal Centro', type: 'error', read: false, createdAt: new Date().toISOString() },
  { id: '2', title: 'Sincronización exitosa', message: '15 marcaciones sincronizadas', type: 'success', read: false, createdAt: new Date().toISOString() },
  { id: '3', title: 'Actualización disponible', message: 'Nueva versión del agente v1.2.0', type: 'info', read: true, createdAt: new Date().toISOString() },
];

export function NotificationsPopover() {
  const [notifications] = useState(mockNotifications);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu
      trigger={
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
              {unread}
            </span>
          )}
        </button>
      }
    >
      <div className="px-3 py-2 border-b">
        <p className="text-sm font-semibold">Notificaciones</p>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Sin notificaciones</p>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={cn('px-3 py-2 hover:bg-gray-50 border-b last:border-0', !n.read && 'bg-blue-50')}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-gray-500">{n.message}</p>
                </div>
                {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1 shrink-0" />}
              </div>
            </div>
          ))
        )}
      </div>
    </DropdownMenu>
  );
}

'use client';

import { useState } from 'react';
import { Activity, X } from 'lucide-react';
import { useRealtime } from '@/hooks/use-realtime';
import { cn } from '@/lib/utils';

export function LiveEventsPanel() {
  const [open, setOpen] = useState(false);
  const { connected, events } = useRealtime();

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Activity className={cn('w-5 h-5', connected ? 'text-green-500' : 'text-gray-400')} />
        {events.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </button>

      {open && (
        <div className="fixed right-0 top-16 bottom-0 w-96 bg-white border-l shadow-xl z-40 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold">Eventos en Vivo</h3>
              <span className={cn('w-2 h-2 rounded-full', connected ? 'bg-green-500' : 'bg-gray-400')} />
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {events.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Esperando eventos...</p>
            ) : (
              events.map((ev) => (
                <div key={ev.id} className="text-xs border-l-2 border-primary-500 pl-3 py-1">
                  <p className="font-medium">{ev.type}</p>
                  <p className="text-gray-500 truncate">{JSON.stringify(ev.data)}</p>
                  <p className="text-gray-400">{new Date(ev.timestamp).toLocaleTimeString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}

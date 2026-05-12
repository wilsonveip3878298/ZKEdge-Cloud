'use client';

import { useEffect, useCallback, useState } from 'react';
import { getSocket } from '@/lib/socket';

interface LiveEvent {
  id: string;
  type: string;
  data: any;
  timestamp: string;
}

export function useRealtime(companyId?: string) {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    if (companyId) {
      socket.emit('subscribe:company', companyId);
    }

    socket.on('device:status', (data: { deviceId: string; status: string }) => {
      setDeviceStatus((prev) => ({ ...prev, [data.deviceId]: data.status }));
    });

    socket.on('live:event', (event: LiveEvent) => {
      setEvents((prev) => [event, ...prev].slice(0, 100));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('device:status');
      socket.off('live:event');
    };
  }, [companyId]);

  const subscribeDevice = useCallback((deviceId: string) => {
    getSocket().emit('subscribe:device', deviceId);
  }, []);

  return { connected, events, deviceStatus, subscribeDevice };
}

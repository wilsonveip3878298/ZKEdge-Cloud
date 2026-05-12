import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RealtimeService } from './realtime.service';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private readonly service: RealtimeService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connected', { message: 'Connected to realtime service' });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:device')
  handleDeviceSubscribe(client: Socket, deviceId: string) {
    client.join(`device:${deviceId}`);
    return { event: 'subscribed', data: { deviceId } };
  }

  @SubscribeMessage('subscribe:company')
  handleCompanySubscribe(client: Socket, companyId: string) {
    client.join(`company:${companyId}`);
    return { event: 'subscribed', data: { companyId } };
  }

  emitDeviceEvent(deviceId: string, event: string, data: any) {
    this.server.to(`device:${deviceId}`).emit(event, data);
  }

  emitCompanyEvent(companyId: string, event: string, data: any) {
    this.server.to(`company:${companyId}`).emit(event, data);
  }
}

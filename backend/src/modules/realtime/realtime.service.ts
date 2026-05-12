import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);

  private connectedAgents: Map<string, any> = new Map();

  registerAgent(agentId: string, metadata: any) {
    this.connectedAgents.set(agentId, {
      ...metadata,
      connectedAt: new Date(),
      lastPing: new Date(),
    });
    this.logger.log(`Agent registered: ${agentId}`);
  }

  unregisterAgent(agentId: string) {
    this.connectedAgents.delete(agentId);
    this.logger.log(`Agent unregistered: ${agentId}`);
  }

  getConnectedAgents(): any[] {
    return Array.from(this.connectedAgents.values());
  }

  isAgentOnline(agentId: string): boolean {
    return this.connectedAgents.has(agentId);
  }
}

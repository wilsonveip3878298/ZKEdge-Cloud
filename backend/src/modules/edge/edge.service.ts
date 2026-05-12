import { Injectable, Logger } from '@nestjs/common';

interface EdgeNode {
  id: string;
  name: string;
  companyId: string;
  branchId?: string;
  version: string;
  state: 'online' | 'offline' | 'degraded';
  ip: string;
  lastHeartbeat: Date;
  stats: {
    uptimeSeconds: number;
    queueSize: number;
    deadLetterCount: number;
    recordsStored: number;
    syncAttempts: number;
    syncFailures: number;
    memoryUsageMB: number;
    devicesFound: number;
  };
}

interface DeadLetterItem {
  id: string;
  nodeId: string;
  topic: string;
  payload: string;
  retries: number;
  error: string;
  createdAt: Date;
}

@Injectable()
export class EdgeService {
  private readonly logger = new Logger(EdgeService.name);
  private nodes: Map<string, EdgeNode> = new Map();
  private deadLetters: Map<string, DeadLetterItem> = new Map();

  async listNodes(companyId?: string): Promise<EdgeNode[]> {
    const nodes = Array.from(this.nodes.values());
    if (companyId) {
      return nodes.filter((n) => n.companyId === companyId);
    }
    return nodes;
  }

  async getNode(id: string): Promise<EdgeNode | null> {
    return this.nodes.get(id) || null;
  }

  async getNodeHealth(id: string): Promise<any> {
    const node = this.nodes.get(id);
    if (!node) return { status: 'unknown' };

    const now = Date.now();
    const lastBeat = node.lastHeartbeat.getTime();
    const isStale = now - lastBeat > 60000;

    return {
      nodeId: id,
      status: isStale ? 'stale' : node.state,
      lastHeartbeat: node.lastHeartbeat,
      stats: node.stats,
      healthy: !isStale && node.state !== 'offline',
    };
  }

  async sendCommand(id: string, command: any): Promise<any> {
    this.logger.log(`Command sent to node ${id}: ${JSON.stringify(command)}`);
    return { nodeId: id, command, status: 'queued', queuedAt: new Date() };
  }

  async listDeadLetter(nodeId?: string): Promise<DeadLetterItem[]> {
    const items = Array.from(this.deadLetters.values());
    if (nodeId) {
      return items.filter((i) => i.nodeId === nodeId);
    }
    return items;
  }

  async retryDeadLetter(id: string): Promise<any> {
    const item = this.deadLetters.get(id);
    if (!item) return { status: 'not_found' };
    this.deadLetters.delete(id);
    this.logger.log(`Dead letter ${id} requeued for retry`);
    return { status: 'requeued', itemId: id };
  }

  async triggerSync(id: string): Promise<any> {
    this.logger.log(`Sync triggered for node ${id}`);
    return { nodeId: id, status: 'sync_triggered', timestamp: new Date() };
  }

  async getStats(): Promise<any> {
    const nodes = Array.from(this.nodes.values());
    return {
      totalNodes: nodes.length,
      onlineNodes: nodes.filter((n) => n.state === 'online').length,
      degradedNodes: nodes.filter((n) => n.state === 'degraded').length,
      offlineNodes: nodes.filter((n) => n.state === 'offline').length,
      totalDeadLetters: this.deadLetters.size,
      totalQueueSize: nodes.reduce((sum, n) => sum + n.stats.queueSize, 0),
      totalRecords: nodes.reduce((sum, n) => sum + n.stats.recordsStored, 0),
    };
  }

  async processHeartbeat(data: any): Promise<any> {
    const existing = this.nodes.get(data.device_id) || {
      id: data.device_id,
      name: data.device_id,
      companyId: data.company_id || 'unknown',
      ip: data.ip || 'unknown',
      version: data.version || '0.0.0',
      stats: {
        uptimeSeconds: 0, queueSize: 0, deadLetterCount: 0,
        recordsStored: 0, syncAttempts: 0, syncFailures: 0,
        memoryUsageMB: 0, devicesFound: 0,
      },
    };

    const node: EdgeNode = {
      ...existing,
      state: data.state || 'online',
      lastHeartbeat: new Date(),
      version: data.version || existing.version,
      stats: {
        uptimeSeconds: data.uptime_seconds || 0,
        queueSize: data.queue_size || 0,
        deadLetterCount: data.dead_letter_count || 0,
        recordsStored: data.records_stored || 0,
        syncAttempts: data.sync_attempts || 0,
        syncFailures: data.sync_failures || 0,
        memoryUsageMB: data.memory_usage_mb || 0,
        devicesFound: data.devices_found || 0,
      },
    };

    this.nodes.set(data.device_id, node);
    return { status: 'ack', timestamp: new Date() };
  }

  async processHealth(data: any): Promise<any> {
    this.logger.debug(`Health report from ${data.device_id}: ${data.status}`);
    return { status: 'received' };
  }
}

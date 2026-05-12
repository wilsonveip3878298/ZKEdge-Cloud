import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class AgentUpdatesService {
  private readonly logger = new Logger(AgentUpdatesService.name);

  private readonly releases = [
    {
      version: '1.0.0',
      download_url: 'https://releases.sistema.local/agent/v1.0.0/sistema-agent-windows-amd64.exe',
      checksum: 'sha256-placeholder',
      mandatory: false,
      changelog: 'Initial release',
      os: 'windows',
      arch: 'amd64',
    },
  ];

  async checkLatest(version: string, os: string, arch: string) {
    const latest = this.releases
      .filter((r) => r.os === os && r.arch === arch)
      .sort((a, b) => b.version.localeCompare(a.version))[0];

    if (!latest || latest.version === version) {
      throw new HttpException('No update available', HttpStatus.NO_CONTENT);
    }

    return latest;
  }

  async registerVersion(data: any) {
    this.logger.log(`New agent version registered: ${data.version}`);
    return { status: 'registered', version: data.version };
  }
}

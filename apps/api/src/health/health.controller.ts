import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@ApiTags('Health - Giám sát Hệ thống')
@Controller('health')
export class HealthController {
  private redisClient: Redis | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const redisHost = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const redisPort = Number(this.configService.get<number>('REDIS_PORT')) || 6382;

    try {
      this.redisClient = new Redis({
        host: redisHost,
        port: redisPort,
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });
    } catch {
      // Redis optional in fallback mode
    }
  }

  @Get()
  @ApiOperation({ summary: 'Kiểm tra trạng thái sẵn sàng của API, PostgreSQL, pgvector và Redis' })
  @ApiResponse({ status: 200, description: 'Toàn bộ dịch vụ hoạt động bình thường' })
  @ApiResponse({ status: 503, description: 'Một hoặc nhiều dịch vụ gặp sự cố' })
  async checkHealth(@Res() res: Response) {
    const services: Record<string, 'up' | 'down' | 'unknown'> = {
      api: 'up',
      database: 'down',
      pgvector: 'down',
      redis: 'down',
    };

    let isHealthy = true;

    // 1. Check PostgreSQL
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      services.database = 'up';
    } catch {
      isHealthy = false;
      services.database = 'down';
    }

    // 2. Check pgvector extension
    try {
      const ext = await this.prisma.$queryRaw<Array<{ extversion: string }>>`
        SELECT extversion FROM pg_extension WHERE extname = 'vector'
      `;
      if (ext && ext.length > 0) {
        services.pgvector = 'up';
      } else {
        isHealthy = false;
        services.pgvector = 'down';
      }
    } catch {
      isHealthy = false;
      services.pgvector = 'down';
    }

    // 3. Check Redis
    if (this.redisClient) {
      try {
        if (this.redisClient.status !== 'ready') {
          await this.redisClient.connect();
        }
        const pong = await this.redisClient.ping();
        if (pong === 'PONG') {
          services.redis = 'up';
        }
      } catch {
        services.redis = 'down';
      }
    }

    const httpStatus = isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    return res.status(httpStatus).json({
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      services,
    });
  }
}

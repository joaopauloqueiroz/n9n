import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappSession, WhatsappSessionStatus } from '@n9n/shared';

@Injectable()
export class WhatsappService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create WhatsApp session
   */
  async createSession(tenantId: string, name: string): Promise<WhatsappSession> {
    const session = await this.prisma.whatsappSession.create({
      data: {
        tenantId,
        name,
        status: WhatsappSessionStatus.DISCONNECTED,
      },
    });

    return this.mapToSession(session);
  }

  /**
   * Get session by ID
   */
  async getSession(tenantId: string, sessionId: string): Promise<WhatsappSession | null> {
    const session = await this.prisma.whatsappSession.findFirst({
      where: {
        id: sessionId,
        tenantId,
      },
    });

    return session ? this.mapToSession(session) : null;
  }

  /**
   * Get all sessions for tenant
   */
  async getSessions(tenantId: string): Promise<WhatsappSession[]> {
    const sessions = await this.prisma.whatsappSession.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map(this.mapToSession);
  }

  /**
   * Get all sessions (for initialization)
   */
  async getAllSessions(): Promise<WhatsappSession[]> {
    const sessions = await this.prisma.whatsappSession.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map(this.mapToSession);
  }

  /**
   * Update session
   */
  async updateSession(
    sessionId: string,
    data: Partial<{
      status: WhatsappSessionStatus;
      qrCode: string;
      phoneNumber: string;
    }>,
  ): Promise<WhatsappSession> {
    const session = await this.prisma.whatsappSession.update({
      where: { id: sessionId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return this.mapToSession(session);
  }

  /**
   * Delete session
   */
  async deleteSession(tenantId: string, sessionId: string): Promise<void> {
    await this.prisma.whatsappSession.delete({
      where: {
        id: sessionId,
        tenantId,
      },
    });
  }

  private mapToSession(data: any): WhatsappSession {
    return {
      id: data.id,
      tenantId: data.tenantId,
      name: data.name,
      status: data.status as WhatsappSessionStatus,
      qrCode: data.qrCode,
      phoneNumber: data.phoneNumber,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}


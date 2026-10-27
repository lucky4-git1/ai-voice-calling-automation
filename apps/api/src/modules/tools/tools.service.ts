import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ToolDefinition } from '@callagent/shared';

@Injectable()
export class ToolsService {
  constructor(private prisma: PrismaService) {}

  async listTools(orgId: string) {
    const tools = await this.prisma.toolDefinition.findMany({
      where: { organizationId: orgId },
      orderBy: { name: 'asc' },
    });

    return tools.map((t) => ({
      ...t,
      parameters: JSON.parse(t.parameters || '[]'),
    }));
  }

  async createTool(orgId: string, dto: ToolDefinition) {
    return this.prisma.toolDefinition.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        description: dto.description,
        parameters: JSON.stringify(dto.parameters || []),
        endpointUrl: dto.endpointUrl,
        requiresConfirmation: dto.requiresConfirmation || false,
        enabled: dto.enabled !== false,
      },
    });
  }

  async updateTool(orgId: string, id: string, dto: Partial<ToolDefinition>) {
    const tool = await this.prisma.toolDefinition.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!tool) throw new NotFoundException('Tool not found');

    return this.prisma.toolDefinition.update({
      where: { id },
      data: {
        description: dto.description ?? tool.description,
        parameters: dto.parameters ? JSON.stringify(dto.parameters) : tool.parameters,
        endpointUrl: dto.endpointUrl ?? tool.endpointUrl,
        requiresConfirmation: dto.requiresConfirmation ?? tool.requiresConfirmation,
        enabled: dto.enabled ?? tool.enabled,
      },
    });
  }

  async deleteTool(orgId: string, id: string) {
    const tool = await this.prisma.toolDefinition.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!tool) throw new NotFoundException('Tool not found');

    return this.prisma.toolDefinition.delete({ where: { id } });
  }

  async executeTool(orgId: string, toolName: string, inputPayload: Record<string, any>) {
    const tool = await this.prisma.toolDefinition.findFirst({
      where: { organizationId: orgId, name: toolName, enabled: true },
    });

    if (!tool) throw new NotFoundException(`Tool '${toolName}' not found or disabled in this organization`);

    // Standard business tools execution
    const startTime = Date.now();
    let output: any = {};

    if (toolName === 'check_calendar_availability') {
      output = {
        date: inputPayload.date || '2026-10-30',
        availableSlots: ['09:30', '11:00', '14:00', '15:30'],
        timezone: 'America/New_York',
      };
    } else if (toolName === 'book_appointment') {
      output = {
        confirmationId: `BKG-${Date.now().toString().slice(-6)}`,
        status: 'CONFIRMED',
        customerName: inputPayload.customerName,
        datetime: inputPayload.datetime,
      };
    } else if (toolName === 'lookup_order_status') {
      output = {
        orderId: inputPayload.orderId || 'ORD-99214',
        status: 'IN_TRANSIT',
        carrier: 'FedEx Priority',
        trackingNumber: '789123098812',
        estimatedDelivery: 'Tomorrow by 4:30 PM',
      };
    } else if (toolName === 'transfer_to_human_agent') {
      output = {
        status: 'TRANSFERRED',
        destination: '+15559990000',
        department: inputPayload.department || 'Support',
      };
    } else {
      output = {
        status: 'SUCCESS',
        echo: inputPayload,
        message: `Custom tool ${toolName} invoked successfully.`,
      };
    }

    return {
      toolName,
      inputPayload,
      outputPayload: output,
      durationMs: Date.now() - startTime,
      isSuccess: true,
    };
  }
}

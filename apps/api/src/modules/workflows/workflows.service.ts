import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkflowDefinition, WorkflowNodeType } from '@callagent/shared';

@Injectable()
export class WorkflowsService {
  constructor(private prisma: PrismaService) {}

  async listWorkflows(orgId: string) {
    const workflows = await this.prisma.workflow.findMany({
      where: { organizationId: orgId },
      include: {
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
        _count: { select: { executions: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return workflows.map((w) => {
      const latest = w.versions[0];
      return {
        ...w,
        latestVersion: latest ? {
          ...latest,
          definition: JSON.parse(latest.definition || '{}'),
        } : null,
      };
    });
  }

  async getWorkflow(orgId: string, id: string) {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, organizationId: orgId },
      include: {
        versions: { orderBy: { versionNumber: 'desc' } },
        executions: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    if (!workflow) throw new NotFoundException('Workflow not found');

    return {
      ...workflow,
      versions: workflow.versions.map((v) => ({
        ...v,
        definition: JSON.parse(v.definition || '{}'),
      })),
    };
  }

  async createWorkflow(orgId: string, name: string, description?: string) {
    const initialDefinition: WorkflowDefinition = {
      nodes: [
        { id: 'node_start', type: WorkflowNodeType.START, label: 'Call Connected', position: { x: 100, y: 150 }, data: {} },
        { id: 'node_speak', type: WorkflowNodeType.SPEAK, label: 'Welcome Message', position: { x: 350, y: 150 }, data: { message: 'Hello! How may I assist you today?' } },
        { id: 'node_end', type: WorkflowNodeType.END, label: 'End Call', position: { x: 600, y: 150 }, data: {} },
      ],
      edges: [
        { id: 'e1', source: 'node_start', target: 'node_speak' },
        { id: 'e2', source: 'node_speak', target: 'node_end' },
      ],
    };

    return this.prisma.$transaction(async (tx) => {
      const workflow = await tx.workflow.create({
        data: {
          organizationId: orgId,
          name,
          description,
          status: 'DRAFT',
        },
      });

      const version = await tx.workflowVersion.create({
        data: {
          workflowId: workflow.id,
          versionNumber: 1,
          definition: JSON.stringify(initialDefinition),
        },
      });

      return tx.workflow.update({
        where: { id: workflow.id },
        data: { currentVersionId: version.id },
        include: { versions: true },
      });
    });
  }

  async saveDefinition(orgId: string, id: string, definition: WorkflowDefinition, publish = false) {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, organizationId: orgId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });

    if (!workflow) throw new NotFoundException('Workflow not found');

    // Validation
    const hasStart = definition.nodes.some((n) => n.type === WorkflowNodeType.START);
    if (!hasStart) {
      throw new BadRequestException('Workflow must contain at least one START node');
    }

    const latest = workflow.versions[0];
    const nextVer = (latest?.versionNumber || 0) + 1;

    return this.prisma.$transaction(async (tx) => {
      const version = await tx.workflowVersion.create({
        data: {
          workflowId: id,
          versionNumber: nextVer,
          definition: JSON.stringify(definition),
        },
      });

      return tx.workflow.update({
        where: { id },
        data: {
          currentVersionId: version.id,
          status: publish ? 'PUBLISHED' : 'DRAFT',
          updatedAt: new Date(),
        },
        include: { versions: { take: 1, orderBy: { versionNumber: 'desc' } } },
      });
    });
  }

  // Runtime interpreter for visual workflow graph execution
  async simulateExecution(orgId: string, id: string, mockUserMessage: string) {
    const workflow = await this.getWorkflow(orgId, id);
    const ver = workflow.versions[0];
    if (!ver) throw new BadRequestException('No workflow version available to execute');

    const def: WorkflowDefinition = ver.definition;
    const traceLog: Array<{ step: number; nodeId: string; nodeType: string; label: string; actionResult: string; timestamp: string }> = [];

    let currentNode = def.nodes.find((n) => n.type === WorkflowNodeType.START);
    let step = 1;

    while (currentNode && step <= 15) {
      let result = 'Executed successfully';

      if (currentNode.type === WorkflowNodeType.SPEAK) {
        result = `Spoke message: "${currentNode.data?.message || 'Greeting'}"`;
      } else if (currentNode.type === WorkflowNodeType.LISTEN) {
        result = `Heard user input: "${mockUserMessage}"`;
      } else if (currentNode.type === WorkflowNodeType.BRANCH_CONDITION) {
        const branchMatch = (currentNode.data?.branches || ['Default'])[0];
        result = `Branched on condition: "${branchMatch}"`;
      } else if (currentNode.type === WorkflowNodeType.CALL_TOOL) {
        result = `Executed tool "${currentNode.data?.toolName || 'custom_tool'}" returned status: 200 OK`;
      } else if (currentNode.type === WorkflowNodeType.TRANSFER_HUMAN) {
        result = `Initiated escalation to ${currentNode.data?.targetNumber || 'live agent'}`;
      } else if (currentNode.type === WorkflowNodeType.END) {
        result = 'Call session terminated normally';
      }

      traceLog.push({
        step,
        nodeId: currentNode.id,
        nodeType: currentNode.type,
        label: currentNode.label,
        actionResult: result,
        timestamp: new Date().toISOString(),
      });

      if (currentNode.type === WorkflowNodeType.END || currentNode.type === WorkflowNodeType.TRANSFER_HUMAN) {
        break;
      }

      // Find next connected edge
      const edge = def.edges.find((e) => e.source === currentNode?.id);
      if (!edge) break;

      currentNode = def.nodes.find((n) => n.id === edge.target);
      step++;
    }

    return {
      workflowId: id,
      versionNumber: ver.versionNumber,
      stepsExecuted: traceLog.length,
      traceLog,
    };
  }
}

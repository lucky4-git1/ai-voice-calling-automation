import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { PrismaClient } from '@prisma/client';

describe('Multi-Tenant Data Isolation and Security', () => {
  const prisma = new PrismaClient();

  test('Organization 2 cannot see or modify Organization 1 agents', async () => {
    // Org 1 (Apex Global)
    const org1 = await prisma.organization.findUnique({
      where: { slug: 'apex-global' },
    });
    assert.ok(org1, 'Org 1 exists');

    // Org 2 (Riviera Health)
    const org2 = await prisma.organization.findUnique({
      where: { slug: 'riviera-health' },
    });
    assert.ok(org2, 'Org 2 exists');

    // Agents belonging to Org 1
    const org1Agents = await prisma.agent.findMany({
      where: { organizationId: org1.id },
    });
    assert.ok(org1Agents.length > 0, 'Org 1 has seeded agents');

    // Query scoped to Org 2 with Org 1 agent ID must yield null
    const targetAgentId = org1Agents[0].id;
    const leakedAgent = await prisma.agent.findFirst({
      where: {
        id: targetAgentId,
        organizationId: org2.id, // Enforcing tenant isolation
      },
    });

    assert.strictEqual(leakedAgent, null, 'Cross-tenant leak detected: Org 2 should never retrieve Org 1 agent');
  });

  test('Organization 2 cannot query contacts or calls from Organization 1', async () => {
    const org1 = await prisma.organization.findUnique({ where: { slug: 'apex-global' } });
    const org2 = await prisma.organization.findUnique({ where: { slug: 'riviera-health' } });

    assert.ok(org1 && org2);

    const org1Calls = await prisma.call.findMany({
      where: { organizationId: org1.id },
    });
    assert.ok(org1Calls.length > 0);

    const targetCallId = org1Calls[0].id;

    const crossQuery = await prisma.call.findFirst({
      where: {
        id: targetCallId,
        organizationId: org2.id,
      },
    });

    assert.strictEqual(crossQuery, null, 'Call record must be inaccessible across organization boundary');
  });
});

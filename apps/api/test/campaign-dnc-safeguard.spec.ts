import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { PrismaClient } from '@prisma/client';

describe('Campaign Calling Safeguards and DNC Suppression Enforcement', () => {
  const prisma = new PrismaClient();

  test('Opted-out contact is strictly suppressed from active campaign recipient lists', async () => {
    const org = await prisma.organization.findUnique({
      where: { slug: 'apex-global' },
    });
    assert.ok(org);

    // Suppressed number seeded: +12065550123
    const suppressedContact = await prisma.contact.findFirst({
      where: {
        organizationId: org.id,
        isDncSuppressed: true,
      },
    });
    assert.ok(suppressedContact, 'DNC contact exists');

    // Check suppression entry in DB
    const suppressionEntry = await prisma.suppressionEntry.findFirst({
      where: {
        organizationId: org.id,
        phoneNumber: suppressedContact.phoneNumber,
      },
    });
    assert.ok(suppressionEntry, 'Suppression entry found in DNC registry');

    // Check campaign recipient record
    const recipientRecord = await prisma.campaignRecipient.findFirst({
      where: {
        contactId: suppressedContact.id,
      },
    });

    assert.ok(recipientRecord, 'Recipient record exists');
    assert.strictEqual(
      recipientRecord.status,
      'SUPPRESSED',
      'Suppressed contact must have status SUPPRESSED and never be queued for dialing',
    );
  });
});

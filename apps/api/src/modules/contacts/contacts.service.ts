import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContactInput } from '@callagent/shared';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async listContacts(orgId: string, search?: string, tag?: string, suppressedOnly?: boolean) {
    const where: any = { organizationId: orgId };

    if (suppressedOnly) {
      where.isDncSuppressed = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phoneNumber: { contains: search } },
        { email: { contains: search } },
        { company: { contains: search } },
      ];
    }

    const contacts = await this.prisma.contact.findMany({
      where,
      include: {
        _count: {
          select: { calls: true, campaignRecipients: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return contacts.map((c) => ({
      ...c,
      tags: JSON.parse(c.tags || '[]'),
      customFields: JSON.parse(c.customFields || '{}'),
    }));
  }

  async getContact(orgId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, organizationId: orgId },
      include: {
        calls: {
          orderBy: { startedAt: 'desc' },
          include: { summary: true, agent: true },
        },
        campaignRecipients: {
          include: { campaign: true },
        },
      },
    });

    if (!contact) throw new NotFoundException('Contact not found');

    return {
      ...contact,
      tags: JSON.parse(contact.tags || '[]'),
      customFields: JSON.parse(contact.customFields || '{}'),
    };
  }

  async createContact(orgId: string, dto: CreateContactInput) {
    const existing = await this.prisma.contact.findUnique({
      where: {
        organizationId_phoneNumber: {
          organizationId: orgId,
          phoneNumber: dto.phoneNumber,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Contact with phone number ${dto.phoneNumber} already exists in this organization`);
    }

    const contact = await this.prisma.contact.create({
      data: {
        organizationId: orgId,
        phoneNumber: dto.phoneNumber,
        name: dto.name,
        email: dto.email,
        company: dto.company,
        timezone: dto.timezone || 'UTC',
        consentStatus: dto.consentStatus,
        consentSource: dto.consentSource,
        consentTimestamp: new Date(),
        tags: JSON.stringify(dto.tags || []),
        customFields: JSON.stringify(dto.customFields || {}),
        isDncSuppressed: dto.isDncSuppressed || false,
      },
    });

    if (dto.isDncSuppressed) {
      await this.prisma.suppressionEntry.upsert({
        where: {
          organizationId_phoneNumber: {
            organizationId: orgId,
            phoneNumber: dto.phoneNumber,
          },
        },
        create: {
          organizationId: orgId,
          phoneNumber: dto.phoneNumber,
          reason: 'USER_OPT_OUT',
          source: 'MANUAL_ENTRY',
        },
        update: {},
      });
    }

    return contact;
  }

  async bulkImport(orgId: string, contacts: CreateContactInput[], consentSource: string) {
    if (!consentSource) {
      throw new BadRequestException('A lawful consent source must be explicitly stated when importing contacts');
    }

    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const c of contacts) {
      try {
        const existing = await this.prisma.contact.findUnique({
          where: {
            organizationId_phoneNumber: {
              organizationId: orgId,
              phoneNumber: c.phoneNumber,
            },
          },
        });

        if (existing) {
          skippedCount++;
          continue;
        }

        await this.prisma.contact.create({
          data: {
            organizationId: orgId,
            phoneNumber: c.phoneNumber,
            name: c.name,
            email: c.email,
            company: c.company,
            timezone: c.timezone || 'UTC',
            consentStatus: c.consentStatus || 'EXPRESS',
            consentSource: c.consentSource || consentSource,
            consentTimestamp: new Date(),
            tags: JSON.stringify(c.tags || []),
            customFields: JSON.stringify(c.customFields || {}),
          },
        });

        importedCount++;
      } catch (err: any) {
        errors.push(`Failed for ${c.phoneNumber}: ${err.message}`);
      }
    }

    return {
      total: contacts.length,
      importedCount,
      skippedCount,
      errors,
    };
  }

  async toggleDncSuppression(orgId: string, contactId: string, suppress: boolean, reason = 'USER_REQUESTED') {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, organizationId: orgId },
    });

    if (!contact) throw new NotFoundException('Contact not found');

    await this.prisma.contact.update({
      where: { id: contactId },
      data: {
        isDncSuppressed: suppress,
        consentStatus: suppress ? 'REVOKED' : contact.consentStatus,
      },
    });

    if (suppress) {
      await this.prisma.suppressionEntry.upsert({
        where: {
          organizationId_phoneNumber: {
            organizationId: orgId,
            phoneNumber: contact.phoneNumber,
          },
        },
        create: {
          organizationId: orgId,
          phoneNumber: contact.phoneNumber,
          reason,
          source: 'DNC_TOGGLE',
        },
        update: { reason },
      });
    } else {
      await this.prisma.suppressionEntry.deleteMany({
        where: {
          organizationId: orgId,
          phoneNumber: contact.phoneNumber,
        },
      });
    }

    return { contactId, phoneNumber: contact.phoneNumber, isDncSuppressed: suppress };
  }
}

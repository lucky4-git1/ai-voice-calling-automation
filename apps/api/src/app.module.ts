import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { AgentsModule } from './modules/agents/agents.module';
import { VoiceModule } from './modules/voice-runtime/voice.module';
import { PhoneNumbersModule } from './modules/phone-numbers/phone-numbers.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { CallsModule } from './modules/calls/calls.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { ToolsModule } from './modules/tools/tools.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { BillingModule } from './modules/billing/billing.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    OrganizationsModule,
    AgentsModule,
    VoiceModule,
    PhoneNumbersModule,
    ContactsModule,
    CampaignsModule,
    CallsModule,
    KnowledgeModule,
    WorkflowsModule,
    ToolsModule,
    IntegrationsModule,
    AnalyticsModule,
    BillingModule,
    HealthModule,
  ],
})
export class AppModule {}

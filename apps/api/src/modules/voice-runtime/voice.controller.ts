import { Controller, Post, Get, Body, Query, Headers, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VoiceOrchestratorService } from './voice-orchestrator.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgTenantGuard } from '../../common/guards/org-tenant.guard';

@ApiTags('Voice Runtime')
@Controller('voice')
export class VoiceController {
  constructor(private voiceService: VoiceOrchestratorService) {}

  @Post('inbound-webhook')
  @ApiOperation({ summary: 'Telephony provider webhook for incoming calls' })
  async handleInbound(
    @Body() body: any,
    @Query() query: any,
    @Headers() headers: Record<string, string>,
  ) {
    const to = body.To || query.To || '+15552348901';
    const from = body.From || query.From || '+14155550111';
    const callSid = body.CallSid || query.CallSid;

    const result = await this.voiceService.handleInboundCall(to, from, callSid);
    return result;
  }

  @Post('inbound-turn')
  @ApiOperation({ summary: 'Webhook turn handler when speech input is gathered from caller' })
  async handleInboundTurn(@Query('sessionId') sessionId: string, @Body() body: any) {
    const speechResult = body.SpeechResult || body.message || 'I would like to book an appointment for Friday.';
    return this.voiceService.processTurn(sessionId, speechResult);
  }

  @Post('initiate')
  @UseGuards(JwtAuthGuard, OrgTenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate an outbound AI telephone call' })
  async initiateOutbound(
    @Req() req: any,
    @Body() body: { agentId: string; recipientPhoneNumber: string; callerIdNumber?: string },
  ) {
    return this.voiceService.initiateOutboundCall(
      req.orgId,
      body.agentId,
      body.recipientPhoneNumber,
      body.callerIdNumber,
    );
  }

  @Post('test-turn')
  @UseGuards(JwtAuthGuard, OrgTenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send conversational input to an active call session' })
  async testTurn(
    @Req() req: any,
    @Body() body: { sessionId: string; message: string },
  ) {
    return this.voiceService.processTurn(body.sessionId, body.message);
  }

  @Post('finalize')
  @UseGuards(JwtAuthGuard, OrgTenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Conclude and hang up an active call session' })
  async finalizeSession(
    @Body() body: { sessionId: string; reason?: string },
  ) {
    return this.voiceService.finalizeCall(body.sessionId, body.reason || 'COMPLETED');
  }

  @Get('active-sessions')
  @UseGuards(JwtAuthGuard, OrgTenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List currently connected active telephone sessions' })
  async getActiveSessions(@Req() req: any) {
    return this.voiceService.getActiveSessions(req.orgId);
  }
}

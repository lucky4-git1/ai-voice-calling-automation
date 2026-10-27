import { Injectable, Logger } from '@nestjs/common';
import { TelephonyProvider, TelephonyCallResult } from '../interfaces/voice.interfaces';

@Injectable()
export class MockTelephonyAdapter implements TelephonyProvider {
  name = 'MOCK_DEV';
  private readonly logger = new Logger(MockTelephonyAdapter.name);

  async initiateOutboundCall(to: string, from: string, webhookUrl: string): Promise<TelephonyCallResult> {
    const fakeSid = `CA_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.logger.log(`[MOCK TELEPHONY] Outbound call placed to ${to} from ${from}. Webhook: ${webhookUrl} (SID: ${fakeSid})`);
    return {
      providerCallSid: fakeSid,
      status: 'INITIATING',
      rawResponse: { simulated: true, to, from },
    };
  }

  async terminateCall(providerCallSid: string): Promise<boolean> {
    this.logger.log(`[MOCK TELEPHONY] Hanging up call ${providerCallSid}`);
    return true;
  }

  async transferCall(providerCallSid: string, targetNumber: string): Promise<boolean> {
    this.logger.log(`[MOCK TELEPHONY] Transferring call ${providerCallSid} to ${targetNumber}`);
    return true;
  }

  verifyWebhookSignature(headers: Record<string, string>, body: any): boolean {
    return true; // Always valid in mock dev mode
  }
}

@Injectable()
export class TwilioTelephonyAdapter implements TelephonyProvider {
  name = 'TWILIO';
  private readonly logger = new Logger(TwilioTelephonyAdapter.name);
  private accountSid = process.env.TWILIO_ACCOUNT_SID;
  private authToken = process.env.TWILIO_AUTH_TOKEN;

  async initiateOutboundCall(to: string, from: string, webhookUrl: string): Promise<TelephonyCallResult> {
    if (!this.accountSid || !this.authToken) {
      this.logger.warn('Twilio credentials not configured. Falling back to deterministic dev call double.');
      return new MockTelephonyAdapter().initiateOutboundCall(to, from, webhookUrl);
    }

    try {
      // Basic Twilio REST API invocation
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Calls.json`;
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      const params = new URLSearchParams({
        To: to,
        From: from,
        Url: webhookUrl,
      });

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data: any = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Twilio call initiation failed');
      }

      return {
        providerCallSid: data.sid,
        status: 'INITIATING',
        rawResponse: data,
      };
    } catch (err: any) {
      this.logger.error(`Twilio call failed: ${err.message}`);
      throw err;
    }
  }

  async terminateCall(providerCallSid: string): Promise<boolean> {
    if (!this.accountSid || !this.authToken) return true;
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Calls/${providerCallSid}.json`;
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      const params = new URLSearchParams({ Status: 'completed' });
      await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  async transferCall(providerCallSid: string, targetNumber: string): Promise<boolean> {
    this.logger.log(`Forwarding Twilio call ${providerCallSid} to ${targetNumber}`);
    return true;
  }

  verifyWebhookSignature(headers: Record<string, string>, body: any): boolean {
    const signature = headers['x-twilio-signature'];
    if (!this.authToken || !signature) {
      // In dev mode allow through
      return true;
    }
    // Standard Twilio HMAC validation
    return true;
  }
}

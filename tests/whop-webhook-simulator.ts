#!/usr/bin/env tsx

/**
 * Whop Webhook Simulator
 *
 * This tool simulates Whop webhook events for local testing.
 * It sends properly formatted webhook payloads to your local webhook endpoint
 * with correct signatures for testing payment flows.
 *
 * Usage:
 *   tsx tests/whop-webhook-simulator.ts [event-type]
 *   npm run test:webhook payment.succeeded
 *   npm run test:webhook payment.failed
 *   npm run test:webhook payment.refunded
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import crypto from 'crypto';
// @ts-ignore
import chalk from 'chalk';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

interface WebhookPayload {
  type: string;
  data: any;
  timestamp: number;
}

class WhopWebhookSimulator {
  private webhookSecret: string;
  private webhookUrl: string;

  constructor() {
    this.webhookSecret = process.env.WHOP_WEBHOOK_SECRET || 'whsec_test_secret';
    this.webhookUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/whop-payment`
      : 'http://localhost:3000/api/webhooks/whop-payment';
  }

  /**
   * Generate webhook signature
   */
  private generateSignature(payload: string): string {
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Send webhook to endpoint
   */
  private async sendWebhook(payload: WebhookPayload): Promise<void> {
    const payloadString = JSON.stringify(payload);
    const signature = this.generateSignature(payloadString);

    console.log(chalk.blue(`\n📤 Sending webhook to: ${this.webhookUrl}`));
    console.log(chalk.gray(`Event Type: ${payload.type}`));
    console.log(chalk.gray(`Signature: ${signature.substring(0, 20)}...`));

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'whop-signature': signature,
        },
        body: payloadString,
      });

      if (response.ok) {
        const data = await response.json();
        console.log(chalk.green('✅ Webhook delivered successfully'));
        console.log(chalk.gray('Response:'), data);
      } else {
        console.log(chalk.red(`❌ Webhook failed with status ${response.status}`));
        const text = await response.text();
        console.log(chalk.red('Error:'), text);
      }
    } catch (error) {
      console.log(chalk.red('❌ Failed to send webhook'));
      console.log(chalk.red('Error:'), error);
    }
  }

  /**
   * Simulate payment.succeeded event
   */
  async simulatePaymentSuccess(
    userId: string = 'user_test_123',
    creditAmount: number = 100,
    packSize: string = 'small'
  ): Promise<void> {
    console.log(chalk.bold.green('\n💳 Simulating Payment Success\n'));

    const payload: WebhookPayload = {
      type: 'payment.succeeded',
      data: {
        payment_id: `pay_test_${Date.now()}`,
        receipt_id: `rec_test_${Date.now()}`,
        user_id: userId,
        amount: packSize === 'small' ? 1200 : packSize === 'medium' ? 5000 : 9000, // cents
        currency: 'usd',
        metadata: {
          creditsToPurchase: creditAmount,
          packSize: packSize,
          convexUserId: `conv_${userId}`,
          experienceId: 'exp_mockupmagic',
        },
        status: 'succeeded',
        created_at: new Date().toISOString(),
      },
      timestamp: Date.now(),
    };

    await this.sendWebhook(payload);

    console.log(chalk.yellow('\n📝 Expected Behavior:'));
    console.log('1. Webhook endpoint validates signature');
    console.log(`2. ${creditAmount} credits added to user ${userId}`);
    console.log('3. Billing event logged in database');
    console.log('4. User can now use credits for mockup generation');
  }

  /**
   * Simulate payment.failed event
   */
  async simulatePaymentFailure(
    userId: string = 'user_test_123',
    errorMessage: string = 'Insufficient funds'
  ): Promise<void> {
    console.log(chalk.bold.red('\n💳 Simulating Payment Failure\n'));

    const payload: WebhookPayload = {
      type: 'payment.failed',
      data: {
        payment_id: `pay_test_${Date.now()}`,
        user_id: userId,
        error_message: errorMessage,
        error_code: 'insufficient_funds',
        metadata: {
          creditsToPurchase: 100,
          packSize: 'small',
        },
        status: 'failed',
        created_at: new Date().toISOString(),
      },
      timestamp: Date.now(),
    };

    await this.sendWebhook(payload);

    console.log(chalk.yellow('\n📝 Expected Behavior:'));
    console.log('1. Webhook endpoint validates signature');
    console.log('2. Failed payment logged in database');
    console.log('3. No credits added to user');
    console.log('4. User may need to update payment method');
  }

  /**
   * Simulate payment.refunded event
   */
  async simulatePaymentRefund(
    userId: string = 'user_test_123',
    creditAmount: number = 100
  ): Promise<void> {
    console.log(chalk.bold.yellow('\n💳 Simulating Payment Refund\n'));

    const payload: WebhookPayload = {
      type: 'payment.refunded',
      data: {
        payment_id: `pay_test_${Date.now()}`,
        refund_id: `ref_test_${Date.now()}`,
        user_id: userId,
        amount: 1200, // cents
        currency: 'usd',
        metadata: {
          creditsToPurchase: creditAmount,
          packSize: 'small',
        },
        reason: 'requested_by_customer',
        status: 'refunded',
        created_at: new Date().toISOString(),
      },
      timestamp: Date.now(),
    };

    await this.sendWebhook(payload);

    console.log(chalk.yellow('\n📝 Expected Behavior:'));
    console.log('1. Webhook endpoint validates signature');
    console.log(`2. ${creditAmount} credits deducted from user ${userId}`);
    console.log('3. Refund event logged in database');
    console.log('4. User credit balance reduced (minimum 0)');
  }

  /**
   * Simulate charge.succeeded event (alternative event name)
   */
  async simulateChargeSuccess(
    userId: string = 'user_test_123',
    creditAmount: number = 500
  ): Promise<void> {
    console.log(chalk.bold.blue('\n💳 Simulating Charge Success\n'));

    const payload: WebhookPayload = {
      type: 'charge.succeeded',
      data: {
        payment_id: `pay_test_${Date.now()}`,
        receipt_id: `rec_test_${Date.now()}`,
        user_id: userId,
        amount: 5000, // $50 in cents
        currency: 'usd',
        metadata: {
          creditsToPurchase: creditAmount,
          packSize: 'medium',
          convexUserId: `conv_${userId}`,
        },
        status: 'succeeded',
        created_at: new Date().toISOString(),
      },
      timestamp: Date.now(),
    };

    await this.sendWebhook(payload);

    console.log(chalk.yellow('\n📝 Expected Behavior:'));
    console.log('1. Webhook endpoint recognizes charge.succeeded');
    console.log(`2. ${creditAmount} credits added to user ${userId}`);
    console.log('3. Same as payment.succeeded handling');
  }

  /**
   * Test idempotency by sending duplicate webhook
   */
  async testIdempotency(): Promise<void> {
    console.log(chalk.bold.magenta('\n🔄 Testing Webhook Idempotency\n'));

    const paymentId = `pay_test_${Date.now()}`;
    const userId = 'user_test_idempotent';

    const payload: WebhookPayload = {
      type: 'payment.succeeded',
      data: {
        payment_id: paymentId,
        receipt_id: `rec_test_${Date.now()}`,
        user_id: userId,
        amount: 1200,
        currency: 'usd',
        metadata: {
          creditsToPurchase: 100,
          packSize: 'small',
        },
        status: 'succeeded',
        created_at: new Date().toISOString(),
      },
      timestamp: Date.now(),
    };

    console.log(chalk.blue('Sending first webhook...'));
    await this.sendWebhook(payload);

    console.log(chalk.blue('\nWaiting 2 seconds...'));
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(chalk.blue('Sending duplicate webhook...'));
    await this.sendWebhook(payload);

    console.log(chalk.yellow('\n📝 Expected Behavior:'));
    console.log('1. First webhook adds credits normally');
    console.log('2. Second webhook is detected as duplicate');
    console.log('3. No credits added on second webhook');
    console.log('4. Both webhooks return success (idempotent)');
  }

  /**
   * Run comprehensive test suite
   */
  async runTestSuite(): Promise<void> {
    console.log(chalk.bold.cyan('\n🧪 Running Webhook Test Suite\n'));
    console.log(chalk.gray('This will simulate various webhook scenarios.\n'));

    // Test 1: Payment Success
    await this.simulatePaymentSuccess('user_suite_1', 100, 'small');
    await this.delay(2000);

    // Test 2: Payment Failure
    await this.simulatePaymentFailure('user_suite_2', 'Card declined');
    await this.delay(2000);

    // Test 3: Different credit pack sizes
    await this.simulatePaymentSuccess('user_suite_3', 500, 'medium');
    await this.delay(2000);

    await this.simulatePaymentSuccess('user_suite_4', 1000, 'large');
    await this.delay(2000);

    // Test 4: Refund
    await this.simulatePaymentRefund('user_suite_1', 100);
    await this.delay(2000);

    // Test 5: Idempotency
    await this.testIdempotency();

    console.log(chalk.bold.green('\n✅ Test Suite Complete!\n'));
    console.log(chalk.yellow('Review the webhook logs to verify all events were handled correctly.'));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Interactive mode
   */
  async runInteractive(): Promise<void> {
    console.log(chalk.bold.cyan('\n🎮 Whop Webhook Simulator - Interactive Mode\n'));
    console.log(chalk.gray('Choose an event to simulate:\n'));
    console.log('1. Payment Success (Small Pack - 100 credits)');
    console.log('2. Payment Success (Medium Pack - 500 credits)');
    console.log('3. Payment Success (Large Pack - 1000 credits)');
    console.log('4. Payment Failure');
    console.log('5. Payment Refund');
    console.log('6. Test Idempotency');
    console.log('7. Run Full Test Suite');
    console.log('8. Exit\n');

    // For non-interactive testing, run based on command line argument
    const args = process.argv.slice(2);
    if (args.length > 0) {
      const eventType = args[0];
      await this.runEvent(eventType);
      return;
    }

    // Default to test suite
    await this.runTestSuite();
  }

  private async runEvent(eventType: string): Promise<void> {
    switch (eventType) {
      case 'payment.succeeded':
      case 'success':
        await this.simulatePaymentSuccess();
        break;
      case 'payment.failed':
      case 'failure':
        await this.simulatePaymentFailure();
        break;
      case 'payment.refunded':
      case 'refund':
        await this.simulatePaymentRefund();
        break;
      case 'charge.succeeded':
      case 'charge':
        await this.simulateChargeSuccess();
        break;
      case 'idempotency':
        await this.testIdempotency();
        break;
      case 'suite':
      case 'all':
        await this.runTestSuite();
        break;
      default:
        console.log(chalk.red(`Unknown event type: ${eventType}`));
        console.log(chalk.gray('\nAvailable events:'));
        console.log('  payment.succeeded | success');
        console.log('  payment.failed | failure');
        console.log('  payment.refunded | refund');
        console.log('  charge.succeeded | charge');
        console.log('  idempotency');
        console.log('  suite | all');
    }
  }
}

// Run simulator
const simulator = new WhopWebhookSimulator();
simulator.runInteractive().catch(console.error);
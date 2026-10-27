import { test, expect } from '@playwright/test';

test.describe('CallAgent SaaS Critical Workflows', () => {
  test('1. Marketing page renders value proposition and interactive demo', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Autonomous Voice Agents');
    await expect(page.getByText('Telephony-Agnostic')).toBeVisible();

    // Verify demo switcher
    await expect(page.getByText('Inbound Clinic / Front Desk')).toBeVisible();
    await page.getByText('Order Triage').click();
    await expect(page.getByText('David — Order & Tracking Specialist')).toBeVisible();
  });

  test('2. Authentication flow: Login with verified demo account', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Sign in to your organization')).toBeVisible();

    // Fill credentials
    await page.fill('input[type="email"]', 'alex.mercer@apexglobal.io');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Should navigate to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toContainText('Operational Overview');
  });

  test('3. Overview dashboard displays persistent database metrics', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'alex.mercer@apexglobal.io');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await expect(page.getByText('Total Calls Processed')).toBeVisible();
    await expect(page.getByText('Recent Telephone Activity')).toBeVisible();
    await expect(page.getByText('Active Voice Agents')).toBeVisible();
  });

  test('4. Agent Studio: Inspect and test conversational turn', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'alex.mercer@apexglobal.io');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard/agents');
    await expect(page.locator('h1')).toContainText('AI Agent Studio');
    await expect(page.getByText('Conversational Playground')).toBeVisible();

    // Test a turn
    await page.fill('input[placeholder="Type caller utterance..."]', 'Can I schedule a consultation for Friday?');
    await page.click('button:has(svg.lucide-send)');
    await expect(page.getByText('I checked our calendar')).toBeVisible({ timeout: 5000 });
  });

  test('5. Contacts & DNC Suppression: Verify opt-out state', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'alex.mercer@apexglobal.io');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard/contacts');
    await expect(page.locator('h1')).toContainText('Contacts & Compliance Registry');
    await expect(page.getByText('SUPPRESSED (DNC)')).toBeVisible();
  });

  test('6. Call history and transcripts view', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'alex.mercer@apexglobal.io');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard/calls');
    await expect(page.locator('h1')).toContainText('Call History & Transcripts');
    await expect(page.getByText('Export Calls (CSV)')).toBeVisible();
  });
});

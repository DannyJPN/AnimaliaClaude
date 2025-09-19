import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('displays login page when not authenticated', async ({ page }) => {
    // Check if login elements are visible
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
  });

  test('redirects to dashboard after successful login', async ({ page }) => {
    // Mock Auth0 login
    await page.route('**/auth0.com/**', (route) => {
      // Mock Auth0 responses
      route.fulfill({
        status: 200,
        body: JSON.stringify({ access_token: 'mock-token' }),
      });
    });

    // Simulate login
    await page.click('[data-testid="login-button"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('displays user menu when authenticated', async ({ page }) => {
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('auth0.user', JSON.stringify({
        sub: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
      }));
    });

    await page.reload();

    // Check user menu is visible
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('logs out successfully', async ({ page }) => {
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('auth0.user', JSON.stringify({
        sub: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
      }));
    });

    await page.reload();

    // Click logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Verify redirect to login
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
  });

  test('handles auth errors gracefully', async ({ page }) => {
    // Mock auth error
    await page.route('**/auth0.com/**', (route) => {
      route.fulfill({
        status: 400,
        body: JSON.stringify({ error: 'invalid_request' }),
      });
    });

    await page.click('[data-testid="login-button"]');

    // Verify error handling
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible();
  });
});
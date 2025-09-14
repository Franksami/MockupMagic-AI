# Test Environment Setup & Guidelines

This document outlines the test infrastructure and best practices for the MockupMagic AI application.

## 🏗️ Test Architecture

The test environment is segregated into three distinct layers:

### 1. **Unit Tests**
- **Purpose**: Test individual functions and components in isolation
- **Scope**: Single module or component
- **Dependencies**: All external dependencies mocked
- **Performance**: Fast execution (< 1s per test)

### 2. **Integration Tests**
- **Purpose**: Test interaction between modules and external services
- **Scope**: Multiple modules working together
- **Dependencies**: Real local services, mocked external APIs
- **Performance**: Moderate execution (1-5s per test)

### 3. **End-to-End (E2E) Tests**
- **Purpose**: Test complete user workflows
- **Scope**: Full application stack
- **Dependencies**: Real or staging services
- **Performance**: Slower execution (5-30s per test)

---

## 🔧 Available Testing Tools

### Mock Service Worker (MSW)
```typescript
import { setupTestScenario } from '@/lib/test-utils/test-setup';

// Setup different scenarios
setupTestScenario('success');    // All services healthy
setupTestScenario('authFailure'); // Auth failures
setupTestScenario('serviceDown'); // Services unavailable
```

### Convex Mock Provider
```typescript
import { ConvexMockProvider, convexTestScenarios } from '@/lib/test-utils/convex-mock-provider';

// Wrap components for testing
<ConvexMockProvider mockData={convexTestScenarios.authenticated.mockData}>
  <YourComponent />
</ConvexMockProvider>
```

### Circuit Breaker Testing
```typescript
import { getConvexCircuitBreaker } from '@/lib/circuit-breaker';

// Test circuit breaker behavior
const breaker = getConvexCircuitBreaker();
breaker.forceClose(); // Reset for testing
```

---

## 📋 Test Environment Configuration

### Unit Tests Configuration
```typescript
// jest.config.js or vitest.config.ts
{
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/lib/test-utils/jest-setup.ts'],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}
```

### Integration Tests Configuration
```typescript
// playwright.config.ts or similar
{
  testDir: './tests/integration',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
}
```

### E2E Tests Configuration
```typescript
// playwright.config.ts
{
  testDir: './tests/e2e',
  projects: [
    { name: 'Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'Firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'Safari', use: { ...devices['Desktop Safari'] } },
  ],
}
```

---

## 🧪 Test Examples

### Unit Test Example
```typescript
// components/auth/LoginButton.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { renderWithConvex } from '@/lib/test-utils/convex-mock-provider';
import { LoginButton } from './LoginButton';

describe('LoginButton', () => {
  it('should render login button when unauthenticated', () => {
    const { wrapper } = renderWithConvex(
      <LoginButton />,
      'unauthenticated'
    );

    render(<LoginButton />, { wrapper });

    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should handle authentication success', async () => {
    const { wrapper } = renderWithConvex(
      <LoginButton />,
      'authenticated'
    );

    render(<LoginButton />, { wrapper });

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });
});
```

### Integration Test Example
```typescript
// tests/integration/auth-flow.test.ts
import { test, expect } from '@playwright/test';
import { setupTestScenario } from '@/lib/test-utils/test-setup';

test.describe('Authentication Flow', () => {
  test.beforeEach(async () => {
    setupTestScenario('success');
  });

  test('should complete full auth flow', async ({ page }) => {
    await page.goto('/');

    // Click login button
    await page.click('[data-testid="login-button"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Should show user info
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
  });
});
```

### E2E Test Example
```typescript
// tests/e2e/mockup-creation.test.ts
import { test, expect } from '@playwright/test';

test.describe('Mockup Creation Workflow', () => {
  test('should create mockup from upload to download', async ({ page }) => {
    // Navigate to studio
    await page.goto('/studio');

    // Upload file
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/sample.png');

    // Select template
    await page.click('[data-testid="template-selector"] .template-item:first-child');

    // Generate mockup
    await page.click('[data-testid="generate-button"]');

    // Wait for completion
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible();

    // Verify download works
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-button"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.png$/);
  });
});
```

---

## 🎯 Best Practices

### Test Isolation
```typescript
// ✅ Good: Each test is independent
describe('UserProfile', () => {
  beforeEach(() => {
    resetTestEnvironment();
  });

  it('should render user info', () => {
    // Test implementation
  });
});

// ❌ Bad: Tests depend on each other
let userState;
describe('UserProfile', () => {
  it('should login user', () => {
    userState = login(); // State carries over
  });

  it('should show user info', () => {
    expect(userState).toBeDefined(); // Depends on previous test
  });
});
```

### Mock Data Management
```typescript
// ✅ Good: Use test data factories
import { testData } from '@/lib/test-utils/test-setup';

const mockUser = testData.convexUser.starter;

// ❌ Bad: Inline mock data
const mockUser = {
  _id: 'user123',
  email: 'test@example.com',
  // ... repeated in many tests
};
```

### Error Testing
```typescript
// ✅ Good: Test both success and failure scenarios
describe('AuthService', () => {
  it('should handle successful authentication', async () => {
    setupTestScenario('success');
    // Test success path
  });

  it('should handle authentication failure', async () => {
    setupTestScenario('authFailure');
    // Test error path
  });

  it('should handle service unavailable', async () => {
    setupTestScenario('serviceDown');
    // Test fallback behavior
  });
});
```

---

## 📊 Test Performance Targets

### Unit Tests
- **Speed**: < 1 second per test
- **Coverage**: > 80% line coverage
- **Isolation**: 100% mocked dependencies

### Integration Tests
- **Speed**: < 5 seconds per test
- **Coverage**: > 70% integration paths
- **Reliability**: > 95% pass rate

### E2E Tests
- **Speed**: < 30 seconds per test
- **Coverage**: > 90% user journeys
- **Reliability**: > 90% pass rate

---

## 🐛 Debugging Failed Tests

### Common Issues and Solutions

**Issue**: `ConvexError: Function not found`
```typescript
// Solution: Use mock provider
import { ConvexMockProvider } from '@/lib/test-utils/convex-mock-provider';

<ConvexMockProvider>
  <YourComponent />
</ConvexMockProvider>
```

**Issue**: `Network request failed`
```typescript
// Solution: Ensure MSW is setup
import { setupTestScenario } from '@/lib/test-utils/test-setup';

beforeEach(() => {
  setupTestScenario('success');
});
```

**Issue**: `Circuit breaker is OPEN`
```typescript
// Solution: Reset circuit breaker
import { getConvexCircuitBreaker } from '@/lib/circuit-breaker';

beforeEach(() => {
  getConvexCircuitBreaker().forceClose();
});
```

---

## 📈 Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:unit

  integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:integration

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
```

This test infrastructure provides comprehensive coverage while maintaining clear boundaries between test types and ensuring reliable, fast test execution.
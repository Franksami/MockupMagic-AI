#!/usr/bin/env tsx

/**
 * Whop Integration Validation Script
 *
 * This script validates your Whop integration configuration and tests
 * all critical components to ensure everything is properly set up.
 *
 * Usage:
 *   npm run validate:whop
 *   tsx scripts/validate-whop-integration.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
// @ts-ignore
import chalk from 'chalk';
// @ts-ignore
import ora from 'ora';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

interface ValidationResult {
  category: string;
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
  }[];
}

class WhopIntegrationValidator {
  private results: ValidationResult[] = [];
  private hasErrors = false;
  private hasWarnings = false;

  async validate() {
    console.log(chalk.bold.blue('\n🔍 Whop Integration Validator\n'));
    console.log(chalk.gray('This script will validate your Whop integration setup.\n'));

    // Run all validation checks
    await this.validateEnvironmentVariables();
    await this.validateWhopProducts();
    await this.validateAPIConnectivity();
    await this.validateWebhookConfiguration();
    await this.validateConvexIntegration();
    await this.validateCreditSystem();

    // Display results
    this.displayResults();

    // Exit with appropriate code
    process.exit(this.hasErrors ? 1 : 0);
  }

  private async validateEnvironmentVariables() {
    const spinner = ora('Validating environment variables...').start();
    const checks: ValidationResult['checks'] = [];

    // Core Whop variables
    const requiredVars = [
      'NEXT_PUBLIC_WHOP_APP_ID',
      'WHOP_API_KEY',
      'WHOP_WEBHOOK_SECRET',
      'NEXT_PUBLIC_CONVEX_URL',
      'CONVEX_DEPLOY_KEY',
      'REPLICATE_API_TOKEN',
      'OPENAI_API_KEY',
    ];

    const productVars = [
      'NEXT_PUBLIC_WHOP_STARTER_PRODUCT_ID',
      'NEXT_PUBLIC_WHOP_GROWTH_PRODUCT_ID',
      'NEXT_PUBLIC_WHOP_PRO_PRODUCT_ID',
    ];

    const creditPackVars = [
      'WHOP_SMALL_CREDIT_PLAN_ID',
      'WHOP_MEDIUM_CREDIT_PLAN_ID',
      'WHOP_LARGE_CREDIT_PLAN_ID',
    ];

    // Check required variables
    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (!value) {
        checks.push({
          name: varName,
          status: 'fail',
          message: 'Not set',
        });
        this.hasErrors = true;
      } else if (value.includes('your_') || value.includes('fallback')) {
        checks.push({
          name: varName,
          status: 'warning',
          message: 'Using placeholder value',
        });
        this.hasWarnings = true;
      } else {
        checks.push({
          name: varName,
          status: 'pass',
          message: 'Set correctly',
        });
      }
    }

    // Check product variables
    for (const varName of productVars) {
      const value = process.env[varName];
      if (!value) {
        checks.push({
          name: varName,
          status: 'fail',
          message: 'Not set - Create product in Whop dashboard',
        });
        this.hasErrors = true;
      } else if (value.includes('prod_your_') || value.includes('xxx')) {
        checks.push({
          name: varName,
          status: 'warning',
          message: 'Using placeholder - Replace with actual product ID',
        });
        this.hasWarnings = true;
      } else {
        checks.push({
          name: varName,
          status: 'pass',
          message: 'Product ID configured',
        });
      }
    }

    // Check credit pack variables
    for (const varName of creditPackVars) {
      const value = process.env[varName];
      if (!value) {
        checks.push({
          name: varName,
          status: 'fail',
          message: 'Not set - Create plan in Whop dashboard',
        });
        this.hasErrors = true;
      } else if (value.includes('plan_your_') || value.includes('xxx')) {
        checks.push({
          name: varName,
          status: 'warning',
          message: 'Using placeholder - Replace with actual plan ID',
        });
        this.hasWarnings = true;
      } else {
        checks.push({
          name: varName,
          status: 'pass',
          message: 'Plan ID configured',
        });
      }
    }

    spinner.stop();
    this.results.push({
      category: 'Environment Variables',
      checks,
    });
  }

  private async validateWhopProducts() {
    const spinner = ora('Validating Whop product configuration...').start();
    const checks: ValidationResult['checks'] = [];

    // Check if product IDs follow Whop format
    const productIds = [
      process.env.NEXT_PUBLIC_WHOP_STARTER_PRODUCT_ID,
      process.env.NEXT_PUBLIC_WHOP_GROWTH_PRODUCT_ID,
      process.env.NEXT_PUBLIC_WHOP_PRO_PRODUCT_ID,
    ];

    const planIds = [
      process.env.WHOP_SMALL_CREDIT_PLAN_ID,
      process.env.WHOP_MEDIUM_CREDIT_PLAN_ID,
      process.env.WHOP_LARGE_CREDIT_PLAN_ID,
    ];

    // Validate product ID format
    for (const [index, id] of productIds.entries()) {
      const tierName = ['Starter', 'Growth', 'Pro'][index];
      if (id && id.startsWith('prod_') && id.length > 10) {
        checks.push({
          name: `${tierName} Product Format`,
          status: 'pass',
          message: 'Valid Whop product ID format',
        });
      } else if (id) {
        checks.push({
          name: `${tierName} Product Format`,
          status: 'warning',
          message: 'Invalid product ID format',
        });
        this.hasWarnings = true;
      }
    }

    // Validate plan ID format
    for (const [index, id] of planIds.entries()) {
      const packName = ['Small', 'Medium', 'Large'][index];
      if (id && id.startsWith('plan_') && id.length > 10) {
        checks.push({
          name: `${packName} Pack Format`,
          status: 'pass',
          message: 'Valid Whop plan ID format',
        });
      } else if (id) {
        checks.push({
          name: `${packName} Pack Format`,
          status: 'warning',
          message: 'Invalid plan ID format',
        });
        this.hasWarnings = true;
      }
    }

    spinner.stop();
    this.results.push({
      category: 'Whop Product Configuration',
      checks,
    });
  }

  private async validateAPIConnectivity() {
    const spinner = ora('Testing API connectivity...').start();
    const checks: ValidationResult['checks'] = [];

    // Test Whop API connectivity
    if (process.env.WHOP_API_KEY && !process.env.WHOP_API_KEY.includes('your_')) {
      try {
        const response = await fetch('https://api.whop.com/v5/me', {
          headers: {
            Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
          },
        });

        if (response.ok) {
          checks.push({
            name: 'Whop API Connection',
            status: 'pass',
            message: 'Successfully connected to Whop API',
          });
        } else if (response.status === 401) {
          checks.push({
            name: 'Whop API Connection',
            status: 'fail',
            message: 'Invalid API key - Check your WHOP_API_KEY',
          });
          this.hasErrors = true;
        } else {
          checks.push({
            name: 'Whop API Connection',
            status: 'warning',
            message: `API returned status ${response.status}`,
          });
          this.hasWarnings = true;
        }
      } catch (error) {
        checks.push({
          name: 'Whop API Connection',
          status: 'fail',
          message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
        this.hasErrors = true;
      }
    } else {
      checks.push({
        name: 'Whop API Connection',
        status: 'warning',
        message: 'Skipped - No valid API key',
      });
      this.hasWarnings = true;
    }

    // Test Convex connectivity
    if (process.env.NEXT_PUBLIC_CONVEX_URL) {
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_CONVEX_URL);
        if (response.ok || response.status === 404) {
          checks.push({
            name: 'Convex Connection',
            status: 'pass',
            message: 'Convex endpoint accessible',
          });
        } else {
          checks.push({
            name: 'Convex Connection',
            status: 'warning',
            message: `Convex returned status ${response.status}`,
          });
          this.hasWarnings = true;
        }
      } catch (error) {
        checks.push({
          name: 'Convex Connection',
          status: 'fail',
          message: 'Cannot reach Convex endpoint',
        });
        this.hasErrors = true;
      }
    }

    spinner.stop();
    this.results.push({
      category: 'API Connectivity',
      checks,
    });
  }

  private async validateWebhookConfiguration() {
    const spinner = ora('Validating webhook configuration...').start();
    const checks: ValidationResult['checks'] = [];

    // Check webhook secret format
    const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;
    if (webhookSecret && webhookSecret.startsWith('whsec_')) {
      checks.push({
        name: 'Webhook Secret Format',
        status: 'pass',
        message: 'Valid webhook secret format',
      });
    } else if (webhookSecret) {
      checks.push({
        name: 'Webhook Secret Format',
        status: 'warning',
        message: 'Webhook secret doesn\'t match expected format',
      });
      this.hasWarnings = true;
    } else {
      checks.push({
        name: 'Webhook Secret Format',
        status: 'fail',
        message: 'No webhook secret configured',
      });
      this.hasErrors = true;
    }

    // Test webhook endpoint health check
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/webhooks/whop-payment`);

      if (response.ok) {
        const data = await response.json();
        checks.push({
          name: 'Webhook Endpoint',
          status: 'pass',
          message: 'Webhook endpoint is accessible',
        });

        if (data.configured) {
          checks.push({
            name: 'Webhook Configuration',
            status: 'pass',
            message: 'Webhook secret is configured',
          });
        }
      } else {
        checks.push({
          name: 'Webhook Endpoint',
          status: 'warning',
          message: `Endpoint returned status ${response.status}`,
        });
        this.hasWarnings = true;
      }
    } catch (error) {
      checks.push({
        name: 'Webhook Endpoint',
        status: 'warning',
        message: 'Cannot test webhook endpoint locally',
      });
      this.hasWarnings = true;
    }

    spinner.stop();
    this.results.push({
      category: 'Webhook Configuration',
      checks,
    });
  }

  private async validateConvexIntegration() {
    const spinner = ora('Validating Convex integration...').start();
    const checks: ValidationResult['checks'] = [];

    // Check Convex URL format
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (convexUrl && convexUrl.includes('.convex.cloud')) {
      checks.push({
        name: 'Convex URL Format',
        status: 'pass',
        message: 'Valid Convex deployment URL',
      });
    } else if (convexUrl) {
      checks.push({
        name: 'Convex URL Format',
        status: 'warning',
        message: 'Unusual Convex URL format',
      });
      this.hasWarnings = true;
    } else {
      checks.push({
        name: 'Convex URL Format',
        status: 'fail',
        message: 'No Convex URL configured',
      });
      this.hasErrors = true;
    }

    // Check Convex deploy key
    if (process.env.CONVEX_DEPLOY_KEY) {
      checks.push({
        name: 'Convex Deploy Key',
        status: 'pass',
        message: 'Deploy key configured',
      });
    } else {
      checks.push({
        name: 'Convex Deploy Key',
        status: 'warning',
        message: 'No deploy key - Cannot deploy to production',
      });
      this.hasWarnings = true;
    }

    spinner.stop();
    this.results.push({
      category: 'Convex Backend Integration',
      checks,
    });
  }

  private async validateCreditSystem() {
    const spinner = ora('Validating credit system configuration...').start();
    const checks: ValidationResult['checks'] = [];

    // Check credit pack configuration
    const creditPacks = {
      small: {
        planId: process.env.WHOP_SMALL_CREDIT_PLAN_ID,
        credits: 100,
        price: 12,
      },
      medium: {
        planId: process.env.WHOP_MEDIUM_CREDIT_PLAN_ID,
        credits: 500,
        price: 50,
      },
      large: {
        planId: process.env.WHOP_LARGE_CREDIT_PLAN_ID,
        credits: 1000,
        price: 90,
      },
    };

    for (const [size, pack] of Object.entries(creditPacks)) {
      if (pack.planId && !pack.planId.includes('xxx')) {
        checks.push({
          name: `${size.charAt(0).toUpperCase() + size.slice(1)} Pack`,
          status: 'pass',
          message: `${pack.credits} credits for $${pack.price}`,
        });
      } else {
        checks.push({
          name: `${size.charAt(0).toUpperCase() + size.slice(1)} Pack`,
          status: 'warning',
          message: 'Not configured - Create in Whop dashboard',
        });
        this.hasWarnings = true;
      }
    }

    // Check subscription tiers
    const tiers = {
      starter: {
        productId: process.env.NEXT_PUBLIC_WHOP_STARTER_PRODUCT_ID,
        credits: 100,
      },
      growth: {
        productId: process.env.NEXT_PUBLIC_WHOP_GROWTH_PRODUCT_ID,
        credits: 500,
      },
      pro: {
        productId: process.env.NEXT_PUBLIC_WHOP_PRO_PRODUCT_ID,
        credits: 1000,
      },
    };

    for (const [tier, config] of Object.entries(tiers)) {
      if (config.productId && !config.productId.includes('xxx')) {
        checks.push({
          name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier`,
          status: 'pass',
          message: `${config.credits} credits/month`,
        });
      } else {
        checks.push({
          name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier`,
          status: 'warning',
          message: 'Not configured - Create in Whop dashboard',
        });
        this.hasWarnings = true;
      }
    }

    spinner.stop();
    this.results.push({
      category: 'Credit System Configuration',
      checks,
    });
  }

  private displayResults() {
    console.log('\n' + chalk.bold('📊 Validation Results\n'));

    for (const result of this.results) {
      console.log(chalk.bold.white(`${result.category}:`));

      for (const check of result.checks) {
        const icon = check.status === 'pass' ? '✅' :
                     check.status === 'fail' ? '❌' : '⚠️';
        const color = check.status === 'pass' ? chalk.green :
                      check.status === 'fail' ? chalk.red : chalk.yellow;

        console.log(`  ${icon} ${color(check.name)}: ${check.message}`);
      }
      console.log();
    }

    // Summary
    console.log(chalk.bold('📝 Summary:'));

    const totalChecks = this.results.reduce((sum, r) => sum + r.checks.length, 0);
    const passedChecks = this.results.reduce(
      (sum, r) => sum + r.checks.filter(c => c.status === 'pass').length,
      0
    );
    const failedChecks = this.results.reduce(
      (sum, r) => sum + r.checks.filter(c => c.status === 'fail').length,
      0
    );
    const warningChecks = this.results.reduce(
      (sum, r) => sum + r.checks.filter(c => c.status === 'warning').length,
      0
    );

    console.log(chalk.green(`  ✅ Passed: ${passedChecks}/${totalChecks}`));
    if (warningChecks > 0) {
      console.log(chalk.yellow(`  ⚠️ Warnings: ${warningChecks}`));
    }
    if (failedChecks > 0) {
      console.log(chalk.red(`  ❌ Failed: ${failedChecks}`));
    }

    // Next steps
    if (this.hasErrors) {
      console.log('\n' + chalk.red.bold('❌ Integration has critical issues that must be resolved.'));
      console.log(chalk.red('Please fix the failed checks before proceeding.\n'));
    } else if (this.hasWarnings) {
      console.log('\n' + chalk.yellow.bold('⚠️ Integration is partially configured.'));
      console.log(chalk.yellow('Review the warnings and complete setup in Whop dashboard.\n'));
      console.log(chalk.bold('Next Steps:'));
      console.log('1. Create products and plans in Whop dashboard');
      console.log('2. Update .env.local with actual IDs');
      console.log('3. Configure webhook endpoint in Whop settings');
      console.log('4. Run this validator again to confirm\n');
    } else {
      console.log('\n' + chalk.green.bold('✅ Whop integration is fully configured!'));
      console.log(chalk.green('Your integration is ready for testing.\n'));
      console.log(chalk.bold('Next Steps:'));
      console.log('1. Run: npm run test:whop');
      console.log('2. Test in Whop iframe context');
      console.log('3. Complete a test purchase');
      console.log('4. Monitor webhook logs\n');
    }
  }
}

// Run validator
const validator = new WhopIntegrationValidator();
validator.validate().catch(console.error);
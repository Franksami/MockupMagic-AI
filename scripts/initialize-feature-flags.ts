#!/usr/bin/env tsx

/**
 * Initialize feature flags in Convex database
 * Run this script to set up initial feature flags for the MockupMagic redesign
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function initializeFeatureFlags() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    console.error('❌ NEXT_PUBLIC_CONVEX_URL is not set in environment variables');
    process.exit(1);
  }

  console.log('🔄 Connecting to Convex...');
  const client = new ConvexHttpClient(convexUrl);

  const featureFlags = [
    {
      key: 'theme_migration',
      enabled: true,
      rolloutPercentage: 100,
      description: 'Enable new orange theme (#FA4616) migration',
      userGroups: ['all']
    },
    {
      key: 'app_shell',
      enabled: true,
      rolloutPercentage: 100,
      description: 'Enable new AppShell architecture with NavigationSidebar',
      userGroups: ['all']
    },
    {
      key: 'oklch_colors',
      enabled: true,
      rolloutPercentage: 100,
      description: 'Use OKLCH color system for perceptually uniform colors',
      userGroups: ['all']
    },
    {
      key: 'ai_workspace',
      enabled: true,
      rolloutPercentage: 100,
      description: 'Enable professional AI workspace features',
      userGroups: ['all']
    },
    {
      key: 'glass_morphism',
      enabled: true,
      rolloutPercentage: 100,
      description: 'Enable glass morphism UI effects',
      userGroups: ['all']
    },
    {
      key: 'legacy_ui',
      enabled: false,
      rolloutPercentage: 0,
      description: 'Fallback to legacy purple theme UI (deprecated)',
      userGroups: []
    }
  ];

  console.log('📝 Initializing feature flags...\n');

  for (const flag of featureFlags) {
    try {
      // Check if flag already exists
      const existingFlags = await client.query(api.functions.featureFlags.list);
      const existing = existingFlags.find((f: any) => f.key === flag.key);

      if (existing) {
        // Update existing flag
        await client.mutation(api.functions.featureFlags.update, {
          id: existing._id,
          enabled: flag.enabled,
          rolloutPercentage: flag.rolloutPercentage,
          userGroups: flag.userGroups,
          description: flag.description
        });
        console.log(`✅ Updated: ${flag.key} (${flag.enabled ? 'enabled' : 'disabled'})`);
      } else {
        // Create new flag
        await client.mutation(api.functions.featureFlags.create, {
          key: flag.key,
          enabled: flag.enabled,
          rolloutPercentage: flag.rolloutPercentage,
          userGroups: flag.userGroups,
          description: flag.description
        });
        console.log(`✅ Created: ${flag.key} (${flag.enabled ? 'enabled' : 'disabled'})`);
      }
    } catch (error) {
      console.error(`❌ Failed to initialize ${flag.key}:`, error);
    }
  }

  console.log('\n🎉 Feature flags initialization complete!');
  console.log('📊 Summary:');
  console.log(`   - Theme Migration: ENABLED`);
  console.log(`   - App Shell: ENABLED`);
  console.log(`   - OKLCH Colors: ENABLED`);
  console.log(`   - AI Workspace: ENABLED`);
  console.log(`   - Glass Morphism: ENABLED`);
  console.log(`   - Legacy UI: DISABLED (fallback)`);

  console.log('\n💡 You can modify these flags at runtime through the Convex dashboard');
  console.log('   or by using the feature flags API endpoints.');
}

// Run the initialization
initializeFeatureFlags()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Initialization failed:', error);
    process.exit(1);
  });
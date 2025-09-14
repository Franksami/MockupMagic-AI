#!/usr/bin/env node
/**
 * Automated Color Migration Script
 * Migrates purple theme (#8b5cf6) to Whop Dragon Fire Orange (#FA4616)
 */

import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';

interface MigrationConfig {
  dryRun: boolean;
  backup: boolean;
  verbose: boolean;
  skipFiles: string[];
  targetFiles: string[];
}

interface ColorMapping {
  old: string | RegExp;
  new: string;
  description: string;
}

class ColorMigrator {
  private config: MigrationConfig;
  private colorMappings: ColorMapping[] = [
    // Hex color mappings
    { old: /#8b5cf6/gi, new: '#FA4616', description: 'Primary purple to orange' },
    { old: /#a78bfa/gi, new: '#ff7c3f', description: 'Light purple to light orange' },
    { old: /#7c3aed/gi, new: '#ea2e0f', description: 'Dark purple to dark orange' },
    { old: /#6d28d9/gi, new: '#c21e0f', description: 'Darker purple to darker orange' },
    { old: /#5b21b6/gi, new: '#9a1a13', description: 'Darkest purple to darkest orange' },

    // Tailwind class mappings
    { old: /purple-50/g, new: 'primary-50', description: 'Tailwind purple-50' },
    { old: /purple-100/g, new: 'primary-100', description: 'Tailwind purple-100' },
    { old: /purple-200/g, new: 'primary-200', description: 'Tailwind purple-200' },
    { old: /purple-300/g, new: 'primary-300', description: 'Tailwind purple-300' },
    { old: /purple-400/g, new: 'primary-400', description: 'Tailwind purple-400' },
    { old: /purple-500/g, new: 'primary-500', description: 'Tailwind purple-500' },
    { old: /purple-600/g, new: 'primary-600', description: 'Tailwind purple-600' },
    { old: /purple-700/g, new: 'primary-700', description: 'Tailwind purple-700' },
    { old: /purple-800/g, new: 'primary-800', description: 'Tailwind purple-800' },
    { old: /purple-900/g, new: 'primary-900', description: 'Tailwind purple-900' },
    { old: /purple-950/g, new: 'primary-950', description: 'Tailwind purple-950' },

    // CSS variable mappings
    { old: /--color-purple/g, new: '--color-primary', description: 'CSS variable purple' },
    { old: /--purple/g, new: '--primary', description: 'CSS variable short purple' },

    // RGB/RGBA mappings (purple: rgb(139, 92, 246))
    { old: /rgb\(139,\s*92,\s*246\)/gi, new: 'rgb(250, 70, 22)', description: 'RGB purple to orange' },
    { old: /rgba\(139,\s*92,\s*246,/gi, new: 'rgba(250, 70, 22,', description: 'RGBA purple to orange' },

    // HSL mappings (purple: hsl(271, 91%, 65%))
    { old: /hsl\(271,\s*91%,\s*65%\)/gi, new: 'hsl(14, 95%, 53%)', description: 'HSL purple to orange' },
    { old: /hsla\(271,\s*91%,\s*65%,/gi, new: 'hsla(14, 95%, 53%,', description: 'HSLA purple to orange' },
  ];

  private stats = {
    filesScanned: 0,
    filesModified: 0,
    totalReplacements: 0,
    backupsCreated: 0,
    errors: [] as string[],
  };

  constructor(config: MigrationConfig) {
    this.config = config;
  }

  async migrate(): Promise<void> {
    console.log(chalk.blue.bold('\n🎨 Starting Color Migration\n'));
    console.log(chalk.gray('Configuration:'));
    console.log(chalk.gray(`  Dry Run: ${this.config.dryRun}`));
    console.log(chalk.gray(`  Backup: ${this.config.backup}`));
    console.log(chalk.gray(`  Verbose: ${this.config.verbose}\n`));

    // Find files to migrate
    const files = await this.findFiles();
    console.log(chalk.cyan(`📁 Found ${files.length} files to scan\n`));

    // Create backup directory if needed
    if (this.config.backup && !this.config.dryRun) {
      await this.createBackupDirectory();
    }

    // Process each file
    for (const file of files) {
      await this.processFile(file);
    }

    // Print summary
    this.printSummary();
  }

  private async findFiles(): Promise<string[]> {
    const patterns = this.config.targetFiles.length > 0
      ? this.config.targetFiles
      : [
        'src/**/*.{tsx,ts,jsx,js,css,scss}',
        'app/**/*.{tsx,ts,jsx,js,css,scss}',
        'components/**/*.{tsx,ts,jsx,js,css,scss}',
        'styles/**/*.{css,scss}',
        'tailwind.config.{js,ts}',
      ];

    const allFiles: string[] = [];
    for (const pattern of patterns) {
      const files = await glob(pattern, {
        ignore: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/.next/**',
          ...this.config.skipFiles,
        ],
      });
      allFiles.push(...files);
    }

    return [...new Set(allFiles)]; // Remove duplicates
  }

  private async createBackupDirectory(): Promise<void> {
    const backupDir = path.join(process.cwd(), '.color-migration-backup', new Date().toISOString());
    await fs.mkdir(backupDir, { recursive: true });
    console.log(chalk.green(`✅ Backup directory created: ${backupDir}\n`));
  }

  private async processFile(filePath: string): Promise<void> {
    this.stats.filesScanned++;

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let modifiedContent = content;
      let replacementCount = 0;

      // Apply color mappings
      for (const mapping of this.colorMappings) {
        const matches = content.match(mapping.old) || [];
        if (matches.length > 0) {
          modifiedContent = modifiedContent.replace(mapping.old, mapping.new);
          replacementCount += matches.length;

          if (this.config.verbose) {
            console.log(chalk.yellow(`  ${mapping.description}: ${matches.length} replacements`));
          }
        }
      }

      // If changes were made
      if (replacementCount > 0) {
        this.stats.filesModified++;
        this.stats.totalReplacements += replacementCount;

        console.log(chalk.green(`✏️  ${filePath}`));
        console.log(chalk.gray(`   ${replacementCount} color references updated`));

        if (!this.config.dryRun) {
          // Create backup if needed
          if (this.config.backup) {
            await this.backupFile(filePath, content);
          }

          // Write modified content
          await fs.writeFile(filePath, modifiedContent, 'utf-8');
        }
      } else if (this.config.verbose) {
        console.log(chalk.gray(`⚪ ${filePath} (no changes)`));
      }
    } catch (error) {
      this.stats.errors.push(`${filePath}: ${error}`);
      console.error(chalk.red(`❌ Error processing ${filePath}: ${error}`));
    }
  }

  private async backupFile(filePath: string, content: string): Promise<void> {
    const backupDir = path.join(
      process.cwd(),
      '.color-migration-backup',
      new Date().toISOString()
    );
    const backupPath = path.join(backupDir, filePath);
    const backupDirPath = path.dirname(backupPath);

    await fs.mkdir(backupDirPath, { recursive: true });
    await fs.writeFile(backupPath, content, 'utf-8');
    this.stats.backupsCreated++;
  }

  private printSummary(): void {
    console.log(chalk.blue.bold('\n📊 Migration Summary\n'));
    console.log(chalk.white(`Files Scanned:      ${this.stats.filesScanned}`));
    console.log(chalk.white(`Files Modified:     ${this.stats.filesModified}`));
    console.log(chalk.white(`Total Replacements: ${this.stats.totalReplacements}`));

    if (this.config.backup) {
      console.log(chalk.white(`Backups Created:    ${this.stats.backupsCreated}`));
    }

    if (this.stats.errors.length > 0) {
      console.log(chalk.red(`\nErrors (${this.stats.errors.length}):`));
      this.stats.errors.forEach(error => {
        console.log(chalk.red(`  - ${error}`));
      });
    }

    if (this.config.dryRun) {
      console.log(chalk.yellow('\n⚠️  This was a dry run. No files were actually modified.'));
      console.log(chalk.yellow('   Run without --dry-run to apply changes.'));
    } else {
      console.log(chalk.green('\n✅ Migration completed successfully!'));
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  const config: MigrationConfig = {
    dryRun: args.includes('--dry-run'),
    backup: !args.includes('--no-backup'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    skipFiles: [],
    targetFiles: [],
  };

  // Parse skip files
  const skipIndex = args.indexOf('--skip');
  if (skipIndex !== -1 && args[skipIndex + 1]) {
    config.skipFiles = args[skipIndex + 1].split(',');
  }

  // Parse target files
  const targetIndex = args.indexOf('--target');
  if (targetIndex !== -1 && args[targetIndex + 1]) {
    config.targetFiles = args[targetIndex + 1].split(',');
  }

  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${chalk.bold('Color Migration Script')}

${chalk.bold('Usage:')}
  npm run migrate-colors [options]

${chalk.bold('Options:')}
  --dry-run         Preview changes without modifying files
  --no-backup       Skip creating backup files
  --verbose, -v     Show detailed output
  --skip <files>    Comma-separated list of files to skip
  --target <files>  Comma-separated list of specific files to migrate
  --help, -h        Show this help message

${chalk.bold('Examples:')}
  npm run migrate-colors --dry-run
  npm run migrate-colors --verbose
  npm run migrate-colors --target "src/app/page.tsx,src/styles/globals.css"
    `);
    process.exit(0);
  }

  const migrator = new ColorMigrator(config);
  await migrator.migrate();
}

// Run the migration
main().catch(error => {
  console.error(chalk.red.bold('\n❌ Migration failed:'), error);
  process.exit(1);
});
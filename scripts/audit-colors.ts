#!/usr/bin/env node
/**
 * Color Usage Audit Script
 * Scans codebase for all color references and generates migration report
 */

import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

interface ColorUsage {
  file: string;
  line: number;
  column: number;
  context: string;
  type: 'hex' | 'tailwind' | 'css-var' | 'named';
}

class ColorAuditor {
  private colorPatterns = {
    purple: /#8b5cf6/gi,
    purpleNamed: /purple/gi,
    violet: /violet/gi,
    tailwindPurple: /(?:bg|text|border|ring|shadow)-purple-\d{2,3}/gi,
    cssVariables: /--color-(?:purple|violet|primary)/gi,
  };

  private results: ColorUsage[] = [];

  async audit(): Promise<void> {
    console.log('🔍 Starting color audit...\n');

    // Find all relevant files
    const files = await glob('src/**/*.{tsx,ts,css,scss}', {
      ignore: ['**/node_modules/**', '**/dist/**'],
    });

    console.log(`📁 Found ${files.length} files to audit\n`);

    for (const file of files) {
      await this.auditFile(file);
    }

    await this.generateReport();
  }

  private async auditFile(filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for hex colors
      if (this.colorPatterns.purple.test(line)) {
        this.results.push({
          file: filePath,
          line: index + 1,
          column: line.indexOf('#8b5cf6') + 1,
          context: line.trim(),
          type: 'hex',
        });
      }

      // Check for Tailwind classes
      const tailwindMatch = line.match(this.colorPatterns.tailwindPurple);
      if (tailwindMatch) {
        this.results.push({
          file: filePath,
          line: index + 1,
          column: line.indexOf(tailwindMatch[0]) + 1,
          context: line.trim(),
          type: 'tailwind',
        });
      }

      // Check for CSS variables
      if (this.colorPatterns.cssVariables.test(line)) {
        this.results.push({
          file: filePath,
          line: index + 1,
          column: 0,
          context: line.trim(),
          type: 'css-var',
        });
      }

      // Check for named colors
      if (this.colorPatterns.purpleNamed.test(line) ||
          this.colorPatterns.violet.test(line)) {
        this.results.push({
          file: filePath,
          line: index + 1,
          column: 0,
          context: line.trim(),
          type: 'named',
        });
      }
    });
  }

  private async generateReport(): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      totalFiles: new Set(this.results.map(r => r.file)).size,
      totalInstances: this.results.length,
      byType: {
        hex: this.results.filter(r => r.type === 'hex').length,
        tailwind: this.results.filter(r => r.type === 'tailwind').length,
        cssVar: this.results.filter(r => r.type === 'css-var').length,
        named: this.results.filter(r => r.type === 'named').length,
      },
      details: this.results,
    };

    // Save report
    const reportPath = path.join(process.cwd(), 'color-audit-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Print summary
    console.log('📊 AUDIT SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`Total Files Affected: ${report.totalFiles}`);
    console.log(`Total Color References: ${report.totalInstances}`);
    console.log('\n📈 BY TYPE:');
    console.log(`  Hex Colors: ${report.byType.hex}`);
    console.log(`  Tailwind Classes: ${report.byType.tailwind}`);
    console.log(`  CSS Variables: ${report.byType.cssVar}`);
    console.log(`  Named References: ${report.byType.named}`);
    console.log('\n✅ Report saved to: color-audit-report.json');
  }
}

// Run audit
const auditor = new ColorAuditor();
auditor.audit().catch(console.error);
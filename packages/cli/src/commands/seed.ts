import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { createClient } from '@clickquery/core';

export async function seed(options: any) {
  const spinner = ora('Seeding database').start();

  try {
    // Load config
    const configPath = path.join(process.cwd(), 'clickquery.config.json');
    if (!fs.existsSync(configPath)) {
      throw new Error('Configuration file not found. Run `clickquery init` first.');
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const db = createClient(config);

    // Get seed file
    const seedPath = options.file
      ? path.join(process.cwd(), options.file)
      : path.join(process.cwd(), 'seeds', 'index.ts');

    if (!fs.existsSync(seedPath)) {
      throw new Error('Seed file not found. Create a seed file or specify one with --file');
    }

    // Import and run seed file
    const seedModule = await import(seedPath);
    if (typeof seedModule.default !== 'function') {
      throw new Error('Seed file must export a default function');
    }

    await seedModule.default(db);
    spinner.succeed('Database seeded successfully!');
  } catch (error) {
    spinner.fail('Seeding failed');
    console.error(chalk.red(error));
    process.exit(1);
  }
} 
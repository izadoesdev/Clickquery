import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { createClient } from '@clickquery/core';

export async function migrate(options: any) {
  const spinner = ora('Running migrations').start();

  try {
    // Load config
    const configPath = path.join(process.cwd(), 'clickquery.config.json');
    if (!fs.existsSync(configPath)) {
      throw new Error('Configuration file not found. Run `clickquery init` first.');
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const db = createClient(config);

    // Get migrations directory
    const migrationsDir = path.join(process.cwd(), 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      throw new Error('Migrations directory not found. Run `clickquery init` first.');
    }

    // Get migration files
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.ts'))
      .sort();

    if (files.length === 0) {
      spinner.succeed('No migrations to run');
      return;
    }

    // Create migrations table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id String,
        name String,
        executed_at DateTime64(3),
        PRIMARY KEY (id)
      ) ENGINE = MergeTree()
      ORDER BY (id)
    `);

    // Get executed migrations
    const executedMigrations = await db.query<{ id: string }>(
      'SELECT id FROM migrations'
    );

    const executedIds = new Set(executedMigrations.map(m => m.id));

    if (options.down) {
      // Rollback migrations
      const filesToRollback = files
        .filter(file => executedIds.has(file))
        .reverse()
        .slice(0, options.step ? parseInt(options.step) : 1);

      for (const file of filesToRollback) {
        spinner.text = `Rolling back ${file}`;
        const migration = await import(path.join(migrationsDir, file));
        await migration.down(db);
        await db.query('DELETE FROM migrations WHERE id = {id:String}', {
          id: file,
        });
      }

      spinner.succeed(`Rolled back ${filesToRollback.length} migration(s)`);
    } else {
      // Run migrations
      const filesToRun = files
        .filter(file => !executedIds.has(file))
        .slice(0, options.step ? parseInt(options.step) : undefined);

      for (const file of filesToRun) {
        spinner.text = `Running ${file}`;
        const migration = await import(path.join(migrationsDir, file));
        await migration.up(db);
        await db.query(
          'INSERT INTO migrations (id, name, executed_at) VALUES ({id:String}, {name:String}, {executed_at:DateTime64(3)})',
          {
            id: file,
            name: file.split('_').slice(1).join('_').replace('.ts', ''),
            executed_at: new Date(),
          }
        );
      }

      spinner.succeed(`Ran ${filesToRun.length} migration(s)`);
    }
  } catch (error) {
    spinner.fail('Migration failed');
    console.error(chalk.red(error));
    process.exit(1);
  }
} 
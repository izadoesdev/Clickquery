#!/usr/bin/env node
import { Command } from 'commander';
import { createClient } from '@clickquery/core';
import chalk from 'chalk';
import figlet from 'figlet';
import { init } from './commands/init';
import { generate } from './commands/generate';
import { migrate } from './commands/migrate';
import { seed } from './commands/seed';

const program = new Command();

console.log(
  chalk.blue(
    figlet.textSync('ClickQuery', {
      font: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default',
      width: 80,
      whitespaceBreak: true,
    })
  )
);

program
  .name('clickquery')
  .description('CLI tool for managing ClickQuery projects')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize a new ClickQuery project')
  .option('-d, --database <name>', 'Database name')
  .option('-h, --host <url>', 'ClickHouse host URL')
  .option('-u, --username <name>', 'Database username')
  .option('-p, --password <password>', 'Database password')
  .action(init);

program
  .command('generate')
  .description('Generate a new model or migration')
  .argument('<type>', 'Type of file to generate (model|migration)')
  .argument('<name>', 'Name of the file to generate')
  .action(generate);

program
  .command('migrate')
  .description('Run database migrations')
  .option('-d, --down', 'Rollback migrations')
  .option('-s, --step <number>', 'Number of migrations to run')
  .action(migrate);

program
  .command('seed')
  .description('Seed the database with initial data')
  .option('-f, --file <path>', 'Path to seed file')
  .action(seed);

program.parse(); 
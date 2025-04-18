import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function init(options: any) {
  const spinner = ora('Initializing ClickQuery project').start();

  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'database',
        message: 'Database name:',
        default: options.database || 'default',
      },
      {
        type: 'input',
        name: 'host',
        message: 'ClickHouse host URL:',
        default: options.host || 'http://localhost:8123',
      },
      {
        type: 'input',
        name: 'username',
        message: 'Database username:',
        default: options.username || 'default',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Database password:',
        default: options.password || '',
      },
    ]);

    const config = {
      database: answers.database,
      host: answers.host,
      username: answers.username,
      password: answers.password,
      clickhouse_settings: {
        allow_experimental_object_type: 1,
      },
    };

    // Create config file
    fs.writeFileSync(
      path.join(process.cwd(), 'clickquery.config.json'),
      JSON.stringify(config, null, 2)
    );

    // Create models directory
    const modelsDir = path.join(process.cwd(), 'models');
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir);
    }

    // Create migrations directory
    const migrationsDir = path.join(process.cwd(), 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir);
    }

    // Create example model
    const exampleModel = `import { defineModel, Str, DateTime64, Float64, UUID, JSON, ClickHouseEngine } from '@clickquery/core';

export const Event = defineModel({
  name: 'events',
  columns: {
    id: UUID(),
    timestamp: DateTime64({ precision: 3 }),
    user_id: Str(),
    event_name: Str(),
    properties: JSON(),
    value: Float64({ nullable: true }),
  },
  engine: ClickHouseEngine.MergeTree,
  orderBy: ['timestamp', 'event_name'],
  partitionBy: 'toYYYYMM(timestamp)',
});`;

    fs.writeFileSync(
      path.join(modelsDir, 'Event.ts'),
      exampleModel
    );

    spinner.succeed('Project initialized successfully!');
    console.log(chalk.green('\nNext steps:'));
    console.log('1. Review the generated configuration in clickquery.config.json');
    console.log('2. Check out the example model in models/Event.ts');
    console.log('3. Run `clickquery generate model <name>` to create new models');
    console.log('4. Run `clickquery migrate` to apply migrations\n');
  } catch (error) {
    spinner.fail('Failed to initialize project');
    console.error(chalk.red(error));
    process.exit(1);
  }
} 
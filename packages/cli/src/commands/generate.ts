import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

export async function generate(type: string, name: string) {
  const spinner = ora(`Generating ${type} ${name}`).start();

  try {
    if (type === 'model') {
      const modelDir = path.join(process.cwd(), 'models');
      if (!fs.existsSync(modelDir)) {
        fs.mkdirSync(modelDir);
      }

      const modelContent = `import { defineModel, Str, DateTime64, Float64, UUID, JSON, ClickHouseEngine } from '@clickquery/core';

export const ${name} = defineModel({
  name: '${name.toLowerCase()}s',
  columns: {
    id: UUID(),
    created_at: DateTime64({ precision: 3 }),
    updated_at: DateTime64({ precision: 3 }),
  },
  engine: ClickHouseEngine.MergeTree,
  orderBy: ['created_at'],
});`;

      fs.writeFileSync(
        path.join(modelDir, `${name}.ts`),
        modelContent
      );

      spinner.succeed(`Model ${name} generated successfully!`);
    } else if (type === 'migration') {
      const migrationsDir = path.join(process.cwd(), 'migrations');
      if (!fs.existsSync(migrationsDir)) {
        fs.mkdirSync(migrationsDir);
      }

      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
      const migrationContent = `import { Migration } from '@clickquery/core';

export const up: Migration = async (db) => {
  // Add your migration code here
};

export const down: Migration = async (db) => {
  // Add your rollback code here
};`;

      fs.writeFileSync(
        path.join(migrationsDir, `${timestamp}_${name}.ts`),
        migrationContent
      );

      spinner.succeed(`Migration ${name} generated successfully!`);
    } else {
      spinner.fail(`Invalid type: ${type}`);
      console.log(chalk.red('Valid types are: model, migration'));
      process.exit(1);
    }
  } catch (error) {
    spinner.fail(`Failed to generate ${type}`);
    console.error(chalk.red(error));
    process.exit(1);
  }
} 
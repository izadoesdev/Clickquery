import { DatabaseManager } from '../schema/database';

export async function setupTestDatabase() {
  const dbManager = new DatabaseManager({
    url: 'http://default:analytics@localhost:8123/analytics'
  });
  await dbManager.initialize();
  return dbManager;
}

export async function teardownTestDatabase(dbManager: DatabaseManager) {
  if (!dbManager) return;

  try {
    const result = await dbManager.client.query<{ name: string }>(`
      SELECT name FROM system.tables WHERE database = 'analytics'
    `);

    for (const table of result.data) {
      await dbManager.dropTable(table.name);
    }
  } catch (error) {
    console.error('Failed to clean up database:', error);
  }
} 
import { describe, test, expect } from 'bun:test';
import { defineModel } from '../schema/defineModel';
import { Str, Bool, DateTime, ArrayType, JSONType, Int8, ClickHouseEngine } from '../schema/types';

describe('Schema Definition', () => {
  describe('Model Definition', () => {
    test('should create a basic model', () => {
      const User = defineModel({
        name: 'users',
        columns: {
          id: Str({ primaryKey: true }),
          username: Str({ unique: true }),
          email: Str({ nullable: true }),
          role: Int8({ default: 1 }),
          is_active: Bool({ default: true }),
          created_at: DateTime({ default: 'now()' })
        },
        engine: ClickHouseEngine.MergeTree,
        orderBy: ['id']
      });

      expect(User.name).toBe('users');
      expect(User.columns.id.options.primaryKey).toBe(true);
      expect(User.columns.username.options.unique).toBe(true);
      expect(User.columns.email.options.nullable).toBe(true);
      expect(User.engine).toBe(ClickHouseEngine.MergeTree);
    });

    test('should create a model with complex types', () => {
      const Event = defineModel({
        name: 'events',
        columns: {
          id: Str({ primaryKey: true }),
          user_id: Str({ index: true }),
          event_type: Str(),
          properties: JSONType(),
          tags: ArrayType(Str()),
          created_at: DateTime({ default: 'now()' })
        },
        engine: ClickHouseEngine.MergeTree,
        orderBy: ['created_at', 'id']
      });

      expect(Event.name).toBe('events');
      expect(Event.columns.properties.type).toBe('JSON');
      expect(Event.columns.tags.type).toBe('Array(String)');
      expect(Event.columns.user_id.options.index).toBe(true);
    });

    test('should validate model configuration', () => {
      expect(() => {
        defineModel({
          name: 'invalid',
          columns: {},
          engine: ClickHouseEngine.MergeTree,
          orderBy: []
        });
      }).toThrow('Model columns are required.');

      expect(() => {
        defineModel({
          name: 'invalid',
          columns: {
            id: Str()
          },
          engine: 'InvalidEngine' as ClickHouseEngine,
          orderBy: ['id']
        });
      }).toThrow('Invalid engine type');
    });
  });
}); 
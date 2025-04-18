import {
  Bool,
  DateType,
  Int32,
  Float64,
  ArrayType,
  TupleType,
  Nullable,
  Str,
  Enum8,
  id,
  timestamp,
  defineModel,
  IDStrategy
} from "./src";
import { ClickHouseEngine } from "./src/schema/types/base";

// Example table with default ID (UUIDv4)
export const User = defineModel({
  name: "users",
  columns: {
    id: id(),
    username: Str({ default: "John Doe", unique: true }),
    created_at: timestamp(),
    email: Nullable(Str()),
    is_active: Bool({ default: true }),
    age: Int32({ nullable: true }),
    balance: Float64({ default: 0 }),
    status: Enum8({
      active: 1,
      inactive: 0,
      pending: 2,
      banned: 3
    }, { default: 'active' }),
    tags: ArrayType(Str()),
    profile: TupleType([Str(), Int32()]),
    birthday: DateType({ nullable: true }),
  },
  engine: ClickHouseEngine.MergeTree,
  orderBy: ["created_at"],
});

// Example table with NanoID
export const Event = defineModel({
  name: "events",
  columns: {
    id: id({ strategy: IDStrategy.NanoID, size: 16 }),
    user_id: Str({ index: true }),
    event_type: Str(),
    created_at: timestamp(),
    data: ArrayType(Str()),
  },
  engine: ClickHouseEngine.MergeTree,
  orderBy: ["created_at"],
});

// Example table with UUIDv6 (time-based)
export const Log = defineModel({
  name: "logs",
  columns: {
    id: id({ strategy: IDStrategy.UUIDv6 }),
    level: Enum8({
      info: 1,
      warning: 2,
      error: 3,
      debug: 0,
    }),
    message: Str(),
    created_at: timestamp(),
    context: Nullable(Str()),
  },
  engine: ClickHouseEngine.MergeTree,
  orderBy: ["created_at"],
});

// Example with custom ID generator
export const CustomEntity = defineModel({
  name: "custom_entities",
  columns: {
    id: id({
      strategy: IDStrategy.Custom,
      customGenerator: () => `custom-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
    }),
    name: Str(),
    created_at: timestamp(),
  },
  engine: ClickHouseEngine.MergeTree,
  orderBy: ["created_at"],
});

import {
  // Base types
  Str,
  UUID,
  Bool,
  DateTime,
  DateTime64,
  DateType,
  Date32,
  id,
  timestamp,
  
  // Numeric types
  Int8,
  Int16,
  Int32,
  Int64,
  UInt8,
  UInt16,
  UInt32,
  UInt64,
  Float32,
  Float64,
  Decimal,
  Decimal64,
  
  // Complex types
  ArrayType,
  TupleType,
  MapType,
  FixedString,
  // Engine and model definition
  ClickHouseEngine,
  defineModel,
  
  // ID strategies
  IDStrategy,
  
  // Other utilities
  now,
  formatDateTime,

  // Ordering utilities
  createOrderBy,
  createPartitionBy
} from "./packages/core/src";
import { JSONType } from "./packages/core/src/schema/types/base";
import type { ClickHouseConfig } from "./packages/core/src/config";
import { defaultConfig } from "./packages/core/src/config";

// ==========================================
// SECTION 0: Database Configuration
// ==========================================

export const databaseConfig: ClickHouseConfig = {
  url: "CLICKHOUSE_URL",
  ...defaultConfig,
  settings: {
    ...defaultConfig.settings,
    // Add any database-specific settings here
    'database_atomic_delay_before_drop_table_sec': 5,
    'max_partitions_per_insert_block': 100,
  }
};

// ==========================================
// SECTION 1: Shared Enum Definitions
// ==========================================

const UserRole = {
  admin: 10,
  moderator: 5,
  user: 1,
  guest: 0
} as const;

const UserStatus = {
  active: 1,
  inactive: 0,
  pending: 2,
  suspended: 3,
  banned: 4
} as const;

const PaymentStatus = {
  created: 100,
  authorized: 200,
  pending: 300,
  completed: 400,
  failed: 500,
  refunded: 600,
  cancelled: 700
} as const;

// ==========================================
// SECTION 2: User Model
// ==========================================

export const User = defineModel({
  name: "users",
  columns: {
    id: id(),
    username: Str({ unique: true }),
    email: Str({ nullable: true, unique: true }),
    role: Int8({ default: UserRole.user }),
    status: Int8({ default: UserStatus.pending }),
    display_name: Str({ nullable: true }),
    login_count: UInt32({ default: 0 }),
    is_verified: Bool({ default: false }),
    created_at: timestamp(),
    updated_at: timestamp(),
    last_login: DateTime({ nullable: true }),
    favorite_tags: ArrayType(Str()),
    notification_settings: JSONType({
      default: { email: true, push: true, sms: false }
    }),
    locale: Str({ default: 'en-US' }),
    metadata: MapType(Str(), Str()),
  },
  engine: ClickHouseEngine.MergeTree,
  orderBy: createOrderBy([
    { column: 'created_at', direction: 'DESC' },
    { column: 'id', direction: 'ASC' }
  ]),
  partitionBy: createPartitionBy(columns => `toYYYYMM(${columns.created_at})`),
});

// ==========================================
// SECTION 3: Content with Complex Types
// ==========================================

export const Content = defineModel({
  name: "content",
  columns: {
    id: id(),
    user_id: UUID({ index: true }),
    title: Str({ nullable: true }),
    body: Str(),
    slug: FixedString(64),
    tags: ArrayType(Str()),
    view_count: UInt64({ default: 0 }),
    is_published: Bool({ default: true }),
    location: TupleType([Float64(), Float64(), Float32()], { nullable: true }),
    attributes: JSONType(),
    created_at: timestamp(),
    updated_at: timestamp(),
    relevance_score: Decimal(10, 4, { default: 0 }),
  },
  engine: ClickHouseEngine.ReplacingMergeTree,
  orderBy: createOrderBy([
    { column: 'user_id', direction: 'ASC' },
    { column: 'created_at', direction: 'DESC' }
  ]),
  partitionBy: createPartitionBy(columns => `toYYYYMM(${columns.created_at})`),
});

// ==========================================
// SECTION 4: Analytics Event Tracking
// ==========================================

export const Event = defineModel({
  name: "events",
  columns: {
    id: id(),
    session_id: Str({ index: true }),
    user_id: UUID({ nullable: true, index: true }),
    event_name: Str(),
    timestamp: DateTime64({ default: now }),
    source: Str({ nullable: true }),
    device_type: Str({ nullable: true }),
    properties: JSONType({ nullable: true }),
    duration_ms: UInt32({ nullable: true }),
    value: Float64({ nullable: true }),
  },
  engine: ClickHouseEngine.MergeTree,
  orderBy: createOrderBy([
    { column: 'timestamp', direction: 'DESC' },
    { column: 'event_name', direction: 'ASC' }
  ]),
  partitionBy: createPartitionBy(columns => `toDate(${columns.timestamp})`),
});

// ==========================================
// SECTION 5: Payment Transactions
// ==========================================

export const Transaction = defineModel({
  name: "transactions",
  columns: {
    id: id(),
    user_id: UUID({ index: true }),
    status: Int16({ default: PaymentStatus.created }),
    amount: Decimal64(4, { default: 0 }),
    currency: Str({ default: 'USD' }),
    payment_method: Str(),
    metadata: JSONType({ nullable: true }),
    created_at: timestamp(),
    completed_at: DateTime({ nullable: true }),
  },
  engine: ClickHouseEngine.VersionedCollapsingMergeTree,
  orderBy: createOrderBy([
    { column: 'created_at', direction: 'DESC' },
    { column: 'user_id', direction: 'ASC' }
  ]),
  partitionBy: createPartitionBy(columns => `toYYYYMM(${columns.created_at})`),
});

// ==========================================
// SECTION 6: Metrics Aggregation
// ==========================================

export const DailyMetrics = defineModel({
  name: "daily_metrics",
  columns: {
    date: DateType({ primaryKey: true }),
    metric_name: Str({ primaryKey: true }),
    dimension: Str({ default: 'overall', primaryKey: true }),
    count: UInt64({ default: 0 }),
    sum: Float64({ default: 0 }),
    min: Float64({ nullable: true }),
    max: Float64({ nullable: true }),
    avg: Float64({ nullable: true }),
  },
  engine: ClickHouseEngine.SummingMergeTree,
  orderBy: createOrderBy([
    { column: 'date', direction: 'DESC' },
    { column: 'metric_name', direction: 'ASC' },
    { column: 'dimension', direction: 'ASC' }
  ]),
});

// ==========================================
// SECTION 7: System Logs with Custom ID
// ==========================================

const level = {
  debug: 0,
  info: 1,
  warning: 2,
  error: 3,
  critical: 4,
} as const;

export const SystemLog = defineModel({
  name: "system_logs",
  columns: {
    id: id(),
    level: Int8({ default: level.info }),
    component: Str(),
    message: Str(),
    error_code: Int32({ nullable: true }),
    user_id: UUID({ nullable: true }),
    context: JSONType({ nullable: true }),
    timestamp: DateTime64({ default: now }),
  },
  engine: ClickHouseEngine.MergeTree,
  orderBy: createOrderBy([
    { column: 'timestamp', direction: 'DESC' },
    { column: 'level', direction: 'ASC' }
  ]),
  partitionBy: createPartitionBy(columns => `toDate(${columns.timestamp})`),
});

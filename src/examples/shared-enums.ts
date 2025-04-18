import { 
  defineModel,
  Str, 
  Int32, 
  DateTime64, 
  Bool,
  DateType,
  id,
  timestamp,
  createEnum8, 
  createEnum16,
  ClickHouseEngine
} from '../index';

// ===== Step 1: Define shared enums =====
// These can be imported across different schema files

export const UserStatus = createEnum8({
  active: 1,
  inactive: 0,
  pending: 2,
  banned: 3
});

export const LogLevel = createEnum8({
  info: 1,
  warning: 2,
  error: 3,
  debug: 0
});

export const OrderStatus = createEnum16({
  created: 0,
  processing: 1,
  completed: 2,
  cancelled: 100,
  refunded: 101,
  // ... many more statuses (Enum16 supports more values)
});

// ===== Step 2: Define schemas using shared enums =====

export const User = defineModel({
  name: "users",
  columns: {
    // Primary key with auto-generated UUID
    id: id(),
    
    // String with unique constraint
    username: Str({ unique: true }),
    
    // String that can be NULL (consistent nullable approach)
    email: Str({ nullable: true }),
    
    // Boolean with default
    is_active: Bool({ default: true }),
    
    // Reusing the shared UserStatus enum
    status: UserStatus.type({ default: 'active' }),
    
    // Number that can be NULL
    age: Int32({ nullable: true }),
    
    // Automatic timestamp
    created_at: timestamp(),
    
    // Nullable date
    last_login: DateType({ nullable: true }),
  },
  engine: ClickHouseEngine.MergeTree,
  orderBy: ["created_at"],
});

export const UserActivity = defineModel({
  name: "user_activities",
  columns: {
    id: id(),
    user_id: Str({ index: true }),
    activity_type: Str(),
    timestamp: timestamp(),
    
    // Reusing the same UserStatus enum in a different table
    prev_status: UserStatus.type({ nullable: true }),
    new_status: UserStatus.type(),
    
    // Can validate at runtime: UserStatus.isValidName('active') => true
    details: Str({ nullable: true }),
  },
  engine: ClickHouseEngine.MergeTree, 
  orderBy: ["timestamp"],
});

export const SystemLog = defineModel({
  name: "system_logs",
  columns: {
    id: id(),
    timestamp: timestamp({ precision: 3 }),
    
    // Using the LogLevel enum
    level: LogLevel.type(),
    
    component: Str(),
    message: Str(),
    details: Str({ nullable: true }),
  },
  engine: ClickHouseEngine.MergeTree,
  orderBy: ["timestamp", "level"],
}); 
# 🧠 ClickQuery – Fluent & Type-Safe ClickHouse Queries in TypeScript

> Build type-safe, high-performance ClickHouse queries with a fluent API.

ClickQuery is a modern query builder and minimal ORM designed for [ClickHouse](https://clickhouse.com), built in TypeScript. It provides a seamless developer experience for interacting with ClickHouse, emphasizing type safety, expressive query building, and performance for OLAP workloads.

---

## ⚡️ Why ClickQuery?

- 🔒 **End-to-End Type Safety:** Infer types directly from your schema definitions to your query results.
- 🧱 **Declarative Schema:** Define your ClickHouse tables using TypeScript.
- ✨ **Fluent Query Builder:** Construct complex SQL queries with an intuitive, chainable API.
- 🚀 **Optimized for OLAP:** Designed for analytical tasks.
- 🪶 **Minimal Abstraction:** Stays close to ClickHouse concepts without unnecessary overhead.

---

## 📦 Installation

```bash
bun add @clickquery/core
```

---

## 🚀 Getting Started

### 1. Initialize the Client

```typescript
import { createClient } from "@clickquery/core";

const db = createClient({
  host: "http://localhost:8123",
  username: "default",
  password: "your-password",
  database: "default",
  clickhouse_settings: {
    allow_experimental_object_type: 1,
  },
});
```

### 2. Define a Model (Schema)

```typescript
import { defineModel, Str, DateTime64, Float64, UUID, JSON, LowCardinality, ClickHouseEngine } from "@clickquery/core";

export const Event = defineModel({
  name: "events",
  columns: {
    id: UUID(),
    timestamp: DateTime64({ precision: 3 }),
    user_id: LowCardinality(Str()),
    event_name: Str(),
    properties: JSON(),
    value: Float64({ nullable: true }),
  },
  engine: ClickHouseEngine.MergeTree,
  orderBy: ["timestamp", "event_name"],
  partitionBy: "toYYYYMM(timestamp)",
});
```

### 3. Define Shared Enums

```typescript
import { createEnum8, createEnum16 } from "@clickquery/core";

// Define enums once and reuse them across schemas
export const UserStatus = createEnum8({
  active: 1,
  inactive: 0,
  pending: 2,
  banned: 3
});

export const OrderStatus = createEnum16({
  created: 0,
  processing: 1,
  completed: 2,
  cancelled: 100,
  refunded: 101,
});

// Use in schemas
export const User = defineModel({
  name: "users",
  columns: {
    // ...
    status: UserStatus.type({ default: 'active' }),
    // ...
  },
  engine: ClickHouseEngine.MergeTree,
  // ...
});

export const Order = defineModel({
  name: "orders",
  columns: {
    // ...
    status: OrderStatus.type({ default: 'created' }),
    // ...
  },
  engine: ClickHouseEngine.MergeTree,
  // ...
});
```

### 4. Insert Data

```typescript
import { Event } from "./models";

await db.insert(Event, {
  id: crypto.randomUUID(),
  timestamp: new Date(),
  user_id: "usr_12345",
  event_name: "page_view",
  properties: { path: "/home", referrer: "google.com" },
  value: null,
});
```

### 5. Query Data

```typescript
import { Event } from "./models";

const signups = await db
  .select(Event)
  .where("event_name", "=", "user_signup")
  .andWhere("timestamp", ">=", new Date(Date.now() - 24 * 60 * 60 * 1000))
  .orderBy("timestamp", "DESC")
  .limit(10);

console.log(signups);
```

---

## 🧠 Type Safety

ClickQuery infers TypeScript types directly from your `defineModel` schema, ensuring type safety from database interaction to your application code.

```typescript
import { InferModelType } from "@clickquery/core";
import { Event } from "./models";

type EventRow = InferModelType<typeof Event>;
```

---

## ✨ Features

- ClickHouse HTTP(S) Interface Support
- Declarative Model Definition
- Shared Enums Across Schemas
- Fluent & Type-Safe Query Builder
- Automatic Type Inference
- ClickHouse Native Data Types
- Configurable Table Engines
- Aggregate Functions
- Batch Inserts
- (Planned) Streaming Inserts & Selects
- (Planned) Migrations System
- (Planned) Materialized Views Support
- (Planned) Joins

---

## 🗺 Roadmap

- Core Client Setup
- Schema Definition
- Type Inference
- Type-Safe INSERT/SELECT
- Aggregate Functions
- Advanced Filtering
- Joins
- Streaming Inserts/Selects
- Migrations CLI Tool
- Materialized View Helpers
- Deno Compatibility
- Enhanced JSON/Object Type Handling
- Documentation Website & Playground

---

## 👨‍💻 Contributing

Contributions, feedback, and bug reports are welcome! Please open an issue or submit a pull request.

---

## 📝 License

MIT License. See the LICENSE file for details.

---

## ✉️ About

ClickQuery is built for developers who demand performance and type safety when working with ClickHouse. We believe interacting with powerful databases shouldn't come at the cost of developer experience.
import { createClient } from "@clickhouse/client";
import type { NodeClickHouseClientConfigOptions } from "@clickhouse/client/dist/config";

export const CLICKHOUSE_OPTIONS: NodeClickHouseClientConfigOptions = {
    max_open_connections: 30,
    request_timeout: 60000,
    keep_alive: {
      enabled: true,
      idle_socket_ttl: 8000,
    },
    compression: {
      request: true,
    },
    clickhouse_settings: {
      date_time_input_format: 'best_effort',
    },
    // log: {
    //   LoggerClass: CustomLogger,
    //   level: ClickHouseLogLevel.DEBUG,
    // },
  };

  if (!process.env.CLICKHOUSE_URL) {
    throw new Error("CLICKHOUSE_URL is not set");
  }

  export const clickHouseOG = createClient({
    url: process.env.CLICKHOUSE_URL,
    ...CLICKHOUSE_OPTIONS,
  });

export default clickHouseOG;

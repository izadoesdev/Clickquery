export interface ClickHouseConfig {
  /** The ClickHouse server URL */
  url: string;
  
  /** Database name */
  database: string;
  
  /** Authentication username */
  username?: string;
  
  /** Authentication password */
  password?: string;
  
  /** Connection timeout in milliseconds */
  timeout?: number;
  
  /** Maximum number of connections in the pool */
  maxConnections?: number;
  
  /** Whether to use compression for requests */
  compression?: boolean;
  
  /** ClickHouse session ID */
  sessionId?: string;
  
  /** Default format for query results */
  format?: 'JSON' | 'JSONEachRow' | 'CSV' | 'TSV';
  
  /** Additional ClickHouse settings */
  settings?: Record<string, string | number | boolean>;
}

export const defaultConfig: Partial<ClickHouseConfig> = {
  timeout: 30000,
  maxConnections: 10,
  compression: true,
  format: 'JSON',
  settings: {
    'max_execution_time': 30000,
    'max_memory_usage': 10000000000,
    'max_bytes_before_external_group_by': 10000000000,
    'max_bytes_before_external_sort': 10000000000,
  }
}; 
import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var _db: Pool | undefined;
}

function getDb(): Pool {
  // During build time, return a mock pool
  if (typeof window === 'undefined' && !process.env.DATABASE_URL) {
    // Return a mock pool for build time
    return {
      query: async () => ({ rows: [], rowCount: 0 }),
      connect: async () => ({}) as unknown,
    } as unknown as Pool;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  if (global._db) {
    return global._db;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  if (process.env.NODE_ENV !== 'production') {
    global._db = pool;
  }

  return pool;
}

// Lazy initialization
let _dbInstance: Pool | null = null;
export const db = new Proxy({} as Pool, {
  get(_target, prop) {
    if (!_dbInstance) {
      _dbInstance = getDb();
    }
    const value = _dbInstance[prop as keyof Pool];
    return typeof value === 'function' ? value.bind(_dbInstance) : value;
  },
});

export async function query(text: string, params?: unknown[]) {
  const start = Date.now();
  try {
    const res = await db.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', { text, error });
    throw error;
  }
}

export async function getClient() {
  const client = await db.connect();
  const originalQuery = client.query.bind(client);
  const originalRelease = client.release.bind(client);

  // Set a timeout of 5 seconds
  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!');
  }, 5000);

  // Override release to clear timeout
  client.release = () => {
    clearTimeout(timeout);
    client.query = originalQuery;
    client.release = originalRelease;
    return originalRelease();
  };

  return client;
}

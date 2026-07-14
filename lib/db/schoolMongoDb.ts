import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in your .env');
}

let cachedClient: MongoClient | null = null;
// One Db handle per database name, so the same connection is reused for
// both the default DB from your URI and the new `static_school_data` DB.
const cachedDbs: Record<string, Db> = {};

async function getClient(): Promise<MongoClient> {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

export async function connectToDatabase(dbName?: string): Promise<{ client: MongoClient; db: Db }> {
  const client = await getClient();
  const key = dbName ?? '__default__';
  if (cachedDbs[key]) {
    return { client, db: cachedDbs[key] };
  }
  const db = dbName ? client.db(dbName) : client.db();
  cachedDbs[key] = db;
  return { client, db };
}

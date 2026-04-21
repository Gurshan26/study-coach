import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resetDatabaseForTests } from '../src/db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
process.env.DATABASE_PATH = ':memory:';
process.env.NODE_ENV = 'test';

beforeEach(() => {
  resetDatabaseForTests(':memory:');
});

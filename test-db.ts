import 'dotenv/config';
import { db } from './src/db';
import { promptTable } from './src/db/schema';

async function testConnection() {
  try {
    // Try to query the prompts table
    const result = await db.select().from(promptTable).limit(1);
    console.log('Database connection successful!');
    console.log('Query result:', result);
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
}

testConnection();
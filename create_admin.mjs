import { getDb } from './server/db.ts';
import bcrypt from 'bcrypt';

async function createAdmin() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  const email = 'hemohemoggg@gmail.com';
  const password = 'hemohemo';
  const name = 'مسؤول';

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      loginMethod: 'email',
      role: 'admin',
    });

    console.log('Admin user created successfully:', result);
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

createAdmin();

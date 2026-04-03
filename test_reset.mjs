import { getDb } from './server/db.js';
import { users, passwordResetTokens } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';

async function testReset() {
  try {
    const db = await getDb();
    
    // Find the test user
    const user = await db.select().from(users).where(eq(users.email, 'hemohemoggg@gmail.com')).limit(1);
    
    if (!user.length) {
      console.log('User not found');
      return;
    }
    
    const userId = user[0].id;
    const testToken = `test-token-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    
    // Create a test reset token
    await db.insert(passwordResetTokens).values({
      userId,
      token: testToken,
      expiresAt,
      used: false,
    });
    
    console.log('✅ Test token created:');
    console.log(`Token: ${testToken}`);
    console.log(`URL: http://localhost:3000/reset-password?token=${testToken}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testReset();

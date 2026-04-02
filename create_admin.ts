import { createAdminUser } from './server/db';

async function main() {
  try {
    await createAdminUser('hemohemoggg@gmail.com', 'hemohemo', 'مسؤول');
    console.log('✅ Admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

main();

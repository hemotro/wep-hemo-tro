import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

async function createAdmin() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hemo_tro',
    });

    const hashedPassword = await bcrypt.hash('hemohemo', 10);
    const email = 'hemohemoggg@gmail.com';
    const name = 'Hemo Admin';

    // حذف المستخدم القديم إن وجد
    await connection.execute('DELETE FROM users WHERE email = ?', [email]);

    // إنشاء المستخدم الجديد
    await connection.execute(
      'INSERT INTO users (email, password, name, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [email, hashedPassword, name, 'admin']
    );

    console.log('✅ تم إنشاء حساب المسؤول بنجاح');
    console.log('البريد:', email);
    console.log('كلمة السر: hemohemo');

    await connection.end();
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

createAdmin();

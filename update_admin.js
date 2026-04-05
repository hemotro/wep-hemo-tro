const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function updateAdmin() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hemo_tro',
    });

    const email = 'hemotrotv@gmail.com';
    const password = 'hemohemo';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update user to admin with new password
    const [result] = await connection.execute(
      'UPDATE users SET password = ?, role = ? WHERE email = ?',
      [hashedPassword, 'admin', email]
    );
    
    console.log('✅ User updated to admin');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role: admin');
    console.log('Rows affected:', result.affectedRows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

updateAdmin();

import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'hemo_tro',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function seedData() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🌱 جاري إضافة البيانات التجريبية...');

    // إضافة أقسام
    console.log('📂 إضافة الأقسام...');
    await connection.query(`
      INSERT INTO categories (title, titleAr, description, descriptionAr, isActive, createdAt, updatedAt) VALUES 
      ('Action', 'أكشن', 'Action series', 'مسلسلات أكشن مثيرة', 1, NOW(), NOW()),
      ('Drama', 'درامي', 'Drama series', 'مسلسلات درامية مؤثرة', 1, NOW(), NOW()),
      ('Comedy', 'كوميديا', 'Comedy series', 'مسلسلات فكاهية وطريفة', 1, NOW(), NOW())
      ON DUPLICATE KEY UPDATE updatedAt = NOW();
    `);
    console.log('✅ تم إضافة الأقسام');

    // الحصول على أول مسلسل
    const [series] = await connection.query('SELECT id FROM series LIMIT 1');
    
    if (series.length === 0) {
      console.log('⚠️ لا توجد مسلسلات في قاعدة البيانات');
      return;
    }

    const seriesId = series[0].id;
    console.log(`📺 المسلسل الأول: ID = ${seriesId}`);

    // الحصول على الأقسام
    const [categories] = await connection.query('SELECT id FROM categories LIMIT 3');
    
    if (categories.length === 0) {
      console.log('⚠️ لا توجد أقسام في قاعدة البيانات');
      return;
    }

    // إضافة علاقات بين المسلسلات والأقسام
    console.log('🔗 إضافة علاقات المسلسلات والأقسام...');
    for (const category of categories) {
      await connection.query(`
        INSERT INTO seriesCategories (seriesId, categoryId, createdAt) VALUES 
        (?, ?, NOW())
        ON DUPLICATE KEY UPDATE createdAt = NOW();
      `, [seriesId, category.id]);
    }
    console.log('✅ تم إضافة العلاقات');

    // إضافة slider
    console.log('🎬 إضافة السلايدر...');
    await connection.query(`
      INSERT INTO slider (seriesId, title, titleAr, description, descriptionAr, displayOrder, createdAt, updatedAt) VALUES 
      (?, 'Featured Series', 'المسلسل المميز', 'Check out this amazing series', 'اكتشف هذا المسلسل الرائع', 1, NOW(), NOW())
      ON DUPLICATE KEY UPDATE updatedAt = NOW();
    `, [seriesId]);
    console.log('✅ تم إضافة السلايدر');

    console.log('✨ تم إضافة جميع البيانات بنجاح!');
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await connection.release();
    await pool.end();
  }
}

seedData();

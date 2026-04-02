import nodemailer from 'nodemailer';

/**
 * إعدادات البريد الإلكتروني
 * يمكن تعديل هذه الإعدادات حسب خدمة البريد المستخدمة
 */

// استخدام Gmail أو أي خدمة بريد أخرى
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password',
  },
});

/**
 * إرسال بريد استعادة كلمة المرور
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName: string
) {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
      <h2>مرحباً ${userName}</h2>
      <p>تلقينا طلباً لاستعادة كلمة المرور الخاصة بك.</p>
      <p>انقر على الرابط أدناه لإعادة تعيين كلمة المرور:</p>
      <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        استعادة كلمة المرور
      </a>
      <p>أو انسخ الرابط التالي في متصفحك:</p>
      <p style="word-break: break-all; color: #666;">${resetLink}</p>
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        ملاحظة: هذا الرابط صالح لمدة ساعة واحدة فقط.
        إذا لم تطلب استعادة كلمة المرور، يرجى تجاهل هذا البريد.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@hemotro.com',
      to: email,
      subject: 'استعادة كلمة المرور - Hemo Tro',
      html: htmlContent,
    });

    console.log(`✅ تم إرسال بريد استعادة كلمة المرور إلى ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ خطأ في إرسال البريد:', error);
    throw new Error('فشل إرسال البريد الإلكتروني');
  }
}

/**
 * إرسال بريد تأكيد البريد الإلكتروني
 */
export async function sendVerificationEmail(
  email: string,
  verificationCode: string,
  userName: string
) {
  const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?code=${verificationCode}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
      <h2>مرحباً ${userName}</h2>
      <p>شكراً لتسجيلك في Hemo Tro!</p>
      <p>يرجى تأكيد بريدك الإلكتروني بالنقر على الرابط أدناه:</p>
      <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        تأكيد البريد الإلكتروني
      </a>
      <p>أو استخدم الكود التالي:</p>
      <p style="font-size: 18px; font-weight: bold; color: #007bff; letter-spacing: 2px;">${verificationCode}</p>
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        ملاحظة: هذا الرابط صالح لمدة 24 ساعة فقط.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@hemotro.com',
      to: email,
      subject: 'تأكيد البريد الإلكتروني - Hemo Tro',
      html: htmlContent,
    });

    console.log(`✅ تم إرسال بريد التحقق إلى ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ خطأ في إرسال البريد:', error);
    throw new Error('فشل إرسال البريد الإلكتروني');
  }
}

/**
 * إرسال بريد ترحيب
 */
export async function sendWelcomeEmail(email: string, userName: string) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
      <h2>مرحباً بك في Hemo Tro! 🎬</h2>
      <p>أهلاً وسهلاً ${userName}!</p>
      <p>تم تفعيل حسابك بنجاح. يمكنك الآن الاستمتاع بمشاهدة أفضل المسلسلات الدرامية العربية.</p>
      <p>استكشف مجموعتنا الواسعة من المسلسلات والحلقات الحصرية.</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        ابدأ المشاهدة الآن
      </a>
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        إذا كان لديك أي أسئلة، لا تتردد في التواصل معنا.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@hemotro.com',
      to: email,
      subject: 'أهلاً وسهلاً في Hemo Tro!',
      html: htmlContent,
    });

    console.log(`✅ تم إرسال بريد الترحيب إلى ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ خطأ في إرسال البريد:', error);
    throw new Error('فشل إرسال البريد الإلكتروني');
  }
}

/**
 * اختبار اتصال البريد
 */
export async function testEmailConnection() {
  try {
    await transporter.verify();
    console.log('✅ اتصال البريد الإلكتروني يعمل بنجاح');
    return { success: true };
  } catch (error) {
    console.error('❌ فشل اتصال البريد:', error);
    return { success: false, error };
  }
}

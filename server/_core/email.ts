import nodemailer from 'nodemailer';
import { ENV } from './env';

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
 * إرسال بريد استعادة كلمة المرور باستخدام كود رقمي
 */
export async function sendPasswordResetEmail(
  email: string,
  resetCode: string,
  userName: string
) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
        <h2 style="color: #333; margin-bottom: 20px;">مرحباً ${userName}</h2>
        
        <p style="color: #555; font-size: 16px; margin-bottom: 15px;">تلقينا طلباً لاستعادة كلمة المرور الخاصة بك.</p>
        
        <p style="color: #555; font-size: 16px; margin-bottom: 20px;">استخدم الكود التالي لاستعادة كلمة المرور:</p>
        
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; margin: 0 0 10px 0;">الكود الرقمي:</p>
          <p style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; margin: 0; font-family: 'Courier New', monospace;">${resetCode}</p>
        </div>
        
        <p style="color: #555; font-size: 14px; margin: 20px 0;">هذا الكود صالح لمدة <strong>10 دقائق</strong> فقط.</p>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <p style="color: #856404; margin: 0; font-size: 14px;">⚠️ إذا لم تطلب استعادة كلمة المرور, يرجى تجاهل هذا البريد.</p>
        </div>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          هذا البريد من Hemo Tro. لا ترد على هذا البريد إذا كانت هذه رسالة عن طريق الخطأ.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@hemotro.com',
      to: email,
      subject: 'كود استعادة كلمة المرور - Hemo Tro',
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
  const verificationLink = `${ENV.frontendUrl}/verify-email?code=${verificationCode}`;

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
      <a href="${ENV.frontendUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
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

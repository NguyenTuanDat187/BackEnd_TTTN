const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'datntph39291@fpt.edu.vn',        // ✏️ Email của bạn
    pass: 'egztyvcmubzmykly'                // ✏️ Mật khẩu ứng dụng (App password)
  }
});

const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: '"FMCarer" <datntph39291@fpt.edu.vn>',  // ✏️ Cùng email trên
      to,
      subject,
      text
    });
    console.log("✅ Email đã gửi:", to);
  } catch (err) {
    console.error("❌ Gửi email thất bại:", err);
    throw err; // ném lỗi ra ngoài để controller bắt được
  }
};

module.exports = sendEmail;

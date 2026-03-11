const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html, text) => {
  // Check required env vars
  const {
    EMAIL_USER,
    EMAIL_PASS
  } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    const error = new Error("Missing required email environment variables.");
    console.error(`Email send failed to ${to}:`, error.message);
    return { success: false, error: error.message };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Silas Car Rentals" <${EMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to: ${to}`);
    return { success: true, message: 'Email sent successfully' };
  } catch (err) {
    console.error(`Email send failed to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

module.exports = sendEmail;

const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html) => {
  try {
    // Check required env vars
    const {
      EMAIL_HOST,
      EMAIL_PORT,
      EMAIL_SECURE,
      EMAIL_USER,
      EMAIL_PASS
    } = process.env;

    if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
      throw new Error("Missing required email environment variables.");
    }

    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: parseInt(EMAIL_PORT, 10),
      secure: EMAIL_SECURE === 'true', // must be boolean
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
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to: ${to}`);
  } catch (err) {
    console.error(`Email send failed to ${to}:`, err.message);
  }
};

module.exports = sendEmail;

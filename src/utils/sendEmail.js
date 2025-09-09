const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html, text) => {
  try {
    // Check required env vars
    const {
      EMAIL_USER,
      EMAIL_PASS
    } = process.env;

    if (!EMAIL_USER || !EMAIL_PASS) {
      throw new Error("Missing required email environment variables.");
    }

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
  } catch (err) {
    console.error(`Email send failed to ${to}:`, err.message);
  }
};

module.exports = sendEmail;

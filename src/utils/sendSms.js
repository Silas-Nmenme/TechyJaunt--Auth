// utils/sendSms.js
const axios = require('axios');
const SmsLog = require('../models/smsLog.schema');

const sendSms = async (to, message, userId = null) => {
  const { KUDI_API_KEY, KUDI_SENDER_ID } = process.env;

  if (!KUDI_API_KEY || !KUDI_SENDER_ID) {
    console.error("Missing KUDI SMS credentials.");
    return;
  }

  try {
    const response = await axios.post(
      'https://account.kudisms.net/api/',
      {
        action: 'send-sms',
        api_key: KUDI_API_KEY,
        to,
        from: KUDI_SENDER_ID,
        sms: message,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Save SMS log to database
    await SmsLog.create({
      user: userId,
      phoneNumber: to,
      message,
      status: "sent",
      providerResponse: response.data,
    });

    console.log(`SMS sent to ${to}:`, response.data);
  } catch (error) {
    console.error(`SMS failed to ${to}:`, error.response?.data || error.message);

    // Save failure log
    await SmsLog.create({
      user: userId,
      phoneNumber: to,
      message,
      status: "failed",
      providerResponse: error.response?.data || { message: error.message },
    });
  }
};

module.exports = sendSms;

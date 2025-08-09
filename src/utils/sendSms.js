// utils/sendSms.js
const axios = require('axios');
const SmsLog = require('../models/smsLog.schema');

/**
 * Send SMS using KudiSMS API and log the result.
 *
 * @param {string} to - Recipient phone number (in international format, e.g., 2348031234567)
 * @param {string} message - The text message to send
 * @param {string|null} userId - Optional MongoDB user ID
 */
const sendSms = async (to, message, userId = null) => {
  const { KUDI_API_KEY, KUDI_SENDER_ID } = process.env;

  if (!KUDI_API_KEY || !KUDI_SENDER_ID) {
    console.error('KudiSMS Error: Missing API key or sender ID in environment variables.');
    return;
  }

  // Format Nigerian numbers (e.g., 091... => 23491...)
  const formattedNumber = to.startsWith('0') ? '234' + to.slice(1) : to;

  const payload = {
    action: 'send-sms',
    api_key: KUDI_API_KEY,
    to: formattedNumber,
    from: KUDI_SENDER_ID,
    sms: message,
  };

  try {
    const response = await axios.post(
      'https://account.kudisms.net/api/',
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    // Log success to DB
    await SmsLog.create({
      user: userId,
      phoneNumber: formattedNumber,
      message,
      status: 'sent',
      provider: 'KudiSMS',
      providerResponse: response.data,
      sentAt: new Date(),
    });

    console.log(`KudiSMS sent to ${formattedNumber}:`, response.data);
  } catch (error) {
    const providerResponse = error.response?.data || { error: error.message };

    // Log failure to DB
    await SmsLog.create({
      user: userId,
      phoneNumber: formattedNumber,
      message,
      status: 'failed',
      provider: 'KudiSMS',
      providerResponse,
      sentAt: new Date(),
    });

    console.error(`KudiSMS failed to ${formattedNumber}:`, providerResponse);
  }
};

module.exports = sendSms;

// utils/sendSms.js
const axios = require('axios');
const SmsLog = require('../models/smsLog.schema');

/**
 * Send SMS using KudiSMS API and log the result.
 *
 * @param {string} to - Recipient phone number (in international format)
 * @param {string} message - The text message to send
 * @param {string|null} userId - Optional MongoDB user ID
 */
const sendSms = async (to, message, userId = null) => {
  const { KUDI_API_KEY, KUDI_SENDER_ID } = process.env;

  if (!KUDI_API_KEY || !KUDI_SENDER_ID) {
    console.error("KudiSMS error: Missing API key or sender ID in environment variables.");
    return;
  }

  try {
    const payload = {
      action: 'send-sms',
      api_key: KUDI_API_KEY,
      to,
      from: KUDI_SENDER_ID,
      sms: message,
    };

    const response = await axios.post(
      'https://account.kudisms.net/api/',
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    // Log success
    await SmsLog.create({
      user: userId,
      phoneNumber: to,
      message,
      status: 'sent',
      provider: 'KudiSMS',
      providerResponse: response.data,
      sentAt: new Date(),
    });

    console.log(`KudiSMS sent to ${to}:`, response.data);
  } catch (error) {
    const providerResponse = error.response?.data || { message: error.message };

    // Log failure
    await SmsLog.create({
      user: userId,
      phoneNumber: to,
      message,
      status: 'failed',
      provider: 'KudiSMS',
      providerResponse,
      sentAt: new Date(),
    });

    console.error(`KudiSMS failed to ${to}:`, providerResponse);
  }
};

module.exports = sendSms;

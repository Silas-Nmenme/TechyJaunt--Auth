const Newsletter = require("../models/Newletter.schema");
const emailTemplates = require("../../templates/emailTemplates");

// Newsletter Form
const subscribeNewsletter = async (req, res) => {
  const { email } = req.body
  try {
    await Newsletter.create({ email })
    res.json({ message: `You're subscribed! Confirmation sent.` })
    if (email) emailTemplates.sendEmail(email, "newsletter", { email })
  } catch (err) {
    console.error("Newsletter error:", err.message)
    res.status(500).json({ message: "Newsletter subscription failed." })
  }
}

// Get all subscribers
const getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Newsletter.find().sort({ createdAt: -1 });
    res.json({ subscribers });
  } catch (err) {
    console.error("Get subscribers error:", err.message);
    res.status(500).json({ message: "Failed to fetch subscribers." });
  }
}

// Unsubscribe user
const unsubscribeUser = async (req, res) => {
  const { subscriberId } = req.params;
  try {
    await Newsletter.findByIdAndDelete(subscriberId);
    res.json({ message: "Successfully unsubscribed from newsletter." });
  } catch (err) {
    console.error("Unsubscribe error:", err.message);
    res.status(500).json({ message: "Failed to unsubscribe user." });
  }
}

// Update subscription
const updateSubscription = async (req, res) => {
  const { subscriberId } = req.params;
  const { email } = req.body;
  try {
    const updatedSubscriber = await Newsletter.findByIdAndUpdate(
      subscriberId,
      { email },
      { new: true }
    );
    res.json({ message: "Subscription updated successfully.", subscriber: updatedSubscriber });
  } catch (err) {
    console.error("Update subscription error:", err.message);
    res.status(500).json({ message: "Failed to update subscription." });
  }
}

module.exports = {
  Newsletter: subscribeNewsletter,
  getAllSubscribers,
  unsubscribeUser,
  updateSubscription
};

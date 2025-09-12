const Newsletter = require("../models/Newletter.schema");
const emailTemplates = require("../../templates/emailTemplates");
const { sendTemplateEmail } = require("../config/email");

// Newsletter Form
const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check if email already exists
    const existingSubscriber = await Newsletter.findOne({ email });
    if (existingSubscriber) {
      return res.status(409).json({ message: "Email already subscribed" });
    }

    // Create new subscriber
    await Newsletter.create({ email });
    
    // Send welcome email using the newsletter template
    try {
      const template = emailTemplates.newsletterTemplate(email);
      await sendTemplateEmail(email, template.subject, template.html, template.text);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError.message);
      // Don't fail the subscription if email fails
    }

    res.status(201).json({ 
      message: "Successfully subscribed to newsletter",
      email 
    });

  } catch (err) {
    console.error("Newsletter error:", err.message);
    res.status(500).json({ message: "Newsletter subscription failed" });
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
    // Find the subscriber before deleting to get email details
    const subscriber = await Newsletter.findById(subscriberId);
    
    if (!subscriber) {
      return res.status(404).json({ message: "Subscriber not found." });
    }

    const email = subscriber.email;
    
    // Delete the subscriber
    await Newsletter.findByIdAndDelete(subscriberId);
    
    // Send unsubscribe confirmation email using template
    try {
      const template = emailTemplates.unsubscribeTemplate(email);
      await sendTemplateEmail(email, template.subject, template.html, template.text);
    } catch (emailError) {
      console.error("Failed to send unsubscribe email:", emailError.message);
      // Don't fail the unsubscribe if email fails
    }
    
    res.json({ 
      message: "Successfully unsubscribed from newsletter. A confirmation email has been sent.",
      email 
    });
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
  subscribeNewsletter,
  getAllSubscribers,
  unsubscribeUser,
  updateSubscription
};
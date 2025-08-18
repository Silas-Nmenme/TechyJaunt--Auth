
const User = require("../models/user.schema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { sendEmail, sendTemplateEmail } = require("../config/email");
const emailTemplates = require("../../templates/emailTemplates");
const { OAuth2Client } = require('google-auth-library');
const { google } = require('googleapis');
const { upload, deleteImage, extractPublicId } = require('../config/cloudinary');
// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Salt rounds for password hashing
const saltRounds = 10;


// User Signup
const signup = async (req, res) => {
  const { name, email, password, phoneNumber } = req.body; 

  // Validate input
  if (!name || !email || !password || !phoneNumber) {
    return res.status(400).json({ message: "All fields are required including phone number" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION || '1d',
    });
    const emailToken = uuidv4();

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      token,
      emailToken,
      phoneNumber, 
    });

    await newUser.save();

    // Send welcome email
    const welcomeTemplate = emailTemplates.welcomeTemplate(name, emailToken);
    await sendTemplateEmail(
      email,
      welcomeTemplate.subject,
      welcomeTemplate.html,
      welcomeTemplate.text
    );

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        token: newUser.token
      }
    });

  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


//Verify Email
const verifyEmail = async (req, res) => {
  const token = req.params.token;
  if (!token) {
    return res.status(400).json({ message: "No Token" });
  }
  try {
    const user = await User.findOne({emailToken: token})
    if(!user){
      return res.status(404).json({messsage: "User With this token doesn't Exist"})
    }
    user.isVerified = true;
    user.emailToken = null;
    await user.save();

    // Send email verification success notification
    const successTemplate = emailTemplates.emailVerificationSuccessTemplate(user.name);
    await sendTemplateEmail(
      user.email,
      successTemplate.subject,
      successTemplate.html,
      successTemplate.text
    );

    return res.status(200).json({message: "User Verified Successfully", user})
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  // Validate Inputs
  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.isVerified) {
      return res.status(401).json({ message: "Please Verify Your Email" });
    }
    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const payload = {
      id: user._id,
      email: user.email,
    };
    const token = await jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION,
    });

    // Send login notification with template
    const loginTime = new Date().toLocaleString();
    const loginTemplate = emailTemplates.loginNotificationTemplate(user.name, loginTime);
    await sendTemplateEmail(
      email,
      loginTemplate.subject,
      loginTemplate.html,
      loginTemplate.text
    );

    return res
      .status(200)
      .json({ message: "User Logged In Successfully", token });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};


//Make Admin
const makeAdmin = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.isAdmin = true;
    await user.save();
    return res
      .status(200)
      .json({ message: "User promoted to admin successfully", user });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  // Validate input
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }
  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Generate A 6 Digit Otp With math.random()
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    await user.save();

    // Send OTP email with template
    const otpTemplate = emailTemplates.forgotPasswordTemplate(user.name, otp);
    await sendTemplateEmail(
      email,
      otpTemplate.subject,
      otpTemplate.html,
      otpTemplate.text
    );

    return res.status(200).json({
      message: "Password reset OTP sent to your email",
    });
  } catch (error) {
    console.error("Error generating reset token:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


//Verify OTP
const verifyOtp = async (req, res) => {
  const { otp } = req.body;
  try {
    const user = await User.findOne({ otp: otp });
    if (!user) {
      return res.status(404).json({ message: "Invalid OTP" });
    }
    user.otpVerified = true;
    user.otp = null; // Clear OTP after verification
    await user.save();

    // OTP is valid, you can proceed with password reset or other actions
    return res
      .status(200)
      .json({ message: "OTP verified successfully", userId: user._id });
  } catch (e) {
    console.error("Error verifying OTP:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const resetPassword = async (req, res) => {
  const { confirmPassword, newPassword } = req.body;
  const { userId } = req.params;
  console.log(userId);
  // Validate input
  if (!userId || !newPassword) {
    return res
      .status(400)
      .json({ message: "User ID and new password are required" });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const user = await User.findById({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.otpVerified !== true) {
      return res
        .status(403)
        .json({ message: "OTP not verified, Please Verify Your Otp" });
    }
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;
    user.otpVerified = false; // Reset OTP verification status
    await user.save();

    // Send password reset confirmation email
    const confirmationTemplate = emailTemplates.passwordResetConfirmationTemplate(user.name);
    await sendTemplateEmail(
      user.email,
      confirmationTemplate.subject,
      confirmationTemplate.html,
      confirmationTemplate.text
    );

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Initiate Google OAuth - Generate OAuth URL
const initiateGoogleAuth = async (req, res) => {
  try {
    
    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4500/api/auth/google/callback'
    );

    // Generate the url that will be used for the consent dialog
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      include_granted_scopes: true,
      state: JSON.stringify({
        timestamp: Date.now(),
        // Add any additional state data you need
      })
    });

    return res.status(200).json({
      message: "Google OAuth URL generated",
      authUrl: authorizeUrl
    });

  } catch (error) {
    console.error("Error generating Google OAuth URL:", error);
    return res.status(500).json({ message: "Failed to generate OAuth URL" });
  }
};

// Handle Google OAuth Callback
const handleGoogleCallback = async (req, res) => {
  const { code, state, error } = req.query;
  
  if (error) {
    return res.status(400).json({ message: "OAuth authorization denied", error });
  }

  if (!code) {
    return res.status(400).json({ message: "Authorization code is required" });
  }

  try {
    
    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4500/api/auth/google/callback'
    );

    // Exchange authorization code for access token
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user information
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });

    const { data } = await oauth2.userinfo.get();
    
    const {
      id: googleId,
      email,
      name,
      picture: avatar,
      verified_email: emailVerified
    } = data;

    if (!emailVerified) {
      return res.status(400).json({ message: "Google email not verified" });
    }

    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId });
    let isNewUser = false;
    
    if (!user) {
      // Check if user exists with this email (regular signup)
      user = await User.findOne({ email });
      
      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        user.provider = 'google';
        user.avatar = avatar;
        user.isVerified = true; // Ensure Google users are verified
        await user.save();
      } else {
        // Create new user with Google OAuth
        user = new User({
          name,
          email,
          googleId,
          provider: 'google',
          avatar,
          isVerified: true // Google accounts are pre-verified
        });
        await user.save();
        isNewUser = true;

        // Send welcome email for new Google users
        const welcomeTemplate = emailTemplates.googleWelcomeTemplate(name);
        await sendTemplateEmail(
          email,
          welcomeTemplate.subject,
          welcomeTemplate.html,
          welcomeTemplate.text
        );
      }
    }

    // Generate JWT token
    const jwtPayload = {
      id: user._id,
      email: user.email,
      provider: user.provider
    };
    
    const token = await jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION,
    });

    // Send login notification (only for existing users)
    if (!isNewUser) {
      const loginTime = new Date().toLocaleString();
      const loginTemplate = emailTemplates.loginNotificationTemplate(user.name, loginTime);
      await sendTemplateEmail(
        email,
        loginTemplate.subject,
        loginTemplate.html,
        loginTemplate.text
      );
    }

    // Option 1: Redirect to frontend with token in URL params (not recommended for production)
    // const frontendUrl = process.env.FRONTEND_URL || 'https://silascarrentals.netlify.app"';
    // return res.redirect(`${frontendUrl}/auth/success?token=${token}`);

    // Option 2: Redirect to frontend with success page that fetches token
    // const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4500';
    // Store token temporarily in session or cache with short expiration
    // return res.redirect(`${frontendUrl}/auth/success?authId=${temporaryId}`);

    // Option 3: Return JSON response (for API-only approach)
    return res.status(200).json({
      message: "Google authentication successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return res.status(500).json({ message: "Google authentication failed" });
  }
};

// Unlink Google Account
const unlinkGoogle = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.provider === 'google' && !user.password) {
      return res.status(400).json({ 
        message: "Cannot unlink Google account without setting a password first" 
      });
    }

    // Remove Google association
    user.googleId = undefined;
    user.provider = 'local';
    user.avatar = undefined;
    await user.save();

    return res.status(200).json({ 
      message: "Google account unlinked successfully" 
    });

  } catch (error) {
    console.error("Error unlinking Google account:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Set password for Google users who want to add local authentication
const setPasswordForGoogleUser = async (req, res) => {
  const { userId } = req.params;
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    return res.status(400).json({ message: "Password and confirm password are required" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long" });
  }

  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.provider !== 'google') {
      return res.status(400).json({ message: "This endpoint is only for Google users" });
    }

    // Hash and set password
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    user.password = hashedPassword;
    await user.save();

    // Send confirmation email
    const confirmationTemplate = emailTemplates.passwordSetConfirmationTemplate(user.name);
    await sendTemplateEmail(
      user.email,
      confirmationTemplate.subject,
      confirmationTemplate.html,
      confirmationTemplate.text
    );

    return res.status(200).json({ 
      message: "Password set successfully. You can now use both Google and email/password login." 
    });

  } catch (error) {
    console.error("Error setting password for Google user:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Upload Profile Picture
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const userId = req.user.id; 
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old profile picture if exists
    if (user.profilePicture?.publicId) {
      try {
        await deleteImage(user.profilePicture.publicId);
      } catch (error) {
        console.error('Error deleting old profile picture:', error);
        // Continue with upload even if deletion fails
      }
    }

    // Update user with new profile picture
    user.profilePicture = {
      url: req.file.path,
      publicId: req.file.filename,
      uploadedAt: new Date()
    };

    // Also update the avatar field for backward compatibility
    user.avatar = req.file.path;

    await user.save();

    return res.status(200).json({
      message: "Profile picture uploaded successfully",
      profilePicture: {
        url: user.profilePicture.url,
        uploadedAt: user.profilePicture.uploadedAt
      }
    });

  } catch (error) {
    console.error("Error uploading profile picture:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get User Profile (including profile picture)
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password -otp -emailToken -token');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User profile retrieved successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        provider: user.provider,
        avatar: user.avatar,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error("Error getting user profile:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete Profile Picture
const deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.profilePicture?.publicId) {
      return res.status(400).json({ message: "No profile picture to delete" });
    }

    // Delete from Cloudinary
    try {
      await deleteImage(user.profilePicture.publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      // Continue with database update even if Cloudinary deletion fails
    }

    // Remove profile picture from user
    user.profilePicture = {
      url: null,
      publicId: null,
      uploadedAt: null
    };
    user.avatar = null;

    await user.save();

    return res.status(200).json({
      message: "Profile picture deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting profile picture:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update User Profile (name, email, etc.)
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    if (!name && !email) {
      return res.status(400).json({ message: "At least one field (name or email) is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // If email is changed, mark as unverified
      user.email = email;
      user.isVerified = false;
      
      // Generate new email token for verification
      const emailToken = uuidv4();
      user.emailToken = emailToken;
      
      // Send verification email
      const welcomeTemplate = emailTemplates.welcomeTemplate(name || user.name, emailToken);
      await sendTemplateEmail(
        email,
        welcomeTemplate.subject,
        welcomeTemplate.html,
        welcomeTemplate.text
      );
    }

    if (name) {
      user.name = name;
    }

    await user.save();

    return res.status(200).json({
      message: email && email !== user.email 
        ? "Profile updated successfully. Please verify your new email address." 
        : "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        profilePicture: user.profilePicture
      }
    });

  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  signup,
  login,
  makeAdmin,
  forgotPassword,
  verifyOtp,
  resetPassword,
  verifyEmail,
  initiateGoogleAuth,
  handleGoogleCallback,
  unlinkGoogle,
  setPasswordForGoogleUser,
  uploadProfilePicture,
  getUserProfile,
  deleteProfilePicture,
  updateProfile,
};

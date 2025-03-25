const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');



// Add these routes to your existing auth routes file

// Import required packages
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// In-memory storage for OTPs (in production, use a database)
const otpStore = new Map();

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',  // Use your preferred email service
  auth: {
    user: 'majjiteja000@gmail.com',  // Replace with your email
    pass: 'velo dihr hnwf gjsy'      // Replace with your app password
  }
});

// Generate a random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via email
async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: 'majjiteja000@gmail.com',
    to: email,
    subject: 'Password Reset Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #4285f4;">Password Reset Request</h2>
        <p>We received a request to reset your password for College Review. Use the verification code below to complete the process:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <h1 style="font-size: 36px; margin: 0; letter-spacing: 5px; color: #333;">${otp}</h1>
        </div>
        <p>This code will expire in 2 minutes.</p>
        <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777;">This is an automated email. Please do not reply.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

// Route to send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Check if email exists in your database
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }
    
    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with expiration time (2 minutes)
    otpStore.set(email, {
      otp,
      expiry: Date.now() + 120000, // 2 minutes from now
      attempts: 0
    });
    
    // Send OTP via email
    await sendOTPEmail(email, otp);
    
    res.status(200).json({ message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to verify OTP
router.post('/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }
    
    // Check if OTP exists for this email
    const otpData = otpStore.get(email);
    
    if (!otpData) {
      return res.status(400).json({ message: 'No verification code found. Please request a new code' });
    }
    
    // Check if OTP has expired
    if (Date.now() > otpData.expiry) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code' });
    }
    
    // Check if max attempts reached
    if (otpData.attempts >= 3) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'Too many failed attempts. Please request a new code' });
    }
    
    // Verify OTP
    if (otpData.otp !== otp) {
      // Increment attempts
      otpData.attempts++;
      otpStore.set(email, otpData);
      
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    
    // OTP is valid - store flag to allow password reset
    otpData.verified = true;
    otpStore.set(email, otpData);
    
    res.status(200).json({ message: 'Verification successful' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Check if OTP was verified
    const otpData = otpStore.get(email);
    
    if (!otpData || !otpData.verified) {
      return res.status(400).json({ message: 'Please verify your email first' });
    }
    
    // Find user in database
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Hash the new password
    
    
    // Update user's password
    user.password = password;
    await user.save();
    
    // Delete OTP data
    otpStore.delete(email);
    
    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      username,
      email,
      phone,
      password
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

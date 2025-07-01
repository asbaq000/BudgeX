const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");
require("dotenv").config();

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "Please enter all fields" });
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });
    if (user) {
      res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});


router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            
            return res.status(200).json({ message: 'If a user with that email exists, a reset link has been sent.' });
        }


        const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
        
        
        const resetUrl = `${process.env.CLIENT_URL || 'https://budgex.netlify.app'}/reset-password/${resetToken}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS, 
            },
        });

        const mailOptions = {
            from: `"BudgeX Finance" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Your Password Reset Link',
            html: `<p>Hi ${user.firstName},</p>
                   <p>You requested a password reset. Click the link below to set a new password. This link is valid for 15 minutes.</p>
                   <a href="${resetUrl}" style="background-color: #58A6FF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                   <p>If you did not request this, please ignore this email.</p>`,
        };

        
        await transporter.sendMail(mailOptions);
        
        res.status(200).json({ message: 'If a user with that email exists, a reset link has been sent.' });

    } catch (error) {
        console.error('--- FORGOT PASSWORD ERROR ---');
        console.error(error);
        res.status(500).json({ message: 'There was an error sending the reset email.' });
    }
});


router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: 'Please provide a new password.' });
    }

    try {
      
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(400).json({ message: 'Invalid token. Please try again.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        res.status(200).json({ message: 'Password has been reset successfully. You can now log in.' });

    } catch (error) {
        console.error('--- RESET PASSWORD ERROR ---');
        console.error(error);
        res.status(401).json({ message: 'Invalid or expired token. Please request a new reset link.' });
    }
});


router.get("/me", protect, async (req, res) => {
  res.status(200).json(req.user);
});

module.exports = router;

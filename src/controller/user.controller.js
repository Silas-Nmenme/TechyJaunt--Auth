const User = require('../models/user.schema');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const saltRounds = 10;

const signUp = async (req, res) => {
    const { name, email, password } = req.body;
    // validate input
    if (!name || !email || !password){
        return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6){
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    try {
        // check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const token = await jwt.sign({email: email}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRATION});

        // create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            token: token
        });
        await newUser.save();
        
        res.status(201).json({ message: "User created successfully", newUser });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    // validate input
    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    try {
        // check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        // compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        // generate JWT token
        const payload = {
            id: user._id,
            email: user.email,
        };
        const token = await jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRATION,});
        return res.status(200).json({ message: "User Logged In Successfully", token });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
};
const makeAdmin = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.isAdmin = true;
        await user.save();
        return res.status(200).json({ message: "User promoted to admin successfully", user });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
};


module.exports = {
    signUp,
    login,
    makeAdmin,
};
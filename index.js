// index.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const path = require("path");

dotenv.config();

// Import DB connection & routes
const connectDB = require("./src/config/db");
const userRouter = require("./src/routes/user.routes");
const carRouter = require("./src/routes/car.routes");
const paymentRouter = require("./src/routes/payment.routes");
const NewsletterRouter = require("./src/routes/Newsletter.routes");
const contactRouter = require("./src/routes/contact.routes");

const app = express();
const PORT = process.env.PORT || 4500;

// ===== CORS Setup =====
const FRONTEND_URL = process.env.FRONTEND_URL || "https://silascarrentals.netlify.app";
app.use(cors({
  origin: FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// ===== Middleware =====
app.use(express.json());   // JSON body parser
app.use(morgan("dev"));    // Logging

// ===== Serve static files (for local testing only) =====
app.use(express.static(path.join(__dirname, "public")));

// ===== API Routes =====
app.get("/", (req, res) => res.send("Welcome To Silas Rental Services"));
app.use("/api/users", userRouter);
app.use("/api/cars", carRouter);
app.use("/api/payment", paymentRouter); // includes webhook inside payment.routes.js
app.use("/api/newsletter", NewsletterRouter);
app.use("/api", contactRouter); // Contact routes

// ===== Start Server After DB Connect =====
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Allowed frontend origin: ${FRONTEND_URL}`);
  });
}).catch(err => {
  console.error("MongoDB connection failed:", err.message);
  process.exit(1);
});

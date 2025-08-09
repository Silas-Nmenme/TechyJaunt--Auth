const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const path = require("path");

// Importing necessary modules
const connectDB = require("./src/config/db");
const userRouter = require("./src/routes/user.routes");
const carRouter = require("./src/routes/car.routes");
const paymentRouter = require("./src/routes/payment.routes.js");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4500;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get("/", (req, res) => res.send("Welcome To Silas Rental Services"));
app.use("/api/users", userRouter);
app.use("/api/cars", carRouter);
app.use("/api/payment", paymentRouter);
app.use('/api/webhook', paymentRouter);

// Start the server
app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on http://localhost:${PORT}`);
});

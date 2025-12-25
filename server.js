const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

/* ===============================
   Middleware
================================ */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===============================
   Routes
================================ */
const proposalRoutes = require("./routes/proposals");
const teamRoutes = require("./routes/teams");
const announcementRoutes = require("./routes/announcements");
const adminRoutes = require("./routes/admin");
const uploadRoutes = require("./routes/upload");

app.use("/api/proposals", proposalRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);

/* ===============================
   MongoDB Connection (FIXED)
================================ */
const connectDB = async () => {
  try {
    mongoose.set("bufferCommands", false); // Prevent buffering timeouts

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // 30s
      socketTimeoutMS: 30000,
    });

    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1); // Stop server if DB fails
  }
};

/* ===============================
   Basic Route
================================ */
app.get("/", (req, res) => {
  res.json({ message: "Ericsson Hackathon API" });
});

/* ===============================
   Error Handler
================================ */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: err.message,
  });
});

/* ===============================
   Start Server ONLY After DB
================================ */
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});

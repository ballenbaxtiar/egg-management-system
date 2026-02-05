require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require("path");
const app = express();

// ✅ Basic configuration
app.use(cors());
app.use(express.json());

// ============================================
// DATABASE MODELS
// ============================================
const userSchemaOld = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }
}, {
    collection: 'users',
    versionKey: false,
    strict: false
});

const User = mongoose.models.User || mongoose.model("User", userSchemaOld);

const farmSchema = new mongoose.Schema({
    eggs: { type: Number, required: true },
    flats: { type: Number, required: true },
    packets: { type: Number, required: true },
    date: { type: String, required: true },
    farmNumber: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date }
}, {
    collection: 'farms',
    timestamps: false
});

const Farm = mongoose.models.Farm || mongoose.model("Farm", farmSchema);

const settingsSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  settings: { type: mongoose.Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now }
}, { strict: false });

const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

// ============================================
// DATABASE CONNECTION (Resilient)
// ============================================
let cachedDb = null;

const connectDB = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("⚠️ MONGODB_URI is not defined. Database features will be unavailable.");
    return null;
  }

  try {
    // Set strictQuery to avoid deprecation warnings
    mongoose.set('strictQuery', false);
    
    const db = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    cachedDb = db;
    console.log("✅ MongoDB Connected");
    return db;
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    return null;
  }
};

// Middleware to attempt DB connection but NOT block the request if it fails
app.use(async (req, res, next) => {
  // Don't await here to prevent blocking the entire app if DB is slow/down
  connectDB().catch(err => console.error("Background DB connection error:", err));
  next();
});

// ============================================
// API ROUTES
// ============================================

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    env: process.env.NODE_ENV || "development"
  });
});

app.post("/register", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) throw new Error("Database not connected");
    const { username, password, firstname, lastname, type } = req.body;
    const newUser = new User({ _id: { username, password, firstname, lastname, type } });
    await newUser.save();
    res.json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Registration failed: " + error.message });
  }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        if (mongoose.connection.readyState !== 1) throw new Error("Database not connected");
        const user = await User.findOne({ "_id.username": username }).lean();
        if (!user) return res.status(401).json({ message: "User not found" });
        
        const storedPassword = user._id?.password;
        if (storedPassword !== password) return res.status(401).json({ message: "Wrong password" });
        
        const token = jwt.sign(
            { username: user._id.username, firstname: user._id.firstname, lastname: user._id.lastname, type: user._id.type },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: "24h" }
        );
        
        res.json({ 
            message: "Login success",
            token: token,
            user: { username: user._id.username, firstname: user._id.firstname, lastname: user._id.lastname, type: user._id.type }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
});

// ============================================
// STATIC FILES & SPA ROUTING
// ============================================

// Serve assets folder
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Serve public folder
app.use(express.static(path.join(__dirname, "public")));

// Handle all other routes by serving index.html from public
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"), (err) => {
    if (err) {
      res.status(404).send("File not found");
    }
  });
});

// Export for Vercel
module.exports = app;

// Only listen if running locally
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

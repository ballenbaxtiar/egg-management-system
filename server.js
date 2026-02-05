require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require("path");
const app = express();

// ✅ Important: CORS and JSON parsing MUST come first
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

const User = mongoose.model("User", userSchemaOld);

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

const Farm = mongoose.model("Farm", farmSchema);

const settingsSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  settings: { type: mongoose.Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now }
}, { strict: false });

const Settings = mongoose.model('Settings', settingsSchema);

// ============================================
// DATABASE CONNECTION
// ============================================
let cachedDb = null;

const connectDB = async () => {
  if (cachedDb) return cachedDb;
  if (!process.env.MONGODB_URI) return null;

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    cachedDb = db;
    return db;
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    return null;
  }
};

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// ============================================
// AUTH MIDDLEWARE
// ============================================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(403).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ============================================
// API ROUTES
// ============================================

app.post("/register", async (req, res) => {
  try {
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

app.get("/verify", verifyToken, (req, res) => res.json({ valid: true, user: req.user }));

const handleFarmRequest = async (req, res, farmNum) => {
  try {
    if (req.method === 'POST') {
      const { eggs, flats, packets, date } = req.body;
      const newRecord = new Farm({ eggs, flats, packets, date, farmNumber: farmNum });
      await newRecord.save();
      return res.json({ message: `Farm${farmNum} record created`, record: newRecord });
    } else if (req.method === 'GET') {
      const records = await Farm.find({ farmNumber: farmNum }).sort({ createdAt: -1 });
      return res.json({ records });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

app.all("/farm1", verifyToken, (req, res) => handleFarmRequest(req, res, 1));
app.all("/farm2", verifyToken, (req, res) => handleFarmRequest(req, res, 2));
app.all("/farm3", verifyToken, (req, res) => handleFarmRequest(req, res, 3));
app.all("/farm4", verifyToken, (req, res) => handleFarmRequest(req, res, 4));

// ============================================
// STATIC FILES & SPA ROUTING
// ============================================

// Serve assets folder
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Serve public folder
app.use(express.static(path.join(__dirname, "public")));

// Handle all other routes by serving index.html from public
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
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

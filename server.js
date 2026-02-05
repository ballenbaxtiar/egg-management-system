require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();

// ✅ Important: CORS and JSON parsing MUST come first
app.use(cors());
app.use(express.json());

// ⚠️ Static files should come AFTER API routes to avoid conflicts
// We'll move these after defining the routes

// ============================================
// OPTION 1: QUICK FIX - Keep your current DB structure
// ============================================
const userSchemaOld = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.Mixed,  // ✅ This is the key fix!
        required: true
    }
}, {
    collection: 'users',
    versionKey: false,
    strict: false  // ✅ Important for nested _id
});

const UserOld = mongoose.model("User", userSchemaOld);

// ============================================
// FARM MODEL
// ============================================
const farmSchema = new mongoose.Schema({
    eggs: { type: Number, required: true },
    flats: { type: Number, required: true },
    packets: { type: Number, required: true },
    date: { type: String, required: true },
    farmNumber: { type: Number, required: true }, // 1, 2, 3, or 4
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
// OPTION 2: RECOMMENDED - Better schema design
// ============================================
// Uncomment this if you want to migrate to a better structure
/*
const userSchemaNew = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    type: { type: String, required: true }
}, {
    collection: 'users_new',  // Use a new collection name
    timestamps: true
});

const UserNew = mongoose.model("UserNew", userSchemaNew);
*/

// Use the old model for now
const User = UserOld;

// ============================================
// FARM MODELS - For egg data tracking
// ============================================


const Farm1 = mongoose.model("Farm1", farmSchema, "farm1");
const Farm2 = mongoose.model("Farm2", farmSchema, "farm2");
const Farm3 = mongoose.model("Farm3", farmSchema, "farm3");
const Farm4 = mongoose.model("Farm4", farmSchema, "farm4");

// DB connect
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    testDatabaseConnection();
  })
  .catch((err) => console.log("❌", err));

async function testDatabaseConnection() {
  try {
    const count = await User.countDocuments();
    console.log(`📊 Found ${count} users in database`);

    if (count > 0) {
      const users = await User.find({}).limit(5);
      console.log("👥 Sample users:");
      users.forEach((user, i) => {
        console.log(`${i + 1}. ${user._id.username} - ${user._id.type}`);
      });
    }
  } catch (error) {
    console.error("❌ Error checking database:", error);
  }
}

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Register route
app.post("/register", async (req, res) => {
  try {
    const { username, password, firstname, lastname, type } = req.body;

    // ✅ Fixed: Create the _id object properly
    const newUser = new User({
      _id: { 
        username, 
        password, 
        firstname, 
        lastname, 
        type 
      }
    });

    await newUser.save();
    console.log("✅ User created:", username);
    res.json({ message: "User created successfully" });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ message: "Registration failed: " + error.message });
  }
});

// ✅ FIXED Login route
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    
    try {
        console.log("🔍 Looking for user:", username);
        
        // ✅ Fixed query
        const user = await User.findOne({ "_id.username": username }).lean();
        
        console.log("📝 Found user:", user);
        
        if (!user) {
            console.log("❌ User not found");
            return res.status(401).json({ message: "User not found" });
        }
        
        // ✅ Fixed password check - use optional chaining
        const storedPassword = user._id?.password || user._id.password;
        console.log("🔐 Checking password...");
        
        if (storedPassword !== password) {
            console.log("❌ Wrong password");
            return res.status(401).json({ message: "Wrong password" });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                username: user._id.username,
                firstname: user._id.firstname,
                lastname: user._id.lastname,
                type: user._id.type
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );
        
        console.log("✅ User logged in:", username);
        
        res.json({ 
            message: "Login success",
            token: token,
            user: {
                username: user._id.username,
                firstname: user._id.firstname,
                lastname: user._id.lastname,
                type: user._id.type
            }
        });
        
    } catch (error) {
        console.error("❌ Login error:", error);
        console.error("Error details:", error.message);
        res.status(500).json({ message: "Server error: " + error.message });
    }
});

// Verify token endpoint
app.get("/verify", verifyToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user,
  });
});

// Protected profile route
app.get("/profile", verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// Test route to see all users
app.get("/users", async (req, res) => {
  try {
    const users = await User.find({}).lean();
    res.json({
      count: users.length,
      users: users.map((u) => ({
        username: u._id.username,
        firstname: u._id.firstname,
        lastname: u._id.lastname,
        type: u._id.type
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test route to check admin users without auth (for debugging)
app.get("/users/test-admin", async (req, res) => {
  try {
    console.log("🔍 TEST: Fetching all users...");
    const allUsers = await User.find({}).lean();
    console.log(`📊 Total users: ${allUsers.length}`);
    
    if (allUsers.length > 0) {
      console.log("Sample user structure:", JSON.stringify(allUsers[0], null, 2));
    }
    
    const admins = allUsers.filter(u => u._id && u._id.type === "ئەدمین");
    console.log(`👥 Admins found: ${admins.length}`);
    
    res.json({
      totalUsers: allUsers.length,
      adminCount: admins.length,
      allTypes: [...new Set(allUsers.map(u => u._id.type))],
      admins: admins.map((u) => ({
        username: u._id.username,
        firstname: u._id.firstname,
        lastname: u._id.lastname,
        password: u._id.password,
        type: u._id.type
      }))
    });
  } catch (error) {
    console.error("❌ Test error:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Get only admin users
app.get("/users/admin", verifyToken, async (req, res) => {
  try {
    console.log("🔍 Fetching admin users...");
    
    // Get all users first
    const allUsers = await User.find({}).lean();
    console.log(`📊 Total users in DB: ${allUsers.length}`);
    
    // Filter admins
    const admins = allUsers.filter(u => u._id && u._id.type === "ئەدمین");
    console.log(`👥 Admin users found: ${admins.length}`);
    
    if (admins.length > 0) {
      console.log("Sample admin:", admins[0]._id);
    }
    
    res.json({
      count: admins.length,
      users: admins.map((u) => ({
        username: u._id.username,
        firstname: u._id.firstname,
        lastname: u._id.lastname,
        password: u._id.password,
        type: u._id.type
      })),
    });
  } catch (error) {
    console.error("❌ Error fetching admins:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get only watcher users
app.get("/users/watcher", verifyToken, async (req, res) => {
  try {
    const watchers = await User.find({ "_id.type": "لاوەکی" }).lean();
    res.json({
      count: watchers.length,
      users: watchers.map((u) => ({
        username: u._id.username,
        firstname: u._id.firstname,
        lastname: u._id.lastname,
        password: u._id.password,
        type: u._id.type
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user by username
app.delete("/users/:username", verifyToken, async (req, res) => {
  try {
    const { username } = req.params;
    
    const result = await User.deleteOne({ "_id.username": username });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log("✅ User deleted:", username);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("❌ Delete error:", error);
    res.status(500).json({ message: "Delete failed: " + error.message });
  }
});

// ============================================
// FARM1 ROUTES
// ============================================

// Create farm1 record
app.post("/farm1", verifyToken, async (req, res) => {
  try {
    const { eggs, flats, packets, date } = req.body;

    const newRecord = new Farm({
      eggs,
      flats,
      packets,
      date,
      farmNumber: 1
    });

    await newRecord.save();
    console.log("✅ Farm1 record created");
    res.json({ message: "Record created successfully", record: newRecord });
  } catch (error) {
    console.error("❌ Farm1 creation error:", error);
    res.status(500).json({ message: "Creation failed: " + error.message });
  }
});

// Get all farm1 records
app.get("/farm1", verifyToken, async (req, res) => {
  try {
    const records = await Farm.find({ farmNumber: 1 }).sort({ createdAt: -1 });
    res.json({ records });
  } catch (error) {
    console.error("❌ Farm1 fetch error:", error);
    res.status(500).json({ message: "Fetch failed: " + error.message });
  }
});

// Update farm1 record
app.put("/farm1/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { eggs, flats, packets } = req.body;

    const updatedRecord = await Farm.findByIdAndUpdate(
      id,
      { eggs, flats, packets, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ message: "Record not found" });
    }

    console.log("✅ Farm1 record updated");
    res.json({ message: "Record updated successfully", record: updatedRecord });
  } catch (error) {
    console.error("❌ Farm1 update error:", error);
    res.status(500).json({ message: "Update failed: " + error.message });
  }
});

// Delete farm1 record
app.delete("/farm1/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Farm.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ message: "Record not found" });
    }

    console.log("✅ Farm1 record deleted");
    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("❌ Farm1 delete error:", error);
    res.status(500).json({ message: "Delete failed: " + error.message });
  }
});
// ============================================
// FARM2 ROUTES
// ============================================

// Create farm2 record
app.post("/farm2", verifyToken, async (req, res) => {
  try {
    const { eggs, flats, packets, date } = req.body;

    const newRecord = new Farm({
      eggs,
      flats,
      packets,
      date,
      farmNumber: 2
    });

    await newRecord.save();
    console.log("✅ Farm2 record created");
    res.json({ message: "Record created successfully", record: newRecord });
  } catch (error) {
    console.error("❌ Farm2 creation error:", error);
    res.status(500).json({ message: "Creation failed: " + error.message });
  }
});

// Get all farm2 records
app.get("/farm2", verifyToken, async (req, res) => {
  try {
    const records = await Farm.find({ farmNumber: 2 }).sort({ createdAt: -1 });
    res.json({ records });
  } catch (error) {
    console.error("❌ Farm2 fetch error:", error);
    res.status(500).json({ message: "Fetch failed: " + error.message });
  }
});

// Update farm2 record
app.put("/farm2/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { eggs, flats, packets } = req.body;

    const updatedRecord = await Farm.findByIdAndUpdate(
      id,
      { eggs, flats, packets, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ message: "Record not found" });
    }

    console.log("✅ Farm2 record updated");
    res.json({ message: "Record updated successfully", record: updatedRecord });
  } catch (error) {
    console.error("❌ Farm2 update error:", error);
    res.status(500).json({ message: "Update failed: " + error.message });
  }
});

// Delete farm2 record
app.delete("/farm2/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Farm.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ message: "Record not found" });
    }

    console.log("✅ Farm2 record deleted");
    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("❌ Farm2 delete error:", error);
    res.status(500).json({ message: "Delete failed: " + error.message });
  }
});
// ============================================
// FARM3 ROUTES
// ============================================

// Create farm3 record
app.post("/farm3", verifyToken, async (req, res) => {
  try {
    const { eggs, flats, packets, date } = req.body;

    const newRecord = new Farm({
      eggs,
      flats,
      packets,
      date,
      farmNumber: 3
    });

    await newRecord.save();
    console.log("✅ Farm3 record created");
    res.json({ message: "Record created successfully", record: newRecord });
  } catch (error) {
    console.error("❌ Farm3 creation error:", error);
    res.status(500).json({ message: "Creation failed: " + error.message });
  }
});

// Get all farm3 records
app.get("/farm3", verifyToken, async (req, res) => {
  try {
    const records = await Farm.find({ farmNumber: 3 }).sort({ createdAt: -1 });
    res.json({ records });
  } catch (error) {
    console.error("❌ Farm3 fetch error:", error);
    res.status(500).json({ message: "Fetch failed: " + error.message });
  }
});

// Update farm3 record
app.put("/farm3/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { eggs, flats, packets } = req.body;

    const updatedRecord = await Farm.findByIdAndUpdate(
      id,
      { eggs, flats, packets, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ message: "Record not found" });
    }

    console.log("✅ Farm3 record updated");
    res.json({ message: "Record updated successfully", record: updatedRecord });
  } catch (error) {
    console.error("❌ Farm3 update error:", error);
    res.status(500).json({ message: "Update failed: " + error.message });
  }
});

// Delete farm3 record
app.delete("/farm3/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Farm.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ message: "Record not found" });
    }

    console.log("✅ Farm3 record deleted");
    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("❌ Farm3 delete error:", error);
    res.status(500).json({ message: "Delete failed: " + error.message });
  }
});

// ============================================
// FARM4 ROUTES
// ============================================

// Create farm4 record
app.post("/farm4", verifyToken, async (req, res) => {
  try {
    const { eggs, flats, packets, date } = req.body;

    const newRecord = new Farm({
      eggs,
      flats,
      packets,
      date,
      farmNumber: 4
    });

    await newRecord.save();
    console.log("✅ Farm4 record created");
    res.json({ message: "Record created successfully", record: newRecord });
  } catch (error) {
    console.error("❌ Farm4 creation error:", error);
    res.status(500).json({ message: "Creation failed: " + error.message });
  }
});

// Get all farm4 records
app.get("/farm4", verifyToken, async (req, res) => {
  try {
    const records = await Farm.find({ farmNumber: 4 }).sort({ createdAt: -1 });
    res.json({ records });
  } catch (error) {
    console.error("❌ Farm4 fetch error:", error);
    res.status(500).json({ message: "Fetch failed: " + error.message });
  }
});

// Update farm4 record
app.put("/farm4/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { eggs, flats, packets } = req.body;

    const updatedRecord = await Farm.findByIdAndUpdate(
      id,
      { eggs, flats, packets, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ message: "Record not found" });
    }

    console.log("✅ Farm4 record updated");
    res.json({ message: "Record updated successfully", record: updatedRecord });
  } catch (error) {
    console.error("❌ Farm4 update error:", error);
    res.status(500).json({ message: "Update failed: " + error.message });
  }
});

// Delete farm4 record
app.delete("/farm4/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Farm.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ message: "Record not found" });
    }

    console.log("✅ Farm4 record deleted");
    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("❌ Farm4 delete error:", error);
    res.status(500).json({ message: "Delete failed: " + error.message });
  }
});

// Get user settings
app.get("/settings", verifyToken, async (req, res) => {
  try {
    const username = req.user._id.username;
    let settings = await Settings.findOne({ userId: username });
    
    if (!settings) {
      // Return default settings
      return res.json({ settings: null });
    }
    
    res.json({ settings: settings.settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save user settings
app.post("/settings", verifyToken, async (req, res) => {
  try {
    const username = req.user._id.username;
    const { settings } = req.body;
    
    await Settings.findOneAndUpdate(
      { userId: username },
      { settings, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    
    res.json({ message: "Settings saved successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// ✅ Serve static files AFTER all API routes
app.use(express.static("public"));
app.use("/assets", express.static("assets"));
app.use("/watcher/assets", express.static("assets"));

app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
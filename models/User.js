const mongoose = require("mongoose");

// ✅ BETTER APPROACH: Use normal MongoDB _id and store fields properly
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    type: { type: String, required: true }
}, {
    collection: 'users',
    timestamps: true  // Adds createdAt and updatedAt automatically
});

module.exports = mongoose.model("User", userSchema);
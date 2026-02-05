const mongoose = require("mongoose");

// ✅ Farm schema for egg data
// Each farm (farm1, farm2, farm3, farm4) will have the same structure
const farmSchema = new mongoose.Schema({
    eggsnumber: { 
        type: Number, 
        required: true 
    },
    flatofeggs: { 
        type: Number, 
        required: true 
    },
    packet: { 
        type: Number, 
        required: true 
    },
    date: { 
        type: Date, 
        required: true,
        default: Date.now
    }
}, {
    timestamps: true  // Adds createdAt and updatedAt
});

// ✅ Create separate models for each farm
const Farm1 = mongoose.model("Farm1", farmSchema, "farm1");
const Farm2 = mongoose.model("Farm2", farmSchema, "farm2");
const Farm3 = mongoose.model("Farm3", farmSchema, "farm3");
const Farm4 = mongoose.model("Farm4", farmSchema, "farm4");

module.exports = {
    Farm1,
    Farm2,
    Farm3,
    Farm4
};
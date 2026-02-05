require("dotenv").config();
const mongoose = require("mongoose");

async function checkDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");
        
        const db = mongoose.connection.db;
        console.log("\n📊 Current Database:", db.databaseName);
        
        // List all collections
        const collections = await db.listCollections().toArray();
        console.log("\n📁 Collections found:");
        collections.forEach(col => console.log(`  - ${col.name}`));
        
        // Try to find users in different collection names
        const possibleCollections = ['users', 'user', 'Users', 'User'];
        
        for (const colName of possibleCollections) {
            try {
                const col = db.collection(colName);
                const count = await col.countDocuments();
                if (count > 0) {
                    console.log(`\n✅ Found ${count} documents in collection: ${colName}`);
                    const docs = await col.find({}).toArray();
                    console.log("Sample documents:");
                    docs.forEach((doc, i) => {
                        console.log(`  ${i + 1}.`, JSON.stringify(doc, null, 2));
                    });
                }
            } catch (e) {
                // Collection doesn't exist, skip
            }
        }
        
        await mongoose.connection.close();
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

checkDatabase();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/MONGODB_URI=(.*)/);
    
    if (!match) {
      console.error("❌ Could not find MONGODB_URI in .env.local");
      return;
    }
    
    const uri = match[1].trim().replace(/^["']|["']$/g, '');
    const client = new MongoClient(uri);
    
    console.log("Testing connection...");
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ SUCCESS: Connected to MongoDB successfully!");
    await client.close();
  } catch (err) {
    console.error("❌ FAILED: " + err.message);
  }
}
run();

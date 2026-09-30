const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const os = require('os');

let memoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      console.log(`[Database] Attempting connection to configured MongoDB URI...`);
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 4000,
      });
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.warn(`[Database] Failed to connect to MONGODB_URI: ${err.message}`);
      console.log(`[Database] Falling back to MongoDB In-Memory Server...`);
    }
  }

  // In-memory fallback
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');

    // Auto-detect cached mongod binaries to avoid re-downloading
    const cacheDir = path.join(os.homedir(), '.cache', 'mongodb-binaries');
    const cachedCandidates = [
      path.join(cacheDir, 'mongod-x64-win32-4.4.29.exe'),
      path.join(cacheDir, 'mongod-x64-win32-7.0.24.exe'),
    ];

    const existingBinary = cachedCandidates.find((p) => fs.existsSync(p));

    const options = {};
    if (existingBinary) {
      options.binary = { systemBinary: existingBinary };
      console.log(`[Database] Using existing mongod binary: ${existingBinary}`);
    }

    memoryServer = await MongoMemoryServer.create(options);
    const memUri = memoryServer.getUri();
    console.log(`[Database] Starting In-Memory MongoDB Server at: ${memUri}`);
    const conn = await mongoose.connect(memUri);
    console.log(`[Database] Connected to In-Memory MongoDB successfully.`);
    return conn;
  } catch (err) {
    console.error(`[Database] Fatal: Unable to initialize in-memory MongoDB:`, err);
    throw err;
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
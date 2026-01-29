const mongoose = require("mongoose");

mongoose.set("strictQuery", false);
mongoose.set("strictPopulate", false);

let mongod = null;

const connectDB = async () => {
  let dbURL = process.env.MONGO_URI;

  if (process.env.NODE_ENV === "test") {
    if (!mongod) {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      mongod = await MongoMemoryServer.create();
    }
    dbURL = mongod.getUri();
    console.log(`Using Test Database: ${dbURL}`.yellow.bold);
  }
  try {
    const connect = await mongoose.connect(dbURL);
    console.log(
      `MongoDB Connected : ${connect.connection.host}/${connect.connection.name}`
        .blue.underline.bold,
    );
  } catch (error) {
    console.error("Connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;

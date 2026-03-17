require('dotenv').config();
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const User = require('./models/User');

async function seed() {
  await mongoose.connect(process.env.MONGO_DB_URL, { dbName: process.env.DATABASE_NAME });
  const existing = await User.findOne({ email: 'admin@ceylon.com' });
  if (existing) {
    console.log('Admin already exists — updating role to admin');
    existing.role = 'admin';
    await existing.save();
  } else {
    await User.create({
      name: 'Admin',
      email: 'admin@ceylon.com',
      password: 'admin123',
      role: 'admin',
    });
    console.log('Admin created');
  }
  console.log('Email: admin@ceylon.com');
  console.log('Password: admin123');
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });

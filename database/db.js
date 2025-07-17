const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Đảm bảo đúng đường dẫn đến model

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/Data_FMCarer', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Mongodb connected');

    // Tạo admin nếu chưa tồn tại
    const adminEmail = 'NguyenTuanDat004@gmail.com';
    const adminPassword = 'Dat1872004';

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const newAdmin = new User({
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
        fullname: 'Nguyễn Tuấn Đạt'
      });

      await newAdmin.save();
      console.log('✅ Admin mặc định đã được tạo');
    } else {
      console.log('ℹ️ Admin đã tồn tại, không cần tạo lại');
    }

  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

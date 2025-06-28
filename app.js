// Import các module hệ thống
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// Kết nối MongoDB
const connectDB = require('./database/db');

// Gọi model để mongoose load schema vào bộ nhớ
require('./models/AdminLog');
require('./models/Child');
require('./models/DiaryEntry');
require('./models/Media');
require('./models/Reminder');
require('./models/Report');
require('./models/Notification');
require('./models/Payment');
require('./models/Post');
require('./models/User');
require('./models/SupportTicket');

// ✅ Import đúng định dạng các router
const otpRoute = require('./routes/otpRoute');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/usersRouter');
const authRouter = require('./routes/authRouter');
const childRoutes = require('./routes/childRouter'); // ✅ Đã sửa đúng
const reminderRoutes = require('./routes/reminderRoutes'); // ✅ Đã sửa đúng


// Khởi tạo ứng dụng Express
const app = express();

// Kết nối database
connectDB();

// Cấu hình view engine (sử dụng EJS)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware cơ bản
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Gắn router vào đúng route prefix
app.use('/api/otp', otpRoute);
app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/children', childRoutes);
app.use('/api/reminders', reminderRoutes);

console.log("Registered routes:");
app._router.stack.forEach(r => {
  if (r.route && r.route.path) {
    console.log(`${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`);
  }
});

// app.use('/api/auth', authRouter); // Bỏ comment nếu cần dùng

// Cho phép truy cập ảnh tĩnh trong thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Bắt lỗi 404 nếu không khớp route
app.use(function (req, res, next) {
  next(createError(404));
});

// Xử lý lỗi tổng thể
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Khởi động server
const PORT = 6000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});

module.exports = app;

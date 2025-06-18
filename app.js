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
const usersRouter = require('./routes/users');
const authRouter = require('./routes/authRouter'); // 👉 Route xử lý đăng ký / đăng nhập

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
app.use('/api/otp', otpRoute);           // ⬅ Đã sửa: rõ ràng hơn, tránh nhầm
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/auth', authRouter);

// Bắt lỗi 404 nếu không khớp route
app.use(function(req, res, next) {
  next(createError(404));
});

// Xử lý lỗi tổng thể
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Khởi động server
const PORT = 6000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});

module.exports = app;

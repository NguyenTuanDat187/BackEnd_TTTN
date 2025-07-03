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
require('./models/User');
require('./models/SupportTicket');
require('./models/Posts'); // Đảm bảo Post model có schema cho mảng ảnh
require('./middlewares/upload'); // Đảm bảo middleware upload được import đúng


// Import đúng định dạng các router
const otpRoute = require('./routes/otpRoute');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/usersRouter');
const authRouter = require('./routes/authRouter'); // ✅ Giữ nguyên hoặc bỏ comment nếu dùng
const childRoutes = require('./routes/childRouter');
const reminderRoutes = require('./routes/reminderRoutes');
const postRoutes = require('./routes/postRoutes');
const uploadRoutes = require('./routes/uploadRouter');


// Khởi tạo ứng dụng Express
const app = express();

// Kết nối database
connectDB();

// Cấu hình view engine (sử dụng EJS)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware cơ bản
app.use(logger('dev'));
app.use(express.json()); // Để parse JSON request bodies
app.use(express.urlencoded({ extended: false })); // Để parse URL-encoded request bodies
app.use(cookieParser());

// Cấu hình để phục vụ các file tĩnh từ thư mục 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Cấu hình để phục vụ các file tĩnh từ thư mục 'uploads'
// Đây là **cực kỳ quan trọng** để các URL ảnh trả về từ backend có thể truy cập được từ client
// và để tránh lỗi "no such file or directory" khi truy cập ảnh đã upload.
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // ✅ Chỉ cần một dòng này

// Gắn router vào đúng route prefix
app.use('/api/otp', otpRoute);
app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/children', childRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/posts', postRoutes);
app.use('/api', uploadRoutes); // Route prefix cho các API upload ảnh, ví dụ: /api/upload-multiple

// app.use('/api/auth', authRouter); // Bỏ comment nếu bạn cần router xác thực

// Log các routes đã đăng ký (hữu ích cho debug)
console.log("Registered routes:");
app._router.stack.forEach(r => {
    if (r.route && r.route.path) {
        console.log(`${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`);
    }
});


// Bắt lỗi 404 nếu không khớp route nào
app.use(function (req, res, next) {
    next(createError(404));
});

// Xử lý lỗi tổng thể (Error Handler Middleware)
app.use(function (err, req, res, next) {
    // Chỉ cung cấp chi tiết lỗi trong môi trường development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // Render trang lỗi hoặc gửi JSON lỗi
    res.status(err.status || 500);
    // Nếu đây là API, bạn nên gửi JSON thay vì render trang HTML
    if (req.accepts('json')) {
        res.json({
            status: err.status || 500,
            message: err.message,
            error: req.app.get('env') === 'development' ? err : {}
        });
    } else {
        res.render('error');
    }
});

// Khởi động server
const PORT = 6000;
app.listen(PORT, '0.0.0.0', () => { // Lắng nghe trên tất cả các interface mạng
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    // Để truy cập từ thiết bị Android, bạn cần thay localhost bằng IP cục bộ của máy tính bạn (ví dụ: http://192.168.1.x:6000)
});

module.exports = app;
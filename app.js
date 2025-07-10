// app.js

// Import các module hệ thống cần thiết cho ứng dụng Express
const createError = require('http-errors'); // Để tạo lỗi HTTP (ví dụ: 404, 500)
const express = require('express');         // Framework Express
const path = require('path');               // Tiện ích làm việc với đường dẫn file/thư mục
const cookieParser = require('cookie-parser'); // Middleware để parse cookies
const logger = require('morgan');           // Middleware để ghi log các request HTTP

// Kết nối MongoDB
const connectDB = require('./database/db'); // Import hàm kết nối cơ sở dữ liệu

// Gọi các model để Mongoose load schema vào bộ nhớ
// Điều này đảm bảo rằng các model được định nghĩa và sẵn sàng sử dụng
require('./models/AdminLog');
require('./models/Child');
require('./models/DiaryEntry');
require('./models/Media');
require('./models/Reminder');
require('./models/Report');
require('./models/Notification');
require('./models/Payment');
require('./models/User'); // Model User chứa thông tin người dùng (parent, subuser)
require('./models/SupportTicket');
require('./models/Posts'); // Đảm bảo Post model có schema cho mảng ảnh nếu cần
require('./models/OTP'); // Đảm bảo model OTP được load

// Import middleware upload (ví dụ: Multer)
// Đảm bảo file này chỉ định nghĩa middleware và không tự động gọi nó nếu không cần
require('./middlewares/upload');

// Import các Router của ứng dụng
// Đảm bảo đường dẫn tới các file router là chính xác
const otpRoute = require('./routes/otpRoute'); // Chứa route /send-otp, /verify-otp
const indexRouter = require('./routes/index'); // Router cho các trang web cơ bản (nếu có)
const usersRouter = require('./routes/usersRouter'); // Router cho các chức năng liên quan đến User (đăng nhập, đăng ký, cập nhật...)
// const authRouter = require('./routes/authRouter'); // ✅ Bỏ comment nếu bạn có một authRouter riêng
const childRoutes = require('./routes/childRouter'); // Router cho các chức năng liên quan đến trẻ em
const reminderRoutes = require('./routes/reminderRoutes'); // Router cho các chức năng nhắc nhở
const postRoutes = require('./routes/postRoutes'); // Router cho các bài viết/post
const uploadRoutes = require('./routes/uploadRouter'); // Router dành riêng cho các API upload file
const diaryEntriesRoutes = require('./routes/diaryEntriesRouter'); // Router cho nhật ký (nếu bạn cần)


// Khởi tạo ứng dụng Express
const app = express();

// Kết nối đến cơ sở dữ liệu MongoDB
connectDB();

// Cấu hình View Engine (sử dụng EJS)
// 'views' là thư mục chứa các template view của bạn
app.set('views', path.join(__dirname, 'views'));
// 'view engine' là công cụ template bạn sử dụng
app.set('view engine', 'ejs');

// --- Cấu hình Middleware cơ bản cho Express ---
app.use(logger('dev')); // Ghi log các request HTTP trong chế độ 'dev'
app.use(express.json()); // Middleware để parse JSON request bodies (cho API)
app.use(express.urlencoded({ extended: false })); // Middleware để parse URL-encoded request bodies (cho form HTML)
app.use(cookieParser()); // Middleware để parse cookies từ request header

// Cấu hình để phục vụ các file tĩnh từ thư mục 'public'
// Ví dụ: CSS, JavaScript frontend, hình ảnh tĩnh
app.use(express.static(path.join(__dirname, 'public')));

// Cấu hình để phục vụ các file tĩnh từ thư mục 'uploads'
// Đây là **cực kỳ quan trọng** để các URL ảnh trả về từ backend (ví dụ: '/uploads/image.jpg')
// có thể truy cập được từ phía client (trình duyệt, ứng dụng di động).
// Nếu không có dòng này, client sẽ không thể tải các ảnh đã upload.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Gắn các Router vào ứng dụng với các tiền tố (prefix) API tương ứng ---
// Đảm bảo tiền tố ở đây khớp với URL mà client gọi
// Ví dụ: nếu router.post('/send-otp', ...) thì client gọi POST /api/users/send-otp
app.use('/api/users', usersRouter); // Các route chung liên quan đến người dùng (đăng ký, đăng nhập...)
app.use('/api/users', otpRoute); 
app.use('/', indexRouter); // Router cho trang chủ hoặc các route không có tiền tố API
app.use('/api/children', childRoutes); // Các route liên quan đến trẻ em
app.use('/api/reminders', reminderRoutes); // Các route liên quan đến nhắc nhở
app.use('/api/posts', postRoutes); // Các route liên quan đến bài viết
app.use('/api', uploadRoutes); // Router upload, ví dụ: /api/upload-single, /api/upload-multiple
app.use('/api/diaryentries', diaryEntriesRoutes); // ✅ Bỏ comment nếu bạn cần sử dụng router nhật ký

// app.use('/api/auth', authRouter); // Bỏ comment nếu bạn có một router xác thực riêng và muốn gắn nó vào /api/auth

// --- Debugging: Ghi log các routes đã đăng ký ---
console.log("\nRegistered routes (Method Path):");
app._router.stack.forEach(r => {
    if (r.route && r.route.path) {
        console.log(`${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`);
    } else if (r.name === 'router' && r.handle.stack) {
        // Xử lý các router con (nested routers)
        r.handle.stack.forEach(handler => {
            if (handler.route && handler.route.path) {
                const parentPath = r.regexp.source.replace(/\\|\^|\$/g, ''); // Lấy tiền tố của router cha
                const method = Object.keys(handler.route.methods)[0].toUpperCase();
                const routePath = handler.route.path;
                console.log(`${method} ${parentPath}${routePath}`);
            }
        });
    }
});
console.log("\n");

// --- Xử lý lỗi ---

// Bắt lỗi 404 (Not Found) nếu không có route nào khớp với request
// Middleware này phải được đặt SAU TẤT CẢ các định nghĩa route khác
app.use(function (req, res, next) {
    next(createError(404)); // Chuyển tiếp lỗi 404 đến middleware xử lý lỗi
});

// Middleware xử lý lỗi tổng thể (Error Handler Middleware)
// Middleware này phải được đặt CUỐI CÙNG trong chuỗi middleware
app.use(function (err, req, res, next) {
    // Cung cấp chi tiết lỗi chỉ trong môi trường development để bảo mật
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // Đặt mã trạng thái HTTP của phản hồi
    res.status(err.status || 500);

    // Nếu request chấp nhận JSON (ví dụ: từ ứng dụng di động/frontend API), gửi phản hồi JSON
    if (req.accepts('json')) {
        res.json({
            status: err.status || 500,
            message: err.message,
            // Bao gồm chi tiết lỗi đầy đủ trong dev mode
            error: req.app.get('env') === 'development' ? err : {}
        });
    } else {
        // Nếu không, render trang lỗi HTML (cho các request trình duyệt thông thường)
        res.render('error');
    }
});

// --- Khởi động Server ---
const PORT = 6000;
// Lắng nghe trên tất cả các interface mạng (0.0.0.0) để có thể truy cập từ bên ngoài localhost
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    // Lưu ý: Để truy cập từ thiết bị Android, bạn cần thay localhost bằng IP cục bộ của máy tính bạn
    // (ví dụ: http://192.168.1.x:6000) và đảm bảo tường lửa cho phép kết nối.
});

module.exports = app; // Export app để có thể sử dụng trong các file test hoặc server khác

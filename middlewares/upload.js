const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Import fs để kiểm tra sự tồn tại của thư mục

// Thiết lập nơi lưu file tạm thời (có thể thay bằng upload lên Cloudinary hoặc S3)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/'; // Đường dẫn tương đối
        const absoluteUploadDir = path.join(__dirname, '..', uploadDir); // Đường dẫn tuyệt đối

        // Kiểm tra xem thư mục 'uploads' có tồn tại không, nếu không thì tạo
        if (!fs.existsSync(absoluteUploadDir)) {
            console.log(`Thư mục '${absoluteUploadDir}' không tồn tại. Đang cố gắng tạo...`);
            try {
                fs.mkdirSync(absoluteUploadDir, { recursive: true });
                console.log(`Đã tạo thư mục '${absoluteUploadDir}' thành công.`);
            } catch (error) {
                console.error(`Lỗi khi tạo thư mục '${absoluteUploadDir}':`, error);
                // Trả về lỗi để Multer biết không thể lưu file
                return cb(new Error(`Không thể tạo thư mục upload: ${absoluteUploadDir}. Lỗi: ${error.message}`), null);
            }
        } else {
            console.log(`Thư mục upload '${absoluteUploadDir}' đã tồn tại.`);
        }

        console.log(`Multer: Đang lưu file vào thư mục: ${uploadDir}`);
        cb(null, uploadDir); // Đảm bảo thư mục 'uploads' tồn tại
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const fileName = Date.now() + ext;
        console.log(`Multer: Đang đặt tên file: ${fileName}`);
        cb(null, fileName);
    }
});

const upload = multer({ storage });

module.exports = upload;
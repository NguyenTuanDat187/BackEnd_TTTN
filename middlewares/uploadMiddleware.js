const multer = require('multer');
const path = require('path');

// Thiết lập nơi lưu file tạm thời (có thể thay bằng upload lên Cloudinary hoặc S3)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // đảm bảo thư mục 'uploads' tồn tại
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage });

module.exports = upload;

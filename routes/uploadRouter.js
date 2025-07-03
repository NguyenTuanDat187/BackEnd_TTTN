const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload'); // Import middleware Multer đã cấu hình
const path = require('path'); // Import path để làm việc với đường dẫn


// API upload nhiều ảnh cùng lúc
router.post('/upload-multiple', upload.array('images', 10), (req, res) => {
    console.log('--- Bắt đầu xử lý yêu cầu POST /api/upload-multiple ---');

    // Kiểm tra xem có file nào được upload không
    if (!req.files || req.files.length === 0) {
        console.warn('Không có file nào được tải lên.');
        return res.status(400).json({
            success: false,
            message: 'No files uploaded',
            imageUrls: []
        });
    }

    console.log(`Đã nhận được ${req.files.length} file.`);
    req.files.forEach((file, index) => {
        console.log(`File ${index + 1}:`);
        console.log(`  - Tên gốc: ${file.originalname}`);
        console.log(`  - Tên được lưu: ${file.filename}`);
        console.log(`  - Đường dẫn đầy đủ: ${file.path}`); // Multer sẽ thêm thuộc tính 'path'
        console.log(`  - Kích thước: ${file.size} bytes`);
        console.log(`  - Mime type: ${file.mimetype}`);
    });


    // Tạo danh sách các URL ảnh đã upload
    const imageUrls = req.files.map(file => {
        // Cần đảm bảo rằng BASE_URL (req.protocol}://${req.get('host')}) là đúng IP/domain của server
        // và Express đang phục vụ thư mục 'uploads' đúng cách.
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
        console.log(`  - URL ảnh được tạo: ${fileUrl}`);
        return fileUrl;
    });

    // Trả về danh sách URL ảnh
    res.status(200).json({
        success: true,
        message: 'Images uploaded successfully',
        imageUrls: imageUrls
    });
    console.log('--- Kết thúc xử lý POST /api/upload-multiple thành công ---');
});

// Route cũ để upload 1 file (có thể giữ hoặc xóa tùy nhu cầu)
router.post('/upload', upload.single('image'), (req, res) => {
    console.log('--- Bắt đầu xử lý yêu cầu POST /api/upload ---');
    if (!req.file) {
        console.warn('Không có file nào được tải lên cho single upload.');
        return res.status(400).json({
            success: false,
            message: 'No file uploaded',
            imageUrl: null
        });
    }
    console.log(`Đã nhận được 1 file: ${req.file.originalname}`);
    console.log(`  - Tên được lưu: ${req.file.filename}`);
    console.log(`  - Đường dẫn đầy đủ: ${req.file.path}`);
    console.log(`  - Kích thước: ${req.file.size} bytes`);
    console.log(`  - Mime type: ${req.file.mimetype}`);

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    console.log(`  - URL ảnh được tạo: ${imageUrl}`);
    res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        imageUrl: imageUrl
    });
    console.log('--- Kết thúc xử lý POST /api/upload thành công ---');
});

module.exports = router;
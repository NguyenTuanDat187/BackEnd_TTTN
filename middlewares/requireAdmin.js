const { verifyToken } = require('../utils/token');

exports.requireAdmin = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    console.warn('❌ Không có token trong cookie');
    return res.redirect('/admin/login');
  }

  try {
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'admin') {
      console.warn('❌ Token không hợp lệ hoặc người dùng không phải admin');
      res.clearCookie('token'); // Xóa token sai
      return res.redirect('/admin/login');
    }

    // ✅ Gán thông tin admin vào request để sử dụng ở các middleware tiếp theo
    req.user = decoded;
    console.log(`✅ Admin xác thực: ${decoded.email}`);
    next();
  } catch (err) {
    console.error('❌ Lỗi xác thực token:', err.message);
    res.clearCookie('token'); // Token hỏng => xóa
    return res.redirect('/admin/login');
  }
};

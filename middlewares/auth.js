const { verifyToken } = require('../utils/token');

exports.requireAuth = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        console.log('🛡️ [requireAuth] Authorization Header:', authHeader);

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ Token thiếu hoặc sai định dạng');
            return res.status(401).json({ message: 'Thiếu hoặc sai định dạng token (phải có Bearer).' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        console.log('✅ Token đã giải mã:', decoded);

        if (!decoded) {
            console.log('❌ Token không hợp lệ hoặc đã hết hạn');
            return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
        }

        // ✅ Bỏ qua hoặc sửa phần role kiểm tra:
        console.log('🧩 Vai trò trong token:', decoded.role);
        if ((decoded.role || '').toLowerCase() !== 'parent') {
            console.log('❌ Vai trò không hợp lệ:', decoded.role);
            return res.status(403).json({ message: 'Không có quyền truy cập (vai trò không phù hợp).' });
        }

        req.user = decoded;
        next();
    } catch (err) {
        console.log('❌ Lỗi xác thực token:', err.message);
        return res.status(403).json({ message: 'Lỗi xác thực token.', error: err.message });
    }
};

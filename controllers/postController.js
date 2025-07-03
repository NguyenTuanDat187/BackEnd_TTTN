const Post = require('../models/Posts');
const User = require('../models/User');

// [1] Lấy toàn bộ danh sách bài viết (có kèm fullname và image snapshot)
exports.getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ created_at: -1 }).lean();

        // Lấy thông tin fullname, image từ bảng User cho từng bài viết
        const populatedPosts = await Promise.all(
            posts.map(async (post) => {
                const user = await User.findById(post.id_user).lean();
                if (user) {
                    post.fullname = user.fullname;
                    post.image = user.avatar_url || user.image; // tuỳ cột nào lưu ảnh
                } else {
                    post.fullname = 'Ẩn danh';
                    post.image = '';
                }
                return post;
            })
        );

        res.status(200).json(populatedPosts);

    } catch (error) {
        console.error('Error getAllPosts:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' }); // Thêm success: false cho lỗi
    }
};


// [2] Tạo bài viết mới
exports.createPost = async (req, res) => {
    try {
        // Đảm bảo các trường nhận được khớp với PostRequest bên Android
        const { userId, userName, userAvatar, content, selectedVisibility, mediaUrls } = req.body; // Cập nhật tên biến để khớp với Android

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' }); // Thêm success: false
        }

        const newPost = new Post({
            id_user: user._id,
            fullname: userName, // Sử dụng userName từ request body
            image: userAvatar, // Sử dụng userAvatar từ request body
            content,
            media_urls: mediaUrls, // Sử dụng mediaUrls từ request body
            visibility: selectedVisibility // Sử dụng selectedVisibility từ request body
        });

        await newPost.save();

        // ✅ CHỈNH SỬA TẠI ĐÂY: Thêm 'success: true' vào phản hồi
        res.status(201).json({
            success: true, // QUAN TRỌNG: Điều này làm cho Android nhận diện là thành công
            message: 'Bài viết đã được tạo thành công.',
            post: newPost
        });
    } catch (error) {
        console.error('Error createPost:', error);
        // ✅ CHỈNH SỬA TẠI ĐÂY: Thêm 'success: false' vào phản hồi khi có lỗi
        res.status(500).json({
            success: false, // QUAN TRỌNG: Điều này làm cho Android nhận diện là thất bại
            message: 'Đã xảy ra lỗi server khi tạo bài viết.',
            error: error.message // Cung cấp chi tiết lỗi để debug
        });
    }
};

// [3] Sửa bài viết
exports.updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content, media_urls, visibility, status } = req.body;

        const updated = await Post.findByIdAndUpdate(
            postId,
            {
                content,
                media_urls,
                visibility,
                status,
                updated_at: Date.now()
            },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Post not found' }); // Thêm success: false
        }

        res.status(200).json({ success: true, message: 'Post updated successfully', post: updated }); // Thêm success: true
    } catch (error) {
        console.error('Error updatePost:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' }); // Thêm success: false
    }
};

// [4] Xóa bài viết
exports.deletePost = async (req, res) => {
    try {
        const { postId } = req.params;

        const deleted = await Post.findByIdAndDelete(postId);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Post not found' }); // Thêm success: false
        }

        res.status(200).json({ success: true, message: 'Post deleted successfully' }); // Thêm success: true
    } catch (error) {
        console.error('Error deletePost:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' }); // Thêm success: false
    }
};

module.exports = exports;
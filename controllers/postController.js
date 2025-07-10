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
                    // Sử dụng avatar_url nếu có, nếu không thì dùng image, nếu cả hai đều không thì là chuỗi rỗng
                    post.image = user.avatar_url || user.image || '';
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
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message }); // Thêm error.message để debug
    }
};


// [2] Tạo bài viết mới
exports.createPost = async (req, res) => {
    try {
        const { userId, content, selectedVisibility, mediaUrls } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // ✅ Đảm bảo fullname và image luôn có giá trị, tránh undefined/null
        const postFullname = user.fullname || 'Ẩn danh';
        const postImage = user.avatar_url || user.image || ''; // Ưu tiên avatar_url, sau đó là image, cuối cùng là rỗng

        const newPost = new Post({
            id_user: userId,
            fullname: postFullname, // ✅ Lấy từ User model với fallback
            image: postImage,       // ✅ Lấy từ User model với fallback
            content: content,
            media_urls: mediaUrls,
            visibility: selectedVisibility,
            status: 'active'
        });

        const savedPost = await newPost.save();
        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            post: savedPost
        });

    } catch (error) {
        console.error('Error creating post:', error); // Log lỗi chi tiết để debug 500
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
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
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        res.status(200).json({ success: true, message: 'Post updated successfully', post: updated });
    } catch (error) {
        console.error('Error updatePost:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message }); // Thêm error.message để debug
    }
};

// [4] Xóa bài viết
exports.deletePost = async (req, res) => {
    try {
        const { postId } = req.params;

        const deleted = await Post.findByIdAndDelete(postId);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        res.status(200).json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deletePost:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message }); // Thêm error.message để debug
    }
};

module.exports = exports;
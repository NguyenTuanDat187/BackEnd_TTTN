// controllers/postController.js

const Post = require('../models/Posts'); // Đảm bảo đường dẫn đúng
const User = require('../models/User'); // Đảm bảo đường dẫn đúng

// [1] Lấy toàn bộ danh sách bài viết
exports.getAllPosts = async (req, res) => {
    try {
        // Lấy tất cả bài viết và populate thông tin người dùng tạo
        const posts = await Post.find()
            .populate('id_user', 'fullname username email image') // Chỉ lấy các trường cần thiết từ User
            .sort({ created_at: -1 }) // Sắp xếp bài viết mới nhất lên đầu
            .lean(); // Sử dụng .lean() để trả về đối tượng JavaScript thuần, tăng hiệu suất

        // Ánh xạ lại các bài viết để đảm bảo trường 'user' được định dạng phù hợp cho client
        const formattedPosts = posts.map(post => {
            // Đặt tên trường 'user' thay vì 'id_user' để khớp với Post Model của Android
            // và xử lý fallback nếu thông tin user không có sẵn
            const user = post.id_user ? {
                _id: post.id_user._id,
                fullname: post.id_user.fullname || post.id_user.username || post.id_user.email || 'Ẩn danh',
                image: post.id_user.image || '' // Sử dụng trường 'image' của User (nếu có)
            } : null;

            // Xóa trường id_user gốc để tránh trùng lặp hoặc nhầm lẫn
            delete post.id_user; 

            return {
                ...post,
                user: user, // Thêm đối tượng user đã định dạng
                // Giữ lại fullname và image trực tiếp trên post làm fallback nếu cần
                fullname: post.fullname || (user ? user.fullname : 'Ẩn danh'), 
                image: post.image || (user ? user.image : '')
            };
        });

        res.status(200).json(formattedPosts);

    } catch (error) {
        console.error('Error getAllPosts:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.', error: error.message });
    }
};


// [2] Tạo bài viết mới - Logic duyệt bài viết cộng đồng
exports.createPost = async (req, res) => {
    try {
        const userId = req.body.userId || (req.user ? req.user._id : null); // Lấy userId từ body hoặc từ token/session (req.user)

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Yêu cầu xác thực. Không tìm thấy ID người dùng.' });
        }

        const { content, selectedVisibility, mediaUrls } = req.body; // Lấy dữ liệu từ request body

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
        }

        // Lấy thông tin fullname và image từ người dùng để lưu snapshot vào bài viết
        const postFullname = user.fullname || user.username || user.email || 'Ẩn danh';
        const postImage = user.image || ''; // Sử dụng trường 'image' từ User model

        let initialStatus = 'active'; // Mặc định trạng thái là 'active' (tự đăng)
        let responseMessage = 'Bài viết của bạn đã được đăng thành công!';

        // Nếu chế độ là 'community', đặt trạng thái là 'pending' (chờ duyệt)
        if (selectedVisibility === 'community') {
            initialStatus = 'pending';
            responseMessage = 'Bài viết của bạn đã được gửi đến quản trị viên để xem xét và sẽ được đăng sau khi duyệt.';
        }

        const newPost = new Post({
            id_user: userId, // Lưu ObjectId của người dùng
            fullname: postFullname, // Lưu snapshot fullname
            image: postImage, // Lưu snapshot image
            content: content,
            media_urls: mediaUrls,
            visibility: selectedVisibility,
            status: initialStatus // Trạng thái bài viết (active/pending)
        });

        const savedPost = await newPost.save(); // Lưu bài viết vào cơ sở dữ liệu

        // Sau khi lưu, populate lại trường 'id_user' để trả về thông tin đầy đủ cho client
        const populatedSavedPost = await Post.findById(savedPost._id)
                                            .populate('id_user', 'fullname username email image')
                                            .lean();

        if (!populatedSavedPost) {
            console.error('Lỗi: Không tìm thấy bài viết đã tạo sau khi populate.');
            return res.status(500).json({ success: false, message: 'Lỗi máy chủ: Không thể lấy bài viết đã tạo.' });
        }
        
        // Điều chỉnh cấu trúc phản hồi để khớp với Post Model của Android
        const userForResponse = populatedSavedPost.id_user ? {
            _id: populatedSavedPost.id_user._id,
            fullname: populatedSavedPost.id_user.fullname || populatedSavedPost.id_user.username || populatedSavedPost.id_user.email || 'Ẩn danh',
            image: populatedSavedPost.id_user.image || ''
        } : null;

        delete populatedSavedPost.id_user; // Xóa trường id_user gốc

        const finalPostResponse = {
            ...populatedSavedPost,
            user: userForResponse // Thêm đối tượng user đã định dạng
        };

        // Trả về phản hồi cho client
        res.status(initialStatus === 'pending' ? 202 : 201).json({
            success: true,
            message: responseMessage,
            post: finalPostResponse // Trả về bài viết đã được populate
        });

    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi tạo bài viết. Vui lòng thử lại sau.', error: error.message });
    }
};

// [3] Sửa bài viết
exports.updatePost = async (req, res) => {
    try {
        const { postId } = req.params; // Lấy ID bài viết từ URL
        const { content, media_urls, visibility, status, rejectionReason } = req.body; // Lấy dữ liệu cập nhật

        const updated = await Post.findByIdAndUpdate(
            postId,
            {
                content,
                media_urls,
                visibility,
                status,
                rejectionReason, // Thêm trường rejectionReason vào đây
                updated_at: Date.now() // Cập nhật thời gian sửa đổi
            },
            { new: true } // Trả về bản ghi sau khi cập nhật
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });
        }

        // Sau khi cập nhật, populate lại trường 'id_user' để trả về thông tin đầy đủ cho client
        const populatedUpdatedPost = await Post.findById(updated._id)
            .populate('id_user', 'fullname username email image')
            .lean();

        if (!populatedUpdatedPost) {
            console.error('Lỗi: Không tìm thấy bài viết đã cập nhật sau khi populate.');
            return res.status(500).json({ success: false, message: 'Lỗi máy chủ: Không thể lấy bài viết đã cập nhật.' });
        }

        // Điều chỉnh cấu trúc phản hồi để khớp với Post Model của Android
        const userForResponse = populatedUpdatedPost.id_user ? {
            _id: populatedUpdatedPost.id_user._id,
            fullname: populatedUpdatedPost.id_user.fullname || populatedUpdatedPost.id_user.username || populatedUpdatedPost.id_user.email || 'Ẩn danh',
            image: populatedUpdatedPost.id_user.image || ''
        } : null;

        delete populatedUpdatedPost.id_user; // Xóa trường id_user gốc

        const finalPostResponse = {
            ...populatedUpdatedPost,
            user: userForResponse // Thêm đối tượng user đã định dạng
        };

        res.status(200).json({ success: true, message: 'Bài viết đã được cập nhật thành công.', post: finalPostResponse });

    } catch (error) {
        console.error('Error updatePost:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.', error: error.message });
    }
};

// [4] Xóa bài viết
exports.deletePost = async (req, res) => {
    try {
        const { postId } = req.params; // Lấy ID bài viết từ URL

        const deleted = await Post.findByIdAndDelete(postId); // Tìm và xóa bài viết
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết để xóa.' });
        }

        res.status(200).json({ success: true, message: 'Bài viết đã được xóa thành công.' });

    } catch (error) {
        console.error('Error deletePost:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.', error: error.message });
    }
};

module.exports = exports;
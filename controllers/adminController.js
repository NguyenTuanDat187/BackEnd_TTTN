// controllers/adminController.js

// Make sure all required models are at the top or scoped correctly
const User = require('../models/User');
const AdminLog = require('../models/AdminLog');
const Post = require('../models/Posts'); // Make sure Posts is correctly required
const Child = require('../models/Child'); // Make sure Child is correctly required
const Reminder = require('../models/Reminder'); // Make sure Reminder is correctly required

const bcrypt = require('bcryptjs'); // Assuming User model has a comparePassword method
const { generateToken } = require('../utils/token');
const logAdminAction = require('../middlewares/logger'); // Assuming this is your admin action logger

// --- Admin Authentication & Dashboard ---

// 📌 Hiển thị form đăng nhập Admin
exports.showLoginForm = (req, res) => {
    res.render('login', { error: null });
};

// 📌 Xử lý đăng nhập Admin
exports.handleLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.render('login', {
                error: 'Vui lòng nhập đầy đủ email và mật khẩu.'
            });
        }

        const user = await User.findOne({ email });

        if (!user || user.role !== 'admin') {
            console.log(`❌ Đăng nhập thất bại: Tài khoản '${email}' không tồn tại hoặc không phải admin.`);
            return res.render('login', {
                error: 'Tài khoản không tồn tại hoặc không có quyền truy cập.'
            });
        }

        if (user.isSuspended) { // Kiểm tra trạng thái đình chỉ của chính admin
            console.log(`❌ Đăng nhập admin thất bại: Tài khoản '${email}' đã bị đình chỉ.`);
            return res.render('login', {
                error: 'Tài khoản admin của bạn đã bị đình chỉ. Vui lòng liên hệ quản trị viên cấp cao.'
            });
        }

        const isMatch = await user.comparePassword(password); // Assuming User model has this method
        if (!isMatch) {
            console.log(`❌ Đăng nhập thất bại: Mật khẩu không đúng cho tài khoản '${email}'.`);
            return res.render('login', { error: 'Mật khẩu không đúng.' });
        }

        const token = generateToken({
            _id: user._id,
            email: user.email,
            role: user.role,
            fullname: user.fullname,
            image: user.image
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        console.log(`✅ Admin ${user.email} đã đăng nhập thành công.`);

        await logAdminAction(user._id, `Admin ${user.email} đã đăng nhập.`);

        return res.redirect('/admin/dashboard');
    } catch (err) {
        console.error('❌ Lỗi khi xử lý đăng nhập admin:', err.message);
        return res.status(500).render('login', {
            error: 'Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại sau.'
        });
    }
};

// 📌 Trang Dashboard Admin
exports.dashboard = async (req, res) => {
    try {
        const currentAdmin = req.user; // Assuming auth middleware populates req.user

        const userCount = await User.countDocuments({ role: 'parent' });
        const subuserCount = await User.countDocuments({ role: 'subuser' });
        const adminCount = await User.countDocuments({ role: 'admin' });

        res.render('dashboard', {
            userCount,
            subuserCount,
            adminCount,
            admin: currentAdmin // Pass current admin data to the template
        });
    } catch (error) {
        console.error('[AdminController] ❌ Dashboard Error:', error);
        res.status(500).send('Lỗi server khi hiển thị trang dashboard.');
    }
};

// 📌 Danh sách người dùng
exports.getUserList = async (req, res) => {
    try {
        // Fetch all parent and subuser roles
        const users = await User.find({ role: { $in: ['parent', 'subuser'] } })
                               .select('-password') // Exclude password
                               .sort({ created_at: -1 }) // Sort by creation date
                               .lean(); // Return plain JavaScript objects

        const parentCount = await User.countDocuments({ role: 'parent' });
        const subuserCount = await User.countDocuments({ role: 'subuser' });

        res.render('users', {
            users,
            parentCount,
            subuserCount,
            messages: req.flash() // Pass flash messages for user actions
        });
    } catch (error) {
        console.error('[AdminController] ❌ User List Error:', error);
        req.flash('error', 'Lỗi server khi hiển thị danh sách người dùng.');
        res.redirect('/admin/dashboard'); // Redirect on error
    }
};

// 📌 Hàm mới để chuyển đổi trạng thái đình chỉ của người dùng
exports.toggleUserSuspension = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }

        // Không cho phép đình chỉ/mở đình chỉ tài khoản admin thông qua chức năng này
        if (user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Không thể thay đổi trạng thái của tài khoản admin thông qua đây.' });
        }

        user.isSuspended = !user.isSuspended; // Chuyển đổi trạng thái
        await user.save();

        const actionDescription = user.isSuspended ? 'Đình chỉ' : 'Mở đình chỉ';
        if (req.user && req.user._id) { // Ensure admin user is authenticated
            await logAdminAction(
                req.user._id,
                `${actionDescription} người dùng: ${user.fullname || user.email} (ID: ${user._id})`
            );
        } else {
            console.warn('⚠️ Could not log admin action: Admin user data missing from JWT.');
        }

        res.status(200).json({
            success: true,
            message: `${actionDescription} người dùng thành công!`,
            isSuspended: user.isSuspended // Trả về trạng thái mới để JS cập nhật giao diện
        });
    } catch (error) {
        console.error('[AdminController] ❌ Toggle Suspend Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi thay đổi trạng thái người dùng.' });
    }
};


// ✅ Logout Admin
exports.handleLogout = (req, res) => {
    res.clearCookie('token');
    res.redirect('/admin/login');
};

// --- System Statistics ---
// ✨ NEW: Controller to get System Statistics
exports.getSystemStatistics = async (req, res) => {
    try {
        const totalMainParents = await User.countDocuments({ role: 'parent' });
        const totalSubUsers = await User.countDocuments({ role: 'subuser' });
        const totalUsers = totalMainParents + totalSubUsers;

        const totalApprovedPosts = await Post.countDocuments({ status: 'active' }); // Assuming 'active' means approved
        const totalPendingPosts = await Post.countDocuments({ status: 'pending' }); // Assuming 'pending' means awaiting approval
        const totalRejectedPosts = await Post.countDocuments({ status: 'rejected' }); // Add rejected posts count
        const totalPosts = await Post.countDocuments(); // Total number of posts regardless of status

        const totalCompletedReminders = await Reminder.countDocuments({ is_completed: true });
        // Count upcoming based on current date, ensuring reminder_date is in the future
        const totalUpcomingReminders = await Reminder.countDocuments({ is_completed: false, reminder_date: { $gte: new Date() } });
        const totalReminders = await Reminder.countDocuments(); // Total reminders regardless of status/date

        const totalChildrenManaged = await Child.countDocuments();

        res.render('statistics', {
            pageTitle: 'Thống kê Hệ thống',
            stats: {
                users: {
                    mainParents: totalMainParents,
                    subUsers: totalSubUsers,
                    total: totalUsers
                },
                posts: {
                    approved: totalApprovedPosts,
                    pending: totalPendingPosts,
                    rejected: totalRejectedPosts, // Include rejected count
                    total: totalPosts
                },
                reminders: {
                    completed: totalCompletedReminders,
                    upcoming: totalUpcomingReminders,
                    total: totalReminders
                },
                children: {
                    managed: totalChildrenManaged
                }
            },
            messages: req.flash() // Pass flash messages
        });
    } catch (error) {
        console.error('[AdminController] ❌ Get System Statistics Error:', error);
        req.flash('error', 'Lỗi server khi lấy thống kê hệ thống.');
        res.redirect('/admin/dashboard');
    }
};


// --- Child Management Functions (unchanged for this request) ---
exports.getChildrenByUser = async (req, res) => { /* ... unchanged ... */
    res.status(501).send('Not Implemented Yet');
}; // Placeholder for actual implementation
exports.getChildById = async (req, res) => { /* ... unchanged ... */
    res.status(501).send('Not Implemented Yet');
};
exports.createChild = async (req, res) => { /* ... unchanged ... */
    res.status(501).send('Not Implemented Yet');
};
exports.updateChild = async (req, res) => { /* ... unchanged ... */
    res.status(501).send('Not Implemented Yet');
};
exports.deleteChild = async (req, res) => { /* ... unchanged ... */
    res.status(501).send('Not Implemented Yet');
};

// --- Reminder Management Functions (unchanged for this request) ---
exports.createReminder = async (req, res) => { /* ... unchanged ... */
    res.status(501).send('Not Implemented Yet');
};
exports.getRemindersByUser = async (req, res) => { /* ... unchanged ... */
    res.status(501).send('Not Implemented Yet');
};
exports.getReminderById = async (req, res) => { /* ... unchanged ... */
    res.status(501).send('Not Implemented Yet');
};
exports.getRemindersByChild = async (req, res) => { /* ... unchanged ... */
    res.status(501).send('Not Implemented Yet');
};
exports.updateReminder = async (req, res) => { /* ... unchanged ... */
    res.status(501).send('Not Implemented Yet');
};
exports.deleteReminder = async (req, res) => { /* ... unchanged ... */
    res.status(501).send('Not Implemented Yet');
};
exports.completeReminder = async (req, res) => { /* ... unchanged ... */
    res.status(501).send('Not Implemented Yet');
};


// --- Post Management for Admin ---

// [1] Get all posts for admin view (shows all statuses for moderation)
exports.getAllPosts = async (req, res) => {
    try {
        // Retrieve ALL posts, regardless of their status, for admin view
        const posts = await Post.find()
            .populate('id_user', 'fullname username email avatar_url image') // Efficiently get user info
            .sort({ created_at: -1 }) // Sort by newest first
            .lean(); // Return plain JavaScript objects for easier manipulation

        // Populate fullname and image directly from the populated user object
        const populatedPosts = posts.map(post => {
            // Ensure post.id_user exists before trying to access its properties
            if (post.id_user) {
                // Prioritize fullname, then username, then email, fallback to empty string
                // The `user` property is what the Android client expects after population
                post.user = {
                    _id: post.id_user._id, // Ensure _id is included in the user object
                    fullname: post.id_user.fullname || post.id_user.username || post.id_user.email || 'Ẩn danh',
                    image: post.id_user.avatar_url || post.id_user.image || ''
                };
                // For the EJS template's `post.fullname` and `post.image` for convenience:
                post.fullname = post.user.fullname;
                post.image = post.user.image;
            } else {
                // Fallback for posts whose user might have been deleted
                post.user = null; // Set user to null if not found
                post.fullname = 'Ẩn danh';
                post.image = '';
            }
            // Remove the original id_user field if you strictly want only the 'user' object in the final response
            delete post.id_user;
            return post;
        });

        res.render('posts', {
            pageTitle: 'Quản lý Bài viết',
            posts: populatedPosts, // Send all posts to the template
            messages: req.flash() // Pass flash messages (success/error/info)
        });

    } catch (error) {
        console.error('[AdminController] ❌ Error getAllPosts for Admin:', error);
        req.flash('error', 'Đã xảy ra lỗi khi tải danh sách bài viết để quản lý.');
        res.redirect('/admin/dashboard'); // Redirect to dashboard or an error page
    }
};

// [2] Create New Post (Admin can create posts, typically 'active' by default)
// This function is generally for internal admin use or if an admin creates content.
exports.createPost = async (req, res) => {
    try {
        const { userId, content, selectedVisibility, mediaUrls } = req.body;

        // Ensure the admin user creating the post is authenticated and available in req.user
        const adminUserId = req.user._id; // Assuming req.user is populated by auth middleware
        const adminUser = await User.findById(adminUserId);

        if (!adminUser || adminUser.role !== 'admin') {
            req.flash('error', 'Chỉ tài khoản admin mới có thể tạo bài viết.');
            return res.redirect('/admin/posts');
        }

        const postFullname = adminUser.fullname || 'Admin'; // Default name for admin-created posts
        const postImage = adminUser.avatar_url || adminUser.image || '';

        const newPost = new Post({
            id_user: adminUserId, // Use the authenticated admin's ID
            // fullname: postFullname, // These might be redundant if you always populate `user`
            // image: postImage,
            content: content,
            media_urls: mediaUrls,
            visibility: selectedVisibility || 'public', // Admin can choose visibility, default to 'public'
            status: 'active' // Admin-created posts are active by default, no moderation needed
        });

        await newPost.save();
        await logAdminAction(adminUserId, `Admin ${adminUser.email} đã tạo bài viết mới (ID: ${newPost._id}).`);

        req.flash('success', 'Bài viết đã được tạo thành công.');
        res.redirect('/admin/posts');

    } catch (error) {
        console.error('[AdminController] ❌ Error creating post (Admin):', error);
        req.flash('error', 'Đã xảy ra lỗi khi tạo bài viết: ' + error.message);
        res.redirect('/admin/posts');
    }
};

// [3] Update Post (Used for content, media, visibility, and status changes by Admin)
exports.updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content, media_urls, visibility, status, rejectionReason } = req.body; // Include rejectionReason

        const updateFields = { updated_at: Date.now() };
        if (content !== undefined) updateFields.content = content;
        if (media_urls !== undefined) updateFields.media_urls = media_urls;
        if (visibility !== undefined) updateFields.visibility = visibility;
        if (status !== undefined) updateFields.status = status;
        // Only set rejectionReason if status is 'rejected', otherwise clear it
        if (status === 'rejected') {
            updateFields.rejectionReason = rejectionReason || 'Không có lý do cụ thể.';
        } else {
            updateFields.rejectionReason = undefined; // Clear reason if not rejected
        }


        const updated = await Post.findByIdAndUpdate(
            postId,
            updateFields,
            { new: true, runValidators: true } // runValidators ensures enum checks etc.
        );

        if (!updated) {
            req.flash('error', 'Không tìm thấy bài viết để cập nhật.');
            return res.redirect('/admin/posts');
        }

        if (req.user && req.user._id) {
            await logAdminAction(
                req.user._id,
                `Cập nhật bài viết (ID: ${postId}, Trạng thái: ${status || updated.status}, Lý do từ chối: ${rejectionReason || 'Không có'})`
            );
        }

        req.flash('success', 'Bài viết đã được cập nhật thành công.');
        res.redirect('/admin/posts');
    } catch (error) {
        console.error('[AdminController] ❌ Error updatePost:', error);
        req.flash('error', 'Lỗi server khi cập nhật bài viết: ' + error.message);
        res.redirect('/admin/posts');
    }
};

// [4] Delete Post (Single)
exports.deletePost = async (req, res) => {
    try {
        const { postId } = req.params;

        const deleted = await Post.findByIdAndDelete(postId);
        if (!deleted) {
            req.flash('error', 'Không tìm thấy bài viết để xóa.');
            return res.redirect('/admin/posts');
        }

        if (req.user && req.user._id) {
            await logAdminAction(
                req.user._id,
                `Xóa bài viết (ID: ${postId}, Nội dung: '${deleted.content ? deleted.content.substring(0, 50) + '...' : 'Không có nội dung'}')`
            );
        }

        req.flash('success', 'Bài viết đã được xóa thành công.');
        res.redirect('/admin/posts');
    } catch (error) {
        console.error('[AdminController] ❌ Error deletePost:', error);
        req.flash('error', 'Lỗi server khi xóa bài viết: ' + error.message);
        res.redirect('/admin/posts');
    }
};

// [NEW] Approve Post
exports.approvePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await Post.findById(postId);

        if (!post) {
            req.flash('error', 'Không tìm thấy bài viết để duyệt.');
            return res.redirect('/admin/posts');
        }

        if (post.status === 'active') {
            req.flash('info', 'Bài viết đã được duyệt rồi.');
            return res.redirect('/admin/posts');
        }

        post.status = 'active'; // Change status to 'active' (approved)
        post.rejectionReason = undefined; // Clear any previous rejection reason
        await post.save();

        if (req.user && req.user._id) {
            await logAdminAction(
                req.user._id,
                `Duyệt bài viết: ${post.content ? post.content.substring(0, 50) + '...' : 'Không có nội dung'} (ID: ${postId})`
            );
        }

        req.flash('success', 'Bài viết đã được duyệt thành công!');
        res.redirect('/admin/posts');
    } catch (error) {
        console.error('[AdminController] ❌ Error approving post:', error);
        req.flash('error', 'Lỗi server khi duyệt bài viết: ' + error.message);
        res.redirect('/admin/posts');
    }
};

// [NEW] Reject Post
exports.rejectPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { rejectionReason } = req.body; // Reason for rejection
        const post = await Post.findById(postId);

        if (!post) {
            req.flash('error', 'Không tìm thấy bài viết để từ chối.');
            return res.redirect('/admin/posts');
        }

        if (post.status === 'rejected') {
            req.flash('info', 'Bài viết đã bị từ chối rồi.');
            return res.redirect('/admin/posts');
        }

        post.status = 'rejected'; // Change status to 'rejected'
        post.rejectionReason = rejectionReason || 'Không có lý do cụ thể.'; // Save rejection reason
        await post.save();

        if (req.user && req.user._id) {
            await logAdminAction(
                req.user._id,
                `Từ chối bài viết: ${post.content ? post.content.substring(0, 50) + '...' : 'Không có nội dung'} (ID: ${postId}). Lý do: ${rejectionReason || 'Không có'}`
            );
        }

        req.flash('success', 'Bài viết đã được từ chối thành công!');
        res.redirect('/admin/posts');
    } catch (error) {
        console.error('[AdminController] ❌ Error rejecting post:', error);
        req.flash('error', 'Lỗi server khi từ chối bài viết: ' + error.message);
        res.redirect('/admin/posts');
    }
};

// [NEW] Bulk Delete Posts
exports.bulkDeletePosts = async (req, res) => {
    try {
        // postIdsToDelete will be a JSON string from the hidden input field
        const postIdsToDeleteString = req.body.postIdsToDelete;

        let postIds;
        try {
            postIds = JSON.parse(postIdsToDeleteString);
        } catch (parseError) {
            req.flash('error', 'Dữ liệu ID bài viết không hợp lệ.');
            console.error('❌ Lỗi parse JSON khi xóa hàng loạt:', parseError);
            return res.redirect('/admin/posts');
        }

        if (!Array.isArray(postIds) || postIds.length === 0) {
            req.flash('info', 'Không có bài viết nào được chọn để xóa.');
            return res.redirect('/admin/posts');
        }

        // Perform bulk deletion
        const deleteResult = await Post.deleteMany({ _id: { $in: postIds } });

        if (deleteResult.deletedCount > 0) {
            if (req.user && req.user._id) {
                await logAdminAction(
                    req.user._id,
                    `Đã xóa hàng loạt ${deleteResult.deletedCount} bài viết. ID: [${postIds.join(', ')}]`
                );
            }
            req.flash('success', `Đã xóa thành công ${deleteResult.deletedCount} bài viết.`);
        } else {
            req.flash('info', 'Không tìm thấy bài viết nào để xóa trong danh sách đã chọn.');
        }

        res.redirect('/admin/posts');

    } catch (error) {
        console.error('[AdminController] ❌ Error bulkDeletePosts:', error);
        req.flash('error', 'Lỗi server khi xóa hàng loạt bài viết: ' + error.message);
        res.redirect('/admin/posts');
    }
};


module.exports = exports;
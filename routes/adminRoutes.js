// routes/AdminRouter.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middlewares/requireAdmin'); // Assuming you have this middleware

// You'll likely need `express-session` and `connect-flash` for flash messages
// If you don't have them set up, add them to your main app.js or server.js:
// const session = require('express-session');
// const flash = require('connect-flash');
// app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: true }));
// app.use(flash());


// Admin Authentication Routes
router.get('/login', adminController.showLoginForm);
router.post('/login', adminController.handleLogin);
router.post('/logout', adminController.handleLogout);

// Admin Dashboard & User Management
router.get('/dashboard', requireAdmin, adminController.dashboard);
router.get('/users', requireAdmin, adminController.getUserList);
router.post('/users/:id/toggle-suspension', requireAdmin, adminController.toggleUserSuspension);

// System Statistics
router.get('/statistics', requireAdmin, adminController.getSystemStatistics);


// --- POST MANAGEMENT ROUTES ---
// ✅ [NEW] Route to display all posts (GET /admin/posts)
router.get('/posts', requireAdmin, adminController.getAllPosts);

// ✅ [NEW] Route to create a new post (POST /admin/posts/create) - If admin needs to create posts
// This route is less common for *moderation* but can be useful for admin announcements.
router.post('/posts/create', requireAdmin, adminController.createPost);

// ✅ [NEW] Route to update a post (PUT/PATCH /admin/posts/:postId)
// For broader updates, like content or visibility, distinct from status changes.
router.post('/posts/:postId/update', requireAdmin, adminController.updatePost); // Using POST for form submission

// ✅ [NEW] Route to approve a post (POST /admin/posts/:postId/approve)
router.post('/posts/:postId/approve', requireAdmin, adminController.approvePost);

// ✅ [NEW] Route to reject a post (POST /admin/posts/:postId/reject)
router.post('/posts/:postId/reject', requireAdmin, adminController.rejectPost);

// ✅ [NEW] Route to delete a post (POST /admin/posts/:postId/delete)
router.post('/posts/:postId/delete', requireAdmin, adminController.deletePost);

// ✨ NEW: Route for bulk delete posts (POST /admin/posts/bulk-delete)
router.post('/posts/bulk-delete', requireAdmin, adminController.bulkDeletePosts);

router.get('/users/:id/details', requireAdmin, adminController.getUserDetails);

module.exports = router;
// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Import bcryptjs để xử lý mật khẩu

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: function () {
            return this.role !== 'subuser'; // Subuser không cần email
        },
        unique: true,
        sparse: true, // Chỉ enforce unique nếu có giá trị
        maxlength: 100
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ['parent', 'subuser', 'admin'],
        default: 'parent',
        index: true
    },

    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true
    },

    balance: {
        type: mongoose.Decimal128,
        default: 0.00
    },

    isVerified: {
        type: Boolean,
        default: false
    },

    fullname: {
        type: String,
        default: ''
    },

    numberphone: {
        type: String,
        required: function () {
            return this.role === 'subuser'; // Subuser bắt buộc có số điện thoại
        },
        unique: function () {
            return this.role === 'subuser'; // Unique chỉ cho subuser
        },
        sparse: true
    },

    image: {
        type: String,
        default: ''
    },

    // THÊM TRƯỜNG isSuspended VÀO ĐÂY
    isSuspended: {
        type: Boolean,
        default: false, // Mặc định là không bị đình chỉ
        index: true // Thêm index để truy vấn nhanh hơn
    },

    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'users'
});

// THÊM CÁC PHƯƠNG THỨC TRƯỚC KHI COMPILE MODEL (ví dụ: hash mật khẩu, so sánh mật khẩu)
UserSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};


module.exports = mongoose.model('User', UserSchema);
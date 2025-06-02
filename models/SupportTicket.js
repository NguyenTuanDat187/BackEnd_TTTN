const mongoose = require('mongoose');

const SupportTicketSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true
    },
    subject: {
        type: String, required: true
    },
    message: {
        type: String, required: true
    },
    status: {
        type: String, enum: ['open', 'in_progress', 'closed'],
        default: 'open'
    },
    created_at: {
        type: Date, default: Date.now
    },
    updated_at: {
        type: Date, default: Date.now
    }
}, { collection: 'support_tickets' });

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);
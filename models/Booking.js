const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour' },
    participants: [{
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        gender: {
            type: String,
            required: true,
            enum: ['male', 'female']
        },
        age: {
            type: Number,
            required: true
        },
        phoneNumber: {
            type: Number,
            required: true
        },
        address: {
            type: String,
            required: true
        }
    }],
    bookingDate: {
        type: Date,
        required: true
    },
    tourCompleted: {
        type: Boolean,
        required: true,
        default: false
    }
});

module.exports = mongoose.model('Booking', bookingSchema);
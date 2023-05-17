const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false  // password won't be sent to the client
    },
    address: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    salary: {
        type: Number,
    },
    image: {
        type: String,
        required: true
    },
    imagePublicId: {
        type: String
    },
    token: {
        type: String
    },
    role: {
        type: String,
        enum: ['admin', 'guide', 'customer'],
        default: 'customer'
    },
    toursBooked: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
        default: [],
    }
});

module.exports = mongoose.model('User', userSchema);
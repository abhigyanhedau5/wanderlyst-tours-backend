const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tourSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        required: true,
        difficulty: ['easy', 'medium', 'hard']
    },
    dates: {
        type: [],
        default: [],
    },
    images: {
        type: [{
            imageLink: {
                type: String,
                required: true
            },
            imagePublicId: {
                type: String,
                required: true
            }
        }],
        default: [],
    },
    locations: {
        type: [[mongoose.Schema.Types.Mixed]],
        default: [],
    },
    duration: {
        type: String,
        required: true
    },
    participants: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        default: 0
    },
    guides: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        default: [],
    },
    reviews: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
        default: [],
    }
});

module.exports = mongoose.model('Tour', tourSchema);
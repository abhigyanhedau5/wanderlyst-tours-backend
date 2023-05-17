const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// # MONGODB_URI=mongodb://localhost:27017/wanderlyst

const reviewSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
    review: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
});

module.exports = mongoose.model('Review', reviewSchema);
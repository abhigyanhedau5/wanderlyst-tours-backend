const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userTokenSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    token: {
        type: String,
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('UserToken', userTokenSchema);
const mongoose = require('mongoose');
const AppError = require('./appError');

const connectToDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected To Database");
    } catch (error) {
        return new AppError(500, `An error occurred while connecting to MongoDB - ${error}`);
    }
};

module.exports = connectToDB;
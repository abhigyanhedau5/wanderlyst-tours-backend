const util = require('util');
const jwt = require('jsonwebtoken');

const User = require('./../models/User');

const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

/*
Steps to follow:
    1. Get the token from req object
    2. Validate the token
    3. Check if user still exists - there can be a case where 
    user is deleted or user changed password, but token is valid
    4. Check if user changed password after JWT was issued
*/

const protect = catchAsync(async (req, res, next) => {

    // 1. Get the token from req object
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token)
        return next(new AppError(400, "Please login or signup"));


    // 2. Validate the token
    const decodedToken = await util.promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3. Check if user still exists
    // There can be a case where use is deleted but the token is valid 
    const user = await User.findById(decodedToken.id);

    if (!user)
        return next(new AppError(400, "Please login or signup"));

    req.user = user;
    next();
});

module.exports = protect;
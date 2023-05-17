const AppError = require('./../utils/appError');

const restrictTo = (...params) => {
    return (req, res, next) => {
        if (!params.includes(req.user.role))
            return next(new AppError(403, 'Unauthorized Access. You do not have access.'));
        next();
    };
};

module.exports = restrictTo;
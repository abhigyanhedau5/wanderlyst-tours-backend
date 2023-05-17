const globalErrorHandler = (err, req, res, next) => {

    err.status = err.statusCode || 500;
    err.status = err.status || "Error";

    // Duplicate value in DB
    if (err.code === 11000) {
        return res.status(400).json({
            status: 'error',
            message: `An item with name, ${err.keyValue.name}, already exists`
        });
    }

    // JWT Expired Error
    if (err.name === 'TokenExpiredError') {
        return res.status(419).json({
            status: 'error',
            message: `Session Expired. Please Login Again.`
        });
    }

    // Invalid data in DB / Validation Error    
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid token. Please Login Again.'
        });
    }

    // If the error is operational, it means that if we introduced it
    if (err.isOperational) {
        // console.log(err);
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            error: err
        });
    }

    // Else, it means that it is a programmatical error
    else {
        if (err.statusCode === 400) return res.status(err.statusCode).json({
            status: err.status,
            message: "Invalid request sent. Read - " + err.message,
            error: err
        });
        console.log(err);
        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong. Internal Server Error.',
            error: err
        });
    }
};

module.exports = globalErrorHandler;
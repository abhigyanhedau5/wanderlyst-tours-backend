class AppError extends Error {
    constructor(statusCode, message) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? "fail" : "error";

        // we explicitly introduced this error
        this.isOperational = true;

        // get the stack trace
        Error.captureStackTrace(this, this.constructor);
    }
};

module.exports = AppError;
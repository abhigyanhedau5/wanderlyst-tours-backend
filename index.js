const express = require('express');
const bodyParser = require('body-parser');
const connectToDB = require('./utils/connectToDB');
const dotenv = require('dotenv');
const cors = require('cors');

const userRouter = require('./routes/user-routes');
const queryRouter = require('./routes/query-routes');
const reviewRouter = require('./routes/review-routes');
const tourRouter = require('./routes/tour-routes');
const bookingRouter = require('./routes/booking-routes');

const globalErrorHandler = require('./utils/globalErrorHandler');
const catchAsync = require('./utils/catchAsync');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Apply middleware
app.use(bodyParser.json());
app.use(cors());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Max-Age", "1800");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    next();
});

// route to test the server
app.get('/', catchAsync((req, res) => {
    return res.status(200).json({
        status: 'success',
        message: 'server returned with status code 200 for version 1.0.0'
    });
}));

app.use('/api/v1/users', userRouter);
app.use('/api/v1/query', queryRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/bookings', bookingRouter);

app.use(globalErrorHandler);

// Connect to MongoDB
connectToDB();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

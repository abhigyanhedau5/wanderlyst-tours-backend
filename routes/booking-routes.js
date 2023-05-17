const express = require('express');
const protect = require('../middleware/protect');
const restrictTo = require('../middleware/restrictTo');

const bookingControllers = require('../controllers/booking-controller');

const { bookTour, getMyBookings, getBooking, getAllBookings, getAllBookingsForTour, getCompletedBookings, getIncompleteBookings, cancelBooking } = bookingControllers;

const router = express.Router();

router.use(protect);

router.route('/bookTour').post(bookTour);
router.route('/getAllBookingsForTour').post(getAllBookingsForTour);
router.route('/getMyBookings').get(getMyBookings);
router.route('/getBooking').post(getBooking);
router.route('/cancelBooking').post(cancelBooking);

router.use(restrictTo('guide', 'admin'));

router.route('/getAllBookings').get(getAllBookings);
router.route('/getCompletedBookings').get(getCompletedBookings);
router.route('/getIncompleteBookings').get(getIncompleteBookings);

module.exports = router;
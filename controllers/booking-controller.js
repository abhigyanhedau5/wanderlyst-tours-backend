const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Tour = require('./../models/Tour');
const User = require('./../models/User');
const Booking = require('./../models/Booking');
const mongoose = require('mongoose');

const bookingIsCompleted = (booking) => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1);
    const day = String(currentDate.getDate());
    const todayDateString = `${year}-${month}-${day}`;
    return booking.bookingDate.toISOString().toString().slice(0, 10) < todayDateString;
};

const bookTour = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { tourId, participants, requestedBookingDate } = req.body;
    if (tourId === undefined || tourId.toString().length !== 24) return next(new AppError(400, `No tour found - ${tourId}`));
    if (participants === undefined || !Array.isArray(participants)) return next(new AppError(400, 'Invalid participants array - should be an array of objects containing name, email, gender, age, phoneNumber and address.'));
    const timestamp = Date.parse(requestedBookingDate);
    const tour = await Tour.findById(tourId);
    if (isNaN(timestamp)) return next(new AppError(400, 'Invalid booking date string'));
    // const availableDates = tour.dates;
    // const requestedDateObj = new Date(requestedBookingDate);
    // const requestedYear = requestedDateObj.getUTCFullYear();
    // const requestedMonth = requestedDateObj.getUTCMonth();
    // const requestedDay = requestedDateObj.getUTCDate();
    // let flag = false;
    // for (const availableDate of availableDates) {
    //     const availableYear = availableDate.getUTCFullYear();
    //     const availableMonth = availableDate.getUTCMonth();
    //     const availableDay = availableDate.getUTCDate();
    //     if (availableYear === requestedYear &&
    //         availableMonth === requestedMonth &&
    //         availableDay === requestedDay) {
    //         flag = true;
    //         break;
    //     }
    // }
    // if (!flag) return next(new AppError(400, 'Invalid tour date. Tour is not conducted on that date.'));
    const newBooking = await Booking.create({
        userId,
        tourId,
        participants,
        bookingDate: requestedBookingDate
    });
    let userBookings = req.user.toursBooked;
    userBookings.push(newBooking._id);
    await User.findByIdAndUpdate(userId, { toursBooked: userBookings });
    return res.status(201).json({
        status: 'success',
        booking: newBooking
    });
});

const getAllBookings = catchAsync(async (req, res, next) => {
    let bookings = await Booking.find().populate('tourId');
    for (const booking of bookings) {
        const completed = bookingIsCompleted(booking);
        if (completed) await Booking.findByIdAndUpdate(booking.id, { tourCompleted: true });
    };
    return res.status(200).json({
        status: 'success',
        results: bookings.length,
        bookings
    });
});

const getCompletedBookings = catchAsync(async (req, res, next) => {
    let bookings = await Booking.find().populate('tourId');
    const completedBookings = [];
    for (const booking of bookings) {
        if (bookingIsCompleted(booking)) {
            completedBookings.push(booking);
            await Booking.findByIdAndUpdate(booking.id, { tourCompleted: true });
        }
    }
    return res.status(200).json({
        status: 'success',
        results: completedBookings.length,
        bookings: completedBookings
    });
});

const getIncompleteBookings = catchAsync(async (req, res, next) => {
    let bookings = await Booking.find().populate('tourId');
    const inccompleteBookings = [];
    for (const booking of bookings) {
        if (!bookingIsCompleted(booking)) inccompleteBookings.push(booking);
        else await Booking.findByIdAndUpdate(booking.id, { tourCompleted: true });
    }
    return res.status(200).json({
        status: 'success',
        results: inccompleteBookings.length,
        bookings: inccompleteBookings
    });
});

const getAllBookingsForTour = catchAsync(async (req, res, next) => {
    const { tourId } = req.body;
    if (tourId === undefined || tourId.toString().length !== 24) return next(new AppError(400, `No tour found - ${tourId}`));
    const tourBookings = await Booking.find({ tourId }).populate('tourId');
    return res.status(200).json({
        status: 'success',
        results: tourBookings.length,
        bookings: tourBookings
    });
});

const getMyBookings = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    let myBookings = await Booking.find({ userId }).populate('tourId');
    if (myBookings === undefined || myBookings.length === 0) return next(new AppError(400, 'No bookings have been made yet.'));
    myBookings = myBookings.filter(async booking => {
        const completed = bookingIsCompleted(booking);
        if (!completed) await Booking.findByIdAndUpdate(booking.id, { tourCompleted: true });
        return !completed;
    });
    return res.status(200).json({
        status: 'success',
        results: myBookings.length,
        bookings: myBookings
    });
});

const getBooking = catchAsync(async (req, res, next) => {
    const { bookingId } = req.body;
    if (bookingId === undefined || bookingId.toString().length !== 24) return next(new AppError(400, 'Invalid booking id'));
    const booking = await Booking.findById(bookingId).populate('tourId');
    if (bookingIsCompleted(booking)) await Booking.findByIdAndUpdate(booking.id, { tourCompleted: true });
    if (!booking) return next(new AppError(404, `No booking found for ${bookingId}`));
    return res.status(200).json({
        status: 'success',
        booking
    });
});

const cancelBooking = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { bookingId } = req.body;
    if (bookingId === undefined || bookingId.toString().length !== 24) return next(new AppError(400, 'Invalid booking id'));
    let booking = await Booking.findById(bookingId).populate('tourId');
    if (bookingIsCompleted(booking)) booking = await Booking.findByIdAndUpdate(booking.id, { tourCompleted: true }, { new: true });
    // if (booking.tourCompleted) return next(new AppError(400, 'Tour is already completed. Cannot cancel the booking now.'));
    const user = await User.findById(userId);
    let userTours = user.toursBooked;
    let userIsCorrect = false;
    for (const userBookingId of userTours) {
        if (bookingId === userBookingId.toString()) {
            userIsCorrect = true;
            break;
        }
    }
    if (!userIsCorrect) return next(new AppError(403, 'Forbidden. Unauthorized Access.'));
    userTours = userTours.filter(userBookingId => userBookingId.toString() !== bookingId);
    await User.findByIdAndUpdate(userId, { toursBooked: userTours });
    await Booking.findByIdAndDelete(bookingId);
    return res.status(200).json({
        status: 'success',
        message: 'Booking cancelled successfully'
    });
});

module.exports = { bookTour, getMyBookings, getBooking, getAllBookings, getAllBookingsForTour, getCompletedBookings, getIncompleteBookings, cancelBooking };
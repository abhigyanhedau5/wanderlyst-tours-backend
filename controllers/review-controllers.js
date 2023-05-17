const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const mongoose = require('mongoose');

const validateString = require('./../utils/validateString');
const validateRating = require('./../utils/validateRating');

const Review = require('./../models/Review');
const Tour = require('./../models/Tour');

const getAllReviews = catchAsync(async (req, res, next) => {

    const reviews = await Review.find().populate('userId').sort({ rating: 'desc' }).exec();

    return res.status(200).json({
        status: 'success',
        results: reviews.length,
        reviews
    });

});

const getAllReviewsForTour = catchAsync(async (req, res, next) => {

    const tourId = req.body.tourId;

    if (tourId === undefined) return next(new AppError(400, 'Specify tour id'));
    if (tourId.length !== 24) return next(new AppError(400, 'No tour found with id ' + tourId));

    const reviews = await Review.find({ tourId }).populate('userId').sort({ rating: 'desc' }).exec();
    const tour = await Tour.findById(tourId);

    if (!tour) return next(new AppError(400, 'No tour found with id ' + tourId));

    return res.status(200).json({
        status: 'success',
        results: reviews.length,
        rating: tour.rating,
        reviews
    });

});


const getReview = catchAsync(async (req, res, next) => {

    const reviewId = req.body.reviewId;

    if (reviewId === undefined) return next(new AppError(400, 'Specify review id'));
    if (reviewId.length !== 24) return next(new AppError(400, 'No review found with id ' + reviewId));

    const review = await Review.findById(reviewId).populate('userId');

    if (!review) return next(new AppError(400, 'No review found with id ' + reviewId));

    return res.status(200).json({
        status: 'success',
        review
    });
});


const postReview = catchAsync(async (req, res, next) => {

    const { tourId, review, rating } = req.body;
    const userId = req.user.id;

    if (tourId === undefined) return next(new AppError(400, 'Specify tour id'));
    if (tourId.length !== 24) return next(new AppError(400, 'No tour found with id ' + tourId));

    if (!validateString(review)) return next(new AppError(400, 'Empty review'));

    if (!validateRating(rating)) return next(new AppError(400, 'Invalid rating. Must be a number and between 1 to 5'));

    const tour = await Tour.findById(tourId);

    if (!tour) return next(new AppError(400, 'No tour found with id ' + tourId));

    const tourRating = tour.rating;
    const numberOfRatings = tour.reviews.length;

    let updatedTourRating;

    if (numberOfRatings === 0) updatedTourRating = rating;
    else {
        updatedTourRating = (((tourRating * numberOfRatings) + rating) / (numberOfRatings + 1));
        updatedTourRating = updatedTourRating.toFixed(2);
    }

    const newReview = await Review.create({
        userId,
        tourId,
        review,
        rating
    });

    const tourReviews = tour.reviews;

    tourReviews.push(newReview._id);

    await Tour.findByIdAndUpdate(tourId, { reviews: tourReviews, rating: updatedTourRating });

    return res.status(201).json({
        status: 'success',
        review: newReview
    });

});


const updateReview = catchAsync(async (req, res, next) => {

    const { reviewId, tourId, review, rating } = req.body;
    const userId = req.user.id;

    if (reviewId === undefined) return next(new AppError(400, 'Specify review id'));
    if (reviewId.length !== 24) return next(new AppError(400, 'Invalid Review Id'));

    if (tourId === undefined) return next(new AppError(400, 'Specify tour id'));
    if (tourId.length !== 24) return next(new AppError(400, 'Invalid Tour Id'));

    if (rating !== undefined && !validateRating(rating)) return next(new AppError(400, 'Invalid rating. Must be a number and between 1 and 5'));

    const reviewFromDB = await Review.findById(reviewId);
    if (!reviewFromDB) return next(new AppError(400, 'No review found with id "' + reviewId));

    const tour = await Tour.findById(tourId);
    if (!tour) return next(new AppError(400, 'No tour found with id "' + tourId));

    if (reviewFromDB.userId.toString() !== userId) return next(new AppError(403, 'Forbidden. Unauthorized Access.'));

    let updatedTourRating;

    if (rating !== undefined) {
        const numberOfRatings = tour.reviews.length;
        updatedTourRating = (((tour.rating * numberOfRatings) - reviewFromDB.rating + rating) / numberOfRatings);
        updatedTourRating = updatedTourRating.toFixed(2);
    }

    await Tour.findByIdAndUpdate(tourId, { rating: updatedTourRating });

    const updatedReview = await Review.findByIdAndUpdate(reviewId, { review, rating }, { new: true });

    return res.status(200).json({
        status: 'success',
        review: updatedReview
    });
});


const deleteReview = catchAsync(async (req, res, next) => {

    const { reviewId, tourId } = req.body;
    const userId = req.user.id;

    if (reviewId === undefined) return next(new AppError(400, 'Specify review id'));
    if (reviewId.length !== 24) return next(new AppError(400, 'Invalid Review Id'));

    if (tourId === undefined) return next(new AppError(400, 'Specify tour id'));
    if (tourId.length !== 24) return next(new AppError(400, 'Invalid Tour Id'));

    const reviewFromDB = await Review.findById(reviewId);
    if (!reviewFromDB) return next(new AppError(400, 'No review found with id "' + reviewId));

    const tour = await Tour.findById(tourId);
    if (!tour) return next(new AppError(400, 'No tour found with id "' + tourId));

    if (reviewFromDB.userId.toString() !== userId) return next(new AppError(403, 'Forbidden. Unauthorized Access.'));

    let updatedTourRating;

    const tourRating = tour.rating;
    const numberOfRatings = tour.reviews.length;

    if (numberOfRatings === 1) updatedTourRating = 0;
    else {
        updatedTourRating = (((tourRating * numberOfRatings) - reviewFromDB.rating) / (numberOfRatings - 1));
        updatedTourRating = updatedTourRating.toFixed(2);
    }

    let tourReviews = tour.reviews;

    tourReviews = tourReviews.filter(tourReviewId => {
        return tourReviewId.toString() !== reviewId;
    });

    await Tour.findByIdAndUpdate(tourId, { reviews: tourReviews, rating: updatedTourRating });
    await Review.findByIdAndDelete(reviewId);

    return res.status(200).json({
        status: 'success'
    });

});

module.exports = { getAllReviews, getReview, postReview, updateReview, deleteReview, getAllReviewsForTour };
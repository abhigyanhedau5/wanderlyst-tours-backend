const express = require('express');
const reviewControllers = require('./../controllers/review-controllers');

const protect = require('./../middleware/protect');

const router = express.Router();

const { getAllReviews, getReview, getAllReviewsForTour, postReview, updateReview, deleteReview } = reviewControllers;

router.route('/getAllReviews').get(getAllReviews);
router.route('/getAllReviewsForTour').post(getAllReviewsForTour);

router.use(protect);

router.route('/getReview')
    .post(getReview);

router.route('/')
    .post(postReview)
    .patch(updateReview)
    .delete(deleteReview);

module.exports = router;
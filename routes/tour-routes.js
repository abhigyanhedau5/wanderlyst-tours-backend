const express = require('express');
const upload = require('./../utils/multer');
const protect = require('./../middleware/protect');
const restrictTo = require('./../middleware/restrictTo');

const tourControllers = require('./../controllers/tour-controller');

const router = express.Router();

const { getAllTours, getTour, postTour, updateTour, deleteTour, addGuideToTour, removeGuideFromTour } = tourControllers;

router.route('/getAllTours').get(getAllTours);
router.route('/getTour').post(getTour);

router.use(protect, restrictTo('guide', 'admin'));
router.route('/postTour').post(upload.array('images', 5), postTour);
router.route('/updateTour').patch(upload.array('images', 5), updateTour);
router.route('/deleteTour').delete(deleteTour);
router.route('/addGuideToTour').patch(addGuideToTour);
router.route('/removeGuideFromTour').patch(removeGuideFromTour);

module.exports = router;
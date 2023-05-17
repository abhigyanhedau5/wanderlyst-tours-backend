const express = require('express');
const protect = require('./../middleware/protect');
const restrictTo = require('./../middleware/restrictTo');

const queryControllers = require('./../controllers/query-controller');

const router = express.Router();

const { postQuery, getAllQueries, replyQuery } = queryControllers;

router.route('/postQuery').post(postQuery);

router.use(protect, restrictTo('admin'));

router.route('/query').get(getAllQueries)

router.route('/replyQuery').post(replyQuery);

module.exports = router;
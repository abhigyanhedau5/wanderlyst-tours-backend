const express = require('express');
const upload = require('./../utils/multer');
const protect = require('./../middleware/protect');
const restrictTo = require('./../middleware/restrictTo');

const userControllers = require('./../controllers/user-controller');

const router = express.Router();

const { sendToken, verifySignUpToken, signup, login, sendRecoveryMail, resetPassword, getAllUsers, getAllCustomers, getAllGuides, getMe, updateMe, deleteMe, getAGuide, postAGuide, updateAGuide, deleteAGuide, addAdmin } = userControllers;

router.route('/sendToken').post(sendToken);

router.route('/verifySignUpToken').post(verifySignUpToken);

router.route('/signup').post(upload.single('image'), signup);

router.route('/login').post(login);

router.route('/sendRecoveryMail').post(sendRecoveryMail);

router.route('/resetPassword').post(resetPassword);

router.use(protect);

router.route('/me')
    .get(getMe)
    .patch(upload.single('image'), updateMe)
    .delete(deleteMe);

router.use(restrictTo('admin'));

router.route('/allusers').get(getAllUsers);

router.route('/allcustomers').get(getAllCustomers);

router.route('/allguides').get(getAllGuides);

router.route('/addAdmin').post(upload.single('image'), addAdmin);

router.route('/getAGuide')
    .post(getAGuide);
    
router.route('/guide')
    .post(upload.single('image'), postAGuide)
    .patch(upload.single('image'), updateAGuide)
    .delete(deleteAGuide);

module.exports = router;
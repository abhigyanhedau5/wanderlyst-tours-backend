const bcrypt = require('bcrypt');
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const cloudinary = require("./../utils/cloudinary");
const validateEmail = require("./../utils/validateEmail");
const validatePassword = require("./../utils/validatePassword");
const validatePhoneNumber = require("./../utils/validatePhoneNumber");
const validateString = require("./../utils/validateString");
const validateAge = require("./../utils/validateAge");

const User = require("./../models/User");
const UserToken = require("./../models/UserToken");

const sendToken = catchAsync(async (req, res, next) => {

    // Get the required fields from req.body
    const { email, token } = req.body;

    if (!validateEmail(email))
        return next(new AppError(400, 'Enter a valid email'));

    const user = await User.findOne({ email: email });
    const usertoken = await UserToken.findOne({ email: email });

    if (user)
        return next(new AppError(404, `A user already exists with this email. Try Logging In.`));

    const resetToken = token;
    const hashedToken = await bcrypt.hash(token, 12);

    if (!usertoken) {
        await UserToken.create({
            email: email,
            token: hashedToken
        });
    } else {
        await UserToken.updateOne({ email: email }, { token: hashedToken });
    }

    const message = `Hey, Welcome to WanderLyst Tours. Thank you for registering. \n\nYou may sign up by copying and pasting the following token at the signup screen - ${resetToken} \n\nHave a nice day!\n\nRegards,\nWanderLyst Tours \n\nA Project By: \nAbhigyan Hedau\nMrunali Gadekar\nShreyash Chaple\nHimanshu Akula`;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.USER_MAIL,
            pass: process.env.USER_PASS
        }
    });

    const mailOptions = {
        from: process.env.USER_MAIL,
        // to: 'spam22010904@gmail.com',
        to: email,
        subject: 'Account Verification Mail',
        text: message
    };

    transporter.sendMail(mailOptions).then(() => { }).catch(err => {
        return next(new AppError(500, `Error Sending Mail - ${err}`))
    });

    return res.status(200).json({
        status: 'success'
    });
});


const verifySignUpToken = catchAsync(async (req, res, next) => {

    const { email, token } = req.body;

    if (!validateEmail(email))
        return next(new AppError(400, "Enter a valid email"));

    const user = await User.findOne({ email: email });

    const usertoken = await UserToken.findOne({ email: email });

    if (user)
        return next(new AppError(400, "User already exists! Try logging in"));

    const tokenIsCorrect = await bcrypt.compare(token, usertoken.token);

    if (!tokenIsCorrect)
        return next(new AppError(400, "Entered token in incorrect"));

    await UserToken.updateOne({ email: email }, { verified: true });

    return res.status(200).json({
        status: 'success'
    });
});


const signup = catchAsync(async (req, res, next) => {

    const { name, email, password, address, phoneNumber, age } = req.body;

    if (!validateEmail(email))
        return next(new AppError(400, "Invalid email"));

    const usertoken = await UserToken.findOne({ email: email });

    if (!usertoken || !usertoken.verified)
        return next(new AppError(400, "Email is not verified. Send email verification request before signing up."));

    if (!validateString(name))
        return next(new AppError(400, "Enter a valid name."));

    if (!validatePassword(password))
        return next(new AppError(400, "Enter a valid password of more than 6 characters."));

    if (!validateString(address))
        return next(new AppError(400, "Enter a valid address."));

    if (!validatePhoneNumber(phoneNumber))
        return next(new AppError(400, "Enter a valid phone number of 10 digits."));

    if (!validateAge(age))
        return next(new AppError(400, "Enter a valid age."));

    // check if user already exists
    const existingUser = await User.findOne({ email: email });

    if (existingUser)
        return next(new AppError(400, "User already exists. Try loggin in."));

    let imageLink = "https://res.cloudinary.com/ds4l1uae7/image/upload/v1680358997/defaultProfile_akmzpv_fu84yx.jpg";
    let imagePublicId = null;

    if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path);
        imagePublicId = result.public_id;
        imageLink = result.secure_url;
    }

    // hash the password
    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await User.create({
        name,
        email,
        password: passwordHash,
        image: imageLink,
        imagePublicId,
        address,
        phoneNumber,
        age
    });

    // delete the user from usertoken collection
    await UserToken.deleteOne({ email: email });

    // Create JWT token and sign it
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: process.env.TOKEN_EXPIRES_IN });

    // send back user data
    return res.status(201).json({
        status: 'success',
        data: {
            user: {
                name,
                email,
                image: imageLink,
                address,
                number: phoneNumber,
                age,
                role: 'customer'
            },
            token
        }
    });
});


const login = catchAsync(async (req, res, next) => {

    let { email, password } = req.body;

    password = password.toString();

    if (!validateEmail(email) || !validatePassword(password))
        return next(new AppError(400, 'Invalid email or password.'));

    const user = await User.findOne({ email: email }).select('+password');

    if (!user)
        return next(new AppError(400, 'Invalid email or password.'));

    const passwordIsCorrect = await bcrypt.compare(password, user.password);

    if (!passwordIsCorrect)
        return next(new AppError(400, 'Invalid email or password.'));

    // Create JWT token and sign it
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.TOKEN_EXPIRES_IN });

    return res.status(200).json({
        status: 'success',
        data: {
            user: {
                id: user._id,
                name: user.name,
                image: user.image,
                email: user.email,
                role: user.role,
                age: user.age,
                number: user.phoneNumber,
                address: user.address,
                toursBooked: user.toursBooked
            },
            token
        }
    });
});


const sendRecoveryMail = catchAsync(async (req, res, next) => {

    const { email, token } = req.body;

    if (!validateEmail(email))
        return next(new AppError(400, 'Enter a valid email'));

    const user = await User.findOne({ email: email });

    if (!user)
        return next(new AppError(404, `No user found with email - ${email}. Try Signing Up.`));

    const resetToken = token;
    const hashedToken = await bcrypt.hash(resetToken, 12);

    const message = `Hey ${user.name}, \n\nForgot your password?\nWe received a request to reset the password for your WanderLyst Tours Account.\n\nTo reset your password, enter the following token at the forgot password page - ${resetToken}\n\nHave a nice day!\n\nRegards,\nWanderLyst Tours \n\nA Project By: \nAbhigyan Hedau\nMrunali Gadekar\nShreyash Chaple\nHimanshu Akula`;

    await User.updateOne({ email: email }, { token: hashedToken });

    const mailOptions = {
        from: process.env.USER_MAIL,
        // to: 'spam22010904@gmail.com',
        to: email,
        subject: 'Account Recovery Mail',
        text: message
    };

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.USER_MAIL,
            pass: process.env.USER_PASS
        }
    });

    transporter.sendMail(mailOptions, function (error) {
        if (error)
            return next(new AppError(500, 'Internal server error'));
    });

    return res.status(200).json({
        status: 'success'
    });
});


const resetPassword = catchAsync(async (req, res, next) => {
    const token = req.body.token;
    const userMail = req.body.email;
    const newPassword = req.body.password;

    if (!token)
        return next(new AppError(400, 'Enter the token'));

    const user = await User.findOne({ email: userMail });

    if (!user)
        return next(new AppError(404, `No user found with email ${userMail}. Try Signing Up.`));

    if (!user.token)
        return next(new AppError(404, `Send a forgot password request before changing the password`));

    // Check if the token is correct or not
    const tokenIsCorrect = await bcrypt.compare(token, user.token);

    if (!tokenIsCorrect)
        return next(new AppError(400, 'Enter the valid token'));

    const newHashedPassword = await bcrypt.hash(newPassword, 12);

    user.password = newHashedPassword;
    user.token = undefined;

    const updatedUser = await user.save();

    // Create JWT token and sign it
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.TOKEN_EXPIRES_IN });

    return res.status(201).json({
        status: 'success',
        data: {
            user: updatedUser,
            token: jwtToken
        }
    });
});


const getAllUsers = catchAsync(async (req, res, next) => {

    const users = await User.find();

    return res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users
        }
    });
});


const getAllCustomers = catchAsync(async (req, res, next) => {
    const customers = await User.find({ role: 'customer' });

    return res.status(200).json({
        status: 'success',
        results: customers.length,
        data: {
            customers
        }
    });
});


const getAllGuides = catchAsync(async (req, res, next) => {
    const guides = await User.find({ role: 'guide' });

    return res.status(200).json({
        status: 'success',
        results: guides.length,
        data: {
            guides
        }
    });
});


const getMe = catchAsync(async (req, res, next) => {

    const userId = req.user.id;

    if (!userId || userId.toString().length !== 24)
        return next(new AppError(404, 'No user found.'));

    const user = await User.findById(userId);

    if (!user)
        return next(new AppError(404, 'No user found.'));

    return res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});


const updateMe = catchAsync(async (req, res, next) => {

    const { name, address, number, age } = req.body;
    const userId = req.user.id;

    // Fetch the user from DB
    const user = await User.findOne({ email: req.user.email });

    if (name === undefined && address === undefined && number === undefined && age === undefined && req.file === undefined) return next(new AppError(400, 'Provide some data for updation.'));

    if (name !== undefined && !validateString(name))
        return next(new AppError(400, 'Please enter a valid name for updation'));

    if (address !== undefined && !validateString(address))
        return next(new AppError(400, 'Please enter a valid address for updation'));

    if (number !== undefined && !validatePhoneNumber(number))
        return next(new AppError(400, 'Please enter a valid phone number for updation'));

    if (age !== undefined && !validateAge(age))
        return next(new AppError(400, 'Please enter a valid phone number for updation'));

    let imageLink = undefined, imagePublicId = undefined;

    if (req.file) {
        if (user.imagePublicId !== null) {
            await cloudinary.uploader.destroy(user.imagePublicId);
        }
        const result = await cloudinary.uploader.upload(req.file.path);
        imagePublicId = result.public_id;
        imageLink = result.secure_url;
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(userId, { name, address, phoneNumber: number, image: imageLink, imagePublicId, age: age }, { new: true });

    return res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });

});


const deleteMe = catchAsync(async (req, res, next) => {

    const userId = req.user.id;

    if (req.user.imagePublicId !== null) {
        await cloudinary.uploader.destroy(req.user.imagePublicId);
    }

    await User.findByIdAndDelete(userId);

    return res.status(204).json({
        status: 'success',
        data: null
    });

});


const getAGuide = catchAsync(async (req, res, next) => {

    const guideId = req.body.guideId;

    if (!guideId || guideId.toString().length !== 24)
        return next(new AppError(404, 'No user found.'));

    const guide = await User.findById(guideId);

    if (!guide || guide.role !== 'guide')
        return next(new AppError(404, 'No guide found.'));

    return res.status(200).json({
        status: 'success',
        data: {
            guide
        }
    });
});


const postAGuide = catchAsync(async (req, res, next) => {

    // Fetching the values from req.body
    const { name, email, password, address, number, salary, age } = req.body;

    if (!validateString(name))
        return next(new AppError(400, 'Enter a valid name'));

    if (!validateEmail(email))
        return next(new AppError(400, 'Enter a valid email'));

    if (!validatePassword(password))
        return next(new AppError(400, 'Enter a valid password of more than 6 characters'));

    if (!validateString(address))
        return next(new AppError(400, 'Enter a valid address'));

    if (!validatePhoneNumber(number))
        return next(new AppError(400, 'Enter a valid numeber of 10 digits'));

    if (!validateAge(age))
        return next(new AppError(400, 'Enter a valid age'));

    if (!validateAge(salary))
        return next(new AppError(400, 'Enter a valid salary'));

    // Check if a user with the email exists previously
    const existingUser = await User.findOne({ email });

    // If the user already exists with the email, return an error
    if (existingUser)
        return next(new AppError(400, 'Guide with email ' + email + ' already exists.'));

    let imageLink = "https://res.cloudinary.com/dviyqhmkb/image/upload/v1674681062/defaultProfile_akmzpv.webp";
    let imagePublicId = null;

    if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path);
        imagePublicId = result.public_id;
        imageLink = result.secure_url;
    }

    // Hash the password before storing in DB
    const hashedPassword = await bcrypt.hash(password, 12);

    const newGuide = await User.create({
        name,
        email,
        password: hashedPassword,
        image: imageLink,
        imagePublicId,
        address,
        phoneNumber: number,
        age,
        role: 'guide',
        salary
    });

    return res.status(201).json({
        status: 'success',
        data: {
            user: {
                id: newGuide.id,
                name,
                email,
                image: imageLink,
                imagePublicId,
                address,
                phoneNumber: number,
                age,
                role: 'guide',
                salary
            }
        }
    });

});


const deleteAGuide = catchAsync(async (req, res, next) => {
    const id = req.body.id;
    if (!id || id.toString().length !== 24) return next(new AppError(400, 'No guide found.'));
    await User.findByIdAndDelete(id);
});


const updateAGuide = catchAsync(async (req, res, next) => {
    const { id, name, address, number, age, salary } = req.body;
    if (!id || id.toString().length !== 24) return next(new AppError(400, 'No guide found.'));
    if (name === undefined && address === undefined && number === undefined && age === undefined && salary === undefined) return next(new AppError(400, 'Provide some data for updation.'));

    if (name !== undefined && !validateString(name))
        return next(new AppError(400, 'Please enter a valid name for updation'));

    if (address !== undefined && !validateString(address))
        return next(new AppError(400, 'Please enter a valid address for updation'));

    if (number !== undefined && !validatePhoneNumber(number))
        return next(new AppError(400, 'Please enter a valid phone number for updation'));

    if (age !== undefined && !validateAge(age))
        return next(new AppError(400, 'Please enter a valid age for updation'));

    if (salary !== undefined && !validateAge(salary))
        return next(new AppError(400, 'Please enter a valid salary for updation'));

    // Fetch the user from DB
    const user = await User.findById(id);

    if (!user)
        return next(new AppError(404, 'No Guide Found.'));

    let imageLink = undefined, imagePublicId = undefined;

    if (req.file) {
        if (user.imagePublicId !== null) {
            await cloudinary.uploader.destroy(user.imagePublicId);
        }
        const result = await cloudinary.uploader.upload(req.file.path);
        imagePublicId = result.public_id;
        imageLink = result.secure_url;
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(id, { name, address, phoneNumber: number, image: imageLink, imagePublicId, age: age, salary }, { new: true });

    return res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });

});

const addAdmin = catchAsync(async (req, res, next) => {
    // Fetching the values from req.body
    const { name, email, password, address, number, salary, age } = req.body;

    if (!validateString(name))
        return next(new AppError(400, 'Enter a valid name'));

    if (!validateEmail(email))
        return next(new AppError(400, 'Enter a valid email'));

    if (!validatePassword(password))
        return next(new AppError(400, 'Enter a valid password of more than 6 characters'));

    if (!validateString(address))
        return next(new AppError(400, 'Enter a valid address'));

    if (!validatePhoneNumber(number))
        return next(new AppError(400, 'Enter a valid numeber of 10 digits'));

    if (!validateAge(age))
        return next(new AppError(400, 'Enter a valid age'));

    if (!validateAge(salary))
        return next(new AppError(400, 'Enter a valid salary'));

    // Check if a user with the email exists previously
    const existingUser = await User.findOne({ email });

    // If the user already exists with the email, return an error
    if (existingUser)
        return next(new AppError(400, 'User with email ' + email + ' already exists.'));

    let imageLink = "https://res.cloudinary.com/dviyqhmkb/image/upload/v1674681062/defaultProfile_akmzpv.webp";
    let imagePublicId = null;

    if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path);
        imagePublicId = result.public_id;
        imageLink = result.secure_url;
    }

    // Hash the password before storing in DB
    const hashedPassword = await bcrypt.hash(password, 12);

    const newAdmin = await User.create({
        name,
        email,
        password: hashedPassword,
        image: imageLink,
        imagePublicId,
        address,
        phoneNumber: number,
        age,
        role: 'admin',
        salary
    });

    return res.status(201).json({
        status: 'success',
        data: {
            user: {
                name,
                email,
                image: imageLink,
                imagePublicId,
                address,
                phoneNumber: number,
                age,
                role: 'admin',
                salary
            }
        }
    });
});

module.exports = { sendToken, verifySignUpToken, signup, login, sendRecoveryMail, resetPassword, getAllUsers, getAllCustomers, getAllGuides, getMe, updateMe, deleteMe, getAGuide, postAGuide, deleteAGuide, updateAGuide, addAdmin };
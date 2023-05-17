const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const nodemailer = require("nodemailer");

const Query = require('./../models/Query');

const validateEmail = require("./../utils/validateEmail");
const validateString = require("./../utils/validateString");

const postQuery = catchAsync(async (req, res, next) => {

    const { name, email, query } = req.body;

    if (!validateString(name))
        return next(new AppError(400, 'Enter a valid name'));

    if (!validateEmail(email))
        return next(new AppError(400, 'Enter a valid email address'));

    if (!validateString(query))
        return next(new AppError(400, 'Enter a valid query'));

    const newQuery = await Query.create({
        name,
        email,
        query
    });

    return res.status(201).json({
        status: 'success',
        message: 'Query posted successfully',
        data: {
            query: newQuery
        }
    });

});

const getAllQueries = catchAsync(async (req, res, next) => {

    const queries = await Query.find();

    return res.status(200).json({
        status: 'success',
        results: queries.length,
        data: {
            queries
        }
    });

});

const replyQuery = catchAsync(async (req, res, next) => {

    const { id, replyMessage } = req.body;

    if (id === undefined || id.length !== 24)
        return next(new AppError(404, 'No query found.'));

    const query = await Query.findById(id);

    if (!query)
        return next(new AppError(404, 'No query found.'));

    if (!validateString(replyMessage))
        return next(new AppError(404, 'Empty reply message.'));

    const message = `Hey ${query.name}, \n\nThis email is reply to your query - ${query.query}\n\n${replyMessage}\n\nHave a nice day!\n\nRegards,\nWanderLyst Tours \n\nA Project By: \nAbhigyan Hedau\nMrunali Gadekar\nShreyash Chaple\nHimanshu Akula`;

    await Query.findByIdAndUpdate(id, { replied: true });

    const mailOptions = {
        from: process.env.USER_MAIL,
        to: 'spam22010904@gmail.com',
        // to: query.email,
        subject: 'Reply to Query',
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

    res.status(200).json({
        status: 'success'
    });

});

module.exports = { postQuery, getAllQueries, replyQuery };
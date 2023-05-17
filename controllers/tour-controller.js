const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Tour = require('./../models/Tour');
const User = require('./../models/User');
const cloudinary = require('cloudinary');
const mongoose = require('mongoose');

const validateString = require('./../utils/validateString');

const getAllTours = catchAsync(async (req, res, next) => {
    let allTours = await Tour.find();
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1);
    const day = String(currentDate.getDate());
    const todayDateString = `${year}-${month}-${day}`;
    // let updatedTours = [];
    // for (const tour of allTours) {
    //     updatedTours = tour.dates.filter((date) => {
    //         const tourYear = date.getFullYear();
    //         const tourMonth = date.getMonth();
    //         const tourDate = date.getDate();
    //         const tourDateString = `${tourYear}-${tourMonth}-${tourDate}`;
    //         return tourDateString > todayDateString;
    //     });
    //     await Tour.findByIdAndUpdate(tour.id, { dates: updatedTours });
    // }
    // // Reassign the updated allTours array to the original variable
    // allTours = await Tour.find().populate('guides').populate('reviews');
    return res.status(200).json({
        status: 'success',
        results: allTours.length,
        data: {
            tours: allTours
        }
    });
});

const getTour = catchAsync(async (req, res, next) => {
    const { tourId } = req.body;
    if (!tourId || tourId.length !== 24) return next(new AppError(404, 'Tour not found'));
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1);
    const day = String(currentDate.getDate());
    const todayDateString = `${year}-${month}-${day}`;
    let tour = await Tour.findById(tourId);
    // if (!tour) return next(new AppError(404, 'Tour not found'));
    // let updatedTours = [];
    // updatedTours = tour.dates.filter((date) => {
    //     const tourYear = date.getFullYear();
    //     const tourMonth = date.getMonth();
    //     const tourDate = date.getDate();
    //     const tourDateString = `${tourYear}-${tourMonth}-${tourDate}`;
    //     return tourDateString >= todayDateString;
    // });
    // await Tour.findByIdAndUpdate(tour.id, { dates: updatedTours });
    // tour = await Tour.findById(tourId).populate('guides').populate({
    //     path: 'reviews',
    //     populate: {
    //         path: 'userId'
    //     }
    // });
    if (!tour)
        return next(new AppError(404, "No tour found"));
    return res.status(200).json({
        status: 'success',
        data: {
            tour
        }
    });
});

const postTour = catchAsync(async (req, res, next) => {
    const { name, description, difficulty, dates, locations, duration, participants, price, guides } = req.body;
    // perform validation
    if (!validateString(name)) return next(new AppError(400, 'Invalid Tour Name'));
    if (!validateString(description)) return next(new AppError(400, 'Invalid Tour description'));
    if (!validateString(difficulty)) return next(new AppError(400, "Invalid Tour difficulty. Simply specify 'easy', 'medium' or 'hard'."));
    if (dates === undefined || dates.length === 0) return next(new AppError(400, 'Invalid Tour dates'));
    if (locations === undefined || locations.length === 0) return next(new AppError(400, 'Invalid Tour locations'));
    if (!validateString(duration)) return next(new AppError(400, 'Invalid Tour duration'));
    if (!validateString(participants)) return next(new AppError(400, 'Invalid Tour participants'));
    if (!validateString(price)) return next(new AppError(400, 'Invalid Tour price'));
    let imageLink = "https://res.cloudinary.com/ds4l1uae7/image/upload/v1681737167/pexels-te-lensfix-1371360_lajqrk.jpg";
    let imagePublicId = null;
    let images = [];
    if (req.files) {
        for (const file of req.files) {
            const result = await cloudinary.uploader.upload(file.path);
            imagePublicId = result.public_id;
            imageLink = result.secure_url;
            images.push({ imageLink, imagePublicId });
        }
    } else images.push({ imageLink, imagePublicId });
    const newTour = await Tour.create({
        name,
        description,
        difficulty,
        images,
        dates,
        locations,
        duration,
        participants,
        price,
        guides
    });
    const tour = await Tour.findById(newTour.id).populate('guides').populate('reviews');
    return res.status(201).json({
        status: 'success',
        data: {
            tour
        }
    });
});

const updateTour = catchAsync(async (req, res, next) => {
    const { tourId, name, description, difficulty, dates, existingLocations, duration, participants, price, existingImages, imagesChanged, newLocations, locationsChanged } = req.body;
    // perform validation
    if (tourId === undefined || tourId.length !== 24) return next(new AppError(404, 'Tour not found. Specify tour id.'));
    if (name !== undefined && !validateString(name)) return next(new AppError(400, 'Invalid Tour Name'));
    if (description !== undefined && !validateString(description)) return next(new AppError(400, 'Invalid Tour description'));
    if (difficulty !== undefined && !validateString(difficulty)) return next(new AppError(400, 'Invalid Tour difficulty'));
    if (dates !== undefined && dates.length === 0) return next(new AppError(400, 'Invalid Tour dates'));
    if (existingImages !== undefined && existingImages.length === 0) return next(new AppError(400, 'Invalid Tour locations. You cannot remove all tour locations. Atleast add one tour location.'));
    if (duration !== undefined && !validateString(duration)) return next(new AppError(400, 'Invalid Tour duration'));
    if (participants !== undefined && !validateString(participants)) return next(new AppError(400, 'Invalid Tour participants'));
    if (price !== undefined && !validateString(price)) return next(new AppError(400, 'Invalid Tour price'));

    const tour = await Tour.findById(tourId);

    let updatedImages = [];
    let toBeDeletedImages = [];

    if (imagesChanged === "true") {

        // update the images array with only the images that are currently present 
        for (const imageObj of tour.images) {
            const imageFound = existingImages.find(exImGObj => {
                return exImGObj._id === imageObj.id;
            });
            if (imageFound) updatedImages.push(imageObj);
            else toBeDeletedImages.push(imageObj);
        }

        // delete the images that don't exist anymore
        for (const imageObj of toBeDeletedImages) {
            await cloudinary.uploader.destroy(imageObj.imagePublicId);
        }

        // upload the images that have been updated
        if (req.files) {
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload(file.path);
                imagePublicId = result.public_id;
                imageLink = result.secure_url;
                updatedImages.push({ imageLink, imagePublicId });
            }
        }

        // if no images are there for the tour set the tour image as default tour image
        if (updatedImages.length === 0) {
            let imageLink = "https://res.cloudinary.com/ds4l1uae7/image/upload/v1681737167/pexels-te-lensfix-1371360_lajqrk.jpg";
            let imagePublicId = null;
            updatedImages.push({ imageLink, imagePublicId });
        }
    }

    let updatedLocations = tour.locations;

    if (locationsChanged === "true") {
        updatedLocations = existingLocations;
        for (const location of newLocations) updatedLocations.push(location);
    }

    const updatedTour = await Tour.findByIdAndUpdate(tourId, { name, description, difficulty, dates, locations: updatedLocations, duration, participants, price, images: updatedImages }, { new: true }).populate('guides');
    return res.status(200).json({
        status: 'success',
        data: {
            tour: updatedTour
        }
    });
});

const deleteTour = catchAsync(async (req, res, next) => {
    const { tourId } = req.body;
    if (tourId === undefined || tourId.length !== 24) return next(new AppError(404, 'Tour not found. Specify tour id.'));
    const tour = await Tour.findById(tourId);
    if (!tour) return next(new AppError(400, 'Tour not found'));
    for (const image of tour.images) {
        await cloudinary.uploader.destroy(image.imagePublicId);
    }
    await Tour.findByIdAndDelete(tourId);
    return res.status(200).json({
        status: 'success',
        message: 'Tour successfully deleted'
    });
});

const addGuideToTour = catchAsync(async (req, res, next) => {
    const { tourId, guides } = req.body;
    if (tourId === undefined || tourId.length !== 24) return next(new AppError(400, 'Invalid tour id'));
    if (guides === undefined) return next(new AppError(400, 'Add atleast one guide'));
    const tour = await Tour.findById(tourId);
    const availableGuides = tour.guides;
    for (const guideId of guides) {
        if (guideId.length !== 24) return next(new AppError(400, 'No guide found with id: ' + guideId));
        const guide = await User.findById(guideId);
        if (!guide) return next(new AppError(400, 'No guide found with id: ' + guideId));
        const guideIdObj = new mongoose.Types.ObjectId(guideId);
        if (!availableGuides.some(objectId => objectId.equals(guideIdObj))) availableGuides.push(guideIdObj);
    }
    const updatedTour = await Tour.findByIdAndUpdate(tourId, { guides: availableGuides }, { new: true }).populate('guides').populate('reviews');
    return res.status(200).json({
        status: 'success',
        data: {
            tour: updatedTour
        }
    });
});

const removeGuideFromTour = catchAsync(async (req, res, next) => {
    const { tourId, guides } = req.body;
    if (tourId === undefined || tourId.length !== 24) return next(new AppError(400, 'Invalid tour id'));
    if (guides === undefined) return next(new AppError(400, 'Add guides to remove'));
    const tour = await Tour.findById(tourId);
    let availableGuides = tour.guides;
    for (const guideId of guides) {
        if (guideId.length !== 24) return next(new AppError(400, 'No guide found with id: ' + guideId));
        const guide = await User.findById(guideId);
        if (!guide) return next(new AppError(400, 'No guide found with id: ' + guideId));
        const guideIdObj = new mongoose.Types.ObjectId(guideId);
        const idx = availableGuides.indexOf(guideIdObj);
        if (idx !== -1) availableGuides.splice(idx, 1);
    }
    const updatedTour = await Tour.findByIdAndUpdate(tourId, { guides: availableGuides }, { new: true }).populate('guides').populate('reviews');
    return res.status(200).json({
        status: 'success',
        data: {
            tour: updatedTour
        }
    });
});

module.exports = { getAllTours, getTour, postTour, updateTour, deleteTour, addGuideToTour, removeGuideFromTour };
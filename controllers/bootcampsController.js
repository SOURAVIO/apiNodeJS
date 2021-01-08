const ErrorResponse = require('../utils/ErrorResponse')
const asyncHandler = require('../middleware/async')
const geocoder = require('../utils/geocoder');
const Bootcamp = require("../models/BootcampModel");

// @description     Get all bootcamps
// @route           GET /api/v1/bootcamps
// @access          Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {

    // try {
    // console.log(req.query);
    let query;

    //Copy req.query ******************************
    const reqQuery = {...req.query};

    //Field to Exclude *****************************
    const removeField = ['select', 'sort', 'page', 'limit'];

    //Loop over removeFields and delete them from reqQuery **********
    removeField.forEach(param => delete reqQuery[param]);

    //Create Query String ************************
    let queryString = JSON.stringify(reqQuery);

    //Create operators ($gt, $gte, $lt, $lte, $in etc)*******
    queryString = queryString.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    //Finding Resource ******************************
    query = Bootcamp.find(JSON.parse(queryString)).populate('courses');

    // const bootcamps = await Bootcamp.find();
    //Select Fields *******************************
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
        console.log(fields);
    }

    //Sort Fields *********************************
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }

    //Pagination **********************************
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 2;
    // const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Bootcamp.countDocuments();

    query = query.skip(startIndex).limit(limit);

    //Executing Query *****************************
    const bootcamps = await query;

    //Pagination Result ****************************
    const pagination = {};

    if (endIndex < total) {
        pagination.next = {
            page: page + 1,
            limit
        }
    }
    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit
        }
    }

    // if (!bootcamps) {
    //     return next(new ErrorResponse(`Bootcamp not found with id ${req.params.id}`, 404));
    // }
    res.status(200).json({
        status: true,
        total,
        count: bootcamps.length,
        pagination,
        data: bootcamps
    });
    // } catch (errors) {
    //     // res.status(400).json({success: false});
    //     next(errors);
    // }


    // res.status(200)
    //     .json({
    //         success: true,
    //         msg: "Show All Bootcamps",
    //         // hello: req.hello
    //     });
});

// @description     Get single bootcamp
// @route           GET /api/v1/bootcamps/:id
// @access          Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
    // try {
    const bootcamp = await Bootcamp.findById(req.params.id);
    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id ${req.params.id}`, 404));
    }
    res.status(200).json({success: true, data: bootcamp});
    // } catch (errors) {
    //     // res.status(400).json({success: false});
    //     next(errors);
    //     // next(new ErrorResponse(`Bootcamp not found with id ${req.params.id}`, 404));
    // }
    // res.status(200)
    //     .json({
    //         success: true,
    //         msg: `Show a Single Bootcamp ${req.params.id}`
    //     });
});

// @description     Create new bootcamp
// @route           POST /api/v1/bootcamps
// @access          Private
exports.creteBootcamp = asyncHandler(async (req, res, next) => {
    // console.log(req.body);
    // res.status(200)
    //     .json({
    //         success: true,
    //         msg: "Create New Bootcamp"
    //     });
    // try {
    const bootcamp = await Bootcamp.create(req.body);
    res.status(201).json({
        success: true,
        data: bootcamp
    });
    // } catch (errors) {
    //     // res.status(400).json({success: false});
    //     next(errors);
    // }
});

// @description     Update bootcamp
// @route           PUT /api/v1/bootcamps/:id
// @access          Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
    // try {
    const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id ${req.params.id}`, 404));
    }
    res.status(200).json({success: true, data: bootcamp});
    // } catch (errors) {
    //     // res.status(400).json({success: false});
    //     next(errors);
    // }

    // res.status(200)
    //     .json({
    //         success: true,
    //         msg: `Update Bootcamp ${req.params.id}`
    //     });
});

// @description     Delete bootcamp
// @route           DELETE /api/v1/bootcamps/:id
// @access          Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
    // try {
    const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);

    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id ${req.params.id}`, 404));
    }
    res.status(200).json({success: true, data: {}});
    // } catch (errors) {
    //     // res.status(400).json({success: false});
    //     next(errors);
    // }
    // res.status(200)
    //     .json({
    //         success: true,
    //         msg: `Delete Bootcamp ${req.params.id}`
    //     });
});

// @description     Get bootcamps with radious
// @route           GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access          Private
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
    const {zipcode, distance} = req.params;

    // get latitude/ longitude from geocoder
    const loc = await geocoder.geocode(zipcode);
    const latitude = loc[0].latitude;
    const longitude = loc[0].longitude;

//    Calc radius using radius
//    Divided dist by radius of earth
//    Earth Radius = 3963 miles / 6378 km
    const radius = distance / 3963;

    const bootcamps = await Bootcamp.find(
        {
            location: {$geoWithin: {$centerSphere: [[longitude, latitude], radius]}}
        });
    res.status(200).json({
        success: true,
        count: bootcamps.length,
        data: bootcamps
    });
});

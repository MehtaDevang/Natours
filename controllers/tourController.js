const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAync');
const factory = require("./handlerFactory");

exports.aliasTopTours = (req, res, next) => {
    // eslint-disable-next-line no-unused-expressions
    req.query.limit = '5';
    req.query.sort = '-ratingAverage,price';
    req.query.fields = 'name,price,ratingAverage,summary,difficulty';
    next();
}

// exports.checkID = (req, res, next, val) => {
//     console.log(`value of id is ${val}`)
//     // if(req.params.id*1 > tours.length){
//     //     return res.json({
//     //         status: 'fail',
//     //         message: 'Invalid ID' 
//     //     }).status(404)
//     // }
//     next();
// }

// exports.validateBody = (req, res, next) => {
//     const data = req.body;
//     if(!data.name || !data.price){
//         return res.status(400).json({
//             status: 'fail',
//             message: 'Invalid Body Parameters'
//         });
//     }
//     next();
// }
exports.getAllTours = factory.getAll(Tour)

// exports.getTour = catchAsync(async (req, res, next) => {
//     console.log(req.params)
//     const tour = await Tour.findById(req.params.id).populate('reviews');              // Tour.findOne({ _id: req.params.id})
//     if(!tour){
//         next(new AppError(`No tour found with id ${req.params.id}`, 404))
//     }

//     res.json({
//         status: "success",
//         requestedAt: req.requestTime,
//         data: {
//             tour: tour
//         }
//     }).status(200) 
// })

// exports.getTour = factory.getOne(Tour, {'path': 'reviews'});
exports.getTour = catchAsync(async(req, res) =>{
    const tour = await Tour.findOne({slug:req.param.slug}).populate({
        path:'reviews',
        fields: 'review rating user'
    })

    // res.set(

    //     'Content-Security-Policy',

    //     "default-src 'self' https://*.mapbox.com; base-uri 'self'; block-all-mixed-content; font-src 'self' https:; frame-ancestors 'self'; img-src 'self' blob: data:; object-src 'none'; script-src 'unsafe-inline' https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob:; style-src 'self' https: 'unsafe-inline'; upgrade-insecure-requests;"

    // );
    res.status(200).render('tour', {
        title: tour.name,
        tour
    })
})
exports.createTour = factory.createOne(Tour);

// exports.updateTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//         new: true,
//         runValidators: true
//     })
//     if(!tour){
//         next(new AppError(`No tour found with id ${req.params.id}`, 404))
//     }
//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour: tour
//         }
//     });
// })
exports.updateTour = factory.updateOne(Tour);

// UPDATED below the commented code. basically running it from the factory
// exports.deleteTour = catchAsync(async (req, res, next) => {
//     console.log(req.params)
//     const tour = await Tour.findByIdAndDelete(req.params.id);

//     if(!tour){
//         return next(new AppError(`No tour found with id ${req.params.id}`, 404))
//     }
//     return res.status(204).json({
//         status: "success",
//         data: null
//     });
// })

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([ 
        {
            $match: {
                ratingAverage: {$gte: 3}
            }
        },
        {
            $group: {
                _id: {$toUpper: '$difficulty'},
                // _id: '$difficulty',
                num: {$sum: 1},
                numRatings: {$sum: '$ratingsQuantity'},
                avgRating: {$avg : '$ratingAverage'},
                avgPrice: {$avg: '$price'},
                minPrice: {$min: '$price'},
                maxPrice: {$max: '$price'}
            }
        },
        {
            $sort: {'avgPrice': 1}
        },
        // {
        //     $match: {
        //         _id: {$ne: "EASY"}
        //     }
        // }
    ]);
    res.status(200).json({
        status: 'success',
        data : {
            stats
        }
    });
})

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1;

    const plan = await Tour.aggregate([
        {
            $unwind : {
                path: "$startDates",
                includeArrayIndex : "dateIndex"
            }
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: {$month: '$startDates'},
                numTourStarts : {$sum: 1},
                tours: {
                    $push: '$name'
                }
            }
        },
        {
            $sort : {'_id': 1}
        },
        {
            $addFields: {
                month: "$_id"
            }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: {'numTourStarts': -1}
        },
        {
            $limit: 12
        }
    ]);

    res.status(200).json({
        status: 'success',
        data : {
            plan
        }
    });
})


// /tours-within/23/center-40,45/unit/mi
exports.getToursWithin = catchAsync(async(req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [ lat, lng ] = latlng.split(",");


    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;            // converting the distance into radians
    
    if(!lat || !lng){
        next(new AppError("Please provide the latitude and longitude in the format lat, lng.", 400))
    }
    
    const tours = await Tour.find({
        startLocation: { $geoWithin: {
            $centerSphere: [[lng, lat], radius]
        }}
    })

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours
        }
    })
});

exports.getDistances = catchAsync( async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [ lat, lng ] = latlng.split(",");
    const multiplier = unit === 'mi' ? 0.0006213712 : 0.001

    if(!lat || !lng){
        next(new AppError("Please provide the latitude and longitude in the format lat, lng.", 400))
    }
    
    const distances = await Tour.aggregate(
        [
            {
                $geoNear: {
                    near: {type: "Point", coordinates: [lng*1, lat*1]},
                    distanceField: 'distance',
                    distanceMultiplier: multiplier
                }
            },
            {
                $project: {
                    distance: 1,
                    name: 1
                }
            }
        ]
    )

    res.status(200).json({
        status: 'success',
        results: distances.length,
        data: {
            data: distances
        }
    })
})
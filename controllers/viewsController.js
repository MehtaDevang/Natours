
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAync');


exports.getLoginForm = catchAsync(async (req, res) => {
    res
    .status(200)
    .set(
        'Content-Security-Policy',
        "script-src 'self' https://cdnjs.cloudflare.com/ajax/libs/axios/1.6.8/axios.min.js 'unsafe-inline' 'unsafe-eval';"
      )
    .render('login', {
        title: "Login"
    })
})

exports.getOverview = catchAsync(async(req, res, next) => {
    // get tour data from collections
    const tours = await Tour.find()



    // build template

    // render the template using the tour data
    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    })
})

exports.getTour = catchAsync(async(req, res, next) => {

    // get the data for the requested tour including the guides and reviews
    const tour = await Tour.findOne({slug: req.params.slug}).populate({
        path: 'reviews',
        fields: 'review rating reviewer'
    })
    res.status(200).render('tour', {
        title: tour.name,
        tour
    })
})
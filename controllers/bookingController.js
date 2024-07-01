const catchAsync = require("../utils/catchAync");
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const factory = require("./handlerFactory");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


exports.getCheckoutSession = catchAsync( async (req, res, next) => {
    const tour = await Tour.findById(req.params.tourID);

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourID,
        line_items: [
            {
                price_data: {
                    unit_amount: tour.price * 100,
                    currency: 'inr',
                    product_data: {
                        name: `${tour.name} Tour`,
                        description: tour.summary,
                        images: [
                        `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`
                        ],
                    }
                },                
                quantity: 1
            }
        ]
    });

    res.status(200).json({
        status: 'success',
        session
    })
})
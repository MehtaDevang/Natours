const Review = require("../models/reviewModel");
const factory = require("./handlerFactory");

exports.setTourAndUserId = (req, res, next) => {
    // Allow nested routes
    if(!req.body.tour) req.body.tour = req.params.tourId;
    if(!req.body.reviewer) req.body.reviewer = req.user.id;
    next();
}

exports.getAllReviews = factory.getAll(Review);
exports.createReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.getReview = factory.getOne(Review);

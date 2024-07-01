const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require("../controllers/authController");
// const reviewController = require("../controllers/reviewController");
const reviewRouter = require("./reviewRoutes");

const router = express.Router();

// creating a param middleware
// router.param('id', tourController.checkID);


// GET tours/24131/reviews
// POST tours/21435/reviews
// GET tours/452532/reviews/3522352
// router
// .route("/:tourId/reviews")
// .get(authController.protect, reviewController.getAllReviews)
// .post(authController.protect, authController.restrictTo('user'), reviewController.createReview)

// for this specific route here, we would want to use the reviewRouter
router.use('/:tourId/reviews', reviewRouter);

router.route("/top-5-cheap").get(tourController.aliasTopTours, tourController.getAllTours);
router.route("/tour-stats").get(tourController.getTourStats);
router.route("/monthly-plan/:year").get(
     authController.protect,
     authController.restrictTo('admin', 'lead-guide', 'guide'), 
     tourController.getMonthlyPlan);


// /tours-within/23/center-40,45/unit/mi
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);
router 
.route("/")
.get(tourController.getAllTours)
// .post(tourController.validateBody, tourController.createTour)
.post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createTour);


router
.route("/:id")
.get(tourController.getTour)
.patch(authController.protect,
     authController.restrictTo('admin', 'lead-guide'), tourController.updateTour)
.delete(authController.protect,
     authController.restrictTo('admin', 'lead-guide'), 
     tourController.deleteTour)

router.route("/tour-stats").get(tourController.getTourStats);

module.exports = router
// review / rating / created at / ref to tour / ref to user

const mongoose = require("mongoose")
const Tour = require("./tourModel");

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, "Please enter the text for the review!"],
        maxLength: [50, "The maximum length of a review can be 50 characers"],
        minLength: [10, "The minimum length of a eview can be 10 characters"]
    },
    rating: {
        type: Number,
        required: [true, "A review must have a rating"],
        min: [1, "The rating should be greater than or equal to 1"],
        max: [5, "The rating should be less than or equal to 5"]  
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, "A review must belong to a tour"]
    },
    reviewer: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, "A review must have a reviewer"]
    }
},
{
    toJSON: {virtuals: true},                           // helps in add the reference fields when virtual fields are created
    toObject: {virtuals: true}
}
);

reviewSchema.index({tour: 1, user: 1}, {unique: true})
reviewSchema.statics.calcAverageRatings = async function(tourId){
    // this here points to the current model
    const stats = await this.aggregate([
        {
            $match: {tour:tourId}
        },
        {
            $group: {
                _id: '$tour',              // grouping by tour id
                nRatings: {$sum: 1},
                avgRating: {$avg: '$rating'}
            }
        }
    ]);
    if(stats.length > 0){
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRatings,
            ratingAverage: stats[0].avgRating
        });
    } else{
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingAverage: 4.5
        });
    }
};


reviewSchema.post('save', function(){
    // here this points to current review
    this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate
// findByIdAndDelete

reviewSchema.pre(/^findOneAnd/, async function(next){
    this.r = await this.findOne();
    console.log(`this is updated review: ${this.r}`);
    next();
});

reviewSchema.post(/^findOneAnd/, async function(){
    await this.r.constructor.calcAverageRatings(this.r.tour);
});


reviewSchema.pre(/^find/, function(next){
    // this.populate({
    //     'path': "tour",
    //     "select": "name"
    // }).populate({
    //     'path': "reviewer",
    //     "select": "name"
    // })

    this.populate({
        'path': "reviewer",
        'select': "name"
    });
    next();
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
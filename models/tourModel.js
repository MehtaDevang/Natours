// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');
// eslint-disable-next-line import/no-extraneous-dependencies
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

const toursSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
        trim: true,
        maxLength: [40, 'A tour name must have less or equal than 40 characters'],
        minLength: [10, 'A tour name must have more or equal that 10 characters'],
        // validate: {
        //     validator: function(val){
        //         return validator.isAlpha(val);
        //     },
        //     message: 'the name should only contain alpha numeric characters'
        // }
    },
    slug: {
        type: String
    },
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type : Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum:  {
            values: ['easy', 'medium', 'difficult'],
            message: 'The difficulty is either easy, medium or difficult'
        }
    },
    ratingAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
        set: val => (Math.round(val) * 10) / 10
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val){
                //this only points to current doc on NEW document creation, but not on update
                return val < this.price;
            },
            message: 'The discount price ({VALUE}) should be lower than regular price'
        }
    },
    summary: {
        type: String,
        required: [true, 'A tour must have a description'],
        trim: true                  // removes whitespace from beginning and end of the string
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    images: {
        type: [String]
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        // GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
},

{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

toursSchema.index({ price:1, ratingAverage: -1 });
toursSchema.index({slug: 1});
toursSchema.index({startLocation: '2dsphere'})

toursSchema.virtual("durationWeeks").get(function(){
    return this.duration / 7;
});

// virtual populate
toursSchema.virtual("reviews", {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});
// document middleware, runs before a save command .save() and .create command but not on update
toursSchema.pre('save', function(next){
    // console.log(this);          // this points to the currently processed document
    this.slug = slugify(this.name, {lower: true});
    next();
});


// EMBEDDING GUIDES INTO TOURS
// toursSchema.pre('save', async function(next){
//     const guidesPromises = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidesPromises)
//     next();
// })




// toursSchema.post('save', function(doc, next){
//     console.log(doc);
//     next();
// });

// QUERY MIDDLEWARE - 

// all the queries that start with find
toursSchema.pre(/^find/, function(next){
    this.start = Date.now();
    this.find({'secretTour': {$ne: true}});
    next();
});

toursSchema.pre(/^find/, function(next){
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });
    next();
})
// toursSchema.pre('findOne', function(next){
//     this.find({'secretTour': {$ne: true}});
//     next();
// });

toursSchema.post(/^find/, function(docs, next){
    // console.log(`Query took ${Date.now() - this.start} milliseconds`);
    next();
})


// AGGREGATION MIDDLEWARE - 
// toursSchema.pre('aggregate', function(next){
//     this.pipeline().unshift({
//         $match: {secretTour: {$ne: true}}
//     });
//     console.log(this.pipeline())
//     next();
// })
const Tour = mongoose.model('Tour', toursSchema);

module.exports = Tour;

// const testTour = new Tour({
//     name: 'The Park Camper',
//     price: 520
// });

// testTour.save().then(doc => {
//     console.log(doc);
// })
// .catch(err => {
//     console.log("Error:", err);
// });

const catchAsync = require("../utils/catchAync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);

    if(!document){
        return next(new AppError(`No document found with id ${req.params.id}`, 404))
    }
    return res.status(204).json({
        status: "success",
        data: null
    });
});

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })
    if(!document){
        next(new AppError(`No tour found with id ${req.params.id}`, 404))
    }
    res.status(200).json({
        status: 'success',
        data: {
            document
        }
    });
})


exports.createOne = Model => catchAsync(async (req, res, next) => {
    const document = await Model.create(req.body);
    
    res.json({
        status: 'success',
        data: {
            document
        }
    }).status(201)
});


exports.getOne = (Model, populateOptions) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if(populateOptions) query = query.populate(populateOptions);
    const document = await query

    if(!document){
        next(new AppError(`No document found with id ${req.params.id}`, 404))
    }
    
    res.json({
        status: "success",
        requestedAt: req.requestTime,
        data: {
            document
        }
    }).status(200) 
});

exports.getAll = Model => catchAsync(async (req, res, next) => {
    let filter = {}
    if(req.params.tourId) filter = {tour: req.params.tourId}; 

    // EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
    // const document = await features.query.explain();
    const document = await features.query
    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: document.length,
        data: {
            document
        }
    });
})
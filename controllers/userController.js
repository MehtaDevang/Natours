const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAync");
const factory = require("./handlerFactory");
const multer = require('multer');

// where and how the files will be stored
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/img/users');
    },
    filename: (req, file, cb) => {
        // user-id-timestamp.jpeg
        const extension = file.mimetype.split('/')[1];
        cb(null, `user-${req.user.id}-${Date.now()}.${extension}`)
    }
})

// to filter only image files otherwise throw an error
const multerFilter = (req, file, cb) => {
    if(file.mimetype.startsWith('image')){
        cb(null, true)
    } else{
        cb(new AppError("Not an image. Please upload only images", 400), false)
    }
}

// configuring multer for file upload
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
})


exports.uploadUserPhoto = upload.single('photo');

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(field => {
        if(allowedFields.includes(field)) newObj[field] = obj[field];
    });
    return newObj;
}

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
}

exports.createUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "This route is not defined. Please use /signup instead"
    });
}

exports.updateMe = catchAsync(async(req, res, next) => {
    console.log(req.file);
    console.log(req.body);
    if(req.body.password || req.body.passwordConfirm){
        return next(new AppError("This route is not for password updates. please use updatePassword", 400))
    }

    const filteredBody = filterObj(req.body, 'name', 'email');
    if(req.file) filteredBody.photo = req.file.filename;
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: "success",
        data: {
            user: updatedUser
        }
    })
})

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false});

    res.status(204).json({
        status: "success",
        data: null
    });
});

// Do not update passwords with this!
exports.updateUser = factory.updateOne(User);
exports.getAllUsers = factory.getAll(User);
exports.getUser =factory.getOne(User)
exports.deleteUser = factory.deleteOne(User);

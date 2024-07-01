const { promisify } = require('util');
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAync");
const AppError = require("../utils/appError");
const Tour = require('../models/tourModel');
const Email = require('../utils/email');
const crypto = require("crypto");
const bcrypt = require("bcryptjs");


const signToken = id => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createAndSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60* 60 * 1000),
        httpOnly: true
    };

    // if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    res.cookie('jwt', token, cookieOptions);
    user.password = undefined;
    res.status(statusCode).json({
        status: "success",
        token,
        data: { 
            user
        }
    });
}

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        role: req.body.role
    })

    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    await new Email(newUser, url).sendWelcome()
    // const newUser = await User.create(req.body);
    createAndSendToken(newUser, 201, res)
    // creating json web token
    // const token = signToken(newUser._id);

    // res.status(201).json({
    //     status: "success",
    //     token,
    //     data: {
    //         user: newUser
    //     }
    // })
});

exports.login = catchAsync(async (req, res, next) => {
    console.log(req.body)
    const { email, password } = req.body;
    
    // check if email and password exist
    if(!email || !password){
        return next(new AppError("Please provide email and password"), 400);
    }
    
    //check if user exists and password correct
    const user = await User.findOne({email}).select('+password');
    if(!user || !(await user.correctPassword(password, user.password))){
        return next(new AppError("Incorrect email or password"), 401)
    }
    // if everything ok, send the token to the client
    createAndSendToken(user, 200, res);
    // const token = signToken(user._id);
    // res.status(200).json({
    //     status: "success",
    //     token,
    //     data: { 
    //         user
    //     }
    // });
})


exports.protect = catchAsync(async (req, res, next) => {
    let token;
    // 1. getting the token and check if it exists
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(" ")[1];
    } else if(req.cookies.jwt){
        token = req.cookies.jwt
    }

    if(!token){
        return next(new AppError("You are not logged in! Please log in to get access"), 401);
    }
    // 2. verification of token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
    // 3. check if user still exists
    const freshUser = await User.findById(decoded.id);
    if(!freshUser){
        return next(new AppError("The user belonging to the token does not exist"), 401)
    }
    // 4.check if user changed password after the token was issued
    if(freshUser.changedPasswordAfter(decoded.iat)){
        return next(new AppError("User recently changed password! please login again"))
    };

    //grant access to protected route
    req.user = freshUser;
    
    next();
})

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)){
            return next(new AppError(" You do not have permission to run the function...", 403))
        }
        next();
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) =>{
    // 1. get user based on posted email
    console.log(req.body)
    const user = await User.findOne({email: req.body.email});
    if(!user){
        return next(new AppError("There is no user with the given email address", 404));
    }
    
    // 2. geneate the random reset
    const resetToken = user.createPasswordResetToken();
    const updatedTokenUser = await user.save({validateBeforeSave: false});
    console.log(updatedTokenUser);
    // 3. send it to users email
    const resetUrl = `${req.protocol}://${req.get('host')}/api/users/resetPassword/${resetToken}`;
    const message = `Forgot your password? Submit a patch request with your new password and password confirm to: ${resetUrl}.\nIf you didn't forget your password please ignore this email!`

    try{
        // await sendEmail({
        //     email: user.email,
        //     subject: 'Your password reset token (valid for 10 minutes)',
        //     message: message
        // });

        res.status(200).json({
            status: 'success',
            message: "Token sent to email!"
        });
    } catch(error){
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.save({validateBeforeSave: false});
        return next(new AppError("There was an error sending the email. Please try again!", 500))
    }
});

exports.resetPassword = catchAsync(async (req, res, next) =>{
    // 1. get user based on token
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest('hex');
    console.log(hashedToken, Date.now())
    const user = await User.findOne({
        passwordResetToken: hashedToken, 
        // passswordResetExpires: {$gt: Date.now()}
    });

    // 2. if token has not expired and there is user, set the new password
    if(!user){
        return next(new AppError("Token is invalid or expired", 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3.update changedPasswordAt property of the user

    // 4. log the user in and send jwt back

    createAndSendToken(user, 200, res);
    // const token = signToken(user._id);
    // res.status(200).json({
    //     status: "success",
    //     token,
    //     data: { 
    //         user
    //     }
    // });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1. get user 
    const user = await User.findById(req.user.id).select('+password');
    
    // 2. check if passsword is correct
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
        return next(new AppError("Your current password is incorrect!", 401));
    }

    // 3. update the password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.save()

    // 4. send the new json token to the user
    const token = signToken(user._id);
    res.status(200).json({
        status: "success",
        token,
        data: { 
            user
        }
    });
})
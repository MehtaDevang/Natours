const crypto = require('crypto');
const mongoose = require('mongoose');
// eslint-disable-next-line import/no-extraneous-dependencies
const validator = require("validator");
const bcrypt = require("bcryptjs");

// name, email, photo, password, passwordComfirm

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A user must have a name'],
        maxLength: [40, 'The name of a user must have less or equal than 40 characters'],
        minLength: [10, 'The name of a user must have more or equal that 10 characters'],
    },
    email: {
        type: String,
        required: [true, 'please provide your email'],
        unique: true,
        lowercase: true,
        validate: {
            validator: function(val){
                return validator.isEmail(val);
            },
            message: "please provide a valid email"
        }
    },
    photo : {
        type: String,
        default: 'default.jpg'
    },
    password : {
        type: String,
        requied: [true, 'please provide a password'],
        minLength: [8, ' a password must have at least 8 characters'],
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'please confirm your password'],
        validate: {
            // this only works on create and save
            validator: function(val){
                return val === this.password
            },
            message: "passwordConfirm should match the password"
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: {
        type:String
    },
    passwordResetExpires: Date,
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        return next();
    }

    this.passwordChangedAt = Date.now() - 1000;
    next();
})

userSchema.pre("save", async function(next){
    // checks if the password is modified in the recent change. this is a provided function in express
    if(!this.isModified('password')){
        return next()
    } 

    this.passwordChangedAt = Date.now();
    

    this.password = await bcrypt.hash(this.password, 12);

    // deleting the passwordConfirm from the document
    this.passwordConfirm = undefined;

    next();
})

userSchema.pre(/^find/, function(next){
    this.find({active: {$ne: false}});
    next();
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    return await bcrypt.compare(candidatePassword, userPassword)
};


userSchema.methods.changedPasswordAfter = function(JWTTimestamp){
    if(this.passwordChangedAt){
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime()/1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    
    return false;
}

userSchema.methods.createPasswordResetToken  = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60* 1000;
    return resetToken;
}

const User = mongoose.model('User', userSchema);

module.exports = User;
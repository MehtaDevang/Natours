const AppError = require("../utils/appError");

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
}

const handleDuplicateErrorDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);
  const message = `Duplicate field value: ${value}. please use another value`;
  return new AppError(message, 400);
}

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el=> el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400); 
}

const handleJWTError = () => new AppError("Invalid token. please login again", 401);
const handleTokenExpiredError = () => new AppError("Token expired. please login again", 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
}

const sendErrorProd = (err, res) => {
  if(err.isOperational){
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else{
    console.log("Error occured....🥲", err.message);

    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";
    
    const env = "development";

    if(env === "development"){
      sendErrorDev(err, res);
      next();
    } else if(env === "production"){
      let error = {...err};
      if(error.name === "CastError") error = handleCastErrorDB(error);
      if(error.name === 11000) error = handleDuplicateErrorDB(error);
      if(error.name === "ValidationError") error = handleValidationErrorDB(error);
      if(error.name === "JsonWebTokenError") error = handleJWTError();
      if(error.name === "TokenExpiredError") error = handleTokenExpiredError();
      sendErrorProd(error, res);
      next();
    }
    // res.status(err.statusCode).json({
    //   "status": err.status,
    //   "message": err.message
    // });
    // next();
  }
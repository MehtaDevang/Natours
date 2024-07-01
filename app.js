const express = require('express');
const path = require('path');
const morgan = require('morgan');
const expressRateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require("./routes/reviewRoutes");
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes')
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// setting up pug templates in express
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'));



//1. MIDDLEWARES
//app.use to add a middleware

// set security http headers
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'", 'blob:', 'https://*.mapbox.com'],
    scriptSrc: ["'self'", 'https://*.mapbox.com', "'unsafe-inline'", 'blob:'],
  },
}))

// used for request info
// logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}


// rate limiting of requests
const limiter = expressRateLimit({
  max: 1000,                     // 100 requests from the same ip
  windowMs: 60*60*1000,          // within 1 hour
  message: "Too many requests from this ip, please try again in one hour"
});

app.use('/api', limiter);


//express.json middleware is used to add the request body to the req object
app.use(express.json({ limit: '10kb'})); // this is a middleware that will be used
app.use(cookieParser());

// data sanitization against nosql query injection
app.use(mongoSanitize())

// data sanitization against XSS
app.use(xss());

// to prevent parameter pollution
app.use(hpp({
  whitelist: [
    'duration',
    'ratingAverage',
    'ratingsQuantity',
    'price',
    'difficulty',
    'maxGroupSize',
    'durationWeeks'
  ]
}));

// serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));
// creating my own middleware.. positioning of the middleware is important
// if i put this below the get and post request then this middleware would not be used there
// app.use((req, res, next) => {
//   console.log('Hello from my custom middleware...👋');
//   next();
// });

// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use((req, res, next) => {
  console.log(req.requestTime);
  next();
});

// 2. ROUTE HANDLERS

// 3. ROUTES

// app.get("api/v1/tours", getAllTours);
// app.get("/api/v1/tours/:id?", getTour);
// app.post("/api/v1/tours", createTour);
// app.patch("/api/v1/tours/:id", updateTour);
// app.delete("/api/v1/tours/:id", deleteTour);


app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
// in case none of the request endpoints match
// app.all()  this can be used for all http verbs
// app.get()
app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = "fail";
  // err.statusCode = 404;

  // res.status(404).json({
  //   "status": "fail",
  //   "message": `Can't find ${req.originalUrl} on this server!`
  // });
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);
//4. STARTING THE SERVER

module.exports = app;

const path = require('path')
const express = require('express');
const app = express();
const morgan = require('morgan');
const AppError = require('./utilities/appError.js')
const globalErrorHandler = require('./controllers/errorController.js')
const tourRouter = require(`./routes/tourRoutes.js`);
const userRouter = require(`./routes/usersRoutes.js`);
const rateLimit = require('express-rate-limit') // we use this to enable us to create limits on the amount of requests our server receives
const helmet = require('helmet') // we use helmet to set the headers of the req's and res's to enhance the security features of our middleware.
const mongoSanitize = require('express-mongo-sanitize') // we use this to remove all the mongodb code that hackers inject into the body params and query strings.
const xss = require('xss-clean') // we use this to remove all the inserted html/javascript code inserted in the requests made to our server incase hackers try to use inserted html/javascript to hack our site.
const hpp = require('hpp') // stands for hppt parameter pollution and HPP puts array parameters in req.query and/or req.body aside and just selects the last parameter value. You add the middleware and you are done. This is handy if hackers try to cause duplication of properties in the req.params object the api will created an array of these properties and so hpp will only select the last property thus stoping hackers from ruining the app. 
const cookieParser = require('cookie-parser')
const reviewRouter = require('./routes/reviewRoutes.js')
const viewRouter = require('./routes/viewRoutes.js')
const bookingRouter = require('./routes/bookingRoutes.js')

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

// GLOBAL MIDDLEWARES
//serving static file
app.use(express.static(path.join(__dirname, 'public'))); // here we are serving the public folder to the internet

app.use(helmet()) // calling helmet returns a function which when called by the middleware will set the header to the required security settings.

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// creating the object that limits the requests to the API.
const limiter = rateLimit({
  max: 100, // here we are sating that we want to receive 100 requests
  windowsMs: 1 * 60 * 60 * 1000, // and here we are saying that we want to set the time unit to an hour in milliseconds so essentially it works out that only a maximum of 100 requests can be received per hour.
  message: 'Too many requests from this IP'
})

//here we are inserting the limiter object we created into the middleware so that any route that starts with '/api' will use this limiter in its middleware.
app.use('/api', limiter)

// body parser
//here we are telling express that the data it will receive and send will be in json format however we are telling express that the limit of data must be limited to 10kb in the body.
app.use(express.json({limit: '10kb'}));
app.use(express.urlencoded({extended: true, limit: '10kb',})) // We do this line of code because when requests are made to the server from a form the data is 'urlencoded'. Thus here we are enabling our server to accept this type of data that comes from a form request.
app.use(cookieParser())

// data sanitisation against NoSQL query injections (refer to section 10 lecture 'Data sanitisation' - go 1:34 into it)
app.use(mongoSanitize()) // mongoSanitize() returns a function that when called, removes all the '$' and '.' out of all the params, query strings so that hackers cant inject mongodb code into it and make such hacks as jonas explained in section 10 Data sanitisation' - go 1:34 into it.

// data sanitisation against XXS
app.use(xss()) // xss() returns a function that will remove malicious html code with javascript inserted to do malicious things.

//Prevent parameter pollution - lecture 145
app.use(hpp({ // here we are calling hpp() which will return a function that will be called inside the express middleware 
  whitelist: ['duration', 'ratingsQuantity', 'ratingsAve', 'maxGroupSize', 'difficulty', 'price'] // here we are telling hpp to allow for duplication for all these properties in the req.query query string, however all other properties that are duplicated will only have the last property on the end of the query string executed.
}))

//this is used to create a time stamp on the req and res.
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();

  next();
});

// ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter); // the use method finds the req, res, and next parameters and assigns them the the functions inside the tourRouter and userRouter
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter)
app.use('/api/v1/booking', bookingRouter)

app.all('*', (req, res, next) => {

  // const err = new Error(`cant find ${req.originalUrl} on this server oooooh no`)
  // err.status = 'fail'
  // err.statusCode = 404

  // whatever argument we pass into next, express will always assume its an error and so all the other middleware will be skiped up untill the next middleware function thats handling the error function which is the function that has five parameters inside app.use() and the error will be the first parameter of this five parameter function
  next(new AppError(`cant find ${req.originalUrl} on this server oooooh no`, 404))
})

// because we have used four parameters in the below function, express automatically knows its an error handling function
app.use(globalErrorHandler)

module.exports = app;

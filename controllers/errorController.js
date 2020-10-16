const AppError = require('./../utilities/appError.js')

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400)
}

const handleduplicateFieldsDB = err => {
  const value = err.keyValue.name
  const message = `Duplicate field value: ${value}. Please use another value!`
  return new AppError(message, 400)
} 

const handleValidationError = err => {
  const errorS = Object.values(err.errors).map(el => el.message)
  const message = `invalid input data ${errorS.join('. ')}`
  return new AppError(message, 400)
}

const handleJWTErrorExpired = () => new AppError('Your token has expired!. Please login again', 401)

const handleJWTError = () => new AppError('Invalid token. Please log in again', 401) // because of ES6 we dont need to use the return keyword or even use the curly brackets for functions that are on one line. 

const sendErrorDev = (err, req, res) => {
  // API
  if(req.originalUrl.startsWith('/api')) {
  return res.status(err.statusCode).json({
    status: err.status,
    err: err,
    message: err.message,
    stack: err.stack,
  })
} else {
  // RENDERED WEBSITE
  console.log('ERROR', err)
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message
  })
}
}

const sendErrorProd = (err, req, res) => {
  // API 
  if (req.originalUrl.startsWith('/api')) {
  // Operational,  trusted error: send message to client
  if(err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    })
  } 
  //programming or other unknown error: dont leak error details
  else {
    // 1) log error
    console.log('ERROR', err)

    //2) send generic message
    return res.status(500).json({
      status: 'error',
      message: 'something went very wrong :('
    })
  }
}
// RENDERED WEBSITE
  if(err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message
    })
  } 
  //programming or other unknown error: dont leak error details

    // 1) log error
    console.log('ERROR', err)

    //2) send generic message
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: 'Please try again later'
    })
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500
    err.status = err.status || 'error'
  
    if(process.env.NODE_ENV === 'development') { // when we are in development mode we dont need to handle the errors we just need to see them so we can make handlers for them in production.
      sendErrorDev(err, req, res)
    } else if (process.env.NODE_ENV === 'production') { // here we are in production so we want to make a handler for each error as the user encounters them.
      let error = { ...err }
      error.message = err.message // we do this because for some reason on line 92 the message property is lost in the error variable
      if(error.kind === 'ObjectId') error = handleCastErrorDB(error)
      if(error.code === 11000) error = handleduplicateFieldsDB(error)
      //here we are checking if the error object contains the properties erros and ratings average. We cannot just use error.errors.ratingsAve on its own without first checking if error.errors first exists because ratingsAve exists inside the errors object so before checking for ratingsAve we first nee to check to see if its parent object, errors exists.
      //if(error.errors && error.errors.ratingsAve && (error.errors.ratingsAve.kind === "min" || error.errors.ratingsAve.kind === 'max')) error = handleValidationError(error)
      if(error.errors) error = handleValidationError(error)
      if(error.name === "JsonWebTokenError") error = handleJWTError()
      if(error.name === 'TokenExpiredError') error = handleJWTErrorExpired()
      sendErrorProd(error, req, res)
    }
  }
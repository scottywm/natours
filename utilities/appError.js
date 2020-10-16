class AppError extends Error {
    constructor (message, statusCode) {
        super(message)
        this.statusCode = statusCode
        this.status = `${statusCode}`.startsWith('4')? 'fail' : 'error'
        this.isOperational = true
        // here we are telling node that the object we want the stack trace to apply to is 'this' object, but we are telling it to exclude the class function that created it (AppError)
        // All object have a constructor property (not the class constructor function) which when accessed it references the function that created it and that is what we are doing with this.constructor.
        Error.captureStackTrace(this, this.constructor)
    }
}

module.exports = AppError;
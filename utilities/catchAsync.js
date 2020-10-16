catchAsync = fn => {
    return (req, res, next) => {
      fn(req, res, next).catch(err => next(err)) // here we have acces to the "next" function because it was defined in the fn and parent function. The "next" function is created in the parameter of the anonomous function and no where else, from there it can be accessed in the function of using "catch" 
    }
  }

module.exports = catchAsync
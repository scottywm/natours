const Tour = require('../models/tourModels.js')
const User = require('../models/userModel.js')
const Booking = require('../models/bookingModel.js')
const catchAsync = require('../utilities/catchAsync.js')
const AppError = require('./../utilities/appError.js')

exports.getOverview = catchAsync( async (req, res, next) => {
    // 1) Get tour data from collections
    const tours = await Tour.find()

    // 2) Build template
    // 3) Render that template using tour data from 1)
    res.status(200).render('overview', {
      title: 'All Tours',
      tours
    })
  })

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({slug: req.params.slug}).populate({
    path: 'reviews',
    fields: 'review rating user'
  })

  if(!tour) {
    return next(new AppError('There is no tour with that name', 404))
  }
   
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
    })
  })

exports.getMyTours = catchAsync(async(req, res, next) => {
  // 1) find all bookings
  const bookings = await Booking.find({user: req.user.id})

  // 2) find tours with the returned ID's
  const tourIDs = bookings.map(el => el.tour)
  const tours = await Tour.find({_id: {$in: tourIDs}})

  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  })
})

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  })
}

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account'
  })
}

exports.getAccount2 = (req, res) => {
  const user = req.user
  res.status(200).render('account', {user})
}

exports.upDateUserData = catchAsync( async (req, res, next) => {
  const upDatedUser = await User.findByIdAndUpdate(req.user.id, {
    name: req.body.name, // this object here is the data that we are sending and updating in the database
    email: req.body.email
  },
  {
    new: true, // this object here is the options parameter and we are telling the database to return to us the new document after its saved and to also run the validators before saving it to the database.
    runValidators: true
  }
  )

  res.status(200).render('account', {
    title: 'Your account',
    user: upDatedUser
  })
})
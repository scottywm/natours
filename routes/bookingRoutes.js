const express = require('express')
const bookingControllers = require('./../controllers/bookingController.js')
const authController = require('./../controllers/authController.js')

const router = express.Router()

router.use(authController.protect)

router.get('/checkout-session/:tourID', bookingControllers.getCheckOutSessions)

router
    .route('/')
    .get(bookingControllers.getAllBookings)
    .post(bookingControllers.createBooking)

router
    .route('/:id')
    .get(bookingControllers.getBooking)
    .patch(bookingControllers.updateBooking)
    .delete(bookingControllers.deleteBooking)
    
module.exports = router
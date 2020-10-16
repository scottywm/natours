const express = require('express')
const viewsControllers = require('../controllers/viewsController.js')
const authControllers = require('../controllers/authController.js')
const bookingController = require('../controllers/bookingController.js')

router = express.Router()

router.get('/', bookingController.createBookingCheckout, authControllers.isLoggedIn, viewsControllers.getOverview)
router.get('/tour/:slug', authControllers.isLoggedIn, viewsControllers.getTour )
router.get('/login', authControllers.isLoggedIn, viewsControllers.getLoginForm)
router.get('/me/:token', authControllers.verify, viewsControllers.getAccount2)
router.get('/me', authControllers.protect, viewsControllers.getAccount)
router.get('/my-tours', authControllers.protect, viewsControllers.getMyTours)
router.post('/submit-user-data', authControllers.protect, viewsControllers.upDateUserData)

module.exports = router
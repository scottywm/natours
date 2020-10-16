const express = require('express')
const reviewControllers = require('./../controllers/reviewControllers.js')
const authController = require('./../controllers/authController.js')

// Because we are also using this route in the tourRoutes on line 29 we need to use the code below because whenever you use a router with another router in express you haave to tell express somehow that you want to use the other routers route and so you do this by using the code below.
const router = express.Router({ mergeParams: true }) // on line 29 we tell tourTouter that if the request is comming from '/:tourId/reviews', it must use the reviewRouter, however reviewRouter does not have access to this route '/:tourId/reviews'. Thus we need to tell express to merge the params of line 29 to enable it to work because the function createReview uses the params property.
//the router will also still work as per on line 59 in the app.js file.

router
    .use(authController.protect)

router
    .route('/')
    .get(reviewControllers.getAllReviews)
    .post(authController.restrictTo('user'),
        reviewControllers.setTourUsersId,
        reviewControllers.createReview)

router
     .route('/:id')
     .get(reviewControllers.getReview)
     .patch(authController.restrictTo('user', 'admin'),
        reviewControllers.updateReview)
     .delete(authController.restrictTo('user', 'admin'), reviewControllers.deleteReview)

module.exports = router
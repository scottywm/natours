const express = require('express');
const tourRouter = express.Router();
const fs = require('fs');
const tourController = require(`${__dirname}/../controllers/tourControllers`);
const authController = require('./../controllers/authController.js')
const reviewRouter = require('./reviewRoutes.js')

// tourRouter.param("id", tourController.checkID)

tourRouter.route('/tour-stats')
  .get(tourController.getTourStats);

tourRouter
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin)

tourRouter.route('/monthly-plan/:year')
  .get(authController.protect, 
    authController.restrictTo('admin', 'lead-guid', 'guide'),
    tourController.getMonthlyPlan);

tourRouter
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

tourRouter
  .route('/distances/:latlng/unit/:unit')
  .get(tourController.getDistances)

tourRouter
  .route('/')
  .get(tourController.getAllTours) // before the getAllTours is called the protect function is first called and it will first check if the users is logged in before the getAllTours function is called.
  .post(authController.protect, 
    authController.restrictTo('admin', 'lead-guide'), 
    tourController.createTour);

tourRouter
  .route('/:id')
  .get(tourController.getTour)
  .patch(authController.protect, 
    authController.restrictTo('admin', 'lead-guid'),
    tourController.upLoadTourPhoto,
    tourController.resizeTourPhoto,
    tourController.upDate)
  .delete(authController.protect, 
    authController.restrictTo('admin', 'lead-guid'), 
    tourController.deleteTour);

tourRouter.use('/:tourId/reviews', reviewRouter) // here we are telling the tourRouter to use the reviewsRouter if a request comes in from '/:tourId/reviews'

module.exports = tourRouter;

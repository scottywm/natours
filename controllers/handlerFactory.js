const catchAsync = require('../utilities/catchAsync.js')
const AppError = require("../utilities/appError")
const APIFeatures = require('./../utilities/APIfeatures.js')

exports.deleteOne = Model => catchAsync(async (req, res, next) => {

    const doc = await Model.findByIdAndDelete(req.params.id)

    if(!doc) {
        return next( new AppError('No document found of that ID', 404))
    }

    res.status(204).json({
        status: 'success',
        data: null
    })
})

exports.updateOne = Model => catchAsync(async (req, res, next) => {

    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true /* we are telling mongo to return to the client the updated new document instead of the original */,
      runValidators: true /* By setting this to true we are telling mongoose that it must apply the validators we set up in the schema when we update a document */,
    });

    if (!doc) {
      return next(new AppError('no document found with that ID', 404)) // the id given to the Tour.findByIdAndUpdate() method might be a valif id but not in the database, so it will not throw an error but instead it will return nul. Therefore we need to test if the tour variable is nul (nul converts to false in javascript) and if its nul, we generate and error and give it to the "next" function to put it in the global error handling middleware which is the function in the app.js file that has 4 parameters and the error will be the first one.
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      },
    });
});

exports.createOne = Model => catchAsync(async (req, res, next) => {
    //   let newTour = new Tour(req.body); /* This will create a new tour and save it to the data base with mongodb atlas */
    //   newTour.save(); this saves the new tour to the mongodb

    /*This is the quicker way of doing the same thing as above that I blacked out*/
    const doc = await Model.create(req.body);
  
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

  exports.getOne = (Model, populateOptions) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id)
    
    if(populateOptions) query = query.populate(populateOptions) // populate('reviews'), we are telling mongoose to populate the virtual property "reviews" as we set up the virtual property for the reviews in the tourModel on line 144.
    
    const doc = await query // here we are actually sending off the query and when the result comes back down there's a then method automatically built into the await and it makes the query return the results to the variable we ssigned to it.

    if (!doc) {
      return next(new AppError('no document found with that ID', 404))
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      },
    });
});

exports.getAll = Model => catchAsync(async (req, res, next) => {
  let filter = {}
  if(req.params.tourId) filter = { tour: req.params.tourId }
  
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .fieldLimiting()
      .paginate();

    // with mongoose the query is only executed if we use await as shown below. After the query is sent off the await will make the line of code await untill the promise comes back and there is a built in then() function inside the promise when it comes back which automatically is initiated and returns the data.
    // without the await the query would not be sent off and nothing would happen. This is only with mongoose.
    const doc = await features.query
    //const doc = await features.query.explain() using the explain() method enables us to see the details about the query in the returned object from the query, in our case the "doc" variable.

    //send response
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc,
      },
    });
});
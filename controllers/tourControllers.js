const Tour = require('./../models/tourModels.js');
const catchAsync = require('./../utilities/catchAsync.js');
const factory = require('./handlerFactory.js');
const AppError = require('../utilities/appError.js');
const sharp = require('sharp') // we are going to use sharp to resize images
const multer = require('multer') // We use this to upload and store images to the server (note the database)

const multerStorage = multer.memoryStorage() // Here we are preparing the object for line 29

const multerFilter = (req, file, cb) => { // this functions checks if the file is an image or not
  if (file.mimetype.startsWith('image')) {
    cb(null, true)
  } else {
    cb(new appError('Not an image. Please upload an image !'), false)
  }
}

const upload = multer({
  storage: multerStorage, // here we are making it such that the image is saved in the memory where it is further manipulated
  fileFilter: multerFilter // here we are creating a filter such that only images are used.
})

const filterObj = (obj, ...allowedFields) => {
  let newObj = {}
  Object.keys(obj).forEach(el => {
    if(allowedFields.includes(el)) newObj[el] = obj[el]
  })
  return newObj
}

exports.resizeTourPhoto = catchAsync(async(req, res, next) => {
  console.log(req.files)

  if (!req.files.imageCover || !req.files.images) return next()

  // 1) Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpg`

  await sharp(req.files.imageCover[0].buffer) // By calling the sharp function on the 'req.file.buffer' object we can then access the image that is stored in the computers memory by chaining multiple methods to work on the buffer image.
    .resize(2000, 1333) 
    .toFormat('jpg')
    .jpeg({quality: 90})
    .toFile(`public/img/tours/${req.body.imageCover}`)

  // 2) images
  req.body.images = []

  await Promise.all(
    req.files.images.map(async (file, index) => {
    const fileName = `tour-${req.params.id}-${Date.now()}-${index + 1}-jpg`

    await sharp(file.buffer) // By calling the sharp function on the 'req.file.buffer' object we can then access the image that is stored in the computers memory by chaining multiple methods to work on the buffer image.
    .resize(2000, 1333)
    .toFormat('jpg')
    .jpeg({quality: 90})
    .toFile(`public/img/tours/${fileName}`)

    req.body.images.push(fileName)
    })
  )

  next()
})

exports.upLoadTourPhoto = upload.fields([ // here multer creates a files object and inserts it inside the req with the 'imageCover' and 'images' properties from the body, however multer has already converted the values of these two keys into file objects which re inside arrays. 
  {name: 'imageCover', maxCount: 1}, // here we are instructing multer to convert only one image in the property imageCover in the request to a file object 
  {name: 'images', maxCount: 3} // here we are telling multer to convert 3 images in the images property in the request to an array of file objects
])

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAve,price';
  req.query.fields = 'name,price,ratingsAve,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour)
exports.getTour = factory.getOne(Tour, { path: 'reviews' })
exports.createTour = factory.createOne(Tour)
exports.upDate = factory.updateOne(Tour)
exports.deleteTour = factory.deleteOne(Tour)

exports.getTourStats = catchAsync(async (req, res, next) => {
    // the aggregate method sends out a request. its parameters are an array of objects which do certain things to each document in the mongodb. Here we get all the documents that have a aveRating of 4.5 or greater and then we apply the grouping operater to these documents which returns a object with values we requested in the groping operater, if we specify more objects in the aggregate array then theses documents move into this object to be processed according to the instructions within it as well.
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAve: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: {
            $toUpper: '$difficulty',
          } /* the _id property enables us to set an identifier by which each returned object willl be based on and the rest of the properties we create*/,
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAve' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: stats,
    });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
      {
        $unwind:
          '$startDates' /* there is an array of start dates inside the startDates property with mongodb, we want to create a seperate tour object for each date so we use the $unwind operator */,
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numOfTourStarts: { $sum: 1 },
          tours: {
            $push: '$name',
          } /* using the $push operator we create an array and we are pushing the name field into it */,
        },
      },
      {
        //here we are creating a property called month and giving it a field value to the _id property
        $addFields: { month: '$_id' },
      },
      {
        //here we are using the project operator to set the field of the _id property to zero, this hides it.
        $project: {
          _id: 0,
        },
      },
      {
        $sort: { numOfTourStarts: -1 },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params
  const [lat, lng] = latlng.split(',')
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1 // MongoDB requires the distance in radians and so we get radians by dividing the distance by the radius of the earth

  if(!lat || !lng) {
    next(
      next(new AppError('Please provide latitude and longitude in the format lat,lng.', 400))
    )
  }

  const tours = await Tour.find({startLocation: {$geoWithin: {$centerSphere: [[lng, lat], radius]}}})

  res.status(200).json({
    status: 'success',
    length: tours.length,
    data: {
      data: tours
    }
  })
})

exports.getDistances = catchAsync( async (req, res, next) => {
  const { latlng, unit } = req.params
  const [lat, lng] = latlng.split(',')

  const multiplier = unit === 'mi' ? .000621371 : 0.001
  
  if(!lat || !lng) {
    next(
      next(new AppError('Please provide latitude and longitude in the format lat,lng.', 400))
    )
  }

    const distance = await Tour.aggregate([ // With geospacial aggregation there is only one single stage which is exists and its called geoNear and geoNear must also be the first stage when doing aggregation with geospacial data. GeoNear also requires that at least one of the fields has a geospacial index set on it which we have already done on line 143 in tourModel.js. If there are multiple index's established for multiples fields than you must use keys to establish the field that you want to use for calculations. However on line 143 in tourModels.js we have already established an index on one field, so that index will be used on all the fields that we use in our calculations.
      {
        $geoNear: { // here we are telling mongoose to get all the documents in the Tour databse and 
          near: { // to find the distance near a given point as we use the near property.
            type: 'Point', // the near propert must be of the type point.
            coordinates: [lng * 1, lat * 1] // the near property is to find the distance near these coordinates. 
          },
          distanceField: 'distance', // This is the name of the distance field that all of the calculations of the distances will be stored in.
          distanceMultiplier: multiplier // this number gets multiplied by the distance to convert it into kilometers.
        }
      },
      {
        $project:  { // Here we are telling mongoose that off all the documents found, we only want the distance and name property.
          distance: 1, // 
          name: 1
        }
      }
    ])

    res.status(200).json({
      status: 'success',
      length: distance.length,
      data: {
        data: distance
      }
    })
})
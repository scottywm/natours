const User = require('./../models/userModel.js');
const catchAsync = require('./../utilities/catchAsync.js');
const appError = require('./../utilities/appError.js')
const factory = require('./handlerFactory.js')
const sharp = require('sharp') // we are going to use sharp to resize images
const multer = require('multer') // We use this to upload and store images to the server (note the database)

//const multerStorage = multer.diskStorage({ // here we are accessing the diskStorage to instruct were we want to store the phots and what to name them
//  destination: (req, file, cb) => { // this property usese a function that give us access to the req object in express, the file object (the file object is located inside the req, req.file) is created from sending a file to the server from a form ( which contains multipart form data, this can be achieved by inserting the following code in the form tage; enctype="multipart/form-data") and the call back function (cb)
//    cb(null, 'public/img/users') // inside the cb function the first paramenter is the error object which occurs if there is an error but since we are setting it to null we are not using it (i guess) the second parameter 'public/img/users' is where the picture be stored.
//  },
//  filename: (req, file, cb) => { // this property gives us a function thats first parameter is the req object from express, the file object which is created from sending a file to the server and a call back function cb.
//    const ext = file.mimetype.split('/')[1]
//    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`) // this property relates to the filename and gives us a call back function has access to the error object but we set it to null (i guess) and the second parameter is the name we are giving the file.
//  }
//})

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

exports.upLoadUserPhoto = upload.single('photo') // we created the upload object on line 24. We set the parameter to 'photo' because that is the name of the field in the form that submitted the data to us and the form should be 'multipart form-data' which you can make the form this way by ensuring that  the forms tag contains the detail, enctype="multipart/form-data", inside the form tag inorder for it to work.
// the upload.single() function creates a file object and inserts it inside the req. Inside this "file" object is all the data that is in the form that was submitted. Using this "file" object from the form we can now use it in our middleware. 
// the upload.single() function also saves the image to the computers memory so we can manipulate it in our middleware.

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not defined. Please use sign up instead',
  });
};

exports.getMe = (req, res, next) => {
  //if(!req.params && !req.params.id) {
    req.params.id = req.user.id
  //} else {
   // const token = req.params.token


 // }
  
  next()
}

exports.updateMe = catchAsync(async (req, res, next) => {

  // 1) create error if users posts password data
  if(req.body.password || req.body.passwordConfirm) {
    return next(
      new appError('This route is not for password updates. Please use /updateMyPassword', 400)
    )
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated.
  const filteredBody = filterObj(req.body, 'name', 'email')
  if(req.file) filteredBody.photo = req.file.filename
  // 3) Update user document
  // The findByIdAndUpdate method is taking 3 parameters. The first is the infor thats used to retreave the document from the database, the second is and object with all the info that is to be updated and the third is the option object.

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { // here we dont use the save() method because we dont want the validators or presave middleware to execute.
    new: true,
    runValidators: true
  })

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  })

})

// We need to make the photo a set size and a square shape so that all photos uploaded will scale the right way.
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if(!req.file) return next()

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpg`

  await sharp(req.file.buffer) // By calling the sharp function on the 'req.file.buffer' object we can then access the image that is stored in the computers memory by chaining multiple methods to work on the buffer image.
    .resize(500, 500) 
    .toFormat('jpg')
    .jpeg({quality: 90})
    .toFile(`public/img/users/${req.file.filename}`)

  next()
})

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, {active: false})

  res.status(204).json({
    status: "success",
    data: null
  })
})

exports.getAllUsers = factory.getAll(User)
exports.getUser = factory.getOne(User)

// do not update passwords with this!
exports.updateUser = factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User)

const express = require("express")
const userRouter = express.Router()
const userControllers = require(`${__dirname}/../controllers/userControllers`)
const authControllers = require(`${__dirname}/../controllers/authController`)

userRouter.post('/signup', authControllers.signUp) // setting up the route can be done in two ways, this is one way
// userRouter.post('/signup', authControllers.signUp, authControllers.verify)
userRouter.post('/login', authControllers.login)
userRouter.get('/logout', authControllers.logOut)

userRouter                                        
    .route('/forgotPassword')
    .post(authControllers.forgotPassword)

userRouter
    .route('/resetPassword/:token')
    .patch(authControllers.resetPassword)

// userRouter
//     .route('/resetPassword')
//     .post(authControllers.resetPassword)

//userRouter // Because express works in order that that code is written on the document, express will call this protect function after this line of code and so it performs the necessary verifications on the user before any of the other code is executed. This saves us the trouble of having to insert the protect function into each of the paths below.
    //.use(authControllers.protect) 

userRouter
    .route('/updateMyPassword')
    .patch(authControllers.protect, authControllers.updatePassword)

userRouter
    .route('/updateMe')
    .patch(authControllers.protect, userControllers.upLoadUserPhoto, 
        userControllers.resizeUserPhoto, 
        userControllers.updateMe)

userRouter
    .route('/me')
    .get(
        authControllers.protect,
        userControllers.getMe, 
        userControllers.getUser)

userRouter
    .route('/deleteMe')
    .delete(authControllers.protect, userControllers.deleteMe)

// userRouter
//     .use(authControllers.restrictTo('admin'))

userRouter
    .route("/")
    .get(authControllers.protect, authControllers.restrictTo('admin'), userControllers.getAllUsers)
    .post(authControllers.protect, authControllers.restrictTo('admin'), userControllers.createUser)

userRouter
    .route("/:id")
    .get(authControllers.protect, authControllers.restrictTo('admin'), userControllers.getUser)
    .patch(authControllers.protect, authControllers.restrictTo('admin'), userControllers.updateUser)
    .delete(authControllers.protect, authControllers.restrictTo('admin'), userControllers.deleteUser)

module.exports = userRouter
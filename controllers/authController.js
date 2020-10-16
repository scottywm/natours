const crypto = require('crypto')
const {promisify} = require('util')
const User = require('./../models/userModel.js')
const jwt = require('jsonwebtoken')
const catchAsync = require('./../utilities/catchAsync.js')
const appError = require('./../utilities/appError.js')
const AppError = require('./../utilities/appError.js')
const Email = require('./../utilities/email.js')
const { nextTick } = require('process')
const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000), // The new Date() class returns a date object which looks like a string but is not. There are four ways to use the new Date() class, new Date(year, month, day, hours, minutes, seconds, milliseconds), new Date(milliseconds), new Date(date string). Also take note that inside the cookie options we are telling the clients browser that in 90 days the browser is to remove the token.
    //secure: true, 
    httpOnly: true // this limits the clients browser to only receive the cookide and send it. The browser will not be able to make changes to it.
}

if(process.env.NODE_ENV === 'production') cookieOptions.secure = true // this means that the cookie will only be send on an incrypted connection (https)

// the reason why we use the id of the user to generate the token is so later when we use jwt.verify, it will decode the token and give us this information again so we can use it
// this generates the token. We created the secret key in the env document and the payload data is generated from 
const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });
  };

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id)

// Here we are accessing the cookie method so send the token to the clients browser. In the first parameter we are naming the token, in the second we are sending it and in the third parameter we are sending the options object. 
// It also needs to be noted that whenever a new cookie is sent to the clients browser from this app, the old one will be overwritten because they have the same name.    
res.cookie('jwt', token, cookieOptions) // By doing this we are storing the token inside the browser and when a request comes from that browser, the token can be accessed via the path req.headers.authorization

// here we are removing the password from the output
    user.password = undefined

    res.status(statusCode).json({
        status: 'success',
        token, // if the key name and value variable are the same you dont need to enter "token: token,".
        data: {
            user: user
        }
    })
}

exports.signUp = catchAsync(async (req, res, next) => {
    const newUser = await User.create({ // This creates a new document in the mongodb data base but it also returns the new users document that it saved to the database as an object to the newUser variable. Because it has returned only a copy of what it saved to the database the schema validators and selectors have not worked on it so some properties will still be in the object that the schema would normally not allow to come through such as password. 
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        role: req.body.role
    })

    // const url = `${req.protocol}://${req.get('host')}/me`
    
    // new Email(newUser, url).sendWelcome()

    // createSendToken(newUser, 201, res)

    try {
        const token = newUser.verifyEmailAddress()
        await newUser.save({ validateBeforeSave: false })
    
        res.status(200).json({
            status: 'success',
            token, // if the key name and value variable are the same you dont need to enter "token: token,".
            data: {
                user: newUser
            }
        })

        const url = `${req.protocol}://${req.get('host')}/me/${token}`
        new Email(newUser, url).sendVerify()

    } catch (err) {console.log(err)}


})

exports.login = catchAsync(async (req, res, next) => {
    const {email, password} = req.body

    // 1) check if email and password exist
    if(!email || !password) {
       return next(new appError('Please provide us with an email address and a password for it', 400)) //we use return to end the function
    }

    // 2) check if users exists and if password is correct
    const user = await User.findOne({email}).select('+password') // we could have used User.findOne({email: email}) but ES6 has enabled us to abbrieviate it as we did. Using the select('+password') we are telling mongoose to include the password in the data it retreives from the database.
    // we move this below line of code into the if statement on line 41 
    //const correct = await user.correctPassword(password, user.password)  we are abble to access this correctPassword function because we created it on line 52 in the userModel.js file and it is given back to us in the document that the model returns to us. Bassically the function is created in the schema, it is then given to the model and from the model it enables all documents that it returns to contain the function correctPassword.

    if( !user || !await user.correctPassword(password, user.password)) {
       return next(new AppError('Incorrect email or password', 401))
    }

    // 3) if everything is ok, send token to client
    createSendToken(user, 200, res)
})

exports.logOut = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    })
    res.status(200).json({ status: 'success' })
}

exports.protect = catchAsync(async (req, res, next) => {
   
    let token;
    // 1) getting the token and checking if its there
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) { // we must first check req.headers.authorization, because if there isnt, then req.headers.authorization.startsWith('Bearer') will crash the app as req.headers.authorization would be undefined and node cannot check to see if undefined starts with anything so the app will crash.
        token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt
    }

    if (!token) {
        return next(new appError('You are not logged in', 401)) // using return is important because it stops the code from running further.
    }
    // 2) verification token
    // This is what the verify function actually looks like but we are going to convert it into a promise.
    //jwt.verify(token, process.env.JWT_SECRET)
   
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET) // if the token is not valid for whatever reason, an error occurs and is thrown from this line of code and straight into the middleware error handling function with the four parameters because we have wrapped this into the catchAsync function.One this error is thrown, express stops right at this line of code and skips all the other code in the app until it comes to the global error handling function with the four parameters. If the token is valid then an object is created with some details about the document and token.

    // 3) check if user still exists
    const currentUser = await User.findById(decoded.id)
    if(!currentUser) {
        return next(new appError('The user for this token nolonger exists', 401))
    }
    // 4) check if user changed the password after the token was issued
    if(currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new appError('user changed the password, please login again', 401))
    }

    // here we are creating a property inside the req object and calling it user and assigning it to the currentUser object because up to this point the user is verified and absolutely permitted to acces any page on the website. We have added this user property to the request object because this req object is in the express middle ware and will be passed to other middlewares so it will be very convenient to be able to acces it in other middlewares.
    req.user = currentUser
    res.locals.user = currentUser // This stores the variable "user" in the front end of the website and can be accessed in the html templates like pug and ejs ect.
    // When the next() function is called we are enabling express to then call the next function in the middleware which is the getAllTours function
    next()
})

// Only for rendered pages and there will be no errors
exports.isLoggedIn = async (req, res, next) => {
    try {
    if (req.cookies.jwt) {
    // 1) verify token
    const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET) // if the token is not valid for whatever reason, an error is created.

    // 2) check if user still exists
    const currentUser = await User.findById(decoded.id)
    if(!currentUser) {
        return next()
    }
    // 3) check if user changed the password after the token was issued
    if(currentUser.changedPasswordAfter(decoded.iat)) {
        return next()
    }

    // THERE IS A LOGGED IN USER
    res.locals.user = currentUser // This stores the variable "user" in the front end of the website and can be accessed in the html templates like pug and ejs ect.
    // When the next() function is called we are enabling express to then call the next function in the middleware
    return next()
}
next()
    } catch(err){
        return next()
    }
}

exports.restrictTo = (...roles) => { // The rest parameter syntax allows us to represent an indefinite number of function arguments as an array.
    return (req, res, next) => {
        if(!roles.includes(req.user.role)) {
            return next(
                new appError('you do not have permission to perform this task', 403)
            )
        }
        next()
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) get user based on posted email
    const user = await User.findOne({email: req.body.email})

    if(!user) {
        return next( 
            new appError('No users exists with that email address', 404)
         )
    }
    // 2) generate the random token
    const resetToken = user.createPasswordResetToken()

    //await user.save({ validateBeforeSave: false }) // this will deactivate all the validators in our schema
    await user.save({ validateBeforeSave: false }) // the save() method will update the document if its already present in the database. Thus the existing properties that are already in the document will remain but the new properties in the user object will be added in. The only was the save method can add a new document into the database is if it didnt already exist there.
    // 3) send it to users email

    try {
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

        await new Email(user, resetURL).sendPasswordReset()
    
        res.status(200).json({
            status: 'success',
            message: 'token sent to users email'
        })
    } catch (err) { // if there is an error we must reset these properties since the token and its expiry date have no use at this point and we need to update the data base as these properties were originally added and since an error has occured we need to update them by saving the updated user object to the database.
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save({ validateBeforeSave: false }) // here we are turning off the validators so we can just update the database.

        return next(
            new appError('there was an error sending the email please try later', 500)
        )
    }
})

exports.resetPassword = catchAsync( async (req, res, next) => { // here we are taking the token that commes in the request and we encrypt it
    // 1) get the user based on the token
    const hashedToken = crypto
        .createHash('sha256')   
        .update(req.params.token)
        .digest('hex')

    const user = await User
    .findOne({passwordResetToken: hashedToken, passwordRestExpires: {$gt: Date.now()}}) // here we send off a query to the database and retreive the user document with the same encrypted code and a user that has the property passwordResetExpires greater than now.
    // 2) If the token has not expired and there is a user, set the new password
    if (!user) {
        return next(
            new appError('Token is invalid or has expired', 400)
        )
    }
// here we reset the user properties to the values that the person has given us via their request for up to this point we now know that the person is the user we have in our database and then we use the save() method on the user object as it updates the properties in the database.
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetToken = undefined // We reset these two because these two are only used the moment the user gets a reset token to reset their password, as soon as we save their new password to the database we dont need these two anymore so we set it back to undefined.
    user.passwordRestExpires = undefined
    await user.save() // here we are updating the database and we dont use the method in this way user.save({ validateBeforeSave: false }), because we want the validators to work, for example we want the validators to check if password is the same as password confirm ect. Also its important to note that we are using save() not any other form of updating method because save() will run the validators and the presave middleware functions but the other update methods (that we used in tours for example) wont.

    // 3) Update changedpasswordAt property for the user

    // 4) Log the user in, send JWT
    createSendToken(user, 200, res)
})

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) get user from the collection
    const user = await User.findById(req.user.id).select('+password')
    // 2) Check if posted password is correct

    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(
            new appError('your password is incorrect', 401)
        )
    }
    // 3) If so, update the password
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    await user.save() // We must use the save() method to update the document in the database because if we used findByIdAndUpdate, the validators in userModel.js line 35 would not work because mongdb does not keep the document object inside findByIdAnUpdate so the 'this' keyword would not be pointing to the current document so the password would not be compared to the passwordConfirm property and the presave middleware wouldnt be executed because the presave middleware only runs when a new document is being created or a new one is being saved to the databse.
    // 4) Log user in and send JWT
    createSendToken(user, 200, res)
})

exports.verify = catchAsync(async (req, res, next) => {
        // 1) get the user based on the token
        
    const hashedToken = crypto
        .createHash('sha256')   
        .update(req.params.token)
        .digest('hex')

    const user = await User.findOne({verifyToken: hashedToken, verifyTokenExpires: {$gt: Date.now()}}) // here we send off a query to the database and retreive the user document with the same encrypted code and a user that has the property passwordResetExpires greater than now.
    // 2) If the token has not expired and there is a user, set the new password
    if (!user) {
        return next(
            new appError('Token is invalid or has expired', 400)
        )
    }

    req.user = user
    const token = signToken(user._id)
    res.cookie('jwt', token, cookieOptions)
    user.password = undefined
    next()
})
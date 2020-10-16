const crypto = require('crypto')
const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A name is necessary']
    },
    email: {
        type: String,
        required: [true, 'An email is required'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: {
        type: String,
        default: 'default.jpeg'
    },
    role: {
        type: String,
        enum: ['user', 'guid', 'lead-guid', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false // this makes it such that the password does not get sent out from the database
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            //this only works on CREATE and SAVE methods when they are called.
            validator: function (el) {
                return el === this.password // if passwordConfirm is equal to password, then return true. The validator module we imported only returns true or false.
            },
            message: 'Passwords are not the same'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordRestExpires: Date,
    passwordVerifyToken: String,
    verifyTokenExpires: Date,
    verifyToken: String,
    active: {                               // This is so when a user wants to delete their profile here we set the active property to false. Thus the user is still in the database only their profile will be inactive.
        type: Boolean,
        default: true,
        select: false
    },
    verified: {
        type: Boolean,
        default: false,
    }
})

//This pre-middleware occurs only when creating a new document with a POST request or changing an existing documents password property with a PATCH request by using the save() method on the users document exclusivly. doc.save() as done in authControllers.js on line 207.
userSchema.pre('save', async function(next){

    //only run this function is the password is actually modified
    if (!this.isModified('password')) return next() //n.b: this refers to the current document and isModified means if the document is being changed or is a new documnet being created. If the user is not changing their password then we return the calling of the next() function to enable the next middleware to run. 
    
    //Hash the password with a cost of 12
    this.password  = await bcrypt.hash(this.password, 12) // here we are reassining our password to the encrypted version and are sellecting a "cost" parameter of 12 as this measure determines how intensive the cpu process will be. The higher this number the more secure the encrypted password. Also, the hash method is an asyncronous method
    //this.passwordChangedAt = new Date()
    //delete passwordConfirm field

    this.passwordConfirm = undefined // here we are resetting passwordConfirm to undefined because it does not get saved to our database instead it is used between when the document is created and before saving it to the database.
    next()
})

userSchema.pre('save', function(next) { // this points to the object to be saved.
    if(!this.isModified('password') || this.isNew) return next() // this function must only run if the document has had its password changed and is an existing document in the database.

    this.passwordChangedAt = Date.now() - 1000 // on line 171 in authController.js it takes alot of time for the document to get saved into the data base sometimes the JWTTimestamp happens before this line of code is executed on mongodbs end so we deduct 1000 milliseconds off from it to make certain that the JWTTimestamp is always created after the passwordChangedAt. This is because the save() method is a promise that sends off the request to the database with the presave middleware and as soon as the save() request is executed on our document the code below it will run imediately. Thus because it takes some time for mongodb to execute this save() promise and its presave middleware on its end, sometimes the code inside the presave middleware is executed after the token (const token = signToken(user._id)) is executed on our document and in this case the JWTTimestamp will be created before the passwordChangedAt property is created on the database.
    next()
})

userSchema.pre(/^find/, function (next) {
    // this points to the current query
    this.find({active: {$ne: false}}) // here we are using the find() method which exists inside all queries that begin with find (/^find/). Its purpose is to tell the queries to only look for users who have their active set to true. This find method exists inside the find() query that is called in the user controller on line 14.
    next()
})

// Here we are creating a function called correctPassword and it is being inserted as a property in the methods object which exists inside the userSchema. This function is transfered from the schema to the model and from the model to all the documents that are returned and this is how we use it in our authControllers
userSchema.methods.correctPassword = async (candidatePassword, userPassword) => {
    return await bcrypt.compare(candidatePassword, userPassword)
}

// Whenever a user logs in or signs up, a JWT token is created and used in the users browser to do things that are protected. If a thief was to steal the users token somehow (usually if this happens the user would have changed his password), he might try to use it to get into the users profile and make changes so to overcome this we compare the time the JWT token was created compared to when the user changed his password. If the time stamp of the users password change is greater than that of the JWT tokens time stamp then we know that the user has already changed his password and therefore this particular token is not going to work in making changes to the users profile.
// Basically we deem the token to be legit if the time stamp of the JWT token is greater than that of the passwordChangedAt property, if its not then we make the token redundant.
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    // JWTTimestamp is the moment in time that the token was created and this.passwordChangedAt is when the password was changed
    if(this.passwordChangedAt) { //this points to the current document which is the object of user data and we must use a regular function not an arrow function
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10) // The getTime() method is used on a date object (like this 2020-07-20T00:00:00.000Z) and returns the number of milliseconds* since the Unix Epoch which was the 1st january 1970. The parseInt function converts the result of the getTime function to an integer and the base of 10 is called the radix parameter and it means that in the argument given to the parseInt function, the number is going to be parsed from a number system that only has numbers from 0-9. The radix parameter is used to specify which numeral system to be used, for example, a radix of 16 (hexadecimal) indicates that the number in the string should be parsed from a hexadecimal number to a decimal number.
    
        return JWTTimestamp < changedTimeStamp
    }

    return false
}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex')
    
    this.passwordResetToken = crypto // N.B: this is pointing at the current document object. here we are creating the passwordResetToken and setting it to the encrypted version of the reset token. sha256 is the alogrhthm used to encrypt the token, update(resetToken) is how we tell the crypto object what to encrypt and digest hex we are telling the crypto object to use the hexodecimal number system.
    .createHash('sha256')
    .update(resetToken)
    .digest('hex') 

    //console.log({resetToken}, this.passwordResetToken)
    this.passwordRestExpires = Date.now() + 10 * 60 * 1000 // here we are creating a property in the document object and getting the date now in milliseconds and adding 10 minutes to it.

    return resetToken
}

userSchema.methods.verifyEmailAddress = function () {
    const verifyToken = crypto.randomBytes(32).toString('hex')
    
    this.verifyToken = crypto // N.B: this is pointing at the current document object. here we are creating the passwordResetToken and setting it to the encrypted version of the reset token. sha256 is the alogrhthm used to encrypt the token, update(resetToken) is how we tell the crypto object what to encrypt and digest hex we are telling the crypto object to use the hexodecimal number system.
    .createHash('sha256')
    .update(verifyToken)
    .digest('hex') 

    //console.log({resetToken}, this.passwordResetToken)
    this.verifyTokenExpires = Date.now() + 10 * 60 * 1000 // here we are creating a property in the document object and getting the date now in milliseconds and adding 10 minutes to it.

    return verifyToken
}

const User = mongoose.model('User', userSchema) // Mongoose will automatically plurarize the model name "User" to users as a collection in the database when the first document is created in the database

module.exports = User
const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema({
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Booking must belong to a Tour']

    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Booking must belong to a user']

    },
    price: {
        type: Number,
        required: [true, 'Booking must have a price']
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    paid: {
        type: Boolean,
        default: true
    }
})

bookingSchema.pre(/^find/, function (next) {
    this.populate('user').populate({ // this is pointing to the query and just before the query is sent we are telling the query to populate the user field with the entire user document from the database. This is achieved as mongoose uses the user property in the booking document to find the actual user document and then inserts this document into the user field in the returned document. 
        path: 'tour', //  As for this second 'populate' method, we are telling mongoose just before the query is sent off that is must use the 'tour' property in the booking database to find the actual 'tour' document from the database and then only select the 'name' property from this document and inserts this data into the 'tour' property on the returned booking document. 
        select: 'name'
    })

    next()
})

const Booking = mongoose.model('Booking', bookingSchema) // Mongoose will automatically plurarize the model name "Booking" to bookings as a collection in the database

module.exports = Booking
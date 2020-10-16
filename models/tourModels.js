const mongoose = require('mongoose');
const slugify = require('slugify');
const { getRounds } = require('bcryptjs');
//const validator = require('validator');
// const User = require('./userModel.js') we only need this if we are embedding the user document inside the tour document but since we are going to use reference instead of embedding.

/* Inorder to create read update and delete from the database we need a mongoose model which is a "model" to create documents in the same way classes are used to create objects, but inorder to create a model we need a schema. A schema is the settings that the model will use to retreve the data from mongodb when we use the model to request it. It is also the template for sending the data to the mongodb when we send it and if the property is not included in the schema it will not be added into the mogodb data base and it can not be added into it via the mongoose middleware. */
const tourSchema = new mongoose.Schema(
  {
    slug: String /* this is a property that must be added in to use the slugify middleware, Whe the middles ware function is called, it will insert the documents name for the value of this key "slug" */,
    name: {
      type: String,
      required: [true, 'The Tours Must Have A Name'], // this is a validator
      unique: true,
      trim: true,
      maxlength: [40, 'The string must have a maximum of 40 characters'], // this validator setting is only for strings
      minlength: [10, 'The string must have at least 10 character'],
      //validate: [validator.isAlpha, 'tour name must only contain characters'], we got validator.isAlpha from a validator libray and we could have put this in an object like on line 56 but here we have used an array. So here what happens is that the function checks to see if the name string contains only letters and if its doesnt it returns the string message in the array
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a goup size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        // this is another validator
        values: ['easy', 'difficult', 'medium'],
        message: 'difficulty can only be either easy, medium or difficult',
      },
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    ratingsAve: {
      type: Number,
      default: 4.5,
      min: [1, 'rating must be atlest one'], // this is a validator
      max: [5, 'rating must be a maximum of 5'], // this is a validator
      set: val => Math.round(val * 10)/10 // Every time a new vale is given to the ratingsAve property, the function in the set field and the functions parameter will be the new value being added to the ratingsAve property. He we have multiplied the value by 10 and after it is rounded it is divided by 10 again because Math.round returns an integer so we want to get the decimal value. 
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      // this is the property in the document we are creating and we are creating a custom validator
      type: Number, //we are telling mongoose that its a number
      validate: {
        // this property is built into mongoose and it calls the function inside it
        validator: function (val) {
          // this is only pointing at the current document that is getting created, not updated, deleted or anything else.
          return val < this.price; //if this returns true then the document will be created, if false the message below will get put into the error object and well see it by catching the error in the createTour function
        },
        message:
          'The discount amount of $({VALUE}) must be less that the set price', // this ({VALUE}) variable is a unique feature that works under the hood in mongoose and it accesses the val valiable inside the function
      },
    },
    summary: {
      type: String,
      trime: true /* this will remove all the whitespaces*/,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trime: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [
      String,
    ] /* this is how we tell the schema that the images must be an array of strings */,
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false /* here we are telling the schema to not inclue the createdAt property to the client */,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //geoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number], // here we are telling mongoose that we want an array of numbers.
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    //guides: Array we use this instead of the method below if we are going to embed a document inside anothr one.
    guides: [ // here we are saying that guides is to be an array of objects with the type of the mongodb id and it is a reference to another document inside mongodb.
      {
        type: mongoose.Schema.ObjectId, // the type of data the guides will be are an aray of objects that have the type of a mongodb id
        ref: 'User' // here we are telling mongodb that the id's that we are putting here are references to the documents created by the "User" model.
      }
    ]
  },
  // this is the second argument the schema lets us pass, it is the options argument as it enables us to specify other options
  {
    toJSON: {
      virtuals: true,
    } /* here we are saying that as soon as the data gets sent back to us a json, we want the virtual property and its value to be visable in the output */,
    toOBJECT: {
      virtuals: true,
    } /* Im not sure about this one but I think it is as soon as the data gets sent back as an object the virtuals properties are made visible in the output*/,
  }
);

// IMPORTANT !!!!
tourSchema.index({price: 1, ratingsAve: -1}) // When searching through the databse it takes longer and longer when the amount and size of the document in it get bigger and bigger as sending a query to get data from the database means that every single document in the databse will have to be searched before we can find all the documents that match our search criteria. Thus to make things quicker we search through the index's in the database rather than searching through every document and when mongo finds the data that we are looking for in the index's, it is then able to go to the documents and find them directly without needing to check every single document in the database.
// Basically an index is a collection of specific document fields in mongoDB that we create when we specify these fields as we did on line 137. When a request is sent to the database, mongodb's software will only look in the "price" fields and when it finds the price fields that match our query, it will then go into the documents and get them directly.
tourSchema.index({slug: 1}) // Here we made an index in mongoDB for the slug

tourSchema.index({startLocation: '2dsphere'}) // Here we are creating an index which means that every time a new tour is saved to the database a new document (index) is created and its datatype will be a 2 dimentional sphere.

// A virtual property is one that is not included inside the mongo database but instead it can be used to manipulate the data of other properties when they are returned.
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
  /* we use an regular function and not an arrow function because the get function is called inside the tourSchema object and we want the this keyword to point to its parent object which the get function is being called inside of. inside regular functions the this keyword point to the object is was called inside of and arrow functions point to the object it was defined in */
});

// VIRTUAL POPULATE
// A virtual property can also be used to store information without storing it in the database. This is handy as each document has a limit as to how much data it can hold in the mongo data base so if we have lots of information that we want to include in our document and not take up room then we can use a virtual property to do that.
tourSchema.virtual('reviews', { // Here we are creating a virtual property inside the tourSchema and calling it reviews.
  ref: 'Review', // Here in the options object we are telling mongoose that we our virtual reviews property is referencing the Review model.
  foreignField: 'tour', // Here we are telling mongoose that the field (property) inside the document that we are referencing is called 'tour' which gives the tour id (_id). 
  localField: '_id' // Here we are telling mongoose that the field inside the local document that we are connecting to the tourSchema to is called '_id'. 
}) // So basically what will happen is that every time a new request for data is made to the mongo database, mongoose will iterate through all the id's of the Review models documents until it finds a tour id that matches the id specified in the localField property that we stipulated in our option object and it will insert that document (which is the review document) into our tour object that gets send back to us.
// The magic that is happening is that we can make mongoose find the data we want from the database and insert it into the documents that we request without us needing to double up by inserting documents into its parent document in the database.

// document middleware for mongoose: calls the function before the documents are saved to the mongodb. It runs before the save() command and before the create() command but if the command insertMany() is called it will not run.
// the this keyword points to the document object that is about to be saved into the database, you can add properties to it but inorder for it to be saved to the data base the property must be included in the schema.

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// This is how we save the document to the database EMBEDDING the guides document inside the tour documents.
// this is pointing to each of the tour documents that is being saved to the database.
// tourSchema.pre('save', async function(next){
//   const guidesPromises = this.guides.map(async id => await User.findById(id)) // the function, async id => await User.findById(id), is put in the thread pool as its an async function and doesnt resolve until the queries return the data so the queris are put into an array and then we take this array of queries and await a Promise.all() on this array and it will wait untill all the queries in the array inside the Promise.all() resolve and because we put await infrom of the promise.all() it makes it automaticall return the resolved value.
//   this.guides = await Promise.all(guidesPromises)
//   next()
// })

// tourSchema.pre('save', function (next) {
//   console.log('will save document...');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// query middleware: this makes it such that the callback function is called before any find() query is executed.
// What happens here is that before the find() query is executed the call back function is executed and makes a find() query of its own only that here we are telling mongoose to return all documents who DONT contain the property "secretTour" whos value is set to true.
// We are using a regular expressin /^find/ as we are telling mongoose that this pre middleware will apply to all quiries that start with "find", so this includes find() AND findOne()
// IMPORTANT !!!
// The this keyword is pointing at the query object. The query object is an object that contains all the methods and functions that the actual query contains, mongoos have made the code work that way.

tourSchema.pre(/^find/, function(next){ // n.b: "this" is pointing to the query, when ever we do a query middleware in mongoose, "this" is always pointing to the current object.
  this.populate(
    {
      path: 'guides',
      select: '-__v -passwordChangedAt'
    }
  ); // Also by using the populate method we are creating an option object inside it that we can use to tell mongoose what data to include and what data to not include in the referenced object. We are making the query retreave the complete document that the document is referencing (path: 'guides') in the database and it inserts the document in place of where its being referenced in the database. Inside the options object we are also using this line of code, select: '-__v -passwordChangedAt', here we are telling the query to NOT retreave the data with these properties, the - symbol tells to not retreave the data and the + symbol tells it to retreave the data. Using the populate method returns a whole new query.

  next()
})

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`query took ${Date.now() - this.start}`);
  next();
});

//agregation middleware: this points to the aggregation object and the function executes before the aggregation method is executed by the computer.
// here we are inserting { $match: { secretTour: { $ne: true } } } into the aggregate array before we send it off to mongo. We are instructing mongo to not return the documents whos secretTour property is set to true

// We ended up blacking out this code from 219 to 222 because it is inserting an object at the start of the array that we will be sending to the database. This is a problem because in tour controllers on line 129 we are sending an aggregate request to mongodb and mongodb requires that the geoNear property is always the first stage in the aggregation array that we send to mongodb. 

// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

const Tour = mongoose.model( // Mongoose will automatically plurarize the model name "Tour" to tours as a collection in the database when the first document is created in the database
  'Tour',
  tourSchema
); /* this is a function that returns a class which we called tour */

module.exports = Tour;

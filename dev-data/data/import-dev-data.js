const fs = require('fs');
const mongoose = require('mongoose');
const Tour = require('./../../models/tourModels.js');
const User = require('./../../models/userModel.js');
const Review = require('./../../models/reviewModel.js');
const dotenv = require('dotenv');
dotenv.config({ path: './../../config.env' });
const PORT = process.env.PORT || 1514;
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose /* this enables us to conect our server to the mongo data base using the link in the connect app section in the atlas. Thus whenever a request is sent to mongodb on any other document in this project, it is done from this server and the request relates to the link provided in the DB variable  */
  .connect(DB, {
    useNewUrlParser: true /* these are default setting that we use to deal with deprecation warnings */,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('DB connection successfull for import-dev-data file');
  });

// read json file
const tours = JSON.parse(fs.readFileSync('./tours.json', 'utf-8'));
const users = JSON.parse(fs.readFileSync('./users.json', 'utf-8'));
const reviews = JSON.parse(fs.readFileSync('./reviews.json', 'utf-8'));

// import data into database
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, {validateBeforeSave: false}); // Here in the options parameter we need to specify that we are turning off the validators befor saving the documents to the database because we want to load some users to the database for testing purposes and they dont have the passwordConfirm fields or any other required field.
    await Review.create(reviews);
    console.log('data successfully loaded');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// // delete data from database
const deleteData = async () => {
  try {
    await Tour.deleteMany(); /* this deletes all the data in the mongo database*/
    await User.deleteMany();
    await Review.deleteMany();
    console.log('data successfully loaded');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '---import') {
  importData();
} else if (process.argv[2] === '---delete') {
  deleteData();
}

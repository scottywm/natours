const mongoose = require('mongoose');
const dotenv = require('dotenv');

//UNCAUGTH EXCEPTIONS
// here we are setting up a safetynet to handle the errors that occur in our syncronous code that havent been handled, these errors are called exceptions. for example, 'console.log(x)' is an exception if x hasnt been defined.
// we need to put it at the top of our code because whenever a syncronour error occurs inorder to handle it, we must first establish the handler before is occurs. Example, if I was to console.log(x) without defining x before this error handling method, it wont handle the error, but it will if the error occurs after the error occurs.
process.on('uncaughtException', err => {
  console.log(err.name, err.message)
  console.log('UNCAUGHT EXCEPTION SHUTTING DOWN!')
    process.exit(1)
})

dotenv.config({ path: './config.env' });
const app = require('./app');
const PORT = process.env.PORT || 1514;
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose /* this enables us to conect our server to the mongo data base using the link in the connect app section in the atlas. Thus whenever a request is sent to mongodb on any other document in this project, it is done from this server and the request relates to the link provided in the DB variable. When we have connected the server to the mongodb database when the server runs code from any other file the memory (ram) of the computer that is running the server will remember that the computer is connected to that particular database because the computer is still connected to it, and so whenever we send a request to the database using methods inside the mongoose object, the method knows where to send the request because the computer is currently connected to that particular database. */
  .connect(DB, {
    useNewUrlParser: true /* these are default setting that we use to deal with deprecation warnings */,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('DB connection successfull');
  });

const server = app.listen(PORT, () => { // here we are setting up the server and since the app.listen function returns the server object which it created, we can all store this server object into a variable and use it latter on.
    console.log('server working');
  });

  //UNCAUGHT REJECTIONS
  // here we are setting a safety net to catch the errors that occur in our asyncronous code throughout our application that were not previously handled with error handlers. To handle such errors that occus in asyncrous code (promises) we use catch on the end and inside the catch function we use the next(err) function as you can see and pass the err object into it and it passes the error object into the global erroro handling function which is the function in express that has four parrameters and the error object is the dirst one. Thus when an error occurs between line 11 to 19 the error is not going to be handled until we use process.on in line 26.
  process.on('unhandledRejection', err => {
    console.log(err.name, err.message)
    console.log('UNHANDLER REJECTION SHUTTING DOWN!')
    server.close(()=>{
      process.exit(1)
    }) // here we are calling server.close to enable the server to finalise all the pendeng requests and handlers and then after that, the callback function will execute and the code, process.on with make the computer no longer run the code. In the exit() function, 0 means success and 1 means unhandled exception.
  })






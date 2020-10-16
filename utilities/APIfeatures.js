class APIFeatures {
    constructor(query, queryString) {
      this.query = query;
      this.queryString = queryString;
    }
  
    filter() {
      // 1A) Build query filtering
      const queryObj = { ...this.queryString };
      const excludedFields = ['page', 'sort', 'limit', 'fields'];
  
      excludedFields.forEach((el) => delete queryObj[el]);
  
      // 1B) Avanced filtering
      let queryStr = JSON.stringify(queryObj);

      queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

      // here we are are creating a query object and resetting the originial query to it. This works because this.query.find(JSON.parse(queryStr)) creates a query object with the instruction of the find() method and since we are resetting the query object to this new query the query object contains these new instructions
      this.query = this.query.find(JSON.parse(queryStr));
  
      //let query = Tour.find(JSON.parse(queryStr));
  
      return this;
    }
  
    sort() {
      if (this.queryString.sort) {
        const sortBy = this.queryString.sort.split(',').join(' ');
        /* Here we are accessing the sort property inside the query object and telling the query object that when it resolves it must sort the objects in order of their prices, also const queryObj = { ...req.query }; here queryObj is only referencing { ...req.query } so we can mutate queryObj but not affecting req.query; when you access the sort() method inside the query object it returns the query object only with the sort instructions within it that you give it, this enables the methods to chain together */
        this.query = this.query.sort(sortBy);
      } else {
        this.query = this.query.sort('-createdAt'); // here we are accessing the sort property inside the query and we are sorting all the tours in order of the times they were created for createdAt is a property in the tours document in the database. What is happening here is that we are are creating a query object and resetting the originial query to it. This works because this.query.sort('-createdAt') creates a query object with the instruction of the sort() method and since we are resetting the query object to this new query the query object contains these new instructions.
      }
  
      return this;
    }
  
    fieldLimiting() {
      if (this.queryString.fields) {
        const fields = this.queryString.fields.split(',').join(' ');
        this.query = this.query.select(fields);
      } else {
        this.query = this.query.select('-__v');
      }
  
      return this;
    }
  
    paginate() {
      const page = this.queryString.page * 1 || 1;
      const limit = this.queryString.limit * 1 || 100;
      const skip = (page - 1) * limit;
  
      this.query = this.query.skip(skip).limit(limit);
  
      return this;
    }
  }

// exports.getAllTours = catchAsync(async (req, res, next) => {

//   /* This send a request to the mongdb database and it returns a resolved promise with all the documents in it */
// // n.b: all of the below code from 72 to 114 was transferred to the class APIFeatures
//     // // 1A) Build query filtering
//     // const queryObj = { ...req.query };
//     // const excludedFields = ['page', 'sort', 'limit', 'fields'];

//     // excludedFields.forEach((el) => delete queryObj[el]);

//     // // 1B) Avanced filtering
//     // let queryStr = JSON.stringify(queryObj);

//     // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

//     // // here we are sending a request to mongodb and it returns a pending promise which has methods inside it that we can access while its waiting to resolve
//     // let query = Tour.find(JSON.parse(queryStr));

//     // 2) Sorting
//     // if (req.query.sort) {
//     //   const sortBy = req.query.sort.split(',').join(' ');
//     //   /* Here we are accessing the sort property inside the query object and telling the query object that when it resolves it must sort the objects in order of their prices, also const queryObj = { ...req.query }; here queryObj is only referencing { ...req.query } so we can mutate queryObj but not affecting req.query; when you access the sort() method inside the query object it returns the query object only with the sort instructions within it that you give it, this enables the methods to chain together */
//     //   query = query.sort(sortBy);
//     // } else {
//     //   query = query.sort('-createdAt');
//     // }

//     // 3) field limiting
//     // if (req.query.fields) {
//     //   const fields = req.query.fields.split(',').join(' ');
//     //   query = query.select(fields);
//     // } else {
//     //   query = query.select('-__v');
//     // }

//     // 3) pagination
//     // if there is no page in the req.query.page then mongoose knows to ignore it and still enable the limit to be established
//     // const page = req.query.page * 1 || 1;
//     // const limit = req.query.limit * 1 || 100;
//     // const skip = (page - 1) * limit;

//     // query = query.skip(skip).limit(limit);

//     // if (req.query.page) {
//     //   const numTours = await Tour.countDocuments();
//     //   if (skip >= numTours) throw new Error('this page does not exist');
//     // }

//     // Execute query
//     const features = new APIFeatures(Tour.find(), req.query)
//       .filter()
//       .sort()
//       .fieldLimiting()
//       .paginate();
//     // with mongoose the query is only executed if we use await as shown below. After the query is sent off the await will make the line of code await untill the promise comes back and there is a built in then() function inside the promise when it comes back which automatically is initiated and returns the data.
//     // without the await the query would not be sent off and nothing would happen. This is only with mongoose.
//     const tours = await features.query.populate('reviews');

//     //send response
//     res.status(200).json({
//       status: 'success',
//       results: tours.length,
//       data: {
//         tours,
//       },
//     });
// });

module.exports = APIFeatures


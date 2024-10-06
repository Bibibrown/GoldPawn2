const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const createError = require('http-errors');

const indexRouter = require('./routes/index');
const customersRoute = require('./routes/customer');
const pawnRouter = require('./routes/pawn');
const addDataRouter = require('./routes/addData');
const paymentRouter = require('./routes/payment');
const apiRouter = require('./routes/api');

const app = express();
const port = 3000; // กำหนดพอร์ตที่ต้องการใช้

// เชื่อมต่อกับ MongoDB
mongoose.connect('mongodb://localhost:27017/goldPawn2')
  .then(() => console.log('MongoDB connected'))
  .catch((error) => console.log('Error connecting to MongoDB:', error));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));

app.use('/', indexRouter);
app.use('/customer', customersRoute);
app.use('/pawn', pawnRouter);
app.use('/add-data', addDataRouter);
app.use('/payment', paymentRouter);
app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// ให้เซิร์ฟเวอร์ฟังที่พอร์ตที่กำหนด
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;
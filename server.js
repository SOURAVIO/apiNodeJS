const express = require('express');
const dotenv = require("dotenv");
const logger = require('./middleware/logger');
const morgan = require('morgan');

//Router Files****************
const bootcamps = require('./routes/bootcamps');

//Load env vars ************
dotenv.config({path: "./config/config.env"});

const app = express();

//Use Middleware ******************
app.use(logger);

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

//Mount Routers ******************
app.use('/api/v1/bootcamps', bootcamps);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server Running in ${process.env.NODE_ENV} Mode on Port ${PORT}`)
})

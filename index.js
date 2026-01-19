const dotenv = require("dotenv");
dotenv.config();

const path = require("path");
const express = require("express");
const morgan = require("morgan");
// const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
// const xssClean = require("xss-clean");
const expressRateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");
const lusca = require("lusca");
const session = require("express-session");
require("colors");

// Internal Imports *****************************************************
// Internal Imports *****************************************************
const { logger, errorHandler } = require("./middleware");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const connectDB = require("./db");

//Connect To DB********************************************************
if (process.env.NODE_ENV !== "test") {
  connectDB().then(() => {
    console.log(`Connected to MongoDB`.bgGreen.bold);
  });
}

//Router Files**********************************************************
const {
  bootcampsRoute,
  coursesRoute,
  authRoute,
  usersRoute,
  reviewsRoute,
} = require("./routes");

const app = express();

//Body Parser **********************************************************
app.use(express.json());

// Fix: Trust proxy (add this line)
app.set("trust proxy", true);

//Cookie Parser ********************************************************
app.use(cookieParser());

//Use logger Middleware ************************************************
app.use(logger);

//Use morgan Middleware *************************************************
if (process.env.NODE_ENV === "development") {
  app.use(morgan("short"));
}

//File Uploading *******************************************************
app.use(fileUpload());

// Sanitize Data *******************************************************
// app.use(mongoSanitize());

//Set Security Headers ************************************************
app.use(helmet());

// Prevent XSS attacks ************************************************
// app.use(xssClean());

//Rate Limiting ******************************************************
const limiter = expressRateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100,
  // Add this to acknowledge you understand the security implications
  trustProxy: true,

  // Optional: Use a custom key generator that combines IP with other identifiers
  keyGenerator: (req) => {
    return req?.ip + "-" + (req.headers["x-forwarded-for"] || "");
  },
});
app.use(limiter);

//Prevent http params pollution **************************************
app.use(hpp());

//Enable CORS ********************************************************
app.use(cors());

// Set up session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "somesupersecret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === "production" },
  }),
);

// CSRF Protection *****************************************************
if (
  process.env.NODE_ENV !== "development" &&
  (process.env.NODE_ENV !== "test" || process.env.USE_CSRF === "true")
) {
  app.use(lusca.csrf());
}

//Set Static Folder ****************************************************
app.use(express.static(path.join(__dirname, "public")));

// Home Page
app.get("/", (req, res) => {
  res.send("<h1>Bootcamp Home Page</h1>");
});
//Mount Routers *********************************************************
//Mount Routers *********************************************************
app.use("/api/v1/bootcamps", bootcampsRoute);
app.use("/api/v1/courses", coursesRoute);
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", usersRoute);
app.use("/api/v1/reviews", reviewsRoute);

// Swagger UI ***********************************************************
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./docs/swagger.json");
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//Add Error Handler *****************************************************
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(
      `Server Running in ${process.env.NODE_ENV} Mode on Port ${PORT}`.green
        .bold.inverse,
    );
  });

  //handle unhandled promise rejections ************************************
  process.on("unhandledRejection", (error) => {
    console.log(`Error: ${error.message}`.bgRed.bold);

    //  Close server and exit process *****************************************
    server.close(() => {
      process.exit(1);
    });
  });
}

module.exports = app;

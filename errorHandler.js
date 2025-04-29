// Global felhanterare för Express applikationen
const errorHandler = (err, req, res, next) => {
  console.error(`Error: ${err.message}`, err.stack);

  // Standard HTTP-statuskod om ingen annan anges
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    message: err.message || 'Ett oväntat fel inträffade',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

// 404-middleware - anropas när ingen route matchar
const notFound = (req, res, next) => {
  const error = new Error(`Resursen hittades inte - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound }; 
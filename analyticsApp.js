const express = require('express');
const mongoose = require('mongoose');
const analyticsRoutes = require('./analyticsRoutes');
const jwt = require('jsonwebtoken');
const { errorHandler, notFound } = require('./errorHandler');

// Skapa Express app
const app = express();

// Middleware
app.use(express.json());

// JWT Auth middleware
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }
    
    // Verifiera token och lägg till user i req-objektet
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hemlig_nyckel');
    req.user = decoded;
    next();
  } catch (error) {
    // Om token är ogiltig, fortsätt utan att sätta req.user
    next();
  }
};

// Använd auth middleware för alla routes
app.use(authMiddleware);

// Analytics routes
app.use('/api/analytics', analyticsRoutes);

// 404-hantering
app.use(notFound);

// Global felhantering
app.use(errorHandler);

// Anslut till databas och starta server
mongoose
  .connect('mongodb://localhost:27017/webshop', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Ansluten till MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server igång på port ${PORT}`));
  })
  .catch(err => {
    console.error('Kunde inte ansluta till MongoDB:', err.message);
    process.exit(1);
  });

module.exports = app; 
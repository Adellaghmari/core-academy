const express = require('express');
const mongoose = require('mongoose');
const postRoutes = require('./postRoutes');
const { errorHandler, notFound } = require('./errorHandler');

// Skapa Express app
const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api', postRoutes);

// 404-hantering
app.use(notFound);

// Global felhantering
app.use(errorHandler);

// Anslut till databas och starta server
mongoose
  .connect('mongodb://localhost:27017/forumapp', {
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
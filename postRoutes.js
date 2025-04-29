const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { body, validationResult } = require('express-validator');

// Middleware för validering av inläggsdata
const validatePostData = [
  body('title').trim().notEmpty().withMessage('Titel får inte vara tom')
    .isLength({ min: 3, max: 100 }).withMessage('Titeln måste vara mellan 3-100 tecken'),
  body('body').trim().notEmpty().withMessage('Innehåll får inte vara tomt')
    .isLength({ min: 10 }).withMessage('Innehållet måste vara minst 10 tecken')
];

// Skapa ett nytt inlägg
router.post('/posts', validatePostData, async (req, res, next) => {
  try {
    // Kontrollera valideringsresultatet
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        errors: errors.array(),
        message: 'Ogiltig inläggsdata' 
      });
    }

    const post = new Post({
      title: req.body.title,
      body: req.body.body
    });
    
    const savedPost = await post.save();
    res.status(201).json(savedPost);
  } catch (error) {
    // Hantera Mongoose valideringsfel
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Valideringsfel', 
        errors: Object.values(error.errors).map(err => err.message) 
      });
    }
    // Skicka vidare övriga fel till global felhanterare
    next(error);
  }
});

// Hämta ett specifikt inlägg med ID
router.get('/posts/:id', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    
    // Kontrollera om inlägget finns
    if (!post) {
      return res.status(404).json({ message: 'Inlägget kunde inte hittas' });
    }
    
    res.json(post);
  } catch (error) {
    // Hantera felaktigt ID-format
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Ogiltigt ID-format' });
    }
    next(error);
  }
});

// Ta bort ett inlägg och dess kommentarer
router.delete('/posts/:id', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    
    // Kontrollera om inlägget finns
    if (!post) {
      return res.status(404).json({ message: 'Inlägget kunde inte hittas' });
    }
    
    // Ta bort inlägget
    await Post.findByIdAndDelete(req.params.id);
    
    // Ta bort relaterade kommentarer
    await Comment.deleteMany({ postId: req.params.id });
    
    res.json({ message: 'Inlägg och kommentarer borttagna' });
  } catch (error) {
    // Hantera felaktigt ID-format
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Ogiltigt ID-format' });
    }
    next(error);
  }
});

module.exports = router; 
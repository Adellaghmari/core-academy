const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Middleware för admin-behörighet
const isAdmin = async (req, res, next) => {
  try {
    // Kontrollera om användaren är inloggad och har admin-roll
    if (!req.user || req.user.role !== 'admin') {
      // Returnera 404 istället för 403 för att dölja att resursen finns
      return res.status(404).json({ message: 'Resursen kunde inte hittas' });
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Månadsvis orderintäkt för senaste 12 månader
router.get('/revenue-per-month', isAdmin, async (req, res, next) => {
  try {
    // Beräkna datum för ett år sedan
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    // Hämta alla ordrar från senaste året
    const orders = await Order.find({
      createdAt: { $gte: oneYearAgo }
    });
    
    // Skapa månadsnamn på svenska
    const monthNames = [
      'januari', 'februari', 'mars', 'april', 'maj', 'juni',
      'juli', 'augusti', 'september', 'oktober', 'november', 'december'
    ];
    
    // Sortera ordrar per månad
    const revenueByMonth = {};
    
    // Förbered alla månader i förväg (även de utan ordrar)
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(today.getMonth() - i);
      const monthKey = `${monthNames[date.getMonth()]}-${date.getFullYear()}`;
      revenueByMonth[monthKey] = 0;
    }
    
    // Beräkna intäkt per månad
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const monthKey = `${monthNames[orderDate.getMonth()]}-${orderDate.getFullYear()}`;
      
      // Lägg till ordersumman för månaden
      revenueByMonth[monthKey] += order.totalAmount;
    });
    
    res.json(revenueByMonth);
  } catch (error) {
    next(error);
  }
});

// Topp 5 största kunder
router.get('/top-customers', isAdmin, async (req, res, next) => {
  try {
    // Aggregera total spenderat per kund
    const topCustomers = await Order.aggregate([
      // Gruppera efter kundID
      { $group: {
          _id: '$customerId',
          totalSpent: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
      }},
      // Sortera fallande efter totalSpent
      { $sort: { totalSpent: -1 } },
      // Begränsa till topp 5
      { $limit: 5 },
      // Koppla ihop med User-modellen för att få kundinfo
      { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'customerInfo'
      }},
      // Formatera resultatet
      { $project: {
          _id: 0,
          customerId: '$_id',
          name: { $arrayElemAt: ['$customerInfo.name', 0] },
          email: { $arrayElemAt: ['$customerInfo.email', 0] },
          totalSpent: 1,
          orderCount: 1
      }}
    ]);
    
    res.json(topCustomers);
  } catch (error) {
    next(error);
  }
});

module.exports = router; 
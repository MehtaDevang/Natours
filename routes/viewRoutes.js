const express = require('express');
const viewController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const router = express.Router()


router.get('/', viewController.getOverview);
router.get('/login', viewController.getLoginForm);
router.get('/tour/:slug', 
    // authController.protect,
    viewController.getTour);

module.exports = router;


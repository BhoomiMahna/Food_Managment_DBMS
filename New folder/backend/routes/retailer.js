const express = require('express');
const router = express.Router();
const { verifyJWT, verifyRole } = require('../middleware/auth');
const retailerController = require('../controllers/retailer');

router.use(verifyJWT);
router.use(verifyRole(['RETAILER']));

router.get('/wholesalers', retailerController.getWholesalers);
router.post('/buy', retailerController.buyStock);
router.get('/stock', retailerController.getStock);

module.exports = router;

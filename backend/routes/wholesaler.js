const express = require('express');
const router = express.Router();
const { verifyJWT, verifyRole } = require('../middleware/auth');
const wholesalerController = require('../controllers/wholesaler');

router.use(verifyJWT);
router.use(verifyRole(['WHOLESALER']));

router.get('/farmers', wholesalerController.getFarmers);
router.post('/buy', wholesalerController.buyStock);
router.get('/stock', wholesalerController.getStock);

module.exports = router;

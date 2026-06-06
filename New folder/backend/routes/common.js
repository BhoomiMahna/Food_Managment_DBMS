const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyJWT, verifyRole } = require('../middleware/auth');
const commonController = require('../controllers/common');

const upload = multer({ dest: 'uploads/' });

router.use(verifyJWT);

router.get('/alerts', commonController.getAllAlerts);
router.get('/price-comparison', commonController.getPriceComparison);
router.get('/crops', commonController.getCrops);
router.get('/cities', commonController.getCities);

module.exports = router;

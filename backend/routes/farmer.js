const express = require('express');
const router = express.Router();
const { verifyJWT, verifyRole } = require('../middleware/auth');
const farmerController = require('../controllers/farmer');

router.use(verifyJWT);
router.use(verifyRole(['FARMER']));

router.get('/production', farmerController.getProduction);
router.post('/add-production', farmerController.addProduction);
router.post('/sync-csv', farmerController.syncCsv);
router.get('/alerts', farmerController.getAlerts);

module.exports = router;

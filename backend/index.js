const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const farmerRoutes = require('./routes/farmer');
const wholesalerRoutes = require('./routes/wholesaler');
const retailerRoutes = require('./routes/retailer');
const commonRoutes = require('./routes/common');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/farmer', farmerRoutes);
app.use('/wholesaler', wholesalerRoutes);
app.use('/retailer', retailerRoutes);
app.use('/', commonRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

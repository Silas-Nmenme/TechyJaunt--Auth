const express = require('express');
const router = express.Router();

const {
  addCar,
  editCar,
  deleteCar,
  getAllCars,
  searchCars
} = require('../controller/admin.controller');

const {
  rentCar
} = require('../controller/rental.controller');

const {
  makePayment
} = require('../controller/payment.controller');

const { isAuthenticated } = require('../middlewares/isAuth');
const { upload } = require('../config/cloudinary');

// Public routes
router.get('/get-cars', getAllCars);
router.get('/search-cars', searchCars);

// Admin-protected routes
router.post('/add-car', isAuthenticated, upload.single('file'), addCar);
router.put('/edit-car/:carId', isAuthenticated, editCar);
router.delete('/delete-car/:carId', isAuthenticated, deleteCar);

// Car rental routes
router.post('/rent/:carId', isAuthenticated, rentCar);              // Without payment
router.post('/rent-paid/:carId', isAuthenticated, makePayment); // With verified payment

module.exports = router;
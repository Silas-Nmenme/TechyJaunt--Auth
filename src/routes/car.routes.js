const express = require('express');
const router = express.Router();
const { addCar, editCar, deleteCar, getAllCars, searchCars } = require('../controller/admin.controller');
const {isAuthenticated} = require('../middlewares/isAuth');
const { rentCar, rentCarWithPayment } = require('../controller/rental.controller');

router.get('/get-cars', getAllCars);
router.get('/search-cars', searchCars);
router.post('/add-car',isAuthenticated, addCar);
router.put('/edit-car/:carId', editCar);
router.delete('/delete-car/:carId', deleteCar);

router.post('/rent-car/:carId', isAuthenticated, rentCar); // optional if payment not needed
router.post('/rent-car-paid/:carId', isAuthenticated, rentCarWithPayment);


module.exports = router;
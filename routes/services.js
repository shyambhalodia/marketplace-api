// src/routes/serviceRoutes.js
const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/services');

// GET /services - Get all services
router.get('/', serviceController.getAllServices);

// POST /services - Create a new service
router.post('/', serviceController.createService);

// GET /services/:id - Get service by ID
router.get('/:id', serviceController.getServiceById);

// PUT /services/:id - Update service by ID
router.put('/:id', serviceController.updateServiceById);

// DELETE /services/:id - Delete service by ID
router.delete('/:id', serviceController.deleteServiceById);

module.exports = router;

const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providers');

// GET /providers - Get all service providers
router.get('/', providerController.getAllProviders);

// POST /providers - Create a new service provider
router.post('/', providerController.createProvider);

// GET /providers/:id - Get a specific service provider by ID
router.get('/:id', providerController.getProviderById);

// PUT /providers/:id - Update a specific service provider by ID
router.put('/:id', providerController.updateProviderById);

// DELETE /providers/:id - Delete a specific service provider by ID
router.delete('/:id', providerController.deleteProviderById);

module.exports = router;
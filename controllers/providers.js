const { pool } = require('../config/db.config');

//Get all service provider
exports.getAllProviders = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM providers');
        res.status(200).json({ data: rows, status: true, message: 'Providers get sucessfully!' });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ status: false, message: 'Error fetching providers' }); // Generic error message
    }
};

// Create a new service provider
exports.createProvider = async (req, res) => {
    // Extract provider information from the request body
    const { name, email, phone, address } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !address) {
        return res.status(400).json({ status: false, error: 'All fields are required' });
    }

    try {
        // Check if email or phone already exists
        const [existingProviders] = await pool.query('SELECT * FROM providers WHERE email = ? OR phone = ?', [email, phone]);
        if (existingProviders.length > 0) {
            return res.status(400).json({ status: false, error: 'Email or phone already exists' });
        }

        // Insert the new provider into the database
        const [result] = await pool.query('INSERT INTO providers (name, email, phone, address) VALUES (?, ?, ?, ?)', [name, email, phone, address]);
        const insertId = result.insertId;

        // Fetch the newly created provider from the database
        const [newProvider] = await pool.query('SELECT * FROM providers WHERE id = ?', [insertId]);

        // Return the newly created provider with status true
        res.status(201).json({ data: newProvider[0], status: true, message: 'Provider created successfully!' });
    } catch (error) {
        console.error('Error creating provider:', error);
        res.status(500).json({ status: false, error: 'Internal server error' });
    }
};

// Get a specific service provider by ID
exports.getProviderById = async (req, res) => {
    const { id } = req.params;

    // Validate ID parameter
    if (!id || isNaN(id)) {
        return res.status(400).json({ status: false, error: 'Invalid ID parameter' });
    }

    try {
        // Fetch the provider from the database by ID
        const [provider] = await pool.query('SELECT * FROM providers WHERE id = ?', [id]);

        // Check if provider with the given ID exists
        if (!provider || provider.length === 0) {
            return res.status(404).json({ status: false, error: 'Provider not found' });
        }

        // Return the provider details
        res.status(200).json({ data: provider[0], status: true, message: 'Provider retrieved successfully!' });
    } catch (error) {
        console.error('Error fetching provider:', error);
        res.status(500).json({ status: false, error: 'Internal server error' });
    }
};

// Update a specific service provider by ID
exports.updateProviderById = async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    // Validate ID parameter
    if (!id || isNaN(id)) {
        return res.status(400).json({ status: false, error: 'Invalid ID parameter' });
    }

    // Validate required fields
    if (!name || !email || !phone || !address) {
        return res.status(400).json({ status: false, error: 'All fields are required' });
    }

    try {
        // Check if provider with the given ID exists
        const [existingProviders] = await pool.query('SELECT * FROM providers WHERE id = ?', [id]);
        if (!existingProviders || existingProviders.length === 0) {
            return res.status(404).json({ status: false, error: 'Provider not found' });
        }

        // Check if the updated email or phone already exists in other records
        const [duplicateEmailProviders] = await pool.query('SELECT * FROM providers WHERE email = ? AND id != ?', [email, id]);
        const [duplicatePhoneProviders] = await pool.query('SELECT * FROM providers WHERE phone = ? AND id != ?', [phone, id]);
        if (duplicateEmailProviders.length > 0) {
            return res.status(400).json({ status: false, error: 'Email already exists' });
        }
        if (duplicatePhoneProviders.length > 0) {
            return res.status(400).json({ status: false, error: 'Phone number already exists' });
        }

        // Update the provider details in the database
        await pool.query('UPDATE providers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?', [name, email, phone, address, id]);

        // Fetch the updated provider from the database
        const [updatedProvider] = await pool.query('SELECT * FROM providers WHERE id = ?', [id]);

        // Return the updated provider details with success message
        res.status(200).json({ data: updatedProvider[0], status: true, message: 'Provider updated successfully!', });
    } catch (error) {
        console.error('Error updating provider:', error);
        res.status(500).json({ status: false, error: 'Internal server error' });
    }
};

// Delete a specific service provider by ID
exports.deleteProviderById = async (req, res) => {
    const { id } = req.params;

    // Validate ID parameter
    if (!id || isNaN(id)) {
        return res.status(400).json({ status: false, error: 'Invalid ID parameter' });
    }

    try {
        // Check if provider with the given ID exists
        const [existingProvider] = await pool.query('SELECT * FROM providers WHERE id = ?', [id]);
        if (existingProvider.length === 0) {
            return res.status(404).json({ status: false, error: 'Provider not found' });
        }

        // Delete the provider from the database
        await pool.query('DELETE FROM providers WHERE id = ?', [id]);

        // Return success message
        res.status(200).json({ status: true, message: 'Provider deleted successfully!' });
    } catch (error) {
        // Check if the error is due to a foreign key constraint violation
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ status: false, error: 'Cannot delete provider because it has associated services' });
        }
        console.error('Error deleting provider:', error);
        res.status(500).json({ status: false, error: 'Internal server error' });
    }
};
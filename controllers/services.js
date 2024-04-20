const { pool } = require('../config/db.config');

// Get all services
exports.getAllServices = async (req, res) => {
    try {
        // Fetch all services with provider data from the database
        const [services] = await pool.query(`
         SELECT s.*, p.name AS provider_name, p.email AS provider_email, p.phone AS provider_phone, p.address AS provider_address
         FROM services s
         INNER JOIN providers p ON s.provider_id = p.id
     `);
        // Return the list of services
        res.status(200).json({ data: services, status: true, message: 'Services retrieved successfully!' });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ status: false, error: 'Internal server error' });
    }
};

// Create a new service
exports.createService = async (req, res) => {
    const { name, description, price, provider_id } = req.body;

    // Normalize the service name by converting to lowercase and trimming spaces
    const normalizedName = name.trim().toLowerCase();

    // Validate required fields
    if (!name || !description || !price || !provider_id) {
        return res.status(400).json({ status: false, error: 'All fields are required' });
    }

    // Validate price format
    if (isNaN(price) || parseFloat(price) <= 0) {
        return res.status(400).json({ status: false, error: 'Invalid price format. Price must be a positive number' });
    }

    // Validate provider_id format
    if (isNaN(provider_id)) {
        return res.status(400).json({ status: false, error: 'Invalid provider_id format. Must be a number' });
    }

    try {
        // Check if a service with the same name and provider_id already exists
        const [existingService] = await pool.query('SELECT * FROM services WHERE LOWER(TRIM(name)) = ? AND provider_id = ?', [normalizedName, provider_id]);
        if (existingService.length > 0) {
            return res.status(400).json({ status: false, error: 'Service with the same name and provider already exists' });
        }

        // Check if the provider with the given provider_id exists
        const [existingProvider] = await pool.query('SELECT * FROM providers WHERE id = ?', [provider_id]);
        if (existingProvider.length === 0) {
            return res.status(404).json({ status: false, error: 'Provider not found' });
        }

        // Insert the new service into the database
        const [result] = await pool.query('INSERT INTO services (name, description, price, provider_id) VALUES (?, ?, ?, ?)', [name, description, price, provider_id]);
        const insertId = result.insertId;

        // Fetch the newly created service along with its provider data from the database
        const [newService] = await pool.query(`
         SELECT s.*, p.name AS provider_name, p.email AS provider_email, p.phone AS provider_phone, p.address AS provider_address
         FROM services s
         INNER JOIN providers p ON s.provider_id = p.id
         WHERE s.id = ?
     `, [insertId]);

        // Return success message
        res.status(201).json({ data: newService[0], status: true, message: 'Service created successfully!' });
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({ status: false, error: 'Internal server error' });
    }
};

// Get service by ID
exports.getServiceById = async (req, res) => {
    const { id } = req.params;

    // Validate service ID format
    if (isNaN(id)) {
        return res.status(400).json({ status: false, error: 'Invalid service ID format. Must be a number' });
    }

    try {
        // Fetch service details with provider data from the database
        const [serviceWithProvider] = await pool.query(`
      SELECT s.*, p.name as provider_name, p.email as provider_email, p.phone as provider_phone, p.address as provider_address 
      FROM services s 
      INNER JOIN providers p ON s.provider_id = p.id 
      WHERE s.id = ?
  `, [id]);

        // Check if the service exists
        if (!serviceWithProvider) {
            return res.status(404).json({ error: 'Service not found' });
        }


        // Return service details
        res.status(200).json({ data: serviceWithProvider, status: true, message: 'Service retrieved successfully!' });
    } catch (error) {
        console.error('Error fetching service:', error);
        res.status(500).json({ status: false, error: 'Internal server error' });
    }
};

// Update service by ID
exports.updateServiceById = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, provider_id } = req.body;

    // Validate service ID format
    if (isNaN(id)) {
        return res.status(400).json({ status: false, error: 'Invalid service ID format. Must be a number' });
    }

    // Validate required fields
    if (!name || !description || !price || !provider_id) {
        return res.status(400).json({ status: false, error: 'All fields are required' });
    }

    // Validate price format
    if (isNaN(price) || parseFloat(price) <= 0) {
        return res.status(400).json({ status: false, error: 'Invalid price format. Price must be a positive number' });
    }

    // Validate provider_id format
    if (isNaN(provider_id)) {
        return res.status(400).json({ status: false, error: 'Invalid provider_id format. Must be a number' });
    }

    try {
        // Check if another service with the same name and provider_id already exists
        const [existingService] = await pool.query('SELECT * FROM services WHERE id != ? AND name = ? AND provider_id = ?', [id, name, provider_id]);
        if (existingService && existingService.length > 0) {
            return res.status(400).json({ status: false, error: 'Service with the same name and provider already exists' });
        }

        // Check if the service with the given ID exists
        const [service] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
        if (!service || service.length === 0) {
            return res.status(404).json({ status: false, error: 'Service not found' });
        }

        // Update the service in the database
        await pool.query('UPDATE services SET name = ?, description = ?, price = ?, provider_id = ? WHERE id = ?', [name, description, price, provider_id, id]);
        // Fetch the updated service with provider data
        const [updatedService] = await pool.query(`
  SELECT s.*, p.name AS provider_name, p.email AS provider_email, p.phone AS provider_phone, p.address AS provider_address
  FROM services s
  INNER JOIN providers p ON s.provider_id = p.id
  WHERE s.id = ?
`, [id]);

        // Return success message along with the updated service
        res.status(200).json({ data: updatedService, status: true, message: 'Service updated successfully!', });
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ status: false, error: 'Internal server error' });
    }
};

// Delete service by ID
exports.deleteServiceById = async (req, res) => {
    const { id } = req.params;

    // Validate service ID format
    if (isNaN(id)) {
        return res.status(400).json({ status: false, error: 'Invalid service ID format. Must be a number' });
    }

    try {
        // Check if the service with the given ID exists
        const [service] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
        if (!service || service.length === 0) {
            return res.status(404).json({ status: false, error: 'Service not found' });
        }

        // Delete the service from the database
        await pool.query('DELETE FROM services WHERE id = ?', [id]);

        // Return success message
        res.status(200).json({ status: true, message: 'Service deleted successfully!' });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ status: false, error: 'Internal server error' });
    }
};

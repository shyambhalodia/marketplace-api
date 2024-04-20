const { getAllProviders, getProviderById, deleteProviderById, createProvider, updateProviderById } = require('../controllers/providers'); // Assuming `getAllProviders.js` is the source file
const { pool } = require('../config/db.config');

// At the top of your test file
console.error = jest.fn(); // Mocking console.error

// Mock the pool.query function
jest.mock('../config/db.config', () => ({
    pool: {
        query: jest.fn(),
    },
}));

describe('getAllProviders function', () => {
    beforeEach(() => {
        pool.query.mockResolvedValueOnce([ // Mock successful query
            [
                { id: 1, name: 'Provider 1' },
                { id: 2, name: 'Provider 2' },
            ],
        ]);
    });

    afterEach(() => {
        jest.clearAllMocks(); // Reset mocks for each test
    });

    it('should return all providers successfully', async () => {
        const req = {}; // Mock request object (not strictly necessary in this case)
        const res = {
            status: jest.fn().mockReturnThis(), // Mock response status
            json: jest.fn(), // Mock response json
        };

        await getAllProviders(req, res);
        expect(res.status).toHaveBeenCalledWith(200); // Assert status code
        expect(res.json).toHaveBeenCalledWith({
            data: [
                { id: 1, name: 'Provider 1' },
                { id: 2, name: 'Provider 2' },
            ],
            status: true,
            message: 'Providers get sucessfully!',
        });
    });
});

describe('createProvider', () => {
    // Mock request object with valid provider data
    const reqValid = {
        body: {
            name: 'Test Provider',
            email: 'test@example.com',
            phone: '1234567890',
            address: '123 Test Street',
        },
    };

    // Mock request object with missing required fields
    const reqMissingFields = {
        body: {
            name: 'Test Provider',
            email: 'test@example.com',
            // phone and address fields are missing
        },
    };

    // Mock request object with email or phone already exists in the database
    const reqExisting = {
        body: {
            name: 'Test Provider',
            email: 'existing@example.com', // This email already exists
            phone: '1234567890', // This phone number already exists
            address: '123 Test Street',
        },
    };

    // Mock response object
    const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks(); // Clear mock calls before each test
    });

    // Test case for missing required fields
    it('should return error for missing required fields', async () => {
        await createProvider(reqMissingFields, res);

        expect(res.status).toHaveBeenCalledWith(400); // Should return status code 400
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'All fields are required' });
    });

    // Test case for internal server error
    it('should return internal server error', async () => {
        // Mocking an error while creating provider
        const errorMessage = 'Database connection error';
        jest.spyOn(console, 'error').mockImplementation(() => { });
        jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error(errorMessage));

        await createProvider(reqValid, res);

        expect(res.status).toHaveBeenCalledWith(500); // Should return status code 500
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Internal server error' });
        expect(console.error).toHaveBeenCalledWith('Error creating provider:', expect.any(Error));
    });
});

describe('getProviderById', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return provider details for valid ID', async () => {
        // Mock database response
        const mockProvider = [{ id: 1, name: 'Provider Name', /* other fields */ }];
        pool.query.mockResolvedValueOnce([mockProvider]);

        // Mock request and response objects
        const req = { params: { id: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await getProviderById(req, res);

        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM providers WHERE id = ?', [1]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: mockProvider[0], status: true, message: 'Provider retrieved successfully!' });
    });

    test('should return error for invalid ID (non-numeric)', async () => {
        // Mock request and response objects
        const req = { params: { id: 'abc' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await getProviderById(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Invalid ID parameter' });
    });

    test('should return error for ID not found', async () => {
        // Mock database response (empty result)
        pool.query.mockResolvedValueOnce([]);

        // Mock request and response objects
        const req = { params: { id: 999 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await getProviderById(req, res);

        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM providers WHERE id = ?', [999]);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Provider not found' });
    });
});

describe('updateProviderById', () => {
    // Mock request object with valid provider data
    const reqValid = {
        params: { id: 1 },
        body: {
            name: 'Updated Provider',
            email: 'updated@example.com',
            phone: '1234567890',
            address: '123 Updated Street',
        },
    };

    // Mock request object with invalid ID parameter
    const reqInvalidId = {
        params: { id: 'invalid' }, // Invalid ID parameter
        body: {
            name: 'Updated Provider',
            email: 'updated@example.com',
            phone: '1234567890',
            address: '123 Updated Street',
        },
    };

    // Mock request object with missing required fields
    const reqMissingFields = {
        params: { id: 1 },
        body: {
            // Missing email, phone, and address
            name: 'Updated Provider',
        },
    };

    // Mock request object with email or phone already exists in other records
    const reqExistingEmail = {
        params: { id: 1 },
        body: {
            name: 'Updated Provider',
            email: 'existing@example.com', // Email already exists in other records
            phone: '1234567890',
            address: '123 Updated Street',
        },
    };

    const reqExistingPhone = {
        params: { id: 1 },
        body: {
            name: 'Updated Provider',
            email: 'updated@example.com',
            phone: 'existing phone', // Phone number already exists in other records
            address: '123 Updated Street',
        },
    };

    // Mock response object
    const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks(); // Clear mock calls before each test
    });

    // Test case for invalid ID parameter
    it('should return error for invalid ID parameter', async () => {
        await updateProviderById(reqInvalidId, res);

        expect(res.status).toHaveBeenCalledWith(400); // Should return status code 400
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Invalid ID parameter' });
    });

    // Test case for missing required fields
    it('should return error for missing required fields', async () => {
        await updateProviderById(reqMissingFields, res);

        expect(res.status).toHaveBeenCalledWith(400); // Should return status code 400
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'All fields are required' });
    });

    // Test case for provider not found
    it('should return error if provider not found', async () => {
        // Mocking an empty result for provider with given ID
        jest.spyOn(pool, 'query').mockResolvedValueOnce([[]]);

        await updateProviderById(reqValid, res);

        expect(res.status).toHaveBeenCalledWith(404); // Should return status code 404
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Provider not found' });
    });

    // Test case for internal server error
    it('should return internal server error', async () => {
        // Mocking an error while updating provider
        const errorMessage = 'Database connection error';
        jest.spyOn(console, 'error').mockImplementation(() => { });
        jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error(errorMessage));

        await updateProviderById(reqValid, res);

        expect(res.status).toHaveBeenCalledWith(500); // Should return status code 500
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Internal server error' });
        expect(console.error).toHaveBeenCalledWith('Error updating provider:', expect.any(Error));
    });
});

describe('deleteProviderById', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should delete provider for valid ID', async () => {
        // Mock request and response objects
        const req = { params: { id: 1 } }; // Replace with valid ID
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // Mock database query to return existing provider
        const mockExistingProvider = [{ id: 1, name: 'Provider 1' }]; // Replace with mock data
        pool.query.mockResolvedValueOnce(mockExistingProvider);

        // Mock database query to delete provider
        pool.query.mockResolvedValueOnce();

        await deleteProviderById(req, res);

        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM providers WHERE id = ?', [req.params.id]);
        expect(pool.query).toHaveBeenCalledWith('DELETE FROM providers WHERE id = ?', [req.params.id]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ status: true, message: 'Provider deleted successfully!' });
    });

    test('should return error for invalid ID (non-numeric)', async () => {
        // Mock request and response objects
        const req = { params: { id: 'abc' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await deleteProviderById(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Invalid ID parameter' });
    });

    test('should return error if provider has associated services', async () => {
        // Mock request and response objects
        const req = { params: { id: 1 } }; // Replace with valid ID
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // Mock database query to return existing provider
        const mockExistingProvider = [{ id: 1, name: 'Provider 1' }]; // Replace with mock data
        pool.query.mockResolvedValueOnce(mockExistingProvider);

        // Mock database query to throw error indicating associated services
        const error = { code: 'ER_ROW_IS_REFERENCED_2' };
        pool.query.mockRejectedValueOnce(error);

        await deleteProviderById(req, res);

        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM providers WHERE id = ?', [req.params.id]);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Cannot delete provider because it has associated services' });
    });

    test('should return error for internal server error', async () => {
        // Mock request and response objects
        const req = { params: { id: 1 } }; // Replace with valid ID
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // Mock database query to return existing provider
        const mockExistingProvider = [{ id: 1, name: 'Provider 1' }]; // Replace with mock data
        pool.query.mockResolvedValueOnce(mockExistingProvider);

        // Mock database query to throw internal server error
        const error = new Error('Internal server error');
        pool.query.mockRejectedValueOnce(error);

        await deleteProviderById(req, res);

        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM providers WHERE id = ?', [req.params.id]);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Internal server error' });
    });

    test('should return error for internal server error during deletion', async () => {
        // Mock request and response objects
        const req = { params: { id: 1 } }; // Replace with valid ID
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // Mock database query to return existing provider
        const mockExistingProvider = [{ id: 1, name: 'Provider 1' }]; // Replace with mock data
        pool.query.mockResolvedValueOnce(mockExistingProvider);

        // Mock database query to throw internal server error during deletion
        const error = new Error('Internal server error');
        pool.query.mockRejectedValueOnce(error);

        await deleteProviderById(req, res);

        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM providers WHERE id = ?', [req.params.id]);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Internal server error' });
    });
});

// After all test cases
afterEach(() => {
    jest.clearAllMocks();
});
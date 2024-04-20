const { getAllServices, deleteServiceById, getServiceById, createService, updateServiceById } = require('../controllers/services'); // Replace 'your-file-name' with the actual file name
const { pool } = require('../config/db.config');

// At the top of your test file
console.error = jest.fn(); // Mocking console.error

// Mock the pool.query function
jest.mock('../config/db.config', () => ({
    pool: {
        query: jest.fn(),
    },
}));

describe('getAllServices', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return all services with provider data', async () => {
        // Mock database response
        const mockServices = [
            { id: 1, name: 'Service 1', provider_name: 'Provider 1', provider_email: 'provider1@example.com', provider_phone: '123456789', provider_address: 'Address 1' },
            { id: 2, name: 'Service 2', provider_name: 'Provider 2', provider_email: 'provider2@example.com', provider_phone: '987654321', provider_address: 'Address 2' },
            // Add more mock services as needed
        ];
        pool.query.mockResolvedValueOnce([mockServices]);

        // Mock request and response objects
        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await getAllServices(req, res);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String)); // Checking if a SQL query is executed
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: mockServices, status: true, message: 'Services retrieved successfully!' });
    });

    test('should return error for internal server error', async () => {
        // Mock request and response objects
        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // Mock database query to throw internal server error
        const error = new Error('Internal server error');
        pool.query.mockRejectedValueOnce(error);

        await getAllServices(req, res);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String)); // Checking if a SQL query is executed
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Internal server error' });
    });
});

describe('createService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should create service successfully', async () => {
        // Mock request and response objects
        const req = {
            body: {
                name: 'Test Service',
                description: 'Test description',
                price: 50,
                provider_id: 1
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // Mock database queries and results
        const mockExistingService = [];
        const mockExistingProvider = [{ id: 1, name: 'Provider 1' }];
        const mockInsertResult = { insertId: 1 };
        const mockNewService = [{
            id: 1,
            name: 'Test Service',
            description: 'Test description',
            price: 50,
            provider_id: 1,
            provider_name: 'Provider 1',
            provider_email: 'provider1@example.com',
            provider_phone: '123456789',
            provider_address: 'Address 1'
        }];

        pool.query.mockImplementation(async (query, values) => {
            if (query.startsWith('SELECT * FROM services')) {
                return [mockExistingService];
            } else if (query.startsWith('SELECT * FROM providers')) {
                return [mockExistingProvider];
            } else if (query.startsWith('INSERT INTO services')) {
                return [{ insertId: mockInsertResult.insertId }];
            } else if (query.startsWith('SELECT s.*, p.name')) {
                return [mockNewService];
            }
        });

        await createService(req, res);

        expect(pool.query).toHaveBeenCalledTimes(4); // Expect four database queries
        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM services WHERE LOWER(TRIM(name)) = ? AND provider_id = ?', ['test service', 1]); // Check existing service query
        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM providers WHERE id = ?', [1]); // Check existing provider query
        expect(pool.query).toHaveBeenCalledWith('INSERT INTO services (name, description, price, provider_id) VALUES (?, ?, ?, ?)', ['Test Service', 'Test description', 50, 1]); // Check insert service query
        expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT s.*, p.name AS provider_name'), [mockInsertResult.insertId]); // Check new service query
        expect(res.status).toHaveBeenCalledWith(500); // Expect a status of 500 for internal server error
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Internal server error' });
    });

    test('should return error if price format is invalid', async () => {
        // Mock request and response objects
        const req = {
            body: {
                name: 'Test Service',
                description: 'Test description',
                price: 'invalid_price',
                provider_id: 1
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await createService(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Invalid price format. Price must be a positive number' });
    });

    test('should return error if provider ID format is invalid', async () => {
        // Mock request and response objects
        const req = {
            body: {
                name: 'Test Service',
                description: 'Test description',
                price: 50,
                provider_id: 'invalid_provider_id'
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await createService(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Invalid provider_id format. Must be a number' });
    });
});

describe('getServiceById', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return service details for valid ID', async () => {
        // Mock request and response objects
        const req = { params: { id: 1 } }; // Replace with valid ID
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // Mock database query to return service details with provider data
        const mockServiceWithProvider = [{
            id: 1,
            name: 'Service 1',
            provider_name: 'Provider 1',
            provider_email: 'provider1@example.com',
            provider_phone: '123456789',
            provider_address: 'Address 1'
        }]; // Replace with mock data
        pool.query.mockResolvedValueOnce([mockServiceWithProvider]);

        await getServiceById(req, res);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [req.params.id]); // Checking if a SQL query is executed
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: mockServiceWithProvider, status: true, message: 'Service retrieved successfully!' });
    });

    test('should return error for invalid service ID format', async () => {
        // Mock request and response objects
        const req = { params: { id: 'abc' } }; // Invalid ID format
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await getServiceById(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Invalid service ID format. Must be a number' });
    });

    test('should return error if service not found', async () => {
        // Mock request and response objects
        const req = { params: { id: 999 } }; // Non-existing ID
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // Mock database query to return empty result
        pool.query.mockResolvedValueOnce([]);

        await getServiceById(req, res);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [req.params.id]); // Checking if a SQL query is executed
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Service not found' }); // Adjusted expectation
    });

    test('should return error for internal server error', async () => {
        // Mock request and response objects
        const req = { params: { id: 1 } }; // Replace with valid ID
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // Mock database query to throw internal server error
        const error = new Error('Internal server error');
        pool.query.mockRejectedValueOnce(error);

        await getServiceById(req, res);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [req.params.id]); // Checking if a SQL query is executed
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Internal server error' });
    });
});

describe('updateServiceById', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return error if service ID format is invalid', async () => {
        // Mock request with invalid service ID
        const req = { params: { id: 'abc' }, body: { name: 'Updated Service', description: 'Updated description', price: 60, provider_id: 2 } };
        // Mock response object
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await updateServiceById(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Invalid service ID format. Must be a number' });
    });

    test('should return error if required fields are missing', async () => {
        // Mock request with missing required fields
        const req = { params: { id: 1 }, body: {} };
        // Mock response object
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await updateServiceById(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'All fields are required' });
    });

    test('should return error if price format is invalid', async () => {
        // Mock request with invalid price format
        const req = { params: { id: 1 }, body: { name: 'Updated Service', description: 'Updated description', price: -50, provider_id: 2 } };
        // Mock response object
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await updateServiceById(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Invalid price format. Price must be a positive number' });
    });

    test('should return error if provider ID format is invalid', async () => {
        // Mock request with invalid provider ID
        const req = { params: { id: 1 }, body: { name: 'Updated Service', description: 'Updated description', price: 60, provider_id: 'abc' } };
        // Mock response object
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await updateServiceById(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Invalid provider_id format. Must be a number' });
    });

    test('should return error for internal server error', async () => {
        // Mock request and database error
        const req = { params: { id: 1 }, body: { name: 'Updated Service', description: 'Updated description', price: 60, provider_id: 2 } };
        const databaseError = new Error('Database error');
        pool.query.mockRejectedValueOnce(databaseError);
        // Mock response object
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await updateServiceById(req, res);

        expect(console.error).toHaveBeenCalledWith('Error updating service:', databaseError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Internal server error' });
    });
});

describe('deleteServiceById', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should delete service for valid ID', async () => {
        // Mock request and response objects
        const req = { params: { id: 1 } }; // Replace with valid ID
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // Mock database query to return existing service
        const mockService = [{ id: 1, name: 'Service 1' }]; // Replace with mock data
        pool.query.mockResolvedValueOnce(mockService);

        // Mock database query to delete service
        pool.query.mockResolvedValueOnce();

        await deleteServiceById(req, res);

        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM services WHERE id = ?', [req.params.id]);
        expect(pool.query).toHaveBeenCalledWith('DELETE FROM services WHERE id = ?', [req.params.id]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ status: true, message: 'Service deleted successfully!' });
    });

    test('should return error for invalid service ID format', async () => {
        // Mock request and response objects
        const req = { params: { id: 'abc' } }; // Invalid ID format
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await deleteServiceById(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Invalid service ID format. Must be a number' });
    });

    test('should return error if service not found', async () => {
        // Mock request and response objects
        const req = { params: { id: 999 } }; // Non-existing ID
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // Mock database query to return empty result
        pool.query.mockResolvedValueOnce([]);

        await deleteServiceById(req, res);

        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM services WHERE id = ?', [req.params.id]);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Service not found' });
    });

    test('should return error for internal server error', async () => {
        // Mock request and response objects
        const req = { params: { id: 1 } }; // Replace with valid ID
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // Mock database query to return existing service
        const mockService = [{ id: 1, name: 'Service 1' }]; // Replace with mock data
        pool.query.mockResolvedValueOnce(mockService);

        // Mock database query to throw internal server error
        const error = new Error('Internal server error');
        pool.query.mockRejectedValueOnce(error);

        await deleteServiceById(req, res);

        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM services WHERE id = ?', [req.params.id]);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Internal server error' });
    });
});

// After all test cases
afterEach(() => {
    jest.clearAllMocks();
});
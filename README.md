# Marketplace-api

# Description

==> We are building a marketplace platform that connects local service providers with customers in need of their services. We would like you to build a simple REST API for managing service providers and their services.

# Installation

1. Clone the repository:

==> git clone https://github.com/shyambhalodia/marketplace-api.git

2. Install dependencies:

==> cd marketplace-api
==> npm install

3. Set up your database:

==> Make sure you have MySQL installed and running.
==> Create a new database for your API.
==> If the database, providers, and services tables do not exist, they will be created automatically when you start the nodeJs server.

4. Configure environment variables:

==> Create a .env file in the root directory of your project.
==> Define environment variables such as database connection details. For example:

    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=password
    DB_NAME=your_database_name

# Usage

1. Start the API:

==> npm start
==> This will start your API server. It will automatically create the necessary tables in your database if they do not exist.

2. Use the API:

==> Use your favorite API testing tool (e.g., Postman) to send requests to your API endpoints.
==> You can find the Postman collection for testing the API [here](MarketPlace.postman_collection.json).
==> Your API endpoints should be accessible at http://localhost:3000.

# Testing

1. To run tests for the API:

==> npm test
==> This command will execute the test cases defined in your test files using Jest. Make sure to configure your test environment and mocks properly for accurate testing.

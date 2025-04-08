# Charity Shelter API

## Overview

The Charity Shelter API is a secure RESTful backend service built with Deno and
Oak framework. It provides a comprehensive management system for charity
organizations, enabling them to manage their digital presence, internal
operations, and administrative functions through a structured API.

## Purpose

This API serves as the backend infrastructure for charity shelter organizations
to:

- Manage their online content and organizational information
- Maintain secure administrative access for staff members
- Publish and manage posts/news updates
- Track multiple organization locations
- Implement robust authentication and authorization

## Core Features

### Authentication System

- **JWT-based Authentication**: Secure token-based authentication system
- **Token Blacklisting**: Ability to invalidate tokens on logout for enhanced
  security
- **Password Management**: Secure password hashing and change functionality

### User Management

- **Administrative User Controls**: Create, read, update, and delete admin users
- **Role-based Access**: Support for different user roles and permissions
- **Audit Logging**: Track user activities and security events

### Content Management

- **Posts System**: Create, update, publish/unpublish, and delete posts/news
  items
- **Content Searching**: Search functionality for posts based on title, content,
  or tags
- **Content Sanitization**: Automatic HTML sanitization for security

### Organization Management

- **Organization Profile**: Store and update core organization information
- **Multi-location Support**: Manage multiple physical locations/branches
- **Contact Information**: Store addresses, phone numbers, emails for each
  location

### Security Features

- **API Key Authentication**: Two-tier authentication with API keys and JWT
  tokens
- **Rate Limiting**: Protection against brute force and DDoS attacks
- **Security Headers**: Implementation of web security best practices
- **CORS Protection**: Configurable cross-origin resource sharing
- **Request Validation**: Input validation and sanitization
- **Error Handling**: Comprehensive error management and logging

### Database

- **Deno KV Integration**: Uses Deno's built-in key-value database
- **Structured Data Collections**: Organized storage for users, posts,
  locations, etc.
- **Data Consistency**: Ensures data integrity across operations

## Technical Implementation

- **Modern Stack**: Built with Deno runtime and Oak web framework
- **TypeScript**: Type-safe implementation for better code quality
- **Modular Architecture**: Well-organized code structure with separation of
  concerns
- **Environment Configuration**: Flexible configuration via environment
  variables
- **Development Tools**: Support for local development and testing

## API Design

- **RESTful Endpoints**: Follows REST principles for intuitive API design
- **JSON Communication**: Standard JSON request/response format
- **Stateless Operation**: Maintains RESTful stateless operation
- **Comprehensive Documentation**: Well-documented API endpoints via
  Swagger/OpenAPI

## Getting Started

### Prerequisites

- [Deno](https://deno.land/) v1.32.0 or higher
- A text editor (VS Code recommended with Deno extension)

### Local Development

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd charity-shelter-api
   ```

2. Create a `.env` file based on `.env.example`
   ```bash
   cp .env.example .env
   ```

3. Run the development server
   ```bash
   deno task dev
   ```

4. Access the API documentation at http://localhost:8000/api-docs

### Available Tasks

The project includes several predefined tasks in `deno.json`:

- `deno task dev` - Run the development server with hot-reload
- `deno task seed` - Populate the database with sample data
- `deno task export` - Export data to CSV format
- `deno task import` - Import data from CSV files
- `deno task init` - Initialize the database with admin user (useful for
  deployment)

## Deployment

### Deploying to Deno Deploy

1. Fork or clone this repository
2. Sign up for [Deno Deploy](https://deno.com/deploy)
3. Create a new project and link your repository
4. Set the entry point to `main.ts`
5. (Optional) Configure environment variables:
   - `API_KEY`: Custom API key for authentication
   - `JWT_SECRET`: Secret key for JWT token generation
   - `DEFAULT_ADMIN_PASSWORD`: Custom password for the default admin user

### Default Admin User

On first deployment, the application automatically creates a default admin user:

- **Email**: admin@charityshelter.org
- **Password**: admin123 (or the value set in `DEFAULT_ADMIN_PASSWORD`
  environment variable)
- **API Key**: Automatically generated (check deployment logs)

**IMPORTANT**: For security reasons, change the default admin password
immediately after first login.

### Manual Database Initialization

If needed, you can manually initialize the database with:

```bash
deno task init
```

This will create the default admin user if no users exist in the database.

## Project Structure

```
charity-shelter-api/
├── .env.example        # Example environment variables
├── db/                 # Database connection and utilities
├── middleware/         # Application middleware
├── public/             # Static files
├── routes/             # API routes
├── scripts/            # Utility scripts
├── services/           # Business logic services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── deno.json           # Deno configuration
├── main.ts             # Application entry point
└── readme.md           # This documentation
```

## Security Considerations

- All passwords are securely hashed using SHA-256 with unique salts
- JWT tokens are signed with HMAC-SHA512
- API endpoints are protected with rate limiting
- Tokens are blacklisted on logout
- All user actions are logged for audit purposes

---

This API provides a solid foundation for charity organizations to build their
digital presence while maintaining security, scalability, and ease of use.

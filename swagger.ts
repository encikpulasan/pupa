import { Router, send } from "https://deno.land/x/oak@v12.5.0/mod.ts";

const router = new Router();

// ReDoc HTML template
const redocUi = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Charity Shelter API Documentation</title>
    <script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            height: 100vh;
        }
        #redoc-container {
            height: 100%;
        }
    </style>
</head>
<body>
    <div id="redoc-container"></div>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const options = {
                hideDownloadButton: false,
                expandResponses: "all",
                pathInMiddlePanel: true,
                showExtensions: true,
                sortPropsAlphabetically: true,
                requiredPropsFirst: true,
                scrollYOffset: 50,
                noAutoAuth: false,
                disableSearch: false,
                expandSingleSchemaField: true,
                onlyRequiredInSamples: false
            };

            // Initialize Redoc with a relative URL
            Redoc.init(
                '/api-docs.json', 
                options, 
                document.getElementById('redoc-container')
            ).catch(function(error) {
                console.error('ReDoc initialization error:', error);
                document.getElementById('redoc-container').innerHTML = 
                    '<div style="padding: 20px; color: red;"><h2>Error loading API documentation</h2><p>' + error.message + '</p></div>';
            });
        });
    </script>
</body>
</html>
`;

// OpenAPI specification
const apiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Charity Shelter API",
    version: "1.0.0",
    description: "API documentation for the Charity Shelter platform",
    contact: {
      name: "API Support",
      email: "support@charityshelter.com",
      url: "https://charityshelter.com/support",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "http://localhost:8000",
      description: "Local development server",
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
      },
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: {
            type: "string",
            description: "Error message",
          },
        },
      },
      Organization: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Organization ID",
          },
          name: {
            type: "string",
            description: "Organization name",
          },
          description: {
            type: "string",
            description: "Organization description",
          },
          type: {
            type: "string",
            description: "Organization type (e.g., shelter, food-bank)",
          },
          contactInfo: {
            type: "object",
            properties: {
              phone: {
                type: "string",
                description: "Contact phone number",
              },
              email: {
                type: "string",
                description: "Contact email address",
              },
              address: {
                type: "string",
                description: "Contact address",
              },
            },
          },
          website: {
            type: "string",
            description: "Organization website URL",
          },
          logo: {
            type: "string",
            description: "URL to organization logo",
          },
          status: {
            type: "string",
            description: "Organization status",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Creation timestamp",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Last update timestamp",
          },
        },
      },
      PublicOrganization: {
        type: "object",
        properties: {
          id: {
            type: "string",
          },
          name: {
            type: "string",
          },
          description: {
            type: "string",
          },
          type: {
            type: "string",
          },
          contactInfo: {
            type: "object",
            properties: {
              phone: {
                type: "string",
              },
              email: {
                type: "string",
              },
              address: {
                type: "string",
              },
            },
          },
          website: {
            type: "string",
          },
          logo: {
            type: "string",
          },
          branches: {
            type: "array",
            items: {
              $ref: "#/components/schemas/PublicBranch",
            },
          },
        },
      },
      CreateOrganizationRequest: {
        type: "object",
        required: ["name", "description", "type", "contactInfo"],
        properties: {
          name: {
            type: "string",
          },
          description: {
            type: "string",
          },
          type: {
            type: "string",
          },
          contactInfo: {
            type: "object",
            properties: {
              phone: {
                type: "string",
              },
              email: {
                type: "string",
              },
              address: {
                type: "string",
              },
            },
          },
          website: {
            type: "string",
          },
          logo: {
            type: "string",
          },
          branches: {
            type: "array",
            items: {
              $ref: "#/components/schemas/CreateBranchRequest",
            },
          },
        },
      },
      UpdateOrganizationRequest: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
          description: {
            type: "string",
          },
          type: {
            type: "string",
          },
          contactInfo: {
            type: "object",
            properties: {
              phone: {
                type: "string",
              },
              email: {
                type: "string",
              },
              address: {
                type: "string",
              },
            },
          },
          website: {
            type: "string",
          },
          logo: {
            type: "string",
          },
        },
      },
      Branch: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Branch ID",
          },
          organizationId: {
            type: "string",
            description: "ID of the parent organization",
          },
          name: {
            type: "string",
            description: "Branch name",
          },
          address: {
            type: "string",
            description: "Street address",
          },
          city: {
            type: "string",
            description: "City",
          },
          state: {
            type: "string",
            description: "State/Province",
          },
          country: {
            type: "string",
            description: "Country",
          },
          postalCode: {
            type: "string",
            description: "Postal/ZIP code",
          },
          phone: {
            type: "string",
            description: "Contact phone number",
          },
          email: {
            type: "string",
            description: "Contact email address",
          },
          isMainBranch: {
            type: "boolean",
            description: "Whether this is the main branch",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Creation timestamp",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Last update timestamp",
          },
        },
      },
      PublicBranch: {
        type: "object",
        properties: {
          id: {
            type: "string",
          },
          name: {
            type: "string",
          },
          address: {
            type: "string",
          },
          city: {
            type: "string",
          },
          state: {
            type: "string",
          },
          country: {
            type: "string",
          },
          postalCode: {
            type: "string",
          },
          phone: {
            type: "string",
          },
          email: {
            type: "string",
          },
          isMainBranch: {
            type: "boolean",
          },
        },
      },
      CreateBranchRequest: {
        type: "object",
        required: ["name", "address", "city", "state", "country", "postalCode"],
        properties: {
          name: {
            type: "string",
          },
          address: {
            type: "string",
          },
          city: {
            type: "string",
          },
          state: {
            type: "string",
          },
          country: {
            type: "string",
          },
          postalCode: {
            type: "string",
          },
          phone: {
            type: "string",
          },
          email: {
            type: "string",
          },
          isMainBranch: {
            type: "boolean",
          },
        },
      },
      UpdateBranchRequest: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
          address: {
            type: "string",
          },
          city: {
            type: "string",
          },
          state: {
            type: "string",
          },
          country: {
            type: "string",
          },
          postalCode: {
            type: "string",
          },
          phone: {
            type: "string",
          },
          email: {
            type: "string",
          },
          isMainBranch: {
            type: "boolean",
          },
        },
      },
    },
  },
  security: [
    {
      ApiKeyAuth: [],
      BearerAuth: [],
    },
  ],
  paths: {
    "/health": {
      get: {
        summary: "Health Check",
        description: "Check if the API is healthy and running",
        responses: {
          "200": {
            description: "API is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                      example: "healthy",
                    },
                    version: {
                      type: "string",
                      example: "1.0.0",
                    },
                    uptime: {
                      type: "number",
                      example: 1234,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        summary: "User Login",
        description: "Authenticate a user and receive a JWT token",
        security: [
          {
            ApiKeyAuth: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "admin@charityshelter.com",
                  },
                  password: {
                    type: "string",
                    format: "password",
                    example: "securePassword123",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: {
                      type: "string",
                      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    },
                    user: {
                      type: "object",
                      properties: {
                        id: {
                          type: "string",
                          example: "user123",
                        },
                        email: {
                          type: "string",
                          example: "admin@charityshelter.com",
                        },
                        role: {
                          type: "string",
                          example: "admin",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Bad Request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Missing required fields",
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Invalid credentials",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        summary: "User Logout",
        description: "Invalidate current JWT token",
        security: [
          {
            ApiKeyAuth: [],
            BearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Logout successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Successfully logged out",
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Unauthorized",
                    },
                    details: {
                      type: "string",
                      example: "Missing or invalid authorization token",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/admin/posts": {
      get: {
        summary: "Get All Posts",
        description: "Retrieve a list of all posts (admin only)",
        security: [
          {
            ApiKeyAuth: [],
            BearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "List of posts",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                        example: "post123",
                      },
                      title: {
                        type: "string",
                        example: "New Shelter Opening",
                      },
                      content: {
                        type: "string",
                        example: "We're excited to announce...",
                      },
                      isPublished: {
                        type: "boolean",
                        example: true,
                      },
                      createdAt: {
                        type: "string",
                        format: "date-time",
                        example: "2023-09-15T14:30:00Z",
                      },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Unauthorized",
                    },
                    details: {
                      type: "string",
                      example: "Missing or invalid authorization token",
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create Post",
        description: "Create a new post (admin only)",
        security: [
          {
            ApiKeyAuth: [],
            BearerAuth: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "content", "type"],
                properties: {
                  title: {
                    type: "string",
                    example: "New Shelter Opening",
                  },
                  subtitle: {
                    type: "string",
                    example: "Downtown Location Opening Next Month",
                  },
                  content: {
                    type: "string",
                    example: "We're excited to announce...",
                  },
                  summary: {
                    type: "string",
                    example: "Brief summary of the new shelter opening",
                  },
                  type: {
                    type: "string",
                    enum: ["article", "news", "announcement"],
                    example: "news",
                  },
                  imageUrl: {
                    type: "string",
                    example: "https://example.com/image.jpg",
                  },
                  additionalImages: {
                    type: "string",
                    example:
                      '["https://example.com/image2.jpg", "https://example.com/image3.jpg"]',
                  },
                  author: {
                    type: "string",
                    example: "Jane Doe",
                  },
                  category: {
                    type: "string",
                    example: "Announcements",
                  },
                  tags: {
                    type: "string",
                    example: "news,shelter,opening",
                  },
                  isPublished: {
                    type: "boolean",
                    example: true,
                  },
                  metaDescription: {
                    type: "string",
                    example: "New downtown shelter location opening next month",
                  },
                  status: {
                    type: "string",
                    enum: ["draft", "published", "archived"],
                    example: "published",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Post created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      example: "post123",
                    },
                    title: {
                      type: "string",
                      example: "New Shelter Opening",
                    },
                    type: {
                      type: "string",
                      enum: ["article", "news", "announcement"],
                      example: "news",
                    },
                    content: {
                      type: "string",
                      example: "We're excited to announce...",
                    },
                    isPublished: {
                      type: "boolean",
                      example: true,
                    },
                    createdAt: {
                      type: "string",
                      format: "date-time",
                      example: "2023-09-15T14:30:00Z",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Bad Request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Validation failed",
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Unauthorized",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/admin/posts/{id}": {
      get: {
        summary: "Get Post by ID",
        description: "Retrieve a specific post by its ID (admin only)",
        security: [
          {
            ApiKeyAuth: [],
            BearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
            description: "Post ID",
          },
        ],
        responses: {
          "200": {
            description: "Post details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      example: "post123",
                    },
                    title: {
                      type: "string",
                      example: "New Shelter Opening",
                    },
                    content: {
                      type: "string",
                      example: "We're excited to announce...",
                    },
                    isPublished: {
                      type: "boolean",
                      example: true,
                    },
                    createdAt: {
                      type: "string",
                      format: "date-time",
                      example: "2023-09-15T14:30:00Z",
                    },
                    updatedAt: {
                      type: "string",
                      format: "date-time",
                      example: "2023-09-15T14:30:00Z",
                    },
                  },
                },
              },
            },
          },
          "404": {
            description: "Not Found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Post not found",
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Unauthorized",
                    },
                    details: {
                      type: "string",
                      example: "Missing or invalid authorization token",
                    },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        summary: "Update Post",
        description: "Update an existing post (admin only)",
        security: [
          {
            ApiKeyAuth: [],
            BearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
            description: "Post ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    example: "Updated Title",
                  },
                  subtitle: {
                    type: "string",
                    example: "Updated Subtitle",
                  },
                  content: {
                    type: "string",
                    example: "Updated content...",
                  },
                  summary: {
                    type: "string",
                    example: "Updated summary of post",
                  },
                  type: {
                    type: "string",
                    enum: ["article", "news", "announcement"],
                    example: "article",
                  },
                  imageUrl: {
                    type: "string",
                    example: "https://example.com/new-image.jpg",
                  },
                  additionalImages: {
                    type: "string",
                    example:
                      '["https://example.com/image4.jpg", "https://example.com/image5.jpg"]',
                  },
                  author: {
                    type: "string",
                    example: "John Smith",
                  },
                  category: {
                    type: "string",
                    example: "Updates",
                  },
                  tags: {
                    type: "string",
                    example: "news,update",
                  },
                  isPublished: {
                    type: "boolean",
                    example: true,
                  },
                  metaDescription: {
                    type: "string",
                    example: "Updated meta description",
                  },
                  status: {
                    type: "string",
                    enum: ["draft", "published", "archived"],
                    example: "published",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Post updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      example: "post123",
                    },
                    title: {
                      type: "string",
                      example: "Updated Title",
                    },
                    content: {
                      type: "string",
                      example: "Updated content...",
                    },
                    isPublished: {
                      type: "boolean",
                      example: true,
                    },
                    updatedAt: {
                      type: "string",
                      format: "date-time",
                      example: "2023-09-15T14:30:00Z",
                    },
                  },
                },
              },
            },
          },
          "404": {
            description: "Not Found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Post not found",
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Unauthorized",
                    },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        summary: "Delete Post",
        description: "Delete a post (admin only)",
        security: [
          {
            ApiKeyAuth: [],
            BearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
            description: "Post ID",
          },
        ],
        responses: {
          "204": {
            description: "Post deleted successfully",
          },
          "404": {
            description: "Not Found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Post not found",
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Unauthorized",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/admin/analytics/summary": {
      get: {
        summary: "Get API Usage Summary",
        description: "Get overall API usage statistics (admin only)",
        security: [
          {
            ApiKeyAuth: [],
            BearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "API usage summary",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    totalRequests: {
                      type: "number",
                      example: 1000,
                    },
                    totalEndpoints: {
                      type: "number",
                      example: 10,
                    },
                    averageResponseTime: {
                      type: "number",
                      example: 150,
                    },
                    overallErrorRate: {
                      type: "number",
                      example: 0.05,
                    },
                    overallSuccessRate: {
                      type: "number",
                      example: 0.95,
                    },
                    mostUsedEndpoints: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          endpoint: {
                            type: "string",
                            example: "/api/v1/posts",
                          },
                          calls: {
                            type: "number",
                            example: 500,
                          },
                        },
                      },
                    },
                    slowestEndpoints: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          endpoint: {
                            type: "string",
                            example: "/api/v1/analytics",
                          },
                          averageTime: {
                            type: "number",
                            example: 300,
                          },
                        },
                      },
                    },
                    errorProneEndpoints: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          endpoint: {
                            type: "string",
                            example: "/api/v1/admin/users",
                          },
                          errorRate: {
                            type: "number",
                            example: 0.1,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Unauthorized",
                    },
                    details: {
                      type: "string",
                      example: "Missing or invalid authorization token",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/organizations": {
      get: {
        summary: "List all organizations",
        description:
          "Retrieves a list of all organizations with their branches",
        security: [{ apiKey: [] }],
        responses: {
          "200": {
            description: "List of organizations",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/PublicOrganization",
                  },
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create a new organization",
        description: "Creates a new organization with optional branches",
        security: [{ apiKey: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateOrganizationRequest",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Organization created successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Organization",
                },
              },
            },
          },
          "400": {
            description: "Invalid request data",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/organizations/{id}": {
      get: {
        summary: "Get organization by ID",
        description: "Retrieves a specific organization by its ID",
        security: [{ apiKey: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
            description: "Organization ID",
          },
        ],
        responses: {
          "200": {
            description: "Organization details",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PublicOrganization",
                },
              },
            },
          },
          "404": {
            description: "Organization not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
      put: {
        summary: "Update organization",
        description: "Updates an existing organization",
        security: [{ apiKey: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
            description: "Organization ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UpdateOrganizationRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Organization updated successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Organization",
                },
              },
            },
          },
          "400": {
            description: "Invalid request data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Validation failed",
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Unauthorized",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/admin/analytics/endpoints": {
      get: {
        summary: "Get Multiple Endpoints Metrics",
        description: "Returns metrics for multiple endpoints",
        security: [
          {
            ApiKeyAuth: [],
            BearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "endpoints",
            in: "query",
            required: true,
            schema: {
              type: "string",
            },
            description: "Comma-separated list of endpoints",
          },
          {
            name: "timeframe",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["minute", "hour", "day", "overall"],
              default: "hour",
            },
            description: "Time frame for metrics",
          },
        ],
        responses: {
          "200": {
            description: "Multiple endpoints metrics",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      endpoint: {
                        type: "string",
                        example: "/api/v1/auth/login",
                      },
                      timeframe: {
                        type: "string",
                        example: "hour",
                      },
                      totalRequests: {
                        type: "number",
                        example: 100,
                      },
                      averageResponseTime: {
                        type: "number",
                        example: 150,
                      },
                      errorRate: {
                        type: "number",
                        example: 0.05,
                      },
                      successRate: {
                        type: "number",
                        example: 0.95,
                      },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Unauthorized",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/admin/analytics/rate-limits/{apiKey}": {
      get: {
        summary: "Get API Key Rate Limit Status",
        description: "Returns rate limit status for an API key",
        security: [
          {
            ApiKeyAuth: [],
            BearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "apiKey",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
            description: "API Key to check",
          },
        ],
        responses: {
          "200": {
            description: "Rate limit status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    apiKey: {
                      type: "string",
                      example: "api_key_123",
                    },
                    currentUsage: {
                      type: "number",
                      example: 45,
                    },
                    limit: {
                      type: "number",
                      example: 100,
                    },
                    resetTime: {
                      type: "string",
                      format: "date-time",
                      example: "2023-09-15T15:30:00Z",
                    },
                    remaining: {
                      type: "number",
                      example: 55,
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Unauthorized",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/analytics/view": {
      post: {
        summary: "Track Post View",
        description: "Track a view event for a post",
        security: [
          {
            ApiKeyAuth: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["postId", "sessionId"],
                properties: {
                  postId: {
                    type: "string",
                    example: "post123",
                  },
                  sessionId: {
                    type: "string",
                    example: "session456",
                  },
                  referrer: {
                    type: "string",
                    example: "https://example.com",
                  },
                  userAgent: {
                    type: "string",
                    example:
                      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "View tracked successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "View tracked successfully",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Bad Request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Validation failed",
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "API Key required",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/analytics/posts/{id}": {
      get: {
        summary: "Get Post Analytics",
        description: "Get analytics data for a specific post",
        security: [
          {
            ApiKeyAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
            description: "Post ID",
          },
        ],
        responses: {
          "200": {
            description: "Post analytics data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    postId: {
                      type: "string",
                      example: "post123",
                    },
                    totalViews: {
                      type: "number",
                      example: 1000,
                    },
                    uniqueViews: {
                      type: "number",
                      example: 800,
                    },
                    averageTimeOnPage: {
                      type: "number",
                      example: 120,
                    },
                    bounceRate: {
                      type: "number",
                      example: 0.3,
                    },
                    referrers: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          source: {
                            type: "string",
                            example: "https://example.com",
                          },
                          count: {
                            type: "number",
                            example: 100,
                          },
                        },
                      },
                    },
                    userAgents: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          browser: {
                            type: "string",
                            example: "Chrome",
                          },
                          count: {
                            type: "number",
                            example: 500,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "404": {
            description: "Not Found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Post not found",
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "API Key required",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/posts": {
      get: {
        summary: "Get All Public Posts",
        description: "Retrieve a list of all published posts (public)",
        security: [
          {
            ApiKeyAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "List of published posts",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                        example: "post123",
                      },
                      title: {
                        type: "string",
                        example: "New Shelter Opening",
                      },
                      subtitle: {
                        type: "string",
                        example: "Downtown Location Opening Next Month",
                      },
                      summary: {
                        type: "string",
                        example: "Brief summary of the new shelter opening",
                      },
                      content: {
                        type: "string",
                        example: "We're excited to announce...",
                      },
                      type: {
                        type: "string",
                        enum: ["article", "news", "announcement"],
                        example: "news",
                      },
                      imageUrl: {
                        type: "string",
                        example: "https://example.com/image.jpg",
                      },
                      author: {
                        type: "string",
                        example: "Jane Doe",
                      },
                      category: {
                        type: "string",
                        example: "Announcements",
                      },
                      tags: {
                        type: "string",
                        example: "news,shelter,opening",
                      },
                      createdAt: {
                        type: "string",
                        format: "date-time",
                        example: "2023-09-15T14:30:00Z",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/posts/{id}": {
      get: {
        summary: "Get Public Post by ID",
        description: "Retrieve a specific published post by its ID (public)",
        security: [
          {
            ApiKeyAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
            description: "Post ID",
          },
        ],
        responses: {
          "200": {
            description: "Post details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      example: "post123",
                    },
                    title: {
                      type: "string",
                      example: "New Shelter Opening",
                    },
                    subtitle: {
                      type: "string",
                      example: "Downtown Location Opening Next Month",
                    },
                    summary: {
                      type: "string",
                      example: "Brief summary of the new shelter opening",
                    },
                    content: {
                      type: "string",
                      example: "We're excited to announce...",
                    },
                    type: {
                      type: "string",
                      enum: ["article", "news", "announcement"],
                      example: "news",
                    },
                    imageUrl: {
                      type: "string",
                      example: "https://example.com/image.jpg",
                    },
                    author: {
                      type: "string",
                      example: "Jane Doe",
                    },
                    category: {
                      type: "string",
                      example: "Announcements",
                    },
                    tags: {
                      type: "string",
                      example: "news,shelter,opening",
                    },
                    createdAt: {
                      type: "string",
                      format: "date-time",
                      example: "2023-09-15T14:30:00Z",
                    },
                  },
                },
              },
            },
          },
          "404": {
            description: "Not Found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Post not found",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/posts/search/{term}": {
      get: {
        summary: "Search Public Posts",
        description:
          "Search for published posts by title, content, tags, or type (public)",
        security: [
          {
            ApiKeyAuth: [],
          },
        ],
        parameters: [
          {
            name: "term",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
            description: "Search term",
          },
        ],
        responses: {
          "200": {
            description: "Search results",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                        example: "post123",
                      },
                      title: {
                        type: "string",
                        example: "New Shelter Opening",
                      },
                      type: {
                        type: "string",
                        enum: ["article", "news", "announcement"],
                        example: "news",
                      },
                      summary: {
                        type: "string",
                        example: "Brief summary of the new shelter opening",
                      },
                      createdAt: {
                        type: "string",
                        format: "date-time",
                        example: "2023-09-15T14:30:00Z",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/posts/type/{type}": {
      get: {
        summary: "Get Posts by Type",
        description:
          "Get published posts by type (article, news, announcement)",
        security: [
          {
            ApiKeyAuth: [],
          },
        ],
        parameters: [
          {
            name: "type",
            in: "path",
            required: true,
            schema: {
              type: "string",
              enum: ["article", "news", "announcement"],
            },
            description: "Post type (article, news, announcement)",
          },
        ],
        responses: {
          "200": {
            description: "List of posts of the specified type",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                        example: "post123",
                      },
                      title: {
                        type: "string",
                        example: "New Shelter Opening",
                      },
                      type: {
                        type: "string",
                        enum: ["article", "news", "announcement"],
                        example: "news",
                      },
                      summary: {
                        type: "string",
                        example: "Brief summary of the new shelter opening",
                      },
                      createdAt: {
                        type: "string",
                        format: "date-time",
                        example: "2023-09-15T14:30:00Z",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/admin/dashboard": {
      get: {
        summary: "Get Dashboard Analytics",
        description:
          "Returns comprehensive analytics data for the admin dashboard",
        security: [
          {
            ApiKeyAuth: [],
            BearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Dashboard analytics data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    userStats: {
                      type: "object",
                      properties: {
                        total: { type: "number" },
                        change: { type: "number" },
                        active: { type: "number" },
                        new: { type: "number" },
                      },
                    },
                    postStats: {
                      type: "object",
                      properties: {
                        total: { type: "number" },
                        change: { type: "number" },
                        published: { type: "number" },
                        drafts: { type: "number" },
                        popular: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              title: { type: "string" },
                              views: { type: "number" },
                            },
                          },
                        },
                      },
                    },
                    locationStats: {
                      type: "object",
                      properties: {
                        total: { type: "number" },
                        active: { type: "number" },
                        inactive: { type: "number" },
                      },
                    },
                    requestStats: {
                      type: "object",
                      properties: {
                        total: { type: "number" },
                        change: { type: "number" },
                        byEndpoint: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              endpoint: { type: "string" },
                              count: { type: "number" },
                            },
                          },
                        },
                      },
                    },
                    recentActivity: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          type: { type: "string" },
                          user: { type: "string" },
                          action: { type: "string" },
                          timestamp: { type: "string", format: "date-time" },
                        },
                      },
                    },
                    lastUpdated: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized - Invalid or missing authentication",
          },
          "500": {
            description: "Internal server error",
          },
        },
      },
    },
  },
};

// Routes
router.get("/api-docs", (ctx) => {
  ctx.response.headers.set("Content-Type", "text/html");
  ctx.response.body = redocUi;
});

// Serve static files for ReDoc
router.get("/redoc/:file", async (ctx) => {
  const file = ctx.params.file;
  try {
    await send(ctx, file, {
      root: `${Deno.cwd()}/public/redoc`,
    });
  } catch (error) {
    console.error(`Error serving static file: ${file}`, error);
    ctx.response.status = 404;
    ctx.response.body = "Not found";
  }
});

// Serve OpenAPI specification
router.get("/api-docs.json", (ctx) => {
  try {
    // Set headers for proper access
    ctx.response.headers.set("Content-Type", "application/json");
    ctx.response.headers.set("Access-Control-Allow-Origin", "*");
    ctx.response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    ctx.response.headers.set("Cache-Control", "no-cache");

    // Serve the API spec
    ctx.response.body = apiSpec;
    console.log("Served OpenAPI spec successfully");
  } catch (error) {
    console.error("Error serving OpenAPI spec:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to serve API specification" };
  }
});

export default router;

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
                onlyRequiredInSamples: false,
                theme: {
                    sidebar: {
                        width: '300px'
                    }
                },
                menuToggle: true,
                hideHostname: false,
                nativeScrollbars: true,
                hideLoading: false,
                jsonSampleExpandLevel: 2,
                groupTagsBy: 'tag',
                sideNavStyle: 'path-to-tag',
                tagGroups: [
                    {
                        name: "Core System",
                        tags: ["system", "test"]
                    },
                    {
                        name: "Authentication",
                        tags: ["auth"]
                    },
                    {
                        name: "Content Management",
                        tags: ["posts", "public-posts"]
                    },
                    {
                        name: "Organizations",
                        tags: ["organizations"]
                    },
                    {
                        name: "Patrons",
                        tags: ["patrons", "public-patrons"]
                    },
                    {
                        name: "Bookings",
                        tags: ["bookings", "public-bookings"]
                    },
                    {
                        name: "Donations",
                        tags: ["donations"]
                    },
                    {
                        name: "Roles & Permissions",
                        tags: ["roles"]
                    },
                    {
                        name: "Admin & Analytics",
                        tags: ["admin", "analytics", "dashboard", "users"]
                    }
                ]
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
  tags: [
    {
      name: "system",
      description: "System health and status operations",
    },
    {
      name: "auth",
      description: "Authentication operations for user login and logout",
    },
    {
      name: "posts",
      description: "Operations for managing content posts (admin access)",
    },
    {
      name: "public-posts",
      description: "Public endpoints for accessing published content",
    },
    {
      name: "organizations",
      description: "Operations for charity organizations and their branches",
    },
    {
      name: "analytics",
      description: "Analytics and tracking operations",
    },
    {
      name: "admin",
      description: "Administrative operations requiring full access privileges",
    },
    {
      name: "dashboard",
      description: "Admin dashboard data and metrics",
    },
    {
      name: "patrons",
      description:
        "Operations for managing external organization representatives",
    },
    {
      name: "public-patrons",
      description: "Public endpoints for patron registration and management",
    },
    {
      name: "roles",
      description: "Role and permission management operations",
    },
    {
      name: "bookings",
      description: "Event and visit booking management operations",
    },
    {
      name: "public-bookings",
      description: "Public endpoints for creating and checking bookings",
    },
    {
      name: "users",
      description: "User management operations for administrators",
    },
    {
      name: "test",
      description: "Test endpoints for development and debugging",
    },
    {
      name: "donations",
      description: "Donation campaign management and processing",
    },
  ],
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
      DonationCampaign: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "campaign-123",
          },
          title: {
            type: "string",
            example: "Emergency Shelter Fund",
          },
          description: {
            type: "string",
            example: "Help us provide emergency shelter for families in need",
          },
          organizationId: {
            type: "string",
            example: "org-456",
          },
          type: {
            type: "string",
            enum: ["monetary", "supplies", "volunteer"],
            example: "monetary",
          },
          goal: {
            type: "number",
            example: 5000.00,
          },
          amountRaised: {
            type: "number",
            example: 2750.00,
          },
          donorCount: {
            type: "number",
            example: 35,
          },
          currency: {
            type: "string",
            example: "USD",
          },
          startDate: {
            type: "string",
            format: "date",
            example: "2023-06-01",
          },
          endDate: {
            type: "string",
            format: "date",
            example: "2023-12-31",
          },
          isActive: {
            type: "boolean",
            example: true,
          },
          allowAnonymous: {
            type: "boolean",
            example: true,
          },
          minimumAmount: {
            type: "number",
            example: 5.00,
          },
          suggestedAmounts: {
            type: "array",
            items: {
              type: "number",
            },
            example: [10, 25, 50, 100, 250],
          },
          featuredImage: {
            type: "string",
            example: "https://example.com/images/donation-campaign.jpg",
          },
          tags: {
            type: "array",
            items: {
              type: "string",
            },
            example: ["emergency", "shelter", "families"],
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2023-06-01T12:00:00Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2023-06-01T12:00:00Z",
          },
        },
      },
      DonationCampaignInput: {
        type: "object",
        required: [
          "title",
          "description",
          "organizationId",
          "type",
          "goal",
          "currency",
        ],
        properties: {
          title: {
            type: "string",
            example: "Emergency Shelter Fund",
          },
          description: {
            type: "string",
            example: "Help us provide emergency shelter for families in need",
          },
          organizationId: {
            type: "string",
            example: "org-456",
          },
          type: {
            type: "string",
            enum: ["monetary", "supplies", "volunteer"],
            example: "monetary",
          },
          goal: {
            type: "number",
            example: 5000.00,
          },
          currency: {
            type: "string",
            example: "USD",
          },
          startDate: {
            type: "string",
            format: "date",
            example: "2023-06-01",
          },
          endDate: {
            type: "string",
            format: "date",
            example: "2023-12-31",
          },
          isActive: {
            type: "boolean",
            example: true,
          },
          allowAnonymous: {
            type: "boolean",
            example: true,
          },
          minimumAmount: {
            type: "number",
            example: 5.00,
          },
          suggestedAmounts: {
            type: "array",
            items: {
              type: "number",
            },
            example: [10, 25, 50, 100, 250],
          },
          featuredImage: {
            type: "string",
            example: "https://example.com/images/donation-campaign.jpg",
          },
          tags: {
            type: "array",
            items: {
              type: "string",
            },
            example: ["emergency", "shelter", "families"],
          },
        },
      },
      DonationCampaignUpdateInput: {
        type: "object",
        properties: {
          title: {
            type: "string",
            example: "Updated Emergency Shelter Fund",
          },
          description: {
            type: "string",
            example: "Updated description for our emergency shelter campaign",
          },
          goal: {
            type: "number",
            example: 7500.00,
          },
          endDate: {
            type: "string",
            format: "date",
            example: "2024-03-31",
          },
          isActive: {
            type: "boolean",
            example: true,
          },
          suggestedAmounts: {
            type: "array",
            items: {
              type: "number",
            },
            example: [15, 30, 50, 100, 300],
          },
          featuredImage: {
            type: "string",
            example: "https://example.com/images/updated-campaign.jpg",
          },
          tags: {
            type: "array",
            items: {
              type: "string",
            },
            example: ["emergency", "shelter", "families", "housing"],
          },
        },
      },
      DonationTransactionInput: {
        type: "object",
        required: ["amount", "currency", "paymentMethod"],
        properties: {
          donorName: {
            type: "string",
            example: "John Doe",
          },
          donorEmail: {
            type: "string",
            format: "email",
            example: "john@example.com",
          },
          amount: {
            type: "number",
            example: 50.00,
          },
          currency: {
            type: "string",
            example: "USD",
          },
          isAnonymous: {
            type: "boolean",
            example: false,
          },
          message: {
            type: "string",
            example: "Thank you for your important work!",
          },
          paymentMethod: {
            type: "string",
            enum: ["credit_card", "paypal", "bank_transfer", "crypto"],
            example: "credit_card",
          },
          paymentDetails: {
            type: "object",
            example: {
              cardNumber: "4111111111111111",
              expiryMonth: "12",
              expiryYear: "2024",
              cvv: "123",
            },
          },
        },
      },
      DonationTransaction: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "tx-789",
          },
          campaignId: {
            type: "string",
            example: "campaign-123",
          },
          donorName: {
            type: "string",
            example: "John Doe",
          },
          donorEmail: {
            type: "string",
            format: "email",
            example: "john@example.com",
          },
          amount: {
            type: "number",
            example: 50.00,
          },
          currency: {
            type: "string",
            example: "USD",
          },
          isAnonymous: {
            type: "boolean",
            example: false,
          },
          message: {
            type: "string",
            example: "Thank you for your important work!",
          },
          paymentMethod: {
            type: "string",
            example: "credit_card",
          },
          status: {
            type: "string",
            enum: ["pending", "completed", "failed", "refunded"],
            example: "completed",
          },
          transactionDate: {
            type: "string",
            format: "date-time",
            example: "2023-06-15T14:30:00Z",
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
        tags: ["system"],
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
    "/test-route": {
      get: {
        summary: "Test Route",
        description: "Test route for the API",
        tags: ["test"],
        responses: {
          "200": {
            description: "Test successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "API test route is working",
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
        tags: ["auth"],
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
        tags: ["auth"],
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
    "/api/v1/auth/verify": {
      post: {
        summary: "Verify Token",
        description: "Verifies if a JWT token is valid",
        tags: ["auth"],
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
                required: ["token"],
                properties: {
                  token: {
                    type: "string",
                    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Token is valid",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    valid: {
                      type: "boolean",
                      example: true,
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
                      example: "Token is required",
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
                    valid: {
                      type: "boolean",
                      example: false,
                    },
                    error: {
                      type: "string",
                      example: "Invalid or expired token",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/change-password": {
      post: {
        summary: "Change Password",
        description: "Changes the password for the authenticated user",
        tags: ["auth"],
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
                required: ["currentPassword", "newPassword"],
                properties: {
                  currentPassword: {
                    type: "string",
                    format: "password",
                    example: "oldPassword",
                  },
                  newPassword: {
                    type: "string",
                    format: "password",
                    example: "newPassword123",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Password changed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Password changed successfully",
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
                      example: "Current password is incorrect",
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
    "/api/v1/admin/posts": {
      get: {
        summary: "Get All Posts",
        description: "Retrieve a list of all posts (admin only)",
        tags: ["posts", "admin"],
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
        tags: ["posts", "admin"],
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
        tags: ["posts", "admin"],
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
        tags: ["posts", "admin"],
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
        tags: ["posts", "admin"],
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
        tags: ["analytics", "admin"],
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
        tags: ["organizations"],
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
        tags: ["organizations"],
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
        tags: ["organizations"],
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
        tags: ["organizations"],
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
        tags: ["analytics", "admin"],
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
        tags: ["analytics", "admin"],
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
        tags: ["analytics", "posts"],
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
        tags: ["analytics", "posts"],
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
        tags: ["public-posts"],
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
        tags: ["public-posts"],
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
        tags: ["public-posts"],
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
        tags: ["public-posts"],
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
        tags: ["dashboard", "admin"],
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
    "/api/v1/patrons/register": {
      post: {
        summary: "Register Patron",
        description:
          "Register as a new patron (external organization representative)",
        tags: ["public-patrons"],
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
                required: [
                  "username",
                  "email",
                  "password",
                  "firstName",
                  "lastName",
                  "organizationName",
                ],
                properties: {
                  username: {
                    type: "string",
                    example: "patron1",
                  },
                  email: {
                    type: "string",
                    format: "email",
                    example: "patron@example.com",
                  },
                  password: {
                    type: "string",
                    format: "password",
                    example: "password123",
                  },
                  firstName: {
                    type: "string",
                    example: "John",
                  },
                  lastName: {
                    type: "string",
                    example: "Doe",
                  },
                  organizationName: {
                    type: "string",
                    example: "Example Organization",
                  },
                  position: {
                    type: "string",
                    example: "Manager",
                  },
                  phoneNumber: {
                    type: "string",
                    example: "123-456-7890",
                  },
                  contactPreference: {
                    type: "string",
                    enum: ["email", "phone"],
                    example: "email",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Patron registered successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      example: "patron123",
                    },
                    username: {
                      type: "string",
                      example: "patron1",
                    },
                    email: {
                      type: "string",
                      example: "patron@example.com",
                    },
                    status: {
                      type: "string",
                      example: "pending",
                    },
                    message: {
                      type: "string",
                      example:
                        "Registration successful. Your account is pending approval.",
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
                    details: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                      example: [
                        "Email is already in use",
                        "Password must be at least 8 characters",
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/admin/patrons": {
      get: {
        summary: "Get All Patrons",
        description: "Get all patron users (admin only)",
        tags: ["patrons", "admin"],
        security: [
          {
            ApiKeyAuth: [],
            BearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "List of patrons",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                        example: "patron123",
                      },
                      username: {
                        type: "string",
                        example: "patron1",
                      },
                      email: {
                        type: "string",
                        example: "patron@example.com",
                      },
                      firstName: {
                        type: "string",
                        example: "John",
                      },
                      lastName: {
                        type: "string",
                        example: "Doe",
                      },
                      organizationName: {
                        type: "string",
                        example: "Example Organization",
                      },
                      status: {
                        type: "string",
                        enum: ["pending", "verified", "rejected"],
                        example: "verified",
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
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/admin/patrons/{id}": {
      get: {
        summary: "Get Patron by ID",
        description: "Get patron by ID (admin only)",
        tags: ["patrons", "admin"],
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
            description: "Patron ID",
          },
        ],
        responses: {
          "200": {
            description: "Patron details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      example: "patron123",
                    },
                    username: {
                      type: "string",
                      example: "patron1",
                    },
                    email: {
                      type: "string",
                      example: "patron@example.com",
                    },
                    firstName: {
                      type: "string",
                      example: "John",
                    },
                    lastName: {
                      type: "string",
                      example: "Doe",
                    },
                    organizationName: {
                      type: "string",
                      example: "Example Organization",
                    },
                    position: {
                      type: "string",
                      example: "Manager",
                    },
                    phoneNumber: {
                      type: "string",
                      example: "123-456-7890",
                    },
                    contactPreference: {
                      type: "string",
                      example: "email",
                    },
                    status: {
                      type: "string",
                      example: "verified",
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
                      example: "Patron not found",
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
      put: {
        summary: "Update Patron",
        description: "Update patron information (admin only)",
        tags: ["patrons", "admin"],
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
            description: "Patron ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  firstName: {
                    type: "string",
                    example: "John",
                  },
                  lastName: {
                    type: "string",
                    example: "Smith",
                  },
                  roles: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                    example: ["Patron", "BookingManager"],
                  },
                  organizationName: {
                    type: "string",
                    example: "Updated Organization Name",
                  },
                  isActive: {
                    type: "boolean",
                    example: true,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Patron updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      example: "patron123",
                    },
                    message: {
                      type: "string",
                      example: "Patron updated successfully",
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
                      example: "Patron not found",
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
        summary: "Delete Patron",
        description: "Delete a patron (admin only)",
        tags: ["patrons", "admin"],
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
            description: "Patron ID",
          },
        ],
        responses: {
          "204": {
            description: "Patron deleted successfully",
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
                      example: "Patron not found",
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
    "/api/v1/admin/patrons/{id}/verify": {
      post: {
        summary: "Verify/Approve Patron",
        description: "Verify and approve a patron (admin only)",
        tags: ["patrons", "admin"],
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
            description: "Patron ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["verified", "rejected"],
                    example: "verified",
                  },
                  notes: {
                    type: "string",
                    example: "Verified and approved by admin",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Patron verification status updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      example: "patron123",
                    },
                    status: {
                      type: "string",
                      example: "verified",
                    },
                    message: {
                      type: "string",
                      example: "Patron verification status updated",
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
                      example: "Patron not found",
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
    "/api/v1/admin/roles": {
      get: {
        summary: "Get All Roles",
        description: "Get all available roles",
        tags: ["roles", "admin"],
        security: [
          {
            ApiKeyAuth: [],
            BearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "List of roles",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                        example: "Patron",
                      },
                      description: {
                        type: "string",
                        example: "External organization representative",
                      },
                      permissions: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            resource: {
                              type: "string",
                              example: "bookings",
                            },
                            accessLevel: {
                              type: "string",
                              example: "read_only",
                            },
                          },
                        },
                      },
                      isSystemRole: {
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
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create New Role",
        description: "Create a new role with custom permissions",
        tags: ["roles", "admin"],
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
                required: ["name", "permissions"],
                properties: {
                  name: {
                    type: "string",
                    example: "EventOrganizer",
                  },
                  description: {
                    type: "string",
                    example: "Role for organizing events and managing bookings",
                  },
                  permissions: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["resource", "accessLevel"],
                      properties: {
                        resource: {
                          type: "string",
                          example: "bookings",
                        },
                        accessLevel: {
                          type: "string",
                          enum: ["read_only", "read_write", "full"],
                          example: "read_write",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Role created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      example: "EventOrganizer",
                    },
                    message: {
                      type: "string",
                      example: "Role created successfully",
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
                      example: "Role name already exists",
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
    "/api/v1/admin/roles/{name}": {
      get: {
        summary: "Get Role by Name",
        description: "Get role details by name",
        tags: ["roles", "admin"],
        security: [
          {
            ApiKeyAuth: [],
            BearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "name",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
            description: "Role name",
          },
        ],
        responses: {
          "200": {
            description: "Role details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      example: "Patron",
                    },
                    description: {
                      type: "string",
                      example: "External organization representative",
                    },
                    permissions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          resource: {
                            type: "string",
                            example: "bookings",
                          },
                          accessLevel: {
                            type: "string",
                            example: "read_only",
                          },
                        },
                      },
                    },
                    isSystemRole: {
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
          "404": {
            description: "Not Found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Role not found",
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
      put: {
        summary: "Update Role",
        description: "Update an existing role",
        tags: ["roles", "admin"],
        security: [
          {
            ApiKeyAuth: [],
            BearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "name",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
            description: "Role name",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  description: {
                    type: "string",
                    example: "Updated role description",
                  },
                  permissions: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["resource", "accessLevel"],
                      properties: {
                        resource: {
                          type: "string",
                          example: "bookings",
                        },
                        accessLevel: {
                          type: "string",
                          enum: ["read_only", "read_write", "full"],
                          example: "full",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Role updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      example: "EventOrganizer",
                    },
                    message: {
                      type: "string",
                      example: "Role updated successfully",
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
                      example: "Role not found",
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
                      example: "Cannot modify system roles",
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
        summary: "Delete Role",
        description: "Delete a custom role (system roles cannot be deleted)",
        tags: ["roles", "admin"],
        security: [
          {
            ApiKeyAuth: [],
            BearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "name",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
            description: "Role name",
          },
        ],
        responses: {
          "204": {
            description: "Role deleted successfully",
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
                      example: "Role not found",
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
                      example: "Cannot delete system roles",
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
    "/api/v1/bookings": {
      post: {
        summary: "Create Booking",
        description: "Creates a new booking request",
        tags: ["public-bookings"],
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
                required: [
                  "organizationName",
                  "contactName",
                  "contactEmail",
                  "eventTitle",
                  "eventDate",
                  "eventType",
                ],
                properties: {
                  organizationName: {
                    type: "string",
                    example: "ABC Organization",
                  },
                  contactName: {
                    type: "string",
                    example: "John Doe",
                  },
                  contactEmail: {
                    type: "string",
                    format: "email",
                    example: "john@example.com",
                  },
                  contactPhone: {
                    type: "string",
                    example: "123-456-7890",
                  },
                  eventTitle: {
                    type: "string",
                    example: "Charity Dinner",
                  },
                  eventDescription: {
                    type: "string",
                    example: "Annual charity dinner to support the shelter",
                  },
                  eventDate: {
                    type: "string",
                    format: "date",
                    example: "2023-12-15",
                  },
                  eventTime: {
                    type: "string",
                    example: "18:00",
                  },
                  eventLocation: {
                    type: "string",
                    example: "123 Main St, City",
                  },
                  eventType: {
                    type: "string",
                    enum: [
                      "visit_to_shelter",
                      "fundraiser",
                      "volunteer",
                      "other",
                    ],
                    example: "visit_to_shelter",
                  },
                  numberOfAttendees: {
                    type: "integer",
                    example: 25,
                  },
                  specialRequirements: {
                    type: "string",
                    example: "Vegetarian meal options needed",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Booking created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      example: "booking123",
                    },
                    status: {
                      type: "string",
                      example: "pending",
                    },
                    message: {
                      type: "string",
                      example:
                        "Your booking request has been submitted and is pending review.",
                    },
                    trackingNumber: {
                      type: "string",
                      example: "BK-2023-1234",
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
                    details: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                      example: [
                        "Contact email is required",
                        "Event date must be in the future",
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/bookings/{id}": {
      get: {
        summary: "Get Booking Status",
        description: "Get public status information for a booking",
        tags: ["public-bookings"],
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
            description: "Booking ID",
          },
        ],
        responses: {
          "200": {
            description: "Booking status details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      example: "booking123",
                    },
                    status: {
                      type: "string",
                      enum: ["pending", "approved", "rejected", "cancelled"],
                      example: "approved",
                    },
                    eventTitle: {
                      type: "string",
                      example: "Charity Dinner",
                    },
                    eventDate: {
                      type: "string",
                      format: "date",
                      example: "2023-12-15",
                    },
                    updatedAt: {
                      type: "string",
                      format: "date-time",
                      example: "2023-09-15T14:30:00Z",
                    },
                    message: {
                      type: "string",
                      example: "Your booking has been approved.",
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
                      example: "Booking not found",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/admin/bookings": {
      get: {
        summary: "Get All Bookings",
        description: "Returns all booking requests",
        tags: ["bookings", "admin"],
        security: [
          {
            ApiKeyAuth: [],
            BearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "List of bookings",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                        example: "booking123",
                      },
                      organizationName: {
                        type: "string",
                        example: "ABC Organization",
                      },
                      contactName: {
                        type: "string",
                        example: "John Doe",
                      },
                      eventTitle: {
                        type: "string",
                        example: "Charity Dinner",
                      },
                      eventDate: {
                        type: "string",
                        format: "date",
                        example: "2023-12-15",
                      },
                      eventType: {
                        type: "string",
                        example: "visit_to_shelter",
                      },
                      status: {
                        type: "string",
                        enum: ["pending", "approved", "rejected", "cancelled"],
                        example: "pending",
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
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/admin/bookings/{id}": {
      get: {
        summary: "Get Booking by ID",
        description: "Get complete details for a specific booking",
        tags: ["bookings", "admin"],
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
            description: "Booking ID",
          },
        ],
        responses: {
          "200": {
            description: "Booking details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      example: "booking123",
                    },
                    organizationName: {
                      type: "string",
                      example: "ABC Organization",
                    },
                    contactName: {
                      type: "string",
                      example: "John Doe",
                    },
                    contactEmail: {
                      type: "string",
                      example: "john@example.com",
                    },
                    contactPhone: {
                      type: "string",
                      example: "123-456-7890",
                    },
                    eventTitle: {
                      type: "string",
                      example: "Charity Dinner",
                    },
                    eventDescription: {
                      type: "string",
                      example: "Annual charity dinner to support the shelter",
                    },
                    eventDate: {
                      type: "string",
                      format: "date",
                      example: "2023-12-15",
                    },
                    eventTime: {
                      type: "string",
                      example: "18:00",
                    },
                    eventLocation: {
                      type: "string",
                      example: "123 Main St, City",
                    },
                    eventType: {
                      type: "string",
                      example: "visit_to_shelter",
                    },
                    numberOfAttendees: {
                      type: "integer",
                      example: 25,
                    },
                    specialRequirements: {
                      type: "string",
                      example: "Vegetarian meal options needed",
                    },
                    status: {
                      type: "string",
                      enum: ["pending", "approved", "rejected", "cancelled"],
                      example: "pending",
                    },
                    adminNotes: {
                      type: "string",
                      example: "Need to confirm availability with staff",
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
                      example: "Booking not found",
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
      put: {
        summary: "Update Booking Status",
        description: "Update booking status and other details",
        tags: ["bookings", "admin"],
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
            description: "Booking ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["pending", "approved", "rejected", "cancelled"],
                    example: "approved",
                  },
                  adminNotes: {
                    type: "string",
                    example: "Approved and scheduled",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Booking updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      example: "booking123",
                    },
                    status: {
                      type: "string",
                      example: "approved",
                    },
                    message: {
                      type: "string",
                      example: "Booking updated successfully",
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
                      example: "Booking not found",
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
        summary: "Delete Booking",
        description: "Delete a booking",
        tags: ["bookings", "admin"],
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
            description: "Booking ID",
          },
        ],
        responses: {
          "204": {
            description: "Booking deleted successfully",
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
                      example: "Booking not found",
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
    "/api/v1/admin/users": {
      get: {
        summary: "Get All Users",
        description: "Returns a list of all users",
        tags: ["users", "admin"],
        security: [
          {
            ApiKeyAuth: [],
            BearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "List of users",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                        example: "user123",
                      },
                      username: {
                        type: "string",
                        example: "johndoe",
                      },
                      email: {
                        type: "string",
                        example: "john@example.com",
                      },
                      role: {
                        type: "string",
                        example: "admin",
                      },
                      isActive: {
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
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create User",
        description: "Creates a new user",
        tags: ["users", "admin"],
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
                required: ["username", "email", "password", "role"],
                properties: {
                  username: {
                    type: "string",
                    example: "newuser",
                  },
                  email: {
                    type: "string",
                    format: "email",
                    example: "newuser@example.com",
                  },
                  password: {
                    type: "string",
                    format: "password",
                    example: "password123",
                  },
                  role: {
                    type: "string",
                    example: "editor",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      example: "user123",
                    },
                    username: {
                      type: "string",
                      example: "newuser",
                    },
                    email: {
                      type: "string",
                      example: "newuser@example.com",
                    },
                    role: {
                      type: "string",
                      example: "editor",
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
                      example: "Username or email already exists",
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
    "/api/v1/admin/users/{id}": {
      get: {
        summary: "Get User by ID",
        description: "Returns a specific user by ID",
        tags: ["users", "admin"],
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
            description: "User ID",
          },
        ],
        responses: {
          "200": {
            description: "User details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      example: "user123",
                    },
                    username: {
                      type: "string",
                      example: "johndoe",
                    },
                    email: {
                      type: "string",
                      example: "john@example.com",
                    },
                    role: {
                      type: "string",
                      example: "admin",
                    },
                    isActive: {
                      type: "boolean",
                      example: true,
                    },
                    createdAt: {
                      type: "string",
                      format: "date-time",
                      example: "2023-09-15T14:30:00Z",
                    },
                    lastLogin: {
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
                      example: "User not found",
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
      put: {
        summary: "Update User",
        description: "Updates an existing user",
        tags: ["users", "admin"],
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
            description: "User ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: {
                    type: "string",
                    example: "updateduser",
                  },
                  email: {
                    type: "string",
                    format: "email",
                    example: "updateduser@example.com",
                  },
                  role: {
                    type: "string",
                    example: "admin",
                  },
                  isActive: {
                    type: "boolean",
                    example: true,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "User updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      example: "user123",
                    },
                    username: {
                      type: "string",
                      example: "updateduser",
                    },
                    email: {
                      type: "string",
                      example: "updateduser@example.com",
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
          "404": {
            description: "Not Found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "User not found",
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
                      example: "Username or email already exists",
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
        summary: "Delete User",
        description: "Deletes a user",
        tags: ["users", "admin"],
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
            description: "User ID",
          },
        ],
        responses: {
          "204": {
            description: "User deleted successfully",
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
                      example: "User not found",
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
    "/api/v1/admin/test": {
      get: {
        summary: "Test Admin Route",
        description: "Test admin route",
        tags: ["test", "admin"],
        security: [
          {
            ApiKeyAuth: [],
            BearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Test successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Admin test route is working",
                    },
                    user: {
                      type: "object",
                      properties: {
                        id: {
                          type: "string",
                          example: "user123",
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
    "/api/v1/admin/direct-users": {
      get: {
        summary: "Direct Users Test",
        description: "Direct users test route",
        tags: ["test", "admin"],
        security: [
          {
            ApiKeyAuth: [],
            BearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Test successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Direct users test is working",
                    },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: {
                            type: "string",
                            example: "user123",
                          },
                          name: {
                            type: "string",
                            example: "Test User",
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
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/admin/analytics": {
      get: {
        summary: "Get API Analytics",
        description: "Returns API usage analytics",
        tags: ["analytics", "admin"],
        security: [
          {
            ApiKeyAuth: [],
            BearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "API analytics data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    totalRequests: {
                      type: "number",
                      example: 5000,
                    },
                    uniqueUsers: {
                      type: "number",
                      example: 120,
                    },
                    topEndpoints: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          endpoint: {
                            type: "string",
                            example: "/api/v1/posts",
                          },
                          count: {
                            type: "number",
                            example: 1200,
                          },
                        },
                      },
                    },
                    responseTimeAvg: {
                      type: "number",
                      example: 120,
                    },
                    errorRate: {
                      type: "number",
                      example: 0.02,
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
    "/api/v1/admin/dashboard/analytics": {
      get: {
        summary: "Get Dashboard Analytics",
        description: "Returns dashboard analytics data",
        tags: ["analytics", "dashboard", "admin"],
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
                    users: {
                      type: "object",
                      properties: {
                        total: {
                          type: "number",
                          example: 300,
                        },
                        newThisWeek: {
                          type: "number",
                          example: 12,
                        },
                        activeToday: {
                          type: "number",
                          example: 45,
                        },
                      },
                    },
                    posts: {
                      type: "object",
                      properties: {
                        total: {
                          type: "number",
                          example: 150,
                        },
                        published: {
                          type: "number",
                          example: 120,
                        },
                        drafts: {
                          type: "number",
                          example: 30,
                        },
                        views: {
                          type: "number",
                          example: 15000,
                        },
                      },
                    },
                    bookings: {
                      type: "object",
                      properties: {
                        total: {
                          type: "number",
                          example: 85,
                        },
                        pending: {
                          type: "number",
                          example: 12,
                        },
                        approved: {
                          type: "number",
                          example: 68,
                        },
                        rejected: {
                          type: "number",
                          example: 5,
                        },
                      },
                    },
                    apiUsage: {
                      type: "object",
                      properties: {
                        totalRequests: {
                          type: "number",
                          example: 25000,
                        },
                        avgResponseTime: {
                          type: "number",
                          example: 110,
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
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/donations": {
      get: {
        summary: "List all donations",
        description: "Returns a list of active donation campaigns",
        tags: ["donations"],
        security: [{ apiKey: [] }],
        parameters: [
          {
            name: "organizationId",
            in: "query",
            description: "Filter by organization ID",
            required: false,
            schema: {
              type: "string",
            },
          },
          {
            name: "status",
            in: "query",
            description: "Filter by status (active, completed, archived)",
            required: false,
            schema: {
              type: "string",
              enum: ["active", "completed", "archived"],
            },
          },
          {
            name: "type",
            in: "query",
            description: "Filter by type (monetary, supplies, volunteer)",
            required: false,
            schema: {
              type: "string",
              enum: ["monetary", "supplies", "volunteer"],
            },
          },
        ],
        responses: {
          "200": {
            description: "A list of donation campaigns",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/DonationCampaign",
                      },
                    },
                    pagination: {
                      $ref: "#/components/schemas/Pagination",
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
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "500": {
            description: "Internal Server Error",
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
        summary: "Create a new donation campaign",
        description: "Creates a new donation campaign",
        tags: ["donations"],
        security: [
          { apiKey: [], bearerAuth: [] },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/DonationCampaignInput",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Donation campaign created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      $ref: "#/components/schemas/DonationCampaign",
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
            description: "Internal Server Error",
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
    "/api/v1/donations/{id}": {
      get: {
        summary: "Get donation by ID",
        description: "Returns details for a specific donation campaign",
        tags: ["donations"],
        security: [{ apiKey: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Donation campaign ID",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Donation campaign details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      $ref: "#/components/schemas/DonationCampaign",
                    },
                  },
                },
              },
            },
          },
          "404": {
            description: "Donation campaign not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "500": {
            description: "Internal Server Error",
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
        summary: "Update donation",
        description: "Updates an existing donation campaign",
        tags: ["donations"],
        security: [
          { apiKey: [], bearerAuth: [] },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Donation campaign ID",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/DonationCampaignUpdateInput",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Donation campaign updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      $ref: "#/components/schemas/DonationCampaign",
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
          "404": {
            description: "Donation campaign not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "500": {
            description: "Internal Server Error",
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
      delete: {
        summary: "Delete donation",
        description: "Deletes a donation campaign",
        tags: ["donations"],
        security: [
          { apiKey: [], bearerAuth: [] },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Donation campaign ID",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Donation campaign deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Donation campaign deleted successfully",
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
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "404": {
            description: "Donation campaign not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "500": {
            description: "Internal Server Error",
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
    "/api/v1/donations/{id}/donate": {
      post: {
        summary: "Make a donation",
        description: "Process a donation for a specific campaign",
        tags: ["donations"],
        security: [{ apiKey: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Donation campaign ID",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/DonationTransactionInput",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Donation processed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      $ref: "#/components/schemas/DonationTransaction",
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
          "404": {
            description: "Donation campaign not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "500": {
            description: "Internal Server Error",
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
    "/api/v1/admin/donations/{id}/transactions": {
      get: {
        summary: "Get donation transactions",
        description: "Returns transactions for a specific donation campaign",
        tags: ["donations", "admin"],
        security: [
          { apiKey: [], bearerAuth: [] },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Donation campaign ID",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "List of donation transactions",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/DonationTransaction",
                      },
                    },
                    pagination: {
                      $ref: "#/components/schemas/Pagination",
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
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "404": {
            description: "Donation campaign not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "500": {
            description: "Internal Server Error",
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
    "/api/v1/admin/donations/analytics": {
      get: {
        summary: "Get donation analytics",
        description: "Returns analytics data for all donation campaigns",
        tags: ["donations", "admin", "analytics"],
        security: [
          { apiKey: [], bearerAuth: [] },
        ],
        responses: {
          "200": {
            description: "Donation analytics data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        totalDonations: {
                          type: "number",
                          example: 25000,
                        },
                        activeCampaigns: {
                          type: "number",
                          example: 5,
                        },
                        totalDonors: {
                          type: "number",
                          example: 187,
                        },
                        averageDonation: {
                          type: "number",
                          example: 133.69,
                        },
                        topCampaigns: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: {
                                type: "string",
                                example: "campaign-123",
                              },
                              title: {
                                type: "string",
                                example: "Emergency Shelter Fund",
                              },
                              totalRaised: {
                                type: "number",
                                example: 7500,
                              },
                              donationCount: {
                                type: "number",
                                example: 42,
                              },
                            },
                          },
                        },
                        donationsByPeriod: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              period: {
                                type: "string",
                                example: "2023-06",
                              },
                              amount: {
                                type: "number",
                                example: 3200,
                              },
                              count: {
                                type: "number",
                                example: 28,
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
            description: "Internal Server Error",
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
  },
};

// Routes
router.get("/api-docs", (ctx) => {
  ctx.response.body = redocUi;
  ctx.response.type = "text/html";
});

router.get("/api-docs.json", (ctx) => {
  ctx.response.body = apiSpec;
  ctx.response.type = "application/json";
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

// Export the router with a named export for better imports
export { router as swaggerRouter };

export default router;

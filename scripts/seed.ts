import { connect, getKv, KV_COLLECTIONS } from "../db/kv.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts";

// Connect to KV database
await connect();
const kv = getKv();

// Helper function to generate consistent JWT key
async function getJwtKey() {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(
    Deno.env.get("JWT_SECRET") || "default_secret",
  );

  return await crypto.subtle.importKey(
    "raw",
    secretKey,
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign", "verify"],
  );
}

// Clear all existing data
async function clearAllData() {
  console.log("Clearing all existing data...");

  // Get all collections to clear
  const collections = Object.values(KV_COLLECTIONS);

  for (const collection of collections) {
    // List all entries in the collection
    const entries = kv.list({ prefix: [collection] });

    // Delete each entry
    for await (const entry of entries) {
      await kv.delete(entry.key);
      console.log(`Deleted: ${entry.key}`);
    }

    console.log(`Cleared collection: ${collection}`);
  }

  console.log("All data cleared successfully");
}

// Sample Users
const users = [
  {
    id: "user_1",
    username: "admin",
    email: "admin@charityshelter.org",
    password: await bcrypt.hash("admin123"),
    role: "admin",
    firstName: "Admin",
    lastName: "User",
    phoneNumber: "+1234567890",
    address: "123 Admin Street, Admin City",
    bio: "Experienced administrator with a passion for charity work.",
    profilePicture: "https://example.com/profiles/admin.jpg",
    dateOfBirth: "1985-05-15",
    interests: "Management, Technology, Community Service",
    skills: "Leadership, Project Management, Strategic Planning",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "user_2",
    username: "manager",
    email: "manager@charityshelter.org",
    password: await bcrypt.hash("manager123"),
    role: "manager",
    firstName: "Manager",
    lastName: "User",
    phoneNumber: "+1987654321",
    address: "456 Manager Avenue, Manager City",
    bio: "Dedicated shelter manager committed to helping those in need.",
    profilePicture: "https://example.com/profiles/manager.jpg",
    dateOfBirth: "1990-08-20",
    interests: "Social Work, Education, Homelessness Prevention",
    skills: "Team Management, Crisis Intervention, Resource Allocation",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "user_3",
    username: "volunteer",
    email: "volunteer@charityshelter.org",
    password: await bcrypt.hash("volunteer123"),
    role: "volunteer",
    firstName: "Volunteer",
    lastName: "User",
    phoneNumber: "+1122334455",
    address: "789 Volunteer Lane, Volunteer City",
    bio:
      "Enthusiastic volunteer looking to make a difference in the community.",
    profilePicture: "https://example.com/profiles/volunteer.jpg",
    dateOfBirth: "1995-12-10",
    interests: "Community Service, Social Justice, Charity Events",
    skills: "Communication, First Aid, Customer Service",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Sample Branches
const branches = [
  {
    id: "branch_1",
    organizationId: "org_1",
    name: "Downtown Branch",
    address: "123 Hope Street",
    city: "Hopewell",
    state: "NY",
    country: "USA",
    postalCode: "10001",
    phone: "+1234567890",
    email: "downtown@hopeshelter.org",
    isMainBranch: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "branch_2",
    organizationId: "org_1",
    name: "Westside Branch",
    address: "456 West Avenue",
    city: "Hopewell",
    state: "NY",
    country: "USA",
    postalCode: "10002",
    phone: "+1234567899",
    email: "westside@hopeshelter.org",
    isMainBranch: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "branch_3",
    organizationId: "org_2",
    name: "Main Food Bank",
    address: "456 Food Street",
    city: "Foodville",
    state: "CA",
    country: "USA",
    postalCode: "90001",
    phone: "+1234567891",
    email: "main@foodbank.org",
    isMainBranch: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "branch_4",
    organizationId: "org_3",
    name: "Education Center",
    address: "789 Education Street",
    city: "Learnington",
    state: "TX",
    country: "USA",
    postalCode: "75001",
    phone: "+1234567892",
    email: "center@educationforall.org",
    isMainBranch: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Sample Organizations with updated structure
const organizations = [
  {
    id: "org_1",
    name: "Hope Shelter",
    description: "Providing shelter and support for homeless individuals",
    type: "shelter",
    contactInfo: {
      phone: "+1234567890",
      email: "contact@hopeshelter.org",
      address: "123 Hope Street, Hopewell, NY",
    },
    website: "https://hopeshelter.org",
    logo: "https://example.com/hope-shelter-logo.png",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "org_2",
    name: "Food Bank Foundation",
    description: "Distributing food to those in need",
    type: "food-bank",
    contactInfo: {
      phone: "+1234567891",
      email: "contact@foodbank.org",
      address: "456 Food Street, Foodville, CA",
    },
    website: "https://foodbank.org",
    logo: "https://example.com/food-bank-logo.png",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "org_3",
    name: "Education for All",
    description:
      "Providing education opportunities to underprivileged children",
    type: "education",
    contactInfo: {
      phone: "+1234567892",
      email: "contact@educationforall.org",
      address: "789 Education Street, Learnington, TX",
    },
    website: "https://educationforall.org",
    logo: "https://example.com/education-logo.png",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Sample Posts
const posts = [
  {
    id: "post_1",
    organizationId: "org_1",
    title: "Urgent Need for Winter Clothing: Help Keep Our Community Warm",
    subtitle: "Local shelter faces critical shortage as temperatures drop",
    content:
      `As winter approaches, Hope Shelter is experiencing a critical shortage of warm clothing for our residents. The recent cold snap has increased demand significantly, and our supplies are running low.

Our most urgent needs include:
- Winter coats (all sizes)
- Warm socks
- Gloves and mittens
- Scarves
- Thermal underwear
- Blankets

Your donations can make a real difference in someone's life this winter. Many of our residents walk long distances for work or job interviews, and proper winter clothing is essential for their health and well-being.

How to Donate:
1. Drop off items at our main location (123 Hope Street)
2. Schedule a pickup by calling (555) 123-4567
3. Organize a clothing drive in your community

All donations are tax-deductible, and we provide receipts upon request.`,
    summary:
      "Hope Shelter launches urgent appeal for winter clothing donations as temperatures drop and resident numbers increase. Community support is crucial for meeting this pressing need.",
    imageUrl: "https://example.com/images/winter-clothing-drive.jpg",
    additionalImages: JSON.stringify([
      "https://example.com/images/donation-center.jpg",
      "https://example.com/images/winter-coats.jpg",
      "https://example.com/images/volunteers-sorting.jpg",
    ]),
    type: "news",
    author: "Sarah Johnson",
    category: "Urgent Needs",
    tags: "donations,winter,clothing,community-support,urgent-appeal",
    status: "published",
    isPublished: true,
    publishDate: "2024-01-15T08:00:00Z",
    lastModified: "2024-01-15T08:00:00Z",
    featuredImage: "https://example.com/images/winter-clothing-drive-hero.jpg",
    metaDescription:
      "Hope Shelter urgently needs winter clothing donations. Learn how you can help keep our community warm this winter season.",
    readingTime: 4,
    references: JSON.stringify([
      "Winter Weather Advisory - National Weather Service",
      "Local Homelessness Statistics 2024",
      "Community Health Guidelines",
    ]),
    relatedPosts: JSON.stringify(["post_2", "post_3"]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "user_1",
    viewCount: 0,
    uniqueViewCount: 0,
    viewHistory: "[]",
    averageReadTime: 0,
    bounceRate: 0,
  },
  {
    id: "post_2",
    organizationId: "org_2",
    title:
      "Record-Breaking Success: Community Food Drive Exceeds All Expectations",
    subtitle: "Local businesses and residents unite to combat food insecurity",
    content:
      `The Food Bank Foundation is thrilled to announce the overwhelming success of our recent community food drive. Thanks to the incredible generosity of our community, we've collected over 10,000 pounds of non-perishable food items and raised $25,000 in monetary donations.

Key Achievements:
- 10,000+ pounds of food collected
- $25,000 in monetary donations
- 200+ volunteer participants
- 50 local businesses involved
- 1,000 families to be supported

The Impact:
This unprecedented support will help us provide nutritious meals to over 1,000 families in our community for the next three months. The monetary donations will also enable us to purchase fresh produce and perishable items, ensuring balanced nutrition for those we serve.

Special Thanks:
We extend our heartfelt gratitude to:
- Our dedicated volunteers
- Local grocery stores for their matching donations
- Community schools for organizing collection points
- Local media for spreading awareness
- Every individual who contributed

Moving Forward:
This success has inspired us to make the food drive a quarterly event. Stay tuned for announcements about our spring collection initiative.`,
    summary:
      "Community food drive exceeds goals with record-breaking donations of food and funds, enabling support for over 1,000 local families.",
    imageUrl: "https://example.com/images/food-drive-success.jpg",
    additionalImages: JSON.stringify([
      "https://example.com/images/volunteers-working.jpg",
      "https://example.com/images/donation-sorting.jpg",
      "https://example.com/images/community-celebration.jpg",
    ]),
    type: "article",
    author: "Michael Chen",
    category: "Success Stories",
    tags: "food-drive,volunteers,success,community-impact,donations",
    status: "published",
    isPublished: true,
    publishDate: "2024-01-10T09:00:00Z",
    lastModified: "2024-01-10T09:00:00Z",
    featuredImage: "https://example.com/images/food-drive-hero.jpg",
    metaDescription:
      "Local food drive breaks records with 10,000+ pounds of food collected and $25,000 in donations, supporting 1,000 families in need.",
    readingTime: 6,
    references: JSON.stringify([
      "Local Food Insecurity Report 2024",
      "Community Impact Assessment",
      "Volunteer Recognition Program",
    ]),
    relatedPosts: JSON.stringify(["post_1", "post_3"]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "user_2",
    viewCount: 0,
    uniqueViewCount: 0,
    viewHistory: "[]",
    averageReadTime: 0,
    bounceRate: 0,
  },
  {
    id: "post_3",
    organizationId: "org_3",
    title: "Transforming Lives: New Education Center Set to Open Its Doors",
    subtitle:
      "State-of-the-art facility will provide free education and job training to underserved communities",
    content:
      `Education for All is proud to announce the upcoming opening of our new state-of-the-art education center. This facility represents a significant milestone in our mission to provide quality education and job training to underserved communities.

Facility Features:
- 10 modern classrooms with latest technology
- Computer lab with 30 workstations
- Professional development center
- Library and resource room
- Child care facility for student parents
- Accessible design throughout

Programs Offered:
1. High School Equivalency Preparation
2. Digital Skills Training
3. ESL Classes
4. Job Readiness Workshop
5. Professional Certification Courses
6. Financial Literacy Programs

Community Impact:
The center is expected to serve over 500 students annually, providing them with the skills and qualifications needed for better employment opportunities. Our partnerships with local businesses will provide direct pathways to employment for program graduates.

Opening Timeline:
- Building completion: February 2024
- Staff training: March 2024
- Community open house: April 1-5, 2024
- Classes begin: April 15, 2024

Get Involved:
- Register for courses (starting March 1)
- Volunteer as a tutor or mentor
- Donate to support scholarships
- Partner with us as an employer`,
    summary:
      "New education center opening in April 2024 will offer free education and job training programs, featuring modern facilities and comprehensive support services for underserved communities.",
    imageUrl: "https://example.com/images/education-center.jpg",
    additionalImages: JSON.stringify([
      "https://example.com/images/classroom-preview.jpg",
      "https://example.com/images/computer-lab.jpg",
      "https://example.com/images/library-space.jpg",
    ]),
    type: "announcement",
    author: "Dr. Patricia Martinez",
    category: "Announcements",
    tags:
      "education,announcement,new-center,job-training,community-development",
    status: "draft",
    isPublished: false,
    publishDate: null,
    lastModified: new Date().toISOString(),
    featuredImage: "https://example.com/images/education-center-hero.jpg",
    metaDescription:
      "New education center opening in April 2024 will provide free education and job training programs to underserved communities. Register now for courses.",
    readingTime: 8,
    references: JSON.stringify([
      "Local Education Needs Assessment 2024",
      "Workforce Development Strategy",
      "Community Partnership Directory",
    ]),
    relatedPosts: JSON.stringify(["post_1", "post_2"]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "user_3",
    viewCount: 0,
    uniqueViewCount: 0,
    viewHistory: "[]",
    averageReadTime: 0,
    bounceRate: 0,
  },
];

// Function to seed data
async function seedData() {
  try {
    // Clear all existing data first
    await clearAllData();

    // Seed Users
    for (const user of users) {
      await kv.set([KV_COLLECTIONS.USERS, user.id], user);
      console.log(`Seeded user: ${user.email}`);
    }

    // Seed Organizations
    for (const org of organizations) {
      await kv.set([KV_COLLECTIONS.ORGANIZATIONS, org.id], org);
      console.log(`Seeded organization: ${org.name}`);
    }

    // Seed Branches
    for (const branch of branches) {
      await kv.set([KV_COLLECTIONS.BRANCHES, branch.id], branch);
      console.log(
        `Seeded branch: ${branch.name} for organization: ${branch.organizationId}`,
      );
    }

    // Seed Posts
    for (const post of posts) {
      await kv.set([KV_COLLECTIONS.POSTS, post.id], post);
      console.log(`Seeded post: ${post.title}`);
    }

    // Create sample API key
    const apiKey = crypto.randomUUID();
    await kv.set([KV_COLLECTIONS.API_KEYS, apiKey], {
      key: apiKey,
      name: "Sample API Key",
      createdAt: new Date().toISOString(),
      lastUsed: null,
    });
    console.log(`Created sample API key: ${apiKey}`);

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding data:", error);
    throw error;
  }
}

// Run the seed function
await seedData();

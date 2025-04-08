// Analytics API with more granular endpoints
export interface UserStats {
  total: number;
  change: number;
  active: number;
  new: number;
}

export interface PostStats {
  total: number;
  change: number;
  published: number;
  drafts: number;
  popular: {
    id: string;
    title: string;
    views: number;
  }[];
}

export interface LocationStats {
  total: number;
  active: number;
  inactive: number;
}

export interface RequestStats {
  total: number;
  change: number;
  byEndpoint: {
    endpoint: string;
    count: number;
  }[];
}

export interface ActivityItem {
  type: string;
  user: string;
  action: string;
  timestamp: string;
}

// Sample data for analytics
const mockUserStats: UserStats = {
  total: 156,
  change: 12,
  active: 142,
  new: 8,
};

const mockPostStats: PostStats = {
  total: 89,
  change: 5,
  published: 76,
  drafts: 13,
  popular: [
    {
      id: "1",
      title: "How to Volunteer Effectively",
      views: 1234,
    },
    {
      id: "2",
      title: "Impact of Community Service",
      views: 987,
    },
    {
      id: "3",
      title: "Building Strong Communities",
      views: 876,
    },
    {
      id: "4",
      title: "Youth Leadership Programs",
      views: 765,
    },
    {
      id: "5",
      title: "Environmental Conservation Efforts",
      views: 654,
    },
  ],
};

const mockLocationStats: LocationStats = {
  total: 12,
  active: 10,
  inactive: 2,
};

const mockRequestStats: RequestStats = {
  total: 45678,
  change: 1234,
  byEndpoint: [
    {
      endpoint: "/api/v1/posts",
      count: 15678,
    },
    {
      endpoint: "/api/v1/users",
      count: 12345,
    },
    {
      endpoint: "/api/v1/locations",
      count: 9876,
    },
    {
      endpoint: "/api/v1/analytics",
      count: 5678,
    },
    {
      endpoint: "/api/v1/auth",
      count: 3847,
    },
  ],
};

const mockRecentActivity: ActivityItem[] = [
  {
    type: "post",
    user: "John Doe",
    action: "Created new post: 'Community Impact Report 2024'",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
  },
  {
    type: "user",
    user: "Jane Smith",
    action: "Updated profile information",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
  },
  {
    type: "location",
    user: "Admin",
    action: "Added new location: 'Downtown Center'",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
  },
  {
    type: "api_key",
    user: "System",
    action: "Generated new API key for external service",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
  },
  {
    type: "post",
    user: "Alice Johnson",
    action: "Published post: 'Volunteer Success Stories'",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    type: "user",
    user: "Bob Wilson",
    action: "Completed onboarding process",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
  },
  {
    type: "location",
    user: "Admin",
    action: "Updated location details: 'Community Center'",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
  },
  {
    type: "post",
    user: "Carol Brown",
    action: "Created draft: 'Upcoming Events Calendar'",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
  },
];

// Mock analytics service
export const mockAnalytics = {
  getUserStats: async (): Promise<UserStats> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockUserStats;
  },

  getPostStats: async (): Promise<PostStats> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockPostStats;
  },

  getLocationStats: async (): Promise<LocationStats> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockLocationStats;
  },

  getRequestStats: async (): Promise<RequestStats> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockRequestStats;
  },

  getRecentActivity: async (): Promise<ActivityItem[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockRecentActivity;
  },
};

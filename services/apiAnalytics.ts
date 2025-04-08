// services/apiAnalytics.ts - Handles API usage analytics

import { getKv, KV_COLLECTIONS } from "../db/kv.ts";

interface ApiEvent {
  endpoint: string;
  method: string;
  timestamp: string;
  userId?: string;
  duration: number;
  statusCode: number;
  userAgent?: string;
  ipAddress?: string;
  responseSize?: number;
  queryParams?: Record<string, string>;
  errorMessage?: string;
  apiKey?: string;
}

interface EndpointMetrics {
  totalCalls: number;
  averageResponseTime: number;
  errorRate: number;
  successRate: number;
  statusCodeBreakdown: Record<number, number>;
  timeoutRate: number;
  peakRequestsPerMinute: number;
  averageRequestsPerMinute: number;
}

/**
 * Track an API call event
 */
export async function trackApiCall(event: ApiEvent) {
  const kv = getKv();
  const now = new Date();
  const hourly = now.toISOString().slice(0, 13); // Format: YYYY-MM-DDTHH
  const daily = now.toISOString().slice(0, 10); // Format: YYYY-MM-DD
  const monthly = now.toISOString().slice(0, 7); // Format: YYYY-MM
  const yearly = now.toISOString().slice(0, 4); // Format: YYYY
  const eventId = crypto.randomUUID();

  // Store the event with a UUID key
  await kv.set([KV_COLLECTIONS.API_EVENTS, eventId], {
    ...event,
    type: "API_CALL",
    id: eventId,
  });

  // Store metrics by time period
  const baseMetricsObject = {
    endpoint: event.endpoint,
    method: event.method,
    count: 1,
    totalDuration: event.duration,
    errors: event.statusCode >= 400 ? 1 : 0,
    timeouts: event.duration > 10000 ? 1 : 0, // Over 10s is timeout
    statusCodes: { [event.statusCode]: 1 },
    lastUpdated: now.toISOString(),
  };

  // Update hourly metrics
  await updateTimeBasedMetrics(
    KV_COLLECTIONS.API_METRICS_HOURLY,
    hourly,
    event.endpoint,
    baseMetricsObject,
  );

  // Update daily metrics
  await updateTimeBasedMetrics(
    KV_COLLECTIONS.API_METRICS_DAILY,
    daily,
    event.endpoint,
    baseMetricsObject,
  );

  // Update monthly metrics
  await updateTimeBasedMetrics(
    KV_COLLECTIONS.API_METRICS_MONTHLY,
    monthly,
    event.endpoint,
    baseMetricsObject,
  );

  // Update yearly metrics
  await updateTimeBasedMetrics(
    KV_COLLECTIONS.API_METRICS_YEARLY,
    yearly,
    event.endpoint,
    baseMetricsObject,
  );

  // Track errors separately if this was an error
  if (event.statusCode >= 400 || event.errorMessage) {
    await trackApiError(event, hourly, daily, monthly, yearly);
  }

  // Track rate limits per API key if provided
  if (event.apiKey) {
    const apiKeyKey = `ratelimit:${event.apiKey}:${hourly}`;
    const currentCalls = await kv.get<number>([
      KV_COLLECTIONS.API_METRICS,
      apiKeyKey,
    ]);
    await kv.set(
      [KV_COLLECTIONS.API_METRICS, apiKeyKey],
      (currentCalls?.value || 0) + 1,
    );
  }
}

/**
 * Track an API error
 */
async function trackApiError(
  event: ApiEvent,
  hourly: string,
  daily: string,
  monthly: string,
  yearly: string,
) {
  const kv = getKv();
  const errorId = crypto.randomUUID();
  const errorType = event.errorMessage
    ? (event.errorMessage.includes("timeout")
      ? "timeout"
      : event.errorMessage.includes("validation")
      ? "validation"
      : "other")
    : `status_${event.statusCode}`;

  // Store the error event
  const errorEvent = {
    id: errorId,
    endpoint: event.endpoint,
    method: event.method,
    timestamp: event.timestamp,
    userId: event.userId,
    duration: event.duration,
    statusCode: event.statusCode,
    errorMessage: event.errorMessage,
    errorType,
    apiKey: event.apiKey,
  };

  await kv.set([KV_COLLECTIONS.API_ERRORS, errorId], errorEvent);

  // Update error summary for this endpoint
  const endpointKey = `error:endpoint:${event.endpoint}`;
  const endpointErrors = await kv.get<any>([
    KV_COLLECTIONS.API_ERROR_SUMMARY,
    endpointKey,
  ]);

  const updatedEndpointErrors = {
    endpoint: event.endpoint,
    totalErrors: (endpointErrors?.value?.totalErrors || 0) + 1,
    errorTypes: {
      ...(endpointErrors?.value?.errorTypes || {}),
      [errorType]: ((endpointErrors?.value?.errorTypes || {})[errorType] || 0) +
        1,
    },
    lastError: event.timestamp,
  };

  await kv.set(
    [KV_COLLECTIONS.API_ERROR_SUMMARY, endpointKey],
    updatedEndpointErrors,
  );

  // Update time-based error metrics
  await updateTimeBasedErrors(
    KV_COLLECTIONS.API_ERRORS_HOURLY,
    hourly,
    event.endpoint,
    errorType,
  );
  await updateTimeBasedErrors(
    KV_COLLECTIONS.API_ERRORS_DAILY,
    daily,
    event.endpoint,
    errorType,
  );
  await updateTimeBasedErrors(
    KV_COLLECTIONS.API_ERRORS_MONTHLY,
    monthly,
    event.endpoint,
    errorType,
  );
  await updateTimeBasedErrors(
    KV_COLLECTIONS.API_ERRORS_YEARLY,
    yearly,
    event.endpoint,
    errorType,
  );
}

/**
 * Update time-based metrics
 */
async function updateTimeBasedMetrics(
  collection: string,
  timeKey: string,
  endpoint: string,
  baseMetrics: any,
) {
  const kv = getKv();
  const key = `${timeKey}:${endpoint}`;

  const existing = await kv.get<any>([collection, key]);

  if (!existing.value) {
    await kv.set([collection, key], baseMetrics);
    return;
  }

  const existingMetrics = existing.value;
  const updatedMetrics = {
    ...existingMetrics,
    count: existingMetrics.count + 1,
    totalDuration: existingMetrics.totalDuration + baseMetrics.totalDuration,
    errors: existingMetrics.errors + baseMetrics.errors,
    timeouts: existingMetrics.timeouts + baseMetrics.timeouts,
    statusCodes: {
      ...existingMetrics.statusCodes,
      [baseMetrics.statusCodes[Object.keys(baseMetrics.statusCodes)[0]]]:
        (existingMetrics.statusCodes[Object.keys(baseMetrics.statusCodes)[0]] ||
          0) + 1,
    },
    averageResponseTime:
      (existingMetrics.totalDuration + baseMetrics.totalDuration) /
      (existingMetrics.count + 1),
    errorRate:
      ((existingMetrics.errors + baseMetrics.errors) /
        (existingMetrics.count + 1)) * 100,
    successRate:
      ((existingMetrics.count + 1 -
        (existingMetrics.errors + baseMetrics.errors)) /
        (existingMetrics.count + 1)) * 100,
    timeoutRate:
      ((existingMetrics.timeouts + baseMetrics.timeouts) /
        (existingMetrics.count + 1)) * 100,
    lastUpdated: new Date().toISOString(),
  };

  await kv.set([collection, key], updatedMetrics);
}

/**
 * Update time-based error metrics
 */
async function updateTimeBasedErrors(
  collection: string,
  timeKey: string,
  endpoint: string,
  errorType: string,
) {
  const kv = getKv();
  const key = `${timeKey}:${endpoint}`;

  const existing = await kv.get<any>([collection, key]);

  if (!existing.value) {
    await kv.set([collection, key], {
      endpoint,
      timeKey,
      count: 1,
      errorTypes: { [errorType]: 1 },
      lastUpdated: new Date().toISOString(),
    });
    return;
  }

  const existingErrors = existing.value;
  const updatedErrors = {
    ...existingErrors,
    count: existingErrors.count + 1,
    errorTypes: {
      ...existingErrors.errorTypes,
      [errorType]: (existingErrors.errorTypes[errorType] || 0) + 1,
    },
    lastUpdated: new Date().toISOString(),
  };

  await kv.set([collection, key], updatedErrors);
}

/**
 * Get metrics for a specific endpoint
 */
export async function getEndpointMetrics(
  endpoint: string,
  timeframe: "hourly" | "daily" | "monthly" | "yearly" = "daily",
): Promise<EndpointMetrics> {
  const kv = getKv();
  const now = new Date();

  let collection: string;
  let timeKey: string;

  switch (timeframe) {
    case "hourly":
      collection = KV_COLLECTIONS.API_METRICS_HOURLY;
      timeKey = now.toISOString().slice(0, 13); // YYYY-MM-DDTHH
      break;
    case "monthly":
      collection = KV_COLLECTIONS.API_METRICS_MONTHLY;
      timeKey = now.toISOString().slice(0, 7); // YYYY-MM
      break;
    case "yearly":
      collection = KV_COLLECTIONS.API_METRICS_YEARLY;
      timeKey = now.toISOString().slice(0, 4); // YYYY
      break;
    default: // daily
      collection = KV_COLLECTIONS.API_METRICS_DAILY;
      timeKey = now.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  const key = `${timeKey}:${endpoint}`;
  const metrics = await kv.get<any>([collection, key]);

  if (!metrics.value) {
    return {
      totalCalls: 0,
      averageResponseTime: 0,
      errorRate: 0,
      successRate: 100,
      statusCodeBreakdown: {},
      timeoutRate: 0,
      peakRequestsPerMinute: 0,
      averageRequestsPerMinute: 0,
    };
  }

  return {
    totalCalls: metrics.value.count,
    averageResponseTime: metrics.value.averageResponseTime || 0,
    errorRate: metrics.value.errorRate || 0,
    successRate: metrics.value.successRate || 100,
    statusCodeBreakdown: metrics.value.statusCodes || {},
    timeoutRate: metrics.value.timeoutRate || 0,
    peakRequestsPerMinute: 0, // This metric is calculated differently now
    averageRequestsPerMinute: metrics.value.count /
      (timeframe === "hourly"
        ? 60
        : timeframe === "daily"
        ? 24 * 60
        : timeframe === "monthly"
        ? 30 * 24 * 60
        : 365 * 24 * 60),
  };
}

/**
 * Get API usage summary
 */
export async function getApiUsageSummary(
  timeframe: "hourly" | "daily" | "monthly" | "yearly" = "daily",
) {
  const kv = getKv();
  const now = new Date();

  let collection: string;
  let timeKey: string;

  switch (timeframe) {
    case "hourly":
      collection = KV_COLLECTIONS.API_METRICS_HOURLY;
      timeKey = now.toISOString().slice(0, 13); // YYYY-MM-DDTHH
      break;
    case "monthly":
      collection = KV_COLLECTIONS.API_METRICS_MONTHLY;
      timeKey = now.toISOString().slice(0, 7); // YYYY-MM
      break;
    case "yearly":
      collection = KV_COLLECTIONS.API_METRICS_YEARLY;
      timeKey = now.toISOString().slice(0, 4); // YYYY
      break;
    default: // daily
      collection = KV_COLLECTIONS.API_METRICS_DAILY;
      timeKey = now.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  const entries = kv.list<any>({
    prefix: [collection],
  });

  const summary = {
    totalRequests: 0,
    totalEndpoints: 0,
    averageResponseTime: 0,
    overallErrorRate: 0,
    overallSuccessRate: 0,
    mostUsedEndpoints: [] as Array<{ endpoint: string; calls: number }>,
    slowestEndpoints: [] as Array<{ endpoint: string; responseTime: number }>,
    errorProneEndpoints: [] as Array<{ endpoint: string; errorRate: number }>,
    timeframe,
    period: timeKey,
    generatedAt: now.toISOString(),
  };

  const endpoints = [];
  let totalDuration = 0;
  let totalErrors = 0;

  for await (const entry of entries) {
    if (!entry.key.toString().startsWith(timeKey)) {
      continue; // Skip entries from other time periods
    }

    const metrics = entry.value;
    summary.totalRequests += metrics.count || 0;
    totalDuration += metrics.totalDuration || 0;
    totalErrors += metrics.errors || 0;

    endpoints.push({
      endpoint: metrics.endpoint,
      calls: metrics.count || 0,
      responseTime: metrics.averageResponseTime || 0,
      errorRate: metrics.errorRate || 0,
    });
  }

  summary.totalEndpoints = endpoints.length;
  summary.averageResponseTime = summary.totalRequests > 0
    ? totalDuration / summary.totalRequests
    : 0;
  summary.overallErrorRate = summary.totalRequests > 0
    ? (totalErrors / summary.totalRequests) * 100
    : 0;
  summary.overallSuccessRate = 100 - summary.overallErrorRate;

  // Sort endpoints by different metrics
  summary.mostUsedEndpoints = endpoints
    .sort((a, b) => b.calls - a.calls)
    .slice(0, 5)
    .map(({ endpoint, calls }) => ({ endpoint, calls }));

  summary.slowestEndpoints = endpoints
    .sort((a, b) => b.responseTime - a.responseTime)
    .slice(0, 5)
    .map(({ endpoint, responseTime }) => ({ endpoint, responseTime }));

  summary.errorProneEndpoints = endpoints
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, 5)
    .map(({ endpoint, errorRate }) => ({ endpoint, errorRate }));

  return summary;
}

/**
 * Get API error summary
 */
export async function getApiErrorSummary(
  timeframe: "hourly" | "daily" | "monthly" | "yearly" = "daily",
) {
  const kv = getKv();
  const now = new Date();

  let collection: string;
  let timeKey: string;

  switch (timeframe) {
    case "hourly":
      collection = KV_COLLECTIONS.API_ERRORS_HOURLY;
      timeKey = now.toISOString().slice(0, 13); // YYYY-MM-DDTHH
      break;
    case "monthly":
      collection = KV_COLLECTIONS.API_ERRORS_MONTHLY;
      timeKey = now.toISOString().slice(0, 7); // YYYY-MM
      break;
    case "yearly":
      collection = KV_COLLECTIONS.API_ERRORS_YEARLY;
      timeKey = now.toISOString().slice(0, 4); // YYYY
      break;
    default: // daily
      collection = KV_COLLECTIONS.API_ERRORS_DAILY;
      timeKey = now.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  const entries = kv.list<any>({
    prefix: [collection],
  });

  const summary = {
    totalErrors: 0,
    totalEndpointsWithErrors: 0,
    mostCommonErrorTypes: {} as Record<string, number>,
    endpointsWithMostErrors: [] as Array<
      { endpoint: string; errorCount: number }
    >,
    timeframe,
    period: timeKey,
    generatedAt: now.toISOString(),
  };

  const endpoints = new Map<
    string,
    { errorCount: number; errorTypes: Record<string, number> }
  >();
  const errorTypes: Record<string, number> = {};

  for await (const entry of entries) {
    if (!entry.key.toString().startsWith(timeKey)) {
      continue; // Skip entries from other time periods
    }

    const errorData = entry.value;
    summary.totalErrors += errorData.count || 0;

    // Track errors per endpoint
    if (!endpoints.has(errorData.endpoint)) {
      endpoints.set(errorData.endpoint, { errorCount: 0, errorTypes: {} });
    }

    const endpointData = endpoints.get(errorData.endpoint)!;
    endpointData.errorCount += errorData.count || 0;

    // Aggregate error types
    for (const [type, count] of Object.entries(errorData.errorTypes || {})) {
      errorTypes[type] = (errorTypes[type] || 0) + (count as number);
      endpointData.errorTypes[type] = (endpointData.errorTypes[type] || 0) +
        (count as number);
    }
  }

  summary.totalEndpointsWithErrors = endpoints.size;

  // Convert map to array and sort for the list of endpoints with most errors
  summary.endpointsWithMostErrors = Array.from(endpoints.entries())
    .map(([endpoint, data]) => ({ endpoint, errorCount: data.errorCount }))
    .sort((a, b) => b.errorCount - a.errorCount)
    .slice(0, 10);

  // Sort error types by count
  summary.mostCommonErrorTypes = Object.fromEntries(
    Object.entries(errorTypes)
      .sort((a, b) => b[1] as number - (a[1] as number))
      .slice(0, 10),
  );

  return summary;
}

/**
 * Check rate limit for an API key
 */
export async function checkRateLimit(
  apiKey: string,
  limit: number,
): Promise<boolean> {
  const kv = getKv();
  const now = new Date();
  const minute = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm

  const key = `ratelimit:${apiKey}:${minute}`;
  const currentCalls = await kv.get<number>([
    KV_COLLECTIONS.API_METRICS,
    key,
  ]);

  return (currentCalls?.value || 0) < limit;
}

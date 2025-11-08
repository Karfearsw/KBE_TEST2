import { QueryClient, QueryFunction } from "@tanstack/react-query";

// We need to declare the useErrorGuidance hook here, but not import it directly
// to avoid circular dependencies, as it's imported in components that use this file
declare function useErrorHandlers(): {
  mapNetworkError: (error: any) => void;
  handleQueryError: (error: any, context?: string) => void;
};

// This is used internally by the throwIfResNotOk function
// to map HTTP status codes to error types for better error handling
export function mapHttpStatusToErrorType(status: number) {
  switch (status) {
    case 401:
      return { type: "authentication", severity: "medium" as const };
    case 403:
      return { type: "permission", severity: "medium" as const };
    case 404:
      return { type: "notFound", severity: "low" as const };
    case 422:
      return { type: "validation", severity: "low" as const };
    case 429:
      return { type: "network", severity: "medium" as const }; // Rate limiting
    case 500:
    case 502:
    case 503:
    case 504:
      return { type: "server", severity: "high" as const };
    default:
      if (status >= 400 && status < 500) {
        return { type: "validation", severity: "medium" as const };
      }
      if (status >= 500) {
        return { type: "server", severity: "high" as const };
      }
      return { type: "unknown", severity: "medium" as const };
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    const error = new Error(`${res.status}: ${text}`);
    
    // Add metadata to the error object for better error handling
    (error as any).status = res.status;
    (error as any).statusText = res.statusText;
    (error as any).url = res.url;
    (error as any).errorType = mapHttpStatusToErrorType(res.status).type;
    (error as any).severity = mapHttpStatusToErrorType(res.status).severity;
    
    throw error;
  }
}

/**
 * Enhanced API request function with better error handling
 * @param method HTTP method (GET, POST, etc.)
 * @param url API endpoint URL
 * @param data Optional request body
 * @param options Additional options
 * @returns Response object
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: {
    /**
     * Context for the request, useful for error reporting
     */
    context?: string;
    /**
     * Additional headers to include
     */
    headers?: Record<string, string>;
    /**
     * Custom timeout in milliseconds (defaults to 30000)
     */
    timeout?: number;
  }
): Promise<Response> {
  // Create an AbortController to handle timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, options?.timeout || 30000);
  
  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        ...(options?.headers || {})
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal
    });
    
    // Add context to error if provided
    if (options?.context) {
      (res as any).context = options.context;
    }
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Add context to the error if it was aborted due to timeout
    if (error instanceof DOMException && error.name === 'AbortError') {
      const timeoutError = new Error(`Request timeout: ${url}`);
      (timeoutError as any).errorType = 'network';
      (timeoutError as any).severity = 'medium';
      (timeoutError as any).context = options?.context;
      throw timeoutError;
    }
    
    // Add context to other errors if provided
    if (options?.context && error instanceof Error) {
      (error as any).context = options.context;
    }
    
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Enhanced query function creator for React Query
 * @param options Configuration options
 * @returns Query function for React Query
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  /**
   * Context for the request, useful for error reporting
   */
  context?: string;
  /**
   * Timeout in milliseconds (defaults to 30000)
   */
  timeout?: number;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, context, timeout }) =>
  async ({ queryKey }) => {
    // Create an AbortController to handle timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout || 30000);
    
    try {
      const url = queryKey[0] as string;
      const res = await fetch(url, {
        credentials: "include",
        signal: controller.signal
      });
      
      // Add context to the response if provided
      if (context) {
        (res as any).context = context;
      }
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }
      
      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Handle timeout errors
      if (error instanceof DOMException && error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout: ${queryKey[0]}`);
        (timeoutError as any).errorType = 'network';
        (timeoutError as any).severity = 'medium';
        (timeoutError as any).context = context;
        throw timeoutError;
      }
      
      // Add context to other errors if provided
      if (context && error instanceof Error) {
        (error as any).context = context;
      }
      
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };

// Enhanced global error handler
function globalErrorHandler(error: any) {
  console.error("API Error:", error);
  
  // Log to monitoring/analytics systems in production
  if (process.env.NODE_ENV === "production") {
    // This is where we'd send errors to monitoring services
    // like Sentry, LogRocket, etc.
  }
  
  return error;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ 
        on401: "throw", 
        context: "Global Query",
        timeout: 30000
      }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

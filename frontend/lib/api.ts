// API client for DocuShare backend

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://10.0.2.84:3001/api";

// Helper function to get the auth token
const getToken = () => {
  if (typeof window !== "undefined") {
    // Get token from sessionStorage
    return sessionStorage.getItem("token");
  }
  return null;
};

// Validate token format to avoid sending malformed tokens
const isValidToken = (token: string | null): boolean => {
  if (!token) return false;

  // Basic JWT format validation (header.payload.signature)
  const jwtRegex = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*$/;
  return jwtRegex.test(token);
};

// Helper function for API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getToken();

  // Validate token before using it
  const validToken = isValidToken(token) ? token : null;

  // If token is invalid, clear it
  if (token && !validToken) {
    console.warn("API: Invalid token format detected, clearing token");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("token");
    }
  }

  // Create headers with the Authorization token
  const headers = {
    "Content-Type": "application/json",
    ...(validToken ? { Authorization: `Bearer ${validToken}` } : {}),
    ...(options.headers || {}),
  };

  console.log(
    `API: Making request to ${endpoint} with token: ${
      validToken ? "Present" : "Not present"
    }`
  );

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        errorJson = {
          message:
            errorText || `API request failed with status ${response.status}`,
        };
      }

      console.error(`API: Error for ${endpoint}:`, response.status, errorJson);

      // If unauthorized, clear the token
      if (response.status === 401 && token) {
        console.warn(
          "API: Received 401 with token present, clearing invalid token"
        );
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("token");
        }
      }

      // Create an error object with status code
      const error = new Error(
        errorJson.message || `API request failed with status ${response.status}`
      ) as Error & {
        status?: number;
      };
      error.status = response.status;
      throw error;
    }

    return response.json();
  } catch (error) {
    console.error(`API: Request error for ${endpoint}:`, error);
    throw error;
  }
}

// Auth API
export async function register(email: string, password: string) {
  const response = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  // Store token in sessionStorage
  if (response.token) {
    sessionStorage.setItem("token", response.token);
  }

  return response;
}

export async function login(email: string, password: string) {
  const response = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  // Store token in sessionStorage
  if (response.token) {
    sessionStorage.setItem("token", response.token);
  }

  return response;
}

export async function getCurrentUser() {
  return apiRequest("/auth/me");
}

export async function logout() {
  // Clear sessionStorage
  sessionStorage.removeItem("token");
  return Promise.resolve();
}

// User API
export async function updateUser(data: { email?: string; password?: string }) {
  return apiRequest("/users", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteUser() {
  return apiRequest("/users", {
    method: "DELETE",
  });
}

// File API
export async function getUploadUrl(data: {
  fileName: string;
  fileType: string;
}) {
  return apiRequest("/files/upload-url", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function confirmUpload(data: {
  fileId: string;
  s3Key: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}) {
  return apiRequest("/files/confirm-upload", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchFiles() {
  return apiRequest("/files");
}

export async function getDownloadUrl(fileId: string) {
  return apiRequest(`/files/${fileId}/download-url`);
}

export async function deleteFile(fileId: string) {
  return apiRequest(`/files/${fileId}`, {
    method: "DELETE",
  });
}

// Link API
export async function createLink(data: {
  fileId: string;
  expiryIn: string;
  password?: string;
  downloadLimit?: number;
  viewLimit?: number;
  allowDownload: boolean;
  requireIdentification: boolean;
}) {
  return apiRequest("/links", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchLinks() {
  return apiRequest("/links");
}

export async function getLinkById(linkId: string) {
  return apiRequest(`/links/${linkId}`);
}

export async function updateLink(
  linkId: string,
  data: {
    expiryIn: string;
    password?: string;
    downloadLimit?: number;
    viewLimit?: number;
    allowDownload: boolean;
    requireIdentification: boolean;
  }
) {
  return apiRequest(`/links/${linkId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function revokeLink(linkId: string) {
  return apiRequest(`/links/${linkId}/revoke`, {
    method: "POST",
  });
}

export async function activateLink(linkId: string) {
  return apiRequest(`/links/${linkId}/activate`, {
    method: "POST",
  });
}

export async function deleteLink(linkId: string) {
  return apiRequest(`/links/${linkId}`, {
    method: "DELETE",
  });
}

// Access API
export async function createAccessGrant(data: {
  linkId: string;
  recipientEmail: string;
  recipientIdentifier?: string;
}) {
  return apiRequest("/access/grants", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function revokeAccessGrant(grantId: string) {
  return apiRequest(`/access/grants/${grantId}/revoke`, {
    method: "POST",
  });
}

export async function getLinkAccessGrants(linkId: string) {
  return apiRequest(`/access/links/${linkId}/grants`);
}

// Subscription API
export async function fetchSubscription() {
  return apiRequest("/subscription/plan");
}

export async function upgradeSubscription(planId: string) {
  return apiRequest("/subscription/upgrade", {
    method: "POST",
    body: JSON.stringify({ planId }),
  });
}

export async function cancelSubscription() {
  return apiRequest("/subscription/cancel", {
    method: "POST",
  });
}

// Direct file upload to server
export async function uploadFile(
  file: File,
  onProgress?: (percentage: number) => void
): Promise<any> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/files/upload`);

    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    });

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          // console.log(response);

          resolve(response);
        } catch (error) {
          reject(new Error("Invalid response format"));
        }
      } else {
        let errorMessage = "Upload failed";

        try {
          const errorResponse = JSON.parse(xhr.responseText);
          errorMessage = errorResponse.message || errorMessage;
        } catch (e) {
          // If parsing fails, use status text
          errorMessage = xhr.statusText || errorMessage;
        }

        // Handle specific error cases
        if (xhr.status === 413) {
          errorMessage = "File is too large. Maximum size is 100MB.";
        } else if (xhr.status === 400) {
          errorMessage = "No file was provided for upload.";
        }

        reject(new Error(errorMessage));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error occurred during upload"));
    };

    xhr.send(formData);
  });
}

// File Viewer API functions

// Get public link info without authentication
export async function getPublicLinkInfo(linkId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/public/links/${linkId}`);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Failed to get link info: ${response.status}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch (e) {
        // If parsing fails, use the raw text
        if (errorText) errorMessage = errorText;
      }

      const error = new Error(errorMessage) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

    return response.json();
  } catch (error) {
    console.error(`Request error for link info:`, error);
    throw error;
  }
}

// Get file content (may require password)
export async function getFileContent(linkId: string, password?: string) {
  console.log(
    `Getting file content for link ${linkId}, password provided: ${
      password ? "Yes" : "No"
    }`
  );

  // If we have a password, always use POST
  // If no password, use GET
  const method = password ? "POST" : "GET";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const body = password ? JSON.stringify({ password }) : undefined;

  try {
    console.log(
      `Making ${method} request to get file content, with password: ${
        password ? "Yes" : "No"
      }`
    );

    const response = await fetch(
      `${API_BASE_URL}/public/links/${linkId}/content`,
      {
        method,
        headers,
        body,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Failed to get file content: ${response.status}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch (e) {
        // If parsing fails, use the raw text
        if (errorText) errorMessage = errorText;
      }

      if (response.status === 401) {
        errorMessage = "Password required";
      } else if (response.status === 404) {
        errorMessage = "File not found. It may have been deleted or moved.";
      } else if (response.status === 403) {
        errorMessage = "You don't have permission to access this file.";
      } else if (response.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      }

      console.error(
        `API error for file content:`,
        response.status,
        errorMessage
      );

      const error = new Error(errorMessage) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

    const data = await response.json();

    // Validate the response
    if (!data.viewUrl && !data.fileUrl) {
      throw new Error("Invalid response: Missing file URL");
    }

    // Normalize the response to always have fileUrl
    if (data.viewUrl && !data.fileUrl) {
      data.fileUrl = data.viewUrl;
    }

    return data;
  } catch (error) {
    console.error(`Request error for file content:`, error);
    throw error;
  }
}

// Verify link password
export async function verifyLinkPassword(linkId: string, password: string) {
  return fetch(`${API_BASE_URL}/public/links/${linkId}/verify-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  }).then(async (response) => {
    if (!response.ok) {
      if (response.status === 401) {
        return { success: false };
      }
      throw new Error(`Failed to verify password: ${response.status}`);
    }

    const data = await response.json();

    return data;
  });
}

// Access Logs API
export async function fetchAccessLogs(params?: {
  linkId?: string;
  action?: "view" | "download";
  startDate?: string;
  endDate?: string;
}) {
  const queryParams = new URLSearchParams();

  if (params?.linkId) queryParams.append("linkId", params.linkId);
  if (params?.action) queryParams.append("action", params.action);
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);

  const queryString = queryParams.toString();
  const endpoint = `/access/logs${queryString ? `?${queryString}` : ""}`;

  try {
    const response = await apiRequest(endpoint);

    // Ensure we have a consistent logs array even if the API response format varies
    if (!response.logs && Array.isArray(response)) {
      return { logs: response };
    }

    return response;
  } catch (error) {
    console.error("Error fetching access logs:", error);
    throw error;
  }
}


import API_BASE_URL from "./api";

export async function customerRequest(path, options = {}) {
  let response;

  try {
    const isPublicAuthRequest =
      path === "/api/customers/login" ||
      path === "/api/customers/register";

    const token = isPublicAuthRequest
      ? null
      : localStorage.getItem("customerToken");

    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      // Do not use credentials: "include" with this JWT-based setup.
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Unable to connect to the server. Please try again.");
  }

  if (!response.ok) {
    const responseText = await response.text();
    let message = responseText;

    if (responseText) {
      try {
        const error = JSON.parse(responseText);
        message =
          typeof error === "string"
            ? error
            : error?.message || error?.error || responseText;
      } catch {
        message = responseText;
      }
    }

    if (response.status === 401) {
      const error = new Error(
        message || "Your session has expired. Please log in again."
      );
      error.status = response.status;
      throw error;
    }

    if (response.status === 413) {
      throw new Error(
        "The selected file is too large. Maximum size is 10 MB."
      );
    }

    throw new Error(message || `Request failed (${response.status}).`);
  }

  if (response.status === 204) {
    return null;
  }

  return response;
}

export function isCustomerAuthError(error) {
  return error?.status === 401;
}

export async function getCustomerJson(path, options = {}) {
  const response = await customerRequest(path, options);
  return response.json();
}

export async function downloadCustomerDocument(documentId) {
  const response = await customerRequest(
    `/api/customers/me/documents/${encodeURIComponent(documentId)}/download`
  );

  return response.blob();
}

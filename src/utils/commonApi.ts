import axios from "axios";
import localStorageHelper from "./localStorageHelper";
import commonHelper from "./commonHelper";

export const base_URL = (window as any).__ENV__?.API_BASE_URL //base URL

//******************************************************Token **************************************** */
const getAuthToken = async () => {
  try {
    const token = await localStorageHelper.getItem("@token");
    // console.log("token=====================>", token);

    const response = await axios.patch(
      `${base_URL}/operator/company/account/token`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // console.log("getAuthtokenresponse=====>", response.data);

    const data = response?.data;
    const createdOn = new Date(data?.created_on).getTime();
    const expiresInMs = data?.expires_in * 1000;
    const expiresAt = createdOn + expiresInMs;
    localStorageHelper.storeItem("@token", data?.access_token);
    localStorageHelper.storeItem("@token_expires", expiresAt);
    return response?.data?.access_token;
  } catch (err) {
    console.error("Error in getAuthToken", err);
    throw err;
  }
};

//****************************************************** prepare Headers **************************************** */
const prepareHeaders = async (tokenNeeded: boolean) => {
  let headers: any = { "Content-Type": "application/json" };

  if (tokenNeeded) {
    let AuthToken = await localStorageHelper.getItem("@token");
    const tokenExpiry = await localStorageHelper.getItem("@token_expires");

    if (!AuthToken) {
      commonHelper.logout();
      throw new Error("Token not found");
    }

    if (!tokenExpiry) {
      commonHelper.logout();
      throw new Error("Token expiry not found");
    }

    const tokenExpiryNumber = Number(tokenExpiry);
    if (isNaN(tokenExpiryNumber)) {
      commonHelper.logout();
      throw new Error("Invalid token expiry timestamp");
    }

    const now = Date.now();

    // If token is expired, logout immediately
    if (now >= tokenExpiryNumber) {
      commonHelper.logout();
      throw new Error("Token expired");
    }

    // If token is about to expire, try to refresh
    const oneHourBeforeExpiry = tokenExpiryNumber - 3600 * 1000;
    if (now >= oneHourBeforeExpiry) {
      try {
        await getAuthToken();
        AuthToken = await localStorageHelper.getItem("@token");
      } catch (error) {
        commonHelper.logout();
        throw error;
      }
    }

    headers["Authorization"] = `Bearer ${AuthToken}`;
  }

  return headers;
};

//****************************************************** response handler **************************************** */

const handleResponse = async (response: any) => {
  const responseData = response?.data;
  if (responseData?.access_token) {
    localStorageHelper.storeItem("@token", responseData?.access_token);
    localStorageHelper.storeItem("@token_expires", responseData?.expires_in);
  }
  return response?.data;
};

//******************************************************  errorResponse handler  **************************************** */
const handleErrorResponse = (errorResponse: any) => {
  if (!errorResponse) {
    return {
      error: "Network error. Please try again later.",
      status: 0,
      type: "network",
      details: [],
    };
  }
  const status = errorResponse.response?.status || 0;
  const data = errorResponse.response?.data || errorResponse.data || {};

  // Handle validation errors (422)
  if (status === 422 && Array.isArray(data?.detail)) {
    const validationErrors = data.detail.map((err: any) => {
      const field = err.loc?.slice(1).join(".") || "Field";
      return {
        field,
        message: err.msg,
        type: err.type || "validation",
      };
    });

    return {
      status,
      error: "Validation failed",
      type: "validation",
      details: validationErrors,
      ...data,
    };
  }

  // Handle other errors
  const errorMessage =
    data?.detail || data?.message || errorResponse.message || "Request failed";

return {
    status,
    error: errorMessage,
    type: status === 401 ? "authentication" : "api",
    details: [],
    ...data,
  };
};

//******************************************************  apiCall  ****************************************

const apiCall = async (
  method: "get" | "post" | "patch" | "delete",
  route: string,
  params: any = {},
  tokenNeeded: boolean = true,
  contentType: string = "application/json"
) => {
  try {
    const headers = await prepareHeaders(tokenNeeded);
    headers["Content-Type"] = contentType;

    const config = {
      method,
      url: `${base_URL}${route}`,
      headers,
      data: method !== "get" ? params : undefined,
      params: method === "get" ? params : undefined,
      paramsSerializer: (params: any) => {
        return Object.entries(params)
          .flatMap(([key, value]) => {
            if (value === undefined || value === null) return [];
            return Array.isArray(value)
              ? value.map((v) => `${key}=${encodeURIComponent(v)}`)
              : [`${key}=${encodeURIComponent(String(value))}`];
          })
          .join("&");
      },
    };

    const response = await axios(config);
    return await handleResponse(response);
  } catch (err: any) {
    const error = handleErrorResponse(err);

    // Special case - force logout on 401
    if (error.status === 401) {
      commonHelper.logout();
    }

    throw error;
  }
};

export default {
  apiCall,
};

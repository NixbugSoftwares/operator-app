import axios from "axios";
import { toast } from "react-toastify";
import moment from "moment";
import localStorageHelper from "./localStorageHelper";
// import commonHelper from "./commonHelper";
export const base_URL = "http://192.168.0.134:8080"; //base URL

//******************************************************Token **************************************** */
const getAuthToken = async () => {
  try {
    const token = await localStorageHelper.getItem("@token");
    console.log("token=====================>", token);

    const response = await axios.post( 
      `${base_URL}/executive/token`,
      { refreshToken: token }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("getAuthtokenresponse=====>", response);

    localStorageHelper.storeItem("@token", response?.data?.access_token);
    localStorageHelper.storeItem("@token_expires", response?.data?.expires_in);

    return response?.data?.access_token;
  } catch (err) {
    console.error("Error in getAuthToken", err);
    throw err;
  }
};

//****************************************************** prepare Headers **************************************** */
const prepareHeaders = async (tokenNeeded: any) => {
  let headers: any = { "Content-Type": "application/json" };
  if (tokenNeeded) {
    let AuthToken = await localStorageHelper.getItem("@token");
    const tokenExpiry = await localStorageHelper.getItem("@token_expiry");

    if (tokenExpiry && moment(tokenExpiry).isValid()) {
      const hourDifference = moment(tokenExpiry).diff(moment(), "hours");
      if (hourDifference <= 1) {
        try {
          AuthToken = await getAuthToken();
        } catch (err) {
          console.error("Token refresh failed. Logging out...", err);
          localStorageHelper.removeStoredItem("@token");
          localStorageHelper.removeStoredItem("@token_expiry");
          window.location.href = "/login"; 
        }
      }
    }

    headers["Authorization"] = `Bearer ${AuthToken}`;
  }

  return headers;
};

//****************************************************** response handler **************************************** */

const handleResponse = async (response: any) => {
  console.log("response====================>", response);
  
  return response?.data; // Fix for response structure
};

//******************************************************  errorResponse handler  **************************************** */
const handleErrorResponse = (errorResponse: any) => {
  if (!errorResponse) {
    // Handle network errors (e.g., ERR_CONNECTION_REFUSED)
    toast.error("Network error. Please check your connection.");
    throw new Error("Network error");
  }

  if (!errorResponse.status) {
    // Handle network errors (e.g., ERR_CONNECTION_REFUSED)
    toast.error("Network error. Please check your connection.");
    throw new Error("Network error");
  }

  const { status, data } = errorResponse;
  const errorMessage = data?.detail || data?.message || "Api Failed";

  if (status === 400 && Array.isArray(data?.message)) {
    // Handle validation errors (400 Bad Request)
    const validationErrors = data.message
      .map((err: any) => Object.values(err.constraints).join(", "))
      .join(" | ");
    toast.error(validationErrors);
    throw new Error(validationErrors);
  } else if (status === 401) {
    toast.error(errorMessage);
    throw new Error(errorMessage);
  } else if (status === 409) {
    toast.error(errorMessage);
    throw new Error(errorMessage);
  } else if (status === 500) {
    toast.error(errorMessage);
    throw new Error(errorMessage);
  } else {
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
};


//******************************************************  apiCall  ****************************************

const apiCall = async (
  method: "get" | "post" | "patch" | "delete",
  route: string,
  params: any = {},
  tokenNeeded: boolean = true,
  contentType: string = "application/json"
) => {
  console.log(route);
  console.log("method===========>", method);
  try {
    const headers = await prepareHeaders(tokenNeeded);
    headers["Content-Type"] = contentType;

    const config = {
      method,
      url: `${base_URL}${route}`,
      headers,
      data: method !== "get" ? params : undefined,
      params: method === "get" ? params : undefined,
    };

    console.log("CONFIG ===> ", config);

    const response = await axios(config);
    console.log("response=====>", response);

    return await handleResponse(response);
  } catch (err: any) {
    console.log("errorrr======>", err);
    if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
      toast.error("Network error. Please check your connection.");
      throw new Error("Network error");
    }

    return handleErrorResponse(err?.response);
  }
};

export default {
  apiCall,
};

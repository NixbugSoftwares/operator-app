import axios from "axios";
import localStorageHelper from "./localStorageHelper";
import { showErrorToast } from "../common/toastMessageHelper";
import commonHelper from "./commonHelper";




export const base_URL = "https://entebus-api.nixbug.com"; //base URL

//******************************************************Token **************************************** */
const getAuthToken = async () => {
  try {
    const token = await localStorageHelper.getItem("@token");
    console.log("token=====================>", token);

    const response = await axios.patch( 
      `${base_URL}/token`,
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
      throw new Error('Token not found');
    }

    if (!tokenExpiry) {
      commonHelper.logout();
      throw new Error('Token expiry not found');
    }

    const tokenExpiryNumber = Number(tokenExpiry);
    if (isNaN(tokenExpiryNumber)) {
      commonHelper.logout();
      throw new Error('Invalid token expiry timestamp');
    }

    const now = Date.now();
    
    // If token is expired, logout immediately
    if (now >= tokenExpiryNumber) {
      commonHelper.logout();
      throw new Error('Token expired');
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
  // console.log("response====================>", response);

  if (responseData?.access_token) {
     localStorageHelper.storeItem("@token", responseData?.access_token);
     localStorageHelper.storeItem("@token_expires",responseData?.expires_in,);
  }
  return response?.data;
};

//******************************************************  errorResponse handler  **************************************** */
const handleErrorResponse = (errorResponse: any) => {
  if (!errorResponse) {
    // showErrorToast('Network error. Please try again.');
    return {error: 'Network error'};
  }
  const {status, data} = errorResponse.response as {status: number; data: any};
  const errorMessage = data?.detail || data?.message || 'Api Failed';
  console.log('dataaaaaa===>', status, data?.detail);
  if (status === 401) {
    commonHelper.logout();
  } 

  if (status == 400 && Array.isArray(data?.detail)) {
    const validationErrors = (data as any).message
      .map((err: any) => Object.values(err.constraints).join(', '))
      .join(' | ');
    console.log('validation====>', validationErrors);
    showErrorToast(validationErrors);
  } else {
    console.log('errormessagge====>', errorMessage);
    // showErrorToast(errorMessage);
  }
  return {...data, error: errorMessage, status};
};


//******************************************************  apiCall  ****************************************

const apiCall = async (
  method: "get" | "post" | "patch" | "delete",
  route: string,
  params: any = {},
  tokenNeeded: boolean = true,
  contentType: string = "application/json"
) => {
  console.log("routeeeeee====>",  route);
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

  paramsSerializer: (params: any) => {
  return Object.entries(params)
    .flatMap(([key, value]) => {
      if (value === undefined || value === null) return []; 
      return Array.isArray(value)
        ? value.map((v) => `${key}=${encodeURIComponent(v)}`)
        : [`${key}=${encodeURIComponent(String(value))}`];
    })
    .join("&");
}

};


    console.log("CONFIG ===> ", config);

    const response = await axios(config);
    console.log("response=====>", response);

    return await handleResponse(response);
  } catch (err: any) {
    console.log('apiCallCatchError======>', err);
    throw handleErrorResponse(err); 
  }
};

export default {
  apiCall,
};

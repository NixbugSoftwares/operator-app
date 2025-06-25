import axios from "axios";
import localStorageHelper from "./localStorageHelper";
import { showErrorToast } from "../common/toastMessageHelper";
import commonHelper from "./commonHelper";




export const base_URL = "http://192.168.0.134:8080/operator"; //base URL

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

    // console.log('Authtoken======>', AuthToken);
    // console.log('AuthtokenExpiry======>', tokenExpiry); 

    if (!AuthToken) {
      console.log('Token not found');
      throw new Error('Token not found');
    }
    if (!tokenExpiry) {
      throw new Error('Token expiry not found');
    }

    // Ensure tokenExpiry is a number
    const tokenExpiryNumber = Number(tokenExpiry);
    if (isNaN(tokenExpiryNumber)) {
      throw new Error('Invalid token expiry timestamp');
    }
    const now = Date.now();
    const oneHourBeforeExpiry = tokenExpiryNumber - 3600 * 1000; // 1 hour before expiry
    // const oneHourBeforeExpiry = tokenExpiryNumber - 60 * 1000;// 1 min before expiry
    if (now>= tokenExpiryNumber) {
      console.log('Token expired, please login again.');
    }else if (now >= oneHourBeforeExpiry) {
      // Token valid but near expiry, refresh it now
      console.log('Token about to expire, refreshing...');
       await getAuthToken();
    } else {
      // console.log('Token still valid, no refresh needed.');
    }

    AuthToken= await localStorageHelper.getItem("@token");

    // console.log('Authtoken from getAuthtoken=======>', AuthToken);
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

  if (status == 400 && Array.isArray(data?.detail)) {
    const validationErrors = (data as any).message
      .map((err: any) => Object.values(err.constraints).join(', '))
      .join(' | ');
    console.log('validation====>', validationErrors);
    showErrorToast(validationErrors);
  } else if (status === 401) {
    // showErrorToast(errorMessage);
    setTimeout(() => {
      if (errorMessage !== 'Invalid username or password') {
        commonHelper.logout();
      }
    }, 500);
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
    return handleErrorResponse(err);
  }
};

export default {
  apiCall,
};

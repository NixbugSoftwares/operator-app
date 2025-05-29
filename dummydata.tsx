const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const response = await dispatch(
        LoginApi({
          username: data.username,
          password: data.password,
          company_id: 1,
        }),
      ).unwrap();
      console.log('Login Response=====>', response);
      if (response?.access_token) {
        const user = {username: data?.username, userId: response?.operator_id};
        const access_token = response?.access_token;
        const expiresAt = Date.now() + response?.expires_in * 1000;
        await AsyncStorageHelper.setEncryptedData('@token', access_token);
        await AsyncStorageHelper.setEncryptedData('@token_expires', expiresAt);
        await AsyncStorageHelper.setEncryptedData('@user', user);
        dispatch(userLoggedIn(user));
      } else {
        Keyboard.dismiss();
      }
    } catch (error) {
      console.error('Login Error:', error);
      ToastHelper.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };




  import axios from 'axios';
import moment from 'moment';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorageHelper from '../utilits/AsyncStorageHelper';
import ToastHelper from '../utilits/ToastHelper';
import CommonHelper from './CommonHelper';
// import DotEnvHelper from './DotEnvHelper';
// import { userLoggedOut } from '../slices/AppSlicce';
// export const API_BASE = DotEnvHelper.getApiUrl();

const API_BASE = 'https://entebus-api.nixbug.com/operator';

// Function to get auth token Before The existing One Expires
const getAuthToken = async () => {
  try {
    const token = await AsyncStorageHelper.getEncryptedData('@token');
    console.log('token in getAuthtoken==========>', token);
    if (token === null || token === undefined) {
      throw new Error('Token not found');
    }
    const response = await axios.patch(
      ${API_BASE}/token,
      {},
      {headers: {Authorization: Bearer ${JSON.parse(token as string)}}},
    );

    console.log('getAuthtokenResponse===========>', response?.data);

    const data = response?.data;
    const createdOn = new Date(data?.created_on).getTime(); // in ms
    const expiresInMs = data?.expires_in * 1000;
    const expiresAt = createdOn + expiresInMs;

    await AsyncStorageHelper.setEncryptedData('@token', data?.access_token);
    await AsyncStorageHelper.setEncryptedData('@token_expires', expiresAt);

    return data?.access_token;
  } catch (err) {
    console.error('Error in getAuthToken', err);
    throw err;
  }
};

// Prepare headers For the Api call
const prepareHeaders = async (tokenNeeded: boolean) => {
  console.log('prepareHeader function executed....');

  let headers: any = {'Content-Type': 'application/json'};

  if (tokenNeeded) {
    console.log('token needed condition become ture');
    let AuthToken = await AsyncStorageHelper.getEncryptedData('@token');
    const tokenExpiry = await AsyncStorageHelper.getEncryptedData(
      '@token_expires',
    );

    console.log('Authtoken======>', AuthToken);
    console.log('AuthtokenExpiry======>', tokenExpiry);

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
    // const oneHourBeforeExpiry = tokenExpiryNumber - 3600 * 1000; // 1 hour before expiry
    const oneHourBeforeExpiry = tokenExpiryNumber - 60 * 1000;
    if (now >= tokenExpiryNumber) {
      // Token fully expired: user must re-login or use refresh token flow
      console.log('Token expired, please login again.');
    } else if (now >= oneHourBeforeExpiry) {
      // Token valid but near expiry, refresh it now
      console.log('Token about to expire, refreshing...');
      const refreshedToken = await getAuthToken();
    } else {
      console.log('Token still valid, no refresh needed.');
    }

    AuthToken = await AsyncStorageHelper.getEncryptedData('@token');

    console.log('Authtoken from getAuthtoken=======>', AuthToken);
    headers['Authorization'] = Bearer ${JSON.parse(AuthToken as string)};
  }
  return headers;
};

// Handle Api Response
const handleResponse = async (response: any) => {
  const responseData = response?.data;
  console.log('API Response =========>', response);

  if (responseData?.access_token) {
    await AsyncStorageHelper.setEncryptedData(
      '@token',
      responseData?.access_token,
    );
    await AsyncStorageHelper.setEncryptedData(
      '@token_expires',
      responseData.expires_in,
    );
  }
  return response?.data;
};

// Handle Error Response With Proper Error Message
const handleErrorResponse = (errorResponse: any) => {
  if (!errorResponse) {
    ToastHelper.error('Network error. Please try again.');
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
    ToastHelper.error(validationErrors);
  } else if (status === 401) {
    ToastHelper.error(errorMessage);
    setTimeout(() => {
      if (errorMessage !== 'Invalid username or password') {
        // store.dispatch(userLoggedOut());
        // AsyncStorageHelper.removeStoredItem('@user');
        // AsyncStorageHelper.removeStoredItem('@token');
        // AsyncStorageHelper.removeStoredItem('@token_expiry');
        CommonHelper.logout();
      }
    }, 500);
  } else {
    console.log('errormessagge====>', errorMessage);
    ToastHelper.error(errorMessage);
  }
  return {...data, error: errorMessage, status};
};

// Api Configaration And Api call
const apiCall = async (
  method: string,
  route: string,
  params: object = {},
  tokenNeeded: boolean = true,
  contentType: string = 'application/json',
) => {
  console.log('route======>', route);
  const netInfo = await NetInfo.fetch();
  console.log('netInfo======>', netInfo.isConnected);
  if (!netInfo.isConnected) {
    ToastHelper.error(
      'No network connection. Please check your connection and try again.',
    );
    return null;
  }

  try {
    const headers = await prepareHeaders(tokenNeeded);
    headers['Content-Type'] = contentType;

    const config = {
      method,
      url: ${API_BASE}${route},
      headers,
      data: method !== 'get' && method !== 'delete' ? params : undefined,
      params: method === 'get' || method === 'delete' ? params : undefined,
      paramsSerializer: (
        params: {[s: string]: unknown} | ArrayLike<unknown>,
      ) => {
        return Object.entries(params)
          .map(
            ([key, value]) =>
              `${key}=${encodeURIComponent(
                typeof value === 'object'
                  ? JSON.stringify(value)
                  : value?.toString() ?? '',
              )}`,
          )
          .join('&');
      },
    };

    console.log('CONFIG ===> ', config);

    const response = await axios(config);
    return await handleResponse(response);
  } catch (err: any) {
    console.log('apiCallCatchError======>', err);
    return handleErrorResponse(err);
  }
};

export default {
  apiCall,
};
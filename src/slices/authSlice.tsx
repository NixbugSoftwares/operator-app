import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store/Store";
import commonApi from "../utils/commonApi";

// Define the auth state type
interface AuthState {
  user: any | null; // Store user data or token
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

export interface CompanyListParams {
  limit?: number;
  offset?: number;
  id?: number;
  name?: string;
}

export const LoginApi = createAsyncThunk(
  "token",
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "post",
        "/operator/company/account/token",
        data,
        false,
        "multipart/form-data"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.error || "Login failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
    }
  }
);


//listing company



export const companyListApi = createAsyncThunk(
  "/company",
  async (params: CompanyListParams, { rejectWithValue }) => {
    const { limit, offset, id, name } = params;
    const queryParams = {
      limit,
      offset,
      ...(id && { id }),
      ...(name && { name }),
    };
    try {
      const response = await commonApi.apiCall(
        "get",
        "/public/company",
        queryParams,
        false,
        "application/json"
      );
      if (!response) throw new Error("No response received");
      return {
        data: response.data || response,
      };
      
    } catch (error: any) {
      console.error("API Error:", error);
      return rejectWithValue({
        message: error.error || "Failed to fetch company list",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
    }
  }
);





// Create auth slice
export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
});

// Export selector
export const selectAuth = (state: RootState) => state.auth;

export default authSlice.reducer;

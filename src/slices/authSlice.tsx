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


export const LoginApi = createAsyncThunk(
  "token",
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "post",
        "/token",
        data,
        false,
        "multipart/form-data"
      );
      return response; // Ensure response contains `access_token`
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || "Login failed");
    }
  }
);


//listing company
export const companyListApi = createAsyncThunk(
  "/company",
  async (_, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "get",
        "/company",
        {},
        false,
        "application/json"
      );
      console.log("Full API Response==================>", response);

      if (Array.isArray(response)) {
        return response;
      }

      if (!response || !response.data) {
        throw new Error("Invalid response format");
      }

      return response.data;
    } catch (error: any) {
      console.log("Error fetching company list=====================>", error);
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch company list"
      );
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

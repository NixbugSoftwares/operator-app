import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../types/type";
import { RootState } from "../store/Store";
import commonApi from "../utils/commonApi";

// Define a type for the slice state
type status = "idle" | "loading";
interface AppState {
  splash: boolean;
  status: status | "idle" | "loading";
  loggedIn: boolean;
  loggedUser?: User;
  user: User | null;
  logincreds: {
    company_id: number;
    email: string;
    password: string;
  };
  accounts: any[];
  list: [];
  error: null;
  roles: any[];
}

// Define the initial state
const initialState: AppState = {
  splash: true,
  status: "idle",
  loggedIn: false,
  user: null,
  accounts: [],
  list: [],
  error: null,
  roles: [],
  logincreds: {
    company_id: 0,
    email: "",
    password: "",
  },

};

interface OperatorListParams {
  limit: number;
  offset: number;
  id?: string;
  fullName?: string;
  gender?: string;
  email_id?: string;
  phoneNumber?: string;
}

//Logout API
export const logoutApi = createAsyncThunk(
  "token",
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "delete",
        "/token",
        data,
        true,
        "application/json"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || "Logout failed");
    }
  }
);


// *************************************************Operatos Account*****************************************************************

//Get Operator List
export const operatorListApi = createAsyncThunk(
  "/Account",
  async (params: OperatorListParams, { rejectWithValue }) => {
    const { limit, offset, id, fullName, gender, email_id, phoneNumber } = params;
    console.log("operatorListApi called with:", params);

    const queryParams = {
      limit,
      offset,
      ...(id && { id }),
      ...(fullName && { full_name: fullName }),
      ...(gender && { gender }),
      ...(email_id && { email_id }),
      ...(phoneNumber && { phone_number: phoneNumber }),
    };
    try {
      const response = await commonApi.apiCall(
        "get",
        "/account",
        queryParams,
        true,
        "application/json"
        
      );
      if (!response) throw new Error("No response received");
      
      return {
        data: response.data || response,
      };
    } catch (error: any) {
      console.error("API Error:", error);
      return rejectWithValue(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch operator list"
      );
    }
  }
);

//Creat Operator
export const operatorCreationApi = createAsyncThunk(
  "/account",
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "post",
        "/account",
        data,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "operator creation failed"
      );
    }
  }
);

//Update Operator
export const accountupdationApi = createAsyncThunk(
  "/executive/account",
  async (
    { formData }: { accountId: number; formData: URLSearchParams },
    { rejectWithValue }
  ) => {
    try {
      const response = await commonApi.apiCall(
        "patch",
        `/executive/account`,
        formData,
        true,
        "application/x-www-form-urlencoded" // Use the correct content type
      );
      return response;
    } catch (error: any) {
      console.error("Backend Error Response:", error.response?.data); // Log the full error response
      return rejectWithValue(
        error?.response?.data?.message || "Account update failed"
      );
    }
  }
);


// ************************************************Operator Roles*******************************************************************



export const operatorRoleListApi = createAsyncThunk(
  "role",
  async (_, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "get",
        "/role",
        {},
        true,
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
      console.log("Error fetching role=====================>", error);
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch Role"
      );
    }
  }
);




//*******************************************Operator role mapping APIS*************************************************************
//role assign API
export const operatorRoleAssignApi = createAsyncThunk(
  "account/role",
  async (
    { executive_id, role_id }: { executive_id: number; role_id: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await commonApi.apiCall(
        "post",
        "/account/role",
        { executive_id, role_id },
        true,
        "application/x-www-form-urlencoded"
      );
      console.log("slice Responseyyyyyy==================>", response);

      return response;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Role assign failed"
      );
    }
  }
);





















// Slice
export const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    // Use the PayloadAction type to declare the contents of action.payload
    splashCompleted: (state, action: PayloadAction<boolean>) => {
      state.splash = action.payload;
    },
    setLoader: (state, action: PayloadAction<status>) => {
      state.status = action.payload;
    },
    userLoggedIn: (state, action: PayloadAction<User>) => {
      state.loggedIn = true;
      state.loggedUser = action.payload;
    },
    userLoggedOut: (state) => {
      state.loggedIn = false;
      state.loggedUser = undefined;
    },
    setLoggedUser: (state, action) => {
      state.loggedUser = action.payload;
    },

    setLoginCreds: (state, action) => {
      state.logincreds = action.payload;
    },
    // setRole: (state, action) => {
    //   state.accounts = action.payload;
    // },
  },
});

// Action creators are generated for each case reducer function
export const {
  userLoggedIn,
  userLoggedOut,
  setLoader,
  setLoggedUser,
  splashCompleted,
  setLoginCreds,
} = appSlice.actions;
// Export actions

export default appSlice.reducer;

// Slice store data selector function
export const getSplash = (state: RootState) => state.app.splash;
export const getStatus = (state: RootState) => state.app.status;
export const getLoggedIn = (state: RootState) => state.app.loggedIn;
export const getLoggedUser = (state: RootState) => state.app.loggedUser;
export const getLoginCreds = (state: RootState) => state.app.logincreds;

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


// Operatos Account
export const operatorListApi = createAsyncThunk(
  "/Account",
  async (_, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "get",
        "/account",
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
      console.log("Error fetching company list=====================>", error);
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch Account list"
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

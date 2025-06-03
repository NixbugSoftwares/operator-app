import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../types/type";
import { RootState } from "../store/Store";
import commonApi from "../utils/commonApi";
import { RoleDetails } from "../types/type";
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
  roleDetails: RoleDetails | null;
  permissions: any[];
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
  logincreds: {
    company_id: 0,
    email: "",
    password: "",
  },
  roleDetails: null,
  permissions: [],
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
interface RoleListParams {
  limit?: number;
  offset?: number;
  id?: number;
  name?: string;
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

//Fetch logged in user Role
export const loginUserAssignedRoleApi = createAsyncThunk<any[], number | undefined>(
  "role",
  async (assignedRoleId, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "get",
        "/role",
        {},
        true,
        "application/json"
      );

      if (!assignedRoleId) return response;

      const matchedRole = response.find(
        (role: { id: number }) => role.id === assignedRoleId
      );
      return matchedRole ? [matchedRole] : [];
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch Role"
      );
    }
  }
);

// *************************************************Operators Account*****************************************************************

//Get Operator List
export const operatorListApi = createAsyncThunk(
  "/Account",
  async (params: OperatorListParams, { rejectWithValue }) => {
    const { limit, offset, id, fullName, gender, email_id, phoneNumber } =
      params;
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
export const operatorUpdationApi = createAsyncThunk(
  "/executive/account",
  async (
    { formData }: { accountId: number; formData: FormData },
    { rejectWithValue }
  ) => {
    try {
      const response = await commonApi.apiCall(
        "patch",
        `/account`,
        formData,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      console.error("Backend Error Response:", error.response?.data); // Log the full error response
      return rejectWithValue(
        error?.response?.data?.message || "Operator account update failed"
      );
    }
  }
);

//Delete operator
export const accountDeleteApi = createAsyncThunk(
  "account/delete",
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "delete",
        "/account",
        data,
        true,
        "application/x-www-form-urlencoded"
      );

      return response;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Account deletion failed"
      );
    }
  }
);

// ************************************************Operator Roles*******************************************************************

//Fetch Operator Roles
export const operatorRoleListApi = createAsyncThunk(
  "/Role",
  async (params: RoleListParams, { rejectWithValue }) => {
    const { limit, offset, id, name } =
      params;
    console.log("operatorListApi called with:", params);

    const queryParams = {
      limit,
      offset,
      ...(id && { id }),
      ...(name && { name: name }),
    };
    try {
      const response = await commonApi.apiCall(
        "get",
        "/role",
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


export const operatorRoleCreationApi = createAsyncThunk(
  "/role",
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "post",
        "/role",
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

//operator role updation API
export const operatorRoleUpdationApi = createAsyncThunk(
  "/role",
  async (
    { formData }: { roleId: number; formData: FormData },
    { rejectWithValue }
  ) => {
    try {
      const response = await commonApi.apiCall(
        "patch",
        "/role",
        formData,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      console.error("Backend Error Response:", error.response?.data);
      return rejectWithValue(
        error?.response?.data?.message || "Role update failed"
      );
    }
  }
);

//Delete operator role
export const RoleDeleteApi = createAsyncThunk(
  "/delete",
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "delete",
        "/role",
        data,
        true,
        "application/x-www-form-urlencoded"
      );

      return response;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Role deletion failed"
      );
    }
  }
);

//*******************************************Operator role mapping APIS*************************************************************

//fetch operator role mapping
export const fetchRoleMappingApi = createAsyncThunk(
  "account/role",
  async (operator_id: number, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "get",
        "/account/role",
        { operator_id },
        true,
        "application/json"
      );

      // Handle case where response is an array (like your Postman example)
      if (Array.isArray(response) && response.length > 0) {
        return response[0]; // Return first mapping (assuming one operator has one role)
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch role mapping"
      );
    }
  }
);

//role assign API
export const operatorRoleAssignApi = createAsyncThunk(
  "account/role",
  async (
    { operator_id, role_id }: { operator_id: number; role_id: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await commonApi.apiCall(
        "post",
        "/account/role",
        { operator_id, role_id },
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

//role assign update
export const roleAssignUpdateApi = createAsyncThunk(
  "/executive/account/role",
  async (
    { id, role_id }: { id: number; role_id: number },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      formData.append("id", id.toString());
      formData.append("role_id", role_id.toString());

      const response = await commonApi.apiCall(
        "patch",
        "/account/role",
        formData,
        true,
        "application/x-www-form-urlencoded"
      );
      console.log("Role Assignment Update Response:", response);
      return response;
    } catch (error: any) {
      console.error("Backend Error Response:", error.response?.data);
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
    setRoleDetails: (state, action) => {
      state.roleDetails = action.payload;
    },
    clearRoleDetails: (state) => {
      state.roleDetails = null;
    },
    setPermissions: (state, action: PayloadAction<string[]>) => {
      state.permissions = action.payload;
    },
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
  setRoleDetails,
  clearRoleDetails,
  setPermissions,
} = appSlice.actions;
// Export actions

export default appSlice.reducer;

// Slice store data selector function
export const getSplash = (state: RootState) => state.app.splash;
export const getStatus = (state: RootState) => state.app.status;
export const getLoggedIn = (state: RootState) => state.app.loggedIn;
export const getLoggedUser = (state: RootState) => state.app.loggedUser;
export const getLoginCreds = (state: RootState) => state.app.logincreds;
export const getRoleDetails = (state: RootState) => state.app.roleDetails;

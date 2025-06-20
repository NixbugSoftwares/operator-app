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
interface BusListParams {
  limit?: number;
  offset?: number;
  id?: number;
  name?: string;
  registration_number?: string;
  capacity?: number;

}

interface LandmarkListParams {
  limit?: number;
  offset?: number;
  id?: number;
  name?: string;
}
interface RouteListParams {
  limit?: number;
  offset?: number;
  id?: number;
  name?: string;
}
interface FareListParams {
  limit?: number;
  offset?: number;
  id?: number;
  name?: string;
  scope?: number;
}

interface ServiceListParams {
  limit?: number;
  offset?: number;
  id?: string;
  name?: string;
  ticket_mode?: number;
  created_mode?: number;
  status?: number;
  status_list?: number[];
}

interface ScheduleListParams {
  limit?: number;
  offset?: number;
  id?: string;
  name?: string;
  permit_no?: string;
  trigger_mode?: number;
  ticket_mode?: number;
}

interface DutyListParams {
  limit?: number;
  offset?: number;
  id?: number;
  name?: string;
  status?: number;
  type?: number;
}

interface paperTicketListParams {
  limit?: number;
  offset?: number;
  id?: number;
  service_id?: number;
  pickup_point?:number;
  dropping_point?:number;
  amount?: number;  
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


export const companyUpdateApi = createAsyncThunk(
  "/company",
  async (
    { formData }: { companyId: number; formData: FormData },
    { rejectWithValue }
  ) => {
    try {
      const response = await commonApi.apiCall(
        "patch",
        `/company`,
        formData,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      console.error("Backend Error Response:", error.response?.data); // Log the full error response
      return rejectWithValue(
        error?.response?.data?.message || "company update failed"
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
  "/account",
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

//*******************************************Bus APIS*************************************************************
//bus list Api
export const companyBusListApi = createAsyncThunk(
  "/bus",
  async (params: BusListParams, { rejectWithValue }) => {
    const { limit, offset, id, name, registration_number, capacity } =
      params;
    console.log("companyBusListApi called with:", params);

    const queryParams = {
      limit,
      offset,
      ...(id && { id }),
      ...(name && { name: name }),
      ...(registration_number && { registration_number }),
      ...(capacity && { capacity }),
    };
    try {
      const response = await commonApi.apiCall(
        "get",
        "/company/bus",
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
          "Failed to fetch Bus list"
      );
    }
  }
);

//bus create Api
export const companyBusCreateApi = createAsyncThunk(
  "/bus",
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "post",
        "/company/bus",
        data,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || "Bus creation failed");
    }
  }
);

//bus update Api
export const companyBusUpdateApi = createAsyncThunk(
  "/bus",
  async ({ formData }: { busId: number; formData: FormData }, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "patch",
        "/company/bus",
        formData,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || "Bus update failed");
    }
  }
)

//bus delete Api
export const companyBusDeleteApi = createAsyncThunk(
  "/bus",
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "delete",
        "/company/bus",
        data,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || "Bus deletion failed");
    }
  }
);
//************************************************* Bus route APIs *******************************************************
//landmarkListingApi with verified status
export const landmarkListApi = createAsyncThunk(
  "/landmark",
  async (_, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "get",
        "/landmark",
        { status: 2 }, 
        true,
        "application/json"
      );

      console.log("Filtered Landmark API Response:", response);

      if (Array.isArray(response)) {
        return response;
      }

      if (!response || !response.data) {
        throw new Error("Invalid response format");
      }

      return response.data;
    } catch (error: any) {
      console.log("Error fetching filtered landmarks:", error);
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch landmarks"
      );
    }
  }
);


//route list Api

export const busRouteListApi = createAsyncThunk(
  "/company/route",
  async (params: RouteListParams, { rejectWithValue }) => {
    const{limit,offset,id,name}=params;
    console.log("companyBusListApi called with:", params);
    const queryParams = {
      limit,
      offset,
      ...(id && { id }),
      ...(name && { name: name }),
    }
    try {
      
      const response = await commonApi.apiCall(
        "get",
        "/company/route",
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
          "Failed to fetch Bus list"
      );
    }
  }
);


//route-landmark list api

export const busRouteLandmarkListApi = createAsyncThunk(
  "/company/route/landmark",
  async (routeId: number | null, { rejectWithValue }) => {
    try {
      const params = routeId ? { route_id: routeId } : {};
      const response = await commonApi.apiCall(
        "get",
        "/company/route/landmark",
        params,
        true,
        "application/json"
      );
      console.log("Full API Response==================>", response);

      // Check if response is directly an array
      if (Array.isArray(response)) {
        return response;
      }

      // Check if response.data exists
      if (!response || !response.data) {
        throw new Error("Invalid response format");
      }

      return response.data; // Ensure correct return
    } catch (error: any) {
      console.log("Error fetching route landmarks =====================>", error);
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch route landmarks"
      );
    }
  }
);


//route-delete Api
export const routeDeleteApi = createAsyncThunk(
  "/company/route",
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "delete",
        "/company/route",
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

//route creation API
export const routeCreationApi = createAsyncThunk(
  "/company/route",
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "post",
        "/company/route",
        data,
        true,
        "application/www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "route creation failed"
      );
    }
  }
);

//route-landmark creation API
export const routeLandmarkCreationApi = createAsyncThunk(
  "/company/route/landmark",
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "post",
        "/company/route/landmark",
        data,
        true,
        "application/www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "route-landmark creation failed"
      );
    }
  }
); 

//route-landmark Delete Api
export const routeLandmarkDeleteApi = createAsyncThunk(
  "/company/route/landmark",
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "delete",
        "/company/route/landmark",
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


//route update Api
export const routeUpdationApi = createAsyncThunk(
  "/company/route",
  async (
    { formData }: { routeId: number; formData: FormData },
    { rejectWithValue }
  ) => {
    try {
      const response = await commonApi.apiCall(
        "patch",
        "/company/route",
        formData,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      console.error("Backend Error Response:", error.response?.data); // Log the full error response
      return rejectWithValue(
        error?.response?.data?.message || "route update failed"
      );
    }
  }
);

//route-landmark update Api
export const routeLandmarkUpdationApi = createAsyncThunk(
  "/company/route/landmark",
  async (
    { formData }: { routeLandmarkId: number; formData: FormData },
    { rejectWithValue }
  ) => {
    try {
      const response = await commonApi.apiCall(
        "patch",
        "/company/route/landmark",
        formData,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      console.error("Backend Error Response:", error.response?.data); // Log the full error response
      return rejectWithValue(
        error?.response?.data?.message || "Route-landmark update failed"
      );
    }
  }
);



//*******************************Fare******************************
//fare listing Api
export const fareListingApi = createAsyncThunk(
   "/fare",
  async (params: FareListParams, { rejectWithValue }) => {
    const { limit, offset, id, name } =
      params;
    console.log("companyBusListApi called with:", params);

    const queryParams = {
      limit,
      offset,
      ...(id && { id }),
      ...(name && { name: name }),
      scop:2
    };
    try {
      const response = await commonApi.apiCall(
        "get",
        "/company/fare",
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
          "Failed to fetch fare list"
      );
    }
  }
)

//fare creation API
export const fareCreationApi = createAsyncThunk(
  "/company/fare",
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "post",
        "/company/fare",
        data,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "fare creation failed"
      );
    }
  }
);

//fare updation API
export const fareupdationApi = createAsyncThunk(
  "/company/fare",
  async (
    { formData }: { fareId: number; formData: FormData },
    { rejectWithValue }
  ) => {
    try {
      const response = await commonApi.apiCall(
        "patch",
        `/company/fare`,
        formData,
        true,
        "application/x-www-form-urlencoded" // Use the correct content type
      );
      return response;
    } catch (error: any) {
      console.error("Backend Error Response:", error.response?.data); // Log the full error response
      return rejectWithValue(
        error?.response?.data?.message || "Fare update failed"
      );
    }
  }
);
//fare delete API
export const fareDeleteApi = createAsyncThunk(
  "/company/fare",
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "delete",
        "/company/fare",
        data,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Fare deletion failed"
      );
    }
  }
);

//*******************************************Service**************************************************

//service listing Api
export const serviceListingApi = createAsyncThunk(
  "/service",
  async (params: ServiceListParams, { rejectWithValue }) => {
    const { limit, offset, id, name, created_mode, ticket_mode, status, status_list  } =
      params;

    const queryParams = {
      limit,
      offset,
      ...(id && { id }),
      ...(name && { name: name }),
      ...(created_mode && { created_mode }),
      ...(ticket_mode && { ticket_mode }),
      ...(status && { status }),
      ...(status_list && { status_list }),
    };
    try {
      const response = await commonApi.apiCall(
        "get",
        "/company/service",
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
          "Failed to fetch service list"
      );
    }
  }
)

//service creation Api
export const serviceCreationApi = createAsyncThunk(
  "/company/service",
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "post",
        "/company/service",
        data,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Service creation failed"
      );
    }
  }
);

//service updation Api
export const serviceupdationApi = createAsyncThunk(
  "/company/service",
  async (
    { formData }: { serviceId: number; formData: FormData },
    { rejectWithValue }
  ) => {
    try {
      const response = await commonApi.apiCall(
        "patch",
        `/company/service`,
        formData,
        true,
        "application/x-www-form-urlencoded" 
      );
      return response;
    } catch (error: any) {
      console.error("Backend Error Response:", error.response?.data); 
      return rejectWithValue(
        error?.response?.data?.message || "Service update failed"
      );
    }
  }
);

//service Deletion Api
export const serviceDeleteApi = createAsyncThunk(
  "/company/service",
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "delete",
        "/company/service",
        data,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Service deletion failed"
      );
    }
  }
);

//*******************************************Schedule**************************************************

//schedule listing api
export const scheduleListingApi = createAsyncThunk(
  "/schedule",
  async (params: ScheduleListParams, { rejectWithValue }) => {
    const { limit, offset, id, name, permit_no , trigger_mode, ticket_mode,  } =
      params;

    const queryParams = {
      limit,
      offset,
      ...(id && { id }),
      ...(name && { name: name }),
      ...(permit_no && { permit_no }),
      ...(ticket_mode && { ticket_mode }),
      ...(trigger_mode && { trigger_mode }),
    };
    try {
      const response = await commonApi.apiCall(
        "get",
        "/company/schedule",
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
          "Failed to fetch schedule list"
      );
    }
  }
)

//schedule creation Api
export const scheduleCreationApi = createAsyncThunk(
  "/company/schedule",
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "post",
        "/company/schedule",
        data, 
        true,
        "application/json" 
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Schedule creation failed"
      );
    }
  }
);

//schedule updation Api
export const scheduleUpdationApi = createAsyncThunk(
  "/company/schedule",
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "patch",
        "/company/schedule",
        data, 
        true,
        "application/json" 
      );
      return response;
    } catch (error: any) {
      console.error("Backend Error Response:", error.response?.data); // Log the full error response
      return rejectWithValue(
        error?.response?.data?.message || "Schedule update failed"
      );
    }
  }
);

//schedule deletion Api
export const scheduleDeleteApi = createAsyncThunk(
  "/company/schedule",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "delete",
        "/company/schedule",
        id, 
        true,
        "application/json"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Schedule deletion failed"
      );
    }
  }
);


//*******************************************Duty**************************************************  

//duty listing Api
export const dutyListingApi = createAsyncThunk(
  "/duty",
  async (params: DutyListParams, { rejectWithValue }) => {
    const { limit, offset, id, name, status, type } = params;
    const queryParams = {
      limit,
      offset,
      ...(id && { id }),
      ...(name && { name }),
      ...(status && { status }),
      ...(type && { type }),
    };
    try {
      const response = await commonApi.apiCall(
        "get",
        "/company/service/duty",
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
          "Failed to fetch duty list"
      );
    }
  }
);

//duty creation Api
export const dutyCreationApi = createAsyncThunk(
  "/company/service/duty",
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "post",
        "/company/service/duty",
        data,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Duty creation failed"
      );
    }
  }
);

//duty updation Api
export const dutyupdationApi = createAsyncThunk(
  "/company/service/duty",
  async (
    { formData }: { dutyId: number; formData: FormData },
    { rejectWithValue }
  ) => {
    try {
      const response = await commonApi.apiCall(
        "patch",
        `/company/service/duty`,
        formData,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      console.error("Backend Error Response:", error.response?.data);
      return rejectWithValue(
        error?.response?.data?.message || "Duty update failed"
      );
    }
  }
);

//duty Deletion Api
export const dutyDeleteApi = createAsyncThunk(
  "/company/service/duty",
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "delete",
        "/company/service/duty",
        data,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Duty deletion failed"
      );
    }
  }
)


//*********************************************paper ticket**************************************

//Paper ticket listing Api
export const paperTicketListingApi = createAsyncThunk(
  "/paper-ticket",
  async (params: paperTicketListParams, { rejectWithValue }) => {
    const { limit, offset, id, service_id, pickup_point, dropping_point, amount } = params;
    const queryParams = {
      limit,
      offset,
      ...(id && { id }),
      ...(service_id && { service_id }),
      ...(pickup_point && { pickup_point }),
      ...(dropping_point && { dropping_point }),
      ...(amount && { amount }),
    };
    try {
      const response = await commonApi.apiCall(
        "get",
        "/company/service/paper_ticket",
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
          "Failed to fetch paper ticket list"
      );
    }
  }
);
//for landmark
export const landmarkNameApi = createAsyncThunk(
  "/landmark",
  async (params: LandmarkListParams, { rejectWithValue }) => {
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
        "/landmark",
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
          "Failed to fetch landmark list"
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

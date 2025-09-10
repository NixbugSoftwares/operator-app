import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../types/type";
import { RootState } from "../store/Store";
import commonApi from "../utils/commonApi";
import { RoleDetails } from "../types/type";
// Define a type for the slice state
interface AppState {
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
  limit?: number;
  offset?: number;
  id?: string;
  id_list?: string[];
  full_name?: string;
  gender?: string;
  email_id?: string;
  phoneNumber?: string;
  status?: number;
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
  capacity_le?: number;
  status?: number;

}
interface LandmarkListParams {
  limit?: number;
  offset?: number;
  id?: number;
  id_list?: number[];
  name?: string;
  location?: string;
  type?: string;
  type_list?: number[];
  order_by?: number;
  order_in?: number;
}
interface RouteListParams {
  limit?: number;
  offset?: number;
  id?: number;
  name?: string;
  status?: number;
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
  company_id?: number;
  id?: string;
  id_list?: string[];
  name?: string;
  ticket_mode?: number;
  status?: number;
  status_list?: number[];
  bus_id?: number;
  starting_at_ge?: string;
  starting_at_le?: string;
  order_by?: number;
  order_in?: number;
}

interface ScheduleListParams {
  limit?: number;
  offset?: number;
  id?: string;
  name?: string;
  permit_no?: string;
  triggering_mode?: number;
  ticketing_mode?: number;
}

interface DutyListParams {
  limit?: number;
  offset?: number;
  id?: number;
  name?: string;
  status?: number;
  type?: number;
  company_id?: number;
  service_id?: number;
  status_list?: number[];
  service_id_list?: number[];
  operator_id?: number;
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

interface CompanyGetParams{
  limit?: number;
  offset?: number;
  id?: number;
}
//Logout API
export const logoutApi = createAsyncThunk(
  "token",
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "delete",
        "/operator/company/account/token",
        data,
        true,
        "application/json"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.error || "Logout failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
    }
  }
);

//Fetch logged in user Role
export const loggedinUserRoleDetails = createAsyncThunk<
  any[],
  number | undefined
>("role", async (assignedRoleId, { rejectWithValue }) => {
  try {
    const response = await commonApi.apiCall(
      "get",
      "/operator/company/role",
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
    return rejectWithValue({
        message: error.error || "failed to fetch role",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
  }
});


export const userCompanyGetApi = createAsyncThunk(
  "/company",
  async (params: CompanyGetParams, { rejectWithValue }) => {
    const { limit, offset, id } = params;
    const queryParams = {
      limit,
      offset,
      ...(id && { id }),
    };
    try {
      const response = await commonApi.apiCall(
        "get",
        "/operator/company",
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
      return rejectWithValue({
        message: error.error || " company fetch failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        `/operator/company`,
        formData,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.error || " company update failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
    }
  }
);


// *************************************************Operators Account*****************************************************************

//Get Operator List
export const operatorListApi = createAsyncThunk(
  "/Account",
  async (params: OperatorListParams, { rejectWithValue }) => {
    const { limit, offset, id, full_name, status, gender, email_id, phoneNumber, id_list } =
      params;
    const queryParams = {
      limit,
      offset,
      ...(id && { id }),
      ...(id_list && { id_list }),
      ...(full_name && { full_name: full_name }),
      ...(gender && { gender }),
      ...(email_id && { email_id }),
      ...(phoneNumber && { phone_number: phoneNumber }),
      ...(status && { status }),
    };
    try {
      const response = await commonApi.apiCall(
        "get",
        "/operator/company/account",
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
      return rejectWithValue({
        message: error.error || "operator fetch failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/company/account",
        data,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.error || "Operator account creation failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/company/account",
        formData,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      console.error("Backend Error Response:", error); 
      return rejectWithValue({
        message: error.error || " Operator account updation failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/company/account",
        data,
        true,
        "application/x-www-form-urlencoded"
      );

      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.error || " Operator account deletion failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
    const queryParams = {
      limit,
      offset,
      ...(id && { id }),
      ...(name && { name: name }),
    };
    try {
      const response = await commonApi.apiCall(
        "get",
        "/operator/company/role",
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
      return rejectWithValue({
        message: error.error || " operator role fetch failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
    }
  }
);


export const operatorRoleCreationApi = createAsyncThunk(
  "/role",
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "post",
        "/operator/company/role",
        data,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.error || " operator role creation failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/company/role",
        formData,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      console.error("Backend Error Response:", error.response?.data);
      return rejectWithValue({
        message: error.error || " operator role updation failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
    }
  }
);

//Delete operator role
export const operatorRoleDeleteApi = createAsyncThunk(
  "/delete",
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "delete",
        "/operator/company/role",
        data,
        true,
        "application/x-www-form-urlencoded"
      );

      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.error || " operator role deletion failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/company/account/role",
        { operator_id },
        true,
        "application/json"
      );

      if (Array.isArray(response) && response.length > 0) {
        return response[0]; 
      }
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.error ||  "Role mapping fetch failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/company/account/role",
        { operator_id, role_id },
        true,
        "application/x-www-form-urlencoded"
      );

      return response;
    } catch (error: any) {
     return rejectWithValue({
        message: error.error || " Role assign failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/company/account/role",
        formData,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      console.error("Backend Error Response:", error.response?.data);
      return rejectWithValue({
        message: error.error ||" Role assign update failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
    }
  }
);

//*******************************************Bus APIS*************************************************************
//bus list Api
export const companyBusListApi = createAsyncThunk(
  "/bus",
  async (params: BusListParams, { rejectWithValue }) => {
    const { limit, offset, id, name, registration_number,status, capacity_le } =
      params;

    const queryParams = {
      limit,
      offset,
      ...(id && { id }),
      ...(name && { name: name }),
      ...(registration_number && { registration_number }),
      ...(capacity_le && { capacity_le }),
      ...(status && { status }),
    };
    try {
      const response = await commonApi.apiCall(
        "get",
        "/operator/company/bus",
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
      return rejectWithValue({
        message: error.error || " Bus list failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/company/bus",
        data,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.error || " Bus create failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/company/bus",
        formData,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.error || " Bus update failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/company/bus",
        data,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.error || " Bus delete failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
    }
  }
);
//************************************************* Bus route APIs *******************************************************
//landmarkListingApi with verified status
export const landmarkListApi = createAsyncThunk(
  "/executive/landmark",
  async (params: LandmarkListParams, { rejectWithValue }) => {
    const { limit, offset, id, id_list, name, location,type, order_by, order_in, type_list } = params;
    const queryParams = {
      limit,
      offset,
      ...(id && { id }),
      ...(id_list && { id_list }),
      ...(name && { name }),
      ...(location && { location }),
      ...(type && { type }),
      ...(order_by && { order_by }),
      ...(order_in && { order_in }),
      ...(type_list && { type_list }),

    };
    try {
      const response = await commonApi.apiCall(
        "get",
        "/operator/landmark",
        queryParams,
        true,
        "application/json"
      );

      return { data: response || response.data };
    } catch (error: any) {
      return rejectWithValue({
        message: error.error || " Landmark list failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
    }
  }
);

//route list Api

export const busRouteListApi = createAsyncThunk(
  "/company/route",
  async (params: RouteListParams, { rejectWithValue }) => {
    const{limit,offset,id,name, status}=params;
    const queryParams = {
      limit,
      offset,
      ...(id && { id }),
      ...(name && { name: name }),
      ...(status && { status }),
    }
    try {
      
      const response = await commonApi.apiCall(
        "get",
        "/operator/company/route",
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
      return rejectWithValue({
        message: error.error || " route fetch failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/company/route/landmark",
        params,
        true,
        "application/json"
      );

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
      return rejectWithValue({
        message: error.error || " route landmark fetch failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/company/route",
        data,
        true,
        "application/x-www-form-urlencoded"
      );

      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.error || " route delete failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/company/route",
        data,
        true,
        "application/www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.error || " route creation failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });;
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
        "/operator/company/route/landmark",
        data,
        true,
        "application/www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.error || " route landmark creation failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/company/route/landmark",
        data,
        true,
        "application/x-www-form-urlencoded"
      );

      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.error || " route landmark delete failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/company/route",
        formData,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      console.error("Backend Error Response:", error.response?.data); // Log the full error response
      return rejectWithValue({
        message: error.error || " route update failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/company/route/landmark",
        formData,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      console.error("Backend Error Response:", error.response?.data); // Log the full error response
      return rejectWithValue({
        message: error.error || " route landmark update failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
    }
  }
);



//*******************************Fare******************************
//fare get api
export const fareListApi = createAsyncThunk(
  "/fare",
  async (params: FareListParams, { rejectWithValue }) => {
    const {
      limit,
      offset,
      id,
      name,
      scope, 
    } = params;

    const queryParams = {
      limit,
      offset,
      ...(id && { id }),
      ...(name && { name }),
      ...(scope && { scope }),
    };
    try {
      const response = await commonApi.apiCall(
        "get",
        "/operator/company/fare",
        queryParams,
        true,
        "application/json"
      );
      if (!response) throw new Error("No response received");
      return { data: response };
    } catch (error: any) {
      console.error("API Error:", error);
      return rejectWithValue({
        message: error.error || " Fare list failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
    }
  }
);

//fare creation API
export const fareCreationApi = createAsyncThunk(
  "/executive/company/fare",
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "post",
        "/operator/company/fare",
        data,
        true,
        "application/json" 
      );
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.error || " Fare creation failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
    }
  }
);


//fare updation API
export const fareupdationApi = createAsyncThunk(
  "/executive/company/fare",
  async (
    {  fareUpdate }: { fareId: number; fareUpdate: any },
    { rejectWithValue }
  ) => {
    try {
      const response = await commonApi.apiCall(
        "patch",
        `/operator/company/fare`,
        fareUpdate,
        true,
        "application/json" 
      );
      return response;
    } catch (error: any) {
      console.error("Backend Error Response:", error.response?.data);
      return rejectWithValue({
        message: error.error || " Fare updation failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
    }
  }
);
//fare delete API
export const fareDeleteApi = createAsyncThunk(
  "executive/company/fare",
  async ({  fareId }: { fareId: number;}, { rejectWithValue }) => {
    try {
      const response = await commonApi.apiCall(
        "delete",
        "/operator/company/fare",
        fareId,
        true,
        "application/jason"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.error || " Fare deletion failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
    }
  }
);

//*******************************************Service**************************************************

//service listing Api
export const serviceListingApi = createAsyncThunk(
  "/service",
  async (params: ServiceListParams, { rejectWithValue }) => {
    const { limit, offset, id, name, ticket_mode, status, status_list, bus_id, starting_at_ge, starting_at_le, order_by, order_in, id_list } =
      params;

    const queryParams = {
      limit,
      offset,
      ...(id && { id }),
      ...(id_list && { id_list }),
      ...(name && { name: name }),
      ...(ticket_mode && { ticket_mode }),
      ...(status && { status }),
      ...(status_list && { status_list }),
      ...(bus_id && { bus_id }),
      ...(starting_at_ge && { starting_at_ge }),
      ...(starting_at_le && { starting_at_le }),
      ...(order_by && { order_by }),
      ...(order_in && { order_in }),
    };
    try {
      const response = await commonApi.apiCall(
        "get",
        "/operator/company/service",
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
      return rejectWithValue({
        message: error.error || " Service list failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/company/service",
        data,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.error || " Service creation failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        `/operator/company/service`,
        formData,
        true,
        "application/x-www-form-urlencoded" 
      );
      return response;
    } catch (error: any) {
      console.error("Backend Error Response:", error.response?.data); 
      return rejectWithValue({
        message: error.error || " Service updation failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/company/service",
        data,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.error || " Service deletion failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
    }
  }
);

//*******************************************Schedule**************************************************

//schedule listing api
export const scheduleListingApi = createAsyncThunk(
  "/schedule",
  async (params: ScheduleListParams, { rejectWithValue }) => {
    const { limit, offset, id, name, permit_no , triggering_mode, ticketing_mode,  } =
      params;

    const queryParams = {
      limit,
      offset,
      ...(id && { id }),
      ...(name && { name: name }),
      ...(permit_no && { permit_no }),
      ...(ticketing_mode && { ticketing_mode }),
      ...(triggering_mode && { triggering_mode }),
    };
    try {
      const response = await commonApi.apiCall(
        "get",
        "/operator/company/schedule",
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
      return rejectWithValue({
        message: error.error || " Schedule list failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/company/schedule",
        data, 
        true,
        "application/json" 
      );
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.error || " Schedule creation failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/company/schedule",
        data, 
        true,
        "application/json" 
      );
      return response;
    } catch (error: any) {
      console.error("Backend Error Response:", error.response?.data); // Log the full error response
      return rejectWithValue({
        message: error.error || " Schedule updation failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/company/schedule",
        id, 
        true,
        "application/json"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.error || " Schedule deletion failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
    }
  }
);


//*******************************************Duty**************************************************  

//duty listing Api
export const dutyListingApi = createAsyncThunk(
  "/duty",
  async (params: DutyListParams, { rejectWithValue }) => {
    const { limit, offset, id, name, status, status_list, type, service_id, service_id_list, operator_id } = params;
    const queryParams = {
      limit,
      offset,
      ...(id && { id }),
      ...(name && { name }),
      ...(status && { status }),
      ...(status_list && { status_list }),
      ...(type && { type }),
      ...(service_id && { service_id }),
      ...(service_id_list && { service_id_list }),
      ...(operator_id && { operator_id }),
    };
    try {
      const response = await commonApi.apiCall(
        "get",
        "/operator/company/service/duty",
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
      return rejectWithValue({
        message: error.error || " Duty list failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/company/service/duty",
        data,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.error || "",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        `/operator/company/service/duty`,
        formData,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      console.error("Backend Error Response:", error.response?.data);
      return rejectWithValue({
        message: error.error || " Duty updation failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/company/service/duty",
        data,
        true,
        "application/x-www-form-urlencoded"
      );
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.error || " Duty deletion failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/company/service/ticket/paper",
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
      return rejectWithValue({
        message: error.error || "",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
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
        "/operator/landmark",
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
      return rejectWithValue({
        message: error.error || " Landmark list failed",
        status: error.status,
        type: error.type,
        details: error.details,
        rawError: error
      });
    }
  }
);


// Slice
export const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    
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
  setLoggedUser,
  setLoginCreds,
  setRoleDetails,
  clearRoleDetails,
  setPermissions,
} = appSlice.actions;
// Export actions

export default appSlice.reducer;

// Slice store data selector functions
export const getLoggedIn = (state: RootState) => state.app.loggedIn;
export const getLoggedUser = (state: RootState) => state.app.loggedUser;
export const getLoginCreds = (state: RootState) => state.app.logincreds;
export const getRoleDetails = (state: RootState) => state.app.roleDetails;

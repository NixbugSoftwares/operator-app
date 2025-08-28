// const handleLogin = async (data: LoginFormData) => {
//     setLoading(true);
//     try {
//       const response = await dispatch(
//         LoginApi({
//           username: data.username,
//           password: data.password,
//           company_id: 1,
//         }),
//       ).unwrap();
//       console.log('Login Response=====>', response);
//       if (response?.access_token) {
//         const user = {username: data?.username, userId: response?.operator_id};
//         const access_token = response?.access_token;
//         const expiresAt = Date.now() + response?.expires_in * 1000;
//         await AsyncStorageHelper.setEncryptedData('@token', access_token);
//         await AsyncStorageHelper.setEncryptedData('@token_expires', expiresAt);
//         await AsyncStorageHelper.setEncryptedData('@user', user);
//         dispatch(userLoggedIn(user));
//       } else {
//         Keyboard.dismiss();
//       }
//     } catch (error) {
//       console.error('Login Error:', error);
//       ToastHelper.error('An error occurred during login');
//     } finally {
//       setLoading(false);
//     }
//   };




//   import axios from 'axios';
// import moment from 'moment';
// import NetInfo from '@react-native-community/netinfo';
// import AsyncStorageHelper from '../utilits/AsyncStorageHelper';
// import ToastHelper from '../utilits/ToastHelper';
// import CommonHelper from './CommonHelper';
// // import DotEnvHelper from './DotEnvHelper';
// // import { userLoggedOut } from '../slices/AppSlicce';
// // export const API_BASE = DotEnvHelper.getApiUrl();

// const API_BASE = 'https://entebus-api.nixbug.com/operator';

// // Function to get auth token Before The existing One Expires
// const getAuthToken = async () => {
//   try {
//     const token = await AsyncStorageHelper.getEncryptedData('@token');
//     console.log('token in getAuthtoken==========>', token);
//     if (token === null || token === undefined) {
//       throw new Error('Token not found');
//     }
//     const response = await axios.patch(
//       ${API_BASE}/token,
//       {},
//       {headers: {Authorization: Bearer ${JSON.parse(token as string)}}},
//     );

//     console.log('getAuthtokenResponse===========>', response?.data);

//     const data = response?.data;
//     const createdOn = new Date(data?.created_on).getTime(); // in ms
//     const expiresInMs = data?.expires_in * 1000;
//     const expiresAt = createdOn + expiresInMs;

//     await AsyncStorageHelper.setEncryptedData('@token', data?.access_token);
//     await AsyncStorageHelper.setEncryptedData('@token_expires', expiresAt);

//     return data?.access_token;
//   } catch (err) {
//     console.error('Error in getAuthToken', err);
//     throw err;
//   }
// };

// // Prepare headers For the Api call
// const prepareHeaders = async (tokenNeeded: boolean) => {
//   console.log('prepareHeader function executed....');

//   let headers: any = {'Content-Type': 'application/json'};

//   if (tokenNeeded) {
//     console.log('token needed condition become ture');
//     let AuthToken = await AsyncStorageHelper.getEncryptedData('@token');
//     const tokenExpiry = await AsyncStorageHelper.getEncryptedData(
//       '@token_expires',
//     );

//     console.log('Authtoken======>', AuthToken);
//     console.log('AuthtokenExpiry======>', tokenExpiry);

//     if (!AuthToken) {
//       console.log('Token not found');
//       throw new Error('Token not found');
//     }
//     if (!tokenExpiry) {
//       throw new Error('Token expiry not found');
//     }

//     // Ensure tokenExpiry is a number
//     const tokenExpiryNumber = Number(tokenExpiry);
//     if (isNaN(tokenExpiryNumber)) {
//       throw new Error('Invalid token expiry timestamp');
//     }

//     const now = Date.now();
//     // const oneHourBeforeExpiry = tokenExpiryNumber - 3600 * 1000; // 1 hour before expiry
//     const oneHourBeforeExpiry = tokenExpiryNumber - 60 * 1000;
//     if (now >= tokenExpiryNumber) {
//       // Token fully expired: user must re-login or use refresh token flow
//       console.log('Token expired, please login again.');
//     } else if (now >= oneHourBeforeExpiry) {
//       // Token valid but near expiry, refresh it now
//       console.log('Token about to expire, refreshing...');
//       const refreshedToken = await getAuthToken();
//     } else {
//       console.log('Token still valid, no refresh needed.');
//     }

//     AuthToken = await AsyncStorageHelper.getEncryptedData('@token');

//     console.log('Authtoken from getAuthtoken=======>', AuthToken);
//     headers['Authorization'] = Bearer ${JSON.parse(AuthToken as string)};
//   }
//   return headers;
// };

// // Handle Api Response
// const handleResponse = async (response: any) => {
//   const responseData = response?.data;
//   console.log('API Response =========>', response);

//   if (responseData?.access_token) {
//     await AsyncStorageHelper.setEncryptedData(
//       '@token',
//       responseData?.access_token,
//     );
//     await AsyncStorageHelper.setEncryptedData(
//       '@token_expires',
//       responseData.expires_in,
//     );
//   }
//   return response?.data;
// };

// // Handle Error Response With Proper Error Message
// const handleErrorResponse = (errorResponse: any) => {
//   if (!errorResponse) {
//     ToastHelper.error('Network error. Please try again.');
//     return {error: 'Network error'};
//   }
//   const {status, data} = errorResponse.response as {status: number; data: any};
//   const errorMessage = data?.detail || data?.message || 'Api Failed';
//   console.log('dataaaaaa===>', status, data?.detail);

//   if (status == 400 && Array.isArray(data?.detail)) {
//     const validationErrors = (data as any).message
//       .map((err: any) => Object.values(err.constraints).join(', '))
//       .join(' | ');
//     console.log('validation====>', validationErrors);
//     ToastHelper.error(validationErrors);
//   } else if (status === 401) {
//     ToastHelper.error(errorMessage);
//     setTimeout(() => {
//       if (errorMessage !== 'Invalid username or password') {
//         // store.dispatch(userLoggedOut());
//         // AsyncStorageHelper.removeStoredItem('@user');
//         // AsyncStorageHelper.removeStoredItem('@token');
//         // AsyncStorageHelper.removeStoredItem('@token_expiry');
//         CommonHelper.logout();
//       }
//     }, 500);
//   } else {
//     console.log('errormessagge====>', errorMessage);
//     ToastHelper.error(errorMessage);
//   }
//   return {...data, error: errorMessage, status};
// };

// // Api Configaration And Api call
// const apiCall = async (
//   method: string,
//   route: string,
//   params: object = {},
//   tokenNeeded: boolean = true,
//   contentType: string = 'application/json',
// ) => {
//   console.log('route======>', route);
//   const netInfo = await NetInfo.fetch();
//   console.log('netInfo======>', netInfo.isConnected);
//   if (!netInfo.isConnected) {
//     ToastHelper.error(
//       'No network connection. Please check your connection and try again.',
//     );
//     return null;
//   }

//   try {
//     const headers = await prepareHeaders(tokenNeeded);
//     headers['Content-Type'] = contentType;

//     const config = {
//       method,
//       url: ${API_BASE}${route},
//       headers,
//       data: method !== 'get' && method !== 'delete' ? params : undefined,
//       params: method === 'get' || method === 'delete' ? params : undefined,
//       paramsSerializer: (
//         params: {[s: string]: unknown} | ArrayLike<unknown>,
//       ) => {
//         return Object.entries(params)
//           .map(
//             ([key, value]) =>
//               `${key}=${encodeURIComponent(
//                 typeof value === 'object'
//                   ? JSON.stringify(value)
//                   : value?.toString() ?? '',
//               )}`,
//           )
//           .join('&');
//       },
//     };

//     console.log('CONFIG ===> ', config);

//     const response = await axios(config);
//     return await handleResponse(response);
//   } catch (err: any) {
//     console.log('apiCallCatchError======>', err);
//     return handleErrorResponse(err);
//   }
// };

// export default {
//   apiCall,
// };





// import React, { useCallback, useEffect, useState, useMemo } from "react";
// import { useForm, SubmitHandler, Controller } from "react-hook-form";
// import {
//   Box,
//   TextField,
//   Button,
//   Typography,
//   Container,
//   CssBaseline,
//   CircularProgress,
//   MenuItem,
//   Autocomplete,
//   Alert,
// } from "@mui/material";
// import { useAppDispatch } from "../../store/Hooks";
// import {
//   serviceCreationApi,
//   busRouteListApi,
//   fareListApi,
//   companyBusListApi,
// } from "../../slices/appSlice";
// import {
//   showErrorToast,
//   showSuccessToast,
// } from "../../common/toastMessageHelper";
// import { Service } from "../../types/type";

// interface IOperatorCreationFormProps {
//   onClose: () => void;
//   refreshList: (value: any) => void;
// }

// const ticketModeOptions = [
//   { label: "Hybrid", value: 1 },
//   { label: "Digital", value: 2 },
//   { label: "Conventional", value: 3 },
// ];

// interface DropdownItem {
//   id: number;
//   name: string;
//   start_time?: string;
//   formattedTime?: string;
// }

// // --- helpers for 12h/24h conversion ---
// const formatTo12Hour = (time: string) => {
//   if (!time) return "";
//   let [hours, minutes] = time.split(":").map(Number);
//   const ampm = hours >= 12 ? "PM" : "AM";
//   hours = hours % 12 || 12;
//   return `${hours.toString().padStart(2, "0")}:${minutes
//     .toString()
//     .padStart(2, "0")} ${ampm}`;
// };

// const formatTo24Hour = (time: string) => {
//   if (!time) return "";
//   const match = time.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
//   if (!match) return "";
//   let hours = parseInt(match[1], 10);
//   const minutes = parseInt(match[2], 10);
//   const period = match[3].toUpperCase();
//   if (period === "PM" && hours !== 12) hours += 12;
//   if (period === "AM" && hours === 12) hours = 0;
//   return `${hours.toString().padStart(2, "0")}:${minutes
//     .toString()
//     .padStart(2, "0")}`;
// };

// const ServiceCreationForm: React.FC<IOperatorCreationFormProps> = ({
//   onClose,
//   refreshList,
// }) => {
//   const dispatch = useAppDispatch();
//   const [loading, setLoading] = useState(false);
//   const [dropdownData, setDropdownData] = useState({
//     busList: [] as DropdownItem[],
//     routeList: [] as DropdownItem[],
//     fareList: [] as DropdownItem[],
//   });
//   const [searchParams, setSearchParams] = useState({
//     bus: "",
//     route: "",
//     fare: "",
//   });
//   const [page, setPage] = useState({
//     bus: 0,
//     route: 0,
//     fare: 0,
//   });
//   const [hasMore, setHasMore] = useState({
//     bus: true,
//     route: true,
//     fare: true,
//   });

//   const rowsPerPage = 10;

//   const [_selectedRouteStartTimeRaw, setSelectedRouteStartTimeRaw] =
//     useState<string>("");
//   const [selectedRouteTimeIst, setSelectedRouteTimeIst] = useState<string>(""); // always stored in 24h
//   const [displayRouteTime, setDisplayRouteTime] = useState<string>(""); // shown as 12h

//   const {
//     register,
//     handleSubmit,
//     control,
//     formState: { errors },
//   } = useForm<Service>({
//     defaultValues: {
//       ticket_mode: "1",
//       created_mode: "1",
//       starting_at: new Date().toISOString().split("T")[0],
//     },
//   });

//   const memoizedBusList = useMemo(
//     () => dropdownData.busList,
//     [dropdownData.busList]
//   );
//   const memoizedRouteList = useMemo(
//     () => dropdownData.routeList,
//     [dropdownData.routeList]
//   );
//   const memoizedFareList = useMemo(
//     () => dropdownData.fareList,
//     [dropdownData.fareList]
//   );

//   const fetchBusList = useCallback(
//     (pageNumber: number, searchText = "") => {
//       const offset = pageNumber * rowsPerPage;
//       dispatch(
//         companyBusListApi({
//           limit: rowsPerPage,
//           offset,
//           name: searchText,
//           status: 1,
//         })
//       )
//         .unwrap()
//         .then((res) => {
//           const items = res.data || [];
//           const formattedBusList = items.map((bus: any) => ({
//             id: bus.id,
//             name: bus.name ?? "-",
//           }));
//           setDropdownData((prev) => ({
//             ...prev,
//             busList:
//               pageNumber === 0
//                 ? formattedBusList
//                 : [...prev.busList, ...formattedBusList],
//           }));
//           setHasMore((prev) => ({
//             ...prev,
//             bus: items.length === rowsPerPage,
//           }));
//         })
//         .catch((error) => {
//           showErrorToast(error.message || "Failed to fetch Bus list");
//         });
//     },
//     [dispatch]
//   );

//   const fetchFareList = useCallback(
//     async (pageNumber: number, searchText = "") => {
//       const offset = pageNumber * rowsPerPage;
//       try {
//         const res = await dispatch(
//           fareListApi({
//             limit: rowsPerPage,
//             offset,
//             name: searchText,
//           })
//         ).unwrap();

//         const fares = res.data || [];

//         const formattedFareList = fares.map((fare: any) => ({
//           id: fare.id,
//           name: fare.name ?? "-",
//         }));

//         setDropdownData((prev) => ({
//           ...prev,
//           fareList:
//             pageNumber === 0
//               ? formattedFareList
//               : [...prev.fareList, ...formattedFareList],
//         }));
//       } catch (error: any) {
//         showErrorToast(error.message || "Failed to fetch Fare list");
//       }
//     },
//     [dispatch, rowsPerPage]
//   );

//   const convertUtcToIstTimeInput = (utcTime: string): string => {
//     if (!utcTime) return "";
//     const normalized = utcTime.endsWith("Z") ? utcTime : `${utcTime}Z`;
//     const utcDate = new Date(`1970-01-01T${normalized}`);
//     return utcDate
//       .toLocaleTimeString("en-GB", {
//         timeZone: "Asia/Kolkata",
//         hour: "2-digit",
//         minute: "2-digit",
//         hour12: false,
//       })
//       .slice(0, 5);
//   };

//   const fetchRouteList = useCallback(
//     (pageNumber: number, searchText = "") => {
//       const offset = pageNumber * rowsPerPage;
//       dispatch(
//         busRouteListApi({
//           limit: rowsPerPage,
//           offset,
//           name: searchText,
//           status: 1,
//         })
//       )
//         .unwrap()
//         .then((res) => {
//           const items = res.data || [];
//           const formattedList = items.map((item: any) => ({
//             id: item.id,
//             name: item.name ?? "-",
//             start_time: item.start_time,
//             formattedTime: item.start_time
//               ? convertUtcToIstTimeInput(item.start_time)
//               : "",
//           }));

//           setDropdownData((prev) => ({
//             ...prev,
//             routeList:
//               pageNumber === 0
//                 ? formattedList
//                 : [...prev.routeList, ...formattedList],
//           }));
//           setHasMore((prev) => ({
//             ...prev,
//             route: items.length === rowsPerPage,
//           }));
//         })
//         .catch((error: any) => {
//           showErrorToast(error.message || "Failed to fetch Route list");
//         });
//     },
//     [dispatch]
//   );

//   useEffect(() => {
//     fetchBusList(0);
//     fetchFareList(0);
//     fetchRouteList(0);
//   }, [fetchBusList, fetchFareList, fetchRouteList]);

//   const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

//   const combineDateAndIstTimeToUtcIso = (
//     dateStr: string,
//     istTime: string
//   ): string => {
//     if (!dateStr || !istTime) throw new Error("Missing date or time");
//     const [hours, minutes] = istTime.split(":").map((v) => parseInt(v, 10));
//     const [y, m, d] = dateStr.split("-").map((v) => parseInt(v, 10));

//     const utcMs =
//       Date.UTC(y, m - 1, d, hours, minutes || 0) - IST_OFFSET_MS;
//     return new Date(utcMs).toISOString();
//   };

//   const handleServiceCreation: SubmitHandler<Service> = async (data) => {
//     try {
//       setLoading(true);

//       if (!data.route_id) {
//         showErrorToast("Please select a route");
//         setLoading(false);
//         return;
//       }
//       if (!selectedRouteTimeIst) {
//         showErrorToast("Route start time not set");
//         setLoading(false);
//         return;
//       }

//       let datetimeIso: string;
//       try {
//         datetimeIso = combineDateAndIstTimeToUtcIso(
//           data.starting_at!,
//           selectedRouteTimeIst
//         );
//       } catch {
//         showErrorToast("Invalid date or time");
//         setLoading(false);
//         return;
//       }

//       const formData = new FormData();
//       formData.append("route", data.route_id.toString());
//       formData.append("bus_id", data.bus_id.toString());
//       formData.append("fare", data.fare_id.toString());
//       formData.append("starting_at", datetimeIso);
//       formData.append("ticket_mode", data.ticket_mode.toString());

//       const response = await dispatch(serviceCreationApi(formData)).unwrap();
//       if (response?.id) {
//         showSuccessToast("Service created successfully!");
//         refreshList("refresh");
//         onClose();
//       } else {
//         showErrorToast("Service creation failed");
//       }
//     } catch (error: any) {
//       showErrorToast(error.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleScroll = (
//     event: React.UIEvent<HTMLElement>,
//     type: "bus" | "route" | "fare"
//   ) => {
//     const element = event.currentTarget;
//     if (
//       element.scrollHeight - element.scrollTop === element.clientHeight &&
//       hasMore[type]
//     ) {
//       const newPage = page[type] + 1;
//       setPage((prev) => ({ ...prev, [type]: newPage }));

//       switch (type) {
//         case "bus":
//           fetchBusList(newPage, searchParams.bus);
//           break;
//         case "route":
//           fetchRouteList(newPage, searchParams.route);
//           break;
//         case "fare":
//           fetchFareList(newPage, searchParams.fare);
//           break;
//       }
//     }
//   };

//   const today = new Date();
//   const tomorrow = new Date();
//   tomorrow.setDate(today.getDate() + 1);
//   const todayStr = today.toISOString().split("T")[0];
//   const tomorrowStr = tomorrow.toISOString().split("T")[0];

//   return (
//     <Container component="main" maxWidth="xs">
//       <CssBaseline />
//       <Box
//         sx={{
//           marginTop: 8,
//           display: "flex",
//           flexDirection: "column",
//           alignItems: "center",
//         }}
//       >
//         <Typography component="h1" variant="h5">
//           Service Creation
//         </Typography>
//         <Box mb={2}>
//           <Alert severity="info">
//             For a new service, the starting date must be today or the next day.
//           </Alert>
//         </Box>
//         <Box
//           component="form"
//           noValidate
//           sx={{ mt: 1 }}
//           onSubmit={handleSubmit(handleServiceCreation)}
//         >
//           {/* ... other fields unchanged ... */}

//           <TextField
//             margin="normal"
//             required
//             fullWidth
//             label="Starting Date"
//             type="date"
//             InputLabelProps={{ shrink: true }}
//             {...register("starting_at", {
//               required: "Starting date is required",
//             })}
//             error={!!errors.starting_at}
//             helperText={errors.starting_at?.message}
//             size="small"
//             inputProps={{
//               min: todayStr,
//               max: tomorrowStr,
//             }}
//           />

//           <TextField
//             margin="normal"
//             fullWidth
//             label="Route Start Time"
//             placeholder="hh:mm AM/PM"
//             value={displayRouteTime}
//             onChange={(e) => {
//               const val = e.target.value.toUpperCase();
//               setDisplayRouteTime(val);
//               const converted = formatTo24Hour(val);
//               if (converted) setSelectedRouteTimeIst(converted);
//             }}
//             InputLabelProps={{ shrink: true }}
//             size="small"
//           />

//           {/* ticket_mode select unchanged */}

//           <Button
//             type="submit"
//             fullWidth
//             color="primary"
//             variant="contained"
//             sx={{ mt: 3, mb: 2, bgcolor: "darkblue" }}
//             disabled={loading}
//           >
//             {loading ? (
//               <CircularProgress size={24} sx={{ color: "white" }} />
//             ) : (
//               "Create Service"
//             )}
//           </Button>
//         </Box>
//       </Box>
//     </Container>
//   );
// };

// export default ServiceCreationForm;

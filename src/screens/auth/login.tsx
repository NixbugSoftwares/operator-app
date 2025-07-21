import React, { useCallback, useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  CssBaseline,
  Avatar,
  CircularProgress,
  InputAdornment,
  IconButton,
  Card,
  CardContent,
  Autocomplete,
  Grid,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useAppDispatch } from "../../store/Hooks";
import { LoginApi, companyListApi } from "../../slices/authSlice";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "./validations/authValidation";
import {
  userLoggedIn,
  fetchRoleMappingApi,
  loginUserAssignedRoleApi,
  setRoleDetails,
} from "../../slices/appSlice";
import {
  showSuccessToast,
  showErrorToast,
} from "../../common/toastMessageHelper";
import localStorageHelper from "../../utils/localStorageHelper";
import { setPermissions } from "../../slices/appSlice";
interface ILoginFormInputs {
  company_id: number;
  username: string;
  password: string;
}

interface DropdownItem {
  id: number;
  name: string;
}
const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams, setSearchParams] = useState({
    company: "",
  });
  const [page, setPage] = useState({
    company: 0,
  });
  const [hasMore, setHasMore] = useState({
    company: true,
  });
  const [dropdownData, setDropdownData] = useState({
    companyList: [] as DropdownItem[],
  });

  const rowsPerPage = 10;
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<ILoginFormInputs>({
    resolver: yupResolver(loginSchema),
    defaultValues: {},
  });

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const fetchCompanyList = useCallback(
    (pageNumber: number, searchText = "") => {
      setLoading(true);
      const offset = pageNumber * rowsPerPage;
      dispatch(
        companyListApi({
          limit: rowsPerPage,
          offset,
          name: searchText,
        })
      )
        .unwrap()
        .then((res) => {
          const items = res.data || [];
          console.log("items", items);

          const formattedList = items.map((item: any) => ({
            id: item.id,
            name: item.name ?? "-",
          }));
          setDropdownData((prev) => ({
            ...prev,
            companyList:
              pageNumber === 0
                ? formattedList
                : [...prev.companyList, ...formattedList],
          }));
          setHasMore((prev) => ({
            ...prev,
            company: items.length === rowsPerPage,
          }));
        })
        .catch((error) => {
          showErrorToast(error || "Failed to fetch Company list");
        })
        .finally(() => setLoading(false));
    },
    [dispatch]
  );

  useEffect(() => {
    fetchCompanyList(0);
  }, [fetchCompanyList]);
  const handleLogin: SubmitHandler<ILoginFormInputs> = async (data) => {
    try {
      if (!data.company_id) {
        showErrorToast("Please select a company");
        return;
      }

      const formData = new FormData();
      formData.append("company_id", data.company_id.toString());
      formData.append("username", data.username);
      formData.append("password", data.password);

      const response = await dispatch(LoginApi(formData)).unwrap();

      if (response?.access_token) {
        const user = {
          username: data?.username,
          operator_id: response?.operator_id,
          company_id: data?.company_id,
        };
        const access_token = response?.access_token;
        const expiresAt = Date.now() + response?.expires_in * 1000;

        const selectedCompany = dropdownData.companyList.find(
          (company) => company.id === data.company_id
        );
        if (selectedCompany) {
          localStorageHelper.storeItem("@companyName", selectedCompany.name);
        }

        localStorageHelper.storeItem("@token", access_token);
        localStorageHelper.storeItem("@token_expires", expiresAt);
        localStorageHelper.storeItem("@user", user);

        dispatch(userLoggedIn(user));
        showSuccessToast("Login successful");

        const roleResponse = await dispatch(
          fetchRoleMappingApi(response.operator_id)
        ).unwrap();

        if (!roleResponse) {
          throw new Error("No role mapping found for this user");
        }

        const assignedRole = {
          id: roleResponse?.id,
          userId: roleResponse?.operator_id,
          roleId: roleResponse?.role_id,
        };

        localStorage.setItem("@assignedRole", JSON.stringify(assignedRole));

        const roleListingResponse = await dispatch(
          loginUserAssignedRoleApi(assignedRole.roleId)
        ).unwrap();

        console.log(
          "roleDetails=================================",
          roleListingResponse[0]
        );

        if (roleListingResponse.length > 0) {
          dispatch(setRoleDetails(roleListingResponse[0]));

          const roleDetails = roleListingResponse[0];
          dispatch(setRoleDetails(roleDetails));

          const permissions = Object.entries(roleDetails)
            .filter(([_, value]) => value === true)
            .map(([key]) => key);

          localStorage.setItem("@permissions", JSON.stringify(permissions));
          dispatch(setPermissions(permissions));
          console.log(
            "Permissions=================================s:",
            permissions
          );

          if (permissions) {
            localStorage.setItem("@permissions", JSON.stringify(permissions));
            dispatch(setPermissions(permissions));
          }
        } else {
          showErrorToast("Role details not found");
        }
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      showErrorToast(error?.detail || error || "Login failed");
    }
  };
  const handleScroll = (event: React.UIEvent<HTMLElement>, type: "company") => {
    const element = event.currentTarget;
    if (
      element.scrollHeight - element.scrollTop === element.clientHeight &&
      hasMore[type]
    ) {
      const newPage = page[type] + 1;
      setPage((prev) => ({ ...prev, [type]: newPage }));

      switch (type) {
        case "company":
          fetchCompanyList(newPage, searchParams.company);
          break;
      }
    }
  };
  return (
    <Container component="main" maxWidth="xs" sx={{ mb: 10 }}>
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Card sx={{ width: "100%", p: 3, boxShadow: 3 }}>
          <CardContent
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: "darkblue" }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              Sign In
            </Typography>
            <Box
              component="form"
              noValidate
              sx={{ mt: 1 }}
              onSubmit={handleSubmit(handleLogin)}
            >
              <Grid item xs={12} sm={6}>
                <Controller
                  name="company_id"
                  control={control}
                  rules={{ required: "Company is required" }}
                  render={({ field }) => (
                    <Autocomplete
                      options={dropdownData.companyList}
                      getOptionLabel={(option) => option.name}
                      value={
                        dropdownData.companyList.find(
                          (item) => item.id === field.value
                        ) || null
                      }
                      onChange={(_, newValue) => field.onChange(newValue?.id)}
                      onInputChange={(_, newInputValue) => {
                        setSearchParams((prev) => ({
                          ...prev,
                          bus: newInputValue,
                        }));
                        fetchCompanyList(0, newInputValue);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Company"
                          error={!!errors.company_id}
                          helperText={errors.company_id?.message}
                          required
                          fullWidth
                        />
                      )}
                      ListboxProps={{
                        onScroll: (event) => handleScroll(event, "company"),
                        style: { maxHeight: 200, overflow: "auto" },
                      }}
                    />
                  )}
                />
              </Grid>

              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                {...register("username")}
                error={!!errors.username}
                helperText={errors.username?.message}
                autoComplete="username"
                autoFocus
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                error={!!errors.password}
                helperText={errors.password?.message}
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleTogglePassword} edge="end">
                        {showPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, bgcolor: "darkblue" }}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Sign In"
                )}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default LoginPage;

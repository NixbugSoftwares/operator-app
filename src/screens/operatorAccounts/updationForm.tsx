import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  CssBaseline,
  CircularProgress,
  MenuItem,
  InputAdornment,
  IconButton,
  Alert,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useAppDispatch } from "../../store/Hooks";
import {
  operatorUpdationApi,
  operatorRoleListApi,
  roleAssignUpdateApi,
  fetchRoleMappingApi,
  operatorRoleAssignApi,
} from "../../slices/appSlice";
import {
  showSuccessToast,
  showErrorToast,
} from "../../common/toastMessageHelper";
import localStorageHelper from "../../utils/localStorageHelper";
import { useSelector } from "react-redux";
import { RootState } from "../../store/Store";

interface IAccountFormInputs {
  password?: string;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  gender?: number;
  role?: number;
  roleAssignmentId?: number;
  status?: number;
}

interface IAccountUpdateFormProps {
  accountId: any;
  accountData: IAccountFormInputs;
  onClose: () => void;
  refreshList: (value: any) => void;
  onCloseDetailCard(): void;
  canupdateOperator: boolean;
}

interface IOption {
  label: string;
  value: number;
}

const genderOptions: IOption[] = [
  { label: "Other", value: 1 },
  { label: "Female", value: 2 },
  { label: "Male", value: 3 },
  { label: "Transgender", value: 4 },
];

const statusOptions: IOption[] = [
  { label: "Active", value: 1 },
  { label: "Suspended", value: 2 },
];

const loggedInUser = localStorageHelper.getItem("@user");

const AccountUpdateForm: React.FC<IAccountUpdateFormProps> = ({
  accountId,
  accountData,
  onClose,
  refreshList,
  onCloseDetailCard,
  canupdateOperator,
}) => {
  console.log("accountData......", accountData);

  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const userId = Number(loggedInUser?.operator_id);
  const isLoggedInUser = Number(accountId) === userId;
  const [roleMappingError, setRoleMappingError] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<IAccountFormInputs>();
  const [showPassword, setShowPassword] = useState(false);
  const canAssignRole = useSelector((state: RootState) =>
    state.app.permissions.includes("update_role")
  );
  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  useEffect(() => {
    // Fetch available roles
    dispatch(operatorRoleListApi({}))
      .unwrap()
      .then((res: { data: any[] }) => {
        setRoles(res.data.map((role) => ({ id: role.id, name: role.name })));
      })

      .catch((err: any) => {
        showErrorToast(err || "Error fetching roles");
      });

    // Fetch role mapping for this account
    dispatch(fetchRoleMappingApi(accountId))
      .unwrap()
      .then((roleMapping) => {
        // Check for null, undefined, or empty object
        if (roleMapping && Object.keys(roleMapping).length > 0) {
          const formData = {
            ...accountData,
            role: roleMapping.role_id,
            roleAssignmentId: roleMapping.id,
          };
          reset(formData);
          setRoleMappingError(false);
        } else {
          reset(accountData);
          setRoleMappingError(true); // Show error if mapping is missing (e.g., deleted)
        }
      })
      .catch((error: any) => {
        showErrorToast(error.message || "Error fetching role mapping");
        reset(accountData);
        setRoleMappingError(true); // Show error if API call fails
      });
  }, [accountId, dispatch, reset, accountData]);

  const handleAccountUpdate: SubmitHandler<IAccountFormInputs> = async (
    data
  ) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("id", accountId.toString());
      if (data.password) formData.append("password", data.password);
      formData.append("gender", data.gender?.toString() || "");
      if (data.fullName) formData.append("full_name", data.fullName);
      if (data.phoneNumber)
        formData.append("phone_number", `+91${data.phoneNumber}`);
      if (data.email) formData.append("email_id", data.email);

      if (canupdateOperator && data.status) {
        formData.append("status", data.status.toString());
      }

      // Update account
      const accountResponse = await dispatch(
        operatorUpdationApi({ accountId, formData })
      ).unwrap();

      if (!accountResponse?.id) {
        showErrorToast("Account update failed! Please try again.");
        onClose();
        return;
      }

      // Only handle role assignment if allowed
      if (canupdateOperator && data.role) {
        try {
          if (data.roleAssignmentId) {
            await dispatch(
              roleAssignUpdateApi({
                id: data.roleAssignmentId,
                role_id: data.role,
              })
            ).unwrap();
          } else {
            await dispatch(
              operatorRoleAssignApi({
                operator_id: accountId,
                role_id: data.role,
              })
            ).unwrap();
          }
        } catch (error: any) {
          showErrorToast(
            error.message || "Account updated, but role assignment failed!"
          );
        }
      }

      showSuccessToast("Account Updated successfully!");
      onCloseDetailCard();
      refreshList("refresh");
      onClose();
    } catch (error: any) {
      showErrorToast(
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Update Account
        </Typography>
        {roleMappingError && (
          <Alert severity="error">
            This account does not have a role assigned. Please assign a role.
          </Alert>
        )}
        <Box
          component="form"
          noValidate
          sx={{ mt: 1 }}
          onSubmit={handleSubmit(handleAccountUpdate)}
        >
          <TextField
            margin="normal"
            fullWidth
            label="Full Name"
            defaultValue={accountData.fullName || ""}
            {...register("fullName", {
              required: "Full Name is required",
              maxLength: {
                value: 32,
                message: "Full Name cannot exceed 32 characters",
              },
              validate: {
                noNumbers: (value: any) =>
                  !/[0-9]/.test(value) ||
                  "Numbers are not allowed in the full Name",
                noSpecialChars: (value: any) =>
                  !/[^A-Za-z ]/.test(value) ||
                  "Special characters are not allowed",
                endsWithLetter: (value: any) =>
                  /[A-Za-z]$/.test(value) || "Full Name must end with a letter",
                validPattern: (value: any) =>
                  /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value) ||
                  "Full Name should consist of letters separated by single spaces",
              },
            })}
            error={!!errors.fullName}
            helperText={errors.fullName?.message}
            size="small"
          />

          <Controller
            name="phoneNumber"
            control={control}
            render={({ field }) => (
              <TextField
                margin="normal"
                fullWidth
                label="Phone Number"
                placeholder="eg:+911234567890"
                size="small"
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber?.message}
                value={field.value ? `+91 ${field.value}` : ""}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, "");
                  if (value.startsWith("91")) value = value.slice(2);
                  if (value.length > 10) value = value.slice(0, 10);
                  field.onChange(value || "");
                }}
              />
            )}
          />

          <TextField
            margin="normal"
            placeholder="example@gmail.com"
            fullWidth
            label="Email"
            type="email"
            {...register("email", {
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
            defaultValue={accountData.email || ""}
            error={!!errors.email}
            helperText={errors.email?.message}
            size="small"
          />

          {canupdateOperator && canAssignRole && (
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <TextField
                  margin="normal"
                  fullWidth
                  select
                  label="Role"
                  value={field.value || ""}
                  onChange={field.onChange}
                  error={!!errors.role}
                  helperText={errors.role?.message}
                  size="small"
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          )}

          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <TextField
                margin="normal"
                fullWidth
                select
                label="Gender"
                {...field}
                error={!!errors.gender}
                size="small"
                defaultValue={accountData.gender}
              >
                {genderOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          {canupdateOperator && !isLoggedInUser && (
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TextField
                  margin="normal"
                  fullWidth
                  select
                  label="Status"
                  {...field}
                  error={!!errors.status}
                  size="small"
                  defaultValue={accountData.status}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          )}

          <TextField
            margin="normal"
            fullWidth
            label="Reset Password"
            type={showPassword ? "text" : "password"}
            {...register("password", {
              pattern: {
                value: /^[A-Za-z0-9\-+,.@_$%&*#!^=/?^]{8,32}$/,
                message:
                  "Password must be 8–32 characters and can only contain letters, numbers, and allowed symbols (-+,.@_$%&*#!^=/?^). No spaces allowed.",
              },
            })}
            error={!!errors.password}
            helperText={errors.password?.message}
            size="small"
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
            color="primary"
            variant="contained"
            sx={{ mt: 3, mb: 2, bgcolor: "darkblue" }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : (
              "Update Account"
            )}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default AccountUpdateForm;

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

interface IAccountFormInputs {
  username?: string;
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
  accountId: number;
  accountData: IAccountFormInputs;
  onClose: () => void;
  refreshList: (value: any) => void;
  onCloseDetailCard(): void;
  canManageOperator: boolean;
}

interface IOption {
  label: string;
  value: number;
}

const genderOptions: IOption[] = [
  { label: "Female", value: 1 },
  { label: "Male", value: 2 },
  { label: "Transgender", value: 3 },
  { label: "Other", value: 4 },
];

const statusOptions: IOption[] = [
  { label: "Active", value: 1 },
  { label: "Suspended", value: 2 },
];

const loggedInUser = localStorageHelper.getItem("@user");
const userId = loggedInUser?.operator_id;

const AccountUpdateForm: React.FC<IAccountUpdateFormProps> = ({
  accountId,
  accountData,
  onClose,
  refreshList,
  onCloseDetailCard,
  canManageOperator,
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const isLoggedInUser = accountId === userId;
  const [roleMappingError, setRoleMappingError] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<IAccountFormInputs>();
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };
  console.log("accountData>>>>>>>>>>>>>>>>>>>>>>>>>", accountData);

  useEffect(() => {
    // Fetch available roles
    dispatch(operatorRoleListApi())
      .unwrap()
      .then((res: any[]) => {
        setRoles(res.map((role) => ({ id: role.id, name: role.name })));
      })
      .catch((err: any) => {
        showErrorToast(err);
      });

    // Fetch role mapping for this account
    dispatch(fetchRoleMappingApi(accountId))
      .unwrap()
      .then((roleMapping) => {
        if (roleMapping) {
          const formData = {
            ...accountData,
            role: roleMapping.role_id,
            roleAssignmentId: roleMapping.id,
          };
          reset(formData);
        } else {
          reset(accountData);
          setRoleMappingError(true);
        }
      })
      .catch((error: any) => {
        showErrorToast(error);
        setRoleMappingError(true);
        reset(accountData);
      });
  }, [accountId, dispatch, reset, accountData]);

  const handleAccountUpdate: SubmitHandler<IAccountFormInputs> = async (data) => {
  try {
    setLoading(true);
    const formData = new FormData();
    formData.append("id", accountId.toString());

    if (data.username) formData.append("username", data.username);
    if (data.password) formData.append("password", data.password);
    formData.append("gender", data.gender?.toString() || "");
    if (data.fullName) formData.append("full_name", data.fullName);
    if (data.phoneNumber)
      formData.append("phone_number", `+91${data.phoneNumber}`);
    if (data.email) formData.append("email_id", data.email);

    if (canManageOperator && data.status) {
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
    if (canManageOperator && data.role) {
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
      } catch {
        showErrorToast("Account updated, but role assignment failed!");
      }
    }

    showSuccessToast("Account Updated successfully!");
    onCloseDetailCard();
    refreshList("refresh");
    onClose();
  } catch {
    showErrorToast("Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
};

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Update Account
        </Typography>
        {roleMappingError && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            Note: Previous role assignment not found. Please select a new role.
          </Typography>
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
            {...register("fullName")}
            defaultValue={accountData.fullName || ""}
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
                value={field.value ? `+91${field.value}` : ""}
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

         {canManageOperator && (
  <Controller
    name="role"
    control={control}
    rules={{ required: "Role is required" }}
    render={({ field }) => (
      <TextField
        margin="normal"
        required
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

          {canManageOperator && !isLoggedInUser && (
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
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
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

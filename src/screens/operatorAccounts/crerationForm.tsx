import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Container,
  CssBaseline,
  CircularProgress,
  MenuItem,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useAppDispatch } from "../../store/Hooks";
import {
  operatorCreationApi,
  operatorRoleListApi,
  operatorRoleAssignApi,
} from "../../slices/appSlice";
import {
  showErrorToast,
  showSuccessToast,
} from "../../common/toastMessageHelper";
import { operatorCreationSchema } from "../auth/validations/authValidation";
import { yupResolver } from "@hookform/resolvers/yup";
import { RootState } from "../../store/Store";
import { useSelector } from "react-redux";

// Account creation form interface
interface IAccountFormInputs {
  username: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  email?: string;
  gender?: number;
  role?: number;
  roleAssignmentId?: number;
}

interface IAccountCreationFormProps {
  onClose: () => void;
  refreshList: (value: any) => void;
}

// Gender options mapping
const genderOptions = [
  { label: "Other", value: 1 },
  { label: "Female ", value: 2 },
  { label: "Male", value: 3 },
  { label: "Transgender", value: 4 },
];

const AccountForm: React.FC<IAccountCreationFormProps> = ({
  onClose,
  refreshList,
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const canAssignRole = useSelector((state: RootState) =>
    state.app.permissions.includes("update_role")
  );
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<IAccountFormInputs>({
    resolver: yupResolver(operatorCreationSchema) as any,
    defaultValues: {
      gender: 1,
    },
  });

  //   Fetchroles
  useEffect(() => {
    dispatch(operatorRoleListApi({}))
      .unwrap()
      .then((res: { data: any[] }) => {
        setRoles(res.data.map((role) => ({ id: role.id, name: role.name })));
      })

      .catch((err: any) => {
        showErrorToast(err.message);
      });
  }, [dispatch]);

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleAccountCreation: SubmitHandler<IAccountFormInputs> = async (
    data
  ) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("username", data.username);
      formData.append("password", data.password);
      formData.append("gender", data.gender?.toString() || "");

      if (data.fullName) formData.append("full_name", data.fullName);
      if (data.phoneNumber)
        formData.append("phone_number", `+91${data.phoneNumber}`);
      if (data.email) formData.append("email_id", data.email);

      const response = await dispatch(operatorCreationApi(formData)).unwrap();

      if (response?.id) {
        // Only attempt role assignment if role was provided and user has permission
        if (data.role && canAssignRole) {
          try {
            await dispatch(
              operatorRoleAssignApi({
                operator_id: response.id,
                role_id: data.role,
              })
            ).unwrap();
            showSuccessToast("Account created and role assigned successfully!");
          } catch (roleError: any) {
            showSuccessToast(
              roleError.message || "Account created but role assignment failed!"
            );
            console.error("Role assignment failed:", roleError);
          }
        } else {
          showSuccessToast("Account created without role.");
        }

        refreshList("refresh");
        onClose();
      } else {
        throw new Error("Account creation failed!");
      }
    } catch (error: any) {
      if ( error.status===409){
        showErrorToast("Username already exists");
      }else{
      showErrorToast(error.message || "Operator creation failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box
          component="form"
          noValidate
          sx={{ mt: 1 }}
          onSubmit={handleSubmit(handleAccountCreation)}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            label="Username"
            {...register("username")}
            error={!!errors.username}
            helperText={errors.username?.message}
            autoFocus
            size="small"
          />

          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            type={showPassword ? "text" : "password"}
            {...register("password")}
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

          <TextField
            margin="normal"
            fullWidth
            required
            label="Full Name"
            {...register("fullName")}
            error={!!errors.fullName}
            helperText={errors.fullName?.message}
            size="small"
          />
          {canAssignRole && (
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <TextField
                  margin="normal"
                  fullWidth
                  select
                  label="Role"
                  {...field}
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
            name="phoneNumber"
            control={control}
            render={({ field }) => (
              <TextField
                margin="normal"
                fullWidth
                label="Phone Number"
                placeholder="+911234567890"
                size="small"
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber?.message}
                value={field.value ? `+91${field.value}` : ""}
                onChange={(e) => {
                  let value = e.target.value.replace(/^\+91/, "");
                  value = value.replace(/\D/g, "");
                  if (value.length > 10) value = value.slice(0, 10);
                  field.onChange(value || undefined);
                }}
                onFocus={() => {
                  if (!field.value) field.onChange("");
                }}
                onBlur={() => {
                  if (field.value === "") field.onChange(undefined);
                }}
              />
            )}
          />

          <TextField
            margin="normal"
            fullWidth
            label="Email"
            placeholder="example@gmail.com"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
            size="small"
          />

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
              >
                {genderOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
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
              "Create Account"
            )}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default AccountForm;

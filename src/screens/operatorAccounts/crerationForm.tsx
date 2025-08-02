import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { accountFormSchema } from "../auth/validations/authValidation";
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

// Account creation form interface
interface IAccountFormInputs {
  username: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  email?: string;
  gender?: number;
  role: number;
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

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<IAccountFormInputs>({
    resolver: yupResolver(accountFormSchema),
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
        showErrorToast(err);
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
        formData.append("full_name", data.fullName);
      if (data.phoneNumber) {
        formData.append("phone_number", `+91${data.phoneNumber}`);
      }
      if (data.email) {
        formData.append("email_id", data.email);
      }
      //  Create account
      const accountResponse = await dispatch(
        operatorCreationApi(formData)
      ).unwrap();
      if (accountResponse?.id) {
        const roleResponse = await dispatch(
          operatorRoleAssignApi({
            operator_id: accountResponse.id,
            role_id: data.role,
          })
        ).unwrap();

        if (roleResponse?.id && roleResponse?.role_id) {
          showSuccessToast("Account and role assigned successfully!");
          refreshList("refresh");
          onClose();
        } else {
          throw new Error("Account created, but role assignment failed!");
        }
      } else {
        throw new Error("Account creation failed!");
      }
    } catch (error: any) {
      showErrorToast(error || "Account creation failed. Please try again.");
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
          <TextField
            margin="normal"
            fullWidth
            label="Full Name"
            required
            {...register("fullName")}
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

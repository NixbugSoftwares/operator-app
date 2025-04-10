import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useAppDispatch, useAppSelector } from "../../store/Hooks";
import { LoginApi, companyListApi, selectAuth } from "../../slices/authSlice";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "./validations/authValidation";
import {userLoggedIn} from "../../slices/appSlice";
import { showSuccessToast, showErrorToast } from "../../common/toastMessageHelper";

interface ILoginFormInputs {
  company_id: number | null;
  username: string;
  password: string;
}

interface CompanyOption {
  id: number;
  name: string;
}

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(selectAuth);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<ILoginFormInputs>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      company_id: null,
    },
  });

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  useEffect(() => {
    dispatch(companyListApi())
      .unwrap()
      .then((res: any[]) => {
        const companyList = res.map((company) => ({ 
          id: company.id, 
          name: company.name 
        }));
        setCompanies(companyList);
      })
      .catch((err: any) => {
        console.error("Error fetching company:", err);
      });
  }, [dispatch]);

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
        const expiresAt = Date.now() + response.expires_in * 1000;
        localStorage.setItem("@token", response.access_token);
        localStorage.setItem("@token_expires", expiresAt.toString());

        const user: any = {
          operator_id: response.operator_id,
      }
      if (response.operator_id) {
        showSuccessToast("Login successful!");
      }
      localStorage.setItem("@user", JSON.stringify(user));
      dispatch(userLoggedIn(user));
       
        
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      showErrorToast(error.message || "Login failed");
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
          <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
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
              <Controller
                name="company_id"
                control={control}
                rules={{ required: "Company is required" }}
                render={({ field }) => (
                  <Autocomplete
                    options={companies}
                    getOptionLabel={(option) => option.name}
                    onChange={(_event, value) => field.onChange(value?.id || null)}
                    value={companies.find(c => c.id === field.value) || null}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        margin="normal"
                        required
                        fullWidth
                        label="Company Name"
                        error={!!errors.company_id}
                        helperText={errors.company_id?.message}
                        size="small"
                      />
                    )}
                  />
                )}
              />

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
              {error && (
                <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                  {error}
                </Typography>
              )}
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
import React, { useCallback, useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  useTheme,
  Divider,
  Button,
  Tooltip,
} from "@mui/material";
import {
  Person,
  Phone,
  Email,
  Female,
  Male,
  Transgender,
  Check,
  Close,
  Edit,
  Business,
  CalendarToday,
} from "@mui/icons-material";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import { useDispatch } from "react-redux";
import {
  clearRoleDetails,
  fetchRoleMappingApi,
  logoutApi,
  operatorListApi,
  operatorRoleAssignApi,
  operatorRoleListApi,
  operatorUpdationApi,
  roleAssignUpdateApi,
  userLoggedOut,
} from "../../slices/appSlice";
import { companyListApi } from "../../slices/authSlice";
import localStorageHelper from "../../utils/localStorageHelper";
import { showErrorToast, showSuccessToast } from "../toastMessageHelper";
import { Account, Company } from "../../types/type";
import { SubmitHandler, useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { RootState } from "../../store/Store";
import CompanyDetailsCard from "./compnayDetails";
import commonHelper from "../../utils/commonHelper";

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

const ProfilePage: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch<any>();
  const [profile, setProfile] = useState<Account | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IAccountFormInputs>();
  const [genderValue, setGenderValue] = useState<number>(0);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [roleAssignmentId, setRoleAssignmentId] = useState<number | undefined>(
    undefined
  );
  const [role, setRole] = useState<number | undefined>(undefined);
  const user = localStorageHelper.getItem("@user");
  const userId = user?.operator_id;
  const companyId = user?.company_id;
  const canManageOperator = useSelector((state: RootState) =>
    state.app.permissions.includes("update_operator")
  );
  console.log("userId", userId);

  const [showCompanyDetails, setShowCompanyDetails] = useState(false);
  const getGender = (value: number): string => {
    switch (value) {
      case 1:
        return "Other";
      case 2:
        return "Female";
      case 3:
        return "Male";
      case 4:
        return "Transgender";
      default:
        return "Not specified";
    }
  };
  const getStatus = (value: number): string => {
    return value === 1 ? "Active" : "Suspended";
  };
  const getStatusColor = (value: string) => {
    switch (value) {
      case "Active":
        return "success";
      case "Suspended":
        return "error";
      default:
        return "default";
    }
  };

  const formatUTCDateToLocal = (dateString: string | null): string => {
    if (!dateString || dateString.trim() === "") return "Not added yet";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "Not added yet" : date.toLocaleDateString();
  };
  const formatPhoneNumber = (phone: string | undefined): string => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    return digits.length > 10 ? digits.slice(-10) : digits;
  };

  useEffect(() => {
    dispatch(operatorRoleListApi({}))
      .unwrap()
      .then((res: { data: any[] }) => {
        setRoles(res.data.map((role) => ({ id: role.id, name: role.name })));
      });
    dispatch(fetchRoleMappingApi(userId))
      .unwrap()
      .then((roleMapping: { role_id?: number; id?: number }) => {
        if (roleMapping && Object.keys(roleMapping).length > 0) {
          setRole(roleMapping.role_id);
          setRoleAssignmentId(roleMapping.id);
          reset((formValues) => ({
            ...formValues,
            role: roleMapping.role_id,
            roleAssignmentId: roleMapping.id,
          }));
        } else {
          setRole(undefined);
          setRoleAssignmentId(undefined);
          reset((formValues) => ({
            ...formValues,
            role: undefined,
            roleAssignmentId: undefined,
          }));
        }
      });
  }, [dispatch, userId, reset]);

  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [accountRes] = await Promise.all([
        dispatch(operatorListApi({ id: userId, limit: 1, offset: 0 })).unwrap(),
      ]);

      const user = accountRes.data?.[0];
      if (user) {
        const profileData = {
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          gender: getGender(user.gender),
          genderValue: user.gender,
          status: getStatus(user.status),
          email_id: user.email_id,
          phoneNumber: formatPhoneNumber(user.phone_number),
          created_on: user.created_on,
          updated_on: user.updated_on,
          role: role,
          roleAssignmentId: roleAssignmentId,
        };
        setProfile(profileData);
        setGenderValue(user.gender);
        reset({
          fullName: user.full_name,
          phoneNumber: formatPhoneNumber(user.phone_number),
          email: user.email_id,
          gender: user.gender,
          role: role,
          roleAssignmentId: roleAssignmentId,
        });
      }
    } catch (error: any) {
      showErrorToast(error || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, userId, companyId, reset]);

  const fetchCompanyData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [companyRes] = await Promise.all([
        dispatch(
          companyListApi({ id: companyId, limit: 1, offset: 0 })
        ).unwrap(),
      ]);

      const company = companyRes.data?.[0];
      if (company) {
        console.log("Company Data:", company);

        const companyData = {
          id: company.id,
          name: company.name ?? "-",
          address: company.address ?? "-",
          location: company.location ?? "-",
          ownerName: company.contact_person,
          phoneNumber: company.phone_number ?? "-",
          email: company.email_id ?? "-",
          companyType:
            company.type === 1
              ? "other"
              : company.type === 2
              ? "private"
              : company.type === 3
              ? "government"
              : "",
          status:
            company.status === 1
              ? "Validating"
              : company.status === 2
              ? "Verified"
              : "Suspended",
        };
        setCompany(companyData);
      }
    } catch (error: any) {
      showErrorToast(error || "Failed to load company profile");
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, userId, companyId, reset]);

  useEffect(() => {
    fetchUserData();
    fetchCompanyData();
  }, [fetchUserData, fetchCompanyData]);

  const handleEditField = (field: string) => {
    setEditingField(field);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    fetchUserData();
  };

  const handleAccountUpdate: SubmitHandler<IAccountFormInputs> = async (
    data
  ) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("id", userId.toString());

      if (editingField === "fullName" && data.fullName)
        formData.append("full_name", data.fullName);
      if (editingField === "phoneNumber" && data.phoneNumber)
        formData.append("phone_number", `+91${data.phoneNumber}`);
      if (editingField === "email" && data.email)
        formData.append("email_id", data.email);
      if (editingField === "gender")
        formData.append("gender", data.gender?.toString() || "");
      if (editingField === "role" && data.role)
        formData.append("role", data.role.toString());
      const accountResponse = await dispatch(
        operatorUpdationApi({ accountId: userId, formData })
      ).unwrap();

      if (!accountResponse?.id) {
        showErrorToast("Account update failed! Please try again.");
        return;
      }
      if (editingField === "role" && data.role && canManageOperator) {
        try {
          if (roleAssignmentId) {
            await dispatch(
              roleAssignUpdateApi({
                id: roleAssignmentId,
                role_id: data.role,
              })
            ).unwrap();
          } else {
            const roleAssignResponse = await dispatch(
              operatorRoleAssignApi({
                operator_id: userId,
                role_id: data.role,
              })
            ).unwrap();
            if (roleAssignResponse.id) {
              setRoleAssignmentId(roleAssignResponse.id);
            }
          }
        } catch (error: any) {
          showErrorToast(
            error || "Account updated, but role assignment failed!"
          );
          console.error("Role assignment error:", error);
          return;
        }
      }

      showSuccessToast(`${editingField} updated successfully!`);
      setEditingField(null);
      await fetchUserData();
    } catch (error: any) {
      console.error("Update error:", error);
      showErrorToast(error||"Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutApi({})).unwrap();
      localStorageHelper.clearStorage();
      localStorageHelper.removeStoredItem("@user");
      dispatch(clearRoleDetails());
      commonHelper.logout();
      dispatch(userLoggedOut());
      showSuccessToast("Logout successful!");
    } catch (error: any) {
      console.error("Logout Error:", error);
      showErrorToast(error || "Logout failed. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <Typography variant="h6">No profile data available.</Typography>
      </Box>
    );
  }

  const renderEditableField = (
    field: string,
    label: string,
    value: string | number,
    icon: React.ReactNode
  ) => {
    if (editingField === field) {
      return (
        <Box
          component="form"
          onSubmit={handleSubmit(handleAccountUpdate)}
          sx={{
            width: "100%",
            p: 2,
            backgroundColor:
              theme.palette.mode === "light"
                ? theme.palette.grey[50]
                : theme.palette.grey[800],
            borderRadius: 1,
            mb: 1,
          }}
        >
          <Grid container alignItems="center" spacing={2}>
            <Grid item>
              <Avatar
                sx={{
                  bgcolor: "background.paper",
                  color: "primary.main",
                  width: 40,
                  height: 40,
                }}
              >
                {icon}
              </Avatar>
            </Grid>
            <Grid item xs>
              {field === "fullName" && (
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  defaultValue={value}
                  {...register(field as "fullName", {
                    required: `${label} is required`,
                  })}
                  error={!!errors[field as keyof typeof errors]}
                  helperText={errors[field as keyof typeof errors]?.message}
                />
              )}
              {field === "email" && (
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  defaultValue={value}
                  {...register(field as "email", {
                    required: `${label} is required`,
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
              {field === "phoneNumber" && (
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  type="number"
                  defaultValue={value}
                  {...register(field as "phoneNumber", {
                    required: `${label} is required`,
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: "Invalid phone number (10 digits required)",
                    },
                  })}
                  error={!!errors.phoneNumber}
                  helperText={errors.phoneNumber?.message}
                />
              )}
              {field === "gender" && (
                <FormControl fullWidth size="small">
                  <Select
                    value={genderValue}
                    {...register("gender")}
                    onChange={(e) => setGenderValue(Number(e.target.value))}
                  >
                    <MenuItem value={1}>Other</MenuItem>
                    <MenuItem value={2}>Female</MenuItem>
                    <MenuItem value={3}>Male</MenuItem>
                    <MenuItem value={4}>Transgender</MenuItem>
                  </Select>
                </FormControl>
              )}
              {field === "role" && canManageOperator && (
                <FormControl fullWidth size="small">
                  <Select
                    value={role || ""}
                    {...register("role", { required: "Role is required" })}
                    onChange={(e) => setRole(Number(e.target.value))}
                    error={!!errors.role}
                  >
                    {roles.map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Grid>
            <Grid item>
              <Stack direction="row" spacing={0.5}>
                <IconButton type="submit" color="primary" size="small">
                  <Check fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={handleCancelEdit}
                  color="error"
                  size="small"
                >
                  <Close fontSize="small" />
                </IconButton>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 1,
          "&:hover": {
            backgroundColor:
              theme.palette.mode === "light"
                ? theme.palette.grey[50]
                : theme.palette.grey[800],
          },
          mb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar
            sx={{
              bgcolor: "background.paper",
              color: "primary.main",
              width: 32,
              height: 32,
              fontSize: 18,
              mr: 1,
            }}
          >
            {icon}
          </Avatar>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            fontWeight={600}
            sx={{ minWidth: 110 }}
          >
            {label}:
          </Typography>
          <Typography
            variant="body1"
            color="text.primary"
            fontWeight={500}
            sx={{ flex: 1, ml: 2 }}
          >
            {value || "Not provided"}
          </Typography>
          <IconButton
            onClick={() => handleEditField(field)}
            color="primary"
            size="small"
            sx={{
              opacity: 0.7,
              ml: 1,
              "&:hover": {
                opacity: 1,
              },
            }}
          >
            <Edit fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ width: "100%", px: { xs: 1, sm: 2 }, py: 2 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          width: "100%",
          borderRadius: 2,
          boxShadow: 3,
          backgroundColor:
            theme.palette.mode === "light"
              ? "#fff"
              : theme.palette.background.default,
          overflow: "hidden",
        }}
      >
        {/* Left: Profile Summary */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            minHeight: "100%",
            backgroundColor:
              theme.palette.mode === "light"
                ? "#f9f9f9"
                : theme.palette.background.paper,
            position: "relative",
          }}
        >
          <Stack spacing={2} alignItems="center" width="100%">
            <Avatar
              sx={{
                width: 96,
                height: 96,
                fontSize: 40,
                bgcolor: "primary.main",
                border: `4px solid ${theme.palette.primary.light}`,
              }}
            >
              {profile.fullName.charAt(0)}
            </Avatar>

            <Typography variant="h5" fontWeight={700}>
              {profile.fullName}
            </Typography>

            <Chip
              label={profile.status}
              color={getStatusColor(profile.status)}
              size="medium"
              sx={{ fontWeight: 600, px: 2, fontSize: 16 }}
            />

            <Stack
              spacing={2}
              alignItems="center"
              divider={
                <Box sx={{ width: 1, height: 24, bgcolor: "divider" }} />
              }
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Diversity3Icon fontSize="small" color="primary" />
                <Typography variant="body1" fontWeight={500}>
                  {roles.find((r) => r.id === role)?.name ?? ""}
                </Typography>
              </Box>
            </Stack>

            {company && (
              <Tooltip title="Click to see the company details" arrow>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mt: 1,
                    cursor: "pointer",
                    color: "primary.main",
                    "&:hover": { textDecoration: "underline" },
                  }}
                  onClick={() => {
                    setShowCompanyDetails(true);
                    setTimeout(() => {
                      const el = document.getElementById("company-details");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }, 100); // slight delay to ensure render
                  }}
                >
                  <Business fontSize="small" />
                  <Typography variant="body1" fontWeight={600}>
                    {company.name}
                  </Typography>
                </Box>
              </Tooltip>
            )}
          </Stack>

          {/* Logout Button at the Bottom */}
          <Box
            sx={{
              mt: 4,
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            {/* Account Created Date on the left */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarToday fontSize="small" color="primary" />
              <Typography variant="body2" fontWeight={500}>
                Account Created: {formatUTCDateToLocal(profile.created_on)}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="error"
              // startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ fontWeight: 600 }}
            >
              Logout
            </Button>
          </Box>
        </Box>

        {/* Vertical Divider */}
        <Box
          sx={{
            width: "1px",
            backgroundColor: "divider",
            display: { xs: "none", md: "block" },
          }}
        />

        {/* Right: Editable Fields */}
        <Box sx={{ flex: 2, p: { xs: 2, sm: 3 } }}>
          <Stack spacing={2}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                width: "100%",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: "background.paper",
                    color: "primary.main",
                    width: 32,
                    height: 32,
                  }}
                >
                  <Person />
                </Avatar>
                <Typography variant="body1">
                  <strong>Username:</strong> @{profile.username}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ whiteSpace: "nowrap" }}>
                <strong>User ID:</strong> {profile.id}
              </Typography>
            </Box>
            <Divider />

            {/* Editable Fields */}
            {renderEditableField(
              "fullName",
              "Full Name",
              profile.fullName,
              <Person />
            )}
            {renderEditableField("email", "Email", profile.email_id, <Email />)}
            {renderEditableField(
              "phoneNumber",
              "Phone",
              profile.phoneNumber,
              <Phone />
            )}
            {renderEditableField(
              "gender",
              "Gender",
              profile.gender,
              profile.gender === "Male" ? (
                <Male />
              ) : profile.gender === "Female" ? (
                <Female />
              ) : (
                <Transgender />
              )
            )}
            {canManageOperator &&
              renderEditableField(
                "role",
                "Role",
                roles.find((r) => r.id === role)?.name ?? "",
                <Diversity3Icon />
              )}
          </Stack>
        </Box>
      </Box>

      {/* Company Details Below */}
      {company && showCompanyDetails && (
        <Box id="company-details" sx={{ mt: 4 }}>
          <CompanyDetailsCard companyId={company.id} />
        </Box>
      )}
    </Box>
  );
};

export default ProfilePage;

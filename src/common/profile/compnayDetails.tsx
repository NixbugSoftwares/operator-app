import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useTheme } from "@mui/material/styles";
import {
  Typography,
  Box,
  Avatar,
  Paper,
  Chip,
  TextField,
  IconButton,
  Stack,
} from "@mui/material";
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  LocationOn as LocationOnIcon,
  Person,
  Verified as VerifiedIcon,
  NewReleases as NewReleasesIcon,
  Block as BlockIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";

import { useAppDispatch } from "../../store/Hooks";
import { userCompanyGetApi, companyUpdateApi } from "../../slices/appSlice";
import { showErrorToast, showSuccessToast } from "../toastMessageHelper";
import MapModal from "./MapModal";
import { RootState } from "../../store/Store";

interface CompanyData {
  id: number;
  name: string;
  address: string;
  location: string;
  ownerName: string;
  phoneNumber: string;
  email: string;
  companyType: String;
  status: string;
}

interface CompanyCardProps {
  companyId: number;
}


const CompanyDetailsPage: React.FC<CompanyCardProps> = ({ companyId }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");
  const [_loading, setLoading] = useState(false);

  const canUpdateCompany = useSelector((state: RootState) =>
    state.app.permissions.includes("update_company")
  );

  // Helper Functions
  const extractCoordinates = (location: string) => {
    if (!location) return null;
    const regex = /POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/;
    const match = location.match(regex);

    if (match) {
      return {
        longitude: parseFloat(match[1]),
        latitude: parseFloat(match[2]),
      };
    }
    return null;
  };

  const formatPhoneNumber = (phone: string | undefined): string => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    return digits.length > 10 ? digits.slice(-10) : digits;
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhoneNumber = (phone: string) => {
    return /^\d{10}$/.test(phone);
  };

  // Data Fetching
  const fetchCompanyData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [companyRes] = await Promise.all([
        dispatch(
          userCompanyGetApi({ id: companyId, limit: 1, offset: 0 })
        ).unwrap(),
      ]);
      const company = companyRes.data?.[0];
      if (company) {
        const companyData: CompanyData = {
          id: company.id,
          name: company.name ?? "-",
          address: company.address ?? "-",
          location: company.location ?? "-",
          ownerName: company.contact_person,
          phoneNumber: company.phone_number ?? "-",
          email: company.email_id ?? "-",
          companyType: company.type === 1 ? "other" 
          : company.type === 2 ? "private" : company.type === 3 ? "government" : "",
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
      showErrorToast(error.message || "Failed to load company profile");
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, companyId]);

  useEffect(() => {
    fetchCompanyData();
  }, [fetchCompanyData]);

  // Edit Handlers
  const handleEditStart = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const handleEditCancel = () => {
    setEditingField(null);
    setTempValue("");
  };

  const handleEditSave = async (field: string) => {
    try {
      if (field === "email" && !validateEmail(tempValue)) {
        showErrorToast("Please enter a valid email address.");
        return;
      }
      if (field === "phoneNumber" && !validatePhoneNumber(tempValue)) {
        showErrorToast("Please enter a valid 10-digit phone number.");
        return;
      }

      setLoading(true);
      const formData = new FormData();
      formData.append("id", companyId.toString());

      switch (field) {
        case "ownerName":
          formData.append("contact_person", tempValue);
          break;
        case "address":
          formData.append("address", tempValue);
          break;
        case "phoneNumber":
          formData.append("phone_number", `+91${tempValue}`);
          break;
        case "email":
          formData.append("email_id", tempValue);
          break;
      }

      await dispatch(companyUpdateApi({ companyId, formData })).unwrap();
      showSuccessToast(`${field} updated successfully!`);
      setEditingField(null);
      fetchCompanyData();
    } catch (error: any) {
      showErrorToast(`Error updating ${field}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };



  const handleLocationUpdate = (location: { lat: number; lng: number }) => {
    const formData = new FormData();
    formData.append("id", companyId.toString());
    formData.append("location", `POINT (${location.lng} ${location.lat})`);

    dispatch(companyUpdateApi({ companyId, formData }))
      .unwrap()
      .then(() => {
        showSuccessToast("Location updated successfully!");
        setMapModalOpen(false);
        fetchCompanyData();
      })
      .catch((error: any) => {
        showErrorToast(`Error updating location: ${error.message}`);
      });
  };
  const getStatusChip = () => {
    if (!company) return null;

    switch (company.status) {
      case "Validating":
        return (
          <Chip
            icon={<NewReleasesIcon />}
            label="VALIDATING"
            color="warning"
            variant="outlined"
            sx={{ fontWeight: "bold" }}
          />
        );
      case "Verified":
        return (
          <Chip
            icon={<VerifiedIcon />}
            label="VERIFIED"
            color="success"
            variant="outlined"
            sx={{ fontWeight: "bold" }}
          />
        );
      default:
        return (
          <Chip
            icon={<BlockIcon />}
            label="SUSPENDED"
            color="error"
            variant="outlined"
            sx={{ fontWeight: "bold" }}
          />
        );
    }
  };
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!company) {
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <Typography>No company data available.</Typography>
      </Box>
    );
  }
  const getCompanyTypeChip = () => {
    if (!company) return null;

    const type = company.companyType?.toLowerCase();
    switch (type) {
      case "government":
        return (
          <Chip
            icon={<BusinessIcon />}
            label="Government"
            color="primary"
            variant="outlined"
          />
        );
      case "private":
        return (
          <Chip
            icon={<BusinessIcon />}
            label="Private"
            color="success"
            variant="outlined"
          />
        );
        case "other":
        return (
          <Chip
            icon={<BusinessIcon />}
            label="other"
            color="primary"
            variant="outlined"
          />
        );
      default:
        return (
          <Chip
            icon={<BusinessIcon />}
            label={company.companyType || "Not specified"}
            variant="outlined"
          />
        );
    }
  };

const renderEditableField = (
  field: string,
  label: string,
  value: string,
  icon: React.ReactNode,
  multiline: boolean = false
) => {
  if (editingField === field) {
  return (
    <Box
      sx={{
        width: "100%",
        p: { xs: 0.5, sm: 1 },
        backgroundColor:
          theme.palette.mode === "light"
            ? theme.palette.grey[50]
            : theme.palette.grey[800],
        borderRadius: 1,
        mb: 1,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        {/* Icon */}
        <Avatar
          sx={{
            bgcolor: "background.paper",
            color: "primary.main",
            width: { xs: 24, sm: 32 },
            height: { xs: 24, sm: 32 },
            fontSize: { xs: 14, sm: 18 },
            flexShrink: 0,
          }}
        >
          {icon}
        </Avatar>

        {/* 🔥 Remove label Typography here */}

        {/* Editable Input */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {field === "phoneNumber" ? (
  <TextField
    fullWidth
    size="small"
    type="number"
    label={label} // 👈 Add this
    value={tempValue}
    onChange={(e) =>
      setTempValue(e.target.value.replace(/\D/g, ""))
    }
    inputProps={{
      inputMode: "numeric",
      pattern: "[0-9]*",
      maxLength: 10,
      style: { fontSize: "0.85rem", padding: "6px 8px" },
    }}
  />
) : (
  <TextField
    fullWidth
    size="small"
    label={label} // 👈 Add this
    value={tempValue}
    onChange={(e) => setTempValue(e.target.value)}
    multiline={multiline}
    rows={multiline ? 3 : 1}
    InputProps={{
      style: { fontSize: "0.85rem", padding: "6px 8px" },
    }}
  />
)}

        </Box>

        {/* Save/Cancel */}
        <Stack direction="row" spacing={0.25}>
          <IconButton
            onClick={() => handleEditSave(field)}
            color="primary"
            size="small"
          >
            <CheckIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={handleEditCancel}
            color="error"
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
}


  return (
    <Box
      sx={{
        p: { xs: 0.75, sm: 1.5 },
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
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Avatar
          sx={{
            bgcolor: "background.paper",
            color: "primary.main",
            width: { xs: 24, sm: 32 },
            height: { xs: 24, sm: 32 },
            fontSize: { xs: 14, sm: 16 },
          }}
        >
          {icon}
        </Avatar>

        {/* Label */}
        <Typography
          variant="subtitle2"
          color="text.secondary"
          fontWeight={600}
          sx={{
            width: { xs: 70, sm: 100 },
            flexShrink: 0,
            fontSize: { xs: "0.7rem", sm: "0.875rem" },
            whiteSpace: "nowrap",
          }}
        >
          {label}:
        </Typography>

        {/* Value */}
        <Typography
          variant="body1"
          color="text.primary"
          fontWeight={500}
          sx={{
            flex: 1,
            ml: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: { xs: "0.8rem", sm: "1rem" },
          }}
        >
          {value || "Not specified"}
        </Typography>

        {/* Edit Button */}
        {canUpdateCompany && (
          <IconButton
            onClick={() => handleEditStart(field, value)}
            color="primary"
            size="small"
            sx={{
              opacity: 0.7,
              "&:hover": { opacity: 1 },
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>
    </Box>
  );
};


if (!company) {
  return <Box>Loading...</Box>;
}

const coordinates = extractCoordinates(company.location);
return (
  <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: "100%" }}> 
    <Paper
      elevation={3}
      sx={{
        p: 0,
        borderRadius: 2,
        overflow: "hidden",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        width: "100%",
        minHeight: { xs: "auto", md: 400 },
      }}
    >
      {/* Left: Company Summary */}
<Box
  sx={{
    flex: 1,
    minWidth: { xs: "100%", md: 300 },
    maxWidth: { xs: "100%", md: 300 },
    backgroundColor:
      theme.palette.mode === "light"
        ? "#f9f9f9"
        : theme.palette.background.paper,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    py: { xs: 2, sm: 3, md: 4 },
    px: { xs: 1.5, sm: 2 },
  }}
>
  <Avatar
    sx={{
      width: { xs: 72, sm: 84, md: 96 },
      height: { xs: 72, sm: 84, md: 96 },
      bgcolor: "#187b48",
      mb: { xs: 1.5, sm: 2 },
    }}
  >
    <BusinessIcon fontSize="large" />
  </Avatar>
  <Typography 
    variant="h5" 
    sx={{ 
      fontWeight: "bold", 
      mb: 1, 
      fontSize: { xs: "1.25rem", sm: "1.5rem" },
      textAlign: "center"
    }}
  >
    {company.name}
  </Typography>
  <Typography 
    variant="subtitle1" 
    color="textSecondary"
    sx={{ fontSize: { xs: "0.8rem", sm: "1rem" } }}
  >
    Company ID: {company.id}
  </Typography>
  <Box sx={{ mt: 2, display: "flex", gap: 0.5, flexWrap: "wrap", justifyContent: "center" }}>
    {getStatusChip()}
    {getCompanyTypeChip()}
  </Box>
</Box>

{/* Vertical Divider */}
<Box
  sx={{
    width: { xs: "100%", md: "1px" },
    height: { xs: "1px", md: "auto" },
    backgroundColor: "divider",
    alignSelf: "stretch",
    my: { xs: 1, md: 0 },
  }}
/>


      {/* Vertical Divider */}
      {!editingField && ( // 🔥 Hide divider too
        <Box
          sx={{
            width: { xs: "100%", md: "1px" },
            height: { xs: "1px", md: "auto" },
            backgroundColor: "divider",
            alignSelf: "stretch",
            my: { xs: 1, md: 0 },
          }}
        />
      )}

      {/* Right Section: Editable Details */}
      <Box
        sx={{
          flex: 2,
          p: { xs: 1.5, sm: 2, md: 3 },
          width: "100%", // 🔥 Full width when editing
        }}
      >
        <Typography
          variant="h6"
          sx={{
            mb: { xs: 1, sm: 1.5 },
            fontWeight: "bold",
            fontSize: { xs: "1rem", sm: "1.25rem" },
          }}
        >
          Company Details
        </Typography>
        <Box>
          {renderEditableField(
            "ownerName",
            "Owner",
            company.ownerName,
            <Person />
          )}
          {renderEditableField(
            "address",
            "Address",
            company.address,
            <LocationOnIcon />,
            true
          )}
          {renderEditableField(
            "phoneNumber",
            "Phone",
            formatPhoneNumber(company.phoneNumber),
            <PhoneIcon />
          )}
          {renderEditableField(
            "email",
            "Email",
            company.email,
            <EmailIcon />
          )}

          <Box
            sx={{
              p: { xs: 0.75, sm: 1 },
              borderRadius: 1,
              mb: 1,
              display: "flex",
              alignItems: "center",
              "&:hover": {
                backgroundColor:
                  theme.palette.mode === "light"
                    ? theme.palette.grey[50]
                    : theme.palette.grey[800],
              },
            }}
          >
            <Avatar
              sx={{
                bgcolor: "background.paper",
                color: "primary.main",
                width: { xs: 28, sm: 32 },
                height: { xs: 28, sm: 32 },
                fontSize: { xs: 16, sm: 18 },
                mr: 1,
              }}
            >
              <LocationOnIcon />
            </Avatar>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              fontWeight={600}
              sx={{ 
                width: { xs: 80, sm: 100 }, // Fixed width for label alignment
                flexShrink: 0,
                fontSize: { xs: "0.75rem", sm: "0.875rem" }
              }}
            >
              Location:
            </Typography>
            {company.location ? (
              <Typography
                variant="body1"
                color="primary"
                onClick={() => setMapModalOpen(true)}
                style={{ cursor: "pointer", textDecoration: "underline" }}
                sx={{ 
                  flex: 1,
                  fontSize: { xs: "0.8rem", sm: "1rem" }
                }}
              >
                View on Map
              </Typography>
            ) : (
              <Typography
                variant="body1"
                color="textSecondary"
                sx={{ 
                  flex: 1,
                  fontSize: { xs: "0.8rem", sm: "1rem" }
                }}
              >
                Not available
              </Typography>
            )}
            {canUpdateCompany && (
              <IconButton
                onClick={() => setMapModalOpen(true)}
                color="primary"
                size="small"
                sx={{
                  opacity: 0.7,
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                  "&:hover": {
                    opacity: 1,
                  },
                }}
              >
                <EditIcon fontSize="inherit" />
              </IconButton>
            )}
          </Box>
        </Box>
      </Box>
    </Paper>

    <MapModal
      open={mapModalOpen}
      onClose={() => setMapModalOpen(false)}
      onSelectLocation={handleLocationUpdate}
      initialCoordinates={
        coordinates
          ? { lat: coordinates.latitude, lng: coordinates.longitude }
          : undefined
      }
      canUpdateCompany={canUpdateCompany}
    />
  </Box>
);

};

export default CompanyDetailsPage;

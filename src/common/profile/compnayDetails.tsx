import React, { useState } from "react";
import {
  Typography,
  Box,
  Avatar,
  Grid,
  Paper,
  Divider,
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
} from "@mui/icons-material";
import VerifiedIcon from "@mui/icons-material/Verified";
import NewReleasesIcon from "@mui/icons-material/NewReleases";
import BlockIcon from "@mui/icons-material/Block";
import BusinessIcon from "@mui/icons-material/Business";
import { useAppDispatch } from "../../store/Hooks";
import { companyUpdateApi } from "../../slices/appSlice";
import { showErrorToast, showSuccessToast } from "../toastMessageHelper";
import MapModal from "./MapModal";
import { useSelector } from "react-redux";
import { RootState } from "../../store/Store";
import { useTheme } from "@mui/material/styles";

interface CompanyCardProps {
  company: {
    id: number;
    name: string;
    ownerName: string;
    location: string;
    phoneNumber: string;
    address: string;
    email: string;
    status: string;
    companyType: string;
  };
  companyId: number;
}

const CompanyDetailsPage: React.FC<CompanyCardProps> = ({
  company,
  companyId,
}) => {
  const theme = useTheme();
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");
  const dispatch = useAppDispatch();
  const [_loading, setLoading] = useState(false);
  const canManageCompany = useSelector((state: RootState) =>
    state.app.permissions.includes("manage_company")
  );

  const extractCoordinates = (location: string) => {
    if (!location) return null;
    const regex = /POINT\(([\d.]+) ([\d.]+)\)/;
    const match = location.match(regex);

    if (match) {
      return {
        longitude: parseFloat(match[1]),
        latitude: parseFloat(match[2]),
      };
    }
    return null;
  };

  const coordinates = extractCoordinates(company.location);
  const formatPhoneNumber = (phone: string | undefined): string => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    return digits.length > 10 ? digits.slice(-10) : digits;
  };
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
      setLoading(true);
      const formData = new FormData();
      formData.append("id", companyId.toString());

      switch (field) {
        case "name":
          formData.append("name", tempValue);
          break;
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
      
    } catch (error) {
      showErrorToast(`Error updating ${field}: ${error}`);
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
        
      })
      .catch((error) => {
        showErrorToast(`Error updating location: ${error}`);
      });
  };

  const getStatusChip = () => {
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

  const getCompanyTypeChip = () => {
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
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                multiline={multiline}
                rows={multiline ? 3 : 1}
              />
            </Grid>
            <Grid item>
              <Stack direction="row" spacing={0.5}>
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
            <Typography
              variant="subtitle2"
              color="text.secondary"
              fontWeight={600}
            >
              {label}
            </Typography>
            <Typography
              variant="body1"
              color="text.primary"
              fontWeight={500}
              sx={{ wordBreak: "break-word" }}
            >
              {value || "Not specified"}
            </Typography>
          </Grid>
          <Grid item>
            {canManageCompany && (
              <IconButton
                onClick={() => handleEditStart(field, value)}
                color="primary"
                size="small"
                sx={{
                  opacity: 0.7,
                  "&:hover": {
                    opacity: 1,
                  },
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3, maxWidth: "100%" }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Grid container spacing={3}>
          {/* Left Column - Basic Info */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: "#187b48",
                  mb: 2,
                }}
              >
                <BusinessIcon fontSize="large" />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
                {company.name}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary">
                Company ID: {company.id}
              </Typography>
              <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                {getStatusChip()}
                {getCompanyTypeChip()}
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Middle Column - Details */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
              Company Details
            </Typography>
            <Box>
              {renderEditableField(
                "ownerName",
                "Owner Name",
                company.ownerName || "",
                <Person />,
                false
              )}
              {renderEditableField(
                "address",
                "Address",
                company.address || "",
                <LocationOnIcon />,
                true
              )}
              {renderEditableField(
                "phoneNumber",
                "Phone Number",
                formatPhoneNumber(company.phoneNumber),
                <PhoneIcon />,
                false
              )}
              {renderEditableField(
                "email",
                "Email",
                company.email || "",
                <EmailIcon />,
                false
              )}
              {/* Location (not editable inline, but show view/edit) */}
              <Box
                sx={{
                  p: 2,
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
                    width: 40,
                    height: 40,
                    mr: 2,
                  }}
                >
                  <LocationOnIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    Location
                  </Typography>
                  {company.location ? (
                    <Typography
                      variant="body1"
                      color="primary"
                      onClick={() => setMapModalOpen(true)}
                      style={{ cursor: "pointer" }}
                    >
                      <u>View on Map</u>
                    </Typography>
                  ) : (
                    <Typography variant="body1" color="textSecondary">
                      Not available
                    </Typography>
                  )}
                </Box>
                {canManageCompany && (
                  <IconButton
                    onClick={() => setMapModalOpen(true)}
                    color="primary"
                    size="small"
                    sx={{
                      opacity: 0.7,
                      "&:hover": {
                        opacity: 1,
                      },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
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
        canManageCompany={canManageCompany}
      />
    </Box>
  );
};

export default CompanyDetailsPage;

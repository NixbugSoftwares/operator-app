import React, { useState } from "react";
import {
  Card,
  CardActions,
  Typography,
  Button,
  Box,
  Avatar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Tooltip,
  Chip,
  TextField,
} from "@mui/material";

import { Delete as DeleteIcon } from "@mui/icons-material";
import DateRangeOutlinedIcon from "@mui/icons-material/DateRangeOutlined";
import AssignmentIndRoundedIcon from "@mui/icons-material/AssignmentIndRounded";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import { useAppDispatch } from "../../store/Hooks";
import { serviceDeleteApi } from "../../slices/appSlice";
import localStorageHelper from "../../utils/localStorageHelper";
import ServiceUpdateForm from "./ServiceUpdation";
import {
  showErrorToast,
  showSuccessToast,
} from "../../common/toastMessageHelper";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store/Store";
import { Service } from "../../types/type";
import moment from "moment";
interface ServiceCardProps {
  service: Service;
  refreshList: (value: any) => void;
  onUpdate: () => void;
  onDelete: (id: number) => void;
  onBack: () => void;
  onCloseDetailCard: () => void;
}

const statusMap: Record<string, { label: string; color: string; bg: string }> =
  {
    Created: {
      label: "Created",
      color: "#1976D2",
      bg: "rgba(33, 150, 243, 0.12)",
    }, // Blue
    Started: {
      label: "Started",
      color: "#388E3C",
      bg: "rgba(76, 175, 80, 0.12)",
    }, // Green
    Terminated: {
      label: "Terminated",
      color: "#D32F2F",
      bg: "rgba(244, 67, 54, 0.12)",
    }, // Red
    Ended: {
      label: "Ended",
      color: "#616161",
      bg: "rgba(158, 158, 158, 0.12)",
    }, // Grey
    Audited: {
      label: "Audited",
      color: "#FF9800",
      bg: "rgba(255, 152, 0, 0.15)",
    },
  };

const ticketModeMap: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  Hybrid: { label: "Hybrid", color: "#009688", bg: "rgba(0, 150, 136, 0.15)" }, // Teal
  Digital: {
    label: "Digital",
    color: "#2196F3",
    bg: "rgba(33, 150, 243, 0.15)",
  }, // Blue
  Conventional: {
    label: "Conventional",
    color: "#FF5722",
    bg: "rgba(255, 87, 34, 0.15)",
  }, // Deep Orange
};

const ServiceDetailsCard: React.FC<ServiceCardProps> = ({
  service,
  refreshList,
  onDelete,
  onBack,
  onCloseDetailCard,
}) => {
  console.log("service>>>>>>>>>>>>>>>>>>>>>>>>>>>>", service);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [updateFormOpen, setUpdateFormOpen] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const canUpdateService = useSelector((state: RootState) =>
    state.app.permissions.includes("update_service")
  );
  const canDeleteService = useSelector((state: RootState) =>
    state.app.permissions.includes("delete_service")
  );

  const handleServiceDelete = async () => {
    if (!service.id) {
      console.error("Error: service ID is missing");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("id", String(service.id));
      await dispatch(serviceDeleteApi(formData)).unwrap();

      setDeleteConfirmOpen(false);
      localStorageHelper.removeStoredItem(`service${service.id}`);
      onDelete(service.id);
      showSuccessToast("service deleted successfully");
      onCloseDetailCard();
      refreshList("refresh");
    } catch (error: any) {
      console.error("Delete error:", error);
      showErrorToast(error.message || "Service deletion failed. Please try again.");
    }
  };
  return (
    <>
      <Card
        sx={{
          maxWidth: 400,
          width: "100%",
          margin: "auto",
          boxShadow: 3,
          p: 2,
        }}
      >
        {/* Bus Avatar & Info */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Avatar sx={{ width: 80, height: 80, bgcolor: "darkblue" }}>
            <AssignmentIndRoundedIcon fontSize="large" />
          </Avatar>
          <Typography variant="h6" sx={{ mt: 1 }}>
            <b>{service.name}</b>
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <b>Service ID:</b> {service.id}
          </Typography>
        </Box>
        {/* Bus Details (Aligned Left) */}
        <Card sx={{ p: 2, bgcolor: "grey.100", mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              alignItems: "flex-start",
            }}
          >
            <Typography variant="body1">
              <b>Route :</b> {service.routeName}
            </Typography>
            <Typography variant="body1">
              <b>Bus:</b> {service.name.match(/\(([^)]+)\)$/)?.[1] || "N/A"}
            </Typography>
            <Typography variant="body1">
              <b>Fare :</b> {service.fareName}
            </Typography>
            <Typography
              variant="body1"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <b>Status:</b>
              <Chip
                label={statusMap[service.status]?.label || "Unknown"}
                sx={{
                  bgcolor: statusMap[service.status]?.bg,
                  color: statusMap[service.status]?.color,
                  fontWeight: "bold",
                  borderRadius: "12px",
                  px: 1.5,
                  fontSize: "0.75rem",
                  width: 150,
                }}
                size="small"
              />
            </Typography>
            <Typography
              variant="body1"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <b>Ticket Mode:</b>
              <Chip
                label={ticketModeMap[service.ticket_mode]?.label || "Unknown"}
                sx={{
                  bgcolor: ticketModeMap[service.ticket_mode]?.bg,
                  color: ticketModeMap[service.ticket_mode]?.color,
                  fontWeight: 600,
                  borderRadius: "12px",
                  px: 1.5,
                  fontSize: "0.75rem",
                  width: 150,
                }}
                size="small"
              />
            </Typography>

            <Typography variant="body1">
              <b>Starting Date:</b>{" "}
              {moment(service?.starting_at).isValid()
                ? moment(service.starting_at)
                    .local()
                    .format("DD-MM-YYYY, hh:mm A")
                : ""}
            </Typography>
            <Typography variant="body1">
              <b>Ending Date:</b>{" "}
              {moment(service?.ending_at).isValid()
                ? moment(service.ending_at)
                    .local()
                    .format("DD-MM-YYYY, hh:mm A")
                : ""}
            </Typography>

            <TextField
              label="Remarks"
              value={service.remarks || "No remarks added"}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              InputProps={{
                readOnly: true,
                sx: {
                  cursor: "default",
                  "& input": {
                    userSelect: "none",
                  },
                },
              }}
              sx={{
                mt: 1,
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "action.hover",
                  "& fieldset": {
                    borderColor: "grey.300",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "grey.300",
                  },
                },
                "& .MuiInputBase-inputMultiline": {
                  userSelect: "none",
                  cursor: "default",
                },
              }}
            />
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <DateRangeOutlinedIcon color="action" sx={{ mr: 1 }} />

              <Typography variant="body2">
                <b> Created At:</b>
                {moment(service.created_on)
                  .local()
                  .format("DD-MM-YYYY, hh:mm A")}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <DateRangeOutlinedIcon color="action" sx={{ mr: 1 }} />

              <Typography variant="body2">
                <b> Last Updated At:</b>
                {moment(service?.updated_on).isValid()
                  ? moment(service.updated_on)
                      .local()
                      .format("DD-MM-YYYY, hh:mm A")
                  : "Not updated yet"}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Button
              variant="outlined"
              color="secondary"
              sx={{ width: "300px" }}
              onClick={() => navigate(`/ticket?service_id=${service.id}`)}
            >
              <ConfirmationNumberIcon sx={{ mr: 1 }} />
              View All Tickets
            </Button>
          </Box>
        </Card>

        {/* Action Buttons */}
        <CardActions>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={onBack}
            >
              Back
            </Button>

            {canUpdateService && (
              <Button
                variant="contained"
                color="success"
                size="small"
                onClick={() => setUpdateFormOpen(true)}
                disabled={!canUpdateService}
                sx={{
                  "&.Mui-disabled": {
                    backgroundColor: "#81c784 !important",
                    color: "#ffffff99",
                  },
                }}
              >
                Update
              </Button>
            )}

            {/* Delete Button with Tooltip */}
            {canDeleteService && (
              <Tooltip
                title={
                  service.status === "Started"
                    ? "Cannot delete a service that has Started"
                    : service.status === "Terminated"
                    ? "Cannot delete a service that is Terminated"
                    : service.status === "Ended"
                    ? "Cannot delete a service that is Ended"
                    : ""
                }
                arrow
                placement="top-start"
              >
                <span
                  style={{
                    cursor: !canDeleteService ? "not-allowed" : "default",
                  }}
                >
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => setDeleteConfirmOpen(true)}
                    startIcon={<DeleteIcon />}
                    disabled={
                      !canDeleteService ||
                      service.status === "Started" ||
                      service.status === "Terminated" ||
                      service.status === "Ended"
                    }
                    sx={{
                      "&.Mui-disabled": {
                        backgroundColor: "#e57373 !important",
                        color: "#ffffff99",
                      },
                    }}
                  >
                    Delete
                  </Button>
                </span>
              </Tooltip>
            )}
          </Box>
        </CardActions>
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this Service?
          </DialogContentText>
          <Typography>
            <b>Service Name:</b> {service.name},
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleServiceDelete} color="error">
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Form Modal */}
      <Dialog
        open={updateFormOpen}
        onClose={() => setUpdateFormOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent>
          <ServiceUpdateForm
            serviceId={service.id}
            serviceData={{
              id: service.id,
              name: service.name,
              ticket_mode: service.ticket_mode,
              status: service.status,
              remarks: service.remarks,
            }}
            refreshList={(value: any) => refreshList(value)}
            onClose={() => setUpdateFormOpen(false)}
            onCloseDetailCard={onCloseDetailCard}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setUpdateFormOpen(false)} color="error">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ServiceDetailsCard;

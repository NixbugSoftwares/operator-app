import React, { useEffect, useState } from "react";
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
} from "@mui/material";

import { Delete as DeleteIcon } from "@mui/icons-material";
import AssignmentIndRoundedIcon from "@mui/icons-material/AssignmentIndRounded";
import { useAppDispatch } from "../../store/Hooks";
import {
  serviceDeleteApi,
  busRouteListApi,
  companyBusListApi,
  fareListingApi,
} from "../../slices/appSlice";
import localStorageHelper from "../../utils/localStorageHelper";
import ServiceUpdateForm from "./ServiceUpdation";
import { showSuccessToast } from "../../common/toastMessageHelper";

interface ServiceCardProps {
  service: {
    id: number;
    name: string;
    ticket_mode: number;
    created_mode: number;
    status: string;
    bus_id: number;
    route_id: number;
    fare_id: number;
    starting_date: string;
    remarks: string;
  };
  refreshList: (value: any) => void;
  onUpdate: () => void;
  onDelete: (id: number) => void;
  onBack: () => void;
  canManageService: boolean;
  onCloseDetailCard: () => void;
}

const statusMap: Record<string, { label: string; color: string }> = {
  Created: { label: "Created", color: "#42a5f5" },
  Started: { label: "Started", color: "#66bb6a" },
  Terminated: { label: "Terminated", color: "#ef5350" },
  Ended: { label: "Ended", color: "#ab47bc" },
};

const ticketModeMap: Record<string, { label: string; color: string }> = {
  Hybrid: { label: "Hybrid", color: "#29b6f6" },
  Digital: { label: "Digital", color: "#26a69a" },
  Conventional: { label: "Conventional", color: "#ffa726" },
};

const createdModeMap: Record<string, { label: string; color: string }> = {
  Manual: { label: "Manual", color: "#8d6e63" },
  Automatic: { label: "Automatic", color: "#5c6bc0" },
};

const ServiceDetailsCard: React.FC<ServiceCardProps> = ({
  service,
  refreshList,
  onDelete,
  onBack,
  canManageService,
  onCloseDetailCard,
}) => {
  console.log("service>>>>>>>>>>>>>>>>>>>>>>>>>>>>", service);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [updateFormOpen, setUpdateFormOpen] = useState(false);
  const dispatch = useAppDispatch();
  const [routeName, setRouteName] = useState("Route not found");
  const [busName, setBusName] = useState("Bus not found");
  const [fareName, setFareName] = useState("Fare not found");
  const fetchRouteName = async () => {
    try {
      const id = service.route_id;
      const response = await dispatch(busRouteListApi({ id })).unwrap();
      setRouteName(response.data[0].name);
      console.log("Route Name Response:", response.data[0].name);

      return response.data[0].name;
    } catch (error) {
      console.error("Error fetching route name:", error);
      return "Route not found";
    }
  };
  const fetchBusName = async () => {
    try {
      const id = service.bus_id;
      const response = await dispatch(companyBusListApi({ id })).unwrap();
      setBusName(response.data[0].name);
      console.log("Bus Name Response:", response.data[0].name);

      return response.data[0].name;
    } catch (error) {
      console.error("Error fetching bus name:", error);
      return "Bus not found";
    }
  };

  const fetchFareName = async () => {
    try {
      const id = service.fare_id;
      const response = await dispatch(fareListingApi({ id })).unwrap();
      setFareName(response.data[0].name);
      console.log("Fare Name Response:", response.data[0].name);

      return response.data[0].name;
    } catch (error) {
      console.error("Error fetching fare name:", error);
      return "Fare not found";
    }
  };
  useEffect(() => {
    fetchRouteName();
    fetchBusName();
    fetchFareName();
  }, [service.route_id, service.bus_id, service.fare_id]);

  const formatUTCDateToLocal = (dateString: string | null): string => {
    if (!dateString || dateString.trim() === "") return "Not added yet";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "Not added yet" : date.toLocaleDateString();
  };

  const handleBusDelete = async () => {
    if (!service.id) {
      console.error("Error: Bus ID is missing");
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
    } catch (error) {
      console.error("Delete error:", error);
    }
  };
  console.log(service.status);

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
              <b>Route :</b> {routeName}
            </Typography>
            <Typography variant="body1">
              <b>Bus :</b> {busName}
            </Typography>
            <Typography variant="body1">
              <b>Fare :</b> {fareName}
            </Typography>
            <Typography
              variant="body1"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <b>Ticket Mode:</b>
              <Chip
                label={ticketModeMap[service.ticket_mode]?.label || "Unknown"}
                sx={{
                  bgcolor: `${ticketModeMap[service.ticket_mode]?.color}20`,
                  color: ticketModeMap[service.ticket_mode]?.color,
                  fontWeight: "bold",
                  borderRadius: "12px",
                  px: 1.5,
                  fontSize: "0.75rem",
                }}
                size="small"
              />
            </Typography>
            <Typography
              variant="body1"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <b>Created Mode:</b>
              <Chip
                label={createdModeMap[service.created_mode]?.label || "Unknown"}
                sx={{
                  bgcolor: `${createdModeMap[service.created_mode]?.color}20`,
                  color: createdModeMap[service.created_mode]?.color,
                  fontWeight: "bold",
                  borderRadius: "12px",
                  px: 1.5,
                  fontSize: "0.75rem",
                }}
                size="small"
              />
            </Typography>
            <Typography
              variant="body1"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <b>Status:</b>
              <Chip
                label={statusMap[service.status]?.label || "Unknown"}
                sx={{
                  bgcolor: `${statusMap[service.status]?.color}20`,
                  color: statusMap[service.status]?.color,
                  fontWeight: "bold",
                  borderRadius: "12px",
                  px: 1.5,
                  fontSize: "0.75rem",
                }}
                size="small"
              />
            </Typography>
            <Typography variant="body1">
              <b>Starting Date:</b>{" "}
              {formatUTCDateToLocal(service.starting_date)}
            </Typography>

            <Typography variant="body1">
              <b>Remarks:</b> {service.remarks || "Not added yet"}
            </Typography>
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

            {/* Update Button with Tooltip */}
            <Tooltip
              title={
                !canManageService
                  ? "You don't have permission, contact the admin"
                  : ""
              }
              arrow
              placement="top-start"
            >
              <span
                style={{
                  cursor: !canManageService ? "not-allowed" : "default",
                }}
              >
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={() => setUpdateFormOpen(true)}
                  disabled={!canManageService}
                  sx={{
                    "&.Mui-disabled": {
                      backgroundColor: "#81c784 !important",
                      color: "#ffffff99",
                    },
                  }}
                >
                  Update
                </Button>
              </span>
            </Tooltip>

            {/* Delete Button with Tooltip */}
            <Tooltip
              title={
                !canManageService
                  ? "You don't have permission, contact the admin"
                  : service.status === "Started"
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
                  cursor: !canManageService ? "not-allowed" : "default",
                }}
              >
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={() => setDeleteConfirmOpen(true)}
                  startIcon={<DeleteIcon />}
                  disabled={
                    !canManageService ||
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
            Are you sure you want to delete this bus?
          </DialogContentText>
          <Typography>
            <b>Service Name:</b> {service.name},
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleBusDelete} color="error">
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
      </Dialog>
    </>
  );
};

export default ServiceDetailsCard;

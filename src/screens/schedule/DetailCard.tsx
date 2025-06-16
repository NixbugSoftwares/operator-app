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
  scheduleDeleteApi,
  busRouteListApi,
  companyBusListApi,
  fareListingApi,
} from "../../slices/appSlice";
import ScheduleUpdateForm from "./updationForm";
import { showSuccessToast } from "../../common/toastMessageHelper";

interface ServiceCardProps {
  schedule: {
    id: number;
    name: string;
    permit_no: string;
    ticket_mode: number;
    trigger_mode: number;
    bus_id: number;
    route_id: number;
    fare_id: number;
    frequency: number[] ;
  };
  refreshList: (value: any) => void;
  onUpdate: () => void;
  onDelete: (id: number) => void;
  onBack: () => void;
  canManageSchedule: boolean;
  onCloseDetailCard: () => void;
}

const createdTriggerMap: Record<string, { label: string; color: string }> = {
  Automatic: { label: "Automatic", color: "#616161" },
  Manual: { label: "Manual", color: "#2E7D32" },
  Disabled: { label: "Disabled", color: "#C62828" },
};

const ticketModeMap: Record<string, { label: string; color: string }> = {
  Hybrid: { label: "Hybrid", color: "#FF8F00" },
  Digital: { label: "Digital", color: "#0097A7" },
  Conventional: { label: "Conventional", color: "#616161" },
};

const dayMap = [
  "",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const ScheduleDetailsCard: React.FC<ServiceCardProps> = ({
  schedule,
  refreshList,
  onDelete,
  onBack,
  canManageSchedule,
  onCloseDetailCard,
}) => {
  console.log("schedule>>>>>>>>>>>>>>>>>>>>>>>>>>>>", schedule);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [updateFormOpen, setUpdateFormOpen] = useState(false);
  const dispatch = useAppDispatch();
  const [routeName, setRouteName] = useState("Route not found");
  const [busName, setBusName] = useState("Bus not found");
  const [fareName, setFareName] = useState("Fare not found");
  const fetchRouteName = async () => {
    try {
      const id = schedule.route_id;
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
      const id = schedule.bus_id;
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
      const id = schedule.fare_id;
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
  }, [schedule.route_id, schedule.bus_id, schedule.fare_id]);

  const formatUTCDateToLocal = (dateString: string | null): string => {
    if (!dateString || dateString.trim() === "") return "Not added yet";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "Not added yet" : date.toLocaleDateString();
  };

  const handleScheduleDelete = async () => {
    if (!schedule.id) {
      console.error("Error: Schedule ID is missing");
      return;
    }

    try {
      await dispatch(scheduleDeleteApi(schedule.id)).unwrap();

      setDeleteConfirmOpen(false);
      onDelete(schedule.id);
      showSuccessToast("Schedule deleted successfully");
      onCloseDetailCard();
      refreshList("refresh");
    } catch (error) {
      console.error("Delete error:", error);
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
            <b>{schedule.name}</b>
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <b>Schedule ID:</b> {schedule.id}
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
              <b>Permit Number:</b> {formatUTCDateToLocal(schedule.permit_no)}
            </Typography>
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
                label={ticketModeMap[schedule.ticket_mode]?.label || "Unknown"}
                sx={{
                  bgcolor: `${ticketModeMap[schedule.ticket_mode]?.color}20`,
                  color: ticketModeMap[schedule.ticket_mode]?.color,
                  fontWeight: 600,
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
              <b>Trigger Mode:</b>
              <Chip
                label={createdTriggerMap[schedule.trigger_mode]?.label || "Unknown"}
                sx={{
                  bgcolor: `${createdTriggerMap[schedule.trigger_mode]?.color}20`,
                  color: createdTriggerMap[schedule.trigger_mode]?.color,
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
  <b>Active Days:</b>{" "}
  {schedule.frequency && Array.isArray(schedule.frequency)
    ? schedule.frequency
        .map((num) => dayMap[num] || num)
        .join(", ")
    : "Not set"}
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
                !canManageSchedule
                  ? "You don't have permission, contact the admin"
                  : ""
              }
              arrow
              placement="top-start"
            >
              <span
                style={{
                  cursor: !canManageSchedule ? "not-allowed" : "default",
                }}
              >
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={() => setUpdateFormOpen(true)}
                  disabled={!canManageSchedule}
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
                !canManageSchedule
                  ? "You don't have permission, contact the admin"
                  : ""
              }
              arrow
              placement="top-start"
            >
              <span
                style={{
                  cursor: !canManageSchedule ? "not-allowed" : "default",
                }}
              >
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={() => setDeleteConfirmOpen(true)}
                  startIcon={<DeleteIcon />}
                  disabled={!canManageSchedule}
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
            Are you sure you want to delete this Schedule?
          </DialogContentText>
          <Typography>
            <b>Schedule Name:</b> {schedule.name},
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleScheduleDelete} color="error">
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
          <ScheduleUpdateForm
            scheduleId={schedule.id}
            scheduleData={{
              id: schedule.id,
              name: schedule.name,
              permit_no: schedule.permit_no,
              ticket_mode: schedule.ticket_mode,
              trigger_mode: schedule.trigger_mode,
              frequency: schedule.frequency,
              bus_id: schedule.bus_id,
              fare_id: schedule.fare_id,
              route_id: schedule.route_id,
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

export default ScheduleDetailsCard;

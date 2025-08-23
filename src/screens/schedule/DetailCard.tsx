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
  Chip,
} from "@mui/material";
import DateRangeOutlinedIcon from "@mui/icons-material/DateRangeOutlined";
import AssignmentIndRoundedIcon from "@mui/icons-material/AssignmentIndRounded";
import { useAppDispatch } from "../../store/Hooks";
import { scheduleDeleteApi } from "../../slices/appSlice";
import ScheduleUpdateForm from "./updationForm";
import {
  showErrorToast,
  showSuccessToast,
} from "../../common/toastMessageHelper";
import { useSelector } from "react-redux";
import { RootState } from "../../store/Store";
import { Schedule } from "../../types/type";
import moment from "moment";

interface ServiceCardProps {
  schedule: Schedule;
  relatedNames: {
    routeName: string;
    busName: string;
    fareName: string;
  };
  refreshList: (value: any) => void;
  onUpdate: () => void;
  onDelete: (id: number) => void;
  onBack: () => void;
  onCloseDetailCard: () => void;
}

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

const triggerModeMap: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  Automatic: {
    label: "Automatic",
    color: "#1976D2",
    bg: "rgba(33, 150, 243, 0.12)",
  }, // Blue
  Manual: { label: "Manual", color: "#FF9800", bg: "rgba(255, 152, 0, 0.15)" }, // Orange
  Disabled: {
    label: "Disabled",
    color: "#D32F2F",
    bg: "rgba(244, 67, 54, 0.12)",
  }, // Red
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
  relatedNames,
  refreshList,
  onDelete,
  onBack,
  onCloseDetailCard,
}) => {
  console.log("schedule>>>>>>>>>>>>>>>>>>>>>>>>>>>>", schedule);
  console.log("relatedNames>>>>>>>>>>>>>>>>>>>>>>>>>>>>", relatedNames);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [updateFormOpen, setUpdateFormOpen] = useState(false);
  const dispatch = useAppDispatch();
  const canUpdateSchedule = useSelector((state: RootState) =>
    state.app.permissions.includes("update_schedule")
  );
  const canDeleteSchedule = useSelector((state: RootState) =>
    state.app.permissions.includes("delete_schedule")
  );

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
    } catch (error: any) {
      console.error("Delete error:", error);
      showErrorToast(error.message || "Schedule deletion failed. Please try again.");
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
        <Card
          sx={{
            p: 2,
            bgcolor:
              schedule.bus_id === null ||
              schedule.fare_id === null ||
              schedule.route_id === null
                ? "#f3dbd9ff"
                : "grey.100",
            mb: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              alignItems: "flex-start",
            }}
          >
            <Typography variant="body1">
              <b>Route :</b>{" "}
              {schedule.route_id != null ? (
                relatedNames?.routeName || "Route name not available"
              ) : (
                <span style={{ color: "#c93535ff", fontWeight: "bold" }}>
                  Not found!
                </span>
              )}
            </Typography>
            <Typography variant="body1">
              <b>Bus :</b>{" "}
              {schedule.bus_id != null ? (
                relatedNames?.busName || "Bus name not available"
              ) : (
                <span style={{ color: "#c93535ff", fontWeight: "bold" }}>
                  Not found.
                </span>
              )}
            </Typography>

            <Typography variant="body1">
              <b>Fare :</b>{" "}
              {schedule.fare_id != null ? (
                relatedNames?.fareName || "Fare name not available"
              ) : (
                <span style={{ color: "#c93535ff", fontWeight: "bold" }}>
                  Not found.
                </span>
              )}
            </Typography>
            <Typography
              variant="body1"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <b>Ticket Mode:</b>
              <Chip
                label={
                  ticketModeMap[String(schedule.ticketing_mode)]?.label ||
                  "Unknown"
                }
                sx={{
                  bgcolor: ticketModeMap[String(schedule.ticketing_mode)]?.bg,
                  color: ticketModeMap[String(schedule.ticketing_mode)]?.color,
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
                label={
                  triggerModeMap[String(schedule.triggering_mode)]?.label ||
                  "Unknown"
                }
                sx={{
                  bgcolor: triggerModeMap[String(schedule.triggering_mode)]?.bg,
                  color:
                    triggerModeMap[String(schedule.triggering_mode)]?.color,
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
              <b>Active Days:</b>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                {schedule.frequency &&
                Array.isArray(schedule.frequency) &&
                schedule.frequency.length > 0 ? (
                  // Sort the days before mapping to chips
                  [...schedule.frequency]
                    .sort((a, b) => a - b) // Sort numerically (1-7)
                    .map((num) => (
                      <Chip
                        key={num}
                        label={dayMap[num] || num}
                        size="small"
                        sx={{
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      />
                    ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Not set
                  </Typography>
                )}
              </Box>
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <DateRangeOutlinedIcon color="action" sx={{ mr: 1 }} />

              <Typography variant="body2">
                <b> Created at:</b>
                {moment(schedule.created_on)
                  .local()
                  .format("DD-MM-YYYY, hh:mm A")}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <DateRangeOutlinedIcon color="action" sx={{ mr: 1 }} />

              <Typography variant="body2">
                <b> Last updated at:</b>
                {moment(schedule?.updated_on).isValid()
                  ? moment(schedule.updated_on)
                      .local()
                      .format("DD-MM-YYYY, hh:mm A")
                  : "Not updated yet"}
              </Typography>
            </Box>
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
            {canUpdateSchedule && (
              <Button
                variant="contained"
                color="success"
                size="small"
                onClick={() => setUpdateFormOpen(true)}
              >
                Update
              </Button>
            )}

            {/* Delete Button with Tooltip */}
            {canDeleteSchedule && (
              <Button
                variant="contained"
                color="error"
                size="small"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                Delete
              </Button>
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
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <ScheduleUpdateForm
            scheduleId={schedule.id}
            scheduleData={{
              id: schedule.id,
              name: schedule.name,
              ticket_mode: schedule.ticketing_mode,
              trigger_mode: schedule.triggering_mode,
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

        <DialogActions>
          <Button onClick={() => setUpdateFormOpen(false)} color="error">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ScheduleDetailsCard;

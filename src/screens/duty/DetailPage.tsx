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
} from "@mui/material";

import { Delete as DeleteIcon } from "@mui/icons-material";
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import { useAppDispatch } from "../../store/Hooks";
import { dutyDeleteApi } from "../../slices/appSlice";
import localStorageHelper from "../../utils/localStorageHelper";
import DutyUpdateForm from "./UpdationForm";
import { showSuccessToast } from "../../common/toastMessageHelper";

interface DutyCardProps {
  duty: {
    id:number;
    operatorName:string;
    serviceName:string;
    status:string;
    type:string
    service_id:number
  };
  refreshList: (value: any) => void;
  onUpdate: () => void;
  onDelete: (id: number) => void;
  onBack: () => void;
  canManageDuty: boolean;
  onCloseDetailCard: () => void;
}
const statusMap: Record<string, { label: string; color: string }> = {
  Assigned: { label: "Assigned", color: "#42a5f5" },
  Started: { label: "Started", color: "#66bb6a" },
  Terminated: { label: "Terminated", color: "#ef5350" },
  Finished: { label: "Finished", color: "#ab47bc" },
};

const typeMap: Record<string, { label: string; color: string }> = {
    Driver: { label: "Driver", color: "#42a5f5" },
    Conductor: { label: "Conductor", color: "#66bb6a" },
    Kili: { label: "Kili", color: "#ef5350" },
    Other: { label: "Other", color: "#ab47bc" },
}
const DutyDetailsCard: React.FC<DutyCardProps> = ({
  duty,
  refreshList,
  onDelete,
  onBack,
  canManageDuty,
  onCloseDetailCard,
}) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [updateFormOpen, setUpdateFormOpen] = useState(false);
  const dispatch = useAppDispatch();
  console.log("duty()()()()()()(()()", duty);



  const handleBusDelete = async () => {
    if (!duty.id) {
      console.error("Error: Bus ID is missing");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("id", String(duty.id));
      await dispatch(dutyDeleteApi(formData)).unwrap();

      setDeleteConfirmOpen(false);
      localStorageHelper.removeStoredItem(`bus_${duty.id}`);
      onDelete(duty.id);
      showSuccessToast("Duty deleted successfully");
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
            <AssignmentTurnedInRoundedIcon fontSize="large" />
          </Avatar>
          <Typography variant="body2" color="textSecondary">
            <b>Duty ID:</b> {duty.id}
          </Typography>
        </Box>

        {/* Bus Details (Aligned Left) */}
        <Card sx={{ p: 2, bgcolor: "grey.100", mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              alignItems: "flex-start",
            }}
          >
            <Typography variant="body2" color="textSecondary">
              <b>Assigned Operator:</b> {duty.operatorName}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <b>Service:</b> {duty.serviceName}
            </Typography>
            <Typography variant="body1" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <b>Status:</b>
        <Chip
          label={statusMap[duty.status]?.label || "Unknown"}
          sx={{
            bgcolor: `${statusMap[duty.status]?.color}20`,
            color: statusMap[duty.status]?.color,
            fontWeight: "bold",
            borderRadius: "12px",
            px: 1.5,
            fontSize: "0.75rem",
          }}
          size="small"
        />
      </Typography>
      <Typography variant="body1" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <b>Type:</b>
        <Chip
          label={typeMap[duty.type]?.label || "Unknown"}
          sx={{
            bgcolor: `${typeMap[duty.type]?.color}20`,
            color: statusMap[duty.type]?.color,
            fontWeight: "bold",
            borderRadius: "12px",
            px: 1.5,
            fontSize: "0.75rem",
          }}
          size="small"
        />
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
                !canManageDuty
                  ? "You don't have permission, contact the admin"
                  : ""
              }
              arrow
              placement="top-start"
            >
              <span
                style={{
                  cursor: !canManageDuty ? "not-allowed" : "default",
                }}
              >
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={() => setUpdateFormOpen(true)}
                  disabled={!canManageDuty}
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
                !canManageDuty
                  ? "You don't have permission, contact the admin"
                  : ""
              }
              arrow
              placement="top-start"
            >
              <span
                style={{
                  cursor: !canManageDuty ? "not-allowed" : "default",
                }}
              >
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={() => setDeleteConfirmOpen(true)}
                  startIcon={<DeleteIcon />}
                  disabled={!canManageDuty}
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
            Are you sure you want to delete this Duty?
          </DialogContentText>
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
          <DutyUpdateForm
            dutyId={duty.id}
            dutyData={{
              id: duty.id,
              status: duty.status,
              type: duty.type,
              service_id: duty.service_id,
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

export default DutyDetailsCard;

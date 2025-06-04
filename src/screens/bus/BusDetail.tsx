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
} from "@mui/material";

import VerifiedIcon from "@mui/icons-material/Verified";
import NewReleasesIcon from "@mui/icons-material/NewReleases";
import BlockIcon from "@mui/icons-material/Block";
import { Delete as DeleteIcon } from "@mui/icons-material";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import { useAppDispatch } from "../../store/Hooks";
import { companyBusDeleteApi } from "../../slices/appSlice";
import localStorageHelper from "../../utils/localStorageHelper";
import BusUpdateForm from "./BusUpdation";
import { showSuccessToast } from "../../common/toastMessageHelper";

interface BusCardProps {
  bus: {
    id: number;
    registrationNumber: string;
    name: string;
    capacity: number;
    model: string;
    manufactured_on: string;
    insurance_upto: string;
    pollution_upto: string;
    fitness_upto: string;
    road_tax_upto: string;
    status: number;
  };
  refreshList: (value: any) => void;
  onUpdate: () => void;
  onDelete: (id: number) => void;
  onBack: () => void;
  canManageCompany: boolean;
  onCloseDetailCard: () => void;
}

const BusDetailsCard: React.FC<BusCardProps> = ({
  bus,
  refreshList,
  onDelete,
  onBack,
  canManageCompany,
  onCloseDetailCard,
}) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [updateFormOpen, setUpdateFormOpen] = useState(false);
  const dispatch = useAppDispatch();
  console.log("bus", bus);

  const formatUTCDateToLocal = (dateString: string | null): string => {
    if (!dateString || dateString.trim() === "") return "Not added yet";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "Not added yet" : date.toLocaleDateString();
  };

  const handleBusDelete = async () => {
    if (!bus.id) {
      console.error("Error: Bus ID is missing");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("id", String(bus.id));
      await dispatch(companyBusDeleteApi(formData)).unwrap();

      setDeleteConfirmOpen(false);
      localStorageHelper.removeStoredItem(`bus_${bus.id}`);
      onDelete(bus.id);
      showSuccessToast("Bus deleted successfully");
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
            <DirectionsBusIcon fontSize="large" />
          </Avatar>
          <Typography variant="h6" sx={{ mt: 1 }}>
            <b>{bus.name}</b>
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <b>Bus ID:</b> {bus.id}
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
              <b>Registration Number:</b> {bus.registrationNumber}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <b>Capacity:</b> {bus.capacity}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <b>Manufactured:</b> {formatUTCDateToLocal(bus.manufactured_on)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <b>Insurance Upto:</b> {formatUTCDateToLocal(bus.insurance_upto)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <b>Pollution Upto:</b> {formatUTCDateToLocal(bus.pollution_upto)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <b>Fitness Upto:</b> {formatUTCDateToLocal(bus.fitness_upto)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <b>Road tax Upto:</b> {formatUTCDateToLocal(bus.road_tax_upto)}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1, gap: 1 }}>
  {bus.status === 1 ? (
    <>
      <VerifiedIcon sx={{ color: "green", fontSize: 30 }} />
      <Typography sx={{ color: "green", fontWeight: "bold" }}>
        Active
      </Typography>
    </>
  ) : bus.status === 2 ? (
    <>
      <NewReleasesIcon sx={{ color: "#FFA500", fontSize: 30 }} />
      <Typography sx={{ color: "#FFA500", fontWeight: "bold" }}>
        Maintenance
      </Typography>
    </>
  ) : (
    <>
      <BlockIcon sx={{ color: "#d93550", fontSize: 30 }} />
      <Typography sx={{ color: "#d93550", fontWeight: "bold" }}>
        Suspended
      </Typography>
    </>
  )}
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
                !canManageCompany
                  ? "You don't have permission, contact the admin"
                  : ""
              }
              arrow
              placement="top-start"
            >
              <span
                style={{
                  cursor: !canManageCompany ? "not-allowed" : "default",
                }}
              >
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={() => setUpdateFormOpen(true)}
                  disabled={!canManageCompany}
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
                !canManageCompany
                  ? "You don't have permission, contact the admin"
                  : ""
              }
              arrow
              placement="top-start"
            >
              <span
                style={{
                  cursor: !canManageCompany ? "not-allowed" : "default",
                }}
              >
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={() => setDeleteConfirmOpen(true)}
                  startIcon={<DeleteIcon />}
                  disabled={!canManageCompany}
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
            <b>Bus Name:</b> {bus.name}, <b>Registration Number:</b>{" "}
            {bus.registrationNumber}
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
          <BusUpdateForm
            busId={bus.id}
            busData={{
              id: bus.id,
              registration_number: bus.registrationNumber,
              name: bus.name,
              capacity: bus.capacity,
              manufactured_on: bus.manufactured_on,
              insurance_upto: bus.insurance_upto,
              pollution_upto: bus.pollution_upto,
              fitness_upto: bus.fitness_upto,
              road_tax_upto: bus.road_tax_upto,
              status: bus.status,
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

export default BusDetailsCard;

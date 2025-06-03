import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Avatar,
  Chip,
  Tooltip,
  Alert,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  Diversity3 as Diversity3Icon,
  ArrowBack as BackIcon,
} from "@mui/icons-material";
import { useAppDispatch } from "../../store/Hooks";
import { RoleDeleteApi } from "../../slices/appSlice";
import localStorageHelper from "../../utils/localStorageHelper";
import RoleUpdateForm from "./RoleUpdate";
import {
  showErrorToast,
  showSuccessToast,
} from "../../common/toastMessageHelper";
interface RoleCardProps {
  role: {
    id: number;
    name: string;
    roleDetails: {
      manage_operator: boolean;
      manage_bus: boolean;
      manage_route: boolean;
      manage_schedule: boolean;
      manage_role: boolean;
      manage_company: boolean;
      manage_fare: boolean;
      manage_duty: boolean;
      manage_service: boolean;
    };
  };
  onBack: () => void;
  onUpdate: (id: number) => void;
  onDelete: (id: number) => void;
  refreshList: (value: any) => void;
  canManageRole: boolean;
  onCloseDetailCard: () => void;
}

const RoleDetailsCard: React.FC<RoleCardProps> = ({
  role,
  onBack,
  onDelete,
  canManageRole,
  onCloseDetailCard,
  refreshList,
}) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [updateFormOpen, setUpdateFormOpen] = useState(false);
  const [acknowledgedWarning, setAcknowledgedWarning] = useState(false);
  const dispatch = useAppDispatch();

  const handleRoleDelete = async () => {
    try {
      const formData = new FormData();
      formData.append("id", String(role.id));
      await dispatch(RoleDeleteApi(formData)).unwrap();
      setDeleteConfirmOpen(false);
      localStorageHelper.removeStoredItem(`account_${role.id}`);
      onDelete(role.id);
      onCloseDetailCard();
      refreshList("refresh");
      showSuccessToast("Role deleted successfully!");
    } catch (error: any) {
      showErrorToast(error);
    }
  };
  return (
    <>
      {/* Role Details Card */}
      <Card
        sx={{ maxWidth: 420, margin: 2, boxShadow: 4, borderRadius: 3, p: 1 }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
            <Diversity3Icon fontSize="large" />
          </Avatar>
          <Typography variant="h6" sx={{ mt: 1, fontWeight: "bold" }}>
            {role.name}
          </Typography>
        </Box>

        {/* Permissions Section */}
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Typography variant="body2" color="textSecondary">
              <b>Role ID:</b> {role.id}
            </Typography>
          </Box>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold" }}>
            Permissions:
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {/* List all permissions */}
            
            <Chip
              label={`Manage Operators: ${
                role.roleDetails.manage_operator ? "Yes" : "No"
              }`}
              color={role.roleDetails.manage_operator ? "success" : "error"}
              variant="outlined"
            />
            <Chip
              label={`Manage Roles: ${
                role.roleDetails.manage_role ? "Yes" : "No"
              }`}
              color={role.roleDetails.manage_role ? "success" : "error"}
              variant="outlined"
            />
            <Chip
              label={`Manage Bus: ${
                role.roleDetails.manage_bus ? "Yes" : "No"
              }`}
              color={role.roleDetails.manage_bus ? "success" : "error"}
              variant="outlined"
            />
            <Chip
              label={`Manage Route: ${
                role.roleDetails.manage_route ? "Yes" : "No"
              }`}
              color={role.roleDetails.manage_route ? "success" : "error"}
              variant="outlined"
            />
            <Chip
              label={`Manage Fare: ${
                role.roleDetails.manage_fare ? "Yes" : "No"
              }`}
              color={role.roleDetails.manage_fare ? "success" : "error"}
              variant="outlined"
            />
            
            <Chip
              label={`Manage Schedule: ${
                role.roleDetails.manage_schedule ? "Yes" : "No"
              }`}
              color={role.roleDetails.manage_schedule ? "success" : "error"}
              variant="outlined"
            />
            
            <Chip
              label={`Manage Company: ${
                role.roleDetails.manage_company ? "Yes" : "No"
              }`}
              color={role.roleDetails.manage_company ? "success" : "error"}
              variant="outlined"
            />
            
            <Chip
              label={`Manage Service: ${
                role.roleDetails.manage_service ? "Yes" : "No"
              }`}
              color={role.roleDetails.manage_service ? "success" : "error"}
              variant="outlined"
            />
            <Chip
              label={`Manage Duty: ${
                role.roleDetails.manage_duty ? "Yes" : "No"
              }`}
              color={role.roleDetails.manage_duty ? "success" : "error"}
              variant="outlined"
            />
          </Box>
        </CardContent>

        {/* Action Buttons */}
        <CardActions sx={{ justifyContent: "space-between", gap: 1 }}>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={onBack}
            startIcon={<BackIcon />}
          >
            Back
          </Button>
          <Tooltip
            title={
              !canManageRole
                ? "You don't have permission, contact the admin"
                : ""
            }
            arrow
            placement="top-start"
          >
            <span
              style={{ cursor: !canManageRole ? "not-allowed" : "default" }}
            >
              <Button
                variant="contained"
                color="success"
                size="small"
                onClick={() => setUpdateFormOpen(true)}
                disabled={!canManageRole}
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
              !canManageRole
                ? "You don't have permission, contact the admin"
                : ""
            }
            arrow
            placement="top-start"
          >
            <span
              style={{ cursor: !canManageRole ? "not-allowed" : "default" }}
            >
              <Button
                variant="contained"
                color="error"
                size="small"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={!canManageRole}
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
        </CardActions>
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setAcknowledgedWarning(false); // Reset when dialog closes
        }}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Warning:</strong> This role might be assigned to executives.
            Deleting it will remove all associated permissions from those
            accounts.
          </Alert>

          <Typography gutterBottom>
            <b>ID:</b> {role.id}, <b>Role Name:</b> {role.name}
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={acknowledgedWarning}
                onChange={(e) => setAcknowledgedWarning(e.target.checked)}
                color="primary"
              />
            }
            label="I understand that deleting this role will affect all executives assigned to it"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteConfirmOpen(false);
              setAcknowledgedWarning(false);
            }}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleRoleDelete}
            color="error"
            disabled={!acknowledgedWarning}
          >
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
          <RoleUpdateForm
            roleId={role.id}
            roleData={role}
            refreshList={(value: any) => refreshList(value)}
            onClose={() => setUpdateFormOpen(false)}
            onCloseDetailCard={onCloseDetailCard}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RoleDetailsCard;

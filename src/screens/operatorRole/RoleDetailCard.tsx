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
  Tooltip,
  Checkbox,
  FormControlLabel,
  Alert,
  Grid,
  useTheme,
  Divider,
} from "@mui/material";
import {
  Diversity3 as RolesIcon,
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Security as PermissionsIcon,
} from "@mui/icons-material";
import { useAppDispatch } from "../../store/Hooks";
import { operatorRoleDeleteApi } from "../../slices/appSlice";
import localStorageHelper from "../../utils/localStorageHelper";
import RoleUpdateForm from "./RoleUpdate";
import {
  showSuccessToast,
  showErrorToast,
} from "../../common/toastMessageHelper";
import { useSelector } from "react-redux";
import { RootState } from "../../store/Store";
interface RoleCardProps {
  role: {
    id: number;
    name: string;
    roleDetails?: {
      manage_token?: boolean;
      update_company?: boolean;
      create_operator?: boolean;
      update_operator?: boolean;
      delete_operator?: boolean;
      create_route?: boolean;
      update_route?: boolean;
      delete_route?: boolean;
      create_bus?: boolean;
      update_bus?: boolean;
      delete_bus?: boolean;
      create_schedule?: boolean;
      update_schedule?: boolean;
      delete_schedule?: boolean;
      create_service?: boolean;
      update_service?: boolean;
      delete_service?: boolean;
      create_fare?: boolean;
      update_fare?: boolean;
      delete_fare?: boolean;
      create_duty?: boolean;
      update_duty?: boolean;
      delete_duty?: boolean;
      create_role?: boolean;
      update_role?: boolean;
      delete_role?: boolean;
    };
  };
  onBack: () => void;
  onUpdate: (id: number) => void;
  onDelete: (id: number) => void;
  refreshList: (value: any) => void;
  handleCloseDetailCard: () => void;
  onCloseDetailCard: () => void;
}

const permissionGroups = [
  {
    groupName: "Token Management",
    permissions: [
      {
        label: "Operator Token ",
        key: "manage_token",
      },
    ],
  },
  {
    groupName: "Company Management",
    permissions: [
     
      {
        label: "Update Company",
        key: "update_company",
      },
    ],
  },
  {
    groupName: "Operator Management",
    permissions: [
      {
        label: "Create",
        key: "create_operator",
      },
      {
        label: "Update",
        key: "update_operator",
      },
      {
        label: "Delete",
        key: "delete_operator",
      },
    ],
  },
  {
    groupName: "Route Management",
    permissions: [
      {
        label: "Create",
        key: "create_route",
      },
      {
        label: "Update",
        key: "update_route",
      },
      {
        label: "Delete",
        key: "delete_route",
      },
    ],
  },
  {
    groupName: "Bus Management",
    permissions: [
      {
        label: "Create",
        key: "create_bus",
      },
      {
        label: "Update",
        key: "update_bus",
      },
      {
        label: "Delete",
        key: "delete_bus",
      },
    ],
  },
  
  {
    groupName: "Schedule Management",
    permissions: [
      {
        label: "Create",
        key: "create_schedule",
      },
      {
        label: "Update",
        key: "update_schedule",
      },
      {
        label: "Delete",
        key: "delete_schedule",
      },
    ],
  },
  {
    groupName: "Service Management",
    permissions: [
      {
        label: "Create",
        key: "create_service",
      },
      {
        label: "Update",
        key: "update_service",
      },
      {
        label: "Delete",
        key: "delete_service",
      },
    ],
  },
  {
    groupName: "Fare Management",
    permissions: [
      {
        label: "Create",
        key: "create_fare",
      },
      {
        label: "Update",
        key: "update_fare",
      },
      {
        label: "Delete",
        key: "delete_fare",
      },
    ],
  },
  {
    groupName: "Duty Management",
    permissions: [
      {
        label: "Create",
        key: "create_duty",
      },
      {
        label: "Update",
        key: "update_duty",
      },
      {
        label: "Delete",
        key: "delete_duty",
      },
    ],
  },
  {
    groupName: "Executive Role Management",
    permissions: [
      {
        label: "Create",
        key: "create_role",
      },
      {
        label: "Update",
        key: "update_role",
      },
      {
        label: "Delete",
        key: "delete_role",
      },
    ],
  },
];

const RoleDetailsCard: React.FC<RoleCardProps> = ({
  role,
  onBack,
  onDelete,
  refreshList,
  handleCloseDetailCard,
  onCloseDetailCard,
}) => {
  const theme = useTheme();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [updateFormOpen, setUpdateFormOpen] = useState(false);
  const [acknowledgedWarning, setAcknowledgedWarning] = useState(false);
  const dispatch = useAppDispatch();

  const canDeleteRole = useSelector((state: RootState) =>
    state.app.permissions.includes("delete_role")
  );

  const canUpdateRole = useSelector((state: RootState) =>
    state.app.permissions.includes("update_role")
  );

  const handleCloseModal = () => {
    setUpdateFormOpen(false);
  };

  const handleRoleDelete = async () => {
    if (!role.id) {
      showErrorToast("Error: role ID is missing");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("id", String(role.id));
      await dispatch(operatorRoleDeleteApi(formData)).unwrap();
      setDeleteConfirmOpen(false);
      localStorageHelper.removeStoredItem(`role_${role.id}`);
      onDelete(role.id);
      handleCloseDetailCard();
      showSuccessToast("Role deleted successfully!");
      refreshList("refresh");
    } catch (error) {
      showErrorToast("Failed to delete role. Please try again.");
    } finally {
      setAcknowledgedWarning(false);
    }
  };

  const getPermissionValue = (key: string) => {
    return role.roleDetails?.[key as keyof typeof role.roleDetails] || false;
  };

  return (
    <>
      <Card
        sx={{ maxWidth: 500, margin: "auto", boxShadow: 3, borderRadius: 2 }}
      >
        <Box sx={{ p: 2, bgcolor: "darkblue", color: "white" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "white", width: 40, height: 40 }}>
              <RolesIcon color="primary" />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {role.name}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
            Role ID: {role.id}
          </Typography>
        </Box>

        {/* Permissions Section */}
        <CardContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 2,
              gap: 1,
              backgroundColor: "rgba(42, 150, 46, 0.1)",
              p: 1,
              borderRadius: 1,
            }}
          >
            <PermissionsIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              Permissions
            </Typography>
          </Box>

          <Divider sx={{ scale: 5, fill: theme.palette.primary.main, mb: 2 }} />

          <Grid container spacing={1}>
            {permissionGroups.map((group) => (
              <React.Fragment key={group.groupName}>
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: "bold",
                      color: theme.palette.text.primary,
                    }}
                  >
                    {group.groupName}:
                  </Typography>
                </Grid>
                {group.permissions.map((permission) => (
                  <Grid item xs={6} sm={4} key={permission.key}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 0.5,
                        borderRadius: 1,
                        bgcolor: getPermissionValue(permission.key)
                          ? "rgba(42, 150, 46, 0.3)"
                          : "rgba(201, 65, 56, 0.3)",
                      }}
                    >
                      <Typography variant="caption" sx={{ flex: 1 }}>
                        {permission.label}
                      </Typography>
                      {getPermissionValue(permission.key) ? (
                        <CheckIcon
                          fontSize="small"
                          sx={{ backgroundColor: "#E8F5E9" }}
                        />
                      ) : (
                        <CloseIcon fontSize="small" color="error" />
                      )}
                    </Box>
                  </Grid>
                ))}
              </React.Fragment>
            ))}
          </Grid>
        </CardContent>

        {/* Action Buttons */}
        <CardActions
          sx={{
            justifyContent: "space-between",
            p: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Button
            variant="outlined"
            size="small"
            onClick={onBack}
            startIcon={<BackIcon />}
            sx={{ minWidth: 100 }}
          >
            Back
          </Button>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip
              title={!canUpdateRole ? "You don't have update permission" : ""}
            >
              <span>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setUpdateFormOpen(true)}
                  disabled={!canUpdateRole}
                  startIcon={<EditIcon />}
                  color="success"
                  sx={{
                    minWidth: 100,
                    "&.Mui-disabled": {
                      backgroundColor: theme.palette.action.disabledBackground,
                    },
                  }}
                >
                  Update
                </Button>
              </span>
            </Tooltip>

            <Tooltip
              title={!canDeleteRole ? "You don't have delete permission" : ""}
            >
              <span>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={!canDeleteRole}
                  startIcon={<DeleteIcon />}
                  sx={{
                    minWidth: 100,
                    "&.Mui-disabled": {
                      backgroundColor: theme.palette.error.light,
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
        <DialogTitle>Confirm Role Deletion</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Warning:</strong> Deleting this role will remove all
            associated permissions from assigned users.
          </Alert>

          <Box sx={{ mb: 2 }}>
            <Typography>
              <strong>Role:</strong> {role.name}
            </Typography>
            <Typography>
              <strong>ID:</strong> {role.id}
            </Typography>
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={acknowledgedWarning}
                onChange={(e) => setAcknowledgedWarning(e.target.checked)}
                color="primary"
              />
            }
            label="I understand the consequences"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleRoleDelete}
            color="error"
            disabled={!acknowledgedWarning}
            variant="contained"
          >
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Form Modal */}
      <Dialog
        open={updateFormOpen}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <RoleUpdateForm
            roleId={role.id}
            roleData={role}
            refreshList={refreshList}
            onClose={handleCloseModal}
            onCloseDetailCard={onCloseDetailCard}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="error">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RoleDetailsCard;

import React from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Divider,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useAppDispatch } from "../../store/Hooks";
import { operatorRoleUpdationApi } from "../../slices/appSlice";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import {
  showSuccessToast,
  showErrorToast,
} from "../../common/toastMessageHelper";
interface RoleUpdateFormProps {
  roleId: number;
  roleData: any;
  refreshList: (value: any) => void;
  onClose: () => void;
  onCloseDetailCard: () => void;
}

const permissionGroups = [
  {
    groupName: "Token Management",
    permissions: [
      { label: "Operator Token", key: "manage_token" },
    ],
  },
  {
    groupName: "Company",
    permissions: [
      { label: "Update", key: "update_company" },
    ],
  },
  {
    groupName: "Operator",
    permissions: [
      { label: "Create", key: "create_operator" },
      { label: "Update", key: "update_operator" },
      { label: "Delete", key: "delete_operator" },
    ],
  },
  {
    groupName: "Route",
    permissions: [
      { label: "Create", key: "create_route" },
      { label: "Update", key: "update_route" },
      { label: "Delete", key: "delete_route" },
    ],
  },
  {
    groupName: "Bus",
    permissions: [
      { label: "Create", key: "create_bus" },
      { label: "Update", key: "update_bus" },
      { label: "Delete", key: "delete_bus" },
    ],
  },
  {
    groupName: "Schedule",
    permissions: [
      { label: "Create", key: "create_schedule" },
      { label: "Update", key: "update_schedule" },
      { label: "Delete", key: "delete_schedule" },
    ],
  },
  {
    groupName: "Service",
    permissions: [
      { label: "Create", key: "create_service" },
      { label: "Update", key: "update_service" },
      { label: "Delete", key: "delete_service" },
    ],
  },
  {
    groupName: "Fare",
    permissions: [
      { label: "Create", key: "create_fare" },
      { label: "Update", key: "update_fare" },
      { label: "Delete", key: "delete_fare" },
    ],
  },
  {
    groupName: "Duty",
    permissions: [
      { label: "Create", key: "create_duty" },
      { label: "Update", key: "update_duty" },
      { label: "Delete", key: "delete_duty" },
    ],
  },
  {
    groupName: "Operator Role",
    permissions: [
      { label: "Create", key: "create_role" },
      { label: "Update", key: "update_role" },
      { label: "Delete", key: "delete_role" },
    ],
  },
];

const RoleUpdateForm: React.FC<RoleUpdateFormProps> = ({
  roleId,
  roleData,
  refreshList,
  onClose,
  onCloseDetailCard,
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = React.useState(false);

  const { handleSubmit, control, reset, 
    register } = useForm({
    defaultValues: {
      name: roleData.name,
      ...roleData.roleDetails,
    },
  });

  React.useEffect(() => {
    reset({
      name: roleData.name,
      ...roleData.roleDetails,
    });
  }, [roleData, reset]);

  const handleRoleUpdate: SubmitHandler<any> = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("id", String(roleId));
      formData.append("name", data.name);

      // Append all permissions to formData
      permissionGroups.forEach((group) => {
        group.permissions.forEach((permission) => {
          formData.append(permission.key, String(data[permission.key]));
        });
      });

      const response = await dispatch(operatorRoleUpdationApi({ roleId, formData: formData})).unwrap();
      if (response?.id) {
        showSuccessToast("Role updated successfully!");
        refreshList("refresh");
        onClose();
        onCloseDetailCard();
      } else {
        showErrorToast("Role update failed. Please try again.");
      }
    } catch (error: any) {
      showErrorToast(error || "Failed to update role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(handleRoleUpdate)}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        width: "100%",
      }}
    >
      <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: "bold" }}>
        Update Role Details
      </Typography>
      <TextField
  label="Role Name"
  size="small"
  fullWidth
  InputLabelProps={{ shrink: true }}
  {...register("name")}
  defaultValue={roleData.name}
/>

      <Divider sx={{ my: 1 }} />

      <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
        Permissions
      </Typography>

      <Box
        sx={{
          maxHeight: "400px",
          overflowY: "auto",
          pr: 1,
          "& .MuiAccordion-root": {
            boxShadow: "none",
            border: `1px solid ${theme.palette.divider}`,
            "&:before": { display: "none" },
          },
        }}
      >
        {permissionGroups.map((group) => (
          <Accordion key={group.groupName} defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon fontSize="small" />}
              sx={{
                minHeight: "40px !important",
                "& .MuiAccordionSummary-content": {
                  my: 0.5,
                },
              }}
            >
              <Typography variant="subtitle2" fontWeight="bold">
                {group.groupName}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, pb: 1 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {group.permissions.map((permission) => (
                  <Controller
                    key={permission.key}
                    name={permission.key}
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            color="primary"
                          />
                        }
                        label={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography variant="body2">
                              {permission.label}
                            </Typography>
                          </Box>
                        }
                        sx={{
                          m: 0,
                          justifyContent: "space-between",
                        }}
                      />
                    )}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
          sx={{ bgcolor: "darkblue" }}
        >
          {loading ? "Updating..." : "Update Role"}
        </Button>
      </Box>
    </Box>
  );
};

export default RoleUpdateForm;
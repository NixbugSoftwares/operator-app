import React, { useState } from "react";
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
import { operatorRoleCreationApi } from "../../slices/appSlice";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import {
  showSuccessToast,
  showErrorToast,
} from "../../common/toastMessageHelper";

type RoleFormValues = {
  name: string;
  companyId: number;
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

interface IRoleCreationFormProps {
  onClose: () => void;
  refreshList: (value: any) => void;
    defaultCompanyId?: number;
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

const RoleCreationForm: React.FC<IRoleCreationFormProps> = ({
  onClose,
  refreshList,
  defaultCompanyId
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const defaultValues = permissionGroups.reduce((acc, group) => {
    group.permissions.forEach((permission) => {
      acc[permission.key as keyof RoleFormValues] = false as any;
    });
    return acc;
  }, {} as Partial<RoleFormValues>);

  defaultValues.name = "";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RoleFormValues>({
    defaultValues: defaultValues as RoleFormValues,
  });

  const handleRoleCreation: SubmitHandler<RoleFormValues> = async (data) => {
    setLoading(true);
    
  console.log("defaultCompanyId", defaultCompanyId);
  
    try {
      const formData = new FormData();
      formData.append("company_id", String(defaultCompanyId));
      formData.append("name", data.name);
      permissionGroups.forEach((group) => {
        group.permissions.forEach((permission) => {
          formData.append(
            permission.key,
            String(data[permission.key as keyof RoleFormValues])
          );
        });
      });

      const response = await dispatch(operatorRoleCreationApi(formData)).unwrap();
      if (response?.id) {
        showSuccessToast("Role created successfully!");
        refreshList("refresh");
        onClose();
      } else {
        showErrorToast("Role creation failed. Please try again.");
      }
    } catch (error: any) {
      showErrorToast(error || "Failed to create role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(handleRoleCreation)}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        width: "100%",
        maxHeight: "70vh",
        overflowY: "auto",
        pr: 1,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Create New Role
      </Typography>

      <TextField
  label="Role Name"
  {...register("name", {
    required: "Role name is required",
    minLength: {
      value: 4,
      message: "Minimum 4 characters required",
    },
    maxLength: {
      value: 32,
      message: "Maximum 32 characters allowed",
    },
  })}
  error={!!errors.name}
  helperText={errors.name?.message}
  variant="outlined"
  size="small"
  fullWidth
  sx={{ mb: 2 }}
/>


      <Divider sx={{ my: 1 }} />

      <Typography variant="subtitle2" gutterBottom>
        Permissions
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 1,
          mb: 2,
        }}
      >
        {permissionGroups.map((group) => (
          <Accordion
            key={group.groupName}
            defaultExpanded={false}
            sx={{
              boxShadow: "none",
              border: `1px solid ${theme.palette.divider}`,
              "&:before": { display: "none" },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon fontSize="small" />}
              sx={{
                minHeight: "40px !important",
                "& .MuiAccordionSummary-content": {
                  my: 0.5,
                },
              }}
            >
              <Typography variant="body2" fontWeight="medium">
                {group.groupName}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, pb: 1 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {group.permissions.map((permission) => (
                  <Controller
                    key={permission.key}
                    name={permission.key as keyof RoleFormValues}
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
                          <Typography variant="caption">
                            {permission.label}
                          </Typography>
                        }
                        sx={{
                          m: 0,
                          justifyContent: "space-between",
                          "& .MuiFormControlLabel-label": {
                            flex: 1,
                          },
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

      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
        <Button
          type="button"
          variant="outlined"
          size="small"
          fullWidth
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          size="small"
          fullWidth
          disabled={loading}
          sx={{ bgcolor: "darkblue" }}
        >
          {loading ? "Creating..." : "Create Role"}
        </Button>
      </Box>
    </Box>
  );
};

export default RoleCreationForm;
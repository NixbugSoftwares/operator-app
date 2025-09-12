import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  useTheme,
  Stack,
  Checkbox,
} from "@mui/material";
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
}

const permissionGroups = [
  {
    groupName: "Account Management",
    permissions: [{ label: "Operator Token", key: "manage_token" }],
  },
  {
    groupName: "Company Management",
    permissions: [{ label: "Update", key: "update_company" }],
  },
  {
    groupName: "Operator Management",
    permissions: [
      { label: "Create", key: "create_operator" },
      { label: "Update", key: "update_operator" },
      { label: "Delete", key: "delete_operator" },
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
  {
    groupName: "Route ",
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
];

const RoleCreationForm: React.FC<IRoleCreationFormProps> = ({
  onClose,
  refreshList,
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
    watch,
    setValue,
    formState: { errors },
  } = useForm<RoleFormValues>({
    defaultValues: defaultValues as RoleFormValues,
  });

  const handleGroupToggle = (groupName: string, checked: boolean) => {
    const group = permissionGroups.find((g) => g.groupName === groupName);
    if (group) {
      group.permissions.forEach((permission) => {
        setValue(permission.key as keyof RoleFormValues, checked);
      });
    }
  };

  // Check if all permissions in a group are selected
  const isGroupAllSelected = (groupName: string) => {
    const group = permissionGroups.find((g) => g.groupName === groupName);
    if (!group) return false;

    return group.permissions.every((permission) =>
      watch(permission.key as keyof RoleFormValues)
    );
  };

  const handleAllPermissionsToggle = (checked: boolean) => {
    permissionGroups.forEach((group) => {
      group.permissions.forEach((permission) => {
        setValue(permission.key as keyof RoleFormValues, checked);
      });
    });
  };

  // helper to check if all permissions are currently selected
  const isAllPermissionsSelected = () => {
    return permissionGroups.every((group) =>
      group.permissions.every((permission) =>
        watch(permission.key as keyof RoleFormValues)
      )
    );
  };

  const handleRoleCreation: SubmitHandler<RoleFormValues> = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name);

      // Append all permissions to formData
      permissionGroups.forEach((group) => {
        group.permissions.forEach((permission) => {
          formData.append(
            permission.key,
            String(data[permission.key as keyof RoleFormValues])
          );
        });
      });

      const response = await dispatch(
        operatorRoleCreationApi(formData)
      ).unwrap();
      if (response?.id) {
        showSuccessToast("Role created successfully!");
        refreshList("refresh");
        onClose();
      } else {
        showErrorToast("Role creation failed. Please try again.");
      }
    } catch (error: any) {
      if ( error.status===409){
              showErrorToast("Role name already exists");
            }else{
            showErrorToast(error.message || "Role creation failed");
            }
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
    gap: 2,
    width: "100%",
    maxHeight: "70vh",
    overflowY: "auto",
    pr: 1,
  }}
>
  <Typography variant="h5" gutterBottom>
    Create New Role
  </Typography>

  <TextField
    label="Role Name"
    {...register("name", {
      required: "Role name is required",
      minLength: {
        value: 3,
        message: "Role name must be at least 3 characters",
      },
      maxLength: {
        value: 32,
        message: "Role name cannot exceed 32 characters",
      },
      validate: {
        noEmptyString: (value) =>
          value.trim().length > 0 || "Role name cannot be empty or just spaces",
        noStartOrEndSpace: (value) =>
          /^\S.*\S$|^\S$/.test(value) || "Cannot start or end with space",
        noConsecutiveSpaces: (value) =>
          !/ {2,}/.test(value) || "Cannot contain consecutive spaces",
      },
    })}
    error={!!errors.name}
    helperText={errors.name?.message}
    variant="outlined"
    size="small"
    fullWidth
  />

  <Divider />
  <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
    <Typography variant="h6" gutterBottom>
      Permissions
    </Typography>
    <FormControlLabel
      control={
        <Checkbox
          size="small"
          checked={isAllPermissionsSelected()}
          indeterminate={
            !isAllPermissionsSelected() &&
            permissionGroups.some((group) =>
              group.permissions.some((permission) =>
                watch(permission.key as keyof RoleFormValues)
              )
            )
          }
          onChange={(e) => handleAllPermissionsToggle(e.target.checked)}
        />
      }
      label="Select All"
      labelPlacement="start"
      sx={{ m: 0, mb: 1 }}
    />
  </Box>

  {/* Responsive grid */}
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: {
        xs: "1fr", // 1 column on mobile
        sm: "repeat(2, 1fr)", // 2 columns on tablet+
      },
      gap: 2,
    }}
  >
    {permissionGroups.map((group) => (
      <Box
        key={group.groupName}
        sx={{
          p: 2,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="medium">
            {group.groupName}
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={isGroupAllSelected(group.groupName)}
                indeterminate={
                  !isGroupAllSelected(group.groupName) &&
                  group.permissions.some((permission) =>
                    watch(permission.key as keyof RoleFormValues)
                  )
                }
                onChange={(e) =>
                  handleGroupToggle(group.groupName, e.target.checked)
                }
              />
            }
            label=""
            labelPlacement="start"
            sx={{ m: 0 }}
          />
        </Box>

        <Stack spacing={1}>
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
                    <Typography variant="body2">{permission.label}</Typography>
                  }
                  labelPlacement="start"
                  sx={{
                    m: 0,
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                />
              )}
            />
          ))}
        </Stack>
      </Box>
    ))}
  </Box>

  <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
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

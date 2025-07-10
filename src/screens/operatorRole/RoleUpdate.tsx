import React, { useState  } from "react";
import { TextField, Button, Box, Typography, Switch, CircularProgress } from "@mui/material";
import { useAppDispatch } from "../../store/Hooks";
import { operatorRoleUpdationApi } from "../../slices/appSlice"; 
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { showErrorToast, showSuccessToast } from "../../common/toastMessageHelper";

type RoleFormValues = {
  id: number; 
  name: string;
  manage_operator: boolean;
  manage_role: boolean;
  manage_bus: boolean;
  manage_route: boolean;
  manage_fare: boolean;
  manage_schedule: boolean;
  manage_company: boolean;
  manage_service: boolean;
  manage_duty: boolean;
};

interface IRoleUpdateFormProps {
  roleId: number; 
  roleData: any;
  onClose: () => void; 
  refreshList: (value: any) => void; 
  onCloseDetailCard: () => void
}

const RoleUpdateForm: React.FC<IRoleUpdateFormProps> = ({
  roleData,
  onClose,
  refreshList,
  roleId,
  onCloseDetailCard
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RoleFormValues>({
     defaultValues: {
      name: roleData.name,
      manage_operator:  roleData.roleDetails?.manage_operator,
      manage_role: roleData.roleDetails?.manage_role,
      manage_bus: roleData.roleDetails?.manage_bus,
      manage_route:  roleData.roleDetails?.manage_route,
      manage_fare:  roleData.roleDetails?.manage_fare,
      manage_schedule:  roleData.roleDetails?.manage_schedule,
      manage_company:  roleData.roleDetails?.manage_company,
      manage_service: roleData.roleDetails?.manage_service,
      manage_duty:  roleData.roleDetails?.manage_duty,
    }
  });

  const handleRoleUpdate: SubmitHandler<RoleFormValues> = async (data) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("id", roleId.toString()); 
      formData.append("name", data.name);
      formData.append("manage_operator", String(data.manage_operator));
      formData.append("manage_role", String(data.manage_role));
      formData.append("manage_bus", String(data.manage_bus));
      formData.append("manage_route", String(data.manage_route));
      formData.append("manage_fare", String(data.manage_fare));
      formData.append("manage_schedule", String(data.manage_schedule));
      formData.append("manage_company", String(data.manage_company));
      formData.append("manage_service", String(data.manage_service));
      formData.append("manage_duty", String(data.manage_duty));
      
      await dispatch(operatorRoleUpdationApi({ roleId, formData })).unwrap();
      
      showSuccessToast("Role updated successfully!");
      refreshList("refresh");
      onCloseDetailCard();
      onClose();
    } catch (error: any) {
      console.error("Update error:", error);
      showErrorToast(error || "Failed to update role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleRoleUpdate)}>
      <Typography variant="h5" align="center" gutterBottom>
        Update Role
      </Typography>

      <TextField
        label="Role Name"
        {...register("name", { required: "Role name is required" })}
        error={!!errors.name}
        helperText={errors.name?.message}
        variant="outlined"
        size="small"
        fullWidth
      />

      {([
        "manage_operator",
        "manage_role",
        "manage_bus",
        "manage_route",
        "manage_fare",
        "manage_schedule",
        "manage_company",
        "manage_service",
        "manage_duty"
      ] as (keyof RoleFormValues)[]).map((field) => (
        <Box key={field} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography>{field.replace("manage", "Manage ")}</Typography>
          <Controller
            name={field}
            control={control}
            render={({ field: { value, onChange } }) => (
              <Switch checked={!!value} onChange={(e) => onChange(e.target.checked)} color="success" />
            )}
          />
        </Box>
      ))}

      <Button type="submit" variant="contained" sx={{ bgcolor: "darkblue" }} fullWidth disabled={loading}>
        {loading ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Update Role"}
      </Button>
    </Box>
  );
};
export default RoleUpdateForm;
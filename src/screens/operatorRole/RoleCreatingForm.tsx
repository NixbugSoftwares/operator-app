import React, { useState } from "react";
import { TextField, Button, Box, Typography, Switch } from "@mui/material";
import { useAppDispatch } from "../../store/Hooks";
import { operatorRoleCreationApi,  } from "../../slices/appSlice";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { operatorRoleCreationSchema } from "../auth/validations/authValidation";
import { showErrorToast, showSuccessToast } from "../../common/toastMessageHelper";

type RoleFormValues = {
  name: string;
  manage_operator: boolean;
  manage_role: boolean;
  manage_bus: boolean;
  manage_route: boolean;
  manage_fare: boolean;
  manage_schedule: boolean;
  manage_company: boolean;
  manage_service: boolean;
  manage_duty: boolean
};

interface IRoleCreationFormProps {
  onClose: () => void;
  refreshList: (value: any) => void;
}

const RoleCreationForm: React.FC<IRoleCreationFormProps> = ({ onClose, refreshList,  }) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: yupResolver(operatorRoleCreationSchema), 
    defaultValues: {
      name: "",
      manage_operator: false,
      manage_role: false,
      manage_bus: false,
      manage_route: false,
      manage_fare: false,
      manage_schedule: false,
      manage_company: false,
      manage_service: false,
      manage_duty: false

    },
  });

  const handleRoleCreation: SubmitHandler<RoleFormValues> = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
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
      console.log("formData<><><><><><><>", formData);
      
      const response = await dispatch(operatorRoleCreationApi(formData)).unwrap();
      if (response?.id) {
        showSuccessToast("Role created successfully!");
        refreshList("refresh");
        onClose();
      } else {
        showErrorToast("Role creation failed. Please try again.");
      }
    } catch (error) {
      console.error("Error creating role:", error);
      showErrorToast("Failed to create role. Please try again.");
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
        width: 500,
        margin: "auto",
        mt: 10,
        p: 3,
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Typography variant="h5" align="center" gutterBottom>
        Create Role
      </Typography>

      

      <TextField
        label="Role Name"
        {...register("name")}
        error={!!errors.name}
        helperText={errors.name?.message}
        variant="outlined"
        size="small"
      />

      {/* Permission Toggles */}
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

      <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
        {loading ? "Creating..." : "Create Role"}
      </Button>
    </Box>
  );
};

export default RoleCreationForm;
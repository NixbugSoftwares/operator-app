import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Container,
  CssBaseline,
  MenuItem,
} from "@mui/material";
import { useAppDispatch } from "../../store/Hooks";
import { companyBusUpdateApi } from "../../slices/appSlice";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import {
  showErrorToast,
  showSuccessToast,
} from "../../common/toastMessageHelper";
type BusFormValues = {
  id: number;
  registration_number: string;
  name: string;
  capacity: number;
  status: number;
  manufactured_on: string;
  insurance_upto?: string;
  pollution_upto?: string;
  fitness_upto?: string;
  road_tax_upto?: string;
};

interface IOperatorUpdateFormProps {
  busId: number;
  busData: BusFormValues;
  onClose: () => void;
  refreshList: (value: any) => void;
  onCloseDetailCard(): void;
}

const statusOptions = [
  { label: "Active", value: 1 },
  { label: "Maintenance", value: 2 },
  { label: "Suspended", value: 3 },
];

const extractDateOnly = (dateString?: string): string => {
  if (!dateString || dateString === "-") return "";
  try {
    return new Date(dateString).toISOString().slice(0, 10);
  } catch {
    return "";
  }
};
const BusUpdateForm: React.FC<IOperatorUpdateFormProps> = ({
  onClose,
  refreshList,
  busId,
  busData,
  onCloseDetailCard,
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BusFormValues>();

  console.log("busData+++++++++++===>", busData);

  // Handle bus update
  const handleBusUpdate: SubmitHandler<BusFormValues> = async (data) => {
    try {
      setLoading(true);
      const formatDateToUTC = (dateString: string | undefined): string => {
        return dateString ? new Date(dateString).toISOString() : "";
      };
      const formData = new FormData();
      formData.append("id", busId.toString());
      formData.append("registration_number", data.registration_number);
      formData.append("name", data.name);
      formData.append("capacity", data.capacity.toString());
      if (data.manufactured_on)
        formData.append(
          "manufactured_on",
          formatDateToUTC(data.manufactured_on)
        );
      if (data.insurance_upto)
        formData.append("insurance_upto", formatDateToUTC(data.insurance_upto));
      if (data.pollution_upto)
        formData.append("pollution_upto", formatDateToUTC(data.pollution_upto));
      if (data.fitness_upto)
        formData.append("fitness_upto", formatDateToUTC(data.fitness_upto));
      if (data.road_tax_upto)
        formData.append("road_tax_upto", formatDateToUTC(data.road_tax_upto));
      formData.append("status", data.status.toString());
      console.log("FormData being sent:", {
        id: busId,
        registration_number: data.registration_number,
        name: data.name,
        capacity: data.capacity,
        manufactured_on: formatDateToUTC(data.manufactured_on),
        insurance_upto: formatDateToUTC(data.insurance_upto),
        pollution_upto: formatDateToUTC(data.pollution_upto),
        fitness_upto: formatDateToUTC(data.fitness_upto),
        status: data.status,
      });

      await dispatch(companyBusUpdateApi({ busId, formData })).unwrap();

      showSuccessToast("Bus updated successfully!");
      onCloseDetailCard();
      refreshList("refresh");
      onClose();
    } catch (error: any) {
      console.error("Error updating bus:", error);
      showErrorToast(error.message || "Failed to update bus. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Update Bus
        </Typography>
        <Box
          component="form"
          noValidate
          sx={{ mt: 1 }}
          onSubmit={handleSubmit(handleBusUpdate)}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            defaultValue={busData.registration_number}
            label="Registration Number"
            {...register("registration_number")}
            error={!!errors.registration_number}
            helperText={errors.registration_number?.message}
            size="small"
            InputProps={{ readOnly: true }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            defaultValue={busData.name}
            label="Bus Name"
            {...register("name", {
              required: "Bus name is required",
              validate: (value) => {
                if (value.trim() === "") return "Bus name is required";
                if (/^\s|\s$/.test(value))
                  return "No leading or trailing spaces allowed";
                if (/\s{2,}/.test(value))
                  return "Consecutive spaces are not allowed";
                return true;
              },
            })}
            error={!!errors.name}
            helperText={errors.name?.message}
            size="small"
          />

          <TextField
            margin="normal"
            required
            type="number"
            fullWidth
            defaultValue={busData.capacity}
            label="Capacity"
            {...register("capacity", {
              required: "Capacity is required",
              validate: (value) => {
                if (isNaN(value)) return "Capacity must be a number";
                return true;
              },
            })}
            error={!!errors.capacity}
            helperText={errors.capacity?.message}
            size="small"
            inputProps={{ min: 1 }} // blocks negative via stepper
  onKeyDown={(e) => {
    if (e.key === "-" || e.key === "e" || e.key === "E") {
      e.preventDefault(); // block minus and scientific notation
    }
  }}
          />

          <Controller
            name="status"
            control={control}
            defaultValue={busData.status}
            render={({ field }) => (
              <TextField
                margin="normal"
                fullWidth
                select
                label="Status"
                {...field}
                error={!!errors.status}
                size="small"
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <TextField
  margin="normal"
  required
  fullWidth
  label="Manufactured On"
  type="date"
  defaultValue={extractDateOnly(busData.manufactured_on)}
  InputLabelProps={{ shrink: true }}
  {...register("manufactured_on")}
  error={!!errors.manufactured_on}
  helperText={errors.manufactured_on?.message}
  size="small"
  inputProps={{
    max: new Date().toISOString().split("T")[0],
  }}
  onInput={(e) => {
    const target = e.target as HTMLInputElement;
    // Prevent typing more than 4 digits in year
    if (target.value.length > 10) {
      target.value = target.value.slice(0, 10);
    }
  }}
/>
<TextField
  margin="normal"
  fullWidth
  label="Insurance Upto"
  type="date"
  defaultValue={extractDateOnly(busData.insurance_upto)}
  InputLabelProps={{ shrink: true }}
  {...register("insurance_upto")}
  error={!!errors.insurance_upto}
  helperText={errors.insurance_upto?.message}
  size="small"
  inputProps={{
    min: new Date().toISOString().split("T")[0],
  }}
  onInput={(e) => {
    const target = e.target as HTMLInputElement;
    // Prevent typing more than 4 digits in year
    if (target.value.length > 10) {
      target.value = target.value.slice(0, 10);
    }
  }}
/>
<TextField
  margin="normal"
  fullWidth
  label="Pollution Upto"
  type="date"
  defaultValue={extractDateOnly(busData.pollution_upto)}
  InputLabelProps={{ shrink: true }}
  {...register("pollution_upto")}
  error={!!errors.pollution_upto}
  helperText={errors.pollution_upto?.message}
  size="small"
  inputProps={{
    min: new Date().toISOString().split("T")[0],
  }}
  onInput={(e) => {
    const target = e.target as HTMLInputElement;
    // Prevent typing more than 4 digits in year
    if (target.value.length > 10) {
      target.value = target.value.slice(0, 10);
    }
  }}
/>
<TextField
  margin="normal"
  fullWidth
  label="Fitness Upto"
  type="date"
  defaultValue={extractDateOnly(busData.fitness_upto)}
  InputLabelProps={{ shrink: true }}
  {...register("fitness_upto")}
  error={!!errors.fitness_upto}
  helperText={errors.fitness_upto?.message}
  size="small"
  inputProps={{
    min: new Date().toISOString().split("T")[0],
  }}
  onInput={(e) => {
    const target = e.target as HTMLInputElement;
    // Prevent typing more than 4 digits in year
    if (target.value.length > 10) {
      target.value = target.value.slice(0, 10);
    }
  }}
/>
<TextField
  margin="normal"
  fullWidth
  label=" Road Tax Upto"
  type="date"
  defaultValue={extractDateOnly(busData.road_tax_upto)}
  InputLabelProps={{ shrink: true }}
  {...register("road_tax_upto")}
  error={!!errors.road_tax_upto}
  helperText={errors.road_tax_upto?.message}
  size="small"
  inputProps={{
    min: new Date().toISOString().split("T")[0],
  }}
  onInput={(e) => {
    const target = e.target as HTMLInputElement;
    // Prevent typing more than 4 digits in year
    if (target.value.length > 10) {
      target.value = target.value.slice(0, 10);
    }
  }}
/>
          <Button
            type="submit"
            fullWidth
            color="primary"
            variant="contained"
            sx={{ mt: 3, mb: 2, bgcolor: "darkblue" }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : (
              "Update Bus"
            )}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default BusUpdateForm;

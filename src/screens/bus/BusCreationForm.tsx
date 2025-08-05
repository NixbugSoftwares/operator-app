import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  CssBaseline,
  CircularProgress,
} from "@mui/material";
import { useAppDispatch } from "../../store/Hooks";
import { companyBusCreateApi } from "../../slices/appSlice";
import {
  showErrorToast,
  showSuccessToast,
} from "../../common/toastMessageHelper";

interface IAccountFormInputs {
  registration_number: string;
  name: string;
  capacity: number;
  manufactured_on: string;
  insurance_upto?: string;
  pollution_upto?: string;
  fitness_upto?: string;
  road_tax_upto?: string;
}

interface IOperatorCreationFormProps {
  onClose: () => void;
  refreshList: (value: any) => void;
}

const BusCreationForm: React.FC<IOperatorCreationFormProps> = ({
  onClose,
  refreshList,
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IAccountFormInputs>();

  const handleAccountCreation: SubmitHandler<IAccountFormInputs> = async (
    data
  ) => {
    try {
      setLoading(true);

      const formatDateToUTC = (dateString?: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString();
      };

      const formData = new FormData();
      formData.append("registration_number", data.registration_number);
      formData.append("name", data.name);
      formData.append("capacity", data.capacity.toString());
      formData.append("manufactured_on", formatDateToUTC(data.manufactured_on));

      // Append optional dates only if they exist
      if (data.insurance_upto)
        formData.append("insurance_upto", formatDateToUTC(data.insurance_upto));
      if (data.pollution_upto)
        formData.append("pollution_upto", formatDateToUTC(data.pollution_upto));
      if (data.fitness_upto)
        formData.append("fitness_upto", formatDateToUTC(data.fitness_upto));
      if (data.road_tax_upto)
        formData.append("road_tax_upto", formatDateToUTC(data.road_tax_upto));

      const response = await dispatch(companyBusCreateApi(formData)).unwrap();
      if (response?.id) {
        showSuccessToast("Bus created successfully!");
        refreshList("refresh");
        onClose();
      }
    } catch (error: any) {
      showErrorToast(
        error?.message || "Bus creation failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Bus Creation
        </Typography>

        <Box
          component="form"
          noValidate
          sx={{ mt: 1, width: "100%" }}
          onSubmit={handleSubmit(handleAccountCreation)}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            label="Registration Number"
            error={!!errors.registration_number}
            helperText={errors.registration_number?.message}
            size="small"
            {...register("registration_number", {
              required: "Registration number is required",
              pattern: {
                value: /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{1,4}$/,
                message: "Format: e.g., KA01AB1234",
              },
              maxLength: {
                value: 16,
                message: "Max 16 characters",
              },
            })}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            label="Bus Name"
            error={!!errors.name}
            helperText={errors.name?.message}
            size="small"
            {...register("name", {
              required: "Bus name is required",
              minLength: {
                value: 4,
                message: "Minimum 4 characters",
              },
              maxLength: {
                value: 32,
                message: "Maximum 32 characters",
              },
            })}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            label="Capacity"
            type="number"
            error={!!errors.capacity}
            helperText={errors.capacity?.message}
            size="small"
            {...register("capacity", {
              required: "Capacity is required",
              min: {
                value: 1,
                message: "Minimum capacity is 1",
              },
              max: {
                value: 120,
                message: "Maximum capacity is 120",
              },
              valueAsNumber: true,
            })}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            label="Manufactured On"
            type="date"
            InputLabelProps={{ shrink: true }}
            error={!!errors.manufactured_on}
            helperText={errors.manufactured_on?.message}
            size="small"
            {...register("manufactured_on", {
              required: "Manufacture date is required",
              validate: (value) => {
                const date = new Date(value);
                return date <= new Date() || "Date cannot be in the future";
              },
            })}
          />

          {[
            "insurance_upto",
            "pollution_upto",
            "fitness_upto",
            "road_tax_upto",
          ].map((field) => (
            <TextField
              key={field}
              margin="normal"
              fullWidth
              label={field
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
              type="date"
              InputLabelProps={{ shrink: true }}
              error={!!errors[field as keyof typeof errors]}
              helperText={errors[field as keyof typeof errors]?.message}
              size="small"
              {...register(field as keyof IAccountFormInputs, {
                validate: (value) => {
                  if (!value) return true;
                  const date = new Date(value);
                  return date >= new Date() || "Date must be in the future";
                },
              })}
            />
          ))}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              mb: 2,
              bgcolor: "darkblue",
              "&:hover": { bgcolor: "darkblue" },
            }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : (
              "Create Bus"
            )}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default BusCreationForm;

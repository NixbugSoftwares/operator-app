import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { busCreationSchema } from "../auth/validations/authValidation";
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
import { Bus } from "../../types/type";

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
  } = useForm<Bus>({
    resolver: yupResolver(busCreationSchema),
  });

  const handleAccountCreation: SubmitHandler<Bus> = async (data) => {
    try {
      setLoading(true);
      const formatDateToUTC = (dateString: string | null): string | null => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toISOString();
      };
      console.log("formData>>>>>>>>>>", data);
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("registration_number", data.registrationNumber);
      formData.append("capacity", data.capacity.toString());
      formData.append(
        "manufactured_on",
        formatDateToUTC(data.manufactured_on) || ""
      );
      if (data.insurance_upto)
        formData.append(
          "insurance_upto",
          formatDateToUTC(data.insurance_upto) || ""
        );
      if (data.pollution_upto)
        formData.append(
          "pollution_upto",
          formatDateToUTC(data.pollution_upto) || ""
        );
      if (data.fitness_upto)
        formData.append(
          "fitness_upto",
          formatDateToUTC(data.fitness_upto) || ""
        );
      if (data.road_tax_upto)
        formData.append(
          "road_tax_upto",
          formatDateToUTC(data.road_tax_upto) || ""
        );

      const response = await dispatch(companyBusCreateApi(formData)).unwrap();
      console.log("response64563463434", response);

      if (response?.id) {
        showSuccessToast("Bus created successfully!");
        refreshList("refresh");
        onClose();
      } else {
        showErrorToast("Bus creation failed. Please try again.");
      }
    } catch (error) {
      showErrorToast("Something went wrong. Please try again.");
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
          sx={{ mt: 1 }}
          onSubmit={handleSubmit(handleAccountCreation)}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            label="Registration Number"
            {...register("registrationNumber")}
            error={!!errors.registrationNumber}
            helperText={errors.registrationNumber?.message}
            size="small"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Bus Name"
            {...register("name")}
            error={!!errors.name}
            helperText={errors.name?.message}
            size="small"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Capacity"
            type="number"
            {...register("capacity")}
            error={!!errors.capacity}
            helperText={errors.capacity?.message}
            size="small"
          />

          <TextField
            margin="normal"
            required
            fullWidth
            label="Manufactured On"
            type="date"
            InputLabelProps={{ shrink: true }}
            {...register("manufactured_on")}
            error={!!errors.manufactured_on}
            helperText={errors.manufactured_on?.message}
            size="small"
          />
          <TextField
            margin="normal"
            fullWidth
            label="Insurance Upto"
            type="date"
            InputLabelProps={{ shrink: true }}
            {...register("insurance_upto")}
            error={!!errors.insurance_upto}
            helperText={errors.insurance_upto?.message}
            size="small"
          />
          <TextField
            margin="normal"
            fullWidth
            label="Pollution Upto"
            type="date"
            InputLabelProps={{ shrink: true }}
            {...register("pollution_upto")}
            error={!!errors.pollution_upto}
            helperText={errors.pollution_upto?.message}
            size="small"
          />
          <TextField
            margin="normal"
            fullWidth
            label="Fitness Upto"
            type="date"
            InputLabelProps={{ shrink: true }}
            {...register("fitness_upto")}
            error={!!errors.fitness_upto}
            helperText={errors.fitness_upto?.message}
            size="small"
          />
          <TextField
            margin="normal"
            fullWidth
            label="Road Tax Upto"
            type="date"
            InputLabelProps={{ shrink: true }}
            {...register("road_tax_upto")}
            error={!!errors.road_tax_upto}
            helperText={errors.road_tax_upto?.message}
            size="small"
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
              "Create Bus"
            )}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default BusCreationForm;

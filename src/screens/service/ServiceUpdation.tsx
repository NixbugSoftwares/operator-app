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
import { serviceupdationApi } from "../../slices/appSlice";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import {
  showErrorToast,
  showSuccessToast,
} from "../../common/toastMessageHelper";

type ServiceFormValues = {
  id: number;
  name: string;
  status: string;
  ticket_mode: string;
  remarks: string;
};

interface IOperatorUpdateFormProps {
  serviceId: number;
  serviceData: ServiceFormValues;
  onClose: () => void;
  refreshList: (value: any) => void;
  onCloseDetailCard(): void;
}

const statusOptions = [
  { label: "Created", value: 1 },
  { label: "Started", value: 2 },
  { label: "Terminated", value: 3 },
  { label: "Ended", value: 4 },
  { label: "Audited", value: 5 },
];

const ticketModeOptions = [
  { label: "Hybrid", value: 1 },
  { label: "Digital", value: 2 },
  { label: "Conventional", value: 3 },
];

const INTERNAL_STATUS = {
  STARTED: 2,
  AUDITED: 5,
};

const allowedTransitions: Record<number, number[]> = {
  1: [], // Created
  2: [3, 4], // Started → Terminated, Ended
  3: [2],    // Terminated → Started
  4: [2],    // Ended → Started
};

const getStatusValue = (label: string) =>
  statusOptions.find((opt) => opt.label.toLowerCase() === label.toLowerCase())?.value ?? 1;

const getTicketModeValue = (label: string) =>
  ticketModeOptions.find((opt) => opt.label.toLowerCase() === label.toLowerCase())?.value ?? 1;

const ServiceUpdateForm: React.FC<IOperatorUpdateFormProps> = ({
  onClose,
  refreshList,
  serviceData,
  onCloseDetailCard,
  serviceId,
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const statusValue = getStatusValue(serviceData.status);
  const ticketModeValue = getTicketModeValue(serviceData.ticket_mode);

  const [currentStatus, setCurrentStatus] = useState(statusValue);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ServiceFormValues>();

  const isValidTransition = (current: number, next: number): boolean => {
    if (current === next) return true;
    return allowedTransitions[current]?.includes(next) ?? false;
  };

  const handleServiceUpdate: SubmitHandler<ServiceFormValues> = async (data) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("id", serviceId.toString());
      formData.append("status", parseInt(data.status).toString());
      formData.append("ticket_mode", parseInt(data.ticket_mode).toString());
      if (data.remarks) formData.append("remark", data.remarks);

      await dispatch(serviceupdationApi({ serviceId, formData })).unwrap();

      showSuccessToast("Service updated successfully!");
      onCloseDetailCard();
      refreshList("refresh");
      onClose();
    } catch (error: any) {
      console.error("Error updating service:", error);
      showErrorToast(error || "Failed to update service. Please try again.");
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
          Update Service
        </Typography>
        <Box
          component="form"
          noValidate
          sx={{ mt: 1 }}
          onSubmit={handleSubmit(handleServiceUpdate)}
        >
          <TextField
            margin="normal"
            fullWidth
            disabled
            defaultValue={serviceData.name}
            label="Service Name"
            size="small"
          />

          <Controller
            name="status"
            control={control}
            defaultValue={statusValue.toString()}
            render={({ field }) => (
              <TextField
                select
                fullWidth
                label="Status"
                value={field.value}
                onChange={(e) => {
                  const newStatus = parseInt(e.target.value, 10);
                  if (isValidTransition(currentStatus, newStatus)) {
                    field.onChange(e);
                    setCurrentStatus(newStatus);
                  } else {
                    showErrorToast(
                      `Invalid status transition from ${
                        statusOptions.find((opt) => opt.value === currentStatus)?.label ||
                        (currentStatus === INTERNAL_STATUS.STARTED ? "Started" : "Audited")
                      } to ${
                        statusOptions.find((opt) => opt.value === newStatus)?.label
                      }`
                    );
                  }
                }}
                error={!!errors.status}
                size="small"
              >
                {statusOptions.map((option) => {
                  const isDisabled =
                    !isValidTransition(currentStatus, option.value) &&
                    option.value !== currentStatus;

                  return (
                    <MenuItem
                      key={option.value}
                      value={option.value}
                      disabled={isDisabled}
                    >
                      {option.label}
                      {isDisabled && (
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          sx={{ ml: 1 }}
                        >
                          (Invalid transition)
                        </Typography>
                      )}
                    </MenuItem>
                  );
                })}
              </TextField>
            )}
          />

          <Controller
            name="ticket_mode"
            control={control}
            defaultValue={ticketModeValue.toString()}
            render={({ field }) => (
              <TextField
                margin="normal"
                fullWidth
                select
                label="Ticket Mode"
                {...field}
                error={!!errors.ticket_mode}
                size="small"
              >
                {ticketModeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

            <TextField
              margin="normal"
              fullWidth
              multiline
              rows={4}
              defaultValue={serviceData.remarks}
              label="Remark"
              {...register("remarks")}
              error={!!errors.remarks}
              helperText={errors.remarks?.message}
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
              "Update Service"
            )}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ServiceUpdateForm;

import React, { useState, useEffect } from "react";
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
import { dutyupdationApi } from "../../slices/appSlice";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import {
  showErrorToast,
  showSuccessToast,
} from "../../common/toastMessageHelper";
import { RootState } from "../../store/Store";
import { useSelector } from "react-redux";

type DutyFormValues = {
  id: number;
  status: number;
};

interface IOperatorUpdateFormProps {
  dutyId: number;
  dutyData: {
    id: number;
    status: string;
    type: string;
  };
  onClose: () => void;
  refreshList: (value: any) => void;
  onCloseDetailCard(): void;
}

const statusOptions = [
  { label: "Assigned", value: 1 },
  { label: "Started", value: 2 },
  { label: "Terminated", value: 3 },
  { label: "Ended", value: 4 },
  { label: "Discarded", value: 5 },
];

const allowedTransitions: Record<number, number[]> = {
  1: [],
  2: [3],
  3: [2],
  4: [2],
};

const DutyUpdateForm: React.FC<IOperatorUpdateFormProps> = ({
  onClose,
  refreshList,
  dutyId,
  onCloseDetailCard,
  dutyData,
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<number>(2);
  const canUpdateService = useSelector((state: RootState) =>
    state.app.permissions.includes("update_service")
  );
  const getInitialStatusValue = (statusLabel: string): number => {
    const option = statusOptions.find((opt) => opt.label === statusLabel);
    return option ? option.value : 2;
  };

  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<DutyFormValues>({
    defaultValues: {
      id: dutyData.id,
      status: getInitialStatusValue(dutyData.status),
     
    },
  });
  console.log("Initial form values:", {
    id: dutyData.id,
    status: getInitialStatusValue(dutyData.status),
  });

  // Load data
  useEffect(() => {
    const initialStatus = getInitialStatusValue(dutyData.status);
    setCurrentStatus(initialStatus);
    setValue("status", initialStatus);
  }, [dutyData, setValue]);

  const isValidTransition = (current: number, next: number): boolean => {
    if (current === next) return true;
    return allowedTransitions[current]?.includes(next) ?? false;
  };

  const handleDutyUpdate: SubmitHandler<DutyFormValues> = async (data) => {
    try {
      setLoading(true);
      console.log("Data to be updated:", data);

      const formData = new FormData();
      formData.append("id", dutyId.toString());
      formData.append("status", data.status.toString());
      await dispatch(dutyupdationApi({ dutyId, formData })).unwrap();

      showSuccessToast("Duty updated successfully!");
      onCloseDetailCard();
      refreshList("refresh");
      onClose();
    } catch (error: any) {
      console.error("Error updating duty:", error);
      showErrorToast(
        error.message || "Failed to update duty. Please try again."
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
          Update Duty
        </Typography>
        <Box
          component="form"
          noValidate
          sx={{
            mt: 1,
            width: "100%",
            maxWidth: 800,
            margin: "0 auto",
          }}
          onSubmit={handleSubmit(handleDutyUpdate)}
        >
          {canUpdateService && (
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={field.value}
                  onChange={(e) => {
                    const newStatus = parseInt(e.target.value, 10);
                    if (isValidTransition(currentStatus, newStatus)) {
                      field.onChange(newStatus);
                      setCurrentStatus(newStatus);
                    } else {
                      showErrorToast(
                        `Invalid status transition from ${
                          statusOptions.find(
                            (opt) => opt.value === currentStatus
                          )?.label
                        } to ${
                          statusOptions.find((opt) => opt.value === newStatus)
                            ?.label
                        }`
                      );
                    }
                  }}
                  error={!!errors.status}
                  size="small"
                  margin="normal"
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
          )}

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
              "Update Duty"
            )}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default DutyUpdateForm;

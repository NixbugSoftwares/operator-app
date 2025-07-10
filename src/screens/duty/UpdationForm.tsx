import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Container,
  CssBaseline,
  MenuItem,
  Autocomplete,
} from "@mui/material";
import { useAppDispatch } from "../../store/Hooks";
import { dutyupdationApi, serviceListingApi } from "../../slices/appSlice";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import {
  showErrorToast,
  showSuccessToast,
} from "../../common/toastMessageHelper";

type DutyFormValues = {
  id: number;
  status: number;
  type: number;
  service_id: number | null;
};

interface IOperatorUpdateFormProps {
  dutyId: number;
  dutyData: {
    id: number;
    status: string;
    type: string;
    service_id: number;
  };
  onClose: () => void;
  refreshList: (value: any) => void;
  onCloseDetailCard(): void;
}

const statusOptions = [
  { label: "Assigned", value: 1 },
  { label: "Started", value: 2 },
  { label: "Terminated", value: 3 },
  { label: "Finished", value: 4 },
];

const typeModeOptions = [
  { label: "Driver", value: 1 },
  { label: "Conductor", value: 2 },
  { label: "Kili", value: 3 },
  { label: "Other", value: 4 },
];

const allowedTransitions: Record<number, number[]> = {
  1: [2, 3],
  2: [3, 4],
  3: [],
  4: [],
};

interface DropdownItem {
  id: number;
  name: string;
}

const DutyUpdateForm: React.FC<IOperatorUpdateFormProps> = ({
  onClose,
  refreshList,
  dutyId,
  onCloseDetailCard,
  dutyData,
}) => {
  console.log("DutyUpdateForm props:", { dutyId, dutyData });

  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<number>(2);
  const rowsPerPage = 10;
  const [dropdownData, setDropdownData] = useState({
    serviceList: [] as DropdownItem[],
  });
  const [hasMore, setHasMore] = useState({ service: true });
  const [_selectedService, setSelectedService] = useState<DropdownItem | null>(
    null
  );
  const [searchText, _setSearchText] = useState("");

  const getInitialStatusValue = (statusLabel: string): number => {
    const option = statusOptions.find((opt) => opt.label === statusLabel);
    return option ? option.value : 2;
  };

  const getInitialTypeValue = (typeLabel: string): number => {
    const option = typeModeOptions.find((opt) => opt.label === typeLabel);
    return option ? option.value : 4;
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
      type: getInitialTypeValue(dutyData.type),
      service_id: dutyData.service_id,
    },
  });
  console.log("Initial form values:", {
    id: dutyData.id,
    status: getInitialStatusValue(dutyData.status),
    type: getInitialTypeValue(dutyData.type),
    service_id: dutyData.service_id,
  });

  useEffect(() => {
    const initialStatus = getInitialStatusValue(dutyData.status);
    setCurrentStatus(initialStatus);
    setValue("status", initialStatus);
    setValue("type", getInitialTypeValue(dutyData.type));
    setValue("service_id", dutyData.service_id);

    // Fetch initial service list
    fetchServiceList(0);
  }, [dutyData]);

  const isValidTransition = (current: number, next: number): boolean => {
    if (current === next) return true;
    return allowedTransitions[current]?.includes(next) ?? false;
  };
  const isFirstLoad = useRef(true);

  const fetchServiceList = useCallback(
    (pageNumber: number, searchText = "") => {
      setLoading(true);
      const offset = pageNumber * rowsPerPage;
      dispatch(
        serviceListingApi({
          limit: rowsPerPage,
          offset,
          name: searchText,
          status_list: [1, 2],
        })
      )
        .unwrap()
        .then((res) => {
          const items = res.data || [];
          const formattedList = items.map((item: any) => ({
            id: item.id,
            name: item.name ?? "-",
          }));

          setDropdownData((prev) => ({
            ...prev,
            serviceList:
              pageNumber === 0
                ? formattedList
                : [...prev.serviceList, ...formattedList],
          }));

          setHasMore((prev) => ({
            ...prev,
            service: items.length === rowsPerPage,
          }));

          if (pageNumber === 0 && dutyData.service_id && isFirstLoad.current) {
            const foundService = formattedList.find(
              (item: DropdownItem) => item.id === dutyData.service_id
            );
            if (foundService) {
              setSelectedService(foundService);
            }
            isFirstLoad.current = false;
          }
        })
        .catch((error) => {
          showErrorToast(error || "Failed to fetch Service list");
        })
        .finally(() => setLoading(false));
    },
    [dispatch, dutyData.service_id]
  );

  const handleScroll = (
    event: React.UIEvent<HTMLUListElement>,
    _type: string
  ) => {
    const listboxNode = event.currentTarget;
    if (
      listboxNode.scrollTop + listboxNode.clientHeight ===
        listboxNode.scrollHeight &&
      hasMore.service
    ) {
      const nextPage = Math.floor(
        dropdownData.serviceList.length / rowsPerPage
      );
      fetchServiceList(nextPage, searchText);
    }
  };

  const handleDutyUpdate: SubmitHandler<DutyFormValues> = async (data) => {
    try {
      setLoading(true);
      console.log("Data to be updated:", data);

      const formData = new FormData();
      formData.append("id", dutyId.toString());
      formData.append("status", data.status.toString());
      formData.append("type", data.type.toString());
      if (data.service_id) {
        formData.append("service_id", data.service_id.toString());
      }

      await dispatch(dutyupdationApi({ dutyId, formData })).unwrap();

      showSuccessToast("Duty updated successfully!");
      onCloseDetailCard();
      refreshList("refresh");
      onClose();
    } catch (error: any) {
      console.error("Error updating duty:", error);
      showErrorToast(error || "Failed to update duty. Please try again.");
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
                        statusOptions.find((opt) => opt.value === currentStatus)
                          ?.label
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

          <Controller
            name="service_id"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={dropdownData.serviceList}
                getOptionLabel={(option) => option.name}
                value={
                  dropdownData.serviceList.find(
                    (item) => item.id === field.value
                  ) || null
                }
                onChange={(_, newValue) => field.onChange(newValue?.id || null)}
                onInputChange={(_, newInputValue) =>
                  fetchServiceList(0, newInputValue)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Service"
                    error={!!errors.service_id}
                    helperText={errors.service_id?.message}
                    fullWidth
                    margin="normal"
                  />
                )}
                ListboxProps={{
                  onScroll: (event) => handleScroll(event, "service"),
                  style: { maxHeight: 200, overflow: "auto" },
                }}
                loading={loading}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                clearOnBlur={false}
                clearOnEscape
              />
            )}
          />

          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <TextField
                select
                fullWidth
                label="Type"
                value={field.value}
                onChange={field.onChange}
                error={!!errors.type}
                size="small"
                margin="normal"
              >
                {typeModeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
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
              "Update Duty"
            )}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default DutyUpdateForm;

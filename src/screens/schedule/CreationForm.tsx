import React, { useCallback, useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  CssBaseline,
  CircularProgress,
  MenuItem,
  Autocomplete,
} from "@mui/material";
import { useAppDispatch } from "../../store/Hooks";
import {
  scheduleCreationApi,
  busRouteListApi,
  fareListingApi,
  companyBusListApi,
} from "../../slices/appSlice";
import {
  showErrorToast,
  showSuccessToast,
} from "../../common/toastMessageHelper";
import { Schedule } from "../../types/type";

interface IOperatorCreationFormProps {
  onClose: () => void;
  refreshList: (value: any) => void;
}

const ticketModeOptions = [
  { label: "Hybrid", value: 1 },
  { label: "Digital", value: 2 },
  { label: "Conventional", value: 3 },
];

const triggerOptions = [
  { label: "Automatic", value: 1 },
  { label: "Manual", value: 2 },
  { label: "Disabled", value: 3 },
];

const days = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 7 },
];

interface DropdownItem {
  id: number;
  name: string;
}

const ScheduleCreationForm: React.FC<IOperatorCreationFormProps> = ({
  onClose,
  refreshList,
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [dropdownData, setDropdownData] = useState({
    busList: [] as DropdownItem[],
    routeList: [] as DropdownItem[],
    fareList: [] as DropdownItem[],
  });
  const [searchParams, setSearchParams] = useState({
    bus: "",
    route: "",
    fare: "",
  });
  const [page, setPage] = useState({
    bus: 0,
    route: 0,
    fare: 0,
  });
  const [hasMore, setHasMore] = useState({
    bus: true,
    route: true,
    fare: true,
  });

  const rowsPerPage = 10;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Schedule>({
    defaultValues: {
      ticket_mode: 1,
      trigger_mode: 1,
      frequency: [],
    },
  });

  const fetchBusList = useCallback(
    (pageNumber: number, searchText = "") => {
      setLoading(true);
      const offset = pageNumber * rowsPerPage;
      dispatch(
        companyBusListApi({
          limit: rowsPerPage,
          offset,
          name: searchText,
        })
      )
        .unwrap()
        .then((res) => {
          const items = res.data || [];
          const formattedBusList = items.map((bus: any) => ({
            id: bus.id,
            name: bus.name ?? "-",
          }));
          setDropdownData((prev) => ({
            ...prev,
            busList:
              pageNumber === 0
                ? formattedBusList
                : [...prev.busList, ...formattedBusList],
          }));
        })
        .catch((error) => {
          showErrorToast(error.message || "Failed to fetch Bus list");
        })
        .finally(() => setLoading(false));
    },
    [dispatch]
  );

  const fetchFareList = useCallback(
    (pageNumber: number, searchText = "") => {
      setLoading(true);
      const offset = pageNumber * rowsPerPage;
      dispatch(
        fareListingApi({
          limit: rowsPerPage,
          offset,
          name: searchText,
        })
      )
        .unwrap()
        .then((res) => {
          const items = res.data || [];
          const formattedFareList = items.map((fare: any) => ({
            id: fare.id,
            name: fare.name ?? "-",
          }));
          setDropdownData((prev) => ({
            ...prev,
            fareList:
              pageNumber === 0
                ? formattedFareList
                : [...prev.fareList, ...formattedFareList],
          }));
        })
        .catch((error) => {
          showErrorToast(error.message || "Failed to fetch Fare list");
        })
        .finally(() => setLoading(false));
    },
    [dispatch]
  );

  const fetchRouteList = useCallback(
    (pageNumber: number, searchText = "") => {
      setLoading(true);
      const offset = pageNumber * rowsPerPage;
      dispatch(
        busRouteListApi({
          limit: rowsPerPage,
          offset,
          name: searchText,
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
            routeList:
              pageNumber === 0
                ? formattedList
                : [...prev.routeList, ...formattedList],
          }));
          setHasMore((prev) => ({
            ...prev,
            route: items.length === rowsPerPage,
          }));
        })
        .catch((error) => {
          showErrorToast(error.message || "Failed to fetch Route list");
        })
        .finally(() => setLoading(false));
    },
    [dispatch]
  );

  useEffect(() => {
    fetchBusList(0);
    fetchFareList(0);
    fetchRouteList(0);
  }, [fetchBusList, fetchFareList, fetchRouteList]);

  const handleAccountCreation: SubmitHandler<Schedule> = async (data) => {
    try {
      setLoading(true);

      const scheduleForm = {
        name: data.name,
        route_id: data.route_id,
        bus_id: data.bus_id,
        fare_id: data.fare_id,
        permit_no: data.permit_no,
        ticket_mode: data.ticket_mode,
        trigger_mode: data.trigger_mode,
        frequency: data.frequency,
      };

      const response = await dispatch(
        scheduleCreationApi(scheduleForm)
      ).unwrap();

      if (response?.id) {
        showSuccessToast("Service created successfully!");
        refreshList("refresh");
        onClose();
      } else {
        showErrorToast("Service creation failed. Please try again.");
      }
    } catch (error) {
      showErrorToast("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (
    event: React.UIEvent<HTMLElement>,
    type: "bus" | "route" | "fare"
  ) => {
    const element = event.currentTarget;
    if (
      element.scrollHeight - element.scrollTop === element.clientHeight &&
      hasMore[type]
    ) {
      const newPage = page[type] + 1;
      setPage((prev) => ({ ...prev, [type]: newPage }));

      switch (type) {
        case "bus":
          fetchBusList(newPage, searchParams.bus);
          break;
        case "route":
          fetchRouteList(newPage, searchParams.route);
          break;
        case "fare":
          fetchFareList(newPage, searchParams.fare);
          break;
      }
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
          Service Creation
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
            label="Schedule Name"
            {...register("name", { required: "Service name is required" })}
            error={!!errors.name}
            helperText={errors.name?.message}
            size="small"
          />
          <TextField
            margin="normal"
            fullWidth
            label="Permit No"
            {...register("permit_no", {
              required: "Permit number is required",
            })}
            error={!!errors.permit_no}
            helperText={errors.permit_no?.message}
            size="small"
            required
          />

          <Controller
            name="route_id"
            control={control}
            rules={{ required: "Route is required" }}
            render={({ field }) => (
              <Autocomplete
                options={dropdownData.routeList}
                getOptionLabel={(option) => option.name}
                value={
                  dropdownData.routeList.find(
                    (item) => item.id === field.value
                  ) || null
                }
                onChange={(_, newValue) => field.onChange(newValue?.id)}
                onInputChange={(_, newInputValue) => {
                  setSearchParams((prev) => ({
                    ...prev,
                    route: newInputValue,
                  }));
                  setPage((prev) => ({ ...prev, route: 0 }));
                  fetchRouteList(0, newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Route"
                    margin="normal"
                    error={!!errors.route_id}
                    helperText={errors.route_id?.message}
                    required
                    InputProps={{
                      ...params.InputProps,
                    }}
                  />
                )}
                ListboxProps={{
                  onScroll: (event) => handleScroll(event, "route"),
                  style: { maxHeight: 200, overflow: "auto" },
                }}
              />
            )}
          />

          <Controller
            name="bus_id"
            control={control}
            rules={{ required: "Bus is required" }}
            render={({ field }) => (
              <Autocomplete
                options={dropdownData.busList}
                getOptionLabel={(option) => option.name}
                value={
                  dropdownData.busList.find(
                    (item) => item.id === field.value
                  ) || null
                }
                onChange={(_, newValue) => field.onChange(newValue?.id)}
                onInputChange={(_, newInputValue) => {
                  setSearchParams((prev) => ({ ...prev, bus: newInputValue }));
                  fetchBusList(0, newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Bus"
                    margin="normal"
                    error={!!errors.bus_id}
                    helperText={errors.bus_id?.message}
                    required
                    InputProps={{
                      ...params.InputProps,
                    }}
                  />
                )}
                ListboxProps={{
                  onScroll: (event) => handleScroll(event, "bus"),
                  style: { maxHeight: 200, overflow: "auto" },
                }}
              />
            )}
          />

          <Controller
            name="fare_id"
            control={control}
            rules={{ required: "Fare is required" }}
            render={({ field }) => (
              <Autocomplete
                options={dropdownData.fareList}
                getOptionLabel={(option) => option.name}
                value={
                  dropdownData.fareList.find(
                    (item) => item.id === field.value
                  ) || null
                }
                onChange={(_, newValue) => field.onChange(newValue?.id)}
                onInputChange={(_, newInputValue) => {
                  setSearchParams((prev) => ({ ...prev, fare: newInputValue }));
                  fetchFareList(0, newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Fare"
                    margin="normal"
                    error={!!errors.fare_id}
                    helperText={errors.fare_id?.message}
                    required
                    InputProps={{
                      ...params.InputProps,
                    }}
                  />
                )}
                ListboxProps={{
                  onScroll: (event) => handleScroll(event, "fare"),
                  style: { maxHeight: 200, overflow: "auto" },
                }}
              />
            )}
          />
          <Controller
            name="frequency"
            control={control}
            render={({ field }) => (
              <Autocomplete
                multiple
                options={days}
                getOptionLabel={(option) => option.label}
                value={days.filter((day) => field.value?.includes(day.value))}
                onChange={(_, newValue) => {
                  field.onChange(newValue.map((day) => day.value));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Days"
                    margin="normal"
                    error={!!errors.frequency}
                    helperText={errors.frequency?.message}
                  />
                )}
              />
            )}
          />

          <Controller
            name="ticket_mode"
            control={control}
            render={({ field }) => (
              <TextField
                margin="normal"
                fullWidth
                select
                label="Ticket Mode"
                {...field}
                error={!!errors.ticket_mode}
                helperText={errors.ticket_mode?.message}
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

          <Controller
            name="trigger_mode"
            control={control}
            render={({ field }) => (
              <TextField
                margin="normal"
                fullWidth
                select
                label="Trigger Mode"
                {...field}
                error={!!errors.trigger_mode}
                helperText={errors.trigger_mode?.message}
                size="small"
              >
                {triggerOptions.map((option) => (
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
              "Create Service"
            )}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ScheduleCreationForm;

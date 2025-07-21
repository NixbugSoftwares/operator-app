import React, { useCallback, useEffect, useState, useMemo } from "react";
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
  Alert,
} from "@mui/material";
import { useAppDispatch } from "../../store/Hooks";
import {
  serviceCreationApi,
  busRouteListApi,
  fareListApi,
  companyBusListApi,
} from "../../slices/appSlice";
import {
  showErrorToast,
  showSuccessToast,
} from "../../common/toastMessageHelper";
import { Service } from "../../types/type";

interface IOperatorCreationFormProps {
  onClose: () => void;
  refreshList: (value: any) => void;
}

const ticketModeOptions = [
  { label: "Hybrid", value: 1 },
  { label: "Digital", value: 2 },
  { label: "Conventional", value: 3 },
];

interface DropdownItem {
  id: number;
  name: string;
}

const ServiceCreationForm: React.FC<IOperatorCreationFormProps> = ({
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
  } = useForm<Service>({
    defaultValues: {
      ticket_mode: "1",
      created_mode: "1",
      starting_at: new Date().toISOString().split("T")[0], 
    },
  });

  // Memoize dropdown lists to prevent unnecessary re-renders
  const memoizedBusList = useMemo(
    () => dropdownData.busList,
    [dropdownData.busList]
  );
  const memoizedRouteList = useMemo(
    () => dropdownData.routeList,
    [dropdownData.routeList]
  );
  const memoizedFareList = useMemo(
    () => dropdownData.fareList,
    [dropdownData.fareList]
  );

  const fetchBusList = useCallback(
    (pageNumber: number, searchText = "") => {
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
          setHasMore((prev) => ({
            ...prev,
            bus: items.length === rowsPerPage,
          }));
        })
        .catch((error) => {
          showErrorToast(error.message || "Failed to fetch Bus list");
        });
    },
    [dispatch ]
  );

  const fetchFareList = useCallback(
  async (pageNumber: number, searchText = "") => {
    setLoading(true);
    const offset = pageNumber * rowsPerPage;
    try {
      const res = await dispatch(
        fareListApi({
          limit: rowsPerPage,
          offset,
          name: searchText,
        })
      ).unwrap();

      const fares = res.data || [];
      
      const formattedFareList = fares.map((fare: any) => ({
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
    } catch (error: any) {
      showErrorToast(error?.message || "Failed to fetch Fare list");
    } finally {
      setLoading(false);
    }
  },
  [dispatch,  rowsPerPage]
);

  const fetchRouteList = useCallback(
    (pageNumber: number, searchText = "") => {
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
        .catch((error: any) => {
          showErrorToast(error || "Failed to fetch Route list");
        });
    },
    [dispatch]
  );

  useEffect(() => {
    fetchBusList(0);
    fetchFareList(0);
    fetchRouteList(0);
  }, [fetchBusList, fetchFareList, fetchRouteList]);

  const handleServiceCreation: SubmitHandler<Service> = async (data) => {
    try {
      setLoading(true);
      const formatDateToUTC = (dateString: string | null): string | null => {
        if (!dateString) return null;
        const date = new Date(dateString);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const day = String(date.getUTCDate()).padStart(2, "0");
        return `${year}-${month}-${day}`; // "YYYY-MM-DD"
      };

      const formData = new FormData();
      formData.append("route", data.route_id.toString());
      formData.append("bus_id", data.bus_id.toString());
      formData.append("fare", data.fare_id.toString());
      formData.append("starting_at", formatDateToUTC(data.starting_at) || "");

      formData.append("ticket_mode", data.ticket_mode.toString());

      const response = await dispatch(serviceCreationApi(formData)).unwrap();

      if (response?.id) {
        showSuccessToast("Service created successfully!");
        refreshList("refresh");
        onClose();
      } else {
        showErrorToast("Service creation failed. Please try again.");
      }
    } catch (error: any) {
      showErrorToast(error || "Something went wrong. Please try again.");
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
  const today = new Date().toISOString().split("T")[0];

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
        <Box mb={2}>
          <Alert severity="info">
            For a new service, the starting date must be today or the next day.
          </Alert>
        </Box>
        <Box
          component="form"
          noValidate
          sx={{ mt: 1 }}
          onSubmit={handleSubmit(handleServiceCreation)}
        >
          <Controller
            name="route_id"
            control={control}
            rules={{ required: "Route is required" }}
            render={({ field }) => (
              <Autocomplete
                options={memoizedRouteList}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={
                  memoizedRouteList.find((item) => item.id === field.value) ||
                  null
                }
                onChange={(_, newValue) => {
                  field.onChange(newValue?.id);
                }}
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
                options={memoizedBusList}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={
                  memoizedBusList.find((item) => item.id === field.value) ||
                  null
                }
                onChange={(_, newValue) => {
                  field.onChange(newValue?.id);
                }}
                onInputChange={(_, newInputValue) => {
                  setSearchParams((prev) => ({ ...prev, bus: newInputValue }));
                  setPage((prev) => ({ ...prev, bus: 0 }));
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
                options={memoizedFareList}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={
                  memoizedFareList.find((item) => item.id === field.value) ||
                  null
                }
                onChange={(_, newValue) => {
                  field.onChange(newValue?.id);
                }}
                onInputChange={(_, newInputValue) => {
                  setSearchParams((prev) => ({ ...prev, fare: newInputValue }));
                  setPage((prev) => ({ ...prev, fare: 0 }));
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
                  />
                )}
                ListboxProps={{
                  onScroll: (event) => handleScroll(event, "fare"),
                  style: { maxHeight: 200, overflow: "auto" },
                }}
              />
            )}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            label="Starting Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            {...register("starting_at", {
              required: "Starting date is required",
              validate: (value) => {
                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return (
                  selectedDate >= today || "Date must be today or in the future"
                );
              },
            })}
            error={!!errors.starting_at}
            helperText={errors.starting_at?.message}
            size="small"
            inputProps={{
              min: today,
            }}
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

export default ServiceCreationForm;

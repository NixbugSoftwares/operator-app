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
  serviceCreationApi,
  busRouteListApi,
  fareListingApi,
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

const createdModeOptions = [
  { label: "Manual", value: 1 },
  { label: "Automatic", value: 2 },
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

  const handleAccountCreation: SubmitHandler<Service> = async (data) => {
    try {
      setLoading(true);
      const formatDateToUTC = (dateString: string | null): string | null => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toISOString();
      };

      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("route_id", data.route_id.toString());
      formData.append("bus_id", data.bus_id.toString());
      formData.append("fare_id", data.fare_id.toString());
      formData.append(
        "starting_date",
        formatDateToUTC(data.starting_date) || ""
      );
      formData.append("ticket_mode", data.ticket_mode.toString());
      formData.append("created_mode", data.created_mode.toString());

      const response = await dispatch(serviceCreationApi(formData)).unwrap();

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
            label="Service Name"
            {...register("name", { required: "Service name is required" })}
            error={!!errors.name}
            helperText={errors.name?.message}
            size="small"
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

          <TextField
            margin="normal"
            required
            fullWidth
            label="Starting Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            {...register("starting_date", {
              required: "Starting date is required",
            })}
            error={!!errors.starting_date}
            helperText={errors.starting_date?.message}
            size="small"
            inputProps={{
              max: "9999-12-31",
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

          <Controller
            name="created_mode"
            control={control}
            render={({ field }) => (
              <TextField
                margin="normal"
                fullWidth
                select
                label="Created Mode"
                {...field}
                error={!!errors.created_mode}
                helperText={errors.created_mode?.message}
                size="small"
              >
                {createdModeOptions.map((option) => (
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

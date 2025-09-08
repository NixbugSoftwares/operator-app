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
  start_time?: string;
  formattedTime?: string;
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

  // Time dropdown states
  const [selectedHour, setSelectedHour] = useState<number>(12);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [selectedAmPm, setSelectedAmPm] = useState<"AM" | "PM">("AM");

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

  const memoizedBusList = useMemo(() => dropdownData.busList, [dropdownData.busList]);
  const memoizedRouteList = useMemo(() => dropdownData.routeList, [dropdownData.routeList]);
  const memoizedFareList = useMemo(() => dropdownData.fareList, [dropdownData.fareList]);

  const fetchBusList = useCallback(
    (pageNumber: number, searchText = "") => {
      const offset = pageNumber * rowsPerPage;
      dispatch(
        companyBusListApi({
          limit: rowsPerPage,
          offset,
          name: searchText,
          status: 1,
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
            busList: pageNumber === 0 ? formattedBusList : [...prev.busList, ...formattedBusList],
          }));
          setHasMore((prev) => ({ ...prev, bus: items.length === rowsPerPage }));
        })
        .catch((error) => {
          showErrorToast(error.message || "Failed to fetch Bus list");
        });
    },
    [dispatch]
  );

  const fetchFareList = useCallback(
    async (pageNumber: number, searchText = "") => {
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
          fareList: pageNumber === 0 ? formattedFareList : [...prev.fareList, ...formattedFareList],
        }));
      } catch (error: any) {
        showErrorToast(error.message || "Failed to fetch Fare list");
      }
    },
    [dispatch, rowsPerPage]
  );

  const convertUtcToIstTimeInput = (utcTime: string): string => {
    if (!utcTime) return "";
    const normalized = utcTime.endsWith("Z") ? utcTime : `${utcTime}Z`;
    const utcDate = new Date(`1970-01-01T${normalized}`);
    return utcDate
      .toLocaleTimeString("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
  };

  const fetchRouteList = useCallback(
    (pageNumber: number, searchText = "") => {
      const offset = pageNumber * rowsPerPage;
      dispatch(
        busRouteListApi({
          limit: rowsPerPage,
          offset,
          name: searchText,
          status: 1,
        })
      )
        .unwrap()
        .then((res) => {
          const items = res.data || [];
          const formattedList = items.map((item: any) => ({
            id: item.id,
            name: item.name ?? "-",
            start_time: item.start_time,
            formattedTime: item.start_time ? convertUtcToIstTimeInput(item.start_time) : "",
          }));

          setDropdownData((prev) => ({
            ...prev,
            routeList: pageNumber === 0 ? formattedList : [...prev.routeList, ...formattedList],
          }));
          setHasMore((prev) => ({ ...prev, route: items.length === rowsPerPage }));
        })
        .catch((error: any) => {
          showErrorToast(error.message || "Failed to fetch Route list");
        });
    },
    [dispatch]
  );

  useEffect(() => {
    fetchBusList(0);
    fetchFareList(0);
    fetchRouteList(0);
  }, [fetchBusList, fetchFareList, fetchRouteList]);

  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

  const combineDateAndIstTimeToUtcIso = (dateStr: string): string => {
    if (!dateStr) throw new Error("Missing date");
    let hour = selectedHour % 12; // convert 12 to 0
    if (selectedAmPm === "PM") hour += 12;
    const [y, m, d] = dateStr.split("-").map((v) => parseInt(v, 10));

    const utcMs = Date.UTC(y, m - 1, d, hour, selectedMinute) - IST_OFFSET_MS;
    return new Date(utcMs).toISOString();
  };

  const handleServiceCreation: SubmitHandler<Service> = async (data) => {
    try {
      setLoading(true);

      if (!data.route_id) {
        showErrorToast("Please select a route");
        setLoading(false);
        return;
      }

      let datetimeIso: string;
      try {
        datetimeIso = combineDateAndIstTimeToUtcIso(data.starting_at!);
      } catch {
        showErrorToast("Invalid date or time");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("route", data.route_id.toString());
      formData.append("bus_id", data.bus_id.toString());
      formData.append("fare", data.fare_id.toString());
      formData.append("starting_at", datetimeIso);
      formData.append("ticket_mode", data.ticket_mode.toString());

      const response = await dispatch(serviceCreationApi(formData)).unwrap();
      if (response?.id) {
        showSuccessToast("Service created successfully!");
        refreshList("refresh");
        onClose();
      } else {
        showErrorToast("Service creation failed");
      }
    } catch (error: any) {
      showErrorToast(error.message || "Something went wrong");
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

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const todayStr = today.toISOString().split("T")[0];
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  // Update dropdowns when route changes
  const updateTimeDropdowns = (formattedTime: string) => {
    if (!formattedTime) return;
    const [time, meridiem] = formattedTime.split(" ");
    const [h, m] = time.split(":").map(Number);
    setSelectedHour(h);
    setSelectedMinute(m);
    setSelectedAmPm(meridiem as "AM" | "PM");
  };

 return (
  <Container component="main" maxWidth="sm">
    <CssBaseline />
    <Box
      sx={{
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
        {/* ROUTE */}
        <Controller
          name="route_id"
          control={control}
          rules={{ required: "Route is required" }}
          render={({ field }) => (
            <Autocomplete
              options={memoizedRouteList}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={memoizedRouteList.find((item) => item.id === field.value) || null}
              onChange={(_, newValue) => {
                field.onChange(newValue?.id);
                if (newValue?.formattedTime) {
                  updateTimeDropdowns(newValue.formattedTime);
                }
              }}
              onInputChange={(_, newInputValue) => {
                setSearchParams((prev) => ({ ...prev, route: newInputValue }));
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

        {/* BUS */}
        <Controller
          name="bus_id"
          control={control}
          rules={{ required: "Bus is required" }}
          render={({ field }) => (
            <Autocomplete
              options={memoizedBusList}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={memoizedBusList.find((item) => item.id === field.value) || null}
              onChange={(_, newValue) => field.onChange(newValue?.id)}
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

        {/* FARE */}
        <Controller
          name="fare_id"
          control={control}
          rules={{ required: "Fare is required" }}
          render={({ field }) => {
            const selectedFare =
              memoizedFareList.find((item) => item.id === field.value) ||
              (field.value ? { id: field.value, name: "Selected Fare" } : null);

            return (
              <Autocomplete
                options={memoizedFareList}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={selectedFare}
                onChange={(_, newValue) => field.onChange(newValue?.id)}
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
            );
          }}
        />

        {/* DATE AND TIME - Responsive layout */}
        <Box sx={{ mt: 2 }}>
          {/* DATE FIELD - Full width on mobile, part of row on desktop */}
          <TextField
            required
            fullWidth
            label="Starting Date"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            {...register("starting_at", { required: "Starting date is required" })}
            error={!!errors.starting_at}
            helperText={errors.starting_at?.message}
            inputProps={{ min: todayStr, max: tomorrowStr }}
            sx={{ 
              mb: { xs: 1, sm: 0 },
              display: { xs: 'block', sm: 'none' } // Show only on mobile as full width
            }}
          />
          
          {/* CONTAINER FOR DATE AND TIME FIELDS */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1 
          }}>
            {/* DATE FIELD - For desktop view */}
            <TextField
              required
              label="Starting Date"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              {...register("starting_at", { required: "Starting date is required" })}
              error={!!errors.starting_at}
              helperText={errors.starting_at?.message}
              inputProps={{ min: todayStr, max: tomorrowStr }}
              sx={{ 
                flex: 2,
                display: { xs: 'none', sm: 'block' } // Hide on mobile, show on desktop
              }}
            />

            {/* TIME FIELDS - Always in a row but full width on mobile */}
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              width: { xs: '100%', sm: 'auto' }
            }}>
              {/* HOUR */}
              <TextField
                select
                size="small"
                label="Hour"
                value={selectedHour}
                onChange={(e) => setSelectedHour(Number(e.target.value))}
                sx={{ flex: 1 }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                  <MenuItem key={h} value={h}>
                    {h}
                  </MenuItem>
                ))}
              </TextField>

              {/* MINUTE */}
              <TextField
                select
                size="small"
                label="Minute"
                value={selectedMinute}
                onChange={(e) => setSelectedMinute(Number(e.target.value))}
                sx={{ flex: 1 }}
              >
                {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                  <MenuItem key={m} value={m}>
                    {m.toString().padStart(2, "0")}
                  </MenuItem>
                ))}
              </TextField>

              {/* AM/PM */}
              <TextField
                select
                size="small"
                label="AM/PM"
                value={selectedAmPm}
                onChange={(e) => setSelectedAmPm(e.target.value as "AM" | "PM")}
                sx={{ flex: 1 }}
              >
                <MenuItem value="AM">AM</MenuItem>
                <MenuItem value="PM">PM</MenuItem>
              </TextField>
            </Box>
          </Box>
        </Box>

        {/* TICKET MODE */}
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
          {loading ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Create Service"}
        </Button>
      </Box>
    </Box>
  </Container>
);
};

export default ServiceCreationForm;

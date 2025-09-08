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
  Checkbox,
} from "@mui/material";
import { useAppDispatch } from "../../store/Hooks";
import {
  scheduleCreationApi,
  busRouteListApi,
  fareListApi,
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
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Schedule>({
    defaultValues: {
      ticketing_mode: 1,
      triggering_mode: 1,
      frequency: [],
    },
  });

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
          status:1
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
        .catch((error: any) => {
          showErrorToast(error.message || "Failed to fetch Bus list");
        });
    },
    [dispatch ]
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
          fareList:
            pageNumber === 0
              ? formattedFareList
              : [...prev.fareList, ...formattedFareList],
        }));
      } catch (error: any) {
        showErrorToast(error.message || "Failed to fetch Fare list");
      }
    },
    [dispatch, rowsPerPage ]
  );

  const fetchRouteList = useCallback(
    (pageNumber: number, searchText = "") => {
      const offset = pageNumber * rowsPerPage;
      dispatch(
        busRouteListApi({
          limit: rowsPerPage,
          offset,
          name: searchText,
          status:1
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

  const handleAccountCreation: SubmitHandler<Schedule> = async (data) => {
    try {
      setLoading(true);

      const scheduleForm = {
        name: data.name,
        route_id: data.route_id,
        bus_id: data.bus_id,
        fare_id: data.fare_id,
        ticketing_mode: data.ticketing_mode,
        triggering_mode: data.triggering_mode,
        frequency: data.frequency,
      };

      const response = await dispatch(
        scheduleCreationApi(scheduleForm)
      ).unwrap();

      if (response?.id) {
        showSuccessToast("Schedule created successfully!");
        refreshList("refresh");
        onClose();
      } else {
        showErrorToast("Schedule creation failed. Please try again.");
      }
    } catch (error: any) {
      showErrorToast(
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLElement>, type: "bus" | "route" | "fare") => {
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
    },
    [fetchBusList, fetchRouteList, fetchFareList, hasMore, page, searchParams]
  );

  const renderAutocomplete = (
    name: keyof Schedule,
    label: string,
    options: DropdownItem[],
    type: "bus" | "route" | "fare"
  ) => (
    <Controller
      name={name}
      control={control}
      rules={{ required: `${label} is required` }}
      render={({ field }) => (
        <Autocomplete
          options={options}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          value={options.find((item) => item.id === field.value) || null}
          onChange={(_, newValue) => field.onChange(newValue?.id)}
          onInputChange={(_, newInputValue) => {
            if (type === "bus" || type === "route" || type === "fare") {
              setSearchParams((prev) => ({ ...prev, [type]: newInputValue }));
              setPage((prev) => ({ ...prev, [type]: 0 }));
              type === "bus"
                ? fetchBusList(0, newInputValue)
                : type === "route"
                ? fetchRouteList(0, newInputValue)
                : fetchFareList(0, newInputValue);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={`Select ${label}`}
              margin="normal"
              error={!!errors[name]}
              helperText={errors[name]?.message}
              required
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              {option.name}
            </li>
          )}
          ListboxProps={{
            onScroll: (event) => handleScroll(event, type),
            style: { maxHeight: 200, overflow: "auto" },
          }}
        />
      )}
    />
  );

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Schedule Creation
        </Typography>
        <Box
          component="form"
          noValidate
          sx={{ mt: 1 }}
          onSubmit={handleSubmit(handleAccountCreation)}
        >
          <Controller
            name="name"
            control={control}
            rules={{
              required: "Schedule name is required",
              minLength: {
                value: 4,
                message: "Schedule name must be at least 4 characters",
              },
              maxLength: {
                value: 32,
                message: "Schedule name must be at most 32 characters",
              },
              validate: (value) => {
                if (value.trim() === "") return "Schedule name is required";
                if (/^\s|\s$/.test(value))
                  return "No leading or trailing spaces allowed";
                if (/\s{2,}/.test(value))
                  return "Consecutive spaces are not allowed";
                return true;
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                fullWidth
                label="Schedule Name"
                error={!!errors.name}
                helperText={errors.name?.message}
                size="small"
              />
            )}
          />

          {renderAutocomplete("route_id", "Route", memoizedRouteList, "route")}
          {renderAutocomplete("bus_id", "Bus", memoizedBusList, "bus")}
          {renderAutocomplete("fare_id", "Fare", memoizedFareList, "fare")}

          <Controller
            name="frequency"
            control={control}
            render={({ field }) => (
              <Autocomplete
                multiple
                options={days}
                disableCloseOnSelect
                getOptionLabel={(option) => option.label}
                value={days.filter((day) => field.value?.includes(day.value))}
                onChange={(_, newValue) => {
                  field.onChange(newValue.map((day) => day.value));
                }}
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Checkbox style={{ marginRight: 8 }} checked={selected} />
                    {option.label}
                  </li>
                )}
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
            name="ticketing_mode"
            control={control}
            render={({ field }) => (
              <TextField
                margin="normal"
                fullWidth
                select
                label="Ticket Mode"
                {...field}
                error={!!errors.ticketing_mode}
                helperText={errors.ticketing_mode?.message}
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
            name="triggering_mode"
            control={control}
            render={({ field }) => (
              <TextField
                margin="normal"
                fullWidth
                select
                label="Trigger Mode"
                {...field}
                error={!!errors.triggering_mode}
                helperText={errors.triggering_mode?.message}
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
              "Create Schedule"
            )}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default React.memo(ScheduleCreationForm);

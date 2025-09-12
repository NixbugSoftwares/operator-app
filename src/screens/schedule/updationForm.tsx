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
  Checkbox,
} from "@mui/material";
import { useAppDispatch } from "../../store/Hooks";
import {
  scheduleUpdationApi,
  companyBusListApi,
  busRouteListApi,
  fareListApi,
} from "../../slices/appSlice";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import {
  showErrorToast,
  showSuccessToast,
} from "../../common/toastMessageHelper";

interface DropdownItem {
  id: number;
  name: string;
}

type ScheduleFormValues = {
  id: number;
  name: string;
  ticket_mode: number;
  trigger_mode: number;
  bus_id: number;
  fare_id?: number;
  route_id?: number;
  frequency: number[];
};

interface IOperatorUpdateFormProps {
  scheduleId: number;
  scheduleData: ScheduleFormValues;
  onClose: () => void;
  refreshList: (value: any) => void;
  onCloseDetailCard: () => void;
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

const daysFrequency = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 7 },
];

const ScheduleUpdateForm: React.FC<IOperatorUpdateFormProps> = ({
  onClose,
  refreshList,
  scheduleId,
  onCloseDetailCard,
  scheduleData,
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const rowsPerPage = 10;
  const [dropdownData, setDropdownData] = useState({
    busList: [] as DropdownItem[],
    routeList: [] as DropdownItem[],
    fareList: [] as DropdownItem[],
  });
  const [hasMore, setHasMore] = useState({
    bus: true,
    route: true,
    fare: true,
  });
  const [_selectedBus, setSelectedBus] = useState<DropdownItem | null>(null);
  const [_selectedRoute, setSelectedRoute] = useState<DropdownItem | null>(
    null
  );
  const [_selectedFare, setSelectedFare] = useState<DropdownItem | null>(null);
  const isFirstLoad = useRef(true);
  const [isReady, setIsReady] = useState(false);

  const getTicketModeValue = (label: string): number => {
    const option = ticketModeOptions.find((opt) => opt.label === label);
    return option ? option.value : 1;
  };

  const getTriggerModeValue = (label: string): number => {
    const option = triggerOptions.find((opt) => opt.label === label);
    return option ? option.value : 1;
  };

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ScheduleFormValues>({
    defaultValues: {
      ...scheduleData,
      ticket_mode: getTicketModeValue(
        scheduleData.ticket_mode as unknown as string
      ),
      trigger_mode: getTriggerModeValue(
        scheduleData.trigger_mode as unknown as string
      ),
    },
  });

  const fetchDropdownData = useCallback(
    async (type: "bus" | "route" | "fare", pageNumber = 0, searchText = "") => {
      setLoading(true);
      const offset = pageNumber * rowsPerPage;
      const apiMap = {
        bus: companyBusListApi,
        route: busRouteListApi,
        fare: fareListApi,
      };

      try {
        let items: any[] = [];

        if (type === "fare") {
          // Special handling for fare - make two API calls
          const [companyRes] = await Promise.all([
            dispatch(
              fareListApi({
                limit: rowsPerPage,
                offset,
                name: searchText,
              })
            ).unwrap(),
          ]);

          const companyFares = companyRes.data || [];

          // Combine and deduplicate by id
          items = [...companyFares].filter(
            (fare, index, self) =>
              index === self.findIndex((f) => f.id === fare.id)
          );
        } else {
          // Normal handling for bus and route
          const response = await dispatch(
            apiMap[type]({
              limit: rowsPerPage,
              offset,
              name: searchText,
              status: 1,
            })
          ).unwrap();
          items = response.data || [];
        }

        const formattedList = items.map((item: any) => ({
          id: item.id,
          name: item.name ?? "-",
        }));

        setDropdownData((prev) => ({
          ...prev,
          [`${type}List`]:
            pageNumber === 0
              ? formattedList
              : [...prev[`${type}List`], ...formattedList],
        }));

        setHasMore((prev) => ({
          ...prev,
          [type]: items.length === rowsPerPage,
        }));

        // Set initial selected values on first load
        if (pageNumber === 0 && isFirstLoad.current) {
          const idMap = {
            bus: scheduleData.bus_id,
            route: scheduleData.route_id,
            fare: scheduleData.fare_id,
          };

          if (idMap[type]) {
            const foundItem = formattedList.find(
              (item: DropdownItem) => item.id === idMap[type]
            );

            if (foundItem) {
              const setterMap = {
                bus: setSelectedBus,
                route: setSelectedRoute,
                fare: setSelectedFare,
              };
              setterMap[type](foundItem);
            } else {
              try {
                const singleItemResponse = await dispatch(
                  apiMap[type]({ id: idMap[type] })
                ).unwrap();

                const item = singleItemResponse?.data?.[0];
                if (item) {
                  const injectedItem = { id: item.id, name: item.name ?? "-" };
                  setDropdownData((prev) => ({
                    ...prev,
                    [`${type}List`]: [injectedItem, ...prev[`${type}List`]],
                  }));

                  const setterMap = {
                    bus: setSelectedBus,
                    route: setSelectedRoute,
                    fare: setSelectedFare,
                  };
                  setterMap[type](injectedItem);
                }
              } catch (err) {
                showErrorToast(`Could not fetch selected ${type}`);
              }
            }
          }
        }
      } catch (error: any) {
        showErrorToast(error.message || `Failed to fetch ${type} list`);
      } finally {
        if (type === "fare") isFirstLoad.current = false;
        setLoading(false);
      }
    },
    [dispatch, scheduleData]
  );

  useEffect(() => {
    const initializeDropdowns = async () => {
      try {
        setLoading(true);
        const [busResp, routeResp, fareResp] = await Promise.all([
          dispatch(
            companyBusListApi({
              limit: rowsPerPage,
              offset: 0,
              name: "",
            })
          ).unwrap(),
          dispatch(
            busRouteListApi({ limit: rowsPerPage, offset: 0, name: "" })
          ).unwrap(),
          dispatch(
            fareListApi({ limit: rowsPerPage, offset: 0, name: "" })
          ).unwrap(),
        ]);

        const formatList = (items: any[]) =>
          items.map((item: any) => ({ id: item.id, name: item.name ?? "-" }));

        const busList = formatList(busResp.data || []);
        const routeList = formatList(routeResp.data || []);
        const fareList = formatList(fareResp.data || []);

        setDropdownData({
          busList,
          routeList,
          fareList,
        });

        // Set selected items if they exist
        const bus =
          busList.find((item) => item.id === scheduleData.bus_id) || null;
        const route =
          routeList.find((item) => item.id === scheduleData.route_id) || null;
        const fare =
          fareList.find((item) => item.id === scheduleData.fare_id) || null;

        setSelectedBus(bus);
        setSelectedRoute(route);
        setSelectedFare(fare);
      } catch (err: any) {
        showErrorToast("Failed to load dropdowns");
        console.error(err);
      } finally {
        setLoading(false);
        setIsReady(true);
      }
    };

    initializeDropdowns();
  }, []);

  const handleScroll = (
    event: React.UIEvent<HTMLUListElement>,
    type: "bus" | "route" | "fare"
  ) => {
    const listboxNode = event.currentTarget;
    if (
      listboxNode.scrollTop + listboxNode.clientHeight ===
        listboxNode.scrollHeight &&
      hasMore[type]
    ) {
      const nextPage = Math.floor(
        dropdownData[`${type}List`].length / rowsPerPage
      );
      fetchDropdownData(type, nextPage);
    }
  };

  const handleScheduleUpdate: SubmitHandler<ScheduleFormValues> = async (
    data
  ) => {
    try {
      setLoading(true);

      const updationData = {
        id: scheduleId,
        name: data.name,
        ticketing_mode: data.ticket_mode,
        triggering_mode: data.trigger_mode,
        bus_id: data.bus_id,
        fare_id: data.fare_id,
        route_id: data.route_id,
        frequency: data.frequency,
      };
      console.log("Updation Data:", updationData);

      await dispatch(scheduleUpdationApi(updationData)).unwrap();

      showSuccessToast("Schedule updated successfully!");
      onCloseDetailCard();
      refreshList("refresh");
      onClose();
    } catch (error: any) {
      if (error.status === 409) {
        showErrorToast("Schedule already exists");
      } else {
        showErrorToast(error.message || "Schedule Update failed");
      }
    } finally {
      setLoading(false);
    }
  };
  if (!isReady) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }
  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Update Schedule
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
          onSubmit={handleSubmit(handleScheduleUpdate)}
        >
          <Controller
            name="name"
            control={control}
            rules={{
              required: "Name is required",
              validate: (value) => {
                if (value.trim() === "") return "Name is required";
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
                label="Schedule Name"
                fullWidth
                margin="normal"
                error={!!errors.name}
                helperText={errors.name?.message}
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
                onChange={(_, newValue) => {
                  field.onChange(newValue?.id || null);
                }}
                onInputChange={(_, newInputValue) => {
                  fetchDropdownData("bus", 0, newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Bus"
                    error={!!errors.bus_id}
                    helperText={errors.bus_id?.message}
                    fullWidth
                    margin="normal"
                  />
                )}
                ListboxProps={{
                  onScroll: (event) => handleScroll(event, "bus"),
                  style: { maxHeight: 200, overflow: "auto" },
                }}
                loading={loading}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            )}
          />

          <Controller
            name="route_id"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={dropdownData.routeList}
                getOptionLabel={(option) => option.name}
                value={
                  dropdownData.routeList.find(
                    (item) => item.id === field.value
                  ) || null
                }
                onChange={(_, newValue) => {
                  setSelectedRoute(newValue);
                  field.onChange(newValue?.id || null);
                }}
                onInputChange={(_, newInputValue) => {
                  fetchDropdownData("route", 0, newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Route"
                    error={!!errors.route_id}
                    helperText={errors.route_id?.message}
                    fullWidth
                    margin="normal"
                  />
                )}
                ListboxProps={{
                  onScroll: (event) => handleScroll(event, "route"),
                  style: { maxHeight: 200, overflow: "auto" },
                }}
                loading={loading}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            )}
          />

          <Controller
            name="fare_id"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={dropdownData.fareList}
                getOptionLabel={(option) => option.name}
                value={
                  dropdownData.fareList.find(
                    (item) => item.id === field.value
                  ) || null
                }
                onChange={(_, newValue) => {
                  setSelectedFare(newValue);
                  field.onChange(newValue?.id || null);
                }}
                onInputChange={(_, newInputValue) => {
                  fetchDropdownData("fare", 0, newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Fare"
                    error={!!errors.fare_id}
                    helperText={errors.fare_id?.message}
                    fullWidth
                    margin="normal"
                  />
                )}
                ListboxProps={{
                  onScroll: (event) => handleScroll(event, "fare"),
                  style: { maxHeight: 200, overflow: "auto" },
                }}
                loading={loading}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            )}
          />

          <Controller
            name="ticket_mode"
            control={control}
            render={({ field }) => (
              <TextField
                select
                fullWidth
                label="Ticket Mode"
                value={field.value}
                onChange={field.onChange}
                error={!!errors.ticket_mode}
                size="small"
                margin="normal"
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
                select
                fullWidth
                label="Trigger Mode"
                value={field.value}
                onChange={field.onChange}
                error={!!errors.trigger_mode}
                size="small"
                margin="normal"
              >
                {triggerOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="frequency"
            control={control}
            render={({ field }) => (
              <Autocomplete
                multiple
                options={daysFrequency}
                disableCloseOnSelect
                getOptionLabel={(option) => option.label}
                value={daysFrequency.filter((day) =>
                  field.value?.includes(day.value)
                )}
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
              "Update Schedule"
            )}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ScheduleUpdateForm;

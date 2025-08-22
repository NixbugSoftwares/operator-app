import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  Divider,
  Chip,
  Button,
  Stack,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Alert,
} from "@mui/material";
import {
  Delete,
  Edit,
  Directions,
  ArrowUpward,
  ArrowDownward,
} from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import {
  busRouteLandmarkListApi,
  landmarkListApi,
  routeLandmarkDeleteApi,
  routeLandmarkUpdationApi,
  routeUpdationApi,
} from "../../slices/appSlice";
import { useAppDispatch } from "../../store/Hooks";
import {
  showErrorToast,
  showSuccessToast,
} from "../../common/toastMessageHelper";
import { Landmark, RouteLandmark, SelectedLandmark } from "../../types/type";
import { RootState } from "../../store/Store";
import { useSelector } from "react-redux";

interface BusRouteDetailsProps {
  routeId: number;
  routeName: string;
  routeStartingTime: string;
  onBack: () => void;
  onLandmarksUpdate: (landmarks: any[]) => void;
  onEnableAddLandmark: () => void;
  isEditing?: boolean;
  onCancelEdit: () => void;
  newLandmarks: SelectedLandmark[];
  setNewLandmarks: React.Dispatch<React.SetStateAction<SelectedLandmark[]>>;
  refreshList: (value: any) => void;
  newLandmarkTrigger: boolean;
}

const BusRouteDetailsPage = ({
  routeId,
  routeName,
  routeStartingTime,
  onBack,
  onLandmarksUpdate,
  onEnableAddLandmark,
  newLandmarks,
  setNewLandmarks,
  refreshList,
  newLandmarkTrigger,
}: BusRouteDetailsProps) => {
  const dispatch = useAppDispatch();
  const [routeLandmarks, setRouteLandmarks] = useState<RouteLandmark[]>([]);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [routeLandmarkToDelete, setRouteLandmarkToDelete] =
    useState<RouteLandmark | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editingLandmark, setEditingLandmark] = useState<RouteLandmark | null>(
    null
  );
  const [updatedRouteName, setUpdatedRouteName] = useState(routeName);
  const [error, setError] = useState("");
  const [localHour, setLocalHour] = useState<number>(6);
  const [localMinute, setLocalMinute] = useState<number>(0);
  const [amPm, setAmPm] = useState<string>("AM");
  const [arrivalHour, setArrivalHour] = useState<number>(6);
  const [arrivalMinute, setArrivalMinute] = useState<number>(0);
  const [arrivalAmPm, setArrivalAmPm] = useState<string>("AM");
  const [departureHour, setDepartureHour] = useState<number>(6);
  const [departureMinute, setDepartureMinute] = useState<number>(0);
  const [departureAmPm, setDepartureAmPm] = useState<string>("AM");
  const [startingDayOffset, _setStartingDayOffset] = useState<number>(0);
  const [arrivalDayOffset, setArrivalDayOffset] = useState<number>(0);
  const [departureDayOffset, setDepartureDayOffset] = useState<number>(0);
  const [_addMode, setAddMode] = useState<boolean>(false);
  const canUpdateRoutes = useSelector((state: RootState) =>
    state.app.permissions.includes("update_route")
  );
  const canCreateRoutes = useSelector((state: RootState) =>
    state.app.permissions.includes("create_route")
  );


  const fetchRouteLandmarks = async () => {
    setIsLoading(true);
    try {
      const response = await dispatch(
        busRouteLandmarkListApi(routeId)
      ).unwrap();

      const processedLandmarks = processLandmarks(response);
      const sortedLandmarks = processedLandmarks.sort(
        (a, b) => (a.distance_from_start || 0) - (b.distance_from_start || 0)
      );

      setRouteLandmarks(sortedLandmarks);
      updateParentMapLandmarks(sortedLandmarks);
      const landmarkIds = sortedLandmarks
        .map((lm) => Number(lm.landmark_id))
        .filter(Boolean);
      const landmarkRes = await dispatch(
        landmarkListApi({ id_list: landmarkIds })
      ).unwrap();
      console.log("landmarkRes", landmarkRes);

      setLandmarks(landmarkRes.data);
    } catch (error: any) {
      showErrorToast(error.message || "Failed to fetch route landmarks");
    } finally {
      setIsLoading(false);
    }
  };
  const processLandmarks = (landmarks: RouteLandmark[]): RouteLandmark[] => {
    return landmarks
      .sort((a, b) => (a.sequence_id || 0) - (b.sequence_id || 0))
      .map((landmark, index) => ({
        ...landmark,
        sequence_id: index + 1,
      }));
  };

  useEffect(() => {
    fetchRouteLandmarks();
  }, [routeId, newLandmarkTrigger ]);


  useEffect(() => {
    return () => {
      onLandmarksUpdate([]);
    };
  }, []);

  useEffect(() => {
    return () => {
      onLandmarksUpdate([]);
    };
  }, []);

  const getLandmarkName = (landmarkId: string | number) => {
    const landmark = landmarks.find((l) => l.id === Number(landmarkId));
    return landmark ? landmark.name : "Unknown Landmark";
  };

  const calculateActualTime = (startingTime: string, deltaSeconds: string) => {
    if (!startingTime || !deltaSeconds) return "N/A";

    try {
      // Parse starting time as UTC
      let timeString = startingTime;
      if (!timeString.includes("T")) {
        timeString = `1970-01-01T${timeString}`;
      }

      const startDate = new Date(timeString);
      const delta = parseInt(deltaSeconds, 10);
      // Add delta seconds to starting time
      const resultDate = new Date(startDate.getTime() + delta * 1000);

      // Add 5 hours 30 minutes to UTC to get IST
      resultDate.setTime(resultDate.getTime() + (5 * 60 + 30) * 60 * 1000);
      let hours = resultDate.getUTCHours();
      const minutes = resultDate.getUTCMinutes();
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;

      // Calculate day offset (in IST)
      const dayOffset = Math.floor(
        (resultDate.getTime() - Date.UTC(1970, 0, 1)) / (86400 * 1000)
      );
      const userDay = dayOffset + 1;

      const timeStr = `${displayHours}:${minutes
        .toString()
        .padStart(2, "0")} ${period}`;
      return `${timeStr} (D${userDay})`; // Changed to D1, D2 format
    } catch (e) {
      console.error("Error calculating actual time:", e);
      return "N/A";
    }
  };

  const convertLocalToUTC = (
    hour: number,
    minute: number,
    period: string,
    dayOffset: number = 0
  ) => {
    let istHour = hour;
    if (period === "PM" && hour !== 12) {
      istHour += 12;
    } else if (period === "AM" && hour === 12) {
      istHour = 0;
    }

    // Create IST date
    const istDate = new Date(
      Date.UTC(1970, 0, 1 + dayOffset, istHour, minute, 0)
    );
    // Subtract 5 hours 30 minutes to get UTC
    istDate.setTime(istDate.getTime() - (5 * 60 + 30) * 60 * 1000);

    return {
      displayTime: istDate.toISOString().slice(11, 19),
      fullTime: istDate.toISOString(),
      dayOffset,
      timestamp: istDate.getTime(),
    };
  };

  // Helper function to format delta seconds into human-readable format
  const formatDeltaTime = (deltaSeconds: string) => {
    if (!deltaSeconds) return "N/A";

    const seconds = parseInt(deltaSeconds, 10);
    if (isNaN(seconds)) return "N/A";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    let result = "";
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours === 0) result += `${minutes}m`;

    return result.trim();
  };

  const formatTimeForDisplay = (isoString: string) => {
    const date = new Date(isoString);
    // Add 5 hours 30 minutes to UTC to get IST
    date.setUTCHours(date.getUTCHours() + 5, date.getUTCMinutes() + 30);
    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const updateParentMapLandmarks = (landmarks: RouteLandmark[]) => {
    const mapLandmarks = landmarks.map((lm) => ({
      id: lm.landmark_id,
      name: lm.name,
      sequenceId: lm.sequence_id || 0,
      arrivalTime: lm.arrival_delta,
      departureTime: lm.departure_delta,
      distance_from_start: lm.distance_from_start || 0,
    }));

    onLandmarksUpdate(mapLandmarks);
  };

  const handleAddClick = () => {
    setAddMode(true);
    onEnableAddLandmark();
  };

  const handleLandmarkEditClick = (landmark: RouteLandmark) => {
    const startDate = new Date(routeStartingTime);
    const arrivalDate = new Date(
      startDate.getTime() + parseInt(landmark.arrival_delta || "0", 10) * 1000
    );
    arrivalDate.setTime(arrivalDate.getTime() + (5 * 60 + 30) * 60 * 1000); // Add IST offset
    const arrivalDayOffset = Math.floor(
      (arrivalDate.getTime() - Date.UTC(1970, 0, 1)) / (86400 * 1000)
    );

    const departureDate = new Date(
      startDate.getTime() + parseInt(landmark.departure_delta || "0", 10) * 1000
    );
    departureDate.setTime(departureDate.getTime() + (5 * 60 + 30) * 60 * 1000);
    const departureDayOffset = Math.floor(
      (departureDate.getTime() - Date.UTC(1970, 0, 1)) / (86400 * 1000)
    );
    console.log(
      "arrival_delta:",
      landmark.arrival_delta,
      "arrivalDayOffset:",
      arrivalDayOffset
    );

    setArrivalDayOffset(arrivalDayOffset);
    setDepartureDayOffset(departureDayOffset);

    // Convert UTC time to local time for display
    const arrivalTime = calculateActualTime(
      routeStartingTime,
      landmark.arrival_delta || "0"
    ).split(" (")[0];
    const departureTime = calculateActualTime(
      routeStartingTime,
      landmark.departure_delta || "0"
    ).split(" (")[0];

    // Parse the formatted time back to 12-hour format
    const parse12HourTime = (timeStr: string) => {
      const [time, period] = timeStr.split(" ");
      const [hours, minutes] = time.split(":").map(Number);
      return {
        hours: hours === 12 ? 12 : hours % 12,
        minutes,
        period,
      };
    };

    const arrival = parse12HourTime(arrivalTime);
    const departure = parse12HourTime(departureTime);

    setArrivalHour(arrival.hours);
    setArrivalMinute(arrival.minutes);
    setArrivalAmPm(arrival.period as "AM" | "PM");

    setDepartureHour(departure.hours);
    setDepartureMinute(departure.minutes);
    setDepartureAmPm(departure.period as "AM" | "PM");

    setEditingLandmark(landmark);
  };

  // Initialize the time values when component mounts
  useEffect(() => {
    if (routeStartingTime) {
      // Extract time from routeStartingTime (format: "HH:MM:SS" or ISO)
      let date = new Date(
        routeStartingTime.includes("T")
          ? routeStartingTime
          : `1970-01-01T${routeStartingTime}Z`
      );
      // Convert to IST
      date.setTime(date.getTime() + (5 * 60 + 30) * 60 * 1000);
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      setLocalHour(hours % 12 || 12);
      setLocalMinute(minutes);
      setAmPm(hours >= 12 ? "PM" : "AM");
    }
  }, [routeStartingTime]);

  const validateTimes = () => {
    return (
      arrivalHour !== null &&
      arrivalHour !== undefined &&
      arrivalMinute !== null &&
      arrivalMinute !== undefined &&
      departureHour !== null &&
      departureHour !== undefined &&
      departureMinute !== null &&
      departureMinute !== undefined
    );
  };

  const handleRouteDetailsUpdate = async () => {
    try {
      const timeString = convertLocalToUTC(
        localHour,
        localMinute,
        amPm,
        startingDayOffset
      );

      const formData = new FormData();
      formData.append("id", routeId.toString());
      formData.append("name", updatedRouteName);
      formData.append("start_time", timeString.displayTime + "Z");

      await dispatch(routeUpdationApi({ routeId, formData })).unwrap();
      refreshList("refresh");
      showSuccessToast("Route details updated successfully");
      onBack();
    } catch (error: any) {
      showErrorToast(error.message || "Failed to update route details");
    }
  };

  const handleLandmarkUpdate = async () => {
    if (!editingLandmark) return;
    try {
      const arrivalTimeUTC = convertLocalToUTC(
        arrivalHour,
        arrivalMinute,
        arrivalAmPm,
        arrivalDayOffset
      );
      const departureTimeUTC = convertLocalToUTC(
        departureHour,
        departureMinute,
        departureAmPm,
        departureDayOffset
      );

      // Fix 1: Handle the starting time properly
      const startDate = new Date(routeStartingTime);
      if (isNaN(startDate.getTime())) {
        throw new Error("Invalid starting time format");
      }

      // Fix 2: Ensure the arrival/departure times are valid
      const arrivalDate = new Date(arrivalTimeUTC.fullTime);
      const departureDate = new Date(departureTimeUTC.fullTime);

      if (isNaN(arrivalDate.getTime()) || isNaN(departureDate.getTime())) {
        throw new Error("Invalid arrival/departure time format");
      }

      // Calculate deltas
      const arrivalDelta = Math.floor(
        (arrivalDate.getTime() - startDate.getTime()) / 1000
      );
      const departureDelta = Math.floor(
        (departureDate.getTime() - startDate.getTime()) / 1000
      );

      console.log(
        "landmark update",
        "Calculated deltas - arrival:",
        arrivalDelta,
        "departure:",
        departureDelta
      );

      const formData = new FormData();
      formData.append("id", editingLandmark.id.toString());
      formData.append("arrival_delta", arrivalDelta.toString());
      formData.append("departure_delta", departureDelta.toString());

      if (editingLandmark.distance_from_start !== undefined) {
        formData.append(
          "distance_from_start",
          editingLandmark.distance_from_start.toString()
        );
      }

      await dispatch(
        routeLandmarkUpdationApi({
          routeLandmarkId: Number(editingLandmark.id),
          formData,
        })
      ).unwrap();
      showSuccessToast("Landmark updated successfully");
      fetchRouteLandmarks();
      setEditingLandmark(null);
    } catch (error: any) {
      console.error("Update error:", error);
      showErrorToast(error.message || "Failed to update landmark");
    }
  };

  const handleDeleteClick = (landmark: RouteLandmark) => {
    setRouteLandmarkToDelete(landmark);
    setDeleteConfirmOpen(true);
  };

  const handleRouteLandmarkDelete = async () => {
    if (!routeLandmarkToDelete) return;
    try {
      const formData = new FormData();
      formData.append("id", routeLandmarkToDelete.id.toString());
      const result = await dispatch(routeLandmarkDeleteApi(formData)).unwrap();

      if (result && result.error) {
        throw new Error(result.error);
      }

      showSuccessToast("Landmark removed from route successfully");
      fetchRouteLandmarks();
    } catch (error: any) {
      showErrorToast(error.message || "Failed to remove landmark from route");
    } finally {
      setDeleteConfirmOpen(false);
      setRouteLandmarkToDelete(null);
    }
  };

  return (
    <Box
      sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}
    >
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={onBack}>
          Back
        </Button>
      </Stack>

      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Stack direction="column" alignItems="center" spacing={1}>
          <Stack direction="column" spacing={1} sx={{ width: "100%" }}>
            {/* Route Name Block */}
            <Box sx={{ width: "100%" }}>
              <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 500 }}>
                Route Name
              </Typography>
              <TextField
                fullWidth
                value={updatedRouteName}
                onChange={(e) => {
                  const value = e.target.value;
                  setUpdatedRouteName(value);
                  if (value.trim() === "") {
                    setError("Route name is required");
                  } else if (/^\s|\s$/.test(value)) {
                    setError("No leading or trailing spaces allowed");
                  } else if (/\s{2,}/.test(value)) {
                    setError("Consecutive spaces are not allowed");
                  } else {
                    setError("");
                  }
                }}
                error={!!error}
                helperText={error}
                variant="outlined"
                size="small"
                label="Enter route name"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "6px",
                  },
                }}
              />
            </Box>

            {/* Starting Time Block */}
            <Box sx={{ width: "100%" }}>
              <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 500 }}>
                Starting Time (IST)
              </Typography>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  width: "100%",
                  "& .MuiFormControl-root": {
                    flex: 1,
                    minWidth: "unset",
                  },
                }}
              >
                <FormControl size="small" fullWidth>
                  <InputLabel>Hour</InputLabel>
                  <Select
                    value={localHour}
                    onChange={(e) => setLocalHour(Number(e.target.value))}
                    label="Hour"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <MenuItem key={h} value={h}>
                        {String(h).padStart(2, "0")}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel>Minute</InputLabel>
                  <Select
                    value={localMinute}
                    onChange={(e) => setLocalMinute(Number(e.target.value))}
                    label="Minute"
                  >
                    {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                      <MenuItem key={m} value={m}>
                        {String(m).padStart(2, "0")}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel>AM/PM</InputLabel>
                  <Select
                    value={amPm}
                    onChange={(e) => setAmPm(e.target.value)}
                    label="AM/PM"
                  >
                    <MenuItem value="AM">AM</MenuItem>
                    <MenuItem value="PM">PM</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Box>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            justifyContent="flex-end"
            sx={{ width: "100%", mt: 1 }}
          >
            {canUpdateRoutes && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleRouteDetailsUpdate}
                disabled={!!error}
                size="small"
                sx={{
                  minWidth: 80,
                  py: 0.5,
                }}
              >
                Update
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {isLoading ? (
        <Typography>Loading route details...</Typography>
      ) : routeLandmarks.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No landmarks found for this route.
        </Typography>
      ) : (
        <Paper elevation={3} sx={{ p: 3, flex: 1, overflow: "auto" }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Route Landmarks
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>

              {(canCreateRoutes || canUpdateRoutes) && (
                <Tooltip title="Add New Landmark">
                  <IconButton color="primary" onClick={handleAddClick}>
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
          <List sx={{ width: "100%", py: 0 }}>
  {routeLandmarks.map((landmark, index) => {
    const isFirstLandmark = index === 0;
    const isLastLandmark = index === routeLandmarks.length - 1;
    const arrivalTime = isFirstLandmark
      ? formatTimeForDisplay(routeStartingTime)
      : calculateActualTime(
          routeStartingTime,
          landmark.arrival_delta
        );
    const departureTime = isFirstLandmark
      ? formatTimeForDisplay(routeStartingTime)
      : calculateActualTime(
          routeStartingTime,
          landmark.departure_delta
        );

    const arrivalDelta = isFirstLandmark
      ? "0m"
      : formatDeltaTime(landmark.arrival_delta);
    const departureDelta = isFirstLandmark
      ? "0m"
      : formatDeltaTime(landmark.departure_delta);

    return (
      <Box key={landmark.id}>
        <ListItem
          sx={{
            display: "flex",
            alignItems: "flex-start",
            py: 1,
            px: 1,
            backgroundColor: isFirstLandmark 
              ? "#dbf1d9ff" 
              : isLastLandmark
                ? "#ebcacaff"
                : index % 2 === 0 
                  ? "action.hover" 
                  : "background.paper",
            borderRadius: 1,
            gap: 1,
          }}
        >
          <Chip
            label={index + 1}
            color="primary"
            size="small"
            sx={{
              minWidth: 28,
              height: 28,
              fontSize: "0.75rem",
              fontWeight: 600,
              mt: 0.5,
            }}
          />

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  sx={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {getLandmarkName(landmark.landmark_id)}
                </Typography>

                {landmark.distance_from_start !== undefined && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mt: 0.5,
                      fontSize: "0.7rem",
                      color: "text.secondary",
                    }}
                  >
                    <Directions
                      sx={{ fontSize: "0.8rem", mr: 0.5 }}
                    />
                    {landmark.distance_from_start}m
                  </Box>
                )}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  ml: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    minWidth: 200,
                    justifyContent: "flex-end",
                  }}
                >
                  {/* Arrival Time - show for all except first */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      minWidth: 100,
                      visibility: isFirstLandmark ? "hidden" : "visible",
                    }}
                  >
                    <ArrowDownward
                      sx={{
                        fontSize: "0.8rem",
                        mr: 0.5,
                        color: "error.main",
                      }}
                    />
                    <Tooltip title={`Time delta: ${arrivalDelta}`}>
                      <span>Arr: {arrivalTime}</span>
                    </Tooltip>
                  </Box>

                  {/* Departure Time - show for all except last */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      minWidth: 100,
                      visibility: isLastLandmark ? "hidden" : "visible",
                    }}
                  >
                    <ArrowUpward
                      sx={{
                        fontSize: "0.8rem",
                        mr: 0.5,
                        color: "success.main",
                      }}
                    />
                    <Tooltip
                      title={`Time delta: ${departureDelta}`}
                    >
                      <span>Dep: {departureTime}</span>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Action buttons - show for all except first */}
                {!(index === 0) && (
                  <Stack direction="row" spacing={0.5} sx={{ ml: 1 }}>
                    {(canUpdateRoutes || canCreateRoutes) && (
                      <>
                        <IconButton
                          onClick={() =>
                            handleLandmarkEditClick(landmark)
                          }
                          aria-label="edit"
                          color="primary"
                          size="small"
                          sx={{ width: 24, height: 24 }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteClick(landmark)}
                          aria-label="delete"
                          color="error"
                          size="small"
                          sx={{ width: 24, height: 24 }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </Stack>
                )}
              </Box>
            </Box>
          </Box>
        </ListItem>

        {index < routeLandmarks.length - 1 && (
          <Divider
            component="li"
            sx={{
              borderLeftWidth: 2,
              borderLeftStyle: "dashed",
              borderColor: "divider",
              height: 16,
              ml: 3.5,
              listStyle: "none",
            }}
          />
        )}
      </Box>
    );
  })}

  {newLandmarks.map((landmark, index) => {
    const arrivalTime = formatTimeForDisplay(
      landmark.arrivalTime.fullTime
    );
    const departureTime = formatTimeForDisplay(
      landmark.departureTime.fullTime
    );
    const isLastNewLandmark = index === newLandmarks.length - 1;
    const isFirstNewLandmark = index === 0;

    return (
      <Box key={`new-${landmark.id}-${index}`}>
        <ListItem
          sx={{
            backgroundColor: "#e3f2fd",
            borderRadius: 1,
            display: "flex",
            alignItems: "flex-start",
            py: 1,
            px: 1,
            gap: 1,
          }}
        >
          <Chip
            label={routeLandmarks.length + index + 1}
            color="primary"
            size="small"
            sx={{
              minWidth: 28,
              height: 28,
              fontSize: "0.75rem",
              fontWeight: 600,
              mt: 0.5,
            }}
          />

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  sx={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {landmark.name || "Unnamed Landmark"}
                </Typography>

                {landmark.distance_from_start !== undefined && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mt: 0.5,
                      fontSize: "0.7rem",
                      color: "text.secondary",
                    }}
                  >
                    <Directions
                      sx={{ fontSize: "0.8rem", mr: 0.5 }}
                    />
                    {landmark.distance_from_start}m
                  </Box>
                )}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  ml: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    minWidth: 200,
                    justifyContent: "flex-end",
                  }}
                >
                  {/* Consistent with main landmarks - show arrival for all except first */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      minWidth: 100,
                      visibility: isFirstNewLandmark ? "hidden" : "visible",
                    }}
                  >
                    <ArrowDownward
                      sx={{
                        fontSize: "0.8rem",
                        mr: 0.5,
                        color: "error.main",
                      }}
                    />
                    <span>Arr: {arrivalTime}</span>
                  </Box>

                  {/* Consistent with main landmarks - show departure for all except last */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      minWidth: 100,
                      visibility: isLastNewLandmark ? "hidden" : "visible",
                    }}
                  >
                    <ArrowUpward
                      sx={{
                        fontSize: "0.8rem",
                        mr: 0.5,
                        color: "success.main",
                      }}
                    />
                    <span>Dep: {departureTime}</span>
                  </Box>
                </Box>

                <IconButton
                  color="error"
                  size="small"
                  onClick={() =>
                    setNewLandmarks(
                      newLandmarks.filter((_, i) => i !== index)
                    )
                  }
                  sx={{
                    width: 24,
                    height: 24,
                    backgroundColor: "error.light",
                    "&:hover": {
                      backgroundColor: "error.main",
                      color: "error.contrastText",
                    },
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </ListItem>

        {index < newLandmarks.length - 1 && (
          <Divider
            component="li"
            sx={{
              borderLeftWidth: 2,
              borderLeftStyle: "dashed",
              borderColor: "divider",
              height: 16,
              ml: 3.5,
              listStyle: "none",
            }}
          />
        )}
      </Box>
    );
  })}
</List>
        </Paper>
      )}

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Landmark Removal</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Remove "{getLandmarkName(routeLandmarkToDelete?.landmark_id || "")}
            "?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleRouteLandmarkDelete} color="error">
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!editingLandmark}
        onClose={() => setEditingLandmark(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Landmark Details</DialogTitle>
        <DialogContent>
          {editingLandmark && (
            <>
              <Typography>
                Landmark: {getLandmarkName(editingLandmark.landmark_id)}
              </Typography>
              <Typography>ID: {editingLandmark.landmark_id}</Typography>
              <Box mb={2}>
                <Alert severity="info">
                  1. For the starting landmark, arrival and departure time must
                  be the same as the starting time.
                  <br />
                  2. For the ending landmark, arrival and departure time must be
                  the same.
                </Alert>
              </Box>

              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Arrival Time (IST)
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Day</InputLabel>
                  <Select
                    value={arrivalDayOffset}
                    onChange={(e) =>
                      setArrivalDayOffset(Number(e.target.value))
                    }
                    label="Day"
                  >
                    {Array.from({ length: 10 }, (_, i) => (
                      <MenuItem key={i} value={i}>{`Day ${i + 1}`}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Hour</InputLabel>
                  <Select
                    value={arrivalHour}
                    onChange={(e) => setArrivalHour(Number(e.target.value))}
                    label="Hour"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <MenuItem key={h} value={h}>
                        {h.toString().padStart(2, "0")}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Minute</InputLabel>
                  <Select
                    value={arrivalMinute}
                    onChange={(e) => setArrivalMinute(Number(e.target.value))}
                    label="Minute"
                  >
                    {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                      <MenuItem key={m} value={m}>
                        {String(m).padStart(2, "0")}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>AM/PM</InputLabel>
                  <Select
                    value={arrivalAmPm}
                    onChange={(e) => setArrivalAmPm(e.target.value as string)}
                    label="AM/PM"
                  >
                    <MenuItem value="AM">AM</MenuItem>
                    <MenuItem value="PM">PM</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Departure Time (IST)
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Day</InputLabel>
                  <Select
                    value={departureDayOffset}
                    onChange={(e) =>
                      setDepartureDayOffset(Number(e.target.value))
                    }
                    label="Day"
                  >
                    {Array.from({ length: 10 }, (_, i) => (
                      <MenuItem key={i} value={i}>{`Day ${i + 1}`}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>Hour</InputLabel>
                  <Select
                    value={departureHour}
                    onChange={(e) => setDepartureHour(Number(e.target.value))}
                    label="Hour"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <MenuItem key={h} value={h}>
                        {h.toString().padStart(2, "0")}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Minute</InputLabel>
                  <Select
                    value={departureMinute}
                    onChange={(e) => setDepartureMinute(Number(e.target.value))}
                    label="Minute"
                  >
                    {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                      <MenuItem key={m} value={m}>
                        {String(m).padStart(2, "0")}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>AM/PM</InputLabel>
                  <Select
                    value={departureAmPm}
                    onChange={(e) => setDepartureAmPm(e.target.value as string)}
                    label="AM/PM"
                  >
                    <MenuItem value="AM">AM</MenuItem>
                    <MenuItem value="PM">PM</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <TextField
                label="Distance from Start (meter)"
                required
                fullWidth
                margin="normal"
                value={editingLandmark.distance_from_start || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditingLandmark({
                    ...editingLandmark,
                    distance_from_start:
                      value === "" ? undefined : Number(value),
                  });
                }}
                type="number"
                inputProps={{ min: 0 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingLandmark(null)}>Cancel</Button>
          <Button
            onClick={handleLandmarkUpdate}
            color="primary"
            disabled={!validateTimes()}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BusRouteDetailsPage;

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
  InputAdornment,
} from "@mui/material";
import {
  Delete,
  Edit,
  Directions,
  ArrowUpward,
  ArrowDownward,
} from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import ReportIcon from '@mui/icons-material/Report';
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
  showInfoToast,
  showSuccessToast,
} from "../../common/toastMessageHelper";
import { Landmark, RouteLandmark, SelectedLandmark } from "../../types/type";
import { RootState } from "../../store/Store";
import { useSelector } from "react-redux";
import RouteRulesModal from "./RouteRules";
interface BusRouteDetailsProps {
  routeId: number;
  routeName: string;
  routeStatus: string;
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
  routeStatus,
  routeStartingTime,
  onBack,
  onLandmarksUpdate,
  onEnableAddLandmark,
  newLandmarks,
  setNewLandmarks,
  refreshList,
  newLandmarkTrigger,
}: BusRouteDetailsProps) => {
  console.log("routeStatus.....", routeStatus);
  console.log("routeStartingTime.....", routeStartingTime);
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
  const [distanceError, setDistanceError] = useState(false);
  const [distanceUnit, setDistanceUnit] = useState<"m" | "km">("m");
  const canUpdateRoutes = useSelector((state: RootState) =>
    state.app.permissions.includes("update_route")
  );
  const canCreateRoutes = useSelector((state: RootState) =>
    state.app.permissions.includes("create_route")
  );
  const [showRules, setShowRules] = useState(false);
  const handleShowRules = () => {
    setShowRules(true);
  };

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
      console.log("sortedLandmarks.............", sortedLandmarks);

      setRouteLandmarks(sortedLandmarks);
      updateParentMapLandmarks(sortedLandmarks);
      const landmarkIds = sortedLandmarks
        .map((lm) => Number(lm.landmark_id))
        .filter(Boolean);
      const landmarkRes = await dispatch(
        landmarkListApi({ id_list: landmarkIds })
      ).unwrap();
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
  }, [routeId, newLandmarkTrigger]);

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

  const formatTimeForDisplay = (isoString: string) => {
    // Handle both full date strings and time-only strings
    let timePart = isoString;

    // If it's a full date string like "1970-01-01 12:00 am", extract just the time part
    if (isoString.includes(" ")) {
      const parts = isoString.split(" ");
      timePart = parts[1] + " " + parts[2];
    }

    // Parse the time part (format: "12:00 am")
    const [time, period] = timePart.split(" ");
    const [hoursStr, minutesStr] = time.split(":");

    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    // Convert to 24-hour format for display consistency
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    // Convert back to 12-hour format for display
    const displayHours = hours % 12 || 12;
    const displayPeriod = hours >= 12 ? "PM" : "AM";

    return `${displayHours}:${minutes
      .toString()
      .padStart(2, "0")} ${displayPeriod}`;
  };

  const calculateActualTime = (startingTime: string, deltaSeconds: string) => {
    if (!startingTime || !deltaSeconds) return "N/A";
    // console.log("calculateActualTime - startingTime:", startingTime, "deltaSeconds:", deltaSeconds);

    try {
      // Extract the time part from startingTime (format: "1970-01-01 04:00 am")
      const timePart =
        startingTime.split(" ")[1] + " " + startingTime.split(" ")[2];
      // console.log("timePart:", timePart);

      // Parse the time (04:00 am)
      const [time, period] = timePart.split(" ");
      const [hoursStr, minutesStr] = time.split(":");
      let hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);

      // console.log("Parsed time:", hours, minutes, period);

      // Convert to 24-hour format
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;

      // console.log("24-hour format:", hours, minutes);

      // Calculate total seconds from start of day
      const startSeconds = hours * 3600 + minutes * 60;
      const delta = parseInt(deltaSeconds, 10);
      const totalSeconds = startSeconds + delta;

      // console.log("startSeconds:", startSeconds, "delta:", delta, "totalSeconds:", totalSeconds);

      // Calculate new time
      const newHours = Math.floor(totalSeconds / 3600) % 24;
      const newMinutes = Math.floor((totalSeconds % 3600) / 60);
      const newPeriod = newHours >= 12 ? "PM" : "AM";
      const displayHours = newHours % 12 || 12;

      // Calculate day offset
      const dayOffset = Math.floor(totalSeconds / 86400);

      const result = `${displayHours}:${newMinutes
        .toString()
        .padStart(2, "0")} ${newPeriod} (D${dayOffset + 1})`;
      // console.log("Result:", result);

      return result;
    } catch (e) {
      console.error("Error calculating actual time:", e);
      return "N/A";
    }
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
    showInfoToast("Select landmark from the map");
  };

  const handleLandmarkEditClick = (landmark: RouteLandmark) => {
    // Extract the time part from startingTime (format: "1970-01-01 04:00 am")
    const timePart =
      routeStartingTime.split(" ")[1] + " " + routeStartingTime.split(" ")[2];

    // Parse the time (04:00 am)
    const [time, period] = timePart.split(" ");
    const [hoursStr, minutesStr] = time.split(":");

    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    // Convert to 24-hour format
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    // Calculate total seconds from start of day
    const startSeconds = hours * 3600 + minutes * 60;

    // Calculate arrival time
    const arrivalDelta = parseInt(landmark.arrival_delta || "0", 10);
    const arrivalTotalSeconds = startSeconds + arrivalDelta;
    const arrivalHours = Math.floor(arrivalTotalSeconds / 3600) % 24;
    const arrivalMinutes = Math.floor((arrivalTotalSeconds % 3600) / 60);
    const arrivalPeriod = arrivalHours >= 12 ? "PM" : "AM";
    const displayArrivalHours = arrivalHours % 12 || 12;
    const arrivalDayOffset = Math.floor(arrivalTotalSeconds / 86400);

    // Calculate departure time
    const departureDelta = parseInt(landmark.departure_delta || "0", 10);
    const departureTotalSeconds = startSeconds + departureDelta;
    const departureHours = Math.floor(departureTotalSeconds / 3600) % 24;
    const departureMinutes = Math.floor((departureTotalSeconds % 3600) / 60);
    const departurePeriod = departureHours >= 12 ? "PM" : "AM";
    const displayDepartureHours = departureHours % 12 || 12;
    const departureDayOffset = Math.floor(departureTotalSeconds / 86400);

    setArrivalDayOffset(arrivalDayOffset);
    setDepartureDayOffset(departureDayOffset);

    setArrivalHour(displayArrivalHours);
    setArrivalMinute(arrivalMinutes);
    setArrivalAmPm(arrivalPeriod);

    setDepartureHour(displayDepartureHours);
    setDepartureMinute(departureMinutes);
    setDepartureAmPm(departurePeriod);

    setEditingLandmark(landmark);
  };
  // Initialize the time values when component mounts
  useEffect(() => {
    if (routeStartingTime) {
      // Parse the starting time (it's already in IST format)
      const date = new Date(routeStartingTime);

      // Extract hours and minutes
      let hours = date.getHours();
      const minutes = date.getMinutes();

      // Convert to 12-hour format
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12; // Convert 0, 13-23 to 12, 1-11

      setLocalHour(displayHours);
      setLocalMinute(minutes);
      setAmPm(period);
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
  const convertLocalToUTC = (
    hour: number,
    minute: number,
    period: string,
    dayOffset: number = 0
  ) => {
    let istHour = hour;
    if (period === "PM" && hour !== 12) istHour += 12;
    if (period === "AM" && hour === 12) istHour = 0;

    // Create IST date (Day 0)
    const istDate = new Date(
      Date.UTC(1970, 0, 1 + dayOffset, istHour, minute, 0)
    );

    // Convert IST → UTC
    istDate.setUTCHours(
      istDate.getUTCHours() - 5,
      istDate.getUTCMinutes() - 30
    );

    return {
      utcTime: istDate.toISOString().slice(11, 19) + "Z", // HH:MM:SSZ
    };
  };
  const handleRouteDetailsUpdate = async () => {
    try {
      // Convert local time to UTC time string (HH:MM:SSZ format)
      const { utcTime } = convertLocalToUTC(
        localHour,
        localMinute,
        amPm,
        startingDayOffset
      );

      const formData = new FormData();
      formData.append("id", routeId.toString());
      formData.append("name", updatedRouteName);
      formData.append("start_time", utcTime); // This should be in "HH:MM:SSZ" format

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
      // Parse the starting time (format: "1970-01-01 12:00 am")
      const timePart =
        routeStartingTime.split(" ")[1] + " " + routeStartingTime.split(" ")[2];
      const [time, period] = timePart.split(" ");
      const [startHourStr, startMinuteStr] = time.split(":");

      let startHours = parseInt(startHourStr, 10);
      const startMinutes = parseInt(startMinuteStr, 10);

      // Convert starting time to 24-hour format
      // 12:00 am = 0, 12:00 pm = 12
      if (period === "PM") {
        startHours = startHours === 12 ? 12 : startHours + 12;
      } else if (period === "AM") {
        startHours = startHours === 12 ? 0 : startHours;
      }

      // Calculate total seconds from start of day for starting time
      const startTotalSeconds = startHours * 3600 + startMinutes * 60;

      // Convert selected arrival time to seconds
      let arrivalHours = arrivalHour;
      if (arrivalAmPm === "PM") {
        arrivalHours = arrivalHours === 12 ? 12 : arrivalHours + 12;
      } else if (arrivalAmPm === "AM") {
        arrivalHours = arrivalHours === 12 ? 0 : arrivalHours;
      }
      const arrivalTotalSeconds =
        arrivalHours * 3600 + arrivalMinute * 60 + arrivalDayOffset * 86400;

      // Convert selected departure time to seconds
      let departureHours = departureHour;
      if (departureAmPm === "PM") {
        departureHours = departureHours === 12 ? 12 : departureHours + 12;
      } else if (departureAmPm === "AM") {
        departureHours = departureHours === 12 ? 0 : departureHours;
      }
      const departureTotalSeconds =
        departureHours * 3600 +
        departureMinute * 60 +
        departureDayOffset * 86400;

      // Calculate deltas (difference in seconds from starting time)
      const arrivalDelta = arrivalTotalSeconds - startTotalSeconds;
      const departureDelta = departureTotalSeconds - startTotalSeconds;

      console.log(
        "Starting time:",
        startHours + ":" + startMinutes,
        "Total seconds:",
        startTotalSeconds
      );
      console.log(
        "Arrival time:",
        arrivalHours + ":" + arrivalMinute,
        "Day offset:",
        arrivalDayOffset,
        "Total seconds:",
        arrivalTotalSeconds,
        "Delta:",
        arrivalDelta
      );
      console.log(
        "Departure time:",
        departureHours + ":" + departureMinute,
        "Day offset:",
        departureDayOffset,
        "Total seconds:",
        departureTotalSeconds,
        "Delta:",
        departureDelta
      );

      // Validate that times are after starting time
      if (arrivalDelta <= 0 || departureDelta <= 0) {
        throw new Error(
          "Arrival and departure times must be after the starting time"
        );
      }

      if (arrivalDelta > departureDelta) {
        throw new Error("Departure time must be after arrival time.");
      }
      if (
        editingLandmark?.distance_from_start === undefined ||
        editingLandmark?.distance_from_start === null
      ) {
        setDistanceError(true);
        return;
      }
      setDistanceError(false);

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
      if (error?.status === 422) {
        showErrorToast(
          "Arrival and departure times must be after the starting time."
        );
      } else if (error?.status === 409) {
        showErrorToast("Different landmarks cannot have same distance.");
      } else {
        showErrorToast(error.message || "Failed to add landmark");
      }
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
      <Stack
  direction="row"
  alignItems="center"
  justifyContent="space-between"
  sx={{ mb: 2 }}
>
  {/* Left: Back Button */}
  <Button variant="outlined" onClick={onBack}>
    Back
  </Button>

  {/* Right: Report Icon */}
  {routeStatus === "Invalid" && (
    <Tooltip title="View Route Guidelines">
      <IconButton
        onClick={handleShowRules}
        color="error"
        size="large"
      >
        <ReportIcon />
      </IconButton>
    </Tooltip>
  )}

  {/* Rules Modal */}
  {showRules && (
    <RouteRulesModal
      open={showRules}
      onClose={() => setShowRules(false)}
    />
  )}
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
                label="Route Name"
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
                onClick={handleRouteDetailsUpdate}
                disabled={!!error}
                size="small"
                sx={{
                  minWidth: 80,
                  py: 0.5,
                  backgroundColor: "darkblue",
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
        <Paper
          elevation={3}
          sx={{ p: { xs: 1.5, sm: 3 }, flex: 1, overflow: "auto" }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: { xs: 1, sm: 2 } }}
          >
            <Typography
              variant="h6"
              sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
            >
              Route Landmarks
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              {(canCreateRoutes || canUpdateRoutes) && (
                <Tooltip title="Add New Landmark">
                  <IconButton
                    color="primary"
                    onClick={handleAddClick}
                    size="small"
                  >
                    <AddIcon fontSize="small" />
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
                      py: { xs: 0.75, sm: 1 },
                      px: { xs: 0.5, sm: 1 },
                      backgroundColor: isFirstLandmark
                        ? "#dbf1d9ff"
                        : isLastLandmark
                        ? "#ebcacaff"
                        : index % 2 === 0
                        ? "action.hover"
                        : "background.paper",
                      borderRadius: 1,
                      gap: { xs: 0.75, sm: 1 },
                    }}
                  >
                    <Chip
                      label={index + 1}
                      color="primary"
                      size="small"
                      sx={{
                        minWidth: { xs: 24, sm: 28 },
                        height: { xs: 24, sm: 28 },
                        fontSize: { xs: "0.7rem", sm: "0.75rem" },
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
                          flexDirection: { xs: "column", sm: "row" },
                          justifyContent: "space-between",
                          alignItems: { xs: "flex-start", sm: "center" },
                          gap: { xs: 0.5, sm: 0 },
                        }}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Tooltip
                            title={getLandmarkName(landmark.landmark_id)}
                          >
                            <Typography
                              variant="subtitle2"
                              fontWeight={600}
                              sx={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: { xs: "100%", sm: 120 },
                                fontSize: { xs: "0.8rem", sm: "0.875rem" },
                              }}
                            >
                              {getLandmarkName(landmark.landmark_id)}
                            </Typography>
                          </Tooltip>

                          {landmark.distance_from_start !== undefined && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mt: 0.5,
                                fontSize: { xs: "0.65rem", sm: "0.7rem" },
                                fontWeight: 600,
                                color: "primary.main",
                              }}
                            >
                              <Directions
                                sx={{
                                  fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                  mr: 0.5,
                                }}
                              />
                              {landmark.distance_from_start >= 1000
                                ? `${Math.round(
                                    landmark.distance_from_start / 1000
                                  )}km`
                                : `${landmark.distance_from_start}m`}
                            </Box>
                          )}
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            alignItems: { xs: "flex-start", sm: "center" },
                            gap: { xs: 0.5, sm: 1 },
                            ml: { xs: 0, sm: 2 },
                            minWidth: { xs: "100%", sm: "auto" },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: { xs: "column", sm: "row" },
                              gap: { xs: 0.25, sm: 1 },
                              minWidth: { xs: "100%", sm: 200 },
                              justifyContent: "flex-end",
                            }}
                          >
                            {/* Arrival Time - show for all except first */}
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                minWidth: { xs: "auto", sm: 100 },
                                visibility: isFirstLandmark
                                  ? "hidden"
                                  : "visible",
                                fontSize: { xs: "0.75rem", sm: "0.8rem" },
                                order: { xs: 1, sm: 0 },
                              }}
                            >
                              <ArrowDownward
                                sx={{
                                  fontSize: { xs: "0.7rem", sm: "0.8rem" },
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
                                minWidth: { xs: "auto", sm: 100 },
                                visibility: isLastLandmark
                                  ? "hidden"
                                  : "visible",
                                fontSize: { xs: "0.75rem", sm: "0.8rem" },
                                order: { xs: 2, sm: 0 },
                              }}
                            >
                              <ArrowUpward
                                sx={{
                                  fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                  mr: 0.5,
                                  color: "success.main",
                                }}
                              />
                              <Tooltip title={`Time delta: ${departureDelta}`}>
                                <span>Dep: {departureTime}</span>
                              </Tooltip>
                            </Box>
                          </Box>

                          {/* Action buttons - show for all except first */}
                          <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{
                              ml: { xs: 0, sm: 1 },
                              order: { xs: 0, sm: 1 },
                              alignSelf: { xs: "flex-end", sm: "center" },
                            }}
                          >
                            {(canUpdateRoutes || canCreateRoutes) && (
                              <>
                                <IconButton
                                  onClick={() =>
                                    handleLandmarkEditClick(landmark)
                                  }
                                  aria-label="edit"
                                  color="primary"
                                  size="small"
                                  sx={{
                                    width: { xs: 20, sm: 24 },
                                    height: { xs: 20, sm: 24 },
                                    fontSize: { xs: "0.7rem", sm: "0.875rem" },
                                  }}
                                  disabled={isFirstLandmark}
                                >
                                  <Edit fontSize="inherit" />
                                </IconButton>
                                <IconButton
                                  onClick={() => handleDeleteClick(landmark)}
                                  aria-label="delete"
                                  color="error"
                                  size="small"
                                  sx={{
                                    width: { xs: 20, sm: 24 },
                                    height: { xs: 20, sm: 24 },
                                    fontSize: { xs: "0.7rem", sm: "0.875rem" },
                                  }}
                                  disabled={isFirstLandmark}
                                >
                                  <Delete fontSize="inherit" />
                                </IconButton>
                              </>
                            )}
                          </Stack>
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
                        ml: { xs: 2.5, sm: 3.5 },
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
                      py: { xs: 0.75, sm: 1 },
                      px: { xs: 0.5, sm: 1 },
                      gap: { xs: 0.75, sm: 1 },
                    }}
                  >
                    <Chip
                      label={routeLandmarks.length + index + 1}
                      color="primary"
                      size="small"
                      sx={{
                        minWidth: { xs: 24, sm: 28 },
                        height: { xs: 24, sm: 28 },
                        fontSize: { xs: "0.7rem", sm: "0.75rem" },
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
                          flexDirection: { xs: "column", sm: "row" },
                          justifyContent: "space-between",
                          alignItems: { xs: "flex-start", sm: "center" },
                          gap: { xs: 0.5, sm: 0 },
                        }}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="subtitle2"
                            fontWeight={600}
                            sx={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              fontSize: { xs: "0.8rem", sm: "0.875rem" },
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
                                fontSize: { xs: "0.65rem", sm: "0.7rem" },
                                color: "text.secondary",
                              }}
                            >
                              <Directions
                                sx={{
                                  fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                  mr: 0.5,
                                }}
                              />
                              {landmark.distance_from_start}m
                            </Box>
                          )}
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            alignItems: { xs: "flex-start", sm: "center" },
                            gap: { xs: 0.5, sm: 1 },
                            ml: { xs: 0, sm: 2 },
                            minWidth: { xs: "100%", sm: "auto" },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: { xs: "column", sm: "row" },
                              gap: { xs: 0.25, sm: 1 },
                              minWidth: { xs: "100%", sm: 200 },
                              justifyContent: "flex-end",
                            }}
                          >
                            {/* Arrival Time */}
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                minWidth: { xs: "auto", sm: 100 },
                                visibility: isFirstNewLandmark
                                  ? "hidden"
                                  : "visible",
                                fontSize: { xs: "0.75rem", sm: "0.8rem" },
                                order: { xs: 1, sm: 0 },
                              }}
                            >
                              <ArrowDownward
                                sx={{
                                  fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                  mr: 0.5,
                                  color: "error.main",
                                }}
                              />
                              <span>Arr: {arrivalTime}</span>
                            </Box>

                            {/* Departure Time */}
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                minWidth: { xs: "auto", sm: 100 },
                                visibility: isLastNewLandmark
                                  ? "hidden"
                                  : "visible",
                                fontSize: { xs: "0.75rem", sm: "0.8rem" },
                                order: { xs: 2, sm: 0 },
                              }}
                            >
                              <ArrowUpward
                                sx={{
                                  fontSize: { xs: "0.7rem", sm: "0.8rem" },
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
                              width: { xs: 20, sm: 24 },
                              height: { xs: 20, sm: 24 },
                              backgroundColor: "error.light",
                              fontSize: { xs: "0.7rem", sm: "0.875rem" },
                              "&:hover": {
                                backgroundColor: "error.main",
                                color: "error.contrastText",
                              },
                              alignSelf: { xs: "flex-end", sm: "center" },
                              order: { xs: 0, sm: 1 },
                            }}
                          >
                            <Delete fontSize="inherit" />
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
                        ml: { xs: 2.5, sm: 3.5 },
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
                  For the ending landmark, arrival and departure time must be
                  the same.
                </Alert>
              </Box>

              {/* Distance Field */}
              <TextField
                label="Distance from Start"
                required
                fullWidth
                margin="normal"
                type="number"
                value={
                  editingLandmark.distance_from_start !== undefined &&
                  editingLandmark.distance_from_start !== null
                    ? distanceUnit === "km"
                      ? editingLandmark.distance_from_start / 1000
                      : editingLandmark.distance_from_start
                    : ""
                }
                onChange={(e) => {
                  const value = e.target.value.trim();
                  const numValue = value === "" ? undefined : parseFloat(value);

                  let distanceInMeters =
                    distanceUnit === "km" && numValue !== undefined
                      ? numValue * 1000
                      : numValue;

                  setEditingLandmark({
                    ...editingLandmark,
                    distance_from_start: distanceInMeters,
                  });

                  if (value !== "") setDistanceError(false);
                }}
                error={distanceError}
                helperText={distanceError ? "Distance is required" : ""}
                inputProps={{ min: 0, step: "any" }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Select
                        value={distanceUnit}
                        onChange={(e) =>
                          setDistanceUnit(e.target.value as "m" | "km")
                        }
                        size="small"
                        sx={{
                          "& .MuiSelect-select": { padding: "4px 8px" },
                          "& fieldset": { display: "none" },
                          fontSize: "0.85rem",
                        }}
                        variant="outlined"
                      >
                        <MenuItem value="m">m</MenuItem>
                        <MenuItem value="km">km</MenuItem>
                      </Select>
                    </InputAdornment>
                  ),
                }}
              />

              {/* ARRIVAL TIME */}
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Arrival Time (IST)
              </Typography>
              {/* Day Full Width */}
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Day</InputLabel>
                <Select
                  value={arrivalDayOffset}
                  onChange={(e) => setArrivalDayOffset(Number(e.target.value))}
                  label="Day"
                >
                  {Array.from({ length: 10 }, (_, i) => (
                    <MenuItem key={i} value={i}>{`Day ${i + 1}`}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Hour/Minute/AMPM Row */}
              <Box sx={{ display: "flex", gap: 2 }}>
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

              {/* DEPARTURE TIME */}
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Departure Time (IST)
              </Typography>
              {/* Day Full Width */}
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
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

              {/* Hour/Minute/AMPM Row */}
              <Box sx={{ display: "flex", gap: 2 }}>
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

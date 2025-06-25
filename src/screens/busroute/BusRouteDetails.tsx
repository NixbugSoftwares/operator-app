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
  AccessTime,
  Timer as TimerIcon,
} from "@mui/icons-material";
import {
  busRouteLandmarkListApi,
  landmarkListApi,
  routeLandmarkDeleteApi,
  routeLandmarkUpdationApi,
  routeUpdationApi,
  routeLandmarkCreationApi,
} from "../../slices/appSlice";
import { useAppDispatch } from "../../store/Hooks";
import {
  showErrorToast,
  showSuccessToast,
} from "../../common/toastMessageHelper";
import { Landmark, RouteLandmark, SelectedLandmark } from "../../types/type";

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
  routeManagePermission: boolean;
}

const BusRouteDetailsPage = ({
  routeId,
  routeName,
  routeStartingTime,
  onBack,
  onLandmarksUpdate,
  onEnableAddLandmark,
  onCancelEdit,
  newLandmarks,
  setNewLandmarks,
  refreshList,
  routeManagePermission,
}: BusRouteDetailsProps) => {
  const dispatch = useAppDispatch();
  const [routeLandmarks, setRouteLandmarks] = useState<RouteLandmark[]>([]);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [routeLandmarkToDelete, setRouteLandmarkToDelete] =
    useState<RouteLandmark | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingLandmark, setEditingLandmark] = useState<RouteLandmark | null>(
    null
  );
  const [updatedRouteName, setUpdatedRouteName] = useState(routeName);
  const [localHour, setLocalHour] = useState<number>(12);
  const [localMinute, setLocalMinute] = useState<number>(0);
  const [amPm, setAmPm] = useState<string>("AM");
  const [arrivalHour, setArrivalHour] = useState<number>(12);
  const [arrivalMinute, setArrivalMinute] = useState<number>(0);
  const [arrivalAmPm, setArrivalAmPm] = useState<string>("AM");
  const [departureHour, setDepartureHour] = useState<number>(12);
  const [departureMinute, setDepartureMinute] = useState<number>(0);
  const [departureAmPm, setDepartureAmPm] = useState<string>("AM");
  const [startingDayOffset, _setStartingDayOffset] = useState<number>(0);
  const [arrivalDayOffset, setArrivalDayOffset] = useState<number>(0);
  const [departureDayOffset, setDepartureDayOffset] = useState<number>(0);
  const lastLandmark = routeLandmarks[routeLandmarks.length - 1];

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
      sortedLandmarks.forEach((lm, idx) => {
        console.log(`Landmark #${idx + 1}:`, {
          id: lm.id,
          name: lm.name,
          sequence_id: lm.sequence_id,
          arrival_delta: lm.arrival_delta,
          departure_delta: lm.departure_delta,
          distance_from_start: lm.distance_from_start,
          arrivalTime: lm.arrivalTime,
          departureTime: lm.departureTime,
        });
      });
      setRouteLandmarks(sortedLandmarks);
      updateParentMapLandmarks(sortedLandmarks);
    } catch (error) {
      showErrorToast("Failed to fetch route landmarks");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "N/A";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    let result = "";
    if (h > 0) result += `${h}h `;
    result += `${m}m`;
    return result.trim();
  };
  const totalDurationSeconds = lastLandmark
    ? parseInt(lastLandmark.arrival_delta, 10)
    : 0;
  const totalDuration = formatDuration(totalDurationSeconds);

  function formatTimeForDisplayIST(isoString: string) {
    const date = new Date(isoString);
    // Add 5 hours 30 minutes to UTC to get IST
    date.setUTCHours(date.getUTCHours() + 5, date.getUTCMinutes() + 30);
    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  }

  // Helper function to calculate actual time from starting time and delta seconds
  const calculateActualTime = (startingTime: string, deltaSeconds: string) => {
    if (!startingTime || !deltaSeconds) return "N/A";

    try {
      // Parse starting time as UTC
      let timeString = startingTime;
      if (!timeString.includes("T")) {
        timeString = `1970-01-01T${timeString}`;
      }

      const startDate = new Date(timeString);
      const delta = parseInt(deltaSeconds, 10); // Delta is already in seconds

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

      // Suffix logic for 1st, 2nd, 3rd, etc.
      let suffix = "th";
      if (userDay % 10 === 1 && userDay % 100 !== 11) suffix = "st";
      else if (userDay % 10 === 2 && userDay % 100 !== 12) suffix = "nd";
      else if (userDay % 10 === 3 && userDay % 100 !== 13) suffix = "rd";

      const timeStr = `${displayHours}:${minutes
        .toString()
        .padStart(2, "0")} ${period}`;
      return `${timeStr} (${userDay}${suffix} day)`;
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

  const handleSaveNewLandmarks = async () => {
    try {
      // 1. Parse the starting time properly
      const startTime = routeStartingTime.includes("1970-01-01T")
        ? routeStartingTime.replace("1970-01-01T", "").replace("Z", "")
        : routeStartingTime;

      // 2. Create the start date in UTC
      const [hours, minutes, seconds] = startTime.split(":").map(Number);
      const startDate = new Date(Date.UTC(1970, 0, 1, hours, minutes, seconds));

      // 3. Validate the start date
      if (isNaN(startDate.getTime())) {
        throw new Error("Invalid route starting time format");
      }

      const creationPromises = newLandmarks.map(async (landmark) => {
        // 4. Parse arrival and departure times
        const arrivalDate = new Date(landmark.arrivalTime.fullTime);
        const departureDate = new Date(landmark.departureTime.fullTime);

        // 5. Validate dates
        if (isNaN(arrivalDate.getTime()) || isNaN(departureDate.getTime())) {
          console.error("Invalid date strings:", {
            arrival: landmark.arrivalTime.fullTime,
            departure: landmark.departureTime.fullTime,
          });
          throw new Error("Invalid arrival/departure time format");
        }

        // 6. Calculate deltas in seconds
        const arrivalDelta = Math.floor(
          (arrivalDate.getTime() - startDate.getTime()) / 1000
        );
        const departureDelta = Math.floor(
          (departureDate.getTime() - startDate.getTime()) / 1000
        );

        console.log("Time calculations:", {
          startTime: startDate.toISOString(),
          arrivalTime: arrivalDate.toISOString(),
          departureTime: departureDate.toISOString(),
          arrivalDelta,
          departureDelta,
        });

        const formData = new FormData();
        formData.append("route_id", routeId.toString());
        formData.append("landmark_id", landmark.id.toString());
        formData.append("arrival_delta", arrivalDelta.toString());
        formData.append("departure_delta", departureDelta.toString());
        formData.append(
          "distance_from_start",
          (landmark.distance_from_start || 0).toString()
        );

        return await dispatch(routeLandmarkCreationApi(formData)).unwrap();
      });

      await Promise.all(creationPromises);
      showSuccessToast("New landmarks added successfully");
      setNewLandmarks([]);
      fetchRouteLandmarks();
    } catch (error) {
      console.error("Error adding landmarks:", error);
      showErrorToast(
        error instanceof Error ? error.message : "Failed to add new landmarks"
      );
    }
  };

  const fetchLandmark = () => {
    dispatch(landmarkListApi())
      .unwrap()
      .then((res: any[]) => {
        setLandmarks(res);
      })
      .catch((err: any) => {
        console.error("Error fetching landmarks", err);
      });
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
    fetchLandmark();
  }, [routeId]);

  useEffect(() => {
    return () => {
      onLandmarksUpdate([]);
    };
  }, []);

  const getLandmarkName = (landmarkId: string) => {
    const landmark = landmarks.find((l) => l.id === Number(landmarkId));
    return landmark ? landmark.name : "Unknown Landmark";
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

  const handleEditRoute = () => {
    if (editMode) {
      setEditMode(false);
      onCancelEdit();
    } else {
      setEditMode(true);
      onEnableAddLandmark();
    }
  };
  // Initialize the time values when editMode becomes true
  useEffect(() => {
    if (editMode && routeStartingTime) {
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
  }, [editMode, routeStartingTime]);
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
      formData.append("starting_time", timeString.displayTime + "Z");

      await dispatch(routeUpdationApi({ routeId, formData })).unwrap();
      refreshList("refresh");
      showSuccessToast("Route details updated successfully");
      setEditMode(false);
      onBack();
    } catch (error) {
      showErrorToast("Failed to update route details");
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
    } catch (error) {
      console.error("Update error:", error);
      showErrorToast(
        error instanceof Error ? error.message : "Failed to update landmark"
      );
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
  } catch (error) {
    showErrorToast(
      error instanceof Error ? error.message : "Failed to remove landmark from route"
    );
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
        <Button variant="contained" onClick={onBack}>
          Back to Routes
        </Button>

        <Tooltip
          title={
            !routeManagePermission
              ? "You don't have permission, contact the admin"
              : editMode
              ? "Cancel editing this route"
              : "Edit this route"
          }
          placement="top-end"
        >
          <span
            style={{
              cursor: !routeManagePermission ? "not-allowed" : "pointer",
            }}
          >
            <Button
              variant={editMode ? "outlined" : "contained"}
              onClick={handleEditRoute}
              disabled={!routeManagePermission}
              sx={{
                backgroundColor: !routeManagePermission
                  ? "#6c87b7 !important"
                  : editMode
                  ? "transparent"
                  : "#3f51b5",
                color: !routeManagePermission
                  ? "#ffffff"
                  : editMode
                  ? "#3f51b5"
                  : "white",
                "&.Mui-disabled": {
                  backgroundColor: "#6c87b7 !important",
                  color: "#ffffff99",
                },
                borderColor: editMode ? "#3f51b5" : undefined,
              }}
            >
              {editMode ? "Cancel Edit" : "Edit Route"}
            </Button>
          </span>
        </Tooltip>
        {editMode && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveNewLandmarks}
            disabled={newLandmarks.length === 0}
          >
            Save New Landmarks
          </Button>
        )}
      </Stack>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Stack direction="column" alignItems="center">
          {editMode ? (
            <>
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ mb: 2 }}
              >
                <TextField
                  value={updatedRouteName}
                  onChange={(e) => setUpdatedRouteName(e.target.value)}
                  variant="outlined"
                  size="small"
                  label="Route Name"
                />
                <FormControl size="small" sx={{ minWidth: 80 }}>
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
                <FormControl size="small" sx={{ minWidth: 80 }}>
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
                <FormControl size="small" sx={{ minWidth: 80 }}>
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
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleRouteDetailsUpdate}
                >
                  Save
                </Button>
                <Button variant="outlined" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
              </Stack>
            </>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                mb: 3,
                px: 2,
                py: 2.5,
                borderRadius: 1,
                bgcolor: "background.paper",
                boxShadow: 1,
              }}
            >
              {/* Title Section */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  py: 1,
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: "primary.main",
                    letterSpacing: 0.5,
                  }}
                >
                  {routeName}
                </Typography>
              </Box>

              {/* Info Section */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 2,
                  px: 2,
                }}
              >
                {/* Starting Time */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    minWidth: 200,
                  }}
                >
                  <AccessTime
                    sx={{
                      fontSize: 22,
                      mr: 1.5,
                      color: "text.secondary",
                    }}
                  />
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    Starting:{" "}
                    <Box component="span" sx={{ fontWeight: 600 }}>
                      {formatTimeForDisplayIST(routeStartingTime)}
                    </Box>
                  </Typography>
                </Box>

                {/* Total Duration */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    minWidth: 200,
                  }}
                >
                  <TimerIcon
                    sx={{
                      fontSize: 22,
                      mr: 1.5,
                      color: "text.secondary",
                    }}
                  />
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    Duration:{" "}
                    <Box component="span" sx={{ fontWeight: 600 }}>
                      {totalDuration}
                    </Box>
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
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
          <Typography variant="h6" sx={{ mb: 2 }}>
            Route Landmarks
          </Typography>
          <List sx={{ width: "100%" }}>
            {routeLandmarks.map((landmark, index) => {
              const isFirstLandmark = index === 0;
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
                      py: 2,
                      px: 2,
                      backgroundColor:
                        index % 2 === 0 ? "action.hover" : "background.paper",
                      borderRadius: 1,
                      gap: 2,
                    }}
                  >
                    <Chip
                      label={index + 1}
                      color="primary"
                      sx={{
                        mr: 1,
                        minWidth: 32,
                        height: 32,
                        fontSize: "0.875rem",
                        fontWeight: 600,
                      }}
                    />

                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {getLandmarkName(landmark.landmark_id)}
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          mt: 0.5,
                          flexWrap: "wrap",
                        }}
                      >
                        {landmark.distance_from_start !== undefined && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              backgroundColor: "primary.light",
                              color: "primary.contrastText",
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              fontSize: "0.75rem",
                            }}
                          >
                            <Directions sx={{ fontSize: "1rem", mr: 0.5 }} />
                            {landmark.distance_from_start}m
                          </Box>
                        )}

                        <Box
                          sx={{
                            display: "flex",
                            gap: 1.5,
                            fontSize: "0.8rem",
                            color: "text.secondary",
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <ArrowDownward
                              sx={{
                                fontSize: "1rem",
                                mr: 0.5,
                                color: "error.main",
                              }}
                            />
                            <Tooltip title={`Time delta: ${arrivalDelta}`}>
                              <span>Arrive: {arrivalTime}</span>
                            </Tooltip>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <ArrowUpward
                              sx={{
                                fontSize: "1rem",
                                mr: 0.5,
                                color: "success.main",
                              }}
                            />
                            <Tooltip title={`Time delta: ${departureDelta}`}>
                              <span>Depart: {departureTime}</span>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Box>
                    </Box>

                    {editMode && (
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          onClick={() => handleLandmarkEditClick(landmark)}
                          aria-label="edit"
                          color="primary"
                          size="small"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteClick(landmark)}
                          aria-label="delete"
                          color="error"
                          size="small"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>
                    )}
                  </ListItem>

                  {index < routeLandmarks.length - 1 && (
                    <Divider
                      component="li"
                      sx={{
                        borderLeftWidth: 2,
                        borderLeftStyle: "dashed",
                        borderColor: "divider",
                        height: 20,
                        ml: 4.5,
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

              return (
                <Box key={`new-${landmark.id}-${index}`}>
                  <ListItem
                    sx={{
                      backgroundColor: "#e3f2fd",
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "flex-start",
                      py: 2,
                      px: 2,
                      gap: 2,
                    }}
                  >
                    <Chip
                      label={routeLandmarks.length + index + 1}
                      color="primary"
                      sx={{
                        mr: 1,
                        minWidth: 32,
                        height: 32,
                        fontSize: "0.875rem",
                        fontWeight: 600,
                      }}
                    />

                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {landmark.name || "Unnamed Landmark"}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1.5,
                          fontSize: "0.8rem",
                          color: "text.secondary",
                        }}
                      >
                        {/* Distance display */}
                        {landmark.distance_from_start !== undefined && (
                          <Box
                            sx={
                              {
                                /* your distance display styles */
                              }
                            }
                          >
                            <Directions sx={{ fontSize: "1rem", mr: 0.5 }} />
                            {landmark.distance_from_start}m
                          </Box>
                        )}
                        {/* Arrival time */}
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <ArrowUpward
                            sx={{
                              fontSize: "1rem",
                              mr: 0.5,
                              color: "success.main",
                            }}
                          />
                          <span>Arrive: {arrivalTime}</span>
                        </Box>
                        {/* Departure time */}
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <ArrowDownward
                            sx={{
                              fontSize: "1rem",
                              mr: 0.5,
                              color: "error.main",
                            }}
                          />
                          <span>Depart: {departureTime}</span>
                        </Box>
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
                        backgroundColor: "error.light",
                        "&:hover": {
                          backgroundColor: "error.main",
                          color: "error.contrastText",
                        },
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </ListItem>

                  <Divider
                    component="li"
                    sx={{
                      borderLeftWidth: 2,
                      borderLeftStyle: "dashed",
                      borderColor: "divider",
                      height: 20,
                      ml: 4.5,
                      listStyle: "none",
                    }}
                  />
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
              <Typography>ID: {editingLandmark.id}</Typography>
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
                label="Distance from Start (meters)"
                type="number"
                required
                fullWidth
                margin="normal"
                value={editingLandmark.distance_from_start || ""}
                onChange={(e) =>
                  setEditingLandmark({
                    ...editingLandmark,
                    distance_from_start: parseFloat(e.target.value),
                  })
                }
                disabled={editingLandmark.distance_from_start === 0}
                InputProps={{
                  readOnly: editingLandmark.distance_from_start === 0,
                }}
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

      {/* sectionfor add ne landmark move to dummy data page */}
    </Box>
  );
};

export default BusRouteDetailsPage;

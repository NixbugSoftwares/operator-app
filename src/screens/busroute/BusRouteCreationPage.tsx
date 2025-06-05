import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  Divider,
  Chip,
  TextField,
  Button,
  Stack,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DirectionsIcon from "@mui/icons-material/Directions";
import {
  routeCreationApi,
  routeLandmarkCreationApi,
} from "../../slices/appSlice";
import { useAppDispatch } from "../../store/Hooks";
import { useForm, SubmitHandler } from "react-hook-form";
import {
  showErrorToast,
  showSuccessToast,
} from "../../common/toastMessageHelper";
import { SelectedLandmark } from "../../types/type";

interface BusRouteCreationProps {
  landmarks: SelectedLandmark[];
  onLandmarkRemove: (id: number) => void;
  onSuccess: () => void;
  onCancel: () => void;
  onClearRoute?: () => void;
  mapRef: React.RefObject<any>;
  onStartingTimeChange: (time: string) => void;
}

interface BusRouteFormInputs {
  name: string;
  starting_time: string;
}

const BusRouteCreation = ({
  landmarks,
  onLandmarkRemove,
  onSuccess,
  onCancel,
  onClearRoute,
  mapRef,
  onStartingTimeChange,
}: BusRouteCreationProps) => {
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localHour, setLocalHour] = useState<number>(12);
  const [localMinute, setLocalMinute] = useState<number>(30);
  const [amPm, setAmPm] = useState<string>("AM");
  const [isAddingLandmark, setIsAddingLandmark] = useState(false);
  const [startingDayOffset] = useState(0);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BusRouteFormInputs>();

  // Convert local time to UTC time string
  const convertLocalToUTC = (
    hour: number,
    minute: number,
    period: string,
    dayOffset: number = 0
  ) => {
    let utcHour = hour;
    if (period === "PM" && hour !== 12) {
      utcHour += 12;
    } else if (period === "AM" && hour === 12) {
      utcHour = 0;
    }

    const utcTime = new Date(
      Date.UTC(1970, 0, 1 + dayOffset, utcHour, minute, 0)
    );

    return {
      displayTime: utcTime.toISOString().slice(11, 19),
      fullTime: utcTime.toISOString(),
      dayOffset,
      timestamp: utcTime.getTime(),
    };
  };

  const calculateTimeDeltas = (
    startingTime: string,
    landmarks: SelectedLandmark[],
    timeType: "arrival" | "departure"
  ) => {
    const startTimeStr = startingTime.endsWith("Z")
      ? startingTime.slice(0, -1)
      : startingTime;
    const [startH, startM, startS] = startTimeStr.split(":").map(Number);
    const startDate = new Date(Date.UTC(1970, 0, 1, startH, startM, startS));

    return landmarks.map((landmark) => {
      const timeObj =
        timeType === "arrival" ? landmark.arrivalTime : landmark.departureTime;
      const landmarkDate = new Date(timeObj.fullTime);
      const deltaSeconds =
        (landmarkDate.getTime() - startDate.getTime()) / 1000;
      return Math.max(0, Math.floor(deltaSeconds));
    });
  };

  useEffect(() => {
    const { displayTime } = convertLocalToUTC(
      localHour,
      localMinute,
      amPm,
      startingDayOffset
    );
    const fullTime = displayTime + "Z";
    setValue("starting_time", fullTime);
    onStartingTimeChange(fullTime); // Notify parent component
  }, [
    localHour,
    localMinute,
    amPm,
    startingDayOffset,
    setValue,
    onStartingTimeChange,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (mapRef.current?.isAddingLandmark !== undefined) {
        setIsAddingLandmark(mapRef.current.isAddingLandmark);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [mapRef]);

  const handleRouteCreation: SubmitHandler<BusRouteFormInputs> = async (
    data
  ) => {
   

    setIsSubmitting(true);

    try {
      const routeFormData = new FormData();
      routeFormData.append("name", data.name);
      routeFormData.append("starting_time", data.starting_time);

      const routeResponse = await dispatch(
        routeCreationApi(routeFormData)
      ).unwrap();
      const routeId = routeResponse.id;

      const sortedLandmarks = [...landmarks].sort(
        (a, b) => (a.distance_from_start || 0) - (b.distance_from_start || 0)
      );

      // Calculate deltas using the new function
      const arrivalDeltas = calculateTimeDeltas(
        data.starting_time,
        sortedLandmarks,
        "arrival"
      );
      const departureDeltas = calculateTimeDeltas(
        data.starting_time,
        sortedLandmarks,
        "departure"
      );

      console.log("Starting time:", data.starting_time);
      console.log("Arrival deltas:", arrivalDeltas);
      console.log("Departure deltas:", departureDeltas);

      const landmarkPromises = sortedLandmarks.map((landmark, index) => {
        const landmarkFormData = new FormData();
        landmarkFormData.append("route_id", routeId.toString());
        landmarkFormData.append("landmark_id", landmark.id.toString());
        landmarkFormData.append("sequence_id", (index + 1).toString());
        landmarkFormData.append(
          "distance_from_start",
          landmark.distance_from_start?.toString() || "0"
        );

        landmarkFormData.append(
          "arrival_delta",
          arrivalDeltas[index].toString()
        );
        landmarkFormData.append(
          "departure_delta",
          departureDeltas[index].toString()
        );

        return dispatch(routeLandmarkCreationApi(landmarkFormData)).unwrap();
      });

      await Promise.all(landmarkPromises);
      showSuccessToast("Route and landmarks created successfully");
      reset();
      onSuccess();
      if (onClearRoute) onClearRoute();
    } catch (error) {
      console.error("Error in route creation process:", error);
      showErrorToast(
        error instanceof Error
          ? error.message
          : "Failed to create route and landmarks"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeForDisplay = (isoString: string) => {
    const date = new Date(isoString);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        width: "100%",
        height: "100vh",
        gap: 2,
        p: 2,
        boxSizing: "border-box",
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit(handleRouteCreation)}
        sx={{
          flex: { xs: "0 0 100%", md: "100%" },
          maxWidth: { xs: "100%", md: "100%" },
          height: "100%",
          transition: "all 0.3s ease",
          overflow: "hidden",
          overflowY: "auto",
          backgroundColor: "background.paper",
          borderRadius: 2,
          boxShadow: 2,
          p: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Route Creation
        </Typography>

        <TextField
          margin="normal"
          required
          fullWidth
          label="Route Name"
          {...register("name", { required: "Route name is required" })}
          error={!!errors.name}
          helperText={errors.name?.message}
          autoFocus
          size="small"
        />

        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
          Starting Time (IST)
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          {/* Starting Day Offset - fixed to Day 0 */}
          <FormControl fullWidth size="small">
            <InputLabel>Starting Day Offset</InputLabel>
            <Select
              value={0} // hardcoded to Day 0
              label="Starting Day Offset"
              disabled // disables dropdown interaction
            >
              <MenuItem value={0}>Day 1</MenuItem>
            </Select>
          </FormControl>

          {/* Hour */}
          <FormControl fullWidth size="small">
            <InputLabel>Hour</InputLabel>
            <Select
              value={localHour}
              onChange={(e) => setLocalHour(Number(e.target.value))}
              label="Hour"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <MenuItem key={h} value={h}>
                  {h.toString().padStart(2, "0")}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Minute */}
          <FormControl fullWidth size="small">
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

          {/* AM/PM */}
          <FormControl fullWidth size="small">
            <InputLabel>AM/PM</InputLabel>
            <Select
              value={amPm}
              onChange={(e) => setAmPm(e.target.value as string)}
              label="AM/PM"
            >
              <MenuItem value="AM">AM</MenuItem>
              <MenuItem value="PM">PM</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Button
          variant={isAddingLandmark ? "outlined" : "contained"}
          color={isAddingLandmark ? "error" : "primary"}
          sx={{ mt: 2, mb: 2 }}
          disabled={!localHour && !localMinute}
          onClick={() => {
            mapRef.current?.toggleAddLandmarkMode();
            setIsAddingLandmark((prev) => !prev);
          }}
        >
          {isAddingLandmark ? "Cancel" : "Add Landmark"}
        </Button>

        <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
          Route Landmarks
        </Typography>

        {landmarks.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              p: 4,
              backgroundColor: "action.hover",
              borderRadius: 1,
              my: 2,
            }}
          >
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              No landmarks selected yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please select landmarks from the map to create your route
            </Typography>
          </Box>
        ) : (
          <List
            sx={{ width: "100%", maxHeight: 400, overflow: "auto", flex: 1 }}
          >
            {landmarks
              .slice()
              .sort(
                (a, b) =>
                  (a.distance_from_start || 0) - (b.distance_from_start || 0)
              )
              .map((landmark, index) => (
                <Box key={`${landmark.id}-${index}`}>
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
                        {landmark.name}
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
                            <DirectionsIcon
                              sx={{ fontSize: "1rem", mr: 0.5 }}
                            />
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
                            <ArrowDownwardIcon
                              sx={{
                                fontSize: "1rem",
                                mr: 0.5,
                                color: "error.main",
                              }}
                            />
                            <span>
                              Arrive:{" "}
                              {formatTimeForDisplay(
                                landmark.arrivalTime.fullTime
                              )}
                            </span>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <ArrowUpwardIcon
                              sx={{
                                fontSize: "1rem",
                                mr: 0.5,
                                color: "success.main",
                              }}
                            />
                            <span>
                              Depart:{" "}
                              {formatTimeForDisplay(
                                landmark.departureTime.fullTime
                              )}
                            </span>
                          </Box>
                        </Box>
                      </Box>
                    </Box>

                    <IconButton
                      onClick={() => onLandmarkRemove(landmark.id)}
                      aria-label="delete"
                      color="error"
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItem>

                  {index < landmarks.length - 1 && (
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
              ))}
          </List>
        )}

        <Box sx={{ mt: "auto", pt: 2 }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="outlined" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={landmarks.length === 0 || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Route"}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default BusRouteCreation;

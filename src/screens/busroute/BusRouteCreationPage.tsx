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
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DirectionsIcon from "@mui/icons-material/Directions";
import HelpIcon from "@mui/icons-material/Help";
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
import RouteRulesModal from "./RouteRules";
interface BusRouteCreationProps {
  landmarks: SelectedLandmark[];
  onLandmarkRemove: (id: number) => void;
  onSuccess: () => void;
  onCancel: () => void;
  onClearRoute?: () => void;
  mapRef: React.RefObject<any>;
  onStartingTimeChange: (time: string) => void;
  refreshList: (value: any) => void;
  onClose?: () => void;
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
  refreshList,
  onClose,
}: BusRouteCreationProps) => {
  console.log("landmarks.......", landmarks);

  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localHour, setLocalHour] = useState<number>(6);
  const [localMinute, setLocalMinute] = useState<number>(0);
  const [amPm, setAmPm] = useState<string>("AM");
  const [startingDayOffset] = useState(0);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BusRouteFormInputs>();
  const [showRules, setShowRules] = useState(false);
  // Convert local time to UTC time string
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

  const convertLocalToISTBaseDate = (
    hour: number,
    minute: number,
    period: string,
    dayOffset: number = 0
  ): string => {
    let istHour = hour;
    if (period === "PM" && hour !== 12) istHour += 12;
    if (period === "AM" && hour === 12) istHour = 0;

    // Build IST Date
    const istDate = new Date(1970, 0, 1 + dayOffset, istHour, minute, 0);

    // Format as "1970-01-01 hh:mm AM/PM"
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    };
    const formattedTime = istDate.toLocaleTimeString("en-IN", options);
    return `1970-01-01 ${formattedTime}`;
  };

  useEffect(() => {
    // 1. Keep UTC time for saving to DB
    const { utcTime } = convertLocalToUTC(
      localHour,
      localMinute,
      amPm,
      startingDayOffset
    );
    setValue("starting_time", utcTime);
    console.log("utcTime startime........", utcTime);

    // 2. Send IST (base date 1970-01-01) to Map Component
    const istBaseDate = convertLocalToISTBaseDate(
      localHour,
      localMinute,
      amPm,
      startingDayOffset
    );
    onStartingTimeChange(istBaseDate);
  }, [
    localHour,
    localMinute,
    amPm,
    startingDayOffset,
    setValue,
    onStartingTimeChange,
  ]);
  const handleRouteCreation: SubmitHandler<BusRouteFormInputs> = async (
    data
  ) => {
    setIsSubmitting(true);

    try {
      // 1. Create the route
      const routeFormData = new FormData();
      routeFormData.append("name", data.name);
      routeFormData.append("start_time", data.starting_time);
      console.log("📦 FormData being sent:");
      for (const [key, value] of routeFormData.entries()) {
        console.log(`${key}: ${value}`);
      }
      const routeResponse = await dispatch(
        routeCreationApi(routeFormData)
      ).unwrap();
      const routeId = routeResponse.id;

      // 2. Assume landmarks already have correct arrival/departure deltas
      const sortedLandmarks = [...landmarks].sort(
        (a, b) => (a.distance_from_start || 0) - (b.distance_from_start || 0)
      );

      // 3. Validate landmarks
      const invalidLandmarks: { index: number; name: string; error: string }[] =
        [];
      sortedLandmarks.forEach((landmark, index) => {
        if (index > 0) {
          if ((landmark.arrival_delta ?? 0) < 0) {
            invalidLandmarks.push({
              index,
              name: landmark.name,
              error: "Arrival time cannot be before route start time",
            });
            return;
          }

          if (
            index < sortedLandmarks.length - 1 &&
            (landmark.departure_delta ?? 0) < (landmark.arrival_delta ?? 0)
          ) {
            invalidLandmarks.push({
              index,
              name: landmark.name,
              error: "Departure time must be after arrival time",
            });
          }
        }
      });

      // 4. Prepare valid landmarks for creation
      const validLandmarkPromises = sortedLandmarks
        .map((landmark, index) => {
          if (invalidLandmarks.some((lm) => lm.index === index)) return null;

          const landmarkFormData = new FormData();
          landmarkFormData.append("route_id", routeId.toString());
          landmarkFormData.append("landmark_id", landmark.id.toString());
          landmarkFormData.append(
            "distance_from_start",
            landmark.distance_from_start?.toString() || "0"
          );
          landmarkFormData.append(
            "arrival_delta",
            landmark.arrival_delta?.toString() || "0"
          );
          landmarkFormData.append(
            "departure_delta",
            landmark.departure_delta?.toString() || "0"
          );
          for (const [key, value] of landmarkFormData.entries()) {
            console.log(`${key}: ${value}`);
          }
          return dispatch(routeLandmarkCreationApi(landmarkFormData)).unwrap();
        })
        .filter(Boolean);

      await Promise.all(validLandmarkPromises);

      // 5. Notify user
      if (invalidLandmarks.length > 0) {
        const invalidNames = invalidLandmarks.map((lm) => lm.name).join(", ");
        showSuccessToast(
          `Route created, but some landmarks were skipped: ${invalidNames}`
        );
      } else {
        showSuccessToast("Route and all landmarks created successfully");
      }

      // 6. Cleanup
      refreshList("refresh");
      onSuccess();
      if (onClearRoute) onClearRoute();
      if (
        mapRef.current?.toggleAddLandmarkMode &&
        mapRef.current.isAddingLandmark
      ) {
        mapRef.current.toggleAddLandmarkMode();
      }
      if (onClose) onClose();
    } catch (error: any) {
      console.error("Error in route creation process:", error);

      if (error.message.includes("conflict")) {
        showErrorToast(
          "Route was created but there was an issue adding landmarks. Please check the route details."
        );
        refreshList("refresh");
        onSuccess();
        if (onClose) onClose();
      } else {
        if (error.status === 409) {
                showErrorToast("Route already exists");
              } else {
                showErrorToast(error.message || "Route creation failed");
              }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  function formatTimeForDisplayIST(isoString: string, showDayLabel = true) {
    const date = new Date(isoString);
    date.setTime(date.getTime() + (5 * 60 + 30) * 60 * 1000);
    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;

    const dayOffset = Math.floor(
      (date.getTime() - Date.UTC(1970, 0, 1)) / (86400 * 1000)
    );
    const userDay = dayOffset + 1;

    let suffix = "th";
    if (userDay % 10 === 1 && userDay % 100 !== 11) suffix = "st";
    else if (userDay % 10 === 2 && userDay % 100 !== 12) suffix = "nd";
    else if (userDay % 10 === 3 && userDay % 100 !== 13) suffix = "rd";

    const timeStr = `${displayHours}:${minutes
      .toString()
      .padStart(2, "0")} ${period}`;
    if (showDayLabel) {
      return `${timeStr} (${userDay}${suffix} day)`;
    }
    return timeStr;
  }

  const handleShowRules = () => {
    setShowRules(true);
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
          backgroundColor: "background.paper",
          borderRadius: 2,
          boxShadow: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Sticky Header */}
        <Box
          sx={{
            flexShrink: 0,
            position: "sticky",
            top: 0,
            zIndex: 10,
            backgroundColor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Route Creation</Typography>
          <Tooltip title="Route Creation Guidelines">
            <IconButton onClick={handleShowRules} color="primary" size="large">
              <HelpIcon />
            </IconButton>
          </Tooltip>
          {showRules && (
            <RouteRulesModal
              open={showRules}
              onClose={() => setShowRules(false)}
            />
          )}
        </Box>

        {/* Content Area (scrollable) */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 2,
          }}
        >
          <TextField
            margin="normal"
            fullWidth
            label="Route Name"
            {...register("name", {
              required: "Route name is required",
              validate: (value) => {
                if (value.trim() === "") return "Route name is required";
                if (/^\s|\s$/.test(value))
                  return "No leading or trailing spaces allowed";
                if (/\s{2,}/.test(value))
                  return "Consecutive spaces are not allowed";
                return true;
              },
            })}
            error={!!errors.name}
            helperText={errors.name?.message}
            autoFocus
            size="small"
          />

          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            Starting Time (IST)
          </Typography>
          <Tooltip
            title={
              landmarks.length > 0
                ? "Remove all landmarks to change starting time"
                : ""
            }
          >
            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              {/* Hour */}
              <FormControl
                fullWidth
                size="small"
                disabled={landmarks.length > 0}
              >
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
              <FormControl
                fullWidth
                size="small"
                disabled={landmarks.length > 0}
              >
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
              <FormControl
                fullWidth
                size="small"
                disabled={landmarks.length > 0}
              >
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
          </Tooltip>

          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
            Route Landmark List
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
                p: { xs: 2, sm: 4 },
                backgroundColor: "action.hover",
                borderRadius: 1,
                border: "1px dashed",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 1, fontWeight: 500 }}
              >
                No landmarks selected
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please select landmarks from the map to create your route
              </Typography>
            </Box>
          ) : (
            <List sx={{ width: "100%" }}>
              {/* landmark items (your existing map rendering code) */}
              {landmarks
                .slice()
                .sort(
                  (a, b) =>
                    (a.distance_from_start || 0) - (b.distance_from_start || 0)
                )
                .map((landmark, index) => {
                  const isFirstLandmark = index === 0;
                  const isLastLandmark = index === landmarks.length - 1;

                  return (
                    <Box key={`${landmark.id}-${index}`}>
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

                        <Box sx={{ flex: 1, minWidth: 0 }}>
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
                                {landmark.name}
                              </Typography>

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
                                  <DirectionsIcon
                                    sx={{
                                      fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                      mr: 0.5,
                                    }}
                                  />
                                  {landmark.distance_from_start >= 1000
                                    ? `${(
                                        landmark.distance_from_start / 1000
                                      ).toFixed(1)}km`
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
                                  <ArrowDownwardIcon
                                    sx={{
                                      fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                      mr: 0.5,
                                      color: "error.main",
                                    }}
                                  />
                                  <span>
                                    Arr:{" "}
                                    {formatTimeForDisplayIST(
                                      landmark.arrivalTime.fullTime
                                    )}
                                  </span>
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
                                  <ArrowUpwardIcon
                                    sx={{
                                      fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                      mr: 0.5,
                                      color: "success.main",
                                    }}
                                  />
                                  <span>
                                    Dep:{" "}
                                    {formatTimeForDisplayIST(
                                      landmark.departureTime.fullTime
                                    )}
                                  </span>
                                </Box>
                              </Box>

                              <IconButton
                                onClick={() => onLandmarkRemove(landmark.id)}
                                aria-label="delete"
                                color="error"
                                size="large"
                                sx={{
                                  width: { xs: 32, sm: 40 },
                                  height: { xs: 32, sm: 40 },
                                  fontSize: { xs: "1.2rem", sm: "1.5rem" },
                                  alignSelf: { xs: "flex-end", sm: "center" },
                                  order: { xs: 0, sm: 1 },
                                }}
                              >
                                <DeleteIcon fontSize="inherit" />
                              </IconButton>
                            </Box>
                          </Box>
                        </Box>
                      </ListItem>

                      {index < landmarks.length - 1 && (
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
          )}
        </Box>

        {/* Sticky Footer */}
        <Box
          sx={{
            flexShrink: 0,
            borderTop: "1px solid",
            borderColor: "divider",
            p: 2,
            backgroundColor: "background.paper",
            position: "sticky",
            bottom: 0,
          }}
        >
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="outlined" onClick={onCancel}>
              Cancel
            </Button>

            <Tooltip
              title={
                landmarks.length < 2
                  ? "At least 2 landmarks are required to create a route"
                  : ""
              }
              arrow
            >
              <span>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={landmarks.length < 2 || isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Route"}
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default BusRouteCreation;

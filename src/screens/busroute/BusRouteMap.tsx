import React, { useEffect, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { OSM, XYZ } from "ol/source";
import { Select as OlSelect } from "ol/interaction";
import { Polygon, LineString } from "ol/geom";
import { fromLonLat, toLonLat } from "ol/proj";
import { Vector as VectorSource } from "ol/source";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Tooltip,
  Typography,
  Alert,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Refresh } from "@mui/icons-material";
import { showErrorToast } from "../../common/toastMessageHelper";
import { landmarkListApi } from "../../slices/appSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../store/Store";
import { Style, Stroke, Fill, Circle } from "ol/style";
import { Coordinate } from "ol/coordinate";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { getCenter } from "ol/extent";
import Text from "ol/style/Text";
import { Landmark, SelectedLandmark } from "../../types/type";

interface MapComponentProps {
  onAddLandmark: (landmark: SelectedLandmark) => void;
  onClearRoute?: () => void;
  landmarks: SelectedLandmark[];
  selectedLandmarks: SelectedLandmark[];
  mode: "create" | "view" | "edit";
  isEditing?: boolean;
  startingTime?: string;
  isNewRoute?: boolean;
}

const MapComponent = React.forwardRef(
  (
    {
      onAddLandmark,
      landmarks: propLandmarks,
      mode,
      isEditing,
      selectedLandmarks,
      startingTime,
    }: MapComponentProps,
    ref
  ) => {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const allBoundariesSource = useRef(new VectorSource());
    const selectedLandmarksSource = useRef(new VectorSource());
    const routePathSource = useRef(new VectorSource());
    const mapInstance = useRef<Map | null>(null);
    const dispatch = useDispatch<AppDispatch>();
    const [mapType, setMapType] = useState<"osm" | "satellite" | "hybrid">(
      "osm"
    );
    const [mousePosition, setMousePosition] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [landmarks, setLandmarks] = useState<Landmark[]>([]);
    const [showAllBoundaries, setShowAllBoundaries] = useState(false);
    const [selectedLandmark, setSelectedLandmark] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddingLandmark, setIsAddingLandmark] = useState(false);
    const selectInteractionRef = useRef<OlSelect | null>(null);
    const routeCoordsRef = useRef<Coordinate[]>([]);
    // Time selection states
    const [arrivalHour, setArrivalHour] = useState<number>(12);
    const [arrivalMinute, setArrivalMinute] = useState<number>(30);
    const [arrivalAmPm, setArrivalAmPm] = useState<string>("AM");
    const [departureHour, setDepartureHour] = useState<number>(12);
    const [departureMinute, setDepartureMinute] = useState<number>(30);
    const [departureAmPm, setDepartureAmPm] = useState<string>("AM");
    const [arrivalDayOffset, setArrivalDayOffset] = useState<number>(0);
    const [departureDayOffset, setDepartureDayOffset] = useState<number>(0);
    const [isFirstLandmark, setIsFirstLandmark] = useState(false);
    const [showTimeError, setShowTimeError] = useState<string>("");
    const [distanceError, setDistanceError] = useState<string>("");
    // Initialize the map
    const initializeMap = () => {
      if (!mapRef.current) return null;

      const map = new Map({
        controls: [],
        layers: [
          new TileLayer({ source: new OSM() }),
          new VectorLayer({
            source: allBoundariesSource.current,
            zIndex: 1,
          }),
          new VectorLayer({
            source: selectedLandmarksSource.current,
            zIndex: 2,
          }),
          new VectorLayer({
            source: routePathSource.current,
            zIndex: 3,
          }),
        ],
        target: mapRef.current,
        view: new View({
          center: fromLonLat([76.9366, 8.5241]),
          zoom: 10,
          minZoom: 3,
          maxZoom: 18,
        }),
      });

      map.on("pointermove", (event) => {
        const coords = toLonLat(event.coordinate);
        setMousePosition(`${coords[0].toFixed(7)}, ${coords[1].toFixed(7)}`);
      });

      return map;
    };
    useEffect(() => {
      if (!mapInstance.current) {
        mapInstance.current = initializeMap();
      }
    }, []);
    useEffect(() => {
  if (!mapInstance.current) return;

  const map = mapInstance.current;

  const handleMoveEnd = () => {
    const centerRaw = map.getView().getCenter();
    if (!centerRaw) return;
    const center = toLonLat(centerRaw);
    const [lon, lat] = center;
    const locationaskey = `POINT(${lon} ${lat})`;
    fetchLandmark(locationaskey);
  };

  map.on("moveend", handleMoveEnd);

  // Initial fetch
  handleMoveEnd();

  return () => {
    map.un("moveend", handleMoveEnd);
  };
}, []);
const fetchLandmark = (locationaskey: string) => {
  dispatch(landmarkListApi({location:locationaskey, status:2 }))
    .unwrap()
    .then((res) => {
      const formattedLandmarks = res.data.map((landmark: any) => ({
        id: landmark.id,
        name: landmark.name,
        boundary: extractRawPoints(landmark.boundary),
        importance:
          landmark.importance === 1
            ? "Low"
            : landmark.importance === 2
            ? "Medium"
            : "High",
        status: landmark.status === 1 ? "Validating" : "Verified",
      }));
      setLandmarks(formattedLandmarks);
    })
    .catch((err: any) => {
      showErrorToast(err);
    });
};

    const handleViewModeLandmarks = () => {
      selectedLandmarksSource.current.clear();
      routePathSource.current.clear();
      routeCoordsRef.current = [];

      if (!propLandmarks || propLandmarks.length === 0) {
        return;
      }

      const sortedLandmarks = [...propLandmarks].sort(
        (a, b) => (a.distance_from_start || 0) - (b.distance_from_start || 0)
      );

      sortedLandmarks.forEach((landmark, index) => {
        const lm = landmarks.find((l) => l.id === landmark.id);
        if (lm?.boundary) {
          try {
            const coordinates = lm.boundary
              .split(",")
              .map((coord: string) => coord.trim().split(" ").map(Number))
              .map((coord: Coordinate) => fromLonLat(coord));

            const polygon = new Polygon([coordinates]);
            const feature = new Feature(polygon);
            feature.set("id", lm.id);

            feature.setStyle(
              new Style({
                stroke: new Stroke({
                  color: "rgba(0, 150, 0, 0.7)",
                  width: 2,
                }),
                fill: new Fill({
                  color: "rgba(0, 150, 0, 0.1)",
                }),
                text: new Text({
                  text: (index + 1).toString(),
                  font: "bold 14px Arial",
                  fill: new Fill({ color: "#fff" }),
                  stroke: new Stroke({ color: "#000", width: 3 }),
                  offsetY: -20,
                }),
              })
            );

            selectedLandmarksSource.current.addFeature(feature);

            const center = getCenter(polygon.getExtent());
            routeCoordsRef.current.push(center);
          } catch (error) {
            console.error("Error processing landmark boundary:", error);
          }
        }
      });

      if (routeCoordsRef.current.length > 1) {
        const routeFeature = new Feature({
          geometry: new LineString(routeCoordsRef.current),
        });

        routeFeature.setStyle(
          new Style({
            stroke: new Stroke({
              color: "rgba(218, 29, 16, 0.7)",
              width: 3,
            }),
          })
        );

        routePathSource.current.addFeature(routeFeature);
      }

      if (routeCoordsRef.current.length > 0 && mapInstance.current) {
        const extent = selectedLandmarksSource.current.getExtent();
        mapInstance.current.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          duration: 1000,
        });
      }
    };
    useEffect(() => {
      if (mode === "view") {
        handleViewModeLandmarks();
      }
    }, [propLandmarks, mode]);

    useEffect(() => {
      if (isEditing !== undefined) {
        setIsAddingLandmark(isEditing);
        setShowAllBoundaries(isEditing);
      }
    }, [isEditing]);

    useEffect(() => {
      if (!mapInstance.current) return;

      const layers = mapInstance.current.getLayers().getArray();
      const allBoundariesLayer =
        layers[1] instanceof VectorLayer ? layers[1] : null;

      if (!allBoundariesLayer) return;

      if (isAddingLandmark) {
        if (selectInteractionRef.current) {
          mapInstance.current.removeInteraction(selectInteractionRef.current);
        }
        const selectInteraction = new OlSelect({
          layers: [allBoundariesLayer],
        });

        selectInteraction.on("select", (e) => {
          const selectedFeature = e.selected[0];
          if (selectedFeature) {
            const landmarkId = selectedFeature.get("id");
            const landmark = landmarks.find((lm) => lm.id === landmarkId);

            if (landmark) {
              setSelectedLandmark({
                id: landmark.id,
                name: landmark.name,
                distance_from_start:
                  selectedLandmarks.length === 0
                    ? 0
                    : Math.max(
                        ...selectedLandmarks.map(
                          (l) => l.distance_from_start || 0
                        )
                      ) + 100,
              });
              setIsModalOpen(true);
            }
          }
          selectInteraction.getFeatures().clear();
        });

        mapInstance.current.addInteraction(selectInteraction);
        selectInteractionRef.current = selectInteraction;
      } else {
        if (selectInteractionRef.current) {
          mapInstance.current.removeInteraction(selectInteractionRef.current);
          selectInteractionRef.current = null;
        }
      }

      return () => {
        if (selectInteractionRef.current) {
          mapInstance.current?.removeInteraction(selectInteractionRef.current);
        }
      };
    }, [isAddingLandmark, landmarks]);

    const extractRawPoints = (polygonString: string): string => {
      if (!polygonString) return "";
      const matches = polygonString.match(/\(\((.*?)\)\)/);
      return matches ? matches[1] : "";
    };



    useEffect(() => {
      if (!mapInstance.current) return;

      allBoundariesSource.current.clear();
      const features: Feature[] = [];

      if (showAllBoundaries && landmarks) {
        landmarks.forEach((landmark) => {
          if (landmark.boundary) {
            try {
              const coordinates = landmark.boundary
                .split(",")
                .map((coord: string) => coord.trim().split(" ").map(Number))
                .map((coord: Coordinate) => fromLonLat(coord));

              const polygon = new Polygon([coordinates]);
              const feature = new Feature(polygon);
              feature.set("id", landmark.id);
              feature.setStyle(
                new Style({
                  stroke: new Stroke({
                    color: "rgba(0, 0, 255, 0.7)",
                    width: 2,
                  }),
                  fill: new Fill({
                    color: "rgba(0, 0, 255, 0.1)",
                  }),
                  text: new Text({
                    text: landmark.name,
                    font: "bold 14px Arial",
                    fill: new Fill({ color: "#000" }),
                    stroke: new Stroke({ color: "#fff", width: 2 }),
                    offsetY: -30,
                    textAlign: "center",
                  }),
                })
              );
              features.push(feature);
            } catch (error) {
              console.error(`Error processing landmark ${landmark.id}:`, error);
            }
          }
        });
      }

      if (features.length > 0) {
        allBoundariesSource.current.addFeatures(features);
        // const extent = allBoundariesSource.current.getExtent();
        // if (extent[0] !== Infinity) {
        //   mapInstance.current.getView().fit(extent, {
        //     padding: [50, 50, 50, 50],
        //     duration: 1000,
        //   });
        // }
      }
    }, [showAllBoundaries, landmarks]);

    const handleSearch = async () => {
      if (!searchQuery || !mapInstance.current) return;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}`
        );
        const data = await response.json();

        if (data.length > 0) {
          const { lat, lon } = data[0];
          const coordinates = fromLonLat([parseFloat(lon), parseFloat(lat)]);
          mapInstance.current.getView().animate({
            center: coordinates,
            zoom: 14,
          });
        } else {
          showErrorToast("Location not found.");
        }
      } catch (error: any) {
        showErrorToast(error);
      }
    };

    const changeMapType = (type: "osm" | "satellite" | "hybrid") => {
      if (!mapInstance.current) return;

      const baseLayer = mapInstance.current
        .getLayers()
        .getArray()
        .find((layer) => layer instanceof TileLayer) as TileLayer;

      if (baseLayer) {
        switch (type) {
          case "osm":
            baseLayer.setSource(new OSM());
            break;
          case "satellite":
            baseLayer.setSource(
              new XYZ({
                url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
              })
            );
            break;
          case "hybrid":
            baseLayer.setSource(
              new XYZ({
                url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
              })
            );
            const labelLayer = new TileLayer({
              source: new XYZ({
                url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
              }),
            });
            mapInstance.current.addLayer(labelLayer);
            break;
        }
        setMapType(type);
      }
    };

    const highlightSelectedLandmark = (landmarkId: string) => {
      const feature = selectedLandmarksSource.current
        .getFeatures()
        .find((f) => f.get("id") === landmarkId);

      if (feature) {
        feature.setStyle(
          new Style({
            stroke: new Stroke({
              color: "rgba(255, 0, 0, 1)",
              width: 3,
            }),
            fill: new Fill({
              color: "rgba(255, 0, 0, 0.2)",
            }),
          })
        );
      }
    };

    useEffect(() => {
      selectedLandmarksSource.current.clear();
      routePathSource.current.clear();
      routeCoordsRef.current = [];
      const landmarksToProcess =
        mode === "create" ? selectedLandmarks : propLandmarks;
      if (!landmarksToProcess || landmarksToProcess.length === 0) return;

      const sortedLandmarks = [...landmarksToProcess].sort(
        (a, b) => (a.distance_from_start || 0) - (b.distance_from_start || 0)
      );

      sortedLandmarks.forEach((landmark, index) => {
        const lm = landmarks.find((l) => l.id === landmark.id);
        if (lm?.boundary) {
          try {
            const coordinates = lm.boundary
              .split(",")
              .map((coord: string) => coord.trim().split(" ").map(Number))
              .map((coord: Coordinate) => fromLonLat(coord));

            const polygon = new Polygon([coordinates]);
            const polygonFeature = new Feature(polygon);
            polygonFeature.set("id", lm.id);

            polygonFeature.setStyle(
              new Style({
                stroke: new Stroke({
                  color: "rgba(0, 150, 0, 0.7)",
                  width: 2,
                }),
                fill: new Fill({
                  color: "rgba(0, 150, 0, 0.1)",
                }),
                text: new Text({
                  text: (index + 1).toString(),
                  font: "bold 14px Arial",
                  fill: new Fill({ color: "#fff" }),
                  stroke: new Stroke({ color: "#000", width: 3 }),
                  offsetY: -20,
                }),
              })
            );

            selectedLandmarksSource.current.addFeature(polygonFeature);

            const center = getCenter(polygon.getExtent());
            routeCoordsRef.current.push(center);
          } catch (error) {
            console.error("Error processing landmark boundary:", error);
          }
        }
      });

      if (routeCoordsRef.current.length > 1) {
        const routeFeature = new Feature({
          geometry: new LineString(routeCoordsRef.current),
        });

        routeFeature.setStyle(
          new Style({
            stroke: new Stroke({
              color: "rgba(218, 29, 16, 0.7)",
              width: 3,
            }),
          })
        );
        routePathSource.current.addFeature(routeFeature);
      }

      routeCoordsRef.current.forEach((coord, index) => {
        const numberFeature = new Feature({
          geometry: new Point(coord),
        });

        numberFeature.setStyle(
          new Style({
            text: new Text({
              text: (index + 1).toString(),
              font: "bold 14px Arial",
              fill: new Fill({ color: "white" }),
              stroke: new Stroke({ color: "black", width: 2 }),
              offsetY: -20,
            }),
            image: new Circle({
              radius: 5,
              fill: new Fill({ color: "rgba(128, 0, 117, 0.9)" }),
              stroke: new Stroke({ color: "white", width: 2 }),
            }),
          })
        );
        routePathSource.current.addFeature(numberFeature);
      });

      // if (mapInstance.current) {
      //   const extent = selectedLandmarksSource.current.getExtent();
      //   if (extent[0] !== Infinity) {
      //     mapInstance.current.getView().fit(extent, {
      //       padding: [50, 50, 50, 50],
      //       duration: 1000,
      //     });
      //   }
      // }
    }, [propLandmarks, landmarks, selectedLandmarks, mode]);

    const toggleAddLandmarkMode = () => {
      const newAddingState = !isAddingLandmark;
      setIsAddingLandmark(newAddingState);

      if (newAddingState) {
        setShowAllBoundaries(true);
      } else {
        setShowAllBoundaries(false);
      }
    };

    const clearRoutePath = () => {
      routeCoordsRef.current = [];
      routePathSource.current.clear();
      selectedLandmarksSource.current.clear();
      setShowAllBoundaries(false);
      if (mapInstance.current) {
        mapInstance.current.getView().setZoom(10);
        mapInstance.current.getView().setCenter(fromLonLat([76.9366, 8.5241]));
      }
    };

    React.useImperativeHandle(ref, () => ({
      clearRoutePath,
      toggleAddLandmarkMode,
      isAddingLandmark,
    }));

    const refreshMap = () => {
      setTimeout(() => {
        selectedLandmarksSource.current.clear();
        setShowAllBoundaries(false);
      }, 300);

      if (mapInstance.current) {
        mapInstance.current.getView().animate({
          center: fromLonLat([76.9366, 8.5241]),
          zoom: 10,
          duration: 1000,
        });
      }
      setTimeout(() => {
        mapInstance.current?.render();
      }, 1100);
    };

    //*************************************** time selection and logics for adding landmarks **********************************

    const convertUTCToIST12Hour = (utcTime: string) => {
      // utcTime is like "07:00:00" or "07:00:00Z"
      const timeStr = utcTime.replace("Z", "");
      const [h, m] = timeStr.split(":").map(Number);

      // Create a date in UTC
      const utcDate = new Date(Date.UTC(1970, 0, 1, h, m, 0));
      // Add 5 hours 30 minutes to get IST
      utcDate.setUTCHours(
        utcDate.getUTCHours() + 5,
        utcDate.getUTCMinutes() + 30
      );

      let istHour = utcDate.getUTCHours();
      const istMinute = utcDate.getUTCMinutes();
      const period = istHour >= 12 ? "PM" : "AM";
      const displayHour = istHour % 12 || 12;

      return {
        hour: displayHour,
        minute: istMinute,
        period,
      };
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
      istDate.setUTCHours(
        istDate.getUTCHours() - 5,
        istDate.getUTCMinutes() - 30
      );

      return {
        displayTime: istDate.toISOString().slice(11, 19),
        fullTime: istDate.toISOString(),
        dayOffset,
        timestamp: istDate.getTime(),
      };
    };

    useEffect(() => {
      // Only treat as first landmark if it's a new route creation (mode === "create")
      const firstLandmark = mode === "create" && selectedLandmarks.length === 0;
      setIsFirstLandmark(firstLandmark);

      if (firstLandmark && startingTime) {
        // Use helper to convert UTC to IST for display
        const { hour, minute, period } = convertUTCToIST12Hour(startingTime);

        setArrivalHour(hour);
        setArrivalMinute(minute);
        setArrivalAmPm(period);
        setDepartureHour(hour);
        setDepartureMinute(minute);
        setDepartureAmPm(period);
        setArrivalDayOffset(0);
        setDepartureDayOffset(0);
      }
    }, [selectedLandmarks.length, startingTime, mode]);
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

    const getTimestamp = (
      hour: number,
      minute: number,
      amPm: string,
      dayOffset: number
    ): number => {
      const h24 =
        amPm === "PM" && hour !== 12
          ? hour + 12
          : amPm === "AM" && hour === 12
          ? 0
          : hour;
      const date = new Date(2000, 0, 1 + dayOffset, h24, minute);
      return date.getTime();
    };

    const handleAddLandmark = () => {
      const arrivalTS = getTimestamp(
        arrivalHour,
        arrivalMinute,
        arrivalAmPm,
        arrivalDayOffset
      );
      const departureTS = getTimestamp(
        departureHour,
        departureMinute,
        departureAmPm,
        departureDayOffset
      );

      if (!validateTimes()) {
        setShowTimeError("Both departure and arrival times are required");
        return;
      }
      if (departureTS < arrivalTS) {
        setShowTimeError(
          "Departure time must be after or equal to arrival time."
        );
        return;
      }
      setShowTimeError("");

      if (
    selectedLandmark?.distance_from_start === undefined ||
    selectedLandmark?.distance_from_start === null ||
    selectedLandmark?.distance_from_start === "" ||
    isNaN(selectedLandmark?.distance_from_start)
  ) {
    setDistanceError("Distance from Start is required");
    return;
  }
  setDistanceError("");

      // For first landmark, force times to match starting time
      if (isFirstLandmark && startingTime) {
        // Use the startingTime directly as UTC
        const arrivalUTC = {
          displayTime: startingTime.replace("Z", ""),
          fullTime: `1970-01-01T${startingTime.replace("Z", "")}Z`,
          dayOffset: 0,
          timestamp: new Date(
            `1970-01-01T${startingTime.replace("Z", "")}Z`
          ).getTime(),
        };

        const departureUTC = { ...arrivalUTC };

        const landmarkWithDistance = {
          ...selectedLandmark,
          arrivalTime: arrivalUTC,
          departureTime: departureUTC,
          arrivalDayOffset: 0,
          departureDayOffset: 0,
          distance_from_start: 0,
        };

        onAddLandmark(landmarkWithDistance);
        setIsModalOpen(false);
        return;
      }

      // Existing logic for non-first landmarks
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
      const landmarkWithDistance = {
        ...selectedLandmark,
        arrivalTime: arrivalTimeUTC,
        departureTime: departureTimeUTC,
        arrivalDayOffset,
        departureDayOffset,
        distance_from_start: selectedLandmark?.distance_from_start,
      };

      onAddLandmark(landmarkWithDistance);
      highlightSelectedLandmark(selectedLandmark.id.toString());
      setIsModalOpen(false);
    };

    const handleClose = () => {
      setShowTimeError("");
      setIsModalOpen(false);
    };

    return (
      <Box height="100%">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 1,
            backgroundColor: "#f5f5f5",
            borderRadius: 1,
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FormControl variant="outlined" size="small">
              <InputLabel>Map Type</InputLabel>
              <Select
                value={mapType}
                onChange={(
                  e: SelectChangeEvent<"osm" | "satellite" | "hybrid">
                ) =>
                  changeMapType(
                    e.target.value as "osm" | "satellite" | "hybrid"
                  )
                }
                label="Map Type"
              >
                <MenuItem value="osm">OSM</MenuItem>
                <MenuItem value="satellite">Satellite</MenuItem>
                <MenuItem value="hybrid">Hybrid</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TextField
                variant="outlined"
                size="small"
                placeholder="Search Location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </Box>

            <Tooltip
              title={showAllBoundaries ? "Hide landmarks" : "Show landmarks"}
            >
              <IconButton
                onClick={() => setShowAllBoundaries(!showAllBoundaries)}
              >
                <LocationOnIcon
                  sx={{ color: showAllBoundaries ? "blue" : undefined }}
                />
              </IconButton>
            </Tooltip>
            <Box>
              <Tooltip title="Refresh Map" placement="bottom">
                <IconButton color="warning" onClick={refreshMap}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        <Box ref={mapRef} width="100%" height="calc(100% - 128px)" flex={1} />
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Typography variant="body2">
            <strong>[{mousePosition || "coordinates"}]</strong>
          </Typography>
        </Box>

        <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <DialogTitle>Add Landmark to Route</DialogTitle>
          <DialogContent>
            <Typography>Landmark: {selectedLandmark?.name}</Typography>
            <Typography>ID: {selectedLandmark?.id}</Typography>
            <Box mb={2}>
              <Alert severity="info">
                {mode === "create" && isFirstLandmark
                  ? "This is the starting landmark. Arrival and departure times are fixed to match the route's starting time."
                  : "For ending landmarks, arrival and departure time must be the same."}
              </Alert>
              {showTimeError && (
                <Box mb={2}>
                  <Alert severity="error">{showTimeError}</Alert>
                </Box>
              )}
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
                    !isFirstLandmark &&
                    setArrivalDayOffset(Number(e.target.value))
                  }
                  label="Day"
                  disabled={isFirstLandmark}
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
                  onChange={(e) =>
                    !isFirstLandmark && setArrivalHour(Number(e.target.value))
                  }
                  label="Hour"
                  disabled={isFirstLandmark}
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
                  onChange={(e) =>
                    !isFirstLandmark && setArrivalMinute(Number(e.target.value))
                  }
                  label="Minute"
                  disabled={isFirstLandmark}
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
                  onChange={(e) =>
                    !isFirstLandmark && setArrivalAmPm(e.target.value as string)
                  }
                  label="AM/PM"
                  disabled={isFirstLandmark}
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
                  disabled={isFirstLandmark}
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
                  disabled={isFirstLandmark}
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
                  disabled={isFirstLandmark}
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
                  disabled={isFirstLandmark}
                >
                  <MenuItem value="AM">AM</MenuItem>
                  <MenuItem value="PM">PM</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {(selectedLandmarks.length > 0 || propLandmarks.length > 0) && (
              <TextField
  label="Distance from Start (meters)"
  type="number"
  fullWidth
  margin="normal"
  value={selectedLandmark?.distance_from_start ?? ""}
  onChange={(e) => {
    setSelectedLandmark({
      ...selectedLandmark!,
      distance_from_start: e.target.value === "" ? "" : parseFloat(e.target.value),
    });
    setDistanceError(""); 
  }}
  error={!!distanceError}
  helperText={distanceError}
/>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              onClick={handleAddLandmark}
              color="primary"
              disabled={!validateTimes()}
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }
);

export default MapComponent;

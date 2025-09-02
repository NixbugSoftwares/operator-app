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
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
  Alert,
  Checkbox,
  InputAdornment,
} from "@mui/material";
import {
  showErrorToast,
  showSuccessToast,
} from "../../common/toastMessageHelper";
import {
  landmarkListApi,
  routeLandmarkCreationApi,
} from "../../slices/appSlice";
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
  onAddLandmark?: (landmark: SelectedLandmark) => void;
  onClearRoute?: () => void;
  landmarks: SelectedLandmark[];
  selectedLandmarks: SelectedLandmark[];
  mode: "create" | "view" | "edit" | "list";
  isEditing?: boolean;
  startingTime?: string;
  isNewRoute?: boolean;
  selectedLandmarkIds?: number[];
  routeId?: number;
  selectedRouteStartingTime?: string;
  onLandmarkAdded: () => void;
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
      routeId,
      selectedRouteStartingTime,
      onLandmarkAdded,
    }: MapComponentProps,
    ref
  ) => {
    // console.log("startingTime........", startingTime);
    // console.log("selectedroutestartingtime.....", selectedRouteStartingTime);
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
    const [arrivalHour, setArrivalHour] = useState<number>(6);
    const [arrivalMinute, setArrivalMinute] = useState<number>(30);
    const [arrivalAmPm, setArrivalAmPm] = useState<string>("AM");
    const [departureHour, setDepartureHour] = useState<number>(6);
    const [departureMinute, setDepartureMinute] = useState<number>(30);
    const [departureAmPm, setDepartureAmPm] = useState<string>("AM");
    const [arrivalDayOffset, setArrivalDayOffset] = useState<number>(0);
    const [departureDayOffset, setDepartureDayOffset] = useState<number>(0);
    const [startTimestamp, setStartTimestamp] = useState<number | null>(null);

    const [isFirstLandmark, setIsFirstLandmark] = useState(false);
    const [showTimeError, setShowTimeError] = useState<string>("");
    const [distanceError, setDistanceError] = useState<string | null>(null);
    const [isLastLandmark, setIsLastLandmark] = useState(false);
    const [_usedTimes, setUsedTimes] = useState<
      { arrivalTS: number; departureTS: number }[]
    >([]);
    const [distanceUnit, setDistanceUnit] = useState<"m" | "km">("m");

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

    const fetchLandmark = async (
      locationaskey: string,
      idList: number[] = [],
      zoom?: number
    ) => {
      try {
        if ((mode === "view" || isEditing) && idList.length > 0) {
          const selectedParams = {
            id_list: idList,
            order_by: 2,
            order_in: 1,
          };

          const selectedRes = await dispatch(
            landmarkListApi(selectedParams)
          ).unwrap();
          const selectedLandmarksData = selectedRes.data.map(
            (landmark: any) => ({
              id: landmark.id,
              name: landmark.name,
              boundary: extractRawPoints(landmark.boundary),
            })
          );
          if (mode === "list" || mode === "create") {
            const params = {
              location: locationaskey,
              limit: Math.min(100, Math.max(10, Math.floor((zoom || 10) * 5))),
              order_by: 2,
              order_in: 1,
            };

            const res = await dispatch(landmarkListApi(params)).unwrap();
            const formattedLandmarks = res.data.map((landmark: any) => ({
              id: landmark.id,
              name: landmark.name,
              boundary: extractRawPoints(landmark.boundary),
            }));
            setLandmarks(formattedLandmarks);
          }

          if (isEditing) {
            const nearbyParams = {
              location: locationaskey,
              limit: Math.min(100, Math.max(10, Math.floor((zoom || 10) * 5))),
              order_by: 2,
              order_in: 1,
            };

            const nearbyRes = await dispatch(
              landmarkListApi(nearbyParams)
            ).unwrap();
            const nearbyLandmarksData = nearbyRes.data.map((landmark: any) => ({
              id: landmark.id,
              name: landmark.name,
              boundary: extractRawPoints(landmark.boundary),
            }));

            const combinedLandmarks = [
              ...selectedLandmarksData,
              ...nearbyLandmarksData.filter(
                (lm: any) =>
                  !selectedLandmarksData.some((slm: any) => slm.id === lm.id)
              ),
            ];

            setLandmarks(combinedLandmarks);
            return;
          }

          setLandmarks(selectedLandmarksData);
          handleViewModeLandmarks(selectedLandmarksData);
          return;
        }

        if (mode !== "view") {
          const params = {
            location: locationaskey,
            limit: Math.min(100, Math.max(10, Math.floor((zoom || 10) * 5))),
            order_by: 2,
            order_in: 1,
          };

          const res = await dispatch(landmarkListApi(params)).unwrap();
          const formattedLandmarks = res.data.map((landmark: any) => ({
            id: landmark.id,
            name: landmark.name,
            boundary: extractRawPoints(landmark.boundary),
          }));
          setLandmarks(formattedLandmarks);
        }
      } catch (err: any) {
        showErrorToast(err || "Failed to fetch landmarks");
      }
    };

    useEffect(() => {
      if (!mapInstance.current) return;

      const map = mapInstance.current;
      let debounceTimer: number;

      const handleViewChange = () => {
        clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(() => {
          const centerRaw = map.getView().getCenter();
          if (!centerRaw) return;

          const center = toLonLat(centerRaw);
          const locationaskey = `POINT(${center[0]} ${center[1]})`;
          const zoom = map.getView().getZoom();

          // Get IDs of selected landmarks if in edit mode
          const idList =
            mode === "view" || isEditing
              ? mode === "view"
                ? propLandmarks.map((lm) => lm.id)
                : selectedLandmarks.map((lm) => lm.id)
              : [];

          fetchLandmark(locationaskey, idList, zoom);
        }, 300);
      };

      // Always set up listeners, but handle logic inside
      map.getView().on("change:resolution", handleViewChange);
      map.on("moveend", handleViewChange);

      // Initial fetch
      handleViewChange();

      return () => {
        clearTimeout(debounceTimer);
        map.getView().un("change:resolution", handleViewChange);
        map.un("moveend", handleViewChange);
      };
    }, [mode, isEditing, selectedLandmarks, propLandmarks]);

    const handleViewModeLandmarks = (landmarksData: Landmark[]) => {
      selectedLandmarksSource.current.clear();
      routePathSource.current.clear();
      routeCoordsRef.current = [];

      if (!propLandmarks || propLandmarks.length === 0) return;

      const sortedLandmarks = [...propLandmarks].sort(
        (a, b) => (a.distance_from_start || 0) - (b.distance_from_start || 0)
      );

      sortedLandmarks.forEach((landmark, index) => {
        const lm = landmarksData.find((l) => l.id === landmark.id);
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

      // Only fit view to selected landmarks in view mode, not edit mode
      if (
        routeCoordsRef.current.length > 0 &&
        mapInstance.current &&
        mode === "view"
      ) {
        const extent = selectedLandmarksSource.current.getExtent();
        mapInstance.current.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          duration: 1000,
        });
      }
    };

    useEffect(() => {
      if (mode === "view" && propLandmarks.length > 0) {
        const idList = propLandmarks.map((lm) => lm.id);
        const locationaskey = "POINT(76.9366 8.5241)";
        fetchLandmark(locationaskey, idList);
      }
    }, [mode, propLandmarks]);

    useEffect(() => {
      setShowAllBoundaries(true);
    }, []);

    useEffect(() => {
      console.log(mode);

      console.log("isAddingLandmark+++++++", isAddingLandmark);
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
      console.log("is editingggg>>>>>>>>>>>>>>>>>>>", isEditing);
      if (!mapInstance.current) return;

      allBoundariesSource.current.clear();
      const features: Feature[] = [];

      if (landmarks) {
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

              // Check if this landmark is selected
              const isSelected = selectedLandmarks.some(
                (sl) => sl.id === landmark.id
              );

              if (
                isSelected ||
                (mode === "create" && showAllBoundaries) ||
                isEditing ||
                mode === "list" // Added condition for list mode
              ) {
                feature.setStyle(
                  new Style({
                    stroke: new Stroke({
                      color: isSelected
                        ? "rgba(0, 150, 0, 0.7)"
                        : "rgba(0, 0, 255, 0.7)",
                      width: 2,
                    }),
                    fill: new Fill({
                      color: isSelected
                        ? "rgba(0, 150, 0, 0.1)"
                        : "rgba(0, 0, 255, 0.1)",
                    }),
                  })
                );
                features.push(feature);

                // Calculate centroid of the polygon
                const getCentroid = (coords: Coordinate[]): Coordinate => {
                  let x = 0;
                  let y = 0;
                  const numPoints = coords.length;

                  for (const point of coords) {
                    x += point[0];
                    y += point[1];
                  }

                  return [x / numPoints, y / numPoints];
                };

                const centroid = getCentroid(coordinates);
                const labelFeature = new Feature(new Point(centroid));
                labelFeature.set("id", `label-${landmark.id}`);
                labelFeature.setStyle(
                  new Style({
                    text: new Text({
                      text: ` ${(landmark?.name || "Landmark").toUpperCase()}`,
                      font: "bold 12px Arial",
                      fill: new Fill({ color: "darkblue" }),
                      stroke: new Stroke({ color: "#FFF", width: 3 }),
                      offsetY: 0,
                      textAlign: "center",
                      placement: "point",
                    }),
                  })
                );
                features.push(labelFeature);
              }
            } catch (error) {
              console.error(`Error processing landmark ${landmark.id}:`, error);
            }
          }
        });
      }

      if (features.length > 0) {
        allBoundariesSource.current.addFeatures(features);
      }
    }, [showAllBoundaries, landmarks, selectedLandmarks, isEditing, mode]);

    useEffect(() => {
      console.log("mode", mode);
      if (isEditing !== undefined) {
        setIsAddingLandmark(isEditing);
        setShowAllBoundaries(isEditing);

        // When entering edit mode, fetch all landmarks
        if (isEditing && mapInstance.current) {
          const centerRaw = mapInstance.current.getView().getCenter();
          if (centerRaw) {
            const center = toLonLat(centerRaw);
            const locationaskey = `POINT(${center[0]} ${center[1]})`;
            fetchLandmark(locationaskey, []);
          }
        }
      }
    }, [isEditing]);

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
    }, [propLandmarks, landmarks, selectedLandmarks, mode]);

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
      disableAddLandmarkMode: () => {
        setIsAddingLandmark(false);
      },
    }));
    const handleAddLandmark = async () => {
      // 🎯 Scenario 2: Editing existing route
      if (isEditing && routeId) {
        const arrivalTS = getTimestamp(
          arrivalHour,
          arrivalMinute,
          arrivalAmPm,
          arrivalDayOffset
        );
        const departureTS = isLastLandmark
          ? arrivalTS
          : getTimestamp(
              departureHour,
              departureMinute,
              departureAmPm,
              departureDayOffset
            );
        console.log("arrivalTS", arrivalTS);
        console.log("departureTS", departureTS);
        if (!arrivalTS || !departureTS) {
          showErrorToast("Missing arrival or departure time");
          return;
        }
        if (
          selectedLandmark?.distance_from_start === undefined ||
          selectedLandmark?.distance_from_start === null ||
          selectedLandmark?.distance_from_start === 0
        ) {
          setDistanceError("Distance is required");
          return;
        }

        const landmarkWithDistance = {
          ...selectedLandmark,
          arrivalTS, // raw timestamp
          departureTS, // raw timestamp
          arrivalTime: { fullTime: formatFullTime(arrivalTS) },
          departureTime: { fullTime: formatFullTime(departureTS) },
          distance_from_start: selectedLandmark?.distance_from_start,
        };

        const result = await saveLandmarkToDatabase(landmarkWithDistance);
        if (result.success) {
          highlightSelectedLandmark(selectedLandmark.id.toString());
          setIsModalOpen(false);
          setIsLastLandmark(false);
        }
        return;
      }

      // 🎯 Scenario 1: New route creation
      if (!startTimestamp) {
        showErrorToast("Missing starting time");
        return;
      }

      const arrivalTS = getTimestamp(
        arrivalHour,
        arrivalMinute,
        arrivalAmPm,
        arrivalDayOffset
      );
      const departureTS = isLastLandmark
        ? arrivalTS
        : getTimestamp(
            departureHour,
            departureMinute,
            departureAmPm,
            departureDayOffset
          );

      let arrivalDelta = Math.floor((arrivalTS - startTimestamp!) / 1000);
      let departureDelta = Math.floor((departureTS - startTimestamp!) / 1000);

      let finalArrivalTS = arrivalTS;
      let finalDepartureTS = departureTS;

      if (
        selectedLandmark?.distance_from_start === undefined ||
        selectedLandmark?.distance_from_start === null ||
        selectedLandmark?.distance_from_start === ""
      ) {
        setDistanceError("Distance is required");
        return;
      }
      if (
        arrivalDelta &&
        departureDelta > 0 &&
        selectedLandmark?.distance_from_start === 0
      ) {
        setDistanceError("Only starting landmark can have distance 0");
        return;
      }

      if (selectedLandmarks.length === 0) {
        arrivalDelta = 0;
        departureDelta = 0;
        finalArrivalTS = startTimestamp!;
        finalDepartureTS = startTimestamp!;
      }

      if (!validateTimes()) {
        setShowTimeError("Both departure and arrival times are required");
        return;
      }
      if (
        !(selectedLandmarks.length === 0) &&
        (arrivalDelta && departureDelta) <= 0
      ) {
        setShowTimeError(
          "Arrival and Departure time must be after starting time"
        );
        return;
      }

      if (!isLastLandmark && arrivalDelta > departureDelta) {
        setShowTimeError(
          "Departure time must be after or equal to arrival time."
        );
        return;
      }
      setShowTimeError("");

      const landmarkWithDistance = {
        ...selectedLandmark,
        arrival_delta: arrivalDelta,
        departure_delta: departureDelta,
        distance_from_start: selectedLandmark?.distance_from_start,
        arrivalTime: { fullTime: finalArrivalTS },
        departureTime: { fullTime: finalDepartureTS },
      };

      setUsedTimes((prev) => [...prev, { arrivalTS, departureTS }]);
      onAddLandmark?.(landmarkWithDistance);
      highlightSelectedLandmark(selectedLandmark.id.toString());
      setIsModalOpen(false);
      setIsLastLandmark(false);
    };

    // Helper to format timestamps into "1970-01-01 hh:mm AM/PM"
    const formatFullTime = (ts: number) => {
      const date = new Date(ts);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const adjustedHours = hours % 12 || 12;
      const paddedMinutes = String(minutes).padStart(2, "0");
      return `1970-01-01 ${adjustedHours}:${paddedMinutes} ${ampm}`;
    };

    // console.log("selectedroutestartingtime.....",selectedRouteStartingTime);

    const saveLandmarkToDatabase = async (
      landmark: SelectedLandmark & { arrivalTS?: number; departureTS?: number }
    ) => {
      if (!routeId || !selectedRouteStartingTime) {
        console.error("Missing required parameters:", {
          routeId,
          selectedRouteStartingTime,
        });
        showErrorToast("Route ID and starting time are required");
        return { success: false };
      }

      try {
        console.log("Starting saveLandmarkToDatabase with:", {
          routeId,
          selectedRouteStartingTime,
          landmark,
        });

        // Parse time string to timestamp (treat as IST)
        const parseISTTimeStringToTimestamp = (timeString: string): number => {
          const [_datePart, timePart, period] = timeString.split(" ");
          const [hourStr, minuteStr] = timePart.split(":");

          let hours = parseInt(hourStr, 10);
          const minutes = parseInt(minuteStr, 10);

          // Convert to 24-hour format
          if (period === "PM" && hours !== 12) hours += 12;
          if (period === "AM" && hours === 12) hours = 0;

          // Create date object - treat as IST (UTC+5:30)
          // Use Date.UTC but add 5:30 to compensate for IST offset
          const utcMs = Date.UTC(1970, 0, 1, hours, minutes, 0, 0);
          // Since we want to treat this as IST, we need to subtract the IST offset
          // to get the correct UTC timestamp that represents the same instant
          const istOffsetMs = 5.5 * 60 * 60 * 1000; // 5:30 hours in milliseconds
          return utcMs - istOffsetMs;
        };

        // Get route starting timestamp (IST)
        const startTimestamp = parseISTTimeStringToTimestamp(
          selectedRouteStartingTime
        );

        // Handle arrival time
        let arrivalTimestamp: number;
        if (landmark.arrivalTS) {
          // If we have raw timestamp, use it directly (assuming it's already in correct timezone context)
          arrivalTimestamp = landmark.arrivalTS;
        } else {
          // Parse from formatted string (IST)
          arrivalTimestamp = parseISTTimeStringToTimestamp(
            landmark.arrivalTime.fullTime
          );
        }

        // Handle departure time
        let departureTimestamp: number;
        if (landmark.departureTS) {
          // If we have raw timestamp, use it directly
          departureTimestamp = landmark.departureTS;
        } else {
          // Parse from formatted string (IST)
          departureTimestamp = parseISTTimeStringToTimestamp(
            landmark.departureTime.fullTime
          );
        }

        // Calculate deltas in seconds
        const arrivalDelta = Math.floor(
          (arrivalTimestamp - startTimestamp) / 1000
        );
        const departureDelta = Math.floor(
          (departureTimestamp - startTimestamp) / 1000
        );

        console.log("Calculated deltas (IST):", {
          startTime: new Date(startTimestamp).toString(),
          arrivalTime: new Date(arrivalTimestamp).toString(),
          departureTime: new Date(departureTimestamp).toString(),
          arrivalDelta,
          departureDelta,
        });
        if (landmark.distance_from_start <= 0) {
          showErrorToast("Distance from start must be greater than 0.");
          return { success: false };
        }
        // Validate deltas
        if (arrivalDelta <= 0 || departureDelta <= 0) {
          showErrorToast(
            "Arrival and departure times must be after the starting time."
          );
          return { success: false };
        }

        if (arrivalDelta > departureDelta) {
          showErrorToast("Departure time must be greater than arrival time.");
          return { success: false };
        }

        // ✅ Prepare FormData
        const formData = new FormData();
        formData.append("route_id", routeId.toString());
        formData.append("landmark_id", landmark.id.toString());
        formData.append("arrival_delta", arrivalDelta.toString());
        formData.append("departure_delta", departureDelta.toString());
        formData.append(
          "distance_from_start",
          (landmark.distance_from_start || 0).toString()
        );

        await dispatch(routeLandmarkCreationApi(formData)).unwrap();
        showSuccessToast("Landmark added successfully");
        onLandmarkAdded();
        return { success: true };
      } catch (error: any) {
        //  if (error?.status === 422) {
        //   showErrorToast(
        //     "Arrival and departure times must be after the starting time."
        //   );
        // } else {
        showErrorToast(error.message || "Failed to add landmark");
        // }
        return { success: false, error };
      }
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

    // const convertLocalToUTC = (
    //   hour: number,
    //   minute: number,
    //   period: string,
    //   dayOffset: number = 0
    // ) => {
    //   let istHour = hour;
    //   if (period === "PM" && hour !== 12) {
    //     istHour += 12;
    //   } else if (period === "AM" && hour === 12) {
    //     istHour = 0;
    //   }

    //   // Create IST date
    //   const istDate = new Date(
    //     Date.UTC(1970, 0, 1 + dayOffset, istHour, minute, 0)
    //   );
    //   // Subtract 5 hours 30 minutes to get UTC
    //   istDate.setUTCHours(
    //     istDate.getUTCHours() - 5,
    //     istDate.getUTCMinutes() - 30
    //   );

    //   return {
    //     displayTime: istDate.toISOString().slice(11, 19),
    //     fullTime: istDate.toISOString(),
    //     dayOffset,
    //     timestamp: istDate.getTime(),
    //   };
    // };

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

    const parseISTStringToTimestamp = (timeStr: string): number => {
      // Try to parse as ISO first
      const parsed = new Date(timeStr);
      if (!isNaN(parsed.getTime())) return parsed.getTime();

      // Fallback: "1970-01-01 hh:mm AM/PM"
      const [datePart, timePart, periodRaw] = timeStr.split(" ");
      const period = periodRaw?.toUpperCase();
      const [hourStr, minuteStr] = timePart?.split(":") ?? [];

      let hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);

      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;

      const [year, month, day] = datePart.split("-").map(Number);
      const date = new Date(year, month - 1, day, hour, minute, 0);
      return date.getTime();
    };

    // ✅ Directly get timestamp from landmark fields (in IST)
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
      const date = new Date(1970, 0, 1 + dayOffset, h24, minute);
      return date.getTime();
    };
    useEffect(() => {
      if (startingTime) {
        setStartTimestamp(parseISTStringToTimestamp(startingTime));
      }
    }, [startingTime]);

    const handleClose = () => {
      setShowTimeError("");
      setDistanceError("");
      setIsModalOpen(false);
    };

    //for update the landmark add form modal with previous landmark time
    useEffect(() => {
      if (!selectedLandmark) return;

      if (selectedLandmarks.length === 0) {
        // First landmark: skip manual time selection
        setArrivalDayOffset(0);
        setArrivalHour(12);
        setArrivalMinute(0);
        setArrivalAmPm("AM");
        setDepartureDayOffset(0);
        setDepartureHour(12);
        setDepartureMinute(0);
        setDepartureAmPm("AM");
        setIsLastLandmark(false);
      } else {
        // Subsequent landmarks: initialize with previous landmark's times
        const lastLandmark = selectedLandmarks[selectedLandmarks.length - 1];

        const lastArrival = lastLandmark.arrivalTime?.fullTime || "";
        const lastDeparture = lastLandmark.departureTime?.fullTime || "";

        const arrivalDate = new Date(lastArrival);
        const departureDate = new Date(lastDeparture);

        const formatHour = (date: Date) => {
          const hours = date.getHours();
          const h = hours % 12 === 0 ? 12 : hours % 12;
          return h;
        };

        const formatAmPm = (date: Date) =>
          date.getHours() >= 12 ? "PM" : "AM";

        setArrivalDayOffset(0); // calculate day offset if needed
        setArrivalHour(formatHour(arrivalDate));
        setArrivalMinute(arrivalDate.getMinutes());
        setArrivalAmPm(formatAmPm(arrivalDate));

        setDepartureDayOffset(0); // same as above
        setDepartureHour(formatHour(departureDate));
        setDepartureMinute(departureDate.getMinutes());
        setDepartureAmPm(formatAmPm(departureDate));

        setIsLastLandmark(false);
      }
    }, [selectedLandmark]);

    // Watch for changes in arrival time when isLastLandmark is true
useEffect(() => {
  if (isLastLandmark) {
    setDepartureHour(arrivalHour);
    setDepartureMinute(arrivalMinute);
    setDepartureAmPm(arrivalAmPm);
    setDepartureDayOffset(arrivalDayOffset);
  }
}, [isLastLandmark, arrivalHour, arrivalMinute, arrivalAmPm, arrivalDayOffset]);
    return (
      <Box height="100%" display="flex" flexDirection="column">
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
          </Box>
        </Box>

        <Box
          ref={mapRef}
          width="100%"
          flex={1}
          sx={{ height: "calc(100% - 128px)" }}
        />

        <Box sx={{ display: "flex", gap: 2, alignItems: "center", p: 1 }}>
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

            {!isFirstLandmark && (
              <>
                {/* Distance + Checkbox */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "stretch", sm: "center" },
                    mt: 2,
                    gap: 2,
                  }}
                >
                  {/* Distance Field */}
                  <TextField
                    label="Distance from Start"
                    type="number"
                    fullWidth
                    required
                    margin="normal"
                    value={
                      selectedLandmark?.distance_from_start
                        ? distanceUnit === "km"
                          ? selectedLandmark.distance_from_start / 1000
                          : selectedLandmark.distance_from_start
                        : ""
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue =
                        value === "" ? undefined : parseFloat(value);

                      let distanceInMeters =
                        distanceUnit === "km" && numValue !== undefined
                          ? numValue * 1000
                          : numValue;

                      setSelectedLandmark({
                        ...selectedLandmark!,
                        distance_from_start: distanceInMeters,
                      });

                      if (value !== "") setDistanceError(null);
                    }}
                    inputProps={{
                      min: isFirstLandmark ? 0 : 1,
                      step: "any",
                    }}
                    error={!!distanceError}
                    helperText={distanceError}
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

                  {/* Checkbox */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: { xs: "flex-start", sm: "center" },
                    }}
                  >
                    <Checkbox
                       sx={{ scale: 0.8 }}
  checked={isLastLandmark}
  onChange={(e) => setIsLastLandmark(e.target.checked)}
  disabled={isFirstLandmark}
                    />
                    <Typography variant="body2" fontSize={12}>
                      Ending Landmark?
                    </Typography>
                  </Box>
                </Box>

                {/* Arrival Time */}
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                  Arrival Time (IST)
                </Typography>

                {/* Day Full Width - Always full width on all devices */}
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
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

                {/* Hour-Minute-AMPM Row - Always in one row on all devices */}
                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                  {/* Hour Select */}
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Hour</InputLabel>
                    <Select
                      value={arrivalHour}
                      onChange={(e) =>
                        !isFirstLandmark &&
                        setArrivalHour(Number(e.target.value))
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

                  {/* Minute Select */}
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Minute</InputLabel>
                    <Select
                      value={arrivalMinute}
                      onChange={(e) =>
                        !isFirstLandmark &&
                        setArrivalMinute(Number(e.target.value))
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

                  {/* AM/PM Select */}
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>AM/PM</InputLabel>
                    <Select
                      value={arrivalAmPm}
                      onChange={(e) =>
                        !isFirstLandmark &&
                        setArrivalAmPm(e.target.value as string)
                      }
                      label="AM/PM"
                      disabled={isFirstLandmark}
                    >
                      <MenuItem value="AM">AM</MenuItem>
                      <MenuItem value="PM">PM</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Departure Time */}
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                  Departure Time (IST) {isLastLandmark && "(Same as arrival)"}
                </Typography>

                {/* Day Full Width - Always full width on all devices */}
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Day</InputLabel>
                  <Select
                    value={
                      isLastLandmark ? arrivalDayOffset : departureDayOffset
                    }
                    onChange={(e) => {
                      if (!isLastLandmark) {
                        setDepartureDayOffset(Number(e.target.value));
                      }
                    }}
                    label="Day"
                    disabled={isFirstLandmark || isLastLandmark}
                  >
                    {Array.from({ length: 10 }, (_, i) => (
                      <MenuItem key={i} value={i}>{`Day ${i + 1}`}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Hour-Minute-AMPM Row - Always in one row on all devices */}
                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                  {/* Hour Select */}
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Hour</InputLabel>
                    <Select
                      value={departureHour}
                      onChange={(e) =>
                        !isLastLandmark &&
                        setDepartureHour(Number(e.target.value))
                      }
                      label="Hour"
                      disabled={isFirstLandmark || isLastLandmark}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                        <MenuItem key={h} value={h}>
                          {h.toString().padStart(2, "0")}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Minute Select */}
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Minute</InputLabel>
                    <Select
                      value={departureMinute}
                      onChange={(e) =>
                        !isLastLandmark &&
                        setDepartureMinute(Number(e.target.value))
                      }
                      label="Minute"
                      disabled={isFirstLandmark || isLastLandmark}
                    >
                      {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                        <MenuItem key={m} value={m}>
                          {String(m).padStart(2, "0")}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* AM/PM Select */}
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>AM/PM</InputLabel>
                    <Select
                      value={departureAmPm}
                      onChange={(e) =>
                        !isLastLandmark &&
                        setDepartureAmPm(e.target.value as string)
                      }
                      label="AM/PM"
                      disabled={isFirstLandmark || isLastLandmark}
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

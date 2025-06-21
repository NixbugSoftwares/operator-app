import React, { useEffect, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { OSM, XYZ, Vector as VectorSource } from "ol/source";
import { fromLonLat, toLonLat } from "ol/proj";
import {
  Box,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
} from "@mui/material";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { Style, Icon } from "ol/style";
import { showErrorToast } from "../../common/toastMessageHelper";
import companyLocation from "../../assets/png/companyLocation.png";

interface MapComponentProps {
  onSelectLocation?: (coordinates: {
    lat: number;
    lng: number;
    name: string;
  }) => void;
  isOpen: boolean;
  initialCoordinates?: { lat: number; lng: number };
}

const MapComponent: React.FC<MapComponentProps> = ({
  onSelectLocation,
  isOpen,
  initialCoordinates,
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<Map | null>(null);
  const [mapType, setMapType] = useState<"osm" | "satellite" | "hybrid">("osm");
  const [mousePosition, setMousePosition] = useState<string>("");
  const [isMarkingEnabled, setIsMarkingEnabled] = useState<boolean>(false);
  const [markerLayer, setMarkerLayer] = useState<VectorLayer<
    VectorSource<Feature<Point>>
  > | null>(null);
  const [locationName, setLocationName] = useState<string>("");

  // Fetch location name from coordinates
  const fetchLocationName = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      return data.display_name || "Unknown Location";
    } catch (error) {
      showErrorToast("Error fetching location name: " + error);
      return "Unknown Location";
    }
  };

  // Initialize the map and add a marker for initialCoordinates
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      const map = new Map({
        controls: [],
        layers: [new TileLayer({ source: new OSM() })],
        target: mapRef.current,
        view: new View({
          center: initialCoordinates
            ? fromLonLat([initialCoordinates.lng, initialCoordinates.lat])
            : fromLonLat([76.9366, 8.5241]),
          zoom: 10,
          minZoom: 3,
          maxZoom: 18,
        }),
      });

      map.on("pointermove", (event) => {
        const coords = toLonLat(event.coordinate);
        setMousePosition(`${coords[0].toFixed(7)}, ${coords[1].toFixed(7)}`);
      });

      mapInstance.current = map;
    }

    // Add a marker for initialCoordinates and fetch location name
    if (initialCoordinates && mapInstance.current) {
      const marker = new Feature({
        geometry: new Point(
          fromLonLat([initialCoordinates.lng, initialCoordinates.lat])
        ),
      });

      const markerSource = new VectorSource({
        features: [marker],
      });

      const newMarkerLayer = new VectorLayer({
        source: markerSource,
        style: new Style({
          image: new Icon({
            src: companyLocation,
            scale: 1,
          }),
        }),
      });

      if (markerLayer) {
        mapInstance.current.removeLayer(markerLayer);
      }

      mapInstance.current.addLayer(newMarkerLayer);
      setMarkerLayer(newMarkerLayer);

      // Fetch and set the location name
      fetchLocationName(initialCoordinates.lat, initialCoordinates.lng).then(
        (name) => {
          setLocationName(name);
        }
      );
    }

    // Update map size when modal is opened
    if (isOpen) {
      setTimeout(() => {
        mapInstance.current?.updateSize();
      }, 500);
    }
  }, [isOpen, initialCoordinates]);

  // Handle map clicks when marking is enabled
  useEffect(() => {
    if (!mapInstance.current || !onSelectLocation) return;

    const map = mapInstance.current;

    const handleMapClick = async (event: any) => {
      if (!isMarkingEnabled) return;

      const coords = toLonLat(event.coordinate);
      const name = await fetchLocationName(coords[1], coords[0]);
      setLocationName(name);
      onSelectLocation({ lat: coords[1], lng: coords[0], name });

      const marker = new Feature({
        geometry: new Point(event.coordinate),
      });

      const markerSource = new VectorSource({
        features: [marker],
      });

      const newMarkerLayer = new VectorLayer({
        source: markerSource,
        style: new Style({
          image: new Icon({
            src: companyLocation,
            scale: 1,
          }),
        }),
      });

      if (markerLayer) {
        map.removeLayer(markerLayer);
      }

      map.addLayer(newMarkerLayer);
      setMarkerLayer(newMarkerLayer);
    };

    map.on("click", handleMapClick);

    return () => {
      map.un("click", handleMapClick);
    };
  }, [isMarkingEnabled, markerLayer, onSelectLocation]);

  // Handle location search
  const handleSearch = async () => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        locationName
      )}`
    );
    const data = await response.json();
    if (data.length > 0) {
      const { lat, lon } = data[0];
      const coords = fromLonLat([parseFloat(lon), parseFloat(lat)]);
      mapInstance.current?.getView().setCenter(coords);
      mapInstance.current?.getView().setZoom(15);

      const marker = new Feature({
        geometry: new Point(coords),
      });

      const markerSource = new VectorSource({
        features: [marker],
      });

      const newMarkerLayer = new VectorLayer({
        source: markerSource,
        style: new Style({
          image: new Icon({
            src: companyLocation,
            scale: 1,
          }),
        }),
      });

      if (markerLayer) {
        mapInstance.current?.removeLayer(markerLayer);
      }

      mapInstance.current?.addLayer(newMarkerLayer);
      setMarkerLayer(newMarkerLayer);
    }
  };

  // Change map type
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
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FormControl variant="outlined" size="small">
            <InputLabel>Map Type</InputLabel>
            <Select
              value={mapType}
              onChange={(e) =>
                changeMapType(e.target.value as "osm" | "satellite" | "hybrid")
              }
              label="Map Type"
            >
              <MenuItem value="osm">OSM</MenuItem>
              <MenuItem value="satellite">Satellite</MenuItem>
              <MenuItem value="hybrid">Hybrid</MenuItem>
            </Select>
          </FormControl>

          <Button
            onClick={() => setIsMarkingEnabled(!isMarkingEnabled)}
            variant="contained"
            size="small"
            color={isMarkingEnabled ? "secondary" : "primary"}
          >
            {isMarkingEnabled ? "Disable Marking" : "Enable Marking"}
          </Button>
        </Box>

        <Typography variant="body2">
          <strong>{mousePosition}</strong>
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
        <TextField
          fullWidth
          label="Search Location"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
        />
        <Button variant="contained" onClick={handleSearch}>
          Search
        </Button>
      </Box>

      <Box ref={mapRef} width="100%" height="500px" flex={1} />
    </Box>
  );
};

export default MapComponent;

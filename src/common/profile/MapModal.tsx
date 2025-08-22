import React, { useState, useEffect } from "react";
import { Modal, Box, Typography, Button } from "@mui/material";
import MapComponent from "./map";
import { showErrorToast } from "../../common/toastMessageHelper";

interface MapModalProps {
  open: boolean;
  onClose: () => void;
  onSelectLocation: (location: {
    name: string;
    lat: number;
    lng: number;
  }) => void;
  initialCoordinates?: { lat: number; lng: number };
  canUpdateCompany?: boolean;
}

const MapModal: React.FC<MapModalProps> = ({
  open,
  onClose,
  onSelectLocation,
  initialCoordinates,
  canUpdateCompany,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    lat: number;
    lng: number;
  } | null>(null);

  // Fetch location name when initialCoordinates changes
  useEffect(() => {
    if (open && initialCoordinates) {
      const fetchLocationName = async (lat: number, lng: number) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();
          setSelectedLocation({ name: data.display_name, lat, lng });
        } catch (error) {
          showErrorToast("Error fetching location name:" + error);
        }
      };

      fetchLocationName(initialCoordinates.lat, initialCoordinates.lng);
    }
  }, [open, initialCoordinates]);

  const handleLocationSelect = (coordinates: {
    lat: number;
    lng: number;
    name: string;
  }) => {
    setSelectedLocation({
      name: coordinates.name,
      lat: coordinates.lat,
      lng: coordinates.lng,
    });
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onSelectLocation(selectedLocation);
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 800,
          height: 600,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 3,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" component="h2">
          Select Location
        </Typography>
        <Box sx={{ height: 480, overflow: "hidden" }}>
          <MapComponent
            onSelectLocation={handleLocationSelect}
            isOpen={open}
            initialCoordinates={initialCoordinates}
          />
        </Box>
        <Box display={"flex"} justifyContent={"flex-end"}>
          {canUpdateCompany && (
          <Button
            onClick={handleConfirm}
            disabled={!selectedLocation}
            sx={{ mt: 2 }}
          >
            Confirm
          </Button>
        )}

        <Button onClick={onClose} sx={{ mt: 2, ml: 2 }} variant="outlined">
          Back
        </Button>

        </Box>
        
      </Box>
    </Modal>
  );
};

export default MapModal;

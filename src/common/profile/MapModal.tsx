import React, { useState, useEffect } from "react";
import { Modal, Box, Typography, Button, useMediaQuery } from "@mui/material";
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
          showErrorToast("Error fetching location name");
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
    sx={(theme) => {
      const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
      const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
      return {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: isMobile ? "100%" : isTablet ? "90%" : 900,
        height: isMobile ? "100%" : isTablet ? "80%" : 700,
        bgcolor: "background.paper",
        boxShadow: 24,
        p: 2,
        display: "flex",
        flexDirection: "column",
      };
    }}
  >
    <Typography variant="h6" component="h2" mb={2}>
      Select Location
    </Typography>

    <Box sx={{ flex: 1, overflow: "hidden", mb: 2 }}>
      <MapComponent
        onSelectLocation={handleLocationSelect}
        isOpen={open}
        initialCoordinates={initialCoordinates}
      />
    </Box>

    <Box display="flex" justifyContent="flex-end" gap={2}>
      {canUpdateCompany && selectedLocation && (
        <Button
          onClick={handleConfirm}
          variant="contained"
        >
          Confirm
        </Button>
      )}
      <Button onClick={onClose} variant="outlined">
        Back
      </Button>
    </Box>
  </Box>
</Modal>

);
};

export default MapModal;

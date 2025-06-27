import React from "react";
import {
  Card,
  CardActions,
  Typography,
  Button,
  Box,
  Avatar,
  Divider,
  Chip,
  Grid,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  LocationOn as LocationIcon,
  Event as DateIcon,
  DirectionsBus as BusIcon,
  AccountCircle as PassengerIcon,
  Map as MapIcon,
  ConfirmationNumber as TicketIcon,
} from "@mui/icons-material";

interface TicketDetailsCardProps {
  ticket: {
    id: number;
    service_id: number;
    duty_id: number;
    sequence_id: number;
    pickup_point: number;
    dropping_point: number;
    pickupName: string;
    droppingName: string;
    amount: number;
    distance: number;
    ticket_types: Array<{ name: string; count: number }>;
    created_on: string | null;
  };
  onBack: () => void;
}

const TicketDetailsCard: React.FC<TicketDetailsCardProps> = ({
  ticket,
  onBack,
}) => {
  const formatUTCDateToLocal = (dateString: string | null): string => {
    if (!dateString || dateString.trim() === "") return "Not available";
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Not available"
      : date.toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  const getTicketTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "adult":
        return "primary";
      case "student":
        return "secondary";
      case "child":
        return "success";
      case "senior":
        return "warning";
      default:
        return "default";
    }
  };
  const formatDistance = (distance: number | null | undefined): string => {
    if (distance == null || isNaN(Number(distance)))
      return "Distance not available";
    if (distance < 1000) return `${distance} meters`;
    return `${(distance / 1000).toFixed(2)} km`;
  };
  return (
    <Card
      sx={{
        maxWidth: 450,
        width: "100%",
        margin: "auto",
        boxShadow: 3,
        p: 3,
        borderRadius: 2,
        background: "linear-gradient(to bottom, #f5f5f5, #ffffff)",
      }}
    >
      {/* Header with Ticket ID */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Avatar
          sx={{
            width: 80,
            height: 80,
            bgcolor: "#1976d2",
            mb: 2,
            boxShadow: 2,
          }}
        >
          <TicketIcon fontSize="large" />
        </Avatar>
        <Chip
          label={`Ticket #${ticket.id}`}
          color="primary"
          variant="outlined"
          sx={{ fontWeight: "bold", fontSize: "0.9rem" }}
        />
      </Box>

      {/* Route Information */}
      <Box
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 1,
          bgcolor: "action.hover",
          position: "relative",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 2,
            position: "relative",
          }}
        >
          <LocationIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            From: {ticket.pickupName || "Not available"}
          </Typography>
        </Box>

        <Divider sx={{ my: 1 }} />

        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <LocationIcon color="error" sx={{ mr: 1 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            To: {ticket.droppingName || "Not available"}
          </Typography>
        </Box>

        <Box
          sx={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <BusIcon color="action" fontSize="large" />
        </Box>
      </Box>

      {/* Journey Details */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <MapIcon color="info" sx={{ mr: 1 }} />
            <Typography variant="body2">
              {formatDistance(ticket.distance)}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <TicketIcon color="info" sx={{ mr: 1 }} />
            <Typography variant="body2">
              Sequence: {ticket.sequence_id || "N/A"}
            </Typography>
          </Box>
        </Grid>
        <Grid item>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <DateIcon color="info" sx={{ mr: 1 }} />
            <Typography variant="body2">
              {formatUTCDateToLocal(ticket.created_on)}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Passenger Types */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          gutterBottom
          sx={{ fontWeight: "bold" }}
        >
          PASSENGER DETAILS
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={1}>
          {ticket.ticket_types?.map((type, index) => (
            <Grid item key={index}>
              <Chip
                icon={<PassengerIcon />}
                label={`${type.count} x ${type.name}`}
                color={getTicketTypeColor(type.name)}
                variant="outlined"
                sx={{ fontWeight: "medium" }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Total Amount */}
      <Box
        sx={{
          p: 2,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          borderRadius: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          TOTAL AMOUNT
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          ₹{ticket.amount?.toFixed(2) || "0.00"}
        </Typography>
      </Box>

      {/* Action Buttons */}
      <CardActions sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={onBack}
          startIcon={<BackIcon />}
          sx={{ borderRadius: 2 }}
        >
          close
        </Button>
      </CardActions>
    </Card>
  );
};

export default TicketDetailsCard;

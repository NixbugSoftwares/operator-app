import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface RouteRulesModalProps {
  open: boolean;
  onClose: () => void;
}

const RouteRulesModal: React.FC<RouteRulesModalProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

const rules = [
  "Every route must include at least two landmarks.",
  "The first landmark should always start at distance 0, with both Arrival Time and Departure Time set to 0.",
  "For all middle landmarks, the Departure Time must be later than the Arrival Time.",
  "For the last landmark, the Arrival Time and Departure Time must be the same.",
];


  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, p: 1 },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          fontWeight: "bold",
          bgcolor: theme.palette.primary.main,
          color: "white",
        }}
      >
        <InfoIcon />
        Route Creation Rules
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body1" gutterBottom>
          Please follow the rules below when creating a route and associating
          landmarks:
        </Typography>
        <List>
          {rules.map((rule, idx) => (
            <ListItem key={idx} disablePadding sx={{ mb: 1 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CheckCircleIcon color="success" />
              </ListItemIcon>
              <ListItemText primary={rule} />
            </ListItem>
          ))}
        </List>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", p: 2 }}>
        <Button
          onClick={onClose}
          variant="contained"
          color="primary"
          sx={{  px: 3 }}
        >
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RouteRulesModal;

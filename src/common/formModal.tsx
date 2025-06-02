import {
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Button,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import React from "react";

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCancel?: boolean;
  cancelLabel?: string;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
}

const FormModal: React.FC<FormModalProps> = ({
  open,
  onClose,
  title,
  children,
  showCancel = true,
  cancelLabel = "Cancel",
  maxWidth = "sm",
  fullWidth = true,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth={fullWidth}>
      {title && (
        <DialogTitle>
          {title}
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
      )}

      <DialogContent>{children}</DialogContent>

      {showCancel && (
        <DialogActions>
          <Button onClick={onClose} color="error">
            {cancelLabel}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default FormModal;

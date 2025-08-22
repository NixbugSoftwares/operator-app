import React from "react";
import { Box, Typography, Button, Modal } from "@mui/material";
import { useAppDispatch } from "../store/Hooks";
import { clearRoleDetails, logoutApi, userLoggedOut } from "../slices/appSlice";
import localStorageHelper from "../utils/localStorageHelper";
import commonHelper from "../utils/commonHelper";
import { showErrorToast, showSuccessToast } from "./toastMessageHelper";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

interface LogoutConfirmationModalProps {
  open: boolean;
  onClose: () => void;
}

const LogoutConfirmationModal: React.FC<LogoutConfirmationModalProps> = ({
  open,
  onClose,
}) => {
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    try {
      await dispatch(logoutApi({})).unwrap();
      localStorageHelper.clearStorage();
      localStorageHelper.removeStoredItem("@user");
      dispatch(clearRoleDetails());
      commonHelper.logout();
      dispatch(userLoggedOut());
      showSuccessToast("Logout successful!");
    } catch (error:any) {
      console.error("Logout Error:", error);
      showErrorToast(error.message||"Logout failed. Please try again.");
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Confirm Logout
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Are you sure you want to logout?
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default LogoutConfirmationModal;

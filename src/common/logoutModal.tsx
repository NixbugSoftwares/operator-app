import React from "react";
import { Box, Typography, Button, Modal } from "@mui/material";
import { useAppDispatch } from "../store/Hooks";
import { clearRoleDetails, logoutApi, userLoggedOut } from "../slices/appSlice";
import localStorageHelper from "../utils/localStorageHelper";
import commonHelper from "../utils/commonHelper";
import { showErrorToast, showSuccessToast } from "./toastMessageHelper";


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
  <Box
    sx={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      bgcolor: "background.paper",
      boxShadow: 24,
      p: { xs: 2, sm: 3 },
      borderRadius: 2,
      width: { xs: "80%", sm: 400, md: 450 },
      maxWidth: "95%",
      textAlign: "center",
    }}
  >
    <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
      Confirm Logout
    </Typography>
    <Typography
      variant="body1"
      sx={{ mb: 3, fontSize: { xs: "0.9rem", sm: "1rem" } }}
    >
      Are you sure you want to logout?
    </Typography>
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "row", sm: "row" },
        justifyContent: "flex-end",
        gap: 2,
      }}
    >
      <Button
        variant="outlined"
        onClick={onClose}
        fullWidth={true}
        sx={{ flex: 1 }}
      >
        Cancel
      </Button>
      <Button
        variant="contained"
        color="error"
        onClick={handleLogout}
        fullWidth={true} // Full width on mobile
        sx={{ flex: 1 }}
      >
        Logout
      </Button>
    </Box>
  </Box>
</Modal>

  );
};

export default LogoutConfirmationModal;

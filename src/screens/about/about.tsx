import React from "react";
import { Box, Typography, Button, Modal } from "@mui/material";
import { useAppDispatch } from "../../store/Hooks";
import { logoutApi } from "../../slices/appSlice";
import localStorageHelper from "../../utils/localStorageHelper";
import commonHelper from "../../utils/commonHelper";

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



const about: React.FC= ({
}) => {
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    console.log("Attempting to logout...");
    try {
      console.log("Dispatching logoutApi...");
      const response = await dispatch(logoutApi({})).unwrap();
      console.log("Logout response:", response);

      localStorageHelper.clearStorage();
      commonHelper.logout();
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <Button
      variant="contained"
      color="primary"
      onClick={handleLogout}
    >
      Logout
    </Button>
  );
};

export default about;



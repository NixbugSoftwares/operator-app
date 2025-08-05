import React from "react";
import { Sidebar } from "../../common";
import { Box } from "@mui/material";
import FareListingPage from "../fare/fareListingpage";
const FarePage: React.FC = () => {
  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        width: "100%",
        scrollBehavior: "auto",
      }}
    >
      <Sidebar />
      <Box sx={{ width: "100%", p: 3 }}>
        <FareListingPage />
      </Box>
    </Box>
  );
};

export default FarePage;

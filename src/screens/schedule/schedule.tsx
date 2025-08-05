import React from "react";
import { Sidebar } from "../../common";
import { Box } from "@mui/material";
import ScheduleListingTable from "./scheduleList";


const SchedulePage: React.FC = () => {
  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100%",
        scrollBehavior: "auto",
      }}
    >
      <Sidebar />
      <Box sx={{ width: "100%", p: 3 }}>
        <ScheduleListingTable/>
      </Box>


    </Box>
  );
};

export default SchedulePage;

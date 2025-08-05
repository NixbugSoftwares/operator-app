import React from "react";
import { Sidebar } from "../../common";
import { Box } from "@mui/material";
import BusListingTable from "./BusList";


const BusPage: React.FC = () => {
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
        <BusListingTable/>
      </Box>


    </Box>
  );
};

export default BusPage;

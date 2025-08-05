import React from "react";
import { Sidebar } from "../../common";
import { Box } from "@mui/material";
import ServiceListingTable from "./serviceListingPage";


const ServicePage: React.FC = () => {
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
        <ServiceListingTable/>
      </Box>


    </Box>
  );
};

export default ServicePage;

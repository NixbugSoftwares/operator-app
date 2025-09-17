import React from "react";
import { Sidebar } from "../../common";
import { Box } from "@mui/material";
import RoleListingTable from "./RoleListingPage";

const RolePage: React.FC = () => {
  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh", // ✅ match others
        width: "100%",
        scrollBehavior: "auto",
      }}
    >
      <Sidebar />
      <Box sx={{ width: "100%", p: 3 }}>
        <RoleListingTable />
      </Box>
    </Box>
  );
};

export default RolePage;

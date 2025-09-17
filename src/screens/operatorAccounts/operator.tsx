import React from "react";
import { Sidebar } from "../../common";
import { Box } from "@mui/material";
import AccountListingTable from "./accountListingPage";

const AccountPage: React.FC = () => {
  return (
    <Box
      sx={{
        display: "flex",
        height: "100dvh",
        width: "100%",
        scrollBehavior: "auto",
      }}
    >
      <Sidebar />
      <Box sx={{ width: "100%", p: 3 }}>
        <AccountListingTable />
      </Box>


    </Box>
  );
};

export default AccountPage;

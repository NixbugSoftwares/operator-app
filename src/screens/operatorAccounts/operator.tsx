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
    paddingTop: "max(env(safe-area-inset-top), 16px)",
    paddingBottom: "env(safe-area-inset-bottom)",
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

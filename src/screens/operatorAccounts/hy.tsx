import React from "react";
import { Sidebar } from "../../common";
import { Box } from "@mui/material";
import AccountListingTable from "./accountListingPage";

const AccountPage: React.FC = () => {
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
      <button>jhegfhyegfyue</button>

    </Box>
  );
};

export default AccountPage;

import React from "react";
import { useLocation } from "react-router-dom";
import PaperTicketListingTable from "./paperTicketList";
import { Sidebar } from "../../common";
import { Box } from "@mui/material";


function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const TicketPage: React.FC = () => {
  const query = useQuery();
  const serviceId = query.get("service_id");
  console.log("serviceId", serviceId);

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
        <PaperTicketListingTable serviceId={serviceId ? Number(serviceId) : undefined} />
      </Box>
    </Box>
  );
};

export default TicketPage;
import React from 'react'
import { Sidebar } from "../../common";
import { Box } from '@mui/material';
import BusRouteListing from './BusRouteListingpage';
const BusRoutePage: React.FC = () => {
  return (
    <Box
    sx={{
      display: "flex",
      height: "100%",
      width: "100%",
      scrollBehavior: "auto",
    }}>
      <Sidebar/>
      <Box
      sx={{ width: "100%", p: 3 }}
      >
      <BusRouteListing/>
      </Box>
      

    </Box>
  )
}

export default BusRoutePage
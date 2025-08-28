import React from "react";
import { Box, IconButton } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

type PaginationProps = {
  page: number;
  onPageChange: (newPage: number) => void;
  isLoading: boolean;
  hasNextPage: boolean;
};

const PaginationControls: React.FC<PaginationProps> = ({
  page,
  onPageChange,
  isLoading,
  hasNextPage,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
        mt: 2,
      }}
    >
      {/* Previous Button */}
      <IconButton
        onClick={() => onPageChange(page - 1)}
        disabled={isLoading || page === 0}
        sx={{ color: page === 0 ? "#aaa" : "black" }}
      >
        <ArrowBackIosNewIcon fontSize="small" />
      </IconButton>

      {/* Page Number Circle */}
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          backgroundColor: "#1976d2",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontWeight: "bold",
        }}
      >
        {page + 1}
      </Box>

      {/* Next Button */}
      <IconButton
        onClick={() => onPageChange(page + 1)}
        disabled={isLoading || !hasNextPage}
        sx={{ color: !hasNextPage ? "#aaa" : "black" }}
      >
        <ArrowForwardIosIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default PaginationControls;

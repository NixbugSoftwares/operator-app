import React from "react";
import { Box, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

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
        gap: 1,
        mt: 2,
        p: 2,
        borderTop: "1px solid #e0e0e0",
        backgroundColor: "#f5f5f5",
        borderRadius: "0 0 8px 8px",
      }}
    >
      <Button
        variant="contained"
        color="primary"
        onClick={() => onPageChange(page - 1)}
        disabled={isLoading || page === 0}
        sx={{
          minWidth: 100,
          fontWeight: "bold",
          "&:disabled": {
            backgroundColor: "#e0e0e0",
            color: "#a0a0a0",
          },
        }}
        startIcon={<ArrowBackIcon />}
      >
        Previous
      </Button>

      <Box
        sx={{
          minWidth: 120,
          textAlign: "center",
          backgroundColor: "white",
          padding: "8px 16px",
          borderRadius: 4,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          fontWeight: "bold",
        }}
      >
        Page {page + 1}
      </Box>

      <Button
        variant="contained"
        color="primary"
        onClick={() => onPageChange(page + 1)}
        disabled={isLoading || !hasNextPage}
        sx={{
          minWidth: 100,
          fontWeight: "bold",
          "&:disabled": {
            backgroundColor: "#e0e0e0",
            color: "#a0a0a0",
          },
        }}
        endIcon={<ArrowForwardIcon />}
      >
        Next
      </Button>
    </Box>
  );
};

export default PaginationControls;

import React from "react";
import {  Typography, Container } from "@mui/material";
import { styled } from "@mui/material/styles";
import noNetworkImage from "../assets/png/noNetwork.png"; // Adjust path as necessary

const StyledContainer = styled(Container)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  textAlign: "center",
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(2),
}));

const StyledImage = styled("img")(({ theme }) => ({
  width: "100%",
  maxWidth: "300px", // Limit size on large screens
  height: "auto",
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    maxWidth: "200px", // Smaller images on small screens
  },
}));

const NoNetWorkPage: React.FC = () => {
  return (
    <StyledContainer>
      <StyledImage src={noNetworkImage} alt="No Network" />
      <Typography
        variant="h5"
        color="textPrimary"
        gutterBottom
        sx={{
          fontSize: { xs: "1.2rem", sm: "1.5rem" },
          fontWeight: 600,
        }}
      >
        No Internet Connection
      </Typography>
      <Typography
        variant="body1"
        color="textSecondary"
        sx={{
          fontSize: { xs: "0.9rem", sm: "1rem" },
          maxWidth: 400,
          px: 2,
        }}
      >
        It seems like you're offline. Please check your internet connection and
        try again.
      </Typography>
    </StyledContainer>
  );
};

export default NoNetWorkPage;

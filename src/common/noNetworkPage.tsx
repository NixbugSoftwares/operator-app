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
    padding: "20px",
}));

const StyledImage = styled("img")({
    width: "300px",
    height: "auto",
    marginBottom: "20px",
});

const NoNetWorkPage: React.FC = () => {
    return (
        <StyledContainer>
            <StyledImage src={noNetworkImage} alt="No Network" />
            <Typography variant="h5" color="textPrimary" gutterBottom>
                No Internet Connection
            </Typography>
            <Typography variant="body1" color="textSecondary">
                It seems like you're offline. Please check your internet connection and try again.
            </Typography>
        </StyledContainer>
    );
};

export default NoNetWorkPage;

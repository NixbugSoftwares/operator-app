import React, { useState } from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemButton,
  ListItemText,
  Typography,
  Divider,
  IconButton,
  Collapse,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import RouteIcon from "@mui/icons-material/Route";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import ScheduleIcon from '@mui/icons-material/Schedule';
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import CalculateIcon from "@mui/icons-material/Calculate";
import PersonIcon from '@mui/icons-material/Person';
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useTheme, useMediaQuery } from "@mui/material";
import LogoutConfirmationModal from "./logoutModal";
import localStorageHelper from "../utils/localStorageHelper";
const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
const companyName = localStorageHelper.getItem("@companyName")?.toLowerCase();
  const sections = [
    {
      title: companyName ? companyName : "",
      items: [
        { label: "Operator", path: "/operator", icon: <AccountCircleOutlinedIcon /> },
        { label: "Role", path: "/role", icon: <Diversity3Icon /> },
        { label: "Bus", path: "/bus", icon: <DirectionsBusIcon /> },
        { label: "Route", path: "/busroute", icon: <RouteIcon /> },
        { label: "Fare", path: "/fare", icon: <CalculateIcon /> },
        { label: "Service", path: "/service", icon: <AssignmentIndRoundedIcon /> },
        { label: "Schedule", path: "/schedule", icon: <ScheduleIcon /> },
        {label:"Duty",path:"/duty",icon:<AssignmentTurnedInRoundedIcon/>},
        // {label:"Ticket",path:"/ticket",icon:<ConfirmationNumberIcon/>},
        {label:"Statement",path:"/statement",icon:<ReceiptLongIcon/>},
      ],
    },
  ];

  return (
    <>
      {/******************************************  Toggle Button for Small Screens**************************************************/}
      {isSmallScreen && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={() => setIsOpen(true)}
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            zIndex: theme.zIndex.drawer + 1,
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/****************************************************  SidebarDrawer *************************************************/}
      <Drawer
        variant={isSmallScreen ? "temporary" : "permanent"} 
        open={isSmallScreen ? isOpen : true} 
        onClose={() => setIsOpen(false)} 
        sx={{
          width: isSmallScreen ? "auto" : 240,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 240,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            height: "100vh",
          },
        }}
      >
        {/* Company Name */}
        <Box
          sx={{
            textAlign: "center",
            p: 2,
            bgcolor: "darkblue",
            color: "white",
          }}
        >
          <Typography
            variant="h5"
            fontWeight="bold"
            fontSize={{ xs: "1rem", sm: "1.5rem" }}
          >
           Ente Bus
          </Typography>
        </Box>
        <Divider />

        {/* Navigation Items */}
        <Box sx={{ overflow: "auto", p: 2 }}>
          {sections.map((section, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, textTransform: "uppercase", fontSize: { xs: "0.8rem", sm: "1rem" } }}>
                {section.title}
              </Typography>
              <List>
                {section.items.map((item, idx) => (
                  <ListItem key={idx} disablePadding>
                    <ListItemButton
                      onClick={() => {
                        navigate(item.path);
                        if (isSmallScreen) setIsOpen(false); 
                      }}
                     sx={{
                        backgroundColor:
                          location.pathname === item.path
                            ? "primary.light"
                            : "inherit",
                             borderRadius: 1,
                        "&:hover": {
                          backgroundColor: "#E3F2FD",
                           borderRadius: 1,
                        },
                      }}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
              {index < sections.length - 1 && <Divider />}
            </Box>
          ))}
        </Box>
        {/* *******************************************************logout section******************************************************** */}
        <Box sx={{ px: 2, pt: 1, pb: 0, borderTop: "1px solid #eee", mt: "auto" }}>
          <List>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setUserMenuOpen((prev) => !prev)}
                sx={{
                  borderRadius: 1,
                  minHeight: 40,
                  justifyContent: "center",
                  px: 1,
                  py: 0.5,
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                </ListItemIcon>
                <ListItemText
                  primary="User"
                  primaryTypographyProps={{
                    fontSize: "0.95rem",
                    fontWeight: 500,
                  }}
                  sx={{ m: 0 }}
                />
                {userMenuOpen ? <ExpandMore /> : <ExpandLess />}
              </ListItemButton>
            </ListItem>
            <Collapse in={userMenuOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      navigate("/profile");
                      if (isSmallScreen) setIsOpen(false);
                      setUserMenuOpen(false);
                    }}
                    sx={{
                      pl: 4,
                      backgroundColor:
                        location.pathname === "/profile"
                          ? "primary.light"
                          : "inherit",
                      "&:hover": {
                        backgroundColor: "#E3F2FD",
                      },
                      borderRadius: 1,
                      mb: 1,
                      minHeight: 36,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <PersonIcon />
                    </ListItemIcon>
                    <ListItemText primary="Profile" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      setIsLogoutModalOpen(true);
                      setUserMenuOpen(false);
                    }}
                    sx={{ pl: 4, minHeight: 36 }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <PowerSettingsNewIcon color="error" />
                    </ListItemIcon>
                    <ListItemText primary="Logout" sx={{ color: "error.main" }} />
                  </ListItemButton>
                </ListItem>
              </List>
            </Collapse>
          </List>
        </Box>
        <Box sx={{ width: "100%", pb: 1, pt: 0 }}>
          <Typography
            variant="caption"
            sx={{
              textAlign: "center",
              color: "text.secondary",
              width: "100%",
              display: "block",
            }}
          >
            &copy; {new Date().getFullYear()} EnteBus. All rights reserved.
            <br />
            Version 0.1.0
          </Typography>
        </Box>
      </Drawer>

      <LogoutConfirmationModal
        open={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </>
  );
};

export default Sidebar;
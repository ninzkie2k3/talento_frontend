import React, { useState } from "react";
import Logo from "../assets/logotalentos.png";
import Notification from "../views/Notification";
import { Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  ListItemIcon,
  Toolbar,
  AppBar,
  Drawer,
  Avatar,
  useMediaQuery,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Logout as PowerIcon,
  BarChart as ChartBarIcon,
  Work as BriefcaseIcon,
  People as UserCircleIcon,
  Campaign as CampaignIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useStateContext } from "../context/contextprovider";

export default function AdminLayout() {
  const { user, token, setToken, setUser } = useStateContext();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  // Function to determine the page title based on the current route
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/ManagePost":
        return "Admin Post";
      case "/reports":
        return "Reports";
      case "/ManageBooking":
        return "Manage Bookings";
      case "/CoinRequest":
        return "Coin Requests";
      case "/users":
        return "Users";
      case "/chatusers":
        return "Chat Users";
      case "/PendingPerformers":
        return "Manage Performer";
      case "/complaints":
          return "User Complaints";
      default:
        return "Talento Admin Dashboard";
    }
  };

  // Toggle sidebar open/close
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handle Logout
  const onLogout = (ev) => {
    ev.preventDefault();
    setToken(null);
    setUser(null);
    localStorage.removeItem("USER_DATA");
  };

  // Navigation functions for different sections
  const navigateTo = (route) => {
    navigate(route);
  };

  if (!token) {
    return <Navigate to="/login" />;
  }

  // Sidebar content extracted into a component for reusability
  const SidebarContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: "flex", alignItems: "center", p: 1 }}>
        <Avatar
          src={Logo}
          alt="Talento Logo"
          sx={{
            width: { xs: 50, sm: 70 },
            height: { xs: 50, sm: 70 },
            marginRight: 1,
            border: "2px solid #fff",
          }}
        />
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{
            fontSize: { xs: '1.2rem', sm: '1.5rem' },
            lineHeight: "1.5rem",
            flexGrow: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Welcome <br/>{user?.role || ""} <br/>{user?.name || "Guest"}!
        </Typography>
        {isSmallScreen && (
          <IconButton onClick={toggleSidebar} sx={{ color: "white" }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      <List sx={{ 
        p: 2, 
        flex: 1,
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#888',
          borderRadius: '4px',
        },
      }}>
        {[
          { text: "Post", icon: <CampaignIcon />, route: "/ManagePost" },
          { text: "Reporting", icon: <ChartBarIcon />, route: "/reports" },
          { text: "User Complaints", icon: <UserCircleIcon />, route: "/complaints" },
          { text: "Bookings", icon: <BriefcaseIcon />, route: "/ManageBooking" },
          { text: "TalentoCoins", icon: <BriefcaseIcon />, route: "/CoinRequest" },
          { text: "Users", icon: <UserCircleIcon />, route: "/users" },
          { text: "Chat Users", icon: <UserCircleIcon />, route: "/chatusers" },
          { text: "Performers", icon: <UserCircleIcon />, route: "/PendingPerformers" },
        ].map((item, index) => (
          <ListItem
            button
            key={index}
            onClick={() => navigateTo(item.route)}
            sx={{
              py: { xs: 1.5, sm: 2 },
              px: { xs: 2, sm: 2.5 },
              "&:hover": {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
              borderRadius: "4px",
              mb: 0.5,
              transition: "all 0.3s ease",
            }}
          >
            <ListItemIcon sx={{ color: "white", minWidth: "32px" }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontSize: { xs: '0.8rem', sm: '0.85rem' },
                fontWeight: "bold",
                color: "white",
              }}
            />
          </ListItem>
        ))}
      </List>

      {/* Logout Button - Fixed at bottom */}
      <ListItem
        button
        onClick={onLogout}
        sx={{
          py: { xs: 1.5, sm: 2 },
          px: { xs: 2, sm: 2.5 },
          "&:hover": {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
          borderRadius: "4px",
          mb: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <ListItemIcon sx={{ color: "white", minWidth: "32px" }}>
          <PowerIcon />
        </ListItemIcon>
        <ListItemText
          primary="Log Out"
          primaryTypographyProps={{
            fontSize: { xs: '0.8rem', sm: '0.85rem' },
            fontWeight: "bold",
            color: "white",
          }}
        />
      </ListItem>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* AppBar for top navigation with burger menu */}
      <AppBar position="fixed" sx={{ backgroundColor: theme.palette.primary.main }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <IconButton edge="start" color="inherit" onClick={toggleSidebar}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: "center" }}>
            {getPageTitle()}
          </Typography>
          {/* Notification Component */}
          <Notification />
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      {isSmallScreen ? (
        <Drawer
          anchor="left"
          open={isSidebarOpen}
          onClose={toggleSidebar}
          sx={{
            "& .MuiDrawer-paper": {
              backgroundColor: theme.palette.primary.main,
              color: "#fff",
              width: 250,
            },
          }}
        >
          <SidebarContent />
        </Drawer>
      ) : (
        <Box
          sx={{
            width: isSidebarOpen ? 250 : 0,
            transition: "width 0.3s ease",
            overflow: "hidden",
            backgroundColor: theme.palette.primary.main,
            color: "#fff",
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            paddingTop: "64px", // Height of the AppBar
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <SidebarContent />
        </Box>
      )}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          marginLeft: isSidebarOpen && !isSmallScreen ? "200px" : 0,
          transition: "margin-left 0.3s ease",
          padding: 3,
          
        }}
      >
        {/* Toolbar for spacing */}
        <Toolbar />
        {/* Outlet for Nested Routes */}
        <Outlet context={{ isSidebarOpen }} />
      </Box>
    </Box>
  );
}

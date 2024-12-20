import React, { useState, useEffect } from "react";
import { Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  IconButton,
  Toolbar,
  AppBar,
  Avatar,
  useMediaQuery,
  Drawer,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Logout as PowerIcon,
  Campaign as CampaignIcon,
  AccountBalanceWallet as WalletIcon,
  Chat as ChatBubbleIcon,
  AccountCircle as UserCircleIcon,
  Dashboard as DashboardIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import axiosClient from "../axiosClient";
import { useStateContext } from "../context/contextprovider";
import Logo from "../assets/logotalentos.png";

const sidebarItems = [
  { text: "Urgent Hiring", icon: <CampaignIcon />, route: "/post" },
  { text: "Portfolio", icon: <UserCircleIcon />, route: "/portfolio" },
  { text: "Messages", icon: <ChatBubbleIcon />, route: "/chat" },
  { text: "Dashboard", icon: <DashboardIcon />, route: "/booking" },
  { text: "Wallet", icon: <WalletIcon />, route: "/performer-wallet" },
];

export default function PerformerLayout() {
  const { user, token, setToken, setUser } = useStateContext();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isSmallScreen);
  const [performer, setPerformer] = useState(null);

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/post":
        return "Urgent Hiring";
      case "/portfolio":
        return "Portfolio";
      case "/chat":
        return "Messages";
      case "/booking":
        return "Dashboard";
      case "/performer-wallet":
        return "Performer Wallet";
      default:
        return "Performer Dashboard";
    }
  };

  useEffect(() => {
    if (user) fetchPerformerData();
  }, [user]);

  const fetchPerformerData = async () => {
    try {
      const response = await axiosClient.get(`/performers/${user.id}/portfolio`);
      setPerformer(response.data);
    } catch (error) {
      console.error("Error fetching performer data:", error);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const onLogout = (ev) => {
    ev.preventDefault();
    setToken(null);
    setUser(null);
    localStorage.removeItem("USER_DATA");
  };

  const navigateTo = (route) => navigate(route);
  const SidebarContent = () => (
    <Box
      sx={{
        height: "100%",
        p: 2,
        pt: `calc(${theme.mixins.toolbar.minHeight || 64}px + 36px)`,
      }}
    >
      {/* Profile Section */}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 2 }}>
        <Avatar
          src={
            performer?.user?.image_profile
              ? `https://palegoldenrod-weasel-648342.hostingersite.com/backend/talentoproject_backend/public/storage/${performer.user.image_profile}`
              : Logo
          }
          alt="Profile Image"
          sx={{ width: 70, height: 70, mb: 2, border: "2px solid #fff" }}
        />
        <Typography variant="h6" fontWeight="bold" color="white" align="center">
          Welcome, {user?.name || "Performer"}
        </Typography>
        <Typography variant="subtitle1" color="white">
          Performer
        </Typography>
      </Box>

      {/* Navigation List */}
      <List>
        {sidebarItems.map((item, index) => (
          <ListItem
            button
            key={index}
            onClick={item.route ? () => navigateTo(item.route) : onLogout}
            sx={{
              color: "white",
              "&:hover": { backgroundColor: theme.palette.action.hover },
              borderRadius: "4px",
              mb: 1,
            }}
          >
            <ListItemIcon sx={{ color: "white" }}>{item.icon}</ListItemIcon>
            <Typography variant="body1" fontWeight="bold">
              {item.text}
            </Typography>
          </ListItem>
        ))}
        {/* Logout Button */}
        <ListItem button onClick={onLogout} sx={{ color: "white", mt: 1 }}>
          <ListItemIcon sx={{ color: "white" }}>
            <PowerIcon />
          </ListItemIcon>
          <Typography variant="body1" fontWeight="bold">
            Log Out
          </Typography>
        </ListItem>
      </List>
    </Box>
  );

  if (!token) return <Navigate to="/login" />;

  return (
    <Box
  sx={{
    display: "flex",
    minHeight: "100vh",
    backgroundImage: "url('/confetti.png')", // Maintain background for all screens
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    flexDirection: isSmallScreen ? "column" : "row", // Adjust flex direction for small screens
      }}
    >
      {/* Top AppBar */}
      <AppBar
    position="fixed"
    sx={{
      backgroundImage: "linear-gradient(to right, #D97706, #F59E0B)",
    }}
  >
    <Toolbar>
      <IconButton
        edge="start"
        color="inherit"
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar"
        sx={{
          fontSize: isSmallScreen ? "1.5rem" : "inherit", // Adjust icon size for smaller screens
        }}
      >
        <MenuIcon />
      </IconButton>
      <Typography
        variant={isSmallScreen ? "h6" : "h4"} // Adjust heading size
        sx={{
          flexGrow: 1,
          textAlign: "center",
          color: "white",
          fontWeight: "bold",
          textShadow: "2px 2px 5px rgba(0, 0, 0, 0.5)",
          padding: "8px",
        }}
      >
        {getPageTitle()}
      </Typography>
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
          backgroundImage: "linear-gradient(to right, #D97706, #F59E0B)",
          color: "#fff",
          width: "80%", // Adjust sidebar width for smaller screens
          maxWidth: "300px", // Limit max width
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
        backgroundImage: "linear-gradient(to right, #D97706, #F59E0B)",
        color: "white",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <SidebarContent />
    </Box>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          marginLeft: isSidebarOpen && !isSmallScreen ? "250px" : 0,
          transition: "margin-left 0.3s ease",
          padding: isSmallScreen ? "16px" : "24px", // Reduced padding for smaller screens
        }}
      >
        <Toolbar />
        <Outlet context={{ isSidebarOpen, fetchPerformerData }} />
      </Box>
    </Box>
  );
}

import React, { useState, useEffect } from "react";
import {
  Box,
  Badge,
  IconButton,
  Popover,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Paper,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast,ToastContainer } from "react-toastify";
import axiosClient from "../axiosClient";
import Pusher from "pusher-js";
import Echo from "laravel-echo";

export default function ChatNotification() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const imageBaseURL =
    "https://palegoldenrod-weasel-648342.hostingersite.com/backend/talentoproject_backend/public/storage/";

  useEffect(() => {
    window.Pusher = Pusher;
    window.Echo = new Echo({
      broadcaster: "pusher",
      key: "e1070b4f8d56ec053cee", 
      cluster: "us2",
      forceTLS: true,
    });

    const channel = window.Echo.private("chat-notifications");
    channel.listen(".chat.message", (notification) => {
      handleNewNotification(notification);
    });

    fetchNotifications();

    return () => {
      channel.stopListening(".chat.message");
      window.Echo.leaveChannel("chat-notifications");
    };
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get("/get-notif");
      if (response.status === 200 && response.data) {
        setNotifications(response.data.data || []);
        setUnreadCount(response.data.data?.length || 0);
      }
    } catch (error) {
      console.error("Failed to fetch chat notifications:", error);
      toast.error("Unable to load chat notifications.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewNotification = (notification) => {
    const newNotification = {
      id: notification.id,
      message: `${notification.sender.name} chatted you: "${notification.message}"`,
      sender: notification.sender,
      created_at: notification.created_at,
    };

    setNotifications((prev) => [newNotification, ...prev]);
    setUnreadCount((prev) => prev + 1);
    toast.info(`New message from ${notification.sender.name}`);
  };

  const deleteNotification = async (id) => {
    try {
      const response = await axiosClient.delete(`/noty/${id}`);
      if (response.status === 200) {
        setNotifications((prev) => prev.filter((notif) => notif.id !== id));
        toast.success("Notification removed successfully.");
      } else {
        console.error("Unexpected response:", response);
        toast.error(response.data.message || "Failed to remove notification.");
      }
    } catch (error) {
      if (error.response && error.response.status === 403) {
        toast.error("You are not authorized to delete this notification.");
      } else {
        console.error("Failed to delete notification:", error);
        toast.error("Unable to delete notification.");
      }
    }
  };
  

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setUnreadCount(0); 
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "chat-notification-popover" : undefined;

  return (
    <Box>
      <IconButton aria-describedby={id} onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        />

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Box sx={{ p: 2, width: 300 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Chat Notifications</Typography>
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          {loading ? (
            <CircularProgress />
          ) : (
            <Paper elevation={1} sx={{ maxHeight: 300, overflowY: "auto" }}>
              <List>
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar
                          alt={notification.sender.name}
                          src={
                            notification.sender.image_profile
                              ? `${imageBaseURL}${notification.sender.image_profile}`
                              : "/default-avatar.png"
                          }
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={notification.message}
                        secondary={new Date(notification.created_at).toLocaleString()}
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No chat notifications yet." />
                  </ListItem>
                )}
              </List>
            </Paper>
          )}
        </Box>
      </Popover>
    </Box>
  );
}

import React, { useState, useEffect } from "react";
import axiosClient from "../axiosClient";
import { useStateContext } from "../context/contextprovider";
import { useOutletContext } from "react-router-dom";
import echo from "../echo";
import {
  Box,
  Avatar,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  TextField,
  Button,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function AdminChat() {
  const { user } = useStateContext();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const { isSidebarOpen } = useOutletContext();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch contacts
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await axiosClient.get("/all-users");
        setContacts(response.data.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchAllUsers();
  }, []);

  // Fetch messages for the selected user
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      try {
        const response = await axiosClient.get("/chats", {
          params: { user_id: user.id, contact_id: selectedUser.id },
        });
        setMessages(response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

    const channel = echo.channel("chat-channel").listen(".message.sent", (e) => {
      const newMessage = e.chat;
      if (
        (newMessage.sender_id === user.id &&
          newMessage.receiver_id === selectedUser.id) ||
        (newMessage.sender_id === selectedUser.id &&
          newMessage.receiver_id === user.id)
      ) {
        setMessages((prev) => [...prev, newMessage]);
      }
    });

    return () => {
      echo.leaveChannel("chat-channel");
    };
  }, [selectedUser, user.id]);

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !selectedUser) return;

    try {
      await axiosClient.post("/chats", {
        sender_id: user.id,
        receiver_id: selectedUser.id,
        message: trimmedMessage,
      });
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <Box sx={{ display: "flex", height: "100%" }}>
      {/* Sidebar for Contacts */}
      <Box
        sx={{
          width: isSmallScreen ? "250px" : isSidebarOpen ? "25%" : "0",
          backgroundColor: theme.palette.primary.main,
          color: "white",
          padding: "1rem",
          overflowY: "auto",
          maxHeight: "100vh",
          transition: "width 0.3s ease",
          marginLeft: "40px",
          borderRadius: "10px",
        }}
      >
        {isSidebarOpen && (
          <ContactList contacts={contacts} onUserClick={setSelectedUser} />
        )}
      </Box>

      {/* Chat Box */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          p: 2,
          bgcolor: "background.default",
        }}
      >
       <Box
            sx={{
                p: 2,
                borderBottom: "1px solid #ddd",
                display: "flex",
                alignItems: "center", // Align items vertically
            }}
            >
            {selectedUser && (
                <Avatar
                src={
                    selectedUser?.image_profile
                    ? `https://palegoldenrod-weasel-648342.hostingersite.com/backend/talentoproject_backend/public/storage/${selectedUser.image_profile}`
                    : null // Fallback to null if no image
                }
                alt={selectedUser?.name || "User"}
                sx={{
                    width: 48,
                    height: 48,
                    mr: 2, // Add margin to the right for spacing
                    bgcolor: "secondary.main",
                }}
                >
                {/* Fallback to the first letter of the user's name */}
                {selectedUser?.name?.[0]?.toUpperCase() || "?"}
                </Avatar>
            )}
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {selectedUser ? ` ${selectedUser.name}` : "Select a Contact"}
            </Typography>
            </Box>


        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 2,
            bgcolor: "grey.100",
            borderRadius: 2,
          }}
        >
          {messages.map((msg, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                justifyContent:
                  msg.sender_id === user.id ? "flex-end" : "flex-start",
                mb: 1.5,
              }}
            >
              <Paper
                sx={{
                  p: 1,
                  borderRadius: 2,
                  maxWidth: "70%",
                  bgcolor:
                    msg.sender_id === user.id
                      ? theme.palette.primary.main
                      : "grey.200",
                  color: msg.sender_id === user.id ? "white" : "text.primary",
                }}
              >
                <Typography>{msg.message}</Typography>
              </Paper>
            </Box>
          ))}
        </Box>

        {/* Message Input */}
        {selectedUser && (
          <Box sx={{ display: "flex", p: 2, borderTop: "1px solid #ddd" }}>
            <TextField
              fullWidth
              value={message}
              placeholder="Type a message..."
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              sx={{ mr: 2 }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSendMessage}
            >
              Send
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}

const ContactList = ({ contacts, onUserClick }) => (
    <List sx={{ overflowY: "auto", maxHeight: "80vh" }}>
      <Typography variant="h6" gutterBottom>
        Contacts
      </Typography>
      {contacts.map((contact) => (
        <ListItem
          button
          key={contact?.id} // Use optional chaining to avoid undefined errors
          onClick={() => onUserClick(contact)}
          sx={{ mb: 1, color: "white" }}
        >
          <ListItemAvatar>
            <Avatar
              src={
                contact?.image_profile
                  ? `https://palegoldenrod-weasel-648342.hostingersite.com/backend/talentoproject_backend/public/storage/${contact.image_profile}`
                  : null // Use a fallback/default image
              }
              alt={contact?.name || "User"}
            >
              {contact?.name ? contact.name[0].toUpperCase() : "?"}
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary={contact?.name || "Unknown User"} />
        </ListItem>
      ))}
    </List>
  );
  

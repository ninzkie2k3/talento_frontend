import React, { useState, useEffect } from "react";
import axiosClient from "../axiosClient";
import { useStateContext } from "../context/contextprovider";
import echo from "../echo";
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  TextField,
  Button,
  AppBar,
  Toolbar,
  Drawer,
  useMediaQuery,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTheme } from "@mui/material/styles";

export default function AdminChat() {
  const { user } = useStateContext();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const [clientsResponse, adminsResponse] = await Promise.all([
          axiosClient.get("/chats"),
          axiosClient.get("/getAdmin"),
        ]);

        const clients = clientsResponse?.data?.data || [];
        const admins = adminsResponse?.data || [];

        setContacts([...clients, ...admins]);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    };
    fetchContacts();
  }, [user.id]);

  // Fetch messages for the selected user
  useEffect(() => {
    if (selectedUser) {
      const fetchMessages = async () => {
        try {
          const response = await axiosClient.get("/chats", {
            params: { user_id: user.id, contact_id: selectedUser.id },
          });
          setMessages(response.data);

          echo.channel("chat-channel").listen(".message.sent", (e) => {
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

          return () => echo.leaveChannel("chat-channel");
        } catch (error) {
          console.error("Error fetching messages:", error);
        }
      };
      fetchMessages();
    }
  }, [selectedUser, user.id]);

  const handleSendMessage = async () => {
    if (message.trim() && selectedUser) {
      try {
        await axiosClient.post("/chats", {
          sender_id: user.id,
          receiver_id: selectedUser.id,
          message,
        });
        setMessage("");
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  const toggleDrawer = () => setDrawerOpen((prev) => !prev);

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* Sidebar for Contacts */}
      {isSmallScreen ? (
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={toggleDrawer}
          sx={{ "& .MuiDrawer-paper": { width: "250px" } }}
        >
          <ContactList contacts={contacts} onUserClick={setSelectedUser} />
        </Drawer>
      ) : (
        <Box
          sx={{
            width: "25%",
            backgroundColor: "#1976d2",
            color: "#fff",
            p: 2,
          }}
        >
          <ContactList contacts={contacts} onUserClick={setSelectedUser} />
        </Box>
      )}

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
        <AppBar position="static" color="primary">
          <Toolbar>
            {isSmallScreen && (
              <IconButton edge="start" color="inherit" onClick={toggleDrawer}>
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant="h6">
              {selectedUser ? selectedUser.name : "Select a Contact"}
            </Typography>
          </Toolbar>
        </AppBar>

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
                elevation={3}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  maxWidth: "70%",
                  bgcolor:
                    msg.sender_id === user.id
                      ? theme.palette.primary.main
                      : "background.paper",
                  color:
                    msg.sender_id === user.id ? "white" : "text.primary",
                }}
              >
                <Typography>{msg.message}</Typography>
              </Paper>
            </Box>
          ))}
        </Box>

        {/* Message Input */}
        {selectedUser && (
          <Box sx={{ display: "flex", p: 2, borderTop: "1px solid #ccc" }}>
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
  <>
    <Typography variant="h6" gutterBottom>
      Contacts
    </Typography>
    <List>
      {contacts.map((contact) => (
        <ListItem
          button
          key={contact.id}
          onClick={() => onUserClick(contact)}
          sx={{ mb: 1 }}
        >
          <ListItemAvatar>
            <Avatar>{contact.name?.[0]}</Avatar>
          </ListItemAvatar>
          <ListItemText primary={contact.name} />
        </ListItem>
      ))}
    </List>
  </>
);

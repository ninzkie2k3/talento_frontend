import React, { useState, useEffect } from "react";
import axiosClient from "../axiosClient";
import { useOutletContext } from "react-router-dom";
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
  AppBar,
  Toolbar,
  Button,
  TextField,
  useMediaQuery,
  Paper,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTheme } from "@mui/material/styles";

export default function Messages() {
  const { isSidebarOpen } = useOutletContext();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const { user } = useStateContext();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  // Update fetchContacts useEffect
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const [groupsResponse, adminsResponse] = await Promise.all([
          axiosClient.get("/canChatClients"),
          axiosClient.get("/getAdmin"),
        ]);

        let groups = [];
        let admins = [];

        if (groupsResponse?.data?.status === "success") {
          groups = groupsResponse.data.data.map(booking => ({
            ...booking,
            name: booking.event_name,
            isGroup: true
          }));
        }

        if (Array.isArray(adminsResponse?.data)) {
          admins = adminsResponse.data.map(admin => ({
            ...admin,
            isAdmin: true
          }));
        }

        setContacts([...groups, ...admins]);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        setContacts([]);
      }
    };

    fetchContacts();
  }, []);

  // Update message fetching useEffect
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      try {
        const response = await axiosClient.get("/chats", {
          params: {
            user_id: user.id,
            ...(selectedUser.isGroup 
              ? { group_chat_id: selectedUser.group_chat_id }
              : { contact_id: selectedUser.id }
            )
          }
        });
        setMessages(response.data || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

    const channel = echo.channel('chat-channel');
    channel.listen('.message.sent', (e) => {
      if ((selectedUser.isGroup && e.chat.group_chat_id === selectedUser.group_chat_id) ||
          (!selectedUser.isGroup && 
            (e.chat.sender_id === selectedUser.id || e.chat.receiver_id === selectedUser.id))) {
        setMessages(prev => [...prev, e.chat]);
      }
    });

    return () => {
      channel.stopListening('.message.sent');
    };
  }, [selectedUser, user.id]);

  useEffect(() => {
    if (selectedUser) {
      const markMessagesAsSeen = async () => {
        const unseenMessages = messages.filter(msg => 
          msg.sender_id !== user.id && 
          (!msg.seen_by || !msg.seen_by.includes(user.id))
        );
        
        for (const msg of unseenMessages) {
          try {
            await axiosClient.post('/chats/seen', { message_id: msg.id });
          } catch (error) {
            console.error('Error marking message as seen:', error);
          }
        }
      };
  
      markMessagesAsSeen();
  
      // Listen for real-time updates
      const channel = echo.channel('chat-channel');
      channel.listen('.message.seen', (e) => {
        setMessages(prev => prev.map(msg => {
          if (msg.id === e.chat.id) {
            return { ...msg, seen_by: e.chat.seen_by };
          }
          return msg;
        }));
      });
  
      return () => {
        channel.stopListening('.message.seen');
      };
    }
  }, [selectedUser, messages]);

  // Update send message function
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedUser) return;

    try {
      await axiosClient.post("/chats", {
        sender_id: user.id,
        ...(selectedUser.isGroup 
          ? { group_chat_id: selectedUser.group_chat_id }
          : { receiver_id: selectedUser.id }
        ),
        message: message.trim()
      });
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Handle user selection from contacts list
  const handleUserClick = (contact) => {
    setSelectedUser(contact);
    setMessages([]);
  };

  // Scroll chat area to bottom on new messages
  useEffect(() => {
    const chatArea = document.getElementById("chatArea");
    if (chatArea) {
      chatArea.scrollTop = chatArea.scrollHeight;
    }
  }, [messages]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isSmallScreen ? "column" : "row",
        height: "85vh",
        bgcolor: "background.default",
      }}
    >
      {/* Contact List */}
      <Box
        sx={{
          width: isSmallScreen ? "100%" : "30%",
          backgroundColor: "#ff9800", 
          color: "#fff",
          overflowY: "auto",
          display: selectedUser && isSmallScreen ? "none" : "block",
          p: 2,
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Contacts
        </Typography>
        <List>
          {contacts.length > 0 ? (
            contacts.map((contact, index) => (
              <ListItem
                button
                key={contact.isGroup ? contact.booking_id : contact.id}
                onClick={() => handleUserClick(contact)}
              >
                <ListItemAvatar>
                  <Avatar>
                    {contact.isGroup 
                      ? contact.event_name?.[0] 
                      : contact.name?.[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={contact.isGroup ? contact.event_name : contact.name}
                  secondary={contact.isGroup ? `Performers: ${contact.performers}` : "Admin"}
                />
              </ListItem>
            ))
          ) : (
            <Typography sx={{ p: 2 }}>No contacts available to chat.</Typography>
          )}
        </List>
      </Box>

      {/* Chat Area */}
      {selectedUser && (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            bgcolor: "#fff3e0", // Light orange background
            p: 2,
          }}
        >
          {/* Chat Header */}
          <Box 
            sx={{ 
              p: 2, 
              bgcolor: "#ff9800", // Change to orange
              color: "white",
              display: "flex", 
              alignItems: "center",
              borderBottom: 1,
              borderColor: "divider"
            }}
          >
            {selectedUser && (
              <>
                <Avatar 
                  src={selectedUser.image_profile ? 
                    `https://palegoldenrod-weasel-648342.hostingersite.com/backend/talentoproject_backend/public/storage/${selectedUser.image_profile}` 
                    : null
                  }
                  sx={{ width: 40, height: 40 }}
                >
                  {selectedUser.name?.[0] || "U"}
                </Avatar>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="h6" sx={{ color: "white" }}>{selectedUser.name}</Typography>
                  {selectedUser.isGroup && (
                    <Typography variant="caption" sx={{ color: "white", opacity: 0.8 }}>
                      {selectedUser.performers}
                    </Typography>
                  )}
                </Box>
              </>
            )}
          </Box>

          {/* Chat Messages */}
          <Box
            id="chatArea"
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 2,
              bgcolor: "grey.100",
              borderRadius: 2,
              mb: 2,
            }}
          >
            {messages.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No messages yet.
              </Typography>
            ) : (
              messages.map((msg, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: msg.sender_id === user.id ? "flex-end" : "flex-start",
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                    {msg.sender_id !== user.id && (
                      <Avatar
                        src={msg.sender?.image_profile ? 
                          `https://palegoldenrod-weasel-648342.hostingersite.com/backend/talentoproject_backend/public/storage/${msg.sender.image_profile}`
                          : null
                        }
                        sx={{ width: 24, height: 24, mr: 1 }}
                      >
                        {msg.sender?.name?.[0]}
                      </Avatar>
                    )}
                    <Typography variant="caption" color="textSecondary" sx={{ mr: 1 }}>
                      {msg.sender_id !== user.id ? msg.sender?.name : 'You'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <Box
                      sx={{
                        maxWidth: "200px",
                        p: 2,
                        bgcolor: msg.sender_id === user.id ? "#ff9800" : "grey.100", // Change sender's message to orange
                        color: msg.sender_id === user.id ? "white" : "text.primary",
                        borderRadius: 2,
                        boxShadow: 1,
                      }}
                    >
                      <Typography
                        sx={{
                          wordBreak: "break-word",
                          whiteSpace: "pre-wrap",
                          overflowWrap: "break-word"
                        }}
                      >
                        {msg.message}
                      </Typography>
                    </Box>
                    {msg.sender_id === user.id && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.7rem', 
                        color: 'text.secondary',
                        mt: 0.5 
                      }}
                    >
                      {msg.seen_by ? (
                        `Seen by ${selectedUser?.performers || 'User'}`
                      ) : (
                        'Delivered'
                      )}
                    </Typography>
                  )}

                  </Box>
                </Box>
              ))
            )}
          </Box>

          {/* Message Input */}
          <Box
            sx={{
              display: "flex",
              p: 2,
              borderTop: "1px solid #ccc",
              alignItems: "center",
              bgcolor: "grey.200",
            }}
          >
            <TextField
              variant="outlined"
              placeholder="Type something here..."
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              sx={{
                mr: 2,
                bgcolor: "white",
                borderRadius: 1,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "grey.400",
                  },
                },
              }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSendMessage}
              sx={{ height: "100%",  bgcolor: "#ff9800" }}
            >
              Send
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}

import React, { useState, useEffect } from "react";
import axiosClient from "../axiosClient";
import {
  Box,
  Avatar,
  Button,
  TextField,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  useTheme,
  useMediaQuery,
  Badge,
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useStateContext } from "../context/contextprovider";
import echo from "../echo";

const ChatButton = ({ onClick, unreadCount }) => (
  <div className="relative">
    <button 
      onClick={onClick}
      className="w-[55px] h-[55px] flex items-center justify-center rounded-full border-none bg-gradient-to-r from-[#FFE53B] via-[#FF2525] to-[#FFE53B] cursor-pointer pt-[3px] shadow-md bg-[length:300%] bg-left transition-all duration-1000 hover:bg-right"
    >
      <Badge
        badgeContent={unreadCount}
        color="error"
        sx={{
          '& .MuiBadge-badge': {
            right: -3,
            top: 3,
          }
        }}
      >
        <svg height="1.6em" fill="white" xmlSpace="preserve" viewBox="0 0 1000 1000" y="0px" x="0px" version="1.1">
          <path d="M881.1,720.5H434.7L173.3,941V720.5h-54.4C58.8,720.5,10,671.1,10,610.2v-441C10,108.4,58.8,59,118.9,59h762.2C941.2,59,990,108.4,990,169.3v441C990,671.1,941.2,720.5,881.1,720.5L881.1,720.5z" />
        </svg>
      </Badge>
      <span className="absolute -top-10 opacity-0 bg-[rgb(255,180,82)] text-white px-2.5 py-1.5 rounded-md flex items-center justify-center transition-opacity duration-500 pointer-events-none tracking-wider group-hover:opacity-100">
        Chat
      </span>
    </button>
  </div>
);

export default function ChatCustomer() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isMediumScreen = useMediaQuery(theme.breakpoints.down("md"));

  const { user } = useStateContext(); // Get the logged-in user
  const [message, setMessage] = useState(""); // Current message input
  const [isInputDisabled, setIsInputDisabled] = useState(false); // To temporarily disable input
  const [messages, setMessages] = useState([]); // Chat messages
  const [contacts, setContacts] = useState([]); // Contact list
  const [selectedUser, setSelectedUser] = useState(null); // Selected contact
  const [isChatOpen, setIsChatOpen] = useState(false); // Toggle chat window
  const [isContactSelected, setIsContactSelected] = useState(false); // Contact/chat toggle
  const [isSending, setIsSending] = useState(false); // Sending state
  const [tempError, setTempError] = useState(""); // Temporary error message
  const [unreadCounts, setUnreadCounts] = useState({});
  const [unreadMessages, setUnreadMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0); // Add state for unread messages

  // Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const [performerResponse, adminResponse] = await Promise.all([
          axiosClient.get("/canChatPerformer"),
          axiosClient.get("/getAdmin")
        ]);

        let bookingGroups = [];
        let adminContacts = [];

        if (performerResponse?.data?.status === "success") {
          bookingGroups = performerResponse.data.data;
        }

        if (Array.isArray(adminResponse?.data)) {
          adminContacts = adminResponse.data.map(admin => ({
            ...admin,
            isAdmin: true // Flag to identify admin contacts
          }));
        }

        setContacts([...bookingGroups, ...adminContacts]);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        setContacts([]);
      }
    };

    fetchContacts();
  }, []);

  // Fetch messages for the selected user
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      try {
        const response = await axiosClient.get("/chats", {
          params: {
            user_id: user.id,
            ...(selectedUser.isAdmin 
              ? { contact_id: selectedUser.id }
              : { group_chat_id: selectedUser.group_chat_id }
            )
          }
        });
        setMessages(response.data || []);

        // Mark messages as seen
        const unseenMessages = response.data.filter(msg => 
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
      } catch (error) {
        console.error("Error fetching messages:", error);
        setMessages([]);
      }
    };

    fetchMessages();

    const channel = echo.channel("chat-channel");
    
    // Message sent listener
    channel.listen(".message.sent", (e) => {
      const newMessage = e.chat;
      if ((selectedUser.isAdmin && 
          (newMessage.sender_id === selectedUser.id || newMessage.receiver_id === selectedUser.id)) ||
          (!selectedUser.isAdmin && newMessage.group_chat_id === selectedUser.group_chat_id)) {
        setMessages(prev => [...prev, newMessage]);
      }
    });

    // Message seen listener
    channel.listen(".message.seen", (e) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === e.chat.id) {
          return { ...msg, seen_by: e.chat.seen_by };
        }
        return msg;
      }));
    });

    return () => {
      channel.stopListening(".message.sent");
      channel.stopListening(".message.seen");
      echo.leaveChannel('chat-channel');
    };
  }, [selectedUser, user.id]);

  // Send message
  const handleSendMessage = async () => {
    if (!message.trim()) {
      setTempError("Message cannot be empty");
      setIsInputDisabled(true);
      setTimeout(() => {
        setTempError("");
        setIsInputDisabled(false);
      }, 2000);
      return;
    }

    setIsSending(true);
    try {
      await axiosClient.post("/chats", {
        sender_id: user.id,
        ...(selectedUser.isAdmin 
          ? { receiver_id: selectedUser.id }
          : { group_chat_id: selectedUser.group_chat_id }
        ),
        message: message.trim()
      });
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      setTempError("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // Handle user selection
  const handleUserClick = (contact) => {
    setSelectedUser(contact);
    setIsContactSelected(true);
    setMessages([]);
  };

  // Back to contacts
  const handleBackToContacts = () => {
    setIsContactSelected(false);
    setSelectedUser(null);
  };

  // Auto-scroll chat
  useEffect(() => {
    const chatArea = document.getElementById("chatArea");
    if (chatArea) {
      chatArea.scrollTop = chatArea.scrollHeight;
    }
  }, [messages]);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add read status update function
  const markMessagesAsSeen = async (contactId) => {
    try {
      await axiosClient.post(`/messages/mark-as-seen`, {
        contact_id: contactId
      });
      setUnreadCounts(prev => ({
        ...prev,
        [contactId]: 0
      }));
    } catch (error) {
      console.error('Error marking messages as seen:', error);
    }
  };

  // Update useEffect for fetching messages
  useEffect(() => {
    // ...existing Echo listener code...
    echo.private(`chat`)
      .listen('MessageSent', (e) => {
        if (e.message.sender_id !== user.id) {
          setMessages(prev => [...prev, e.message]);
          setUnreadCounts(prev => ({
            ...prev,
            [e.message.sender_id]: (prev[e.message.sender_id] || 0) + 1
          }));
        }
      });
  }, [selectedUser]);

  // Update contact click handler
  const handleContactClick = async (contact) => {
    setSelectedUser(contact);
    setIsContactSelected(true);
    if (unreadCounts[contact.id] > 0) {
      await markMessagesAsSeen(contact.id);
    }
  };

  // Add useEffect to fetch unread messages
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await axiosClient.get('/chats/unread-count');
        if (response.data.status === 'success') {
          setUnreadCount(response.data.count);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Listen for new messages
    echo.private(`chat.${user.id}`)
      .listen('MessageSent', (e) => {
        if (e.message.receiver_id === user.id) {
          setUnreadCount(prev => prev + 1);
        }
      });

    return () => {
      echo.leave(`chat.${user.id}`);
    };
  }, [user.id]);

  return (
    <div className="fixed bottom-0 right-4">
      {!isChatOpen ? (
        <ChatButton onClick={() => setIsChatOpen(true)} unreadCount={unreadCount} />
      ) : (
        <div className="fixed bottom-[70px] right-4 w-[80%] md:w-[70%] lg:w-[400px] h-[50vh] md:h-[410px] bg-white shadow-2xl rounded-[10px] flex flex-col">
          <div className="p-4 bg-[#ff9800] text-white flex justify-between items-center">
            {isContactSelected ? (
              <>
                <IconButton onClick={handleBackToContacts} sx={{ color: "white" }}>
                  <ArrowBackIcon />
                </IconButton>
                <Box sx={{ display: "flex", alignItems: "center", flex: 1, ml: 1 }}>
                  <Avatar
                    src={selectedUser.image_profile ? 
                      `https://palegoldenrod-weasel-648342.hostingersite.com/backend/talentoproject_backend/public/storage/${selectedUser.image_profile}`
                      : null
                    }
                    sx={{ width: 40, height: 40, mr: 2 }}
                  >
                    {selectedUser.name?.[0] || "U"}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{selectedUser.event_name}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {selectedUser.performers}
                    </Typography>
                  </Box>
                </Box>
              </>
            ) : (
              <Typography variant="h6">Contacts</Typography>
            )}
            <IconButton sx={{ color: "white" }} onClick={() => setIsChatOpen(false)}>
              <CloseIcon />
            </IconButton>
          </div>

          <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
            {isContactSelected ? (
              <div id="chatArea" style={{ maxHeight: "100%", overflowY: "auto" }}>
                {messages.map((msg, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: msg.sender_id === user.id ? "flex-end" : "flex-start",
                      mb: 2,
                      px: 2,
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
                    <Box
                      sx={{
                        maxWidth: "200px",
                        p: 2,
                        bgcolor: msg.sender_id === user.id ? "#ff9800" : "grey.100",
                        color: msg.sender_id === user.id ? "white" : "text.primary",
                        borderRadius: 2,
                        boxShadow: 1,
                      }}
                    >
                      <Typography>{msg.message}</Typography>
                    </Box>
                    {msg.sender_id === user.id && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '0.7rem', 
                          color: 'text.secondary',
                          mt: 0.5,
                          ml: 1
                        }}
                      >
                        {msg.seen_by 
                          ? `Seen by ${selectedUser?.performers || selectedUser?.name}`
                          : 'Delivered'
                        }
                      </Typography>
                    )}
                  </Box>
                ))}
              </div>
            ) : (
              <List>
                {contacts.map((contact) => (
                  <ListItem
                    key={contact.isAdmin ? contact.id : contact.booking_id}
                    button
                    onClick={() => handleContactClick(contact)}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        {contact.isAdmin 
                          ? contact.name?.[0] || "A"
                          : contact.event_name?.[0] || "E"
                        }
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={contact.isAdmin ? contact.name : contact.event_name}
                      secondary={contact.isAdmin ? "Admin" : `Performers: ${contact.performers}`}
                    />
                    {unreadCounts[contact.id] > 0 && (
                      <span className="bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                        {unreadCounts[contact.id]}
                      </span>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          {isContactSelected && (
            <Box sx={{ display: "flex", p: 2, borderTop: "1px solid #ccc" }}>
              <TextField
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message"
                disabled={isInputDisabled || isSending}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                variant="contained"
                sx={{ ml: 2 }}
                disabled={isSending}
              >
                Send
              </Button>
            </Box>
          )}
        </div>
      )}
    </div>
  );
}

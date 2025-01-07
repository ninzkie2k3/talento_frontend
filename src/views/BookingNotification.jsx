import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import axiosClient from '../axiosClient';
import { DeleteOutline } from '@mui/icons-material';

export default function BookingNotification() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [anchorEl, setAnchorEl] = useState(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await axiosClient.get('/get-booking-notifications');
            if (response.data.status === 'success') {
                setNotifications(response.data.data);
                setUnreadCount(response.data.data.filter(n => !n.is_read).length);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleDelete = async (id, event) => {
        event.stopPropagation(); // Prevent menu item click
        
        try {
            await axiosClient.delete(`/booking-notifications/${id}`);
            
            // Find notification before removing it
            const deletedNotification = notifications.find(n => n.id === id);
            
            // Update notifications list
            setNotifications(prev => prev.filter(n => n.id !== id));
            
            // Only decrease count if deleted notification was unread
            if (deletedNotification && !deletedNotification.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        try {
            await axiosClient.post(`/notifications/mark-read/${notification.id}`);
            setNotifications(prevNotifications => 
                prevNotifications.map(notif => 
                    notif.id === notification.id 
                        ? { ...notif, is_read: true }
                        : notif
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleBellClick = async (event) => {
        handleClick(event);
        try {
            await axiosClient.post('/notifications/mark-read');
            setNotifications(prevNotifications => 
                prevNotifications.map(notif => ({ ...notif, is_read: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    return (
        <div>
            <IconButton onClick={handleBellClick} sx={{ color: '#FF9800' }}>
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>
            <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                    PaperProps={{
                        style: {
                        maxHeight: '400px',
                        width: '400px', // Increase width to fit content
                        overflow: 'auto', // Ensure scrolling for long content
                        },
                    }}
                    >

                {notifications.length > 0 ? (
                    notifications.map((notification) => (
                        <MenuItem 
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <Box sx={{ 
                                width: '100%', 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center' 
                            }}>
                               <Box sx={{ flex: 1, wordBreak: 'break-word' }}>
                                <Typography
                                    variant="subtitle2"
                                    sx={{ fontWeight: !notification.is_read ? 'bold' : 'normal' }}
                                >
                                    {notification.message}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    {new Date(notification.created_at).toLocaleString()}
                                </Typography>
                                </Box>

                                <IconButton 
                                    size="small" 
                                    onClick={(e) => handleDelete(notification.id, e)}
                                >
                                    <DeleteOutline fontSize="small" />
                                </IconButton>
                            </Box>
                        </MenuItem>
                    ))
                ) : (
                    <MenuItem disabled>No notifications</MenuItem>
                )}
            </Menu>
        </div>
    );
}
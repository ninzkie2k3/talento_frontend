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
import echo from '../echo';

export default function PerformerBookingNotification() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [anchorEl, setAnchorEl] = useState(null);

    useEffect(() => {
        fetchNotifications();
        
        // Listen for new booking notifications
        echo.private('notifications')
            .listen('BookingCreated', (e) => {
                setNotifications(prev => [e.notification, ...prev]);
                setUnreadCount(prev => prev + 1);
            });

        return () => {
            echo.leave('notifications');
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await axiosClient.get('/notifications/performer');
            if (response.data.status === 'success') {
                const bookingNotifications = response.data.data.filter(
                    n => n.type === 'booking_received'
                );
                setNotifications(bookingNotifications);
                setUnreadCount(bookingNotifications.filter(n => !n.is_read).length);
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

    return (
        <div>
            <IconButton onClick={handleClick} sx={{ color: '#FF9800' }}>
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
                        width: '350px',
                    },
                }}
            >
                {notifications.length > 0 ? (
                    notifications.map((notification) => (
                        <MenuItem key={notification.id}>
                            <Box sx={{ width: '100%' }}>
                                <Typography 
                                    variant="subtitle2" 
                                    sx={{ 
                                        fontWeight: !notification.is_read ? 'bold' : 'normal'
                                    }}
                                >
                                    {notification.message}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    {new Date(notification.created_at).toLocaleString()}
                                </Typography>
                            </Box>
                        </MenuItem>
                    ))
                ) : (
                    <MenuItem disabled>No new booking notifications</MenuItem>
                )}
            </Menu>
        </div>
    );
}
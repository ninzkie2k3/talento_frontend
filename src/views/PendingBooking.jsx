import React, { useEffect, useState } from 'react';
import axiosClient from '../axiosClient';
import dayjs from 'dayjs';
import {
    Box,
    Typography,
    CircularProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function PendingBooking() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const response = await axiosClient.get('getMyBooking', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                setBookings(response.data.data || []);
            } catch (error) {
                console.error('Error fetching bookings:', error);
                toast.error('Failed to load pending bookings.');
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    const handleOpenDialog = (booking) => {
        setSelectedBooking(booking);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedBooking(null);
    };

    const handleConfirmCancel = async () => {
        if (!selectedBooking) return;
        try {
            await axiosClient.put(`/bookings/${selectedBooking.id}/cancel`, null, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            toast.success('Booking cancelled successfully.');
            setBookings((prevBookings) =>
                prevBookings.filter((booking) => booking.id !== selectedBooking.id)
            );
        } catch (error) {
            console.error('Error cancelling booking:', error);
            toast.error('Failed to cancel booking.');
        } finally {
            handleCloseDialog();
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" align="center" gutterBottom>
                Your Booking that waiting for the Performer Response
            </Typography>
            {bookings.length === 0 ? (
                <Typography variant="body1" align="center">
                    No pending bookings found.
                </Typography>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Event</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Time</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {bookings.map((booking) => (
                                <TableRow key={booking.id}>
                                    <TableCell>{booking.event_name}</TableCell>
                                    <TableCell>{dayjs(booking.start_time, "HH:mm").format("h:mm A")} to {dayjs(booking.end_time, "HH:mm").format("h:mm A")}</TableCell>
                                    <TableCell>{dayjs(booking.date).format('MMMM D, YYYY')}</TableCell>
                                    <TableCell>{booking.status}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            onClick={() => handleOpenDialog(booking)}
                                        >
                                            Cancel
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Cancel Booking</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to cancel this booking? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        No
                    </Button>
                    <Button onClick={handleConfirmCancel} color="error" autoFocus>
                        Yes, Cancel
                    </Button>
                </DialogActions>
            </Dialog>

            <div>
                <ToastContainer />
            </div>
        </Box>
    );
}

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
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function PendingBooking() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const handleCancelBooking = async (bookingId) => {
        try {
            await axiosClient.put(`/bookings/${bookingId}/cancel`, null, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            toast.success('Booking cancelled successfully.');
            setBookings((prevBookings) =>
                prevBookings.filter((booking) => booking.id !== bookingId)
            );
        } catch (error) {
            console.error('Error cancelling booking:', error);
            toast.error('Failed to cancel booking.');
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
            {/* Toast Container */}
            <ToastContainer />
            <Typography variant="h4" align="center" gutterBottom>
                Pending Bookings
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
                                <TableCell>Booking ID</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Time</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {bookings.map((booking) => (
                                <TableRow key={booking.id}>
                                    <TableCell>{booking.id}</TableCell>
                                    <TableCell> {dayjs(booking.start_time, "HH:mm").format("h:mm A")} to{" "}
                                                            {dayjs(booking.end_time, "HH:mm").format("h:mm A")}</TableCell>
                                    <TableCell>
                                        {dayjs(booking.date).format('MMMM D, YYYY')}
                                    </TableCell>
                                    <TableCell>{booking.status}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            onClick={() => handleCancelBooking(booking.id)}
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
        </Box>
    );
}

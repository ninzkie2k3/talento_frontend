import React, { useState, useEffect } from "react";
import axiosClient from "../axiosClient";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Box,
  CircularProgress,
  Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, IconButton
} from "@mui/material";
import { Edit, Delete } from '@mui/icons-material';
import { toast } from 'react-toastify';

// Helper function to convert 24-hour time to 12-hour time with AM/PM
const formatTime12Hour = (time) => {
  if (!time) return "N/A";
  const [hours, minutes] = time.split(":");
  const hourInt = parseInt(hours, 10);
  const suffix = hourInt >= 12 ? "PM" : "AM";
  const formattedHour = hourInt % 12 || 12; // Convert 0 or 12 to 12
  return `${formattedHour}:${minutes} ${suffix}`;
};

export default function ManageBooking() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editForm, setEditForm] = useState({
    event_name: '',
    theme_name: '',
    start_date: '',
    start_time: '',
    end_time: '',
    status: ''
  });

  // Function to fetch bookings
  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get("/admin/bookings");
      setBookings(response.data.data);
      toast.success('Bookings loaded successfully');
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load bookings.");
      toast.error(err.response?.data?.error || "Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleEdit = (booking) => {
    setSelectedBooking(booking);
    setEditForm({
      event_name: booking.event_name,
      theme_name: booking.theme_name,
      start_date: booking.start_date,
      start_time: booking.start_time,
      end_time: booking.end_time,
      status: booking.status
    });
    setOpenEditModal(true);
  };

  const handleDelete = (booking) => {
    setSelectedBooking(booking);
    setOpenDeleteDialog(true);
  };

  const handleUpdate = async () => {
    try {
      await axiosClient.put(`/admin/bookings/${selectedBooking.id}`, editForm);
      setOpenEditModal(false);
      fetchBookings(); // Refresh list
      toast.success('Booking updated successfully');
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update booking');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await axiosClient.delete(`/admin/bookings/${selectedBooking.id}`);
      setOpenDeleteDialog(false);
      fetchBookings(); // Refresh list
      toast.success('Booking deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete booking');
    }
  };

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" className="text-center font-semibold">
          Manage Bookings
        </Typography>
        <Button variant="contained" onClick={fetchBookings}>
          Refresh
        </Button>
      </Box>

      {isLoading && (
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Typography color="error" variant="h6" className="text-center">
          {error}
        </Typography>
      )}

      {!isLoading && bookings.length > 0 && (
        <Box sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Event Name</TableCell>
                <TableCell>Theme</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
                <TableCell>Performers</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((booking, index) => (
                <TableRow key={booking.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{booking.event_name}</TableCell>
                  <TableCell>{booking.theme_name}</TableCell>
                  <TableCell>{booking.start_date}</TableCell>
                  <TableCell>{formatTime12Hour(booking.start_time)}</TableCell>
                  <TableCell>{formatTime12Hour(booking.end_time)}</TableCell>
                  <TableCell>
                    {booking.performers.length > 0
                      ? booking.performers.map((p) => p.name).join(", ")
                      : "N/A"}
                  </TableCell>
                  <TableCell>{booking.client.name}</TableCell>
                  <TableCell>{booking.status}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(booking)} color="primary">
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(booking)} color="error">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {!isLoading && bookings.length === 0 && (
        <Typography variant="h6" className="text-center">
          No bookings available.
        </Typography>
      )}

      {/* Edit Modal */}
      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)}>
        <DialogTitle>Edit Booking</DialogTitle>
        <DialogContent>
          <TextField
            label="Event Name"
            value={editForm.event_name}
            onChange={(e) => setEditForm({...editForm, event_name: e.target.value})}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Theme Name"
            value={editForm.theme_name}
            onChange={(e) => setEditForm({...editForm, theme_name: e.target.value})}
            fullWidth
            margin="normal"
          />
          <TextField
            type="date"
            label="Start Date"
            value={editForm.start_date}
            onChange={(e) => setEditForm({...editForm, start_date: e.target.value})}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="time"
            label="Start Time"
            value={editForm.start_time}
            onChange={(e) => setEditForm({...editForm, start_time: e.target.value})}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="time"
            label="End Time"
            value={editForm.end_time}
            onChange={(e) => setEditForm({...editForm, end_time: e.target.value})}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            select
            label="Status"
            value={editForm.status}
            onChange={(e) => setEditForm({...editForm, status: e.target.value})}
            fullWidth
            margin="normal"
          >
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="ACCEPTED">Accepted</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditModal(false)}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this booking?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

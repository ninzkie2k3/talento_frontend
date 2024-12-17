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
} from "@mui/material";

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

  // Function to fetch bookings
  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get("/admin/bookings");
      setBookings(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load bookings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

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
                <TableCell>Status</TableCell>
                <TableCell>Performers</TableCell>
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
                  <TableCell>{booking.status}</TableCell>
                  <TableCell>
                    {booking.performers.length > 0
                      ? booking.performers.map((p) => p.name).join(", ")
                      : "N/A"}
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
    </Box>
  );
}

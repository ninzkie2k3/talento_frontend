import React, { useEffect, useState } from "react";
import axios from "../axiosClient";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  Collapse,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function BookingClient() {
  const [transactions, setTransactions] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [dialogAction, setDialogAction] = useState(null);
  const [bulkAction, setBulkAction] = useState(false);  // Distinguish between bulk and individual action
  const [warningMessage, setWarningMessage] = useState("");
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get("/client-trans", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setTransactions(response.data.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions.");
    }
  };

  const handleOpenDialog = (transaction, action, isBulk = false) => {
    setSelectedTransaction(transaction);
    setDialogAction(action);
    setBulkAction(isBulk);
    setWarningMessage("");
    if (action === "decline") {
      // Set the warning message when declining
      setWarningMessage(
        "Warning: Declining this booking will result in a 10% deduction from the booking amount.Declining this booking could result in the performer losing valuable time that they might have booked with another client."
      );
    }

    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedTransaction(null);
    setWarningMessage("");
  };

  const handleConfirm = async () => {
    if (!selectedTransaction) return;
  
    try {
      if (bulkAction) {
        // Handle bulk transaction approval
        const response = await axios.put(
          `/bulktransactions/${dialogAction}`,
          { transactionIds: selectedTransaction.transaction_ids },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
  
        if (response.status === 200) {
          if (response.data.warnings?.length > 0) {
            // Display warnings for individual transactions
            toast.warn(response.data.warnings.join("\n"));
          } else {
            toast.success(`All transactions ${dialogAction}ed successfully.`);
          }
        } else {
          toast.error(`Failed to ${dialogAction} bulk transactions.`);
        }
      } else {
        // Handle single transaction approval
        const response = await axios.put(
          `/transactions/${selectedTransaction.id}/${dialogAction}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
  
        if (response.status === 200) {
          toast.success(`Transaction ${dialogAction}ed successfully.`);
        } else {
          toast.error(`Failed to ${dialogAction} the transaction.`);
        }
      }
  
      fetchTransactions();
      handleDialogClose();
    } catch (error) {
      console.error(`Error ${dialogAction}ing transaction:`, error);
  
      // Check if error contains specific message
      const errorMessage =
        error.response?.data?.error ||
        `Failed to ${dialogAction} transaction(s).`;
  
      if (errorMessage.includes("Approval can only be made on the start date")) {
        toast.error("Approval can only be made on the start date. Please try again later.");
      } else {
        toast.error(errorMessage);
      }
    }
  };
  

  const handleRowExpand = (bookingId) => {
    setExpandedRow(expandedRow === bookingId ? null : bookingId);
  };

  return (
    <div>
      <Box
        sx={{
          width: "100%",
          mt: 3,
          backgroundColor: "#f59e0b",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "30px",
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography
          variant="h6"
          align="center"
          sx={{ fontWeight: 600, color: "white", mb: 2 }}
        >
          Bookings Waiting for your Approval
        </Typography>
        <TableContainer component={Paper}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell>Theme</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Date of Booking</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
                <TableCell>Expand</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <React.Fragment key={transaction.booking_id}>
                    <TableRow>
                      <TableCell>{transaction.event_name || "N/A"}</TableCell>
                      <TableCell>{transaction.theme_name || "N/A"}</TableCell>
                      <TableCell>
                        ₱{parseFloat(transaction.total_booking_amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {transaction.start_date
                          ? new Date(transaction.start_date).toLocaleDateString("en-US")
                          : "N/A"}
                      </TableCell>
                      <TableCell>{transaction.status}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => handleOpenDialog(transaction, "approve", true)}
                        >
                          Approve All
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => handleOpenDialog(transaction, "decline", true)}
                          sx={{ ml: 1 }}
                        >
                          Decline All
                        </Button>
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleRowExpand(transaction.booking_id)}>
                          {expandedRow === transaction.booking_id ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <Collapse in={expandedRow === transaction.booking_id}>
                      <Box sx={{ margin: 2 }}>
                        <Typography variant="subtitle1">Performers:</Typography>
                        {transaction.performers?.map((performer) => (
                          <TableRow key={performer.id}>
                            <TableCell>{performer.name}</TableCell>
                            <TableCell>₱{performer.amount}</TableCell>
                            <TableCell>
                              <Button
                                onClick={() => handleOpenDialog(performer, "approve")}
                                size="small"
                                color="success"
                              >
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleOpenDialog(performer, "decline")}
                                size="small"
                                color="error"
                                sx={{ ml: 1 }}
                              >
                                Decline
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </Box>
                    </Collapse>
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={openDialog} onClose={handleDialogClose}>
  <DialogTitle>
    {dialogAction === "approve" ? "Approve Booking" : "Decline Booking"}
  </DialogTitle>
  <DialogContent>
    {warningMessage && (
      <DialogContentText color="warning">{warningMessage}</DialogContentText>
    )}
  </DialogContent>
  <DialogContent>
  <DialogContentText>
    {bulkAction
      ? `Are you sure you want to ${dialogAction} all bookings? This action cannot be undone.`
      : `Are you sure you want to ${dialogAction} this booking? This action cannot be undone. ${
          dialogAction === "approve"
            ?  "Approving this booking will transfer the talent performer service cost to there account."
            : ""
        }`}
  </DialogContentText>
</DialogContent>

  <DialogActions>
    <Button onClick={handleDialogClose}>Cancel</Button>
    <Button onClick={handleConfirm} color="success">
      Confirm
    </Button>
  </DialogActions>
</Dialog>
<ToastContainer />

    </div>
  );
}

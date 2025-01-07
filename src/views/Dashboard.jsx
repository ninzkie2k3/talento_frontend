import React, { useEffect, useState } from "react";
import axios from "../axiosClient";
import dayjs from "dayjs";
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
  CircularProgress,
  Tabs,
  Tab,
  useMediaQuery,
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BookingClient from "./BookingClient";
import PendingBooking from "./PendingBooking";
import Applicants from "./Applicants";

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // State to track active tab
  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get("/transactions", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        console.log("Transactions Data:", response.data.data); // Log to see what data you receive
        setTransactions(response.data.data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Failed to load transactions.");
      }
    };

    fetchTransactions();
  }, []);

  // Handle Tab Change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  const handleRowExpand = (bookingId) => {
    setExpandedRow(expandedRow === bookingId ? null : bookingId);
  };

  return (
    
    <div
      className="flex flex-col min-h-screen relative bg-cover bg-center"
      style={{ backgroundImage: "url('/talent.png')" }}
    >
     
      
      {/* Top-Centered Title */}
      <div className="absolute top-4 left-0 right-0 flex justify-center">
        <h2 className="text-4xl font-extrabold text-white mb-4">Dashboard</h2>
      </div>

      <main className="absolute top-16 left-0 right-0 flex flex-col items-center max-w-7xl mx-auto z-10 mt-4">
        <Box
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            width: "100%",
            borderRadius: "12px",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Tabs for switching between Dashboard and Booking Client */}
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Waiting for Performer Response" />
            
            <Tab label="My Booking" />
            <Tab label="Transaction History" />
            <Tab label="Applicants" />
            
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box
          sx={{
            width: "100%",
            mt: 3,
            backgroundColor: activeTab === 0 ? "#f59e0b" : "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "30px",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          {activeTab === 2 && (
            <Box>
              <Typography
                variant="h6"
                align="center"
                sx={{
                  fontWeight: 600,
                  color: "white",
                  mb: 2,
                }}
              >
                Transaction History
              </Typography>
              {/* Box with overflow styles for scrolling */}
              <Box
                sx={{
                  overflowX: "auto",
                  width: "100%", // To ensure the table fits the container width
                  maxHeight: "400px", // Optional: Set a maximum height if you want vertical scrolling
                }}
              >
                <TableContainer component={Paper}>
                  <Table
                    stickyHeader
                    sx={{
                      minWidth: 650, // Set a minimum width so it doesn't collapse too much
                    }}
                  >
                    {!isMobile && (
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#fcd34d" }}>
                          <TableCell>Performer</TableCell>
                          <TableCell>Transaction Type</TableCell>
                          <TableCell>Amount</TableCell>
                         <TableCell>Balance</TableCell>
                          <TableCell>Date of Booking</TableCell>
                          <TableCell>Date Created</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                    )}
                     <TableBody>
                      {transactions.length > 0 ? (
                        [...transactions]
                          .reverse()
                          .filter((transaction) => {
                            const transactionType = transaction.transaction_type?.trim();
                            const transactionStatus = transaction.status?.trim();

                           
                            return !(
                              (transactionType === "Booking Accepted" && transactionStatus === "APPROVED") ||
                              (transactionType === "Booking Cancelleds" && transactionStatus === "CANCELLED")||
                              (transactionType === "Waiting for Approval" && transactionStatus === "PENDING") ||
                              (transactionType === "Booking Accepted" && transactionStatus === "PROCESSING") ||
                              (transactionType === "Waiting for Approval" && transactionStatus === "APPROVED")
                            );
                          })
                          .map((transaction) => {
                            let transactionType = transaction.transaction_type;
                            const transactionStatus = transaction.status?.toUpperCase();

                            if (
                              transactionType === "Payment Completed" &&
                              transactionStatus === "COMPLETED"
                            ) {
                              transactionType = "Given to Performer";
                            }

      return (
        <TableRow key={transaction.id}>
          <TableCell>{transaction.performer_name || "Performer Name"}</TableCell>
          <TableCell>{transactionType}</TableCell>
          <TableCell>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {transactionType === "Booking Payment" && transactionStatus === "PENDING" && (
                <span style={{ color: "#EF4444", marginRight: 8, fontSize: "24px" }}>-</span>
              )}
              {transactionType === "Booking Accepted" && transactionStatus === "PROCESSING" && (
                <CircularProgress size={18} sx={{ marginRight: 1 }} />
              )}
                {transactionType === "Booking Declined" && transactionStatus === "REFUNDED" && (
                <span style={{ color: "#22C55E", marginRight: 8, fontSize: "18px" }}>+</span>
              )}
              {transactionType === "Refunded by system" && transactionStatus === "DECLINED" && (
                <span style={{ color: "#22C55E", marginRight: 8, fontSize: "18px" }}>+</span>
              )}
              {transactionType === "Booking Cancelled" && transactionStatus === "CANCELLED" && (
                <span style={{ color: "#EF4444", marginRight: 8, fontSize: "18px" }}>-10%</span>
              )}
              
              {transactionType === "Given to Performer" && (
                <span style={{ color: "#EF4444", marginRight: 8, fontSize: "18px" }}>-</span>
              )}
              ₱{parseFloat(transaction.amount).toFixed(2)}
            </Box>
          </TableCell>
          <TableCell>₱{parseFloat(transaction.balance).toFixed(2)}</TableCell>
          <TableCell>
            {dayjs(transaction.start_date).isValid()
              ? dayjs(transaction.start_date).format("MMMM D, YYYY")
              : "Invalid Date"}
          </TableCell>
          <TableCell>{transaction.date}</TableCell>
          <TableCell>
            <span
              style={{
                backgroundColor:
                  transaction.status === "PENDING"
                    ? "#FBBF24"
                    : transaction.status === "APPROVED"
                    ? "#22C55E"
                    : transaction.status === "DECLINED"
                    ? "#EF4444"
                    : "#AAAAAA",
                color: "white",
                padding: "4px 8px",
                borderRadius: "8px",
                fontSize: "0.8em",
              }}
            >
              {transaction.status}
            </span>
          </TableCell>
        </TableRow>
      );
    })
  ) : (
    <TableRow>
      <TableCell colSpan={5} align="center">
        No transactions found
      </TableCell>
    </TableRow>
  )}
</TableBody>

                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}

          {/* Booking Client Tab */}
          {activeTab === 1 && (
            <Box>
              <BookingClient />
            </Box>
          )}
          {activeTab === 0 && (
            <Box>
              <PendingBooking />
            </Box>
          )}
          {activeTab === 3 && (
            <Box>
             <Applicants/>
            </Box>
          )}
        </Box>
      </main>
      <ToastContainer />
    </div>
  );
}

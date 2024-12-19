import React, { useState, useEffect } from "react";
import { useStateContext } from "../context/contextprovider";
import axiosClient from "../axiosClient";
import {
  Box,
  Button,
  Typography,
  Modal,
  TextField,
  IconButton,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  useMediaQuery,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 700,
  bgcolor: "background.paper",
  borderRadius: "8px",
  boxShadow: 24,
  p: 4,
};

export default function WalletClient() {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [adminWallet, setAdminWallet] = useState(null);
  const [loadingAdminWallet, setLoadingAdminWallet] = useState(true);
  const [receiptImage, setReceiptImage] = useState(null);
  const isMobile = useMediaQuery("(max-width:600px)");
  const [receiptInfo, setReceiptInfo] = useState({
    amount: "",
    referenceNumber: "",
  });
  const [withdrawInfo, setWithdrawInfo] = useState({
    accountName: "",
    accountNumber: "",
    amount: "",
    qrCode: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userBalance, setUserBalance] = useState(null);
  const [requestHistory, setRequestHistory] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const { user } = useStateContext();

  // Fetch admin wallet details
  const fetchAdminWallet = async () => {
    setLoadingAdminWallet(true);
    try {
      const response = await axiosClient.get("/wallet-info");
      if (response.status === 200 && response.data.status === "success") {
        setAdminWallet(response.data.wallet);
      } else {
        alert("Failed to fetch admin wallet information. Please try again later.");
      }
    } catch (error) {
      console.error("Error fetching admin wallet:", error);
      // alert("Failed to fetch admin wallet information. Please try again later.");
    } finally {
      setLoadingAdminWallet(false);
    }
  };

  // Fetch user Talento Coin balance
  const fetchUserBalance = async () => {
    try {
      const response = await axiosClient.get("/talento_coin_balance");
      if (response.status === 200 && response.data.status === "success") {
        setUserBalance(response.data.balance);
      } else {
        alert("Failed to fetch Talento Coin balance. Please try again later.");
      }
    } catch (error) {
      console.error("Error fetching Talento Coin balance:", error);
      alert("Failed to fetch Talento Coin balance. Please try again later.");
    }
  };

  // Fetch request history for the logged-in user
  const fetchRequestHistory = async () => {
    try {
      const response = await axiosClient.get("/user-request-history");
      if (response.status === 200 && response.data.status === "success") {
        setRequestHistory(response.data.data);
      } else {
        alert("Failed to fetch request history. Please try again later.");
      }
    } catch (error) {
      console.error("Error fetching request history:", error);
      alert("Failed to fetch request history. Please try again later.");
    }
  };
  const fetchBookingHistory = async () => {
    try {
      const response = await axiosClient.get("/bookings");
      if (response.status === 200 && response.data.status === "success") {
        setBookingHistory(response.data.data);
      } else {
        toast.error("Failed to fetch booking history.");
      }
    } catch (error) {
      console.error("Error fetching booking history:", error);
      toast.error("Failed to fetch booking history.");
    }
  };


  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };


  useEffect(() => {
    if (user?.id) {
      fetchAdminWallet();
      fetchUserBalance();
      fetchRequestHistory();
      fetchBookingHistory();
    }
  }, [user?.id]);

  // Show deposit modal
  const handleDepositClick = () => {
    setShowDepositModal(true);
  };

  // Show withdraw modal
  const handleWithdrawClick = () => {
    setShowWithdrawModal(true);
  };

  // Handle receipt image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setReceiptImage(file);
  };

  // Handle withdrawal QR code upload
  const handleQRCodeUpload = (e) => {
    const file = e.target.files[0];
    setWithdrawInfo((prevInfo) => ({
      ...prevInfo,
      qrCode: file,
    }));
  };

  // Handle receipt information change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReceiptInfo((prevInfo) => ({
      ...prevInfo,
      [name]: value,
    }));
  };

  // Handle withdraw information change
  const handleWithdrawInputChange = (e) => {
    const { name, value } = e.target;
    setWithdrawInfo((prevInfo) => ({
      ...prevInfo,
      [name]: value,
    }));
  };

  // Handle form submission to process the deposit
  const handleProcessClick = async () => {
    if (!receiptImage || !receiptInfo.amount || !receiptInfo.referenceNumber) {
      alert("Please complete all the fields before processing.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("user_id", user.id);
    formData.append("amount", receiptInfo.amount);
    formData.append("reference_number", receiptInfo.referenceNumber);
    formData.append("receipt", receiptImage);

    try {
      const response = await axiosClient.post("/deposit-request", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 201) {
        toast.success("Receipt has been sent for processing. Please wait for admin approval.");
        setShowDepositModal(false);
        setReceiptInfo({ amount: "", referenceNumber: "" });
        setReceiptImage(null);
        fetchUserBalance(); // Update balance immediately
        fetchRequestHistory();
      } else {
        alert("Failed to submit deposit. Please try again.");
      }
    } catch (error) {
      console.error("Error processing deposit:", error);
      alert("Failed to submit deposit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form submission to process the withdrawal
  const handleWithdrawProcessClick = async () => {
    if (!withdrawInfo.qrCode || !withdrawInfo.accountName || !withdrawInfo.accountNumber || !withdrawInfo.amount) {
      toast.error("Please complete all the fields before processing.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("user_id", user.id);
    formData.append("account_name", withdrawInfo.accountName);
    formData.append("account_number", withdrawInfo.accountNumber);
    formData.append("amount", withdrawInfo.amount);
    formData.append("qr_code", withdrawInfo.qrCode);

    try {
      const response = await axiosClient.post("/withdraw-request", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 201) {
        toast.success("Withdraw request has been submitted successfully. Please wait for admin approval.");
        setShowWithdrawModal(false);
        setWithdrawInfo({ accountName: "", accountNumber: "", amount: "", qrCode: null });
        fetchUserBalance(); // Update balance immediately
        fetchRequestHistory();
      } else {
        toast.error("Failed to submit withdrawal request. Please try again.");
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        if (error.response.data.message === "You tried to withdraw more than your balance.") {
          toast.error("You tried to withdraw more than your balance.");
        } else {
          toast.error(error.response.data.message || "Failed to submit withdrawal request. Please try again.");
        }
      } else {
        console.error("Error processing withdrawal:", error);
        toast.error("Failed to submit withdrawal request. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
  <main
      className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-4xl mx-auto rounded-lg shadow-md relative overflow-hidden"
      style={{
        backgroundImage: "url('/talent.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <Box className="wallet-client z-10" sx={{ textAlign: "center", mt: isMobile ? 2 : 4 }}>
        <Typography
          variant="h5"
          component="p"
          sx={{ mb: isMobile ? 2 : 3 }}
          style={{ color: "#ffffff", fontWeight: "bold", fontFamily: "serif" }}
        >
          Available Talento Coins:
        </Typography>
        <Typography
          variant="h4"
          className="text-2xl font-bold text-center mb-4 inline-flex items-center"
          style={{ color: "#ffcc00" }}
        >
          {userBalance !== null ? userBalance : "Loading..."}
          <img
            src="talentocoin.png"
            alt="Talento Coin"
            className="ml-2 align-middle"
            style={{ width: isMobile ? "24px" : "48px", height: isMobile ? "24px" : "48px" }}
          />
        </Typography>
        <Box display="flex" justifyContent="center" gap={2} mb={isMobile ? 2 : 3}>
          <Button
            variant="contained"
            style={{ backgroundColor: "#ffcc00", color: "#000", fontWeight: "bold", fontSize: isMobile ? "0.8rem" : "1rem" }}
            onClick={() => setShowDepositModal(true)}
            startIcon={<AddCircleIcon />}
          >
            Deposit
          </Button>
          <Button
            variant="contained"
            style={{ backgroundColor: "#6a0dad", color: "#fff", fontWeight: "bold", fontSize: isMobile ? "0.8rem" : "1rem" }}
            onClick={() => setShowWithdrawModal(true)}
            startIcon={<RemoveCircleIcon />}
          >
            Withdraw
          </Button>
        </Box>

        <Box sx={{ width: "100%", display: "flex", justifyContent: "center", mb: isMobile ? 1 : 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="history tabs"
            centered
            textColor="primary"
            indicatorColor="primary"
            sx={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              boxShadow: 1,
              maxWidth: isMobile ? "100%" : 500,
            }}
          >
            <Tab label="Request History" sx={{ fontSize: isMobile ? "0.7rem" : "1rem" }} />
            <Tab label="Booking History" sx={{ fontSize: isMobile ? "0.7rem" : "1rem" }} />
          </Tabs>
        </Box>
     {/* Tab Selection */}
     {/* Request History Section */}
     {activeTab === 0 && (
          <Box
            mt={isMobile ? 2 : 4}
            p={isMobile ? 1 : 3}
            sx={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              boxShadow: 2,
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography variant="h6" component="h2" sx={{ mb: isMobile ? 1 : 3 }} >
              Request History
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: isMobile ? 300 : 400, overflowY: "auto" }}>
              <Table stickyHeader size={isMobile ? "small" : "medium"}>
                <TableHead>
                  <TableRow>
                    <TableCell>User Name</TableCell>
                    <TableCell>Balance Before</TableCell>
                    <TableCell>Balance After</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requestHistory.length > 0 ? (
                    requestHistory.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.user?.name || user?.name}</TableCell>
                        <TableCell>{record.balance_before}</TableCell>
                        <TableCell>{record.balance_after}</TableCell>
                        <TableCell>{record.amount}</TableCell>
                        <TableCell>{record.reference_number}</TableCell>
                        <TableCell>
                          <span
                            className={`${
                              record.status === "APPROVED" ? "bg-green-500" : "bg-red-500"
                            } text-white py-1 px-3 rounded-full text-xs`}
                          >
                            {record.status}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(record.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No request history found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        {/* Booking History Section */}
        {activeTab === 1 && (
          <Box
            mt={isMobile ? 2 : 4}
            p={isMobile ? 1 : 3}
            sx={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              boxShadow: 2,
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography variant="h6" component="h2" sx={{ mb: isMobile ? 1 : 3 }}>
              Booking History
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: isMobile ? 300 : 400, overflowY: "auto" }}>
              <Table stickyHeader size={isMobile ? "small" : "medium"}>
                <TableHead>
                  <TableRow>
                    <TableCell>Performer Name</TableCell>
                    <TableCell>Event & Theme</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookingHistory.length > 0 ? (
                    bookingHistory.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>{booking.performer_name}</TableCell>
                        <TableCell>{`${booking.event_name}, ${booking.theme_name}`}</TableCell>
                        <TableCell>{new Date(booking.start_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {new Date(`1970-01-01T${booking.start_time}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                          to{" "}
                          {booking.end_time
                            ? new Date(`1970-01-01T${booking.end_time}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : "N/A"}
                        </TableCell>
                        <TableCell>{`${booking.municipality_name}, ${booking.barangay_name}`}</TableCell>
                        <TableCell>
                          <span
                            className={`${
                              booking.status === "COMPLETED" ? "bg-green-500" : "bg-red-500"
                            } text-white py-1 px-3 rounded-full text-xs`}
                          >
                            {booking.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No booking history found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      {/* Modal for Deposit */}
      <Modal
        open={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        aria-labelledby="deposit-modal-title"
        aria-describedby="deposit-modal-description"
      >
        <Box sx={modalStyle}>
          {/* Modal Content for Deposit */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography id="deposit-modal-title" variant="h6" component="h2">
              Deposit Talento Coin
            </Typography>
            <IconButton onClick={() => setShowDepositModal(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {loadingAdminWallet ? (
            <Box display="flex" justifyContent="center" alignItems="center" mb={3}>
              <CircularProgress />
            </Box>
          ) : (
            adminWallet && (
              <Box display="flex" alignItems="flex-start" mb={3}>
                {/* QR Code Image on the Left Side */}
                <Box
                  sx={{
                    width: "40%",
                    mr: 3,
                  }}
                >
                  {adminWallet.qr_code_url ? (
                    <img
                      src={adminWallet.qr_code_url}
                      alt="Admin GCash QR"
                      style={{
                        width: "100%",
                        height: "auto",
                        borderRadius: "8px",
                      }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No QR code available.
                    </Typography>
                  )}
                </Box>

                {/* Admin GCash Information & Input Fields on the Right Side */}
                <Box sx={{ width: "60%" }}>
                  <Box mb={3}>
                    <Typography variant="subtitle1" gutterBottom>
                      Admin GCash Information:
                    </Typography>
                    <Typography variant="body2">
                      Account Name: {adminWallet.account_name}
                    </Typography>
                    <Typography variant="body2">
                      Account Number: {adminWallet.account_number}
                    </Typography>
                  </Box>

                  {/* Form Fields for Upload Receipt, Amount Sent, Reference Number */}
                  <Box mb={3}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUploadIcon />}
                      fullWidth
                      sx={{ mb: 2 }}
                    >
                      Upload Receipt
                      <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                    </Button>
                    {receiptImage && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {receiptImage.name}
                      </Typography>
                    )}
                  </Box>

                  <Box mb={3}>
                    <TextField
                      fullWidth
                      label="Amount Sent"
                      name="amount"
                      value={receiptInfo.amount}
                      onChange={handleInputChange}
                      variant="outlined"
                      type="number"
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Reference Number"
                      name="referenceNumber"
                      value={receiptInfo.referenceNumber}
                      onChange={handleInputChange}
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Box>
            )
          )}

          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button
              onClick={handleProcessClick}
              variant="contained"
              color="success"
              sx={{ mr: 2 }}
              disabled={isSubmitting}
              startIcon={isSubmitting && <CircularProgress size={20} />}
            >
              {isSubmitting ? "Processing..." : "Process"}
            </Button>
            <Button onClick={() => setShowDepositModal(false)} variant="outlined" color="inherit">
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Modal for Withdraw */}
      <Modal
        open={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        aria-labelledby="withdraw-modal-title"
        aria-describedby="withdraw-modal-description"
      >
        <Box sx={modalStyle}>
          {/* Modal Content for Withdraw */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography id="withdraw-modal-title" variant="h6" component="h2">
              Withdraw Talento Coin
            </Typography>
            <IconButton onClick={() => setShowWithdrawModal(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box mb={3}>
            <TextField
              fullWidth
              label="Account Name"
              name="accountName"
              value={withdrawInfo.accountName}
              onChange={handleWithdrawInputChange}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Account Number"
              name="accountNumber"
              value={withdrawInfo.accountNumber}
              onChange={handleWithdrawInputChange}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Amount"
              name="amount"
              value={withdrawInfo.amount}
              onChange={handleWithdrawInputChange}
              variant="outlined"
              type="number"
              sx={{ mb: 2 }}
            />
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              fullWidth
              sx={{ mb: 2 }}
            >
              Upload QR Code
              <input type="file" accept="image/*" hidden onChange={handleQRCodeUpload} />
            </Button>
            {withdrawInfo.qrCode && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {withdrawInfo.qrCode.name}
              </Typography>
            )}
          </Box>

          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button
              onClick={handleWithdrawProcessClick}
              variant="contained"
              color="success"
              sx={{ mr: 2 }}
              disabled={isSubmitting}
              startIcon={isSubmitting && <CircularProgress size={20} />}
            >
              {isSubmitting ? "Processing..." : "Process"}
            </Button>
            <Button onClick={() => setShowWithdrawModal(false)} variant="outlined" color="inherit">
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
      
            
      <ToastContainer />
      
    </Box>
    </main>
  );
}

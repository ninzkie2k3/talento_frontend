import React, { useState, useEffect } from "react";
import axiosClient from "../axiosClient";
import {
    Box,
    Button,
    TextField,
    Typography,
    CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ResetEmail() {
    const [step, setStep] = useState(1); // Step 1: Verify password, Step 2: Change email
    const [password, setPassword] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [confirmEmail, setConfirmEmail] = useState("");
    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isEmailReset, setIsEmailReset] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (isEmailReset) {
            const timer = setTimeout(() => {
                navigate("/customer-profile");
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isEmailReset, navigate]);

    const handleVerifyPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await axiosClient.post("/verify-password", {
                password,
            });
            toast.success("Password verified. You can now update your email.");
            setStep(2); // Move to the next step
        } catch (err) {
            toast.error(err.response?.data?.error || "Incorrect password.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetEmail = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (newEmail !== confirmEmail) {
            toast.error("Email addresses do not match.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await axiosClient.post("/reset-email", {
                new_email: newEmail,
                password,
            });
            toast.success(response.data.message);
            setIsEmailReset(true);
        } catch (err) {
            if (err.response?.status === 422) {
                toast.error("This email is already taken. Please choose another.");
            } else {
                toast.error(err.response?.data?.error || "An error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box p={4} maxWidth="400px" mx="auto">
            <Typography variant="h5" mb={3} className="text-center">
                {step === 1 ? "Verify Password" : "Reset Email Address"}
            </Typography>

            {isLoading && (
                <Box display="flex" justifyContent="center" mb={3}>
                    <CircularProgress />
                </Box>
            )}

            {isEmailReset && (
                <Typography color="success" variant="h6" className="text-center">
                    Redirecting to profile...
                </Typography>
            )}

            {step === 1 && !isEmailReset && (
                <form onSubmit={handleVerifyPassword}>
                    <Box mb={3}>
                        <TextField
                            label="Password"
                            type="password"
                            fullWidth
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </Box>

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={isLoading}
                    >
                        Verify Password
                    </Button>
                </form>
            )}

            {step === 2 && !isEmailReset && (
                <form onSubmit={handleResetEmail}>
                    <Box mb={2}>
                        <TextField
                            label="New Email Address"
                            type="email"
                            fullWidth
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            required
                        />
                    </Box>
                    <Box mb={3}>
                        <TextField
                            label="Confirm New Email Address"
                            type="email"
                            fullWidth
                            value={confirmEmail}
                            onChange={(e) => setConfirmEmail(e.target.value)}
                            required
                        />
                    </Box>

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={isLoading || isEmailReset}
                    >
                        Reset Email
                    </Button>
                </form>
            )}

            {/* Toast Container for Notifications */}
            <ToastContainer position="top-right" autoClose={3000} />
        </Box>
    );
}

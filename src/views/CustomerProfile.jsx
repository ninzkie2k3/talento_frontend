import React, { useState, useEffect } from "react";
import {
  Avatar,
  Button,
  IconButton,
  Tabs,
  Tab,
  Typography,
  Modal,
  TextField,
  Paper,
  MenuItem,
} from "@mui/material";
import { Edit } from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import axiosClient from "../axiosClient";
import profilePlaceholder from "../assets/logotalentos.png"; // Placeholder for profile image
import MyPost from "./MyPost";

const API_KEY = "2d4cf4f2effa49bc9c8ae2d0686ad98b"; // Replace with your OpenCage API Key

export default function CustomerProfile() {
  const [user, setUser] = useState(null); // User data
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    location: "",
    profileImage: null,
  });
  const [suggestions, setSuggestions] = useState([]); // For location suggestions
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputTimeout, setInputTimeout] = useState(null);

  // Fetch client data
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const response = await axiosClient.get("/client-info", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const client = response.data.user;

        // Update user state and form data
        setUser({
          name: client.name,
          lastname: client.lastname,
          profileImage: client?.image_profile
            ? `https://palegoldenrod-weasel-648342.hostingersite.com/backend/talentoproject_backend/public/storage/${client.image_profile}`
            : profilePlaceholder,
          location: client.location || "Unknown Location",
        });

        setFormData({
          name: client.name,
          lastname: client.lastname,
          location: client.location,
          profileImage: null,
        });
      } catch (error) {
        console.error("Error fetching client data:", error);
        toast.error("Failed to load client information.");
      }
    };

    fetchClientData();
  }, []);

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    if (name === "location") {
      setFormData({ ...formData, location: value });

      if (inputTimeout) clearTimeout(inputTimeout);

      // Debounced API call for location suggestions
      const timeout = setTimeout(() => fetchSuggestions(value), 500);
      setInputTimeout(timeout);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Fetch location suggestions from OpenCage API
  const fetchSuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(
        `https://api.opencagedata.com/geocode/v1/json?q=${query}&key=${API_KEY}&limit=5`
      );
      const results = response.data.results;
      setSuggestions(results.map((item) => item.formatted));
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setFormData({ ...formData, location: suggestion });
    setSuggestions([]); // Clear suggestions
  };

  const handleImageChange = (e) => {
    setFormData({ ...formData, profileImage: e.target.files[0] });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.lastname || !formData.location) {
      toast.error("Please fill out all required fields.");
      return;
    }

    setIsSubmitting(true);
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("lastname", formData.lastname);
    formDataToSend.append("location", formData.location);
    if (formData.profileImage) {
      formDataToSend.append("image_profile", formData.profileImage);
    }

    try {
      await axiosClient.post("/update-profile", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast.success("Profile updated successfully!");
      setEditOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return <Typography>Loading...</Typography>;

  return (
    <div>
      <ToastContainer />

      <div className="flex flex-col items-center p-4">
        <Paper className="w-full max-w-4xl bg-gray-500 shadow rounded-lg p-6 mt-10">
          <div className="flex justify-center -mt-20 mb-4">
            <Avatar
              src={user.profileImage}
              alt="Profile"
              sx={{
                width: 200,
                height: 200,
                border: "5px solid white",
              }}
            />
          </div>

          <Typography variant="h4" className="text-center font-bold">
            {user.name} {user.lastname}
            <IconButton color="inherit" onClick={() => setEditOpen(true)}>
              <Edit />
            </IconButton>
          </Typography>
          <Typography className="text-gray-500 mb-4 text-center">
            {user.location}
          </Typography>

          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Posts" value="posts" />
          </Tabs>

          {/* Posts Tab */}
          {activeTab === "posts" && (
            <div className="mt-4">
              <MyPost />
            </div>
          )}
        </Paper>

        {/* Edit Profile Modal */}
        <Modal open={editOpen} onClose={() => setEditOpen(false)}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100vh",
            }}
          >
            <div
              className="bg-white p-6 rounded-lg shadow-lg"
              style={{ width: "400px" }}
            >
              <Typography
                variant="h5"
                className="mb-4"
                style={{ textAlign: "center" }}
              >
                Edit Profile
              </Typography>
              <TextField
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleEditChange}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Last Name"
                name="lastname"
                value={formData.lastname}
                onChange={handleEditChange}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleEditChange}
                fullWidth
                margin="normal"
                autoComplete="off"
              />
              {suggestions.length > 0 && (
                <Paper elevation={3} style={{ maxHeight: "150px", overflowY: "auto" }}>
                  {suggestions.map((item, index) => (
                    <MenuItem key={index} onClick={() => handleSuggestionClick(item)}>
                      {item}
                    </MenuItem>
                  ))}
                </Paper>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ margin: "1rem 0" }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "1rem",
                }}
              >
                <Button
                  variant="outlined"
                  onClick={() => setEditOpen(false)}
                  style={{ marginRight: "0.5rem" }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

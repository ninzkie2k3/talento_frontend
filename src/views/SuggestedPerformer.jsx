import React, { useEffect, useState } from "react";
import axiosClient from "../axiosClient";
import { CircularProgress, Avatar, Button, Rating } from "@mui/material";
import profilePlaceholder from "../assets/logotalentos.png";

export default function SuggestedPerformer() {
    const [user, setUser] = useState(null); // Store authenticated user data
    const [performers, setPerformers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch authenticated user data
    useEffect(() => {
        axiosClient
            .get("/user")
            .then((response) => {
                console.log("Authenticated User Data:", response.data);
                setUser(response.data);
            })
            .catch((error) => {
                console.error("Error fetching user data:", error);
            });
    }, []);

    // Fetch performers
    useEffect(() => {
        axiosClient
            .get("/performer")
            .then((response) => {
                const performersWithLocation = response.data.filter(
                    (performer) =>
                        performer.performer_portfolio?.location &&
                        performer.performer_portfolio.location.trim() !== ""
                );
                setPerformers(performersWithLocation);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching performers:", error);
                setLoading(false);
            });
    }, []);

    // Compare client location with performer location
    const isNearby = (performerLocation) => {
        console.log("Comparing locations:", user?.location, performerLocation);

        if (!user?.location || !performerLocation) return false;

        return performerLocation
            .toLowerCase()
            .includes(user.location.toLowerCase());
    };

    // Filter performers based on proximity
    const filteredPerformers = performers.filter((performer) =>
        isNearby(performer.performer_portfolio?.location)
    );

    if (loading || !user) {
        return (
            <div className="flex justify-center items-center h-screen">
                <CircularProgress />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Suggested Performers Near You
            </h2>
            {filteredPerformers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPerformers.map((performer, index) => (
                        <div
                            key={index}
                            className="bg-white border rounded-lg shadow-lg p-4"
                        >
                            <Avatar
                                src={
                                    performer.image_profile
                                        ? `https://palegoldenrod-weasel-648342.hostingersite.com/backend/talentoproject_backend/public/storage/${performer.image_profile}`
                                        : profilePlaceholder
                                }
                                alt={performer.name}
                                sx={{ width: 80, height: 80 }}
                                className="mx-auto mb-4"
                            />
                            <h3 className="text-lg font-semibold text-center">
                                {performer.name} {performer.lastname}
                            </h3>
                            <p className="text-gray-600 text-center">
                                {performer.performer_portfolio?.talent_name}
                            </p>
                            <p className="text-gray-600 text-center">
                                Location:{" "}
                                {performer.performer_portfolio?.location}
                            </p>
                            <div className="flex items-center justify-center mt-2">
                                <Rating
                                    value={
                                        performer.performer_portfolio
                                            ?.average_rating || 0.0
                                    }
                                    precision={0.5}
                                    readOnly
                                />
                            </div>
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                className="mt-4"
                                onClick={() =>
                                    window.location.href = `/portfolio/${performer.performer_portfolio.id}`
                                }
                            >
                                View Profile
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-600 text-center">
                    No performers found near your location:{" "}
                    <strong>{user.location}</strong>.
                </p>
            )}
        </div>
    );
}

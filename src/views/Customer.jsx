import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../axiosClient";
import { useStateContext } from "../context/contextprovider";
import Rating from "@mui/material/Rating";
import { VolumeUp, VolumeOff, MusicNote, } from "@mui/icons-material";
import { Badge, Box, Grid, Button, FormControl, Select, MenuItem, TextField, InputAdornment, IconButton } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import profile from "../assets/Ilk.jpg";
import ChatCustomer from "./ChatCustomer";

export default function Customer() {
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isFilteredModalOpen, setIsFilteredModalOpen] = useState(false);
    const [isMusicNoteModalOpen, setIsMusicNoteModalOpen] = useState(false);
    const [isMuted, setIsMuted] = useState([]);
    const [performers, setPerformers] = useState([]);
    const [events, setEvents] = useState([]);
    const [themes, setThemes] = useState([]);
    const [formData, setFormData] = useState({
        event_id: "",
        theme_id: "",
    });
    const [selectedPerformers, setSelectedPerformers] = useState([]);
    const [recommendedPerformers, setRecommendedPerformers] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showDropdown, setShowDropdown] = useState(false);
    const [isPerformersLoaded, setIsPerformersLoaded] = useState(false);
    const performersRef = useRef(null);

    const { user } = useStateContext();
    const navigate = useNavigate();
    const highlightsRef = useRef(null);

    // Add new state
    const [isRecommendedMusicNoteModalOpen, setIsRecommendedMusicNoteModalOpen] = useState(false);
    const [selectedRecommendedPerformers, setSelectedRecommendedPerformers] = useState([]);
    const [selectedRecommendedCategory, setSelectedRecommendedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [recommendedSearchQuery, setRecommendedSearchQuery] = useState('');

    useEffect(() => {
        axiosClient
            .get("/performervid")
            .then((response) => {
                if (response.data.status === "success") {
                    const validPerformers = response.data.data.filter(
                        (performer) =>
                            performer.image_profile &&
                            performer.performer_portfolio?.rate
                    );
                    const sortedPerformers = validPerformers.sort(
                        (a, b) =>
                            (b.performer_portfolio?.average_rating || 0) -
                            (a.performer_portfolio?.average_rating || 0)
                    );
                    setPerformers(sortedPerformers);
                    setIsMuted(validPerformers.map(() => true));
                    setIsPerformersLoaded(true);
                }
            })
            .catch((error) => {
                console.error("Error fetching performers:", error);
            });

        axiosClient
            .get("/events")
            .then((response) => {
                setEvents(response.data);
            })
            .catch((error) => console.error("Error fetching events:", error));

        if (user) {
            if (user.role === "admin") {
                navigate("/managepost");
            } else if (user.role === "client") {
                navigate("/customer");
            } else if (user.role === "performer") {
                navigate("/post");
            }
        }
    }, [user, navigate]);

    // Add sorting function
    useEffect(() => {
        const fetchRecommended = async () => {
            try {
                const response = await axiosClient.get("/recommended");
                if (response.data.status === "success") {
                    // Sort by rating before setting state
                    const sortedPerformers = response.data.data.recommended_performers.sort((a, b) => 
                        (b.average_rating || 0) - (a.average_rating || 0)
                    );
                    setRecommendedPerformers(sortedPerformers);
                }
            } catch (error) {
                console.error("Error fetching recommended:", error);
            }
        };
        fetchRecommended();
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShowDropdown(true);
                }
            },
            { threshold: 0.1 }
        );

        if (performersRef.current) {
            observer.observe(performersRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const handleSeeDetails = (performer) => {
        try {
            let portfolioId;
            
            // For recommended performers, use portfolio_id from highlights
            if (performer.performer_highlights?.[0]?.portfolio_id) {
                portfolioId = performer.performer_highlights[0].portfolio_id;
            }
            // For regular performers
            else if (performer.performer_portfolio?.id) {
                portfolioId = performer.performer_portfolio.id;
            }
            
            if (!portfolioId) {
                console.error('Portfolio data:', performer);
                toast.error('Could not view performer details');
                return;
            }
    
            navigate(`/portfolio/${portfolioId}`);
            
        } catch (error) {
            console.error('Error in handleSeeDetails:', error);
            toast.error('Could not view performer details');
        }
    };

    

    const toggleMute = (index) => {
        setIsMuted((prevMuted) =>
            prevMuted.map((mute, i) => (i === index ? !mute : mute))
        );
    };

    const handleBookNowClick = () => setIsBookingModalOpen(true);
    const handleBookingFormClose = () => setIsBookingModalOpen(false);

    const handleEventChange = (e) => {
        const eventId = e.target.value;
        setFormData({ ...formData, event_id: eventId, theme_id: "" });

        axiosClient
            .get(`/events/${eventId}/themes`)
            .then((response) => {
                setThemes(response.data);
            })
            .catch((error) => console.error("Error fetching themes:", error));
    };

    const handleThemeChange = (e) => {
        setFormData({ ...formData, theme_id: e.target.value });
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        const { event_id, theme_id } = formData;

        if (event_id && theme_id) {
            try {
                const response = await axiosClient.get("/filter-performers", {
                    params: { event_id, theme_id },
                });
                const validFilteredPerformers = response.data.filter(
                    (performer) =>
                        performer.image_profile &&
                        performer.performer_portfolio?.rate
                );
                setFilteredPerformers(validFilteredPerformers);
                setIsFilteredModalOpen(true); // Opens the modal with filtered performers
            } catch (error) {
                console.error("Error fetching filtered performers:", error);
            }
        }
        setIsBookingModalOpen(false);
    };
    const handleBookAllPerformers = () => {
        navigate("/addBook", {
            state: { performers: selectedPerformers },
        });
    };

    const handleFilteredModalClose = () => setIsFilteredModalOpen(false);

    const handleAddToBooking = (performer) => {
        // Only add if not a recommended performer
        if (!performer.performer_highlights) {
            setSelectedPerformers((prevSelected) => {
                if (!prevSelected.find((p) => p.id === performer.id)) {
                    return [...prevSelected, performer];
                }
                return prevSelected;
            });
        }
    };

    const handleAddToRecommendedBooking = (performer) => {
        setSelectedRecommendedPerformers((prevSelected) => {
            if (!prevSelected.find((p) => p.performer_id === performer.performer_id)) {
                return [...prevSelected, performer];
            }
            return prevSelected;
        });
    };

    const handleBookPerformer = (performer) => {
        console.log("Booking performer payload:", {
            id: performer.id,
            name: performer.name,
            talent: performer.performer_portfolio?.talent_name,
            rate: performer.performer_portfolio?.rate,
            location: performer.performer_portfolio?.location
        });
        navigate("/addBook", {
            state: { performers: [performer] },
        });
    };

    const handleRemovePerformer = (performerToRemove) => {
        setSelectedPerformers((prevSelected) =>
            prevSelected.filter((performer) => performer.id !== performerToRemove.id)
        );
    };    

    // Updated function to show the MusicNote modal only if there are performers selected
    const handleMusicNoteModalToggle = () => {
        if (selectedPerformers.length > 0) {
            setIsMusicNoteModalOpen(true);
        }
    };

    const handleMusicNoteModalClose = () => setIsMusicNoteModalOpen(false);

    // Update filter handlers
    const handleCategoryChange = (event) => {
        setSelectedCategory(event.target.value);
    };

    const handleRecommendedCategoryChange = (event) => {
        setSelectedRecommendedCategory(event.target.value);
    };

    // Filter regular performers
    const filteredPerformers = performers.filter(performer => {
        const searchLower = searchQuery.toLowerCase();
        const categoryMatch = selectedCategory === 'all' || 
                             performer.performer_portfolio?.talent_name === selectedCategory;
        
        return categoryMatch && (
            performer.name?.toLowerCase().includes(searchLower) ||
            performer.performer_portfolio?.talent_name?.toLowerCase().includes(searchLower) ||
            performer.performer_portfolio?.location?.toLowerCase().includes(searchLower) ||
            performer.performer_portfolio?.rate?.toString().includes(searchLower)
        );
    });

    // Filter recommended performers
    const filteredRecommendedPerformers = recommendedPerformers.filter(performer => {
        const searchLower = recommendedSearchQuery.toLowerCase();
        const categoryMatch = selectedRecommendedCategory === 'all' || 
                             performer.talent_name === selectedRecommendedCategory;
        
        return categoryMatch && (
            performer.performer_name?.toLowerCase().includes(searchLower) ||
            performer.talent_name?.toLowerCase().includes(searchLower) ||
            performer.location?.toLowerCase().includes(searchLower) ||
            performer.rate?.toString().includes(searchLower)
        );
    });

    // Add new functions
   const handleBookRecommendedPerformer = (performer) => {
    try {
        const performerData = {
            id: performer.performer_highlights?.[0]?.portfolio_id,
            name: performer.performer_name || "Name not available",
            image_profile: performer.performer_image || "",
            performer_portfolio: {
                id: performer.performer_highlights?.[0]?.portfolio_id,
                talent_name: performer.talent_name || "Talent not available", 
                rate: performer.rate || 0,
                location: performer.location || "Location not available",
                average_rating: performer.average_rating || 0
            }
        };

        console.log("Booking performer payload:", performerData);

        navigate("/addBook", {
            state: { performers: [performerData] }
        });
    } catch (error) {
        console.error("Booking error:", error);
        toast.error("Failed to process booking. Please try again.");
    }
};

   const handleBookAllRecommendedPerformers = () => {
    const normalizedPerformers = recommendedPerformers.map(performer => ({
        id: performer.performer_highlights?.[0]?.portfolio_id,
        name: performer.performer_name,
        image_profile: performer.performer_image,
        performer_portfolio: {
            id: performer.performer_highlights?.[0]?.portfolio_id,
            talent_name: performer.talent_name,
            rate: performer.rate,
            location: performer.location,
            average_rating: performer.average_rating || 0
        }
    }));

    console.log("Booking all recommended performers payload:", normalizedPerformers);

    try {
        navigate("/addBook", {
            state: { performers: normalizedPerformers }
        });
    } catch (error) {
        console.error("Error booking all performers:", error);
        toast.error("Failed to process group booking");
    }
};

    // Add new handler
    const handleRecommendedMusicNoteModalToggle = () => {
        setIsRecommendedMusicNoteModalOpen(true);
    };

    const handleRecommendedMusicNoteModalClose = () => setIsRecommendedMusicNoteModalOpen(false);

    const handleRemoveRecommendedPerformer = (performerToRemove) => {
        setSelectedRecommendedPerformers(prevSelected => 
            prevSelected.filter(performer => performer.performer_id !== performerToRemove.performer_id)
        );
    };

    const handleSearch = (event) => {
        setSearchQuery(event.target.value);
    };
    
    const handleRecommendedSearch = (event) => {
        setRecommendedSearchQuery(event.target.value);
    };

    return (
        <div className="flex flex-col min-h-screen relative">
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <main
                className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-7xl mx-auto bg-cover bg-center relative overflow-hidden rounded-lg shadow-md"
                style={{ backgroundImage: "url('/talent.png')" }}
            >
                <div className="text-center mb-12 z-10">
                    <h2 className="text-4xl font-extrabold text-white mb-4 animate-bounce">
                        Welcome to Talento
                    </h2>
                    <p className="text-lg text-gray-200 mb-6">
                        Discover and book talented performers for your events. Browse through our selection of artists and find the perfect fit for your next occasion.
                    </p>
                    
                   
                </div>

                <section ref={highlightsRef} className="w-full bg-yellow-600 py-16 px-4 z-10">
                    <div className="max-w-7xl mx-auto text-center">
                         {/* Recommended Performers Carousel */}
                    {recommendedPerformers.length > 0 && (
    <div className="w-full max-w-5xl mx-auto overflow-hidden">
        <div className="flex justify-between items-center mb-4 relative">
            <div className="flex items-center gap-4">
                <h3 className="text-2xl font-bold text-white">Recommended Performers</h3>
                <Badge
                    badgeContent={selectedRecommendedPerformers.length}
                    color="primary"
                    onClick={handleRecommendedMusicNoteModalToggle}
                    sx={{ cursor: 'pointer' }}
                >
                    <MusicNote 
                        sx={{ 
                            color: 'white',
                            fontSize: '2rem',
                            '&:hover': {
                                transform: 'scale(1.1)',
                                transition: 'transform 0.2s'
                            }
                        }}
                    />
                </Badge>
            </div>
        </div>
        
        <div className="flex justify-start mb-8">
            <FormControl
                 sx={{
                    m: 1,
                    ml: 4,
                    minWidth: 200,
                    '& .MuiOutlinedInput-root': {
                        color: 'orange',
                        '& fieldset': {
                            borderColor: '#fff3e0',
                        },
                        '&:hover fieldset': {
                            borderColor: '#fff3e0',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#fff3e0',
                        }
                    },
                    '& .MuiSelect-icon': {
                        color: 'orange'
                    }
                }}
            >
                <Select
                    value={selectedRecommendedCategory}
                    onChange={handleRecommendedCategoryChange}
                    displayEmpty
                    sx={{ bgcolor: '#fff3e0' }}
                >
                    <MenuItem value="all">All Performers</MenuItem>
                    <MenuItem value="Singer">Singers</MenuItem>
                    <MenuItem value="Dancer">Dancers</MenuItem>
                    <MenuItem value="Band">Bands</MenuItem>
                    <MenuItem value="DJ">DJs</MenuItem>
                    <MenuItem value="Musician">Musicians</MenuItem>
                    <MenuItem value="Others">Others</MenuItem>
                </Select>
            </FormControl>
        </div>

        <div className="flex justify-between items-center mb-4">
            <TextField
                placeholder="Search recommended performers..."
                variant="outlined"
                value={recommendedSearchQuery}
                onChange={handleRecommendedSearch}
                sx={{
                    width: '300px',
                    '& .MuiOutlinedInput-root': {
                        color: 'orange',
                        '& fieldset': { borderColor: 'orange' },
                        '&:hover fieldset': { borderColor: '#fff3e0' },
                        '&.Mui-focused fieldset': { borderColor: '#fff3e0' }
                    },
                    '& .MuiInputLabel-root': { color: 'white' },
                    backgroundColor: '#fff3e0',
                    borderRadius: '8px'
                }}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton sx={{ color: 'orange' }}>
                                <SearchIcon />
                            </IconButton>
                        </InputAdornment>
                    )
                }}
            />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecommendedPerformers.map((performer, index) => (
                <div key={index} className="flex-none w-72">
                    <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                        <div className="relative">
                            {performer.performer_highlights?.[0]?.highlight_video ? (
                                <video
                                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                                    src={`https://palegoldenrod-weasel-648342.hostingersite.com/backend/talentoproject_backend/public/storage/${performer.performer_highlights[0].highlight_video}`}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                />
                            ) : (
                                <img
                                    src={`https://palegoldenrod-weasel-648342.hostingersite.com/backend/talentoproject_backend/public/storage/${performer.performer_image}`}
                                    alt={performer.performer_name}
                                    className="w-full h-48 object-cover"
                                />
                            )}
                        </div>
                        <div className="p-4">
                            <h4 className="text-lg font-semibold">{performer.performer_name}</h4>
                            <p className="text-base font-semibold mb-1 text-left">
                                <label>Rate:</label> {performer.rate} TCoins
                            </p>
                            <p className="text-base font-semibold mb-1 text-left">
                                <label>Location:</label> {performer.location}
                            </p>
                            <div className="flex items-center mt-2">
                                <span className="mr-2 font-semibold">Rating:</span>
                                <Rating
                                    value={Number(performer.average_rating) || 0}
                                    precision={0.5}
                                    readOnly
                                />
                                <span className="ml-2 text-sm text-gray-600">
                                    ({typeof performer.average_rating === 'number' 
                                        ? performer.average_rating.toFixed(1) 
                                        : "0.0"})
                                </span>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2 mt-4">
                                <button
                                    className="bg-blue-500 text-white px-3 py-2 rounded-md shadow hover:bg-blue-400 transition-colors duration-300 w-full"
                                    onClick={() => handleSeeDetails(performer)}
                                >
                                    See Details
                                </button>
                                <button
                                    className="bg-green-500 text-white px-3 py-2 rounded-md shadow hover:bg-green-400 transition-colors duration-300 w-full"
                                    onClick={() => handleBookRecommendedPerformer(performer)}
                                >
                                    Book
                                </button>
                                <button
                                    className="bg-yellow-500 text-white px-3 py-2 rounded-md shadow hover:bg-yellow-400 transition-colors duration-300 w-full"
                                    onClick={() => handleAddToRecommendedBooking(performer)}
                                >
                                    Add to Booking
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
)}
                        <div ref={performersRef}>
                            <h3 className="text-3xl font-semibold text-white mb-4">ALL Performers</h3>
                            <p className="text-lg text-gray-200 mb-6">
                                Discover the best moments from our top talents and watch them in action.
                            </p>
                            
                            {isPerformersLoaded && performers.length > 0 && showDropdown && (
                                <div className="flex justify-start mb-8">
                                    <FormControl
                                        sx={{
                                            m: 1,
                                            ml: 4,
                                            minWidth: 200,
                                            '& .MuiOutlinedInput-root': {
                                                color: 'orange',
                                                '& fieldset': {
                                                    borderColor: '#fff3e0',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: '#fff3e0',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#fff3e0',
                                                }
                                            },
                                            '& .MuiSelect-icon': {
                                                color: 'orange'
                                            }
                                        }}
                                    >
                                        <Select
                                            value={selectedCategory}
                                            onChange={handleCategoryChange}
                                            displayEmpty
                                            sx={{ bgcolor: '#fff3e0' }}
                                        >
                                            <MenuItem value="all">All Performers</MenuItem>
                                            <MenuItem value="Singer">Singers</MenuItem>
                                            <MenuItem value="Dancer">Dancers</MenuItem>
                                            <MenuItem value="Band">Bands</MenuItem>
                                            <MenuItem value="DJ">DJs</MenuItem>
                                            <MenuItem value="Musician">Musicians</MenuItem>
                                            <MenuItem value="Others">Others</MenuItem>
                                        </Select>
                                    </FormControl>
                                </div>
                            )}
                            
                            <div className="flex justify-between items-center mb-4">
                                <TextField
                                    placeholder="Search performers..."
                                    variant="outlined"
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    sx={{
                                        width: '300px',
                                        '& .MuiOutlinedInput-root': {
                                            color: 'orange',
                                            '& fieldset': { borderColor: 'orange' },
                                            '&:hover fieldset': { borderColor: '#fff3e0' },
                                            '&.Mui-focused fieldset': { borderColor: '#fff3e0' }
                                        },
                                        '& .MuiInputLabel-root': { color: 'white' },
                                        backgroundColor: '#fff3e0',
                                        borderRadius: '8px'
                                    }}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton sx={{ color: 'orange' }}>
                                                    <SearchIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">                            
                            {filteredPerformers.map((performer, index) => (
                                    <div key={index} className="relative group overflow-hidden rounded-lg shadow-lg transition-all duration-500 hover:shadow-2xl bg-white border border-gray-200">
                                        {performer.performer_portfolio?.highlights?.[0]?.highlight_video ? (
                                            <div className="relative">
                                                <video
                            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                            src={`https://palegoldenrod-weasel-648342.hostingersite.com/backend/talentoproject_backend/public/storage/${performer.performer_portfolio.highlights[0].highlight_video}`}
                            autoPlay
                            loop
                            muted={isMuted[index]}
                            playsInline
                        />
                        <button
                            className="absolute bottom-4 right-4 bg-black bg-opacity-60 rounded-full p-3 text-white transition-transform duration-300 hover:scale-110"
                            onClick={() => toggleMute(index)}
                        >
                            {isMuted[index] ? <VolumeOff /> : <VolumeUp />}
                        </button>
                        <img
                            src={performer.image_profile ? `https://palegoldenrod-weasel-648342.hostingersite.com/backend/talentoproject_backend/public/storage/${performer.image_profile}` : profile}
                            alt={performer.name}
                            className="absolute -bottom-6 left-4 w-16 h-16 rounded-full border-4 border-white object-cover transform translate-y-1/2"
                        />
                    </div>
                ) : (
                    <img
                        src={performer.image_profile ? `https://palegoldenrod-weasel-648342.hostingersite.com/backend/talentoproject_backend/public/storage/${performer.image_profile}` : profile}
                        alt={performer.name}
                        className="w-full h-48 object-cover"
                    />
                )}
                <div className="p-4">
                    <h3 className="text-lg font-semibold mb-1">{performer.name} {performer.lastname}</h3>
                    <p className="text-base font-semibold mb-1 text-left">
                        <label>Talent:</label> {performer.performer_portfolio?.talent_name}
                    </p>
                    <p className="text-base font-semibold mb-1 text-left">
                        <label>Location:</label> {performer.performer_portfolio?.location}
                    </p>
                    <p className="text-base font-semibold mb-1 text-left">
                        <label>Rate Per Booking:</label> {performer.performer_portfolio?.rate} TCoins
                    </p>
                    <div className="flex items-center mt-2">
                        <span className="mr-2 font-semibold">Rating:</span>
                        <Rating
                            value={Number(performer.performer_portfolio?.average_rating) || 0}
                            precision={0.5}
                            readOnly
                        />
                        <span className="ml-2 text-sm text-gray-600">
                            ({typeof performer.performer_portfolio?.average_rating === 'number' 
                                ? performer.performer_portfolio?.average_rating.toFixed(1) 
                                : "0.0"})
                        </span>
                    </div>
                </div>
                <div className="p-4 flex flex-wrap justify-center gap-2">
                    <button
                        className="bg-blue-500 text-white px-3 py-2 rounded-md shadow hover:bg-blue-400 transition-colors duration-300 w-full md:w-auto"
                        onClick={() => handleSeeDetails(performer)}
                    >
                        See Details
                    </button>
                    <button
                        className="bg-green-500 text-white px-3 py-2 rounded-md shadow hover:bg-green-400 transition-colors duration-300 w-full md:w-auto"
                        onClick={() => handleBookPerformer(performer)}
                    >
                        Book
                    </button>
                    <button
                        className="bg-yellow-500 text-white px-3 py-2 rounded-md shadow hover:bg-yellow-400 transition-colors duration-300 w-full md:w-auto"
                        onClick={() => handleAddToBooking(performer)}
                    >
                        Add to Booking
                    </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Booking Modal */}
{isBookingModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
        <div className="bg-white p-4 sm:p-8 rounded-lg shadow-2xl w-full max-w-lg mx-auto">
            <h3 className="text-2xl font-semibold mb-4 text-center">
                Find Recommendations
            </h3>
            <form onSubmit={handleBookingSubmit}>
                <div className="mb-4">
                    <label
                        htmlFor="event_name"
                        className="block text-gray-800 font-semibold mb-2"
                    >
                        Event Name
                    </label>
                    <select
                        id="event_name"
                        name="event_id"
                        value={formData.event_id}
                        onChange={handleEventChange}
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        required
                    >
                        <option value="">Select Event</option>
                        {events.map((event) => (
                            <option key={event.id} value={event.id}>
                                {event.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-4">
                    <label
                        htmlFor="theme_name"
                        className="block text-gray-800 font-semibold mb-2"
                    >
                        Theme Name
                    </label>
                    <select
                        id="theme_name"
                        name="theme_id"
                        value={formData.theme_id}
                        onChange={handleThemeChange}
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        required
                        disabled={!formData.event_id}
                    >
                        <option value="">Select Theme</option>
                        {themes.map((theme) => (
                            <option key={theme.id} value={theme.id}>
                                {theme.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-4 mt-4">
                    <button
                        type="submit"
                        className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-5 py-3 rounded-full shadow hover:from-indigo-700 hover:to-indigo-600 transition-transform duration-300 transform hover:scale-105"
                    >
                        Find Performers
                    </button>
                    <button
                        type="button"
                        className="bg-gray-600 text-white px-5 py-3 rounded-full shadow hover:bg-gray-500 transition-transform duration-300 transform hover:scale-105"
                        onClick={handleBookingFormClose}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    </div>
)}

{/* Filtered Performers Modal */}
{isFilteredModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-4xl h-full mx-auto overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-center">
                Available Performers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPerformers.length > 0 ? (
                    filteredPerformers.map((performer, index) => (
                        <div
                            key={index}
                            className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md"
                        >
                            <img
                                src={`https://palegoldenrod-weasel-648342.hostingersite.com/backend/talentoproject_backend/public/storage/${performer.image_profile}`}
                                alt={performer.name}
                                className="w-full h-40 object-cover"
                            />
                            <div className="p-4">
                                <h3 className="text-lg font-semibold mb-2">
                                    {performer.name}
                                </h3>
                                <p className="text-gray-600 font-semibold">
                                    <label>Talent:</label>{" "}
                                    {performer.performer_portfolio?.talent_name}
                                </p>
                                <p className="text-gray-600 font-semibold">
                                    <label>Rate per Booking:</label>{" "}
                                    {performer.performer_portfolio?.rate} TCoins
                                </p>
                                <p className="text-gray-600 font-semibold">
                                    <label>Location:</label>{" "}
                                    {performer.performer_portfolio?.location}
                                </p>
                                <div className="flex items-center mt-2">
                                    <span className="mr-2 font-semibold">
                                        Rating:
                                    </span>
                                    <Rating
                                        value={performer.performer_portfolio?.average_rating || 0.0}
                                        precision={0.5}
                                        readOnly
                                    />
                                </div>
                                <button
                                    className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow hover:bg-blue-400 transition-colors duration-300 w-full"
                                    onClick={() => handleSeeDetails(performer)}
                                >
                                    See Details
                                </button>
                                <button
                                    className="mt-4 ml-0 bg-green-500 text-white px-4 py-2 rounded-md shadow hover:bg-green-400 transition-colors duration-300 w-full"
                                    onClick={() => handleBookPerformer(performer)}
                                >
                                    Book
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-600">
                        No performers available for the selected event and theme.
                    </p>
                )}
            </div>
            <div className="flex justify-end mt-4">
                <button
                    className="bg-gray-600 text-white px-4 py-2 rounded-md shadow hover:bg-gray-500 transition-colors duration-300"
                    onClick={handleFilteredModalClose}
                >
                    Close
                </button>
            </div>
        </div>
    </div>
)}

{/* Selected Performers Modal */}
{isMusicNoteModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 mt-16    ">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-4xl h-full mx-auto overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-center">
                Selected Performers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedPerformers.filter(p => !p.performer_highlights).map((performer, index) => (
                    <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md"
                    >
                        <img
                            src={`https://palegoldenrod-weasel-648342.hostingersite.com/backend/talentoproject_backend/public/storage/${performer.image_profile}`}
                            alt={performer.name}
                            className="w-full h-40 object-cover"
                        />
                        <div className="p-4">
                            <h3 className="text-lg font-semibold mb-2">
                                {performer.name}
                            </h3>
                            <p className="text-gray-600 font-semibold">
                                <label>Talent:</label>{" "}
                                {performer.performer_portfolio?.talent_name}
                            </p>
                            <p className="text-gray-600 font-semibold">
                                <label>Rate per Booking:</label>{" "}
                                {performer.performer_portfolio?.rate} TCoins
                            </p>
                            <p className="text-gray-600 font-semibold">
                                <label>Location:</label>{" "}
                                {performer.performer_portfolio?.location}
                            </p>
                            <div className="flex items-center mt-2">
                                <span className="mr-2 font-semibold">
                                    Rating:
                                </span>
                                <Rating
                                    value={performer.performer_portfolio?.average_rating || 0.0}
                                    precision={0.5}
                                    readOnly
                                />
                            </div>
                            <button
                                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow hover:bg-blue-400 transition-colors duration-300 w-full"
                                onClick={() => handleSeeDetails(performer)}
                            >
                                See Details
                            </button>
                            <button
                                className="mt-4 ml-0 bg-green-500 text-white px-4 py-2 rounded-md shadow hover:bg-green-400 transition-colors duration-300 w-full"
                                onClick={() => handleBookPerformer(performer)}
                            >
                                Book
                            </button>
                            <button
                                className="mt-4 ml-0 bg-red-500 text-white px-4 py-2 rounded-md shadow hover:bg-red-400 transition-colors duration-300 w-full"
                                onClick={() => handleRemovePerformer(performer)}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex flex-col sm:flex-row justify-between mt-4 gap-4">
                <button
                    className="bg-green-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-green-400 transition-transform duration-300 transform hover:scale-105"
                    onClick={() => handleBookAllPerformers()}
                >
                    Book All
                </button>
                <button
                    className="bg-gray-600 text-white px-4 py-2 rounded-md shadow hover:bg-gray-500 transition-colors duration-300"
                    onClick={handleMusicNoteModalClose}
                >
                    Close
                </button>
            </div>
        </div>
    </div>
)}

{/* Recommended Performers Music Note Modal */}
{isRecommendedMusicNoteModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 mt-16">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-4xl h-full mx-auto overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-center">
                Selected Recommended Performers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedRecommendedPerformers.length > 0 ? (
                    selectedRecommendedPerformers.map((performer, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md">
                            <img
                                src={`https://palegoldenrod-weasel-648342.hostingersite.com/backend/talentoproject_backend/public/storage/${performer.performer_image}`}
                                alt={performer.performer_name}
                                className="w-full h-40 object-cover"
                            />
                            <div className="p-4">
                                <h3 className="text-lg font-semibold mb-2">{performer.performer_name}</h3>
                                <p className="text-gray-600 font-semibold">
                                    <label>Talent:</label> {performer.talent_name}
                                </p>
                                <p className="text-gray-600 font-semibold">
                                    <label>Rate:</label> {performer.rate} TCoins
                                </p>
                                <p className="text-gray-600 font-semibold">
                                    <label>Location:</label> {performer.location}
                                </p>
                                <button
                                    className="mt-4 bg-red-500 text-white px-4 py-2 rounded-md w-full"
                                    onClick={() => handleRemoveRecommendedPerformer(performer)}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-600">No recommended performers selected</p>
                )}
            </div>
            <div className="flex flex-col sm:flex-row justify-between mt-4 gap-4">
                <button
                    className="bg-green-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-green-400 transition-transform duration-300 transform hover:scale-105"
                    onClick={() => handleBookAllRecommendedPerformers()}
                >
                    Book All
                </button>
                <button
                    className="bg-gray-600 text-white px-4 py-2 rounded-md shadow hover:bg-gray-500 transition-colors duration-300"
                    onClick={() => setIsRecommendedMusicNoteModalOpen(false)}
                >
                    Close
                </button>
            </div>
        </div>
    </div>
)}
            </main>

            {/* MusicNote Icon for Booking List */}
            <div className="fixed bottom-6 left-6 z-50">
                <Badge
                    id="music"
                    badgeContent={selectedPerformers.length}
                    color="primary"
                    onClick={handleMusicNoteModalToggle}
                >
                    <MusicNote
                        fontSize="large"
                        style={{ cursor: "pointer", color: "#1976d2" }}
                    />
                </Badge>
            </div>

            <div className="fixed bottom-5 right-5 z-10">
                <ChatCustomer />
            </div>
        </div>
    );
}

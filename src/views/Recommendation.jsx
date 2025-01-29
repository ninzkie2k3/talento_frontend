import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../axiosClient";
import Rating from "@mui/material/Rating";
import { FormControl, Select, MenuItem, Button, Tooltip, IconButton, Badge, Box } from "@mui/material";
import { toast } from "react-toastify";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper/modules";
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import logo from "../assets/logotalentos.png"; // Adjust the import path as necessary

export default function Recommendation() {
    const [recommendedPerformers, setRecommendedPerformers] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedTheme, setSelectedTheme] = useState(null);
    const [selectedTalent, setSelectedTalent] = useState("all");
    const [events, setEvents] = useState([]);
    const [themes, setThemes] = useState([]);
    const [selectedPerformers, setSelectedPerformers] = useState([]);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isMusicNoteModalOpen, setIsMusicNoteModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        fetchRecommendedPerformers();
    }, [selectedEvent, selectedTheme, selectedTalent]);

    const fetchRecommendedPerformers = async () => {
        setIsLoading(true);
        
        try {
            // Fetch performers from DB
            const dbResponse = await axiosClient.get("https://recommend-mp6v.onrender.com/recommend_db");
    
            // Ensure we get an array
            const performers = dbResponse.data.recommendations || []; // ✅ Now it's an array
    
            console.log("Performers from DB:", performers);
    
            // Filter relevant performers based on user selection
            const filteredPerformers = performers.filter(performer => 
                (selectedTalent === "all" || performer.talent_name.toLowerCase() === selectedTalent.toLowerCase()) &&
                (!selectedEvent || performer.event_name === selectedEvent.name) &&
                (!selectedTheme || performer.theme_name === selectedTheme.name)
            );
    
            console.log("Filtered Performers:", filteredPerformers);
    
            if (filteredPerformers.length === 0) {
                toast.info("No matching performers found.");
                setRecommendedPerformers([]);
                return;
            }
    
            // Send filtered performers to AI recommendation endpoint
            const recommendResponse = await axiosClient.post("https://recommend-mp6v.onrender.com/recommend", filteredPerformers);
    
            if (recommendResponse.data.status === "success") {
                console.log("AI Recommendations:", recommendResponse.data.recommendations);
                setRecommendedPerformers(recommendResponse.data.recommendations);
            } else {
                toast.info("No recommendations found.");
                setRecommendedPerformers([]);
            }
    
        } catch (error) {
            console.error("Error fetching recommendations:", error);
            toast.error("Failed to fetch recommendations.");
        } finally {
            setIsLoading(false);
        }
    };
    
    

    const fetchEvents = async () => {
        try {
            const response = await axiosClient.get("/events");
            setEvents(response.data);
        } catch (error) {
            console.error("Error fetching events:", error);
            toast.error("Failed to fetch events");
        }
    };

    const handleEventChange = async (event) => {
        const eventId = event.target.value;
        const selectedEventObj = events.find((e) => e.id === eventId);
        setSelectedEvent(selectedEventObj);

        try {
            if (eventId !== "all") {
                const response = await axiosClient.get(`/events/${eventId}/themes`);
                setThemes(response.data);
            } else {
                setThemes([]);
            }
        } catch (error) {
            console.error("Error fetching themes:", error);
            toast.error("Failed to fetch themes");
        }
    };

    const handleThemeChange = (event) => {
        const themeId = event.target.value;
        const selectedThemeObj = themes.find((t) => t.id === themeId);
        setSelectedTheme(selectedThemeObj);
    };

    const handleTalentChange = (event) => {
        const talentName = event.target.value.toLowerCase();
        setSelectedTalent(talentName);
    };

    const handleAddToBooking = (performer) => {
        const performerData = {
            id: performer.id,
            name: performer.performer_name,
            image_profile: performer.image_profile,
            performer_portfolio: {
                id: performer.performer_id,
                talent_name: performer.talent_name,
                rate: performer.rate,
                location: performer.location,
                average_rating: performer.average_rating,
            },
        };

        setSelectedPerformers((prevSelected) => [...prevSelected, performerData]);
        setIsBookingModalOpen(true);
    };

    const handleBookRecommendedPerformer = (performer) => {
        const performerData = {
            id: performer.id,
            name: performer.performer_name,
            image_profile: performer.image_profile,
            performer_portfolio: {
                id: performer.performer_id,
                talent_name: performer.talent_name,
                rate: performer.rate,
                location: performer.location,
                average_rating: performer.average_rating,
            },
        };

        navigate("/addBook", {
            state: { performers: [performerData] },
        });
    };

    const handleOpenBookingPage = () => {
        navigate("/addBook", {
            state: { performers: selectedPerformers },
        });
    };

    const handleSeeDetails = (performer) => {
        navigate(`/portfolio/${performer.performer_id}`);
    };

    const handleMusicNoteModalToggle = () => {
        if (selectedPerformers.length > 0) {
            setIsMusicNoteModalOpen(true);
        }
    };

    const handleMusicNoteModalClose = () => setIsMusicNoteModalOpen(false);

    const handleRemovePerformer = (performerToRemove) => {
        setSelectedPerformers((prevSelected) =>
            prevSelected.filter((performer) => performer.id !== performerToRemove.id)
        );
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-transparent">
                <img
                    src={logo}
                    alt="Loading..."
                    className="w-16 h-16 animate-bounce"
                />
                <p className="text-orange-500 text-xl font-bold animate-pulse">
                    Loading recommendations...
                </p>
            </div>
        );
    }

    return (
        <div className="container max-w-[95%] lg:max-w-6xl mx-auto px-4 py-8">
            
          
               
                    <h2 className="text-3xl font-bold mb-4 text-center">
                        Recommended Performers
                    </h2>
                    <Box className="relative">
                    <Box
                    sx={{
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: 'rgb(255, 204, 153)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px',
                    }}
                    className="md:grid md:grid-cols-3 md:gap-4"
                    >
                         {selectedPerformers.length > 0 && (
                        <Tooltip title="View Booking">
                        <IconButton color="primary" onClick={handleMusicNoteModalToggle}>
                            <Badge badgeContent={selectedPerformers.length} color="secondary">
                            <MusicNoteIcon />
                            </Badge>
                        </IconButton>
                        </Tooltip>
                    )}
                        <FormControl fullWidth>
                            <Select
                                value={selectedEvent ? selectedEvent.id : "all"}
                                onChange={handleEventChange}
                                displayEmpty
                            >
                                <MenuItem value="all">All Events</MenuItem>
                                {events.map((event) => (
                                    <MenuItem key={event.id} value={event.id}>
                                        {event.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <Select
                                value={selectedTheme ? selectedTheme.id : "all"}
                                onChange={handleThemeChange}
                                displayEmpty
                            >
                                <MenuItem value="all">All Themes</MenuItem>
                                {themes.map((theme) => (
                                    <MenuItem key={theme.id} value={theme.id}>
                                        {theme.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <Select
                                value={selectedTalent}
                                onChange={handleTalentChange}
                                displayEmpty
                            >
                                <MenuItem value="all">All Talents</MenuItem>
                                <MenuItem value="singer">Singer</MenuItem>
                                <MenuItem value="dj">DJ</MenuItem>
                                <MenuItem value="musician">Musician</MenuItem>
                                <MenuItem value="drummer">Drummer</MenuItem>
                                <MenuItem value="dancer">Dancer</MenuItem>
                            </Select>
                        </FormControl>
                       
                    </Box>
                   
                  
                   
                </Box>
               

                {/* Scrollable Recommendations Section */}
                <Box
                     sx={{
                        mt: 4,
                        p: 2,
                        maxWidth: '100vw', // Ensure full width
                        overflowX: 'hidden', // Prevent horizontal scroll
                    }}
                >
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    <div className="mt-4 ">
    <Swiper
  slidesPerView={5}
  slidesPerGroup={4}
  spaceBetween={24}
  navigation={{
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  }}
  pagination={{
    clickable: true,
    dynamicBullets: true,
    dynamicMainBullets: 5,
    el: '.swiper-pagination',
  }}
  modules={[Navigation, Pagination]}
  breakpoints={{
    320: {
      slidesPerView: 1,
      spaceBetween: 16,
    },
    640: {
      slidesPerView: 2,
      spaceBetween: 20,
    },
    768: {
      slidesPerView: 3,
      spaceBetween: 22,
    },
    1024: {
      slidesPerView: 5,
      spaceBetween: 24,
    }
  }}
  className="!overflow-visible relative"
>

        {recommendedPerformers.map((performer, index) => (
            <SwiperSlide key={index}
            style={{
                minWidth: '200px', // Decreased card width
                maxWidth: '220px', // Added max-width
                flexShrink: 0,
            }}
        >
           
            <Box
                sx={{
                    border: '2px solid',
                    borderColor: performer.average_rating >= 4 ? 'green' : performer.average_rating >= 2 ? 'orange' : 'red',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: 'rgb(255, 204, 153)',
                    boxShadow: 3,
                    width: '100%', // Ensures responsiveness
                    height: '320px', // Adjusted height for compact look
                }}
            >
                <img
                    src={`https://palegoldenrod-weasel-648342.hostingersite.com/backend/talentoproject_backend/public/storage/${performer.image_profile}`}
                    alt={performer.talent_name}
                    className="w-full h-32 object-cover" // Reduced image height
                />
                <div className="p-2"> {/* Reduced padding */}
                    <h3 className="text-sm font-semibold">{performer.talent_name}</h3>
                    <p className="text-xs">Name: {performer.performer_name}</p>
                    <p className="text-xs">Rate: {performer.rate} TCoins</p>
                    <p className="text-xs">Event: {performer.event_name}</p>
                    <p className="text-xs">Theme: {performer.theme_name}</p>
                    <Rating
                        value={Number(performer.average_rating) || 0}
                        readOnly
                        precision={0.5}
                        size="small"
                    />
                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => handleAddToBooking(performer)}
                        >
                            Add
                        </Button>
                        <Button
                            variant="contained"
                            color="info"
                            size="small"
                            onClick={() => handleSeeDetails(performer)}
                        >
                            Details
                        </Button>
                        <Button
                            variant="contained"
                            color="secondary"
                            size="small"
                            onClick={() => handleBookRecommendedPerformer(performer)}
                        >
                            Book
                        </Button>
                    </div>
                </div>
                
            </Box>
          
        </SwiperSlide>
            
        ))}
         
      
  {/* <div className="swiper-button-next !absolute !top-1/2 !right-30 transform -translate-y-1/2 
                    !text-orange-500 
                    !w-8 !h-8 flex justify-center" />
  <div className="swiper-button-prev !absolute !top-1/2 !left-0 transform -translate-y-1/2 
                    !text-orange-500 
                    !w-8 !h-8 flex items-center justify-center" />
           
           <div className="swiper-pagination bottom-13 justify-center !mt-2" /> */}
            </Swiper>
            

  
               
         </div>
                    </div>
                </Box>

                

                {isMusicNoteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-4xl h-full mx-auto overflow-y-auto">
                            <h3 className="text-xl font-semibold mb-4 text-center">
                                Selected Performers
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {selectedPerformers.length > 0 ? (
                                    selectedPerformers.map((performer, index) => (
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
                                                    onClick={() => handleBookRecommendedPerformer(performer)}
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
                                    ))
                                ) : (
                                    <p className="text-center text-gray-600">
                                        No performers have been selected for booking.
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between mt-4 gap-4">
                                <button
                                    className="bg-green-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-green-400 transition-transform duration-300 transform hover:scale-105"
                                    onClick={() => handleOpenBookingPage()}
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
               

            
        </div>
    );
    
}

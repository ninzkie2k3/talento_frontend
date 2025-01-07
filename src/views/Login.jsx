import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../axiosClient";
import { useStateContext } from "../context/contextprovider";
import logo from "../assets/logotalentos.png";

export default function Login() {
    const emailRef = useRef();
    const passwordRef = useRef();
    const { setUser, setToken } = useStateContext();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null); 
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (ev) => {
        ev.preventDefault();

        const payload = {
            email: emailRef.current.value,
            password: passwordRef.current.value,
        };
        setIsLoading(true);
        axiosClient.post("/login", payload)
            .then(({ data }) => {
                setUser(data.user);
                setToken(data.token);
                setTimeout(() => {
                    setIsLoading(false); 
                    navigate(role === "performer" ? "/" : "/");
                }, 3000);
                console.log("Login success");

                // Reset success message when login is successful
                setSuccessMessage(null);
                setIsLoading(false); 
                if (data.user.role === 'admin') {
                    navigate('/managepost');
                } else if (data.user.role === 'client') {
                    navigate('/customer');
                } else if (data.user.role === 'performer') {
                    navigate('/post');
                }
            })
            .catch(err => {
                const response = err.response;
                if (response) {
                    setError(`${response.data.message}`);
                } else {
                    setError(`${err.message}`);
                    
                }
                setIsLoading(false); 
            });
    };
    const handlePasswordResetSuccess = () => {
        setSuccessMessage("Password has been reset successfully!");
    };
    

    return (
        <>
        {isLoading && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-transparent">
                    <img
                        src={logo}
                        alt="Loading..."
                        className="w-16 h-16 animate-bounce"
                    />
                    <p className="text-orange-500 text-xl font-bold animate-pulse">
                                Loging in...
                    </p>
                </div>
            )}
            <div className="min-h-screen flex items-center justify-center bg-yellow-700 relative overflow-hidden" 
                style={{ backgroundImage: "url('/confetti.png')", 
                backgroundRepeat: "no-repeat", 
                backgroundPosition: "center", 
                backgroundSize: "cover" }}>
                {/* Add overlay to create contrast */}
                <div className="absolute inset-0 bg-black opacity-50"></div>
                
                <main className="z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-4xl mx-auto">
                    <div className="w-full max-w-md space-y-8">
                        <div className="bg-gradient-to-r from-red-500 to-yellow-500 hover:from-yellow-500 hover:to-red-500 transition-all duration-300 py-8 px-10 shadow-2xl rounded-2xl relative">
                            {/* Logo Section */}
                            <div className="flex items-center justify-center">
                                <img src={logo} alt="Logo" className="w-24 h-24 animate-bounce" />
                            </div>
                            <h2 className="text-center text-4xl font-extrabold text-white mt-4">Welcome Back!</h2>

                            {/* Success Message */}
                            {successMessage && (
                                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4">
                                    <span className="block sm:inline">{successMessage}</span>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4">
                                    <span className="block sm:inline">{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-[#151717]">
                                        Email address
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            ref={emailRef}
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            className="appearance-none rounded-full relative block w-full px-3 py-3 border border-[#ecedec] placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2d79f3] focus:border-[#2d79f3] focus:z-10 sm:text-sm"
                                            placeholder="Enter your Email"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-[#151717]">
                                        Password
                                    </label>
                                    <div className="mt-1 relative">
                                        <input
                                            ref={passwordRef}
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="current-password"
                                            required
                                            className="appearance-none rounded-full relative block w-full px-3 py-3 border border-[#ecedec] placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2d79f3] focus:border-[#2d79f3] focus:z-10 sm:text-sm pr-10"
                                            placeholder="Enter your Password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500 hover:text-gray-700">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500 hover:text-gray-700">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    <div className="text-sm text-right mt-2">
                                        <Link to="/forgotpw" className="font-medium text-white hover:text-red-300">
                                            Forgot Password?
                                        </Link>
                                    </div>
                                </div>

                                {/* <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <input
                                            id="remember_me"
                                            name="remember_me"
                                            type="checkbox"
                                            className="h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-300 rounded"
                                        />
                                        <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-300">
                                            Remember me
                                        </label>
                                    </div>
                                </div> */}

                                <div>
                                    <button
                                        type="submit"
                                        className="group relative w-full flex justify-center py-3 px-4 border-2 border-white text-sm font-medium rounded-full text-white bg-transparent hover:bg-orange-600 focus:outline-none transition-all duration-500 transform hover:scale-105 active:scale-90"
                                    >
                                        Log In
                                    </button>
                                </div>
                            </form>
                            <p className="mt-6 text-center text-sm text-black">
                                Don’t have an account?{" "}
                                <Link to="/register" className="font-medium text-white hover:text-red-300">
                                    Sign up now
                                </Link>
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
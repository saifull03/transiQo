import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Predefined locations list for interactive fare calculator
const LOCATIONS = [
  "Dhaka Airport",
  "Gulshan 2",
  "Dhanmondi 32",
  "Uttara Sector 10",
  "Motijheel",
  "Mirpur 10"
];

// Distance in km and duration in minutes between locations
const FARE_DATABASE = {
  "Dhaka Airport": {
    "Gulshan 2": { distance: 8.5, duration: 20 },
    "Dhanmondi 32": { distance: 15.2, duration: 45 },
    "Uttara Sector 10": { distance: 4.1, duration: 12 },
    "Motijheel": { distance: 18.0, duration: 50 },
    "Mirpur 10": { distance: 12.0, duration: 35 },
  },
  "Gulshan 2": {
    "Dhaka Airport": { distance: 8.5, duration: 20 },
    "Dhanmondi 32": { distance: 9.8, duration: 30 },
    "Uttara Sector 10": { distance: 11.2, duration: 28 },
    "Motijheel": { distance: 12.5, duration: 40 },
    "Mirpur 10": { distance: 8.4, duration: 25 },
  },
  "Dhanmondi 32": {
    "Dhaka Airport": { distance: 15.2, duration: 45 },
    "Gulshan 2": { distance: 9.8, duration: 30 },
    "Uttara Sector 10": { distance: 16.5, duration: 45 },
    "Motijheel": { distance: 6.2, duration: 22 },
    "Mirpur 10": { distance: 7.5, duration: 24 },
  },
  "Uttara Sector 10": {
    "Dhaka Airport": { distance: 4.1, duration: 12 },
    "Gulshan 2": { distance: 11.2, duration: 28 },
    "Dhanmondi 32": { distance: 16.5, duration: 45 },
    "Motijheel": { distance: 21.0, duration: 60 },
    "Mirpur 10": { distance: 14.5, duration: 38 },
  },
  "Motijheel": {
    "Dhaka Airport": { distance: 18.0, duration: 50 },
    "Gulshan 2": { distance: 12.5, duration: 40 },
    "Dhanmondi 32": { distance: 6.2, duration: 22 },
    "Uttara Sector 10": { distance: 21.0, duration: 60 },
    "Mirpur 10": { distance: 13.8, duration: 42 },
  },
  "Mirpur 10": {
    "Dhaka Airport": { distance: 12.0, duration: 35 },
    "Gulshan 2": { distance: 8.4, duration: 25 },
    "Dhanmondi 32": { distance: 7.5, duration: 24 },
    "Uttara Sector 10": { distance: 14.5, duration: 38 },
    "Motijheel": { distance: 13.8, duration: 42 },
  }
};

const Home = () => {
  // App Mockup State
  const [demoStep, setDemoStep] = useState("setup"); // setup, searching, tracking, completed
  const [demoProgress, setDemoProgress] = useState(0);
  const [demoPickup, setDemoPickup] = useState("Dhaka Airport");
  const [demoDestination, setDemoDestination] = useState("Gulshan 2");
  const [demoRideType, setDemoRideType] = useState("Eco");
  const [demoRating, setDemoRating] = useState(5);
  const [demoHasRated, setDemoHasRated] = useState(false);

  // Estimator Widget State
  const [pickup, setPickup] = useState("Dhaka Airport");
  const [destination, setDestination] = useState("Gulshan 2");
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // FAQ Accordion State
  const [faqOpen, setFaqOpen] = useState([false, false, false, false]);

  // Newsletter form state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Simulated ride state transitions
  useEffect(() => {
    let timer;
    if (demoStep === "searching") {
      timer = setTimeout(() => {
        setDemoStep("tracking");
      }, 2500);
    }
    return () => clearTimeout(timer);
  }, [demoStep]);

  useEffect(() => {
    let interval;
    if (demoStep === "tracking") {
      interval = setInterval(() => {
        setDemoProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setDemoStep("completed");
            }, 600);
            return 100;
          }
          return prev + 2;
        });
      }, 100);
    } else {
      setDemoProgress(0);
    }
    return () => clearInterval(interval);
  }, [demoStep]);

  const handleStartDemo = () => {
    setDemoHasRated(false);
    setDemoRating(5);
    setDemoStep("searching");
  };

  const handleResetDemo = () => {
    setDemoStep("setup");
    setDemoProgress(0);
    setDemoHasRated(false);
  };

  // Math for car position on Cubic Bezier path
  // P0(30, 110), P1(60, 110), P2(140, 30), P3(170, 30)
  const getCarPosition = (p) => {
    const t = p / 100;
    const x = Math.pow(1 - t, 3) * 30 + 3 * Math.pow(1 - t, 2) * t * 60 + 3 * (1 - t) * Math.pow(t, 2) * 140 + Math.pow(t, 3) * 170;
    const y = Math.pow(1 - t, 3) * 110 + 3 * Math.pow(1 - t, 2) * t * 110 + 3 * (1 - t) * Math.pow(t, 2) * 30 + Math.pow(t, 3) * 30;
    
    // Tangent for rotation
    const dx = 3 * Math.pow(1 - t, 2) * 30 + 6 * (1 - t) * t * 80 + 3 * Math.pow(t, 2) * 30;
    const dy = 6 * (1 - t) * t * -80; // Derivative of y coordinates
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    return { x, y, angle };
  };

  const carPos = getCarPosition(demoProgress);

  // Estimator Action
  const calculateFare = (e) => {
    e.preventDefault();
    if (pickup === destination) {
      alert("Please select different pickup and destination points.");
      return;
    }
    setIsCalculating(true);
    setTimeout(() => {
      const data = FARE_DATABASE[pickup]?.[destination] || { distance: 10, duration: 25 };
      const base = 200;
      const distCost = data.distance * 21;
      const timeCost = data.duration * 3;
      const total = base + distCost + timeCost;
      setEstimatedFare({
        pickup,
        destination,
        distance: data.distance,
        duration: data.duration,
        base,
        distCost: parseFloat(distCost.toFixed(2)),
        timeCost: parseFloat(timeCost.toFixed(2)),
        total: parseFloat(total.toFixed(2))
      });
      setIsCalculating(false);
    }, 800);
  };

  const toggleFaq = (index) => {
    setFaqOpen(
      faqOpen.map((item, idx) => (idx === index ? !item : item))
    );
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSubscribed(true);
      setNewsletterEmail("");
      setTimeout(() => setNewsletterSubscribed(false), 5000);
    }
  };

  return (
    <div className="flex-1 bg-gray-950 text-gray-100 overflow-x-hidden relative">
      {/* Background Grid and Glowing Radients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293718_1px,transparent_1px),linear-gradient(to_bottom,#1f293718_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Hero text side */}
          <div className="lg:col-span-7 text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider animate-pulse-slow">
              <span className="flex h-2 w-2 rounded-full bg-blue-400"></span>
              ⚡ Redefining Ride Sharing
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              Go Anywhere with <br className="hidden sm:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500">
                transiQo
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed">
              Experience the next-generation ride hailing platform. Smart routing, premium verified drivers, real-time live tracking, and upfront, 100% transparent pricing.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                to="/register"
                id="hero-cta-register"
                className="px-8 py-4 text-center bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:opacity-95 text-white font-bold rounded-2xl transition-all transform hover:-translate-y-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group"
              >
                Get Started Now
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <a
                href="#fare-estimator"
                id="hero-cta-estimate"
                className="px-8 py-4 text-center bg-gray-900/80 hover:bg-gray-800 text-gray-200 border border-white/10 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
              >
                Estimate Fare
              </a>
            </div>

            {/* Quick trust metrics */}
            <div className="grid grid-cols-3 gap-6 pt-10 border-t border-white/5 max-w-xl">
              <div>
                <p className="text-3xl font-extrabold text-white">4.9★</p>
                <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Average Rating</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-white">99%</p>
                <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">On-Time Pickup</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-white">5k+</p>
                <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Verified Cars</p>
              </div>
            </div>
          </div>

          {/* Interactive Phone Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-80 h-[560px] bg-gray-900 rounded-[40px] p-3 shadow-2xl border-4 border-gray-800 flex flex-col overflow-hidden select-none">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-50 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-900 mr-2"></span>
                <span className="w-8 h-1 rounded-full bg-gray-900"></span>
              </div>

              {/* Screen Content */}
              <div className="flex-1 bg-gray-950 rounded-[32px] overflow-hidden relative flex flex-col pt-6 font-sans">
                {/* Simulated Header */}
                <div className="bg-gray-900/90 border-b border-white/5 py-2.5 px-4 flex items-center justify-between text-white z-20">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    transiQo Live
                  </span>
                  <span className="text-[10px] text-gray-500">12:00 PM</span>
                </div>

                {/* Simulated Views */}
                {demoStep === "setup" && (
                  <div className="flex-1 p-4 flex flex-col justify-between z-10">
                    <div>
                      <h3 className="text-sm font-bold text-white mb-3 text-left">Where to?</h3>
                      
                      {/* Pickers */}
                      <div className="space-y-3">
                        <div className="relative">
                          <label className="text-[10px] text-gray-500 uppercase font-bold block text-left">Pickup Location</label>
                          <select
                            value={demoPickup}
                            onChange={(e) => setDemoPickup(e.target.value)}
                            className="w-full text-xs bg-gray-900 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none"
                          >
                            {LOCATIONS.map((loc) => (
                              <option key={loc} value={loc}>{loc}</option>
                            ))}
                          </select>
                        </div>
                        <div className="relative">
                          <label className="text-[10px] text-gray-500 uppercase font-bold block text-left">Destination</label>
                          <select
                            value={demoDestination}
                            onChange={(e) => setDemoDestination(e.target.value)}
                            className="w-full text-xs bg-gray-900 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none"
                          >
                            {LOCATIONS.filter(l => l !== demoPickup).map((loc) => (
                              <option key={loc} value={loc}>{loc}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Ride options list */}
                      <h3 className="text-sm font-bold text-white mt-5 mb-3 text-left">Select Service</h3>
                      <div className="space-y-2">
                        {[
                          { id: "Eco", name: "transiQo Eco", price: "280 BDT", time: "5 min away", desc: "Reliable daily rides" },
                          { id: "Premium", name: "transiQo Premium", price: "450 BDT", time: "3 min away", desc: "Luxury sedan class" },
                          { id: "Moto", name: "transiQo Moto", price: "150 BDT", time: "2 min away", desc: "Beat traffic on a bike" },
                        ].map((ride) => (
                          <div
                            key={ride.id}
                            onClick={() => setDemoRideType(ride.id)}
                            className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                              demoRideType === ride.id
                                ? "bg-blue-600/20 border-blue-500"
                                : "bg-gray-900/60 border-white/5 hover:bg-gray-900"
                            }`}
                          >
                            <div>
                              <p className="text-xs font-bold text-white">{ride.name}</p>
                              <p className="text-[9px] text-gray-500">{ride.desc} • {ride.time}</p>
                            </div>
                            <span className="text-xs font-black text-cyan-400">{ride.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleStartDemo}
                      className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-cyan-500/20 transition-all cursor-pointer"
                    >
                      Request transiQo
                    </button>
                  </div>
                )}

                {demoStep === "searching" && (
                  <div className="flex-1 p-4 flex flex-col items-center justify-center relative z-10">
                    {/* Pulsing radar */}
                    <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                      <div className="absolute inset-0 rounded-full bg-cyan-500/10 animate-ping"></div>
                      <div className="absolute w-24 h-24 rounded-full bg-blue-500/20 animate-pulse"></div>
                      <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
                        <svg className="w-8 h-8 text-white animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" />
                        </svg>
                      </div>
                    </div>
                    
                    <h3 className="text-sm font-bold text-white mb-1">Finding your driver</h3>
                    <p className="text-[10px] text-gray-400 text-center max-w-[200px]">Matching you with the nearest transiQo rider for {demoRideType} class...</p>

                    <button
                      onClick={handleResetDemo}
                      className="mt-12 text-[10px] text-red-400 hover:text-red-300 font-semibold uppercase tracking-wider"
                    >
                      Cancel Search
                    </button>
                  </div>
                )}

                {demoStep === "tracking" && (
                  <div className="flex-1 flex flex-col justify-between relative z-10">
                    {/* Simulated SVG Map */}
                    <div className="flex-1 relative bg-slate-900 overflow-hidden">
                      <svg className="w-full h-full" viewBox="0 0 200 150">
                        {/* Map Grid */}
                        <defs>
                          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />

                        {/* Ride route path */}
                        <path
                          d="M 30,110 C 60,110 70,70 100,70 C 130,70 140,30 170,30"
                          fill="none"
                          stroke="rgba(6, 182, 212, 0.2)"
                          strokeWidth="6"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 30,110 C 60,110 70,70 100,70 C 130,70 140,30 170,30"
                          fill="none"
                          stroke="#06b6d4"
                          strokeWidth="3"
                          strokeDasharray="5 5"
                          strokeLinecap="round"
                        />

                        {/* Pickup pin */}
                        <circle cx="30" cy="110" r="6" fill="#10b981" />
                        <circle cx="30" cy="110" r="12" fill="#10b981" fillOpacity="0.2" />
                        
                        {/* Destination pin */}
                        <circle cx="170" cy="30" r="6" fill="#ef4444" />
                        <circle cx="170" cy="30" r="12" fill="#ef4444" fillOpacity="0.2" />

                        {/* Animated Car Icon along path */}
                        <g transform={`translate(${carPos.x - 7}, ${carPos.y - 7}) rotate(${carPos.angle})`}>
                          {/* Small Car illustration */}
                          <rect width="14" height="10" rx="3" fill="#3b82f6" />
                          <rect x="8" y="2" width="4" height="6" fill="#67e8f9" />
                          {/* Wheels */}
                          <circle cx="3" cy="1" r="1.5" fill="#111" />
                          <circle cx="11" cy="1" r="1.5" fill="#111" />
                          <circle cx="3" cy="9" r="1.5" fill="#111" />
                          <circle cx="11" cy="9" r="1.5" fill="#111" />
                        </g>
                      </svg>

                      {/* Overlaid stats */}
                      <div className="absolute top-2 left-2 bg-gray-950/90 border border-white/5 py-1 px-2.5 rounded-lg text-left">
                        <p className="text-[8px] text-gray-500 uppercase font-bold">Arriving in</p>
                        <p className="text-[11px] font-black text-white">{Math.max(1, Math.round((100 - demoProgress) / 10))} mins</p>
                      </div>
                    </div>

                    {/* Driver Card Info */}
                    <div className="bg-gray-900 border-t border-white/10 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                            RU
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-white">Rahim Uddin</p>
                            <p className="text-[9px] text-gray-400">★ 4.9 Driver • Verified</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">GA-12-3456</p>
                          <p className="text-[8px] text-gray-500 mt-0.5">Toyota Corolla</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-gray-400">
                        <span>Fare Rate Locked</span>
                        <span className="text-cyan-400 font-extrabold">BDT 21/km</span>
                      </div>
                    </div>
                  </div>
                )}

                {demoStep === "completed" && (
                  <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto z-10">
                    <div className="space-y-4">
                      {/* Success mark */}
                      <div className="flex flex-col items-center pt-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mb-2">
                          <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </div>
                        <h3 className="text-sm font-bold text-white">You Have Arrived!</h3>
                        <p className="text-[9px] text-gray-400">Hope you had a safe ride with us.</p>
                      </div>

                      {/* Receipt */}
                      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-3 text-left space-y-2">
                        <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1.5">
                          <span className="text-gray-400 uppercase font-semibold">Receipt Detail</span>
                          <span className="text-gray-500">#TQ-887126</span>
                        </div>
                        
                        <div className="space-y-1 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Base Fare:</span>
                            <span className="text-white">BDT 200.00</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Distance Cost (8.5 km):</span>
                            <span className="text-white">BDT 178.50</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Time Cost (20 mins):</span>
                            <span className="text-white">BDT 60.00</span>
                          </div>
                          <div className="flex justify-between font-bold border-t border-white/5 pt-1.5 text-xs text-white">
                            <span>Total Billed:</span>
                            <span className="text-cyan-400">BDT 438.50</span>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Rating */}
                      <div className="bg-gray-900/40 border border-white/5 rounded-xl p-3 space-y-2">
                        <p className="text-[10px] text-gray-400">Rate your driver Rahim</p>
                        
                        {demoHasRated ? (
                          <p className="text-[11px] font-bold text-emerald-400">Thank you for your rating!</p>
                        ) : (
                          <div className="flex justify-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => {
                                  setDemoRating(star);
                                  setDemoHasRated(true);
                                }}
                                className="focus:outline-none transform hover:scale-125 transition-transform"
                              >
                                <svg
                                  className={`w-6 h-6 ${star <= demoRating ? "text-yellow-400" : "text-gray-600"}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleResetDemo}
                      className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl border border-white/10 transition-all cursor-pointer mt-2"
                    >
                      Book Another Ride
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Bar Section */}
      <section className="relative z-10 border-t border-b border-white/5 bg-gray-900/30 py-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center space-y-1">
              <h3 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">10k+</h3>
              <p className="text-xs uppercase tracking-widest text-gray-500">Completed Trips</p>
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">500+</h3>
              <p className="text-xs uppercase tracking-widest text-gray-500">Verified Drivers</p>
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">99.8%</h3>
              <p className="text-xs uppercase tracking-widest text-gray-500">Safety Rating</p>
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">15 min</h3>
              <p className="text-xs uppercase tracking-widest text-gray-500">Avg. Arrival Time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Fare Estimator Widget */}
      <section id="fare-estimator" className="relative max-w-5xl mx-auto px-4 py-20 z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            No Surges. No Hidden Fees. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Calculate Your Fare Upfront
            </span>
          </h2>
          <p className="text-gray-400">
            Select your route below and get an instant, itemized estimate. The fare you see is what you pay.
          </p>
        </div>

        <div className="bg-gray-900/60 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Input form */}
            <form onSubmit={calculateFare} className="md:col-span-5 space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block">Pickup Location</label>
                <div className="relative">
                  <select
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    className="w-full bg-gray-950 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block">Destination</label>
                <div className="relative">
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-gray-950 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                id="estimator-calc-btn"
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-cyan-500/10 cursor-pointer"
              >
                {isCalculating ? "Calculating Estimate..." : "Calculate Fare"}
              </button>
            </form>

            {/* Estimate display */}
            <div className="md:col-span-7 h-full flex flex-col justify-center">
              {estimatedFare ? (
                <div className="bg-gray-950 border border-white/5 rounded-2xl p-6 text-left space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white">Guaranteed Fare Estimate</h4>
                      <p className="text-[10px] text-gray-500">Rates matching official admin dashboard rules</p>
                    </div>
                    <span className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold rounded-full uppercase">Locked</span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex justify-between">
                      <span>Base Fare (Setup Fee):</span>
                      <span className="text-white font-medium">BDT {estimatedFare.base.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Distance Cost ({estimatedFare.distance} km @ BDT 21/km):</span>
                      <span className="text-white font-medium">BDT {estimatedFare.distCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trip Duration Estimate ({estimatedFare.duration} mins @ BDT 3/min):</span>
                      <span className="text-white font-medium">BDT {estimatedFare.timeCost.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between font-black text-lg border-t border-white/5 pt-4 text-white">
                      <span>Total Estimated Fare:</span>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                        BDT {estimatedFare.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-start gap-2.5 mt-2">
                    <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.083.984l-.04.022-1.135.568-.06.03a.75.75 0 11-1.084-.984l.04-.022 1.135-.568zM12 21a9.003 9.003 0 008.367-5.5H3.633A9.003 9.003 0 0012 21z" />
                    </svg>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Actual fares might vary slightly based on severe traffic congestions, route changes during the trip, or waiting charges.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full border border-dashed border-white/10 rounded-2xl py-12 px-6 flex flex-col items-center justify-center text-center space-y-3">
                  <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.214.116M12 12V3m0 9h.008M15 15.182l-.214.116M6 12a6 6 0 0112 0 6 6 0 01-12 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Awaiting Route Details</h4>
                    <p className="text-xs text-gray-500 max-w-sm">Enter your pickup location and destination in the form on the left to see our itemized fare breakdown.</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Core Value Features Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24 z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
            Why Commuters Choose <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500">
              transiQo
            </span>
          </h2>
          <p className="text-gray-400 text-lg">
            We solve the core problems of modern urban commuting by merging state-of-the-art tech with safety first principles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Always On Time",
              desc: "Our automated dispatch algorithms ensure you get matched with the closest driver instantly, reducing waiting time up to 40%.",
              iconBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
              svgPath: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
            },
            {
              title: "Double-Layer Safety",
              desc: "Live route sharing, SOS emergency triggers, and background-screened, verified drivers. Your safety is our absolute priority.",
              iconBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
              svgPath: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
            },
            {
              title: "Guaranteed Upfront Pricing",
              desc: "Forget bargaining or unexpected bills. Know the exact charge based on accurate distance and route timing before you ride.",
              iconBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
              svgPath: "M12 6v12m-3-2.818.214.116M12 12V3m0 9h.008M15 15.182l-.214.116M6 12a6 6 0 0 1 12 0 6 6 0 0 1-12 0z",
            }
          ].map((feat, i) => (
            <div
              key={i}
              className="relative group bg-gray-900/40 border border-white/5 hover:border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/5 via-cyan-500/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-6 shadow-inner ${feat.iconBg}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={feat.svgPath} />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-white mb-3">{feat.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative max-w-5xl mx-auto px-4 py-20 z-10">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold uppercase tracking-wider">
            ★★★★★ 5-Star Rated Experience
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white mt-4 mb-4">
            Hear from our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">commuters</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            See why thousands of passengers and riders rely on transiQo for their daily trips.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: "Ayesha K.",
              role: "Daily Commuter",
              initials: "AK",
              gradient: "from-pink-500 to-rose-500",
              feedback: "transiQo is always on time, and the drivers are extremely professional. The live tracker is a huge peace of mind for my late evening commutes back home."
            },
            {
              name: "Rahim Uddin",
              role: "Tech Consultant",
              initials: "RU",
              gradient: "from-cyan-500 to-blue-600",
              feedback: "I love the upfront pricing tool. Being able to see the exact cost breakdown (base, distance, and duration) means I never get surprised with hidden charges."
            },
            {
              name: "Nadia S.",
              role: "University Student",
              initials: "NS",
              gradient: "from-violet-500 to-purple-600",
              feedback: "Super clean layout and matches in seconds. As a student, affordability is key, and transiQo provides premium service at highly competitive rates."
            }
          ].map((user, i) => (
            <div
              key={i}
              className="bg-gray-900/60 border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:shadow-2xl hover:shadow-cyan-500/5 transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-4">
                {/* Five Stars */}
                <div className="flex gap-1">
                  {[...Array(5)].map((_, idx) => (
                    <svg key={idx} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <p className="text-sm text-gray-300 italic leading-relaxed text-left">
                  &ldquo;{user.feedback}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-3.5 border-t border-white/5 pt-5 mt-6">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${user.gradient} flex items-center justify-center text-white text-xs font-black shadow`}>
                  {user.initials}
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-white">{user.name}</h4>
                  <p className="text-[10px] text-gray-500">{user.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive FAQ Accordion */}
      <section className="relative max-w-4xl mx-auto px-4 py-20 z-10 border-t border-white/5">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-white mb-3">Frequently Asked Questions</h2>
          <p className="text-gray-400">Got questions about transiQo? Find answers to our most common queries below.</p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "How do I book a ride?",
              a: "Simply sign up or log in, enter your pickup and destination in the dashboard map, select your preferred ride class (Eco, Premium, or Moto), and click 'Request Ride'. We'll match you with the nearest driver immediately."
            },
            {
              q: "What are the fare rates?",
              a: "Our pricing is transparent and consists of a base fare of 200 BDT, 21 BDT per kilometer, and 3 BDT per minute of trip duration. There are no surges or hidden fees."
            },
            {
              q: "How does safety tracking work?",
              a: "Every ride is monitored in real-time. Once your driver is matched, you can see their exact live location, vehicle number plate, and details. You can share your live ride status with friends and family."
            },
            {
              q: "Can I become a driver for transiQo?",
              a: "Yes! Go to the registration page, select the 'Rider' role during sign-up, submit your vehicle details and license, and once approved by our administrator, you can start earning."
            }
          ].map((faq, index) => (
            <div
              key={index}
              className="bg-gray-900/40 border border-white/5 rounded-2xl overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full py-5 px-6 flex items-center justify-between text-left focus:outline-none"
              >
                <span className="text-sm font-bold text-white">{faq.q}</span>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${faqOpen[index] ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              <div
                className={`transition-all duration-300 overflow-hidden ${
                  faqOpen[index] ? "max-h-40 border-t border-white/5" : "max-h-0"
                }`}
              >
                <div className="p-6 text-xs text-gray-400 text-left leading-relaxed">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final Banner */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 z-10">
        <div className="relative rounded-3xl bg-gradient-to-br from-cyan-600/35 via-blue-600/20 to-purple-600/10 border border-blue-500/30 overflow-hidden py-12 px-6 md:py-20 md:px-12 text-center shadow-2xl">
          <div className="absolute inset-0 bg-grid-white opacity-5 pointer-events-none" />
          <div className="relative max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-5xl font-black text-white">Ready to Go?</h2>
            <p className="text-gray-300 text-sm md:text-lg max-w-xl mx-auto">
              Join thousands of commuters who enjoy transparent, safe, and stress-free rides every day. Sign up now.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                id="cta-footer-register"
                className="px-8 py-4 bg-white text-gray-950 hover:bg-gray-100 font-bold rounded-2xl transition-all shadow-xl shadow-white/10"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                id="cta-footer-login"
                className="px-8 py-4 bg-gray-950/80 hover:bg-gray-900 text-white font-bold rounded-2xl border border-white/10 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/5 bg-gray-950 py-16 z-10 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 text-left">
          
          {/* Logo brand info */}
          <div className="md:col-span-4 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" />
                </svg>
              </div>
              <span className="text-base font-extrabold text-white">transiQo</span>
            </Link>
            <p className="leading-relaxed">
              Urban mobility solutions redesigned from scratch. Safe, fast, and 100% upfront fare estimates for peace of mind commute.
            </p>
            <p className="text-[10px]">
              &copy; {new Date().getFullYear()} transiQo Technologies. All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Press Room</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Our Blog</a></li>
            </ul>
          </div>

          {/* Services */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Services</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">transiQo Eco</a></li>
              <li><a href="#" className="hover:text-white transition-colors">transiQo Premium</a></li>
              <li><a href="#" className="hover:text-white transition-colors">transiQo Moto</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Corporate Travel</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Stay Updated</h4>
            <p className="leading-relaxed">Subscribe to our newsletter for discount offers, safety updates, and company news.</p>
            
            {newsletterSubscribed ? (
              <p className="text-emerald-400 font-bold py-2">✓ Thank you for subscribing!</p>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="bg-gray-900 border border-white/10 rounded-xl px-3 py-2 flex-1 focus:outline-none focus:border-blue-500 text-white text-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all cursor-pointer"
                >
                  Join
                </button>
              </form>
            )}
          </div>

        </div>
      </footer>
    </div>
  );
};

export default Home;

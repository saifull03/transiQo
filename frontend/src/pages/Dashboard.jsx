import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { io } from "socket.io-client";
import ProfileModal from "../components/dashboard/ProfileModal";
import UserPanel from "../components/dashboard/UserPanel";
import RiderPanel from "../components/dashboard/RiderPanel";
import UserReviewPanel from "../components/dashboard/UserReviewPanel";
import RideRequestModal from "../components/dashboard/RideRequestModal";

const DEFAULT_AVATAR =
  "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg";

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  // Shared state
  const [socket, setSocket] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("ride"); // 'ride' | 'stats' | 'reviews'

  // User-specific ride state
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [fare, setFare] = useState(null);
  const [bookingStatus, setBookingStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [riderInfo, setRiderInfo] = useState(null);
  const [paymentWaiting, setPaymentWaiting] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: "" });
  const [completedRideId, setCompletedRideId] = useState(null);

  // Rider-specific state
  const [isOnline, setIsOnline] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [activeRide, setActiveRide] = useState(null);

  // Timer
  const [rideStartTime, setRideStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState("00:00");

  // Stats
  const [stats, setStats] = useState({
    totalRides: 0,
    totalSpent: 0,
    avgRating: 0,
  });
  const [riderRating, setRiderRating] = useState(null);

  const token = () => {
    const s = localStorage.getItem("rideX_user");
    return s ? JSON.parse(s).token : "";
  };
  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${token()}` },
  });

  // Socket setup
  useEffect(() => {
    if (!user) return;
    const s = io("http://localhost:5003");
    setSocket(s);
    s.on("connect", () => {
      s.emit("join", user._id);
      if (user.role === "rider" && isOnline) s.emit("join", "riders");
    });
    s.on("newRideRequest", (d) => {
      if (user.role === "rider" && isOnline) setIncomingRequest(d);
    });
    s.on("removeRideRequest", (d) =>
      setIncomingRequest((p) => (p?._id === d.rideId ? null : p)),
    );
    s.on("rideAccepted", async (d) => {
      if (user.role === "user") {
        setBookingStatus("A driver is on the way!");
        if (d.riderId) {
          try {
            const { data: riderData } = await axios.get(
              `http://localhost:5003/api/auth/rider/${d.riderId}`,
              authHeaders(),
            );
            setRiderInfo(riderData);
          } catch {
            setRiderInfo(d.riderInfo);
          }
        } else {
          setRiderInfo(d.riderInfo);
        }
      }
    });
    s.on("rideStarted", (d) => {
      if (user.role === "user") {
        setBookingStatus("Ride is in progress...");
        setRideStartTime(d.startedAt);
      }
    });
    s.on("rideCompleted", (d) => {
      if (user.role === "user") {
        setBookingStatus("");
        setPaymentWaiting(true);
        setFare(d.fare);
        setRideStartTime(null);
      }
    });
    s.on("paymentConfirmed", (d) => {
      if (user.role === "user") {
        setPaymentWaiting(false);
        setShowReview(true);
        setCompletedRideId(d.rideId);
      }
    });
    return () => s.disconnect();
  }, [user, isOnline]);

  // Timer effect
  useEffect(() => {
    if (!rideStartTime) {
      setElapsedTime("00:00");
      return;
    }
    const id = setInterval(() => {
      const diff = Math.floor(
        (Date.now() - new Date(rideStartTime).getTime()) / 1000,
      );
      setElapsedTime(
        `${String(Math.floor(diff / 60)).padStart(2, "0")}:${String(diff % 60).padStart(2, "0")}`,
      );
    }, 1000);
    return () => clearInterval(id);
  }, [rideStartTime]);

  // Load stats
  useEffect(() => {
    const load = async () => {
      try {
        const [ridesRes, reviewsRes] = await Promise.all([
          axios.get("http://localhost:5003/api/rides/history", authHeaders()),
          user?.role === "rider"
            ? axios.get("http://localhost:5003/api/reviews/my", authHeaders())
            : Promise.resolve({ data: [] }),
        ]);

        const rides = ridesRes.data || [];
        const completed = rides.filter(
          (r) => r.paymentStatus === "completed" || r.status === "completed",
        );
        const totalRides = completed.length;
        const totalSpent = completed.reduce((a, r) => a + (r.fare || 0), 0);

        const reviews = reviewsRes.data || [];
        const ratingAverage = reviews.length
          ? (
              reviews.reduce((acc, item) => acc + item.rating, 0) /
              reviews.length
            ).toFixed(1)
          : user?.rating || 5.0;

        setStats({
          totalRides,
          totalSpent: totalSpent.toFixed(0),
          avgRating: Number(ratingAverage),
        });
        setRiderRating(ratingAverage);
      } catch {
        /* no history yet */
      }
    };
    if (user) load();
  }, [user]);

  const handleLocationsUpdate = (d) => {
    if (d.type === "pickup") setPickup({ ...d.coords, address: d.address });
    if (d.type === "destination")
      setDestination({ ...d.coords, address: d.address });
  };

  const handleRouteCalculated = (info) => {
    setRouteInfo(info);
    setFare(
      info ? (200 + info.distance * 60 + info.duration * 20).toFixed(0) : null,
    );
  };

  const requestRide = async () => {
    if (!pickup || !destination || !fare) return;
    setLoading(true);
    setBookingStatus("");
    try {
      const payload = {
        pickupLocation: {
          lat: pickup.lat,
          lng: pickup.lng,
          address: pickup.address || "Map Selection",
        },
        dropoffLocation: {
          lat: destination.lat,
          lng: destination.lng,
          address: destination.address || "Map Selection",
        },
        distance: routeInfo.distance,
        duration: routeInfo.duration,
        fare: parseFloat(fare),
      };
      const { data } = await axios.post(
        "http://localhost:5003/api/rides/request",
        payload,
        authHeaders(),
      );
      setBookingStatus("Ride requested! Waiting for a driver...");
      socket?.emit("rideRequest", {
        ...data,
        userInfo: { name: user.name, phone: user.phone || "N/A" },
      });
    } catch {
      setBookingStatus("Failed to request ride.");
    } finally {
      setLoading(false);
    }
  };

  const toggleRiderStatus = async () => {
    try {
      const newStatus = !isOnline;
      await axios.put(
        "http://localhost:5003/api/auth/rider/status",
        { isOnline: newStatus },
        authHeaders(),
      );
      setIsOnline(newStatus);
      if (socket && newStatus) socket.emit("join", "riders");
      if (!newStatus) setIncomingRequest(null);
    } catch (e) {
      alert("Error: " + (e.response?.data?.message || e.message));
    }
  };

  const acceptRide = async () => {
    if (!incomingRequest) return;
    try {
      await axios.put(
        `http://localhost:5003/api/rides/${incomingRequest._id}/status`,
        { status: "accepted" },
        authHeaders(),
      );
      socket?.emit("rideAccepted", {
        rideId: incomingRequest._id,
        userId: incomingRequest.user,
        riderId: user._id,
        riderInfo: {
          name: user.name,
          phone: user.phone || "N/A",
          rating: user.rating || 5.0,
          vehicle: user.vehicle || {
            make: "Toyota",
            model: "Corolla",
            licensePlate: "DHK-123",
          },
        },
      });
      setActiveRide({ ...incomingRequest, status: "accepted" });
      setIncomingRequest(null);
    } catch {
      alert("Failed to accept. Another rider may have taken it.");
      setIncomingRequest(null);
    }
  };

  const startRide = async () => {
    if (!activeRide) return;
    try {
      const { data } = await axios.put(
        `http://localhost:5003/api/rides/${activeRide._id}/status`,
        { status: "started" },
        authHeaders(),
      );
      setActiveRide({
        ...activeRide,
        status: "started",
        startedAt: data.startedAt,
      });
      setRideStartTime(data.startedAt);
      socket?.emit("rideStarted", {
        rideId: activeRide._id,
        userId: activeRide.user,
        startedAt: data.startedAt,
      });
    } catch {
      alert("Error starting ride.");
    }
  };

  const finishRide = async () => {
    if (!activeRide) return;
    try {
      await axios.put(
        `http://localhost:5003/api/rides/${activeRide._id}/status`,
        { status: "completed" },
        authHeaders(),
      );
      setActiveRide({ ...activeRide, status: "completed" });
      setRideStartTime(null);
      socket?.emit("rideCompleted", {
        rideId: activeRide._id,
        userId: activeRide.user,
        fare: activeRide.fare,
      });
    } catch {
      alert("Error finishing ride.");
    }
  };

  const confirmPayment = async () => {
    if (!activeRide) return;
    try {
      await axios.put(
        `http://localhost:5003/api/rides/${activeRide._id}/payment`,
        {},
        authHeaders(),
      );
      socket?.emit("paymentConfirmed", {
        rideId: activeRide._id,
        userId: activeRide.user,
      });
      setActiveRide(null);
    } catch {
      alert("Error confirming payment.");
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!completedRideId) return;
    try {
      await axios.post(
        "http://localhost:5003/api/reviews",
        {
          rideId: completedRideId,
          rating: reviewData.rating,
          comment: reviewData.comment,
          reviewBy: user.role,
        },
        authHeaders(),
      );
      setShowReview(false);
      setCompletedRideId(null);
      setPickup(null);
      setDestination(null);
      setRouteInfo(null);
      setFare(null);
      setBookingStatus("");
      setRiderInfo(null);
    } catch {
      alert("Error submitting review.");
    }
  };

  const isRider = user?.role === "rider";
  const profilePic = user?.profilePicture || DEFAULT_AVATAR;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Modals */}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

      <RideRequestModal
        request={incomingRequest}
        onAccept={acceptRide}
        onDecline={() => setIncomingRequest(null)}
      />

      {/* Payment waiting */}
      {paymentWaiting && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-white/10 rounded-3xl p-8 text-center max-w-sm w-full">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">💰</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-2">
              Ride Complete!
            </h2>
            <p className="text-gray-400 mb-4">Please pay your driver</p>
            <div className="text-5xl font-black text-green-400 mb-6">
              ৳{fare}
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm animate-pulse">
              <div className="w-2 h-2 bg-gray-500 rounded-full" />
              Waiting for driver to confirm...
            </div>
          </div>
        </div>
      )}

      {/* Review modal */}
      {showReview && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full">
            <h2 className="text-xl font-black text-white mb-4">
              ⭐ Rate Your Trip
            </h2>
            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Rating (1–5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() =>
                        setReviewData({ ...reviewData, rating: n })
                      }
                      className={`flex-1 py-2 rounded-xl font-bold transition ${reviewData.rating >= n ? "bg-yellow-500 text-gray-900" : "bg-white/10 text-gray-400 hover:bg-white/20"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Comment
                </label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) =>
                    setReviewData({ ...reviewData, comment: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                  rows={3}
                  placeholder="How was your ride?"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:from-blue-500 hover:to-indigo-500 transition"
              >
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Dashboard Layout */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 border-r border-white/5 flex flex-col p-4 gap-2 hidden md:flex">
          {/* Profile card */}
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition group w-full text-left mb-4"
          >
            <div className="relative">
              <img
                src={profilePic}
                alt="Profile"
                className="w-12 h-12 rounded-xl object-cover border-2 border-blue-500/50 group-hover:border-blue-400 transition"
                onError={(e) => {
                  e.target.src = DEFAULT_AVATAR;
                }}
              />
              {isRider && (
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900 ${isOnline ? "bg-green-400" : "bg-gray-600"}`}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">
                {user?.name}
              </p>
              <p className="text-gray-400 text-xs capitalize">
                {isRider ? "Rider" : "Passenger"}
              </p>
            </div>
            <svg
              className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Nav items */}
          {[
            {
              id: "ride",
              label: isRider ? "Ride Control" : "Book a Ride",
              icon: (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              ),
            },
            {
              id: "reviews",
              label: isRider ? "Reviews" : "My Reviews",
              icon: (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  />
                </svg>
              ),
            },
            {
              id: "stats",
              label: "Statistics",
              icon: (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              ),
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-sm w-full text-left ${activeTab === item.id ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          {/* Rider earnings quick view */}
          {isRider && (
            <div className="mt-auto bg-gradient-to-br from-green-600/20 to-emerald-700/20 border border-green-500/20 rounded-2xl p-4">
              <p className="text-xs text-green-400 uppercase tracking-wider font-semibold mb-1">
                Total Earnings
              </p>
              <p className="text-2xl font-black text-white">
                ৳{stats.totalSpent || user?.earnings || 0}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-yellow-400 text-sm">★</span>
                <span className="text-gray-300 text-sm font-semibold">
                  {riderRating !== null ? riderRating : user?.rating || "5.0"}
                </span>
                <span className="text-gray-500 text-xs">rating</span>
              </div>
              <p className="text-gray-600 text-xs mt-2">
                {stats.totalRides} completed ride
                {stats.totalRides !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-gray-900/50 flex-shrink-0">
            <div>
              <h1 className="text-xl font-black text-white">
                {activeTab === "ride"
                  ? isRider
                    ? "Rider Dashboard"
                    : "Book a Ride"
                  : "Statistics"}
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">
                {isRider
                  ? isOnline
                    ? "🟢 Online — waiting for requests"
                    : "⚫ Offline — tap Go Online to start"
                  : "Select pickup and dropoff on the map"}
              </p>
            </div>
            {/* Mobile profile button */}
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 md:hidden"
            >
              <img
                src={profilePic}
                alt="Profile"
                className="w-9 h-9 rounded-xl object-cover border-2 border-blue-500/50"
                onError={(e) => {
                  e.target.src = DEFAULT_AVATAR;
                }}
              />
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto p-6">
            {activeTab === "ride" && !isRider && (
              <UserPanel
                pickup={pickup}
                destination={destination}
                routeInfo={routeInfo}
                fare={fare}
                bookingStatus={bookingStatus}
                loading={loading}
                rideStartTime={rideStartTime}
                elapsedTime={elapsedTime}
                riderInfo={riderInfo}
                onLocationsUpdate={handleLocationsUpdate}
                onRouteCalculated={handleRouteCalculated}
                onRequestRide={requestRide}
              />
            )}
            {activeTab === "ride" && isRider && (
              <RiderPanel
                isOnline={isOnline}
                activeRide={activeRide}
                elapsedTime={elapsedTime}
                rideStartTime={rideStartTime}
                onToggleStatus={toggleRiderStatus}
                onStartRide={startRide}
                onFinishRide={finishRide}
                onConfirmPayment={confirmPayment}
                authHeaders={authHeaders}
              />
            )}
            {activeTab === "reviews" && isRider && (
              <RiderPanel
                isOnline={isOnline}
                activeRide={activeRide}
                elapsedTime={elapsedTime}
                rideStartTime={rideStartTime}
                onToggleStatus={toggleRiderStatus}
                onStartRide={startRide}
                onFinishRide={finishRide}
                onConfirmPayment={confirmPayment}
                authHeaders={authHeaders}
                initialTab="reviews"
              />
            )}
            {activeTab === "reviews" && !isRider && (
              <UserReviewPanel authHeaders={authHeaders} />
            )}
            {activeTab === "stats" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    label: "Total Rides",
                    value: stats.totalRides,
                    icon: "🚗",
                    color: "blue",
                  },
                  {
                    label: isRider ? "Total Earnings" : "Total Spent",
                    value: `৳${isRider ? stats.totalSpent || user?.earnings || 0 : stats.totalSpent}`,
                    icon: "💰",
                    color: "green",
                  },
                  {
                    label: "Rating",
                    value: `${riderRating !== null ? riderRating : user?.rating || "5.0"} ★`,
                    icon: "⭐",
                    color: "amber",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-gray-900 border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition"
                  >
                    <div className="text-3xl mb-3">{s.icon}</div>
                    <p className="text-gray-400 text-sm uppercase tracking-wider">
                      {s.label}
                    </p>
                    <p className="text-3xl font-black text-white mt-1">
                      {s.value}
                    </p>
                  </div>
                ))}
                {isRider && (
                  <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 sm:col-span-2 lg:col-span-1 hover:border-blue-500/30 transition">
                    <div className="text-3xl mb-3">🟢</div>
                    <p className="text-gray-400 text-sm uppercase tracking-wider">
                      Current Status
                    </p>
                    <p
                      className={`text-2xl font-black mt-1 ${isOnline ? "text-green-400" : "text-gray-500"}`}
                    >
                      {isOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

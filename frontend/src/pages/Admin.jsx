import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import ReceiptModal from "../components/ReceiptModal";

const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%233b82f6%22%2F%3E%3Cpath%20d%3D%22M50%2055c-11%200-30%206-30%2018v7h60v-7c0-12-19-18-30-18zm0-10c8.28%200%2015-6.72%2015-15S58.28%2015%2050%2015%2035%2021.72%2035%2030s6.72%2015%2015%2015z%22%20fill%3D%22%23ffffff%22%2F%3E%3C%2Fsvg%3E";

const Admin = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'passengers' | 'drivers' | 'rides' | 'reviews'

  // Hover states for interactive charts
  const [hoveredRevenueIdx, setHoveredRevenueIdx] = useState(null);
  const [hoveredRidesIdx, setHoveredRidesIdx] = useState(null);

  // Data states
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [riders, setRiders] = useState([]);
  const [rides, setRides] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI / Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [receiptConfig, setReceiptConfig] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type, id, name }
  const [selectedProfile, setSelectedProfile] = useState(null); // { type, data }

  const token = () => {
    const s = localStorage.getItem("rideX_user");
    return s ? JSON.parse(s).token : "";
  };

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${token()}` },
  });

  const API_URL = "http://localhost:5003/api/admin";

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/stats`, authHeaders());
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("Failed to load statistics.");
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/users`, authHeaders());
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchRiders = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/riders`, authHeaders());
      setRiders(data);
    } catch (err) {
      console.error("Error fetching riders:", err);
    }
  };

  const fetchRides = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/rides`, authHeaders());
      setRides(data);
    } catch (err) {
      console.error("Error fetching rides:", err);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/reviews`, authHeaders());
      setReviews(data);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "dashboard") {
        await Promise.all([fetchStats(), fetchRides()]);
      } else if (activeTab === "passengers") {
        await fetchUsers();
      } else if (activeTab === "drivers") {
        await fetchRiders();
      } else if (activeTab === "rides") {
        await fetchRides();
      } else if (activeTab === "reviews") {
        await fetchReviews();
      }
    } catch (err) {
      setError("Failed to fetch data from the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "admin") {
      loadData();
    }
  }, [user, activeTab]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;
    try {
      let endpoint = "";
      if (type === "user") endpoint = `/users/${id}`;
      else if (type === "rider") endpoint = `/riders/${id}`;
      else if (type === "ride") endpoint = `/rides/${id}`;
      else if (type === "review") endpoint = `/reviews/${id}`;

      await axios.delete(`${API_URL}${endpoint}`, authHeaders());

      // Refresh corresponding list
      if (type === "user") setUsers(users.filter((u) => u._id !== id));
      else if (type === "rider") setRiders(riders.filter((r) => r._id !== id));
      else if (type === "ride") setRides(rides.filter((r) => r._id !== id));
      else if (type === "review") setReviews(reviews.filter((r) => r._id !== id));

      // Refresh stats if on dashboard or after mutations
      fetchStats();
      setDeleteConfirm(null);
    } catch (err) {
      alert(err.response?.data?.message || `Failed to delete ${type}`);
    }
  };

  // Filtering lists
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    );
  });

  const filteredRiders = riders.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.phone?.includes(q) ||
      r.vehicle?.make?.toLowerCase().includes(q) ||
      r.vehicle?.model?.toLowerCase().includes(q) ||
      r.vehicle?.licensePlate?.toLowerCase().includes(q)
    );
  });

  const filteredRides = rides.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      r._id?.toLowerCase().includes(q) ||
      r.user?.name?.toLowerCase().includes(q) ||
      r.rider?.name?.toLowerCase().includes(q) ||
      r.pickupLocation?.address?.toLowerCase().includes(q) ||
      r.dropoffLocation?.address?.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "all" || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredReviews = reviews.filter((rev) => {
    const q = searchQuery.toLowerCase();
    return (
      rev.comment?.toLowerCase().includes(q) ||
      rev.user?.name?.toLowerCase().includes(q) ||
      rev.rider?.name?.toLowerCase().includes(q)
    );
  });

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl text-red-500">⚠️</span>
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Access Denied</h2>
        <p className="text-gray-400 max-w-sm">
          You do not have permission to access the administrative control panel.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gray-900 border-b md:border-b-0 md:border-r border-white/5 flex flex-col p-4 gap-2">
        <div className="flex items-center gap-3 p-3 rounded-2xl mb-6 bg-white/5 border border-white/10">
          <img
            src={user.profilePicture || DEFAULT_AVATAR}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover border-2 border-red-500"
            onError={(e) => {
              e.target.src = DEFAULT_AVATAR;
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-white font-black text-sm truncate">{user.name}</p>
            <span className="inline-block px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-md text-[10px] uppercase font-bold tracking-wider mt-0.5">
              Super Admin
            </span>
          </div>
        </div>

        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-1 md:gap-2 pb-2 md:pb-0">
          {[
            {
              id: "dashboard",
              label: "Overview",
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                </svg>
              ),
            },
            {
              id: "passengers",
              label: "Passengers",
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ),
            },
            {
              id: "drivers",
              label: "Drivers",
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7a4 4 0 118 0a4 4 0 01-8 0zM2 17c0-2.689 3-5 10-5s10 2.311 10 5v3H2v-3z" />
                </svg>
              ),
            },
            {
              id: "rides",
              label: "Rides",
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
            },
            {
              id: "reviews",
              label: "Reviews",
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ),
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-semibold text-sm whitespace-nowrap text-left w-full ${activeTab === item.id ? "bg-red-600 text-white shadow-lg shadow-red-500/20" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 md:p-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white capitalize">
              {activeTab === "dashboard" ? "Admin Console" : `${activeTab} Management`}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {activeTab === "dashboard"
                ? "Overview of system analytics and ride activity."
                : `Manage registered ${activeTab} and perform operations.`}
            </p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold transition"
          >
            🔄 Refresh Data
          </button>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="w-8 h-8 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-400 font-semibold">Loading console data...</span>
          </div>
        ) : (
          <>
            {/* Dashboard Tab */}
            {activeTab === "dashboard" && stats && (
              <div className="space-y-8 animate-fade-in">
                {/* Stats Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      label: "Total Passengers",
                      value: stats.totalUsers,
                      icon: "👥",
                      bg: "from-blue-600/20 to-blue-700/5",
                      border: "border-blue-500/20",
                    },
                    {
                      label: "Total Drivers",
                      value: stats.totalRiders,
                      icon: "🚗",
                      bg: "from-emerald-600/20 to-emerald-700/5",
                      border: "border-emerald-500/20",
                    },
                    {
                      label: "Total Rides",
                      value: stats.totalRides,
                      icon: "🗺️",
                      bg: "from-amber-600/20 to-amber-700/5",
                      border: "border-amber-500/20",
                    },
                    {
                      label: "System Revenue",
                      value: `৳${stats.totalEarnings?.toLocaleString() || 0}`,
                      icon: "💰",
                      bg: "from-red-600/20 to-red-700/5",
                      border: "border-red-500/20",
                    },
                  ].map((card, i) => (
                    <div
                      key={i}
                      className={`bg-gradient-to-br ${card.bg} border ${card.border} rounded-3xl p-6 shadow-xl relative overflow-hidden hover:scale-[1.02] transition-transform`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
                            {card.label}
                          </p>
                          <p className="text-3xl font-black text-white mt-2">
                            {card.value}
                          </p>
                        </div>
                        <div className="text-3xl">{card.icon}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Visualizations and Statistics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Section (2/3 width) - Charts & Tables */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Revenue Trend SVG Area Chart */}
                    <div className="bg-gray-900 border border-white/5 rounded-3xl p-6 relative">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="text-lg font-black text-white">Revenue Trend</h3>
                          <p className="text-xs text-gray-400 mt-0.5">Daily earnings over the last 7 days</p>
                        </div>
                        <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold">
                          ৳{stats.revenueTrend ? stats.revenueTrend.reduce((sum, d) => sum + d.revenue, 0).toLocaleString() : 0} Total
                        </span>
                      </div>
                      
                      {stats.revenueTrend && stats.revenueTrend.length > 0 ? (
                        <div className="relative">
                          <svg className="w-full h-56 overflow-visible" viewBox="0 0 500 200">
                            <defs>
                              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>

                            {/* Grid Lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                              const y = 30 + ratio * 130;
                              const maxRevVal = Math.max(...stats.revenueTrend.map(d => d.revenue), 100);
                              const labelVal = (maxRevVal * (1 - ratio)).toFixed(0);
                              return (
                                <g key={idx}>
                                  <line x1="45" y1={y} x2="480" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
                                  <text x="35" y={y + 4} fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="end" className="font-mono">
                                    ৳{Number(labelVal).toLocaleString()}
                                  </text>
                                </g>
                              );
                            })}

                            {/* X Axis Labels */}
                            {stats.revenueTrend.map((d, i) => {
                              const x = 55 + i * 68;
                              return (
                                <text key={i} x={x} y="185" fill="rgba(255,255,255,0.5)" fontSize="9" textAnchor="middle" className="font-bold">
                                  {d.day}
                                </text>
                              );
                            })}

                            {/* Draw Area path & Line path */}
                            {(() => {
                              const maxRevVal = Math.max(...stats.revenueTrend.map(d => d.revenue), 100);
                              const points = stats.revenueTrend.map((d, i) => ({
                                x: 55 + i * 68,
                                y: 160 - (d.revenue / maxRevVal) * 130,
                              }));
                              const lineD = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
                              const areaD = `M 55 160 L ${points.map(p => `${p.x} ${p.y}`).join(' L ')} L ${points[points.length-1].x} 160 Z`;
                              
                              return (
                                <>
                                  <path d={areaD} fill="url(#revenueGrad)" />
                                  <path d={lineD} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                  
                                  {/* Circles / Hover Hotspots */}
                                  {points.map((p, i) => (
                                    <g key={i}>
                                      <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r={hoveredRevenueIdx === i ? 6 : 4}
                                        className="fill-red-500 stroke-gray-900 transition-all duration-150 cursor-pointer"
                                        strokeWidth={2}
                                        onMouseEnter={() => setHoveredRevenueIdx(i)}
                                        onMouseLeave={() => setHoveredRevenueIdx(null)}
                                      />
                                    </g>
                                  ))}
                                </>
                              );
                            })()}
                          </svg>

                          {/* Hover Tooltip overlay */}
                          {hoveredRevenueIdx !== null && stats.revenueTrend[hoveredRevenueIdx] && (
                            <div 
                              className="absolute bg-gray-950/95 backdrop-blur border border-white/10 px-3 py-2 rounded-2xl shadow-xl pointer-events-none z-50 text-xs transition-all duration-100 animate-fade-in"
                              style={{
                                left: `${11 + hoveredRevenueIdx * 13.6}%`,
                                top: `${Math.min(100, 160 - (stats.revenueTrend[hoveredRevenueIdx].revenue / Math.max(...stats.revenueTrend.map(d => d.revenue), 100)) * 60)}px`,
                                transform: 'translate(-50%, -120%)'
                              }}
                            >
                              <p className="text-gray-400 font-bold">{stats.revenueTrend[hoveredRevenueIdx].date}</p>
                              <p className="text-red-400 font-black text-sm mt-0.5">৳{stats.revenueTrend[hoveredRevenueIdx].revenue?.toLocaleString()}</p>
                              <p className="text-gray-500 font-medium text-[10px]">{stats.revenueTrend[hoveredRevenueIdx].rides} ride{stats.revenueTrend[hoveredRevenueIdx].rides !== 1 ? 's' : ''}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-48 flex items-center justify-center text-gray-500">No trend data available</div>
                      )}
                    </div>

                    {/* Ride Count Trend SVG Bar Chart */}
                    <div className="bg-gray-900 border border-white/5 rounded-3xl p-6 relative">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="text-lg font-black text-white">Ride Volume</h3>
                          <p className="text-xs text-gray-400 mt-0.5">Total ride requests over the last 7 days</p>
                        </div>
                        <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-xs font-bold">
                          {stats.revenueTrend ? stats.revenueTrend.reduce((sum, d) => sum + d.rides, 0) : 0} Total Rides
                        </span>
                      </div>

                      {stats.revenueTrend && stats.revenueTrend.length > 0 ? (
                        <div className="relative">
                          <svg className="w-full h-56 overflow-visible" viewBox="0 0 500 200">
                            {/* Grid Lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                              const y = 30 + ratio * 130;
                              const maxRideVal = Math.max(...stats.revenueTrend.map(d => d.rides), 5);
                              const labelVal = (maxRideVal * (1 - ratio)).toFixed(0);
                              return (
                                <g key={idx}>
                                  <line x1="45" y1={y} x2="480" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
                                  <text x="35" y={y + 4} fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="end" className="font-mono">
                                    {labelVal}
                                  </text>
                                </g>
                              );
                            })}

                            {/* X Axis Labels */}
                            {stats.revenueTrend.map((d, i) => {
                              const x = 55 + i * 68;
                              return (
                                <text key={i} x={x} y="185" fill="rgba(255,255,255,0.5)" fontSize="9" textAnchor="middle" className="font-bold">
                                  {d.day}
                                </text>
                              );
                            })}

                            {/* Draw Bars */}
                            {(() => {
                              const maxRideVal = Math.max(...stats.revenueTrend.map(d => d.rides), 5);
                              return stats.revenueTrend.map((d, i) => {
                                const x = 41 + i * 68;
                                const height = (d.rides / maxRideVal) * 130;
                                const y = 160 - height;
                                return (
                                  <rect
                                    key={i}
                                    x={x}
                                    y={y}
                                    width={28}
                                    height={Math.max(height, 2)}
                                    rx={4}
                                    className={`fill-blue-500 hover:fill-blue-400 transition-all duration-155 cursor-pointer ${hoveredRidesIdx === i ? 'opacity-90' : 'opacity-70'}`}
                                    onMouseEnter={() => setHoveredRidesIdx(i)}
                                    onMouseLeave={() => setHoveredRidesIdx(null)}
                                  />
                                );
                              });
                            })()}
                          </svg>

                          {/* Hover Tooltip overlay */}
                          {hoveredRidesIdx !== null && stats.revenueTrend[hoveredRidesIdx] && (
                            <div 
                              className="absolute bg-gray-950/95 backdrop-blur border border-white/10 px-3 py-2 rounded-2xl shadow-xl pointer-events-none z-50 text-xs transition-all duration-100 animate-fade-in"
                              style={{
                                left: `${11 + hoveredRidesIdx * 13.6}%`,
                                top: `${Math.min(100, 160 - (stats.revenueTrend[hoveredRidesIdx].rides / Math.max(...stats.revenueTrend.map(d => d.rides), 5)) * 60)}px`,
                                transform: 'translate(-50%, -120%)'
                              }}
                            >
                              <p className="text-gray-400 font-bold">{stats.revenueTrend[hoveredRidesIdx].date}</p>
                              <p className="text-blue-400 font-black text-sm mt-0.5">{stats.revenueTrend[hoveredRidesIdx].rides} Ride{stats.revenueTrend[hoveredRidesIdx].rides !== 1 ? 's' : ''}</p>
                              <p className="text-gray-500 font-medium text-[10px]">Revenue: ৳{stats.revenueTrend[hoveredRidesIdx].revenue?.toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-48 flex items-center justify-center text-gray-500">No volume data available</div>
                      )}
                    </div>

                    {/* Recent Rides Table */}
                    <div className="bg-gray-900 border border-white/5 rounded-3xl p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-black text-white">Recent Rides</h3>
                        <button
                          onClick={() => setActiveTab("rides")}
                          className="text-xs font-bold text-red-400 hover:text-red-300"
                        >
                          View All Rides →
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-white/5 text-gray-400 text-xs uppercase font-semibold">
                              <th className="py-3">Passenger</th>
                              <th className="py-3">Driver</th>
                              <th className="py-3">Fare</th>
                              <th className="py-3">Status</th>
                              <th className="py-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {rides.slice(0, 5).map((ride) => (
                              <tr key={ride._id} className="hover:bg-white/5 transition-colors">
                                <td className="py-3 font-semibold text-white">
                                  {ride.user?.name || "Unknown"}
                                </td>
                                <td className="py-3 text-gray-300">
                                  {ride.rider?.name || "Unassigned"}
                                </td>
                                <td className="py-3 font-bold text-green-400">৳{ride.fare}</td>
                                <td className="py-3">
                                  <span
                                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                      ride.status === "completed" && ride.paymentStatus === "completed"
                                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                                        : ride.status === "completed" && ride.paymentStatus !== "completed"
                                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse"
                                          : ride.status === "cancelled"
                                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                    }`}
                                  >
                                    {ride.status === "completed" && ride.paymentStatus !== "completed"
                                      ? "in progress"
                                      : ride.status}
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  <button
                                    onClick={() =>
                                      setReceiptConfig({ rideId: ride._id, autoAction: null })
                                    }
                                    className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition border border-white/10"
                                  >
                                    Details
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {rides.length === 0 && (
                              <tr>
                                <td colSpan="5" className="text-center py-6 text-gray-500 font-medium">
                                  No recent rides found.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Right Section (1/3 width) - Stats / Top Drivers */}
                  <div className="space-y-6">
                    {/* Ride Status Distribution */}
                    <div className="bg-gray-900 border border-white/5 rounded-3xl p-6">
                      <h3 className="text-lg font-black text-white mb-4">Ride Distribution</h3>
                      <div className="space-y-4">
                        {(() => {
                          const filteredBreakdown = Object.entries(stats.statusBreakdown || {})
                            .filter(([status]) => !["accepted", "arrived", "started"].includes(status));
                          const counts = filteredBreakdown.map(([_, count]) => count);
                          const maxCount = Math.max(...counts, 1);

                          return filteredBreakdown.map(([status, count]) => {
                            const percentage = ((count / maxCount) * 100).toFixed(0);
                            
                            let barColor = "bg-blue-500";
                            if (status === "completed") barColor = "bg-emerald-500";
                            else if (status === "cancelled") barColor = "bg-red-500";

                            return (
                              <div key={status}>
                                <div className="flex justify-between text-xs font-semibold mb-1">
                                  <span className="capitalize text-gray-400">{status}</span>
                                  <span className="text-white font-bold">{count}</span>
                                </div>
                                <div className="w-full bg-white/5 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${barColor}`}
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Payment Method Breakdown Card */}
                    <div className="bg-gray-900 border border-white/5 rounded-3xl p-6">
                      <h3 className="text-lg font-black text-white mb-4">Payment Breakdown</h3>
                      {stats.paymentBreakdown ? (
                        <div className="space-y-6">
                          {/* Progress bar split */}
                          {(() => {
                            const cashCount = stats.paymentBreakdown.cash?.count || 0;
                            const cardCount = stats.paymentBreakdown.card?.count || 0;
                            const totalCount = cashCount + cardCount || 1;
                            const cashPct = ((cashCount / totalCount) * 100).toFixed(0);
                            const cardPct = (100 - parseFloat(cashPct)).toFixed(0);
                            
                            return (
                              <div>
                                <div className="flex justify-between text-xs text-gray-400 font-bold mb-2">
                                  <span>Cash ({cashPct}%)</span>
                                  <span>Card ({cardPct}%)</span>
                                </div>
                                <div className="w-full bg-white/5 rounded-full h-3 flex overflow-hidden">
                                  <div className="bg-emerald-500 h-full transition-all" style={{ width: `${cashPct}%` }}></div>
                                  <div className="bg-blue-500 h-full transition-all" style={{ width: `${cardPct}%` }}></div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Cash Stats Row */}
                          <div className="flex justify-between items-center p-3 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">💵</span>
                              <div>
                                <p className="text-white font-bold text-sm">Cash Payments</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{stats.paymentBreakdown.cash?.count || 0} completed rides</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-emerald-400 font-extrabold text-sm">৳{stats.paymentBreakdown.cash?.amount?.toLocaleString() || 0}</p>
                            </div>
                          </div>

                          {/* Card Stats Row */}
                          <div className="flex justify-between items-center p-3 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">💳</span>
                              <div>
                                <p className="text-white font-bold text-sm">Card Payments</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{stats.paymentBreakdown.card?.count || 0} completed rides</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-blue-400 font-extrabold text-sm">৳{stats.paymentBreakdown.card?.amount?.toLocaleString() || 0}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No payment data available</p>
                      )}
                    </div>

                    {/* Top Performing Drivers Card */}
                    <div className="bg-gray-900 border border-white/5 rounded-3xl p-6">
                      <h3 className="text-lg font-black text-white mb-4">🏆 Top Drivers</h3>
                      {stats.topRiders && stats.topRiders.length > 0 ? (
                        <div className="space-y-4">
                          {stats.topRiders.map((driver, index) => (
                            <div key={driver._id || index} className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-red-500/20 transition-all">
                              <img
                                src={driver.profilePicture || DEFAULT_AVATAR}
                                alt={driver.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-red-500"
                                onError={(e) => {
                                  e.target.src = DEFAULT_AVATAR;
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-white font-bold text-xs truncate">{driver.name}</p>
                                  <span className="text-[10px] font-bold text-yellow-400 flex items-center">
                                    ⭐ {driver.rating?.toFixed(1)}
                                  </span>
                                </div>
                                <p className="text-[10px] text-gray-400 truncate">
                                  {driver.vehicle ? `${driver.vehicle.make} ${driver.vehicle.model}` : 'No vehicle info'}
                                </p>
                                <p className="text-[9px] text-gray-500 mt-0.5">{driver.ridesCount} trip{driver.ridesCount !== 1 ? 's' : ''}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-green-400 font-extrabold text-xs">৳{driver.earnings?.toLocaleString()}</p>
                                <span className="inline-block px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded text-[8px] font-bold mt-1">
                                  #{index + 1}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No drivers data available yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* List Panels */}
            {activeTab !== "dashboard" && (
              <div className="bg-gray-900 border border-white/5 rounded-3xl p-6 space-y-6">
                {/* Search / Filters Bar */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
                  <div className="relative flex-1 max-w-md">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                      🔍
                    </span>
                    <input
                      type="text"
                      placeholder={`Search ${activeTab}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition text-sm"
                    />
                  </div>

                  {activeTab === "rides" && (
                    <div className="flex gap-2">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:border-red-500 transition cursor-pointer"
                      >
                        <option value="all">All Statuses</option>
                        <option value="requested">Requested</option>
                        <option value="accepted">Accepted</option>
                        <option value="arrived">Arrived</option>
                        <option value="started">Started</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Passengers Tab */}
                {activeTab === "passengers" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/5 text-gray-400 text-xs uppercase font-semibold">
                          <th className="py-4 px-4">Name</th>
                          <th className="py-4 px-4">Email</th>
                          <th className="py-4 px-4">Phone</th>
                          <th className="py-4 px-4">Role</th>
                          <th className="py-4 px-4">Joined Date</th>
                          <th className="py-4 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredUsers.map((passenger) => (
                          <tr key={passenger._id} className="hover:bg-white/5 transition-colors">
                            <td
                              onClick={() => setSelectedProfile({ type: "user", data: passenger })}
                              className="py-4 px-4 flex items-center gap-3 font-semibold text-white cursor-pointer group"
                            >
                              <img
                                src={passenger.profilePicture || DEFAULT_AVATAR}
                                alt={passenger.name}
                                className="w-8 h-8 rounded-full object-cover border border-white/10 group-hover:border-red-500 transition-colors"
                                onError={(e) => {
                                  e.target.src = DEFAULT_AVATAR;
                                }}
                              />
                              <div>
                                <p className="flex items-center gap-1.5 group-hover:text-red-500 transition-colors">
                                  {passenger.name}
                                  {passenger.isBlocked && (
                                    <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[9px] uppercase font-extrabold tracking-wider">
                                      Blocked
                                    </span>
                                  )}
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-gray-300">{passenger.email}</td>
                            <td className="py-4 px-4 text-gray-300">{passenger.phone || "N/A"}</td>
                            <td className="py-4 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                                  passenger.role === "admin"
                                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                                    : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                }`}
                              >
                                {passenger.role}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-gray-400">
                              {new Date(passenger.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4 text-right space-x-2">
                              <button
                                onClick={() => setSelectedProfile({ type: "user", data: passenger })}
                                className="px-3 py-1 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-bold transition border border-blue-500/20"
                              >
                                Edit Profile
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteConfirm({
                                    type: "user",
                                    id: passenger._id,
                                    name: passenger.name,
                                  })
                                }
                                disabled={passenger._id === user._id}
                                className="px-3 py-1 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-xs font-bold transition border border-red-500/20 disabled:opacity-30 disabled:pointer-events-none"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan="6" className="text-center py-8 text-gray-500 font-semibold">
                              No passengers found matching search.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Drivers Tab */}
                {activeTab === "drivers" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/5 text-gray-400 text-xs uppercase font-semibold">
                          <th className="py-4 px-4">Driver</th>
                          <th className="py-4 px-4">Vehicle Details</th>
                          <th className="py-4 px-4">Rating</th>
                          <th className="py-4 px-4">Earnings</th>
                          <th className="py-4 px-4">Status</th>
                          <th className="py-4 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredRiders.map((driver) => (
                          <tr key={driver._id} className="hover:bg-white/5 transition-colors">
                            <td
                              onClick={() => setSelectedProfile({ type: "rider", data: driver })}
                              className="py-4 px-4 flex items-center gap-3 font-semibold text-white cursor-pointer group"
                            >
                              <img
                                src={driver.profilePicture || DEFAULT_AVATAR}
                                alt={driver.name}
                                className="w-8 h-8 rounded-full object-cover border border-white/10 group-hover:border-red-500 transition-colors"
                                onError={(e) => {
                                  e.target.src = DEFAULT_AVATAR;
                                }}
                              />
                              <div>
                                <p className="flex items-center gap-1.5 group-hover:text-red-500 transition-colors">
                                  {driver.name}
                                  {driver.isBlocked && (
                                    <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[9px] uppercase font-extrabold tracking-wider">
                                      Blocked
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-400 font-normal group-hover:text-gray-300 transition-colors">
                                  {driver.email} | {driver.phone}
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-gray-300">
                              {driver.vehicle ? (
                                <div>
                                  <p className="font-semibold">
                                    {driver.vehicle.make} {driver.vehicle.model}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {driver.vehicle.licensePlate} ({driver.vehicle.year})
                                  </p>
                                </div>
                              ) : (
                                "No Vehicle Info"
                              )}
                            </td>
                            <td className="py-4 px-4 font-bold text-yellow-400">
                              ⭐ {driver.rating?.toFixed(1) || "5.0"}
                            </td>
                            <td className="py-4 px-4 font-extrabold text-green-400">
                              ৳{driver.earnings || 0}
                            </td>
                            <td className="py-4 px-4">
                              {driver.isBlocked ? (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border bg-red-500/10 text-red-400 border-red-500/20">
                                  Blocked
                                </span>
                              ) : (
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                    driver.isOnline
                                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                                      : "bg-gray-500/10 text-gray-400 border-white/5"
                                  }`}
                                >
                                  {driver.isOnline ? "Online" : "Offline"}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right space-x-2">
                              <button
                                onClick={() => setSelectedProfile({ type: "rider", data: driver })}
                                className="px-3 py-1 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-bold transition border border-blue-500/20"
                              >
                                Edit Profile
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteConfirm({
                                    type: "rider",
                                    id: driver._id,
                                    name: driver.name,
                                  })
                                }
                                className="px-3 py-1 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-xs font-bold transition border border-red-500/20"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredRiders.length === 0 && (
                          <tr>
                            <td colSpan="6" className="text-center py-8 text-gray-500 font-semibold">
                              No drivers found matching search.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Rides Tab */}
                {activeTab === "rides" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/5 text-gray-400 text-xs uppercase font-semibold">
                          <th className="py-4 px-4">ID</th>
                          <th className="py-4 px-4">Passenger</th>
                          <th className="py-4 px-4">Driver</th>
                          <th className="py-4 px-4">Pickup / Dropoff</th>
                          <th className="py-4 px-4">Fare</th>
                          <th className="py-4 px-4">Status</th>
                          <th className="py-4 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredRides.map((ride) => (
                          <tr key={ride._id} className="hover:bg-white/5 transition-colors">
                            <td className="py-4 px-4 font-mono text-xs text-gray-400">
                              {ride._id?.substring(18)}
                            </td>
                            <td className="py-4 px-4 font-semibold text-white">
                              {ride.user?.name || "Unknown"}
                            </td>
                            <td className="py-4 px-4 text-gray-300">
                              {ride.rider?.name || (
                                <span className="text-gray-500 italic">Unassigned</span>
                              )}
                            </td>
                            <td className="py-4 px-4 max-w-xs truncate text-xs text-gray-300">
                              <p className="truncate">
                                🟢 <span className="font-semibold">From:</span>{" "}
                                {ride.pickupLocation?.address || "Coordinates"}
                              </p>
                              <p className="truncate mt-0.5">
                                🔴 <span className="font-semibold">To:</span>{" "}
                                {ride.dropoffLocation?.address || "Coordinates"}
                              </p>
                            </td>
                            <td className="py-4 px-4 font-extrabold text-green-400">
                              ৳{ride.fare}
                            </td>
                            <td className="py-4 px-4">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                  ride.status === "completed" && ride.paymentStatus === "completed"
                                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                                    : ride.status === "completed" && ride.paymentStatus !== "completed"
                                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse"
                                      : ride.status === "cancelled"
                                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                }`}
                              >
                                {ride.status === "completed" && ride.paymentStatus !== "completed"
                                  ? "in progress"
                                  : ride.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right space-x-2">
                              {ride.status === "completed" && ride.paymentStatus === "completed" && (
                                <button
                                  onClick={() =>
                                    setReceiptConfig({ rideId: ride._id, autoAction: null })
                                  }
                                  className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition border border-white/10"
                                >
                                  Receipt
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  setDeleteConfirm({
                                    type: "ride",
                                    id: ride._id,
                                    name: `Ride #${ride._id?.substring(18)}`,
                                  })
                                }
                                className="px-3 py-1 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-xs font-bold transition border border-red-500/20"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredRides.length === 0 && (
                          <tr>
                            <td colSpan="7" className="text-center py-8 text-gray-500 font-semibold">
                              No rides found matching filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === "reviews" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredReviews.map((rev) => (
                      <div
                        key={rev._id}
                        className={`bg-white/5 border rounded-2xl p-5 flex flex-col justify-between transition ${
                          rev.rating < 3
                            ? "border-red-500/30 hover:border-red-500"
                            : "border-white/10 hover:border-red-500/20"
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-yellow-400 font-black">
                                {"★".repeat(rev.rating)}
                                {"☆".repeat(5 - rev.rating)}
                              </span>
                              <span className="text-xs font-bold text-gray-400">
                                ({rev.rating}/5)
                              </span>
                              {rev.rating < 3 && (
                                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-[9px] font-black uppercase tracking-wider animate-pulse">
                                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Alert
                                </span>
                              )}
                            </div>
                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] uppercase font-bold text-gray-400">
                              By {rev.reviewBy}
                            </span>
                          </div>
                          <p className="text-gray-200 text-sm italic font-medium mb-4">
                            "{rev.comment || "No comment provided."}"
                          </p>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-auto">
                          <div className="text-[11px] text-gray-400">
                            <p>
                              Passenger:{" "}
                              <span
                                onClick={() => {
                                  const fullUser = users.find((u) => String(u._id) === String(rev.user?._id)) || rev.user;
                                  if (fullUser) setSelectedProfile({ type: "user", data: fullUser });
                                }}
                                className="font-semibold text-white cursor-pointer hover:text-red-400 hover:underline transition-colors"
                              >
                                {rev.user?.name || "Unknown"}
                              </span>
                            </p>
                            <p className="mt-0.5">
                              Driver:{" "}
                              <span
                                onClick={() => {
                                  const fullRider = riders.find((r) => String(r._id) === String(rev.rider?._id)) || rev.rider;
                                  if (fullRider) setSelectedProfile({ type: "rider", data: fullRider });
                                }}
                                className="font-semibold text-white cursor-pointer hover:text-red-400 hover:underline transition-colors"
                              >
                                {rev.rider?.name || "Unknown"}
                              </span>
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                type: "review",
                                id: rev._id,
                                name: `Review by ${rev.user?.name || "user"}`,
                              })
                            }
                            className="px-2.5 py-1 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-xs font-bold transition border border-red-500/20"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    {filteredReviews.length === 0 && (
                      <div className="col-span-2 text-center py-8 text-gray-500 font-semibold">
                        No reviews found matching search.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full text-center">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-red-500">🗑️</span>
            </div>
            <h3 className="text-xl font-black text-white mb-2">Delete Confirmation</h3>
            <p className="text-gray-400 text-sm mb-6">
              Are you sure you want to delete <span className="font-bold text-white">"{deleteConfirm.name}"</span>? This action is permanent and cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-bold text-white transition shadow-lg shadow-red-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/View Profile Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 max-w-4xl w-full relative my-8 shadow-2xl">
            <button
              onClick={() => setSelectedProfile(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition text-xl"
            >
              ✕
            </button>
            
            <div className="flex flex-col items-center mb-6 border-b border-white/5 pb-4">
              <img
                src={selectedProfile.data.profilePicture || DEFAULT_AVATAR}
                alt={selectedProfile.data.name}
                className={`w-24 h-24 rounded-full object-cover border-4 ${
                  selectedProfile.data.isBlocked ? "border-red-500" : "border-emerald-500"
                } shadow-lg mb-3`}
                onError={(e) => {
                  e.target.src = DEFAULT_AVATAR;
                }}
              />
              <h3 className="text-2xl font-black text-white">{selectedProfile.data.name}</h3>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mt-1">
                {selectedProfile.type === "user" ? "Passenger Profile" : "Driver Profile"}
              </p>
              {selectedProfile.data.isBlocked && (
                <span className="mt-2 px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-black uppercase tracking-wider animate-pulse">
                  Blocked
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-6">
              <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const type = selectedProfile.type;
                const id = selectedProfile.data._id;
                
                const payload = {
                  name: formData.get("name"),
                  email: formData.get("email"),
                  phone: formData.get("phone"),
                  isBlocked: formData.get("isBlocked") === "true",
                };

                if (type === "user") {
                  payload.role = formData.get("role");
                } else if (type === "rider") {
                  payload.vehicle = {
                    make: formData.get("vehicleMake"),
                    model: formData.get("vehicleModel"),
                    year: formData.get("vehicleYear"),
                    licensePlate: formData.get("vehicleLicensePlate"),
                  };
                }

                try {
                  const endpoint = type === "user" ? `/users/${id}` : `/riders/${id}`;
                  const { data } = await axios.put(`${API_URL}${endpoint}`, payload, authHeaders());
                  
                  // Update state
                  if (type === "user") {
                    setUsers(users.map((u) => (u._id === id ? data : u)));
                  } else {
                    setRiders(riders.map((r) => (r._id === id ? data : r)));
                  }
                  
                  fetchStats();
                  setSelectedProfile(null);
                } catch (err) {
                  alert(err.response?.data?.message || "Failed to update profile.");
                }
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={selectedProfile.data.name}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white font-semibold focus:outline-none focus:border-red-500 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={selectedProfile.data.email}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white font-semibold focus:outline-none focus:border-red-500 transition text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={selectedProfile.data.phone || ""}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white font-semibold focus:outline-none focus:border-red-500 transition text-sm"
                  />
                </div>

                {selectedProfile.type === "user" ? (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Role</label>
                    <select
                      name="role"
                      defaultValue={selectedProfile.data.role}
                      disabled={selectedProfile.data._id === user._id}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white font-semibold focus:outline-none focus:border-red-500 transition text-sm disabled:opacity-50"
                    >
                      <option value="user" className="bg-gray-900 text-white">User</option>
                      <option value="admin" className="bg-gray-900 text-white">Admin</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Vehicle License Plate</label>
                    <input
                      type="text"
                      name="vehicleLicensePlate"
                      defaultValue={selectedProfile.data.vehicle?.licensePlate || ""}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white font-semibold focus:outline-none focus:border-red-500 transition text-sm"
                    />
                  </div>
                )}
              </div>

              {selectedProfile.type === "rider" && (
                <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Make</label>
                    <input
                      type="text"
                      name="vehicleMake"
                      defaultValue={selectedProfile.data.vehicle?.make || ""}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-red-500 transition text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Model</label>
                    <input
                      type="text"
                      name="vehicleModel"
                      defaultValue={selectedProfile.data.vehicle?.model || ""}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-red-500 transition text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Year</label>
                    <input
                      type="text"
                      name="vehicleYear"
                      defaultValue={selectedProfile.data.vehicle?.year || ""}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-red-500 transition text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Status / Block Option */}
              <div className="border-t border-white/5 pt-4">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Account Status</label>
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3 rounded-2xl">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">Block Account Access</p>
                    <p className="text-xs text-gray-400">Prevent this account from registering, logging in, or requesting/taking rides.</p>
                  </div>
                  <select
                    name="isBlocked"
                    defaultValue={selectedProfile.data.isBlocked ? "true" : "false"}
                    disabled={selectedProfile.data._id === user._id}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold uppercase focus:outline-none transition ${
                      selectedProfile.data.isBlocked
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : "bg-green-500/10 text-green-400 border-green-500/20"
                    }`}
                  >
                    <option value="false" className="bg-gray-900 text-white">Active</option>
                    <option value="true" className="bg-gray-900 text-white">Blocked</option>
                  </select>
                </div>
              </div>

              {/* User Statistics & Quick Call */}
              <div className="border-t border-white/5 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase">Activity & Statistics</h4>
                <div className="grid grid-cols-3 gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 text-center">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Total Rides</p>
                    <p className="text-lg font-black text-white">
                      {selectedProfile.type === "user"
                        ? rides.filter(r => r.user && String(r.user._id || r.user) === String(selectedProfile.data._id)).length
                        : rides.filter(r => r.rider && String(r.rider._id || r.rider) === String(selectedProfile.data._id)).length
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Completed</p>
                    <p className="text-lg font-black text-emerald-400">
                      {selectedProfile.type === "user"
                        ? rides.filter(r => r.user && String(r.user._id || r.user) === String(selectedProfile.data._id) && r.status === "completed" && r.paymentStatus === "completed").length
                        : rides.filter(r => r.rider && String(r.rider._id || r.rider) === String(selectedProfile.data._id) && r.status === "completed" && r.paymentStatus === "completed").length
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Cancelled</p>
                    <p className="text-lg font-black text-red-400">
                      {selectedProfile.type === "user"
                        ? rides.filter(r => r.user && String(r.user._id || r.user) === String(selectedProfile.data._id) && r.status === "cancelled").length
                        : rides.filter(r => r.rider && String(r.rider._id || r.rider) === String(selectedProfile.data._id) && r.status === "cancelled").length
                      }
                    </p>
                  </div>
                </div>
                
                {selectedProfile.type === "user" ? (
                  <div className="flex justify-between items-center bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl text-sm">
                    <span className="text-gray-400 font-semibold">Total Amount Spent:</span>
                    <span className="font-extrabold text-blue-400">
                      ৳{rides
                        .filter(r => r.user && String(r.user._id || r.user) === String(selectedProfile.data._id) && r.status === "completed" && r.paymentStatus === "completed")
                        .reduce((sum, r) => sum + (r.fare || 0), 0)
                      }
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl text-sm">
                    <span className="text-gray-400 font-semibold">Total Earnings / Rating:</span>
                    <span className="font-extrabold text-emerald-400">
                      ৳{selectedProfile.data.earnings || 0} | ⭐{selectedProfile.data.rating?.toFixed(1) || "5.0"}
                    </span>
                  </div>
                )}

                {selectedProfile.data.phone ? (
                  <a
                    href={`tel:${selectedProfile.data.phone}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-600/20 mt-1"
                  >
                    📞 Call {selectedProfile.data.name} ({selectedProfile.data.phone})
                  </a>
                ) : (
                  <div className="text-center text-xs text-gray-500 py-1 font-semibold">
                    No phone number available to call.
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-4 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setSelectedProfile(null)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-bold text-white transition shadow-lg shadow-red-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>

            {/* Right Column: Ride History */}
            <div className="flex flex-col h-full border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Ride History</h3>
              <div className="flex-1 overflow-y-auto max-h-[500px] space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                {(() => {
                  const profileRides = rides.filter(r => {
                    if (selectedProfile.type === "user") {
                      return r.user && String(r.user._id || r.user) === String(selectedProfile.data._id);
                    } else {
                      return r.rider && String(r.rider._id || r.rider) === String(selectedProfile.data._id);
                    }
                  });

                  if (profileRides.length === 0) {
                    return (
                      <div className="text-center text-xs text-gray-500 py-12 font-medium bg-white/5 rounded-2xl border border-dashed border-white/10">
                        No rides found in history.
                      </div>
                    );
                  }

                  return profileRides.map(ride => (
                    <div key={ride._id} className="bg-white/5 border border-white/5 rounded-xl p-3 text-xs flex flex-col justify-between hover:border-white/10 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-mono text-[9px] text-gray-400">ID: {ride._id?.substring(18)}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                          ride.status === "completed" && ride.paymentStatus === "completed"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : ride.status === "completed" && ride.paymentStatus !== "completed"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse"
                              : ride.status === "cancelled"
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}>
                          {ride.status === "completed" && ride.paymentStatus !== "completed"
                            ? "in progress"
                            : ride.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-gray-300">
                        <p className="truncate">🟢 <span className="font-semibold text-gray-400">Pickup:</span> {ride.pickupLocation?.address || "Coordinates"}</p>
                        <p className="truncate">🔴 <span className="font-semibold text-gray-400">Dropoff:</span> {ride.dropoffLocation?.address || "Coordinates"}</p>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5 text-[9px]">
                        <span className="text-gray-400 text-left">
                          {selectedProfile.type === "user" 
                            ? `Driver: ${ride.rider?.name || "Unassigned"}` 
                            : `Passenger: ${ride.user?.name || "Unknown"}`
                          }
                        </span>
                        <span className="font-extrabold text-green-400 text-xs">৳{ride.fare}</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Receipt Modal */}
      {receiptConfig && (
        <ReceiptModal
          rideId={receiptConfig.rideId}
          autoAction={receiptConfig.autoAction}
          onClose={() => setReceiptConfig(null)}
        />
      )}
    </div>
  );
};

export default Admin;

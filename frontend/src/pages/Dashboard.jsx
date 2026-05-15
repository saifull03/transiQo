import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import RideMap from '../components/Map/RideMap';
import axios from 'axios';
import { io } from 'socket.io-client';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [fare, setFare] = useState(null);
  const [bookingStatus, setBookingStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [socket, setSocket] = useState(null);
  
  // Rider specific state
  const [incomingRequest, setIncomingRequest] = useState(null);

  // Initialize Socket.io Connection
  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:5003');
      setSocket(newSocket);
      
      newSocket.on('connect', () => {
        newSocket.emit('join', user._id);
        // If rider is already online when loading dashboard, join riders room
        if (user.role === 'rider' && isOnline) {
          newSocket.emit('join', 'riders');
        }
      });

      // Listen for incoming ride requests (Rider only)
      newSocket.on('newRideRequest', (rideDetails) => {
        if (user.role === 'rider' && isOnline) {
          setIncomingRequest(rideDetails);
        }
      });

      // Listen for accepted ride (User only)
      newSocket.on('rideAccepted', (data) => {
        if (user.role === 'user') {
          setBookingStatus('A driver is on the way!');
        }
      });

      return () => newSocket.disconnect();
    }
  }, [user, isOnline]);

  const handleLocationsUpdate = (data) => {
    if (data.type === 'pickup') setPickup({ ...data.coords, address: data.address });
    if (data.type === 'destination') setDestination({ ...data.coords, address: data.address });
  };

  const handleRouteCalculated = (info) => {
    setRouteInfo(info);
    if (info) {
      const calculatedFare = 2.00 + (info.distance * 0.80) + (info.duration * 0.20);
      setFare(calculatedFare.toFixed(2));
    } else {
      setFare(null);
    }
  };

  const requestRide = async () => {
    if (!pickup || !destination || !fare) return;
    
    setLoading(true);
    setBookingStatus('');
    try {
      const token = localStorage.getItem('rideX_user') ? JSON.parse(localStorage.getItem('rideX_user')).token : '';
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const payload = {
        pickupLocation: { lat: pickup.lat, lng: pickup.lng, address: pickup.address || 'Map Selection' },
        dropoffLocation: { lat: destination.lat, lng: destination.lng, address: destination.address || 'Map Selection' },
        distance: routeInfo.distance,
        duration: routeInfo.duration,
        fare: parseFloat(fare)
      };

      const { data } = await axios.post('http://localhost:5003/api/rides/request', payload, config);
      
      setBookingStatus('Ride requested successfully! Waiting for a driver...');
      
      if (socket) {
        socket.emit('rideRequest', data);
      }
    } catch (error) {
      setBookingStatus('Failed to request ride. Make sure the backend is running!');
    } finally {
      setLoading(false);
    }
  };

  const toggleRiderStatus = async () => {
    try {
      const token = localStorage.getItem('rideX_user') ? JSON.parse(localStorage.getItem('rideX_user')).token : '';
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const newStatus = !isOnline;
      await axios.put('http://localhost:5003/api/auth/rider/status', { isOnline: newStatus }, config);
      setIsOnline(newStatus);
      
      if (socket) {
        if (newStatus) {
          socket.emit('join', 'riders');
        } else {
          setIncomingRequest(null); // Clear any pending requests when going offline
        }
      }
    } catch (error) {
      console.error("Failed to update status", error);
      alert('Error updating status: ' + (error.response?.data?.message || error.message));
    }
  };

  const acceptRide = async () => {
    if (!incomingRequest) return;
    
    try {
      const token = localStorage.getItem('rideX_user') ? JSON.parse(localStorage.getItem('rideX_user')).token : '';
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(`http://localhost:5003/api/rides/${incomingRequest._id}/status`, { status: 'accepted' }, config);
      
      if (socket) {
        socket.emit('rideAccepted', { 
          rideId: incomingRequest._id, 
          userId: incomingRequest.user, 
          riderId: user._id 
        });
      }
      
      setIncomingRequest(null);
      alert('Ride Accepted! Navigate to the pickup location.');
      // In Phase 6, we will switch UI to active trip tracking
    } catch (error) {
      console.error("Failed to accept ride", error);
      alert('Failed to accept ride. Another rider may have accepted it.');
      setIncomingRequest(null);
    }
  };

  return (
    <div className="flex-1 bg-gray-100 dark:bg-gray-900 flex flex-col items-center py-6 px-4 sm:px-6 lg:px-8">
      {/* Incoming Ride Request Popup */}
      {incomingRequest && user?.role === 'rider' && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden max-w-sm w-full animate-slide-up border border-gray-200 dark:border-gray-700">
            <div className="bg-blue-600 p-4 text-center">
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">New Ride Request</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
                <span className="text-gray-500 dark:text-gray-400">Est. Earnings</span>
                <span className="text-2xl font-black text-green-500">${incomingRequest.fare}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
                <span className="text-gray-500 dark:text-gray-400">Distance</span>
                <span className="font-bold text-gray-800 dark:text-white">{incomingRequest.distance} km</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-gray-500 dark:text-gray-400">Time to complete</span>
                <span className="font-bold text-gray-800 dark:text-white">{incomingRequest.duration} min</span>
              </div>
              
              <div className="pt-4 flex space-x-3">
                <button 
                  onClick={() => setIncomingRequest(null)}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white py-3 rounded-xl font-bold transition hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Decline
                </button>
                <button 
                  onClick={acceptRide}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition shadow-lg shadow-blue-500/30"
                >
                  Accept Ride
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-7xl mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {user?.role === 'rider' ? (isOnline ? 'You are online and waiting for ride requests.' : 'You are currently offline. Go online to accept rides.') : 'Where to? Select pickup and dropoff on the map.'}
          </p>
        </div>
      </div>

      <div className="w-full max-w-7xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 h-[650px] flex flex-col relative">
        <div className="absolute top-4 left-4 z-[400] bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl p-5 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 w-80 sm:w-96 transition-all duration-300">
          <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-4">
            {user?.role === 'rider' ? 'Rider Controls' : 'Ride Details'}
          </h3>
          
          {user?.role === 'user' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>{pickup ? `Pickup: ${pickup.address || `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`}` : 'Select Pickup on Map'}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>{destination ? `Dropoff: ${destination.address || `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`}` : 'Select Dropoff on Map'}</span>
              </div>

              {routeInfo && fare && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Distance</span>
                    <span className="font-semibold dark:text-white">{routeInfo.distance} km</span>
                  </div>
                  <div className="flex justify-between mb-3 border-b border-gray-200 dark:border-gray-600 pb-3">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Est. Time</span>
                    <span className="font-semibold dark:text-white">{routeInfo.duration} min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 dark:text-gray-200 font-bold">Total Fare</span>
                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400">${fare}</span>
                  </div>
                </div>
              )}

              {bookingStatus && (
                <div className={`p-3 rounded-lg text-sm font-medium ${bookingStatus.includes('Failed') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                  {bookingStatus}
                </div>
              )}

              <button 
                onClick={requestRide}
                disabled={!routeInfo || loading}
                className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
                  !routeInfo || loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5'
                }`}
              >
                {loading ? 'Processing...' : routeInfo ? 'Confirm Ride' : 'Select Route First'}
              </button>
            </div>
          )}

          {user?.role === 'rider' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-2">Current Status</p>
                <div className={`text-center font-bold text-xl ${isOnline ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </div>
              </div>
              <button 
                onClick={toggleRiderStatus}
                className={`w-full text-white py-3 rounded-xl font-bold transition shadow-lg ${
                  isOnline 
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' 
                    : 'bg-green-500 hover:bg-green-600 shadow-green-500/30'
                }`}
              >
                {isOnline ? 'Go Offline' : 'Go Online to Receive Rides'}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 w-full relative z-0">
          <RideMap 
            onLocationsUpdate={handleLocationsUpdate} 
            onRouteCalculated={handleRouteCalculated}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

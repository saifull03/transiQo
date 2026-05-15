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
  const [activeRide, setActiveRide] = useState(null);

  // User specific state for post-ride
  const [paymentWaiting, setPaymentWaiting] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [completedRideId, setCompletedRideId] = useState(null);
  
  // Timer specific state
  const [rideStartTime, setRideStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('00:00');
  
  // Participant Info State
  const [riderInfo, setRiderInfo] = useState(null);

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

      // Listen for a ride being taken by another rider
      newSocket.on('removeRideRequest', (data) => {
        setIncomingRequest(prev => {
          if (prev && prev._id === data.rideId) return null;
          return prev;
        });
      });

      // Listen for accepted ride (User only)
      newSocket.on('rideAccepted', (data) => {
        if (user.role === 'user') {
          setBookingStatus('A driver is on the way!');
          setRiderInfo(data.riderInfo);
        }
      });

      // Listen for started ride (User only)
      newSocket.on('rideStarted', (data) => {
        if (user.role === 'user') {
          setBookingStatus('Ride is in progress...');
          setRideStartTime(data.startedAt);
        }
      });

      // Listen for completed ride (User only)
      newSocket.on('rideCompleted', (data) => {
        if (user.role === 'user') {
          setBookingStatus('');
          setPaymentWaiting(true);
          setFare(data.fare);
          setRideStartTime(null); // stop the timer
        }
      });

      // Listen for payment confirmation (User only)
      newSocket.on('paymentConfirmed', (data) => {
        if (user.role === 'user') {
          setBookingStatus('');
          setPaymentWaiting(false);
          setShowReview(true);
          setCompletedRideId(data.rideId);
        }
      });

      return () => newSocket.disconnect();
    }
  }, [user, isOnline]);

  useEffect(() => {
    let interval;
    if (rideStartTime) {
      interval = setInterval(() => {
        const start = new Date(rideStartTime).getTime();
        const now = Date.now();
        const diff = Math.floor((now - start) / 1000);
        
        const minutes = Math.floor(diff / 60).toString().padStart(2, '0');
        const seconds = (diff % 60).toString().padStart(2, '0');
        setElapsedTime(`${minutes}:${seconds}`);
      }, 1000);
    } else {
      setElapsedTime('00:00');
    }
    return () => clearInterval(interval);
  }, [rideStartTime]);

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
      
      const rideDataWithUser = {
        ...data,
        userInfo: { name: user.name, phone: user.phone || 'N/A' }
      };

      setBookingStatus('Ride requested successfully! Waiting for a driver...');
      
      if (socket) {
        socket.emit('rideRequest', rideDataWithUser);
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
          riderId: user._id,
          riderInfo: { name: user.name, phone: user.phone || 'N/A', vehicle: user.vehicle || { make: 'Toyota', model: 'Corolla', licensePlate: 'DHK-123' } }
        });
      }
      
      setIncomingRequest(null);
      setActiveRide({ ...incomingRequest, status: 'accepted' });
      alert('Ride Accepted! Navigate to the pickup location.');
    } catch (error) {
      console.error("Failed to accept ride", error);
      alert('Failed to accept ride. Another rider may have accepted it.');
      setIncomingRequest(null);
    }
  };

  const startRide = async () => {
    if (!activeRide) return;
    try {
      const token = localStorage.getItem('rideX_user') ? JSON.parse(localStorage.getItem('rideX_user')).token : '';
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const { data } = await axios.put(`http://localhost:5003/api/rides/${activeRide._id}/status`, { status: 'started' }, config);
      setActiveRide({ ...activeRide, status: 'started', startedAt: data.startedAt });
      setRideStartTime(data.startedAt); // start rider timer

      if (socket) {
        socket.emit('rideStarted', { 
          rideId: activeRide._id, 
          userId: activeRide.user,
          startedAt: data.startedAt
        });
      }
      alert('Ride started!');
    } catch (error) {
      console.error("Failed to start ride", error);
      alert('Error starting ride.');
    }
  };

  const finishRide = async () => {
    if (!activeRide) return;
    try {
      const token = localStorage.getItem('rideX_user') ? JSON.parse(localStorage.getItem('rideX_user')).token : '';
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(`http://localhost:5003/api/rides/${activeRide._id}/status`, { status: 'completed' }, config);
      setActiveRide({ ...activeRide, status: 'completed' });
      setRideStartTime(null); // stop the rider timer
      
      if (socket) {
        socket.emit('rideCompleted', { 
          rideId: activeRide._id, 
          userId: activeRide.user,
          fare: activeRide.fare
        });
      }
      alert('Ride marked as completed. Please collect payment.');
    } catch (error) {
      console.error("Failed to finish ride", error);
      alert('Error finishing ride.');
    }
  };

  const confirmPayment = async () => {
    if (!activeRide) return;
    try {
      const token = localStorage.getItem('rideX_user') ? JSON.parse(localStorage.getItem('rideX_user')).token : '';
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(`http://localhost:5003/api/rides/${activeRide._id}/payment`, {}, config);
      
      if (socket) {
        socket.emit('paymentConfirmed', { 
          rideId: activeRide._id, 
          userId: activeRide.user 
        });
      }
      alert('Payment confirmed! Ride is fully completed.');
      setActiveRide(null); // Reset dashboard
    } catch (error) {
      console.error("Failed to confirm payment", error);
      alert('Error confirming payment.');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!completedRideId) return;

    try {
      const token = localStorage.getItem('rideX_user') ? JSON.parse(localStorage.getItem('rideX_user')).token : '';
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post('http://localhost:5003/api/reviews', {
        rideId: completedRideId,
        rating: reviewData.rating,
        comment: reviewData.comment,
        reviewBy: user.role
      }, config);
      
      alert('Review submitted successfully!');
      setShowReview(false);
      setCompletedRideId(null);
      setPickup(null);
      setDestination(null);
      setRouteInfo(null);
      setFare(null);
      setBookingStatus('');
      setRiderInfo(null);
    } catch (error) {
      console.error("Failed to submit review", error);
      alert('Error submitting review.');
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
                <span className="text-2xl font-black text-green-500">৳{incomingRequest.fare}</span>
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

      {/* Review Modal */}
      {showReview && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden max-w-sm w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Rate Your Trip</h2>
            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rating (1-5)</label>
                <input 
                  type="number" 
                  min="1" max="5" 
                  value={reviewData.rating}
                  onChange={(e) => setReviewData({...reviewData, rating: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comment</label>
                <textarea 
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({...reviewData, comment: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows="3"
                  placeholder="How was your ride?"
                ></textarea>
              </div>
              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition shadow-lg"
              >
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}

      {/* User Payment Waiting UI */}
      {paymentWaiting && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden max-w-sm w-full p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ride Completed!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Please pay the driver</p>
            <div className="text-5xl font-black text-green-500 mb-8">৳{fare}</div>
            <div className="inline-flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 animate-pulse">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>Waiting for driver to confirm cash...</span>
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

              {/* User Timer Display */}
              {rideStartTime && (
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-200 dark:border-blue-800 text-center shadow-inner mt-4 mb-4">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider mb-1">Ride Timer</p>
                  <div className="text-4xl font-black text-blue-700 dark:text-blue-300 font-mono tracking-widest">{elapsedTime}</div>
                </div>
              )}

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
                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400">৳{fare}</span>
                  </div>
                </div>
              )}

              {bookingStatus && (
                <div className={`p-3 rounded-lg text-sm font-medium ${bookingStatus.includes('Failed') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                  {bookingStatus}
                </div>
              )}

              {riderInfo && bookingStatus && !bookingStatus.includes('Failed') && (
                <div className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 border-b border-gray-100 dark:border-gray-600 pb-1">Driver Information</h4>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden flex items-center justify-center text-gray-500 dark:text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{riderInfo.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{riderInfo.phone}</p>
                    </div>
                  </div>
                  {riderInfo.vehicle && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vehicle</p>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{riderInfo.vehicle.make} {riderInfo.vehicle.model}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 px-2 py-1 rounded inline-block mt-1 font-mono uppercase bg-white dark:bg-gray-700">{riderInfo.vehicle.licensePlate}</p>
                    </div>
                  )}
                </div>
              )}

              {(!bookingStatus || bookingStatus.includes('Failed')) && (
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
              )}
            </div>
          )}

          {user?.role === 'rider' && !activeRide && (
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

          {user?.role === 'rider' && activeRide && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-2">Active Ride</p>
                
                {activeRide.userInfo && (
                  <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Passenger</h4>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white leading-tight">{activeRide.userInfo.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{activeRide.userInfo.phone}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Rider Timer Display */}
                {activeRide.status === 'started' && (
                  <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-3 text-center mb-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-widest mb-1">Elapsed Time</p>
                    <div className="text-3xl font-black text-blue-700 dark:text-blue-300 font-mono tracking-widest">{elapsedTime}</div>
                  </div>
                )}
                
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-600 pb-2 mb-2">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Fare</span>
                  <span className="font-bold text-green-500">৳{activeRide.fare}</span>
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-200">
                  <p><strong>Status:</strong> {activeRide.status}</p>
                </div>
              </div>
              
              {activeRide.status === 'accepted' ? (
                <button 
                  onClick={startRide}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition shadow-lg"
                >
                  Start Ride
                </button>
              ) : activeRide.status === 'started' ? (
                <button 
                  onClick={finishRide}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition shadow-lg"
                >
                  Finish Ride
                </button>
              ) : (
                <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-xl border border-green-200 dark:border-green-800 text-center space-y-4">
                  <h4 className="font-bold text-green-800 dark:text-green-400">Collect Cash</h4>
                  <div className="text-4xl font-black text-green-600 dark:text-green-400">৳{activeRide.fare}</div>
                  <button 
                    onClick={confirmPayment}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold transition shadow-lg"
                  >
                    Confirm Cash Received
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 w-full relative z-0">
          <RideMap 
            onLocationsUpdate={handleLocationsUpdate} 
            onRouteCalculated={handleRouteCalculated}
            initialPickup={activeRide?.pickupLocation}
            initialDestination={activeRide?.dropoffLocation}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const History = () => {
  const { user } = useContext(AuthContext);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('rideX_user') ? JSON.parse(localStorage.getItem('rideX_user')).token : '';
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const { data } = await axios.get('http://localhost:5003/api/rides/history', config);
        setRides(data);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchHistory();
    }
  }, [user]);

  if (loading) {
    return <div className="flex-1 flex justify-center items-center"><p>Loading history...</p></div>;
  }

  return (
    <div className="flex-1 bg-gray-100 dark:bg-gray-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Ride History</h1>
        
        {rides.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-md">
            <p className="text-gray-500 dark:text-gray-400">No past rides found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rides.map(ride => (
              <div key={ride._id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span>
                    <span>{ride.pickupLocation?.address || `${ride.pickupLocation.lat.toFixed(4)}, ${ride.pickupLocation.lng.toFixed(4)}`}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="w-3 h-3 bg-red-500 rounded-full inline-block"></span>
                    <span>{ride.dropoffLocation?.address || `${ride.dropoffLocation.lat.toFixed(4)}, ${ride.dropoffLocation.lng.toFixed(4)}`}</span>
                  </div>
                  <div className="text-xs text-gray-400 pt-2">
                    {new Date(ride.createdAt).toLocaleString()}
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 flex flex-col items-end justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    ride.status === 'completed' ? 'bg-green-100 text-green-700' :
                    ride.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {ride.status}
                  </span>
                  <div className="text-right mt-2">
                    <div className="text-2xl font-black text-gray-800 dark:text-white">৳{ride.fare}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{ride.distance} km</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;

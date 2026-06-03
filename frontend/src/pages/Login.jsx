import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [type, setType] = useState('user'); // 'user', 'rider', or 'admin'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [pendingRider, setPendingRider] = useState(location.state?.pendingRider || null);
  const [socketNotification, setSocketNotification] = useState(
    location.state?.pendingRider 
      ? { status: "pending", message: "Your registration is under review by transiQo. We will update you in real-time." } 
      : null
  );

  useEffect(() => {
    if (!pendingRider) return;

    const s = io("http://localhost:5003");
    s.on("connect", () => {
      s.emit("join", pendingRider.id);
      console.log("Connected to socket as pending rider:", pendingRider.id);
    });

    s.on("registrationStatus", (d) => {
      setSocketNotification(d);
      if (d.status === "approved") {
        alert("🎉 Congratulations! Your registration has been approved by transiQo. You can now log in.");
        setPendingRider(null);
      } else if (d.status === "pending") {
        alert(`⚠️ Warning: ${d.message}`);
      }
    });

    return () => s.disconnect();
  }, [pendingRider]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loginType = type === 'admin' ? 'user' : type;
      const { data } = await axios.post('http://localhost:5003/api/auth/login', {
        email,
        password,
        type: loginType,
      });

      if (type === 'admin' && data.role !== 'admin') {
        setError('Access denied. You do not have administrator privileges.');
        setLoading(false);
        return;
      }

      login(data);
      if (data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      if (err.response?.status === 403 && err.response?.data?.riderId) {
        setPendingRider({ id: err.response.data.riderId, name: email });
        setSocketNotification({
          status: "pending",
          message: "Your registration is under review by transiQo. Listening for updates..."
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {socketNotification && (
            <div className={`p-4 rounded-xl text-sm font-semibold border flex flex-col gap-1 text-center ${
              socketNotification.status === 'approved' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 animate-pulse'
            }`}>
              <p className="font-extrabold uppercase text-xs">
                {socketNotification.status === 'approved' ? 'Approval Status: Approved' : 'Approval Status: Pending Review'}
              </p>
              <p>{socketNotification.message}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="flex justify-center space-x-4 mb-6">
            <button
              type="button"
              onClick={() => setType('user')}
              className={`px-4 py-2 rounded-full font-medium transition ${
                type === 'user' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              Passenger
            </button>
            <button
              type="button"
              onClick={() => setType('rider')}
              className={`px-4 py-2 rounded-full font-medium transition ${
                type === 'rider' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              Driver
            </button>
            <button
              type="button"
              onClick={() => setType('admin')}
              className={`px-4 py-2 rounded-full font-medium transition ${
                type === 'admin' 
                  ? 'bg-red-600 text-white shadow-md' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              Admin
            </button>
          </div>

          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label className="sr-only">Email address</label>
              <input
                type="email"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="sr-only">Password</label>
              <input
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition shadow-lg shadow-blue-500/40 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        
        <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
          Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

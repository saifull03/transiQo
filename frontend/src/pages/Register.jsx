import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehiclePlate: ''
  });
  const [type, setType] = useState('user'); // 'user' or 'rider'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      };

      if (type === 'rider') {
        payload.vehicle = {
          make: formData.vehicleMake,
          model: formData.vehicleModel,
          year: formData.vehicleYear,
          licensePlate: formData.vehiclePlate,
        };
      }

      const endpoint = type === 'rider' ? '/api/auth/register/rider' : '/api/auth/register/user';
      const { data } = await axios.post(`http://localhost:5003${endpoint}`, payload);

      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create an account
          </h2>
        </div>
        
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
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <input
              name="name"
              type="text"
              required
              className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
            />
            <input
              name="email"
              type="email"
              required
              className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
            />
            <input
              name="phone"
              type="text"
              required
              className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
            />
            <input
              name="password"
              type="password"
              required
              className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
            
            {type === 'rider' && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Vehicle Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    name="vehicleMake"
                    type="text"
                    required
                    className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    placeholder="Make (e.g. Toyota)"
                    value={formData.vehicleMake}
                    onChange={handleChange}
                  />
                  <input
                    name="vehicleModel"
                    type="text"
                    required
                    className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    placeholder="Model (e.g. Prius)"
                    value={formData.vehicleModel}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    name="vehicleYear"
                    type="text"
                    required
                    className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    placeholder="Year"
                    value={formData.vehicleYear}
                    onChange={handleChange}
                  />
                  <input
                    name="vehiclePlate"
                    type="text"
                    required
                    className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    placeholder="License Plate"
                    value={formData.vehiclePlate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition shadow-lg shadow-blue-500/40 disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
        
        <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign in here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

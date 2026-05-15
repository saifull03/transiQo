import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md p-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400 tracking-tighter">
          Ride<span className="text-gray-900 dark:text-white">X</span>
        </Link>
        
        <div className="flex space-x-4 items-center">
          {user ? (
            <>
              <span className="text-gray-600 dark:text-gray-300 font-medium mr-4">
                Hello, {user.name} ({user.role})
              </span>
              <Link to="/dashboard" className="text-gray-800 dark:text-gray-200 hover:text-blue-600 transition">
                Dashboard
              </Link>
              <button 
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-800 dark:text-gray-200 hover:text-blue-600 font-medium transition">
                Login
              </Link>
              <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-md shadow-blue-500/30">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

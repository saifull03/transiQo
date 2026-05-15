import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 text-center px-4">
      <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-6 tracking-tight">
        Go Anywhere with RideX
      </h1>
      <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mb-10">
        The most reliable, fast, and modern ride-sharing platform. Request a ride, hop in, and go.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          to="/register" 
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-xl shadow-blue-500/30"
        >
          Get Started
        </Link>
        <Link 
          to="/login" 
          className="px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-gray-600 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-xl"
        >
          Login
        </Link>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full px-4 text-left">
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Always on time</h3>
          <p className="text-gray-600 dark:text-gray-400">Reliable drivers ready to pick you up in minutes.</p>
        </div>
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Safe & Secure</h3>
          <p className="text-gray-600 dark:text-gray-400">Verified drivers and live ride tracking for your safety.</p>
        </div>
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Clear Pricing</h3>
          <p className="text-gray-600 dark:text-gray-400">No hidden fees. See the estimated fare before you book.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;

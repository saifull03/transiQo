import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-center px-4 relative overflow-hidden">
      {/* Hero background image/illustration */}
      <img
        src="/assets/hero-ride.svg"
        alt="RideX Hero"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl opacity-20 pointer-events-none select-none z-0"
        style={{ objectFit: "cover" }}
      />

      {/* Animated headline */}
      <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-6 tracking-tight animate-fade-in-up z-10">
        Go Anywhere with RideX
      </h1>
      <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mb-10 animate-fade-in z-10">
        The most reliable, fast, and modern ride-sharing platform. Request a
        ride, hop in, and go.
      </p>

      {/* CTA buttons with icon */}
      <div className="flex flex-col sm:flex-row gap-4 animate-fade-in z-10">
        <Link
          to="/register"
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-xl shadow-blue-500/30 flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 12h14M12 5l7 7-7 7"
            />
          </svg>
          Get Started
        </Link>
        <Link
          to="/login"
          className="px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-gray-600 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-xl flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z"
            />
          </svg>
          Login
        </Link>
      </div>

      {/* Features section with animation */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full px-4 text-left animate-fade-in-up z-10">
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 hover:scale-105 transition-transform">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Always on time
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Reliable drivers ready to pick you up in minutes.
          </p>
        </div>
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 hover:scale-105 transition-transform">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              ></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Safe & Secure
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Verified drivers and live ride tracking for your safety.
          </p>
        </div>
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 hover:scale-105 transition-transform">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Clear Pricing
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No hidden fees. See the estimated fare before you book.
          </p>
        </div>
      </div>



      {/* Testimonials section */}
      <div className="mt-24 max-w-5xl w-full mx-auto animate-fade-in-up z-10 px-4">
        {/* Section heading */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">
            <span style={{fontSize:'14px'}}>★★★★★</span>
            <span>5-Star Rated</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-3">
            Riders{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">love</span>{" "}
            RideX
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">
            Join thousands of happy commuters who trust RideX every day.
          </p>
        </div>

        {/* Review cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            {
              name: "Ayesha K.",
              initials: "AK",
              color: "from-pink-500 to-rose-600",
              role: "Daily Commuter",
              rating: 5,
              text: "RideX is always on time and the drivers are super friendly. I feel safe every single ride!",
            },
            {
              name: "Rahim U.",
              initials: "RU",
              color: "from-blue-500 to-indigo-600",
              role: "Tech Professional",
              rating: 5,
              text: "Transparent pricing and the smoothest app experience I've ever had. Absolutely love it!",
            },
            {
              name: "Nadia S.",
              initials: "NS",
              color: "from-violet-500 to-purple-600",
              role: "University Student",
              rating: 5,
              text: "Affordable, reliable, and the live tracking gives me so much peace of mind. Best ride app!",
            },
          ].map((r, i) => (
            <div
              key={i}
              className="relative group bg-gray-900/80 dark:bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300"
            >
              {/* Glow on hover */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              {/* Giant quote mark */}
              <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-500/40 to-indigo-500/40 leading-none select-none mb-2" aria-hidden="true">&ldquo;</div>

              {/* Stars */}
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: r.rating }).map((_, s) => (
                  <svg key={s} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Review text */}
              <p className="text-gray-300 text-sm leading-relaxed mb-6">{r.text}</p>

              {/* Reviewer */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${r.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg`}>
                  {r.initials}
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold text-sm">{r.name}</p>
                  <p className="text-gray-500 text-xs">{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust bar */}
        <div className="flex flex-wrap justify-center items-center gap-8 py-6 border-t border-b border-white/10">
          {[
            { value: "10K+", label: "Happy Riders" },
            { value: "4.9", label: "Avg. Rating", star: true },
            { value: "500+", label: "Verified Drivers" },
            { value: "99%", label: "On-Time Rate" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                {stat.value}{stat.star && <span className="text-yellow-400 text-xl ml-1">★</span>}
              </p>
              <p className="text-gray-500 text-xs uppercase tracking-wider mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Subtle animated background shapes */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-blue-300/30 to-indigo-300/10 rounded-full blur-3xl z-0 animate-pulse-slow"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-tr from-purple-300/30 to-indigo-300/10 rounded-full blur-3xl z-0 animate-pulse-slow"></div>
    </div>
  );
};

export default Home;

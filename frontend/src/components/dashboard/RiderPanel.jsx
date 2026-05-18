import { useState, useEffect } from "react";
import axios from "axios";
import RideMap from "../Map/RideMap";

const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%233b82f6%22%2F%3E%3Cpath%20d%3D%22M50%2055c-11%200-30%206-30%2018v7h60v-7c0-12-19-18-30-18zm0-10c8.28%200%2015-6.72%2015-15S58.28%2015%2050%2015%2035%2021.72%2035%2030s6.72%2015%2015%2015z%22%20fill%3D%22%23ffffff%22%2F%3E%3C%2Fsvg%3E";

const StarRow = ({ rating, size = "w-4 h-4" }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <svg
        key={s}
        className={`${size} ${s <= rating ? "text-yellow-400" : "text-gray-600"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

const RiderPanel = ({
  isOnline,
  activeRide,
  elapsedTime,
  rideStartTime,
  onToggleStatus,
  onStartRide,
  onFinishRide,
  onConfirmPayment,
  authHeaders,
  initialTab = "ride",
}) => {
  const [tab, setTab] = useState(initialTab); // 'ride' | 'reviews'
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    if (tab === "reviews") {
      setReviewsLoading(true);
      axios
        .get("http://localhost:5003/api/reviews/my", authHeaders())
        .then(({ data }) => setReviews(data))
        .catch(() => setReviews([]))
        .finally(() => setReviewsLoading(false));
    }
  }, [tab]);

  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Sub-tabs */}
      <div className="flex gap-2 flex-shrink-0">
        {[
          { id: "ride", label: "🚗 Ride Control" },
          { id: "reviews", label: "⭐ My Reviews" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === t.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "bg-gray-800/60 text-gray-400 hover:text-white hover:bg-white/5 border border-white/10"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── RIDE CONTROL TAB ── */}
      {tab === "ride" && (
        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
          {/* Left controls */}
          <div className="lg:w-80 space-y-4 flex-shrink-0">
            {/* Status toggle */}
            {!activeRide && (
              <div className="bg-gray-800/60 border border-white/10 rounded-2xl p-5 text-center space-y-4">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${isOnline ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-gray-700/50 text-gray-400 border border-gray-600/30"}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-400 animate-pulse" : "bg-gray-500"}`}
                  />
                  {isOnline ? "ONLINE" : "OFFLINE"}
                </div>
                <p className="text-gray-400 text-sm">
                  {isOnline
                    ? "You're visible to passengers. Waiting for requests..."
                    : "Go online to start receiving ride requests."}
                </p>
                <button
                  onClick={onToggleStatus}
                  className={`w-full py-4 rounded-2xl font-black text-white text-lg shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0 ${isOnline ? "bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/30 hover:from-red-400 hover:to-rose-500" : "bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/30 hover:from-green-400 hover:to-emerald-500"}`}
                >
                  {isOnline ? "Go Offline" : "Go Online 🟢"}
                </button>
              </div>
            )}

            {/* Active ride controls */}
            {activeRide && (
              <div className="space-y-4">
                {/* Passenger info */}
                {activeRide.userInfo && (
                  <div className="bg-gray-800/60 border border-white/10 rounded-2xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">
                      👤 Passenger
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden border border-white/20 flex-shrink-0 shadow-md">
                          <img
                            src={activeRide.userInfo.profilePicture || DEFAULT_AVATAR}
                            alt={activeRide.userInfo.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                          />
                        </div>
                        <div>
                          <p className="text-white font-bold">
                            {activeRide.userInfo.name}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {activeRide.userInfo.phone}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`tel:${activeRide.userInfo.phone}`}
                        className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-400 text-white flex items-center justify-center transition shadow-lg shadow-green-500/30"
                      >
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
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                )}

                {/* Ride info */}
                <div className="bg-gradient-to-br from-blue-600/20 to-indigo-700/20 border border-blue-500/20 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm">Status</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase">
                      {activeRide.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Fare</span>
                    <span className="text-2xl font-black text-green-400">
                      ৳{activeRide.fare}
                    </span>
                  </div>
                  {activeRide.status === "started" && rideStartTime && (
                    <div className="mt-3 pt-3 border-t border-white/10 text-center">
                      <p className="text-xs text-indigo-400 uppercase tracking-widest mb-1">
                        Elapsed Time
                      </p>
                      <div className="text-3xl font-black text-white font-mono">
                        {elapsedTime}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                {activeRide.status === "accepted" && (
                  <button
                    onClick={onStartRide}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-lg shadow-xl shadow-indigo-500/30 transition hover:-translate-y-0.5"
                  >
                    ▶ Start Ride
                  </button>
                )}
                {activeRide.status === "started" && (
                  <button
                    onClick={onFinishRide}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-lg shadow-xl shadow-blue-500/30 transition hover:-translate-y-0.5"
                  >
                    🏁 Finish Ride
                  </button>
                )}
                {activeRide.status === "completed" && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 text-center space-y-3">
                    <p className="text-green-400 font-bold">
                      Collect Cash Payment
                    </p>
                    <div className="text-4xl font-black text-white">
                      ৳{activeRide.fare}
                    </div>
                    <button
                      onClick={onConfirmPayment}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold shadow-lg shadow-green-500/30 transition"
                    >
                      ✓ Confirm Cash Received
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Map */}
          <div className="flex-1 min-h-[400px] lg:min-h-0 rounded-2xl overflow-hidden border border-white/10">
            <RideMap
              initialPickup={activeRide?.pickupLocation}
              initialDestination={activeRide?.dropoffLocation}
            />
          </div>
        </div>
      )}

      {/* ── REVIEWS TAB ── */}
      {tab === "reviews" && (
        <div className="flex-1 overflow-auto">
          {reviewsLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="text-5xl mb-4">⭐</div>
              <p className="text-white font-bold text-lg">No reviews yet</p>
              <p className="text-gray-500 text-sm mt-1">
                Complete rides to start receiving reviews from passengers.
              </p>
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div className="flex items-center gap-6 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-2xl p-4 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-4xl font-black text-white">
                      {avgRating}
                    </p>
                    <span className="text-sm text-gray-400">/ 5</span>
                  </div>
                  <StarRow
                    rating={Math.round(parseFloat(avgRating) || 0)}
                    size="w-5 h-5"
                  />
                  <p className="text-gray-500 text-xs mt-1">Avg Rating</p>
                </div>
                <div className="h-14 w-px bg-white/10" />
                <div>
                  <p className="text-2xl font-black text-white">
                    {reviews.length}
                  </p>
                  <p className="text-gray-500 text-xs">Total Reviews</p>
                </div>
                {/* Rating breakdown */}
                <div className="flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviews.filter(
                      (r) => r.rating === star,
                    ).length;
                    const pct = reviews.length
                      ? (count / reviews.length) * 100
                      : 0;
                    return (
                      <div
                        key={star}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="text-gray-500 w-2">{star}</span>
                        <svg
                          className="w-3 h-3 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-yellow-400 h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-gray-600 w-4">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((r) => (
                  <div
                    key={r._id}
                    className="relative group bg-gray-800/60 border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition-all"
                  >
                    {/* Quote mark */}
                    <div className="text-5xl font-black text-blue-500/20 leading-none select-none absolute top-3 right-4">
                      &ldquo;
                    </div>

                    {/* Stars + date */}
                    <div className="flex items-center justify-between mb-3 gap-3">
                      <div className="flex items-center gap-2">
                        <StarRow rating={r.rating} />
                        <span className="text-sm text-gray-300 font-semibold">
                          {r.rating}/5
                        </span>
                      </div>
                      <span className="text-gray-600 text-xs">
                        {new Date(r.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Comment */}
                    <p className="text-gray-300 text-sm leading-relaxed mb-2 min-h-[40px]">
                      {r.comment || (
                        <span className="italic text-gray-600">
                          No comment left.
                        </span>
                      )}
                    </p>

                    {r.user?.name && (
                      <p className="text-xs text-gray-400 mb-3">
                        Reviewed by{" "}
                        <span className="text-white">{r.user.name}</span>
                      </p>
                    )}

                    {/* Ride info */}
                    {r.ride && (
                      <div className="bg-gray-900/50 rounded-xl p-3 text-xs text-gray-500 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                          <span className="truncate">
                            {r.ride.pickupLocation?.address || "Pickup"}
                          </span>
                        </div>
                        <svg
                          className="w-3 h-3 text-gray-700 mx-2 flex-shrink-0"
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
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                          <span className="truncate">
                            {r.ride.dropoffLocation?.address || "Dropoff"}
                          </span>
                        </div>
                        <span className="ml-3 text-green-400 font-bold flex-shrink-0">
                          ৳{r.ride.fare}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RiderPanel;

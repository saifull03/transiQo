import RideMap from "../Map/RideMap";

const UserPanel = ({
  pickup,
  destination,
  routeInfo,
  fare,
  bookingStatus,
  loading,
  rideStartTime,
  elapsedTime,
  riderInfo,
  onLocationsUpdate,
  onRouteCalculated,
  onRequestRide,
}) => {
  const rideActive = bookingStatus && !bookingStatus.includes("Failed");

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Left control panel */}
      <div className="lg:w-80 space-y-4 flex-shrink-0">
        {/* Location info */}
        <div className="bg-gray-800/60 border border-white/10 rounded-2xl p-4 space-y-3">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">
            Route
          </h3>
          <div className="flex items-start gap-3">
            <div className="mt-1 w-3 h-3 rounded-full bg-green-400 flex-shrink-0 shadow-lg shadow-green-400/50" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Pickup
              </p>
              <p className="text-gray-200 text-sm mt-0.5">
                {pickup
                  ? pickup.address ||
                    `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`
                  : "Select on map"}
              </p>
            </div>
          </div>
          <div className="ml-1.5 border-l-2 border-dashed border-gray-700 h-4" />
          <div className="flex items-start gap-3">
            <div className="mt-1 w-3 h-3 rounded-full bg-red-400 flex-shrink-0 shadow-lg shadow-red-400/50" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Dropoff
              </p>
              <p className="text-gray-200 text-sm mt-0.5">
                {destination
                  ? destination.address ||
                    `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`
                  : "Select on map"}
              </p>
            </div>
          </div>
        </div>

        {/* Fare card */}
        {routeInfo && fare && (
          <div className="bg-gradient-to-br from-blue-600/20 to-indigo-700/20 border border-blue-500/20 rounded-2xl p-4">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Distance</span>
              <span className="text-white font-semibold">
                {routeInfo.distance} km
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-400 mb-3 pb-3 border-b border-white/10">
              <span>Est. Time</span>
              <span className="text-white font-semibold">
                {routeInfo.duration} min
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-semibold">Total Fare</span>
              <span className="text-3xl font-black text-blue-400">৳{fare}</span>
            </div>
          </div>
        )}

        {/* Ride timer */}
        {rideStartTime && (
          <div className="bg-gradient-to-br from-indigo-600/20 to-purple-700/20 border border-indigo-500/20 rounded-2xl p-4 text-center">
            <p className="text-indigo-400 text-xs uppercase tracking-widest font-semibold mb-1">
              Ride Timer
            </p>
            <div className="text-4xl font-black text-white font-mono tracking-widest">
              {elapsedTime}
            </div>
          </div>
        )}

        {/* Status */}
        {bookingStatus && (
          <div
            className={`p-4 rounded-2xl text-sm font-medium border ${bookingStatus.includes("Failed") ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-green-500/10 text-green-400 border-green-500/20"}`}
          >
            <div className="flex items-center gap-2">
              {!bookingStatus.includes("Failed") && (
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              )}
              {bookingStatus}
            </div>
          </div>
        )}

        {/* Rider info */}
        {riderInfo && rideActive && (
          <div className="bg-gray-800/60 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">
              🚗 Your Driver
            </p>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold overflow-hidden border border-white/20 flex-shrink-0 shadow-md">
                  {riderInfo.profilePicture ? (
                    <img src={riderInfo.profilePicture} alt={riderInfo.name} className="w-full h-full object-cover" />
                  ) : (
                    riderInfo.name?.[0]?.toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-white font-bold leading-tight">
                    {riderInfo.name}
                  </p>
                  <p className="text-gray-400 text-xs">{riderInfo.phone}</p>
                  {/* Star rating */}
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <svg
                          key={s}
                          className={`w-3 h-3 ${s <= Math.round(Number(riderInfo.rating ?? 5)) ? "text-yellow-400" : "text-gray-600"}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-yellow-400 text-xs font-bold">
                      {Number(riderInfo.rating ?? 5).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
              <a
                href={`tel:${riderInfo.phone}`}
                className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-400 text-white flex items-center justify-center shadow-lg shadow-green-500/30 transition"
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
            {riderInfo.vehicle && (
              <div className="bg-gray-900/50 rounded-xl p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Vehicle
                </p>
                <p className="text-gray-200 font-semibold mt-0.5">
                  {riderInfo.vehicle.make} {riderInfo.vehicle.model}
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-white/5 border border-white/10 rounded text-xs font-mono text-gray-300">
                  {riderInfo.vehicle.licensePlate}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Book button */}
        {(!bookingStatus || bookingStatus.includes("Failed")) && (
          <button
            onClick={onRequestRide}
            disabled={!routeInfo || loading}
            className={`w-full py-4 rounded-2xl font-black text-white text-lg shadow-xl transition-all ${!routeInfo || loading ? "bg-gray-700 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0"}`}
          >
            {loading
              ? "Processing..."
              : routeInfo
                ? "🚀 Confirm Ride"
                : "Select Route on Map"}
          </button>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 min-h-[400px] lg:min-h-0 rounded-2xl overflow-hidden border border-white/10">
        <RideMap
          initialPickup={pickup}
          initialDestination={destination}
          onLocationsUpdate={onLocationsUpdate}
          onRouteCalculated={onRouteCalculated}
        />
      </div>
    </div>
  );
};
export default UserPanel;

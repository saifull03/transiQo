import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({ iconUrl, iconRetinaUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], tooltipAnchor: [16, -28], shadowSize: [41, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const pickupIcon = new L.Icon({ ...DefaultIcon.options, iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png', iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png' });
const dropoffIcon = new L.Icon({ ...DefaultIcon.options, iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png', iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png' });

// ── FlyTo helper (defined outside to avoid remounts) ──────────────────────────
const FlyToLocation = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo([coords.lat, coords.lng], 15, { duration: 1.2 });
  }, [coords, map]);
  return null;
};

// ── SearchInput (defined OUTSIDE RideMap to prevent remount on every keystroke) ──
const SearchInput = ({
  type, query, results, placeholder,
  activeSearch, gpsLoading,
  onInput, onFocus, onClear, onSelectPlace, onUseLocation,
  inputRef,
}) => (
  <div className="relative">
    <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all">
      {/* Colored dot */}
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${type === 'pickup' ? 'bg-green-500' : 'bg-red-500'}`} />

      {/* Text input — focus is maintained because this component never remounts */}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onInput(type, e.target.value)}
        onFocus={() => onFocus(type)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none min-w-0"
      />

      {/* GPS button */}
      <button
        onMouseDown={(e) => e.preventDefault()} // prevent blur on click
        onClick={() => onUseLocation(type)}
        title="Use my current location"
        disabled={gpsLoading === type}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-500 transition-colors disabled:opacity-50"
      >
        {gpsLoading === type ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <circle cx="12" cy="12" r="3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
            <circle cx="12" cy="12" r="9" strokeDasharray="4 2" />
          </svg>
        )}
      </button>

      {/* Clear button */}
      {query.length > 0 && (
        <button
          onMouseDown={(e) => e.preventDefault()} // prevent blur on click
          onClick={() => onClear(type)}
          className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>

    {/* Dropdown results */}
    {activeSearch === type && results.length > 0 && (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-[9999] overflow-hidden max-h-60 overflow-y-auto">
        {/* "Use my location" shortcut at top */}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onUseLocation(type)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-gray-100 dark:border-gray-800 transition-colors text-left"
        >
          <span className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <circle cx="12" cy="12" r="3" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Use my current location</p>
            <p className="text-xs text-gray-400">GPS location</p>
          </div>
        </button>

        {/* Search results */}
        {results.map((place, i) => (
          <button
            key={i}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSelectPlace(type, place)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left border-b border-gray-50 dark:border-gray-800/50 last:border-0"
          >
            <span className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {place.display_name.split(',')[0]}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {place.display_name.split(',').slice(1, 3).join(',')}
              </p>
            </div>
          </button>
        ))}
      </div>
    )}
  </div>
);

// ── Main RideMap component ────────────────────────────────────────────────────
const RideMap = ({ onLocationsUpdate, onRouteCalculated, initialPickup, initialDestination, hideSearch = false }) => {
  const [pickup, setPickup] = useState(initialPickup || null);
  const [destination, setDestination] = useState(initialDestination || null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [mapStyle, setMapStyle] = useState('osm');

  const [pickupQuery, setPickupQuery] = useState('');
  const [dropoffQuery, setDropoffQuery] = useState('');
  const [pickupResults, setPickupResults] = useState([]);
  const [dropoffResults, setDropoffResults] = useState([]);
  const [activeSearch, setActiveSearch] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(null);
  const [flyTo, setFlyTo] = useState(null);

  const pickupRef = useRef(null);
  const dropoffRef = useRef(null);
  const debounceRef = useRef(null);

  // Sync with props
  useEffect(() => {
    setPickup(initialPickup || null);
    setDestination(initialDestination || null);
    if (!initialPickup || !initialDestination) setRouteCoords([]);
  }, [initialPickup, initialDestination]);

  const tileLayers = {
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  };

  // OSRM route
  useEffect(() => {
    const fetchRoute = async () => {
      if (pickup && destination && initialPickup && initialDestination) {
        try {
          const res = await axios.get(
            `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
          );
          if (res.data.routes?.length > 0) {
            const route = res.data.routes[0];
            setRouteCoords(route.geometry.coordinates.map(c => [c[1], c[0]]));
            if (onRouteCalculated) {
              onRouteCalculated({ distance: parseFloat((route.distance / 1000).toFixed(2)), duration: Math.ceil(route.duration / 60) });
            }
          }
        } catch (err) { console.error('OSRM error:', err); }
      } else {
        setRouteCoords([]);
        if (onRouteCalculated) onRouteCalculated(null);
      }
    };
    fetchRoute();
  }, [pickup, destination, initialPickup, initialDestination, onRouteCalculated]);

  // Reverse geocode
  const reverseGeocode = async (lat, lng) => {
    try {
      const { data } = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      if (data?.address) return data.address.suburb || data.address.road || data.address.city || data.display_name.split(',')[0];
      return 'Unknown Location';
    } catch { return 'Unknown Location'; }
  };

  // Forward geocode search
  const searchPlaces = async (query) => {
    if (!query || query.length < 2) return [];
    try {
      const { data } = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`
      );
      return data;
    } catch { return []; }
  };

  // Debounced search
  const handleSearchInput = (type, value) => {
    if (type === 'pickup') { setPickupQuery(value); setActiveSearch('pickup'); }
    else { setDropoffQuery(value); setActiveSearch('dropoff'); }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const results = await searchPlaces(value);
      if (type === 'pickup') setPickupResults(results);
      else setDropoffResults(results);
    }, 400);
  };

  // Select place from dropdown
  const selectPlace = (type, place) => {
    const coords = { lat: parseFloat(place.lat), lng: parseFloat(place.lon) };
    const address = place.display_name.split(',').slice(0, 3).join(', ');
    const locationObj = { ...coords, address };
    setFlyTo(coords);

    if (type === 'pickup') {
      setPickup(locationObj); setPickupQuery(address); setPickupResults([]);
      if (onLocationsUpdate) onLocationsUpdate({ type: 'pickup', coords: locationObj, address });
    } else {
      setDestination(locationObj); setDropoffQuery(address); setDropoffResults([]);
      if (onLocationsUpdate) onLocationsUpdate({ type: 'destination', coords: locationObj, address });
    }
    setActiveSearch(null);
  };

  // GPS
  const useMyLocation = (type) => {
    if (!navigator.geolocation) { alert('Geolocation is not supported by your browser.'); return; }
    setGpsLoading(type);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const address = await reverseGeocode(lat, lng);
        const locationObj = { lat, lng, address };
        setFlyTo({ lat, lng });
        if (type === 'pickup') {
          setPickup(locationObj); setPickupQuery(address); setPickupResults([]);
          if (onLocationsUpdate) onLocationsUpdate({ type: 'pickup', coords: locationObj, address });
        } else {
          setDestination(locationObj); setDropoffQuery(address); setDropoffResults([]);
          if (onLocationsUpdate) onLocationsUpdate({ type: 'destination', coords: locationObj, address });
        }
        setGpsLoading(null);
      },
      (err) => { console.error('GPS error:', err); alert('Could not get your location. Please allow location access.'); setGpsLoading(null); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Clear input
  const handleClear = (type) => {
    if (type === 'pickup') { setPickupQuery(''); setPickupResults([]); }
    else { setDropoffQuery(''); setDropoffResults([]); }
  };

  // Map click handler (also defined outside render via component)
  const MapClickHandler = () => {
    useMapEvents({
      async click(e) {
        const { lat, lng } = e.latlng;
        if (!pickup) {
          const address = await reverseGeocode(lat, lng);
          const loc = { lat, lng, address };
          setPickup(loc); setPickupQuery(address);
          if (onLocationsUpdate) onLocationsUpdate({ type: 'pickup', coords: loc, address });
        } else if (!destination) {
          const address = await reverseGeocode(lat, lng);
          const loc = { lat, lng, address };
          setDestination(loc); setDropoffQuery(address);
          if (onLocationsUpdate) onLocationsUpdate({ type: 'destination', coords: loc, address });
        } else {
          const address = await reverseGeocode(lat, lng);
          const loc = { lat, lng, address };
          setPickup(loc); setDestination(null); setRouteCoords([]);
          setPickupQuery(address); setDropoffQuery('');
          if (onRouteCalculated) onRouteCalculated(null);
          if (onLocationsUpdate) onLocationsUpdate({ type: 'pickup', coords: loc, address });
        }
      },
    });
    return null;
  };

  return (
    <div className="relative w-full h-full rounded-b-2xl sm:rounded-2xl overflow-hidden shadow-inner">

      {/* Search Panel (passenger only) */}
      {!hideSearch && (
        <div className="absolute top-4 left-4 right-4 sm:right-auto z-[1000] sm:w-[360px]">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-white/60 dark:border-white/10 p-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 px-1">Plan your ride</p>

            <SearchInput
              type="pickup"
              query={pickupQuery}
              results={pickupResults}
              placeholder="Pickup location"
              activeSearch={activeSearch}
              gpsLoading={gpsLoading}
              onInput={handleSearchInput}
              onFocus={setActiveSearch}
              onClear={handleClear}
              onSelectPlace={selectPlace}
              onUseLocation={useMyLocation}
              inputRef={pickupRef}
            />

            <div className="flex items-center gap-2 px-1.5">
              <div className="w-0.5 h-4 rounded ml-[4px]" style={{ borderLeft: '2px dashed #9ca3af' }} />
            </div>

            <SearchInput
              type="dropoff"
              query={dropoffQuery}
              results={dropoffResults}
              placeholder="Where to?"
              activeSearch={activeSearch}
              gpsLoading={gpsLoading}
              onInput={handleSearchInput}
              onFocus={setActiveSearch}
              onClear={handleClear}
              onSelectPlace={selectPlace}
              onUseLocation={useMyLocation}
              inputRef={dropoffRef}
            />
          </div>
        </div>
      )}

      {/* Map style switcher */}
      <div
        className="absolute right-4 z-[999] bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex items-center space-x-2"
        style={{ top: hideSearch ? '16px' : '220px' }}
      >
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Style:</label>
        <select
          className="bg-transparent text-sm font-medium focus:outline-none dark:text-white cursor-pointer"
          value={mapStyle}
          onChange={(e) => setMapStyle(e.target.value)}
        >
          <option value="osm" className="text-black">Street</option>
          <option value="satellite" className="text-black">Satellite</option>
        </select>
      </div>

      {/* Helper toast (passenger only) */}
      {!hideSearch && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="bg-black/70 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm">
            {!pickup ? 'Search or click map to set Pickup' : !destination ? 'Search or click map to set Destination' : 'Click anywhere to reset route'}
          </div>
        </div>
      )}

      <MapContainer center={[23.8103, 90.4125]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer url={tileLayers[mapStyle]} attribution="&copy; OpenStreetMap/Esri" />
        <MapClickHandler />
        {flyTo && <FlyToLocation coords={flyTo} />}

        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup>📍 Pickup: {pickup.address}</Popup>
          </Marker>
        )}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={dropoffIcon}>
            <Popup>🏁 Dropoff: {destination.address}</Popup>
          </Marker>
        )}
        {routeCoords.length > 0 && (
          <Polyline positions={routeCoords} color="#3b82f6" weight={5} opacity={0.8} />
        )}
      </MapContainer>
    </div>
  );
};

export default RideMap;

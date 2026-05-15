import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icons not showing correctly in React
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons for Pickup and Dropoff
const pickupIcon = new L.Icon({
  ...DefaultIcon.options,
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
});

const dropoffIcon = new L.Icon({
  ...DefaultIcon.options,
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
});

const RideMap = ({ onLocationsUpdate, onRouteCalculated }) => {
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [mapStyle, setMapStyle] = useState('osm');

  const tileLayers = {
    osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  };

  // Fetch Route from OSRM API
  useEffect(() => {
    const fetchRoute = async () => {
      if (pickup && destination) {
        try {
          const response = await axios.get(
            `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
          );
          
          if (response.data.routes && response.data.routes.length > 0) {
            const route = response.data.routes[0];
            // OSRM returns [lng, lat], Leaflet polyline needs [lat, lng]
            const coords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            setRouteCoords(coords);

            // Send distance and duration to parent component
            const distanceInKm = (route.distance / 1000).toFixed(2);
            const durationInMinutes = Math.ceil(route.duration / 60);
            
            if (onRouteCalculated) {
              onRouteCalculated({ distance: parseFloat(distanceInKm), duration: durationInMinutes });
            }
          }
        } catch (error) {
          console.error("Error fetching route from OSRM:", error);
        }
      } else {
        setRouteCoords([]);
      }
    };

    fetchRoute();
  }, [pickup, destination, onRouteCalculated]);

  const reverseGeocode = async (lat, lng) => {
    try {
      const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      // Extract a readable name (suburb, road, or display_name)
      if (data && data.address) {
        return data.address.suburb || data.address.road || data.address.city || data.display_name.split(',')[0];
      }
      return 'Unknown Location';
    } catch (error) {
      console.error('Geocoding error:', error);
      return 'Unknown Location';
    }
  };

  const MapClickHandler = () => {
    useMapEvents({
      async click(e) {
        const { lat, lng } = e.latlng;
        if (!pickup) {
          setPickup(e.latlng);
          if(onLocationsUpdate) onLocationsUpdate({ type: 'pickup', coords: e.latlng, address: 'Loading...' });
          const address = await reverseGeocode(lat, lng);
          if(onLocationsUpdate) onLocationsUpdate({ type: 'pickup', coords: e.latlng, address });
        } else if (!destination) {
          setDestination(e.latlng);
          if(onLocationsUpdate) onLocationsUpdate({ type: 'destination', coords: e.latlng, address: 'Loading...' });
          const address = await reverseGeocode(lat, lng);
          if(onLocationsUpdate) onLocationsUpdate({ type: 'destination', coords: e.latlng, address });
        } else {
          // Reset if both are set and user clicks again
          setPickup(e.latlng);
          setDestination(null);
          setRouteCoords([]);
          if(onRouteCalculated) onRouteCalculated(null);
          if(onLocationsUpdate) onLocationsUpdate({ type: 'pickup', coords: e.latlng, address: 'Loading...' });
          const address = await reverseGeocode(lat, lng);
          if(onLocationsUpdate) onLocationsUpdate({ type: 'pickup', coords: e.latlng, address });
        }
      }
    });
    return null;
  };

  return (
    <div className="relative w-full h-full rounded-b-2xl sm:rounded-2xl overflow-hidden shadow-inner">
      <div className="absolute top-4 right-4 z-[1000] bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex items-center space-x-2">
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

      {/* Helper Toast */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[1000] pointer-events-none">
        <div className="bg-black/70 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm transition-all">
          {!pickup ? 'Click map to set Pickup' : !destination ? 'Click map to set Destination' : 'Click anywhere to reset'}
        </div>
      </div>
      
      <MapContainer 
        center={[23.8103, 90.4125]} // Default to Dhaka for example, since user is in a +06:00 timezone usually
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer url={tileLayers[mapStyle]} attribution="&copy; OpenStreetMap/Esri" />
        <MapClickHandler />
        
        {pickup && (
          <Marker position={pickup} icon={pickupIcon}>
            <Popup>Pickup Location</Popup>
          </Marker>
        )}
        
        {destination && (
          <Marker position={destination} icon={dropoffIcon}>
            <Popup>Dropoff Location</Popup>
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

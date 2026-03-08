'use client';
import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useTranslations } from 'next-intl';

interface Driver {
  id: string;
  name: string;
  location: { lat: number; lng: number } | null;
  status: string;
  order: string | null;
  eta: string | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '600px'
};

const center = {
  lat: 31.5204,
  lng: 74.3587
};


const LiveTracking = () => {
  const tDashboard = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const tVendor = useTranslations('vendor');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  });

  // Fetch real drivers from API
  useEffect(() => {
    const fetchDrivers = async (isInitial = false) => {
      try {
        // Only show loading state on initial load
        if (isInitial) {
          setIsLoading(true);
        }

        const response = await fetch('/api/drivers');
        if (!response.ok) {
          throw new Error('Failed to fetch drivers');
        }
        const data = await response.json();

        // Map API data to component format
        const mappedDrivers: Driver[] = data.map((driver: {
          id: string;
          status: string;
          currentLat: number | null;
          currentLng: number | null;
          user?: { name?: string | null; email?: string | null };
          activeOrder?: { id: string; status?: string } | null;
        }) => ({
          id: driver.id,
          name: driver.user?.name || driver.user?.email || 'Unknown Driver',
          location: driver.currentLat && driver.currentLng
            ? { lat: driver.currentLat, lng: driver.currentLng }
            : null,
          status: driver.status === 'ONLINE'
            ? (driver.activeOrder ? 'Delivering' : 'Available')
            : driver.status,
          order: driver.activeOrder?.id
            ? `#${driver.activeOrder.id.slice(0, 8).toUpperCase()}`
            : null,
          eta: driver.activeOrder ? 'Calculating...' : null,
        }));

        // Filter out drivers without location data for map display
        // But keep them in the list
        setDrivers(mappedDrivers);
        setError(null);
      } catch (err) {
        console.error('Error fetching drivers:', err);
        setError('Failed to load drivers. Please try again.');
      } finally {
        if (isInitial) {
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchDrivers(true);

    // Refresh driver data every 5 minutes (300000ms)
    const interval = setInterval(() => fetchDrivers(false), 300000);
    return () => clearInterval(interval);
  }, []);

  if (!isLoaded) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">{tCommon('loading')}</div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate map center based on driver locations or use default
  const driversWithLocation = drivers.filter(d => d.location !== null);
  const mapCenter = driversWithLocation.length > 0
    ? {
      lat: driversWithLocation.reduce((sum, d) => sum + (d.location?.lat || 0), 0) / driversWithLocation.length,
      lng: driversWithLocation.reduce((sum, d) => sum + (d.location?.lng || 0), 0) / driversWithLocation.length,
    }
    : center;

  // Helper function to get marker icon
  const getMarkerIcon = (status: string) => {
    if (typeof window === 'undefined' || !(window as { google?: typeof google }).google) {
      return undefined;
    }
    const googleMaps = (window as { google: typeof google }).google.maps;
    return {
      path: googleMaps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: status === 'Delivering' || status === 'OUT_FOR_DELIVERY'
        ? '#F59E0B'
        : status === 'Available' || status === 'ONLINE'
          ? '#10B981'
          : '#9CA3AF',
      fillOpacity: 1,
      strokeColor: '#fff',
      strokeWeight: 2,
    };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">{tDashboard('liveTracking')}</h1>
          <div className="flex space-x-4">
            <select className="rounded-lg border-gray-300">
              <option>{tDashboard('allDrivers')}</option>
              <option>{tDashboard('available')}</option>
              <option>{tDashboard('onDelivery')}</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-500">{tCommon('loading')}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Driver List */}
            <div className="lg:col-span-1 space-y-4">
              {drivers.length === 0 ? (
                <div className="p-4 bg-white rounded-lg shadow text-center text-gray-500">
                  {tCommon('noItems')}
                </div>
              ) : (
                drivers.map((driver) => (
                  <div
                    key={driver.id}
                    className={`p-4 pt-0 bg-white rounded-lg shadow cursor-pointer transition-colors ${selectedDriver?.id === driver.id ? 'ring-2 ring-primary-500' : ''
                      }`}
                    onClick={() => setSelectedDriver(driver)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`h-3 w-3 rounded-full ${driver.status === 'Available' || driver.status === 'ONLINE'
                        ? 'bg-green-500'
                        : driver.status === 'Delivering' || driver.status === 'OUT_FOR_DELIVERY'
                          ? 'bg-yellow-500'
                          : 'bg-gray-400'
                        }`} />
                      <h3 className="font-medium">{driver.name}</h3>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>{tCommon('status')}: {driver.status}</p>
                      {driver.order && (
                        <>
                          <p>{tVendor('orders')}: {driver.order}</p>
                          {driver.eta && <p>{tCommon('eta')}: {driver.eta}</p>}
                        </>
                      )}
                      {driver.location ? (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Location
                          </p>
                          <p className="text-xs font-mono text-gray-600 mt-1">
                            {driver.location.lat.toFixed(6)}, {driver.location.lng.toFixed(6)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1">{tDashboard("locationUnavailable")}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Map */}
            <div className="lg:col-span-3 bg-white rounded-lg shadow-sm p-4">
              {driversWithLocation.length === 0 ? (
                <div className="flex items-center justify-center h-[600px] text-gray-500">
                  No drivers with location data available
                </div>
              ) : (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={13}
                >
                  {driversWithLocation.map(driver => (
                    <Marker
                      key={driver.id}
                      position={driver.location!}
                      title={driver.name}
                      onClick={() => {
                        setSelectedDriver(driver);
                        setSelectedMarkerId(driver.id);
                      }}
                      icon={getMarkerIcon(driver.status)}
                    >
                      {selectedMarkerId === driver.id && (
                        <InfoWindow
                          onCloseClick={() => setSelectedMarkerId(null)}
                        >
                          <div className="p-2">
                            <h3 className="font-semibold text-sm mb-1">{driver.name}</h3>
                            <p className="text-xs text-gray-600 mb-1">Status: {driver.status}</p>
                            {driver.order && (
                              <p className="text-xs text-gray-600 mb-1">Order: {driver.order}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {driver.location!.lat.toFixed(6)}, {driver.location!.lng.toFixed(6)}
                            </p>
                          </div>
                        </InfoWindow>
                      )}
                    </Marker>
                  ))}
                </GoogleMap>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
export default LiveTracking;

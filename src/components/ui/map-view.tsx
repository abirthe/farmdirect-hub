import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { CurrencyDisplay } from '@/components/ui/currency-display';

// Custom Marker Icon for AgroDirect
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `
      <div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);">
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

export interface MapLocation {
  id: string;
  lat: number;
  lng: number;
  title: string;
  crop?: string;
  price?: number;
  color?: string;
}

interface MapProps {
  locations?: MapLocation[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  interactive?: boolean;
  polygons?: [number, number][][];      // Areas representing farms
  routePos?: [number, number][];        // delivery route polyline
  enableDrawing?: boolean;              // Activate Geoman Shape Toolbar
  onPolygonDrawn?: (poly: [number, number][]) => void; // Event when shape finishes
}

// Center updater component in case props change dynamically
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// GIS Drawing Engine Component using Geoman
function GeomanSetup({ enabled, onDrawn }: { enabled?: boolean, onDrawn?: (poly: [number, number][]) => void }) {
  const map = useMap();

  useEffect(() => {
    if (!enabled) {
      map.pm.removeControls();
      return;
    }

    // Initialize Geoman Controls
    map.pm.addControls({
      position: 'topleft',
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: true,
      drawPolygon: true,
      drawCircle: false,
      drawText: false,
      editMode: true,
      dragMode: true,
      cutPolygon: false,
      removalMode: true,
    }); // Sets up the core drawing UI on the map

    // Listen to Shape Creations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleCreate = (e: any) => {
      const { layer } = e;
      if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
        // Extract array of coordinates
        const latlngs = layer.getLatLngs();
        const coordsPath = Array.isArray(latlngs[0]) ? latlngs[0] : latlngs;
        if (Array.isArray(coordsPath)) {
           const mapped: [number, number][] = (coordsPath as L.LatLng[]).map((c: L.LatLng) => [c.lat, c.lng]);
           if (onDrawn) onDrawn(mapped);
        }
      }
    };

    map.on('pm:create', handleCreate);

    return () => {
      map.off('pm:create', handleCreate);
      map.pm.removeControls();
    };
  }, [map, enabled, onDrawn]);

  return null;
}

const MapView: React.FC<MapProps> = ({ 
  locations = [], 
  center = [23.8103, 90.4125], // Default: Dhaka, Bangladesh
  zoom = 6, 
  height = "400px",
  interactive = true,
  polygons = [],
  routePos = [],
  enableDrawing = false,
  onPolygonDrawn
}) => {
  // Removed deprecated require calls for Vite

  return (
    <div className="w-full relative rounded-2xl overflow-hidden border border-border/60 shadow-sm z-0" style={{ height }}>
      <style>{`
        /* Root overrides */
        .leaflet-container { font-family: inherit; }
        
        /* Modernize Leaflet & Geoman Control Toolbars */
        .leaflet-bar {
          border: none !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.2), 0 2px 4px -2px rgb(0 0 0 / 0.2) !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
        .leaflet-bar a {
          background-color: hsl(var(--card)) !important;
          color: hsl(var(--card-foreground)) !important;
          border-color: hsl(var(--border)) !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          transition: all 0.2s;
        }
        .leaflet-bar a:hover {
          background-color: hsl(var(--accent)) !important;
          color: hsl(var(--accent-foreground)) !important;
        }
        
        /* Geoman specific overrides */
        .button-container.active .leaflet-buttons-control-button {
          background-color: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
          box-shadow: inset 0 0 10px rgba(0,0,0,0.2) !important;
        }
        
        /* Popup Styling to contrast satellite maps */
        .leaflet-popup-content-wrapper {
          background-color: hsl(var(--card));
          color: hsl(var(--card-foreground));
          border-radius: 12px;
          border: 1px solid hsl(var(--border));
          box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.3);
          padding: 2px;
        }
        .leaflet-popup-tip {
          background-color: hsl(var(--card));
          border: 1px solid hsl(var(--border));
        }
        
        /* High visibility attribution on dark satellite mapping */
        .leaflet-control-attribution {
          background-color: rgba(0, 0, 0, 0.6) !important;
          color: rgba(255, 255, 255, 0.8) !important;
          border-radius: 6px 0 0 0;
          padding: 2px 6px !important;
        }
        .leaflet-control-attribution a {
          color: rgba(255, 255, 255, 0.9) !important;
          text-decoration: underline;
        }
      `}</style>
      
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
        style={{ height: '100%', width: '100%', zIndex: 10 }}
      >
        <ChangeView center={center} zoom={zoom} />
        <GeomanSetup enabled={enableDrawing} onDrawn={onPolygonDrawn} />
        
        {/* Google Maps Base Layer (Hybrid Satellite + Terrain Labels) */}
        <TileLayer
          attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
          url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          maxZoom={20}
        />

        {/* Polygons (Farm boundaries) */}
        {polygons.map((poly, idx) => (
          <Polygon 
            key={idx} 
            positions={poly} 
            pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.2, weight: 3 }} 
          />
        ))}

        {/* Polylines (Delivery Escrow Routes) */}
        {routePos.length > 0 && (
          <Polyline 
            positions={routePos} 
            pathOptions={{ color: '#3b82f6', weight: 4, dashArray: '10, 10' }} 
          />
        )}

        {locations.map((loc) => (
          <Marker 
            key={loc.id} 
            position={[loc.lat, loc.lng]}
            icon={createCustomIcon(loc.color || '#22c55e')} // Default green
          >
            <Popup className="agrodirect-popup rounded-xl">
              <div className="p-1 space-y-1.5 min-w-[140px]">
                <p className="font-bold text-sm leading-tight text-foreground">{loc.title}</p>
                {(loc.crop || loc.price !== undefined) && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{loc.crop}</span>
                    {loc.price !== undefined && (
                      <span className="font-semibold text-primary"><CurrencyDisplay amount={loc.price} />/t</span>
                    )}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;

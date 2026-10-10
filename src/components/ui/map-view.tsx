// Precision GIS map view supporting multi-layer satellite imagery, delivery routes, and parcel digitizing.
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon, Polyline, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { Layers } from 'lucide-react';
import { MapDrawingControls } from '@/components/map/MapDrawingControls';

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

type MapLayerType = 'hybrid' | 'satellite' | 'topo' | 'street';

const MAP_TILES: Record<MapLayerType, { name: string; url: string; attribution: string; maxZoom: number }> = {
  hybrid: {
    name: 'Satellite Hybrid',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Satellite',
    maxZoom: 20,
  },
  satellite: {
    name: 'Esri Orthomosaic',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Imagery',
    maxZoom: 19,
  },
  topo: {
    name: 'OpenTopo Elevation',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
    maxZoom: 17,
  },
  street: {
    name: 'Street Map',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  },
};

const MapView: React.FC<MapProps> = ({
  locations = [],
  center = [23.8103, 90.4125], // Default: Dhaka, Bangladesh
  zoom = 6,
  height = '400px',
  interactive = true,
  polygons = [],
  routePos = [],
  enableDrawing = false,
  onPolygonDrawn,
}) => {
  const [activeLayer, setActiveLayer] = useState<MapLayerType>('hybrid');

  return (
    <div className="w-full relative rounded-2xl overflow-hidden border border-border/60 shadow-sm z-0" style={{ height }}>
      {/* Floating Precision Agro Layer Switcher (Top-Right) */}
      <div className="absolute top-3 right-3 z-[1000] bg-card/90 backdrop-blur-md border border-border/80 rounded-xl p-1 shadow-lg flex items-center gap-1 text-xs">
        <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
          <Layers className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline">Layer:</span>
        </div>
        {(['hybrid', 'satellite', 'topo', 'street'] as const).map((layerKey) => (
          <button
            key={layerKey}
            type="button"
            onClick={() => setActiveLayer(layerKey)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              activeLayer === layerKey
                ? 'bg-primary text-primary-foreground shadow-sm font-bold'
                : 'hover:bg-muted text-foreground'
            }`}
          >
            {MAP_TILES[layerKey].name.split(' ')[0]}
          </button>
        ))}
      </div>

      <style>{`
        /* Root overrides */
        .leaflet-container { font-family: inherit; }
        
        /* Modernize Leaflet & Geoman Control Toolbars */
        .leaflet-bar {
          border: none !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.2), 0 2px 4px -2px rgb(0 0 0 / 0.2) !important;
          border-radius: 12px !important;
          overflow: hidden;
        }
        .leaflet-bar a {
          background-color: hsl(var(--card)) !important;
          color: hsl(var(--card-foreground)) !important;
          border-color: hsl(var(--border)) !important;
          width: 34px !important;
          height: 34px !important;
          line-height: 34px !important;
          transition: all 0.2s;
        }
        .leaflet-bar a:hover {
          background-color: hsl(var(--accent)) !important;
          color: hsl(var(--accent-foreground)) !important;
        }
        
        /* Geoman controls styling */
        .leaflet-pm-toolbar .leaflet-buttons-control-button {
          border-radius: 8px !important;
        }
        .button-container.active .leaflet-buttons-control-button {
          background-color: #10b981 !important;
          color: white !important;
          box-shadow: inset 0 0 10px rgba(0,0,0,0.2) !important;
        }
        
        /* Popup Styling */
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
        
        /* Attribution */
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
        zoomControl={false}
        style={{ height: '100%', width: '100%', zIndex: 10 }}
      >
        {interactive && <ZoomControl position="bottomright" />}
        <ChangeView center={center} zoom={zoom} />

        {/* Lovable Geoman Drawing and Telemetry HUD */}
        {enableDrawing && (
          <MapDrawingControls
            onPolygonDrawn={onPolygonDrawn}
            currentPolygon={polygons[0] || []}
          />
        )}

        {/* Active Tile Layer */}
        <TileLayer
          key={activeLayer}
          attribution={MAP_TILES[activeLayer].attribution}
          url={MAP_TILES[activeLayer].url}
          maxZoom={MAP_TILES[activeLayer].maxZoom}
        />

        {/* Polygons (Farm boundaries) */}
        {polygons.map((poly, idx) => (
          <Polygon
            key={idx}
            positions={poly}
            pathOptions={{
              color: '#10b981',
              fillColor: '#10b981',
              fillOpacity: 0.28,
              weight: 3,
            }}
          />
        ))}

        {/* Polylines (Delivery Escrow Routes) */}
        {routePos.length > 0 && (
          <Polyline
            positions={routePos}
            pathOptions={{ color: '#3b82f6', weight: 4, dashArray: '10, 10' }}
          />
        )}

        {/* Crop Listing Markers */}
        {locations.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.lat, loc.lng]}
            icon={createCustomIcon(loc.color || '#10b981')}
          >
            <Popup className="agrodirect-popup rounded-xl">
              <div className="p-1 space-y-1.5 min-w-[140px]">
                <p className="font-bold text-sm leading-tight text-foreground">{loc.title}</p>
                {(loc.crop || loc.price !== undefined) && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{loc.crop}</span>
                    {loc.price !== undefined && (
                      <span className="font-semibold text-primary">
                        <CurrencyDisplay amount={loc.price} />/t
                      </span>
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

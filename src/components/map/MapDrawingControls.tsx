// Interactive Geoman drawing engine and Lovable floating command ribbon for farmland parcel digitizing.
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  PenTool,
  Square,
  MousePointerClick,
  RotateCcw,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParcelTelemetryHud } from './ParcelTelemetryHud';

export interface MapDrawingControlsProps {
  onPolygonDrawn?: (poly: [number, number][]) => void;
  currentPolygon?: [number, number][];
}

const DISTRICT_HUBS = [
  { name: 'Bogura', coords: [24.8465, 89.3777] as [number, number] },
  { name: 'Rajshahi', coords: [24.3745, 88.6042] as [number, number] },
  { name: 'Dinajpur', coords: [25.6279, 88.6332] as [number, number] },
  { name: 'Rangpur', coords: [25.7439, 89.2752] as [number, number] },
  { name: 'Jashore', coords: [23.1664, 89.2081] as [number, number] },
  { name: 'Mymensingh', coords: [24.7471, 90.4203] as [number, number] },
  { name: 'Dhaka Hub', coords: [23.8103, 90.4125] as [number, number] },
];

export function MapDrawingControls({ onPolygonDrawn, currentPolygon = [] }: MapDrawingControlsProps) {
  const map = useMap();
  const [activeTool, setActiveTool] = useState<'polygon' | 'rectangle' | 'edit' | null>(null);
  const [showDistricts, setShowDistricts] = useState(false);
  const [coords, setCoords] = useState<[number, number][]>(currentPolygon);
  const layerRef = useRef<L.Layer | null>(null);

  const fitPolygonBounds = useCallback((polygonCoords: [number, number][]) => {
    if (!polygonCoords || polygonCoords.length < 3) return;
    const latLngs = polygonCoords.map(([lat, lng]) => L.latLng(lat, lng));
    const bounds = L.latLngBounds(latLngs);
    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        paddingBottomRight: [320, 180], // Keeps bottom-right Parcel Telemetry result box clear of selected area
        paddingTopLeft: [75, 75],       // Keeps top-left toolbar and top-right zoom controls clear
        maxZoom: 17,
        animate: true,
        duration: 0.6,
      });
    }
  }, [map]);

  useEffect(() => {
    if (currentPolygon && currentPolygon.length >= 3) {
      setCoords(currentPolygon);
    }
  }, [currentPolygon]);

  const extractCoordinates = useCallback((layer: L.Layer): [number, number][] => {
    if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
      const latlngs = layer.getLatLngs();
      const coordsPath = Array.isArray(latlngs[0]) ? latlngs[0] : latlngs;
      if (Array.isArray(coordsPath)) {
        return (coordsPath as L.LatLng[]).map((c: L.LatLng) => [
          Number(c.lat.toFixed(6)),
          Number(c.lng.toFixed(6)),
        ]);
      }
    }
    return [];
  }, []);

  useEffect(() => {
    map.pm.setPathOptions({
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.28,
      weight: 3,
    });

    map.pm.setGlobalOptions({
      snappable: true,
      snapDistance: 25,
      allowSelfIntersection: false,
      continueDrawing: false,
    });

    const handleCreate = (e: { layer: L.Layer; shape?: string }) => {
      const { layer } = e;
      layerRef.current = layer;
      const extracted = extractCoordinates(layer);
      if (extracted.length >= 3) {
        setCoords(extracted);
        if (onPolygonDrawn) onPolygonDrawn(extracted);
      }
      setActiveTool(null);
    };

    const handleEdit = (e: { layer: L.Layer }) => {
      const { layer } = e;
      if (layer) {
        layerRef.current = layer;
        const extracted = extractCoordinates(layer);
        if (extracted.length >= 3) {
          setCoords(extracted);
          if (onPolygonDrawn) onPolygonDrawn(extracted);
        }
      }
    };

    const handleRemove = () => {
      layerRef.current = null;
      setCoords([]);
      if (onPolygonDrawn) onPolygonDrawn([]);
      setActiveTool(null);
    };

    const handleDrawStart = (e: { shape?: string }) => {
      const shape = e.shape?.toLowerCase();
      if (shape === 'polygon') setActiveTool('polygon');
      if (shape === 'rectangle') setActiveTool('rectangle');
    };

    const handleDrawEnd = () => {
      setActiveTool(null);
    };

    map.on('pm:create', handleCreate);
    map.on('pm:remove', handleRemove);
    map.on('pm:drawstart', handleDrawStart);
    map.on('pm:drawend', handleDrawEnd);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.on('pm:globaleditmodetoggled' as any, (e: any) => {
      setActiveTool(e.enabled ? 'edit' : null);
    });

    return () => {
      map.off('pm:create', handleCreate);
      map.off('pm:remove', handleRemove);
      map.off('pm:drawstart', handleDrawStart);
      map.off('pm:drawend', handleDrawEnd);
      map.pm.disableDraw();
      map.pm.disableGlobalEditMode();
    };
  }, [map, extractCoordinates, onPolygonDrawn]);

  const startPolygonDraw = () => {
    if (activeTool === 'polygon') {
      map.pm.disableDraw();
      setActiveTool(null);
    } else {
      map.pm.disableGlobalEditMode();
      map.pm.enableDraw('Polygon', { snappable: true, snapDistance: 25 });
      setActiveTool('polygon');
    }
  };

  const startRectangleDraw = () => {
    if (activeTool === 'rectangle') {
      map.pm.disableDraw();
      setActiveTool(null);
    } else {
      map.pm.disableGlobalEditMode();
      map.pm.enableDraw('Rectangle', { snappable: true });
      setActiveTool('rectangle');
    }
  };

  const toggleEditMode = () => {
    if (activeTool === 'edit') {
      map.pm.disableGlobalEditMode();
      setActiveTool(null);
    } else {
      map.pm.disableDraw();
      map.pm.enableGlobalEditMode();
      setActiveTool('edit');
    }
  };

  const clearBoundary = () => {
    map.pm.disableDraw();
    map.pm.disableGlobalEditMode();
    const layers = map.pm.getGeomanLayers();
    layers.forEach((l) => map.removeLayer(l));
    setCoords([]);
    if (onPolygonDrawn) onPolygonDrawn([]);
    setActiveTool(null);
  };

  const jumpToDistrict = (target: [number, number]) => {
    map.flyTo(target, 12, { duration: 1.4 });
    setShowDistricts(false);
  };

  return (
    <>
      {/* 1. Floating Lovable Command Ribbon (Top-Left) */}
      <div
        data-testid="map-drawing-toolbar"
        className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-1.5 bg-card/90 backdrop-blur-md border border-border/80 p-1.5 rounded-2xl shadow-xl"
      >
        <Button type="button"
          size="sm"
          variant={activeTool === 'polygon' ? 'default' : 'ghost'}
          onClick={startPolygonDraw}
          className={`hover-lift h-8 px-2.5 rounded-xl text-xs gap-1.5 font-semibold transition-all ${
            activeTool === 'polygon'
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
              : 'hover:bg-muted text-foreground'
          }`}
          title="Click points on map to draw field perimeter. Double-click or click start point to seal."
        >
          <PenTool className="h-3.5 w-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Draw Field</span>
        </Button>

        <Button type="button"
          size="sm"
          variant={activeTool === 'rectangle' ? 'default' : 'ghost'}
          onClick={startRectangleDraw}
          className={`hover-lift h-8 px-2.5 rounded-xl text-xs gap-1.5 font-semibold transition-all ${
            activeTool === 'rectangle'
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
              : 'hover:bg-muted text-foreground'
          }`}
          title="Drag a rectangular bounding box across the parcel."
        >
          <Square className="h-3.5 w-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Box Plot</span>
        </Button>

        <Button type="button"
          size="sm"
          variant={activeTool === 'edit' ? 'default' : 'ghost'}
          onClick={toggleEditMode}
          className={`hover-lift h-8 px-2.5 rounded-xl text-xs gap-1.5 font-semibold transition-all ${
            activeTool === 'edit'
              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md'
              : 'hover:bg-muted text-foreground'
          }`}
          title="Drag vertices or corner pins to adjust boundary perimeter."
        >
          <MousePointerClick className="h-3.5 w-3.5 text-amber-400" />
          <span className="hidden sm:inline">Reshape Pins</span>
        </Button>

        {coords.length >= 3 && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={clearBoundary}
            className="h-8 px-2 rounded-xl text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 gap-1 font-semibold"
            title="Reset and clear drawn boundary."
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Reset</span>
          </Button>
        )}

        <div className="h-4 w-[1px] bg-border mx-0.5 hidden sm:block" />

        {/* District Fast-Jump Selector */}
        <div className="relative">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowDistricts(!showDistricts)}
            className="h-8 px-2.5 rounded-xl text-xs gap-1 font-semibold text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Fly to District</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>

          {showDistricts && (
            <div className="absolute top-10 left-0 bg-card/95 backdrop-blur-md border border-border/80 rounded-xl shadow-2xl p-1.5 min-w-[150px] z-[1200] grid gap-0.5 animate-in fade-in zoom-in-95 duration-150">
              <p className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1">
                Major Crop Clusters
              </p>
              {DISTRICT_HUBS.map((d) => (
                <button
                  key={d.name}
                  type="button"
                  onClick={() => jumpToDistrict(d.coords)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-between"
                >
                  <span>{d.name}</span>
                  <span className="text-[10px] text-muted-foreground">Jump</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Interactive Drawing Prompt Banner (Top-Center) */}
      {activeTool && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-emerald-950/90 text-emerald-200 border border-emerald-500/30 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-2xl text-xs flex items-center gap-2 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {activeTool === 'polygon' && 'Click on map to place corners. Click starting point or double-click to seal.'}
            {activeTool === 'rectangle' && 'Click and drag on the map to define the bounding farmland plot.'}
            {activeTool === 'edit' && 'Drag vertices/pins to reshape the parcel perimeter. Click Reshape Pins when done.'}
          </div>
        </div>
      )}

      {/* 3. Real-Time Parcel Telemetry HUD */}
      <ParcelTelemetryHud coords={coords} onFocusArea={() => fitPolygonBounds(coords)} />
    </>
  );
}

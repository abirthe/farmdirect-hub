# 🛰️ AgroDirect: End-to-End Project Specification

AgroDirect is a decentralized agricultural ecosystem that uses GIS mapping, Machine Learning yield forecasting, and a B2B marketplace to empower farmers and remove middleman exploitation.

## 🎨 1. UI/UX Design System

### Visual Identity

- **Color Palette:**
  - `#2D5A27` — Deep Forest Green (Primary / Trust)
  - `#F2C94C` — Harvest Gold (Actions / Warnings)
  - `#F2F2F2` — Cloud White (Backgrounds)
- **Typography:** Sans-serif (`Inter` or `Roboto`) for high readability in outdoor conditions.

### User Personas & Views

- **Farmer View:** High-contrast buttons, voice-to-text input, and map-centric layout.
- **Buyer View:** Data-heavy, bulk filtering, logistics tracking, and quality certificates.
- **Admin View:** Verification of land titles and dispute resolution.

## 💻 2. Frontend Architecture (React.js)

The frontend uses a **Mobile-First** approach to ensure usability on low-end smartphones.

### Core Components

- `InteractiveMap.jsx`: Uses `react-map-gl` to allow farmers to draw their field boundaries.
- `YieldCard.jsx`: A visual gauge showing predicted tons vs. historical averages.
- `PriceChart.jsx`: A `Recharts`-based line graph showing price trends for the specific crop.

### Key Logic

```javascript
// Function to handle polygon drawing and area calculation
const onMapCreate = (e) => {
  const data = e.features[0].geometry.coordinates;
  const area = turf.area(e.features[0]); // Using Turf.js for geo-calculations
  setFarmArea(area / 10000); // Convert sq meters to Hectares
};
```

## ⚙️ 3. Backend Logic (FastAPI / Python)

The backend acts as the bridge between satellite data, ML models, and the database.

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/farm/register` | Saves GeoJSON boundary and crop type. |
| `GET` | `/api/predict/yield/{farm_id}` | Runs ML model based on NDVI + Weather. |
| `GET` | `/api/market/fair-price` | Calculates price based on city rates - logistics. |
| `POST` | `/api/escrow/initiate` | Holds buyer funds until delivery. |

### Prediction Logic (Python)

The backend calculates yield using a weighted formula:

$$Y_{pred} = A \times (H_{base} \times \omega_{ndvi} \times \omega_{weather})$$

Where:

- `$A$`: Area in hectares.
- `$H_{base}$`: Historical average yield for that crop.
- `$\omega_{ndvi}$`: Health multiplier from satellite data (`0.0` to `1.2`).
- `$\omega_{weather}$`: Risk factor based on upcoming frost or drought.

## 🗄️ 4. Database Schema (PostgreSQL + PostGIS)

```sql
-- Enable GIS features
CREATE EXTENSION postgis;

-- Farmer's Land Data
CREATE TABLE farms (
    id SERIAL PRIMARY KEY,
    farmer_id INT REFERENCES users(id),
    crop_name VARCHAR(50),
    boundary GEOMETRY(Polygon, 4326), -- Stores the map shape
    sowing_date DATE,
    estimated_harvest_date DATE
);

-- Marketplace Listings
CREATE TABLE listings (
    id SERIAL PRIMARY KEY,
    farm_id INT REFERENCES farms(id),
    expected_yield DECIMAL,
    min_asking_price DECIMAL,
    status VARCHAR(20) -- 'Growing', 'Ready', 'Sold'
);
```

## 🚜 5. The “Middleman-Killer” Workflow

1. **Mapping:** Farmer draws their field on the app. The system confirms the area.
2. **Monitoring:** Every 5 days, the backend pulls Sentinel-2 satellite imagery. It alerts the farmer if crops look dry.
3. **Price Discovery:** The app scrapes current retail prices (`P_retail`) and subtracts a fixed logistics/platform fee (`Cost_log`).
4. **Result:** The farmer gets 20–30% more than a middleman would offer.
5. **The Deal:** A buyer (e.g. a restaurant chain) sees the “Ready in 10 Days” listing and locks the price in Escrow.
6. **Completion:** Crop is delivered. Buyer scans a QR Code. Funds are released.

## 🛠️ 6. Tech Stack Summary

- **Frontend:** React, Tailwind CSS, Mapbox GL
- **Backend:** Python (FastAPI), Celery (for background satellite processing)
- **Database:** PostgreSQL (PostGIS)
- **ML/Data:** Scikit-learn, OpenWeather API, Google Earth Engine
- **Infrastructure:** AWS (Lambda for scaling, S3 for satellite image storage)

## 📈 7. Success Metrics

- **Price Delta:** `(Price received by Farmer / Local Middleman Price) > 1.2x`
- **Yield Accuracy:** Prediction within 10% of actual harvest weight.
- **Adoption:** Number of hectares mapped on the platform.

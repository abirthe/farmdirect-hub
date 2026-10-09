export interface MarketplaceListing {
  id: string;
  crop: string;
  emoji: string;
  farmName: string;
  farmer: string;
  farmerRating: number;
  farmerDeals: number;
  location: string;
  area: string;
  qty: string;
  floorPrice: number;
  retailPrice: number;
  logisticsCost: number;
  status: string;
  statusType: string;
  ndvi: number;
  weatherRisk: number;
  fieldHealth: number;
  buyers: number;
  quality: string;
  verified: boolean;
  certDocs: string[];
  escrowReady: boolean;
  description: string;
}

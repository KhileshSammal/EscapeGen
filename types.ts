
export enum Vibe {
  CHILL = 'Chill / Slow',
  SPONTANEOUS = 'Spontaneous',
  NATURE = 'Nature Reset',
  SOCIAL = 'Social / Fun',
  BURNT_OUT = 'Burnt Out'
}

export enum Budget {
  LOW = '₹2k–₹5k',
  MID = '₹5k–₹8k',
  HIGH = '₹8k–₹12k',
  PREMIUM = '₹12k+'
}

export enum TravelMode {
  TRAIN = 'Train',
  BUS = 'Bus',
  DRIVE = 'Self-drive',
  ANY = 'Any'
}

export enum TripType {
  SOLO = 'Solo',
  COUPLE = 'Couple',
  GROUP = 'Group'
}

export interface ItineraryItem {
  time: 'Morning' | 'Afternoon' | 'Evening';
  activity: string;
  note?: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  items: ItineraryItem[];
}

export interface CostBreakdown {
  stay: string;
  travel: string;
  food: string;
  misc: string;
}

export interface HotelSuggestion {
  name: string;
  type: string;
  approxPrice: string;
  mapsUrl: string;
}

export interface UserStory {
  text: string;
  username: string;
  date: string;
}

export interface TripImage {
  url: string;
  sourceUrl: string;
}

export interface TripOption {
  id: string;
  destination: string;
  whyFits: string;
  distance: number;
  travelTime: string;
  budgetRange: string;
  costBreakdown: CostBreakdown;
  crowdLevel: 'Low' | 'Medium' | 'High';
  weather: 'sunny' | 'cloudy' | 'rainy' | 'cool';
  weatherSensitivity: string;
  bestTime: string;
  staySuggestion: string;
  experiences: string[];
  foodHighlight: string;
  realityScore: number;
  tag?: 'Overrated' | 'Underrated';
  notForEveryone: string;
  costStats: string;
  itinerary: ItineraryDay[];
  hotels: HotelSuggestion[];
  userStories: UserStory[];
  images: TripImage[];
  timestamp: number;
  tripType: TripType;
  status: 'discovered' | 'saved' | 'completed';
  completionDate?: string;
  destinationMapsUrl: string;
  nudgeReason: string;
  votes: number;
}

export interface UserPreferences {
  city: string;
  budget: Budget;
  vibe: Vibe;
  travelMode: TravelMode;
  tripType: TripType;
  coords?: { latitude: number; longitude: number };
}


import { Vibe, Budget, TravelMode, TripType } from './types';

export const VIBE_METADATA = [
  { id: Vibe.CHILL, icon: '🍃', label: 'Chill' },
  { id: Vibe.SPONTANEOUS, icon: '⚡', label: 'Fast' },
  { id: Vibe.NATURE, icon: '🏔️', label: 'Nature' },
  { id: Vibe.SOCIAL, icon: '🍻', label: 'Social' },
  { id: Vibe.BURNT_OUT, icon: '🛌', label: 'Rest' },
];

export const BUDGET_OPTIONS = [
  Budget.LOW,
  Budget.MID,
  Budget.HIGH,
  Budget.PREMIUM
];

export const TRAVEL_MODES = [
  TravelMode.ANY,
  TravelMode.TRAIN,
  TravelMode.BUS,
  TravelMode.DRIVE
];

export const TRIP_TYPES = [
  { id: TripType.SOLO, icon: '🧘', label: 'Solo' },
  { id: TripType.COUPLE, icon: '❤️', label: 'Couple' },
  { id: TripType.GROUP, icon: '👋', label: 'Group' },
];

export const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Pune", "Hyderabad", 
  "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Chandigarh"
];

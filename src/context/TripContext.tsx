import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Trip } from '../services/tripService';

interface TripContextData {
  activeTrip: Trip | null;
  setActiveTrip: (trip: Trip | null) => void;
}

const TripContext = createContext<TripContextData>({
  activeTrip: null,
  setActiveTrip: () => {},
});

export const TripProvider = ({ children }: { children: ReactNode }) => {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);

  return (
    <TripContext.Provider value={{ activeTrip, setActiveTrip }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => useContext(TripContext);

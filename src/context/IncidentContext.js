import React, { createContext, useContext, useState } from 'react';

const IncidentContext = createContext();

export function IncidentProvider({ children }) {
  const [selectedIncident, setSelectedIncident] = useState(null);

  return (
    <IncidentContext.Provider value={{ selectedIncident, setSelectedIncident }}>
      {children}
    </IncidentContext.Provider>
  );
}

export function useIncident() {
  return useContext(IncidentContext);
}
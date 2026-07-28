import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface OfflineContextType {
  isOffline: boolean;
  syncQueueLength: number;
  addToOfflineQueue: (action: string) => void;
}

const OfflineContext = createContext<OfflineContextType>({
  isOffline: false,
  syncQueueLength: 0,
  addToOfflineQueue: () => {},
});

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOffline, setIsOffline] = useState(false);
  const [syncQueue, setSyncQueue] = useState<string[]>([]);

  const addToOfflineQueue = (action: string) => {
    setSyncQueue((prev) => [...prev, action]);
  };

  return (
    <OfflineContext.Provider value={{ isOffline, syncQueueLength: syncQueue.length, addToOfflineQueue }}>
      {isOffline && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>⚡ You are working offline. Changes will automatically sync when online.</Text>
        </View>
      )}
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => useContext(OfflineContext);

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#f59e0b',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  bannerText: {
    color: '#09090b',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

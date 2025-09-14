import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Header from './Header';

function Layout({ children }) {
  const location = useLocation();
  const [showHeader, setShowHeader] = useState(false);
  const [isOverMap, setIsOverMap] = useState(true);
  const isStartupPage = location.pathname === '/';
  const isActionPage = location.pathname === '/action' || location.pathname.startsWith('/action/');

  useEffect(() => {
    setShowHeader(true);
    setIsOverMap(location.pathname === '/map' || location.pathname === '/archive' || isActionPage);
  }, [location, isActionPage]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      {showHeader && (
        <Header isOverMap={isOverMap} />
      )}
      <Container 
        maxWidth={false}
        disableGutters
        sx={{
          flex: 1,
          padding: 0,
          maxWidth: '100%',
          margin: 0,
          width: '100vw',
          paddingTop: isStartupPage ? '0' : (isOverMap ? '0' : '10vh'),
          paddingBottom: isStartupPage
            ? 'env(safe-area-inset-bottom)'
            : (isOverMap
              ? 'env(safe-area-inset-bottom)'
              : 'calc(80px + env(safe-area-inset-bottom))'),
          backgroundColor: 'transparent'
        }}
      >
        {children}
      </Container>
    </Box>
  );
}

export default Layout;

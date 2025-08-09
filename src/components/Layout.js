import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Header from './Header';

function Layout({ children }) {
  const location = useLocation();
  const [showHeader, setShowHeader] = useState(false);
  const [isOverMap, setIsOverMap] = useState(true);
  const isStartupPage = location.pathname === '/';
  const isArchivePage = location.pathname === '/archive';
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
          // 顶部：非地图页时预留 Header 高度
          paddingTop: isStartupPage ? '0' : (isOverMap ? '0' : '10vh'),
          // 底部：为 iOS/全面屏等预留安全区；
          // 非地图页再额外预留 80px（桌面端 footer 高度），移动端无影响
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

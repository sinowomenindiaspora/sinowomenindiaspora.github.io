import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  Box,
  Container,
  useMediaQuery,
  useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const requiresTransparent = location.pathname === '/archive'
  const isAction = location.pathname === '/action' || location.pathname.startsWith('/action/');
  const isResources = location.pathname === '/resources' || location.pathname.startsWith('/resources');
  const isAbout = location.pathname === '/about';
  const overlayHeight = (isAction || isResources || isAbout) ? '30vh' : '20vh';
  const requiresNoHeader = location.pathname === '/';

  const menuItems = [
    { text: '写故事', link: '/map' },
    { text: '故事档案', link: '/archive' },
    { text: '行动', link: '/action' },
    { text: '工具箱', link: '/resources' },
    { text: '关于我们', link: '/about' }
  ];

  return (
    <>
  {location.pathname !== '/archive' && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
    height: overlayHeight,
            background:
              'linear-gradient(to bottom, rgba(255, 107, 157, 0.5) 0%, transparent 100%)',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
      )}

      <AppBar
        position="fixed"
        sx={{
          background: requiresTransparent
            ? 'transparent'
            : 'linear-gradient(to bottom,rgba(255, 0, 93, 0.80),rgba(253, 68, 77, 0.49), transparent)',
          backdropFilter: requiresTransparent ? 'none' : 'blur(10px)',
          color: 'red',
          boxShadow: 'none',
          zIndex: 1100,
          height: '10vh'
        }}
      >
        <Container maxWidth={false}>
          <Toolbar
            sx={{
              position: 'relative',
              padding: { xs: '0 16px', md: '0 24px' },
              justifyContent: 'center'
            }}
          >
            {!requiresNoHeader && (
              <Typography
                variant="h2"
                component={Link}
                to="/"
                sx={{
                  textDecoration: 'none',
                  color: '#000',
                  fontFamily: 'balloon',
                  lineHeight: '0.8',
                  fontSize: isMobile? { xs: '1.8em', md: '1.8em' }:{ xs: '2.4em', md: '2.4em' },
                  textTransform: 'uppercase',
                  textAlign: 'center'
                }}
              >
                Archive of Sino<br />
                Women in Diaspora
              </Typography>
            )}

            <IconButton
              aria-label="open menu"
              onClick={() => setDrawerOpen(true)}
              sx={{
                position: 'absolute',
                left: 6,
                display: { xs: 'inline-flex', md: 'none' },
                color: 'grey'
              }}
            >
              <MenuIcon sx={{ color: '#000' }} />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="top"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        slotProps={{
          paper: {
            sx: {
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0,0,0,0.15)',
              backdropFilter: 'blur(10px)',
              color: '#fff',
              display: { xs: 'flex', md: 'none' },
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              pt: '12vh',
              boxShadow: 'none'
            }
          }
        }}
      >
        <IconButton
          aria-label="close menu"
          onClick={() => setDrawerOpen(false)}
          sx={{ position: 'absolute', top: 12, right: 12, color: '#fff' }}
        >
          <CloseIcon />
        </IconButton>
        <Typography
          variant="h2"
          component={Link}
          to="/"
          sx={{
            textDecoration: 'none',
            color: 'rgba(199, 199, 199, 1)',
            fontFamily: 'balloon',
            fontSize: { xs: '2rem' },
            marginBottom: 3,
            textTransform: 'uppercase',
            textAlign: 'center'
          }}
        >
          Archive of Sino<br />
          Women in Diaspora
        </Typography>
        {menuItems.map((item) => (
          <Typography
            key={item.link}
            onClick={() => {
              navigate(item.link);
              setDrawerOpen(false);
            }}
            sx={{
              fontSize: '1.3rem',
              my: 2.5,
              color: '#fff',
              cursor: 'pointer',
              fontFamily: 'SimHei, sans-serif',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            {item.text}
          </Typography>
        ))}
      </Drawer>

      {/* footer（仅桌面端显示） */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          width: '100%',
          padding: 3,
          display: { xs: 'none', md: 'flex' },
          justifyContent: 'center',
          gap: { xs: 3, md: 6 },
          backdropFilter: requiresTransparent ? 'none' : 'blur(30px)'
        }}
      >
        {menuItems.map((item) => (
          <Typography
            key={item.link}
            onClick={() => navigate(item.link)}
            sx={{
              fontSize: { xs: '1rem', md: '1.2rem' },
              color: '#000',
              cursor: 'pointer',
              fontFamily: 'SimHei, sans-serif',
              fontWeight: location.pathname === item.link ? 'bold' : 'normal',
              transition: 'font-weight 0.2s ease',
              '&:hover': {
                fontWeight: 'bold'
              }
            }}
          >
            {item.text}
          </Typography>
        ))}
      </Box>
    </>
  );
}

export default Header;

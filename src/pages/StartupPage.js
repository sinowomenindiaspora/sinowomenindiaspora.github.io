import React from 'react';
import { Box, Typography, useMediaQuery, useTheme, } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import backgroundImage from '../assets/images/background.png';
import styled, { keyframes } from 'styled-components';
import markerIcon from '../assets/map_marker/regular-marker.png';


const floatUp = keyframes`
  0% { transform: translateY(calc(100vh + 160px)); opacity: 1; }
  50% { transform: translateY(40vh); opacity: 1; }
  100% { transform: translateY(-220px); opacity: 1; }
`;

const wobble = keyframes`
  0%, 100% { transform: translateX(20px); }
  25% { transform: translateX(5px); }
  50% { transform: translateX(10px); }
  75% { transform: translateX(10px); }
`;

// Raise z-index so balloons are not covered by gradient
const BalloonsLayer = styled('div')`
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 80vh !important;
  pointer-events: none;
  z-index: 3;
`;

const FloatingBalloon = styled(Box)`
  position: relative;
  left: 5%;
  bottom: -150px;
  width: ${props => props.width}px;
  height: ${props => Math.round(props.height)}px;
  animation: ${floatUp} ${props => props.duration}s linear infinite;
  animation-delay: ${props => props.delay}s; /* negative delay = start mid-animation */
  will-change: transform;
`;

const BalloonRow = styled(Box)`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  height: 100%;
  animation: ${wobble} ${props => props.wobbleduration}s ease-in-out infinite;
`;

const BalloonPic = styled('img')`
  width: 64px;
  height: 92px;
  object-fit: contain;
  filter: drop-shadow(0 6px 10px rgba(0,0,0,0.18));
`;

const TextBox = styled(Box)`
  border-radius: 10px;
  padding: 8px 10px;
  color: #000;
  max-width: 210px;
`;

const TitleText = styled(Typography)`
  font-weight: 800 !important;
  font-size: 0.95rem !important;
  line-height: 1.2 !important;
  margin-bottom: 4px !important;
`;

const StoryText = styled(Typography)`
  font-size: 0.6rem !important;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

function StartupPage({ supabase }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // fetch recent stories for balloons
  const [stories, setStories] = React.useState([]);
  React.useEffect(() => {
    const fetchStories = async () => {
      try {
        if (!supabase) return;
        const limit = isMobile ? 8 : 12;
        const { data, error } = await supabase
          .from('submissions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);
        if (error) throw error;
        setStories(data || []);
      } catch (e) {
        console.error('加载故事失败:', e);
      }
    };
    fetchStories();
  }, [supabase, isMobile]);

  // compute spaced positions with slight horizontal overflow allowed
  const [balloons, setBalloons] = React.useState([]);
  React.useEffect(() => {
    const createBalloons = () => {
      const vw = Math.max(window.innerWidth, 360);
      const count = Math.min(stories.length || (isMobile ? 8 : 12), isMobile ? 8 : 12);
      const width = isMobile ? 240 : 260; // 气球整体宽度（图+文本）
      const height = isMobile ? 110 : 120;
      const overflow = Math.round(width * 0.6); // 允许左右溢出
      const minX = -overflow;
      const maxX = vw + overflow - width; // 以左边界计
      const margin = 28; // 额外间距，避免贴边

      const intervals = []; // 已占用区间 [start, end]
      const xs = [];

      const intersects = (x) => intervals.some(([s, e]) => !(x + width + margin <= s || x >= e + margin));

      const tryPlace = () => {
        for (let t = 0; t < 400; t++) {
          const x = Math.floor(minX + Math.random(10) * (maxX - minX));
          if (!intersects(x)) {
            intervals.push([x, x + width]);
            return x;
          }
        }
        // 退化为等分
        const idx = xs.length;
        const span = (maxX - minX) / Math.max(count, 1);
        const x = Math.floor(minX + idx * span + span / 2 - width / 2);
        intervals.push([x, x + width]);
        return x;
      };

      for (let i = 0; i < count; i++) xs.push(tryPlace());

      const items = xs.map((x) => {
        const duration = 24 + Math.random() * 14; // 24-38s
        const wobbleduration = 5 + Math.random() * 4; // 5-9s
        const delay = -Math.random() * duration;
        return { startX: x, width, height, duration, wobbleduration, delay };
      });
      setBalloons(items);
    };
    createBalloons();
    const onResize = () => createBalloons();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isMobile, stories.length]);

  const menuItems = [
    { label: '写故事', path: '/map' },
    { label: '故事档案', path: '/archive' },
    { label: '行动', path: '/action' },
    { label: '工具箱', path: '/resources' },
    { label: '关于我们', path: '/about' }
  ];

  const gradientHeight = isMobile ? '20vh' : '35vh';
  const titleTop = isMobile ? '13vh' : '18vh';

  return (
    <Box sx={{ minHeight: '100vh', width: '100vw', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: gradientHeight, background: 'linear-gradient(to bottom, rgba(255, 0, 94, 1) 0%, transparent 100%)', zIndex: 2 }} />

      {/* Balloons layer above gradient */}
      <BalloonsLayer>
        {balloons.map((b, idx) => {
          const s = stories[idx % Math.max(stories.length, 1)] || {};
          const title = s.here_happened;
          const text = (s.description||'').slice(0, 110);
          return (
            <FloatingBalloon key={idx} startx={b.startX} width={b.width} height={b.height} duration={b.duration} delay={b.delay}>
              <BalloonRow wobbleduration={b.wobbleduration}>
                <BalloonPic src={markerIcon} alt="balloon" />
                <TextBox>
                  <TitleText variant="subtitle2">{title}</TitleText>
                  <StoryText>{text}</StoryText>
                </TextBox>
              </BalloonRow>
            </FloatingBalloon>
          );
        })}
      </BalloonsLayer>

      {/* Background image */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', zIndex: 1 }} />

      {/* Title above balloons */}
      <Box sx={{ position: 'absolute', top: titleTop, left: '50%', transform: 'translate(-50%, -10%)', zIndex: 4, textAlign: 'center' }}>
        <Typography sx={{ fontFamily: 'balloon', fontSize: isMobile? '2.5rem':'4.5em', fontWeight: '400', color: '#000', textTransform: 'uppercase', lineHeight: 1.1, textAlign: 'center' }}>
          Archive of Sino Women in
          Diaspora
        </Typography>
      </Box>

      <Box sx={{ position: 'absolute', bottom: '30vh', right: '50vh', zIndex: 4 }}>
        <Typography sx={{ fontSize: '1rem', color: '#000', fontFamily: 'SimHei, sans-serif' }}>记录即反抗</Typography>
      </Box>

      {/* Bottom menu - 桌面端显示，移动端隐藏 */}
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 4, width: '100%', padding: 3, display: { xs: 'none', md: 'flex' }, justifyContent: 'center', gap: { xs: 3, md: 6 } }}>
        {menuItems.map((item, index) => (
          <Typography key={index} onClick={() => navigate(item.path)} sx={{ fontSize: { xs: '1rem', md: '1.2rem' }, color: '#000', cursor: 'pointer', fontFamily: 'SimHei, sans-serif', fontWeight: location.pathname === item.path ? 'bold' : 'normal', transition: 'font-weight 0.2s ease', '&:hover': { fontWeight: 'bold' } }}>
            {item.label}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

export default StartupPage;

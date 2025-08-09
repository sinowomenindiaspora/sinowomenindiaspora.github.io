import React, { useEffect, useState } from 'react';
import { Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import markerIcon from '../assets/map_marker/regular-marker.png';


// 气球在footer和header之间浮动
const floatUp = keyframes`
  0% {
    transform: translateY(calc(100vh - 120px)) translateX(0px);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  25% {
    transform: translateY(calc(75vh - 90px)) translateX(20px);
    opacity: 1;
  }
  50% {
    transform: translateY(calc(50vh - 60px)) translateX(-30px);
    opacity: 1;
  }
  75% {
    transform: translateY(calc(25vh - 30px)) translateX(15px);
    opacity: 1;
  }
  90% {
    transform: translateY(120px) translateX(-10px);
    opacity: 1;
  }
  100% {
    transform: translateY(100px) translateX(-10px);
    opacity: 0;
  }
`;

const wobble = keyframes`
  0%, 100% { transform: translateX(0px); }
  20% { transform: translateX(8px); }
  40% { transform: translateX(-12px); }
  60% { transform: translateX(15px); }
  80% { transform: translateX(-6px); }
`;

const ArchiveContainer = styled(Box)(() => ({
  position: 'relative',
  width: '100vw',
  height: '100vh',
  overflow: 'hidden',
  background: 'linear-gradient(0deg, transparent, rgba(255, 0, 94, 1) 50%, rgba(253, 68, 77, 1))',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  fontFamily: 'Inter, sans-serif'
}));

const FloatingBalloon = styled(Box)`
  position: fixed;
  left: ${props => props.startX}px;
  top: 0;
  width: 250px;
  height: 90px;
  opacity: 0;
  transform: translateY(calc(100vh - 120px)) translateX(${props => props.randomOffset}px);
  animation: ${floatUp} ${props => props.duration}s linear infinite;
  animation-delay: ${props => props.delay}s;
  animation-fill-mode: both;
  cursor: pointer;
  z-index: 10;

  &:hover {
    animation-play-state: paused;
    transform: scale(1.05) translateX(${props => props.randomOffset}px);
  }
`;

const BalloonContent = styled(Box)`
  display: flex;
  align-items: flex-start;
  width: 100%;
  height: 100%;
  animation: ${wobble} ${props => props.wobbleDuration}s ease-in-out infinite;
`;

const BalloonIcon = styled.img`
  width: 80px;
  height: 120px;
  margin-right: 0px;
`;

const TextContainer = styled(Box)`
  background: transparent;
  border-radius: 12px;
  padding: 8px 12px;
  flex: 1;
`;

const PlaceText = styled(Typography)`
  font-family: 'Inter', sans-serif;
  font-size: 1.5em;
  font-weight: bold;
  color: #000;
  margin-bottom: 5px;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 1.4em;
  }
`;

const StoryText = styled(Typography)`
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #000;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

// 页面标题组件
const PageTitle = styled(Typography)`
  font-family: 'balloon';
  font-size: 3rem;
  color: #000;
  text-align: center;
  line-height: 1;
  position: fixed;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateX(-50%) scale(1.05);
  }

  @media (max-width: 768px) {
    font-size: 1.8rem;
    top: 20px;
  }
`;



function StoryArchive({ supabase }) {
  const [stories, setStories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        if (data && data.length > 0) {
          console.log('Stories loaded:', data.length);
          setStories(data);
        } else {
          console.log('No stories found');
        }
      } catch (err) {
        console.error('获取故事失败:', err);
      }
    };

    if (supabase) {
      fetchStories();
    }
  }, [supabase]);

  const handleBalloonClick = (story) => {
    navigate(`/incident?id=${story.id}`);
  };

  const generateBalloonProps = (index) => ({
    startX: Math.random() * (window.innerWidth - 250) + 50,
    duration: 25 + Math.random() * 15,
    delay: index * 4 + Math.random() * 2,
    drift: (Math.random() - 0.5) * 150,
    wobbleDuration: 6 + Math.random() * 4,
    randomOffset: (Math.random() - 0.5) * 100
  });

  const displayStories = stories.slice(0, 6)

  return (
    <ArchiveContainer>

      {displayStories.map((story, index) => {
        const props = generateBalloonProps(index);
        return (
          <FloatingBalloon
            key={`${story.id}-${index}`}
            startX={props.startX}
            duration={props.duration}
            delay={props.delay}
            drift={props.drift}
            randomOffset={props.randomOffset}
            onClick={() => handleBalloonClick(story)}
          >
            <BalloonContent wobbleDuration={props.wobbleDuration}>
              <BalloonIcon src={markerIcon} style={{width:80, height:80}} alt="marker" />
              <TextContainer>
                <PlaceText>
                  {story.region || story.here_happened || 'unknown'}
                </PlaceText>
                <StoryText>
                  {story.description || story.story || ''}
                </StoryText>
              </TextContainer>
            </BalloonContent>
          </FloatingBalloon>
        );
      })}
    </ArchiveContainer>
  );
}

export default StoryArchive;
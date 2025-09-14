import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import backgroundImage from '../assets/images/background.png';
import arrowLeft from '../assets/images/arrow_left.png';
import arrowRight from '../assets/images/arrow_right.png';

// Styled components
const ActionContainer = styled(Box)`
  position: relative;
  width: 100vw;
  min-height: 100vh;
  background-image: url(${backgroundImage});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  font-family: 'Avenir', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  padding-top: 80px;
`;

const ShowcaseContainer = styled(Box)`
  position: relative;
  width: 100%;
  min-height: 80vh;
  display: grid;
  grid-template-columns: 60px 1fr 60px;
  align-items: center; 
  justify-items: center;
  padding: 0 12px;

  @media (max-width: 768px) {
    grid-template-columns: 48px 1fr 48px;
  }
`;

const ContentBox = styled(Box)`
  grid-column: 2;
  position: relative;
  z-index: 2;
  text-align: center;
  color: black;
  max-width: 600px;
  padding: 20px;
`;


const ArrowButton = styled(IconButton)`
  && {                      /* 提升优先级，避免被 MUI 默认样式覆盖 */
    width: 60px;
    height: 60px;
    z-index: 10;
  }

  &.left { 
    grid-column: 1; 
    justify-self: start; 
  }
  &.right { 
    grid-column: 3; 
    justify-self: end; 
  }

  img {
    width: 40px;
    height: 40px;
    filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
  }

  @media (max-width: 768px) {
    && {
      width: 50px;
      height: 50px;
    }
    img { width: 30px; height: 30px; }
  }
`;

const DateText = styled(Typography)`
  font-family: 'Avenir', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 10px;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;


const TitleText = styled(Typography)`
  font-family: 'Avenir', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 15px;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const PreviewText = styled(Typography)`
  font-family: 'Avenir', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  font-size: 1.8rem;
  line-height: 1.6;
  max-width: 500px;
  margin: 0 auto;

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const ClickableArea = styled(Box)`
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.02);
  }
`;

const GridContainer = styled(Box)`
  width: 100%;
  padding: 40px 20px 120px;
  margin-top: 40px;
`;

const GridHeader = styled(Box)`
  text-align: left;
  margin-bottom: 40px;
  margin-left:8vw;
`;

const GridTitle = styled(Typography)`
  font-size: 3em !important;
  font-weight: bold;
  color: rgba(255, 0, 94, 1);
  margin-bottom: 20px;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;


const ActionGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
  }
`;

const ActionCard = styled(Box)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);

  &:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.15);
  }
`;

const CardImage = styled(Box)`
  width: 100%;
  height: 180px;
  background-size: cover;
  background-position: center;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CardContentArea = styled(Box)`
  padding: 20px;
  color: white;
`;

const CardDate = styled(Typography)`
  font-family: 'Avenir', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
`;

const CardTitle = styled(Typography)`
  font-family: 'Avenir', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 10px;
  line-height: 1.3;
`;

const CardPreview = styled(Typography)`
  font-family: 'Avenir', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  font-size: 0.95rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.8);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

function Action() {
  const [actions, setActions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    try {
      // 从manifest文件读取所有可用的actions文件夹
    let actionFolders = [];

    const manifestResponse = await fetch('/actions/manifest.json');
    if (manifestResponse.ok) {
      const manifest = await manifestResponse.json();
      actionFolders = manifest.folders.sort().reverse(); // 按日期倒序排列
    } else {
      throw new Error('Manifest file not found');
    }


      const actionsData = await Promise.all(
        actionFolders.map(async (folderId) => {
          try {
            const filename = `${folderId}.md`;
            const response = await fetch(`/actions/${folderId}/${filename}`);
            if (!response.ok) {
              throw new Error(`Failed to fetch ${folderId}.md`);
            }
            const text = await response.text();

            // 解析markdown内容
            const lines = text.split('\n').filter(line => line.trim());
            const title = lines[0]?.replace(/^#\s*/, '') || folderId;
            const preview = lines.slice(1).join(' ').substring(0, 100) + (lines.slice(1).join(' ').length > 100 ? '...' : '');

            // 从文件夹名解析日期
            const dateMatch = folderId.match(/(\d{4})(\d{2})(\d{2})/);
            let date = folderId;
            if (dateMatch) {
              const [, year, month, day] = dateMatch;
              date = `${year}年${month}月${day}日`;
            }

            // 检查是否有封面图片
            let coverImage = null;
            try {
              const pngResponse = await fetch(`/actions/${folderId}/cover.png`);
              if (pngResponse.ok) {
                coverImage = `/actions/${folderId}/cover.png`;
              } else {
                // 尝试加载 cover.jpg
                const jpgResponse = await fetch(`/actions/${folderId}/cover.jpg`);
                if (jpgResponse.ok) {
                  coverImage = `/actions/${folderId}/cover.jpg`;
                }
              }
            } catch (error) {
              // 如果没有封面图片，使用默认背景
              console.log(`No cover image found for ${folderId}, using default background`);
            }

            // 如果没有找到封面图片，使用默认背景
            if (!coverImage) {
              coverImage = backgroundImage;
            }

            return {
              folderId,
              filename: `${folderId}.md`,
              date,
              title,
              preview,
              content: text,
              coverImage
            };
          } catch (error) {
            console.error(`Error loading ${folderId}:`, error);
            return null;
          }
        })
      );

      const validActions = actionsData
        .filter(action => action !== null)
        .sort((a, b) => b.folderId.localeCompare(a.folderId));

      setActions(validActions);
    } catch (error) {
      console.error('Error loading actions:', error);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : carouselActions.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < carouselActions.length - 1 ? prev + 1 : 0));
  };

  const handleActionClick = (action = null) => {
    const targetAction = action || actions[currentIndex];
    if (targetAction) {
      navigate(`/action/${targetAction.folderId}`);
    }
  };


  const carouselActions = actions.slice(0, 5);

  if (actions.length === 0) {
    return (
      <ActionContainer>
        <ShowcaseContainer>
          <ContentBox>
            <Typography variant="h4">加载中...</Typography>
          </ContentBox>
        </ShowcaseContainer>
      </ActionContainer>
    );
  }

  const currentAction = carouselActions[currentIndex];

  return (
    <ActionContainer>
      <ShowcaseContainer>
        {carouselActions.length > 1 && (
          <ArrowButton className="left" onClick={handlePrevious}>
            <img src={arrowLeft} style={{height:140}} alt="Previous" />
          </ArrowButton>
        )}

        <ClickableArea onClick={() => handleActionClick()}>
          <ContentBox style={{width:"68vw", alignItems:'center', justifyContent: 'center'}}>
            <DateText variant="h2">
              {currentAction.date}
            </DateText>
            <TitleText variant="h3">
              {currentAction.title}
            </TitleText>
            <PreviewText variant="body1">
              {currentAction.preview}
            </PreviewText>
          </ContentBox>
        </ClickableArea>

        {carouselActions.length > 1 && (
          <ArrowButton className="right" onClick={handleNext}>
            <img src={arrowRight} style={{height:140}} alt="Next" />
          </ArrowButton>
        )}
      </ShowcaseContainer>


      {/* 网格视图 */}
      <GridContainer>
          <GridHeader>
            <GridTitle>所有活动</GridTitle>
          </GridHeader>

          <ActionGrid>
            {actions.map((action) => (
              <ActionCard key={action.folderId} onClick={() => handleActionClick(action)}>
                <CardImage>
                  <img
                    src={action.coverImage || backgroundImage}
                    alt={action.title}
                    onError={(e) => {
                      e.target.src = backgroundImage;
                    }}
                  />
                </CardImage>
                <CardContentArea>
                  <CardDate>{action.date}</CardDate>
                  <CardTitle>{action.title}</CardTitle>
                  <CardPreview>{action.preview}</CardPreview>
                </CardContentArea>
              </ActionCard>
            ))}
          </ActionGrid>
        </GridContainer>
    </ActionContainer>
  );
}

export default Action;
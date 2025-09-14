import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, IconButton, Container } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import backgroundImage from '../assets/images/background.png';
import { ArrowBackIos } from '@mui/icons-material';

// Styled components
const ArticleContainer = styled(Box)`
  position: relative;
  min-height: 100vh;
  background-image: url(${backgroundImage});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding-top: 20vh;
  padding-bottom: 10vh;
  font-family: 'Avenir', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
`;

const GradientOverlay = styled(Box)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40vh; /* 渐变覆盖延长到全屏的40% */
  background: linear-gradient(to bottom, rgba(255, 107, 157, 0.6) 0%, rgba(253, 68, 77, 0.4) 50%, transparent 100%);
  z-index: 1;
  pointer-events: none;
`;

const ContentWrapper = styled(Container)`
  position: relative;
  z-index: 2;
  max-width: 800px;
  padding: 40px;
  margin: 20px auto;

  @media (max-width: 768px) {
    margin: 10px;
    padding: 20px;
  }
`;

const BackButton = styled(IconButton)`
  position: absolute;
  top: 10vh;
  left: 20px;
  z-index: 3;
  background: transparent !important;
  color: #000;
  padding: 0;

  &:hover {
    background: transparent !important;
    transform: translateX(-2px);
  }

  &:focus {
    background: transparent !important;
  }

  &::before {
    display: none;
  }

  .MuiTouchRipple-root {
    display: none;
  }

  @media (max-width: 768px) {
    left: 15px;
  }
`;

const DateHeader = styled(Typography)`
  font-family: 'Avenir', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  color: #000;
  font-size: 1.2rem;
  margin-bottom: 8px;
  font-weight: 500;
`;

const TitleHeader = styled(Typography)`
  font-family: 'Avenir', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  color: #000;
  font-size: 4rem;
  font-weight: bold;
  margin-bottom: 30px;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 2.2rem;
    margin-bottom: 20px;
  }
`;

const MarkdownContent = styled(Box)`
  font-family: 'Inter', 'Avenir', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  color: #000;
  line-height: 1.4;

  img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 16px 0;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  pre {
    background: rgba(0,0,0,0.05);
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
  }

  /* 引用样式 */
  blockquote {
    border-left: 4px solid #ccc;
    margin: 16px 0;
    padding-left: 16px;
    font-style: italic;
  }

  @media (max-width: 768px) {
    font-size: 0.9rem;
    line-height: 1.6;
  }
`;

const LoadingContainer = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
`;

function ActionArticle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadArticle();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadArticle = async () => {
    try {
      setLoading(true);

      // 从新的文件夹结构读取markdown文件：actions/yyyymmdd/yyyymmdd.md
      const filename = `${id}.md`;
      const response = await fetch(`/actions/${id}/${filename}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${id}.md`);
      }

      const text = await response.text();

      // 解析markdown内容
      const lines = text.split('\n').filter(line => line.trim());
      const title = lines[0]?.replace(/^#\s*/, '') || id;
      const content = lines.slice(1).join('\n').trim();

      // 从文件夹名解析日期
      const dateMatch = id.match(/(\d{4})(\d{2})(\d{2})/);
      let date = id;
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        date = `${year}年${month}月${day}日`;
      }

      setArticle({
        date,
        title,
        content
      });

    } catch (error) {
      console.error('Error loading article:', error);
      setError('文章加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/action');
  };

  if (loading) {
    return (
      <ArticleContainer>
        <LoadingContainer>
          <Typography variant="h5">加载中...</Typography>
        </LoadingContainer>
      </ArticleContainer>
    );
  }

  if (error || !article) {
    return (
      <ArticleContainer>
        <BackButton onClick={handleBack}>
          <ArrowBackIcon />
        </BackButton>
        <LoadingContainer>
          <Typography variant="h5" color="error">
            {error || '文章未找到'}
          </Typography>
        </LoadingContainer>
      </ArticleContainer>
    );
  }

  return (
    <ArticleContainer>
      <GradientOverlay />
      <BackButton onClick={handleBack}>
        <ArrowBackIos fontSize='large' />
      </BackButton>

      <ContentWrapper>
        <DateHeader variant="h6">
          {article.date}
        </DateHeader>

        <TitleHeader variant="h1">
          {article.title}
        </TitleHeader>

        <MarkdownContent>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({ node, ...props }) => (
                <img
                  {...props}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: '8px',
                    margin: '16px 0'
                  }}
                  src={props.src?.startsWith('/') ? props.src : `/actions/${id}/${props.src}`}
                />
              ),
              p: ({ children }) => (
                <Typography variant="body1" sx={{
                  fontFamily: 'Avenir, Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
                  fontSize: '1.1rem',
                  lineHeight: 1.8,
                  color: '#000',
                  marginBottom: '16px'
                }}>
                  {children}
                </Typography>
              ),
              h1: ({ children }) => (
                <Typography variant="h4" sx={{
                  fontFamily: 'Avenir, Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
                  fontWeight: 'bold',
                  color: '#000',
                  margin: '24px 0 16px 0'
                }}>
                  {children}
                </Typography>
              ),
              h2: ({ children }) => (
                <Typography variant="h5" sx={{
                  fontFamily: 'Avenir, Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
                  fontWeight: 'bold',
                  color: '#000',
                  margin: '20px 0 12px 0'
                }}>
                  {children}
                </Typography>
              ),
              h3: ({ children }) => (
                <Typography variant="h6" sx={{
                  fontFamily: 'Avenir, Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
                  fontWeight: 'bold',
                  color: '#000',
                  margin: '16px 0 8px 0'
                }}>
                  {children}
                </Typography>
              )
            }}
          >
            {article.content}
          </ReactMarkdown>
        </MarkdownContent>
      </ContentWrapper>
    </ArticleContainer>
  );
}

export default ActionArticle;

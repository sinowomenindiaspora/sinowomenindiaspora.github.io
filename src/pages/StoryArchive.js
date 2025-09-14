import React, { useEffect, useState } from 'react';
import { Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import archiveAsset from '../assets/images/archive_asset.png';

// Grid layout containers
const ArchiveContainer = styled(Box)`
  position: relative;
  width: 100vw;
  min-height: 100vh;
  padding: 100px 24px 120px;
  font-family: 'Inter', sans-serif;
  background: linear-gradient(
    to bottom,
    #FF005E 5%,
    #FD444D 20%,
    #e9e9e9 100%
  );
`;

const PatternOverlay = styled(Box)`
  position: absolute;
  inset: 0;
  background-image: url(${archiveAsset});
  background-repeat: repeat;
  background-position: top left;
  background-size: auto;
  opacity: 0.8;
  pointer-events: none;
  z-index: 1;
`;

const ContentWrap = styled(Box)`
  position: relative;
  z-index: 2;
`;

const TopBar = styled(Box)`
  position: sticky;
  top: 64px;
  z-index: 5;
  display: flex;
  gap: 12px;
  align-items: center;
  margin: 0 auto 24px;
  max-width: 1200px;
`;

const SortChip = styled(Box)`
  background: #000000;
  color: #ffffff;
  border: 1px solid rgba(0,0,0,0.2);
  border-radius: 999px;
  padding: 6px 12px;
  font-weight: 600;
  user-select: none;
`;

const Grid = styled(Box)`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled(Box)`
  background: transparent;
  border-radius: 16px;
  padding: 13px;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-4px);
    border: 1px solid rgba(0,0,0,0.1);
    background: rgba(255,255,255,0.7);
    box-shadow: 0 10px 24px rgba(0,0,0,0.08);
  }
`;

const PlaceTitle = styled(Typography)`
  font-weight: 800 !important;
  font-size: 1.05rem !important;
  color: #000;
  margin-bottom: 8px !important;
`;

const Desc = styled(Typography)`
  font-size: 0.9rem;
  line-height: 1.4;
  color: #111;
  white-space: pre-wrap;
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

function StoryArchive({ supabase }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [asc, setAsc] = useState(false); // 按时间排序，默认最新在前
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStories = async () => {
      try {
        if (!supabase) return;
        setLoading(true);
        const { data, error } = await supabase
          .from('submissions')
          .select('*')
          .order('created_at', { ascending: asc })
          .limit(120);
        if (error) throw error;
        setStories(data || []);
      } catch (err) {
        console.error('获取故事失败:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, [supabase, asc]);

  const handleOpen = (story) => navigate(`/incident?id=${story.id}`);

  return (
    <ArchiveContainer>
      <PatternOverlay />
      <ContentWrap>
        <TopBar>
          <SortChip onClick={() => setAsc(p => !p)}>
            时间排序 {asc ? '↑' : '↓'} {loading ? '· 加载中' : ''}
          </SortChip>
        </TopBar>

        <Grid>
          {stories.map(s => {
            const place = s.region || s.here_happened || 'unknown';
            const raw = s.description || s.story || '';
            const text = String(raw).replace(/\n{2,}/g, '\n').trim();
            return (
              <Card key={s.id} onClick={() => handleOpen(s)}>
                <PlaceTitle>{place}</PlaceTitle>
                <Desc variant="body2">{text}</Desc>
              </Card>
            );
          })}
        </Grid>
      </ContentWrap>
    </ArchiveContainer>
  );
}

export default StoryArchive;
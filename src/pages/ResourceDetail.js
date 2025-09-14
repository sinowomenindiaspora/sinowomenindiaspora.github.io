import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  Button,
  TextField,
  CircularProgress,
} from '@mui/material';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// Fix leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function ResourceDetail({ supabase }) {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const type = searchParams.get('type'); // 'space' or 'resource'
  
  const [item, setItem] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchItemDetails = useCallback(async () => {
    if (!id || !type) {
      setLoading(false);
      return;
    }

    try {
      const tableName = type === 'space' ? 'spaces' : 'resources';
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setItem({ ...data, itemType: type });
    } catch (err) {
      console.error('获取详情失败:', err);
    } finally {
      setLoading(false);
    }
  }, [id, type, supabase]);

  useEffect(() => {
    fetchItemDetails();
  }, [fetchItemDetails]);

  useEffect(() => {
    const fetchComments = async () => {
      if (!id || !type) return;
      
      try {
        const commentsTable = type === 'space' ? 'spaces_comments' : 'resources_comments';
        const foreignKey = type === 'space' ? 'spaces_id' : 'resources_id';
        
        const { data, error } = await supabase
          .from(commentsTable)
          .select('*')
          .eq(foreignKey, id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setComments(data || []);
      } catch (err) {
        console.error('获取评论失败:', err);
      }
    };

    fetchComments();
  }, [id, type, supabase]);

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !id || !type) return;
    
    setSubmitting(true);
    try {
      const commentsTable = type === 'space' ? 'spaces_comments' : 'resources_comments';
      const foreignKey = type === 'space' ? 'space_id' : 'resource_id';
      
      const commentData = {
        [foreignKey]: id,
        body: commentText
      };
      
      const { error } = await supabase
        .from(commentsTable)
        .insert([commentData]);
      
      if (error) throw error;
      
      const { data, error: fetchError } = await supabase
        .from(commentsTable)
        .select('*')
        .eq(foreignKey, id)
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      setComments(data || []);
      setCommentText('');
    } catch (err) {
      console.error('提交评论失败:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: zhCN });
    } catch (e) {
      console.error('日期格式化失败:', e);
      return dateString;
    }
  };

  const renderTags = (tagsString) => {
    if (!tagsString) return null;
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    return (
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{
                bgcolor: 'transparent',
                color: 'black',
                outline: '0.5px solid',
                fontSize: '12px',
                height: '24px'
              }}
            />
          ))}
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>加载中...</Typography>
      </Container>
    );
  }

  if (!item) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5">未找到资源</Typography>
        <Button component={Link} to="/resources" variant="contained" sx={{ mt: 2 }}>
          返回资源列表
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', pt: 8, pb: 4 }}>
      <Container maxWidth="md">
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          mb: 3
        }}>
          
          {/* Map Section - Only show for physical spaces */}
          {item.itemType === 'space' && item.lat && item.lng && (
            <Box sx={{
              width: { xs: '100%', md: '30vh' },
              height: { xs: '40vh', md: '30vh' },
              flexShrink: 0
            }}>
              <Paper elevation={1} sx={{ height: '100%', overflow: 'hidden', borderRadius: '8px' }}>
                <MapContainer
                  center={[item.lat, item.lng]}
                  zoom={10}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={true}
                  scrollWheelZoom={false}
                  dragging={true}
                  touchZoom={false}
                  doubleClickZoom={false}
                >
                  <TileLayer
                    url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
                  />
                  <Marker
                    position={[item.lat, item.lng]}
                    icon={new L.Icon({
                      iconUrl: require('../assets/map_marker/resource-marker.png'),
                      iconSize: [70, 70],
                      iconAnchor: [20, 60]
                    })}
                  />
                </MapContainer>
              </Paper>
            </Box>
          )}

          <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography
                variant="h5"
                sx={{
                  mb: 1,
                  fontWeight: 'bold',
                  fontSize: '2em',
                  lineHeight: 1.3
                }}
              >
                {item.name}
              </Typography>
              <Chip 
                label={item.itemType === 'space' ? '友好空间' : item.type} 
                sx={{
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  color: '#000',
                  fontSize: '0.8rem'
                }}
              />
            </Box>

            {/* Tags */}
            {renderTags(item.tags)}

            {/* Content */}
            <Paper elevation={0} sx={{ p: 0, mb: 3, bgcolor: 'transparent' }}>
              {/* Contact Information */}
              <Box sx={{ mb: 2 }}>
                {item.itemType === 'space' ? (
                  <>
                    <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem', mb: 1 }}>
                      <strong>地址:</strong> {item.address}
                    </Typography>
                    {item.contact_phone && (
                      <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem', mb: 1 }}>
                        <strong>电话:</strong> {item.contact_phone}
                      </Typography>
                    )}
                    {item.email && (
                      <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem', mb: 1 }}>
                        <strong>邮箱:</strong> {item.email}
                      </Typography>
                    )}
                  </>
                ) : (
                  <>
                    {item.email && (
                      <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem', mb: 1 }}>
                        <strong>邮箱:</strong> {item.email}
                      </Typography>
                    )}
                    {item.site && (
                      <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem', mb: 1 }}>
                        <strong>网站:</strong> <a href={item.site} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>{item.site}</a>
                      </Typography>
                    )}
                    {item.instagram && (
                      <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem', mb: 1 }}>
                        <strong>Instagram:</strong> <a href={`https://instagram.com/${item.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>{item.instagram}</a>
                      </Typography>
                    )}
                  </>
                )}
              </Box>

              {/* Description */}
              {(item.description || item.additional_note) && (
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '14px',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line',
                    color: '#333',
                    mt: 2
                  }}
                >
                  {item.description || item.additional_note}
                </Typography>
              )}
            </Paper>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Button
            component={Link}
            to="/resources"
            sx={{
              borderRadius: '8px',
              color: 'black',
              fontSize: '14px',
              padding: '6px 12px'
            }}
          >
            <span>←</span> 返回资源列表
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* 评论区 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontSize: '1.5em', fontWeight: 'bold' }}>
            留言:
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="分享你的想法和感受..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                fontSize: '14px',
                '& fieldset': {
                  borderColor: '#999',
                },
                '&:hover fieldset': {
                  borderColor: '#999',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#666',
                },
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleSubmitComment}
            disabled={submitting || !commentText.trim()}
            sx={{
              borderRadius: '8px',
              fontSize: '14px',
              bgcolor: '#666',
              '&:hover': {
                bgcolor: '#555',
              }
            }}
          >
            +
          </Button>

          {/* 评论列表 */}
          {comments.length > 0 && (
            <Box sx={{ mt: 3 }}>
              {comments.map((comment) => (
                <Box
                  key={comment.id || comment.created_at}
                  sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: '8px',
                    border: '1px solid #666'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '13px' }}>
                      路人🚶‍♀️
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px' }}>
                      {formatDate(comment.created_at)}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '1rem',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-line',
                      color: '#333'
                    }}
                  >
                    {comment.body}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}

export default ResourceDetail;

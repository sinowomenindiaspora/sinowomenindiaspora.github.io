import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  Dialog,
  DialogContent,
} from '@mui/material';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useIncident } from '../context/IncidentContext';
import { toPng } from 'html-to-image';
import { getAddressFromCoordinates } from '../utils/locationUtils';


function IncidentInfo({ supabase }) {
  const getIdFromUrl = () => {
    const hash = window.location.hash;
    const queryStart = hash.indexOf('?');
    if (queryStart !== -1) {
      const queryString = hash.substring(queryStart + 1);
      const queryParams = new URLSearchParams(queryString);
      const hashId = queryParams.get('id');
      if (hashId) {
        return hashId;
      }
    }
    return null;
  };

  const id = getIdFromUrl();

  const { selectedIncident, setSelectedIncident } = useIncident();
  const [incident, setIncident] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false); 

  const [openReceiptDialog, setOpenReceiptDialog] = useState(false);
  const receiptRef = useRef(null);
  const downloadRef = useRef(null);
  const [locationAddress, setLocationAddress] = useState('');

  // 安全地从localStorage获取数据的函数
  const getStoredIncident = (incidentId) => {
    try {
      const storageKey = `selectedIncident_${incidentId}`;
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        const parsedIncident = JSON.parse(storedData);
        if (parsedIncident.id === incidentId) {
          return parsedIncident;
        }
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    return null;
  };


  const clearStoredIncident = (incidentId) => {
    try {
      const storageKey = `selectedIncident_${incidentId}`;
      localStorage.removeItem(storageKey);
      localStorage.removeItem('selectedIncident');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };
  const fetchIncidentDetails = useCallback(async () => {
    const targetId = id || selectedIncident?.id;

    if (!targetId) {
      setLoading(false);
      return;
    }

    // 从localStorage获取缓存数据
    const storedIncident = getStoredIncident(targetId);
    if (storedIncident) {
      setIncident(storedIncident);
      setSelectedIncident(storedIncident);
      setLoading(false);
      // 清理localStorage以避免内存泄漏
      clearStoredIncident(targetId);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', targetId)
        .single();

      if (error) throw error;
      setIncident(data);
      setSelectedIncident(data);
    } catch (err) {
      console.error('获取事件详情失败:', err);
    } finally {
      setLoading(false);
    }
  }, [id, selectedIncident?.id, supabase, setSelectedIncident]);

  useEffect(() => {
    fetchIncidentDetails();
  }, [fetchIncidentDetails]);

  useEffect(() => {
    const run = async () => {
      try {
        if (incident?.lat && incident?.lng) {
          const addr = await getAddressFromCoordinates(incident.lat, incident.lng);
          if (addr) setLocationAddress(addr);
          else setLocationAddress(`纬度 ${incident.lat?.toFixed?.(4)}, 经度 ${incident.lng?.toFixed?.(4)}`);
        } else {
          setLocationAddress('');
        }
      } catch (e) {
        setLocationAddress(`纬度 ${incident?.lat?.toFixed?.(4) ?? '-'}, 经度 ${incident?.lng?.toFixed?.(4) ?? '-'}`);
      }
    };
    run();
  }, [incident?.lat, incident?.lng]);

  useEffect(() => {
    const fetchComments = async () => {
      if (!id && !selectedIncident?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('submission_id', id || selectedIncident?.id)
          .eq('visible', true)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setComments(data || []);
      } catch (err) {
        console.error('获取评论失败:', err);
      }
    };

    fetchComments();
  }, [id, selectedIncident, supabase]); // Add id to dependency array

  // Update handleSubmitComment to use id from query parameter or selectedIncident.id
  const handleSubmitComment = async () => {
    const submissionId = id || selectedIncident?.id;
    if (!commentText.trim() || !submissionId) return;
    
    setSubmitting(true);
    try {
      const commentData = {
        submission_id: submissionId,
        text: commentText,
        visible: true
      };
      
      const { error } = await supabase
        .from('comments')
        .insert([commentData]);
      
      if (error) throw error;
      
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select('*')
        .eq('submission_id', submissionId)
        .eq('visible', true)
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
  
  const handleOpenReceiptDialog = () => setOpenReceiptDialog(true);
  const handleCloseReceiptDialog = () => setOpenReceiptDialog(false);

  // 根据文字长度计算字体大小
  const getDescriptionFontSize = (text) => {
    if (!text) return '16px';
    const length = text.length;
    if (length <= 280) return '16px';
    
    // 超过280字符时，按比例缩小字体
    const scaleFactor = Math.max(0.6, 280 / length);
    return `${Math.round(16 * scaleFactor)}px`;
  };

  const downloadReceipt = async () => {
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(downloadRef.current, { pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `balloon_${incident?.id ?? 'receipt'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('导出回执失败:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: zhCN });
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>加载中...</Typography>
      </Container>
    );
  }

  if (!incident) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5">未找到事件</Typography>
        <Button component={Link} to="/" variant="contained" sx={{ mt: 2 }}>
          返回地图
        </Button>
      </Container>
    );
  }

  return (
    <div>
            <Box sx={{ minHeight: '100vh', pt: 8, pb: 4 }}>
        <Container maxWidth="md">
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            mb: 3
          }}>
            
        <Box sx={{
          width: { xs: '100%', md: '30vh' },
          height: { xs: '40vh', md: '30vh' },
          flexShrink: 0
        }}>
          <Paper elevation={1} sx={{ height: '100%', overflow: 'hidden', borderRadius: '8px' }}>
            {incident.lat && incident.lng && (
              <MapContainer
                center={[incident.lat, incident.lng]}
                zoom={10}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
                scrollWheelZoom={false}
                dragging={true}
                touchZoom={false}
                doubleClickZoom={false}
              >
                <TileLayer
                        url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"
                />
                <Marker
                  position={[incident.lat, incident.lng]}
                  icon={new L.Icon({
                    iconUrl: require('../assets/map_marker/regular-marker.png'),
                    iconSize: [60, 60],
                    iconAnchor: [20, 32]
                  })}
                />
              </MapContainer>
            )}
          </Paper>
        </Box>

        <Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
            <Typography
              variant="h5"
              sx={{
                mb: 1,
                fontWeight: 'bold',
                fontSize: '2em',
                lineHeight: 1.3
              }}
            >
              {incident.here_happened}
            </Typography>

            {((Array.isArray(incident.violence_type) && incident.violence_type.length > 0) ||
              (incident.scenario && incident.scenario.tags && incident.scenario.tags.length > 0) ||
              (typeof incident.feeling_score === 'number')) && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {/* 暴力类型标签 */}
                  {Array.isArray(incident.violence_type) && incident.violence_type.map((type, idx) => (
                    <Chip
                      key={`violence-${idx}`}
                      label={type}
                      size="small"
                      sx={{
                        bgcolor: 'transparent',
                        color: '#999',
                        fontSize: '12px',
                        height: '24px'
                      }}
                    />
                  ))}

                  {/* 场景标签 */}
                  {incident.scenario && incident.scenario.tags && incident.scenario.tags.map((tag, idx) => (
                    <Chip
                      key={`scenario-${idx}`}
                      label={tag}
                      size="small"
                      sx={{
                        bgcolor: 'transparent',
                        color: 'black',
                        outline:'0.5px solid',
                        fontSize: '12px',
                        height: '24px'
                      }}
                    />
                  ))}

                  {/* 心情/感受标签 */}
                  {typeof incident.feeling_score === 'number' && (
                    <Chip
                      key="feeling"
                      label={`感受：${incident.feeling_score}`}
                      size="small"
                      sx={{
                        bgcolor: 'transparent',
                        color: '#000',
                        outline: '0.5px solid',
                        fontSize: '12px',
                        height: '24px'
                      }}
                    />
                  )}
                </Box>
              </Box>
            )}

                  <Paper elevation={0} sx={{ p: 0, mb: 3, bgcolor: 'transparent' }}>
          <Typography
            variant="body1"
            sx={{
              fontSize: '14px',
              lineHeight: 1.6,
              whiteSpace: 'pre-line',
              color: '#333'
            }}
          >
            {incident.description}
          </Typography>

          {/* 表扬内容 */}
          {incident.scenario && incident.scenario.showPraise && incident.scenario.praise && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#4caf50', fontSize: '14px' }}>
                点名表扬
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f1f8e9', borderRadius: '8px' }}>
                <Typography sx={{ fontSize: '14px' }}>{incident.scenario.praise}</Typography>
              </Paper>
            </Box>
          )}

          {/* 批评内容 */}
          {incident.scenario && incident.scenario.showCriticism && incident.scenario.criticism && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#f44336', fontSize: '14px' }}>
                点名批评
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fbe9e7', borderRadius: '8px' }}>
                <Typography sx={{ fontSize: '14px' }}>{incident.scenario.criticism}</Typography>
              </Paper>
            </Box>
          )}
        </Paper>

        </Box>

      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <Button
            component={Link}
            to="/map"
            sx={{
              borderRadius: '8px',
              color:'black',
              fontSize: '14px',
              padding: '6px 12px'
            }}
          >
            <span>←</span> 返回地图
        </Button>

        <Button
            variant="outlined"
            onClick={handleOpenReceiptDialog}
            sx={{
              borderRadius: '8px',
              color:'#000',
              borderColor: '#000',
              fontSize: '14px',
              padding: '6px 12px',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.06)' }
            }}
          >
            下载这个气球
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
            {comments.map((comment, index) => (
              <Box
                key={index}
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
                  {comment.text}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
          </Box>
        </Container>
      </Box>

      <Dialog
        open={openReceiptDialog}
        onClose={handleCloseReceiptDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            borderRadius: '20px',
            overflow: 'hidden'
          }
        }}
      >
        <DialogContent style={{ padding: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8b7c9' }}>
          <div style={{ padding: '10px', backgroundColor: '#f8b7c9' }}>
            <h1 style={{ margin: '0', fontSize: '22px', fontFamily: '"Avenir"', color: 'black' }}> 🕊️ 故事可以连接彼此，谢谢你的转发。</h1>
          </div>
          
          {/* 显示版本 - 适应对话框 */}
          <div style={{ width: '100%', maxWidth: '500px', maxHeight: '70vh', overflow: 'auto', padding: '8px' }}>
            <div ref={receiptRef} style={{ backgroundColor: '#ff0000', color: 'black', textAlign: 'center', width: '100%', minHeight: '500px', display: 'flex', flexDirection: 'column', transform: 'scale(1)', transformOrigin: 'top left', overflow: 'hidden' }}>
              <div style={{ height: '250px', position: 'relative', overflow: 'hidden', padding: 0 }}>
                <div style={{ position: 'relative', height: '100%', width: '100%' }}>
                  {incident?.lat && incident?.lng && (
                    <MapContainer
                      center={[incident.lat, incident.lng]}
                      zoom={25}
                      style={{ height: '100%', width: '100%' }}
                      zoomControl={false}
                      attributionControl={false}
                    >
                      <TileLayer
                        url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"
                        crossOrigin
                      />
                      <Marker
                        position={[incident.lat, incident.lng]}
                        icon={new L.Icon({
                          iconUrl: require('../assets/map_marker/regular-marker.png'),
                          iconSize: [80, 80],
                          iconAnchor: [20, 35]
                        })}
                      />
                    </MapContainer>
                  )}
                </div>
              </div>
              <div style={{ margin: '0 0', padding: '8px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '5px' }}>
                <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.4', fontFamily: '"Hei"', color: '#333', textAlign: 'center' }}>
                  {locationAddress}
                </p>
              </div>
              <div style={{ flex: '1', backgroundColor: '#ff0000', color: 'black', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px 10px', minHeight: '200px' }}>
                <h2 style={{ margin: '0 0 10px 0', fontSize: '20px', fontFamily: '"Hei"', textAlign: 'center' }}>气球 {incident?.id}</h2>
                <h3 style={{ margin: '10px 0', fontSize: '28px', fontFamily: '"Hei"', fontWeight: 'bold', textAlign: 'center', color: 'black', wordWrap: 'break-word' }}>{incident?.here_happened}</h3>
                <p style={{ margin: '10px 0 0 0', fontSize: '16px', lineHeight: '1.4', fontFamily: '"Hei"', color: 'black', wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                  {incident?.description}
                </p>
              </div>
              <div style={{ marginTop: 'auto', padding: '5px 0', backgroundColor: '#ff0000' }}>
                <p style={{ margin: 0, fontSize: '14px', fontFamily: '"balloon"', fontWeight: 'bold', color: 'white' }}>www.archiveofsinowomenindiaspora.github.io</p>
              </div>
            </div>
          </div>
          
          {/* 下载版本 - 固定1080px*/}
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <div ref={downloadRef} style={{ width: '800px', height: '800px', overflow: 'hidden', padding: '0' }}>
              <div style={{ backgroundColor: '#ff0000', color: 'black', textAlign: 'center', width: "800px", minHeight: '800px', display: 'flex', flexDirection: 'column', transform: 'scale(1)', transformOrigin: 'top left', overflow: 'hidden' }}>
                <div style={{ height: '300px', position: 'relative', overflow: 'hidden', padding: 0 }}>
                  <div style={{ position: 'relative', height: '100%', width: '100%' }}>
                    {incident?.lat && incident?.lng && (
                      <MapContainer
                        center={[incident.lat, incident.lng]}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                        attributionControl={false}
                      >
                        <TileLayer
                          url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"
                          crossOrigin
                        />
                        <Marker
                          position={[incident.lat, incident.lng]}
                          icon={new L.Icon({
                            iconUrl: require('../assets/map_marker/regular-marker.png'),
                            iconSize: [80, 80],
                            iconAnchor: [40, 40]
                          })}
                        />
                      </MapContainer>
                    )}
                  </div>
                </div>
                <div style={{ margin: '0 0', padding: '8px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '5px' }}>
                  <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.4', fontFamily: '"Hei"', color: '#333', textAlign: 'center' }}>
                    {locationAddress}
                  </p>
                </div>
                <div style={{ flex: '1', backgroundColor: '#ff0000', color: 'black', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px 10px', minHeight: '200px' }}>
                  <h2 style={{ margin: '0 0 10px 0', fontSize: '20px', fontFamily: '"Hei"', textAlign: 'center' }}>气球 {incident?.id}</h2>
                  <h3 style={{ margin: '10px 0', fontSize: '28px', fontFamily: '"Hei"', fontWeight: 'bold', textAlign: 'center', color: 'black', wordWrap: 'break-word' }}>{incident?.here_happened}</h3>
                  <p style={{ margin: '10px 0 0 0', fontSize: getDescriptionFontSize(incident?.description), lineHeight: '1.4', fontFamily: '"Hei"', color: 'black', wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                    {incident?.description}
                  </p>
                </div>
                <div style={{ marginTop: 'auto', padding: '5px 0', backgroundColor: '#ff0000' }}>
                  <p style={{ margin: 0, fontSize: '14px', fontFamily: '"balloon"', fontWeight: 'bold', color: 'white' }}>www.archiveofsinowomenindiaspora.github.io</p>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '80%', maxWidth: '400px', marginTop: '20px', marginBottom: '20px' }}>
            <Button
              variant="outlined"
              onClick={handleCloseReceiptDialog}
              sx={{
                borderRadius: '20px',
                borderColor: '#333',
                color: '#333',
                padding: '8px 20px',
                fontFamily: '"Hei"',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              关闭
            </Button>

            <Button
              variant="contained"
              onClick={downloadReceipt}
              sx={{
                borderRadius: '20px',
                backgroundColor: '#d32f2f',
                color: 'white',
                padding: '8px 30px',
                fontFamily: '"Hei"',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default IncidentInfo;
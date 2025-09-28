import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Grid,
  Paper,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery,
  Chip,
  Stack,
  CircularProgress
} from '@mui/material';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { RESOURCE_CONFIGS } from '../config/tags';
import { getAddressFromCoordinates } from '../utils/locationUtils';

// Fix leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Map click handler component
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
}

function AddResource({ supabase }) {
  const [isPhysicalSpace, setIsPhysicalSpace] = useState(true);
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    email: '',
    site: '',
    instagram: '',
    description: '',
    // Physical space fields
    contact_phone: '',
    address: '',
    tags: '',
    lat: null,
    lng: null
  });
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isGettingAddress, setIsGettingAddress] = useState(false);
  
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleTagChange = (tagLabel) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tagLabel)
        ? prev.filter(t => t !== tagLabel)
        : [...prev, tagLabel];

      // Update formData.tags with comma-separated string
      setFormData(prevData => ({
        ...prevData,
        tags: newTags.join(', ')
      }));

      return newTags;
    });
  };

  const handleLocationSelect = async (latlng) => {
    setSelectedLocation(latlng);
    setFormData(prev => ({
      ...prev,
      lat: latlng.lat,
      lng: latlng.lng
    }));

    // 自动获取地址
    setIsGettingAddress(true);
    try {
      const address = await getAddressFromCoordinates(latlng.lat, latlng.lng);
      setFormData(prev => ({
        ...prev,
        address: address
      }));
    } catch (error) {
      console.error('获取地址失败:', error);
      // 此处不设置错误，让用户手动输入地址
    } finally {
      setIsGettingAddress(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validation based on space type
    if (isPhysicalSpace) {
      if (!formData.name || !formData.email || !formData.address || !formData.lat || !formData.lng) {
        setError('请填写必填字段并在地图上选择位置');
        return;
      }
      
      // Submit to spaces table for physical spaces（仅发送空间相关字段，排除 instagram/site/type 等）
      try {
        const spacePayload = {
          name: formData.name,
          email: formData.email,
          contact_phone: formData.contact_phone,
          address: formData.address,
          tags: formData.tags,
          lat: formData.lat,
          lng: formData.lng,
          description: formData.description,
          instagram: formData.instagram,
          status: 'active'
        };
        const { error: submitError } = await supabase
          .from('spaces')
          .insert([spacePayload]);

        if (submitError) throw submitError;
      } catch (err) {
        setError(err.message || '提交失败，请重试');
        setIsSubmitting(false);
        return;
      }
    } else {
      if (!formData.type || !formData.name) {
        setError('请填写必填字段');
        return;
      }
      
      // Submit to resources table for non-physical resources
      try {
        const { error: submitError } = await supabase
          .from('resources')
          .insert([{
            type: formData.type,
            name: formData.name,
            email: formData.email,
            site: formData.site,
            instagram: formData.instagram,
            description: formData.description,
            tags: formData.tags
          }]);

        if (submitError) throw submitError;
      } catch (err) {
        setError(err.message || '提交失败，请重试');
        setIsSubmitting(false);
        return;
      }
    }

    setIsSubmitting(true);
    setError('');

    setShowSuccess(true);
    // Reset form
    setFormData({
      type: '',
      name: '',
      email: '',
      site: '',
      instagram: '',
      description: '',
      contact_phone: '',
      address: '',
      tags: '',
      lat: null,
      lng: null
    });
    setSelectedTags([]);
    setSelectedLocation(null);
    setIsGettingAddress(false);
    
    // Redirect after success
    setTimeout(() => {
      navigate('/resources');
    }, 2000);
    
    setIsSubmitting(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        pt: 8,
        pb: 4
      }}
    >
      <Container maxWidth="lg">
        
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              color: '#000',
              mb: 2,
              fontWeight: 'bold'
            }}
          >
            {isPhysicalSpace ? '添加援助空间' : '添加非实地资源'}
          </Typography>
          
          <Button
            variant="outlined"
            onClick={() => setIsPhysicalSpace(!isPhysicalSpace)}
            sx={{
              color: '#000',
              borderColor: '#000',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderColor: '#000'
              }
            }}
          >
            {isPhysicalSpace ? '添加非实地资源？' : '添加实地空间？'}
          </Button>
        </Box>


        <Grid container spacing={4}>
          {/* Map Section - Only show for physical spaces */}
          {isPhysicalSpace && (
            <Grid item xs={12} md={6}>
              <Paper
                elevation={3}
                sx={{
                  height: '500px',
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
              >
                <MapContainer
                  center={[46.2276, 2.2137]}
                  zoom={6}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
                  />
                  <MapClickHandler onLocationSelect={handleLocationSelect} />
                  {selectedLocation && (
                    <Marker
                      position={[selectedLocation.lat, selectedLocation.lng]}
                      icon={new L.Icon({
                        iconUrl: require('../assets/map_marker/resource-marker.png'),
                        iconSize: [60, 70],
                        iconAnchor: [20, 60]
                      })}
                    />
                  )}
                </MapContainer>
              </Paper>
              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  textAlign: 'center',
                  color: '#666'
                }}
              >
                点击地图选择位置
              </Typography>
            </Grid>
          )}
          
          <Grid item xs={12} md={isPhysicalSpace ? 6 : 12}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: 2
              }}
            >
              <form onSubmit={handleSubmit}>
                {!isPhysicalSpace && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ color: '#000', fontWeight: 'bold', mb: 1 }}>
                      资源类型 *
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {RESOURCE_CONFIGS.resourceTypes
                        .filter(type => type.label !== '友好空间')
                        .map((type) => (
                        <Chip
                          key={type.value}
                          label={type.label}
                          onClick={() => setFormData(prev => ({...prev, type: type.label}))}
                          variant={formData.type === type.label ? "filled" : "outlined"}
                          sx={{
                            backgroundColor: formData.type === type.label ? '#000' : 'transparent',
                            color: formData.type === type.label ? '#fff' : '#000',
                            border: '1px solid #000',
                            mb: 1,
                            '&:hover': {
                              backgroundColor: formData.type === type.label ? '#333' : 'rgba(0,0,0,0.1)',
                            }
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
                
                <TextField
                  fullWidth
                  label={isPhysicalSpace ? "空间名称" : "名称"}
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  margin="normal"
                  required
                />
                
                <TextField
                  fullWidth
                  label="邮箱"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  margin="normal"
                  required={isPhysicalSpace}
                />

                <TextField
                  fullWidth
                  label="说明"
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  margin="normal"
                  multiline
                  rows={3}
                  placeholder="请描述这个资源的详细信息..."
                />

                {/* Instagram 对两种类型都可选填 */}
                <TextField
                  fullWidth
                  label="Instagram"
                  value={formData.instagram}
                  onChange={handleInputChange('instagram')}
                  margin="normal"
                  placeholder="@username"
                />
                
                {!isPhysicalSpace && (
                  <>
                    <TextField
                      fullWidth
                      label="网站"
                      value={formData.site}
                      onChange={handleInputChange('site')}
                      margin="normal"
                      placeholder="https://example.com"
                    />
                  </>
                )}
                
                {/* Support Type Tags - For both physical and non-physical resources */}
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ color: '#000', fontWeight: 'bold', mb: 1 }}>
                    支持类型 (可多选)
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {RESOURCE_CONFIGS.supportTypes.map((tag) => (
                      <Chip
                        key={tag.value}
                        label={tag.label}
                        onClick={() => handleTagChange(tag.label)}
                        variant={selectedTags.includes(tag.label) ? "filled" : "outlined"}
                        sx={{
                          backgroundColor: selectedTags.includes(tag.label) ? '#000' : 'transparent',
                          color: selectedTags.includes(tag.label) ? '#fff' : '#000',
                          border: '1px solid #000',
                          mb: 1,
                          '&:hover': {
                            backgroundColor: selectedTags.includes(tag.label) ? '#333' : 'rgba(0,0,0,0.1)',
                          }
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
                
                {isPhysicalSpace && (
                  <>
                    <TextField
                      fullWidth
                      label="联系电话"
                      value={formData.contact_phone}
                      onChange={handleInputChange('contact_phone')}
                      margin="normal"
                    />
                    
                    <TextField
                      fullWidth
                      label="地址"
                      value={formData.address}
                      onChange={handleInputChange('address')}
                      margin="normal"
                      required
                      multiline
                      rows={2}
                      disabled={isGettingAddress}
                      helperText={isGettingAddress ? "正在获取地址..." : "点击地图自动填入地址，或手动输入"}
                      InputProps={{
                        endAdornment: isGettingAddress ? <CircularProgress size={20} /> : null
                      }}
                    />
                  </>
                )}

                {selectedLocation && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    已选择位置: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </Alert>
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{
                    mt: 3,
                    backgroundColor: '#000',
                    '&:hover': {
                      backgroundColor: '#333'
                    }
                  }}
                >
                  {isSubmitting ? '提交中...' : '提交 :D'}
                </Button>
              </form>
            </Paper>
          </Grid>
        </Grid>

        <Snackbar
          open={showSuccess}
          autoHideDuration={6000}
          onClose={() => setShowSuccess(false)}
        >
          <Alert onClose={() => setShowSuccess(false)} severity="success">
            资源添加成功！正在跳转...
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
        >
          <Alert onClose={() => setError('')} severity="error">
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default AddResource;

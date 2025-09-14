import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  Button,
  Container,
  Grid,
  Stack,
  CircularProgress
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { RESOURCE_CONFIGS, spaceContainsTags } from '../config/tags';

function Resources({ supabase }) {
  const [spaces, setSpaces] = useState([]);
  const [resources, setResources] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedLocationTag, setSelectedLocationTag] = useState('');
  const [selectedCategoryTags, setSelectedCategoryTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortAsc, setSortAsc] = useState(false);
  const navigate = useNavigate();

  // 从配置文件获取标签
  const locationTags = RESOURCE_CONFIGS.locationTags;
  const resourceTypes = RESOURCE_CONFIGS.resourceTypes;
  const supportTypes = RESOURCE_CONFIGS.supportTypes;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterItems();
  }, [spaces, resources, selectedLocationTag, selectedCategoryTags, sortAsc]);

  const fetchData = async () => {
    try {
      // Fetch physical spaces
      const { data: spacesData, error: spacesError } = await supabase
        .from('spaces')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (spacesError) throw spacesError;
      
      // Fetch non-physical resources
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (resourcesError) throw resourcesError;

      setSpaces(spacesData || []);
      setResources(resourcesData || []);
    } catch (err) {
      console.error('获取资源失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let allItems = [];
    
    // Add physical spaces with type indicator
    const spacesWithType = spaces.map(space => ({
      ...space,
      itemType: 'space',
      displayType: '友好空间'
    }));
    
    // Add non-physical resources with type indicator
    const resourcesWithType = resources.map(resource => ({
      ...resource,
      itemType: 'resource',
      displayType: resource.type
    }));
    
    allItems = [...spacesWithType, ...resourcesWithType];

    // 地区筛选 - 单选 (only applies to physical spaces)
    if (selectedLocationTag) {
      allItems = allItems.filter(item =>
        item.itemType === 'resource' || // Keep all non-physical resources
        item.address?.toLowerCase().includes(selectedLocationTag.toLowerCase())
      );
    }

    // 类型筛选
    if (selectedCategoryTags.length > 0) {
      allItems = allItems.filter(item => {
        if (item.itemType === 'space') {
          // For physical spaces, check tags and also check if '友好空间' is selected
          return selectedCategoryTags.includes('友好空间') || 
                 spaceContainsTags(item, selectedCategoryTags);
        } else {
          // For non-physical resources, check both type and support tags
          return selectedCategoryTags.includes(item.type) ||
                 spaceContainsTags(item, selectedCategoryTags);
        }
      });
    }

    // 按时间排序
    allItems.sort((a, b) => {
      const da = a.created_at ? new Date(a.created_at) : 0;
      const db = b.created_at ? new Date(b.created_at) : 0;
      return sortAsc ? da - db : db - da;
    });

    setFilteredItems(allItems);
  };

  const handleLocationTagClick = (tag) => {
    // 单选逻辑：如果点击的是已选中的标签，则取消选择；否则选择新标签
    setSelectedLocationTag(prev =>
      prev === tag ? '' : tag
    );
  };

  const handleCategoryTagClick = (tagLabel) => {
    setSelectedCategoryTags(prev =>
      prev.includes(tagLabel)
        ? prev.filter(t => t !== tagLabel)
        : [...prev, tagLabel]
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        pt: 8,
        pb: 4
      }}
    >
      {/* Header */}
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              color: '#000',
              mb: 4,
              fontWeight: 'normal'
            }}
          >
            找到庇护，互相支持，每一条信息，都是一份力量。
          </Typography>
        </Box>

        {/* Location Tags */}
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Typography variant="h6" sx={{ color: '#000', mb: 1, fontWeight: 'bold' }}>
            地区
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{mb:2}}>
            {locationTags.map((tag, index) => (
              <Chip
                key={`${tag}-${index}`}
                label={`${tag} +`}
                onClick={() => handleLocationTagClick(tag)}
                sx={{
                  backgroundColor: selectedLocationTag === tag ? '#000' : 'rgba(0,0,0,0.1)',
                  color: selectedLocationTag === tag ? '#fff' : '#000',
                  border: '1px solid rgba(0,0,0,0.2)',
                  mb: 1,
                  '&:hover': {
                    backgroundColor: selectedLocationTag === tag ? '#333' : 'rgba(0,0,0,0.2)',
                  }
                }}
              />
            ))}
          </Stack>
          </Stack>
        </Box>

        {/* Resource Types */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#000', mb: 1, fontWeight: 'bold' }}>
            资源类型
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            {resourceTypes.map((tag) => (
              <Chip
                key={tag.value}
                label={`${tag.label} +`}
                onClick={() => handleCategoryTagClick(tag.label)}
                sx={{
                  backgroundColor: selectedCategoryTags.includes(tag.label) ? '#000' : 'rgba(0,0,0,0.1)',
                  color: selectedCategoryTags.includes(tag.label) ? '#fff' : '#000',
                  border: '1px solid rgba(0,0,0,0.2)',
                  mb: 1,
                  '&:hover': {
                    backgroundColor: selectedCategoryTags.includes(tag.label) ? '#333' : 'rgba(0,0,0,0.2)',
                  }
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* Support Types */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ color: '#000', mb: 1, fontWeight: 'bold' }}>
            支持类型
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {supportTypes.map((tag) => (
              <Chip
                key={tag.value}
                label={`${tag.label} +`}
                onClick={() => handleCategoryTagClick(tag.label)}
                sx={{
                  backgroundColor: selectedCategoryTags.includes(tag.label) ? '#000' : 'rgba(0,0,0,0.1)',
                  color: selectedCategoryTags.includes(tag.label) ? '#fff' : '#000',
                  border: '1px solid rgba(0,0,0,0.2)',
                  mb: 1,
                  '&:hover': {
                    backgroundColor: selectedCategoryTags.includes(tag.label) ? '#333' : 'rgba(0,0,0,0.2)',
                  }
                }}
              />
            ))}
          </Stack>
        </Box>

                {/* 时间排序 */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-start' }}>
          <Box
            onClick={() => setSortAsc(p => !p)}
            sx={{
              background: 'rgba(255,255,255,0.85)',
              color: '#000',
              border: '1px solid rgba(0,0,0,0.2)',
              borderRadius: '999px',
              px: 2,
              py: 0.8,
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              userSelect: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
              '&:hover': {
                background: 'rgba(255,255,255,0.95)'
              }
            }}
          >
            时间排序 {sortAsc ? '↑' : '↓'}
          </Box>
        </Box>

        {/* Results Count */}
        <Typography variant="body1" sx={{ color: '#000', mb: 3, textAlign: 'center' }}>
          {filteredItems.length} results
        </Typography>

        {/* Resources */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <CircularProgress size={60} sx={{ color: '#000' }} />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={`${item.itemType}-${item.id}`}>
              <Card
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" sx={{ color: '#000', fontWeight: 'bold' }}>
                      {item.name}
                    </Typography>
                    <Chip 
                      label={item.displayType} 
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        color: '#000',
                        fontSize: '0.7rem'
                      }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    {item.itemType === 'space' ? (
                      <>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                          地址: {item.address}
                        </Typography>
                        {item.contact_phone && (
                          <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                            电话: {item.contact_phone}
                          </Typography>
                        )}
                      </>
                    ) : (
                      <>
                        {item.site && (
                          <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                            网站: {item.site}
                          </Typography>
                        )}
                        {item.instagram && (
                          <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                            Instagram: {item.instagram}
                          </Typography>
                        )}
                      </>
                    )}
                    
                    {item.email && (
                      <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                        邮箱: {item.email}
                      </Typography>
                    )}
                  </Box>

                  {(item.additional_note || item.description) && (
                    <Typography variant="body2" sx={{ color: '#333', mb: 2, fontSize: '0.9rem' }}>
                      {item.additional_note || item.description}
                    </Typography>
                  )}

                  <Button
                    variant="outlined"
                    size="small"
                    component={Link}
                    to={`/resource-detail?id=${item.id}&type=${item.itemType}`}
                    sx={{
                      color: '#000',
                      borderColor: '#000',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderColor: '#000'
                      }
                    }}
                  >
                    更多
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Add Resource */}
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                backgroundColor: 'rgba(255,255,255,0.5)',
                border: '2px dashed rgba(0,0,0,0.3)',
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.7)'
                }
              }}
              onClick={() => navigate('/resources/add')}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#666', mb: 2 }}>
                  +
                </Typography>
                <Typography variant="h6" sx={{ color: '#666' }}>
                  一起补充更多
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        )}
      </Container>
    </Box>
  );
}

export default Resources;

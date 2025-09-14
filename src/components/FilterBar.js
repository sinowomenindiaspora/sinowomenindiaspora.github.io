import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import './FilterBar.css';
import { Select, MenuItem, Box, Typography, TextField, useMediaQuery, useTheme, Chip, Collapse, IconButton, ToggleButton, ToggleButtonGroup, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckIcon from '@mui/icons-material/Check';

function FilterBar({
  isAddingMode = false,
  filterTypeOptions = ['stories', 'spaces'],
  onFilterTypeChange = () => {},
  regionOptions = [],
  onRegionChange = () => {},
  onSearchSubmit = () => {},
  searchError = '',
  searchLoading = false,
  style
}) {
  const [searchValue, setSearchValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedViolenceType, setSelectedViolenceType] = useState('');

  const defaultTypes = useMemo(() => (Array.isArray(filterTypeOptions) && filterTypeOptions.length > 0 ? filterTypeOptions : ['stories', 'spaces']), [filterTypeOptions]);
  const [selectedFilterTypes, setSelectedFilterTypes] = useState(defaultTypes);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const regionLabelMap = useMemo(() => {
    const map = {};
    (regionOptions || []).forEach(opt => {
      if (opt && typeof opt.value !== 'undefined') map[opt.value] = opt.label || String(opt.value);
    });
    return map;
  }, [regionOptions]);


  const getRegionLabel = (value) => {
    if (!value) return '全部';
    return regionLabelMap[value] || '全部';
  };

  const handleRegionChange = (event) => {
    const value = event.target.value;
    setSelectedRegion(value);
    onRegionChange({ target: { value } });
  };

  const handleFilterTypesChange = (event, next) => {
    let value = Array.isArray(next) ? next : [];
    if (!value.length) value = defaultTypes;
    setSelectedFilterTypes(value);
    onFilterTypeChange({ target: { value } });
    if (!value.includes('stories')) setSelectedViolenceType('');
  };

  const submitSearch = () => {
    if (searchLoading) return; // 加载中，避免重复提交
    const v = (searchValue || '').trim();
    if (!v) return;
    onSearchSubmit(v);
  };

  if (isMobile && isAddingMode) {
    return null;
  }

  // Mobile UI
  if (isMobile) {
    return (
      <Box
        className="filterbar-container filterbar--mobile"
        style={style}
        sx={{
          zIndex: 1200,
        }}
      >
        {/* Mobile Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            py: 1,
            borderBottom: isExpanded ? '1px solid rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            {searchLoading ? (
              <CircularProgress size={20} thickness={5} sx={{ color: '#ff005d' }} />
            ) : (
              <SearchIcon sx={{ color: '#666', fontSize: '20px', cursor: 'pointer' }} onClick={submitSearch} />
            )}
            <TextField
              size="small"
              placeholder="搜索你的那只气球(ID)"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitSearch(); }}
              inputMode="numeric"
              disabled={searchLoading}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  border: 'none',
                  '& fieldset': { border: 'none' },
                  '& input': {
                    padding: '8px 8px',
                    fontSize: '14px',
                    color: '#333'
                  }
                }
              }}
            />
          </Box>

          <IconButton
            onClick={() => setIsExpanded(!isExpanded)}
            sx={{ color: '#666' }}
            aria-label="筛选"
          >
            {isExpanded ? <ExpandLessIcon /> : <FilterListIcon />}
          </IconButton>
        </Box>

        {/* 搜索错误信息（移动端） */}
        {searchError && (
          <Typography sx={{ color: '#d32f2f', fontSize: '12px', mt: 0.5, px: 1 }}>
            {searchError}
          </Typography>
        )}

        {/* Mobile Filters */}
        <Collapse in={isExpanded} sx={{ width: '100%'}}>
          <Box sx={{ pt: 1, width: '100%' }}>
            {/* Active Filters Display：仅在非默认时显示 */}
            {(
              (selectedRegion || selectedViolenceType) ||
              (selectedFilterTypes.length !== defaultTypes.length)
            ) && (
              <Box sx={{ mb: 1, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {selectedFilterTypes.length !== defaultTypes.length && (
                  <Chip
                    label={`展示: ${selectedFilterTypes.map(t => t === 'stories' ? '故事' : '空间').join(' + ')}`}
                    onDelete={() => {
                      setSelectedFilterTypes(defaultTypes);
                      onFilterTypeChange({ target: { value: defaultTypes } });
                    }}
                    sx={{
                      backgroundColor: 'rgba(255, 0, 93, 0.73)',
                      color: '#333',
                      padding:'inherit',
                      margin:'inherit',
                      '& .MuiChip-deleteIcon': { color: '#ff005d' }
                    }}
                  />
                )}
                {selectedRegion && (
                  <Chip
                    label={`位置: ${getRegionLabel(selectedRegion)}`}
                    onDelete={() => {
                      setSelectedRegion('');
                      onRegionChange({ target: { value: '' } });
                    }}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255,0,93,0.1)',
                      color: '#333',
                      '& .MuiChip-deleteIcon': { color: '#ff005d' }
                    }}
                  />
                )}
              </Box>
            )}

            {/* Filter Options */}
            <Box sx={{ display: 'flex', flexDirection: 'column'}}>
              <Box>
                <Typography className="filterbar-label" sx={{ mb: 0.5 }}>展示</Typography>
                <ToggleButtonGroup
                  class="filter-group"
                  value={selectedFilterTypes}
                  onChange={handleFilterTypesChange}
                  aria-label="展示类型"
                  size="small"
                >
                  <ToggleButton value="stories" aria-label="故事">
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {selectedFilterTypes.includes('stories') && (
                        <CheckIcon sx={{ fontSize: 16, color: '#ff005d' }} />
                      )}
                      <span>故事</span>
                    </Box>
                  </ToggleButton>
                  <ToggleButton value="spaces" aria-label="空间">
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {selectedFilterTypes.includes('spaces') && (
                        <CheckIcon sx={{ fontSize: 16, color: '#ff005d' }} />
                      )}
                      <span>空间</span>
                    </Box>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Box>
                <Typography className="filterbar-label" sx={{ mb: 0.5 }}>位置</Typography>
                <Select
                  fullWidth
                  size="small"
                  value={selectedRegion}
                  onChange={handleRegionChange}
                  variant="standard"
                  MenuProps={{
                    disableScrollLock: true,
                    PaperProps: { sx: { zIndex: 1350 } }
                  }}
                  sx={{
                    '&::before': { borderBottomColor: '#ff005d' },
                    '&::after': { borderBottomColor: '#ff005d' },
                    '& .MuiSelect-select': { px: 0, py: '6px' }
                  }}
                >
                  <MenuItem value="">全部位置</MenuItem>
                  {(regionOptions || []).map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>
          </Box>
        </Collapse>
      </Box>
    );
  }

  // Desktop version（固定在 AppBar 下方）
  return (
    <Box
      className="filterbar-container filterbar--desktop"
      style={style}
      sx={{ zIndex: 1200 }}
    >
      {/* 展示（多选） */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography className="filterbar-label">展示</Typography>
        <ToggleButtonGroup
          class="filter-group"
          value={selectedFilterTypes}
          onChange={handleFilterTypesChange}
          aria-label="展示类型"
          size="small"
        >
          <ToggleButton value="stories" aria-label="故事">
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {selectedFilterTypes.includes('stories') && (
                <CheckIcon sx={{ fontSize: 16, color: '#ff005d' }} />
              )}
              <span>故事</span>
            </Box>
          </ToggleButton>
          <ToggleButton value="spaces" aria-label="空间">
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {selectedFilterTypes.includes('spaces') && (
                <CheckIcon sx={{ fontSize: 16, color: '#ff005d' }} />
              )}
              <span>空间</span>
            </Box>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* 位置 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography className="filterbar-label">位置</Typography>
        <Select
          size="small"
          displayEmpty
          value={selectedRegion}
          onChange={handleRegionChange}
          IconComponent={ArrowDropDownIcon}
          variant="standard"
          MenuProps={{
            disableScrollLock: true,
            PaperProps: { sx: { zIndex: 1350 } }
          }}
          sx={{
            minWidth: '120px',
            fontSize: '14px',
            '&::before': { borderBottomColor: '#ff005d' },
            '&::after': { borderBottomColor: '#ff005d' },
            '& .MuiSelect-select': { px: 0, py: '4px' }
          }}
        >
          <MenuItem value="">全部</MenuItem>
          {(regionOptions || []).map(opt => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </Select>
      </Box>

      {/* Search */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {searchLoading ? (
          <CircularProgress size={18} thickness={5} sx={{ color: '#ff005d' }} />
        ) : (
          <SearchIcon sx={{ color: '#666', fontSize: '18px', cursor: 'pointer' }} onClick={submitSearch} />
        )}
        <TextField
          size="small"
          placeholder="搜索你的那只气球(ID)"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submitSearch(); }}
          inputMode="numeric"
          disabled={searchLoading}
          sx={{
            '& .MuiOutlinedInput-root': {
              border: 'none',
              '& fieldset': { border: 'none' },
              '& input': {
                padding: '4px 8px',
                fontSize: '14px',
                color: '#333'
              }
            }
          }}
        />
      </Box>
      {/* 搜索错误信息（桌面端） */}
      {searchError && (
        <Typography sx={{ color: '#d32f2f', fontSize: '12px', mt: 0.5 }}>
          {searchError}
        </Typography>
      )}
    </Box>
  );
}

FilterBar.propTypes = {
  isAddingMode: PropTypes.bool,
  filterTypeOptions: PropTypes.arrayOf(PropTypes.string),
  onFilterTypeChange: PropTypes.func, // 回调收到 { target: { value: string[] } }
  regionOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string
    })
  ),
  onRegionChange: PropTypes.func,
  onSearchSubmit: PropTypes.func,
  searchError: PropTypes.string,
  searchLoading: PropTypes.bool,
  style: PropTypes.object
};

export default FilterBar;
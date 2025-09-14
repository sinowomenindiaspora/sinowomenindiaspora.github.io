// 标签配置文件 - 用于资源页面和添加资源页面的标签管理

export const RESOURCE_CONFIGS = {
  // 资源类型
  resourceTypes: [
    { label: '友好空间', value: 'friendly_space', type: 'resource' },
    { label: '社群', value: 'community', type: 'resource' },
    { label: '播客', value: 'podcast', type: 'resource' },
    { label: '刊物', value: 'magazine', type: 'resource' },
  ],

  // 支持类型标签
  supportTypes: [
    { label: '女性援助', value: 'women_support', type: 'support' },
    { label: '酷儿空间', value: 'queer_space', type: 'support' },
    { label: '法律援助', value: 'legal_aid', type: 'support' },
    { label: '收容', value: 'shelter', type: 'support' },
    { label: '心理咨询', value: 'counseling', type: 'support' }
  ],

  // 预定义位置标签
  locationTags: [
    'Madrid', 'Barcelona', 'Paris', 'London'
  ]
};

// 根据类型获取标签
export const getTagsByType = (type) => {
  switch (type) {
    case 'resource':
      return RESOURCE_CONFIGS.resourceTypes;
    case 'support':
      return RESOURCE_CONFIGS.supportTypes;
    case 'location':
      return RESOURCE_CONFIGS.locationTags;
    default:
      return [];
  }
};

// 辅助函数：检查空间是否包含指定标签
export const spaceContainsTags = (space, selectedTags) => {
  if (!selectedTags || selectedTags.length === 0) return true;
  if (!space.tags) return false;
  
  const spaceTags = space.tags.toLowerCase().split(',').map(tag => tag.trim());
  return selectedTags.some(selectedTag => 
    spaceTags.some(spaceTag => 
      spaceTag.includes(selectedTag.toLowerCase()) || 
      selectedTag.toLowerCase().includes(spaceTag)
    )
  );
};

// 辅助函数：根据标签值获取标签显示名称
export const getTagLabel = (value, type = 'support') => {
  const tags = getTagsByType(type);
  const tag = tags.find(t => t.value === value || t.label === value);
  return tag ? tag.label : value;
};

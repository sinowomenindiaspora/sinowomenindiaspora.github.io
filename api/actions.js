const fs = require('fs');
const path = require('path');

// 这个文件将被用作一个简单的API端点
// 在实际部署中，你可能需要使用Express.js或其他后端框架

function getActionFolders() {
  try {
    const actionsDir = path.join(__dirname, '../actions');
    const items = fs.readdirSync(actionsDir, { withFileTypes: true });
    
    const folders = items
      .filter(item => item.isDirectory())
      .map(item => item.name)
      .filter(name => /^\d{8}$/.test(name)) // 只包含8位数字的文件夹（日期格式）
      .sort()
      .reverse(); // 按日期倒序排列

    return {
      success: true,
      folders: folders,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      folders: []
    };
  }
}

// 导出函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getActionFolders };
}

// 如果直接运行此文件，输出结果
if (require.main === module) {
  console.log(JSON.stringify(getActionFolders(), null, 2));
}

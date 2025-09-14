const fs = require('fs');
const path = require('path');

// 读取public/actions目录下的所有文件夹
const actionsDir = path.join(__dirname, '../public/actions');
const manifestPath = path.join(actionsDir, 'manifest.json');

try {
  // 读取actions目录
  const items = fs.readdirSync(actionsDir, { withFileTypes: true });
  
  // 过滤出文件夹，排除manifest.json文件
  const folders = items
    .filter(item => item.isDirectory())
    .map(item => item.name)
    .filter(name => /^\d{8}$/.test(name)) // 只包含8位数字的文件夹（日期格式）
    .sort()
    .reverse(); // 按日期倒序排列

  // 生成manifest文件
  const manifest = {
    folders: folders,
    lastUpdated: new Date().toISOString()
  };

  // 写入manifest文件
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  console.log(`Generated manifest.json with ${folders.length} folders:`, folders);
  
} catch (error) {
  console.error('Error generating manifest:', error);
  process.exit(1);
}

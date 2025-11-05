const fs = require('fs-extra');
const path = require('path');

/**
 * 确保目录存在
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.ensureDir(dirPath);
    return true;
  } catch (error) {
    console.log('❌ 创建目录失败:', error.message);
    return false;
  }
}

/**
 * 保存数据到JSON文件
 */
function saveToJsonFile(data, filename, outputDir = './results') {
  ensureDirectoryExists(outputDir);
  const filepath = path.join(outputDir, filename);
  
  try {
    fs.writeJsonSync(filepath, data, { spaces: 2 });
    return filepath;
  } catch (error) {
    console.log('❌ 保存文件失败:', error.message);
    return null;
  }
}

/**
 * 生成带时间戳的文件名
 */
function generateTimestampFilename(baseName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${baseName}_${timestamp}.json`;
}

/**
 * 检查页面是否加载成功
 */
async function checkPageLoad(page, url) {
  try {
    await page.waitForSelector('body', { timeout: 10000 });
    const title = await page.title();
    console.log(`📄 页面标题: ${title}`);
    
    if (title.includes('错误') || title.includes('验证')) {
      throw new Error('页面加载异常，可能遇到反爬机制');
    }
    
    return true;
  } catch (error) {
    throw new Error(`页面加载检查失败: ${error.message}`);
  }
}

/**
 * 随机延迟
 */
async function randomDelay(min = 1000, max = 3000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * 提取电影ID从URL
 */
function extractMovieIdFromUrl(url) {
  const match = url.match(/subject\/(\d+)/);
  return match ? match[1] : 'unknown';
}

/**
 * 清理文本内容
 */
function cleanText(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

module.exports = {
  ensureDirectoryExists,
  saveToJsonFile,
  generateTimestampFilename,
  checkPageLoad,
  randomDelay,
  extractMovieIdFromUrl,
  cleanText
};
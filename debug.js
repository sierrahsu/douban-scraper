const playwright = require('playwright');

async function debugSearch() {
  console.log('🔧 启动调试模式...');
  
  const browser = await playwright.chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  const page = await browser.newPage();
  
  try {
    const keyword = '电影';
    const searchUrl = `https://www.douban.com/search?q=${encodeURIComponent(keyword)}`;
    console.log(`🔍 访问: ${searchUrl}`);
    
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 60000 });
    
    // 获取页面信息
    const title = await page.title();
    const url = await page.url();
    console.log(`📄 页面标题: ${title}`);
    console.log(`🌐 当前URL: ${url}`);
    
    // 保存页面HTML和截图
    const content = await page.content();
    require('fs').writeFileSync('./results/debug_page.html', content);
    await page.screenshot({ path: './results/debug_page.png', fullPage: true });
    
    console.log('💾 页面HTML和截图已保存到 results 文件夹');
    
    // 尝试查找常见元素
    const selectors = [
      '.result',
      '.search-result',
      '.article',
      '.note',
      '.review',
      '[class*="result"]',
      '[class*="item"]'
    ];
    
    for (const selector of selectors) {
      const elements = await page.$$(selector);
      console.log(`选择器 "${selector}": 找到 ${elements.length} 个元素`);
      
      if (elements.length > 0) {
        for (let i = 0; i < Math.min(elements.length, 3); i++) {
          const text = await elements[i].textContent();
          console.log(`  元素 ${i + 1}: ${text.substring(0, 100)}...`);
        }
      }
    }
    
    console.log('✅ 调试完成，请检查 results 文件夹中的文件');
    
  } catch (error) {
    console.log('❌ 调试出错:', error);
  } finally {
    await browser.close();
  }
}

debugSearch();
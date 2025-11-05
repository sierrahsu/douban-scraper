const playwright = require('playwright');

async function debugTopMovies() {
  console.log('🔧 启动TOP电影调试模式...');
  
  const browser = await playwright.chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  const page = await browser.newPage();
  
  try {
    const top250Url = 'https://movie.douban.com/top250';
    console.log(`🔍 访问: ${top250Url}`);
    
    await page.goto(top250Url, { waitUntil: 'networkidle', timeout: 60000 });
    
    // 获取页面信息
    const title = await page.title();
    const url = await page.url();
    console.log(`📄 页面标题: ${title}`);
    console.log(`🌐 当前URL: ${url}`);
    
    // 保存页面HTML和截图
    const content = await page.content();
    require('fs').writeFileSync('./results/debug_top_movies.html', content);
    await page.screenshot({ path: './results/debug_top_movies.png', fullPage: true });
    
    console.log('💾 页面HTML和截图已保存到 results 文件夹');
    
    // 检查电影列表元素
    const movieElements = await page.$$('.grid_view li');
    console.log(`🎬 找到 ${movieElements.length} 部电影`);
    
    if (movieElements.length > 0) {
      const firstMovie = movieElements[0];
      
      // 检查标题
      const titleText = await firstMovie.$eval('.title', el => el.textContent).catch(() => '无标题');
      console.log(`📝 电影标题: ${titleText}`);
      
      // 检查评分
      const ratingText = await firstMovie.$eval('.rating_num', el => el.textContent).catch(() => '无评分');
      console.log(`⭐ 评分: ${ratingText}`);
      
      // 检查评价人数
      const ratingCountText = await firstMovie.$eval('.star span:last-child', el => el.textContent).catch(() => '无评价人数');
      console.log(`👥 评价人数: ${ratingCountText}`);
      
      // 检查所有可能的评分相关元素
      console.log('🔍 检查评分相关元素:');
      const ratingSelectors = ['.rating_num', '.star .rating_num', '.rating', '.score'];
      for (const selector of ratingSelectors) {
        const elements = await firstMovie.$$(selector);
        console.log(`  选择器 "${selector}": 找到 ${elements.length} 个元素`);
        if (elements.length > 0) {
          for (let i = 0; i < elements.length; i++) {
            const text = await elements[i].textContent();
            console.log(`    元素 ${i + 1}: "${text}"`);
          }
        }
      }
      
      // 检查所有可能的评价人数相关元素
      console.log('🔍 检查评价人数相关元素:');
      const countSelectors = ['.star span', '.pl', '[class*="comment"]', '[class*="vote"]'];
      for (const selector of countSelectors) {
        const elements = await firstMovie.$$(selector);
        console.log(`  选择器 "${selector}": 找到 ${elements.length} 个元素`);
        if (elements.length > 0) {
          for (let i = 0; i < Math.min(elements.length, 3); i++) {
            const text = await elements[i].textContent();
            console.log(`    元素 ${i + 1}: "${text}"`);
          }
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

debugTopMovies();
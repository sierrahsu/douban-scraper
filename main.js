/**
 * 豆瓣数据抓取主程序
 * 整合搜索、电影评论和TOP电影功能
 */

const playwright = require('playwright');
const config = require('./config');
const {
  extractPostUrl,
  extractPostTitle,
  extractPostIdFromUrl,
  extractBasicInfo,
  extractPostContent,
  extractAuthorInfo,
  extractInteractionData,
  extractMetadata,
  extractComments,
  extractMovieInfo,
  extractMovieComments,
  extractTopMovies
} = require('./utils/extractors');
const {
  ensureDirectoryExists,
  saveToJsonFile,
  generateTimestampFilename,
  checkPageLoad,
  randomDelay
} = require('./utils/helpers');

// 第三步：抓取搜索结果列表
async function scrapeSearchResults(page, keyword) {
  console.log(`🎯 开始搜索关键词: "${keyword}"`);

  try {
    const searchUrl = `https://www.douban.com/search?q=${encodeURIComponent(keyword)}`;
    console.log(`📝 搜索URL: ${searchUrl}`);

    await page.goto(searchUrl, {
      waitUntil: 'networkidle',
      timeout: config.timeouts.navigation
    });
    console.log('✅ 成功跳转到搜索结果页');

    await page.waitForTimeout(5000);

    const pageTitle = await page.title();
    const pageContent = await page.content();
    
    if (pageTitle.includes('验证') || pageTitle.includes('登录') || pageContent.includes('验证码')) {
      console.log('⚠️ 可能需要验证或登录，尝试继续...');
    }

    const selectors = require('./selectors/douban').searchPage.postContainer;
    let postElements = [];

    console.log('🔍 尝试使用选择器查找内容...');
    
    for (const selector of selectors) {
      try {
        console.log(`  尝试选择器: "${selector}"`);
        await page.waitForSelector(selector, { timeout: 3000 });
        const elements = await page.$$(selector);
        console.log(`  找到 ${elements.length} 个元素`);
        
        if (elements.length > 0) {
          postElements = elements;
          console.log(`✅ 使用选择器: ${selector}`);
          break;
        }
      } catch (error) {
        console.log(`❌ 选择器 "${selector}" 未找到元素: ${error.message}`);
      }
    }

    if (postElements.length === 0) {
      console.log('⚠️ 使用选择器未找到内容，尝试通用方法...');
      
      await page.screenshot({ path: './results/debug_search.png', fullPage: true });
      console.log('💾 已保存页面截图到 ./results/debug_search.png');
      
      const allLinks = await page.$$('a');
      console.log(`🔗 页面中共找到 ${allLinks.length} 个链接`);
      
      postElements = await page.$$('.result, .item, .article, [class*="result"], [class*="item"]');
      console.log(`📄 通过通用选择器找到 ${postElements.length} 个可能的内容元素`);
    }

    if (postElements.length === 0) {
      throw new Error('未找到内容列表元素，请检查豆瓣页面结构或网络连接');
    }

    console.log(`📊 找到 ${postElements.length} 个相关内容`);

    const postList = [];
    const maxPosts = Math.min(postElements.length, config.search.postsPerKeyword);

    for (let i = 0; i < maxPosts; i++) {
      try {
        console.log(`\n📖 正在处理第 ${i + 1} 个内容...`);
        const element = postElements[i];

        await element.scrollIntoViewIfNeeded();
        await page.waitForTimeout(2000);

        const postUrl = await extractPostUrl(element);
        const title = await extractPostTitle(element);
        const postId = extractPostIdFromUrl(postUrl);
        const basicInfo = await extractBasicInfo(element);

        if (postUrl && postUrl.includes('douban.com')) {
          const postInfo = {
            id: postId,
            title: title,
            url: postUrl,
            index: i + 1,
            ...basicInfo
          };

          postList.push(postInfo);
          console.log(`✅ 成功提取内容 ${i + 1}: ${title}`);
          console.log(`   🔗 URL: ${postUrl}`);
        } else {
          console.log(`⏭️ 跳过无效URL: ${postUrl}`);
        }

      } catch (error) {
        console.log(`❌ 处理第 ${i + 1} 个内容时出错:`, error.message);
      }
    }

    if (postList.length === 0) {
      throw new Error('未能提取到任何有效内容');
    }

    console.log(`\n🎉 搜索完成！共成功提取 ${postList.length} 个内容`);
    return postList;

  } catch (error) {
    console.log('❌ 搜索过程出错:', error.message);
    
    try {
      await page.screenshot({ path: './results/error_search.png', fullPage: true });
      console.log('💾 错误页面截图已保存到 ./results/error_search.png');
    } catch (screenshotError) {
      console.log('❌ 无法保存错误截图:', screenshotError.message);
    }
    
    throw error;
  }
}

// 第四步：抓取单个内容详细信息和评论
async function scrapePostDetails(page, postUrl, postId) {
  console.log(`\n🔍 开始抓取内容详情: ${postId}`);

  const postDetails = {
    id: postId,
    url: postUrl,
    timestamp: new Date().toISOString(),
    scrapeTime: new Date().toLocaleString('zh-CN')
  };

  try {
    console.log(`📍 跳转到内容页面: ${postUrl}`);
    await page.goto(postUrl, {
      waitUntil: 'domcontentloaded',
      timeout: config.timeouts.navigation
    });

    await page.waitForTimeout(config.search.delays.pageLoad);
    await checkPageLoad(page, postUrl);

    await extractPostContent(page, postDetails);
    await extractAuthorInfo(page, postDetails);
    await extractInteractionData(page, postDetails);
    await extractMetadata(page, postDetails);
    await extractComments(page, postDetails);

    console.log(`✅ 内容详情抓取完成: ${postDetails.title || '无标题'}`);
    return postDetails;

  } catch (error) {
    console.log(`❌ 抓取内容 ${postId} 详情时出错:`, error.message);
    postDetails.error = error.message;
    return postDetails;
  }
}

// 新增：抓取特定电影评论
async function scrapeMovieComments(page, movie) {
  console.log(`\n🎬 开始抓取电影评论: ${movie.name}`);
  
  const movieDetails = {
    id: movie.id || require('./utils/helpers').extractMovieIdFromUrl(movie.url),
    name: movie.name,
    url: movie.url,
    timestamp: new Date().toISOString(),
    scrapeTime: new Date().toLocaleString('zh-CN')
  };

  try {
    console.log(`📍 跳转到电影页面: ${movie.url}`);
    await page.goto(movie.url, {
      waitUntil: 'networkidle',
      timeout: config.timeouts.navigation
    });

    await page.waitForTimeout(3000);
    await checkPageLoad(page, movie.url);

    // 提取电影基本信息
    await extractMovieInfo(page, movieDetails);
    
    // 提取电影评论
    await extractMovieComments(page, movieDetails);

    console.log(`✅ 电影评论抓取完成: ${movieDetails.title || movie.name}`);
    return movieDetails;

  } catch (error) {
    console.log(`❌ 抓取电影 ${movie.name} 评论时出错:`, error.message);
    movieDetails.error = error.message;
    return movieDetails;
  }
}

// 新增：抓取TOP电影数据
async function scrapeTopMovies(page) {
  console.log('\n🏆 开始抓取TOP电影数据...');
  
  try {
    const topMovies = await extractTopMovies(page);
    
    console.log(`✅ TOP电影数据抓取完成，共 ${topMovies.length} 部电影`);
    return topMovies;

  } catch (error) {
    console.log('❌ 抓取TOP电影数据时出错:', error.message);
    return [];
  }
}

// 主函数
async function main() {
  console.log('🚀 启动豆瓣数据抓取程序...');
  console.log('='.repeat(50));

  const browser = await playwright.chromium.launch(config.browser);
  const context = await browser.newContext(config.browser);
  const page = await context.newPage();

  await page.setExtraHTTPHeaders({
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
  });

  page.setDefaultTimeout(config.timeouts.elementWait);
  page.setDefaultNavigationTimeout(config.timeouts.navigation);

  try {
    const results = {
      searchResults: {},
      movieComments: {},
      topMovies: []
    };

    // 1. 搜索功能
    console.log('\n🔍 第一阶段：关键词搜索');
    console.log('='.repeat(30));
    
    for (const keyword of config.search.keywords) {
      console.log(`\n\n🔎 处理关键词: "${keyword}"`);
      console.log('-'.repeat(30));

      console.log('\n📋 第三步：抓取搜索结果列表');
      const postList = await scrapeSearchResults(page, keyword);

      console.log('\n\n📋 第四步：抓取内容详细信息和评论');
      const postDetails = [];

      for (let i = 0; i < postList.length; i++) {
        const post = postList[i];
        console.log(`\n${i + 1}/${postList.length} 抓取内容: ${post.title}`);

        const details = await scrapePostDetails(page, post.url, post.id);
        postDetails.push(details);

        if (i < postList.length - 1) {
          console.log(`⏳ 等待 ${config.search.delays.betweenRequests/1000} 秒后继续...`);
          await page.waitForTimeout(config.search.delays.betweenRequests);
        }
      }

      results.searchResults[keyword] = {
        searchTime: new Date().toISOString(),
        totalPosts: postList.length,
        posts: postDetails
      };

      if (keyword !== config.search.keywords[config.search.keywords.length - 1]) {
        await randomDelay(3000, 5000);
      }
    }

    // 2. 特定电影评论抓取
    console.log('\n\n🎬 第二阶段：特定电影评论抓取');
    console.log('='.repeat(30));
    
    if (config.movie.specificMovies && config.movie.specificMovies.length > 0) {
      results.movieComments = [];

      for (const movie of config.movie.specificMovies) {
        console.log(`\n🎥 处理电影: ${movie.name}`);
        
        const movieDetails = await scrapeMovieComments(page, movie);
        results.movieComments.push(movieDetails);

        if (movie !== config.movie.specificMovies[config.movie.specificMovies.length - 1]) {
          await randomDelay(3000, 5000);
        }
      }
    } else {
      console.log('⏭️ 未配置特定电影，跳过此阶段');
    }

    // 3. TOP电影数据抓取
    console.log('\n\n🏆 第三阶段：TOP电影数据抓取');
    console.log('='.repeat(30));
    
    if (config.movie.topMovies.enabled) {
      results.topMovies = await scrapeTopMovies(page);
    } else {
      console.log('⏭️ TOP电影功能已禁用，跳过此阶段');
    }

    // 保存最终结果
    const outputDir = config.output.directory;
    await ensureDirectoryExists(outputDir);
    
    const filename = config.output.includeTimestamp
      ? generateTimestampFilename('douban_complete_results')
      : 'douban_complete_results.json';

    const filepath = saveToJsonFile(results, filename, outputDir);
    console.log(`\n💾 所有结果已保存到: ${filepath}`);
    
    // 显示统计信息
    console.log('\n📊 抓取统计:');
    console.log(`   🔍 搜索关键词: ${Object.keys(results.searchResults).length} 个`);
    console.log(`   🎬 电影评论: ${results.movieComments.length} 部`);
    console.log(`   🏆 TOP电影: ${results.topMovies.length} 部`);
    console.log('\n🎊 所有任务完成！');

  } catch (error) {
    console.log('💥 程序执行出错:', error);
  } finally {
    await browser.close();
  }
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.log('❌ 未处理的Promise拒绝:', reason);
});

process.on('uncaughtException', (error) => {
  console.log('❌ 未捕获的异常:', error);
});

// 启动程序
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  scrapeSearchResults,
  scrapePostDetails,
  scrapeMovieComments,
  scrapeTopMovies
};
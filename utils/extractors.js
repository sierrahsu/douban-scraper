/**
 * 豆瓣数据提取工具函数
 */

const { cleanText, extractMovieIdFromUrl } = require('./helpers');

/**
 * 提取帖子URL
 */
async function extractPostUrl(element) {
  // 尝试多种选择器
  const selectors = ['a', '.title a', 'h3 a', '.content a', 'h4 a', '.text a'];
  for (const selector of selectors) {
    try {
      const url = await element.$eval(selector, el => {
        const href = el.getAttribute('href');
        // 确保是完整的URL
        if (href && (href.startsWith('http') || href.startsWith('//'))) {
          return href.startsWith('//') ? `https:${href}` : href;
        } else if (href && href.startsWith('/')) {
          return `https://www.douban.com${href}`;
        }
        return href;
      });
      if (url && url.includes('douban.com')) {
        return url;
      }
    } catch (error) {
      // 继续尝试下一个选择器
    }
  }
  
  return '';
}

/**
 * 提取帖子标题
 */
async function extractPostTitle(element) {
  // 尝试多种选择器
  const selectors = [
    '.title a', 
    'h3 a', 
    '.content a', 
    'h4 a',
    '.text a',
    '.title',
    'h3',
    'h4'
  ];
  
  for (const selector of selectors) {
    try {
      const title = await element.$eval(selector, el => {
        const text = el.textContent.trim();
        return text && text.length > 0 ? text : null;
      });
      if (title) return title;
    } catch (error) {
      // 继续尝试下一个选择器
    }
  }
  
  return '无标题';
}

/**
 * 从URL提取帖子ID
 */
function extractPostIdFromUrl(url) {
  if (!url) return 'unknown';
  
  const patterns = [
    /\/subject\/(\d+)/,
    /\/note\/(\d+)/,
    /\/review\/(\d+)/,
    /\/people\/[^/]+\/status\/(\d+)/,
    /\/group\/topic\/(\d+)/,
    /\/(\d+)(?:\/|\?|$)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return `url_${Buffer.from(url).toString('base64').substring(0, 10)}`;
}

/**
 * 提取基本信息
 */
async function extractBasicInfo(element) {
  const basicInfo = {
    meta: '',
    description: '',
    type: 'unknown'
  };
  
  try {
    basicInfo.meta = await element.$eval('.meta, .pub-time, .author, .info, .abstract', 
      el => el.textContent.trim()
    ).catch(() => '');
    
    basicInfo.description = await element.$eval('.content, .desc, .abstract, .summary', 
      el => el.textContent.trim()
    ).catch(() => '');
    
    const elementHtml = await element.evaluate(el => el.outerHTML);
    if (elementHtml.includes('note')) basicInfo.type = 'note';
    else if (elementHtml.includes('review')) basicInfo.type = 'review';
    else if (elementHtml.includes('subject')) basicInfo.type = 'subject';
    else if (elementHtml.includes('group')) basicInfo.type = 'group';
    
  } catch (error) {
    console.log('❌ 提取基本信息失败:', error.message);
  }
  
  return basicInfo;
}

/**
 * 提取帖子内容
 */
async function extractPostContent(page, postDetails) {
  try {
    const selectors = require('../selectors/douban').contentPage;
    
    for (const titleSelector of selectors.title.split(', ')) {
      try {
        postDetails.title = await page.$eval(titleSelector, el => el.textContent.trim());
        if (postDetails.title) break;
      } catch (error) {}
    }
    
    for (const contentSelector of selectors.content.split(', ')) {
      try {
        postDetails.content = await page.$eval(contentSelector, el => {
          return el.textContent.replace(/\s+/g, ' ').trim();
        });
        if (postDetails.content) break;
      } catch (error) {}
    }
    
    for (const ratingSelector of selectors.rating.split(', ')) {
      try {
        postDetails.rating = await page.$eval(ratingSelector, el => el.textContent.trim());
        if (postDetails.rating) break;
      } catch (error) {}
    }
    
    if (postDetails.content && postDetails.content.length > 500) {
      postDetails.content = postDetails.content.substring(0, 500) + '...';
    }
    
    console.log(`📄 内容提取: 标题="${postDetails.title}", 评分="${postDetails.rating}"`);
    
  } catch (error) {
    console.log('❌ 提取内容失败:', error.message);
  }
}

/**
 * 提取作者信息
 */
async function extractAuthorInfo(page, postDetails) {
  try {
    const selectors = require('../selectors/douban').contentPage;
    
    for (const authorSelector of selectors.author.split(', ')) {
      try {
        postDetails.author = await page.$eval(authorSelector, el => el.textContent.trim());
        if (postDetails.author) break;
      } catch (error) {}
    }
    
    for (const timeSelector of selectors.publishTime.split(', ')) {
      try {
        postDetails.publishTime = await page.$eval(timeSelector, el => el.textContent.trim());
        if (postDetails.publishTime) break;
      } catch (error) {}
    }
    
    console.log(`👤 作者信息: ${postDetails.author} (${postDetails.publishTime})`);
    
  } catch (error) {
    console.log('❌ 提取作者信息失败:', error.message);
  }
}

/**
 * 提取互动数据
 */
async function extractInteractionData(page, postDetails) {
  try {
    const likeSelectors = ['.likes', '.like-num', '.fav-num', '[class*="like"]', '[class*="fav"]'];
    for (const selector of likeSelectors) {
      try {
        postDetails.likes = await page.$eval(selector, el => el.textContent.trim());
        if (postDetails.likes) break;
      } catch (error) {}
    }
    
    const commentSelectors = ['.comments-count', '.comment-num', '[class*="comment"]'];
    for (const selector of commentSelectors) {
      try {
        postDetails.commentsCount = await page.$eval(selector, el => el.textContent.trim());
        if (postDetails.commentsCount) break;
      } catch (error) {}
    }
    
    if (!postDetails.likes) postDetails.likes = '0';
    if (!postDetails.commentsCount) postDetails.commentsCount = '0';
    
    console.log(`📊 互动数据: 点赞=${postDetails.likes}, 评论=${postDetails.commentsCount}`);
    
  } catch (error) {
    console.log('❌ 提取互动数据失败:', error.message);
    postDetails.likes = '0';
    postDetails.commentsCount = '0';
  }
}

/**
 * 提取元数据
 */
async function extractMetadata(page, postDetails) {
  try {
    postDetails.url = page.url();
    postDetails.scrapedAt = new Date().toISOString();
    postDetails.scrapedAtLocal = new Date().toLocaleString('zh-CN');
    postDetails.pageTitle = await page.title();
    
  } catch (error) {
    console.log('❌ 提取元数据失败:', error.message);
  }
}

/**
 * 提取评论信息 - 修复重复问题，只抓取前5条
 */
async function extractComments(page, postDetails) {
  try {
    const selectors = require('../selectors/douban').commentPage;
    const comments = [];
    
    console.log('💬 开始提取评论信息...');
    
    try {
      await page.waitForSelector(selectors.commentContainer, { timeout: 5000 });
    } catch (error) {
      console.log('⚠️ 评论容器未找到，可能没有评论或选择器需要更新');
      postDetails.comments = [];
      postDetails.totalComments = 0;
      return;
    }
    
    const commentElements = await page.$$(selectors.commentItem);
    console.log(`📝 找到 ${commentElements.length} 条评论`);
    
    // 使用Set来去重，基于评论内容
    const seenComments = new Set();
    const maxComments = 5; // 只抓取前5条评论
    
    for (let i = 0; i < Math.min(commentElements.length, maxComments); i++) {
      try {
        const commentElement = commentElements[i];
        
        let commentContent = '';
        for (const contentSelector of selectors.commentContent.split(', ')) {
          try {
            commentContent = await commentElement.$eval(contentSelector, 
              el => el.textContent.replace(/\s+/g, ' ').trim()
            );
            if (commentContent) break;
          } catch (error) {}
        }
        
        // 跳过空评论
        if (!commentContent || commentContent === '无内容') {
          continue;
        }
        
        // 检查是否重复
        const commentKey = commentContent.substring(0, 100); // 取前100字符作为key
        if (seenComments.has(commentKey)) {
          console.log(`⏭️ 跳过重复评论: ${commentContent.substring(0, 50)}...`);
          continue;
        }
        seenComments.add(commentKey);
        
        let commentAuthor = '';
        for (const authorSelector of selectors.commentAuthor.split(', ')) {
          try {
            commentAuthor = await commentElement.$eval(authorSelector, 
              el => el.textContent.trim()
            );
            if (commentAuthor) break;
          } catch (error) {}
        }
        
        let commentTime = '';
        for (const timeSelector of selectors.commentTime.split(', ')) {
          try {
            commentTime = await commentElement.$eval(timeSelector, 
              el => el.textContent.trim()
            );
            if (commentTime) break;
          } catch (error) {}
        }
        
        const commentInfo = {
          index: comments.length + 1, // 使用实际添加的评论数量作为index
          author: commentAuthor || '匿名用户',
          content: commentContent,
          time: commentTime || '未知时间'
        };
        
        comments.push(commentInfo);
        console.log(`   📄 评论 ${comments.length}: ${commentAuthor} - ${commentContent.substring(0, 50)}...`);
        
        // 如果已经达到5条评论，就停止
        if (comments.length >= maxComments) {
          break;
        }
        
      } catch (error) {
        console.log(`❌ 提取第 ${i + 1} 条评论时出错:`, error.message);
      }
    }
    
    postDetails.comments = comments;
    postDetails.totalComments = comments.length;
    
    console.log(`✅ 评论提取完成，共 ${comments.length} 条评论`);
    
  } catch (error) {
    console.log('❌ 提取评论时出错:', error.message);
    postDetails.comments = [];
    postDetails.totalComments = 0;
  }
}

/**
 * 提取电影基本信息
 */
async function extractMovieInfo(page, movieDetails) {
  try {
    const selectors = require('../selectors/douban').moviePage;
    
    console.log('🎬 开始提取电影信息...');
    
    // 提取电影标题
    movieDetails.title = await page.$eval(selectors.movieTitle, 
      el => el.textContent.trim()
    ).catch(() => movieDetails.name || '未知电影');
    
    // 提取评分
    movieDetails.rating = await page.$eval(selectors.movieRating, 
      el => el.textContent.trim()
    ).catch(() => '暂无评分');
    
    // 提取评分人数
    movieDetails.ratingCount = await page.$eval(selectors.movieRatingCount, 
      el => el.textContent.trim()
    ).catch(() => '0');
    
    // 提取电影信息
    movieDetails.info = await page.$eval(selectors.movieInfo, 
      el => el.textContent.replace(/\s+/g, ' ').trim()
    ).catch(() => '');
    
    // 提取剧情简介
    movieDetails.summary = await page.$eval(selectors.movieSummary, 
      el => el.textContent.trim()
    ).catch(() => '');
    
    console.log(`✅ 电影信息提取完成: ${movieDetails.title} (评分: ${movieDetails.rating}, 评价人数: ${movieDetails.ratingCount})`);
    
  } catch (error) {
    console.log('❌ 提取电影信息失败:', error.message);
  }
}

/**
 * 提取电影评论 - 修复重复问题，只抓取前5条
 */
async function extractMovieComments(page, movieDetails) {
  try {
    const selectors = require('../selectors/douban').moviePage;
    const comments = [];
    
    console.log('💬 开始提取电影评论...');
    
    // 等待评论区域加载
    try {
      await page.waitForSelector(selectors.commentList, { timeout: 8000 });
    } catch (error) {
      console.log('⚠️ 评论区域未找到，可能没有评论或选择器需要更新');
      movieDetails.comments = [];
      movieDetails.totalComments = 0;
      return;
    }
    
    // 首先尝试获取热门评论
    let commentElements = [];
    try {
      commentElements = await page.$$(selectors.hotComments);
      console.log(`🔥 找到 ${commentElements.length} 条热门评论`);
    } catch (error) {
      console.log('❌ 获取热门评论失败，尝试普通评论');
      commentElements = await page.$$(selectors.commentList);
    }
    
    if (commentElements.length === 0) {
      commentElements = await page.$$(selectors.commentList);
    }
    
    console.log(`📝 总共找到 ${commentElements.length} 条评论`);
    
    // 使用Set来去重，基于评论内容
    const seenComments = new Set();
    const maxComments = 5; // 只抓取前5条评论
    
    for (let i = 0; i < commentElements.length && comments.length < maxComments; i++) {
      try {
        const commentElement = commentElements[i];
        
        // 提取评论内容
        let content = '';
        for (const contentSelector of selectors.commentContent.split(', ')) {
          try {
            content = await commentElement.$eval(contentSelector, 
              el => el.textContent.replace(/\s+/g, ' ').trim()
            );
            if (content) break;
          } catch (error) {}
        }
        
        // 跳过空评论
        if (!content || content === '无内容') {
          continue;
        }
        
        // 检查是否重复
        const commentKey = content.substring(0, 100); // 取前100字符作为key
        if (seenComments.has(commentKey)) {
          console.log(`⏭️ 跳过重复评论: ${content.substring(0, 50)}...`);
          continue;
        }
        seenComments.add(commentKey);
        
        // 提取评论作者
        let author = '';
        for (const authorSelector of selectors.commentAuthor.split(', ')) {
          try {
            author = await commentElement.$eval(authorSelector, 
              el => el.textContent.trim()
            );
            if (author) break;
          } catch (error) {}
        }
        
        // 提取评论评分
        let rating = '无评分';
        for (const ratingSelector of selectors.commentRating.split(', ')) {
          try {
            rating = await commentElement.$eval(ratingSelector, 
              el => {
                const classList = el.className;
                if (classList.includes('allstar50') || classList.includes('rating50')) return '5星';
                if (classList.includes('allstar40') || classList.includes('rating40')) return '4星';
                if (classList.includes('allstar30') || classList.includes('rating30')) return '3星';
                if (classList.includes('allstar20') || classList.includes('rating20')) return '2星';
                if (classList.includes('allstar10') || classList.includes('rating10')) return '1星';
                return '无评分';
              }
            );
            if (rating !== '无评分') break;
          } catch (error) {}
        }
        
        // 提取评论时间
        let time = '';
        for (const timeSelector of selectors.commentTime.split(', ')) {
          try {
            time = await commentElement.$eval(timeSelector, 
              el => el.textContent.trim()
            );
            if (time) break;
          } catch (error) {}
        }
        
        // 提取有用数
        let votes = '0';
        for (const votesSelector of selectors.commentVotes.split(', ')) {
          try {
            votes = await commentElement.$eval(votesSelector, 
              el => el.textContent.trim()
            );
            if (votes) break;
          } catch (error) {}
        }
        
        const comment = {
          index: comments.length + 1, // 使用实际添加的评论数量作为index
          author: author || '匿名用户',
          rating: rating,
          time: time || '未知时间',
          content: content,
          votes: votes,
          isHot: i < 3 // 前3条标记为热门评论
        };
        
        comments.push(comment);
        console.log(`   📝 评论 ${comments.length}: ${author} - ${rating} - ${content.substring(0, 50)}...`);
        
      } catch (error) {
        console.log(`❌ 提取第 ${i + 1} 条评论时出错:`, error.message);
      }
    }
    
    movieDetails.comments = comments;
    movieDetails.totalComments = comments.length;
    
    console.log(`✅ 电影评论提取完成，共 ${comments.length} 条评论`);
    
  } catch (error) {
    console.log('❌ 提取电影评论失败:', error.message);
    movieDetails.comments = [];
    movieDetails.totalComments = 0;
  }
}

/**
 * 增强版：提取TOP电影列表
 */
async function extractTopMovies(page) {
  try {
    const config = require('../config');
    const topMovies = [];
    
    console.log('🏆 开始提取TOP电影列表...');
    
    await page.goto(config.movie.topMovies.url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForSelector('.grid_view li', { timeout: 10000 });
    
    const movieElements = await page.$$('.grid_view li');
    console.log(`📊 找到 ${movieElements.length} 部电影`);
    
    const maxMovies = Math.min(movieElements.length, config.movie.topMovies.count);
    
    for (let i = 0; i < maxMovies; i++) {
      try {
        const movieElement = movieElements[i];
        
        // 方法1：直接提取文本内容
        const movieHtml = await movieElement.evaluate(el => el.outerHTML);
        
        // 提取标题
        let title = '';
        try {
          title = await movieElement.$eval('.title', el => {
            return el.textContent.trim().split('/')[0].trim();
          });
        } catch (error) {
          // 备用方法
          const titleMatch = movieHtml.match(/<span class="title">([^<]+)<\/span>/);
          title = titleMatch ? titleMatch[1] : '未知电影';
        }
        
        // 提取URL
        let url = '';
        try {
          url = await movieElement.$eval('.hd a', el => el.href);
        } catch (error) {
          const urlMatch = movieHtml.match(/<a href="([^"]+)"/);
          url = urlMatch ? urlMatch[1] : '';
        }
        
        // 提取评分 - 多种方法尝试
        let rating = '暂无评分';
        try {
          // 方法1：直接提取评分
          rating = await movieElement.$eval('.rating_num', el => el.textContent.trim());
        } catch (error) {
          try {
            // 方法2：从HTML中匹配
            const ratingMatch = movieHtml.match(/<span class="rating_num" property="v:average">([^<]+)<\/span>/);
            rating = ratingMatch ? ratingMatch[1] : '暂无评分';
          } catch (error2) {
            rating = '暂无评分';
          }
        }
        
        // 提取评价人数 - 多种方法尝试
        let ratingCount = '0人评价';
        try {
          // 方法1：直接提取评价人数
          ratingCount = await movieElement.$eval('.star span:last-child', el => {
            const text = el.textContent;
            const match = text.match(/(\d+)人评价/);
            return match ? `${match[1]}人评价` : '0人评价';
          });
        } catch (error) {
          try {
            // 方法2：从HTML中匹配
            const countMatch = movieHtml.match(/(\d+)人评价/);
            ratingCount = countMatch ? `${countMatch[1]}人评价` : '0人评价';
          } catch (error2) {
            ratingCount = '0人评价';
          }
        }
        
        // 提取导演和年份信息
        let info = '';
        try {
          info = await movieElement.$eval('.bd p', el => {
            return el.textContent.split('\n')[0].trim();
          });
        } catch (error) {
          info = '';
        }
        
        // 提取年份
        let year = '';
        try {
          year = await movieElement.$eval('.bd p', el => {
            const text = el.textContent;
            const yearMatch = text.match(/(\d{4})/);
            return yearMatch ? yearMatch[1] : '';
          });
        } catch (error) {
          year = '';
        }
        
        const movieInfo = {
          rank: i + 1,
          title: title,
          url: url,
          rating: rating,
          ratingCount: ratingCount,
          info: info,
          year: year,
          id: extractMovieIdFromUrl(url)
        };
        
        topMovies.push(movieInfo);
        console.log(`   ${i + 1}. ${title} (${rating}分, ${ratingCount})`);
        
      } catch (error) {
        console.log(`❌ 提取第 ${i + 1} 部电影时出错:`, error.message);
        
        // 如果提取失败，尝试备用方法
        try {
          const movieElement = movieElements[i];
          const title = await movieElement.$eval('.title', el => el.textContent.trim()).catch(() => '');
          const url = await movieElement.$eval('.hd a', el => el.href).catch(() => '');
          
          if (title) {
            const movieInfo = {
              rank: i + 1,
              title: title,
              url: url,
              rating: '提取失败',
              ratingCount: '提取失败',
              info: '',
              year: '',
              id: extractMovieIdFromUrl(url)
            };
            topMovies.push(movieInfo);
            console.log(`   ${i + 1}. ${title} (评分提取失败)`);
          }
        } catch (fallbackError) {
          console.log(`❌ 备用提取方法也失败:`, fallbackError.message);
        }
      }
    }
    
    console.log(`✅ TOP电影列表提取完成，共 ${topMovies.length} 部电影`);
    return topMovies;
    
  } catch (error) {
    console.log('❌ 提取TOP电影列表失败:', error.message);
    
    // 保存错误截图用于调试
    try {
      await page.screenshot({ path: './results/top_movies_error.png', fullPage: true });
      console.log('💾 错误页面截图已保存到 ./results/top_movies_error.png');
    } catch (screenshotError) {
      console.log('❌ 无法保存错误截图:', screenshotError.message);
    }
    
    return [];
  }
}

module.exports = {
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
};
module.exports = {
  // 浏览器配置
  browser: {
    headless: false,
    slowMo: 200,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
  },

  // 超时设置
  timeouts: {
    navigation: 60000,
    elementWait: 20000
  },

  // 搜索配置
  search: {
    keywords: ['电影', '读书'],
    postsPerKeyword: 2,
    delays: {
      pageLoad: 5000,
      betweenRequests: 3000
    }
  },

  // 电影配置
  movie: {
    // 要抓取评论的特定电影
    specificMovies: [
      {
        name: '肖申克的救赎',
        url: 'https://movie.douban.com/subject/1292052/'
      },
      {
        name: '霸王别姬', 
        url: 'https://movie.douban.com/subject/1291546/'
      }
    ],
    // TOP电影配置
    topMovies: {
      enabled: true,
      count: 10, // 抓取前10部
      url: 'https://movie.douban.com/top250'
    },
    // 评论配置
    comments: {
      maxComments: 20, // 每部电影最多抓取评论数
      sortBy: 'hot' // 排序方式: hot(热门), time(最新)
    }
  },

  // 输出配置
  output: {
    directory: './results',
    includeTimestamp: true
  }
};
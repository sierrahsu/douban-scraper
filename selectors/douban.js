module.exports = {
  // 搜索结果页面选择器
  searchPage: {
    postContainer: [
      '.result',
      '.search-result .result',
      '.result-list .result',
      '.article',
      '.note-container',
      '.review-item',
      '[data-type="note"]',
      '[data-type="review"]',
      '[class*="result"]',
      '[class*="item"]'
    ],
    postTitle: '.title a, h3 a, .content a, h4 a, .text a',
    postUrl: '.title a, h3 a, .content a, h4 a, .text a',
    postBasicInfo: '.meta, .pub-time, .author, .info, .abstract'
  },

  // 内容页面选择器
  contentPage: {
    title: 'h1, .title, .article-title',
    content: '.note-container, .article, .review-content, .topic-content, .rich-content',
    author: '.author a, .user-info a, .user-name a, .name a',
    publishTime: '.pubtime, .create-time, .time, .publish-time',
    rating: '.rating_num, .star-num, .score, .rating'
  },

  // 评论页面选择器
  commentPage: {
    commentContainer: '#comments, .comment-list, .review-comments, .mod-bd',
    commentItem: '.comment-item, .comment, .review-item, .comment-bd',
    commentContent: '.comment-content, .comment-text, .review-content, .txt',
    commentAuthor: '.comment-info a, .user-name, .author, .name a',
    commentTime: '.comment-time, .create-time, .time, .pubtime',
    commentRating: '.rating, .stars, .star-num, .allstar',
    commentUseful: '.votes, .useful-num, .like-num, .count'
  },

  // 电影页面选择器
  moviePage: {
    // 电影基本信息
    movieTitle: 'h1 span[property="v:itemreviewed"]',
    movieRating: 'strong[property="v:average"]',
    movieRatingCount: 'span[property="v:votes"]',
    movieInfo: '#info',
    movieSummary: '[property="v:summary"]',
    moviePoster: '#mainpic img',
    
    // TOP250电影列表 - 修复这些选择器
    topMovieList: '.grid_view li',
    topMovieTitle: '.title', // 修复：直接使用.title
    topMovieUrl: '.hd a',
    topMovieRating: '.rating_num', // 修复：使用正确的评分选择器
    topMovieRatingCount: '.star span:last-child', // 修复：评价人数选择器
    topMovieInfo: '.bd p', // 新增：电影信息
    
    // 电影评论
    commentList: '.comment-item',
    commentAuthor: '.comment-info a',
    commentRating: '.comment-info .rating',
    commentTime: '.comment-time',
    commentContent: '.comment-content',
    commentVotes: '.votes',
    
    // 评论分页
    commentNextPage: '.comment-paginator .next a',
    
    // 热门评论
    hotComments: '.hot-comment .comment-item'
  }
};
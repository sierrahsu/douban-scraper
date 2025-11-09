# 豆瓣数据爬虫

![Node.js](https://img.shields.io/badge/Node.js-14%2B-green)
![Playwright](https://img.shields.io/badge/Playwright-1.40%2B-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![Status](https://img.shields.io/badge/状态-活跃开发中-brightgreen)

一个基于 Playwright 的豆瓣数据抓取工具，支持搜索功能、电影评论抓取和TOP10电影数据收集。

## 🚀 功能特性

- 🔍 **关键词搜索** - 支持多个关键词搜索，抓取相关内容，自动识别内容类型（电影、读书、笔记等）
- 🎬 **电影评论抓取** - 抓取特定电影的评论，同时还有电影基本信息抓取（评分、导演、演员等）
- 🏆 **TOP10电影** - 自动抓取豆瓣TOP10电影数据
- 📊 **数据导出** - 结构化JSON格式输出

## 📦 安装

1. 克隆项目
git clone https://github.com/sierrahsu/douban-scraper.git
cd douban-scraper
2. 安装依赖
npm install
3.安装浏览器（Playwright）
npx playwright install chromium
4.配置项目
编辑 config.js 文件，根据需求调整配置：
module.exports = {
  // 搜索配置
  search: {
    keywords: ['电影', '读书'],  // 搜索关键词
    postsPerKeyword: 5,          // 每个关键词抓取数量
  },
  
  // 电影配置
  movie: {
    specificMovies: [            // 要抓取的特定电影
      {
        name: '肖申克的救赎',
        url: 'https://movie.douban.com/subject/1292052/'
      }
    ],
    topMovies: {
      enabled: true,             // 是否抓取TOP10
      count: 10                  // 抓取数量
    }
  }
};

5.运行爬虫
npm start

## 📖 使用方法

1.完整运行
npm start //运行所有功能：搜索 + 电影评论 + TOP10

2.调试模式
npm run debug //调试搜索功能
npm run debug-top //调试TOP电影功能  

3.自定义运行
// 在 main.js 中导入功能模块
const { 
  scrapeSearchResults, 
  scrapeMovieComments, 
  scrapeTopMovies 
} = require('./main');

// 单独使用搜索功能
await scrapeSearchResults(page, '你的关键词');

## 📊 输出示例

1.搜索结果结构
{
  "searchResults": {
    "电影": {
      "searchTime": "2025-11-04T15:21:37.271Z",
      "totalPosts": 5,
      "posts": [
        {
          "title": "电影标题",
          "url": "https://movie.douban.com/subject/123/",
          "rating": "9.0",
          "author": "作者名",
          "content": "内容摘要...",
          "comments": [...]
        }
      ]
    }
  }
}

2.电影评论结构
{
  "movieComments": [
    {
      "title": "肖申克的救赎",
      "rating": "9.7",
      "ratingCount": "3226652人评价",
      "comments": [
        {
          "author": "用户名",
          "rating": "5星",
          "content": "经典中的经典...",
          "time": "2023-01-15 10:30:00"
        }
      ]
    }
  ]
}

## 🛠️ 项目结构

douban-scraper/
├── config.js                 # 配置文件
├── main.js                   # 主程序入口
├── debug.js                  # 搜索调试脚本
├── debug_top.js              # TOP电影调试脚本
├── package.json              # 项目依赖
├── README.md                 # 项目说明
├── .gitignore                # Git忽略文件
├── selectors/                # 页面选择器
│   └── douban.js            # 豆瓣选择器配置
└── utils/                    # 工具函数
    ├── extractors.js         # 数据提取器
    └── helpers.js            # 辅助函数

##  🎯 核心模块

1.extractors.js
     extractSearchResults() - 搜索结果的提取
     extractMovieComments() - 电影评论的提取
     extractTopMovies() - TOP10电影的提取
     extractPostDetails() - 内容详情的提取

2.helpers.js
      saveToJsonFile() - 数据保存功能
      randomDelay() - 随机延迟防封
      checkPageLoad() - 页面加载检查

欢迎提交 Issue 和 Pull Request！
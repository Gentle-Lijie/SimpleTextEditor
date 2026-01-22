/**
 * Markdown 主题配置
 * 管理所有可用的 Typora 兼容主题
 */

export type ThemeCategory = 'simple' | 'light-dark' | 'colorful' | 'vlook'
export type ThemeSize = 'small' | 'medium' | 'large'

export interface MarkdownTheme {
  id: string
  name: string
  category: ThemeCategory
  cssPath: string
  size: ThemeSize
  description?: string
}

/**
 * 所有可用的 Markdown 主题
 */
export const MARKDOWN_THEMES: MarkdownTheme[] = [
  // 简洁主题
  {
    id: 'github',
    name: 'GitHub',
    category: 'simple',
    cssPath: '/typora-themes/github.css',
    size: 'small',
    description: '经典 GitHub 风格，简洁清晰'
  },
  {
    id: 'whitey',
    name: 'Whitey',
    category: 'simple',
    cssPath: '/typora-themes/whitey.css',
    size: 'small',
    description: '纯净白色主题'
  },
  {
    id: 'newsprint',
    name: 'Newsprint',
    category: 'simple',
    cssPath: '/typora-themes/newsprint.css',
    size: 'small',
    description: '报纸印刷风格'
  },
  {
    id: 'pixyll',
    name: 'Pixyll',
    category: 'simple',
    cssPath: '/typora-themes/pixyll.css',
    size: 'small',
    description: '简约现代风格'
  },
  {
    id: 'gothic',
    name: 'Gothic',
    category: 'simple',
    cssPath: '/typora-themes/gothic.css',
    size: 'small',
    description: '哥特式风格'
  },

  // 明暗主题
  {
    id: 'everforest-dark',
    name: 'Everforest Dark',
    category: 'light-dark',
    cssPath: '/typora-themes/everforest-dark.css',
    size: 'small',
    description: '舒适的深色森林主题'
  },
  {
    id: 'everforest-light',
    name: 'Everforest Light',
    category: 'light-dark',
    cssPath: '/typora-themes/everforest-light.css',
    size: 'small',
    description: '舒适的浅色森林主题'
  },
  {
    id: 'haru',
    name: 'Haru',
    category: 'light-dark',
    cssPath: '/typora-themes/haru.css',
    size: 'small',
    description: '春日浅色主题'
  },
  {
    id: 'haru-dark',
    name: 'Haru Dark',
    category: 'light-dark',
    cssPath: '/typora-themes/haru-dark.css',
    size: 'small',
    description: '春日深色主题'
  },
  {
    id: 'night',
    name: 'Night',
    category: 'light-dark',
    cssPath: '/typora-themes/night.css',
    size: 'small',
    description: '夜间深色主题'
  },

  // 彩色主题 - Phycat 系列
  {
    id: 'phycat-dark',
    name: 'Phycat Dark',
    category: 'colorful',
    cssPath: '/typora-themes/phycat-dark.css',
    size: 'medium',
    description: 'Phycat 深色主题'
  },
  {
    id: 'phycat-green',
    name: 'Phycat Green',
    category: 'colorful',
    cssPath: '/typora-themes/phycat-green.css',
    size: 'medium',
    description: 'Phycat 绿色主题'
  },
  {
    id: 'phycat-mint',
    name: 'Phycat Mint',
    category: 'colorful',
    cssPath: '/typora-themes/phycat-mint.css',
    size: 'medium',
    description: 'Phycat 薄荷主题'
  },
  {
    id: 'phycat-orange',
    name: 'Phycat Orange',
    category: 'colorful',
    cssPath: '/typora-themes/phycat-orange.css',
    size: 'medium',
    description: 'Phycat 橙色主题'
  },
  {
    id: 'phycat-plusblue',
    name: 'Phycat Plus Blue',
    category: 'colorful',
    cssPath: '/typora-themes/phycat-plusblue.css',
    size: 'medium',
    description: 'Phycat 蓝色增强主题'
  },
  {
    id: 'phycat-purple',
    name: 'Phycat Purple',
    category: 'colorful',
    cssPath: '/typora-themes/phycat-purple.css',
    size: 'medium',
    description: 'Phycat 紫色主题'
  },
  {
    id: 'phycat-red',
    name: 'Phycat Red',
    category: 'colorful',
    cssPath: '/typora-themes/phycat-red.css',
    size: 'medium',
    description: 'Phycat 红色主题'
  },

  // VLOOK 系列 - 高级主题
  {
    id: 'vlook-fancy',
    name: 'VLOOK Fancy',
    category: 'vlook',
    cssPath: '/typora-themes/vlook-fancy.css',
    size: 'large',
    description: 'VLOOK 华丽主题（大文件）'
  },
  {
    id: 'vlook-geek',
    name: 'VLOOK Geek',
    category: 'vlook',
    cssPath: '/typora-themes/vlook-geek.css',
    size: 'large',
    description: 'VLOOK 极客主题（大文件）'
  },
  {
    id: 'vlook-hope',
    name: 'VLOOK Hope',
    category: 'vlook',
    cssPath: '/typora-themes/vlook-hope.css',
    size: 'large',
    description: 'VLOOK 希望主题（大文件）'
  },
  {
    id: 'vlook-joint',
    name: 'VLOOK Joint',
    category: 'vlook',
    cssPath: '/typora-themes/vlook-joint.css',
    size: 'large',
    description: 'VLOOK 联合主题（大文件）'
  },
  {
    id: 'vlook-solaris',
    name: 'VLOOK Solaris',
    category: 'vlook',
    cssPath: '/typora-themes/vlook-solaris.css',
    size: 'large',
    description: 'VLOOK 太阳主题（大文件）'
  },
  {
    id: 'vlook-thinking',
    name: 'VLOOK Thinking',
    category: 'vlook',
    cssPath: '/typora-themes/vlook-thinking.css',
    size: 'large',
    description: 'VLOOK 思考主题（大文件）'
  }
]

/**
 * 默认主题 ID
 */
export const DEFAULT_THEME_ID = 'github'

/**
 * 主题分类标签
 */
export const CATEGORY_LABELS: Record<ThemeCategory, string> = {
  simple: '简洁主题',
  'light-dark': '明暗主题',
  colorful: '彩色主题',
  vlook: 'VLOOK 系列'
}

/**
 * 根据 ID 获取主题
 */
export function getThemeById(id: string): MarkdownTheme | undefined {
  return MARKDOWN_THEMES.find(theme => theme.id === id)
}

/**
 * 根据分类获取主题列表
 */
export function getThemesByCategory(category: ThemeCategory): MarkdownTheme[] {
  return MARKDOWN_THEMES.filter(theme => theme.category === category)
}

/**
 * 获取所有主题分类
 */
export function getAllCategories(): ThemeCategory[] {
  return ['simple', 'light-dark', 'colorful', 'vlook']
}

/**
 * 检查主题是否为大文件
 */
export function isLargeTheme(theme: MarkdownTheme): boolean {
  return theme.size === 'large'
}

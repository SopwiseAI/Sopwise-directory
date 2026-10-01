import type { Category, Product } from "@/lib/types"

/** Storybook 共享 mock 数据（仅用于 stories，不参与生产构建）。 */

export const mockCategories: Category[] = [
  { id: "chat-assistant", name: "对话助手", icon: "message-square" },
  { id: "image-generation", name: "图像生成", icon: "image" },
  { id: "code-tools", name: "代码工具", icon: "code" },
  { id: "writing", name: "写作工具", icon: "pen-tool" },
  { id: "video", name: "视频工具", icon: "video" }
]

export const mockCategoryCounts: Record<string, number> = {
  "chat-assistant": 7,
  "image-generation": 7,
  "code-tools": 7,
  writing: 5,
  video: 5
}

export const mockProduct: Product = {
  id: "openai-chatgpt",
  name: "ChatGPT",
  description: "OpenAI 推出的对话式 AI 助手，支持文本生成、代码编写与多轮对话。",
  url: "https://chat.openai.com",
  categories: ["chat-assistant"],
  tags: ["对话", "文本生成", "OpenAI"],
  pricing: "freemium",
  featured: true,
  publishedAt: "2026-01-15",
  createdAt: "2026-01-10"
}

export const mockProducts: Product[] = [
  mockProduct,
  {
    id: "anthropic-claude",
    name: "Claude",
    description: "Anthropic 的 AI 助手，擅长长文本理解、分析与安全对齐。",
    url: "https://claude.ai",
    categories: ["chat-assistant"],
    tags: ["对话", "长文本"],
    pricing: "freemium",
    featured: true,
    publishedAt: "2026-02-01"
  },
  {
    id: "midjourney",
    name: "Midjourney",
    description: "高质量 AI 图像生成工具，以艺术风格与画面质感见长。",
    url: "https://www.midjourney.com",
    categories: ["image-generation"],
    tags: ["图像", "绘画"],
    pricing: "paid",
    publishedAt: "2026-01-20"
  },
  {
    id: "stable-diffusion",
    name: "Stable Diffusion",
    description: "开源文生图模型，可本地部署，生态与插件丰富。",
    url: "https://stability.ai",
    categories: ["image-generation"],
    tags: ["图像", "开源"],
    pricing: "opensource",
    publishedAt: "2026-01-05"
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    description: "AI 编程助手，在编辑器中实时补全代码与生成测试。",
    url: "https://github.com/features/copilot",
    categories: ["code-tools"],
    tags: ["编程", "补全"],
    pricing: "paid",
    featured: true,
    publishedAt: "2026-02-10"
  }
]

export const mockSuggestions = ["对话助手", "图像生成", "代码工具", "写作工具"]

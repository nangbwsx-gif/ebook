import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '电子样册',
  description: '电子样册 - 产品样本在线浏览',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-900 text-gray-100">{children}</body>
    </html>
  )
}

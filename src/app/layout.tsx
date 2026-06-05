import type { Metadata } from 'next'
import './globals.css'
import ThemeProvider from '@/contexts/theme'

export const metadata: Metadata = {
  title: '电子样册',
  description: '电子样册 - 产品样本在线浏览',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}

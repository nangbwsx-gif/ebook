import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* 导航 */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              E
            </div>
            <span className="text-white font-bold text-lg">电子样册</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/login" className="text-sm text-gray-400 hover:text-white transition">
              登录
            </Link>
            <Link href="/register" className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
              免费注册
            </Link>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            产品样本
            <span className="text-blue-500">在线浏览</span>
          </h1>
          <p className="text-lg text-gray-400 mb-10 leading-relaxed">
            上传PDF自动生成电子样册，支持手机、平板、电脑在线翻阅。
            每个客户拥有独立书橱，轻松管理产品资料。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-lg transition"
            >
              创建我的书橱
            </Link>
            <Link
              href="/admin/login"
              className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium text-lg transition border border-gray-700"
            >
              登录
            </Link>
          </div>

          {/* 特性 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="w-10 h-10 bg-blue-900/50 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-white font-medium mb-1">上传即用</h3>
              <p className="text-sm text-gray-500">上传PDF自动生成翻页样册，支持分类管理</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="w-10 h-10 bg-green-900/50 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-white font-medium mb-1">独立书橱</h3>
              <p className="text-sm text-gray-500">每个账号拥有专属链接，客户只看你的资料</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="w-10 h-10 bg-purple-900/50 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-white font-medium mb-1">安全隔离</h3>
              <p className="text-sm text-gray-500">数据完全隔离，每个用户只能管理自己的内容</p>
            </div>
          </div>
        </div>
      </main>

      {/* 底部 */}
      <footer className="border-t border-gray-800 py-6 text-center text-sm text-gray-600">
        Powered by 电子样册系统
      </footer>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <div className="flex gap-2 justify-center mb-4">
          <span className="loading-dot w-3 h-3 bg-blue-500 rounded-full inline-block" />
          <span className="loading-dot w-3 h-3 bg-blue-500 rounded-full inline-block" />
          <span className="loading-dot w-3 h-3 bg-blue-500 rounded-full inline-block" />
        </div>
        <p className="text-gray-500 text-sm">加载中...</p>
      </div>
    </div>
  )
}

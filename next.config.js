module.exports = {
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {               // run dev で実行時
        return [
        {
            source: '/api/:path*',
            destination: 'http://127.0.0.1:5328/api/:path*',
        },
        ]
    }
    // production(vercelで実行時)にはrewriteしない
    return [];
  },
}
module.exports = {
    publicPath: process.env.NODE_ENV === 'production'
    ? '/PicInDepth'
    : '/',
    outputDir: 'dist',
    devServer: {
        disableHostCheck: true,
        host: '0.0.0.0',
        port: 8080
    }
}
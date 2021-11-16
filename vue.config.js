module.exports = {
    publicPath: process.env.NODE_ENV === 'production'
    ? '/picindepth'
    : '/',
    outputDir: 'dist',
    devServer: {
        disableHostCheck: true,
        host: '0.0.0.0',
        port: 8080
    }
}
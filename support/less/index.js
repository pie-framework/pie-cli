module.exports = {
  rules: [
    {
      test: /\.less$/,
      use: ['style-loader', 'css-loader', 'less-loader']
    }
  ]  
}
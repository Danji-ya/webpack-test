const path = require("path");
const webpack = require("webpack");
const childProcess = require("child_process");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const mode = process.env.NODE_ENV || "development";


module.exports = {
  mode,
  entry: {
    main: "./app.js",
  },
  output: {
    filename: "[name].js",
    path: path.resolve("./dist"),
    assetModuleFilename: "[name][ext]?[hash]"
  },
  module: {
    rules: [
      {
        test: /\.(s[ac]ss|css)$/, // sass(scss), css 확장자로 끝나는 모든 파일을 의미
        use: [
          process.env.NODE_ENV === "production"
            ? MiniCssExtractPlugin.loader
            : "style-loader",
          "css-loader",
          "sass-loader"
        ],
      },
      {
        test: /\.(png|jpg|gif|svg)$/i,
        // type: "asset/resource" // file-loader와 같은 효과
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 20 * 1024, // 기준으로 20kb 로 변경
          },
        }  
      },
      {
        test: /\.js$/,
        loader: "babel-loader", // 바벨 로더
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.BannerPlugin({
      banner:`
        Build Data: ${new Date().toLocaleString()}
        Commit Version: ${childProcess.execSync('git rev-parse --short HEAD')}
        Author: ${childProcess.execSync('git config user.name')}
      `
    }),
    new webpack.DefinePlugin({
      TWO: '1+1',
      VERSION: JSON.stringify('v.1.2.3'),
      'api.domain': JSON.stringify('http://test.domain.com'),
    }),
    new HtmlWebpackPlugin({
      template: './src/index.html', // 읽어 올 템플릿 경로 지정
      templateParameters: {
        env: process.env.NODE_ENV === 'development' ? '(개발용)' : '',
      },
      minify: process.env.NODE_ENV === 'production' ? {
        collapseWhitespace: true, // 빈칸 제거
        removeComments: true, // 주석 제거
      } : false,
    }),
    new CleanWebpackPlugin(), // dist 폴더 cleaner
    ...(process.env.NODE_ENV === "production"
      ? [new MiniCssExtractPlugin({ filename: `[name].css` })]
      : []),
  ]
}
const path = require("path");
const webpack = require("webpack");
const childProcess = require("child_process");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const apiMocker = require("connect-api-mocker");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

const mode = process.env.NODE_ENV || "development";


module.exports = {
  mode,
  entry: {
    main: "./app.js",
    list: "./list.js"
  },
  output: {
    filename: "[name].js",
    path: path.resolve("./dist"),
    assetModuleFilename: "[name][ext]?[hash]"
  },
  devServer: {
    port: 9000,
    hot: true,
    client: {
      overlay: true,
    },
    onBeforeSetupMiddleware: function (devServer) {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      devServer.app.use(apiMocker('api', 'mocks/api'));
    },
  },
  optimization: {
    splitChunks: {
      chunks: "all",
    },
    minimizer: mode === "production" ? [
      new CssMinimizerPlugin(),
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true // 로그 제거
          }
        }
      })
    ] : [],
  },
  externals: {
    axios: "axios",
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
    new CopyPlugin({ // 라이브러리 복사
      patterns: [
        { 
          from: "./node_modules/axios/dist/axios.min.js",
          to: "./axios.min.js", // 목적지 파일에 들어간다
        },
      ],
    }),
  ]
}
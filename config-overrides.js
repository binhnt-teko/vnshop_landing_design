const {
    override,
    fixBabelImports,
    addLessLoader,
    disableEsLint,
    overrideDevServer,
    watchAll,
    setWebpackOptimizationSplitChunks,
    addDecoratorsLegacy,
    addWebpackModuleRule,
    addWebpackPlugin
} = require('customize-cra');

var webpack = require('webpack');

// const addLessLoader = require("customize-cra-less-loader");


const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const devWebpackConfig = () => config => {
    return {
        ...config,
        devtool: 'eval',
        optimization: {
            minimize: false,
            minimizer: [
                new CssMinimizerPlugin({}),
            ],
        },
    }
}

const devServerConfig = () => config => {
    return {
        ...config,
        port: 3001,
        proxy: {
            '/app/v1': {
                target: 'http://localhost:3005',
                changeOrigin: true,
                ws: false,
                pathRewrite: {
                    '^/app/v1': '/app/v1',
                },
                secure: false,
            },
        },
    }
}

module.exports = {
    webpack: override(
        // usual webpack plugin
        disableEsLint(),
        fixBabelImports('import', {
            libraryName: 'antd',
            libraryDirectory: 'es',
            style: true,
        }),
        addLessLoader({
            strictMath: false,
            // noIeCompat: true,
            javascriptEnabled: true,
            modifyVars: {
                "@primary-color": "#1DA57A", // for example, you use Ant Design to change theme color.
            },
            cssLoaderOptions: {}, // .less file used css-loader option, not all CSS file.
            // cssModules: {
            // modules: true,
            // compileType: "module",
            // mode: "local",
            // namedExport: true,
            // exportLocalsConvention: "camelCase",
            // exportGlobals: true,
            // exportOnlyLocals: true,
            //     localIdentName: "[path][name]__[local]--[hash:base64:5]", // if you use CSS Modules, and custom `localIdentName`, default is '[local]--[hash:base64:5]'.
            // },
        }),

        addWebpackPlugin(new webpack.LoaderOptionsPlugin({
            debug: true
        })),
        addWebpackPlugin(new MiniCssExtractPlugin({
            linkType: false,
        })),
        addWebpackModuleRule({
            test: /\.css$/i,
            use: [
                // MiniCssExtractPlugin.loader, 
                'css-loader'
            ],
        }),
        devWebpackConfig(),
    ),
    devServer: overrideDevServer(
        devServerConfig(),
        watchAll()
    )
}
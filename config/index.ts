import { defineConfig, type UserConfigExport } from '@tarojs/cli'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import devConfig from './dev'
import prodConfig from './prod'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig<'webpack5'>(async (merge) => {
  const config: UserConfigExport<'webpack5'> = {
    projectName: 'board-game-mp',
    date: '2026-06-30',
    designWidth: 750,
    deviceRatio: { 375: 2, 750: 1 },
    sourceRoot: 'src',
    outputRoot: `dist/${process.env.TARO_ENV ?? 'weapp'}`,
    framework: 'react',
    compiler: {
      type: 'webpack5',
      prebundle: {
        enable: false,
      },
    },
    cache: { enable: true },
    alias: { '@': path.resolve(__dirname, '..', 'src') },
    plugins: [],
    defineConstants: {},
    copy: { patterns: [], options: {} },
    mini: {
      postcss: {
        pxtransform: { enable: true, config: {} },
        cssModules: { enable: false, config: { namingPattern: 'module', generateScopedName: '[name]__[local]___[hash:base64:5]' } },
      },
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      postcss: {
        autoprefixer: { enable: true, config: {} },
        cssModules: { enable: false, config: { namingPattern: 'module', generateScopedName: '[name]__[local]___[hash:base64:5]' } },
      },
    },
  }

  return process.env.NODE_ENV === 'development'
    ? merge({}, config, devConfig)
    : merge({}, config, prodConfig)
})

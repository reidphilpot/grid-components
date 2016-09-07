import babel from 'rollup-plugin-babel'
import babelrc from 'babelrc-rollup'
import postcss from 'rollup-plugin-postcss'

export default {
  entry: 'src/index.js'
, dest: 'dist/grid-components.js'
, format: 'umd'
, moduleName: 'gridComponents'
, external: [
    '@zambezi/d3-utils'
  , '@zambezi/grid'
  , 'd3-dispatch'
  , 'd3-selection'
  ]
, sourceMap: true
, plugins: [
    postcss(
      {
        plugins: [ ]
      , extensions: ['.css', '.sss']
      }
    )
  , babel(babelrc())
  ]
, globals: {
    '@zambezi/d3-utils': 'd3Utils'
  , '@zambezi/grid': 'grid'
  , 'd3-dispatch': 'd3'
  , 'd3-selection': 'd3'
  }
}

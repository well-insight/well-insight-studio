// eslint.config.mjs
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    // Without `files`, they are general rules for all files
    // files: [],
    rules: {
      'unused-imports/no-unused-vars': ['off'],
      'no-console': ['warn'],
      'vue/no-unused-vars': ['off'],
      'no-debugger': ['off'],
    },
  },
)

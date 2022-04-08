module.exports = {
  extends: [require.resolve('@umijs/fabric/dist/eslint')],

  rules: {
    '@typescript-eslint/no-shadow': ['off'], // 当前作用域变量名不能与父级作用域变量同名
  },
};

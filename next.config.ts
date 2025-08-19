/** 
 * 禁用构建阶段的类型检查 & ESLint 失败阻塞。
 * 警告：这会让带类型错误的代码成功打包，需自行承担运行期风险。
 */
const nextConfig = {
  typescript: {
    // 忽略 TypeScript 类型错误导致的构建失败
    ignoreBuildErrors: true,
  },
  eslint: {
    // 构建时不因 ESLint 报错而失败
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;

# albatross

Hapi.js 构建的后台管理站点。
- backend： 使用第三方框架 rest-hapi 构建RESTful API 
- frontend：使用开源框架 element-amin 构建

功能：
- [x] RefreshToken,Token,Session
- [x] 用户管理
- [x] 认证相关（登录、登出、认证尝试、注册）
- [x] 微信、github第三方登录
- [ ] 权限管理

> Hapi是基础功能相对丰富的框架。开发人员更专注于业务，而不是花时间构建基础架构。配置驱动的模式，区别于传统的web服务器操作。他还有比一个独特功能，能够在特定的IP上创建服务器，具有类似的功能onPreHandler。再需要的时候你可以拦截特地的请求做一些必要的操作

好处：
- 提供了一个强大的插件系统，允许您快速添加新功能和修复错误
- 可扩展的API
- 对请求处理有更深层次的控制。
- 创建(REST)api的最佳选择，提供了路由、输入、输出验证和缓存
- 一次编写适配各端
- 详细的API参考和对文档生成的良好支持
- 与任何前端框架（如React，Angular和Vue.js）一起使用来创建单页面应用程序
- 基于配置的伪中间件
- 提供缓存，身份验证和输入验证
- 提供基于插件的扩展架构
- 提供非常好的企业插件，如joi，yar，catbox，boom，tv和travelogue

缺点：
- 代码结构复杂
- 插件不兼容，只能使用指定的插件如：catbox joi boom tv good travelogue等
- 端点是手动创建的，必须手动测试
- 重构是手动的
// mysql 数据库连接配置
module.exports.mysqlConfig = {
  // 主机地址
  host: process.env[`${process.env.ENV}_MYSQL_HOST`],
  // 端口
  port: process.env[`${process.env.ENV}_MYSQL_PORT`],
  // 用户名
  user: process.env[`${process.env.ENV}_MYSQL_USER`],
  // 密码
  password: process.env[`${process.env.ENV}_MYSQL_PASSWORD`],
  // 数据库名称
  database: process.env[`${process.env.ENV}_MYSQL_DATABASE`],
  // 最大连接数
  connectionLimit: 100,
  // 在初始连接到 MySQL 服务器期间发生超时之前的毫秒数
  connectTimeout: 60 * 1000,
  // 连接获取过程中发生超时前的毫秒数
  acquireTimeout: 60 * 1000,
  // 连接超时时间
  timeout: 60 * 1000,
  //允许每次查询多条 mysql 语句(有注入攻击的风险)
  // multipleStatements: true,
  // 在处理数据库中的大数(BIGINT 和 DECIMAL 列)时，您应该启用此选项
  // supportBigNumbers: true,
};

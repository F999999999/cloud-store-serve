const mysql = require("mysql");

// 导入数据库配置信息
const { mysqlConfig } = require("./config");

// 创建连接池
const pool = mysql.createPool(mysqlConfig);

// 执行 SQL 语句
module.exports.query = (sql, payload) => {
  return new Promise((resolve, reject) => {
    // 获取连接池中的连接
    pool.getConnection(function (err, connection) {
      // 未连接
      if (err) throw err;

      // 使用连接 发送SQL语句到数据库执行
      connection.query(sql, payload, function (error, results, fields) {
        // 释放连接
        connection.release();

        // 如果有错误 抛出错误
        if (error) throw error;

        // 返回数据
        resolve(results);
      });
    });
  });
};

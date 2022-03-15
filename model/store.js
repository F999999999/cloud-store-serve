const { query } = require("../utils/mysql");

// 获取货架信息
module.exports.getStore = async ({ state = 1 }) => {
  return await query(`SELECT id,name,x,y,z FROM store WHERE states = ?`, [
    state,
  ]);
};

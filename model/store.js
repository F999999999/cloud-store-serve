const { query } = require("../utils/mysql");

// 获取仓库信息
module.exports.getStore = async ({ states = 1 }) => {
  return await query(`SELECT id,name,x,y,z FROM store WHERE states = ?`, [
    states,
  ]);
};

// 获取仓库使用统计
module.exports.getStoreTotal = async ({ store_id, states = 1 }) => {
  return await query(
    `SELECT store_id,(SELECT name FROM store WHERE id = store_id) AS store_name,COUNT(case when goods_id>0 then 1 end) AS use_grid,COUNT(case when goods_id IS NULL then 1 end) AS empty_grid FROM store_shelf_grid WHERE states = ? ${
      store_id ? "AND store_id = ?" : ""
    } GROUP BY store_id`,
    [states, store_id ? store_id : null]
  );
};

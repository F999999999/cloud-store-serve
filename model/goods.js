const { query } = require("../utils/mysql");

// 获取商品信息
module.exports.getGoods = async ({ store_id, states = 1 }) => {
  return await query(
    `SELECT id,name,weight,shelflife,production_date,storage_time,store_id,shelf_id,shelf_grid_id FROM store_goods WHERE store_id = ? AND shelf_id > 0 AND states = ?`,
    [store_id, states]
  );
};

// 查询指定位置的商品
module.exports.getGoodsByPosition = async ({
  store_id,
  shelf_id,
  shelf_grid_id,
}) => {
  return await query(
    `SELECT id,name,weight,shelflife,production_date,storage_time,shelf_id,shelf_grid_id FROM store_goods WHERE store_id = ? AND shelf_id = ? AND shelf_grid_id = ? AND states = 1`,
    [store_id, shelf_id, shelf_grid_id]
  );
};

// 添加商品
module.exports.addGoods = async ({
  store_id,
  name,
  weight = -1,
  shelflife = -1,
  production_date = -1,
  storage_time = -1,
  shelf_id,
  shelf_grid_id,
  states = 1,
}) => {
  return await query(
    `INSERT INTO store_goods (store_id,name,weight,shelflife,production_date,storage_time,shelf_id,shelf_grid_id,states) VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      store_id,
      name,
      weight,
      shelflife,
      production_date,
      storage_time,
      shelf_id,
      shelf_grid_id,
      states,
    ]
  );
};

// 新增商品日志
module.exports.addGoodsLog = async ({
  goods_id,
  before_store_id,
  before_shelf_id,
  before_shelf_grid_id,
  now_store_id,
  now_shelf_id,
  now_shelf_grid_id,
  storage_time,
  takeout_time,
  operate_id,
  operate_time,
}) => {
  return await query(
    `INSERT INTO store_goods_log (goods_id,before_store_id,before_shelf_id,before_shelf_grid_id,now_store_id,now_shelf_id,now_shelf_grid_id,storage_time,takeout_time,operate_id,operate_time) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      goods_id,
      before_store_id,
      before_shelf_id,
      before_shelf_grid_id,
      now_store_id,
      now_shelf_id,
      now_shelf_grid_id,
      storage_time,
      takeout_time,
      operate_id,
      operate_time,
    ]
  );
};

// 获取商品位置信息
module.exports.getGoodsPosition = async ({ ids, states = 1 }) => {
  const payload = [states];
  const sql = ids.reduce((prev, curr, i, arr) => {
    payload.push(curr);
    return prev + "id = ?" + (i === arr.length - 1 ? ";" : " OR ");
  }, `SELECT *,store_id,shelf_id,shelf_grid_id FROM store_goods WHERE states = ? AND `);
  return await query(sql, payload);
};

// 修改商品位置信息
module.exports.updateGoodsPosition = async ({
  id,
  store_id,
  shelf_id,
  shelf_grid_id,
}) => {
  return await query(
    `UPDATE store_goods SET shelf_id = ?, shelf_grid_id = ? WHERE store_id = ? AND id = ?`,
    [shelf_id, shelf_grid_id, store_id, id]
  );
};

// 修改商品状态
module.exports.updateGoodsState = async ({ ids, states = 1 }) => {
  const payload = [states];
  const sql = ids.reduce((prev, curr, i, arr) => {
    payload.push(curr);
    return prev + "id = ?" + (i === arr.length - 1 ? ";" : " OR ");
  }, `UPDATE store_goods SET states = ? WHERE `);
  return await query(sql, payload);
};

// 模糊搜索商品
module.exports.fuzzySearchGoodsByName = async ({
  store_id,
  name,
  states = 1,
}) => {
  return await query(
    `SELECT id,name,weight,shelflife,production_date,storage_time,shelf_id,shelf_grid_id FROM store_goods WHERE ${
      store_id ? "store_id = ? AND " : ""
    }states = ? AND name LIKE '%${name}%'`,
    store_id ? [store_id, states] : [states]
  );
};

// 查询商品日志
module.exports.getGoodsLog = async ({
  store_id,
  page_num = 1,
  page_size = 10,
}) => {
  const payload = [(page_num - 1) * page_size, page_size];
  // 如果有仓库ID添加需要查询的仓库ID
  store_id && payload.unshift(store_id, store_id);
  return await query(
    `
SELECT 
id,
goods_id,
(SELECT name FROM store_goods WHERE id = goods_id) AS goods_name,
before_store_id,
CASE WHEN before_store_id > 0 THEN (SELECT name FROM store WHERE id = before_store_id) ELSE null END AS before_store_name,
before_shelf_id,
CASE WHEN before_shelf_id > 0 THEN (SELECT name FROM store_shelf WHERE id = before_shelf_id) ELSE null END AS before_shelf_name,
before_shelf_grid_id,
CASE WHEN before_shelf_grid_id > 0 THEN (SELECT x FROM store_shelf_grid WHERE store_shelf_grid.goods_id = store_goods_log.goods_id) ELSE null END AS before_shelf_grid_x,
CASE WHEN before_shelf_grid_id > 0 THEN (SELECT y FROM store_shelf_grid WHERE store_shelf_grid.goods_id = store_goods_log.goods_id) ELSE null END AS before_shelf_grid_y,
CASE WHEN before_shelf_grid_id > 0 THEN (SELECT z FROM store_shelf_grid WHERE store_shelf_grid.goods_id = store_goods_log.goods_id) ELSE null END AS before_shelf_grid_z,
now_store_id,
CASE WHEN now_store_id > 0 THEN (SELECT name FROM store WHERE id = now_store_id) ELSE null END AS now_store_name,
now_shelf_id,
CASE WHEN now_shelf_id > 0 THEN (SELECT name FROM store_shelf WHERE id = now_shelf_id) ELSE null END AS now_shelf_name,
now_shelf_grid_id,
CASE WHEN now_shelf_grid_id > 0 THEN (SELECT x FROM store_shelf_grid WHERE store_shelf_grid.goods_id = store_goods_log.goods_id) ELSE null END AS now_shelf_grid_x,
CASE WHEN now_shelf_grid_id > 0 THEN (SELECT y FROM store_shelf_grid WHERE store_shelf_grid.goods_id = store_goods_log.goods_id) ELSE null END AS now_shelf_grid_y,
CASE WHEN now_shelf_grid_id > 0 THEN (SELECT z FROM store_shelf_grid WHERE store_shelf_grid.goods_id = store_goods_log.goods_id) ELSE null END AS now_shelf_grid_z,
storage_time,
takeout_time,
operate_id,
(SELECT username FROM sys_user WHERE id = operate_id) AS operate_name,operate_time 
FROM store_goods_log 
${store_id ? "WHERE before_store_id = ? OR now_store_id = ? " : ""}
order by operate_time desc 
LIMIT ?,?
`,
    payload
  );
};

// 根据商品ID查询商品日志
module.exports.getGoodsLogByGoodsId = async ({ goods_id }) => {
  return await query(
    `
SELECT 
id,
goods_id,
(SELECT name FROM store_goods WHERE id = goods_id) AS goods_name,
before_store_id,
CASE WHEN before_store_id > 0 THEN (SELECT name FROM store WHERE id = before_store_id) ELSE null END AS before_store_name,
before_shelf_id,
CASE WHEN before_shelf_id > 0 THEN (SELECT name FROM store_shelf WHERE id = before_shelf_id) ELSE null END AS before_shelf_name,
before_shelf_grid_id,
CASE WHEN before_shelf_grid_id > 0 THEN (SELECT x FROM store_shelf_grid WHERE store_shelf_grid.goods_id = store_goods_log.goods_id) ELSE null END AS before_shelf_grid_x,
CASE WHEN before_shelf_grid_id > 0 THEN (SELECT y FROM store_shelf_grid WHERE store_shelf_grid.goods_id = store_goods_log.goods_id) ELSE null END AS before_shelf_grid_y,
CASE WHEN before_shelf_grid_id > 0 THEN (SELECT z FROM store_shelf_grid WHERE store_shelf_grid.goods_id = store_goods_log.goods_id) ELSE null END AS before_shelf_grid_z,
now_store_id,
CASE WHEN now_store_id > 0 THEN (SELECT name FROM store WHERE id = now_store_id) ELSE null END AS now_store_name,
now_shelf_id,
CASE WHEN now_shelf_id > 0 THEN (SELECT name FROM store_shelf WHERE id = now_shelf_id) ELSE null END AS now_shelf_name,
now_shelf_grid_id,
CASE WHEN now_shelf_grid_id > 0 THEN (SELECT x FROM store_shelf_grid WHERE store_shelf_grid.goods_id = store_goods_log.goods_id) ELSE null END AS now_shelf_grid_x,
CASE WHEN now_shelf_grid_id > 0 THEN (SELECT y FROM store_shelf_grid WHERE store_shelf_grid.goods_id = store_goods_log.goods_id) ELSE null END AS now_shelf_grid_y,
CASE WHEN now_shelf_grid_id > 0 THEN (SELECT z FROM store_shelf_grid WHERE store_shelf_grid.goods_id = store_goods_log.goods_id) ELSE null END AS now_shelf_grid_z,
storage_time,
takeout_time,
operate_id,
(SELECT username FROM sys_user WHERE id = operate_id) AS operate_name,operate_time
FROM store_goods_log
WHERE goods_id = ?
`,
    [goods_id]
  );
};

// 获取临期商品
module.exports.getExpireGoods = async ({
  store_id,
  page_num = 1,
  page_size = 10,
}) => {
  // 查询参数
  const payload = [(page_num - 1) * page_size, page_size];
  store_id ? payload.unshift(store_id) : null;

  return await query(
    `SELECT id,name,weight,shelflife,production_date,production_date+shelflife*86400 AS expiration_time,storage_time,store_id,shelf_id,shelf_grid_id FROM store_goods WHERE ${
      store_id ? "store_id = ? AND " : ""
    }states = 1 ORDER BY expiration_time LIMIT ?,?`,
    payload
  );
};

// 获临期商品统计
module.exports.getExpireGoodsTotal = async () => {
  return await query(
    `
SELECT 
store_id,
(SELECT name FROM store WHERE id = store_id) AS store_name,
COUNT(CASE WHEN production_date + shelflife * 86400 - unix_timestamp(now()) > 0 AND production_date + shelflife * 86400 - unix_timestamp(now()) < shelflife * 86400 * 0.2 THEN 1 ELSE NULL END) AS 'will_expire',
COUNT(CASE WHEN production_date + shelflife * 86400 - unix_timestamp(now()) < 0 THEN 1 ELSE NULL END) AS 'expired',
COUNT(CASE WHEN production_date + shelflife * 86400 - unix_timestamp(now()) > shelflife * 86400 * 0.2 THEN 1 ELSE NULL END) AS 'normal'
FROM store_goods 
WHERE states = 1 
GROUP BY store_id
`
  );
};

const { query } = require("../utils/mysql");

// 获取商品信息
module.exports.getGoods = async ({ store_id, state = 1 }) => {
  return await query(
    `SELECT id,name,weight,shelflife,production_date,storage_time,store_id,shelf_id,shelf_grid_id FROM store_goods WHERE store_id = ? AND shelf_id > 0 AND states = ?`,
    [store_id, state]
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
  state = 1,
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
      state,
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
  operate_time,
}) => {
  return await query(
    `INSERT INTO store_goods_log (goods_id,before_store_id,before_shelf_id,before_shelf_grid_id,now_store_id,now_shelf_id,now_shelf_grid_id,storage_time,takeout_time,operate_time) VALUES (?,?,?,?,?,?,?,?,?,?)`,
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
      operate_time,
    ]
  );
};

// 获取商品位置信息
module.exports.getGoodsPosition = async ({ ids, state = 1 }) => {
  const sql = ids.reduce(
    (prev, curr, i, arr) =>
      prev + `id = ${curr}` + (i === arr.length - 1 ? ";" : " OR "),
    `SELECT *,store_id,shelf_id,shelf_grid_id FROM store_goods WHERE states = ? AND `
  );
  return await query(sql, [state]);
};

// 修改商品位置信息
module.exports.updateGoodsPosition = async ({
  store_id,
  id,
  shelf_id,
  shelf_grid_id,
}) => {
  return await query(
    `UPDATE store_goods SET shelf_id = ?, shelf_grid_id = ? WHERE store_id = ? AND id = ?`,
    [shelf_id, shelf_grid_id, store_id, id]
  );
};

// 修改商品状态
module.exports.updateGoodsState = async ({ ids, states }) => {
  const sql = ids.reduce(
    (prev, curr, i, arr) =>
      prev + `id = ${curr}` + (i === arr.length - 1 ? ";" : " OR "),
    `UPDATE store_goods SET states = ? WHERE `
  );
  return await query(sql, [states]);
};

// 模糊搜索商品
module.exports.fuzzySearchGoodsByName = async ({
  store_id,
  name,
  state = 1,
}) => {
  return await query(
    `SELECT id,name,weight,shelflife,production_date,storage_time,shelf_id,shelf_grid_id FROM store_goods WHERE ${
      store_id ? "store_id = ? AND " : ""
    }states = ? AND name LIKE '%${name}%'`,
    store_id ? [store_id, state] : [state]
  );
};

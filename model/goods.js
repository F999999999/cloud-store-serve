const { query } = require("../utils/mysql");

// 获取商品信息
module.exports.getGoods = async ({ state = 1 }) => {
  return await query(
    `SELECT id,name,weight,shelflife,production_date,storage_time,shelf_id,shelf_grid_id FROM store_goods WHERE shelf_id > 0 AND states = ?`,
    [state]
  );
};

// 查询指定位置的商品
module.exports.getGoodsByPosition = async ({ shelf_id, shelf_grid_id }) => {
  return await query(
    `SELECT id,name,weight,shelflife,production_date,storage_time,shelf_id,shelf_grid_id FROM store_goods WHERE shelf_id = ? AND shelf_grid_id = ? AND states = 1`,
    [shelf_id, shelf_grid_id]
  );
};

// 添加商品
module.exports.addGoods = async ({
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
    `INSERT INTO store_goods (name,weight,shelflife,production_date,storage_time,shelf_id,shelf_grid_id,states) VALUES (?,?,?,?,?,?,?,?)`,
    [
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
  before_shelf_id,
  before_shelf_grid_id,
  now_shelf_id,
  now_shelf_grid_id,
  storage_time,
  takeout_time,
  operate_time,
}) => {
  return await query(
    `INSERT INTO store_goods_log (goods_id,before_shelf_id,before_shelf_grid_id,now_shelf_id,now_shelf_grid_id,storage_time,takeout_time,operate_time) VALUES (?,?,?,?,?,?,?,?)`,
    [
      goods_id,
      before_shelf_id,
      before_shelf_grid_id,
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
    `SELECT *,shelf_id,shelf_grid_id FROM store_goods WHERE states = ? AND `
  );

  console.log("getGoodsPosition", sql);
  return await query(sql, [state]);
};

// 修改商品位置信息
module.exports.updateGoodsPosition = async ({
  id,
  shelf_id,
  shelf_grid_id,
}) => {
  return await query(
    `UPDATE store_goods SET shelf_id = ?, shelf_grid_id = ? WHERE id = ?`,
    [shelf_id, shelf_grid_id, id]
  );
};

// 修改商品状态
module.exports.updateGoodsState = async ({ ids, states }) => {
  const sql = ids.reduce(
    (prev, curr, i, arr) =>
      prev + `id = ${curr}` + (i === arr.length - 1 ? ";" : " OR "),
    `UPDATE store_goods SET states = ? WHERE `
  );
  console.log("updateGoodsState", sql);
  return await query(sql, [states]);
};

// 模糊搜索商品
module.exports.fuzzySearchGoodsByName = async ({ name, state = 1 }) => {
  return await query(
    `SELECT id,name,weight,shelflife,production_date,storage_time,shelf_id,shelf_grid_id FROM store_goods WHERE states = ? AND name LIKE '%${name}%'`,
    [state]
  );
};

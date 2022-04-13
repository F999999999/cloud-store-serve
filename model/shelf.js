const { query } = require("../utils/mysql");

// 获取货架信息
module.exports.getShelf = async ({
  store_id,
  shelf_states = 1,
  goods_states = 1,
}) => {
  const payload = [shelf_states, goods_states];
  store_id && payload.push(store_id);
  return await query(
    `SELECT a.id,a.name,a.length,a.width,a.height,a.x,a.y,a.z,a.store_id,b.goods_id,b.shelf_grid_id,b.x AS grid_x,b.y AS grid_y,b.z AS grid_z FROM store_shelf AS a,store_shelf_grid AS b WHERE ${
      store_id ? `a.store_id = ? AND` : ""
    } a.id = b.shelf_id AND a.states = ? AND b.states = ?`,
    payload
  );
};

// 查询指定位置的货架
module.exports.getShelfByPosition = async ({ store_id, x, y, z = 1 }) => {
  return await query(
    `SELECT id,store_id,name,length,width,height FROM store_shelf WHERE store_id = ? AND x = ? AND y = ? AND z = ?`,
    [store_id, x, y, z]
  );
};

// 添加货架
module.exports.addShelf = async ({
  store_id,
  name,
  length,
  width,
  height,
  x,
  y,
  z,
}) => {
  return await query(
    `INSERT INTO store_shelf (store_id,name,length,width,height,x,y,z) VALUES (?,?,?,?,?,?,?,?)`,
    [store_id, name, length, width, height, x, y, z]
  );
};

// 设置货架格子当前的商品
module.exports.updateShelfGridGoods = async ({
  store_id,
  goods_id,
  shelf_id,
  shelf_grid_id,
}) => {
  return await query(
    `UPDATE store_shelf_grid SET goods_id = ? WHERE store_id = ? AND shelf_id = ? AND shelf_grid_id = ?`,
    [goods_id, store_id, shelf_id, shelf_grid_id]
  );
};

// 添加货架格子
module.exports.addShelfGrid = async ({
  store_id,
  shelf_id,
  max_x,
  max_y,
  max_z,
}) => {
  const arr = [];
  const payload = [];
  for (let i = 0; i <= max_y; i++) {
    for (let j = 0; j <= max_x; j++) {
      for (let k = 0; k <= max_z; k++) {
        arr.push(`(?,?,?,?,?,?)`);
        payload.push(store_id, shelf_id, arr.length, j, i, k);
      }
    }
  }
  const sql = arr.reduce(
    (prev, curr, i) => prev + curr + (i === arr.length - 1 ? ";" : ","),
    `INSERT INTO store_shelf_grid (store_id,shelf_id,shelf_grid_id,x,y,z) VALUES `
  );
  return await query(sql, payload);
};

// 获取空货架格子
module.exports.getEmptyShelfGrid = async ({ store_id, states = 1 }) => {
  return await query(
    `SELECT shelf_id,shelf_grid_id,x,y,z FROM store_shelf_grid WHERE store_id = ? AND states = ? AND goods_id IS ?`,
    [store_id, states, null]
  );
};

// 获取货架使用统计
module.exports.getShelfTotal = async ({ shelf_id, states = 1 }) => {
  return await query(
    `SELECT store_id,(SELECT name FROM store WHERE id = store_id) AS store_name,shelf_id,(SELECT name FROM store_shelf WHERE id = shelf_id) AS shelf_name,COUNT(case when goods_id>0 then 1 end) AS use_grid,COUNT(case when goods_id IS NULL then 1 end) AS empty_grid FROM store_shelf_grid WHERE states = ? ${
      shelf_id ? "AND store_id = ?" : ""
    } GROUP BY shelf_id;`,
    [states, shelf_id ? shelf_id : null]
  );
};

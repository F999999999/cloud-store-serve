const { query } = require("../utils/mysql");

// 获取货架信息
module.exports.getShelf = async ({ shelf_state = 1, goods_state = 1 }) => {
  return await query(
    `SELECT a.id,a.name,a.length,a.width,a.height,a.x,a.y,a.z,b.goods_id,b.shelf_grid_id,b.x AS grid_x,b.y AS grid_y,b.z AS grid_z FROM store_shelf AS a,store_shelf_grid AS b WHERE a.states = ? AND b.states = ? AND a.id = b.shelf_id`,
    [shelf_state, goods_state]
  );
};

// 查询指定位置的货架
module.exports.getShelfByPosition = async ({ x, y, z }) => {
  return await query(
    `SELECT id,name,length,width,height FROM store_shelf WHERE x = ? AND y = ? AND z = 1`,
    [x, y, z]
  );
};

// 添加货架
module.exports.addShelf = async ({ name, length, width, height, x, y, z }) => {
  return await query(
    `INSERT INTO store_shelf (name,length,width,height,x,y,z) VALUES (?,?,?,?,?,?,?)`,
    [name, length, width, height, x, y, z]
  );
};

// 设置货架格子当前的商品
module.exports.updateShelfGridGoods = async ({
  goods_id,
  shelf_id,
  shelf_grid_id,
}) => {
  return await query(
    `UPDATE store_shelf_grid SET goods_id = ? WHERE shelf_id = ? AND shelf_grid_id = ?`,
    [goods_id, shelf_id, shelf_grid_id]
  );
};

// 添加货架格子
module.exports.addShelfGrid = async ({ shelf_id, max_x, max_y, max_z }) => {
  const arr = [];
  for (let i = 0; i <= max_y; i++) {
    for (let j = 0; j <= max_x; j++) {
      for (let k = 0; k <= max_z; k++) {
        arr.push(`(${shelf_id},${arr.length + 1},${j},${i},${k})`);
      }
    }
  }
  const sql = arr.reduce(
    (prev, curr, i) => prev + curr + (i === arr.length - 1 ? ";" : ","),
    `INSERT INTO store_shelf_grid (shelf_id,shelf_grid_id,x,y,z) VALUES `
  );
  return await query(sql);
};

// 获取空货架格子
module.exports.getEmptyShelfGrid = async ({ state = 1 }) => {
  return await query(
    `SELECT shelf_id,shelf_grid_id,x,y,z FROM store_shelf_grid WHERE states = ? AND goods_id IS ?`,
    [state, null]
  );
};

const {
  getShelf,
  getEmptyShelfGrid,
  getShelfByPosition,
  addShelf,
  addShelfGrid,
} = require("../model/shelf");

// 货架信息
module.exports.shelfController = async (ctx, next) => {
  // 获取货架信息
  const result = await getShelf({ shelf_state: 1, goods_state: 1 });
  const data = [];
  // 货架统计
  const total = {
    shelf: 0,
    useGrid: 0,
    emptyGrid: 0,
  };
  result.forEach((item) => {
    if (!data.find((item2) => item2.id === item.id)) {
      const obj = {
        ...item,
        size: {
          length: item.length,
          width: item.width,
          height: item.height,
        },
        position: {
          x: item.x,
          y: item.y,
          z: item.z,
        },
      };
      // 删除多余的数据
      delete obj.length;
      delete obj.width;
      delete obj.height;
      delete obj.x;
      delete obj.y;
      delete obj.z;
      delete obj.goods_id;
      // 货架格子
      obj.shelf_grid = [];
      // 货架格子统计
      obj.total = {
        useGrid: 0,
        emptyGrid: 0,
      };
      data.push(obj);
      total.shelf++;
    }

    // 当前货架索引
    const index = data.findIndex((item2) => item2.id === item.id);
    // 添加货架格子信息
    data[index].shelf_grid.push({
      goods_id: item.goods_id,
      shelf_grid_id: item.shelf_grid_id,
      position: {
        x: item.grid_x,
        y: item.grid_y,
        z: item.grid_z,
      },
    });

    // 判断货架格子上是否有货物
    if (item.goods_id > 0) {
      // 已使用货架格子++
      data[index].total.useGrid++;
      total.useGrid++;
    } else {
      // 未使用货架格子++
      data[index].total.emptyGrid++;
      total.emptyGrid++;
    }
  });

  // 返回数据
  ctx.body = {
    status: 200,
    message: "获取货架信息成功",
    data: data,
    total,
  };
};

// 新增货架
module.exports.addShelfController = async (ctx, next) => {
  // 获取参数
  const { name, length, width, height, x, y, z } = ctx.request.body;

  // 校验参数
  if (!name) {
    ctx.body = {
      status: 400,
      message: "货架名称不能为空",
    };
    return;
  }
  if (!length) {
    ctx.body = {
      status: 400,
      message: "货架长度不能为空",
    };
    return;
  }
  if (!width) {
    ctx.body = {
      status: 400,
      message: "货架宽度不能为空",
    };
    return;
  }
  if (!height) {
    ctx.body = {
      status: 400,
      message: "货架高度不能为空",
    };
    return;
  }
  if (!x) {
    ctx.body = {
      status: 400,
      message: "货架X坐标不能为空",
    };
    return;
  }
  if (!y) {
    ctx.body = {
      status: 400,
      message: "货架Y坐标不能为空",
    };
    return;
  }
  if (!z) {
    ctx.body = {
      status: 400,
      message: "货架Z坐标不能为空",
    };
  }

  // 查询货架是否存在
  const shelf = await getShelfByPosition({ x, y, z });
  if (shelf.length > 0) {
    ctx.body = {
      status: 400,
      message: "该位置已存在货架，无需重新添加",
    };
    return;
  }

  // 新增货架
  const result = await addShelf({ name, length, width, height, x, y, z });
  // 判断是否新增成功
  if (result.affectedRows > 0) {
    // 新增货架格子
    const gridResult = await addShelfGrid({
      shelf_id: result.insertId,
      max_x: 1,
      max_y: 3,
      max_z: 8,
    });
    if (gridResult.affectedRows > 0) {
      ctx.body = {
        status: 200,
        message: "新增货架成功",
      };
    } else {
      ctx.body = {
        status: 400,
        message: "新增货架失败",
      };
    }
  } else {
    ctx.body = {
      status: 400,
      message: "新增货架失败",
    };
  }
};

// 获取空货架格子
module.exports.getEmptyShelfGridController = async (ctx, next) => {
  // 搜索商品
  const shelfGrid = await getEmptyShelfGrid({ state: 1 });
  // 判断是否搜索到商品
  if (shelfGrid.length <= 0) {
    ctx.body = {
      status: 400,
      message: "没有找到空货架格子",
    };
    return;
  }

  ctx.body = {
    status: 200,
    message: "总共有" + shelfGrid.length + "个空货架格子",
    data: shelfGrid,
  };
};

const {
  getShelf,
  getEmptyShelfGrid,
  getShelfByPosition,
  addShelf,
  addShelfGrid,
  getShelfTotal,
} = require("../model/shelf");

// 货架信息
module.exports.shelfController = async (ctx, next) => {
  // 获取参数
  const { store_id } = ctx.request.query;
  // 校验参数
  if (!store_id) {
    return (ctx.body = {
      code: 400,
      msg: "仓库ID不能为空",
    });
  }
  // 获取货架信息
  const result = await getShelf({ store_id, shelf_states: 1, goods_states: 1 });
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
  const { store_id, name, length, width, height, x, y, z } = ctx.request.body;

  // 校验参数
  if (!store_id) {
    return (ctx.body = {
      code: 400,
      msg: "仓库ID不能为空",
    });
  }
  if (!name) {
    return (ctx.body = {
      status: 400,
      message: "货架名称不能为空",
    });
  }
  if (!length) {
    return (ctx.body = {
      status: 400,
      message: "货架长度不能为空",
    });
  }
  if (!width) {
    return (ctx.body = {
      status: 400,
      message: "货架宽度不能为空",
    });
  }
  if (!height) {
    return (ctx.body = {
      status: 400,
      message: "货架高度不能为空",
    });
  }
  if (!x) {
    return (ctx.body = {
      status: 400,
      message: "货架X坐标不能为空",
    });
  }
  if (!y) {
    return (ctx.body = {
      status: 400,
      message: "货架Y坐标不能为空",
    });
  }
  if (!z) {
    return (ctx.body = {
      status: 400,
      message: "货架Z坐标不能为空",
    });
  }

  // 查询货架是否存在
  const shelf = await getShelfByPosition({ store_id, x, y, z });
  if (shelf.length > 0) {
    return (ctx.body = {
      status: 400,
      message: "该位置已存在货架，无需重新添加",
    });
  }

  // 新增货架
  const result = await addShelf({
    store_id,
    name,
    length,
    width,
    height,
    x,
    y,
    z,
  });
  // 判断是否新增成功
  if (result.affectedRows > 0) {
    // 新增货架格子
    const gridResult = await addShelfGrid({
      store_id,
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
  // 获取参数
  const { store_id } = ctx.request.query;
  // 校验参数
  if (!store_id) {
    return (ctx.body = {
      code: 400,
      msg: "仓库ID不能为空",
    });
  }
  // 搜索商品
  const shelfGrid = await getEmptyShelfGrid({
    store_id: Number(store_id),
    states: 1,
  });
  // 判断是否搜索到商品
  if (shelfGrid.length <= 0) {
    return (ctx.body = {
      status: 400,
      message: "没有找到空货架格子",
    });
  }

  ctx.body = {
    status: 200,
    message: "总共有" + shelfGrid.length + "个空货架格子",
    data: shelfGrid,
  };
};

// 获取货架使用统计
module.exports.shelfTotalController = async (ctx, next) => {
  // 获取参数
  const { shelf_id } = ctx.request.query;

  // 获取货架信息
  const result = await getShelfTotal({ shelf_id, states: 1 });

  const total = {
    total_grid: 0,
    use_grid: 0,
    empty_grid: 0,
  };
  // 按仓库统计
  const store_total = [];
  // 统计数据
  result.forEach((item, i, arr) => {
    const total_grid = item.use_grid + item.empty_grid;
    arr[i].total_grid = total_grid;
    total.total_grid += total_grid;
    total.use_grid += item.use_grid;
    total.empty_grid += item.empty_grid;
    // 按仓库统计
    const index = store_total.findIndex(
      (item2) => item.store_id === item2.store_id
    );
    if (index >= 0) {
      store_total[index].total_grid += total_grid;
      store_total[index].use_grid += item.use_grid;
      store_total[index].empty_grid += item.empty_grid;
    } else {
      store_total.push({
        store_id: item.store_id,
        store_name: item.store_name,
        total_grid: total_grid,
        use_grid: item.use_grid,
        empty_grid: item.empty_grid,
      });
    }
  });
  // 返回数据
  ctx.body = {
    status: 200,
    message: "获取货架使用统计成功",
    data: { list: result, store_total, total },
  };
};

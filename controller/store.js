const { getStore, getStoreTotal } = require("../model/store");

// 获取仓库信息
module.exports.storeController = async (ctx, next) => {
  // 获取仓库信息
  const result = await getStore({ states: 1 });

  // 返回数据
  ctx.body = {
    status: 200,
    message: "获取仓库信息成功",
    data: result,
  };
};

// 获取仓库使用统计
module.exports.storeTotalController = async (ctx, next) => {
  // 获取参数
  const { store_id } = ctx.request.query;
  // 获取仓库信息
  const result = await getStoreTotal({ store_id, states: 1 });

  const total = {
    total_grid: 0,
    use_grid: 0,
    empty_grid: 0,
  };
  // 统计数据
  result.forEach((item, i, arr) => {
    const total_grid = item.use_grid + item.empty_grid;
    arr[i].total_grid = total_grid;
    total.total_grid += total_grid;
    total.use_grid += item.use_grid;
    total.empty_grid += item.empty_grid;
  });
  // 返回数据
  ctx.body = {
    status: 200,
    message: "获取仓库使用统计成功",
    data: { list: result, total },
  };
};

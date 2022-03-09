const {
  getGoods,
  addGoods,
  getGoodsByPosition,
  addGoodsLog,
  getGoodsPosition,
  updateGoodsPosition,
  updateGoodsState,
  fuzzySearchGoodsByName,
} = require("../model/goods");
const { updateShelfGridGoods } = require("../model/shelf");

// 获取商品信息
module.exports.getGoodsController = async (ctx, next) => {
  const data = await getGoods({ state: 1 });
  ctx.body = {
    status: 200,
    message: "获取商品信息成功",
    data,
  };
};

// 添加商品
module.exports.addGoodsController = async (ctx, next) => {
  const {
    name,
    weight,
    shelflife,
    production_date,
    storage_time,
    shelf_id,
    shelf_grid_id,
  } = ctx.request.body;
  // 判断该位置是否已经有商品
  const goods = await getGoodsByPosition({ shelf_id, shelf_grid_id });
  if (goods.length > 0) {
    ctx.body = {
      status: 400,
      message: "该位置已有商品",
    };
    return;
  }

  // 添加商品
  const result = await addGoods({
    name,
    weight,
    shelflife,
    production_date,
    storage_time,
    shelf_id,
    shelf_grid_id,
  });
  // 设置货架格子当前的商品
  const goodsResult = await updateShelfGridGoods({
    goods_id: result.insertId,
    shelf_id: Number(shelf_id),
    shelf_grid_id: Number(shelf_grid_id),
  });
  // 判断商品是否添加成功
  if (result.serverStatus === 2 && goodsResult.changedRows > 0) {
    // 新增商品日志
    await addGoodsLog({
      goods_id: result.insertId,
      now_shelf_id: Number(shelf_id),
      now_shelf_grid_id: Number(shelf_grid_id),
      storage_time: Number(storage_time) || 0,
      operate_time: Math.round(new Date() / 1000),
    });
    ctx.body = {
      status: 200,
      message: "添加成功",
      data: {
        goods_id: result.insertId,
        name,
        shelf_id: Number(shelf_id),
        shelf_grid_id: Number(shelf_grid_id),
      },
    };
  } else {
    ctx.body = {
      status: 400,
      message: "添加失败",
    };
  }
};

// 移动商品
module.exports.moveGoodsController = async (ctx, next) => {
  const { id, shelf_id, shelf_grid_id } = ctx.request.body;
  // 判断该位置是否已经有商品
  const goods = await getGoodsByPosition({ shelf_id, shelf_grid_id });
  if (goods.length > 0) {
    ctx.body = {
      status: 400,
      message: "该位置已有商品，请换个位置",
    };
    return;
  }
  // 获取商品当前位置信息
  const goodsPosition = await getGoodsPosition({ id });
  // 修改商品位置信息
  const result = await updateGoodsPosition({ id, shelf_id, shelf_grid_id });
  // 清除旧货架格子的商品
  const oldGoodsResult = await updateShelfGridGoods({
    goods_id: null,
    shelf_id: goodsPosition[0].shelf_id,
    shelf_grid_id: goodsPosition[0].shelf_grid_id,
  });
  // 设置新货架格子当前的商品
  const newGoodsResult = await updateShelfGridGoods({
    goods_id: id,
    shelf_id,
    shelf_grid_id,
  });
  // 判断商品位置是否修改成功
  if (
    result.serverStatus === 2 &&
    oldGoodsResult.changedRows > 0 &&
    newGoodsResult.changedRows > 0
  ) {
    // 新增商品日志
    await addGoodsLog({
      goods_id: id,
      before_shelf_id: goodsPosition[0].shelf_id,
      before_shelf_grid_id: goodsPosition[0].shelf_grid_id,
      now_shelf_id: Number(shelf_id),
      now_shelf_grid_id: Number(shelf_grid_id),
      operate_time: Math.round(new Date() / 1000),
    });
    ctx.body = {
      status: 200,
      message: "移动成功",
      data: {
        goods_id: Number(id),
        before_shelf_id: goodsPosition[0].shelf_id,
        before_shelf_grid_id: goodsPosition[0].shelf_grid_id,
        shelf_id: Number(shelf_id),
        shelf_grid_id: Number(shelf_grid_id),
      },
    };
  } else {
    ctx.body = {
      status: 400,
      message: "移动失败",
    };
  }
};

// 移除商品
module.exports.removeGoodsController = async (ctx, next) => {
  const { ids, takeout_time } = ctx.request.body;
  console.log(ids);
  // 获取商品当前位置信息
  const goodsPosition = await getGoodsPosition({ ids });
  console.log("goodsPosition", goodsPosition);
  // 判断商品是否存在
  if (goodsPosition.length <= 0) {
    ctx.body = {
      status: 400,
      message: "商品不存在",
    };
    return;
  }
  // 修改商品状态
  const result = await updateGoodsState({
    ids,
    states: 0,
  });
  const oldGoodsResultList = [];
  // 清除旧货架格子的商品
  for (const item of goodsPosition) {
    oldGoodsResultList.push(
      await updateShelfGridGoods({
        goods_id: null,
        shelf_id: item.shelf_id,
        shelf_grid_id: item.shelf_grid_id,
      })
    );
  }

  // 判断商品位置是否修改成功
  if (
    result.serverStatus === 2 &&
    oldGoodsResultList.filter((item) => item.changedRows > 0).length ===
      ids.length
  ) {
    const data = [];
    // 新增商品日志
    for (let i = 0; i < goodsPosition.length; i++) {
      await addGoodsLog({
        goods_id: ids[i],
        before_shelf_id: goodsPosition[i].shelf_id,
        before_shelf_grid_id: goodsPosition[i].shelf_grid_id,
        takeout_time,
        operate_time: Math.round(new Date() / 1000),
      });
      data.push({
        goods_id: Number(ids[i]),
        before_shelf_id: goodsPosition[i].shelf_id,
        before_shelf_grid_id: goodsPosition[i].shelf_grid_id,
      });
    }

    ctx.body = {
      status: 200,
      message: "移除成功",
      data,
    };
  } else {
    ctx.body = {
      status: 400,
      message: "移除失败",
      goods_id: ids,
    };
  }
};

// 模糊搜索商品
module.exports.fuzzySearchGoodsController = async (ctx, next) => {
  const { name } = ctx.request.query;
  // 搜索商品
  const goods = await fuzzySearchGoodsByName({ name });
  // 判断是否搜索到商品
  if (goods.length <= 0) {
    return (ctx.body = {
      status: 400,
      message: "没有搜索到商品",
    });
  }

  ctx.body = {
    status: 200,
    message: "已搜索到" + goods.length + "个商品",
    data: goods,
  };
};

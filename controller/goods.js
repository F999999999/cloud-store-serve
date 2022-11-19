const {
  getGoods,
  addGoods,
  getGoodsByPosition,
  addGoodsLog,
  getGoodsPosition,
  updateGoodsPosition,
  updateGoodsState,
  fuzzySearchGoodsByName,
  getGoodsLog,
  getExpireGoods,
  getExpireGoodsTotal,
  getGoodsLogByGoodsId,
  confirmMoveGoodsByLogId,
  getGoodsLogByLogId,
} = require("../model/goods");
const {
  updateShelfGridGoods,
  getShelfGridIsGoodsByGridId,
} = require("../model/shelf");

// 获取商品信息
module.exports.getGoodsController = async (ctx, next) => {
  console.log("getGoodsController", ctx.request.docodeToken);
  // 获取参数
  const { store_id } = ctx.request.query;
  // 校验参数
  if (!store_id) {
    return (ctx.body = {
      code: 400,
      message: "仓库ID不能为空",
    });
  }

  const data = await getGoods({ store_id, states: 1 });
  ctx.body = {
    status: 200,
    message: "获取商品信息成功",
    data,
  };
};

// 添加商品
module.exports.addGoodsController = async (ctx, next) => {
  // 获取参数
  const {
    store_id,
    name,
    weight,
    shelflife,
    production_date,
    storage_time,
    shelf_id,
    shelf_grid_id,
  } = ctx.request.body;
  // 校验参数
  if (!store_id) {
    return (ctx.body = {
      code: 400,
      message: "仓库ID不能为空",
    });
  }
  if (!shelf_id) {
    return (ctx.body = {
      code: 400,
      message: "货架ID不能为空",
    });
  }
  if (!shelf_grid_id) {
    return (ctx.body = {
      code: 400,
      message: "货架格子ID不能为空",
    });
  }
  // 判断该位置是否已经有商品
  const goods = await getGoodsByPosition({ store_id, shelf_id, shelf_grid_id });
  if (goods.length > 0) {
    return (ctx.body = {
      status: 400,
      message: "该位置已有商品",
    });
  }

  // 添加商品
  const result = await addGoods({
    store_id,
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
    store_id: Number(store_id),
    goods_id: result.insertId,
    shelf_id: Number(shelf_id),
    shelf_grid_id: Number(shelf_grid_id),
  });
  // 判断商品是否添加成功
  if (result.serverStatus === 2 && goodsResult.changedRows > 0) {
    // 新增商品日志
    await addGoodsLog({
      goods_id: result.insertId,
      now_store_id: Number(store_id),
      now_shelf_id: Number(shelf_id),
      now_shelf_grid_id: Number(shelf_grid_id),
      storage_time: Number(storage_time) || 0,
      operate_id: ctx.request.docodeToken.id,
      operate_time: Math.round(new Date() / 1000),
    });
    ctx.body = {
      status: 200,
      message: "入库成功，等待搬运",
      data: {
        goods_id: result.insertId,
        name,
        weight: Number(weight),
        shelflife: Number(shelflife),
        production_date: Number(production_date),
        storage_time: Number(storage_time),
        store_id: Number(store_id),
        shelf_id: Number(shelf_id),
        shelf_grid_id: Number(shelf_grid_id),
      },
    };
  } else {
    ctx.body = {
      status: 400,
      message: "入库失败",
    };
  }
};

// 移动商品
module.exports.moveGoodsController = async (ctx, next) => {
  // 获取参数
  const { id, store_id, shelf_id, shelf_grid_id } = ctx.request.body;
  // 校验参数
  if (!id) {
    return (ctx.body = {
      code: 400,
      message: "商品ID不能为空",
    });
  }
  if (!shelf_grid_id) {
    return (ctx.body = {
      code: 400,
      message: "货架格子ID不能为空",
    });
  }

  // 获取商品当前位置信息
  const goodsPosition = await getGoodsPosition({ ids: [id] });

  // 判断商品是否还有未完成的移动任务
  const goodsLog = await getGoodsLogByGoodsId({
    goods_id: goodsPosition[0].id,
  });
  if (goodsLog.find((v) => v.execute_time === null)?.length > 0) {
    return (ctx.body = {
      status: 400,
      message: "该商品有未完成的调度任务",
    });
  }

  // 判断该位置是否已经有商品
  const goods = await getGoodsByPosition({
    store_id: store_id ? store_id : goodsPosition[0].store_id,
    shelf_id: shelf_id ? shelf_id : goodsPosition[0].shelf_id,
    shelf_grid_id,
  });
  if (goods.length > 0) {
    return (ctx.body = {
      status: 400,
      message: "该位置已有商品，请换个位置",
    });
  }
  // 获取空货架格子
  const shelfGridGoods = await getShelfGridIsGoodsByGridId({
    store_id: store_id ? store_id : goodsPosition[0].store_id,
    shelf_id: shelf_id ? shelf_id : goodsPosition[0].shelf_id,
    shelf_grid_id,
  });
  if (shelfGridGoods[0].goods_id !== null) {
    return (ctx.body = {
      status: 400,
      message: "该位置的商品转移请求还未完成，请换个位置",
    });
  }
  if (goodsPosition.length > 0) {
    // 修改商品位置信息
    const result = await updateGoodsPosition({
      id,
      store_id: store_id ? store_id : goodsPosition[0].store_id,
      shelf_id: shelf_id ? shelf_id : goodsPosition[0].shelf_id,
      shelf_grid_id,
    });
    // 设置旧货架格子为占用状态
    const oldGoodsResult = await updateShelfGridGoods({
      goods_id: 0,
      store_id: goodsPosition[0].store_id,
      shelf_id: goodsPosition[0].shelf_id,
      shelf_grid_id: goodsPosition[0].shelf_grid_id,
    });
    // 设置新货架格子当前的商品
    const newGoodsResult = await updateShelfGridGoods({
      goods_id: id,
      store_id: store_id ? store_id : goodsPosition[0].store_id,
      shelf_id: shelf_id ? shelf_id : goodsPosition[0].shelf_id,
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
        before_store_id: goodsPosition[0].store_id,
        before_shelf_id: goodsPosition[0].shelf_id,
        before_shelf_grid_id: goodsPosition[0].shelf_grid_id,
        now_store_id: Number(store_id ? store_id : goodsPosition[0].store_id),
        now_shelf_id: Number(shelf_id ? shelf_id : goodsPosition[0].shelf_id),
        now_shelf_grid_id: Number(shelf_grid_id),
        operate_id: ctx.request.docodeToken.id,
        operate_time: Math.round(new Date() / 1000),
      });
      ctx.body = {
        status: 200,
        message: "移动成功，等待搬运",
        data: {
          goods_id: Number(id),
          before_store_id: goodsPosition[0].store_id,
          before_shelf_id: goodsPosition[0].shelf_id,
          before_shelf_grid_id: goodsPosition[0].shelf_grid_id,
          store_id: Number(store_id ? store_id : goodsPosition[0].store_id),
          shelf_id: Number(shelf_id ? shelf_id : goodsPosition[0].shelf_id),
          shelf_grid_id: Number(shelf_grid_id),
        },
      };
    } else {
      ctx.body = {
        status: 400,
        message: "移动失败",
      };
    }
  } else {
    ctx.body = {
      status: 400,
      message: "商品不存在",
    };
  }
};

// 移除商品
module.exports.removeGoodsController = async (ctx, next) => {
  // 获取参数
  let { ids, takeout_time } = ctx.request.body;
  // 校验参数
  if (ids.length <= 0) {
    return (ctx.body = {
      code: 400,
      message: "商品ID列表不能为空",
    });
  }

  // 判断参数是否为数组 如果不是数组则转为数组
  if (!Array.isArray(ids)) {
    ids = ids.toString().split(",");
  }
  ids = ids.map((id) => Number(id));
  // 获取商品当前位置信息
  const goodsPosition = await getGoodsPosition({ ids });
  // 判断商品是否存在
  if (goodsPosition.length <= 0) {
    return (ctx.body = {
      status: 400,
      message: "商品不存在",
    });
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
        store_id: item.store_id,
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
        before_store_id: goodsPosition[i].store_id,
        before_shelf_id: goodsPosition[i].shelf_id,
        before_shelf_grid_id: goodsPosition[i].shelf_grid_id,
        takeout_time: takeout_time || Math.round(new Date() / 1000),
        operate_id: ctx.request.docodeToken.id,
        operate_time: Math.round(new Date() / 1000),
      });
      data.push({
        goods_id: Number(ids[i]),
        before_store_id: goodsPosition[i].store_id,
        before_shelf_id: goodsPosition[i].shelf_id,
        before_shelf_grid_id: goodsPosition[i].shelf_grid_id,
      });
    }

    ctx.body = {
      status: 200,
      message: "出库成功，等待搬运",
      data,
    };
  } else {
    ctx.body = {
      status: 400,
      message: "出库失败",
    };
  }
};

// 模糊搜索商品
module.exports.fuzzySearchGoodsController = async (ctx, next) => {
  // 获取参数
  const { store_id, name } = ctx.request.query;
  // 搜索商品
  const goods = await fuzzySearchGoodsByName({ store_id, name });
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

// 获取商品日志
module.exports.getGoodsLogController = async (ctx, next) => {
  // 获取参数
  const { store_id, page_num, page_size } = ctx.request.query;

  const result = await getGoodsLog({
    store_id: Number(store_id) || null,
    page_num: Number(page_num) || 1,
    page_size: Number(page_size) || 10,
  });

  ctx.body = {
    status: 200,
    message: "获取商品日志成功",
    data: result,
  };
};

// 根据商品ID查询商品日志
module.exports.getGoodsLogByGoodsIdController = async (ctx, next) => {
  // 获取参数
  const { goods_id } = ctx.request.query;
  // 参赛校验
  if (!goods_id) {
    return (ctx.body = {
      status: 400,
      message: "商品ID不能为空",
    });
  }

  // 查询商品日志
  const dataList = await Promise.all(
    goods_id
      .split(",")
      .map((id) => getGoodsLogByGoodsId({ goods_id: Number(id) }))
  );

  const result = [];
  dataList.forEach((data) => {
    if (data.length) {
      result.push({
        goods_id: data[0].goods_id,
        goods_name: data[0].goods_name,
        storage_time: data[0].storage_time,
        takeout_time: data[0].takeout_time,
        list: data.map((logData) => ({
          id: logData.id,
          before_store_id: logData.before_store_id,
          before_store_name: logData.before_store_name,
          before_shelf_id: logData.before_shelf_id,
          before_shelf_name: logData.before_shelf_name,
          before_shelf_grid_id: logData.before_shelf_grid_id,
          before_shelf_grid_x: logData.before_shelf_grid_x,
          before_shelf_grid_y: logData.before_shelf_grid_y,
          before_shelf_grid_z: logData.before_shelf_grid_z,
          now_store_id: logData.now_store_id,
          now_store_name: logData.now_store_name,
          now_shelf_id: logData.now_shelf_id,
          now_shelf_name: logData.now_shelf_name,
          now_shelf_grid_id: logData.now_shelf_grid_id,
          now_shelf_grid_x: logData.now_shelf_grid_x,
          now_shelf_grid_y: logData.now_shelf_grid_y,
          now_shelf_grid_z: logData.now_shelf_grid_z,
          operate_id: logData.operate_id,
          operate_name: logData.operate_name,
          operate_time: logData.operate_time,
        })),
      });
    }
  });

  // 判断是否查询到商品日志
  if (result.length <= 0) {
    return (ctx.body = {
      status: 400,
      message: "没有查询到商品日志",
    });
  }

  ctx.body = {
    status: 200,
    message: "获取商品日志成功",
    data: result,
  };
};

// 获取临期商品
module.exports.getExpireGoodsController = async (ctx, next) => {
  // 获取参数
  const { store_id, page_num, page_size } = ctx.request.query;

  const result = await getExpireGoods({
    store_id,
    page_num: Number(page_num) || 1,
    page_size: Number(page_size) || 10,
  });

  ctx.body = {
    status: 200,
    message: "获取临期商品成功",
    data: result,
  };
};

// 获取临期商品统计
module.exports.getExpireGoodsTotalController = async (ctx, next) => {
  const result = await getExpireGoodsTotal();
  // 总计
  const total = {
    will_expire: 0,
    expired: 0,
    normal: 0,
  };

  // 遍历所有仓库的数据
  result.forEach((item) => {
    total.will_expire += item.will_expire || 0;
    total.expired += item.exports || 0;
    total.normal += item.normal || 0;
  });

  ctx.body = {
    status: 200,
    message: "获取临期商品统计成功",
    data: { list: result, total },
  };
};

// 获取待处理商品
module.exports.getGoodsLogControllerByPending = async (ctx, next) => {
  // 获取参数
  const { store_id, page_num, page_size } = ctx.request.query;

  const result = await getGoodsLog({
    store_id: Number(store_id) || null,
    page_num: Number(page_num) || 1,
    page_size: Number(page_size) || 100,
  });

  ctx.body = {
    status: 200,
    message: "获取待处理商品成功",
    data: result.filter((v) => v.execute_time === null).reverse(),
  };
};

// 确认商品移动
module.exports.confirmMoveGoods = async (ctx, next) => {
  // 获取参数
  const { log_id } = ctx.request.body;

  //获取商品当前日志数据
  const goodsLog = await getGoodsLogByLogId({ log_id: Number(log_id) });
  if (goodsLog.length > 0) {
    const confirmResult = await confirmMoveGoodsByLogId({
      log_id: Number(log_id),
      execute_id: ctx.request.docodeToken.id,
      execute_time: Math.round(new Date() / 1000),
    });

    // 解除旧货架格子的占用状态
    const relieveOldGoodsResult = await updateShelfGridGoods({
      goods_id: null,
      store_id: goodsLog[0].before_store_id,
      shelf_id: goodsLog[0].before_shelf_id,
      shelf_grid_id: goodsLog[0].before_shelf_grid_id,
    });
    if (
      confirmResult.affectedRows > 0 &&
      relieveOldGoodsResult.affectedRows > 0
    ) {
      ctx.body = {
        status: 200,
        message: "商品处理成功",
        data: goodsLog,
      };
    } else {
      ctx.body = {
        status: 400,
        message: "商品处理失败",
        data: goodsLog,
      };
    }
  } else {
    return (ctx.body = {
      status: 400,
      message: "没有查询到商品日志",
    });
  }
};

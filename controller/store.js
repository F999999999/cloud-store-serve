const { getStore } = require("../model/store");

// 获取仓库信息
module.exports.storeController = async (ctx, next) => {
  // 获取仓库信息
  const result = await getStore({ state: 1 });

  // 返回数据
  ctx.body = {
    status: 200,
    message: "获取仓库信息成功",
    data: result,
  };
};

//

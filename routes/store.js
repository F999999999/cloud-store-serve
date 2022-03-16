const router = require("koa-router")();

const {
  storeController,
  storeTotalController,
} = require("../controller/store");
const {
  shelfController,
  getEmptyShelfGridController,
  addShelfController,
  shelfTotalController,
} = require("../controller/shelf");
const {
  addGoodsController,
  getGoodsController,
  moveGoodsController,
  removeGoodsController,
  fuzzySearchGoodsController,
  getGoodsLogController,
} = require("../controller/goods");

// 前缀
router.prefix("/store");

// 获取仓库数据
router.get("/", storeController);

// 获取仓库使用统计数据
router.get("/store_total", storeTotalController);

// 新增货架
router.post("/add_shelf", addShelfController);

// 获取空货架格子
router.get("/empty_grid", getEmptyShelfGridController);

// 获取货架数据
router.get("/shelf", shelfController);

// 获取货架使用统计数据
router.get("/shelf_total", shelfTotalController);

// 获取商品数据
router.get("/goods", getGoodsController);

// 添加商品
router.post("/add_goods", addGoodsController);

// 移动商品
router.post("/move_goods", moveGoodsController);

// 移除商品
router.post("/remove_goods", removeGoodsController);

// 模糊搜索商品
router.get("/search_goods", fuzzySearchGoodsController);

// 获取商品流水
router.get("/goods_log", getGoodsLogController);

// 导出路由
module.exports = router;

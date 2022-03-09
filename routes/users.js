const router = require("koa-router")();

const { register, login } = require("../controller/users");

// 前缀
router.prefix("/users");

// 注册
router.post("/register", register);

// 登录
router.post("/login", login);

module.exports = router;

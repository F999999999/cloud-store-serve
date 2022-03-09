const crypto = require("crypto");

module.exports.crypto = (payload) => {
  return crypto
    .createHash("sha256")
    .update(payload + process.env.PASSWORD_SECRET_KEY)
    .digest("hex");
};

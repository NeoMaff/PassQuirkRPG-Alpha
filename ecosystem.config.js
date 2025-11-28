module.exports = {
  apps : [{
    name   : "passquirk-rpg",
    script : "./PassQuirkRPG/bot/index.js",
    watch  : true,
    ignore_watch : ["node_modules", "data", "logs", "PassQuirkRPG/bot/data", "PassQuirkRPG/database/data"],
    env: {
      NODE_ENV: "production",
    }
  }]
}

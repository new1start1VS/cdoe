# 坦克大战 · Tank Battle

一个使用 **HTML5 Canvas + 纯 JavaScript** 实现的经典坦克大战游戏，无需任何依赖或构建工具，用浏览器打开即可游玩。

![tech](https://img.shields.io/badge/HTML5-Canvas-orange) ![lang](https://img.shields.io/badge/JavaScript-Vanilla-yellow) ![deps](https://img.shields.io/badge/dependencies-none-green)

## 🎮 玩法

保卫位于地图底部的**基地（老巢）**，操控你的坦克消灭所有来犯的敌方坦克。

游戏结束条件（任一发生即失败）：

- 你的所有生命用尽
- 基地被敌方子弹摧毁

消灭一关中的全部敌人即可进入下一关，关卡越往后敌人越多、越强。

## ⌨️ 操作

| 按键 | 功能 |
| --- | --- |
| `↑` `↓` `←` `→` 或 `W` `A` `S` `D` | 移动坦克 |
| `空格` | 开火 |
| `P` | 暂停 / 继续 |

## 🚀 运行方式

直接双击 `index.html` 用浏览器打开即可。

或启动一个本地静态服务器（推荐，避免某些浏览器的本地文件限制）：

```bash
# Python 3
python -m http.server 8000

# 或 Node.js
npx serve .
```

然后浏览器访问 <http://localhost:8000>。

## ✨ 特性

- 🧱 多种地形：砖墙（可摧毁）、钢墙（不可摧毁）、河流（阻挡坦克）、草丛（视觉遮挡）
- 🤖 敌方坦克 AI：会朝基地/玩家方向移动并开火，含普通与快速两种兵种
- 💥 爆炸特效、无敌闪烁、生命与计分系统
- 🗺️ 内置 3 张关卡布局，循环递增难度
- 📦 零依赖，单文件即可分享

## 📁 项目结构

```
.
├── index.html   # 页面与样式、HUD 面板
├── game.js      # 全部游戏逻辑（地图、坦克、子弹、AI、渲染、主循环）
└── README.md
```

## 🛠️ 自定义

- 在 `game.js` 的 `LEVELS` 数组中编辑关卡布局（`.`空地 `B`砖 `S`钢 `G`草 `W`水 `X`基地）。
- 调整 `makeTank` / `startStage` 中的速度、敌人数量、开火频率等参数来改变难度。

## 📜 License

MIT

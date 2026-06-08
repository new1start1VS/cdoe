# 3-5 按键控制 LED（STM32F103 标准外设库）

基于 **STM32F103C8（STM32F10x 标准外设库 SPL）** 的 Keil MDK 工程：用两个独立按键分别翻转两个 LED 的亮灭状态。

> 注：本工程目录沿用了课程命名「3-5 光敏传感器和按钮控制」，但当前 `main.c` 中实现的实际功能是**按键控制 LED**。工程内另含蜂鸣器（Buzzer）等外设驱动文件，方便后续扩展。

## 功能

- 按下 **KEY1** → 翻转 **LED0** 的状态（亮 ↔ 灭）
- 按下 **KEY2** → 翻转 **LED1** 的状态（亮 ↔ 灭）
- 按键采用上拉输入 + 软件消抖（按下检测后 `Delay_ms(20)`，并等待松手）

## 硬件接线

| 外设 | 引脚 | 配置 | 说明 |
| --- | --- | --- | --- |
| LED0 | PA1 | 推挽输出 | 低电平点亮，高电平熄灭 |
| LED1 | PA2 | 推挽输出 | 低电平点亮，高电平熄灭 |
| KEY1 | PA5 | 上拉输入 | 按下为低电平，返回键值 1 |
| KEY2 | PA6 | 上拉输入 | 按下为低电平，返回键值 2 |

> LED 默认初始化为熄灭（输出高电平）。

## 核心逻辑

`user/main.c`：

```c
Key_Init();
Led_Init();
while (1)
{
    uint8_t KeyNumber = KeyNum();
    if (KeyNumber == 1)       Led0_Toggle();   // KEY1 -> LED0
    else if (KeyNumber == 2)  Led1_Toggle();   // KEY2 -> LED1
}
```

## 目录结构

```
.
├── 3-5.uvprojx        # Keil MDK 工程文件（双击打开）
├── user/              # 用户代码：main.c、中断、外设配置
├── Hardware/          # 板级外设驱动：Led、KEY、Buzzer
├── System/            # 系统级：Delay 延时
├── start/             # 启动文件、CMSIS、system_stm32f10x
└── libraries/         # STM32F10x 标准外设库（SPL）
```

## 编译与下载

1. 使用 **Keil MDK-ARM**（µVision5）打开 `3-5.uvprojx`
2. 安装好 STM32F1 器件支持包（Keil::STM32F1xx_DFP）
3. 编译（F7）→ 连接 ST-Link / J-Link → 下载（F8）
4. 目标芯片：**STM32F103C8**

> 编译产物（`Objects/`、`Listings/`、`.lst` 等）及 IDE 个人配置（`*.uvoptx`、`*.uvguix.*`）未纳入版本库，由 Keil 在本地构建时自动生成。

## 许可

仅用于学习用途。

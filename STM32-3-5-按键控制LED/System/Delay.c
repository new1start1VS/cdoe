#include "stm32f10x.h"

// 微秒级延时函数 (基础单元)
void Delay_us(uint32_t us) {
    // 设置重载值：72MHz主频下，1微秒 = 72个时钟周期
    SysTick->LOAD = 72 * us; 
    SysTick->VAL = 0x00;     // 清空当前计数值
    // 启动定时器：选择内核时钟源(1)，不开中断(0)，使能(1) -> 二进制 101 = 0x05
    SysTick->CTRL = 0x00000005; 
    // 等待计数到0：第16位(COUNTFLAG)在计数到0时会置1
    while (!(SysTick->CTRL & 0x00010000)); 
    SysTick->CTRL = 0x00000004; // 关闭定时器
} 
// 毫秒级延时函数
void Delay_ms(uint32_t ms) {
    while (ms--) {
        Delay_us(1000); // 循环调用微秒延时，每次延时1000微秒(即1毫秒)
    }
}

// 秒级延时函数
void Delay_s(uint32_t s) {
    while (s--) {
        Delay_ms(1000); // 循环调用毫秒延时，每次延时1000毫秒(即1秒)
    }
}
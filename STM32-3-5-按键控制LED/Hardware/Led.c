#include "stm32f10x.h"                  // Device header

#include "stm32f10x.h"

/**
  * @brief  LED 初始化（PA1、PA2 推挽输出，默认熄灭）
  */
void Led_Init(void)
{
    // 使能 GPIOA 时钟
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
    
    GPIO_InitTypeDef GPIO_InitStructure;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP;
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_1 | GPIO_Pin_2;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &GPIO_InitStructure);
    
    // 默认关闭 LED（高电平熄灭，假设低电平点亮）
    GPIO_SetBits(GPIOA, GPIO_Pin_1 | GPIO_Pin_2);
}

// ---------- LED0 (PA1) ----------
void Led0_ON(void)
{
    GPIO_ResetBits(GPIOA, GPIO_Pin_1);   // 低电平点亮
}

void Led0_OFF(void)
{
    GPIO_SetBits(GPIOA, GPIO_Pin_1);     // 高电平熄灭
}

void Led0_Toggle(void)
{
    // 读取当前输出状态，翻转
    if (GPIO_ReadOutputDataBit(GPIOA, GPIO_Pin_1) == 0)
        GPIO_SetBits(GPIOA, GPIO_Pin_1);
    else
        GPIO_ResetBits(GPIOA, GPIO_Pin_1);
}

// ---------- LED1 (PA2) ----------
void Led1_ON(void)
{
    GPIO_ResetBits(GPIOA, GPIO_Pin_2);
}

void Led1_OFF(void)
{
    GPIO_SetBits(GPIOA, GPIO_Pin_2);
}

void Led1_Toggle(void)
{
    if (GPIO_ReadOutputDataBit(GPIOA, GPIO_Pin_2) == 0)
        GPIO_SetBits(GPIOA, GPIO_Pin_2);
    else
        GPIO_ResetBits(GPIOA, GPIO_Pin_2);
}
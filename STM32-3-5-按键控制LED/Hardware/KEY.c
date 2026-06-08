#include "stm32f10x.h"                  // Device header
#include "Delay.h"
void Key_Init(void)
{
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
    
    GPIO_InitTypeDef GPIO_InitStructure;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IPU;
    GPIO_InitStructure.GPIO_Pin = (GPIO_Pin_6| GPIO_Pin_5);
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init (GPIOA , &GPIO_InitStructure);
    
    
}

uint8_t KeyNum(void)
{
    if (GPIO_ReadInputDataBit(GPIOA, GPIO_Pin_5) == 0)  // 假设按键接 PA5
    {
        Delay_ms(20);
        while (GPIO_ReadInputDataBit(GPIOA, GPIO_Pin_5) == 0);
        return 1;
    }
    if (GPIO_ReadInputDataBit(GPIOA, GPIO_Pin_6) == 0)  // 假设按键接 PA6
    {
        Delay_ms(20);
        while (GPIO_ReadInputDataBit(GPIOA, GPIO_Pin_6) == 0);
        return 2;
    }
    return 0;
}

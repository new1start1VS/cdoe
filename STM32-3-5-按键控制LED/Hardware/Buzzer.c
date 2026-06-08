#include "stm32f10x.h"                  // Device header
void Buzzer_Init (void)
{
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_GPIOB, ENABLE);
    GPIO_InitTypeDef GPIO_InitStructure;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP;
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0 | GPIO_Pin_1 | 
                                  GPIO_Pin_2 | GPIO_Pin_3 | GPIO_Pin_10;
    
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &GPIO_InitStructure);
    GPIO_Init(GPIOB, &GPIO_InitStructure);
    
    GPIO_SetBits (GPIOA, GPIO_Pin_0 | GPIO_Pin_1 | 
                  GPIO_Pin_2 | GPIO_Pin_3 | GPIO_Pin_10);
    GPIO_SetBits (GPIOB, GPIO_Pin_0 | GPIO_Pin_1 | 
                  GPIO_Pin_2 | GPIO_Pin_3 | GPIO_Pin_10);
}

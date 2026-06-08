#include "stm32f10x.h"
#include "Delay.h"   // 假设您有 Delay 函数

// 外部声明的函数
void Key_Init(void);
uint8_t KeyNum(void);
void Led_Init(void);
void Led0_Toggle(void);
void Led1_Toggle(void);

int main(void)
{
    Key_Init();
    Led_Init();
    
    while(1)
    {
        uint8_t KeyNumber = KeyNum();
        if (KeyNumber == 1)
        {
            Led0_Toggle();
        }
        else if (KeyNumber == 2)
        {
            Led1_Toggle();
        }
    }
}

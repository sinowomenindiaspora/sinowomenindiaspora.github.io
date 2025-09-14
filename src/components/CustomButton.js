import React from 'react';
import { Button } from '@mui/material';
import styled, { keyframes } from 'styled-components';

// 定义动画效果
const scaleAnimation = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
`;

const glowAnimation = keyframes`
  0% {
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.6);
  }
  100% {
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
  }
`;

// 自定义按钮样式
const StyledCustomButton = styled(Button)`
  /* 禁用默认的波纹效果 */
  .MuiTouchRipple-root {
    display: none;
  }
  
  /* 添加自定义的点击动画 */
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:active {
    animation: ${scaleAnimation} 0.2s ease-in-out;
  }
  
  &:hover {
    animation: ${glowAnimation} 0.3s ease-in-out;
  }
  
  /* 添加轻微的阴影效果 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }
  
  &:active {
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    transform: translateY(0px);
  }
`;

const CustomButton = ({ children, onClick, ...props }) => {
  return (
    <StyledCustomButton
      onClick={onClick}
      disableRipple
      {...props}
    >
      {children}
    </StyledCustomButton>
  );
};

export default CustomButton;

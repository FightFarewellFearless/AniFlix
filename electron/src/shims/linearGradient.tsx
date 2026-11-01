import React from 'react';

export const LinearGradient = ({ children, style, ...props }: any) => (
  <div style={style} {...props}>
    {children}
  </div>
);

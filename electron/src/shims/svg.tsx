import React from 'react';

const Svg = ({ children, ...props }: any) => <svg {...props}>{children}</svg>;
export default Svg;
export { Svg };
export const Path = (props: any) => <path {...props} />;
export const Circle = (props: any) => <circle {...props} />;
export const Rect = (props: any) => <rect {...props} />;
export const G = (props: any) => <g {...props} />;
export const Line = (props: any) => <line {...props} />;
export const Defs = (props: any) => <defs {...props} />;
export const ClipPath = (props: any) => <clipPath {...props} />;
export const LinearGradient = (props: any) => <linearGradient {...props} />;
export const Stop = (props: any) => <stop {...props} />;
export const SvgFromXml = ({ xml }: { xml: string }) => <Svg aria-label={xml} />;

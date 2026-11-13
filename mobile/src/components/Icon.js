import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const paths = {
  overview: <Path d="M3 10.5 12 3l9 7.5M5.5 9v11h13V9M9.5 20v-6h5v6" />,
  orders: (
    <>
      <Rect x="4" y="4" width="16" height="17" rx="2.5" />
      <Path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  income: (
    <>
      <Path d="M4 18.5 9 13l3 2.5L20 7" />
      <Path d="M14.5 7H20v5.5" />
      <Path d="M4 21h16" />
    </>
  ),
  profile: (
    <>
      <Circle cx="12" cy="8" r="3.5" />
      <Path d="M5 20c.6-3.1 3.3-5.1 7-5.1s6.4 2 7 5.1" />
    </>
  ),
  calendar: (
    <>
      <Rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <Path d="M7.5 3v4M16.5 3v4M3.5 9.5h17M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01" />
    </>
  ),
  refresh: <Path d="M20 7v5h-5M4 17v-5h5m10.2-2A7 7 0 0 0 6 7.1L4 9m16 6-2 1.9A7 7 0 0 1 5.8 14" />,
  shield: (
    <>
      <Path d="M12 3 19 6v5c0 4.4-2.8 7.8-7 10-4.2-2.2-7-5.6-7-10V6l7-3Z" />
      <Path d="m9 12 2 2 4-4" />
    </>
  ),
  moon: <Path d="M20.5 14.2A8 8 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />,
  sun: (
    <>
      <Circle cx="12" cy="12" r="4" />
      <Path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  logout: (
    <>
      <Path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10" />
      <Path d="M14 8l4 4-4 4m4-4H9" />
    </>
  ),
  search: (
    <>
      <Circle cx="10.8" cy="10.8" r="6.8" />
      <Path d="m16 16 4.5 4.5" />
    </>
  ),
};

export default function Icon({ name, color, size = 22, strokeWidth = 1.8 }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {paths[name]}
    </Svg>
  );
}

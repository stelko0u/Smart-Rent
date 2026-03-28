import * as React from "react";
import type { SVGProps } from "react";
const SvgLocationDot = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 384 512"
    width="1em"
    height="1em"
    {...props}
  >
    <path
      fill="currentColor"
      d="M48 188.6C48 111.7 111.7 48 192 48s144 63.7 144 140.6c0 45.6-23.8 101.5-58.9 157.1-28.3 44.8-61 84.8-85.1 112.1-24.1-27.3-56.7-67.2-85.1-112.1C71.8 290.2 48 234.2 48 188.6M192 0C86 0 0 84.4 0 188.6c0 119.3 120.2 262.3 170.4 316.8 11.8 12.8 31.4 12.8 43.2 0C263.8 450.9 384 307.9 384 188.6 384 84.4 298 0 192 0m-32 192a32 32 0 1 1 64 0 32 32 0 1 1-64 0m112 0a80 80 0 1 0-160 0 80 80 0 1 0 160 0"
    />
  </svg>
);
export default SvgLocationDot;

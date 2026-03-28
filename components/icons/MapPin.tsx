import * as React from "react";
import type { SVGProps } from "react";
const SvgMapPin = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 320 512"
    width="1em"
    height="1em"
    {...props}
  >
    <path
      fill="currentColor"
      d="M128 284.4c10.3 2.3 21 3.6 32 3.6s21.7-1.2 32-3.6V480c0 17.7-14.3 32-32 32s-32-14.3-32-32z"
      opacity={0.4}
    />
    <path
      fill="currentColor"
      d="M160 288a144 144 0 1 0 0-288 144 144 0 1 0 0 288m-48-136c0 13.3-10.7 24-24 24s-24-10.7-24-24c0-57.4 46.6-104 104-104 13.3 0 24 10.7 24 24s-10.7 24-24 24c-30.9 0-56 25.1-56 56"
    />
  </svg>
);
export default SvgMapPin;

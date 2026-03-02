import * as React from "react";
import type { SVGProps } from "react";
const SvgPlus = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 448 512"
    width="1em"
    height="1em"
    {...props}
  >
    <path
      fill="currentColor"
      d="M248 56c0-13.3-10.7-24-24-24s-24 10.7-24 24v176H24c-13.3 0-24 10.7-24 24s10.7 24 24 24h176v176c0 13.3 10.7 24 24 24s24-10.7 24-24V280h176c13.3 0 24-10.7 24-24s-10.7-24-24-24H248z"
    />
  </svg>
);
export default SvgPlus;

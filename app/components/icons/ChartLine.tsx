import * as React from "react";
import type { SVGProps } from "react";
const SvgChartLine = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    width="1em"
    height="1em"
    {...props}
  >
    <path
      fill="currentColor"
      d="m48 334.1 55-55c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l87-87 79 79c9.4 9.4 24.6 9.4 33.9 0L473 169c4.7-4.7 7-10.8 7-17v280H80c-17.7 0-32-14.3-32-32z"
      opacity={0.4}
    />
    <path
      fill="currentColor"
      d="M48 56c0-13.3-10.7-24-24-24S0 42.7 0 56v344c0 44.2 35.8 80 80 80h408c13.3 0 24-10.7 24-24s-10.7-24-24-24H80c-17.7 0-32-14.3-32-32zm425 113c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-119 119-79-79c-9.4-9.4-24.6-9.4-33.9 0L103 279c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l87-87 79 79c9.4 9.4 24.6 9.4 33.9 0z"
    />
  </svg>
);
export default SvgChartLine;

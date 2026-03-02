import * as React from "react";
import type { SVGProps } from "react";
const SvgCircleTrash = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    width="1em"
    height="1em"
    {...props}
  >
    <path
      fill="currentColor"
      d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416m0 464a256 256 0 1 0 0-512 256 256 0 1 0 0 512m-32-400c-9.8 0-18.6 6-22.3 15.1l-6.8 16.9h-43c-13.3 0-24 10.7-24 24s10.7 24 24 24h208c13.3 0 24-10.7 24-24s-10.7-24-24-24h-43l-6.8-16.9C306.6 118 297.8 112 288 112zm-51.2 243.5c1.8 16.2 15.5 28.5 31.8 28.5h102.7c16.3 0 30-12.3 31.8-28.5L352 240H160z"
    />
  </svg>
);
export default SvgCircleTrash;

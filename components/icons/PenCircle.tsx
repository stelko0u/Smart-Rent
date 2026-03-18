import * as React from "react";
import type { SVGProps } from "react";
const SvgPenCircle = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    width="1em"
    height="1em"
    {...props}
  >
    <path
      fill="currentColor"
      d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416m0 464a256 256 0 1 0 0-512 256 256 0 1 0 0 512m101.8-372.3c-15.6-15.6-40.9-15.6-56.6 0l-23.8 23.8 71 71 23.8-23.8c15.6-15.6 15.6-40.9 0-56.6zM151.9 289c-4.1 4.1-7 9.2-8.4 14.9l-15 60.1c-1.4 5.5.2 11.2 4.2 15.2s9.7 5.6 15.2 4.2l60.1-15c5.6-1.4 10.8-4.3 14.9-8.4l91.6-91.5-71-71-91.5 91.6z"
    />
  </svg>
);
export default SvgPenCircle;

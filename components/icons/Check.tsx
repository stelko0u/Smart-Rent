import * as React from "react";
import type { SVGProps } from "react";
const SvgCheck = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    width="1em"
    height="1em"
    {...props}
  >
    <path
      fill="currentColor"
      d="m493 88.9-18.8 25.9-256 352-22 30.3L41.7 342.6 19 320l45.3-45.3 124.1 124.1 234-321.7 18.8-25.9L493 88.8z"
    />
  </svg>
);
export default SvgCheck;

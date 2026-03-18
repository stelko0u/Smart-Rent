import * as React from "react";
import type { SVGProps } from "react";
const SvgUser = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 448 512"
    width="1em"
    height="1em"
    {...props}
  >
    <path
      fill="currentColor"
      d="M288 320c88.4 0 160 71.6 160 160v32h-64v-32c0-53-43-96-96-96H160c-53 0-96 43-96 96v32H0v-32c0-88.4 71.6-160 160-160zm-64-64a128 128 0 1 1 0-256 128 128 0 1 1 0 256m0-192a64 64 0 1 0 0 128 64 64 0 1 0 0-128"
    />
  </svg>
);
export default SvgUser;

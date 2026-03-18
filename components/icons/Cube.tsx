import * as React from "react";
import type { SVGProps } from "react";
const SvgCube = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    width="1em"
    height="1em"
    {...props}
  >
    <path
      fill="currentColor"
      d="M248.3 39.1c5-2.9 11-2.9 16 0l159.8 92.3-167.8 96.9-167.8-96.9zM64.5 173l167.8 96.9v193.8L72.5 371.4c-5-2.9-8-8.1-8-13.9V172.9zm215.8 290.7V269.9L448.1 173v184.6c0 5.7-3 11-8 13.9zm8-466.1a64.16 64.16 0 0 0-64 0L48.5 99c-19.8 11.4-32 32.6-32 55.4v203c0 22.9 12.2 44 32 55.4l175.8 101.7c19.8 11.4 44.2 11.4 64 0L464.2 413c19.8-11.4 32-32.6 32-55.4v-203c0-22.9-12.2-44-32-55.4L288.3-2.5z"
    />
  </svg>
);
export default SvgCube;

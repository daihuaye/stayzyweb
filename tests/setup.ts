import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
afterEach(cleanup);
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// jsdom does not implement the scrolling used by Radix keyboard focus.
if (typeof HTMLElement !== "undefined") {
  HTMLElement.prototype.scrollIntoView = function () {};
}

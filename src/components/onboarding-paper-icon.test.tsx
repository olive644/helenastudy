import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { OnboardingPaperIcon, PaperArrow } from "./onboarding-paper-icon";

afterEach(cleanup);
it("keeps paper fills isolated from navigation line-icon styles", () => {
  const { container } = render(<OnboardingPaperIcon name="science" />);
  expect(container.querySelector(".navigation-icon")).toBeNull();
  expect(container.querySelector('path[fill="#FACC15"]')).not.toBeNull();
  expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
});
it.each(["flag-us", "flag-br", "flag-es"])("renders a separate country design for %s", (name) => {
  const { container } = render(<OnboardingPaperIcon name={name} />);
  expect(container.querySelector("svg")?.getAttribute("data-paper-icon")).toBe(name);
  expect(container.querySelectorAll("path").length).toBeGreaterThan(3);
});
it("uses the same folded arrow reversed for back", () => {
  const { container } = render(<PaperArrow back />);
  expect(container.querySelector("g")?.getAttribute("transform")).toContain("rotate(180)");
  expect(container.querySelectorAll("path")).toHaveLength(4);
});

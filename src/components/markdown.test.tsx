import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Markdown } from "@/components/markdown";

function render(content: string) {
  return renderToStaticMarkup(<Markdown content={content} />);
}

describe("Markdown", () => {
  it("renders standard Markdown", () => {
    const html = render("**安全** 的正文");

    expect(html).toContain("<strong>安全</strong>");
    expect(html).toContain("的正文");
  });

  it("renders GFM tables", () => {
    const html = render("| a | b |\n| - | - |\n| 1 | 2 |");

    expect(html).toContain("<table>");
    expect(html).toContain("<td>1</td>");
  });

  it("does not emit script tags", () => {
    const html = render('<script>alert("x")</script>\n\nSafe');

    expect(html).not.toContain("<script");
    expect(html).toContain("Safe");
  });

  it("does not emit inline event handlers", () => {
    const html = render('<img src="x" onerror="alert(1)">');

    expect(html).not.toContain("onerror");
  });

  it("does not emit javascript links", () => {
    const html = render("[click](javascript:alert(1))");

    expect(html).not.toContain("javascript:");
  });
});

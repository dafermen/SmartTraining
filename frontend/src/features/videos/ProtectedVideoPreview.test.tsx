import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProtectedVideoPreview } from "./ProtectedVideoPreview";

describe("ProtectedVideoPreview", () => {
  it("streams the protected video without downloading a Blob", () => {
    const createObjectUrl = vi.spyOn(URL, "createObjectURL");
    const { container } = render(
      <ProtectedVideoPreview videoId="efacab4b-933d-40aa-b490-32f305dc2927" />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /reproducir vista previa protegida/i,
      }),
    );

    const player = container.querySelector("video");
    expect(player).toHaveAttribute(
      "src",
      "/api/videos/efacab4b-933d-40aa-b490-32f305dc2927/stream",
    );
    expect(player).toHaveAttribute("preload", "metadata");
    expect(createObjectUrl).not.toHaveBeenCalled();
    createObjectUrl.mockRestore();
  });
});

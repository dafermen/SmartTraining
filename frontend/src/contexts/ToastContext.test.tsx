import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToastProvider, useToast } from "./ToastContext";

function Trigger() {
  const { notify } = useToast();
  return (
    <button onClick={() => notify("Cambios guardados.")} type="button">
      Notificar
    </button>
  );
}

describe("ToastProvider", () => {
  it("announces and dismisses operation feedback", () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Notificar" }));
    expect(screen.getByRole("status")).toHaveTextContent("Cambios guardados.");
    fireEvent.click(
      screen.getByRole("button", { name: "Cerrar notificación" }),
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

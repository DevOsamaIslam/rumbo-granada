import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { StopList } from "./StopList";
import type { Stop } from "@/types/gtfs";

const makeStop = (id: string, code: string, name: string): Stop => ({
  stop_id: id,
  stop_code: code,
  stop_name: name,
  stop_lat: 37.15,
  stop_lon: -3.53,
});

const stops = [
  makeStop("s1", "9", "Avda. Sierra Nevada 97"),
  makeStop("s2", "10", "Los Pinillos"),
];

const noop = () => {};

const baseProps = {
  isLoading: false,
  error: null,
  isFavorite: () => false,
  onPress: noop,
  onToggleFavorite: noop,
  onRefresh: noop,
  refreshing: false,
};

describe("StopList", () => {
  it("renders every stop with its code badge", async () => {
    await render(<StopList {...baseProps} stops={stops} />);
    expect(screen.getByText("Avda. Sierra Nevada 97")).toBeOnTheScreen();
    expect(screen.getByText("Los Pinillos")).toBeOnTheScreen();
    expect(screen.getByText("9")).toBeOnTheScreen();
    expect(screen.getByText("10")).toBeOnTheScreen();
  });

  it("renders the empty message when there are no stops", async () => {
    await render(
      <StopList {...baseProps} stops={[]} emptyMessage="No stops match your search" />,
    );
    expect(screen.getByText("No stops match your search")).toBeOnTheScreen();
  });

  it("renders the loading state", async () => {
    await render(<StopList {...baseProps} stops={[]} isLoading={true} />);
    expect(screen.getByLabelText("Cargando paradas")).toBeOnTheScreen();
  });

  it("renders the error state with the error message", async () => {
    await render(<StopList {...baseProps} stops={[]} error={new Error("Network failed")} />);
    expect(screen.getByText("Error al cargar las paradas")).toBeOnTheScreen();
    expect(screen.getByText("Network failed")).toBeOnTheScreen();
  });

  it("calls onPress with the pressed stop", async () => {
    const onPress = vi.fn();
    await render(<StopList {...baseProps} stops={stops} onPress={onPress} />);
    await fireEvent.press(screen.getByLabelText("Parada Los Pinillos"));
    expect(onPress).toHaveBeenCalledWith(stops[1]);
  });
});

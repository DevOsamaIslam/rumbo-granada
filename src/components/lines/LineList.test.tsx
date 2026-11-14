import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { LineList } from "./LineList";
import type { Route } from "@/types/gtfs";

const makeRoute = (id: string, shortName: string): Route => ({
  route_id: id,
  agency_id: "a1",
  route_short_name: shortName,
  route_long_name: `Route ${shortName}`,
  route_type: 3,
});

const routes = [makeRoute("r1", "10"), makeRoute("r2", "33")];

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

describe("LineList", () => {
  it("renders all lines", async () => {
    await render(<LineList {...baseProps} routes={routes} />);
    expect(screen.getByText("Line 10")).toBeOnTheScreen();
    expect(screen.getByText("Line 33")).toBeOnTheScreen();
  });

  it("renders empty message when no lines", async () => {
    await render(
      <LineList
        {...baseProps}
        routes={[]}
        emptyMessage="No lines match your search"
      />,
    );
    expect(screen.getByText("No lines match your search")).toBeOnTheScreen();
  });

  it("renders loading state", async () => {
    await render(<LineList {...baseProps} routes={[]} isLoading={true} />);
    expect(screen.getByLabelText("Loading lines")).toBeOnTheScreen();
  });

  it("renders error state with the error message", async () => {
    await render(
      <LineList
        {...baseProps}
        routes={[]}
        error={new Error("Network failed")}
      />,
    );
    expect(screen.getByText("Failed to load lines")).toBeOnTheScreen();
    expect(screen.getByText("Network failed")).toBeOnTheScreen();
  });

  it("calls onPress when a line is pressed", async () => {
    const onPress = vi.fn();
    await render(<LineList {...baseProps} routes={routes} onPress={onPress} />);
    await fireEvent.press(screen.getByLabelText("Line 10"));
    expect(onPress).toHaveBeenCalledWith(routes[0]);
  });
});

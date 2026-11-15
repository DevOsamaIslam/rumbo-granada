import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { LineItem } from "./LineItem";
import type { Route } from "@/types/gtfs";

const makeRoute = (overrides: Partial<Route> = {}): Route => ({
  route_id: "r1",
  agency_id: "a1",
  route_short_name: "10",
  route_long_name: "Alhambra - Centro",
  route_type: 3,
  route_color: "6200EE",
  route_text_color: "FFFFFF",
  ...overrides,
});

describe("LineItem", () => {
  it("renders short name and long name", async () => {
    await render(
      <LineItem
        route={makeRoute()}
        isFavorite={false}
        onPress={() => {}}
        onToggleFavorite={() => {}}
      />,
    );
    expect(screen.getByText("Line 10")).toBeOnTheScreen();
    expect(screen.getByText("Alhambra - Centro")).toBeOnTheScreen();
  });

  it("shows filled star when favorite", async () => {
    await render(
      <LineItem
        route={makeRoute()}
        isFavorite={true}
        onPress={() => {}}
        onToggleFavorite={() => {}}
      />,
    );
    expect(screen.getByLabelText("Remove from favorites")).toBeOnTheScreen();
  });

  it("shows outline star when not favorite", async () => {
    await render(
      <LineItem
        route={makeRoute()}
        isFavorite={false}
        onPress={() => {}}
        onToggleFavorite={() => {}}
      />,
    );
    expect(screen.getByLabelText("Add to favorites")).toBeOnTheScreen();
  });

  it("calls onToggleFavorite when star pressed", async () => {
    const onToggleFavorite = vi.fn();
    await render(
      <LineItem
        route={makeRoute()}
        isFavorite={false}
        onPress={() => {}}
        onToggleFavorite={onToggleFavorite}
      />,
    );
    await fireEvent.press(screen.getByLabelText("Add to favorites"));
    expect(onToggleFavorite).toHaveBeenCalledWith(makeRoute());
  });

  it("calls onPress when row pressed", async () => {
    const onPress = vi.fn();
    await render(
      <LineItem
        route={makeRoute()}
        isFavorite={false}
        onPress={onPress}
        onToggleFavorite={() => {}}
      />,
    );
    await fireEvent.press(screen.getByLabelText("Line 10"));
    expect(onPress).toHaveBeenCalledWith(makeRoute());
  });

  it("toggles the favorite without navigating when the star is pressed", async () => {
    const onPress = vi.fn();
    const onToggleFavorite = vi.fn();
    await render(
      <LineItem
        route={makeRoute()}
        isFavorite={false}
        onPress={onPress}
        onToggleFavorite={onToggleFavorite}
      />,
    );
    await fireEvent.press(screen.getByLabelText("Add to favorites"));
    expect(onToggleFavorite).toHaveBeenCalledWith(makeRoute());
    expect(onPress).not.toHaveBeenCalled();
  });
});

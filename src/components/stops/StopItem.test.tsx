import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { StopItem, getStopBadgeLabel } from "./StopItem";
import type { Stop } from "@/types/gtfs";

const makeStop = (overrides: Partial<Stop> = {}): Stop => ({
  stop_id: "s1",
  stop_code: "9",
  stop_name: "Avda. Sierra Nevada 97",
  stop_lat: 37.157368,
  stop_lon: -3.5297508,
  ...overrides,
});

describe("getStopBadgeLabel", () => {
  it("uses the stop code", () => {
    expect(getStopBadgeLabel(makeStop())).toBe("9");
  });

  it("trims a padded stop code", () => {
    expect(getStopBadgeLabel(makeStop({ stop_code: "  12 " }))).toBe("12");
  });

  it("falls back to the initials when the stop has no code", () => {
    expect(getStopBadgeLabel(makeStop({ stop_code: undefined }))).toBe("AV");
  });
});

describe("StopItem", () => {
  it("renders the stop name and the code inside the badge", async () => {
    await render(
      <StopItem
        stop={makeStop()}
        isFavorite={false}
        onPress={() => {}}
        onToggleFavorite={() => {}}
      />,
    );
    expect(screen.getByText("Avda. Sierra Nevada 97")).toBeOnTheScreen();
    expect(screen.getByText("9")).toBeOnTheScreen();
  });

  it("does not render the code as subtext beside the name", async () => {
    await render(
      <StopItem
        stop={makeStop()}
        isFavorite={false}
        onPress={() => {}}
        onToggleFavorite={() => {}}
      />,
    );
    expect(screen.queryByText("(9)")).toBeNull();
  });

  it("shows filled star when favorite", async () => {
    await render(
      <StopItem
        stop={makeStop()}
        isFavorite={true}
        onPress={() => {}}
        onToggleFavorite={() => {}}
      />,
    );
    expect(screen.getByLabelText("Eliminar de favoritos")).toBeOnTheScreen();
  });

  it("shows outline star when not favorite", async () => {
    await render(
      <StopItem
        stop={makeStop()}
        isFavorite={false}
        onPress={() => {}}
        onToggleFavorite={() => {}}
      />,
    );
    expect(screen.getByLabelText("Añadir a favoritos")).toBeOnTheScreen();
  });

  it("calls onPress when the row is pressed", async () => {
    const onPress = vi.fn();
    await render(
      <StopItem
        stop={makeStop()}
        isFavorite={false}
        onPress={onPress}
        onToggleFavorite={() => {}}
      />,
    );
    await fireEvent.press(screen.getByLabelText("Parada Avda. Sierra Nevada 97"));
    expect(onPress).toHaveBeenCalledWith(makeStop());
  });

  it("toggles the favorite without navigating when the star is pressed", async () => {
    const onPress = vi.fn();
    const onToggleFavorite = vi.fn();
    await render(
      <StopItem
        stop={makeStop()}
        isFavorite={false}
        onPress={onPress}
        onToggleFavorite={onToggleFavorite}
      />,
    );
    await fireEvent.press(screen.getByLabelText("Añadir a favoritos"));
    expect(onToggleFavorite).toHaveBeenCalledWith(makeStop());
    expect(onPress).not.toHaveBeenCalled();
  });
});

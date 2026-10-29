import { weighPumpkin } from "/pumpkin.js";

describe("🎃 Pumpkin Weigh-In", () => {
  test("pumpkins under 10 pounds are Mini", () => {
    expect(weighPumpkin(1)).toBe("Mini");
    expect(weighPumpkin(4.5)).toBe("Mini");
    expect(weighPumpkin(9.9)).toBe("Mini");
  });

  test("pumpkins from 10 up to 50 pounds are Carving", () => {
    expect(weighPumpkin(12)).toBe("Carving");
    expect(weighPumpkin(30)).toBe("Carving");
    expect(weighPumpkin(49.9)).toBe("Carving");
  });

  test("pumpkins from 50 up to 1000 pounds are Giant", () => {
    expect(weighPumpkin(75)).toBe("Giant");
    expect(weighPumpkin(400)).toBe("Giant");
    expect(weighPumpkin(999.9)).toBe("Giant");
  });

  test("pumpkins 1000 pounds or more are Record Breaker!", () => {
    expect(weighPumpkin(1200)).toBe("Record Breaker!");
    expect(weighPumpkin(2500)).toBe("Record Breaker!");
  });

  test("a pumpkin right on the line moves up to the bigger category", () => {
    expect(weighPumpkin(10)).toBe("Carving");
    expect(weighPumpkin(50)).toBe("Giant");
    expect(weighPumpkin(1000)).toBe("Record Breaker!");
  });
});

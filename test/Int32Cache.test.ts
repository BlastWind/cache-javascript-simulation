import Int32CacheSimulator from "../src/Int32Cache";

describe("Int32Cache Tests", () => {
  let cache: Int32CacheSimulator;
  beforeEach(() => {
    cache = new Int32CacheSimulator(2, 2, 2, 8);
  });
  it("Adds value to the correct address", () => {
    cache.addToCache(0, 123);
  });
  it.todo("Fills entire cache block after reading from disk");
});

import Int32Disk from "../src/Int32Disk";

describe("Int32Disk Tests", () => {
  let disk;
  beforeEach(() => {
    disk = new Int32Disk(10);
  });
  it("memory pointer shifts after append", () => {
    disk.appendBlock(123);
    disk.appendBlock(234);
    disk.appendBlock(345);
    expect(disk.mp).toBe(3);
  });
  it("appends in range values", () => {
    const [val1, val2, val3, val4, val5] = [
      0,
      -1,
      1,
      Math.pow(2, 31) - 1,
      -Math.pow(2, 31),
    ];
    disk.appendBlock(val1);
    expect(disk.getBlock(0)).toBe(val1);
    disk.appendBlock(val2);
    expect(disk.getBlock(1)).toBe(val2);
    disk.appendBlock(val3);
    expect(disk.getBlock(2)).toBe(val3);
    disk.appendBlock(val4);
    expect(disk.getBlock(3)).toBe(val4);
    disk.appendBlock(val5);
    expect(disk.getBlock(4)).toBe(val5);
  });
  it("throws error on out of range append", () => {
    const outOfRangeVal = Math.pow(2, 100);
    expect(() => {
      disk.appendBlock(outOfRangeVal);
    }).toThrow();
  });
});

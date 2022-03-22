import { bytesPerInt32, maxInt32, minInt32 } from "./constants";

export default class Int32Disk {
  private disk: ArrayBuffer;
  mp: number; // memory pointer
  constructor(addressBits) {
    this.disk = new ArrayBuffer(Math.pow(2, addressBits));
    this.mp = 0;
  }

  getBlock(index) {
    //console.log(index * bytesPerInt32);
    return new DataView(this.disk, 0).getInt32(index * bytesPerInt32);
  }

  appendBlock(value) {
    //console.log(this.mp * bytesPerInt32);
    if (value > maxInt32 || value < minInt32) {
      throw new Error(
        `Please insert a value in range of ${minInt32} to ${maxInt32}`
      );
    }
    new DataView(this.disk, 0).setInt32(this.mp++ * bytesPerInt32, value);
  }
}

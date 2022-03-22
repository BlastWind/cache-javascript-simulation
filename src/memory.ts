"use strict";

import Int32CacheSimulator from "./Int32Cache";
import Int32Disk from "./Int32Disk";

export default class CPU {
  private disk: Int32Disk;
  private cache: Int32CacheSimulator;
  private addressBits: number;
  private maxInt32: number;
  private getCount: number;
  private setCount: number;
  constructor(addressBits) {
    if (addressBits > 20) {
      throw new Error(
        "Please specify the address bit to be <= 20, don't want to run into out of memory errors"
      );
    }

    this.disk = new Int32Disk(addressBits);
    this.addressBits = addressBits;
    this.maxInt32 = Math.pow(2, addressBits) / 4;
  }
  getFromDisk(index: number) {
    if (index > this.maxInt32 || index < 0) {
      throw new Error(
        `Out of bounds, your disk can only contain up to ${this.maxInt32} Int32s`
      );
    }
    this.getCount++;
    /*
    if index is stored in cache, return from cache
    else, fetch from disk. Store what is fetched into the cache by doing the partitioning stuff 

    // let's say we have the integer 
    */

    return this.disk.getBlock(index);
  }

  addToDisk(value) {
    this.disk.appendBlock(value);
  }
  // setBlock(index, value) {
  //   if (index > this.maxInt32 || index < 0) {
  //     throw new Error(
  //       `Out of bounds, your disk can only contain up to ${this.maxInt32} Int32s`
  //     );
  //   }
  //   this.setCount++;
  //   this.Int32Disk.setBlock(index, value);
  // }
}

var cpu = new CPU(12);
cpu.addToDisk(123);
cpu.addToDisk(234);
// console.log("hi");
console.log(cpu.getFromDisk(0));
console.log(cpu.getFromDisk(1));

// const disk = new ArrayBuffer(Math.pow(2, 10));
// new DataView(disk, 0).setInt32(0, 123);
// new DataView(disk, 0).setInt32(4, 234);
// console.log(new DataView(disk, 0).getInt32(0));
// console.log(new DataView(disk, 0).getInt32(4));

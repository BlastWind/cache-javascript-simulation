"use strict";
const bytesPerInt32 = 32 / 8;
class Int32Disk {
  private disk: ArrayBuffer;
  private mp: number; // memory pointer
  constructor(addressBits) {
    this.disk = new ArrayBuffer(Math.pow(2, addressBits));
    this.mp = 0;
  }

  getBlock(index) {
    console.log(index * bytesPerInt32);
    return new DataView(this.disk, 0).getInt32(index * bytesPerInt32);
  }

  appendBlock(value) {
    console.log(this.mp * bytesPerInt32);
    new DataView(this.disk, 0).setInt32(this.mp++ * bytesPerInt32, value);
  }
}

type CacheLine = { valid: number; tag: number; blocks: Array<number> };
type CacheSet = Array<CacheLine>;
type CacheMemory = Array<CacheSet>;
// Fully associative cache
class Int32CacheSimulator {
  private cacheMemory: CacheMemory;
  private numSetBits: number;
  private numLines: number;
  private numBlockBits: number;
  private numAddressBits: number;
  private numTagBits: number;
  // if 2 set, 3 numLines per set and 8 numInt32s per line, we need:
  // We need one Int32 to hold tag bits, one Int32 to hold valid bit, one int32 to hold blocks bits
  // each set has line[]: {valid: Int32, tag: Int32, blocks: Int32Array }[]
  // memory: set[]: {valid: Int32, tag: Int32, blocks: Int32array}[][]
  constructor(
    numSetBits: number,
    numLines: number,
    numBlockBits: number,
    numAddressBits: number
  ) {
    this.numSetBits = numSetBits;
    this.numLines = numLines;
    this.numBlockBits = numBlockBits;
    this.numAddressBits = numAddressBits;
    this.numTagBits = numAddressBits - (numSetBits + numBlockBits);
    if (this.numTagBits < 0) {
      throw new Error("Your set bits + block bits should <= your address bits");
    }
    const numSets = Math.pow(numSetBits, 2);
    const numBlocksPerLine = Math.pow(numBlockBits, 2);
    this.cacheMemory = [...Array(numSets)].map((arr) =>
      [...Array(numLines)].map(() => {
        return { valid: 0, tag: undefined, blocks: Array(numBlocksPerLine) };
      })
    );
  }
  parseMetaFromAddr(address: number) {
    const binVal = dec2bin(address);
    const tagBits = binVal.substring(0, this.numTagBits);
    const setBits = binVal.substring(
      this.numTagBits,
      this.numTagBits + this.numSetBits
    );
    const blockBits = binVal.substring(this.numTagBits + this.numSetBits);
    const setIndex = parseInt(setBits, 2);
    const tag = parseInt(tagBits, 2);
    const blockIndex = parseInt(blockBits, 2);
    return { setIndex, tag, blockIndex };
  }

  _getCacheAt(setIndex: number, lineIndex: number, blockIndex) {
    return this.cacheMemory[setIndex][lineIndex].blocks[blockIndex];
  }

  _setCacheAt(
    setIndex: number,
    lineIndex: number,
    blockIndex: number,
    tag: number,
    value: number
  ) {
    this.cacheMemory[setIndex][lineIndex].tag = tag;
    this.cacheMemory[setIndex][lineIndex].blocks[blockIndex] = value;
  }

  // address is the index into the disk, if we treat disk as a large, contiguous memory array
  fetchCache(address: number) {
    const { tag, setIndex, blockIndex } = this.parseMetaFromAddr(address);
    for (
      let lineIndex = 0;
      lineIndex < this.cacheMemory[setIndex].length;
      lineIndex++
    ) {
      const line = this.cacheMemory[setIndex][lineIndex];
      if (line.valid === 1 && line.tag === tag) {
        return this._getCacheAt(setIndex, lineIndex, blockIndex);
      }
    }
  }
  addToCache(address: number, value: number) {
    const { tag, setIndex, blockIndex } = this.parseMetaFromAddr(address);

    let isCached = false;
    // iter until finding a free line
    for (let i = 0; i < this.cacheMemory[setIndex].length; i++) {
      if (this.cacheMemory[setIndex][i].valid === 0) {
        this._setCacheAt(setIndex, i, blockIndex, tag, value);
        isCached = true;
        break;
      }
    }
    if (!isCached) {
      let randomLine = Math.floor(Math.random() * (this.numLines + 1));
      this._setCacheAt(setIndex, randomLine, blockIndex, tag, value);
    }
  }
}

class CPU {
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

function dec2bin(dec) {
  return (dec >>> 0).toString(2);
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

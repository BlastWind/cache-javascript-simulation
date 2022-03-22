import { dec2bin } from "./utils";

// Fully associative cache
type CacheLine = { valid: number; tag: number; blocks: Array<number> };
type CacheSet = Array<CacheLine>;
type CacheMemory = Array<CacheSet>;

export default class Int32CacheSimulator {
  cacheMemory: CacheMemory;
  numSetBits: number;
  numLines: number;
  numBlockBits: number;
  numAddressBits: number;
  numTagBits: number;
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
  fetchCache(diskAddress: number) {
    const { tag, setIndex, blockIndex } = this.parseMetaFromAddr(diskAddress);
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
  addToCache(diskAddress: number, value: number) {
    const { tag, setIndex, blockIndex } = this.parseMetaFromAddr(diskAddress);

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

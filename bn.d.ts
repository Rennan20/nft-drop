declare module "bn.js" {
  export interface BN {
    // add your own type definitions here
  }

  export function BN(value: string | number | number[] | Buffer): BN;

  // add more exports as needed
}

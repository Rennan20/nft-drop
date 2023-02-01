import React from "react";
import { useAddress, useDisconnect, useMetamask } from "@thirdweb-dev/react";

function NFTDropPage() {
  // Auth
  const connectWithMetamask = useMetamask();
  const address = useAddress();
  const disconnect = useDisconnect();
  // ---
  return (
    <div className="flex h-screen flex-col lg:grid lg:grid-cols-10 ">
      {/*left-side*/}
      <div className="bg-gradient-to-br from-purple-900 to-orange-400 lg:col-span-4">
        <div className="flex flex-col items-center justify-center py-2 lg:min-h-screen">
          <div className="bg-gradient-to-br from-orange-400 to-purple-500 p-1 rounded-xl">
            <img
              className="w-44 rounded-xl object-cover lg:h-96 lg:w-72"
              src="https://links.papareact.com/8sg"
              alt="nft"
            />
          </div>

          <div className="text-center p-5 space-y-2">
            <h1 className="text-4xl font-bold text-white">Artistic Apes</h1>
            <h2 className="text-xl text-gray-300">
              A collection of Artistic Apes who live & breathe React!
            </h2>
          </div>
        </div>
      </div>

      {/*right-side*/}
      <div className="flex flex-1 flex-col p-12 lg:col-span-6 bg-purple-200">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="w-52 cursor-pointer text-xl font-extralight sm:w-80">
            The{" "}
            <span className="font-extrabold underline decoration-purple-600/70">
              Artistic
            </span>{" "}
            NFT Market Place
          </h1>

          <button
            onClick={() => {
              address ? disconnect() : connectWithMetamask();
            }}
            className="rounded-full bg-gradient-to-br from-purple-500 to-orange-400 text-white px-4 py-2 text-xs font-bold lg:px-5 lg:py-3 lg:text-base"
          >
            {address ? "Sign Out" : "Sign In"}
          </button>
        </header>

        <hr className="h-px my-2 border-0 dark:bg-gray-700" />
        {address && (
          <p className="text-center text-sm text-red-400">
            You're logged in with wallet {address.substring(0, 5)}...
            {address.substring(address.length - 5)}
          </p>
        )}

        {/* Content */}
        <div className="mt-10 flex flex-1 flex-col items-center space-y-6 text-center lg:space-y-0 lg:justify-center">
          <img
            className="w-80 object-cover pb-10 lg:h-40"
            src="https://links.papareact.com/bdy"
            alt="bdy"
          />
          <h1 className="text-3xl font-bold lg:text-5xl lg:font-extrabold text-indigo-800">
            The ARTISTIC Ape Coding Club | NFT Drop
          </h1>

          <p className="pt-2 text-xl text-indigo-900">12 / 21 NFT's Claimed</p>
        </div>

        {/* Mint Button */}
        <button className="h-16 w-full text-white bg-orange-400 rounded-full mt-10 font-bold">
          Mint NFT (0.01 ETH)
        </button>
      </div>
    </div>
  );
}

export default NFTDropPage;

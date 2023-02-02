import React, { useState, useMemo } from "react";
import {
  Web3Button,
  useAddress,
  useDisconnect,
  useMetamask,
  useContract,
  useClaimedNFTSupply,
  useUnclaimedNFTSupply,
  useClaimConditions,
  useActiveClaimConditionForWallet,
  useClaimIneligibilityReasons,
  useClaimerProofs,
} from "@thirdweb-dev/react";
import { GetServerSideProps } from "next";
import { sanityClient, urlFor } from "../../sanity";
import { Collection } from "../../typing";
import Link from "next/link";
import { BigNumber, utils } from "ethers";
import toast, { Toaster } from "react-hot-toast";

interface Props {
  collection: Collection;
}

function NFTDropPage({ collection }: Props) {
  const { contract: nftDrop } = useContract(collection.address);
  const [quantity, setQuantity] = useState(1);

  // Auth
  const connectWithMetamask = useMetamask();
  const address = useAddress();
  const disconnect = useDisconnect();
  // ---
  const claimConditions = useClaimConditions(nftDrop);
  const unclaimedSupply = useUnclaimedNFTSupply(nftDrop);
  const claimedSupply = useClaimedNFTSupply(nftDrop);

  const activeClaimCondition = useActiveClaimConditionForWallet(
    nftDrop,
    address || ""
  );

  const claimIneligibilityReasons = useClaimIneligibilityReasons(nftDrop, {
    quantity,
    walletAddress: address || "",
  });

  const claimerProofs = useClaimerProofs(nftDrop, address || "");
  const priceToMint = useMemo(() => {
    const bnPrice = BigNumber.from(
      activeClaimCondition.data?.currencyMetadata.value || 0
    );
    return `${utils.formatUnits(
      bnPrice.mul(quantity).toString(),
      activeClaimCondition.data?.currencyMetadata.decimals || 18
    )} ${activeClaimCondition.data?.currencyMetadata.symbol}`;
  }, [
    activeClaimCondition.data?.currencyMetadata.decimals,
    activeClaimCondition.data?.currencyMetadata.symbol,
    activeClaimCondition.data?.currencyMetadata.value,
    quantity,
  ]);

  const numberClaimed = useMemo(() => {
    return BigNumber.from(claimedSupply.data || 0).toString();
  }, [claimedSupply]);

  const numberTotal = useMemo(() => {
    return BigNumber.from(claimedSupply.data || 0)
      .add(BigNumber.from(unclaimedSupply.data || 0))
      .toString();
  }, [claimedSupply.data, unclaimedSupply.data]);

  const maxClaimable = useMemo(() => {
    let bnMaxClaimable;
    try {
      bnMaxClaimable = BigNumber.from(
        activeClaimCondition.data?.maxClaimableSupply || 0
      );
    } catch (e) {
      bnMaxClaimable = BigNumber.from(1_000_000);
    }

    let perTransactionClaimable;
    try {
      perTransactionClaimable = BigNumber.from(
        activeClaimCondition.data?.maxClaimablePerWallet || 0
      );
    } catch (e) {
      perTransactionClaimable = BigNumber.from(1_000_000);
    }

    if (perTransactionClaimable.lte(bnMaxClaimable)) {
      bnMaxClaimable = perTransactionClaimable;
    }

    const snapshotClaimable = claimerProofs.data?.maxClaimable;

    if (snapshotClaimable) {
      if (snapshotClaimable === "0") {
        // allowed unlimited for the snapshot
        bnMaxClaimable = BigNumber.from(1_000_000);
      } else {
        try {
          bnMaxClaimable = BigNumber.from(snapshotClaimable);
        } catch (e) {
          // fall back to default case
        }
      }
    }

    const maxAvailable = BigNumber.from(unclaimedSupply.data || 0);

    let max;
    if (maxAvailable.lt(bnMaxClaimable)) {
      max = maxAvailable;
    } else {
      max = bnMaxClaimable;
    }

    if (max.gte(1_000_000)) {
      return 1_000_000;
    }
    return max.toNumber();
  }, [
    claimerProofs.data?.maxClaimable,
    unclaimedSupply.data,
    activeClaimCondition.data?.maxClaimableSupply,
    activeClaimCondition.data?.maxClaimablePerWallet,
  ]);

  const isSoldOut = useMemo(() => {
    try {
      return (
        (activeClaimCondition.isSuccess &&
          BigNumber.from(activeClaimCondition.data?.availableSupply || 0).lte(
            0
          )) ||
        numberClaimed === numberTotal
      );
    } catch (e) {
      return false;
    }
  }, [
    activeClaimCondition.data?.availableSupply,
    activeClaimCondition.isSuccess,
    numberClaimed,
    numberTotal,
  ]);

  console.log("claimIneligibilityReasons", claimIneligibilityReasons.data);

  const canClaim = useMemo(() => {
    return (
      activeClaimCondition.isSuccess &&
      claimIneligibilityReasons.isSuccess &&
      claimIneligibilityReasons.data?.length === 0 &&
      !isSoldOut
    );
  }, [
    activeClaimCondition.isSuccess,
    claimIneligibilityReasons.data?.length,
    claimIneligibilityReasons.isSuccess,
    isSoldOut,
  ]);

  const isLoading = useMemo(() => {
    return unclaimedSupply.isLoading || claimedSupply.isLoading || !nftDrop;
  }, [nftDrop, claimedSupply.isLoading, unclaimedSupply.isLoading]);

  const buttonLoading = useMemo(
    () => isLoading || claimIneligibilityReasons.isLoading,
    [claimIneligibilityReasons.isLoading, isLoading]
  );
  const buttonText = useMemo(() => {
    if (isSoldOut) {
      return "Sold Out";
    }

    if (canClaim) {
      const pricePerToken = BigNumber.from(
        activeClaimCondition.data?.currencyMetadata.value || 0
      );
      if (pricePerToken.eq(0)) {
        return "Mint (Free)";
      }
      return `Mint (${priceToMint})`;
    }
    if (claimIneligibilityReasons.data?.length) {
      return parseIneligibility(claimIneligibilityReasons.data, quantity);
    }
    if (buttonLoading) {
      return "Checking eligibility...";
    }

    return "Claiming not available";
  }, [
    isSoldOut,
    canClaim,
    claimIneligibilityReasons.data,
    buttonLoading,
    activeClaimCondition.data?.currencyMetadata.value,
    priceToMint,
    quantity,
  ]);

  return (
    <div className="flex h-screen flex-col lg:grid lg:grid-cols-10 ">
      <Toaster position="bottom-center" />
      {/*left-side*/}
      <div className="bg-gradient-to-br from-purple-900 to-orange-400 lg:col-span-4">
        <div className="flex flex-col items-center justify-center py-2 lg:min-h-screen">
          <div className="bg-gradient-to-br from-orange-400 to-purple-500 p-1 rounded-xl">
            <img
              className="w-44 rounded-xl object-cover lg:h-96 lg:w-72"
              src={urlFor(collection.previewImage).url()}
            />
          </div>

          <div className="text-center p-5 space-y-2">
            <h1 className="text-4xl font-bold text-white">
              {collection.nftCollectionName}
            </h1>
            <h2 className="text-xl text-gray-300">{collection.description}</h2>
          </div>
        </div>
      </div>

      {/*right-side*/}
      <div className="flex flex-1 flex-col p-12 lg:col-span-6 bg-purple-200">
        {/* Header */}
        <header className="flex items-center justify-between">
          <Link href={"/"}>
            <h1 className="w-52 cursor-pointer text-xl font-extralight sm:w-80">
              The{" "}
              <span className="font-extrabold underline decoration-purple-600/70">
                Artistic
              </span>{" "}
              NFT Market Place
            </h1>
          </Link>

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
            src={urlFor(collection.mainImage).url()}
          />
          <h1 className="text-3xl font-bold lg:text-5xl lg:font-extrabold text-indigo-800">
            {collection.title}
          </h1>

          {isLoading ? (
            <p className="animate-pulse pt-2 text-xl text-green-500">
              {" "}
              {isLoading}
            </p>
          ) : (
            <p>
              <b>{numberClaimed}</b>
              {" / "}
              {numberTotal} NFT's Claimed
            </p>
          )}

          {isLoading && (
            <img
              className="h-20 w-25 object-contain"
              src="https://i.stack.imgur.com/hzk6C.gif"
              alt="loading"
            />
          )}
        </div>

        {/* Mint Button */}

        {isLoading ? (
          <span className="text-xl font-semibold">
            {buttonLoading ? "Loading..." : buttonText}
          </span>
        ) : claimedSupply === unclaimedSupply ? (
          <span className="text-xl font-semibold">SOULD OUT!</span>
        ) : !address ? (
          <span className="text-xl font-semibold">Sign in to Mint!</span>
        ) : (
          <Web3Button
            className="web3"
            contractAddress={nftDrop?.getAddress() || ""}
            action={(cntr) => cntr.erc721.claim(quantity)}
            onError={(err) => {
              console.error(err);
              toast("Error claiming NFTs", {
                style: {
                  color: "red",
                },
              });
            }}
            onSuccess={() => {
              toast("Successfully claimed NFTs", {
                style: {
                  color: "white",
                  background: "green",
                },
              });
            }}
          >
            <span className="text-xl font-semibold">
              {buttonLoading ? "Loading..." : buttonText}
            </span>
          </Web3Button>
        )}
      </div>
    </div>
  );
}

export default NFTDropPage;

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const query = `*[_type == 'collection' && slug.current == $id][0] {
    _id,
    title,
    address,
    description,
    nftCollectionName,
    mainImage {
    asset
    },
  previewImage {
    asset
  },
  slug{
    current
      },
  creator-> {
    _id,
    name,
    address,
    slug {
    current
    }
  }
}`;

  const collection = await sanityClient.fetch(query, {
    id: params?.id,
  });

  if (!collection) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      collection,
    },
  };
};
function parseIneligibility(
  data: import("@thirdweb-dev/sdk").ClaimEligibility[],
  quantity: number
): any {
  throw new Error("Function not implemented.");
}

import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import NFTDropPage from "./home";
const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>NFT Drop</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <NFTDropPage />
    </div>
  );
};

export default Home;

import { ethers } from "ethers";
import { supabaseClient } from "../db/supabase.client.js";
import { generateTradeHash } from "../util/tradeHashGenerator.js";

export class TradePublishService {

  async publishTrade(trade) {
    // 1️⃣ Generate trade hash
    const hashHex = generateTradeHash(trade);
    const bytes32Hash = "0x" + hashHex;

    // 2️⃣ Anchor on blockchain
    const provider = new ethers.JsonRpcProvider(
      "https://eth-mainnet.g.alchemy.com/v2/dROy_Ze0s4sASpnIRKq1u"
    );

    const wallet = new ethers.Wallet(
      "6c9e32fbdbf27adb6f218471355a2cff33d5c4e4451300792a86423a18650e3a",
      provider
    );

    const contract = new ethers.Contract(
      "0x49F9F02950b8F9F2dFD6cAedFB5FdD1F6A611A34",
      ["function anchorTrade(bytes32 _tradeHash) external"],
      wallet
    );

    await contract.anchorTrade(bytes32Hash);

    // 3️⃣ Save trade in Supabase
    const { error } = await supabaseClient
      .from("trades_react")
      .insert({
        ...trade,
        txnhash: bytes32Hash
      });

    if (error) {
        console.error("Supabase Insert Error:", error);
      throw new Error("Failed to store trade in database");
    }

    return {
      success: true,
      tradeHash: bytes32Hash
    };
  }
}

import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

const API_KEY = process.env.API_KEY;

async function callPredicateApi() {
  if (!API_KEY) {
    throw new Error("API_KEY not found.");
  }

  const endpoint = "https://api.predicate.io/v1/task";
  const args = process.argv.slice(2);
  const walletAddress = args[0];
  const deployedContract = args[1];
  const data = args[2];

  const body = {
    from: walletAddress,
    to: deployedContract,
    data: data || "0x",
    msg_value: "0",
    chain_id: 1,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`API call failed: ${response.status} - ${text}`);
    throw new Error(`Predicate API error: ${response.status}`);
  }

  const result = await response.json();
  const abiCoder = new ethers.utils.AbiCoder();
  const encoded = abiCoder.encode(
    ["bool", "string", "uint256", "address[]", "bytes[]"],
    [
      result.is_compliant,
      result.task_id,
      result.expiry_block,
      result.signers,
      result.signature,
    ]
  );
  console.log(encoded);
}

callPredicateApi().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

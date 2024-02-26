import {
  createConfig,
  http,
  connect,
  switchChain,
  readContract,
  writeContract,
  waitForTransactionReceipt,
} from "@wagmi/core";
import { mainnet } from "@wagmi/core/chains";
import { injected } from "@wagmi/connectors";
import { parseAbi } from "viem";
import "./style.css";

const TERMINALV1_1 = "0x981c8ECD009E3E84eE1fF99266BF1461a12e5c68";
const TERMINAL_V1_RESCUE = "0xE05605882C3F34B4Ef3586D70dE294f3f9654Ee8"
const PONZIDAO_PROJECT_ID = 140n;
const ROBDAO_PROJECT_ID = 447n;

const FULL_PAYOUT_PROPERTIES = [
  1000000000000000000000n, // target
  0n, // currency
  0n, // duration
  0n, // cycle limit
  0n, // discount rate
  "0x0000000000000000000000000000000000000000", // ballot
];
const FULL_PAYOUT_METADATA = [
  0n, // reserved rate
  0n, // bonding curve rate
  0n, // reconfiguration bonding curve rate
  false, // pay is paused
  false, // ticket printing allowed
  "0x0000000000000000000000000000000000000000", // treasury extension
];

const configureAbi = parseAbi([
  "function configure(uint256,(uint256,uint256,uint256,uint256,uint256,address),(uint256,uint256,uint256,bool,bool,address),(bool,uint16,uint48,address,address,uint56)[],(bool,uint16,uint48,address)[]) returns (uint256)",
]);
const balanceOfAbi = parseAbi([
  "function balanceOf(uint256) returns (uint256)",
]);
const tapAbi = parseAbi([
  "function tap(uint256,uint256,uint256,uint256) returns (uint256)",
]);
const rescueAbi = parseAbi(["function rescue(uint256,address,uint256)"])

const migrateAbi = parseAbi(["function migrate(uint256,address)"])

document.querySelector("#app").innerHTML = `
  <div>
    <h1>Juicebox v1.1 Recovery</h1>
    <h2>PonziDAO</h2>
    <p>Do not migrate until JuiceboxDAO has approved your project for rescuing. Wait for the migrate transaction to finish before calling rescue.</p>
    <div class="card">
      <button class="connect">1. Connect</button>
      <button id="ponzi-migrate">2. Migrate</button>
      <button id="ponzi-rescue">3. Rescue</button>
    </div>
    <h2>RobDAO</h2>
    <p>After calling "New Cycle", wait 7 days (for the cycle to start) before calling Send Payouts.</p>
    <div class="card">
      <button class="connect">1. Connect</button>
      <button id="rob-cycle">2. New cycle</button>
      <button id="rob-payout">3. Send payouts</button>
    </div>
  </div>
  <p id="statusText"></p>
`;

const config = createConfig({
  chains: [mainnet],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
  },
});

const statusText = document.getElementById("statusText");
let result;

const connectButtons = document.querySelectorAll(".connect");
connectButtons.forEach(
  (button) =>
    (button.onclick = async () => {
      button.innerText = "Connecting...";
      result = await connect(config, { connector: injected() });
      button.innerText = "Connected";
      statusText.innerText += `\nConnected to ${result.accounts[0]}.`;

      if (result.chainId !== 1) {
        statusText.innerText += `\nWallet connected to wrong network. Switching to Ethereum mainnet...`;
        await switchChain(config, { chainId: 1 });
        statusText.innerText += `\nSwitched to Ethereum mainnet.`;
      }
    })
);

const ponziMigrateButton = document.getElementById("ponzi-migrate");
ponziMigrateButton.onclick = async () => {
  if (!result || !result.accounts[0]) {
    statusText.innerText += `\nConnect wallet first.`;
    return;
  }

  statusText.innerText += `\nWaiting for configure transaction approval...`;
  const migrateTxHash = await writeContract(config, {
    address: TERMINALV1_1,
    abi: migrateAbi,
    functionName: "migrate",
    args: [
      PONZIDAO_PROJECT_ID,
      TERMINAL_V1_RESCUE,
    ],
  });

  statusText.innerText += `\nMigrating...`;
  const migrateReceipt = await waitForTransactionReceipt(config, {
    hash: migrateTxHash,
  });

  statusText.innerText += `\nMigration successful. Hash: ${migrateReceipt.transactionHash}`;
};

const ponziRescueButton = document.getElementById("ponzi-rescue");
ponziRescueButton.onclick = async () => {
  if (!result || !result.accounts[0]) {
    statusText.innerText += `\nConnect wallet first.`;
    return;
  }

  statusText.innerText += `\nChecking project balance...`;
  const balance = await readContract(config, {
    address: TERMINAL_V1_RESCUE,
    abi: balanceOfAbi,
    functionName: "balanceOf",
    args: [PONZIDAO_PROJECT_ID],
  });

  statusText.innerText += `\nWaiting for payout transaction approval...`;
  const rescueTxHash = await writeContract(config, {
    address: TERMINAL_V1_RESCUE,
    abi: rescueAbi,
    functionName: "rescue",
    args: [
      PONZIDAO_PROJECT_ID,
      "0x518E850b139B6d81626B29E1B4e957AD345156A8", // recipient, PonziDAO owner
      balance,
    ],
  });

  statusText.innerText += `\nRecovering ETH...`;
  const rescueReceipt = await waitForTransactionReceipt(config, {
    hash: rescueTxHash,
  });
  statusText.innerText += `\nETH recovered successfully. Hash: ${rescueReceipt.transactionHash}`;
};

const robCycleButton = document.getElementById("rob-cycle");
robCycleButton.onclick = async () => {
  if (!result || !result.accounts[0]) {
    statusText.innerText += `\nConnect wallet first.`;
    return;
  }

  statusText.innerText += `\nWaiting for configure transaction approval...`;
  const configureTxHash = await writeContract(config, {
    address: TERMINALV1_1,
    abi: configureAbi,
    functionName: "configure",
    args: [
      ROBDAO_PROJECT_ID,
      FULL_PAYOUT_PROPERTIES,
      FULL_PAYOUT_METADATA,
      [], // payout mods
      [], // ticket mods
    ],
  });

  statusText.innerText += `\nConfiguring...`;
  const configureReceipt = await waitForTransactionReceipt(config, {
    hash: configureTxHash,
  });

  statusText.innerText += `\nConfigure successful. Hash: ${configureReceipt.transactionHash}`;
};

const robPayoutButton = document.getElementById("rob-payout");
robPayoutButton.onclick = async () => {
  if (!result || !result.accounts[0]) {
    statusText.innerText += `\nConnect wallet first.`;
    return;
  }

  statusText.innerText += `\nChecking project balance...`;
  const balance = await readContract(config, {
    address: TERMINALV1_1,
    abi: balanceOfAbi,
    functionName: "balanceOf",
    args: [ROBDAO_PROJECT_ID],
  });

  statusText.innerText += `\nWaiting for payout transaction approval...`;
  const payoutTxHash = await writeContract(config, {
    address: TERMINALV1_1,
    abi: tapAbi,
    functionName: "tap",
    args: [
      ROBDAO_PROJECT_ID,
      balance, // amount
      0n, // currency
      0n, // min returned wei
    ],
  });

  statusText.innerText += `\nPaying out ETH...`;
  const payoutReceipt = await waitForTransactionReceipt(config, {
    hash: payoutTxHash,
  });
  statusText.innerText += `\nPayouts sent successfully. Hash: ${payoutReceipt.transactionHash}`;
};

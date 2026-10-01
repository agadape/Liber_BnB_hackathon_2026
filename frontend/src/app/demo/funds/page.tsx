"use client";
import {useState} from "react";
import Link from "next/link";
import {erc20Abi,formatEther,formatUnits,parseEventLogs,zeroAddress,type Address,type Hash} from "viem";
import {PageShell} from "@/components/ui/PageShell";
import {PageHeading} from "@/components/ui/PageHeading";
import {Card} from "@/components/ui/Card";
import {Button} from "@/components/ui/Button";
import {CHAIN,explorerTxUrl} from "@/lib/chain";
import {getMerchantConfig,publicRpc,selectWallet} from "@/lib/merchant";
import {sendActiveWallet,type ActiveWallet} from "@/lib/wallet/activeWallet";
import {DEMO_TOKEN,demoFaucetTx} from "@/lib/demo-funds";

const pendingKey=(address:string)=>`liber:demo-faucet:97:${address.toLowerCase()}`;
type Balances={bnb:string;mock:string;block:string};
export default function DemoFundsPage(){
  const [wallet,setWallet]=useState<ActiveWallet|null>(null),[balances,setBalances]=useState<Balances|null>(null),[pending,setPending]=useState<Hash|null>(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[status,setStatus]=useState("");
  async function readBalances(active:ActiveWallet){
    if(CHAIN.id!==97)throw Error("Demo funds are only available on BSC Testnet (97).");
    const rpc=publicRpc(),block=await rpc.getBlockNumber();
    const [bnb,mock]=await Promise.all([rpc.getBalance({address:active.publicKey as Address,blockNumber:block}),rpc.readContract({address:DEMO_TOKEN,abi:erc20Abi,functionName:"balanceOf",args:[active.publicKey as Address],blockNumber:block})]);
    setBalances({bnb:formatEther(bnb),mock:formatUnits(mock,18),block:block.toString()});
  }
  async function connect(external:boolean){setBusy(true);setError("");setStatus("");setBalances(null);setPending(null);setWallet(null);try{
    const active=await selectWallet(external);setWallet(active);
    const saved=sessionStorage.getItem(pendingKey(active.publicKey));if(saved&&/^0x[a-fA-F0-9]{64}$/.test(saved))setPending(saved as Hash);
    await readBalances(active);
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function confirm(active:ActiveWallet,hash:Hash){
    const receipt=await publicRpc().waitForTransactionReceipt({hash,timeout:90000});
    sessionStorage.removeItem(pendingKey(active.publicKey));setPending(null);
    if(receipt.status!=="success")throw Error("The test-token claim reverted. No claim was completed.");
    const minted=parseEventLogs({abi:erc20Abi,eventName:"Transfer",logs:receipt.logs}).some(log=>log.address.toLowerCase()===DEMO_TOKEN.toLowerCase()&&log.args.from===zeroAddress&&log.args.to.toLowerCase()===active.publicKey.toLowerCase()&&log.args.value===BigInt("1000000000000000000000"));
    if(receipt.to?.toLowerCase()!==DEMO_TOKEN.toLowerCase()||receipt.from.toLowerCase()!==active.publicKey.toLowerCase()||!minted)throw Error("This receipt does not match a 1,000 MockUSDC claim for your wallet.");
    setStatus("Claim confirmed on BSC Testnet. Refresh the balances to see the current total.");await readBalances(active);
  }
  async function claim(){if(!wallet)return;setBusy(true);setError("");try{
    if(pending){await confirm(wallet,pending);return;}
    const tx=demoFaucetTx(await getMerchantConfig(),CHAIN.id);
    const rpc=publicRpc();await rpc.call({account:wallet.publicKey as Address,...tx});
    setStatus("Confirm the 1,000 MockUSDC claim in your wallet. TEST BNB pays the gas.");
    const hash=await sendActiveWallet(wallet,tx) as Hash;
    sessionStorage.setItem(pendingKey(wallet.publicKey),hash);setPending(hash);setStatus("Claim submitted. Waiting for confirmation…");await confirm(wallet,hash);
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  return <PageShell>
    <PageHeading eyebrow="Demo funds" title="Prepare your wallet.">TEST BNB for gas. MockUSDC for invoices. No monetary value.</PageHeading>
    {!wallet?<Card className="flex flex-col gap-3"><h2 className="font-semibold">Choose your demo wallet</h2><Button disabled={busy||CHAIN.id!==97} onClick={()=>connect(true)}>{busy?"Connecting…":"Connect MetaMask / browser wallet"}</Button><Button variant="ghost" disabled={busy||CHAIN.id!==97} onClick={()=>connect(false)}>Use this device&apos;s test wallet</Button><p className="text-xs text-ink/65">Use different wallets for the merchant and buyer.</p></Card>:<Card><div className="flex items-center justify-between"><h2 className="font-semibold">Your testnet balances</h2><button disabled={busy||!!pending} className="text-xs text-emerald underline" onClick={()=>{setWallet(null);setBalances(null);setPending(null);setError("");setStatus("");}}>Switch wallet</button></div><p className="mt-3 break-all font-mono text-xs text-ink/65">{wallet.publicKey}</p><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-paper p-3"><p className="text-xs text-ink/65">TEST BNB · gas</p><p className="mt-2 break-all text-xl font-semibold">{balances?Number(balances.bnb).toLocaleString("en-US",{maximumFractionDigits:6}):"…"}</p></div><div className="rounded-xl bg-gold/10 p-3"><p className="text-xs text-ink/65">MockUSDC · payments</p><p className="mt-2 break-all text-xl font-semibold">{balances?Number(balances.mock).toLocaleString("en-US",{maximumFractionDigits:2}):"…"}</p></div></div><button disabled={busy} className="mt-4 text-xs text-emerald underline" onClick={async()=>{setBusy(true);setError("");try{await readBalances(wallet);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>Refresh balances from BNB</button>{balances&&<p className="mt-2 text-[10px] text-ink/65">Read from BSC Testnet · block {balances.block}</p>}</Card>}
    <Card className="mt-4"><h2 className="font-semibold">Get TEST BNB</h2><p className="mt-2 text-sm text-ink/60">Request gas funds for your wallet from a BSC Testnet faucet. Provider limits apply.</p><a href="https://www.bnbchain.org/en/testnet-faucet" target="_blank" rel="noopener noreferrer" className="action-link mt-4 w-full border border-ink/15 text-emerald">Open BNB Chain faucet ↗</a><a href="https://docs.bnbchain.org/bnb-smart-chain/developers/faucet/" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs text-emerald underline">Official alternative faucet list ↗</a></Card>
    <Card className="mt-4"><h2 className="font-semibold">Get MockUSDC</h2><p className="mt-2 text-sm text-ink/60">Claim 1,000 test tokens into your wallet. Requires TEST BNB for gas.</p><Button className="mt-4" disabled={busy||!wallet||CHAIN.id!==97||(!pending&&!!balances&&Number(balances.bnb)===0)} onClick={claim}>{busy?"Checking…":pending?"Resume claim confirmation":"Claim 1,000 MockUSDC"}</Button>{wallet&&balances&&Number(balances.bnb)===0&&<p className="mt-2 text-xs text-ink/65">Your wallet needs TEST BNB before it can claim tokens.</p>}{pending&&<a href={explorerTxUrl(pending)} target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs text-emerald underline">Inspect submitted claim ↗</a>}</Card>
    {status&&<p role="status" className="mt-4 text-sm text-emerald">{status}</p>}{error&&<p role="alert" className="mt-4 text-sm text-rose">{error}</p>}
    <Link href="/merchant" className="action-link mt-5 bg-emerald text-paper">Create a test invoice →</Link><p className="mt-3 text-xs leading-relaxed text-ink/65">Use a different buyer wallet to pay. MockUSDC does not settle QRIS.</p>
  </PageShell>;
}

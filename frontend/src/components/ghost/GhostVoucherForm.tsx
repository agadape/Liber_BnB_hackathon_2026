"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {getAddress,isAddress,formatUnits,type Address,type Hash,type Hex} from "viem";
import {GhostJourney} from "./GhostJourney";
import {GhostShell} from "./GhostShell";
import {GhostPreview} from "./GhostPreview";
import {GhostVoucherTicket} from "./GhostVoucherTicket";
import {Card} from "../ui/Card";
import {Button} from "../ui/Button";
import {selectWallet} from "@/lib/merchant";
import {signActiveWalletTypedData,type ActiveWallet} from "@/lib/wallet/activeWallet";
import {getGhostConfig,ghostRpc} from "@/lib/ghost/config";
import {requireReadyConfig,type GhostConfig,type GhostState} from "@/lib/ghost/chain";
import {parseGhostAmount,serializeVoucher,deserializeVoucher,voucherId,type GhostVoucher} from "@/lib/ghost/codec";
import {getJournal,saveJournal,saveSignature,getSignature,type GhostJournal} from "@/lib/ghost/storage";
import {newGhostVoucher,ownerBalances,approveGhost,reserveGhost,readyForPrint,confirmGhost,expiryLabel,safeGhostError,ghostTxUrl,uiError,assertActiveOwner} from "@/lib/ghost/transactions";
import {syncGhostProof,readPublicGhost} from "@/lib/ghost/api";

export function GhostVoucherForm({initialId}:{initialId?:Hash}) {
  const [config,setConfig]=useState<GhostConfig|null>(null),[wallet,setWallet]=useState<ActiveWallet|null>(null);
  const [merchant,setMerchant]=useState(""),[amount,setAmount]=useState("5"),[minutes,setMinutes]=useState("60");
  const [voucher,setVoucher]=useState<GhostVoucher|null>(null),[signature,setSignature]=useState<Hex|null>(null),[journal,setJournal]=useState<GhostJournal|null>(null),[ready,setReady]=useState<GhostState|null>(null);
  const [busy,setBusy]=useState(false),[status,setStatus]=useState(""),[error,setError]=useState<string|null>(null),[sync,setSync]=useState("");
  useEffect(()=>{getGhostConfig().then(setConfig).catch(()=>setError("Ghost configuration could not be checked."));},[]);
  useEffect(()=>{const clear=()=>{setSignature(null);setReady(null);setWallet(null);};window.addEventListener("liber:ghost-clear-sensitive",clear);return()=>window.removeEventListener("liber:ghost-clear-sensitive",clear);},[]);
  function updateJournal(row:GhostJournal){setJournal(row);try{saveJournal(row);}catch{setError("Browser storage is unavailable. Keep the transaction hash shown here before leaving this page.");}}
  async function connect(external:boolean) {
    setBusy(true);setError(null);setReady(null);setSignature(null);
    try {
      const active=await selectWallet(external);setWallet(active);
      if(voucher&&getAddress(active.publicKey)!==voucher.owner){setVoucher(null);setJournal(null);setStatus("");}
      if(initialId && config?.vaultAddress) {
        let found=getJournal(config.vaultAddress,active.publicKey as Address,initialId);
        if(!found) {
          const publicData=await readPublicGhost(initialId);
          const proof=publicData.proofs.find(p=>p.action==="reserve"&&p.voucher);
          if(!proof?.voucher || getAddress(proof.owner)!==getAddress(active.publicKey))throw uiError("This wallet has no verified reservation for that voucher. Recover its reserve transaction first.");
          found={id:initialId,vault:config.vaultAddress,owner:proof.owner,voucher:proof.voucher,reserveTxHash:proof.txHash,createdAt:new Date().toISOString()};saveJournal(found);
        }
        const v=deserializeVoucher(found.voucher);setVoucher(v);setJournal(found);setMerchant(v.merchant);setAmount(formatUnits(v.amount,18));setStatus("Reservation restored. Re-sign the same authorization to print again.");
      }
    }catch(e){setError(safeGhostError(e));}finally{setBusy(false);}
  }
  async function review() {
    if(!wallet || !config)return;setBusy(true);setError(null);
    try {
      requireReadyConfig(config);if(!isAddress(merchant))throw uiError("Paste the merchant's full EVM wallet address.");
      await assertActiveOwner(wallet,wallet.publicKey as Address,config);
      const v=await newGhostVoucher(config,wallet.publicKey as Address,getAddress(merchant),parseGhostAmount(amount),Number(minutes));
      setVoucher(v);setSignature(null);setReady(null);
      updateJournal({id:voucherId(config.vaultAddress,v),vault:config.vaultAddress,owner:v.owner,voucher:serializeVoucher(v),createdAt:new Date().toISOString()});
      setStatus("Review the recipient and lock period before authorizing.");
    }catch(e){setError(safeGhostError(e));}finally{setBusy(false);}
  }
  async function prepareSignature(v:GhostVoucher):Promise<Hex> {
    if(!wallet || !config?.vaultAddress)throw uiError("Connect the owner wallet first.");
    const saved=signature??getSignature(config.vaultAddress,v.owner,voucherId(config.vaultAddress,v));
    if(saved)return saved;
    setStatus("Sign the limited voucher authorization in your wallet…");
    const sig=await signActiveWalletTypedData(wallet,config.vaultAddress,v);saveSignature(config.vaultAddress,v,sig);setSignature(sig);return sig;
  }
  async function checkReservation(row:GhostJournal) {
    if(!config || !row.reserveTxHash)return;
    setStatus("Checking funding and confirmations. No transaction is being resent…");
    const proof=await confirmGhost(config,row.id,row.reserveTxHash,"reserve",hash=>{row={...row,reserveTxHash:hash};updateJournal(row);});
    const v=deserializeVoucher(row.voucher);const state=await readyForPrint(config,v,proof.txHash);setReady(state);setStatus("Funds reserved. Your paper voucher is ready.");
    // Explicit optional sync keeps a login prompt out of the signing/funding sequence.
  }
  async function fund() {
    if(!wallet || !config || !voucher || !journal)return;setBusy(true);setError(null);setReady(null);
    let row=journal;
    try {
      requireReadyConfig(config);
      if(row.reserveTxHash){await prepareSignature(voucher);await checkReservation(row);return;}
      const sig=await prepareSignature(voucher);const balances=await ownerBalances(config,voucher.owner);
      if(balances.token<voucher.amount)throw uiError("Not enough MockUSDC. Get test tokens before reserving.");
      if(balances.gas===0n)throw uiError("The owner needs TEST BNB to reserve funds.");
      if(row.approvalTxHash) {
        setStatus("Checking your saved approval transaction…");
        const receipt=await ghostRpc().waitForTransactionReceipt({hash:row.approvalTxHash,timeout:90_000});
        if(receipt.status!=="success")throw uiError("Approval reverted. Inspect it before creating a new attempt.");
      }
      if(balances.allowance<voucher.amount) {
        if(row.approvalTxHash) {
          const refreshed=await ownerBalances(config,voucher.owner);if(refreshed.allowance<voucher.amount)throw uiError("Saved approval is insufficient. Inspect its transaction before retrying.");
        }else{
          setStatus("Approve this exact amount for the Ghost vault…");const hash=await approveGhost(wallet,config,voucher);
          row={...row,approvalTxHash:hash};updateJournal(row);
          const receipt=await ghostRpc().waitForTransactionReceipt({hash,timeout:90_000});if(receipt.status!=="success")throw uiError("Approval reverted. No reservation was created.");
        }
      }
      setStatus("Reserve the voucher amount in your wallet. Funds lock until claim or expiry…");
      const hash=await reserveGhost(wallet,config,voucher,sig);row={...row,reserveTxHash:hash};updateJournal(row);await checkReservation(row);
    }catch(e){setError(safeGhostError(e));}finally{setBusy(false);}
  }
  async function syncHistory() {
    if(!journal?.reserveTxHash || !voucher)return;setBusy(true);setSync("");
    try{await syncGhostProof(journal.id,journal.reserveTxHash,"reserve",voucher);setSync("Reservation added to your verified history.");}catch{setSync("History sync unavailable. Your on-chain reservation is unaffected.");}finally{setBusy(false);}
  }
  const locked=Boolean(journal?.reserveTxHash || journal?.approvalTxHash);
  return <GhostShell title={initialId?"Your voucher.":"Issue a voucher."} eyebrow="BUYER / ISSUE" description="Choose who can claim, how much, and until when."><GhostJourney steps={["Connect wallet","Set limits","Reserve tokens","Export voucher"]} current={!wallet?0:!voucher?1:!ready?2:3}/><div className="ghost-columns"><div className="ghost-no-print">
    {!config&&!error&&<p role="status" className="ghost-muted mb-4">Checking testnet configuration…</p>}{config&&!config.enabled&&<Card><h2>Ghost is preparing for launch.</h2><p className="ghost-muted">{config.reason}</p><Link className="landing-text-link" href="/ghost">Explore the protocol ↗</Link></Card>}
    {!wallet?<Card className="ghost-stack"><div className="ghost-connect-heading"><span className="ghost-connect-number">01</span><div><h2>Start with your wallet.</h2><p>Use MetaMask, or try a device test wallet.</p></div></div><Button disabled={busy||!config?.enabled} onClick={()=>connect(true)}>Connect owner wallet</Button><Button variant="ghost" disabled={busy||!config?.enabled} onClick={()=>connect(false)}>Use device test wallet</Button></Card>:<Card><p className="ghost-muted">Owner wallet</p><p className="ghost-address">{wallet.publicKey}</p></Card>}
    {wallet&&!voucher&&!initialId&&<Card className="ghost-stack mt-4"><label>Merchant wallet<input name="merchant" aria-describedby="merchant-help" autoComplete="off" spellCheck={false} value={merchant} onChange={e=>setMerchant(e.target.value)} placeholder="0x…"/></label><p id="merchant-help" className="ghost-field-help">Only this receiving wallet can claim. Confirm it with your merchant.</p><label>Amount · MockUSDC<input name="amount" inputMode="decimal" autoComplete="off" value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>Valid for<select name="expiry" value={minutes} onChange={e=>setMinutes(e.target.value)}><option value="5">5 minutes + inclusion buffer</option><option value="15">15 minutes</option><option value="60">1 hour</option><option value="1440">24 hours</option></select></label><Button disabled={busy} onClick={review}>Review authorization</Button></Card>}
    {voucher&&<Card className="mt-4 ghost-stack"><p className="page-eyebrow">LIMITED AUTHORIZATION</p><p className="ghost-amount">{formatUnits(voucher.amount,18)} <small>MockUSDC</small></p><dl className="ghost-review"><dt>Only this merchant</dt><dd className="ghost-address">{voucher.merchant}</dd><dt>Valid before</dt><dd>{expiryLabel(voucher.validBefore)}</dd><dt>Wallet requests</dt><dd>Authorization signature, token approval if needed, then reservation.</dd></dl><p className="ghost-muted">Reserved tokens stay in the contract until the merchant claims or you reclaim after expiry. Handing over the QR authorizes the merchant to claim; delivery is not guaranteed.</p><Button disabled={busy} onClick={fund}>{busy?"Checking your wallet…":journal?.reserveTxHash?"Re-sign / verify reservation":journal?.approvalTxHash?"Resume reservation":"Sign & reserve"}</Button>{!locked&&!initialId&&<Button variant="ghost" disabled={busy} onClick={()=>{setVoucher(null);setJournal(null);setSignature(null);setReady(null);}}>Edit before reserving</Button>}{journal?.reserveTxHash&&<><a className="landing-text-link" href={ghostTxUrl(journal.reserveTxHash)} target="_blank" rel="noopener noreferrer">Reservation transaction ↗</a><Button variant="ghost" disabled={busy} onClick={syncHistory}>Sync verified history</Button></>}</Card>}
    <p role="status" className="ghost-status">{status}</p>{error&&<p role="alert" className="ghost-error">{error}</p>}{sync&&<p className="ghost-muted">{sync}</p>}<div className="ghost-stack"><Link className="landing-text-link" href="/ghost/vouchers">Recover or reclaim a voucher ↗</Link>{config?.enabled&&<Link className="landing-text-link" href="/demo/funds">Get TEST BNB and MockUSDC ↗</Link>}</div>
  </div><div>{ready&&voucher&&signature&&config?.vaultAddress&&journal?.reserveTxHash?<GhostVoucherTicket vault={config.vaultAddress} voucher={voucher} signature={signature} beforeExport={async()=>{await readyForPrint(config,voucher,journal.reserveTxHash!);}}/>:<GhostPreview/>}</div></div></GhostShell>;
}

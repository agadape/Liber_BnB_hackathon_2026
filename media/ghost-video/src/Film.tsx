import {AbsoluteFill,Audio,Img,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {Art,C,Frame,Note,Rise,Shot,Title,enter,serif} from './design';
import {Subtitles} from './Subtitles';
export const seconds=[10,8,12,14,10,12,12,14,12,16];
const Story=()=>{const f=useCurrentFrame();return <Frame chapter="the battery problem" number={1}>
 <Rise style={{position:'absolute',left:90,top:214,width:860}}><Title>{f<95?<>The sandwich<br/>is ready.</>:<>The battery<br/>is not.</>}</Title></Rise>
 <Art name="problem-hook" style={{position:'absolute',right:85,top:173,width:690,height:690,transform:`rotate(${Math.sin(f/70)*.7}deg)`}}/>
 <Rise delay={50} style={{position:'absolute',left:95,top:590,display:'flex',alignItems:'center',gap:40}}><div style={{border:'7px solid #a34832',width:206,height:106,padding:10,borderRadius:15,position:'relative'}}><div style={{height:'100%',width:f<120?9:0,background:'#a34832'}}/><div style={{position:'absolute',right:-20,top:30,width:12,height:35,background:'#a34832',borderRadius:4}}/></div><div style={{fontSize:76,color:C.green}}>1%</div></Rise>
 <Note style={{position:'absolute',left:95,top:805}}>Illustrative scenario / prepare permission earlier</Note>
 </Frame>;};
const Intro=()=>{const f=useCurrentFrame();return <Frame chapter="meet Ghost" dark number={2}>
 <Rise style={{position:'absolute',left:90,top:206,width:870}}><Title style={{fontSize:141}}>Ghost<br/>Protocol.</Title><div style={{fontSize:39,lineHeight:1.35,marginTop:45,color:'#d7e4cc'}}>A payment permission<br/>that can leave your phone.</div></Rise>
 <Art name="hero-success" style={{position:'absolute',right:83,top:170,width:704,height:704,transform:`scale(${1+enter(f,0,180)*.018})`}}/>
 <Note style={{position:'absolute',left:95,top:830,color:'#c5d2c4'}}>Prefunded. Constrained. Portable.</Note>
 </Frame>;};
const Rules=()=>{const f=useCurrentFrame();return <Frame chapter="the permission" number={3}>
 <Rise style={{position:'absolute',left:90,top:230,width:880}}><Title>Give the paper<br/>limits.</Title><div style={{fontSize:37,lineHeight:1.35,marginTop:42,color:C.green}}>The contract enforces them.<br/>The paper carries them.</div></Rise>
 <div style={{position:'absolute',right:98,top:175,width:708,height:650,background:'#fffef8',boxShadow:'0 25px 70px #1839281a',padding:'42px 50px',transform:`rotate(${(1-enter(f))*5+1}deg)`}}>
  <div style={{fontSize:24,letterSpacing:2,color:C.green}}>GHOST / PERMISSION MODEL</div>
  {[['RECIPIENT','One named merchant'],['AMOUNT','Exact reserved tokens'],['EXPIRY','A chosen deadline'],['USE','One claim only']].map(([a,b],i)=><Rise key={a} delay={i*37+15} style={{borderBottom:'1px solid #d7ddcb',padding:'22px 0'}}><div style={{fontSize:20,color:C.muted}}>{a}</div><div style={{fontFamily:serif,fontSize:43,marginTop:8}}>{b}</div></Rise>)}
 </div></Frame>;};
const Prepare=()=>{const f=useCurrentFrame(),review=f>=205;
 const highlight: [number,number,number,number]|undefined=review?[95,550,525,334]:f<65?undefined:f<115?[96,586,525,57]:f<165?[100,681,516,50]:[100,773,516,47];
 const focus=review?'UNSIGNED REVIEW':f<65?'PREPARATION':f<115?'RECIPIENT':f<165?'AMOUNT':'EXPIRY';
 return <Frame chapter="prepare online" number={4}>
 <Rise style={{position:'absolute',left:90,top:253,width:515}}><Title style={{fontSize:87}}>{review?<>Review<br/>before signing.</>:<>Choose.<br/>Then review.</>}</Title><div style={{fontSize:32,lineHeight:1.4,marginTop:38,color:C.green}}>Recipient.<br/>Amount.<br/>Expiry.</div></Rise>
 <Shot file={review?'review.png':'prepare.png'} native={review?[1265,1396]:[1265,1146]} rect={review?[72,537,573,505]:[72,225,1122,660]} w={review?760:1110} h={review?669:653} style={{position:'absolute',right:85,top:188}} label={`UI WALKTHROUGH / ${focus} / NO TRANSACTION`} highlight={highlight}/>
 </Frame>;};
const Handover=()=>{const f=useCurrentFrame();return <Frame chapter="private handover" number={5}>
 <Rise style={{position:'absolute',left:92,top:220,width:860}}><Title style={{fontSize:92}}>Buyer can leave.<br/>Merchant stays<br/>online.</Title><div style={{fontSize:34,color:C.green,lineHeight:1.4,marginTop:40}}>Named wallet + internet + gas</div></Rise>
 <div style={{position:'absolute',right:135,top:180,width:590,height:650,background:'#fffef8',boxShadow:'0 25px 70px #1839281a',padding:35,transform:`rotate(${3-enter(f)*5}deg)`}}><div style={{fontSize:25,color:C.green,marginBottom:25}}>RECORDED SAMPLE / ALREADY SPENT</div><Img src={staticFile('ui/spent-qr.png')} style={{width:490,height:490,objectFit:'contain'}}/><div style={{fontSize:23,marginTop:10,color:C.muted}}>Keep active vouchers private.</div></div>
 </Frame>;};
const ReceiptFocus=({reclaim=false}:{reclaim?:boolean})=>{const f=useCurrentFrame(),links=f>=(reclaim?260:235),detail=f>=90;
 const rect:[number,number,number,number]=links?[322,909,400,133]:detail?[307,386,650,367]:[307,386,650,663];
 const label=links?`PUBLIC RECEIPT / RESERVE + ${reclaim?'RECLAIM':'REDEEM'} LINKS`:detail?'PUBLIC RECEIPT / AMOUNT + STATE + RECIPIENT':`PUBLIC VERIFIED ${reclaim?'RECLAIM':'PAYMENT'} / CHAIN 97`;
 return <><Shot file={reclaim?'reclaim.png':'payment.png'} native={[1265,1236]} rect={rect} w={detail?890:646} h={links?296:detail?502:656} style={{position:'absolute',right:85,top:links?340:187}} label={label}/>{detail&&<Note style={{position:'absolute',right:85,top:links?730:785,width:890}}>Faithful crop of the public receipt.</Note>}</>;
};
const Payment=()=> <Frame chapter="public payment proof" number={6}>
 <Rise style={{position:'absolute',left:91,top:235,width:880}}><Title style={{fontSize:111,color:C.green}}>5 MockUSDC.</Title><div style={{fontSize:58,lineHeight:1.1,marginTop:20}}>Claimed once.</div><div style={{fontSize:33,lineHeight:1.4,marginTop:44}}>Named merchant.<br/>Matching token transfer.<br/>Public reserve + redeem links.</div></Rise>
 <ReceiptFocus/>
 <Note style={{position:'absolute',left:97,top:816}}>No wallet login needed to inspect.</Note>
 </Frame>;
const Replay=()=> <Frame chapter="replay rejected" dark number={7}>
 <Rise style={{position:'absolute',left:90,top:204,width:1650}}><Title style={{fontSize:92}}>A screenshot is not<br/>a second payment.</Title></Rise>
 <Shot file="replay.jpg" native={[1265,712]} rect={[55,180,1100,405]} w={1320} h={486} style={{position:'absolute',left:295,top:410}} label="SEPARATE HOSTED UI TEST / SAME VOUCHER RESCANNED"/>
 </Frame>;
const Expiry=()=> <Frame chapter="unused funds" number={8}>
 <Rise style={{position:'absolute',left:90,top:211,width:910}}><Title style={{fontSize:100}}>Unused?<br/>Reclaim later.</Title><div style={{fontSize:54,color:C.green,marginTop:40}}>2 MockUSDC returned.</div><div style={{fontSize:31,lineHeight:1.4,marginTop:32}}>Separate voucher.<br/>Owner transaction after expiry.<br/>Recovery is not automatic.</div></Rise>
 <ReceiptFocus reclaim/>
 </Frame>;
const Bounds=()=> <Frame chapter="the boundary" dark number={9}>
 <Rise style={{position:'absolute',left:95,top:190,width:1700}}><Title style={{fontSize:91}}>Built. Inspectable. Still testnet.</Title></Rise>
 {[['BSC TESTNET / CHAIN 97','Mock tokens have no cash value.'],['PHYSICAL PHONE-OFF TEST','Pending. No whole-device-off proof claimed.'],['SCOPE','No rupiah settlement or delivery verification.']].map(([a,b],i)=><Rise key={a} delay={i*37+20} style={{position:'absolute',left:98,top:375+i*158,width:1620}}><div style={{fontSize:24,color:C.gold,letterSpacing:1}}>{a}</div><div style={{fontSize:41,marginTop:17}}>{b}</div></Rise>)}
 </Frame>;
const Close=()=> <Frame chapter="what comes next" number={10}>
 <Art name="mascot-guide" style={{position:'absolute',left:83,top:189,width:630,height:630}}/>
 <Rise style={{position:'absolute',left:785,top:195,width:1030}}><Title style={{fontSize:88}}>Your battery gets a break.<br/>Your permission<br/>keeps its limits.</Title><div style={{fontSize:35,lineHeight:1.4,marginTop:35,color:C.green}}>Next: a prearranged sandbox merchant pilot<br/>and independent security review.</div></Rise>
 <Rise delay={35} style={{position:'absolute',left:787,top:743,width:1020}}><div style={{fontSize:31,fontWeight:600}}>liber-bnb-web.vercel.app/ghost</div><Note style={{marginTop:20}}>Public evidence + code linked in the description.</Note></Rise>
 </Frame>;
const scenes=[Story,Intro,Rules,Prepare,Handover,Payment,Replay,Expiry,Bounds,Close];
export const Film=()=>{let start=0;return <AbsoluteFill>{scenes.map((Scene,i)=>{const from=start;start+=seconds[i]*30;return <Sequence key={i} from={from} durationInFrames={seconds[i]*30}><Scene/></Sequence>;})}<Subtitles/><Audio src={staticFile('audio/master.wav')}/></AbsoluteFill>;};
export const Poster=()=> <AbsoluteFill style={{background:C.paper,fontFamily:serif,color:C.deep}}><div style={{position:'absolute',left:87,top:75,fontSize:46}}>liber:Ghost Protocol</div><Title style={{position:'absolute',left:90,top:238,fontSize:144,width:1090}}>Phone off.<br/>Permission on.</Title><div style={{position:'absolute',left:97,top:800,fontSize:34,color:C.green}}>BUILT ON BNB / TESTNET PROTOTYPE</div><Art name="hero-success" style={{position:'absolute',right:74,top:146,width:692,height:692}}/></AbsoluteFill>;

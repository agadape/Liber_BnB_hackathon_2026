import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/fonts';
export const C={paper:'#f5f3e9',deep:'#063d2c',green:'#0b6b4e',ink:'#101e1a',muted:'#52635b',gold:'#f0b90b'};
export const sans='Bricolage Grotesque',serif='Newsreader';
loadFont({family:sans,url:staticFile('fonts/BricolageGrotesque.ttf'),weight:'100 900'});
loadFont({family:serif,url:staticFile('fonts/Newsreader.ttf'),weight:'100 900'});
export const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
export const ease=Easing.bezier(.16,1,.3,1);
export const enter=(f:number,start=0,len=25)=>interpolate(f,[start,start+len],[0,1],{...clamp,easing:ease});
export const Rise:React.FC<{children:React.ReactNode;delay?:number;style?:React.CSSProperties}>=({children,delay=0,style})=>{
 const f=useCurrentFrame(),t=enter(f,delay);return <div style={{opacity:t,transform:`translateY(${(1-t)*35}px)`,...style}}>{children}</div>;
};
export const Title:React.FC<{children:React.ReactNode;style?:React.CSSProperties}>=({children,style})=><div style={{fontFamily:serif,fontSize:103,lineHeight:1.04,fontWeight:500,letterSpacing:-1.6,...style}}>{children}</div>;
export const Art:React.FC<{name:string;style?:React.CSSProperties}>=({name,style})=><Img src={staticFile(`art/${name}.jpg`)} style={{objectFit:'contain',...style}}/>;
export const Frame:React.FC<{children:React.ReactNode;chapter:string;dark?:boolean;number:number}>=({children,chapter,dark=false,number})=>{
 const f=useCurrentFrame(),{durationInFrames}=useVideoConfig();
 return <AbsoluteFill style={{background:dark?C.deep:C.paper,color:dark?C.paper:C.ink,fontFamily:sans}}>
  <div style={{position:'absolute',left:82,top:47,display:'flex',alignItems:'center',gap:18}}><Img src={staticFile('art/liber-logo.png')} style={{width:49,height:49}}/><span style={{fontFamily:serif,fontSize:40}}>liber:Ghost Protocol</span><span style={{fontSize:23,opacity:.65,marginLeft:20}}>/{chapter}</span></div>
  <div style={{position:'absolute',right:82,top:58,fontSize:24,color:dark?C.gold:C.green}}>BNB SMART CHAIN / TESTNET</div>
  {children}
  <div style={{position:'absolute',right:72,bottom:50,fontSize:23,opacity:.55}}>{String(number).padStart(2,'0')}</div>
  <div style={{position:'absolute',bottom:0,left:0,height:5,width:'100%',background:dark?'#245542':'#d9ddce'}}><div style={{height:5,width:`${Math.min(100,f/durationInFrames*100)}%`,background:C.gold}}/></div>
 </AbsoluteFill>;
};
export const Note:React.FC<{children:React.ReactNode;style?:React.CSSProperties}>=({children,style})=><div style={{fontSize:25,letterSpacing:.5,color:C.muted,...style}}>{children}</div>;
export const Shot:React.FC<{file:string;rect:[number,number,number,number];native:[number,number];w:number;h:number;style?:React.CSSProperties;label?:string;highlight?:[number,number,number,number]}>=({file,rect,native,w,h,style,label='LIVE UI / CAPTURED 2 OCT 2026',highlight})=>{
 const scale=w/rect[2];return <div style={{width:w,height:h+42,borderRadius:15,overflow:'hidden',border:'1px solid #bfc9b8',boxShadow:'0 22px 70px #18392816',background:C.paper,...style}}>
  <div style={{height:42,display:'flex',alignItems:'center',paddingLeft:20,fontSize:19,fontWeight:600,color:C.green,background:'#e4e8da'}}>{label}</div>
  <div style={{height:h,width:w,overflow:'hidden',position:'relative'}}><Img src={staticFile(`ui/${file}`)} style={{position:'absolute',width:native[0]*scale,height:native[1]*scale,left:-rect[0]*scale,top:-rect[1]*scale}}/>{highlight&&<div style={{position:'absolute',left:(highlight[0]-rect[0])*scale,top:(highlight[1]-rect[1])*scale,width:highlight[2]*scale,height:highlight[3]*scale,border:'3px solid #f0b90b',boxSizing:'border-box',borderRadius:12,boxShadow:'0 0 0 6px #f0b90b20',pointerEvents:'none'}}/>}</div>
 </div>;
};

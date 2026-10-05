import {BasicCaptions} from './basic-captions';
import {useCurrentFrame,useVideoConfig} from 'remotion';
export const Subtitles=()=> {const frame=useCurrentFrame();const {fps}=useVideoConfig();const ms=frame/fps*1000;const active=[[450, 2092], [2242, 4123], [4273, 5699], [5849, 9350], [10450, 12739], [12889, 17350], [18450, 21241], [21391, 24571], [24721, 26928], [27078, 29350], [30450, 32369], [32519, 35553], [35703, 39318], [39468, 43350], [44450, 46854], [47004, 50657], [50807, 53350], [54450, 58770], [58920, 62524], [62674, 65350], [66450, 68777], [68927, 73128], [73278, 77350], [78450, 82474], [82624, 85514], [85664, 89488], [89638, 91350], [92450, 95102], [95252, 97255], [97405, 99821], [99971, 103350], [104450, 109550], [109700, 112845], [112995, 115021], [115171, 117057], [117207, 119350]].some(([start,end])=>ms>=start&&ms<end);return <BasicCaptions name="English subtitles" premountFor={60} width={1650} combineTokensWithinMilliseconds={1700} style={{position:'absolute',bottom:42,left:135,zIndex:30,opacity:active?1:0}} captions={[
  {
    "text": "The",
    "startMs": 450,
    "endMs": 742,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " sandwich",
    "startMs": 742,
    "endMs": 1429,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " is",
    "startMs": 1429,
    "endMs": 1642,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " ready.",
    "startMs": 1642,
    "endMs": 2092,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "Your",
    "startMs": 2242,
    "endMs": 2567,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " phone",
    "startMs": 2567,
    "endMs": 2961,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " is",
    "startMs": 2961,
    "endMs": 3148,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " at",
    "startMs": 3148,
    "endMs": 3335,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " one",
    "startMs": 3335,
    "endMs": 3590,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " percent.",
    "startMs": 3590,
    "endMs": 4123,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "Of",
    "startMs": 4273,
    "endMs": 4533,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " course",
    "startMs": 4533,
    "endMs": 5179,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " it",
    "startMs": 5179,
    "endMs": 5439,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " is.",
    "startMs": 5439,
    "endMs": 5699,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "What",
    "startMs": 5849,
    "endMs": 6074,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " if",
    "startMs": 6074,
    "endMs": 6203,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " you",
    "startMs": 6203,
    "endMs": 6381,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " could",
    "startMs": 6381,
    "endMs": 6654,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " prepare",
    "startMs": 6654,
    "endMs": 7022,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " a",
    "startMs": 7022,
    "endMs": 7104,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " payment",
    "startMs": 7104,
    "endMs": 7473,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " permission",
    "startMs": 7473,
    "endMs": 7985,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " before",
    "startMs": 7985,
    "endMs": 8306,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " your",
    "startMs": 8306,
    "endMs": 8531,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " battery",
    "startMs": 8531,
    "endMs": 8900,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " gives",
    "startMs": 8900,
    "endMs": 9173,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " up?",
    "startMs": 9173,
    "endMs": 9350,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "Meet",
    "startMs": 10450,
    "endMs": 10855,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " Liber,",
    "startMs": 10855,
    "endMs": 11500,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " Ghost",
    "startMs": 11500,
    "endMs": 11991,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " Protocol.",
    "startMs": 11991,
    "endMs": 12739,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "A",
    "startMs": 12889,
    "endMs": 12991,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " prefunded",
    "startMs": 12991,
    "endMs": 13568,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " payment",
    "startMs": 13568,
    "endMs": 14027,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " permission",
    "startMs": 14027,
    "endMs": 14664,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " that",
    "startMs": 14664,
    "endMs": 14944,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " can",
    "startMs": 14944,
    "endMs": 15164,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " leave",
    "startMs": 15164,
    "endMs": 15504,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " your",
    "startMs": 15504,
    "endMs": 15784,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " phone,",
    "startMs": 15784,
    "endMs": 16230,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " and",
    "startMs": 16230,
    "endMs": 16451,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " travel",
    "startMs": 16451,
    "endMs": 16850,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " on",
    "startMs": 16850,
    "endMs": 17011,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " paper.",
    "startMs": 17011,
    "endMs": 17350,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "Choose",
    "startMs": 18450,
    "endMs": 18855,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " one",
    "startMs": 18855,
    "endMs": 19078,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " merchant,",
    "startMs": 19078,
    "endMs": 19713,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " one",
    "startMs": 19713,
    "endMs": 19936,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " amount,",
    "startMs": 19936,
    "endMs": 20450,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " and",
    "startMs": 20450,
    "endMs": 20673,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " an",
    "startMs": 20673,
    "endMs": 20836,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " expiry.",
    "startMs": 20836,
    "endMs": 21241,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "Sign",
    "startMs": 21391,
    "endMs": 21688,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " that",
    "startMs": 21688,
    "endMs": 21984,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " exact",
    "startMs": 21984,
    "endMs": 22344,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " permission,",
    "startMs": 22344,
    "endMs": 23133,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " then",
    "startMs": 23133,
    "endMs": 23429,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " reserve",
    "startMs": 23429,
    "endMs": 23915,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " the",
    "startMs": 23915,
    "endMs": 24149,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " tokens.",
    "startMs": 24149,
    "endMs": 24571,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "The",
    "startMs": 24721,
    "endMs": 24981,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " contract",
    "startMs": 24981,
    "endMs": 25590,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " enforces",
    "startMs": 25590,
    "endMs": 26200,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " the",
    "startMs": 26200,
    "endMs": 26459,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " limits.",
    "startMs": 26459,
    "endMs": 26928,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "The",
    "startMs": 27078,
    "endMs": 27322,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " paper",
    "startMs": 27322,
    "endMs": 27697,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " carries",
    "startMs": 27697,
    "endMs": 28204,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " the",
    "startMs": 28204,
    "endMs": 28448,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " authorization.",
    "startMs": 28448,
    "endMs": 29350,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "Here",
    "startMs": 30450,
    "endMs": 30804,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " is",
    "startMs": 30804,
    "endMs": 31007,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " the",
    "startMs": 31007,
    "endMs": 31285,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " live",
    "startMs": 31285,
    "endMs": 31639,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " workspace.",
    "startMs": 31639,
    "endMs": 32369,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "Review",
    "startMs": 32519,
    "endMs": 32972,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " the",
    "startMs": 32972,
    "endMs": 33222,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " recipient",
    "startMs": 33222,
    "endMs": 33877,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " and",
    "startMs": 33877,
    "endMs": 34127,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " expiry",
    "startMs": 34127,
    "endMs": 34580,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " before",
    "startMs": 34580,
    "endMs": 35033,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " signing.",
    "startMs": 35033,
    "endMs": 35553,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "Preparation",
    "startMs": 35703,
    "endMs": 36437,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " requires",
    "startMs": 36437,
    "endMs": 36983,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " your",
    "startMs": 36983,
    "endMs": 37278,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " wallet",
    "startMs": 37278,
    "endMs": 37699,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " and",
    "startMs": 37699,
    "endMs": 37931,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " an",
    "startMs": 37931,
    "endMs": 38100,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " internet",
    "startMs": 38100,
    "endMs": 38646,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " connection.",
    "startMs": 38646,
    "endMs": 39318,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "Only",
    "startMs": 39468,
    "endMs": 39747,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " after",
    "startMs": 39747,
    "endMs": 40085,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " the",
    "startMs": 40085,
    "endMs": 40305,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " reserve",
    "startMs": 40305,
    "endMs": 40762,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " is",
    "startMs": 40762,
    "endMs": 40922,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " confirmed",
    "startMs": 40922,
    "endMs": 41498,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " should",
    "startMs": 41498,
    "endMs": 41896,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " you",
    "startMs": 41896,
    "endMs": 42115,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " hand",
    "startMs": 42115,
    "endMs": 42394,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " over",
    "startMs": 42394,
    "endMs": 42673,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " the",
    "startMs": 42673,
    "endMs": 42893,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " voucher.",
    "startMs": 42893,
    "endMs": 43350,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "The",
    "startMs": 44450,
    "endMs": 44698,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " buyer",
    "startMs": 44698,
    "endMs": 45080,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " can",
    "startMs": 45080,
    "endMs": 45327,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " leave",
    "startMs": 45327,
    "endMs": 45709,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " the",
    "startMs": 45709,
    "endMs": 45957,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " device",
    "startMs": 45957,
    "endMs": 46406,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " behind.",
    "startMs": 46406,
    "endMs": 46854,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "The",
    "startMs": 47004,
    "endMs": 47227,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " merchant",
    "startMs": 47227,
    "endMs": 47750,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " scans",
    "startMs": 47750,
    "endMs": 48093,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " the",
    "startMs": 48093,
    "endMs": 48316,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " voucher",
    "startMs": 48316,
    "endMs": 48779,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " and",
    "startMs": 48779,
    "endMs": 49002,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " claims",
    "startMs": 49002,
    "endMs": 49405,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " with",
    "startMs": 49405,
    "endMs": 49688,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " the",
    "startMs": 49688,
    "endMs": 49911,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " named",
    "startMs": 49911,
    "endMs": 50254,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " wallet.",
    "startMs": 50254,
    "endMs": 50657,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "The",
    "startMs": 50807,
    "endMs": 51043,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " merchant",
    "startMs": 51043,
    "endMs": 51597,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " still",
    "startMs": 51597,
    "endMs": 51961,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " needs",
    "startMs": 51961,
    "endMs": 52324,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " internet",
    "startMs": 52324,
    "endMs": 52878,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " and",
    "startMs": 52878,
    "endMs": 53114,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " gas.",
    "startMs": 53114,
    "endMs": 53350,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "This",
    "startMs": 54450,
    "endMs": 54719,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " public",
    "startMs": 54719,
    "endMs": 55103,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " testnet",
    "startMs": 55103,
    "endMs": 55544,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " receipt",
    "startMs": 55544,
    "endMs": 55986,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " shows",
    "startMs": 55986,
    "endMs": 56312,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " five",
    "startMs": 56312,
    "endMs": 56581,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " mock",
    "startMs": 56581,
    "endMs": 56851,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " tokens",
    "startMs": 56851,
    "endMs": 57235,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " transferred",
    "startMs": 57235,
    "endMs": 57905,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " to",
    "startMs": 57905,
    "endMs": 58060,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " the",
    "startMs": 58060,
    "endMs": 58272,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " merchant.",
    "startMs": 58272,
    "endMs": 58770,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "You",
    "startMs": 58920,
    "endMs": 59134,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " can",
    "startMs": 59134,
    "endMs": 59348,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " inspect",
    "startMs": 59348,
    "endMs": 59793,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " the",
    "startMs": 59793,
    "endMs": 60008,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " reserve",
    "startMs": 60008,
    "endMs": 60453,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " and",
    "startMs": 60453,
    "endMs": 60667,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " redemption",
    "startMs": 60667,
    "endMs": 61286,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " transactions",
    "startMs": 61286,
    "endMs": 62020,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " yourself.",
    "startMs": 62020,
    "endMs": 62524,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "No",
    "startMs": 62674,
    "endMs": 62849,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " wallet",
    "startMs": 62849,
    "endMs": 63283,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " login",
    "startMs": 63283,
    "endMs": 63652,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " is",
    "startMs": 63652,
    "endMs": 63827,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " needed",
    "startMs": 63827,
    "endMs": 64261,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " to",
    "startMs": 64261,
    "endMs": 64436,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " view",
    "startMs": 64436,
    "endMs": 64741,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " the",
    "startMs": 64741,
    "endMs": 64981,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " proof.",
    "startMs": 64981,
    "endMs": 65350,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "A",
    "startMs": 66450,
    "endMs": 66563,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " screenshot",
    "startMs": 66563,
    "endMs": 67277,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " is",
    "startMs": 67277,
    "endMs": 67457,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " not",
    "startMs": 67457,
    "endMs": 67703,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " a",
    "startMs": 67703,
    "endMs": 67817,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " second",
    "startMs": 67817,
    "endMs": 68263,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " payment.",
    "startMs": 68263,
    "endMs": 68777,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "This",
    "startMs": 68927,
    "endMs": 69234,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " recorded",
    "startMs": 69234,
    "endMs": 69802,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " interface",
    "startMs": 69802,
    "endMs": 70436,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " rejected",
    "startMs": 70436,
    "endMs": 71005,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " the",
    "startMs": 71005,
    "endMs": 71246,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " same",
    "startMs": 71246,
    "endMs": 71553,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " voucher",
    "startMs": 71553,
    "endMs": 72057,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " after",
    "startMs": 72057,
    "endMs": 72429,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " redemption.",
    "startMs": 72429,
    "endMs": 73128,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "The",
    "startMs": 73278,
    "endMs": 73504,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " contract",
    "startMs": 73504,
    "endMs": 74035,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " also",
    "startMs": 74035,
    "endMs": 74322,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " rejects",
    "startMs": 74322,
    "endMs": 74792,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " replay",
    "startMs": 74792,
    "endMs": 75201,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " and",
    "startMs": 75201,
    "endMs": 75427,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " claims",
    "startMs": 75427,
    "endMs": 75836,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " from",
    "startMs": 75836,
    "endMs": 76123,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " a",
    "startMs": 76123,
    "endMs": 76227,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " different",
    "startMs": 76227,
    "endMs": 76819,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " merchant.",
    "startMs": 76819,
    "endMs": 77350,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "If",
    "startMs": 78450,
    "endMs": 78621,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " the",
    "startMs": 78621,
    "endMs": 78856,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " permission",
    "startMs": 78856,
    "endMs": 79534,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " expires",
    "startMs": 79534,
    "endMs": 80022,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " unused,",
    "startMs": 80022,
    "endMs": 80560,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " the",
    "startMs": 80560,
    "endMs": 80795,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " owner",
    "startMs": 80795,
    "endMs": 81156,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " can",
    "startMs": 81156,
    "endMs": 81390,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " reclaim",
    "startMs": 81390,
    "endMs": 81878,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " the",
    "startMs": 81878,
    "endMs": 82113,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " funds.",
    "startMs": 82113,
    "endMs": 82474,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "This",
    "startMs": 82624,
    "endMs": 82948,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " separate",
    "startMs": 82948,
    "endMs": 83548,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " test",
    "startMs": 83548,
    "endMs": 83873,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " returned",
    "startMs": 83873,
    "endMs": 84473,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " two",
    "startMs": 84473,
    "endMs": 84728,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " mock",
    "startMs": 84728,
    "endMs": 85052,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " tokens.",
    "startMs": 85052,
    "endMs": 85514,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "Recovery",
    "startMs": 85664,
    "endMs": 86331,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " requires",
    "startMs": 86331,
    "endMs": 86998,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " an",
    "startMs": 86998,
    "endMs": 87204,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " owner",
    "startMs": 87204,
    "endMs": 87641,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " transaction",
    "startMs": 87641,
    "endMs": 88538,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " after",
    "startMs": 88538,
    "endMs": 88975,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " expiry.",
    "startMs": 88975,
    "endMs": 89488,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "It",
    "startMs": 89638,
    "endMs": 89884,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " is",
    "startMs": 89884,
    "endMs": 90130,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " not",
    "startMs": 90130,
    "endMs": 90467,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " automatic.",
    "startMs": 90467,
    "endMs": 91350,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "Ghost",
    "startMs": 92450,
    "endMs": 92871,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " runs",
    "startMs": 92871,
    "endMs": 93218,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " on",
    "startMs": 93218,
    "endMs": 93418,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " BNB",
    "startMs": 93418,
    "endMs": 93691,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " Smart",
    "startMs": 93691,
    "endMs": 94112,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " Chain",
    "startMs": 94112,
    "endMs": 94533,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " Testnet.",
    "startMs": 94533,
    "endMs": 95102,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "Mock",
    "startMs": 95252,
    "endMs": 95574,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " tokens",
    "startMs": 95574,
    "endMs": 96034,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " have",
    "startMs": 96034,
    "endMs": 96356,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " no",
    "startMs": 96356,
    "endMs": 96542,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " cash",
    "startMs": 96542,
    "endMs": 96864,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " value.",
    "startMs": 96864,
    "endMs": 97255,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "Physical",
    "startMs": 97405,
    "endMs": 97916,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " phone",
    "startMs": 97916,
    "endMs": 98250,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " off",
    "startMs": 98250,
    "endMs": 98467,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " testing",
    "startMs": 98467,
    "endMs": 98918,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " remains",
    "startMs": 98918,
    "endMs": 99370,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " pending.",
    "startMs": 99370,
    "endMs": 99821,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "This",
    "startMs": 99971,
    "endMs": 100245,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " release",
    "startMs": 100245,
    "endMs": 100694,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " does",
    "startMs": 100694,
    "endMs": 100968,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " not",
    "startMs": 100968,
    "endMs": 101183,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " settle",
    "startMs": 101183,
    "endMs": 101573,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " rupiah",
    "startMs": 101573,
    "endMs": 101964,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " or",
    "startMs": 101964,
    "endMs": 102121,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " verify",
    "startMs": 102121,
    "endMs": 102511,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " goods",
    "startMs": 102511,
    "endMs": 102843,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " delivery.",
    "startMs": 102843,
    "endMs": 103350,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "The",
    "startMs": 104450,
    "endMs": 104687,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " next",
    "startMs": 104687,
    "endMs": 104988,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " step",
    "startMs": 104988,
    "endMs": 105288,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " is",
    "startMs": 105288,
    "endMs": 105461,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " a",
    "startMs": 105461,
    "endMs": 105570,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " small,",
    "startMs": 105570,
    "endMs": 106050,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " prearranged",
    "startMs": 106050,
    "endMs": 106799,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " merchant",
    "startMs": 106799,
    "endMs": 107355,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " pilot,",
    "startMs": 107355,
    "endMs": 107835,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " followed",
    "startMs": 107835,
    "endMs": 108392,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " by",
    "startMs": 108392,
    "endMs": 108565,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " security",
    "startMs": 108565,
    "endMs": 109122,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " review.",
    "startMs": 109122,
    "endMs": 109550,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "Explore",
    "startMs": 109700,
    "endMs": 110240,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " the",
    "startMs": 110240,
    "endMs": 110499,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " live",
    "startMs": 110499,
    "endMs": 110828,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " workspace",
    "startMs": 110828,
    "endMs": 111507,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " and",
    "startMs": 111507,
    "endMs": 111766,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " public",
    "startMs": 111766,
    "endMs": 112235,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " evidence.",
    "startMs": 112235,
    "endMs": 112845,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "Liber,",
    "startMs": 112995,
    "endMs": 113689,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " Ghost",
    "startMs": 113689,
    "endMs": 114216,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " Protocol.",
    "startMs": 114216,
    "endMs": 115021,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "Your",
    "startMs": 115171,
    "endMs": 115533,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " battery",
    "startMs": 115533,
    "endMs": 116126,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " gets",
    "startMs": 116126,
    "endMs": 116488,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " a",
    "startMs": 116488,
    "endMs": 116618,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " break.",
    "startMs": 116618,
    "endMs": 117057,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "Your",
    "startMs": 117207,
    "endMs": 117527,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " permission",
    "startMs": 117527,
    "endMs": 118255,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " keeps",
    "startMs": 118255,
    "endMs": 118643,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " its",
    "startMs": 118643,
    "endMs": 118894,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": false
  },
  {
    "text": " limits.",
    "startMs": 118894,
    "endMs": 119350,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]}/>;};

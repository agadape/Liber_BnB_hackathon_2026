import {Composition} from 'remotion';
import {Film,Poster} from './Film';
export const Root=()=> <><Composition id="Ghost" component={Film} durationInFrames={3600} fps={30} width={1920} height={1080}/><Composition id="GhostPoster" component={Poster} durationInFrames={1} fps={30} width={1920} height={1080}/></>;

// A server-owned raster layout reference. No user pixels, text, credentials or file I/O.
// Native PNG encoder keeps runtime dependency-free; the silhouette is a guide, never a subject.
import {deflateSync} from 'node:zlib';
const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes)crc=crcTable[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
function chunk(type,bytes){const name=Buffer.from(type);const length=Buffer.alloc(4);length.writeUInt32BE(bytes.length);const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([name,bytes])));return Buffer.concat([length,name,bytes,crc]);}
export function travelLayoutSpec(scene,framing) {
  if(!['balanced','scenic'].includes(framing))throw Error('Unknown layout');
  const anchor=scene.subjectPlacement || {centerX:0.3,balancedGroundY:0.92,scenicGroundY:0.84};
  const height=framing==='scenic'?0.33:0.47;
  return {centerX:anchor.centerX,groundY:framing==='scenic'?anchor.scenicGroundY:anchor.balancedGroundY,height};
}
export function buildTravelLayout(scene,framing) {
  const {centerX,groundY,height}=travelLayoutSpec(scene,framing);
  const width=512,rows=Buffer.alloc((width*3+1)*width);
  const top=groundY-height;
  const ellipse=(x,y,cx,cy,rx,ry)=>((x-cx)/rx)**2+((y-cy)/ry)**2<=1;
  for(let py=0;py<width;py++)for(let px=0;px<width;px++) {
    const x=px/width,y=py/width,dy=(y-top)/height;
    const head=ellipse(x,y,centerX,top+height*0.09,height*0.07,height*0.09);
    const torso=dy>=0.2&&dy<=0.57&&Math.abs(x-centerX)<height*0.1;
    const arm=dy>=0.24&&dy<=0.58&&Math.abs(x-centerX)<height*0.145;
    const leg=dy>=0.57&&dy<=0.97&&Math.abs(x-centerX)<height*0.09&&Math.abs(x-centerX)>height*0.014;
    const shoes=dy>=0.97&&dy<=1&&Math.abs(x-centerX)<height*0.11;
    const figure=head||torso||arm||leg||shoes;
    const shade=ellipse(x,y,centerX,groundY+height*0.005,height*0.14,height*0.018);
    const rgb=figure?[50,113,128]:shade?[185,199,201]:[242,242,237];
    const at=py*(width*3+1)+1+px*3;rows[at]=rgb[0];rows[at+1]=rgb[1];rows[at+2]=rgb[2];
  }
  const header=Buffer.alloc(13);header.writeUInt32BE(width,0);header.writeUInt32BE(width,4);header[8]=8;header[9]=2;
  const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
  return 'data:image/png;base64,'+png.toString('base64');
}

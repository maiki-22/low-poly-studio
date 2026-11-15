import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const data=JSON.parse(fs.readFileSync(path.join(dir,'fire-source.json'),'utf8'));
const doc={asset:{version:'2.0',generator:'Araucania · indicador de incendio v01'},scene:0,scenes:[{name:data.name,nodes:[0]}],nodes:[{name:'Indicador de incendio',children:[],extras:{kind:'indicador_incendio',animation:data.animation}}],meshes:[],materials:[{name:'Llama · colores planos luminosos',pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],metallicFactor:0,roughnessFactor:1},doubleSided:true,extensions:{KHR_materials_unlit:{}}}],animations:[{name:data.animation,samplers:[],channels:[],extras:{loop:true,durationSeconds:data.duration}}],bufferViews:[],accessors:[],extensionsUsed:['KHR_materials_unlit'],extensionsRequired:['KHR_materials_unlit']};
const chunks=[];let offset=0;
function view(bytes,options={}){const pad=(4-offset%4)%4;if(pad){chunks.push(Buffer.alloc(pad));offset+=pad;}const i=doc.bufferViews.length;doc.bufferViews.push({buffer:0,byteOffset:offset,byteLength:bytes.length,...options});chunks.push(bytes);offset+=bytes.length;return i;}
function accessor(a){const i=doc.accessors.length;doc.accessors.push(a);return i;}
function floatAccessor(values,type){const b=Buffer.alloc(values.length*4);values.forEach((n,i)=>b.writeFloatLE(n,i*4));const dims={SCALAR:1,VEC3:3,VEC4:4}[type];const a={bufferView:view(b),componentType:5126,count:values.length/dims,type};if(type==='SCALAR'){a.min=[Math.min(...values)];a.max=[Math.max(...values)];}return accessor(a);}
const linear=n=>{const c=n/255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4);};
const stats=[];
for(const a of data.parts){
  const vertices=[],indices=[],lookup=new Map(),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(const f of a.faces){const color=[...data.palette[f.c].map(n=>Math.round(linear(n)*255)),255];for(const vi of f.v){const p=a.vertices[vi],key=p.map(n=>n.toFixed(6)).join(',')+':'+color.join(',');if(!lookup.has(key)){lookup.set(key,vertices.length);vertices.push({p,color});}indices.push(lookup.get(key));}}
  const vb=Buffer.alloc(vertices.length*16);vertices.forEach(({p,color},i)=>{p.forEach((n,k)=>{vb.writeFloatLE(n,i*16+k*4);min[k]=Math.min(min[k],n);max[k]=Math.max(max[k],n);});color.forEach((n,k)=>vb.writeUInt8(n,i*16+12+k));});
  const vi=view(vb,{target:34962,byteStride:16});
  const pos=accessor({bufferView:vi,componentType:5126,count:vertices.length,type:'VEC3',min,max});
  const color=accessor({bufferView:vi,byteOffset:12,componentType:5121,normalized:true,count:vertices.length,type:'VEC4'});
  const ib=Buffer.alloc(indices.length*2);indices.forEach((n,i)=>ib.writeUInt16LE(n,i*2));
  const index=accessor({bufferView:view(ib,{target:34963}),componentType:5123,count:indices.length,type:'SCALAR',min:[Math.min(...indices)],max:[Math.max(...indices)]});
  const mesh=doc.meshes.length;doc.meshes.push({name:a.name,primitives:[{attributes:{POSITION:pos,COLOR_0:color},indices:index,material:0,mode:4}]});
  const node=doc.nodes.length;doc.nodes.push({name:a.id,mesh,translation:a.position,extras:{kind:'llama',part:a.id}});doc.nodes[0].children.push(node);
  for(const track of a.tracks){
    const values=track.path==='rotation'?track.values.map(v=>{const z=v[2]*Math.PI/360;return [0,0,Math.sin(z),Math.cos(z)];}):track.values;
    const sampler=doc.animations[0].samplers.length;
    doc.animations[0].samplers.push({input:floatAccessor(track.times,'SCALAR'),output:floatAccessor(values.flat(),track.path==='rotation'?'VEC4':'VEC3'),interpolation:'LINEAR'});
    doc.animations[0].channels.push({sampler,target:{node,path:track.path}});
    if(JSON.stringify(values[0])!==JSON.stringify(values.at(-1)))throw new Error('Animation loop seam '+a.id+' '+track.path);
  }
  stats.push({part:a.id,vertices:vertices.length,triangles:indices.length/3});
}
const bin=Buffer.concat([...chunks,Buffer.alloc((4-offset%4)%4)]);doc.buffers=[{byteLength:bin.length}];
const j=Buffer.from(JSON.stringify(doc)),json=Buffer.concat([j,Buffer.alloc((4-j.length%4)%4,32)]),h=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);
h.write('glTF');h.writeUInt32LE(2,4);h.writeUInt32LE(12+8+json.length+8+bin.length,8);jh.writeUInt32LE(json.length);jh.write('JSON',4);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);
const glb=Buffer.concat([h,jh,json,bh,bin]),file=path.join(dir,'Indicador_Incendio_Animado_v01.glb');
fs.writeFileSync(file,glb);fs.writeFileSync(file+'.br',zlib.brotliCompressSync(glb,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:11}}));fs.writeFileSync(file+'.gz',zlib.gzipSync(glb,{level:9}));
const report={bytes:glb.length,brotliBytes:fs.statSync(file+'.br').size,gzipBytes:fs.statSync(file+'.gz').size,triangles:stats.reduce((s,a)=>s+a.triangles,0),vertices:stats.reduce((s,a)=>s+a.vertices,0),meshes:doc.meshes.length,materials:doc.materials.length,textures:0,animation:data.animation,duration:data.duration,channels:doc.animations[0].channels.length,loopSeamsMatch:true,parts:stats};
fs.writeFileSync(path.join(dir,'metricas.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));

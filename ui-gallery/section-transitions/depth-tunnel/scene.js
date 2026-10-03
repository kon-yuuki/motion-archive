import * as T from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import decoderWasm from 'three/examples/jsm/libs/draco/gltf/draco_decoder.wasm?url';
import decoderWrapper from 'three/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js?url';
import astronautUrl from './assets/emu.glb?url';
import { createIllustrationTexture, createStickerTexture, createSuitWeave } from './art.js';

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=T.MathUtils.lerp;
const smooth=(a,b,p)=>{const t=clamp((p-a)/(b-a));return t*t*(3-2*t);};
const sample=(p,keys)=>{let i=1;while(i<keys.length-1&&p>keys[i][0])i++;const[a,av]=keys[i-1],[b,bv]=keys[i];return mix(av,bv,smooth(a,b,p));};
function random(seed=42){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}

/** Source-traced stage boundaries; p is local scroll, never video seconds. */
export const landmarks=[0,.10,.16,.21,.30,.43,.48,.56,.65,.735,.79,.835,.9,1];
export const sceneAt=p=>p<.235?'宇宙飛行士と巨大文字':p<.44?'暗い反射の部屋':p<.515?'緑の結晶の部屋':p<.635?'マゼンタの結晶トンネル':p<.762?'青いイラストの部屋':p<.882?'画面を抜ける':'コンタクト';

/** Demand-driven WebGL renderer. No idle animation, global scroll or pointer capture. */
export function createDepthScene(canvas,{onReady,onError}={}) {
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.info.autoReset=false;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1));renderer.setClearColor(0x000000);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
  const world=new T.Scene();world.background=new T.Color(0x000000);world.fog=new T.FogExp2(0x000000,.007);
  const camera=new T.PerspectiveCamera(58,4/3,.08,400);
  const composer=new EffectComposer(renderer);const renderPass=new RenderPass(world,camera);composer.addPass(renderPass);
  const bloom=new UnrealBloomPass(new T.Vector2(640,480),.28,.4,.9);composer.addPass(bloom);composer.addPass(new OutputPass());
  const resources=new Set(),materials=new Set();const remember=x=>(resources.add(x),x);
  const mat=(type,options)=>{const m=new type(options);materials.add(m);return m;};
  const pmrem=new T.PMREMGenerator(renderer);
  // Original high-dynamic-range strip environment gives genuinely view-dependent facets.
  const envScene=new T.Scene();envScene.background=new T.Color(.015,.018,.026);
  const rand=random(804);const bright=mat(T.MeshBasicMaterial,{color:new T.Color(2.8,2.8,2.8),side:T.DoubleSide});
  const envPanels=[];for(let i=0;i<140;i++){const panel=new T.Mesh(remember(new T.PlaneGeometry(.07+rand()*.65,.12+rand()*1.9)),bright);envPanels.push(panel);const a=rand()*Math.PI*2,y=(rand()-.5)*14;panel.position.set(Math.cos(a)*8,y,Math.sin(a)*8);panel.lookAt(0,0,0);envScene.add(panel);}
  const environment=pmrem.fromScene(envScene,.005,.1,100);resources.add(environment);
  const envPalette=(colors)=>{const palette=colors.map(color=>mat(T.MeshBasicMaterial,{color:new T.Color(color).multiplyScalar(5),side:T.DoubleSide}));envPanels.forEach((o,i)=>o.material=palette[i%palette.length]);const env=pmrem.fromScene(envScene,.005,.1,100);resources.add(env);return env;};
  const greenEnvironment=envPalette([0xa6fff2,0x12f17d,0xe7ff21,0xffffff]);
  const pinkEnvironment=envPalette([0xffa8df,0xff2969,0x7ceaff,0xffffff]);
  world.environment=environment.texture;world.environmentIntensity=.65;
  const whiteLight=new T.HemisphereLight(0xb6d7ff,0x05080d,.8);world.add(whiteLight);
  const key=new T.DirectionalLight(0xd1e7ff,3);key.position.set(-3,5,5);world.add(key);
  const fill=new T.PointLight(0x94abff,18,26,2);world.add(fill);
  const tint=new T.PointLight(0x43ffb6,30,34,2);world.add(tint);
  const darkMetal=mat(T.MeshStandardMaterial,{color:0x525963,metalness:1,roughness:.14,envMapIntensity:.14});
  const crystalMat=mat(T.MeshPhysicalMaterial,{color:0xb5c7d0,metalness:.94,roughness:.075,clearcoat:1,envMapIntensity:1.15});
  const glowingMat=mat(T.MeshStandardMaterial,{color:0xffffff,emissive:0xaaffeb,emissiveIntensity:2.7,roughness:.12,metalness:.6});
  const blackMat=mat(T.MeshStandardMaterial,{color:0x060809,metalness:.92,roughness:.11,envMapIntensity:.35});
  const unitBox=remember(new T.BoxGeometry(1,1,1));const unitCrystal=remember(new T.OctahedronGeometry(1,0));
  const shaft=new T.Group();world.add(shaft);const mirrors=[];
  const box=(parent,material,x,y,z,sx,sy,sz)=>{const o=new T.Mesh(unitBox,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o;};
  // Real rectangular rooms: 4 longitudinal corner columns, walls, cross struts and inset panels.
  const metalInstances=[];const glowingInstances=[];const crystalInstances=[];const wallInstances=[];
  const transform=(position,scale,rotation=new T.Euler())=>new T.Matrix4().compose(new T.Vector3(...position),new T.Quaternion().setFromEuler(rotation),new T.Vector3(...scale));
  for(let k=0;k<32;k++){
    const z=-18-k*3.5,r=4.2;
    for(const x of[-r,r])for(const y of[-r,r]){
      metalInstances.push(transform([x,y,z],[.11,.11,3.6]));
      for(let j=0;j<6;j++){
        const px=x+(rand()-.5)*.8,py=y+(rand()-.5)*.8,pz=z+(rand()-.5)*3;
        crystalInstances.push(transform([px,py,pz],[.16+rand()*.44,.12+rand()*.36,.15+rand()*.55],new T.Euler(rand()*3,rand()*3,rand()*3)));
        if(j%3===0)glowingInstances.push(transform([px,py,pz],[.03+rand()*.1,.025+rand()*.08,.10+rand()*.3],new T.Euler(rand()*3,rand()*3,rand()*3)));
      }
    }
    for(const side of[-1,1]){
      metalInstances.push(transform([0,side*r,z],[r*2,.045,.07]));metalInstances.push(transform([side*r,0,z],[.045,r*2,.07]));
      for(const offset of[-2.1,0,2.1]){
        metalInstances.push(transform([side*r,offset,z],[.07,.065,3.5]));metalInstances.push(transform([offset,side*r,z],[.065,.07,3.5]));
      }
      wallInstances.push(transform([side*4.32,0,z],[.045,8.4,3.47]));wallInstances.push(transform([0,side*4.32,z],[8.4,.045,3.47]));
    }
  }
  const instances=(parent,geometry,material,matrices)=>{const inst=new T.InstancedMesh(geometry,material,matrices.length);matrices.forEach((matrix,i)=>inst.setMatrixAt(i,matrix));inst.instanceMatrix.needsUpdate=true;parent.add(inst);return inst;};
  // Identical opaque panels share one draw per pass; geometry and transforms are unchanged.
  instances(shaft,unitBox,blackMat,wallInstances);
  instances(shaft,unitBox,darkMetal,metalInstances);instances(shaft,unitCrystal,crystalMat,crystalInstances);instances(shaft,unitBox,glowingMat,glowingInstances);
  // One bounce on all four planes; suppress the other planes while each capture runs.
  // This avoids recursive reflector renders while reflecting actual geometry and the actor.
  for(let i=0;i<4;i++){
    const reflection=new Reflector(remember(new T.PlaneGeometry(8.5,128)),{textureWidth:512,textureHeight:512,color:0x24282a,clipBias:.003});
    reflection.position.set(i<2?0:(i===2?-4.26:4.26),i<2?(i===0?-4.26:4.26):0,-73);
    if(i<2)reflection.rotation.x=i===0?-Math.PI/2:Math.PI/2;
    else reflection.rotation.set(Math.PI/2,i===2?Math.PI/2:-Math.PI/2,0);
    const before=reflection.onBeforeRender;reflection.onBeforeRender=function(...args){const visible=mirrors.map(m=>m.visible);mirrors.forEach(m=>{if(m!==this)m.visible=false;});before.apply(this,args);mirrors.forEach((m,j)=>m.visible=visible[j]);};
    resources.add(reflection.getRenderTarget());materials.add(reflection.material);mirrors.push(reflection);shaft.add(reflection);
  }
  // Continuous triangulated crystal cylinder. Joints have thickness; they are not CSS line rings.
  const crystalTube=new T.Group();world.add(crystalTube);const tubeBeams=[],tubeShards=[],tubeGlows=[];
  const count=12,rings=72;const points=[];
  for(let k=0;k<rings;k++){
    const angle=k*.1;const ring=[];
    for(let j=0;j<count;j++){const a=j/count*Math.PI*2+angle,r=4.5+(rand()-.5)*.9;ring.push(new T.Vector3(Math.cos(a)*r,Math.sin(a)*r,-95-k*2.7));}points.push(ring);
  }
  const beam=(a,b,r)=>{const delta=new T.Vector3().subVectors(b,a);tubeBeams.push(new T.Matrix4().compose(a.clone().add(b).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize()),new T.Vector3(r,delta.length(),r)));};
  for(let k=0;k<rings;k++)for(let j=0;j<count;j++){
    const a=points[k][j];beam(a,points[k][(j+1)%count],.065+rand()*.025);
    if(k<rings-1){beam(a,points[k+1][j],.055);if((k+j)%2===0)beam(a,points[k+1][(j+1)%count],.038);}
    for(let i=0;i<3;i++){const p=a.clone().add(new T.Vector3((rand()-.5)*.6,(rand()-.5)*.6,(rand()-.5)*1.3));tubeShards.push(transform(p.toArray(),[.13+rand()*.35,.2+rand()*.6,.14+rand()*.35],new T.Euler(rand()*6,rand()*6,rand()*6)));}
    if(j%2===0)tubeGlows.push(transform(a.toArray(),[.065,.08,.12+rand()*.15],new T.Euler(rand()*3,rand()*3,rand()*3)));
  }
  instances(crystalTube,unitBox,crystalMat,tubeBeams);instances(crystalTube,unitCrystal,crystalMat,tubeShards);instances(crystalTube,unitBox,glowingMat,tubeGlows);

  const blueWorld=new T.Scene();blueWorld.background=new T.Color(0x090986);blueWorld.fog=new T.FogExp2(0x131389,.009);blueWorld.environment=world.environment;blueWorld.environmentIntensity=.08;
  const blueCamera=new T.PerspectiveCamera(58,4/3,.08,250);
  const illustration=remember(createIllustrationTexture());illustration.repeat.set(1,11);
  const blueMat=mat(T.MeshBasicMaterial,{map:illustration,color:0xaaaac8,side:T.DoubleSide,toneMapped:false});
  const plane=remember(new T.PlaneGeometry(9,140));
  for(let i=0;i<4;i++){const wall=new T.Mesh(plane,blueMat);if(i<2){wall.rotation.x=Math.PI/2;wall.position.set(0,i===0?-4.5:4.5,-65);}else{wall.rotation.set(Math.PI/2,Math.PI/2,0);wall.position.set(i===2?-4.5:4.5,0,-65);}blueWorld.add(wall);}
  blueWorld.add(new T.HemisphereLight(0xbbbaff,0x7777cc,1.9));
  const rocketShape=new T.Shape();rocketShape.moveTo(-.38,-1);rocketShape.lineTo(-.38,.5);rocketShape.quadraticCurveTo(-.38,1,.0,1.4);rocketShape.quadraticCurveTo(.38,1,.38,.5);rocketShape.lineTo(.38,-.2);rocketShape.lineTo(.8,-.35);rocketShape.lineTo(.8,-.95);rocketShape.lineTo(.25,-.8);rocketShape.lineTo(.25,-1);rocketShape.closePath();
  const rocketGeometry=remember(new T.ExtrudeGeometry(rocketShape,{depth:.15,bevelEnabled:false}));const rocketMat=mat(T.MeshStandardMaterial,{color:0xffffff,emissive:0xffffff,emissiveIntensity:2.1,roughness:.6});
  for(let k=0;k<14;k++)for(const side of[-1,1]){const rocket=new T.Mesh(rocketGeometry,rocketMat);rocket.position.set(side*4.3,-.3,-k*10);rocket.rotation.y=side*-Math.PI/2;blueWorld.add(rocket);const l=new T.PointLight(0x1c28ff,16,11,2);l.position.set(side*3.7,.4,-k*10);blueWorld.add(l);}
  const blueKey=new T.DirectionalLight(0xdbe4ff,3);blueKey.position.set(-3,3,5);blueWorld.add(blueKey);
  const screenTarget=remember(new T.WebGLRenderTarget(800,600));
  const contactWorld=new T.Scene();contactWorld.background=new T.Color(0x000000);contactWorld.environment=world.environment;contactWorld.environmentIntensity=.15;contactWorld.add(new T.HemisphereLight(0xcee7ff,0x161628,.9));const contactKey=new T.DirectionalLight(0xcadfff,3);contactKey.position.set(-3,4,5);contactWorld.add(contactKey);
  const contactCamera=new T.PerspectiveCamera(48,4/3,.08,100);contactCamera.position.set(0,0,9);
  const monitor=new T.Group();contactWorld.add(monitor);
  const monitorBody=mat(T.MeshStandardMaterial,{color:0x08080b,metalness:.65,roughness:.22});
  box(monitor,monitorBody,0,0,-.2,9.1,5.35,.22);box(monitor,mat(T.MeshStandardMaterial,{color:0x858597,metalness:.8,roughness:.35}),0,-3.12,-.45,2.1,1.5,.14);
  const screenMaterial=mat(T.MeshBasicMaterial,{map:screenTarget.texture,toneMapped:false});const screen=new T.Mesh(remember(new T.PlaneGeometry(8.72,4.99)),screenMaterial);screen.position.z=-.07;monitor.add(screen);
  const debris=new T.Group();contactWorld.add(debris);const debrisPieces=[];const glass=mat(T.MeshPhysicalMaterial,{color:0x7d98ef,metalness:.7,roughness:.07,clearcoat:1,transparent:true,opacity:.75,iridescence:1,side:T.DoubleSide});
  for(let i=0;i<92;i++){const geo=remember(new T.BufferGeometry());geo.setAttribute('position',new T.Float32BufferAttribute([0,0,0,.1+rand()*.6,.2+rand()*.4,0,-.3-rand()*.4,.1+rand()*.25,0],3));geo.computeVertexNormals();const o=new T.Mesh(geo,glass);const a=rand()*Math.PI*2,r=1+rand()*4;o.userData={a,r,z:rand()*4,spin:rand()*6};debris.add(o);debrisPieces.push(o);}
  const stickerGroup=new T.Group();contactWorld.add(stickerGroup);const stickerObjects=[];
  const kinds=['heart','smile','eyes','mushroom','star','planet'];const colors=['#ff183b','#ffe024','#2af07b','#ee29cc','#ffbe00','#4b36ff'];
  for(let i=0;i<28;i++){const tex=remember(createStickerTexture(kinds[i%6],colors[i%6]));const o=new T.Mesh(remember(new T.PlaneGeometry(1,1)),mat(T.MeshBasicMaterial,{map:tex,transparent:true,side:T.DoubleSide,depthWrite:false}));const a=i*2.39996,r=2.5+(i%5)*.52;o.userData={a,r,spin:(rand()-.5)*1.3,z:(rand()-.5)*4,size:.45+rand()*.5};stickerGroup.add(o);stickerObjects.push(o);}

  const astronaut=new T.Group();world.add(astronaut);let blueAstronaut,contactAstronaut;const actorMeshes=[];
  const suitWeave=remember(createSuitWeave());const actorUniform={value:0};let disposed=false,ready=false,lastProgress=0;let width=0,height=0,renderCount=0,lastRenderedProgress=NaN,duplicateSkips=0,totalDrawCalls=0;
  const loadingManager=new T.LoadingManager();loadingManager.setURLModifier(url=>url.endsWith('draco_wasm_wrapper.js')?decoderWrapper:url.endsWith('draco_decoder.wasm')?decoderWasm:url);
  const draco=new DRACOLoader(loadingManager);draco.setDecoderPath('');draco.setWorkerLimit(1);
  // NASA's source is an unrigged EMU. Keep that gap explicit: simple authored bends are not the source performance.
  new GLTFLoader(loadingManager).setDRACOLoader(draco).load(astronautUrl,gltf=>{
    if(disposed){disposeObject(gltf.scene);return;}
    gltf.scene.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(gltf.scene);const size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
    const normalizer=new T.Matrix4().makeScale(3.15/size.y,3.15/size.y,3.15/size.y).multiply(new T.Matrix4().makeTranslation(-center.x,-center.y,-center.z));
    const rotate=new T.Matrix4().makeRotationY(Math.PI);normalizer.premultiply(rotate);
    const batches=new Map();let sourceMeshes=0,sourceTriangles=0;
    gltf.scene.traverse(o=>{if(!o.isMesh)return;const name=o.material.name;
      if(/jetpack|initialShadingGroup/.test(name))return;
      const geo=o.geometry.clone();geo.applyMatrix4(o.matrixWorld);geo.applyMatrix4(normalizer);
      sourceMeshes++;sourceTriangles+=(geo.index?.count??geo.attributes.position.count)/3;
      const visor=/blinn[13]SG/.test(name),dark=/blinn2SG|lambert5SG/.test(name);
      const bucket=visor?'visor':dark?'dark':'suit';
      if(batches.has(bucket)){batches.get(bucket).geometries.push(geo);return;}
      const material=mat(T.MeshStandardMaterial,{color:visor?0x000000:dark?0x24303a:0x8694a8,metalness:visor?.82:.15,roughness:visor?.075:.56,envMapIntensity:visor?.13:.07,bumpMap:visor?null:suitWeave,bumpScale:.0018});
      // The source GLB has colored mission patches; maps are intentionally not reused.
      material.onBeforeCompile=shader=>{shader.uniforms.uPose=actorUniform;shader.vertexShader='uniform float uPose;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        float arm = smoothstep(.42, .72, abs(position.x)) * smoothstep(-.35,.18,position.y) * (1.-smoothstep(.85,1.25,position.y));
        float a = uPose * arm * sign(position.x); vec3 pivot = vec3(sign(position.x)*.48,.54,0.);
        vec3 v = transformed-pivot; transformed = pivot + vec3(cos(a)*v.x-sin(a)*v.y,sin(a)*v.x+cos(a)*v.y,v.z);
        float leg = (1.-smoothstep(-.85,-.25,position.y)); transformed.z += leg * sin(uPose*1.5) * (position.x>0.? .35:-.1);
      `);};material.customProgramCacheKey=()=> 'depth-emu-pose-v1';
      batches.set(bucket,{material,geometries:[geo]});
    });
    // Every retained primitive is static, has position/normal/uv, and is already
    // in the same normalized frame. Merging preserves triangles, UVs and pose shader.
    let mergedTriangles=0;
    for(const {material,geometries} of batches.values()){
      const merged=mergeGeometries(geometries,false);
      const finalGeometries=merged?[merged]:geometries;
      if(merged)geometries.forEach(geo=>geo.dispose());
      for(const geo of finalGeometries){
        remember(geo);mergedTriangles+=(geo.index?.count??geo.attributes.position.count)/3;
        const mesh=new T.Mesh(geo,material);astronaut.add(mesh);actorMeshes.push(mesh);
      }
    }
    canvas.dataset.actorSourceMeshes=String(sourceMeshes);canvas.dataset.actorBatches=String(actorMeshes.length);
    canvas.dataset.actorTrianglesBefore=String(sourceTriangles);canvas.dataset.actorTrianglesAfter=String(mergedTriangles);
    canvas.dataset.wallSourceMeshes=String(wallInstances.length);canvas.dataset.wallBatches='1';
    disposeObject(gltf.scene);blueAstronaut=astronaut.clone();blueWorld.add(blueAstronaut);contactAstronaut=astronaut.clone();contactWorld.add(contactAstronaut);ready=true;draco.dispose();onReady?.();render(lastProgress,true);
  },undefined,error=>{if(!disposed)onError?.(error);draco.dispose();});

  function disposeObject(object){object.traverse(o=>{o.geometry?.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{if(!m)return;Object.values(m).forEach(v=>v?.isTexture&&v.dispose());m.dispose();});});}
  function resize(w,h){if(disposed||!w||!h)return;const changed=w!==width||h!==height;width=w;height=h;camera.aspect=blueCamera.aspect=contactCamera.aspect=w/h;camera.updateProjectionMatrix();blueCamera.updateProjectionMatrix();contactCamera.updateProjectionMatrix();if(changed){renderer.setSize(w,h,false);composer.setSize(w,h);screenTarget.setSize(Math.min(800,w),Math.min(600,h));}render(lastProgress,true);}
  function render(p,force=false){
    if(disposed)return;lastProgress=p;
    // A programmatic seek emits scroll later. Do not render that identical state twice.
    // Resize, model readiness and WebGL restoration explicitly force a fresh render.
    if(!force&&p===lastRenderedProgress){canvas.dataset.duplicateSkips=String(++duplicateSkips);return;}
    const submittedAt=performance.now();renderer.info.reset();
    const z=sample(p,[[0,7],[.21,7],[.25,-3],[.435,-68],[.515,-111],[.635,-196],[.76,-215],[1,-215]]);
    camera.position.set(Math.sin(p*22)*smooth(.35,.5,p)*.5,Math.cos(p*18)*smooth(.35,.5,p)*.3,z);
    camera.rotation.set(0,0,sample(p,[[0,0],[.40,0],[.485,-.75],[.555,.35],[.625,-.6],[.76,0],[1,0]]));
    camera.fov=sample(p,[[0,48],[.20,48],[.48,60],[.58,73],[.64,78],[.74,58],[1,58]]);camera.updateProjectionMatrix();
    const green=smooth(.35,.435,p),pink=smooth(.49,.535,p);
    const roomColor=new T.Color(0xb2ccd3).lerp(new T.Color(0x40fca5),green).lerp(new T.Color(0xff4988),pink);
    world.environment=p>.49?pinkEnvironment.texture:p>.385?greenEnvironment.texture:environment.texture;darkMetal.color.copy(roomColor).multiplyScalar(.28);crystalMat.color.copy(roomColor).lerp(new T.Color(0xffffff),.8);glowingMat.emissive.copy(roomColor);glowingMat.emissiveIntensity=mix(1.8,4.5,green);tint.color.copy(roomColor);
    shaft.visible=p>.23&&p<.58;crystalTube.visible=p>.40&&p<.65;
    shaft.scale.setScalar(mix(2.4,1,smooth(.235,.275,p)));
    whiteLight.intensity=p<.235?.22:.08;key.intensity=p<.235?1.6:.25;tint.intensity=p<.235?0:45;fill.intensity=p<.235?6:20;fill.position.set(camera.position.x-2,2,z-5);tint.position.set(2,-1,z-7);
    const actorDistance=sample(p,[[0,4.3],[.095,4.3],[.16,22],[.21,27],[.30,16],[.40,19],[.485,18],[.54,95],[1,95]]);
    astronaut.position.set(sample(p,[[0,0],[.10,0],[.16,.5],[.21,-.7],[.40,-.3],[.49,0],[1,0]]),sample(p,[[0,-1.14],[.095,-1.14],[.16,-1.1],[.23,-.4],[.4,-1],[.49,0],[1,0]]),z-actorDistance);
    astronaut.rotation.set(sample(p,[[0,0],[.1,.05],[.2,.35],[.30,Math.PI],[.43,5.5],[.50,6.5],[1,6.5]]),sample(p,[[0,0],[.10,0],[.18,1.5],[.3,.5],[.45,2],[1,0]]),sample(p,[[0,0],[.1,0],[.2,-.2],[.32,.2],[.47,1],[1,0]]));
    astronaut.visible=p<.57;actorUniform.value=sample(p,[[0,.45],[.10,.45],[.23,.75],[.4,.5],[.7,.2],[.79,.75],[.84,1],[.9,.15],[1,.45]]);
    bloom.strength=p<.23?.02:p<.4?.10:p<.635?.23:.13;bloom.radius=.45;bloom.threshold=1.45;
    if(p<.635){renderPass.scene=world;renderPass.camera=camera;}
    else{
      blueCamera.position.set(0,0,-sample(p,[[.635,4],[.72,49],[.76,70],[.82,72],[1,72]]));blueCamera.rotation.set(0,0,sample(p,[[.635,-1],[.685,-.5],[.737,0],[1,0]]));blueCamera.fov=mix(77,58,smooth(.635,.73,p));blueCamera.updateProjectionMatrix();
      if(blueAstronaut){blueAstronaut.visible=p<.768;blueAstronaut.position.set(0,-.1,blueCamera.position.z-sample(p,[[.635,34],[.695,21],[.74,11],[.768,8],[1,8]]));blueAstronaut.rotation.set(-.36,0,0);}
      if(p<.762){renderPass.scene=blueWorld;renderPass.camera=blueCamera;}
      else{
        if(blueAstronaut)blueAstronaut.visible=false;
        renderer.setRenderTarget(screenTarget);renderer.render(blueWorld,blueCamera);renderer.setRenderTarget(null);
        contactCamera.position.z=sample(p,[[.762,5.1],[.795,8.7],[.837,8.4],[.89,8.4],[1,8.4]]);
        monitor.visible=p<.885;const retreat=smooth(.838,.891,p);monitor.position.z=-retreat*11;monitor.scale.setScalar(1-retreat*.4);
        if(contactAstronaut){contactAstronaut.visible=true;contactAstronaut.position.set(0,sample(p,[[.762,0],[.80,.1],[.84,-.3],[.90,-.6],[1,-.6]]),sample(p,[[.762,-1],[.795,.2],[.84,3.5],[.9,3.2],[1,3.2]]));contactAstronaut.rotation.set(sample(p,[[.762,-.25],[.805,-.1],[.84,0],[1,0]]),Math.sin(p*30)*.1,sample(p,[[.762,0],[.84,-.08],[.9,.04],[1,0]]));}
        const burst=smooth(.775,.865,p);debris.visible=p>.775;debrisPieces.forEach(o=>{const d=o.userData;o.position.set(Math.cos(d.a)*d.r*(.2+burst*1.9),Math.sin(d.a)*d.r*(.2+burst*1.7),d.z*burst);o.rotation.set(d.spin+burst*2,d.spin+burst,d.a+burst);o.scale.setScalar(p>.9?.45:1);});
        stickerGroup.visible=p>.872;const arrival=smooth(.872,.925,p);stickerObjects.forEach((o,i)=>{const d=o.userData;o.position.set(Math.cos(d.a+p*.4)*d.r,Math.sin(d.a+p*.4)*d.r*1.06,d.z);o.rotation.z=d.spin+p*.5;o.scale.setScalar(d.size*arrival);});
        renderPass.scene=contactWorld;renderPass.camera=contactCamera;
      }
    }
    composer.render();lastRenderedProgress=p;totalDrawCalls+=renderer.info.render.calls;
    canvas.dataset.renderCount=String(++renderCount);canvas.dataset.renderedProgress=p.toFixed(4);
    canvas.dataset.totalDrawCalls=String(totalDrawCalls);canvas.dataset.lastSubmitMs=(performance.now()-submittedAt).toFixed(2);
    canvas.dataset.scene=sceneAt(p);canvas.dataset.ready=String(ready);canvas.dataset.drawCalls=String(renderer.info.render.calls);
  }
  function destroy(){if(disposed)return;disposed=true;draco.dispose();materials.forEach(m=>m.dispose());resources.forEach(r=>r.dispose());pmrem.dispose();bloom.dispose();composer.dispose();renderer.dispose();renderer.forceContextLoss();canvas.dataset.disposed='true';}
  return {render,resize,destroy,get ready(){return ready;}};
}

const $=id=>document.getElementById(id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const dialog=$('wish-dialog');
let garden=null;
let lastFocus=null;
let isPaused=false;

function openWish(){
  lastFocus=document.activeElement;
  garden?.setPaused(true);
  if(!dialog.open)dialog.showModal();
}
function closeWish(){dialog.close()}
$('open-wish').addEventListener('click',openWish);
$('skip-button').addEventListener('click',()=>{garden?.finish();openWish()});
$('close-wish').addEventListener('click',closeWish);
dialog.addEventListener('close',()=>{garden?.setPaused(isPaused);lastFocus?.focus({preventScroll:true})});
dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const r=dialog.getBoundingClientRect();
  if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeWish();
});
$('pause-button').addEventListener('click',()=>{
  isPaused=!isPaused;
  garden?.setPaused(isPaused);
  $('pause-button').textContent=isPaused?'Tiếp tục':'Tạm dừng';
});
$('replay-button').addEventListener('click',()=>{
  isPaused=false;
  $('pause-button').textContent='Tạm dừng';
  garden?.replay();
});
$('share-button').addEventListener('click',async()=>{
  const link=new URL(location.href);link.hash='';link.search='';
  try{
    if(navigator.share){
      await navigator.share({title:'Nở vì bạn · Chúc mừng 20/10',text:'Một đường hoa và một lời chúc dành cho bạn.',url:link.href});
      $('share-status').textContent='Yêu thương đã sẵn sàng để gửi đi.';
    }else{
      await navigator.clipboard.writeText(link.href);
      $('share-status').textContent='Đã sao chép link. Bạn có thể gửi qua Zalo hoặc Messenger.';
    }
  }catch(error){
    if(error.name==='AbortError')return;
    $('manual-link').hidden=false;
    $('manual-link').value=link.href;
    $('manual-link').focus();$('manual-link').select();
    $('share-status').textContent='Chọn và sao chép link bên dưới để gửi nhé.';
  }
});

function setReady(){
  document.body.dataset.stage='ready';
  $('final-invitation').hidden=false;
  $('pause-button').hidden=true;
  $('skip-button').hidden=true;
  $('replay-button').hidden=reduced.matches;
  $('journey-label').textContent='Chỉ cần là bạn, đã là một điều rất đẹp.';
  $('progress-fill').style.transform='scaleX(1)';
  $('progress-track').setAttribute('aria-valuenow','100');
  $('chapter').classList.remove('visible');
  $('scene').setAttribute('aria-label','Đường hoa đã nở trọn. Chạm vào bông hoa để mở lời chúc 20/10.');
}
function fallback(){
  $('loading').hidden=true;
  $('fallback').hidden=false;
  document.body.dataset.stage='fallback';
  $('intro').hidden=true;
  $('final-invitation').hidden=false;
  $('pause-button').hidden=true;
  $('skip-button').hidden=true;
  $('replay-button').hidden=true;
  $('journey-label').textContent='Một bông hoa, thật nhiều yêu thương.';
  $('progress-fill').style.transform='scaleX(1)';
  $('progress-track').setAttribute('aria-valuenow','100');
}

async function createGarden(){
  const THREE=await import('./assets/three.module.min.js');
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  const mobile=innerWidth<768;
  const renderer=new THREE.WebGLRenderer({antialias:!mobile,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.5:1.8));
  renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.1;
  $('scene').append(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden','true');
  const scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x071914,.022);
  const camera=new THREE.PerspectiveCamera(49,innerWidth/innerHeight,.1,130);
  scene.add(new THREE.HemisphereLight(0xffe8e1,0x254638,1.5));
  const mainLight=new THREE.DirectionalLight(0xffe2cd,2.2);
  mainLight.position.set(-5,9,12);scene.add(mainLight);
  const backLight=new THREE.DirectionalLight(0xe48baf,2);
  backLight.position.set(6,4,-10);scene.add(backLight);
  const fillLight=new THREE.PointLight(0x91d6b6,25,20);scene.add(fillLight);
  const pinkLight=new THREE.PointLight(0xff91b5,40,20);scene.add(pinkLight);

  const path=new THREE.CatmullRomCurve3([
    V(0,-2,3),V(-1.5,-1.4,-1),V(2,.1,-6),V(1.2,1.5,-11),
    V(-2.4,3,-17),V(-.7,4.5,-23),V(2,6,-29),V(0,7.5,-36)
  ]);
  const endpoint=path.getPointAt(1);
  function tube(curve,radius,material,segments=100){
    const geometry=new THREE.TubeGeometry(curve,segments,radius,7,false);
    const mesh=new THREE.Mesh(geometry,material);
    const count=geometry.index.count;
    geometry.setDrawRange(0,0);
    return{mesh,count,set(p){geometry.setDrawRange(0,Math.max(0,Math.floor(count*Math.min(1,Math.max(0,p))/3)*3))}};
  }
  const vineMaterial=new THREE.MeshStandardMaterial({color:0x55775b,roughness:.5,metalness:.28,emissive:0x204d36,emissiveIntensity:.7});
  const vine=tube(path,.055,vineMaterial,360);scene.add(vine.mesh);
  const halo=tube(path,.115,new THREE.MeshBasicMaterial({color:0x9de6b1,transparent:true,opacity:.075,depthWrite:false,blending:THREE.AdditiveBlending}),360);scene.add(halo.mesh);

  function petalGeometry(){
    const positions=[],uvs=[],indices=[],colors=[];
    const rows=24,cols=12;
    for(let y=0;y<=rows;y++){
      const t=y/rows;
      const width=.50*Math.pow(Math.sin(Math.PI*t),.65)+.012;
      for(let x=0;x<=cols;x++){
        const u=x/cols*2-1;
        positions.push(u*width,t*1.65,.40*Math.sin(Math.PI*t)-.35*t*t+u*u*.19*Math.sin(Math.PI*t));
        uvs.push(x/cols,t);
        colors.push(.62+.38*t,.47+.53*t,.58+.42*t);
      }
    }
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const a=y*(cols+1)+x,b=a+cols+1;
      indices.push(a,b,a+1,b,b+1,a+1);
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
    g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    g.setIndex(indices);g.computeVertexNormals();
    return g;
  }
  const petalGeo=petalGeometry();
  const leafGeo=petalGeo.clone();
  const palette=[0xf0a7bf,0xedbdcd,0xffddc4,0xd98eb4,0xffced5];
  const petalMaterials=palette.map(color=>new THREE.MeshStandardMaterial({color,vertexColors:true,side:THREE.DoubleSide,roughness:.4,metalness:.10,emissive:color,emissiveIntensity:.06}));
  const leafMat=new THREE.MeshStandardMaterial({color:0x527e59,side:THREE.DoubleSide,roughness:.65,metalness:.1});
  const coreMat=new THREE.MeshStandardMaterial({color:0xf4c779,emissive:0xdca447,emissiveIntensity:.5,roughness:.45});
  const coreGeo=new THREE.SphereGeometry(.145,16,12);
  const pollenGeo=new THREE.SphereGeometry(.028,6,5);
  const petalPlants=[];
  function flower(material,scale=1){
    const group=new THREE.Group();
    const petals=new THREE.InstancedMesh(petalGeo,material,22);
    const transform=new THREE.Object3D();
    let petalIndex=0;
    for(let ring=0;ring<3;ring++){
      const count=ring===2?6:8;
      for(let i=0;i<count;i++){
        const angle=i/count*Math.PI*2+ring*.37;
        const s=ring===0?1:ring===1?.74:.45;
        transform.scale.set(s*(ring===2?.85:1),s,s);
        transform.rotation.set(ring*.18,0,angle);
        transform.position.set(Math.sin(-angle)*.055,Math.cos(angle)*.055,ring*.11);
        transform.updateMatrix();petals.setMatrixAt(petalIndex++,transform.matrix);
      }
    }
    group.add(petals);
    const center=new THREE.Mesh(coreGeo,coreMat);center.position.z=.28;group.add(center);
    const pollen=new THREE.InstancedMesh(pollenGeo,coreMat,18);
    transform.rotation.set(0,0,0);transform.scale.set(1,1,1);
    for(let i=0;i<18;i++){
      const a=i/18*Math.PI*2;
      transform.position.set(Math.cos(a)*.18,Math.sin(a)*.18,.30+Math.sin(i)*.035);
      transform.updateMatrix();pollen.setMatrixAt(i,transform.matrix);
    }
    group.add(pollen);
    group.scale.setScalar(scale);return group;
  }
  const intervals=[.075,.145,.22,.295,.37,.445,.52,.595,.67,.745,.82,.89,.945];
  intervals.forEach((at,i)=>{
    const root=path.getPointAt(at);
    const side=i%2?1:-1;
    const offset=V(side*(1.1+(i%3)*.3),.85+(i%4)*.12,.15);
    const end=root.clone().add(offset);
    const branchCurve=new THREE.CatmullRomCurve3([root,root.clone().add(offset.clone().multiplyScalar(.38)).add(V(0,-.3,0)),end]);
    const branch=tube(branchCurve,.027,vineMaterial,28);scene.add(branch.mesh);
    const blossom=flower(petalMaterials[i%palette.length]);
    blossom.position.copy(end);blossom.rotation.set(.15*Math.sin(i),side*-.20,side*.25);
    blossom.scale.setScalar(.0001);scene.add(blossom);
    const leaves=[];
    for(let j=0;j<2;j++){
      const leaf=new THREE.Mesh(leafGeo,leafMat);
      leaf.position.copy(branchCurve.getPoint(.25+j*.27));
      leaf.rotation.set(.3,side*.6,side*(j?1.5:-.65));
      leaf.scale.setScalar(.0001);scene.add(leaf);leaves.push(leaf);
    }
    petalPlants.push({at,branch,blossom,leaves,targetScale:.38+(i%3)*.055,rotation:blossom.rotation.clone()});
  });
  const finalFlower=flower(petalMaterials[0],.0001);
  finalFlower.position.copy(endpoint).add(V(0,.5,0));
  finalFlower.rotation.z=.15;
  scene.add(finalFlower);
  const finalLeaves=[];
  [-1,1].forEach(side=>{
    const leaf=new THREE.Mesh(leafGeo,leafMat);
    leaf.position.copy(endpoint).add(V(side*.2,-.65,-.2));
    leaf.rotation.set(.2,side*.3,side*1.05);leaf.scale.setScalar(.0001);
    scene.add(leaf);finalLeaves.push(leaf);
  });

  // Subtle luminous pollen and dew. Generated in code, no third-party image.
  const spriteCanvas=document.createElement('canvas');spriteCanvas.width=64;spriteCanvas.height=64;
  const ctx=spriteCanvas.getContext('2d');
  const gradient=ctx.createRadialGradient(32,32,0,32,32,32);
  gradient.addColorStop(0,'rgba(255,244,214,1)');gradient.addColorStop(.12,'rgba(255,237,214,.8)');gradient.addColorStop(.4,'rgba(225,232,190,.12)');gradient.addColorStop(1,'rgba(225,232,190,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  const sprite=new THREE.CanvasTexture(spriteCanvas);
  const random=(seed=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296})(20102026);
  const particlePositions=[],particleColors=[];
  for(let i=0;i<(mobile?450:850);i++){
    particlePositions.push((random()-.5)*32,(random()-.2)*22,8-random()*65);
    const c=new THREE.Color().setHSL(.10+random()*.28,.25,.55+random()*.35);particleColors.push(c.r,c.g,c.b);
  }
  const dustGeo=new THREE.BufferGeometry();
  dustGeo.setAttribute('position',new THREE.Float32BufferAttribute(particlePositions,3));
  dustGeo.setAttribute('color',new THREE.Float32BufferAttribute(particleColors,3));
  const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({size:.12,map:sprite,vertexColors:true,transparent:true,opacity:.85,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(dust);
  const tip=new THREE.Sprite(new THREE.SpriteMaterial({map:sprite,color:0xe9e9b9,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));tip.scale.setScalar(.75);scene.add(tip);
  const finalGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:sprite,color:0xc76e9b,transparent:true,opacity:.16,depthWrite:false,blending:THREE.AdditiveBlending}));
  finalGlow.position.copy(endpoint).add(V(0,.5,-.9));finalGlow.scale.setScalar(7);scene.add(finalGlow);

  let elapsed=0,lastTime=0,paused=false,ready=false,phase='',progress=0,frame=0,disposed=false;
  const INTRO=3.4,DURATION=24;
  const cameraTarget=V(0,0,0);
  const raycaster=new THREE.Raycaster();
  const pointer=new THREE.Vector2();
  function updateCamera(p,time,snap=false){
    const at=path.getPointAt(Math.min(1,Math.max(0,p)));
    const endBlend=THREE.MathUtils.smoothstep(p,.90,1);
    const distance=innerWidth<768?12:9.5;
    const desired=at.clone().add(V(Math.sin(time*.22)*.2*(1-endBlend),4.5-endBlend*.8,distance));
    camera.position.copy(desired);
    cameraTarget.copy(at).add(V(0,.3-endBlend*.4,0));
    camera.lookAt(cameraTarget);
    fillLight.position.copy(camera.position).add(V(-3,2,-3));
    pinkLight.position.copy(at).add(V(3,2,4));
  }
  function updatePlants(p,time){
    vine.set(p);halo.set(p);
    for(const plant of petalPlants){
      const local=THREE.MathUtils.clamp((p-plant.at)/.055,0,1);
      plant.branch.set(local);
      const bloom=THREE.MathUtils.smoothstep(local,.3,1);
      const viewFade=(1-.85*THREE.MathUtils.smoothstep(p-plant.at,.13,.23))*(1-.8*THREE.MathUtils.smoothstep(p,.95,1));
      plant.blossom.scale.setScalar(Math.max(.0001,bloom*plant.targetScale*viewFade));
      plant.blossom.rotation.z=plant.rotation.z+(reduced.matches?0:Math.sin(time*.7+plant.at*20)*.035*bloom);
      plant.leaves.forEach(leaf=>leaf.scale.set(.22*bloom*viewFade,.32*bloom*viewFade,.3*bloom*viewFade));
    }
    const bloom=THREE.MathUtils.smoothstep(p,.95,1);
    finalFlower.scale.setScalar(Math.max(.0001,bloom*(innerWidth<768?1.04:1.16)));
    finalLeaves.forEach(leaf=>leaf.scale.set(.45*bloom,.75*bloom,.6*bloom));
    if(!reduced.matches)finalFlower.rotation.z=.15+Math.sin(time*.45)*.035;
    finalGlow.material.opacity=.18*bloom;
    tip.position.copy(path.getPointAt(p));tip.visible=p<.998;
  }
  function chapterFor(p){
    if(p<.1)return['',''];
    if(p<.31)return['Một chút dịu dàng…',''];
    if(p<.55)return['Một chút rực rỡ…','right'];
    if(p<.79)return['Và thật nhiều\nyêu thương.',''];
    if(p<.94)return['Dành cho bạn,\ntheo cách rất riêng.','right'];
    return['',''];
  }
  function updateUI(p){
    $('progress-fill').style.transform=`scaleX(${p})`;
    $('progress-track').setAttribute('aria-valuenow',String(Math.round(p*100)));
    const [text,side]=chapterFor(p);
    if(text!==phase){
      phase=text;$('chapter').textContent=text;$('chapter').style.whiteSpace='pre-line';
      $('chapter').className=`chapter ${side} ${text?'visible':''}`;
    }
    if(p>.1&&p<1)$('journey-label').textContent='Những điều đẹp đẽ đang nở vì bạn';
  }
  function finish(){
    elapsed=INTRO+DURATION;progress=1;ready=true;
    updatePlants(1,elapsed);updateCamera(1,elapsed,true);setReady();
    renderer.render(scene,camera);
  }
  function replay(){
    if(reduced.matches){finish();return}
    elapsed=0;progress=0;ready=false;paused=false;phase='';
    $('final-invitation').hidden=true;$('pause-button').hidden=false;$('skip-button').hidden=false;$('replay-button').hidden=true;
    $('chapter').className='chapter';document.body.dataset.stage='intro';
    $('journey-label').textContent='Một chút dịu dàng đang thức giấc';
    updateUI(0);updatePlants(0,0);updateCamera(0,0,true);
  }
  function animate(now){
    if(disposed)return;
    const dt=lastTime?Math.min((now-lastTime)/1000,.075):0;lastTime=now;
    if(!paused&&!document.hidden)elapsed+=dt;
    if(!ready&&!paused){
      progress=THREE.MathUtils.clamp((elapsed-INTRO)/DURATION,0,1);
      if(progress>0)document.body.dataset.stage='growing';
      updateUI(progress);
      if(progress>=1){ready=true;setReady()}
    }
    if(!paused){
      updatePlants(progress,elapsed);updateCamera(progress,elapsed);
      if(!reduced.matches)dust.rotation.z=Math.sin(elapsed*.025)*.025;
    }
    renderer.render(scene,camera);
    // Reduced-motion mode renders a still scene and does not keep a RAF loop.
    if(!reduced.matches)frame=requestAnimationFrame(animate);
  }
  function onResize(){
    camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);updateCamera(progress,elapsed,true);
    renderer.render(scene,camera);
  }
  window.addEventListener('resize',onResize);
  renderer.domElement.addEventListener('pointerup',event=>{
    if(!ready)return;
    const rect=renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);
    if(raycaster.intersectObject(finalFlower,true).length)openWish();
  });
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();disposed=true;cancelAnimationFrame(frame);fallback()});
  document.addEventListener('visibilitychange',()=>{lastTime=0});
  reduced.addEventListener('change',()=>{
    cancelAnimationFrame(frame);
    if(reduced.matches)finish();
    else{lastTime=0;frame=requestAnimationFrame(animate)}
  });
  updateCamera(0,0,true);updatePlants(0,0);
  renderer.render(scene,camera);
  $('loading').classList.add('loaded');
  setTimeout(()=>$('loading').hidden=true,850);
  $('pause-button').disabled=false;document.body.dataset.stage='intro';
  if(reduced.matches)finish();
  else frame=requestAnimationFrame(animate);
  return{finish,replay,setPaused(value){paused=value},dispose(){disposed=true;cancelAnimationFrame(frame);window.removeEventListener('resize',onResize);renderer.dispose()}};
}
createGarden().then(value=>garden=value).catch(error=>{console.warn('3D unavailable, showing the accessible greeting.',error.message);fallback()});
window.addEventListener('pagehide',()=>garden?.setPaused(true));
window.addEventListener('pageshow',event=>{if(event.persisted)garden?.setPaused(isPaused)});

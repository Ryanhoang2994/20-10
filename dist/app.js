const $=id=>document.getElementById(id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const dialog=$('wish-dialog');
let garden=null,lastFocus=null,isPaused=false,readyTimer;

function openWish(){
  clearTimeout(readyTimer);
  if(dialog.open)return;
  lastFocus=document.activeElement;
  garden?.setPaused(true);
  dialog.showModal();
}
function closeWish(){dialog.close()}
$('open-wish').addEventListener('click',openWish);
$('skip-button').addEventListener('click',()=>{garden?.finish();openWish()});
$('close-wish').addEventListener('click',closeWish);
dialog.addEventListener('close',()=>{
  garden?.setPaused(isPaused);
  if(lastFocus&&!lastFocus.hidden)lastFocus.focus({preventScroll:true});
});
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
  clearTimeout(readyTimer);
  isPaused=false;
  $('pause-button').textContent='Tạm dừng';
  garden?.replay();
});
$('share-button').addEventListener('click',async()=>{
  const link=new URL(location.href);link.hash='';link.search='';
  try{
    if(navigator.share){
      await navigator.share({title:'Nở vì bạn · Chúc mừng 20/10',text:'Một cánh đồng hoa và một lời chúc dành cho bạn.',url:link.href});
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
  $('journey-label').textContent='Cả một cánh đồng, dành tặng bạn.';
  $('progress-fill').style.transform='scaleX(1)';
  $('progress-track').setAttribute('aria-valuenow','100');
  $('chapter').classList.remove('visible');
  $('scene').setAttribute('aria-label','Cánh đồng hoa vàng, cam và hồng đã nở dưới ánh hoàng hôn.');
  clearTimeout(readyTimer);
  readyTimer=setTimeout(openWish,reduced.matches?150:1800);
}
function fallback(){
  clearTimeout(readyTimer);
  $('loading').hidden=true;
  $('fallback').hidden=false;
  $('intro').hidden=true;
  setReady();
  document.body.dataset.stage='fallback';
  $('replay-button').hidden=true;
}

async function createGarden(){
  const THREE=await import('./assets/three.module.min.js');
  const mobile=innerWidth<768;
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  let seed=20102026;
  const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296};
  const clamp=n=>Math.min(1,Math.max(0,n));
  const smooth=n=>{n=clamp(n);return n*n*(3-2*n)};
  const renderer=new THREE.WebGLRenderer({antialias:!mobile,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.35:1.7));
  renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.02;
  renderer.setClearColor(0xffffff,0);
  $('scene').append(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden','true');
  const scene=new THREE.Scene();
  scene.fog=new THREE.Fog(0xb3b2a2,35,112);
  const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,250);
  scene.add(new THREE.HemisphereLight(0xffead5,0x4b6a32,1.85));
  const sunLight=new THREE.DirectionalLight(0xffd19b,2.6);
  sunLight.position.set(-15,14,-45);scene.add(sunLight);
  const fill=new THREE.DirectionalLight(0xffefe5,.95);
  fill.position.set(0,6,15);scene.add(fill);

  // Layered silhouettes keep a horizon while the camera glides through the field.
  const hillMaterial=color=>new THREE.MeshBasicMaterial({color,fog:false});
  function hills(z,base,height,color,phase){
    const points=[new THREE.Vector2(-180,-9)];
    for(let x=-180;x<=180;x+=2){
      const y=base+height*(.55+.24*Math.sin(x*.055+phase)+.13*Math.sin(x*.13+phase*2)+.08*Math.sin(x*.31+phase));
      points.push(new THREE.Vector2(x,y));
    }
    points.push(new THREE.Vector2(180,-9));
    const mesh=new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(points)),hillMaterial(color));
    mesh.position.z=z;scene.add(mesh);
  }
  hills(-125,2.4,10,0xb6b6c4,.3);
  hills(-105,.6,8,0x929aaa,1.8);
  hills(-87,-.1,6.7,0x6e8290,3.7);
  hills(-73,-.2,3.2,0x526d69,2.1);
  const groundGeometry=new THREE.PlaneGeometry(300,230,1,1);
  groundGeometry.rotateX(-Math.PI/2);
  const groundCanvas=document.createElement('canvas');groundCanvas.width=groundCanvas.height=128;
  const groundContext=groundCanvas.getContext('2d'),groundPixels=groundContext.createImageData(128,128);
  for(let i=0;i<groundPixels.data.length;i+=4){
    const n=random();
    groundPixels.data[i]=37+n*21;groundPixels.data[i+1]=59+n*32;groundPixels.data[i+2]=17+n*10;groundPixels.data[i+3]=255;
  }
  groundContext.putImageData(groundPixels,0,0);
  const groundTexture=new THREE.CanvasTexture(groundCanvas);
  groundTexture.wrapS=groundTexture.wrapT=THREE.RepeatWrapping;groundTexture.repeat.set(90,70);
  const ground=new THREE.Mesh(groundGeometry,new THREE.MeshLambertMaterial({map:groundTexture,color:0xadb77c}));
  ground.position.set(0,-.07,-70);scene.add(ground);

  function glowTexture(){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
    const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,0,64,64,64);
    gradient.addColorStop(0,'rgba(255,255,220,1)');gradient.addColorStop(.13,'rgba(255,244,178,.97)');
    gradient.addColorStop(.24,'rgba(255,216,139,.4)');gradient.addColorStop(.55,'rgba(255,188,115,.12)');
    gradient.addColorStop(1,'rgba(255,177,111,0)');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
    return new THREE.CanvasTexture(canvas);
  }
  const sun=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture(),color:0xffffff,transparent:true,fog:false,depthWrite:false}));
  sun.position.set(-13,10.5,-115);sun.scale.set(35,35,1);scene.add(sun);

  // Eight curved, lightly scalloped cosmos petals, shared by every flower.
  function blossomGeometry(){
    const positions=[],colors=[],indices=[],rows=9,cols=8;
    for(let petal=0;petal<8;petal++){
      const angle=petal*Math.PI/4,offset=positions.length/3;
      for(let row=0;row<=rows;row++){
        const t=row/rows;
        for(let col=0;col<=cols;col++){
          const u=col/cols*2-1;
          const scallop=1-.014*(1-Math.cos(u*Math.PI*3))*t*t*t;
          const reach=(.045+.49*t)*scallop;
          const width=.192*Math.pow(Math.sin(t*Math.PI*.78),.7);
          const x=u*width,y=reach,z=.10*t*t+.045*u*u*t-.045*Math.sin(t*Math.PI);
          positions.push(x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle),z);
          const shade=.57+.43*t-.09*Math.pow(Math.cos(u*Math.PI*4),8)*Math.sin(t*Math.PI);
          colors.push(shade,shade,shade);
          if(row<rows&&col<cols){
            const a=offset+row*(cols+1)+col,b=a+cols+1;
            indices.push(a,b,a+1,b,b+1,a+1);
          }
        }
      }
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geo.setIndex(indices);geo.computeVertexNormals();return geo;
  }
  function leafGeometry(){
    const pos=[],indices=[];
    const triangle=(a,b,c)=>{const n=pos.length/3;pos.push(...a,...b,...c);indices.push(n,n+1,n+2)};
    triangle([-.014,0,0],[.014,0,0],[0,.7,.035]);
    for(let j=1;j<=6;j++){
      const y=j*.085,length=.24*(1-j/9);
      for(const side of [-1,1]){
        triangle([0,y,0],[side*length,y+.15,.035],[side*.018,y+.05,.012]);
        triangle([side*length*.62,y+.095,.018],[side*length*.85,y+.17,.04],[side*length*.42,y+.09,.014]);
      }
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(indices);g.computeVertexNormals();return g;
  }
  const count=mobile?1800:2900;
  const palette=[0xffbc16,0xff9d05,0xfa7112,0xe957a7,0xc54795,0xffcf35,0xffa20d];
  const plants=[];
  for(let i=0;i<count;i++){
    const z=8-random()*76,x=(random()-.5)*65;
    const depth=clamp((8-z)/76);
    plants.push({x,z,height:1.15+random()*1.65,scale:.41+random()*.32,tilt:-.75-random()*.58,
      turn:(random()-.5)*.7,spin:random()*Math.PI,phase:random()*Math.PI*2,
      lean:(random()-.5)*.35,color:Math.floor(random()*palette.length),
      delay:depth*.63+random()*.13,index:0});
  }
  for(let i=0;i<plants.length;i++){
    if(plants[i].z>0&&Math.abs(plants[i].x)<9){plants[i].height*=1.13;plants[i].scale*=1.08}
  }
  const blossomGeo=blossomGeometry(),petals=[];
  palette.forEach((color,k)=>{
    let n=0;plants.filter(p=>p.color===k).forEach(p=>p.index=n++);
    const material=new THREE.MeshStandardMaterial({color,roughness:.72,metalness:0,side:THREE.DoubleSide,vertexColors:true});
    const mesh=new THREE.InstancedMesh(blossomGeo,material,n);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;scene.add(mesh);petals.push(mesh);
  });
  const stems=new THREE.InstancedMesh(new THREE.CylinderGeometry(.009,.017,1,5),new THREE.MeshLambertMaterial({color:0x668239}),count);
  const leaves=new THREE.InstancedMesh(leafGeometry(),new THREE.MeshLambertMaterial({color:0x63883b,side:THREE.DoubleSide}),count*3);
  const centers=new THREE.InstancedMesh(new THREE.SphereGeometry(.087,9,6),new THREE.MeshStandardMaterial({color:0xe2a314,roughness:1}),count);
  const hearts=new THREE.InstancedMesh(new THREE.SphereGeometry(.046,8,5),new THREE.MeshStandardMaterial({color:0x795126,roughness:1}),count);
  [stems,leaves,centers,hearts].forEach(mesh=>{mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(mesh)});
  const matrix=new THREE.Object3D(),flowerMatrix=new THREE.Object3D(),up=V(0,1,0),direction=V(0,0,0);
  const coreOffset=V(0,0,.055),heartOffset=V(0,0,.105),temp=V(0,0,0);

  // Fine blades remain at ground level; flowering stems grow above them.
  const grassCount=mobile?5000:10000;
  const grassGeo=new THREE.BufferGeometry();
  grassGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.022,0,0,.022,0,0,.035,.65,.03],3));
  grassGeo.computeVertexNormals();
  const grass=new THREE.InstancedMesh(grassGeo,new THREE.MeshLambertMaterial({color:0x708b3d,side:THREE.DoubleSide}),grassCount);
  for(let i=0;i<grassCount;i++){
    matrix.position.set((random()-.5)*90,0,12-random()*95);
    matrix.rotation.set(0,random()*Math.PI,(random()-.5)*.25);
    matrix.scale.setScalar(.4+random()*1.1);matrix.updateMatrix();grass.setMatrixAt(i,matrix.matrix);
    grass.setColorAt(i,new THREE.Color().setHSL(.19+random()*.07,.38+random()*.25,.18+random()*.17));
  }
  scene.add(grass);
  const pollenCount=mobile?45:90,pp=[];
  for(let i=0;i<pollenCount;i++)pp.push((random()-.5)*35,random()*7,8-random()*42);
  const pollenGeo=new THREE.BufferGeometry();pollenGeo.setAttribute('position',new THREE.Float32BufferAttribute(pp,3));
  const pollen=new THREE.Points(pollenGeo,new THREE.PointsMaterial({color:0xffe9ba,map:glowTexture(),size:.095,transparent:true,opacity:.65,depthWrite:false}));
  scene.add(pollen);

  const INTRO=2.3,DURATION=16;
  let elapsed=0,previous=performance.now(),paused=false,finished=false,raf=0,lastUI=-1,lastPlantTime=-1,failed=false;
  function updatePlants(progress,time){
    plants.forEach((p,i)=>{
      const grow=smooth((progress-p.delay)/.23);
      const bloom=smooth((progress-p.delay-.115)/.12);
      const height=Math.max(.002,p.height*grow);
      const sway=Math.sin(time*.65+p.phase)*.065*grow;
      const tipX=p.x+p.lean*grow+sway,tipZ=p.z+Math.cos(time*.45+p.phase)*.045*grow;
      direction.set(tipX-p.x,height,tipZ-p.z);
      matrix.position.set((p.x+tipX)/2,height/2,(p.z+tipZ)/2);
      const length=direction.length();
      matrix.quaternion.setFromUnitVectors(up,direction.normalize());
      matrix.scale.set(Math.max(.01,grow),length,Math.max(.01,grow));matrix.updateMatrix();stems.setMatrixAt(i,matrix.matrix);
      flowerMatrix.position.set(tipX,height,tipZ);
      flowerMatrix.rotation.set(p.tilt+sway*.4,p.turn,p.spin);
      flowerMatrix.scale.setScalar(Math.max(.0001,p.scale*bloom));flowerMatrix.updateMatrix();
      matrix.position.copy(temp.copy(coreOffset).applyMatrix4(flowerMatrix.matrix));
      petals[p.color].setMatrixAt(p.index,flowerMatrix.matrix);
      matrix.quaternion.copy(flowerMatrix.quaternion);
      matrix.scale.set(p.scale*bloom,p.scale*bloom,p.scale*bloom*.65);matrix.updateMatrix();centers.setMatrixAt(i,matrix.matrix);
      matrix.position.copy(temp.copy(heartOffset).applyMatrix4(flowerMatrix.matrix));
      matrix.scale.setScalar(p.scale*bloom);matrix.updateMatrix();hearts.setMatrixAt(i,matrix.matrix);
      for(let leaf=0;leaf<3;leaf++){
        matrix.position.set(p.x+(tipX-p.x)*(.27+leaf*.21),height*(.27+leaf*.21),p.z);
        matrix.rotation.set(.2,p.phase+leaf*2.5,(leaf%2?1:-1)*.75);
        matrix.scale.setScalar(grow*(.75+leaf*.07));matrix.updateMatrix();leaves.setMatrixAt(i*3+leaf,matrix.matrix);
      }
    });
    [stems,leaves,centers,hearts,...petals].forEach(m=>m.instanceMatrix.needsUpdate=true);
  }
  function positionCamera(progress,time){
    const p=smooth(progress),portrait=innerWidth<768;
    camera.position.set(-.8+p*1.8+Math.sin(time*.11)*.08,portrait?3.3+p*.8:2.75+p*.9,17-p*4.5);
    camera.lookAt(.4,portrait?2.4:1.7,-29);
  }
  function updateUI(progress){
    const value=Math.round(progress*100);
    if(value===lastUI)return;lastUI=value;
    $('progress-fill').style.transform=`scaleX(${progress})`;
    $('progress-track').setAttribute('aria-valuenow',String(value));
    $('journey-label').textContent=progress<.3?'Từng mầm xanh đang thức giấc':progress<.72?'Một cánh đồng đang nở vì bạn':'Gom chút nắng, gửi chút thương';
    const chapter=$('chapter');
    chapter.textContent=progress<.58?'Một chút nắng. Một chút dịu dàng.':'Và thật nhiều yêu thương, dành cho bạn.';
    chapter.classList.toggle('visible',progress>.22&&progress<.42||progress>.66&&progress<.83);
  }
  function frame(now){
    if(failed)return;
    const dt=Math.min(.15,(now-previous)/1000);previous=now;
    if(!paused&&!document.hidden){
      elapsed+=dt;
      const progress=clamp((elapsed-INTRO)/DURATION);
      if(elapsed>INTRO&&!finished)document.body.dataset.stage='growing';
      if(now-lastPlantTime>33||reduced.matches){updatePlants(progress,elapsed);lastPlantTime=now}
      positionCamera(progress,elapsed);pollen.rotation.y=Math.sin(elapsed*.08)*.04;
      if(!finished)updateUI(progress);
      if(progress>=1&&!finished){finished=true;setReady()}
      renderer.render(scene,camera);
    }
    if(!reduced.matches)raf=requestAnimationFrame(frame);
  }
  function finish(){
    elapsed=INTRO+DURATION;finished=true;
    updatePlants(1,elapsed);positionCamera(1,elapsed);renderer.render(scene,camera);setReady();
  }
  function replay(){
    if(failed)return;
    clearTimeout(readyTimer);
    if(dialog.open)dialog.close();
    elapsed=0;finished=false;paused=false;lastUI=-1;lastPlantTime=-1;previous=performance.now();
    $('intro').hidden=false;$('final-invitation').hidden=true;
    $('pause-button').hidden=false;$('skip-button').hidden=false;$('replay-button').hidden=true;
    document.body.dataset.stage='intro';
    $('scene').setAttribute('aria-label','Cánh đồng hoa đang mọc lên dưới ánh hoàng hôn.');
    if(reduced.matches)finish();
  }
  window.addEventListener('resize',()=>{
    camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
    positionCamera(clamp((elapsed-INTRO)/DURATION),elapsed);renderer.render(scene,camera);
  });
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();failed=true;cancelAnimationFrame(raf);fallback()});
  reduced.addEventListener('change',()=>{
    cancelAnimationFrame(raf);
    if(reduced.matches)finish();
    else{previous=performance.now();$('replay-button').hidden=!finished;raf=requestAnimationFrame(frame)}
  });
  document.addEventListener('visibilitychange',()=>{previous=performance.now()});
  $('loading').hidden=true;$('pause-button').disabled=false;
  document.body.dataset.stage='intro';
  updatePlants(0,0);positionCamera(0,0);renderer.render(scene,camera);
  if(reduced.matches)finish();else raf=requestAnimationFrame(frame);
  return{finish,replay,setPaused(value){paused=value;previous=performance.now()}};
}

createGarden().then(result=>{garden=result;if(dialog.open)garden.setPaused(true)}).catch(error=>{
  console.warn('Cảnh hoa chuyển sang ảnh dự phòng:',error.message);fallback();
});

// All petals, stamens and branches are real geometry; no flat flower sprites.
export async function createPeachGarden({reduced,onReady,onProgress,onFallback,onTouch}){
  const T=await import('./assets/three.module.min.js');
  const host=document.getElementById('scene');
  const mobile=innerWidth<768;
  const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.4:1.65));
  renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  host.append(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
  const scene=new T.Scene();
  const camera=new T.PerspectiveCamera(55,innerWidth/innerHeight,.1,150);
  scene.fog=new T.Fog(0xc09aa8,27,86);
  const clock={value:0},bloom={value:0},burstPower={value:0};
  const uniforms={uTime:clock,uBloom:bloom,uBurst:burstPower};
  const backdrop=new T.Mesh(new T.PlaneGeometry(2,2),new T.ShaderMaterial({
    depthWrite:false,depthTest:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,.999,1.);}',
    fragmentShader:`
      varying vec2 vUv;
      void main(){
        vec3 base=mix(vec3(.70,.38,.34),vec3(.30,.24,.38),smoothstep(0.,1.,vUv.y));
        float halo=exp(-length((vUv-vec2(.43,.44))*vec2(1.2,1.)) *5.5);
        base+=vec3(.30,.16,.10)*halo;
        gl_FragColor=vec4(base,1.);
        #include <colorspace_fragment>
      }`
  }));
  backdrop.frustumCulled=false;backdrop.renderOrder=-10;scene.add(backdrop);
  scene.add(new T.HemisphereLight(0xffecdf,0x637457,2.2));
  const key=new T.DirectionalLight(0xffd3b2,2);key.position.set(-4,7,5);scene.add(key);
  const rim=new T.DirectionalLight(0xff9fc9,1.8);rim.position.set(4,5,-5);scene.add(rim);
  const fill=new T.PointLight(0xffc7d3,6,16,2);fill.position.set(0,2.5,4);scene.add(fill);
  const tree=new T.Group();scene.add(tree);
  let seed=20102029;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
  const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(x*(x*6-15)+10)};
  const matrix=new T.Matrix4(),dummy=new T.Object3D();

  // One merged mesh for all tapering branches, with growth anchored at each root.
  const stemData={position:[],normal:[],root:[],timing:[],color:[]};
  const flowerData=[];
  function stem(points,radius,start,duration){
    const curve=new T.CubicBezierCurve3(...points);
    const tube=new T.TubeGeometry(curve,12,radius,6,false).toNonIndexed();
    const pos=tube.getAttribute('position'),normal=tube.getAttribute('normal'),uv=tube.getAttribute('uv');
    for(let i=0;i<pos.count;i++){
      const t=uv.getX(i),center=curve.getPoint(t);
      const p=V(pos.getX(i),pos.getY(i),pos.getZ(i)).sub(center).multiplyScalar(1-t*.88).add(center);
      stemData.position.push(p.x,p.y,p.z);
      stemData.normal.push(normal.getX(i),normal.getY(i),normal.getZ(i));
      stemData.root.push(...points[0].toArray());stemData.timing.push(start,duration);
      const grain=.75+rand()*.25;
      stemData.color.push(.28*grain,.115*grain,.085*grain);
    }
    tube.dispose();return curve;
  }
  function flowersOn(curve,count,start){
    for(let j=0;j<count;j++){
      const t=.13+((j+rand()*.65)/count)*.84;
      const center=curve.getPoint(t);
      const around=rand()*Math.PI*2;
      center.add(V(Math.cos(around)*.09,(rand()-.4)*.07,Math.sin(around)*.09));
      const normal=V(Math.cos(around),.3+rand(),Math.sin(around)).normalize();
      normal.add(V((rand()-.5)*.7,(rand()-.5)*.7,(rand()-.5)*.7)).normalize();
      const q=new T.Quaternion().setFromUnitVectors(V(0,0,1),normal);
      q.multiply(new T.Quaternion().setFromAxisAngle(V(0,0,1),rand()*Math.PI*2));
      flowerData.push({center,q,size:.48+rand()*.32,start:start+t*.08+rand()*.07,hue:.94+rand()*.035});
    }
  }
  // A planted landscape: every shrub is rooted on the same rolling terrain.
  const terrainHeight=(x,z)=>{
    const r=Math.hypot(x,z),a=Math.atan2(x,z);
    return Math.sin(x*.15)*.55+Math.cos(z*.13)*.65+Math.sin((x+z)*.11)*.35
      +smooth((r-32)/26)*(6+Math.sin(a*5)*2.3+Math.sin(a*11)*1.3);
  };
  const groundGeometry=new T.PlaneGeometry(180,180,100,100);groundGeometry.rotateX(-Math.PI/2);
  const gp=groundGeometry.getAttribute('position');
  for(let i=0;i<gp.count;i++)gp.setY(i,terrainHeight(gp.getX(i),gp.getZ(i)));
  groundGeometry.computeVertexNormals();
  const grass=await new T.TextureLoader().loadAsync('./assets/meadow-grass.webp');
  grass.wrapS=grass.wrapT=T.RepeatWrapping;grass.repeat.set(75,75);grass.colorSpace=T.SRGBColorSpace;
  grass.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  const ground=new T.Mesh(groundGeometry,new T.MeshStandardMaterial({map:grass,color:0x88856f,roughness:1}));
  scene.add(ground);
  const sun=new T.Mesh(new T.SphereGeometry(2.5,24,16),new T.MeshBasicMaterial({color:0xffdfb1,fog:false}));
  sun.position.set(-40,16,-65);scene.add(sun);
  const shrubs=[];
  for(let z=-7;z<=7;z++)for(let x=-7;x<=7;x++){
    const px=x*3.7+(rand()-.5)*2.1,pz=z*3.7+(rand()-.5)*2.1;
    if(Math.hypot(px,pz)>28)continue;
    shrubs.push({x:px,z:pz,height:1.1+rand()*1.4,phase:rand()});
  }
  for(let n=0;n<shrubs.length;n++){
    const shrub=shrubs[n],base=V(shrub.x,terrainHeight(shrub.x,shrub.z),shrub.z);
    const h=shrub.height,angle=shrub.phase*Math.PI*2;
    const arrival=.02+((Math.atan2(shrub.x,shrub.z)-.65+Math.PI*4)%(Math.PI*2))/(Math.PI*2)*.38;
    const top=base.clone().add(V((rand()-.5)*.25,h,0));
    const trunk=stem([base,base.clone().add(V(.1,h*.3,0)),top.clone().add(V(-.1,-h*.3,.1)),top],
      .055,arrival,.15);
    for(let j=0;j<5;j++){
      const a=angle+j*2.39996,r=trunk.getPoint(.35+j*.105);
      const e=base.clone().add(V(Math.sin(a)*(.95+rand()*.65),h*(.75+rand()*.45),Math.cos(a)*(.55+rand()*.55)));
      const branch=stem([r,r.clone().add(V(Math.sin(a)*.3,.35,Math.cos(a)*.3)),e.clone().add(V(0,-.3,0)),e],
        .023,arrival+.09+j*.007,.18);
      flowersOn(branch,mobile?4:6,arrival+.20+j*.012);
      const r2=branch.getPoint(.55),a2=a+.9,e2=r2.clone().add(V(Math.sin(a2)*.42,.26,Math.cos(a2)*.42));
      const twig=stem([r2,r2.clone().add(V(0,.14,0)),e2.clone().add(V(0,-.13,0)),e2],.008,arrival+.20,.13);
      flowersOn(twig,mobile?2:3,arrival+.31+j*.012);
    }
  }
  // Fine grass blades provide scale and blend each cluster into the land.
  const blade=new T.BufferGeometry();
  blade.setAttribute('position',new T.Float32BufferAttribute([-.018,0,0,.018,0,0,.012,.17,.018,-.012,.17,.018,.035,.32,.06],3));
  blade.setIndex([0,1,2,0,2,3,3,2,4]);blade.computeVertexNormals();
  const blades=new T.InstancedMesh(blade,new T.MeshStandardMaterial({color:0x7a8f53,side:T.DoubleSide,roughness:1}),mobile?3500:6500);
  for(let i=0;i<blades.count;i++){
    const x=(rand()-.5)*66,z=(rand()-.5)*66;
    dummy.position.set(x,terrainHeight(x,z),z);dummy.rotation.set(0,rand()*Math.PI,0);dummy.scale.setScalar(.6+rand()*.9);
    dummy.updateMatrix();blades.setMatrixAt(i,dummy.matrix);
  }
  scene.add(blades);
  const stems=new T.BufferGeometry();
  for(const [name,values,size] of [['position',stemData.position,3],['normal',stemData.normal,3],
    ['color',stemData.color,3],['aRoot',stemData.root,3],['aTiming',stemData.timing,2]]){
    stems.setAttribute(name,new T.Float32BufferAttribute(values,size));
  }
  const stemMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.93});
  stemMaterial.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms);
    shader.vertexShader='attribute vec3 aRoot;attribute vec2 aTiming;uniform float uBloom;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`
      float grown=smoothstep(0.,1.,(uBloom-aTiming.x)/aTiming.y);
      vec3 transformed=mix(aRoot,position,grown);
    `);
  };
  const stemMesh=new T.Mesh(stems,stemMaterial);stemMesh.frustumCulled=false;tree.add(stemMesh);

  function merge(parts){
    const attrs={position:[],normal:[]};
    for(const part of parts){
      const g=part.index?part.toNonIndexed():part;
      for(const key of Object.keys(attrs))attrs[key].push(...g.getAttribute(key).array);
    }
    const g=new T.BufferGeometry();
    for(const key of Object.keys(attrs))g.setAttribute(key,new T.Float32BufferAttribute(attrs[key],3));
    return g;
  }
  // Curved, cupped five-petal peach blossom with a subtle notch and darker center.
  const petalPositions=[],petalIndices=[],petalColors=[];
  const U=mobile?5:7,W=mobile?3:4;
  for(let u=0;u<=U;u++){
    const t=u/U;
    for(let v=0;v<=W;v++){
      const side=v/W*2-1;
      const width=.14*Math.pow(Math.sin(Math.PI*t),.58);
      petalPositions.push(side*width,.025+t*.27-.012*Math.pow(t,8)*Math.exp(-side*side*18),
        .065*Math.sin(Math.PI*t)+.036*side*side*t-.015*t);
      const c=new T.Color().lerpColors(new T.Color('#dc3971'),new T.Color('#f6b7cd'),Math.pow(t,.55));
      petalColors.push(c.r,c.g,c.b);
      if(u<U&&v<W){const n=u*(W+1)+v;petalIndices.push(n,n+1,n+W+1,n+1,n+W+2,n+W+1)}
    }
  }
  const singlePetal=new T.BufferGeometry();
  singlePetal.setAttribute('position',new T.Float32BufferAttribute(petalPositions,3));
  singlePetal.setAttribute('color',new T.Float32BufferAttribute(petalColors,3));
  singlePetal.setIndex(petalIndices);singlePetal.computeVertexNormals();
  const petals=[];
  for(let j=0;j<5;j++)petals.push(singlePetal.clone().rotateZ(j*Math.PI*2/5));
  const flowerGeometry=merge(petals);
  const colors=[];
  for(const p of petals)colors.push(...p.toNonIndexed().getAttribute('color').array);
  flowerGeometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  const stamenParts=[];
  for(let j=0;j<7;j++){
    const a=j*2.39996,r=.035+(j%3)*.018;
    const end=V(Math.cos(a)*r,Math.sin(a)*r,.07+(j%4)*.012);
    const direction=end.clone().sub(V(0,0,.015));
    const stick=new T.CylinderGeometry(.0028,.0038,direction.length(),3);
    matrix.compose(end.clone().add(V(0,0,.015)).multiplyScalar(.5),
      new T.Quaternion().setFromUnitVectors(V(0,1,0),direction.normalize()),V(1,1,1));
    stick.applyMatrix4(matrix);stamenParts.push(stick);
    stamenParts.push(new T.OctahedronGeometry(.009,0).translate(end.x,end.y,end.z));
  }
  const antherGeometry=merge(stamenParts);
  const count=flowerData.length;
  function growMaterial(material,key){
    material.onBeforeCompile=shader=>{
      Object.assign(shader.uniforms,uniforms);
      shader.vertexShader='attribute float aStart;uniform float uBloom;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`
        float opened=smoothstep(0.,1.,(uBloom-aStart)/.15);
        vec3 transformed=position*opened;
      `);
    };
    material.customProgramCacheKey=()=>key;return material;
  }
  const petalMaterial=growMaterial(new T.MeshStandardMaterial({
    color:0xffd7e5,vertexColors:true,roughness:.46,metalness:0,side:T.DoubleSide,
    emissive:0x68182c,emissiveIntensity:.11
  }),'peach-petals');
  // Distant flowers retain their five-petal silhouette with fewer triangles.
  const detailedFlower=merge([flowerGeometry,antherGeometry]);
  const detailColors=[...flowerGeometry.getAttribute('color').array];
  const gold=new T.Color('#ffd68c');
  for(let i=0;i<antherGeometry.getAttribute('position').count;i++)detailColors.push(gold.r,gold.g,gold.b);
  detailedFlower.setAttribute('color',new T.Float32BufferAttribute(detailColors,3));
  const distantParts=[];
  for(let j=0;j<5;j++)distantParts.push(new T.CircleGeometry(.135,6).translate(0,.15,0).rotateZ(j*Math.PI*2/5));
  const distantFlower=merge(distantParts),distantColors=[];
  const pink=new T.Color('#ee9cbb');
  for(let i=0;i<distantFlower.getAttribute('position').count;i++)distantColors.push(pink.r,pink.g,pink.b);
  distantFlower.setAttribute('color',new T.Float32BufferAttribute(distantColors,3));
  const sectorMap=new Map(),flowerTiles=[];
  for(const flower of flowerData){
    const key=Math.floor(flower.center.x/6)+','+Math.floor(flower.center.z/6);
    if(!sectorMap.has(key))sectorMap.set(key,[]);
    sectorMap.get(key).push(flower);
  }
  const budMaterial=growMaterial(new T.MeshStandardMaterial({color:0xd34772,roughness:.6}),'peach-buds');
  const budsGeometry=new T.OctahedronGeometry(.06,0);
  for(const sector of sectorMap.values()){
    const meshes=[];
    for(const [base,material,offset] of [[detailedFlower,petalMaterial,0],[distantFlower,petalMaterial,0],[budsGeometry,budMaterial,-.13]]){
      const geometry=base.clone();
      geometry.setAttribute('aStart',new T.InstancedBufferAttribute(new Float32Array(sector.map(f=>f.start+offset)),1));
      const mesh=new T.InstancedMesh(geometry,material,sector.length);
      sector.forEach((f,i)=>{
        matrix.compose(f.center,f.q,V(f.size,f.size,f.size));mesh.setMatrixAt(i,matrix);
        if(base!==budsGeometry)mesh.setColorAt(i,new T.Color().setHSL(f.hue,.30,.88));
      });
      mesh.computeBoundingSphere();tree.add(mesh);meshes.push(mesh);
    }
    flowerTiles.push({meshes,center:meshes[0].boundingSphere.center.clone()});
  }

  const starCount=mobile?400:750,starPos=[],starMeta=[];
  for(let i=0;i<starCount;i++){
    const angle=rand()*Math.PI*2,r=2.2+rand()*27;
    starPos.push(Math.cos(angle)*r,rand()*8,Math.sin(angle)*r);
    starMeta.push(rand()*Math.PI*2,2+rand()*4,rand());
  }
  const starsGeometry=new T.BufferGeometry();
  starsGeometry.setAttribute('position',new T.Float32BufferAttribute(starPos,3));
  starsGeometry.setAttribute('aMeta',new T.Float32BufferAttribute(starMeta,3));
  const stars=new T.Points(starsGeometry,new T.ShaderMaterial({
    uniforms,transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:`
      attribute vec3 aMeta;uniform float uTime,uBloom,uBurst;
      varying float vAlpha,vGold;
      void main(){
        vec3 p=position;
        float a=uTime*.045;
        p.xz=mat2(cos(a),-sin(a),sin(a),cos(a))*p.xz;
        p.y=mod(p.y+uTime*.12,8.);
        p.xz*=1.+uBurst*.25;
        vec4 view=modelViewMatrix*vec4(p,1.);
        gl_Position=projectionMatrix*view;
        float twinkle=pow(.5+.5*sin(uTime*1.6+aMeta.x),3.);
        gl_PointSize=clamp(aMeta.y*(1.+uBurst)*22./-view.z,1.,18.);
        vAlpha=(.17+twinkle*.83)*(.22+.78*uBloom);vGold=aMeta.z;
      }`,
    fragmentShader:`
      varying float vAlpha,vGold;
      void main(){
        vec2 p=gl_PointCoord-.5;float r=length(p);
        float dotGlow=exp(-r*r*35.);
        float crossGlow=exp(-abs(p.x)*65.)*exp(-abs(p.y)*8.)+exp(-abs(p.y)*65.)*exp(-abs(p.x)*8.);
        float a=(dotGlow*.7+crossGlow*.32)*vAlpha*smoothstep(.5,.35,r);
        gl_FragColor=vec4(mix(vec3(1.,.45,.65),vec3(1.,.80,.44),vGold),a);
      }`
  }));
  stars.frustumCulled=false;scene.add(stars);
  const falling=new T.InstancedMesh(singlePetal,new T.MeshStandardMaterial({
    color:0xf3a3bd,side:T.DoubleSide,roughness:.5
  }),64);
  const fallSeeds=Array.from({length:64},()=>[rand()*Math.PI*2,rand()*5,rand()]);
  falling.frustumCulled=false;scene.add(falling);

  const INTRO=1.8,DURATION=23,SETTLE=1.2,END=INTRO+DURATION+SETTLE;
  let elapsed=0,lastTime=performance.now(),paused=false,finished=false,failed=false,raf=0,lastUI=-1;
  let orbitOffset=0,pointer=null,lastBurst=-100;
  function resize(){
    camera.aspect=innerWidth/innerHeight;
    camera.clearViewOffset();
    camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
  }
  function render(){
    const progress=Math.max(0,Math.min(1,(elapsed-INTRO)/(DURATION+SETTLE)));
    const growth=Math.max(0,Math.min(1,(elapsed-INTRO)/DURATION));
    const turn=smooth(Math.min(1,(elapsed-INTRO)/DURATION));
    const angle=.65+turn*Math.PI*2+orbitOffset;
    const radius=22-10*smooth(growth);
    const cameraY=6.6-2.6*smooth(growth)+Math.sin(turn*Math.PI)*1.1;
    camera.position.set(Math.sin(angle)*radius,cameraY,Math.cos(angle)*radius);
    camera.lookAt(0,1.3,0);camera.updateMatrixWorld();
    clock.value=reduced.matches?0:elapsed;
    bloom.value=growth;
    burstPower.value=reduced.matches?0:Math.max(0,1-(elapsed-lastBurst)/2);
    tree.rotation.z=reduced.matches?0:Math.sin(elapsed*.45)*.003;
    const fallAmount=smooth((growth-.55)/.3);
    for(let i=0;i<fallSeeds.length;i++){
      const [a,phase,s]=fallSeeds[i],t=clock.value;
      dummy.position.set(Math.sin(a+t*.06)*(3+s*20),5.2-((phase+t*.22)%5),Math.cos(a+t*.055)*(3+s*20));
      dummy.rotation.set(t*.65+a,a+t*.25,t*.4+phase);
      dummy.scale.setScalar((.18+s*.18)*fallAmount);dummy.updateMatrix();falling.setMatrixAt(i,dummy.matrix);
    }
    falling.instanceMatrix.needsUpdate=true;
    for(const tile of flowerTiles){
      const detail=tile.center.distanceTo(camera.position)<(mobile?12:16);
      tile.meshes[0].visible=detail;tile.meshes[1].visible=!detail;
      tile.meshes[2].visible=growth<.92;
    }
    renderer.render(scene,camera);
    const percent=Math.round(progress*100);
    if(percent!==lastUI){lastUI=percent;onProgress(progress)}
  }
  function schedule(){if(!raf&&!paused&&!failed&&!document.hidden&&!reduced.matches)raf=requestAnimationFrame(frame)}
  function frame(now){
    raf=0;if(paused||failed||document.hidden)return;
    elapsed+=Math.min(.08,(now-lastTime)/1000);lastTime=now;render();
    if(elapsed>=END&&!finished){finished=true;onReady()}
    schedule();
  }
  function finish(){elapsed=END;finished=true;render();onReady()}
  function replay(){elapsed=0;finished=false;paused=false;orbitOffset=0;lastBurst=-100;lastUI=-1;lastTime=performance.now();render();if(reduced.matches)finish();else schedule()}
  function setPaused(value){paused=value;lastTime=performance.now();if(paused){cancelAnimationFrame(raf);raf=0}else schedule()}
  function burst(){lastBurst=elapsed;render();schedule()}
  function setMotionPreference(){cancelAnimationFrame(raf);raf=0;if(reduced.matches)finish();else{lastTime=performance.now();schedule()}}
  const canvas=renderer.domElement;
  canvas.addEventListener('pointerdown',event=>{
    pointer={id:event.pointerId,x:event.clientX,moved:0};canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    if(!pointer||event.pointerId!==pointer.id)return;
    const dx=event.clientX-pointer.x;pointer.x=event.clientX;pointer.moved+=Math.abs(dx);
    orbitOffset-=dx*.007;if(paused||reduced.matches)render();
  });
  canvas.addEventListener('pointerup',event=>{
    if(!pointer||event.pointerId!==pointer.id)return;
    if(pointer.moved<8){burst();onTouch?.()}
    pointer=null;
  });
  canvas.addEventListener('pointercancel',()=>{pointer=null});
  window.addEventListener('resize',()=>{resize();render()});
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;lastTime=performance.now();schedule()});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();failed=true;cancelAnimationFrame(raf);raf=0;onFallback()});
  resize();render();
  return{finish,replay,setPaused,setMotionPreference,burst,start(){lastTime=performance.now();if(reduced.matches)finish();else schedule()}};
}

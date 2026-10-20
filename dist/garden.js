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
  const camera=new T.PerspectiveCamera(42,innerWidth/innerHeight,.1,80);
  const clock={value:0},bloom={value:0},burstPower={value:0};
  const uniforms={uTime:clock,uBloom:bloom,uBurst:burstPower};
  const backdrop=new T.Mesh(new T.PlaneGeometry(2,2),new T.ShaderMaterial({
    depthWrite:false,depthTest:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,.999,1.);}',
    fragmentShader:`
      varying vec2 vUv;
      void main(){
        vec3 base=mix(vec3(.19,.075,.115),vec3(.055,.025,.045),smoothstep(0.,1.,vUv.y));
        float halo=exp(-length((vUv-vec2(.43,.44))*vec2(1.2,1.)) *5.5);
        base+=vec3(.30,.115,.13)*halo;
        gl_FragColor=vec4(base,1.);
        #include <colorspace_fragment>
      }`
  }));
  backdrop.frustumCulled=false;backdrop.renderOrder=-10;scene.add(backdrop);
  scene.add(new T.HemisphereLight(0xffe8e2,0x805367,2.6));
  const key=new T.DirectionalLight(0xffd3b2,2.4);key.position.set(-4,7,5);scene.add(key);
  const rim=new T.DirectionalLight(0xff9fc9,1.8);rim.position.set(4,5,-5);scene.add(rim);
  const fill=new T.PointLight(0xffc7d3,24,16,2);fill.position.set(0,2.5,4);scene.add(fill);
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
      const normal=V(Math.cos(around)*.8,.35+rand()*.65,Math.sin(around)*.8).normalize();
      const q=new T.Quaternion().setFromUnitVectors(V(0,0,1),normal);
      q.multiply(new T.Quaternion().setFromAxisAngle(V(0,0,1),rand()*Math.PI*2));
      flowerData.push({center,q,size:.44+rand()*.20,start:start+t*.08+rand()*.07,hue:.94+rand()*.035});
    }
  }
  const trunk=stem([V(),V(-.23,.9,.08),V(.20,1.65,-.1),V(-.06,2.55,0)],.17,0,.20);
  for(let i=0;i<9;i++){
    const angle=i*2.39996,root=trunk.getPoint(.35+i*.064);
    const radial=1.5+rand()*.65;
    const end=V(Math.cos(angle)*radial,3.0+rand()*1.25,Math.sin(angle)*radial);
    const main=stem([root,root.clone().add(V(Math.cos(angle)*.4,.7,Math.sin(angle)*.4)),
      end.clone().add(V(-Math.cos(angle)*.45,-.55,-Math.sin(angle)*.45)),end],.065,.17+i*.006,.22);
    flowersOn(main,6,.40);
    for(let j=0;j<3;j++){
      const r=main.getPoint(.40+j*.20);
      const a=angle+(j-1)*.7+(rand()-.5)*.5;
      const e=r.clone().add(V(Math.cos(a)*(.55+rand()*.38),.45+rand()*.65,Math.sin(a)*(.55+rand()*.38)));
      const branch=stem([r,r.clone().add(V(0,.3,0)),e.clone().add(V(0,-.2,0)),e],.028,.36+j*.025,.19);
      flowersOn(branch,8,.52+j*.025);
      for(let k=0;k<2;k++){
        const r2=branch.getPoint(.45+k*.35),a2=a+(k?1:-1)*(.7+rand()*.5);
        const e2=r2.clone().add(V(Math.cos(a2)*.30,.24+rand()*.35,Math.sin(a2)*.30));
        const twig=stem([r2,r2.clone().add(V(0,.16,0)),e2.clone().add(V(0,-.12,0)),e2],.011,.51+j*.025,.16);
        flowersOn(twig,mobile?4:5,.63+j*.025);
      }
    }
  }
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
  const U=8,W=6;
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
  for(let j=0;j<11;j++){
    const a=j*2.39996,r=.035+(j%3)*.018;
    const end=V(Math.cos(a)*r,Math.sin(a)*r,.07+(j%4)*.012);
    const direction=end.clone().sub(V(0,0,.015));
    const stick=new T.CylinderGeometry(.0028,.0038,direction.length(),3);
    matrix.compose(end.clone().add(V(0,0,.015)).multiplyScalar(.5),
      new T.Quaternion().setFromUnitVectors(V(0,1,0),direction.normalize()),V(1,1,1));
    stick.applyMatrix4(matrix);stamenParts.push(stick);
    stamenParts.push(new T.SphereGeometry(.008,5,3).translate(end.x,end.y,end.z));
  }
  const antherGeometry=merge(stamenParts);
  const count=flowerData.length;
  const starts=flowerData.map(f=>f.start);
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
  flowerGeometry.setAttribute('aStart',new T.InstancedBufferAttribute(new Float32Array(starts),1));
  antherGeometry.setAttribute('aStart',new T.InstancedBufferAttribute(new Float32Array(starts),1));
  const petalMaterial=growMaterial(new T.MeshStandardMaterial({
    color:0xffd7e5,vertexColors:true,roughness:.46,metalness:0,side:T.DoubleSide,
    emissive:0x68182c,emissiveIntensity:.11
  }),'peach-petals');
  const antherMaterial=growMaterial(new T.MeshStandardMaterial({
    color:0xffd48b,roughness:.55,emissive:0x9c571a,emissiveIntensity:.18
  }),'peach-stamens');
  const blossoms=new T.InstancedMesh(flowerGeometry,petalMaterial,count);
  const anthers=new T.InstancedMesh(antherGeometry,antherMaterial,count);
  const budsGeometry=new T.SphereGeometry(.06,6,5);
  budsGeometry.setAttribute('aStart',new T.InstancedBufferAttribute(new Float32Array(starts.map(s=>s-.13)),1));
  const buds=new T.InstancedMesh(budsGeometry,growMaterial(new T.MeshStandardMaterial({
    color:0xd34772,roughness:.6
  }),'peach-buds'),count);
  flowerData.forEach((f,i)=>{
    matrix.compose(f.center,f.q,V(f.size,f.size,f.size));
    blossoms.setMatrixAt(i,matrix);anthers.setMatrixAt(i,matrix);buds.setMatrixAt(i,matrix);
    blossoms.setColorAt(i,new T.Color().setHSL(f.hue,.30,.80+rand()*.16));
  });
  for(const mesh of [blossoms,anthers,buds]){mesh.frustumCulled=false;tree.add(mesh)}

  // A quiet round stage and contact shadow ground the tree in three dimensions.
  const island=new T.Mesh(new T.CylinderGeometry(2.75,2.85,.12,96),
    new T.MeshStandardMaterial({color:0x573340,roughness:.85,metalness:.1}));
  island.position.y=-.10;scene.add(island);
  const haloMaterial=new T.ShaderMaterial({
    transparent:true,depthWrite:false,uniforms,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 vUv;void main(){float r=length(vUv-.5)*2.;float a=exp(-r*r*4.)*.52;gl_FragColor=vec4(.025,.008,.014,a);}`
  });
  const shadow=new T.Mesh(new T.PlaneGeometry(5.5,5.5),haloMaterial);
  shadow.rotation.x=-Math.PI/2;shadow.position.y=-.025;scene.add(shadow);
  for(const r of [2.75,3.05]){
    const ring=new T.Mesh(new T.TorusGeometry(r,.009,5,160),new T.MeshBasicMaterial({
      color:0xefb79e,transparent:true,opacity:r<3?.55:.16
    }));
    ring.rotation.x=Math.PI/2;ring.position.y=-.02;scene.add(ring);
  }
  const starCount=mobile?220:430,starPos=[],starMeta=[];
  for(let i=0;i<starCount;i++){
    const angle=rand()*Math.PI*2,r=1.4+rand()*3.2;
    starPos.push(Math.cos(angle)*r,rand()*6,Math.sin(angle)*r);
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
        p.y=mod(p.y+uTime*.12,6.);
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
  }),36);
  const fallSeeds=Array.from({length:36},()=>[rand()*Math.PI*2,rand()*5,rand()]);
  falling.frustumCulled=false;scene.add(falling);

  const INTRO=1.8,DURATION=23,SETTLE=1.2,END=INTRO+DURATION+SETTLE;
  let elapsed=0,lastTime=performance.now(),paused=false,finished=false,failed=false,raf=0,lastUI=-1;
  let orbitOffset=0,pointer=null,lastBurst=-100;
  function resize(){
    camera.aspect=innerWidth/innerHeight;
    if(innerWidth>=900)camera.setViewOffset(innerWidth,innerHeight,innerWidth*.13,0,innerWidth,innerHeight);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
  }
  function render(){
    const progress=Math.max(0,Math.min(1,(elapsed-INTRO)/(DURATION+SETTLE)));
    const growth=Math.max(0,Math.min(1,(elapsed-INTRO)/DURATION));
    const turn=smooth(Math.min(1,(elapsed-INTRO)/DURATION));
    const angle=.65+turn*Math.PI*2+orbitOffset;
    const radius=innerWidth<768?Math.max(15.8,7.0/camera.aspect):10.8;
    camera.position.set(Math.sin(angle)*radius,3.4+Math.sin(turn*Math.PI)*1.2,Math.cos(angle)*radius);
    camera.lookAt(0,2.45,0);camera.updateMatrixWorld();
    clock.value=reduced.matches?0:elapsed;
    bloom.value=growth;
    burstPower.value=reduced.matches?0:Math.max(0,1-(elapsed-lastBurst)/2);
    tree.rotation.z=reduced.matches?0:Math.sin(elapsed*.45)*.003;
    const fallAmount=smooth((growth-.55)/.3);
    for(let i=0;i<fallSeeds.length;i++){
      const [a,phase,s]=fallSeeds[i],t=clock.value;
      dummy.position.set(Math.sin(a+t*.13)*(1.7+s),5.2-((phase+t*.22)%5),Math.cos(a+t*.09)*(1.7+s));
      dummy.rotation.set(t*.65+a,a+t*.25,t*.4+phase);
      dummy.scale.setScalar((.18+s*.18)*fallAmount);dummy.updateMatrix();falling.setMatrixAt(i,dummy.matrix);
    }
    falling.instanceMatrix.needsUpdate=true;
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

// Photographic plant cutouts in a spatial meadow: rooted growth, wind and camera parallax.
export async function createPeachGarden({reduced,onReady,onProgress,onFallback,onTouch}){
  const T=await import('./assets/three.module.min.js');
  const host=document.getElementById('scene'),mobile=innerWidth<768;
  const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.3:1.5));
  renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=T.SRGBColorSpace;
  host.append(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(53,innerWidth/innerHeight,.08,180);
  const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
  let seed=20102026;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10)};
  const time={value:0},bloom={value:0},burstPower={value:0},burstCenter={value:V()};
  const uniforms={uTime:time,uBloom:bloom,uBurst:burstPower,uBurstCenter:burstCenter};
  const loader=new T.TextureLoader();
  const [sky,atlas,grass]=await Promise.all([
    loader.loadAsync('./assets/peach-sunset-glow.webp'),
    loader.loadAsync('./assets/peach-blossom-atlas.webp'),
    loader.loadAsync('./assets/meadow-grass.webp')
  ]);
  for(const texture of [sky,atlas,grass])texture.colorSpace=T.SRGBColorSpace;
  atlas.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  atlas.generateMipmaps=true;
  grass.wrapS=grass.wrapT=T.RepeatWrapping;grass.repeat.set(64,64);
  scene.background=sky;
  const terrainHeight=(x,z)=>Math.sin(x*.08)*.08+Math.sin(z*.10)*.06;
  const terrain=new T.PlaneGeometry(180,200,35,40);terrain.rotateX(-Math.PI/2);
  const tp=terrain.getAttribute('position');
  for(let i=0;i<tp.count;i++)tp.setY(i,terrainHeight(tp.getX(i),tp.getZ(i)));
  const groundMaterial=new T.MeshBasicMaterial({map:grass,color:0x566049,transparent:true,depthWrite:false});
  groundMaterial.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 vGroundPosition;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGroundPosition=position;');
    shader.fragmentShader='varying vec3 vGroundPosition;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      diffuseColor.a*=1.-smoothstep(9.,34.,distance(vGroundPosition,cameraPosition));`);
  };
  const ground=new T.Mesh(terrain,groundMaterial);ground.renderOrder=-2;scene.add(ground);

  // Long, gentle bends keep the horizon stable while nearby flowers pass the lens.
  const flightPath=new T.CatmullRomCurve3([
    V(-1,0,33),V(2.5,0,22),V(-2.5,0,10),V(2,0,-3),V(-1.5,0,-16),V(0,0,-30)
  ],false,'centripetal');
  const travelAt=t=>{t=clamp(t);return t-Math.sin(t*Math.PI*2)/(Math.PI*2)};
  function timeAtTravel(u){
    let lo=0,hi=1;
    for(let i=0;i<14;i++){const mid=(lo+hi)/2;if(travelAt(mid)<u)lo=mid;else hi=mid}
    return (lo+hi)/2;
  }
  const samples=Array.from({length:161},(_,i)=>({point:flightPath.getPointAt(i/160),u:i/160}));
  const plants=[];
  const spacing=mobile?.64:.54;
  for(let z=-67;z<48;z+=spacing)for(let x=-23;x<23;x+=spacing){
    const px=x+(rand()-.5)*spacing*.9,pz=z+(rand()-.5)*spacing*.9;
    let distance=Infinity,nearest=0;
    for(const sample of samples){
      const d=Math.hypot(px-sample.point.x,pz-sample.point.z);
      if(d<distance){distance=d;nearest=sample.u}
    }
    const low=distance<.65;
    const h=low?.64+rand()*.36:.95+rand()*.80;
    const start=pz>31?-.12:Math.min(.80,timeAtTravel(nearest)-.19);
    plants.push({x:px,z:pz,h,w:h*(.43+rand()*.12),start,
      variant:[0,0,1,1,1,2,3,3][Math.floor(rand()*8)],phase:rand()*6.28,tone:.83+rand()*.17});
  }
  const geometry=new T.PlaneGeometry(1,1,1,7);geometry.translate(0,.47,0);
  const attr=(key,values)=>geometry.setAttribute(key,new T.InstancedBufferAttribute(new Float32Array(values),1));
  attr('aStart',plants.map(p=>p.start));attr('aVariant',plants.map(p=>p.variant));attr('aPhase',plants.map(p=>p.phase));
  const material=new T.MeshBasicMaterial({map:atlas,side:T.DoubleSide,alphaTest:.14,alphaToCoverage:true});
  material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms);
    shader.vertexShader=`
      attribute float aStart,aVariant,aPhase;
      uniform float uTime,uBloom;
      varying float vDistance;
    `+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
      vMapUv.x=(vMapUv.x+aVariant)*.25;`);
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`
      vec3 root=instanceMatrix[3].xyz;
      float grow=smoothstep(0.,1.,(uBloom-aStart)/.12);
      float height=length(instanceMatrix[1].xyz);
      float width=length(instanceMatrix[0].xyz);
      vec3 right=normalize(vec3(cameraPosition.z-root.z,0.,root.x-cameraPosition.x));
      float bend=pow(max(0.,position.y),1.8);
      float wind=sin(uTime*.85+aPhase+root.z*.19)*.07+sin(uTime*1.6+aPhase)*.018;
      vec3 plant=root+right*(position.x*width*grow+wind*bend*grow);
      plant.y+=position.y*height*grow;
      plant.z+=sin(aPhase+uTime*.6)*.035*bend*grow;
      vec4 mvPosition=modelViewMatrix*vec4(plant,1.);
      vDistance=-mvPosition.z;
      gl_Position=projectionMatrix*mvPosition;`);
    shader.fragmentShader='varying float vDistance;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`#include <alphatest_fragment>
      float fogFade=1.-smoothstep(19.,43.,vDistance);
      float noise=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
      if(noise>fogFade)discard;
    `);
  };
  material.customProgramCacheKey=()=> 'photographic-peach-v2';
  const field=new T.InstancedMesh(geometry,material,plants.length),dummy=new T.Object3D();
  plants.forEach((p,i)=>{
    dummy.position.set(p.x,terrainHeight(p.x,p.z),p.z);dummy.scale.set(p.w,p.h,1);dummy.updateMatrix();
    field.setMatrixAt(i,dummy.matrix);
    field.setColorAt(i,new T.Color(p.tone,p.tone*.99,p.tone*.98));
  });
  field.frustumCulled=false;scene.add(field);

  // Camera-relative wrapping keeps the entire journey surrounded by gentle glints.
  const starPos=[],starMeta=[],starCount=mobile?750:1250;
  for(let i=0;i<starCount;i++){
    starPos.push((rand()-.5)*36,.25+rand()*5.2,(rand()-.5)*40);
    starMeta.push(rand()*6.28,1.5+rand()*3.5,rand());
  }
  const starsGeometry=new T.BufferGeometry();
  starsGeometry.setAttribute('position',new T.Float32BufferAttribute(starPos,3));
  starsGeometry.setAttribute('aMeta',new T.Float32BufferAttribute(starMeta,3));
  const stars=new T.Points(starsGeometry,new T.ShaderMaterial({
    uniforms,transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:`
      attribute vec3 aMeta;uniform float uTime,uBurst,uBloom;varying float vAlpha,vHue,vSoft;
      void main(){
        vec3 p=position;
        p.x=mod(p.x-cameraPosition.x+18.,36.)-18.+cameraPosition.x;
        p.z=mod(p.z-cameraPosition.z+20.,40.)-20.+cameraPosition.z;
        p.x+=sin(uTime*.24+aMeta.x)*.28;p.y+=sin(uTime*.37+aMeta.x)*.19;
        vec4 view=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*view;
        float twinkle=pow(.5+.5*sin(uTime*1.25+aMeta.x),2.);
        vSoft=step(.86,aMeta.z);vHue=aMeta.z;
        gl_PointSize=clamp(aMeta.y*(1.+uBurst*.5)*(1.+vSoft*1.8)*34./max(1.,-view.z),2.,35.);
        vAlpha=(.24+twinkle*.76)*(.45+.55*uBloom)*(1.+uBurst*.5)*(1.-smoothstep(8.,24.,-view.z));
      }`,
    fragmentShader:`
      varying float vAlpha,vHue,vSoft;
      void main(){
        vec2 p=gl_PointCoord-.5;float r=length(p);
        float halo=exp(-r*r*23.)*.35;
        float core=exp(-r*r*150.);
        float rays=exp(-abs(p.x)*70.-abs(p.y)*8.)+exp(-abs(p.y)*70.-abs(p.x)*8.);
        float a=mix(halo+core+rays*.44,exp(-r*r*18.)*.18,vSoft)*vAlpha*(1.-smoothstep(.35,.5,r));
        vec3 tint=mix(vec3(1.,.76,.34),vec3(1.,.64,.83),vHue);
        gl_FragColor=vec4(mix(tint,vec3(1.,.95,.82),core),a);
      }
    `
  }));
  stars.frustumCulled=false;scene.add(stars);

  // A short, localized shower of starlight follows a tap or the sparkle button.
  const sparksPos=[],sparkMeta=[],sparkCount=mobile?100:180;
  for(let i=0;i<sparkCount;i++){
    const a=rand()*Math.PI*2,r=.3+rand()*.9;
    sparksPos.push(Math.cos(a)*r,(rand()-.35)*1.5,Math.sin(a)*r);
    sparkMeta.push(rand(),rand());
  }
  const sparkGeometry=new T.BufferGeometry();
  sparkGeometry.setAttribute('position',new T.Float32BufferAttribute(sparksPos,3));
  sparkGeometry.setAttribute('aMeta',new T.Float32BufferAttribute(sparkMeta,2));
  const sparks=new T.Points(sparkGeometry,new T.ShaderMaterial({
    uniforms,transparent:true,depthWrite:false,depthTest:false,blending:T.AdditiveBlending,
    vertexShader:`
      attribute vec2 aMeta;uniform vec3 uBurstCenter;uniform float uBurst;varying float vAlpha,vHue;
      void main(){
        float age=1.-uBurst;
        vec3 p=uBurstCenter+position*(.35+age*2.8);p.y-=age*age*.55;
        vec4 view=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*view;
        gl_PointSize=clamp((2.+aMeta.x*4.)*12./max(1.,-view.z),2.,24.);
        vAlpha=.70*uBurst*uBurst*smoothstep(0.,.08,age);vHue=aMeta.y;
      }`,
    fragmentShader:`
      varying float vAlpha,vHue;
      void main(){
        vec2 p=gl_PointCoord-.5;
        float a=exp(-dot(p,p)*28.)+exp(-abs(p.x)*65.-abs(p.y)*9.)+exp(-abs(p.y)*65.-abs(p.x)*9.);
        gl_FragColor=vec4(mix(vec3(1.,.83,.45),vec3(1.,.66,.82),vHue),a*vAlpha);
      }`
  }));
  sparks.frustumCulled=false;sparks.renderOrder=3;scene.add(sparks);

  const petalShape=new T.Shape();
  petalShape.moveTo(0,-.5);
  petalShape.bezierCurveTo(-.55,-.13,-.43,.43,-.10,.49);
  petalShape.quadraticCurveTo(0,.42,.10,.49);
  petalShape.bezierCurveTo(.43,.43,.55,-.13,0,-.5);
  const petalGeometry=new T.ShapeGeometry(petalShape,5);
  const petalVertices=petalGeometry.getAttribute('position');
  for(let i=0;i<petalVertices.count;i++)petalVertices.setZ(i,.17*Math.pow(petalVertices.getX(i),2));
  const petalCount=mobile?70:130;
  const petals=new T.InstancedMesh(petalGeometry,new T.MeshBasicMaterial({
    color:0xffb8d1,side:T.DoubleSide,transparent:true,opacity:.86,depthWrite:false
  }),petalCount);
  const petalSeeds=Array.from({length:petalCount},()=>({x:(rand()-.5)*22,z:(rand()-.5)*26,phase:rand()*8,size:.045+rand()*.055}));
  petals.frustumCulled=false;scene.add(petals);
  const INTRO=1.8,DURATION=28,SETTLE=2,END=INTRO+DURATION+SETTLE;
  let elapsed=0,lastTime=performance.now(),paused=false,finished=false,failed=false,raf=0,lastUI=-1;
  let orbitOffset=0,pointer=null,lastBurst=-100;
  function resize(){
    camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
    const aspect=sky.image.width/sky.image.height,view=innerWidth/innerHeight;
    if(view<aspect){sky.repeat.set(view/aspect,1);sky.offset.set(Math.max(0,.20-sky.repeat.x*.17),0)}
    else{sky.repeat.set(1,aspect/view);sky.offset.set(0,(1-sky.repeat.y)*.5)}
    sky.updateMatrix();
  }
  function render(){
    const growth=clamp((elapsed-INTRO)/DURATION),progress=clamp((elapsed-INTRO)/(DURATION+SETTLE));
    const travel=travelAt(growth),eye=flightPath.getPointAt(travel);
    const ahead=flightPath.getPointAt(Math.min(1,travel+.12));
    let direction=ahead.clone().sub(eye);
    if(direction.lengthSq()<.0001)direction=flightPath.getTangentAt(1);
    direction.normalize().applyAxisAngle(V(0,1,0),orbitOffset);
    const clearance=1.10+smooth((growth-.88)/.12)*.22;
    camera.position.set(eye.x,terrainHeight(eye.x,eye.z)+clearance,eye.z);
    const look=eye.clone().addScaledVector(direction,8);
    camera.lookAt(look.x,camera.position.y+.15,look.z);camera.updateMatrixWorld();
    time.value=reduced.matches?0:elapsed;bloom.value=growth;
    burstPower.value=reduced.matches?0:Math.max(0,1-(elapsed-lastBurst)/2.6);
    sparks.visible=burstPower.value>0;
    const petalAmount=smooth(growth/.20);
    petalSeeds.forEach((p,i)=>{
      const t=time.value;
      const x=((p.x-camera.position.x+11+t*.10)%22+22)%22-11+camera.position.x;
      const z=((p.z-camera.position.z+13)%26+26)%26-13+camera.position.z;
      dummy.position.set(x+Math.sin(t*.45+p.phase)*.25,4.4-((p.phase+t*.24)%4.3),z);
      dummy.rotation.set(p.phase+t*.45,Math.sin(t*.3+p.phase)*1.2,t*.27+p.phase);
      dummy.scale.setScalar(p.size*petalAmount);dummy.updateMatrix();petals.setMatrixAt(i,dummy.matrix);
    });
    petals.instanceMatrix.needsUpdate=true;
    renderer.render(scene,camera);
    const percent=Math.round(progress*100);
    if(percent!==lastUI){lastUI=percent;onProgress(progress)}
  }
  function schedule(){if(!raf&&!paused&&!failed&&!document.hidden&&!reduced.matches)raf=requestAnimationFrame(frame)}
  function frame(now){
    raf=0;if(paused||failed||document.hidden)return;
    elapsed+=Math.min(.08,(now-lastTime)/1000);lastTime=now;render();
    if(elapsed>=END&&!finished){finished=true;onReady()}schedule();
  }
  function finish(){elapsed=END;finished=true;render();onReady()}
  function replay(){elapsed=0;finished=false;paused=false;orbitOffset=0;lastBurst=-100;lastUI=-1;lastTime=performance.now();render();if(reduced.matches)finish();else schedule()}
  function setPaused(value){paused=value;lastTime=performance.now();if(paused){cancelAnimationFrame(raf);raf=0}else schedule()}
  function burst(event){
    if(event&&Number.isFinite(event.clientX)){
      const rect=renderer.domElement.getBoundingClientRect();
      const ray=V((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2,.5).unproject(camera).sub(camera.position).normalize();
      burstCenter.value.copy(camera.position).addScaledVector(ray,3.8);
    }else burstCenter.value.copy(camera.position).addScaledVector(camera.getWorldDirection(V()),3.8);
    lastBurst=elapsed;render();schedule();
  }
  function setMotionPreference(){cancelAnimationFrame(raf);raf=0;if(reduced.matches)finish();else{lastTime=performance.now();schedule()}}
  const canvas=renderer.domElement;
  canvas.addEventListener('pointerdown',event=>{pointer={id:event.pointerId,x:event.clientX,moved:0};canvas.setPointerCapture(event.pointerId)});
  canvas.addEventListener('pointermove',event=>{
    if(!pointer||event.pointerId!==pointer.id)return;
    const dx=event.clientX-pointer.x;pointer.x=event.clientX;pointer.moved+=Math.abs(dx);
    orbitOffset=Math.max(-.38,Math.min(.38,orbitOffset-dx*.0025));if(paused||reduced.matches)render();
  });
  canvas.addEventListener('pointerup',event=>{
    if(!pointer||event.pointerId!==pointer.id)return;
    if(pointer.moved<8){burst(event);onTouch?.()}pointer=null;
  });
  canvas.addEventListener('pointercancel',()=>{pointer=null});
  window.addEventListener('resize',()=>{resize();render()});
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;lastTime=performance.now();schedule()});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();failed=true;cancelAnimationFrame(raf);raf=0;onFallback()});
  resize();render();
  return{finish,replay,setPaused,setMotionPreference,burst,start(){lastTime=performance.now();if(reduced.matches)finish();else schedule()}};
}

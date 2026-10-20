// Photographic plants in world space: the camera travels through the meadow.
export async function createPhotographicGarden({reduced,onReady,onProgress,onFallback}){
  const THREE=await import('./assets/three.module.min.js');
  const container=document.getElementById('scene');
  const mobile=innerWidth<768;
  const renderer=new THREE.WebGLRenderer({antialias:false,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.35:1.65));
  renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.setClearColor(0x677b3b,1);
  container.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden','true');
  const loader=new THREE.TextureLoader();
  let textures;
  try{
    textures=await Promise.all(['meadow-empty.webp','cosmos-atlas.webp','meadow-grass.webp'].map(name=>loader.loadAsync('./assets/'+name)));
  }catch(error){renderer.dispose();renderer.domElement.remove();throw error}
  textures.forEach(texture=>{
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  });
  const [empty,atlas,grass]=textures;
  grass.wrapS=grass.wrapT=THREE.MirroredRepeatWrapping;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(57,innerWidth/innerHeight,.15,110);
  const uniforms={
    uTime:{value:0},uArrival:{value:0},uOpening:{value:0},
    uCamera:{value:new THREE.Vector3()},uRight:{value:new THREE.Vector3(1,0,0)},
    uYaw:{value:0},uAspect:{value:innerWidth/innerHeight},
    uImageAspect:{value:empty.image.width/empty.image.height},
    uEmpty:{value:empty},uAtlas:{value:atlas},uGrass:{value:grass}
  };
  const landscapeMaterial=new THREE.ShaderMaterial({
    uniforms,depthTest:false,depthWrite:false,
    vertexShader:`
      varying vec2 vUv;
      void main(){vUv=uv;gl_Position=vec4(position.xy,.999,1.);}
    `,
    fragmentShader:`
      uniform sampler2D uEmpty;
      uniform float uAspect,uImageAspect,uYaw;
      varying vec2 vUv;
      void main(){
        vec2 cover=vec2(min(1.,uAspect/uImageAspect),min(1.,uImageAspect/uAspect));
        vec2 uv=(vUv-.5)*cover/1.08+.5;
        uv.x+=uYaw*.08;
        gl_FragColor=texture2D(uEmpty,uv);
        #include <colorspace_fragment>
      }
    `
  });
  const landscape=new THREE.Mesh(new THREE.PlaneGeometry(2,2),landscapeMaterial);
  landscape.frustumCulled=false;landscape.renderOrder=-2;scene.add(landscape);

  // An overhead grass texture keeps the ground detailed as the camera passes over it.
  const groundMaterial=new THREE.ShaderMaterial({
    uniforms,transparent:true,depthWrite:false,
    vertexShader:`
      varying vec3 vWorld;
      void main(){vWorld=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
    `,
    fragmentShader:`
      uniform sampler2D uGrass;uniform vec3 uCamera;
      varying vec3 vWorld;
      void main(){
        vec2 a=vWorld.xz*.32;
        vec2 b=mat2(.8,.6,-.6,.8)*vWorld.xz*.51+vec2(.37,.81);
        vec3 grass=texture2D(uGrass,a).rgb;
        vec3 detail=texture2D(uGrass,b).rgb;
        grass=mix(grass,detail,.3)*vec3(.72,.75,.62);
        float d=length(vWorld.xz-uCamera.xz);
        grass=mix(grass,vec3(.19,.24,.095),smoothstep(12.,70.,d)*.45);
        gl_FragColor=vec4(grass,1.-smoothstep(38.,85.,d));
        #include <colorspace_fragment>
      }
    `
  });
  const groundGeometry=new THREE.PlaneGeometry(240,300);
  groundGeometry.rotateX(-Math.PI/2);groundGeometry.translate(0,-.04,-90);
  const ground=new THREE.Mesh(groundGeometry,groundMaterial);
  ground.renderOrder=-1;scene.add(ground);

  const path=x=>3.5*Math.sin(x*.037)+1.1*Math.sin(x*.079);
  let seed=20102028;
  const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296};
  const geometry=new THREE.InstancedBufferGeometry();
  const plane=new THREE.PlaneGeometry(1,1,1,12);
  geometry.index=plane.index;geometry.attributes.position=plane.attributes.position;geometry.attributes.uv=plane.attributes.uv;
  const bases=[],sizes=[],parameters=[],colors=[];
  const rowSpacing=mobile?.95:.73,columnSpacing=mobile?1.05:.82;
  // Far-to-near instance order keeps transparent foliage correctly layered.
  for(let z=-168;z<7;z+=rowSpacing){
    for(let x=-27;x<27;x+=columnSpacing){
      const worldZ=z+(random()-.5)*rowSpacing*.85;
      const worldX=x+(random()-.5)*columnSpacing*.9;
      const fromPath=Math.abs(worldX-path(-worldZ));
      let height=1.6+random()*1.1;
      // Low foliage in a narrow, winding corridor lets near flowers pass on both sides.
      height*=.23+.77*Math.min(1,Math.max(0,(fromPath-.5)/1.45));
      bases.push(worldX,worldZ);
      sizes.push(height*(atlas.image.width/4/atlas.image.height)*(1.04+random()*.24),height);
      parameters.push(Math.floor(random()*4),random()*Math.PI*2,random()*4,random()>.5?1:-1);
      const shade=.81+random()*.18;
      colors.push(shade,shade*.99,shade*.94);
    }
  }
  geometry.instanceCount=bases.length/2;
  geometry.setAttribute('aBase',new THREE.InstancedBufferAttribute(new Float32Array(bases),2));
  geometry.setAttribute('aSize',new THREE.InstancedBufferAttribute(new Float32Array(sizes),2));
  geometry.setAttribute('aParams',new THREE.InstancedBufferAttribute(new Float32Array(parameters),4));
  geometry.setAttribute('aColor',new THREE.InstancedBufferAttribute(new Float32Array(colors),3));
  const flowerMaterial=new THREE.ShaderMaterial({
    uniforms,transparent:true,depthWrite:false,
    vertexShader:`
      attribute vec2 aBase,aSize;attribute vec4 aParams;attribute vec3 aColor;
      uniform vec3 uCamera,uRight;
      uniform float uTime,uArrival,uOpening;
      varying vec2 vUv;varying vec3 vColor;varying float vGrow,vDepth;
      float smoother(float t){t=clamp(t,0.,1.);return t*t*t*(t*(t*6.-15.)+10.);}
      void main(){
        float ahead=uCamera.z-aBase.y;
        // Arrival of the camera, rather than a global timer, wakes each patch.
        float grow=smoother((28.+uArrival*30.-ahead-aParams.z)/17.)*uOpening;
        vec3 root=vec3(aBase.x,0.,aBase.y);
        float y=uv.y;
        float wind=(sin(uTime*.8+aParams.y)+.4*sin(uTime*.43+aParams.y*1.7))*.045;
        root+=uRight*(position.x*aSize.x*(.65+.35*grow)+wind*y*y*grow);
        root.y=y*aSize.y*(.12+.88*grow);
        vec4 view=modelViewMatrix*vec4(root,1.);
        gl_Position=projectionMatrix*view;
        if(ahead<-.8||ahead>88.)gl_Position=vec4(2.,2.,2.,1.);
        float tileU=mix(uv.x,1.-uv.x,step(aParams.w,0.));
        vUv=vec2((clamp(tileU,.005,.995)+aParams.x)/4.,y);
        vColor=aColor;vGrow=grow;vDepth=-view.z;
      }
    `,
    fragmentShader:`
      uniform sampler2D uAtlas;
      varying vec2 vUv;varying vec3 vColor;varying float vGrow,vDepth;
      void main(){
        vec4 plant=texture2D(uAtlas,vUv);
        float petal=max(smoothstep(.025,.15,plant.r-plant.g),smoothstep(.025,.15,plant.b-plant.g));
        petal=max(petal,smoothstep(.13,.5,plant.r)*smoothstep(.08,.3,plant.g)*(1.-smoothstep(.06,.25,plant.b)));
        float bloom=mix(.7,1.,vGrow)*mix(1.,smoothstep(.35,.90,vGrow),petal);
        float alpha=plant.a*bloom*smoothstep(.025,.14,vUv.y)*(1.-smoothstep(65.,87.,vDepth));
        if(alpha<.035)discard;
        vec3 color=plant.rgb*vColor;
        color=mix(color,vec3(.23,.28,.13),smoothstep(12.,78.,vDepth)*.48);
        gl_FragColor=vec4(color,alpha);
        #include <colorspace_fragment>
      }
    `
  });
  const flowers=new THREE.Mesh(geometry,flowerMaterial);
  flowers.frustumCulled=false;scene.add(flowers);

  const INTRO=2.4,DURATION=30,SETTLE=2.6,DISTANCE=108;
  let elapsed=0,lastTime=performance.now(),paused=false,finished=false,failed=false,raf=0,lastUI=-1;
  const clamp=value=>Math.max(0,Math.min(1,value));
  const smoother=t=>{t=clamp(t);return t*t*t*(t*(t*6-15)+10)};
  // Integrate cosine acceleration at each end, with a steady cruise in between.
  function travel(t){
    const ramp=.14;
    const start=x=>(x/2-ramp*Math.sin(Math.PI*x/ramp)/(2*Math.PI))/(1-ramp);
    if(t<ramp)return start(t);
    if(t>1-ramp)return 1-start(1-t);
    return (t-ramp/2)/(1-ramp);
  }
  function render(){
    const moving=clamp((elapsed-INTRO)/DURATION);
    const progress=clamp((elapsed-INTRO)/(DURATION+SETTLE));
    const distance=travel(moving)*DISTANCE;
    const arrival=smoother((elapsed-INTRO-DURATION)/SETTLE);
    const lift=smoother((moving-.78)/.22);
    const x=path(distance),y=2.45+lift*.7;
    camera.position.set(x,y,-distance);
    camera.lookAt(path(distance+10),y-.62,-distance-10);
    camera.updateMatrixWorld();
    uniforms.uCamera.value.copy(camera.position);
    uniforms.uRight.value.setFromMatrixColumn(camera.matrixWorld,0);
    uniforms.uYaw.value=(path(distance+10)-x)/10;
    uniforms.uTime.value=reduced.matches?0:elapsed;
    uniforms.uOpening.value=smoother((elapsed-.6)/3.6);
    uniforms.uArrival.value=arrival;
    renderer.render(scene,camera);
    const value=Math.round(progress*100);
    if(value!==lastUI){lastUI=value;onProgress(progress)}
  }
  function schedule(){if(!raf&&!failed&&!paused&&!document.hidden&&!reduced.matches)raf=requestAnimationFrame(frame)}
  function frame(now){
    raf=0;
    if(failed||paused||document.hidden)return;
    elapsed+=Math.min(.1,(now-lastTime)/1000);lastTime=now;
    render();
    if(elapsed>=INTRO+DURATION+SETTLE&&!finished){finished=true;onReady()}
    schedule();
  }
  function finish(){elapsed=INTRO+DURATION+SETTLE;finished=true;render();onReady()}
  function replay(){
    elapsed=0;finished=false;lastUI=-1;paused=false;lastTime=performance.now();
    render();if(reduced.matches)finish();else schedule();
  }
  function setPaused(value){
    paused=value;lastTime=performance.now();
    if(paused){cancelAnimationFrame(raf);raf=0}else schedule();
  }
  document.addEventListener('visibilitychange',()=>{
    cancelAnimationFrame(raf);raf=0;lastTime=performance.now();schedule();
  });
  window.addEventListener('resize',()=>{
    camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
    uniforms.uAspect.value=camera.aspect;renderer.setSize(innerWidth,innerHeight);render();
  });
  function setMotionPreference(){
    cancelAnimationFrame(raf);raf=0;
    if(reduced.matches)finish();else{lastTime=performance.now();schedule()}
  }
  renderer.domElement.addEventListener('webglcontextlost',event=>{
    event.preventDefault();failed=true;cancelAnimationFrame(raf);raf=0;onFallback();
  });
  render();
  return{finish,replay,setPaused,setMotionPreference,start(){lastTime=performance.now();if(reduced.matches)finish();else schedule()}};
}

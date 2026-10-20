// Photographic layers keep the reference's detail; GPU animation grows and bends the plants.
export async function createPhotographicGarden({reduced,onReady,onProgress,onFallback}){
  const THREE=await import('./assets/three.module.min.js');
  const container=document.getElementById('scene');
  const mobile=innerWidth<768;
  const renderer=new THREE.WebGLRenderer({antialias:false,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.5:1.8));
  renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.setClearColor(0x4b5130,1);
  container.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden','true');
  const loader=new THREE.TextureLoader();
  let textures;
  try{
    textures=await Promise.all(['meadow-empty.webp','meadow-real.webp','cosmos-atlas.webp'].map(name=>loader.loadAsync('./assets/'+name)));
  }catch(error){renderer.dispose();renderer.domElement.remove();throw error}
  textures.forEach(texture=>{
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  });
  const [empty,full,atlas]=textures;
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,20);camera.position.z=5;
  const uniforms={
    uTime:{value:0},uProgress:{value:0},uTravel:{value:0},
    uAspect:{value:innerWidth/innerHeight},uImageAspect:{value:full.image.width/full.image.height},
    uEmpty:{value:empty},uFull:{value:full},uAtlas:{value:atlas}
  };
  const landscapeMaterial=new THREE.ShaderMaterial({
    uniforms,depthTest:false,depthWrite:false,
    vertexShader:`
      varying vec2 vUv;
      void main(){vUv=uv;gl_Position=vec4(position.xy,0.99,1.0);}
    `,
    fragmentShader:`
      uniform sampler2D uEmpty,uFull;
      uniform float uTime,uProgress,uTravel,uAspect,uImageAspect;
      varying vec2 vUv;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){
        vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
      }
      void main(){
        vec2 cover=vec2(min(1.0,uAspect/uImageAspect),min(1.0,uImageAspect/uAspect));
        vec2 uv=(vUv-.5)*cover/(1.035+uTravel*.055)+.5;
        float depth=1.0-smoothstep(.0,.57,uv.y);
        uv.x+=(-.006+uTravel*.014)*(1.0+depth*.65);
        uv.y+=uTravel*.004;
        // Very small wind distortion stays in the meadow, below the mountain line.
        float windMask=1.0-smoothstep(.46,.57,uv.y);
        uv.x+=sin(uTime*.65+uv.y*16.0+uv.x*7.0)*.00045*windMask*uProgress;
        vec4 grass=texture2D(uEmpty,uv);
        vec4 flowers=texture2D(uFull,uv);
        float delay=.08+smoothstep(.0,.65,uv.y)*.43+noise(uv*vec2(22,17))*.09;
        float reveal=smoothstep(delay,delay+.32,uProgress);
        // The unchanged sky stays still; taller flowers on the right reveal with the last layer.
        gl_FragColor=mix(grass,flowers,reveal);
        #include <colorspace_fragment>
      }
    `
  });
  const landscape=new THREE.Mesh(new THREE.PlaneGeometry(2,2),landscapeMaterial);
  landscape.frustumCulled=false;landscape.renderOrder=-1;scene.add(landscape);

  let seed=20102027;
  const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296};
  const geometry=new THREE.InstancedBufferGeometry();
  const plane=new THREE.PlaneGeometry(1,1,3,16);
  geometry.index=plane.index;geometry.attributes.position=plane.attributes.position;geometry.attributes.uv=plane.attributes.uv;
  const bases=[],sizes=[],parameters=[],colors=[];
  const count=mobile?38:76;
  for(let i=0;i<count;i++){
    const depth=i/(count-1);
    const ground=.30-depth*.46+(random()-.5)*.04;
    const height=(.14+depth*.40)*(.88+random()*.23);
    const x=-.10+random()*1.20;
    bases.push(x,ground);
    sizes.push(height*(atlas.image.width/4/atlas.image.height),height);
    parameters.push(Math.floor(random()*4),random()*Math.PI*2,.17-depth*.13+random()*.06,random()>.5?1:-1);
    const shade=.82+random()*.17;
    colors.push(shade,shade*.99,shade*.95);
  }
  geometry.instanceCount=count;
  geometry.setAttribute('aBase',new THREE.InstancedBufferAttribute(new Float32Array(bases),2));
  geometry.setAttribute('aSize',new THREE.InstancedBufferAttribute(new Float32Array(sizes),2));
  geometry.setAttribute('aParams',new THREE.InstancedBufferAttribute(new Float32Array(parameters),4));
  geometry.setAttribute('aColor',new THREE.InstancedBufferAttribute(new Float32Array(colors),3));
  const flowerMaterial=new THREE.ShaderMaterial({
    uniforms,transparent:true,depthTest:false,depthWrite:false,
    vertexShader:`
      attribute vec2 aBase,aSize;
      attribute vec4 aParams;
      attribute vec3 aColor;
      uniform float uTime,uProgress,uTravel,uAspect;
      varying vec2 vUv;varying vec3 vColor;varying float vGrow;varying float vLeafFade;
      float smoother(float t){t=clamp(t,0.0,1.0);return t*t*t*(t*(t*6.0-15.0)+10.0);}
      void main(){
        float grow=smoother((uProgress-aParams.z)/.28);
        float y=uv.y;
        float wind=sin(uTime*.65+aParams.y)*.004+sin(uTime*.37+aParams.y*1.7)*.002;
        float depth=clamp((aSize.y-.14)/.40,0.,1.);
        float travelScale=1.035+uTravel*(.055+depth*.04);
        vec2 base=(aBase-.5)*travelScale+.5;
        base.x-=(-.006+uTravel*.014)*(1.+depth*1.6);
        base.y-=uTravel*.007*depth;
        float width=aSize.x/uAspect*travelScale*(.65+.35*grow);
        float x=base.x+position.x*width+wind*y*y*grow*(.5+depth)*.7/uAspect;
        float yy=base.y+y*aSize.y*grow*travelScale;
        gl_Position=vec4(x*2.-1.,yy*2.-1.,0.,1.);
        float tileU=mix(uv.x,1.-uv.x,step(aParams.w,0.));
        vUv=vec2((clamp(tileU,.005,.995)+aParams.x)/4.,uv.y);
        vColor=aColor;vGrow=grow;vLeafFade=smoothstep(0.,.16,grow);
      }
    `,
    fragmentShader:`
      uniform sampler2D uAtlas;
      varying vec2 vUv;varying vec3 vColor;varying float vGrow;varying float vLeafFade;
      void main(){
        vec4 plant=texture2D(uAtlas,vUv);
        float petal=max(smoothstep(.025,.15,plant.r-plant.g),smoothstep(.025,.15,plant.b-plant.g));
        petal=max(petal,smoothstep(.13,.5,plant.r)*smoothstep(.08,.3,plant.g)*(1.-smoothstep(.06,.25,plant.b)));
        float bloom=mix(1.,smoothstep(.40,.90,vGrow),petal);
        float alpha=plant.a*vLeafFade*bloom;
        alpha*=smoothstep(.025,.14,vUv.y);
        if(alpha<.035)discard;
        gl_FragColor=vec4(plant.rgb*vColor,alpha);
        #include <colorspace_fragment>
      }
    `
  });
  const foreground=new THREE.Mesh(geometry,flowerMaterial);foreground.frustumCulled=false;scene.add(foreground);
  const INTRO=2.2,DURATION=18;
  let elapsed=0,lastTime=performance.now(),paused=false,finished=false,failed=false,raf=0,lastUI=-1;
  const clamp=value=>Math.max(0,Math.min(1,value));
  const smoother=t=>t*t*t*(t*(t*6-15)+10);
  function render(){
    const progress=clamp((elapsed-INTRO)/DURATION);
    uniforms.uTime.value=reduced.matches?0:elapsed;
    uniforms.uProgress.value=progress;
    uniforms.uTravel.value=smoother(progress);
    renderer.render(scene,camera);
    const value=Math.round(progress*100);
    if(value!==lastUI){lastUI=value;onProgress(progress)}
  }
  function schedule(){if(!raf&&!failed&&!paused&&!document.hidden&&!reduced.matches)raf=requestAnimationFrame(frame)}
  function frame(now){
    raf=0;
    if(failed||paused||document.hidden)return;
    // Time-based motion, without a 30fps geometry update or frame-dependent camera jumps.
    elapsed+=Math.min(.1,(now-lastTime)/1000);lastTime=now;
    render();
    if(elapsed>=INTRO+DURATION&&!finished){finished=true;onReady()}
    schedule();
  }
  function finish(){
    elapsed=INTRO+DURATION;finished=true;render();onReady();
  }
  function replay(){
    elapsed=0;finished=false;lastUI=-1;paused=false;lastTime=performance.now();
    render();
    if(reduced.matches)finish();else schedule();
  }
  function setPaused(value){
    paused=value;lastTime=performance.now();
    if(paused){cancelAnimationFrame(raf);raf=0}else schedule();
  }
  document.addEventListener('visibilitychange',()=>{
    cancelAnimationFrame(raf);raf=0;lastTime=performance.now();schedule();
  });
  window.addEventListener('resize',()=>{
    uniforms.uAspect.value=innerWidth/innerHeight;
    renderer.setSize(innerWidth,innerHeight);render();
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

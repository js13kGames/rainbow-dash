class Color{constructor(h=0xffffff){this.setHex(h)}setHex(h){this.hex=h;return this}css(){return`#${this.hex.toString(16).padStart(6,'0')}`}}
class Vector3{constructor(x=0,y=0,z=0){this.set(x,y,z)}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}}
class Node{constructor(){this.children=[];this.parent=null;this.position=new Vector3();this.rotation=new Vector3();this.scale=new Vector3(1,1,1)}add(...n){n.forEach(c=>{c.parent=this;this.children.push(c)});return this}remove(n){const i=this.children.indexOf(n);if(i>=0)this.children.splice(i,1);n.parent=null}}
class Group extends Node{}
class Scene extends Group{}
class Geometry{constructor(t,a){this.type=t;this.args=a;this.attributes={position:{count:0,getX:()=>0}}}dispose(){}rotateX(){}translate(){}setAttribute(n,v){this.attributes[n]=v}}
class BufferGeometry extends Geometry{constructor(){super('points',[])}}
class Float32BufferAttribute{constructor(a,s){this.array=a;this.count=a.length/s;this.getX=i=>a[i*s]}}
class BufferAttribute extends Float32BufferAttribute{}
class Material{constructor(o={}){Object.assign(this,o);this.color=o.color instanceof Color?o.color:new Color(o.color??0xffffff);this.emissive=o.emissive instanceof Color?o.emissive:new Color(o.emissive??0);this.emissiveIntensity=o.emissiveIntensity??0;this.opacity=o.opacity??1}dispose(){}}
class Mesh extends Node{constructor(g,m){super();this.geometry=g;this.material=m}}
class Points extends Mesh{}
class CanvasTexture{constructor(i){this.image=i;this.needsUpdate=false}}
class PerspectiveCamera extends Node{constructor(f,a){super();this.fov=f;this.aspect=a}lookAt(){}updateProjectionMatrix(){}}
class Clock{constructor(){this.last=performance.now();this.elapsed=0}getDelta(){const n=performance.now(),d=Math.min((n-this.last)/1000,0.1);this.last=n;this.elapsed+=d;return d}getElapsedTime(){return this.elapsed}}

class Renderer{
  constructor(){
    this.domElement=document.createElement('canvas');
    this.ctx=this.domElement.getContext('2d');
    this.xr={enabled:false,isPresenting:false,getController:()=>new Group(),setSession:s=>{this.xr.isPresenting=true;s.addEventListener('end',()=>{this.xr.isPresenting=false})}};
    // Shake state
    this._sI=0;this._sD=0;this._sT=0;
    // Combo for star streaks
    this.combo=0;
    // Active lane for pad highlight
    this.activeLane=1;
    // Lane flash [intensity per lane]
    this._lF=[0,0,0];
    this._lFc=['#ff66cc','#ff66cc','#ff66cc'];
    this._ft=0;this._lft=performance.now();
  }

  triggerShake(intensity,duration){this._sI=intensity;this._sD=duration;this._sT=0}
  triggerLaneFlash(i,color){this._lF[i]=1;this._lFc[i]=color||'#ff66cc'}

  setSize(w,h){this.domElement.width=w;this.domElement.height=h;this.domElement.style.width='100%';this.domElement.style.height='100%'}
  setPixelRatio(){}
  setAnimationLoop(cb){const L=()=>{cb();requestAnimationFrame(L)};requestAnimationFrame(L)}

  render(scene,camera){
    const{ctx,domElement:cv}=this;
    const now=performance.now();
    const dt=Math.min((now-this._lft)/1000,0.05);
    this._lft=now;
    this._ft+=dt;
    const t=this._ft;

    // Shake offset
    let ox=0,oy=0;
    if(this._sD>0){
      this._sT+=dt;
      const dec=Math.max(0,1-this._sT/this._sD);
      ox=Math.sin(this._sT*28)*this._sI*dec;
      oy=Math.cos(this._sT*22)*this._sI*dec;
      if(this._sT>=this._sD)this._sD=0;
    }
    // Decay lane flash
    for(let i=0;i<3;i++) this._lF[i]=Math.max(0,this._lF[i]-dt*3.5);

    ctx.save();
    ctx.translate(ox,oy);

    // Background
    const bg=ctx.createLinearGradient(0,0,0,cv.height);
    bg.addColorStop(0,'#020010');bg.addColorStop(1,'#100520');
    ctx.fillStyle=bg;ctx.fillRect(0,0,cv.width,cv.height);

    this._drawStars(scene,camera,t);
    this._drawRoad(ctx,cv,t);
    this._drawWorld(scene,camera,cv);
    ctx.restore();
  }

  _walk(n,fn){n.children.forEach(c=>{fn(c);this._walk(c,fn)})}

  _proj(n,camera,cv){
    let x=n.position.x,y=n.position.y,z=n.position.z,p=n.parent;
    while(p){x+=p.position.x;y+=p.position.y;z+=p.position.z;p=p.parent}
    const d=Math.max(1,camera.position.z-z);
    const sc=cv.height/(d*1.5);
    return{x:cv.width/2+x*sc,y:cv.height*0.57-(y-1)*sc,scale:sc,z}
  }

  _drawStars(scene,camera,t){
    const{ctx,domElement:cv}=this;
    const streak=Math.min(1,this.combo/8);
    this._walk(scene,n=>{
      if(n.geometry?.type!=='points')return;
      const p=this._proj(n,camera,cv);
      const tw=0.55+0.45*Math.sin(t*2.5+p.x*0.04);
      ctx.globalAlpha=(n.material.opacity??0.8)*tw;
      if(streak>0.15){
        ctx.strokeStyle='#fff';ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x,p.y+streak*15);ctx.stroke();
      }else{
        ctx.fillStyle='#fff';ctx.fillRect(p.x,p.y,2,2);
      }
    });
    ctx.globalAlpha=1;
  }

  _drawRoad(ctx,cv,t){
    const hor=cv.height*0.34,bot=cv.height*0.92;
    // Rainbow stripes
    ['#f03','#f81','#fe2','#3d7','#2cf','#55f','#b4d'].forEach((c,i)=>{
      ctx.fillStyle=c;
      const l=cv.width*(i/7),r=cv.width*((i+1)/7);
      ctx.beginPath();
      ctx.moveTo(cv.width*0.46+(l-cv.width*0.5)*0.12,hor);
      ctx.lineTo(cv.width*0.54+(r-cv.width*0.5)*0.12,hor);
      ctx.lineTo(r,bot);ctx.lineTo(l,bot);ctx.fill();
    });

    // Depth vignette
    const dg=ctx.createLinearGradient(0,hor,0,bot);
    dg.addColorStop(0,'rgba(0,0,0,.5)');dg.addColorStop(.7,'rgba(0,0,0,.1)');dg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=dg;ctx.fillRect(0,hor,cv.width,bot-hor);

    // Animated dashed lane dividers
    ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;
    ctx.setLineDash([16,12]);ctx.lineDashOffset=-(t*100)%28;
    [-1.6,1.6].forEach(lx=>{
      const nx=cv.width/2+lx*cv.height/18,fx=cv.width/2+lx*cv.height/120;
      ctx.beginPath();ctx.moveTo(fx,hor);ctx.lineTo(nx,bot);ctx.stroke();
    });
    ctx.setLineDash([]);

    // Catch zone pads
    const lanes=[-3.2,0,3.2].map(lx=>cv.width/2+lx*cv.height/18);
    lanes.forEach((sx,i)=>{
      const isAct=i===this.activeLane;
      const fl=this._lF[i];
      const pulse=0.7+0.3*Math.sin(t*3.5+i*1.2);
      const r=isAct?38:26;
      // Flash ripple
      if(fl>0.05){
        ctx.save();ctx.globalAlpha=fl*0.65;
        const rg=ctx.createRadialGradient(sx,bot-12,0,sx,bot-12,50+fl*40);
        rg.addColorStop(0,this._lFc[i]);rg.addColorStop(1,'transparent');
        ctx.fillStyle=rg;
        ctx.beginPath();ctx.ellipse(sx,bot-12,60+fl*30,18+fl*10,0,0,Math.PI*2);ctx.fill();
        ctx.restore();
      }
      ctx.save();ctx.globalAlpha=isAct?(0.45+0.25*pulse):0.22;
      const pg=ctx.createRadialGradient(sx,bot-10,0,sx,bot-10,r);
      pg.addColorStop(0,isAct?'#ff66cc':'#00ffff');pg.addColorStop(1,'transparent');
      ctx.fillStyle=pg;
      ctx.beginPath();ctx.ellipse(sx,bot-10,r,r*0.22,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
    });

    // Catch label
    ctx.fillStyle='rgba(255,255,255,.65)';
    ctx.font=`bold ${Math.max(10,cv.width*0.013)}px sans-serif`;
    ctx.textAlign='center';ctx.fillText('CATCH ZONE',cv.width/2,bot-20);

    // Horizon glow
    const hg=ctx.createLinearGradient(0,hor-25,0,hor+15);
    hg.addColorStop(0,'transparent');hg.addColorStop(.5,'rgba(150,60,255,.14)');hg.addColorStop(1,'transparent');
    ctx.fillStyle=hg;ctx.fillRect(0,hor-25,cv.width,40);
  }

  _drawWorld(scene,camera,cv){
    scene.children.forEach(c=>{
      if(c.position.z<10&&c.position.z>-100&&c.children.length>=4){
        this._drawEntity(c,camera,cv);
      }else{
        if(c instanceof Mesh||c instanceof Points)this._drawNode(c,camera,cv);
        this._drawWorld(c,camera,cv);
      }
    });
    // recurse via walk for deeper groups
  }

  _drawEntity(n,camera,cv){
    const p=this._proj(n,camera,cv);
    const ctx=this.ctx;
    const t=this._ft;
    const isGold=n.children.some(c=>c.material?.color?.hex===0xffd700);
    const isDark=n.children.some(c=>c.material?.color?.hex===0x1f062b);
    const near=Math.max(0,1-Math.abs(n.position.z-6)/8); // proximity 0→1 at catch zone
    const sz=Math.max(10,p.scale*1.7);
    // Squash-stretch: wider & shorter when very close
    const sX=1+near*0.12,sY=1-near*0.09;

    ctx.save();
    ctx.translate(p.x,p.y-sz*0.5);
    ctx.scale(sX,sY);

    if(isDark){
      // Pulsing danger aura
      const aR=sz*(1.2+near*0.8+0.25*Math.sin(t*9));
      ctx.globalAlpha=0.15+near*0.45;
      const ag=ctx.createRadialGradient(0,0,0,0,0,aR);
      ag.addColorStop(0,'#ff1744');ag.addColorStop(1,'transparent');
      ctx.fillStyle=ag;ctx.beginPath();ctx.arc(0,0,aR,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;
      // Spiky body
      ctx.fillStyle='#1a0830';ctx.strokeStyle='#ff1744';ctx.lineWidth=Math.max(2,sz*0.09);
      ctx.beginPath();
      for(let i=0;i<14;i++){const a=i*Math.PI/7+t*2.5;const r=i%2?sz*0.6:sz;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}
      ctx.closePath();ctx.fill();ctx.stroke();
      // ! warning
      ctx.fillStyle='#ff496d';ctx.font=`bold ${Math.max(11,sz*0.7)}px sans-serif`;
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('!',0,0);
    }else{
      const body=isGold?'#ffd21f':'#f2f0ff';
      const acc=isGold?'#fff3a1':'#ff66cc';

      // Glow aura
      ctx.globalAlpha=0.25+near*0.28;
      const gg=ctx.createRadialGradient(0,0,0,0,0,sz*1.2);
      gg.addColorStop(0,acc);gg.addColorStop(1,'transparent');
      ctx.fillStyle=gg;ctx.beginPath();ctx.arc(0,0,sz*1.2,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;

      // Body torso
      ctx.fillStyle=body;ctx.strokeStyle=isGold?'#ffe066':'#cce0ff';ctx.lineWidth=Math.max(2,sz*0.07);
      ctx.beginPath();ctx.ellipse(0,0,sz*0.7,sz*0.37,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      // Head
      ctx.fillStyle=body;ctx.beginPath();ctx.arc(sz*0.52,-sz*0.27,sz*0.31,0,Math.PI*2);ctx.fill();ctx.stroke();
      // Horn (animated shimmer)
      const hg=0.65+0.35*Math.sin(t*6+p.x);
      ctx.strokeStyle=acc;ctx.lineWidth=Math.max(3,sz*0.13);ctx.lineCap='round';
      ctx.globalAlpha=0.6+hg*0.4;
      ctx.beginPath();ctx.moveTo(sz*0.64,-sz*0.54);ctx.lineTo(sz*0.81,-sz*1.1);ctx.stroke();
      ctx.lineCap='butt';ctx.globalAlpha=1;
      // Eye
      ctx.fillStyle='#180830';ctx.beginPath();ctx.arc(sz*0.62,-sz*0.31,sz*0.047,0,Math.PI*2);ctx.fill();
      // Galloping legs
      const sw=Math.sin(t*13+p.x*0.15)*0.4;
      ctx.strokeStyle=body;ctx.lineWidth=Math.max(2,sz*0.12);
      [[-0.42,sw],[0.42,-sw],[-0.2,-sw*0.6],[0.2,sw*0.6]].forEach(([lx,s])=>{
        ctx.beginPath();ctx.moveTo(lx*sz,sz*0.26);ctx.lineTo((lx+s*0.28)*sz,sz*0.68);ctx.stroke();
      });
      // Golden wings
      if(isGold){
        const wf=Math.sin(t*5)*0.35;
        ctx.globalAlpha=0.65;ctx.fillStyle='#ffe066';ctx.strokeStyle='#fff6aa';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.moveTo(-sz*0.28,-sz*0.08);ctx.quadraticCurveTo(-sz*(1.0+wf),-sz*(0.55+wf*0.4),-sz*0.85,sz*0.14);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.beginPath();ctx.moveTo(sz*0.14,-sz*0.04);ctx.quadraticCurveTo(sz*(0.8+wf*0.5),-sz*(0.46+wf*0.3),sz*0.68,sz*0.12);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.globalAlpha=1;
      }
    }
    ctx.restore();
  }

  _drawNode(n,camera,cv){
    const p=this._proj(n,camera,cv);
    const g=n.geometry,m=n.material,ctx=this.ctx;
    ctx.globalAlpha=m.opacity??1;
    ctx.fillStyle=m.color?.css()||'#fff';
    ctx.strokeStyle=m.emissive?.css()||ctx.fillStyle;
    const sz=Math.max(3,p.scale*(g.args?.[0]||1));
    if(g.type==='torus'){
      ctx.lineWidth=Math.max(3,sz*0.12);
      ctx.beginPath();ctx.arc(p.x,p.y,sz,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='rgba(0,255,255,.08)';ctx.beginPath();ctx.arc(p.x,p.y,sz*0.7,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
  }
}

const shape=t=>class extends Geometry{constructor(...a){super(t,a)}};
export const THREE={Color,Vector3,Group,Scene,Mesh,Points,CanvasTexture,PerspectiveCamera,Clock,WebGLRenderer:Renderer,AmbientLight:Group,DirectionalLight:Group,BufferGeometry,BufferAttribute,Float32BufferAttribute,MeshStandardMaterial:Material,MeshBasicMaterial:Material,PointsMaterial:Material,PlaneGeometry:shape('plane'),BoxGeometry:shape('box'),CylinderGeometry:shape('cylinder'),ConeGeometry:shape('cone'),TorusGeometry:shape('torus'),DodecahedronGeometry:shape('dodecahedron'),FogExp2:class{constructor(c,d){this.color=c;this.density=d}}};

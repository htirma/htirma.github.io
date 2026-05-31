/* amrith.co — an ambient Amsterdam canal, in pixels.
 *
 * A full-width row of gabled canal houses (the content column is one of them),
 * a strip of water with houseboats, trees dotted irregularly along the
 * promenade, and Amrith walking Sando off-leash. The walk is time-based and
 * wandering: variable pace, pauses, turn-arounds, back and forth; Sando sniffs
 * and now and then pees on a tree. Click the photo to pet him.
 * Mobile: just the two of them and a tree or two.
 */
(function () {
  "use strict";
  var canvas = document.getElementById("scene");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;
  var main = document.querySelector("main");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var rand = Math.random;
  function isDark(){var t=document.documentElement.getAttribute("data-theme");return t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;}

  // ── Amrith (side profile, facing right). H hair K skin G glasses J jacket P pants S shoe ──
  var P_STAND = [
    "..HHHH..",".HHHHHHH","HHHHHHK.","HHHKKKKK",".HGGGGGK",".HKKKKK.","..KKKK..",
    ".JJJJJJ.",".JJJJJJ.",".JJJJJJ.",".JJJJJ..","..PP.PP.","..PP.PP.","SSS.SSS."
  ];
  var P_WALK = [
    ["..HHHH..",".HHHHHHH","HHHHHHK.","HHHKKKKK",".HGGGGGK",".HKKKKK.","..KKKK..",
     ".JJJJJJ.","JJJJJJ..",".JJJJJ..",".JJJJ...","..PP.P..","..P..PP.","SS...SSS"],
    ["..HHHH..",".HHHHHHH","HHHHHHK.","HHHKKKKK",".HGGGGGK",".HKKKKK.","..KKKK..",
     ".JJJJJJ.","..JJJJJJ",".JJJJJ..","...JJJJ.","..P.PP..",".PP..P..","SSS..SS."]
  ];
  var P_PET = [
    "........","..HHHH..",".HHHHHHH","HHHKKKKK",".HGGGGGK",".HKKKKK.",".JJJJJ..",
    "JJJJJJ..","JJJJJJK.",".JJJJ...","..PPPP..","..PP.PP.",".SS..SS.","........"
  ];
  // ── Sando (foxy shiba, facing right). O fur, n nose/eye, c cream ──
  var D_WALK = [
    ["......O.O.","O....OOOOO",".OOOOOOOOO",".OOOOOOOnO",".OOOOOOOOn",".OccccOOO.","..O.O.O.O.","..O.O.O.O."],
    ["......O.O.","O....OOOOO",".OOOOOOOOO",".OOOOOOOnO",".OOOOOOOOn",".OccccOOO.",".O..O.O..O","..O.O.O.O."]
  ];
  var D_SNIFF = ["......O.O.","O....OOOO.",".OOOOOOOO.",".OOOOOOOnO",".OOOOOOOO.",".OccccOOOn","..O.O.O.O.","..O.O.O.O."];
  var D_PEE   = ["......O.O.","O....OOOOO",".OOOOOOOOO",".OOOOOOOnO",".OOOOOOOOn",".OccccOOO.","O...O.O.O.","....O.O.O."];
  var TREE_A = [
    "....FFF....","...FFFFF...","..FFFFFFF..",".FFFFFFFFF.","FFFFFFFFFFF","FFFFFFFFFFF",
    "FFFFFFFFFFF",".FFFFFFFFF.",".FFFFFFFFF.","..FFFFFFF..","..FFFFFFF..","...FFFFF...",
    "....FFF....",".....T.....",".....T.....",".....T.....",".....T.....",".....T.....","....TTT...."
  ];
  var TREE_B = [
    "..FFFFF..",".FFFFFFF.","FFFFFFFFF","FFFFFFFFF","FFFFFFFFF",".FFFFFFF.",".FFFFFFF.",
    "..FFFFF..","...FFF...","....T....","....T....","....T....","....T....","...TTT..."
  ];
  var BOAT = ["...##......","..####.....","###########",".#########."];
  var HEART = [".#.#.","#####","#####",".###.","..#.."];
  // Stationary "vibing" pair, front-facing (mobile, bottom-right).
  // Amrith with headphones (M) + glasses; Sando sitting like a good shiba.
  var P_SIT = [
    "...HHHHHHH...","..HHHHHHHHH..",".HHHHHHHHHHH.","HHHHHHHHHHHHH",
    "HHHHHHHHHHHHH","HHHKKKKKKKKKH",".KGGGGKGGGGK.",".KGwnGGGnwGK.",
    ".KGGGGKGGGGK.",".KKKKKKKKKKK.","...KKppKKK...","....KKKKK....",
    ".JJJJJJJJJJJ.",".JLJJJJJJJLJ.",".JLJJJJJJJLJ.",".KLJJJJJJJLK.",
    ".JJJJJJJJJJJ.","..PPP...PPP..","..SSS...SSS.."
  ];
  // Standing pose for mobile (no bench): legs together instead of hanging
  var P_STAND = P_SIT.slice(0,17).concat(["....PP.PP....","....SS.SS...."]);
  var D_SIT = [
    "..O...O..",".OO...OO.",".OOOOOOO.",".OnOOOnO.",".OOnnnOO.",
    ".OcccccO.","OcccccccO","OcccccccO",".OcccccO.",".OO...OO."
  ];

  function pal() {
    var d = isDark();
    var houses = d
      ? [[176,96,86],[150,112,86],[150,118,96],[108,118,150],[168,128,96],[120,108,96]]
      : [[150,70,55],[120,82,58],[122,86,62],[72,82,110],[140,100,68],[96,86,76]];
    return {
      dark:d, houses:houses, houseA:d?0.34:0.42,
      win:  d?"rgba(240,214,150,0.78)":"rgba(70,64,58,0.40)",
      water:d?"rgba(120,168,168,0.20)":"rgba(96,140,144,0.22)",
      reflA:d?0.12:0.13,
      quay: d?"rgba(150,140,128,0.16)":"rgba(120,100,84,0.20)",
      boat: d?"rgba(150,150,160,0.34)":"rgba(64,62,66,0.42)",
      H:"rgba(26,24,28,0.94)",
      K:d?"rgba(200,150,112,0.94)":"rgba(186,134,96,0.94)",
      G:"rgba(20,20,24,0.96)",
      J:d?"rgba(78,82,90,0.92)":"rgba(56,60,68,0.92)",
      L:d?"rgba(52,56,64,0.95)":"rgba(38,42,50,0.95)",
      w:"rgba(232,232,236,0.96)",
      p:d?"rgba(184,114,106,0.92)":"rgba(160,94,88,0.95)",
      P:d?"rgba(62,66,74,0.92)":"rgba(46,50,58,0.92)",
      S:"rgba(28,28,32,0.94)",
      M:d?"rgba(112,116,126,0.95)":"rgba(92,96,106,0.95)",
      O:d?"rgba(222,142,82,0.94)":"rgba(198,108,52,0.92)",
      c:d?"rgba(238,224,200,0.9)":"rgba(230,212,184,0.88)",
      n:"rgba(30,26,26,0.95)",
      F:d?"rgba(96,118,86,0.5)":"rgba(84,106,70,0.5)",
      T:d?"rgba(120,92,68,0.55)":"rgba(98,74,54,0.55)",
      heart:"rgba(214,120,122,0.92)",
      sun:"rgba(232,176,84,0.95)",
      moon:d?"rgba(232,230,214,0.92)":"rgba(140,144,156,0.82)",
      cloud:d?"rgba(120,124,134,0.30)":"rgba(150,150,162,0.34)",
      rain:d?"rgba(150,180,200,0.38)":"rgba(110,140,165,0.42)",
      snow:d?"rgba(228,232,240,0.72)":"rgba(208,216,228,0.78)",
      star:"rgba(236,232,214,0.85)"
    };
  }

  var W=0,H=0,dpr=1,PIXEL=4,CP=5,treePix=6,cellsX=0,cellsY=0,isMobile=false,C=pal();
  var byColor=[],lit=[],boats=[],trees=[],colTop=[],colCol=[];
  var waterTopRow=0,waterBotRow=0,feetY=0,promY=0,safeL=-1,safeR=-1,GUT=20;
  var SHOW_WALKER=false; // Amrith + Sando — flip to true once the sprites are perfected
  var A={x:0,dir:1,speed:50,target:50,timer:1.5,mode:"walk",leg:0,pet:0,petT:1,peeTree:null};
  var Dg={x:0,dir:1,leg:0,pose:"walk"};
  var contentTopY=0,sunX=0,sunY=0,sunR=22,skyBot=0;
  var hearts=[], amrithBox=null, sandoBox=null;
  var WX={code:0,clouds:1,precip:"none"},clouds=[],drops=[],stars=[],weatherFetched=false;

  function srng(s){return function(){s|=0;s=(s+0x6D2B79F5)|0;var t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
  function inSafe(cx){var x=cx*PIXEL;return x>=safeL-GUT&&x<=safeR+GUT;}

  function layout(){
    cellsX=Math.ceil(W/PIXEL); cellsY=Math.ceil(H/PIXEL);
    feetY=H-(isMobile?10:14); promY=feetY+CP;
    var walkerTopY=feetY-P_STAND.length*CP, cb,ctp;
    if(main){var r=main.getBoundingClientRect();safeL=r.left;safeR=r.right;cb=r.bottom;ctp=r.top;}
    else{safeL=safeR=-1;cb=H*0.6;ctp=H*0.1;}
    contentTopY=ctp;
    var wTopY=cb+6, maxWater=isMobile?0:88;
    var wBotY=Math.min(wTopY+maxWater, walkerTopY-30);
    if(wBotY<wTopY+18)wBotY=wTopY+18;
    waterTopRow=Math.round(wTopY/PIXEL); waterBotRow=Math.round(wBotY/PIXEL);
    return {baseRow:waterTopRow-1};
  }

  function build(L){
    byColor=[];lit=[];boats=[];trees=[];colTop=new Array(cellsX).fill(-1);colCol=new Array(cellsX).fill(-1);
    for(var i=0;i<C.houses.length;i++)byColor.push([]);
    var R=srng(20101207);

    function put(ci,cx,cy){if(cx<0||cx>=cellsX||inSafe(cx))return;byColor[ci].push(cx,cy);if(colTop[cx]<0||cy<colTop[cx]){colTop[cx]=cy;colCol[cx]=ci;}}
    function gable(ci,c,w,top,rv){            // distinct Amsterdam rooflines
      var t=Math.floor(rv*4),mid=c+(w>>1),x,y,i;
      if(t===0){ for(i=0;i*2<w&&i<5;i++)for(x=c+i;x<=c+w-1-i;x++)put(ci,x,top-1-i); }                 // puntgevel (pointed)
      else if(t===1){ var l=c,r=c+w-1,s=0;y=top-1; while(l<=r&&s<4){for(x=l;x<=r;x++){put(ci,x,y);put(ci,x,y-1);}y-=2;l++;r--;s++;} } // trapgevel (step)
      else if(t===2){ for(x=c+1;x<=c+w-2;x++)put(ci,x,top-1); var nw=Math.max(2,(w/3)|0),nl=mid-(nw>>1); for(y=0;y<3;y++)for(x=nl;x<nl+nw;x++)put(ci,x,top-2-y); for(x=nl+1;x<nl+nw-1;x++)put(ci,x,top-5); } // halsgevel (neck)
      else { var l2=c,r2=c+w-1,k=0;y=top-1; while(k<3&&l2<r2){for(x=l2;x<=r2;x++)put(ci,x,y);y--;l2++;r2--;k++;} for(x=l2;x<=r2;x++)put(ci,x,y); } // klokgevel (bell)
    }

    if(!isMobile){
      // narrow, tall canal houses, touching (terraced), with varied gables
      var base=L.baseRow,c=0,prev=-1;
      while(c<cellsX){
        var w=9+Math.floor(R()*7);
        var h=20+Math.floor(R()*13);
        var ci=Math.floor(R()*C.houses.length); if(ci===prev)ci=(ci+1)%C.houses.length; prev=ci;
        var top=base-h;
        for(var cy=top;cy<=base;cy++)for(var cx=c;cx<c+w;cx++){
          if(cx<0||cx>=cellsX||inSafe(cx))continue;
          var edge=(cx===c||cx===c+w-1||cy===base),fl=base-cy;
          var win=!edge&&((cx-c)%2===1)&&(fl%4===1)&&fl>1&&fl<h-1;
          if(win){if(R()<0.4)lit.push(cx,cy);}
          else put(ci,cx,cy);
        }
        gable(ci,c,w,top,R());
        c+=w;
      }
      var by=(waterTopRow+1)*PIXEL;
      boats.push({x:Math.round(W*0.15),y:by,ph:0});
      boats.push({x:Math.round(W*0.8),y:by,ph:2.3});
      var tx=W*(0.04+R()*0.06);
      while(tx<W-20){ if(Math.abs(tx-W/2)>170)trees.push({x:Math.round(tx),v:R()<0.5?0:1}); tx+=W*(0.12+R()*0.16); }
    }
    buildSky();
  }

  function resize(){
    dpr=Math.min(window.devicePixelRatio||1,2);
    W=window.innerWidth;H=window.innerHeight;isMobile=W<=540;
    PIXEL=isMobile?3:4;CP=isMobile?4:5;treePix=isMobile?5:7;
    canvas.width=Math.floor(W*dpr);canvas.height=Math.floor(H*dpr);
    canvas.style.width=W+"px";canvas.style.height=H+"px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
    C=pal();
    if(A.x===0){A.x=W*0.35;Dg.x=A.x+44;}
    build(layout());
    sunR=isMobile?16:24; sunX=Math.round(W*(isMobile?0.86:0.85)); sunY=Math.round(H*(isMobile?0.07:0.12));
    skyBot=isMobile?(H+8):(waterTopRow*PIXEL-8);
    positionToggle();
    if(!weatherFetched){weatherFetched=true;fetchWeather();}
  }

  function cell(cx,cy){ctx.fillRect(cx*PIXEL,cy*PIXEL,PIXEL,PIXEL);}
  function spr(map,x,y,s,flip){var cols=map[0].length;for(var r=0;r<map.length;r++){var row=map[r];for(var k=0;k<row.length;k++){var ch=row.charAt(k);if(ch===".")continue;var col=C[ch];if(!col)continue;ctx.fillStyle=col;var kk=flip?(cols-1-k):k;ctx.fillRect(x+kk*s,y+r*s,s,s);}}}
  function sprC(map,x,y,s,color){ctx.fillStyle=color;for(var r=0;r<map.length;r++){var row=map[r];for(var k=0;k<row.length;k++)if(row.charAt(k)==="#")ctx.fillRect(x+k*s,y+r*s,s,s);}}

  // ── Natural walk ─────────────────────────────────────────────────
  function nearestTree(){var best=null,bd=1e9;for(var i=0;i<trees.length;i++){var d=Math.abs(trees[i].x-A.x);if(d<bd){bd=d;best=trees[i];}}return {t:best,d:bd};}
  function decide(){
    var r=rand();
    if(r<0.30){A.mode="walk";A.target=26+rand()*22;A.timer=2+rand()*3;}
    else if(r<0.55){A.mode="walk";A.target=58+rand()*34;A.timer=1.6+rand()*2.4;}
    else if(r<0.72){A.mode="pause";A.target=0;A.timer=0.8+rand()*1.8;}
    else if(r<0.86){A.dir=-A.dir;A.mode="walk";A.target=40+rand()*25;A.timer=2+rand()*2;}
    else {var nt=nearestTree();if(nt.t&&nt.d<W*0.45){A.mode="pee";A.peeTree=nt.t.x;A.target=0;A.timer=2+rand()*1.6;}else{A.mode="walk";A.target=50;A.timer=2;}}
  }
  function update(dt){
    if(A.pet>0){A.pet-=dt;A.target=0;}
    else{A.timer-=dt;if(A.timer<=0)decide();}
    A.speed+=(A.target-A.speed)*Math.min(1,dt*2.4);
    if(A.mode==="walk"&&A.pet<=0)A.x+=A.dir*A.speed*dt;
    var m=36; if(A.x<m){A.x=m;A.dir=1;} if(A.x>W-m){A.x=W-m;A.dir=-1;}
    A.leg+=A.speed*dt*0.05;

    var goal;
    if(A.pet>0){goal=A.x+20;Dg.pose="sniff";}
    else if(A.mode==="pee"&&A.peeTree!=null)goal=A.peeTree-18;
    else if(A.mode==="pause"){goal=A.x+A.dir*32;Dg.pose="sniff";}
    else{goal=A.x+A.dir*44;Dg.pose="walk";}
    var dx=goal-Dg.x;Dg.x+=dx*Math.min(1,dt*3.2);
    if(Math.abs(dx)>1)Dg.dir=dx>0?1:-1;
    if(A.mode==="pee"&&A.peeTree!=null&&Math.abs(Dg.x-(A.peeTree-18))<10){Dg.pose="pee";Dg.dir=1;}
    Dg.leg+=Math.abs(dx)*dt*0.5+(Dg.pose==="walk"?A.speed*dt*0.05:0);
  }

  function drawScene(t){
    if(isMobile)return;          // mobile uses a stationary vibe sprite, not the canal
    var i,cx,wr,ci;
    for(ci=0;ci<byColor.length;ci++){var a=byColor[ci],rgb=C.houses[ci];ctx.fillStyle="rgba("+rgb[0]+","+rgb[1]+","+rgb[2]+","+C.houseA+")";for(i=0;i<a.length;i+=2)cell(a[i],a[i+1]);}
    ctx.fillStyle=C.win;for(i=0;i<lit.length;i+=2)cell(lit[i],lit[i+1]);
    var wob=Math.sin(t*0.0005);
    for(cx=0;cx<cellsX;cx++){if(colTop[cx]<0)continue;var rg=C.houses[colCol[cx]];ctx.fillStyle="rgba("+rg[0]+","+rg[1]+","+rg[2]+","+C.reflA+")";var depth=Math.min(5,waterBotRow-waterTopRow);for(var k=1;k<=depth;k++){if(Math.sin(cx*0.3+t*0.00055+k)<0.35)continue;cell(cx+Math.round(wob+Math.sin(t*0.00055+cx*0.2)),waterTopRow+k);}}
    ctx.fillStyle=C.water;var ph=t*0.00042;
    for(wr=waterTopRow;wr<=waterBotRow;wr++)for(cx=0;cx<cellsX;cx++){if(inSafe(cx))continue;if(Math.sin(cx*0.22+ph+wr*0.7)>0.82)cell(cx,wr);}
    for(i=0;i<boats.length;i++){var bb=boats[i],yy=bb.y+Math.round(Math.sin(t*0.0008+bb.ph)*PIXEL);sprC(BOAT,bb.x,yy,PIXEL,C.boat);}
    ctx.fillStyle=C.quay;ctx.fillRect(0,promY,W,Math.max(2,PIXEL-1));
    for(i=0;i<trees.length;i++){var tm=trees[i].v?TREE_B:TREE_A;spr(tm,trees[i].x-Math.floor(tm[0].length/2)*treePix,promY-tm.length*treePix,treePix,false);}
  }
  function cell2(ox,oy,col,row,cp){ctx.fillRect(ox+col*cp,oy+row*cp,cp,cp);}
  function drawBench(x,seatY,w,ground,cp){
    ctx.fillStyle=C.T;
    var pt=Math.max(2,Math.round(cp*1.4));
    ctx.fillRect(x,seatY,w,pt);                              // seat plank
    ctx.fillRect(x+cp*2,seatY+pt,cp,ground-(seatY+pt));      // left leg
    ctx.fillRect(x+w-cp*3,seatY+pt,cp,ground-(seatY+pt));    // right leg
  }
  function drawChill(t){
    var PB=isMobile?P_STAND:P_SIT;
    var cp=CP+1, aw=PB[0].length, ah=PB.length, dw=D_SIT[0].length, dh=D_SIT.length;
    var gap=2*cp, pairW=dw*cp+gap+aw*cp;
    var ground=isMobile?(H-12):promY;
    var cx=isMobile?(W-16-pairW):Math.round(W/2-pairW/2);
    var seatY=ground-5*cp;                                    // raised bench seat (desktop)
    if(!isMobile)drawBench(cx-cp,seatY,pairW+2*cp,ground,cp); // backless bench, behind the pair
    var bobA=Math.round(Math.sin(t*0.0016)*2), bobD=Math.round(Math.sin(t*0.0016+1.7)*2);
    var sandoX=cx, amrithX=cx+dw*cp+gap;
    var dy=(isMobile?ground:seatY)-dh*cp+bobD;
    var ay=(isMobile?ground-ah*cp:seatY-16*cp)+bobA;         // sit (butt on seat) vs stand
    spr(D_SIT,sandoX,dy,cp,false);
    spr(PB,amrithX,ay,cp,false);
    // remember on-canvas boxes for click hit-testing + heart spawns
    amrithBox={x:amrithX,y:ay,w:aw*cp,h:ah*cp};
    sandoBox={x:sandoX,y:dy,w:dw*cp,h:dh*cp};
    // expressions: blink + a slow cycle of moods
    // Amrith stays calm (face baked in). Sando keeps a little life: blink + happy tongue.
    var dblink=Math.sin(t*0.0011+2)>0.965, mood=Math.floor(t/3200)%3;
    if(dblink){ctx.fillStyle=C.O;cell2(sandoX,dy,2,3,cp);cell2(sandoX,dy,6,3,cp);}
    if(mood===1){ctx.fillStyle=C.heart;cell2(sandoX,dy,4,5,cp);}                                   // Sando happy tongue
  }

  function drawPair(t){
    var flip=A.dir<0, px=Math.round(A.x-(P_STAND[0].length*CP)/2), pTop=feetY-P_STAND.length*CP;
    if(A.pet>0){spr(P_PET,px,pTop,CP,flip);var prog=1-(A.pet/A.petT);var hy=pTop-Math.round(prog*22)-8;sprC(HEART,Math.round(A.x)+(flip?-3*CP:2*CP),hy,Math.max(3,CP-1),C.heart);}
    else if(A.mode!=="walk"||A.speed<6)spr(P_STAND,px,pTop,CP,flip);
    else spr(P_WALK[Math.floor(A.leg)%2],px,pTop,CP,flip);

    var dflip=Dg.dir<0;
    var dmap=Dg.pose==="pee"?D_PEE:Dg.pose==="sniff"?D_SNIFF:D_WALK[Math.floor(Dg.leg)%2];
    var dx=Math.round(Dg.x-(dmap[0].length*CP)/2), dTop=feetY-dmap.length*CP;
    spr(dmap,dx,dTop,CP,dflip);
  }

  // ── Sky + weather (Amsterdam, Open-Meteo) ───────────────────────
  function inMargin(x){return x<safeL-GUT||x>safeR+GUT;}
  function visibleSky(x,y){return isMobile?true:(y<contentTopY-6||inMargin(x));}
  function buildSky(){
    clouds=[];drops=[];stars=[];
    var top=H*0.03, bot=isMobile?H:Math.max(top+20,(waterTopRow*PIXEL)-8);
    var nC=Math.min(7,WX.clouds+(WX.precip!=="none"?2:0));
    for(var i=0;i<nC;i++)clouds.push({x:rand()*W,y:top+rand()*(bot-top)*0.7,s:(isMobile?2:3)+Math.floor(rand()*3),v:5+rand()*10});
    if(WX.precip!=="none"){var n=WX.precip==="snow"?70:110;for(var d=0;d<n;d++)drops.push({x:rand()*W,y:rand()*bot,v:(WX.precip==="snow"?22:130)+rand()*(WX.precip==="snow"?22:90),dx:(rand()-0.5)*(WX.precip==="snow"?10:4)});}
    for(var s2=0;s2<70;s2++)stars.push({x:rand()*W,y:top+rand()*(bot-top)*0.55,p:rand()*6.28});
  }
  function updateSky(dt){
    if(WX.precip==="none")return;
    for(var i=0;i<drops.length;i++){var p=drops[i];p.y+=p.v*dt;p.x+=p.dx*dt;if(p.y>skyBot){p.y=-4;p.x=rand()*W;}}
  }
  function pixDisc(cx,cy,r){var P=PIXEL,x,y;for(y=-r;y<=r;y+=P)for(x=-r;x<=r;x+=P){if(x*x+y*y<=r*r)ctx.fillRect(Math.round(cx+x),Math.round(cy+y),P,P);}}
  function drawCelestial(night){
    if(night){ctx.fillStyle=C.moon;pixDisc(sunX,sunY,sunR);ctx.save();ctx.globalCompositeOperation="destination-out";pixDisc(sunX+sunR*0.55,sunY-sunR*0.28,sunR*0.92);ctx.restore();}
    else{ctx.fillStyle=C.sun;pixDisc(sunX,sunY,sunR);ctx.strokeStyle=C.sun;ctx.lineWidth=Math.max(2,PIXEL-1);for(var a=0;a<8;a++){var an=a*Math.PI/4;ctx.beginPath();ctx.moveTo(sunX+Math.cos(an)*(sunR+5),sunY+Math.sin(an)*(sunR+5));ctx.lineTo(sunX+Math.cos(an)*(sunR+12),sunY+Math.sin(an)*(sunR+12));ctx.stroke();}}
  }
  function drawCloud(cx,cy,s){var map=["..####..",".######.","########",".######."];ctx.fillStyle=C.cloud;for(var r=0;r<map.length;r++){var row=map[r];for(var k=0;k<row.length;k++){if(row.charAt(k)!=="#")continue;var xx=Math.round(cx+k*s),yy=Math.round(cy+r*s);if(visibleSky(xx,yy))ctx.fillRect(xx,yy,s,s);}}}
  function drawSky(t){
    var night=isDark(),i,p;
    if(night&&WX.clouds<=2&&WX.precip==="none"){ctx.fillStyle=C.star;for(i=0;i<stars.length;i++){p=stars[i];if(!visibleSky(p.x,p.y))continue;var tw=0.5+0.5*Math.sin(t*0.0016+p.p);if(tw>0.62){ctx.globalAlpha=tw;ctx.fillRect(p.x,p.y,2,2);}}ctx.globalAlpha=1;}
    drawCelestial(night);
    for(i=0;i<clouds.length;i++){var c=clouds[i];var cx=((c.x+t*c.v/1000)%(W+220))-110;if(visibleSky(cx+4*c.s,c.y))drawCloud(cx,c.y,c.s);}
    if(WX.precip==="rain"){ctx.strokeStyle=C.rain;ctx.lineWidth=Math.max(1,PIXEL-2);ctx.beginPath();for(i=0;i<drops.length;i++){p=drops[i];if(!visibleSky(p.x,p.y))continue;ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-2,p.y+9);}ctx.stroke();}
    else if(WX.precip==="snow"){ctx.fillStyle=C.snow;for(i=0;i<drops.length;i++){p=drops[i];if(!visibleSky(p.x,p.y))continue;var sz=Math.max(2,PIXEL-1);ctx.fillRect(p.x,p.y,sz,sz);}}
  }
  function positionToggle(){var b=document.getElementById("theme");if(!b)return;var pad=12;b.style.left=(sunX-sunR-pad)+"px";b.style.top=(sunY-sunR-pad)+"px";b.style.width=(2*(sunR+pad))+"px";b.style.height=(2*(sunR+pad))+"px";b.style.right="auto";b.style.bottom="auto";}
  function mapWeather(code){var cl=0,pr="none";if(code<=0)cl=0;else if(code===1)cl=1;else if(code===2)cl=2;else if(code===3)cl=4;else if(code===45||code===48)cl=3;else if((code>=51&&code<=67)||(code>=80&&code<=82)){cl=4;pr="rain";}else if((code>=71&&code<=77)||code===85||code===86){cl=4;pr="snow";}else if(code>=95){cl=5;pr="rain";}WX.clouds=cl;WX.precip=pr;}
  function fetchWeather(){try{fetch("https://api.open-meteo.com/v1/forecast?latitude=52.3676&longitude=4.9041&current=weather_code").then(function(r){return r.json();}).then(function(j){var code=(j&&j.current&&j.current.weather_code)|0;WX.code=code;mapWeather(code);buildSky();}).catch(function(){});}catch(e){}}

  var last=0,raf=0;
  // ── Floating hearts (pet reaction) ──────────────────────────────
  function burstHearts(box){
    if(!box)return;
    var n=5+Math.floor(rand()*3), cx=box.x+box.w/2;
    for(var i=0;i<n;i++)hearts.push({x:cx+(rand()-0.5)*box.w*0.7,y:box.y+rand()*box.h*0.4,vy:24+rand()*18,vx:(rand()-0.5)*18,life:0,ttl:1.1+rand()*0.6,s:Math.max(2,(CP)-1+Math.floor(rand()*2))});
  }
  function updateHearts(dt){for(var i=hearts.length-1;i>=0;i--){var h=hearts[i];h.life+=dt;h.y-=h.vy*dt;h.x+=h.vx*dt;h.vx*=0.96;if(h.life>=h.ttl)hearts.splice(i,1);}}
  function drawHearts(){for(var i=0;i<hearts.length;i++){var h=hearts[i],k=h.life/h.ttl,a=k<0.2?(k/0.2):(1-(k-0.2)/0.8);ctx.globalAlpha=Math.max(0,a);sprC(HEART,Math.round(h.x-2.5*h.s),Math.round(h.y),h.s,C.heart);}ctx.globalAlpha=1;}

  function frame(t){var dt=last?Math.min(0.05,(t-last)/1000):0.016;last=t;updateSky(dt);updateHearts(dt);ctx.clearRect(0,0,W,H);drawSky(t);drawScene(t);drawChill(t);drawHearts();raf=requestAnimationFrame(frame);}
  function start(){resize();last=0;if(reduceMotion){ctx.clearRect(0,0,W,H);drawSky(1500);drawScene(1500);drawChill(1500);return;}cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);}

  var rt;
  window.addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(start,150);});
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",function(){C=pal();build(layout());});
  try{new MutationObserver(function(){C=pal();build(layout());}).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});}catch(e){}

  // Click the avatar photo → hearts from on-canvas Amrith.
  var avatar=document.querySelector(".avatar");
  if(avatar){avatar.style.cursor="pointer";avatar.addEventListener("click",function(){burstHearts(amrithBox);});}
  // Tap/click Sando or Amrith on the canvas → hearts. Canvas ignores pointer
  // events, so hit-test against the boxes from a window listener (+ touch).
  function hit(box,x,y){if(!box)return false;var pad=14;return x>=box.x-pad&&x<=box.x+box.w+pad&&y>=box.y-box.h*0.3-pad&&y<=box.y+box.h+pad;}
  function tap(x,y){if(hit(sandoBox,x,y)){burstHearts(sandoBox);return true;}if(hit(amrithBox,x,y)){burstHearts(amrithBox);return true;}return false;}
  window.addEventListener("click",function(e){tap(e.clientX,e.clientY);});
  window.addEventListener("touchend",function(e){var t=e.changedTouches&&e.changedTouches[0];if(t&&tap(t.clientX,t.clientY))e.preventDefault();},{passive:false});

  var seq=[38,38,40,40,37,39,37,39,66,65],pos=0;
  window.addEventListener("keydown",function(e){pos=(e.keyCode===seq[pos])?pos+1:0;if(pos===seq.length){pos=0;var el=document.documentElement;el.style.transition="filter .15s ease";el.style.filter="invert(1) hue-rotate(180deg)";setTimeout(function(){el.style.filter="";},900);}});

  try{console.log("%c@amrith %c· building for the love of the game\n  built by hand, no frameworks. say hi: hi@amrith.co","font-weight:bold","color:#8E8E93");}catch(e){}

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();

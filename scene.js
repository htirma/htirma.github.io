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
  var INVADER = ["..#.....#..","...#...#...","..#######..",".##.###.##.","###########","#.#######.#","#.#.....#.#","...##.##..."];
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

  // ── Time-of-day in Amsterdam ─────────────────────────────────────
  // The scene tracks the real sun (and moon) over Amsterdam. Position depends
  // only on the absolute instant (UTC) + fixed coords, so every visitor world-
  // wide sees Amsterdam's actual sky. Colours crossfade through pastel phases.
  var LAT=52.3676, LON=4.9041, D2R=Math.PI/180, R2D=180/Math.PI;
  function rev(x){return x-Math.floor(x/360)*360;}
  function clamp01(x){return x<0?0:x>1?1:x;}
  function lr(a,b,f){return a+(b-a)*f;}
  function smooth(x){return x*x*(3-2*x);}
  function lerp3(a,b,f){return [lr(a[0],b[0],f),lr(a[1],b[1],f),lr(a[2],b[2],f)];}
  function lerp4(a,b,f){return [lr(a[0],b[0],f),lr(a[1],b[1],f),lr(a[2],b[2],f),lr(a[3],b[3],f)];}
  function rgb(c){return "rgb("+Math.round(c[0])+","+Math.round(c[1])+","+Math.round(c[2])+")";}
  function rgba(c){return "rgba("+Math.round(c[0])+","+Math.round(c[1])+","+Math.round(c[2])+","+(+c[3].toFixed(3))+")";}
  function mulA(str,a){var m=/rgba?\(([^)]+)\)/.exec(str);if(!m)return str;var p=m[1].split(",");var al=p.length>3?parseFloat(p[3]):1;return "rgba("+(p[0]|0)+","+(p[1]|0)+","+(p[2]|0)+","+(al*a).toFixed(3)+")";}

  // Preview other times: ?hour=20 (Amsterdam local hour, decimals ok) freezes the
  // scene at that time today; ?skyadd=8 shifts by N hours; window.__skyAddHours too.
  var SKY_HOUR=null, SKY_ADD=0;
  try{var _q=new URLSearchParams(location.search);
    if(_q.has("hour"))SKY_HOUR=parseFloat(_q.get("hour"));
    if(_q.has("skyadd"))SKY_ADD=parseFloat(_q.get("skyadd"))||0;
  }catch(e){}
  function amsOffMin(d){try{var u=new Date(d.toLocaleString("en-US",{timeZone:"UTC"})),l=new Date(d.toLocaleString("en-US",{timeZone:"Europe/Amsterdam"}));return Math.round((l-u)/60000);}catch(e){return 60;}}
  function skyNow(){
    var add=(typeof window.__skyAddHours==="number")?window.__skyAddHours:SKY_ADD;
    if(SKY_HOUR!=null&&!isNaN(SKY_HOUR)){
      var n=new Date(Date.now()+add*3600000),off=amsOffMin(n);
      var p=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Amsterdam",year:"numeric",month:"2-digit",day:"2-digit"}).format(n).split("-");
      return new Date(Date.UTC(+p[0],+p[1]-1,+p[2],0,0,0)+Math.round(SKY_HOUR*3600000)-off*60000);
    }
    return new Date(Date.now()+add*3600000);
  }
  function currentMode(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark"||t==="auto")return t;}catch(e){}return "auto";}

  function horiz(HA,Dec){
    HA=rev(HA);var har=HA*D2R,dr=Dec*D2R,lro=LAT*D2R;
    var alt=Math.asin(Math.sin(lro)*Math.sin(dr)+Math.cos(lro)*Math.cos(dr)*Math.cos(har))*R2D;
    var az=rev(Math.atan2(Math.sin(har),Math.cos(har)*Math.sin(lro)-Math.tan(dr)*Math.cos(lro))*R2D+180);
    return {alt:alt,az:az};
  }
  // Low-precision sun + moon (Schlyter). alt/az in degrees, moon k = lit fraction.
  function astro(){
    var now=skyNow(),Y=now.getUTCFullYear(),Mo=now.getUTCMonth()+1,Da=now.getUTCDate();
    var UT=now.getUTCHours()+now.getUTCMinutes()/60+now.getUTCSeconds()/3600;
    var d=367*Y-Math.floor(7*(Y+Math.floor((Mo+9)/12))/4)+Math.floor(275*Mo/9)+Da-730530+UT/24;
    var ecl=23.4393-3.563e-7*d;
    var ws=282.9404+4.70935e-5*d,es=0.016709-1.151e-9*d,Ms=rev(356.0470+0.9856002585*d);
    var Es=Ms+es*R2D*Math.sin(Ms*D2R)*(1+es*Math.cos(Ms*D2R));
    var xs=Math.cos(Es*D2R)-es,ys=Math.sin(Es*D2R)*Math.sqrt(1-es*es);
    var rs=Math.sqrt(xs*xs+ys*ys),vs=rev(Math.atan2(ys,xs)*R2D),lons=rev(vs+ws);
    var xes=rs*Math.cos(lons*D2R),yes=rs*Math.sin(lons*D2R);
    var xeq=xes,yeq=yes*Math.cos(ecl*D2R),zeq=yes*Math.sin(ecl*D2R);
    var RAs=rev(Math.atan2(yeq,xeq)*R2D),Decs=Math.atan2(zeq,Math.sqrt(xeq*xeq+yeq*yeq))*R2D;
    var Ls=rev(ws+Ms),GMST0=Ls/15+12,LST=rev((GMST0+UT+LON/15)*15);
    var HAs=rev(LST-RAs),sun=horiz(HAs,Decs);sun.rising=HAs>180;
    var N=rev(125.1228-0.0529538083*d),inc=5.1454,wm=rev(318.0634+0.1643573223*d);
    var am=60.2666,em=0.054900,Mm=rev(115.3654+13.0649929509*d);
    var E=Mm+em*R2D*Math.sin(Mm*D2R)*(1+em*Math.cos(Mm*D2R));
    E=E-(E-em*R2D*Math.sin(E*D2R)-Mm)/(1-em*Math.cos(E*D2R));
    var xm=am*(Math.cos(E*D2R)-em),ym=am*Math.sqrt(1-em*em)*Math.sin(E*D2R);
    var rm=Math.sqrt(xm*xm+ym*ym),vm=rev(Math.atan2(ym,xm)*R2D),vw=(vm+wm)*D2R,Nr=N*D2R,ir=inc*D2R;
    var xe=rm*(Math.cos(Nr)*Math.cos(vw)-Math.sin(Nr)*Math.sin(vw)*Math.cos(ir));
    var ye=rm*(Math.sin(Nr)*Math.cos(vw)+Math.cos(Nr)*Math.sin(vw)*Math.cos(ir));
    var ze=rm*Math.sin(vw)*Math.sin(ir),lonm=rev(Math.atan2(ye,xe)*R2D);
    var xqe=xe,yqe=ye*Math.cos(ecl*D2R)-ze*Math.sin(ecl*D2R),zqe=ye*Math.sin(ecl*D2R)+ze*Math.cos(ecl*D2R);
    var RAm=rev(Math.atan2(yqe,xqe)*R2D),Decm=Math.atan2(zqe,Math.sqrt(xqe*xqe+yqe*yqe))*R2D;
    var moon=horiz(rev(LST-RAm),Decm),elong=rev(lonm-lons);
    moon.k=(1-Math.cos(elong*D2R))/2;moon.wax=elong<180;
    return {sun:sun,moon:moon};
  }

  // Scene-colour anchors: DAY = the loved light palette, NIGHT = the loved dark
  // palette. Everything else is interpolated between them by a 0..1 night factor
  // and then tinted by the phase's ambient light. [r,g,b,a]; houses are [r,g,b].
  var DAY={
    houses:[[150,70,55],[120,82,58],[122,86,62],[72,82,110],[140,100,68],[96,86,76]],houseA:0.42,reflA:0.13,
    win:[70,64,58,0.40],water:[96,140,144,0.22],quay:[120,100,84,0.20],boat:[64,62,66,0.42],
    K:[186,134,96,0.94],J:[56,60,68,0.92],L:[38,42,50,0.95],p:[160,94,88,0.95],P:[46,50,58,0.92],
    M:[92,96,106,0.95],O:[198,108,52,0.92],c:[230,212,184,0.88],F:[84,106,70,0.5],T:[98,74,54,0.55],
    sun:[232,176,84,0.95],moon:[140,144,156,0.82],
    cloud:[150,150,162,0.34],rain:[110,140,165,0.42],snow:[208,216,228,0.78],star:[236,232,214,0.85]
  };
  var NIGHT={
    houses:[[176,96,86],[150,112,86],[150,118,96],[108,118,150],[168,128,96],[120,108,96]],houseA:0.34,reflA:0.12,
    win:[240,214,150,0.78],water:[120,168,168,0.20],quay:[150,140,128,0.16],boat:[150,150,160,0.34],
    K:[200,150,112,0.94],J:[78,82,90,0.92],L:[52,56,64,0.95],p:[184,114,106,0.92],P:[62,66,74,0.92],
    M:[112,116,126,0.95],O:[222,142,82,0.94],c:[238,224,200,0.9],F:[96,118,86,0.5],T:[120,92,68,0.55],
    sun:[232,176,84,0.95],moon:[232,230,214,0.92],
    cloud:[120,124,134,0.30],rain:[150,180,200,0.38],snow:[228,232,240,0.72],star:[236,232,214,0.85]
  };
  var INV={H:[26,24,28,0.94],G:[20,20,24,0.96],w:[232,232,236,0.96],S:[28,28,32,0.94],n:[30,26,26,0.95],heart:[214,120,122,0.92]};
  var COLORKEYS=["win","water","quay","boat","K","J","L","p","P","M","O","c","F","T","sun","moon","cloud","rain","snow","star"];
  var INVKEYS=["H","G","w","S","n","heart"];
  var TINTSKIP={sun:1,moon:1,star:1};
  // 👾 invader fades between a deep violet (readable on light skies) and a bright
  // lavender (readable on dark skies), so it always pops yet stays purple.
  var VIO_DEEP=[96,40,176], VIO_LIGHT=[190,162,255];

  // Phase keyframes keyed on sun altitude (deg). RISE = morning, SET = evening;
  // both share NIGHT (low) and MIDDAY (high). night 0=day colour,1=night colour.
  // light = ambient light tint, lightAmt = how strongly the scene takes it.
  // bg = sky/page colour. Text polarity is derived from bg luminance (below),
  // so twilight skies are kept genuinely deep — keeps text readable all evening.
  var PN={night:1.0,light:[255,255,255],lightAmt:0,bg:[14,14,16]};                  // night
  var PM={night:0.0,light:[255,255,255],lightAmt:0,bg:[244,238,223]};               // midday
  var RISE=[
    {alt:-12,p:PN},
    {alt:-6, p:{night:0.86,light:[80,110,200], lightAmt:0.33,bg:[28,34,62]}}, // dawn blue hour
    {alt:0,  p:{night:0.50,light:[150,140,200],lightAmt:0.40,bg:[44,46,82]}}, // dawn twilight (deep periwinkle)
    {alt:4,  p:{night:0.16,light:[255,205,155],lightAmt:0.45,bg:[250,224,200]}}, // sunrise (peach)
    {alt:10, p:{night:0.05,light:[245,242,228],lightAmt:0.16,bg:[239,238,226]}}, // morning
    {alt:16, p:PM}
  ];
  var SET=[
    {alt:-12,p:PN},
    {alt:-6, p:{night:0.88,light:[70,95,185],  lightAmt:0.36,bg:[24,30,56]}}, // dusk blue hour
    {alt:0,  p:{night:0.54,light:[200,120,150],lightAmt:0.45,bg:[60,40,64]}}, // dusk twilight (deep plum)
    {alt:4,  p:{night:0.18,light:[255,165,110],lightAmt:0.52,bg:[252,216,188]}}, // sunset (amber)
    {alt:10, p:{night:0.05,light:[255,238,206],lightAmt:0.20,bg:[247,236,214]}}, // afternoon
    {alt:16, p:PM}
  ];
  var WHITE=[242,242,244], INK_DARK=[14,14,16], SALT_BONE=[244,238,223];
  function lum(c){return (0.2126*c[0]+0.7152*c[1]+0.0722*c[2])/255;}

  function envFor(alt,rising){
    var seq=rising?RISE:SET,i;
    if(alt<=seq[0].alt)return seq[0].p;
    if(alt>=seq[seq.length-1].alt)return seq[seq.length-1].p;
    for(i=0;i<seq.length-1;i++)if(alt>=seq[i].alt&&alt<=seq[i+1].alt){
      var f=(alt-seq[i].alt)/(seq[i+1].alt-seq[i].alt),a=seq[i].p,b=seq[i+1].p;
      return {night:lr(a.night,b.night,f),lightAmt:lr(a.lightAmt,b.lightAmt,f),light:lerp3(a.light,b.light,f),bg:lerp3(a.bg,b.bg,f)};
    }
    return seq[seq.length-1].p;
  }
  function tc(v,l,a){return v+(v*l/255-v)*a;}
  function tint(c,l,a){var o=[tc(c[0],l[0],a),tc(c[1],l[1],a),tc(c[2],l[2],a)];if(c.length>3)o.push(c[3]);return o;}
  // Resolve the full canvas palette C + page CSS colours for a given sun altitude.
  function resolvePalette(sunAlt,rising){
    var ph=envFor(sunAlt,rising),n=ph.night,amt=ph.lightAmt,L=ph.light,i,k;
    var C={houses:[],houseA:lr(DAY.houseA,NIGHT.houseA,n),reflA:lr(DAY.reflA,NIGHT.reflA,n),dark:n>0.5};
    for(i=0;i<DAY.houses.length;i++)C.houses.push(tint(lerp3(DAY.houses[i],NIGHT.houses[i],n),L,amt).map(Math.round));
    for(k=0;k<COLORKEYS.length;k++){var key=COLORKEYS[k],col=lerp4(DAY[key],NIGHT[key],n);if(!TINTSKIP[key])col=tint(col,L,amt);C[key]=rgba(col);}
    for(k=0;k<INVKEYS.length;k++){var ik=INVKEYS[k];C[ik]=rgba(tint(INV[ik],L,amt));}
    // Pick text polarity from the sky's luminance: whichever of dark/white text
    // contrasts better (the two are equal near lum 0.27). On dark skies the text
    // stays near-white with only a slight step down for secondary/tertiary; on
    // light skies it fades to the familiar greys. Guarantees legibility on the
    // medium twilight tones that flat greys washed out on.
    var tl=smooth(clamp01((0.34-lum(ph.bg))/0.16)),pri=lerp3(INK_DARK,WHITE,tl);
    C.invader=rgba(lerp3(VIO_DEEP,VIO_LIGHT,tl).concat([0.95]));      // violet that adapts to sky brightness
    return {C:C,night:n,bg:rgb(ph.bg),tp:rgb(pri),ts:rgb(lerp3(pri,ph.bg,lr(0.40,0.16,tl))),tt:rgb(lerp3(pri,ph.bg,lr(0.58,0.34,tl))),amb:rgb(lerp3(INK_DARK,SALT_BONE,tl))};
  }

  // Fraction of lit windows to show: the canal goes to sleep in the small hours
  // (~1–5am Amsterdam) and wakes back up by morning. h = local hour (0..24).
  function lateLit(h){
    var lo=0.22;
    if(h>=1&&h<5)return lo;
    if(h>=0.25&&h<1)return lr(1,lo,(h-0.25)/0.75);   // 00:15 → 01:00, dim down
    if(h>=5&&h<6.5)return lr(lo,1,(h-5)/1.5);          // 05:00 → 06:30, wake up
    return 1;
  }
  function amsHour(){try{var s=new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",hour12:false,hourCycle:"h23",timeZone:"Europe/Amsterdam"}).format(skyNow()),p=s.split(":");return (+p[0])+(+p[1])/60;}catch(e){return 12;}}
  // Map a body's altitude/azimuth to a screen point along the sky arc.
  function skyXY(alt,az){
    var topY=Math.max(8,Math.round(H*0.05));
    var horY=Math.min(Math.round(H*0.34),Math.round((contentTopY||H*0.3)-sunR-14));
    if(horY<topY+24)horY=topY+24;
    return {x:Math.round(W*0.12+W*0.76*clamp01((az-90)/180)),y:Math.round(horY+(topY-horY)*clamp01(alt/55))};
  }
  // Recompute palette, page CSS, and sun/moon placement for the current moment.
  function applyPalette(){
    var mode=currentMode(),sky=astro(),alt,rising;
    window.__skyDark=envFor(sky.sun.alt,sky.sun.rising).night>=0.5;   // real Amsterdam darkness, for the toggle's "opposite"
    litFrac=lateLit(amsHour());                                       // dim the canal's windows in the small hours
    if(mode==="light"){alt=18;rising=false;}
    else if(mode==="dark"){alt=-15;rising=false;}
    else {alt=sky.sun.alt;rising=sky.sun.rising;}
    var res=resolvePalette(alt,rising);
    C=res.C;NF=res.night;
    var ds=document.documentElement.style;
    ds.setProperty("--bg",res.bg);ds.setProperty("--text-primary",res.tp);
    ds.setProperty("--text-secondary",res.ts);ds.setProperty("--text-tertiary",res.tt);
    ds.setProperty("--ambient-color",res.amb);
    var metas=document.querySelectorAll('meta[name="theme-color"]');
    for(var mi=0;mi<metas.length;mi++)metas[mi].setAttribute("content",res.bg);
    if(mode==="light"){bSun={x:FX,y:FY,a:1};bMoon=null;bodyX=FX;bodyY=FY;}
    else if(mode==="dark"){bMoon={x:FX,y:FY,a:1,k:sky.moon.k,wax:sky.moon.wax};bSun=null;bodyX=FX;bodyY=FY;}
    else {
      var sunA=clamp01((sky.sun.alt+4)/8);
      var moonA=clamp01(sky.moon.alt/6)*clamp01((res.night-0.2)/0.3)*clamp01(sky.moon.k*3.5);
      if(isMobile){                                          // fixed corner body so the toggle stays findable
        if(res.night>=0.5){bMoon={x:FX,y:FY,a:1,k:sky.moon.k,wax:sky.moon.wax};bSun=null;}
        else {bSun={x:FX,y:FY,a:1};bMoon=null;}
        bodyX=FX;bodyY=FY;
      } else {
        var sp=skyXY(sky.sun.alt,sky.sun.az),mp=skyXY(sky.moon.alt,sky.moon.az);
        bSun=sunA>0.01?{x:sp.x,y:sp.y,a:sunA}:null;
        bMoon=moonA>0.01?{x:mp.x,y:mp.y,a:moonA,k:sky.moon.k,wax:sky.moon.wax}:null;
        if((bMoon?moonA:0)>(bSun?sunA:0)){bodyX=mp.x;bodyY=mp.y;}else{bodyX=sp.x;bodyY=sp.y;}
      }
    }
    positionToggle();
  }

  var W=0,H=0,dpr=1,PIXEL=4,CP=5,treePix=6,cellsX=0,cellsY=0,isMobile=false,bigScale=1,C=null;
  var byColor=[],lit=[],boats=[],trees=[],colTop=[],colCol=[];
  var waterTopRow=0,waterBotRow=0,feetY=0,promY=0,safeL=-1,safeR=-1,GUT=20;
  var SHOW_WALKER=false; // Amrith + Sando — flip to true once the sprites are perfected
  var A={x:0,dir:1,speed:50,target:50,timer:1.5,mode:"walk",leg:0,pet:0,petT:1,peeTree:null};
  var Dg={x:0,dir:1,leg:0,pose:"walk"};
  var contentTopY=0,contentBotY=0,sunR=22,skyBot=0,FX=0,FY=0,bodyX=0,bodyY=0,bSun=null,bMoon=null,NF=0,litFrac=1;
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
    contentTopY=ctp; contentBotY=cb;
    var wTopY,wBotY;
    if(isMobile){
      wTopY=cb+6; wBotY=Math.min(wTopY,walkerTopY-30);
      if(wBotY<wTopY+18)wBotY=wTopY+18;
    } else if(H>=1000){
      // Tall viewports (iPads, large displays): content is centred (matching CSS),
      // so anchor the canal just above the promenade — houses → water → walkers
      // read as one waterfront and the freed space becomes open sky.
      var waterH=Math.round(64*bigScale);
      wBotY=walkerTopY-30; wTopY=wBotY-waterH;
      if(wTopY<cb+6){wTopY=cb+6; if(wBotY<wTopY+18)wBotY=wTopY+18;}
    } else {
      // 13–14" Macs and smaller laptops: tuck flush under the content (unchanged).
      wTopY=cb+6; wBotY=Math.min(wTopY+88,walkerTopY-30);
      if(wBotY<wTopY+18)wBotY=wTopY+18;
    }
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
          if(win){if(R()<0.4)lit.push(cx,cy,R());}   // 3rd value = stable keep-threshold for late-night dimming
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
    W=window.innerWidth;H=window.innerHeight;isMobile=W<=540||H<=540;   // short screens (e.g. phone landscape) use the compact layout too
    // Scale the pixel scene up on screens larger than a 13–14" Mac (≤1536px),
    // so it grows with the display instead of staying tiny. Mobile is untouched.
    bigScale=isMobile?1:Math.min(1.7,Math.max(1,1+(W-1536)/2200));
    PIXEL=isMobile?3:Math.round(4*bigScale);CP=isMobile?4:Math.round(5*bigScale);treePix=isMobile?5:Math.round(7*bigScale);
    canvas.width=Math.floor(W*dpr);canvas.height=Math.floor(H*dpr);
    canvas.style.width=W+"px";canvas.style.height=H+"px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
    if(A.x===0){A.x=W*0.35;Dg.x=A.x+44;}
    sunR=isMobile?16:Math.round(24*bigScale);
    FX=Math.round(W*(isMobile?0.86:0.85)); FY=Math.round(H*(isMobile?0.07:0.12)); // fixed body spot (manual modes / mobile)
    var L=layout();
    skyBot=isMobile?(H+8):(waterTopRow*PIXEL-8);
    applyPalette();            // sets C + page CSS + sun/moon placement (needs contentTopY, sunR, FX/FY)
    build(L);                  // bakes geometry; reads C.houses.length
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
    ctx.fillStyle=C.win;for(i=0;i<lit.length;i+=3){if(lit[i+2]<=litFrac)cell(lit[i],lit[i+1]);}
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
    // Short/landscape screens (e.g. iPad landscape): the centred pair can overlap
    // the content column. If it would, and the right margin has room, tuck it to
    // the bottom-right — clear of the text — like the mobile placement.
    if(!isMobile && safeR>0 && (ground-21*cp) < contentBotY && (W-safeR) >= pairW+24) cx=W-16-pairW;
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
    for(var i=0;i<nC;i++)clouds.push({x:rand()*W,y:top+rand()*(bot-top)*0.7,s:(isMobile?2:Math.round(3*bigScale))+Math.floor(rand()*3),v:5+rand()*10});
    if(WX.precip!=="none"){var n=WX.precip==="snow"?70:110;for(var d=0;d<n;d++)drops.push({x:rand()*W,y:rand()*bot,v:(WX.precip==="snow"?22:130)+rand()*(WX.precip==="snow"?22:90),dx:(rand()-0.5)*(WX.precip==="snow"?10:4)});}
    for(var s2=0;s2<70;s2++)stars.push({x:rand()*W,y:top+rand()*(bot-top)*0.55,p:rand()*6.28});
  }
  function updateSky(dt){
    if(WX.precip==="none")return;
    for(var i=0;i<drops.length;i++){var p=drops[i];p.y+=p.v*dt;p.x+=p.dx*dt;if(p.y>skyBot){p.y=-4;p.x=rand()*W;}}
  }
  function pixDisc(cx,cy,r){var P=PIXEL,x,y;for(y=-r;y<=r;y+=P)for(x=-r;x<=r;x+=P){if(x*x+y*y<=r*r)ctx.fillRect(Math.round(cx+x),Math.round(cy+y),P,P);}}
  function drawSunAt(x,y,a){
    ctx.fillStyle=mulA(C.sun,a);pixDisc(x,y,sunR);
    ctx.strokeStyle=mulA(C.sun,a);ctx.lineWidth=Math.max(2,PIXEL-1);
    for(var i=0;i<8;i++){var an=i*Math.PI/4;ctx.beginPath();ctx.moveTo(x+Math.cos(an)*(sunR+5),y+Math.sin(an)*(sunR+5));ctx.lineTo(x+Math.cos(an)*(sunR+12),y+Math.sin(an)*(sunR+12));ctx.stroke();}
  }
  function drawMoonAt(x,y,a,k,wax){
    ctx.fillStyle=mulA(C.moon,a);pixDisc(x,y,sunR);
    if(k<0.985){var sign=wax?-1:1;ctx.save();ctx.globalCompositeOperation="destination-out";ctx.fillStyle="rgba(0,0,0,1)";pixDisc(x+sign*2*sunR*k,y-sunR*0.12,sunR*1.02);ctx.restore();}
  }
  function drawCelestial(){
    if(bMoon&&bMoon.a>0.01)drawMoonAt(bMoon.x,bMoon.y,bMoon.a,bMoon.k,bMoon.wax);
    if(bSun&&bSun.a>0.01)drawSunAt(bSun.x,bSun.y,bSun.a);
  }
  function drawCloud(cx,cy,s){var map=["..####..",".######.","########",".######."];ctx.fillStyle=C.cloud;for(var r=0;r<map.length;r++){var row=map[r];for(var k=0;k<row.length;k++){if(row.charAt(k)!=="#")continue;var xx=Math.round(cx+k*s),yy=Math.round(cy+r*s);if(visibleSky(xx,yy))ctx.fillRect(xx,yy,s,s);}}}
  function drawSky(t){
    var i,p;
    if(NF>0.62&&WX.clouds<=2&&WX.precip==="none"){var sa=clamp01((NF-0.62)/0.3);ctx.fillStyle=C.star;for(i=0;i<stars.length;i++){p=stars[i];if(!visibleSky(p.x,p.y))continue;var tw=0.5+0.5*Math.sin(t*0.0016+p.p);if(tw>0.62){ctx.globalAlpha=tw*sa;ctx.fillRect(p.x,p.y,2,2);}}ctx.globalAlpha=1;}
    drawCelestial();
    for(i=0;i<clouds.length;i++){var c=clouds[i];var cx=((c.x+t*c.v/1000)%(W+220))-110;if(visibleSky(cx+4*c.s,c.y))drawCloud(cx,c.y,c.s);}
    if(WX.precip==="rain"){ctx.strokeStyle=C.rain;ctx.lineWidth=Math.max(1,PIXEL-2);ctx.beginPath();for(i=0;i<drops.length;i++){p=drops[i];if(!visibleSky(p.x,p.y))continue;ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-2,p.y+9);}ctx.stroke();}
    else if(WX.precip==="snow"){ctx.fillStyle=C.snow;for(i=0;i<drops.length;i++){p=drops[i];if(!visibleSky(p.x,p.y))continue;var sz=Math.max(2,PIXEL-1);ctx.fillRect(p.x,p.y,sz,sz);}}
  }
  function positionToggle(){var b=document.getElementById("theme");if(!b)return;var pad=12;b.style.left=(bodyX-sunR-pad)+"px";b.style.top=(bodyY-sunR-pad)+"px";b.style.width=(2*(sunR+pad))+"px";b.style.height=(2*(sunR+pad))+"px";b.style.right="auto";b.style.bottom="auto";}
  function mapWeather(code){var cl=0,pr="none";if(code<=0)cl=0;else if(code===1)cl=1;else if(code===2)cl=2;else if(code===3)cl=4;else if(code===45||code===48)cl=3;else if((code>=51&&code<=67)||(code>=80&&code<=82)){cl=4;pr="rain";}else if((code>=71&&code<=77)||code===85||code===86){cl=4;pr="snow";}else if(code>=95){cl=5;pr="rain";}WX.clouds=cl;WX.precip=pr;}
  function fetchWeather(){try{fetch("https://api.open-meteo.com/v1/forecast?latitude=52.3676&longitude=4.9041&current=weather_code").then(function(r){return r.json();}).then(function(j){var code=(j&&j.current&&j.current.weather_code)|0;WX.code=code;mapWeather(code);buildSky();}).catch(function(){});}catch(e){}}

  var last=0,raf=0;
  // ── Floating hearts (pet reaction) ──────────────────────────────
  function burst(box,map,color,sc){
    if(!box)return;
    // Fewer, wider-spread, time-staggered sprites so they read individually
    // instead of clumping into an overlapping blob.
    var n=4+Math.floor(rand()*2), cx=box.x+box.w/2, base=Math.max(2,(CP)-1)*(sc||1);
    for(var i=0;i<n;i++)hearts.push({x:cx+(rand()-0.5)*box.w*1.15,y:box.y+(rand()-0.2)*box.h*0.5,vy:26+rand()*20,vx:(rand()-0.5)*30,life:-i*0.10,ttl:1.2+rand()*0.6,s:Math.max(2,base+Math.floor(rand()*2)),map:map,color:color});
  }
  function updateHearts(dt){for(var i=hearts.length-1;i>=0;i--){var h=hearts[i];h.life+=dt;if(h.life<0)continue;h.y-=h.vy*dt;h.x+=h.vx*dt;h.vx*=0.96;if(h.life>=h.ttl)hearts.splice(i,1);}}
  function drawHearts(){for(var i=0;i<hearts.length;i++){var h=hearts[i];if(h.life<=0)continue;var k=h.life/h.ttl,a=k<0.2?(k/0.2):(1-(k-0.2)/0.8);ctx.globalAlpha=Math.max(0,a);sprC(h.map,Math.round(h.x-(h.map[0].length/2)*h.s),Math.round(h.y),h.s,h.color);}ctx.globalAlpha=1;}

  function frame(t){var dt=last?Math.min(0.05,(t-last)/1000):0.016;last=t;updateSky(dt);updateHearts(dt);ctx.clearRect(0,0,W,H);drawSky(t);drawScene(t);drawChill(t);drawHearts();raf=requestAnimationFrame(frame);}
  function renderStatic(){ctx.clearRect(0,0,W,H);drawSky(1500);drawScene(1500);drawChill(1500);}
  function start(){resize();last=0;if(reduceMotion){renderStatic();return;}cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);}
  // Re-resolve the palette/sky for "now" without rebuilding geometry.
  function refresh(){applyPalette();if(reduceMotion)renderStatic();}

  var rt;
  window.addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(start,150);});
  // Sun barely moves between ticks, so a slow timer keeps the crossfade seamless
  // without per-frame CSS writes. Catch up immediately when the tab refocuses.
  setInterval(refresh,30000);
  document.addEventListener("visibilitychange",function(){if(!document.hidden)refresh();});
  window.addEventListener("sky:refresh",refresh);                                  // fired by the theme toggle
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",refresh);

  // Click the avatar photo → space invaders from on-canvas Amrith.
  var avatar=document.querySelector(".avatar");
  if(avatar){avatar.style.cursor="pointer";avatar.addEventListener("click",function(){burst(amrithBox,INVADER,C.invader,0.6);});}
  // Tap/click on the canvas → Sando gives hearts, Amrith gives space invaders.
  // Canvas ignores pointer events, so hit-test against the boxes from a window
  // listener (+ touch).
  function hit(box,x,y){if(!box)return false;var pad=14;return x>=box.x-pad&&x<=box.x+box.w+pad&&y>=box.y-box.h*0.3-pad&&y<=box.y+box.h+pad;}
  function tap(x,y){if(hit(sandoBox,x,y)){burst(sandoBox,HEART,C.heart);return true;}if(hit(amrithBox,x,y)){burst(amrithBox,INVADER,C.invader,0.6);return true;}return false;}
  // When nothing is up in the sky (e.g. a moonless night), the toggle has no
  // visible target — so let a tap anywhere in the empty sky flip the theme.
  function noBody(){return !(bSun&&bSun.a>0.01)&&!(bMoon&&bMoon.a>0.01);}
  function skyTap(x,y){if(noBody()&&y<contentTopY){try{window.dispatchEvent(new Event("sky:toggle"));}catch(e){}return true;}return false;}
  window.addEventListener("click",function(e){if(e.target&&e.target.id==="theme")return;if(tap(e.clientX,e.clientY))return;skyTap(e.clientX,e.clientY);});
  window.addEventListener("touchend",function(e){var t=e.changedTouches&&e.changedTouches[0];if(!t)return;if(tap(t.clientX,t.clientY)||skyTap(t.clientX,t.clientY))e.preventDefault();},{passive:false});

  var seq=[38,38,40,40,37,39,37,39,66,65],pos=0;
  window.addEventListener("keydown",function(e){pos=(e.keyCode===seq[pos])?pos+1:0;if(pos===seq.length){pos=0;var el=document.documentElement;el.style.transition="filter .15s ease";el.style.filter="invert(1) hue-rotate(180deg)";setTimeout(function(){el.style.filter="";},900);}});

  try{console.log("%c@amrith %c· building for the love of the game\n  built by hand, no frameworks. say hi: hi@amrith.co","font-weight:bold","color:#8E8E93");}catch(e){}

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();

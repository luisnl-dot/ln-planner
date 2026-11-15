(function(){
"use strict";
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var stage=$('#stage'),slides=$$('.s'),N=slides.length,cur=-1,busy=false,wipe=$('#wipe');
var fmt=function(n){return Math.round(n).toLocaleString('de-DE')};

/* images */
$$('[data-bg]').forEach(function(el){var u=IMG[el.getAttribute('data-bg')];if(u)el.style.backgroundImage='url('+u+')'});

/* scale stage */
function fit(){var s=Math.min(innerWidth/1920,innerHeight/1080);stage.style.transform='scale('+s+') translate(-50%,-50%)'}
addEventListener('resize',fit);fit();

/* counters */
function count(el){var to=+el.getAttribute('data-count'),sep=el.hasAttribute('data-sep'),t0=performance.now(),d=1500,from=to>1900&&to<2100?1900:0;
  (function f(t){var p=Math.min(1,(t-t0)/d),e=1-Math.pow(1-p,4),v=Math.round(from+(to-from)*e);el.textContent=sep?fmt(v):v;if(p<1)requestAnimationFrame(f)})(t0)}

/* hooks */
var enter={},leave={};

/* navigation */
function go(i,dir){
  if(i<0||i>=N||i===cur||busy)return;
  dir=dir||(i>cur?'fwd':'bwd');var old=slides[cur],nw=slides[i],first=cur<0;
  busy=true;
  if(old){old.classList.remove('on','fwd','bwd');old.classList.add('out');if(leave[old.id])leave[old.id]()}
  nw.classList.remove('out','fwd','bwd');void nw.offsetWidth;
  nw.classList.add('on');if(!first){nw.classList.add(dir);wipe.className='';void wipe.offsetWidth;wipe.className=dir}
  cur=i;hud();
  setTimeout(function(){$$('[data-count]',nw).forEach(count);if(enter[nw.id])enter[nw.id]()},first?300:520);
  setTimeout(function(){if(old)old.classList.remove('out');wipe.className='';busy=false},first?50:960);
  try{history.replaceState(null,'','#'+(i+1))}catch(e){}
  notes();
}
function hud(){
  var s=slides[cur];$('#chap').textContent=s.getAttribute('data-t');
  $('#pg').innerHTML='<b>'+('0'+(cur+1)).slice(-2)+'</b> / '+N;
  $('#bar i').style.width=((cur)/(N-1)*100)+'%';
  $('#hud').style.opacity=1;$('#brand').style.opacity=cur===0?0:1;$('#chap').style.opacity=cur===0?0:1;
  $$('#ovg button').forEach(function(b,k){b.classList.toggle('cur',k===cur)});
}
window.D={next:function(){go(cur+1,'fwd')},prev:function(){go(cur-1,'bwd')},go:go};

/* overview */
var ov=$('#ov'),ovg=$('#ovg');
slides.forEach(function(s,k){var b=document.createElement('button');b.innerHTML='<b>'+('0'+(k+1)).slice(-2)+'</b><span>'+s.getAttribute('data-t')+'</span>';b.onclick=function(){ov.classList.remove('show');go(k)};ovg.appendChild(b)});

/* notes window */
var nw=null;
function notes(){
  if(!nw||nw.closed)return;var s=slides[cur],nx=slides[cur+1];
  nw.document.getElementById('n').innerHTML='<small>Folie '+(cur+1)+' von '+N+'</small><h1>'+s.getAttribute('data-t')+'</h1><p>'+s.getAttribute('data-n')+'</p>'+(nx?'<small>Danach</small><h2>'+nx.getAttribute('data-t')+'</h2>':'');
}
function openNotes(){
  if(nw&&!nw.closed){nw.focus();return}
  nw=window.open('','lnnotes','width=560,height=640');
  if(!nw){alert('Bitte Pop-ups für diese Datei erlauben, um das Notizenfenster zu öffnen.');return}
  nw.document.write('<!doctype html><title>Notizen · Pitch BMW Martin</title><meta charset="utf-8"><style>body{margin:0;padding:34px;background:#0b0b0c;color:#efeae0;font:20px/1.5 -apple-system,Segoe UI,Arial,sans-serif}small{display:block;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#2dcf94;font-weight:700;margin-top:26px}h1{font-size:34px;margin:6px 0 14px;line-height:1.1}h2{font-size:22px;margin:6px 0;color:#a7aeaa}p{margin:0;font-size:22px}#c{position:fixed;right:30px;top:26px;font:700 26px/1 ui-monospace,Menlo,monospace;color:#a7aeaa}button{margin-top:30px;margin-right:8px;font:600 16px/1 inherit;padding:14px 22px;border-radius:999px;border:0;background:#efeae0;color:#000;cursor:pointer}</style><div id="c">00:00</div><div id="n"></div><button onclick="opener.D.prev()">← Zurück</button><button onclick="opener.D.next()">Weiter →</button>');
  nw.document.close();var t0=Date.now();
  nw.setInterval(function(){var s=Math.floor((Date.now()-t0)/1000);nw.document.getElementById('c').textContent=('0'+Math.floor(s/60)).slice(-2)+':'+('0'+s%60).slice(-2)},1000);
  nw.document.addEventListener('keydown',function(e){if(e.key==='ArrowRight'||e.key===' ')D.next();if(e.key==='ArrowLeft')D.prev()});
  notes();
}

/* keys */
addEventListener('keydown',function(e){
  if(e.target&&e.target.tagName==='INPUT')return;
  var k=e.key;
  if(ov.classList.contains('show')){if(k==='Escape'||k==='g'||k==='G'){ov.classList.remove('show')}return}
  if(k==='ArrowRight'||k==='PageDown'||k===' '||k==='Enter'){e.preventDefault();D.next()}
  else if(k==='ArrowLeft'||k==='PageUp'||k==='Backspace'){e.preventDefault();D.prev()}
  else if(k==='Home')go(0);else if(k==='End')go(N-1);
  else if(k==='g'||k==='G')ov.classList.add('show');
  else if(k==='n'||k==='N')openNotes();
  else if(k==='h'||k==='H')document.body.classList.toggle('clean');
  else if(k==='f'||k==='F'){if(document.fullscreenElement)document.exitFullscreen();else if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen()}
});
/* touch */
var tx=null;addEventListener('touchstart',function(e){tx=e.touches[0].clientX},{passive:true});
addEventListener('touchend',function(e){if(tx===null)return;var dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>70&&!(e.target.closest&&e.target.closest('input,.phone,.lf'))){dx<0?D.next():D.prev()}tx=null},{passive:true});

/* generic tab helper */
function tabs(btns,fn){btns.forEach(function(b,k){b.addEventListener('click',function(){btns.forEach(function(x){x.classList.remove('act')});b.classList.add('act');fn(k,b)})})}
function pick(list,k){list.forEach(function(x,j){x.classList.toggle('act',j===k)})}

/* ---- 04 gap ---- */
$$('#gap .it').forEach(function(it){it.addEventListener('click',function(){var o=it.classList.contains('open');$$('#gap .it').forEach(function(x){x.classList.remove('open')});if(!o)it.classList.add('open')})});
leave.s4=function(){$$('#gap .it').forEach(function(x){x.classList.remove('open')})};
enter.s4=function(){setTimeout(function(){if(cur===3&&!$('#gap .it.open'))$$('#gap .it')[0].classList.add('open')},900)};

/* ---- 05 bars ---- */
enter.s5=function(){$$('#s5 .barw i').forEach(function(b,k){b.style.transitionDelay=(k*120)+'ms';b.style.width=b.getAttribute('data-w')+'%'})};
leave.s5=function(){$$('#s5 .barw i').forEach(function(b){b.style.transitionDelay='0s';b.style.width='0'})};

/* ---- 06 map ---- */
(function(){
  var svg=$('#map'),NS='http://www.w3.org/2000/svg',K=101,X0=200,Y0=6;
  function P(lon,lat){return [X0+(lon-5.6)*0.629*K,Y0+(55.15-lat)*K]}
  function el(n,a,p){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);(p||svg).appendChild(e);return e}
  var poly=[[6.9,53.55],[7.3,53.72],[8.1,53.72],[8.55,53.9],[8.95,53.9],[8.85,54.3],[8.6,54.9],[9.4,54.83],[9.95,54.8],[10.0,54.45],[10.95,54.38],[10.8,53.98],[11.4,53.95],[12.1,54.18],[12.5,54.45],[13.4,54.65],[13.75,54.2],[14.25,53.92],[14.4,53.3],[14.15,52.85],[14.62,52.5],[14.75,51.7],[15.02,51.1],[14.3,51.02],[13.2,50.55],[12.3,50.25],[12.55,49.85],[13.8,48.8],[13.45,48.5],[12.8,48.15],[13.05,47.5],[12.2,47.62],[11.1,47.4],[10.25,47.3],[9.6,47.55],[8.6,47.72],[7.6,47.6],[7.6,48.35],[8.2,49.0],[6.4,49.48],[6.15,50.1],[6.05,50.95],[5.95,51.75],[6.75,52.05],[7.05,52.4],[7.2,53.2]];
  function inside(x,y){var c=false;for(var i=0,j=poly.length-1;i<poly.length;j=i++){var a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
  var g=el('g',{});
  for(var la=47.2;la<55.1;la+=0.165)for(var lo=5.8;lo<15.2;lo+=0.262)if(inside(lo,la)){var p=P(lo,la);el('circle',{cx:p[0].toFixed(1),cy:p[1].toFixed(1),r:2.6,'class':'dot'},g)}
  function km(a,b){var R=6371,r=Math.PI/180,dla=(b[1]-a[1])*r,dlo=(b[0]-a[0])*r,h=Math.sin(dla/2)*Math.sin(dla/2)+Math.cos(a[1]*r)*Math.cos(b[1]*r)*Math.sin(dlo/2)*Math.sin(dlo/2);return 2*R*Math.asin(Math.sqrt(h))}
  var W=[11.80,47.86],w=P(W[0],W[1]);
  el('circle',{cx:w[0],cy:w[1],r:60*K/111,'class':'ring'});
  var cust=[['Wetter (Ruhr)',[7.39,51.39],'5. Edition seit 2016',-16,-30,'end'],['Luxemburg',[6.13,49.61],'R 1250 GS Adv. Black',0,34,'middle'],['Freising',[11.75,48.40],'',12,-2,'start'],['Aschheim',[11.72,48.17],'',-12,-2,'end'],['Chiemsee',[12.45,47.87],'',12,5,'start']];
  var dist=$('#dist'),arcs=[];
  cust.forEach(function(c){
    var p=P(c[1][0],c[1][1]),d=Math.round(km(W,c[1])/5)*5,gg=el('g',{'class':'cust'});
    var mx=(p[0]+w[0])/2,my=(p[1]+w[1])/2-Math.abs(p[0]-w[0])*0.28;
    var a=el('path',{d:'M'+w[0]+' '+w[1]+' Q'+mx+' '+my+' '+p[0]+' '+p[1],'class':'arc'});var L=a.getTotalLength();a.style.strokeDasharray=L;a.style.strokeDashoffset=L;arcs.push([a,L]);
    el('circle',{cx:p[0],cy:p[1],r:d>150?8:5},gg);
    var t=el('text',{x:p[0]+c[3],y:p[1]+c[4],'text-anchor':c[5]},gg);t.textContent=c[0];
    if(d>150){var t2=el('text',{x:p[0]+c[3],y:p[1]+c[4]+20,'text-anchor':c[5],'class':'k'},gg);t2.textContent='≈ '+d+' km · '+c[2]}
    var li=document.createElement('li');li.className='tag';li.textContent=c[0]+' · '+d+' km';dist.appendChild(li);
  });
  [['Schongau',[10.90,47.81]],['Oy-Mittelberg',[10.44,47.64]]].forEach(function(s,k){var p=P(s[1][0],s[1][1]),gg=el('g',{'class':'sis'});el('circle',{cx:p[0],cy:p[1],r:5},gg);var t=el('text',{x:p[0]-12,y:p[1]+(k?16:-4),'text-anchor':'end'},gg);t.textContent=s[0]});
  var h=el('g',{'class':'home'});el('circle',{cx:w[0],cy:w[1],r:6,'class':'p'},h);el('circle',{cx:w[0],cy:w[1],r:7,'class':'c'},h);
  var ht=el('text',{x:w[0]+4,y:w[1]+32,'text-anchor':'middle'},h);ht.textContent='WEYARN';
  var tog=$('#mtog'),ind=$('i',tog),bs=$$('button',tog),mw=$('#mapw');
  function set(k){var b=bs[k];bs.forEach(function(x,j){x.classList.toggle('act',j===k)});ind.style.left=b.offsetLeft+'px';ind.style.width=b.offsetWidth+'px';tog.classList.toggle('m',k===1);mw.classList.toggle('m',k===1);
    pick($$('#s6 .view>div'),k);arcs.forEach(function(a,j){a[0].style.transitionDelay=(k?j*130:0)+'ms';a[0].style.strokeDashoffset=k?0:a[1]})}
  bs.forEach(function(b,k){b.addEventListener('click',function(){set(k)})});
  enter.s6=function(){set(0)};leave.s6=function(){set(0)};
})();

/* ---- 07 personas ---- */
$$('#pers .card').forEach(function(c){c.addEventListener('click',function(){c.classList.toggle('flip')})});
leave.s7=function(){$$('#pers .card').forEach(function(c){c.classList.remove('flip')})};

/* ---- 08 idea ---- */
(function(){
  var ps=$$('#pills button'),sw=$$('#swap span'),ex=$$('#expl p'),bg=$$('#s8 .bgs .bg'),c=0;
  function set(k){if(k===c)return;sw.forEach(function(s){s.classList.remove('prev')});sw[c].classList.remove('act');sw[c].classList.add('prev');sw[k].classList.add('act');pick(ex,k);pick(bg,k);pick(ps,k);c=k}
  ps.forEach(function(b,k){b.addEventListener('click',function(){set(k)})});
  leave.s8=function(){set(0)};
})();

/* ---- 10 mockups ---- */
(function(){
  var scr=$$('#phone .scr'),nt=$$('#mnote>div'),tb=$$('#mtabs button');
  tabs(tb,function(k){pick(scr,k);pick(nt,k)});
  var tr=$('#ctr'),dots=$$('#cdots em'),ci=0;
  function car(k){ci=Math.max(0,Math.min(4,k));tr.style.transform='translateX('+(-430*ci)+'px)';pick(dots,ci)}
  $('#cl').onclick=function(){car(ci-1)};$('#cr').onclick=function(){car(ci+1)};
  var left=2*86400+14*3600+37*60+9;
  setInterval(function(){left=left>0?left-1:0;var p=function(n){return('0'+n).slice(-2)};$('#cdd').textContent=p(Math.floor(left/86400));$('#cdh').textContent=p(Math.floor(left%86400/3600));$('#cdm').textContent=p(Math.floor(left%3600/60));$('#cds').textContent=p(left%60)},1000);
  leave.s10=function(){tb[0].click();car(0)};
})();

/* ---- 12 campaigns ---- */
tabs($$('#ks button'),function(k){pick($$('#pan .pn'),k)});
leave.s12=function(){$$('#ks button')[0].click()};

/* ---- 13 lead form ---- */
(function(){
  var st=$$('#lf .st'),pr=$('#lfp'),i=0;
  function set(k){st.forEach(function(s,j){s.classList.toggle('act',j===k);s.classList.toggle('done',j<k)});pr.style.width=Math.min(100,(k+1)*25)+'%';i=k}
  $$('#lf .op button,#lf .go').forEach(function(b){b.addEventListener('click',function(){set(i+1)})});
  $('#lfr').onclick=function(){set(0)};leave.s13=function(){set(0)};
})();

/* ---- 14 wheel ---- */
(function(){
  var svg=$('#wheel'),NS='http://www.w3.org/2000/svg',C=400,mo=$('#mo'),wc=$('#wc');
  function el(n,a){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);svg.appendChild(e);return e}
  function pt(r,a){a=(a-90)*Math.PI/180;return[C+r*Math.cos(a),C+r*Math.sin(a)]}
  function arc(r,a0,a1){var p=pt(r,a0),q=pt(r,a1);return'M'+p[0]+' '+p[1]+' A'+r+' '+r+' 0 '+(a1-a0>180?1:0)+' 1 '+q[0]+' '+q[1]}
  function seg(r0,r1,a0,a1){var a=pt(r1,a0),b=pt(r1,a1),c=pt(r0,a1),d=pt(r0,a0);return'M'+a[0]+' '+a[1]+' A'+r1+' '+r1+' 0 0 1 '+b[0]+' '+b[1]+' L'+c[0]+' '+c[1]+' A'+r0+' '+r0+' 0 0 0 '+d[0]+' '+d[1]+'Z'}
  var M=[
   ['Januar','Winterumbau','Baunummer-Staffeln direkt aus der Werkstatt. Werkbank mit dem Team.','K2 Winterumbau auf voller Kraft. K5 Talente zum Jahreswechsel.','Die Werkstatt hat Luft, die Kunden planen ihre Saison.'],
   ['Februar','Letzte Fenster','Countdown zum Saisonstart. Stücklisten der fertigen Umbauten.','K2 Endspurt mit letzten Terminen. K1 Edition für das Frühjahr.','Wer jetzt bestellt, fährt im April. Das ist das Argument.'],
   ['März','Saisonstart','Übergaben in Serie. Die erste Hausstrecke des Jahres.','K4 Rent startet. K3 Bestand mit Probefahrt-Terminen.','Saisonstart am Hof als fester Termin im Kalender.'],
   ['April','Probefahrt','Hausstrecke, Mietmotorräder, neue Modelle im Fahrbetrieb.','K4 Rent und Probefahrt. K3 Bestand mit Katalog-Anzeigen.','Normale Öffnungszeiten, die ersten warmen Wochenenden.'],
   ['Mai','Hausstrecke','Touren ab Hof. Kundenbilder von unterwegs.','K4 Wochenend-Pauschale. K1 Edition läuft durch.','Brückentage. Wer mietet, steht danach im Showroom.'],
   ['Juni','Reisezeit','Edition auf großer Tour. Schlüsselmomente vor Alpenkulisse.','K4 für Urlauber am Tegernsee und Schliersee.','Hochsaison im Oberland. Sichtbarkeit bei Gästen der Region.'],
   ['Juli','Gemeinschaft','Ausfahrt mit Stammkunden. Die Martin Edition Familie im Bild.','K3 Bestand. Zwillingszielgruppen aus neuen Kundendaten.','Ein eigener Anlass am Hof füllt Kalender und Kontaktliste.'],
   ['August','Modelljahr','Was sich ändert und was Sie daraus bauen werden.','K1 Edition auf die neuen Modelle. Vormerkliste öffnen.','Bestellstart des neuen Modelljahrs, zuletzt im August.'],
   ['September','Edition Drop','Die Herbst-Edition als Ereignis. Andeutung, Enthüllung, Warteliste.','K1 Edition mit dem neuen Film. WhatsApp-Kanal wächst.','Letzte große Touren. Die Aufmerksamkeit ist auf dem Höhepunkt.'],
   ['Oktober','Ankauf','Saisonrückblick. Was Ihr Motorrad jetzt wert ist.','K3 Ankauf und Inzahlungnahme. Vorverkauf Winterumbau.','Winterzeiten beginnen. Viele überlegen jetzt zu wechseln.'],
   ['November','Winterumbau','Start der Baunummer-Staffeln. Vorher und Nachher.','K2 Winterumbau geht live. K5 Talente.','Jetzt. Die Motorräder stehen, die Entscheidung fällt im Warmen.'],
   ['Dezember','Planung','Jahresrückblick der Editionen. Bekleidung und Zubehör.','K2 Winterumbau. K5 Talente, denn zum Jahreswechsel wird gewechselt.','Ruhige Wochen im Betrieb, wache Zielgruppe am Bildschirm.']];
  var segs=[];
  M.forEach(function(m,k){var g=el('g',{'class':'seg'+(k===10?' now':'')});var a0=k*30-15,a1=a0+30;
    var p=document.createElementNS(NS,'path');p.setAttribute('d',seg(210,326,a0,a1));g.appendChild(p);
    var c=pt(268,k*30),t=document.createElementNS(NS,'text');t.setAttribute('x',c[0]);t.setAttribute('y',c[1]);t.textContent=m[0].slice(0,3).toUpperCase();g.appendChild(t);
    g.addEventListener('click',function(){set(k)});segs.push(g)});
  el('path',{d:arc(346,285,405),'class':'band',stroke:'var(--mint)'});
  el('path',{d:arc(346,49,281),'class':'band',stroke:'var(--bone)',opacity:.7});
  el('path',{d:arc(366,199,251),'class':'band',stroke:'var(--yellow)'});
  
  function set(k){pick(segs,k);var m=M[k];wc.textContent=m[1];
    mo.innerHTML='<div class="mh"><b>'+m[0]+'</b><span>'+(k===10?'Sie sind hier':'Schwerpunkt: '+m[1])+'</span></div><dl><dt>Organisch</dt><dd>'+m[2]+'</dd><dt>Bezahlt</dt><dd>'+m[3]+'</dd><dt>Warum jetzt</dt><dd>'+m[4]+'</dd></dl>'}
  set(10);leave.s14=function(){set(10)};
})();

/* ---- 15 calculator ---- */
(function(){
  var r=[1,2,3,4].map(function(k){return $('#r'+k)}),fl=$('#gfl'),nd=$('#gnd'),L=fl.getTotalLength(),tk=$('#gticks');
  fl.style.strokeDasharray=L;
  for(var i=0;i<=10;i+=2){var a=Math.PI-(i/10)*Math.PI,x=440+392*Math.cos(a),y=400-392*Math.sin(a),t=document.createElementNS('http://www.w3.org/2000/svg','text');t.setAttribute('x',x);t.setAttribute('y',y+6);t.textContent=i+'×';tk.appendChild(t)}
  function calc(){
    var b=+r[0].value,cpl=+r[1].value,q=+r[2].value/100,db=+r[3].value,leads=b/cpl,deals=leads*q,dbm=deals*db,x=dbm/b;
    $('#v1').textContent=fmt(b)+' €';$('#v2').textContent=fmt(cpl)+' €';$('#v3').textContent=fmt(q*100)+' %';$('#v4').textContent=fmt(db)+' €';
    r.forEach(function(e){e.style.setProperty('--f',((e.value-e.min)/(e.max-e.min)*100)+'%')});
    $('#o1').textContent=fmt(leads);$('#o2').textContent=deals.toLocaleString('de-DE',{minimumFractionDigits:1,maximumFractionDigits:1});$('#o3').textContent=fmt(dbm)+' €';
    var y=(dbm-b)*12;$('#o4').textContent=(y<0?'−':'')+fmt(Math.abs(y))+' €';
    $('#ox').textContent=x.toLocaleString('de-DE',{minimumFractionDigits:1,maximumFractionDigits:1});
    var p=Math.max(0,Math.min(1,x/10));fl.style.strokeDashoffset=L*(1-p);fl.style.stroke=x<1?'var(--red)':'var(--mint)';nd.style.transform='rotate('+(-90+p*180)+'deg)';
  }
  r.forEach(function(e){e.addEventListener('input',calc)});calc();
  enter.s15=function(){fl.style.strokeDashoffset=L;nd.style.transform='rotate(-90deg)';setTimeout(calc,120)};
})();

/* start */
var h=parseInt(location.hash.slice(1),10);go(h>=1&&h<=N?h-1:0);
})();

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}};
const Wr=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){toast('Память браузера заполнена');return false}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const day=(d=new Date())=>d.toLocaleDateString('sv');
const fmt=s=>{s=Math.round(s);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const MOOD={calm:{t:'Спокойно',v:8.5,i:'😌'},tired:{t:'Усталость',v:5.5,i:'😴'},anxious:{t:'Тревога',v:3.5,i:'😟'}};
const SCALE=['Никогда','Редко','Иногда','Часто','Всегда'];
const DEF=[{id:'t1',title:'Экспресс-тест стресса',own:0,dir:'load',q:['Мне трудно расслабиться','Я раздражаюсь по мелочам','Мне сложно сосредоточиться','Я плохо сплю из-за мыслей']},{id:'t2',title:'Шкала энергии',own:0,dir:'res',q:['Я просыпаюсь бодрым','К вечеру у меня остаются силы','Мне хочется заниматься любимыми делами']}];
/* Встроенные тесты берутся из DEF (работают на любом хостинге), в браузере хранятся только свои */
const loadTests=()=>[...DEF,...L('tests',[]).filter(t=>t.own&&!DEF.some(d=>d.id===t.id||d.title===t.title))];
const S={moods:L('moods',{}),diary:L('diary',[]),voice:L('voice',[]),tests:loadTests(),res:L('res',[]),games:L('games',[])};
let R={avg:null,week:0},tm;function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(tm);tm=setTimeout(()=>e.classList.remove('on'),2200)}
const last7=()=>[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d});

/* Роутинг */
const PAGES=['home','voice','diary','tests','game'];
function route(){
  let id=location.hash.slice(1);if(!PAGES.includes(id))id='home';
  $$('.page').forEach(p=>p.classList.toggle('on',p.id===id));
  $$('#nav a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+id));
  $('#gIcon').classList.toggle('on',id==='game');scrollTo(0,0);({home,voice,diary,tests,game}[id])();
}
addEventListener('hashchange',route);

/* Главная */
function home(){
  $('#date').textContent='Сегодня, '+new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long'});
  const m=S.moods[day()];
  $$('#moods button').forEach(b=>b.classList.toggle('on',b.dataset.m===m));
  const d7=last7().map(x=>day(x)),vals=d7.map(k=>S.moods[k]?MOOD[S.moods[k]].v:null),ok=vals.filter(v=>v!==null);
  const avg=ok.length?ok.reduce((a,b)=>a+b)/ok.length:null;
  $('#score').textContent=avg?avg.toFixed(1):'—';
  $('#stress').textContent=avg===null?'—':avg>=7?'Низкий':avg>=5?'Средний':'Высокий';
  $('#bg').textContent=!ok.length?'—':Math.max(...ok)-Math.min(...ok)<=3?'Стабильный':'Переменный';
  const en=[...S.res].reverse().find(r=>r.t==='t2');$('#energy').textContent=en?en.p+'%':'—';
  $('#tip').textContent=m==='anxious'?'Попробуйте дыхание 4-7-8 или расскажите о тревоге голосом.':m==='tired'?'Сделайте паузу на 10 минут и выпейте воды.':'Небольшая дыхательная практика поможет сохранить баланс.';
  const A={v:S.voice,d:S.diary,t:S.res};
  for(const k in A){const p=Math.round(new Set(A[k].map(e=>e.d).filter(x=>d7.includes(x))).size/7*100);$('#b-'+k+'-p').textContent=p+'%';setTimeout(()=>$('#b-'+k).style.width=p+'%',50)}
  const set={};Object.keys(S.moods).forEach(d=>set[d]=1);[...S.diary,...S.voice,...S.res,...S.games].forEach(e=>set[e.d]=1);
  const week=d7.filter(k=>set[k]).length;$('#week').textContent=Math.round(week/7*100)+'%';
  let st=0;for(let i=0;i<365;i++){const x=new Date();x.setDate(x.getDate()-i);if(set[day(x)])st++;else if(i>0)break}
  $('#streak').textContent=st;setTimeout(()=>$('#ring').style.strokeDashoffset=364*(1-week/7),50);
  R={avg,week};
  const X=i=>40+i*93.3,Y=v=>210-v*18,pts=vals.map((v,i)=>v===null?null:[X(i),Y(v)]),pp=pts.filter(Boolean);
  const line=pp.map(p=>p.join(',')).join(' '),area=pp.length>1?`M${pp[0][0]},210 L${line.replace(/ /g,' L')} L${pp[pp.length-1][0]},210Z`:'';
  $('#chart').innerHTML=`<svg viewBox="0 0 640 250"><defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b8f71" stop-opacity=".28"/><stop offset="1" stop-color="#6b8f71" stop-opacity="0"/></linearGradient></defs>${[30,90,150,210].map(y=>`<line x1="20" x2="620" y1="${y}" y2="${y}" stroke="#e7e4dc"/>`).join('')}<path d="${area}" fill="url(#ag)"/><polyline class="ln" points="${line}" fill="none" stroke="#7b967f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${pts.map(p=>p?`<circle cx="${p[0]}" cy="${p[1]}" r="7" fill="#fff" stroke="#7b967f" stroke-width="4"/>`:'').join('')}${last7().map((x,i)=>`<text x="${X(i)}" y="240" text-anchor="middle">${x.toLocaleDateString('ru-RU',{weekday:'short'}).replace(/^./,c=>c.toUpperCase())}</text>`).join('')}</svg>`;
  $('#chartNote').textContent=ok.length?'':'Отметьте состояние, чтобы увидеть динамику.';
  const dl=ok.length>1&&ok[0]?Math.round((ok[ok.length-1]-ok[0])/ok[0]*100):null;
  $('#badge').textContent=dl===null?ok.length+' из 7 дней':(dl>0?'+':'')+dl+'%';
}

/* Голос */
let rec,chunks,t0,tick,stream;
$('#wave').innerHTML=[...Array(28)].map((_,i)=>`<i style="animation-delay:${(i%7)*.12}s"></i>`).join('');
async function toggleRec(){
  if(rec&&rec.state==='recording'){rec.stop();return}
  try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){toast('Нет доступа к микрофону. Разрешите его в браузере.');return}
  chunks=[];rec=new MediaRecorder(stream);
  rec.ondataavailable=e=>chunks.push(e.data);
  rec.onstop=()=>{clearInterval(tick);stream.getTracks().forEach(t=>t.stop());$('#recBtn').classList.remove('rec');$('#recLbl').textContent='Нажмите, чтобы начать запись';
    const dur=(Date.now()-t0)/1000,r=new FileReader();
    r.onload=()=>{S.voice.unshift({id:Date.now(),d:day(),time:new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}),dur,url:r.result});Wr('voice',S.voice);voice();toast('Запись сохранена')};
    r.readAsDataURL(new Blob(chunks,{type:rec.mimeType}))};
  rec.start();t0=Date.now();$('#recBtn').classList.add('rec');
  tick=setInterval(()=>$('#recLbl').textContent='Идёт запись · '+fmt((Date.now()-t0)/1000),250);
}
function voice(){
  $('#vList').innerHTML=S.voice.length?S.voice.map(v=>`<div class="item"><div><b>${new Date(v.d).toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}, ${v.time}</b><span class="sm">${fmt(v.dur)}</span></div><audio controls src="${v.url}"></audio><button class="x" data-a="vdel" data-id="${v.id}" aria-label="Удалить">✕</button></div>`).join(''):'<div class="empty">Пока нет записей. Нажмите красную кнопку и расскажите, как вы себя чувствуете.</div>';
}

/* Дневник */
let dm='calm';
function diary(){
  $$('#dMoods button').forEach(b=>b.classList.toggle('on',b.dataset.m===dm));
  $('#dList').innerHTML=S.diary.length?S.diary.map(e=>`<div class="item"><div><span class="sm">${new Date(e.d).toLocaleDateString('ru-RU',{day:'numeric',month:'long'})} · ${MOOD[e.m].i} ${MOOD[e.m].t}</span><p>${esc(e.text)}</p></div><button class="x" data-a="ddel" data-id="${e.id}" aria-label="Удалить">✕</button></div>`).join(''):'<div class="empty">Дневник пуст. Напишите первую запись выше.</div>';
}

/* Тесты */
function tests(){
  $('#tRun').hidden=true;$('#tList').hidden=false;$('#tNew').hidden=false;
  $('#tList').innerHTML=S.tests.map(t=>{const r=[...S.res].reverse().find(x=>x.t===t.id);return `<div class="tc"><h3>${esc(t.title)}</h3><span class="sm">${t.q.length} вопр.${r?' · '+r.p+'% · '+INT[dirOf(t)][zone(r.p)].t:''}</span><div class="act"><button class="pri" data-a="trun" data-id="${t.id}">Пройти</button>${t.own?`<button class="btn" data-a="tdel" data-id="${t.id}">Удалить</button>`:''}</div></div>`}).join('');
}
function runTest(id){
  const t=S.tests.find(x=>x.id===id);if(!t)return;
  $('#tList').hidden=true;$('#tNew').hidden=true;const el=$('#tRun');el.hidden=false;el.dataset.id=id;
  el.innerHTML=`<h2>${esc(t.title)}</h2>`+t.q.map((q,i)=>`<div class="q"><b>${esc(q)}</b><div class="opts">${SCALE.map((s,j)=>`<label><input type="radio" name="q${i}" value="${j+1}"><span>${s}</span></label>`).join('')}</div></div>`).join('')+`<div class="frow"><button class="btn" data-a="tback">Назад</button><button class="pri" data-a="tsub">Показать результат</button></div>`;
  scrollTo(0,0);
}
const INT={
 load:[
  {t:'Низкая нагрузка',d:'Вы чувствуете себя спокойно: напряжение почти не заметно, сил хватает и на работу, и на отдых.',tips:['Сохраняйте режим сна и привычные паузы','Отметьте в дневнике, что помогает вам держать баланс']},
  {t:'Лёгкое напряжение',d:'Иногда накапливаются усталость или раздражение, но вы быстро приходите в себя. Это рабочее состояние.',tips:['Делайте паузу на 2–5 минут между занятиями','Заведите короткий вечерний ритуал, чтобы завершать рабочий день','Выберите одно дело, которое можно упростить']},
  {t:'Заметное напряжение',d:'Нагрузка уже влияет на настроение, концентрацию или сон. Организм сигнализирует, что пора снизить темп.',tips:['Пересмотрите приоритеты: одно дело на сегодня, одно на перенос','Поговорите с коллегой или близким о том, что вас напрягает','Пройдитесь 10 минут без телефона','Сыграйте в карточную игру «Перезагрузка»']},
  {t:'Высокое напряжение',d:'Сейчас вы, вероятно, на пределе: много тревоги, усталости или раздражения, трудно восстановиться. Забота о себе должна стать приоритетом.',tips:['Снизьте нагрузку там, где можно, и попросите о конкретной помощи','Расскажите о своём состоянии близкому человеку','Если так длится больше двух недель, обратитесь к психологу или врачу']}],
 res:[
  {t:'Очень мало сил',d:'Сил сейчас почти нет, всё даётся с трудом. Это частая реакция на долгую нагрузку: организму нужен отдых.',tips:['Отложите всё, что можно отложить','Начните с базового: сон, еда, вода','Попросите о поддержке и не оставайтесь с этим в одиночку','Если состояние не улучшается две недели, обратитесь к специалисту']},
  {t:'Ресурс снижен',d:'Энергии хватает на основные дела, но восстановление идёт медленно. Пора добавить в день маленькие радости.',tips:['Микропауза на 2–5 минут каждые пару часов','Одна приятная вещь в день: прогулка, музыка, чай','Не берите дополнительных задач']},
  {t:'Средний ресурс',d:'Вы в рабочем состоянии: силы есть, но запас небольшой. Его стоит поддерживать, пока он не просел.',tips:['Планируйте отдых заранее, не ждите усталости','Двигайтесь 5–10 минут в день','Верните в неделю занятие, которое вас радует']},
  {t:'Высокий ресурс',d:'Вы полны энергии и хорошо восстанавливаетесь. Сейчас удобно браться за важное и поддерживать других.',tips:['Закрепите то, что вас наполняет, и повторяйте регулярно','Используйте этот период для планов и новых шагов','Не забывайте про отдых, даже когда сил много']}]},
COL=['#a9c4ad','#d3dcae','#ecd592','#d9a273'];
const saveTests=()=>Wr('tests',S.tests.filter(t=>t.own));
const zone=p=>p<25?0:p<50?1:p<75?2:3,dirOf=t=>t.dir||(t.id==='t2'?'res':'load');
function submitTest(){
  const t=S.tests.find(x=>x.id===$('#tRun').dataset.id),a=[];
  for(let i=0;i<t.q.length;i++){const c=$(`input[name=q${i}]:checked`);if(!c)return toast('Ответьте на все вопросы');a.push(+c.value)}
  const n=t.q.length,p=Math.round((a.reduce((x,y)=>x+y)-n)/(4*n)*100),dr=dirOf(t),z=zone(p),I=INT[dr][z];
  const prev=[...S.res].reverse().find(x=>x.t===t.id);
  S.res.push({t:t.id,p,d:day(),a});Wr('res',S.res);
  const col=i=>COL[dr==='load'?i:3-i];
  const hist=S.res.filter(x=>x.t===t.id).slice(-5).map(x=>x.p+'%').join(' → ');
  let cmp='';if(prev){const d=p-prev.p,good=dr==='load'?d<0:d>0;cmp=`<div class="dl"><b>Динамика:</b> прошлый раз ${prev.p}%, сейчас ${p}% (${d>0?'+':''}${d}). ${Math.abs(d)<5?'Почти без изменений.':good?'Состояние улучшается.':'Состояние стало хуже, уделите себе больше внимания.'}</div>`}
  const ix=a.map((v,i)=>[v,i]),hi=ix.filter(x=>x[0]>=4).sort((x,y)=>y[0]-x[0]).slice(0,3),lo=ix.filter(x=>x[0]<=2).sort((x,y)=>x[0]-y[0]).slice(0,3);
  const li=l=>l.map(([v,i])=>`<li>${esc(t.q[i])}<span>${SCALE[v-1]}</span></li>`).join('');
  $('#tRun').innerHTML=`<div class="rr"><span class="sm">${esc(t.title)}</span>
  <div class="rtop"><span class="num">${p}%</span><div><h2>${I.t}</h2><p class="muted">${I.d}</p></div></div>
  <div class="zbar">${[0,1,2,3].map(i=>`<i style="background:${col(i)};opacity:${i===z?1:.4}"></i>`).join('')}<b id="zm" style="left:0"></b></div>
  <div class="zlab"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>
  ${cmp}
  ${hi.length?`<h4>Проявляется сильнее всего</h4><ul class="rl2">${li(hi)}</ul>`:''}
  ${lo.length?`<h4>Почти не проявляется</h4><ul class="rl2">${li(lo)}</ul>`:''}
  <h4>Что можно сделать</h4><ul class="tips">${I.tips.map(x=>`<li>${x}</li>`).join('')}</ul>
  ${hist.includes('→')?`<p class="muted">Последние результаты: ${hist}</p>`:''}
  <p class="muted">Как читать процент: 0% — на все утверждения вы ответили «Никогда», 100% — «Всегда». ${dr==='load'?'Чем выше процент, тем сильнее нагрузка и напряжение.':'Чем выше процент, тем больше сил и ресурса.'} Это самооценка, а не диагноз.</p>
  <button class="pri" data-a="tback">К списку тестов</button></div>`;
  setTimeout(()=>{const m=$('#zm');if(m)m.style.left=p+'%'},60);
}

/* События */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,id=b.dataset.id;
  if(GA(a,b))return;
  if(a==='mood'){S.moods[day()]=b.dataset.m;Wr('moods',S.moods);home();toast('Состояние сохранено')}
  else if(a==='rep'){const k=b.dataset.k;if(k==='mood')location.hash='#diary';else if(k==='tests')location.hash='#tests';else if(k==='health')toast(R.avg?'Среднее состояние за неделю: '+R.avg.toFixed(1)+' из 10':'Пока нет данных. Отметьте состояние выше.');else toast('Активных дней за неделю: '+R.week+' из 7')}
  else if(a==='rec')toggleRec();
  else if(a==='vdel'){S.voice=S.voice.filter(v=>v.id!=id);Wr('voice',S.voice);voice()}
  else if(a==='dmood'){dm=b.dataset.m;diary()}
  else if(a==='dadd'){const t=$('#dText').value.trim();if(!t)return toast('Напишите хотя бы пару слов');S.diary.unshift({id:Date.now(),d:day(),m:dm,text:t});Wr('diary',S.diary);$('#dText').value='';diary();toast('Запись сохранена')}
  else if(a==='ddel'){S.diary=S.diary.filter(x=>x.id!=id);Wr('diary',S.diary);diary()}
  else if(a==='trun')runTest(id);
  else if(a==='tback')tests();
  else if(a==='tsub')submitTest();
  else if(a==='tdel'){S.tests=S.tests.filter(x=>x.id!==id);saveTests();tests()}
  else if(a==='texp'){const c=S.tests.filter(t=>t.own);if(!c.length)return toast('Своих тестов пока нет');
    const code=c.map(t=>'  '+JSON.stringify({id:t.id,title:t.title,own:0,dir:t.dir||'load',q:t.q})).join(',\n');
    const o=$('#tOut');o.hidden=false;o.value=code;o.select();navigator.clipboard&&navigator.clipboard.writeText(code).catch(()=>{});toast('Код готов: вставьте его в массив DEF в app.js')}
  else if(a==='tadd'){const title=$('#tTitle').value.trim(),q=$('#tQs').value.split('\n').map(x=>x.trim()).filter(Boolean);
    if(!title||!q.length)return toast('Укажите название и хотя бы один вопрос');
    S.tests.push({id:'u'+Date.now(),title,q,own:1,dir:$('#tDir').value});saveTests();$('#tTitle').value=$('#tQs').value='';$('#tNew').open=false;tests();toast('Тест создан')}
});
/* Аккаунт: любые логин и пароль подходят, пароль нигде не проверяется и не хранится */
let U=L('user',null);const USERS=L('users',{});
function user(){
  $('#uName').textContent=U?U.name:'Войти';
  $('#avTxt').textContent=U?(U.name[0]||'☺').toUpperCase():'☺';
  $('#hi').textContent='Привет'+(U?', '+U.name:'')+', как ты себя чувствуешь сегодня?';
}
function setUser(login,name){U={login,name};Wr('user',U);$('#auth').close();$$('#auth form').forEach(f=>f.reset());user();toast('Добро пожаловать, '+name)}
$('#fIn').onsubmit=e=>{e.preventDefault();const l=e.target.elements.login.value.trim();setUser(l,USERS[l]||l||'Гость')};
$('#fUp').onsubmit=e=>{e.preventDefault();const f=e.target.elements,l=f.login.value.trim(),n=f.name.value.trim()||l||'Гость';USERS[l]=n;Wr('users',USERS);setUser(l,n)};
$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));
function accOpen(){
  if(!U){$('#auth').showModal();return}
  $('#accName').textContent=U.name;$('#accLogin').textContent=U.login?'Логин: '+U.login:'';
  $('#accStats').innerHTML=[['Игр сыграно',S.games.length],['Записей в дневнике',S.diary.length],['Голосовых записей',S.voice.length],['Тестов пройдено',S.res.length]].map(([t,n])=>`<div><b>${n}</b><span>${t}</span></div>`).join('');
  $('#acc').showModal();
}

/* Игра */
const SC=v=>v===null?'':v===0?'Совсем нет сил':v<=3?'Очень мало сил':v<=6?'Средний уровень':v<=8?'Достаточно сил':'Высокий уровень ресурса';
let G=null;
function game(){if(!G)G={s:0,b:null,a:null,cur:[],note:[],step:''};gRender();gHist()}
const gSave=()=>{const n=$('#gNote');if(n&&G.s>0&&G.s<5)G.note[G.s-1]=n.value};
function gRender(){
  const s=G.s,box=$('#gBox');
  $('#gSteps').innerHTML=G.done?'':['Старт',...DECKS.map(d=>d.t),'Финал'].map((t,i)=>`<span class="${i<s?'done':i===s?'now':''}">${t}</span>`).join('');
  if(G.done){const d=G.a-G.b;box.innerHTML=`<div class="res"><span class="sm">Ваш ресурс</span><span class="num">${G.b} → ${G.a}</span><p class="muted">${d>0?'Ресурс вырос на '+d+'. Закрепите это одним шагом.':d===0?'Ресурс не изменился. Это нормально: маленький шаг поможет двигаться дальше бережно.':'Ресурс стал ниже. Позаботьтесь о себе сегодня и при необходимости обратитесь за поддержкой.'}</p><p><b>Шаг на сутки:</b> ${esc(G.step)||'не записан'}</p><br><button class="pri" data-a="gnew">Сыграть ещё раз</button></div>`;return}
  if(s===0||s===5){
    const v=s?G.a:G.b;
    box.innerHTML=`<h2>${s?'Как вы чувствуете себя теперь?':'Оцените свой ресурс'}</h2><p class="muted">От 0 до 10. Это субъективная оценка, а не диагноз.</p><div class="scale">${[...Array(11)].map((_,i)=>`<button data-a="rate" data-v="${i}" class="${v===i?'on':''}">${i}</button>`).join('')}</div><p class="muted sc">${SC(v)}</p>${s?`<textarea id="gStep" rows="2" placeholder="Один шаг на ближайшие сутки">${esc(G.step)}</textarea>`:''}<div class="frow"><span></span><button class="pri" data-a="gnext">${s?'Завершить игру':'Начать игру'}</button></div>`;return}
  const d=DECKS[s-1],i=G.cur[s-1];
  if(i===undefined){box.innerHTML=`<div class="cardw"><button class="cback ${d.k}" data-a="draw"><b>${d.t}</b><span>Нажмите, чтобы вытянуть карту</span></button></div>`;return}
  const c=d.c[i];
  box.innerHTML=`<div class="cardw"><article class="cface ${d.k}"><span class="dk">${d.t}</span><h2>${c[0]}</h2><h4>Ситуация</h4><p>${c[1]}</p><h4>Задание</h4><p>${c[2]}</p></article></div><textarea id="gNote" rows="3" placeholder="Заметки по заданию (необязательно)">${esc(G.note[s-1]||'')}</textarea><p class="muted sc">В паре слушайте без критики и советов, если о них не попросили.</p><div class="frow"><button class="btn" data-a="skip">Пропустить карту</button><button class="pri" data-a="gnext">${s===4?'К финалу':'Дальше'}</button></div>`;
}
function gNext(){
  const s=G.s;
  if(s===0){if(G.b===null)return toast('Выберите оценку от 0 до 10');G.s=1}
  else if(s<5){if(G.cur[s-1]===undefined)return toast('Сначала вытяните карту');gSave();G.s++}
  else{if(G.a===null)return toast('Оцените ресурс ещё раз');G.step=$('#gStep').value.trim();
    S.games.unshift({id:Date.now(),d:day(),time:new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}),b:G.b,a:G.a,step:G.step,cards:G.cur.map((i,k)=>DECKS[k].c[i][0])});
    Wr('games',S.games);G.done=true;gHist();toast('Игра сохранена')}
  gRender();scrollTo(0,0);
}
function gHist(){
  $('#gList').innerHTML=S.games.length?S.games.map(g=>`<div class="item"><div><b>${new Date(g.d).toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}, ${g.time}</b><span class="sm">${g.cards.join(' · ')}</span>${g.step?`<p>Шаг: ${esc(g.step)}</p>`:''}</div><span class="pill">${g.b} → ${g.a}</span><button class="x" data-a="gdel" data-id="${g.id}" aria-label="Удалить">✕</button></div>`).join(''):'<div class="empty">Сыгранных игр пока нет. Начните выше — это займёт 20–30 минут.</div>';
}
function GA(a,b){
  const id=b.dataset.id;
  if(a==='acc')accOpen();
  else if(a==='close')b.closest('dialog').close();
  else if(a==='tab'){$$('.tabs button').forEach(x=>x.classList.toggle('on',x===b));$('#fIn').hidden=b.dataset.t!=='in';$('#fUp').hidden=b.dataset.t!=='up'}
  else if(a==='logout'){U=null;Wr('user',null);$('#acc').close();user();toast('Вы вышли из кабинета')}
  else if(a==='rate'){const v=+b.dataset.v;G[G.s?'a':'b']=v;$$('.scale button').forEach(x=>x.classList.toggle('on',x===b));$('.sc').textContent=SC(v)}
  else if(a==='draw'){G.cur[G.s-1]=Math.floor(Math.random()*DECKS[G.s-1].c.length);gRender()}
  else if(a==='skip'){gSave();const n=DECKS[G.s-1].c.length;let k;do{k=Math.floor(Math.random()*n)}while(k===G.cur[G.s-1]&&n>1);G.cur[G.s-1]=k;G.note[G.s-1]='';gRender()}
  else if(a==='gnext')gNext();
  else if(a==='gnew'){G=null;game()}
  else if(a==='gdel'){S.games=S.games.filter(x=>x.id!=id);Wr('games',S.games);gHist()}
  else return false;
  return true;
}
user();
route();

function e(e){return!!e.form}var t=[`header`,`staticText`,`divider`];function n(e,t){return e==null?``:typeof e==`object`?e[t]||e.en||Object.values(e).find(e=>!!e)||``:String(e)}function r(e){let n={};for(let[r,i]of Object.entries(e.items||{}))i&&!t.includes(i.type)&&(n[r]=i.type);return n}function i(e){return typeof e==`string`?e:typeof e==`number`||typeof e==`boolean`?e.toString():JSON.stringify(e)}function a(e,t){if(t!=null)switch(e){case`number`:case`slider`:{if(typeof t==`number`)return Number.isFinite(t)?t:void 0;let e=i(t).trim().replace(`,`,`.`);if(!e)return;let n=Number(e);return Number.isFinite(n)?n:void 0}case`checkbox`:return t===!0||t===`true`||t===1||t===`1`;default:return i(t)}}function o(e,t){let n={};for(let[r,i]of Object.entries(e)){let e=a(i,t[r]);e!==void 0&&(n[r]=e)}return n}var s=`"Roboto", "Helvetica", "Arial", sans-serif`,c=Object.freeze({type:`light`,primary:`#3399CC`,primaryContrast:`#FFFFFF`,secondary:`#164477`,secondaryContrast:`#FFFFFF`,background:`#FFFFFF`,paper:`#FFFFFF`,text:`rgba(0, 0, 0, 0.87)`,textSecondary:`rgba(0, 0, 0, 0.6)`,divider:`rgba(0, 0, 0, 0.12)`,error:`#D32F2F`,warning:`#ED6C02`,info:`#0288D1`,success:`#2E7D32`,fontFamily:s,fontSize:14,borderRadius:4}),l=Object.freeze({type:`dark`,primary:`#4DABF5`,primaryContrast:`rgba(0, 0, 0, 0.87)`,secondary:`#436A93`,secondaryContrast:`#FFFFFF`,background:`#121212`,paper:`#121212`,text:`#FFFFFF`,textSecondary:`rgba(255, 255, 255, 0.7)`,divider:`rgba(255, 255, 255, 0.12)`,error:`#F44336`,warning:`#FFA726`,info:`#29B6F6`,success:`#66BB6A`,fontFamily:s,fontSize:14,borderRadius:4}),u=[`primary`,`primaryContrast`,`secondary`,`secondaryContrast`,`background`,`paper`,`text`,`textSecondary`,`divider`,`error`,`warning`,`info`,`success`,`fontFamily`],d=[`fontSize`,`borderRadius`];function f(e){return{...e===`dark`?l:c}}function p(e){if(!e||typeof e!=`object`)return f(typeof e==`string`?e:`light`);let t=e,n=f(typeof t.type==`string`?t.type:`light`);for(let e of u){let r=t[e];typeof r==`string`&&r.trim()&&(n[e]=r.trim())}for(let e of d){let r=t[e],i=typeof r==`string`?parseFloat(r):r;typeof i==`number`&&Number.isFinite(i)&&i>=0&&(n[e]=i)}return n}function m(e,t){return e.type===t.type&&u.every(n=>e[n]===t[n])&&d.every(n=>e[n]===t[n])}function h(e){return`--iob-${e.replace(/[A-Z]/g,e=>`-${e.toLowerCase()}`)}`}function g(e){let t={};for(let n of u)t[h(n)]=e[n];for(let n of d)t[h(n)]=`${e[n]}px`;return t[`color-scheme`]=e.type,t}var _={ok:{en:`OK`,"zh-cn":`确定`},cancel:{en:`Cancel`,de:`Abbrechen`,ru:`Отмена`,pt:`Cancelar`,nl:`Annuleren`,fr:`Annuler`,it:`Annulla`,es:`Cancelar`,pl:`Anuluj`,uk:`Скасувати`,"zh-cn":`取消`},close:{en:`Close`,de:`Schließen`,ru:`Закрыть`,pt:`Fechar`,nl:`Sluiten`,fr:`Fermer`,it:`Chiudi`,es:`Cerrar`,pl:`Zamknij`,uk:`Закрити`,"zh-cn":`关闭`}},v=`
dialog {
    box-sizing: border-box;
    width: 480px;
    max-width: calc(100vw - 32px);
    max-height: calc(100vh - 32px);
    padding: 0;
    border: 0;
    border-radius: calc(var(--iob-border-radius) * 2);
    background: var(--iob-paper);
    color: var(--iob-text);
    font-family: var(--iob-font-family);
    font-size: var(--iob-font-size);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
/* as the dialogs of MUI: a dark paper gets lighter the higher it lies */
dialog.dark { background-image: linear-gradient(rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.16)); }
dialog::backdrop { background: rgba(0, 0, 0, 0.5); }
dialog:focus { outline: none; }
form { display: flex; flex-direction: column; height: 100%; max-height: inherit; margin: 0; }
header { display: flex; align-items: center; gap: 8px; padding: 12px 8px 12px 16px; font-size: 1.15em; font-weight: 500; }
header span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.body { flex: 1; min-height: 0; padding: 0 16px 16px; overflow: auto; display: flex; flex-direction: column; gap: 12px; }
footer { display: flex; justify-content: flex-end; gap: 8px; padding: 0 16px 16px; }
button { font: inherit; padding: 6px 16px; border-radius: var(--iob-border-radius); border: 1px solid var(--iob-primary); background: transparent; color: var(--iob-primary); cursor: pointer; }
button.primary { background: var(--iob-primary); color: var(--iob-primary-contrast); }
button.close { border: 0; padding: 2px 8px; font-size: 1.4em; line-height: 1; color: var(--iob-text-secondary); }
label { display: flex; flex-direction: column; gap: 4px; }
label.check { flex-direction: row; align-items: center; gap: 8px; }
input, select, textarea { font: inherit; accent-color: var(--iob-primary); }
.help { color: var(--iob-text-secondary); font-size: 0.85em; }
h3 { margin: 4px 0 0; font-size: 1em; }
p { margin: 0; }
hr { width: 100%; border: 0; border-top: 1px solid var(--iob-divider); margin: 0; }
[hidden] { display: none !important; }
`;function y(e){if(!e)return null;try{let t=Function(`data`,`return (${e});`);return e=>{try{return!!t(e)}catch{return!1}}}catch{return null}}function b(e){return typeof e==`string`?e:typeof e==`number`||typeof e==`boolean`?String(e):``}function x(e){let{input:t,setting:n}=e;if(t)return t instanceof HTMLInputElement&&t.type===`checkbox`?t.checked:t instanceof HTMLSelectElement?n.options?.[t.selectedIndex]?.value:t.value}function S(e,t,r,i,a){let o={name:t,setting:r,box:e.createElement(`div`),hidden:y(r.hidden),disabled:y(r.disabled)},s=n(r.label,a);switch(r.type){case`header`:return o.box=e.createElement(`h3`),o.box.textContent=n(r.text,a)||s,o;case`staticText`:return o.box=e.createElement(`p`),o.box.textContent=n(r.text,a)||s,o;case`divider`:return o.box=e.createElement(`hr`),o}let c=e.createElement(`label`);o.box=c;let l=e.createElement(`span`);if(l.textContent=s||t,r.type===`checkbox`){let t=e.createElement(`input`);t.type=`checkbox`,t.checked=i===!0||i===`true`,c.className=`check`,c.append(t,l),o.input=t}else if(r.type===`select`){let t=e.createElement(`select`);for(let i of r.options||[]){let r=e.createElement(`option`);r.textContent=n(i.label,a),t.append(r)}let s=(r.options||[]).findIndex(e=>String(e.value)===b(i));t.selectedIndex=s===-1?0:s,c.append(l,t),o.input=t}else if(r.type===`text`&&(r.minRows||1)>1){let t=e.createElement(`textarea`);t.rows=r.minRows||2,t.value=b(i),c.append(l,t),o.input=t}else{let t=e.createElement(`input`),n=b(i);switch(r.type){case`number`:case`slider`:t.type=r.type===`slider`?`range`:`number`,r.min!==void 0&&(t.min=String(r.min)),r.max!==void 0&&(t.max=String(r.max)),t.step=r.step===void 0?`any`:String(r.step);break;case`password`:t.type=`password`;break;case`color`:t.type=!n||/^#[0-9a-f]{6}$/i.test(n)?`color`:`text`;break;default:t.type=`text`}if(t.value=n,t.type===`range`){let n=e.createElement(`output`);n.textContent=t.value,t.addEventListener(`input`,()=>n.textContent=t.value),l.append(`: `,n)}c.append(l,t),o.input=t}if(r.help){let t=e.createElement(`span`);t.className=`help`,t.textContent=n(r.help,a),c.append(t)}return o}function C(t,i={}){let a=i.lang||`en`,s=document,c=e=>_[e][a]||_[e].en||e,l=s.createElement(`div`);l.setAttribute(`data-iob-dialog`,``);let u=l.attachShadow({mode:`open`}),d=s.createElement(`style`);d.textContent=v;let f=s.createElement(`dialog`),m=p(i.theme);f.className=m.type===`dark`?`dark`:``;for(let[e,t]of Object.entries(g(m)))f.style.setProperty(e,t);t.width&&(f.style.width=`${t.width}px`),t.height&&(f.style.height=`${t.height}px`);let h=s.createElement(`form`),y=s.createElement(`header`),b=s.createElement(`span`);b.textContent=n(t.title,a);let C=s.createElement(`button`);C.type=`button`,C.className=`close`,C.title=c(`close`),C.setAttribute(`aria-label`,c(`close`)),C.textContent=`×`,y.append(b,C);let w=s.createElement(`div`);return w.className=`body`,h.append(y,w),f.append(h),u.append(d,f),new Promise(i=>{let d=!1,p=e=>{d||(d=!0,f.open&&f.close(),l.remove(),i(e))};if(C.addEventListener(`click`,()=>p(null)),f.addEventListener(`close`,()=>p(null)),h.addEventListener(`submit`,e=>e.preventDefault()),e(t)){let e={},i=[];for(let[e,n]of Object.entries(t.form.items||{})){let r=t.data?.[e]??n.default,o=S(s,e,n,r,a);i.push(o),w.append(o.box)}let l=()=>{for(let t of i)t.input&&(e[t.name]=x(t));return e},u=()=>{let e=l();for(let t of i)t.box.hidden=t.hidden?t.hidden(e):!1,t.input&&(t.input.disabled=t.disabled?t.disabled(e):!1)};h.addEventListener(`input`,u),h.addEventListener(`change`,u),u();let d=i.find(e=>e.input&&!e.box.hidden&&!e.input.disabled);d?.input&&(d.input.autofocus=!0);let f=s.createElement(`footer`),m=s.createElement(`button`);m.type=`button`,m.textContent=n(t.cancel,a)||c(`cancel`),m.addEventListener(`click`,()=>p(null));let g=s.createElement(`button`);g.type=`submit`,g.className=`primary`,g.textContent=n(t.ok,a)||c(`ok`),f.append(m,g),h.append(f),h.addEventListener(`submit`,()=>p(o(r(t.form),l())))}else w.append(t.element),f.addEventListener(`iob-dialog-close`,e=>p(e.detail??null));s.body.append(l),f.showModal(),u.activeElement&&u.activeElement!==C||(f.tabIndex=-1,f.focus())})}function w(e){return[...new Set(e.filter(e=>typeof e==`string`&&!!e))]}var T=[`socket`,`dialogs`,`theme`,`editMode`,`settings`,`value`],E=class extends HTMLElement{states={};objects={};#e=null;#t={};#n=p(`light`);#r=!1;#i=null;#a=void 0;#o=null;#s=!1;#c=(e,t)=>{this.#o?.states.includes(e)&&(this.states[e]=t||null,this.#_())};#l=(e,t)=>{this.#o?.objects.includes(e)&&(this.objects[e]=t||null,this.#d())};get socket(){return this.#e}set socket(e){this.#e=e||null,this.#d()}get settings(){return this.#t}set settings(e){this.#t=e||{},this.#d()}get theme(){return this.#n}set theme(e){let t=p(e);m(t,this.#n)||(this.#n=t,this.#u(),this.#_())}get editMode(){return this.#r}set editMode(e){let t=!!e;t!==this.#r&&(this.#r=t,this.#_())}get dialogs(){return this.#i}set dialogs(e){this.#i=e||null}get value(){return this.#a}set value(e){e!==this.#a&&(this.#a=e,this.#_())}connectedCallback(){for(let e of T)if(Object.prototype.hasOwnProperty.call(this,e)){let t=this[e];delete this[e],this[e]=t}this.#u(),this.#d()}disconnectedCallback(){this.#g()}getStateIds(e){return[]}getObjectIds(e){return[]}get systemLang(){return this.#e?.systemLang||`en`}text(e){return n(e,this.systemLang)}setState(e,t){return this.#e&&!this.#r?this.#e.setState(e,t):Promise.resolve()}changeValue(e){return this.#r||this.emit(`iob-change`,e)?!1:(this.value=e,!0)}emit(e,t){return this.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:!0,composed:!0,cancelable:!0}))}async openDialog(t){if(this.#r)return null;let n=this.#i?await this.#i.open(t):await C(t,{lang:this.systemLang,theme:this.#n});return e(t)?n&&typeof n==`object`?o(r(t.form),n):null:n??null}#u(){for(let[e,t]of Object.entries(g(this.#n)))this.style.setProperty(e,t)}#d(){if(!this.isConnected)return;let e=this.#e,t=e?w(this.getStateIds(this.#t)):[],n=e?w(this.getObjectIds(this.#t)):[];this.#o&&this.#o.socket!==e&&this.#g();let r=this.#o?.states||[],i=this.#o?.objects||[],a=r.filter(e=>!t.includes(e)),o=i.filter(e=>!n.includes(e)),s=t.filter(e=>!r.includes(e)),c=n.filter(e=>!i.includes(e));e&&a.length&&e.unsubscribeState(a,this.#c),e&&o.length&&this.#h(e,o);for(let e of a)delete this.states[e];for(let e of[...a,...o])!t.includes(e)&&!n.includes(e)&&delete this.objects[e];this.#o=e&&(t.length||n.length)?{socket:e,states:t,objects:n}:null,e&&s.length&&this.#p(e,s),e&&c.length&&this.#m(e,c),this.#_()}#f(e,t,n){return this.#o?.socket===e&&this.#o[t].includes(n)}#p(e,t){e.subscribeState(t,this.#c).catch(e=>console.warn(`<${this.localName}>: cannot subscribe ${t.join(`, `)}: ${e}`));for(let n of t)e.getState(n).then(t=>{this.#f(e,`states`,n)&&this.states[n]===void 0&&(this.states[n]=t||null,this.#_())}).catch(()=>{}),e.getObject(n).then(t=>{this.#f(e,`states`,n)&&!this.#f(e,`objects`,n)&&(this.objects[n]=t||null,this.#_())}).catch(()=>{})}#m(e,t){e.subscribeObject(t,this.#l).catch(e=>console.warn(`<${this.localName}>: cannot subscribe the objects ${t.join(`, `)}: ${e}`));for(let n of t)e.getObject(n).then(t=>{this.#f(e,`objects`,n)&&(this.objects[n]=t||null,this.#d())}).catch(()=>{})}#h(e,t){e.unsubscribeObject(t,this.#l).catch(()=>{})}#g(){if(this.#o){let{socket:e,states:t,objects:n}=this.#o;t.length&&e.unsubscribeState(t,this.#c),n.length&&this.#h(e,n),this.#o=null}this.states={},this.objects={}}#_(){this.#s||(this.#s=!0,queueMicrotask(()=>{this.#s=!1,this.isConnected&&this.render()}))}};function D(e,t){let n=typeof e==`string`?e:e.tag;customElements.get(n)||customElements.define(n,t)}function O(e){return(e||``).toString().replace(/[^a-zA-Z0-9_]/g,`_`)}function k(e){return e.toLowerCase().replace(/[^a-f0-9]/g,``)}function A(e){return`sensors.${(e.name?O(e.name):``)||`s_${k(e.mac)}`}`}var j=`0 0 100 184`,M=170,N=`M14 64C14 44 30 36 50 36S86 44 86 64V154C86 166 72 170 50 170S14 166 14 154Z`,P=`M34 6h32a6 6 0 0 1 6 6v26H28V12a6 6 0 0 1 6-6Zm4 6a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3h24a3 3 0 0 0 3-3v-4a3 3 0 0 0-3-3Z`;function F(e){return e.replace(/[&<>"']/g,e=>`&#${e.charCodeAt(0)};`)}function I(e){let t=134*(e.fill===null||!Number.isFinite(e.fill)?0:Math.max(0,Math.min(100,e.fill)))/100,n=M-t,r=`mopeka-body-${e.uid}`,i=`mopeka-shine-${e.uid}`,a=e.sublabel?106:112,o=[`<svg class="bottle" viewBox="${j}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${F([e.label,e.sublabel].filter(Boolean).join(` `))}">`,`<defs>`,`<clipPath id="${r}"><path d="${N}"/></clipPath>`,`<linearGradient id="${i}" x1="0" x2="1" y1="0" y2="0">`,`<stop offset="0" stop-color="#fff" stop-opacity=".04"/>`,`<stop offset=".22" stop-color="#fff" stop-opacity=".32"/>`,`<stop offset=".46" stop-color="#fff" stop-opacity="0"/>`,`<stop offset="1" stop-color="#000" stop-opacity=".16"/>`,`</linearGradient>`,`</defs>`,`<g class="art">`,`<rect class="metal" x="24" y="158" width="52" height="24" rx="3"/>`,`<path class="metal" fill-rule="evenodd" d="${P}"/>`,`<path class="body" d="${N}"/>`,`<g clip-path="url(#${r})">`];if(t>0&&o.push(`<rect class="liquid ${e.level}" x="0" y="${n.toFixed(2)}" width="100" height="${t.toFixed(2)}"/>`,`<rect class="surface ${e.level}" x="0" y="${n.toFixed(2)}" width="100" height="2.5"/>`),o.push(`<rect x="0" y="0" width="100" height="184" fill="url(#${i})"/>`,`</g>`,`<path class="seam" d="M14.5 104H85.5"/>`,`<path class="outline" d="${N}"/>`,`<rect class="valve" x="44" y="24" width="12" height="14" rx="2"/>`,`</g>`,`<text class="label" x="50" y="${a}" text-anchor="middle">${F(e.label)}</text>`),e.sublabel){let t=e.alert?`sublabel alert`:`sublabel`;o.push(`<text class="${t}" x="50" y="126" text-anchor="middle">${F(e.sublabel)}</text>`)}return o.push(`</svg>`),o.join(``)}var L=`iob-mopeka-tank`,R=[`level_pct`,`level_mm`,`temperature`,`battery_pct`,`quality`,`reachable`],z={chooseSensor:`Choose a sensor or an instance in the settings`,noSensors:`No sensors configured`,offline:`offline`,noHeight:`Set the tank height in the adapter to see the fill level in %`,temperature:`Temperature`,battery:`Battery`,quality:`Reading quality`},B={en:z,de:{chooseSensor:`Sensor oder Instanz in den Einstellungen wählen`,noSensors:`Keine Sensoren konfiguriert`,offline:`offline`,noHeight:`Tankhöhe im Adapter eintragen, um den Füllstand in % zu sehen`,temperature:`Temperatur`,battery:`Batterie`,quality:`Messqualität`},ru:{chooseSensor:`Выберите датчик или экземпляр в настройках`,noSensors:`Датчики не настроены`,offline:`нет связи`,noHeight:`Укажите высоту бака в адаптере, чтобы видеть уровень в %`,temperature:`Температура`,battery:`Батарея`,quality:`Качество измерения`},pt:{chooseSensor:`Escolha um sensor ou uma instância nas definições`,noSensors:`Nenhum sensor configurado`,offline:`offline`,noHeight:`Defina a altura do tanque no adaptador para ver o nível em %`,temperature:`Temperatura`,battery:`Bateria`,quality:`Qualidade da leitura`},nl:{chooseSensor:`Kies een sensor of een instantie in de instellingen`,noSensors:`Geen sensoren geconfigureerd`,offline:`offline`,noHeight:`Stel de tankhoogte in de adapter in om het vulniveau in % te zien`,temperature:`Temperatuur`,battery:`Batterij`,quality:`Meetkwaliteit`},fr:{chooseSensor:`Choisissez un capteur ou une instance dans les paramètres`,noSensors:`Aucun capteur configuré`,offline:`hors ligne`,noHeight:`Indiquez la hauteur du réservoir dans l'adaptateur pour voir le niveau en %`,temperature:`Température`,battery:`Batterie`,quality:`Qualité de mesure`},it:{chooseSensor:`Scegli un sensore o un'istanza nelle impostazioni`,noSensors:`Nessun sensore configurato`,offline:`offline`,noHeight:`Imposta l'altezza del serbatoio nell'adattatore per vedere il livello in %`,temperature:`Temperatura`,battery:`Batteria`,quality:`Qualità della lettura`},es:{chooseSensor:`Elija un sensor o una instancia en los ajustes`,noSensors:`No hay sensores configurados`,offline:`sin conexión`,noHeight:`Indique la altura del depósito en el adaptador para ver el nivel en %`,temperature:`Temperatura`,battery:`Batería`,quality:`Calidad de lectura`},pl:{chooseSensor:`Wybierz czujnik lub instancję w ustawieniach`,noSensors:`Brak skonfigurowanych czujników`,offline:`offline`,noHeight:`Ustaw wysokość zbiornika w adapterze, aby zobaczyć poziom w %`,temperature:`Temperatura`,battery:`Bateria`,quality:`Jakość pomiaru`},uk:{chooseSensor:`Виберіть датчик або екземпляр у налаштуваннях`,noSensors:`Датчики не налаштовано`,offline:`немає зв'язку`,noHeight:`Вкажіть висоту бака в адаптері, щоб бачити рівень у %`,temperature:`Температура`,battery:`Батарея`,quality:`Якість вимірювання`},"zh-cn":{chooseSensor:`请在设置中选择传感器或实例`,noSensors:`未配置传感器`,offline:`离线`,noHeight:`在适配器中设置罐高度以查看百分比液位`,temperature:`温度`,battery:`电池`,quality:`读数质量`}};function V(e,t){return(B[t]||z)[e]}var H=`
:host {
    display: block;
    width: 100%;
    height: 100%;
    container-type: size;
}
.root {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: stretch;
    justify-content: center;
    gap: 4cqmin;
    padding: 2cqmin;
}
.tank {
    flex: 1 1 0;
    min-width: 0;
    max-width: calc(100cqh * 0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5cqmin;
}
.bottle {
    /* only the height left over by the name and the details */
    flex: 1 1 0;
    min-height: 0;
    width: 100%;
}
.offline .art {
    opacity: 0.45;
}
.name {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
    font-size: clamp(11px, 7cqmin, 20px);
}
.details {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    column-gap: 0.8em;
    font-size: clamp(10px, 5.5cqmin, 15px);
    color: var(--iob-text-secondary);
    white-space: nowrap;
}
.details span {
    display: inline-flex;
    align-items: center;
    gap: 0.25em;
}
.details svg {
    height: 1.05em;
    width: auto;
    fill: currentColor;
}
.details .weak {
    color: var(--iob-error);
}
.bar {
    opacity: 0.3;
}
.bar.on {
    opacity: 1;
}
.message {
    margin: auto;
    padding: 4cqmin;
    text-align: center;
    color: var(--iob-text-secondary);
    font-size: clamp(11px, 6cqmin, 16px);
}

/* the bottle, see bottle.ts */
.metal {
    fill: color-mix(in srgb, var(--iob-text-secondary) 45%, var(--iob-paper));
    stroke: var(--iob-text-secondary);
    stroke-width: 2;
}
.body {
    fill: color-mix(in srgb, var(--iob-text) 8%, var(--iob-paper));
}
.outline {
    fill: none;
    stroke: var(--iob-text-secondary);
    stroke-width: 2.5;
}
.seam {
    stroke: var(--iob-text-secondary);
    stroke-opacity: 0.35;
    stroke-width: 1.5;
}
.valve {
    fill: var(--iob-text-secondary);
}
.liquid.ok {
    fill: var(--iob-success);
}
.liquid.low {
    fill: var(--iob-warning);
}
.liquid.critical {
    fill: var(--iob-error);
}
.liquid.unknown {
    fill: var(--iob-text-secondary);
}
.surface {
    fill: #fff;
    fill-opacity: 0.35;
}
.label,
.sublabel {
    fill: var(--iob-text);
    stroke: var(--iob-paper);
    paint-order: stroke;
    stroke-linejoin: round;
}
.label {
    font-size: 20px;
    font-weight: 700;
    stroke-width: 4px;
}
.sublabel {
    font-size: 11px;
    stroke-width: 3px;
}
.sublabel.alert {
    fill: var(--iob-error);
    font-weight: 700;
}
`,U=`system.adapter.`,W=20,G={sensor:{id:`sample`,name:`Propane`},values:{level_pct:65,level_mm:198,temperature:12.5,battery_pct:90,quality:3,reachable:!0}};function K(e){let t=(e||``).trim();return t.startsWith(U)?t.slice(15):t}function q(e){let t=e.trim().split(`.`);return t[2]===`sensors`&&t.length>4?t.slice(0,4).join(`.`):t.join(`.`)}function J(e){if(e==null||e===``)return null;let t=typeof e==`number`?e:parseFloat(String(e));return Number.isFinite(t)?t:null}var Y=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 13.2V5a3 3 0 0 0-6 0v8.2a5 5 0 1 0 6 0ZM12 4a1 1 0 0 1 1 1v5h-2V5a1 1 0 0 1 1-1Z"/></svg>`;function X(e){return`<svg viewBox="0 0 26 14" aria-hidden="true"><rect x="1" y="1" width="21" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="22.6" y="4.5" width="2.4" height="5" rx="1"/><rect x="3" y="3" width="${(17*Math.max(0,Math.min(100,e))/100).toFixed(1)}" height="8" rx="1"/></svg>`}function Z(e){return`<svg viewBox="0 0 16 14" aria-hidden="true">${[5,9,13].map((t,n)=>`<rect class="bar${n<e?` on`:``}" x="${1+n*5}" y="${14-t}" width="4" height="${t}" rx="1"/>`).join(``)}</svg>`}D(L,class extends E{#e;constructor(){super(),this.#e=this.attachShadow({mode:`open`})}getObjectIds(e){if(e.sensor)return[q(e.sensor)];let t=K(e.instance);return t?[`${U}${t}`]:[]}getStateIds(e){return(this.#t(e)||[]).flatMap(e=>R.map(t=>`${e.id}.${t}`))}#t(e){if(e.sensor){let t=q(e.sensor);return[{id:t,name:this.text(this.objects[t]?.common?.name)||t.split(`.`).pop()||t}]}let t=K(e.instance);if(!t)return null;let n=this.objects[`${U}${t}`]?.native;return(Array.isArray(n?.sensors)?n.sensors:[]).filter(e=>e?.mac&&e.enabled!==!1).map(e=>({id:`${t}.${A(e)}`,name:e.name||e.mac}))}#n(e,t){let n=this.systemLang===`zh-cn`?`zh-CN`:this.systemLang;try{return e.toLocaleString(n,{minimumFractionDigits:t,maximumFractionDigits:t})}catch{return e.toFixed(t)}}#r(e,t,n){let r=this.settings,i=this.systemLang,a=J(t.level_pct),o=J(t.level_mm),s=J(t.temperature),c=J(t.battery_pct),l=J(t.quality),u=t.reachable===!1,d=typeof r.lowPct==`number`?r.lowPct:W,f=`unknown`;a!==null&&(f=a<=d/2?`critical`:a<=d?`low`:`ok`);let p=`–`;a===null?o!==null&&(p=`${this.#n(o,0)} mm`):p=`${this.#n(a,0)} %`;let m=a!==null&&o!==null?`${this.#n(o,0)} mm`:void 0;u&&(m=V(`offline`,i));let h=a===null&&o!==null?V(`noHeight`,i):``,g=`<div class="tank${u?` offline`:``}"${h?` title="${F(h)}"`:``}>`;if(g+=I({fill:a,level:f,label:p,sublabel:m,alert:u,uid:String(n)}),r.showName!==!1&&(g+=`<div class="name" title="${F(e.name)}">${F(e.name)}</div>`),r.showDetails!==!1){let e=[];s!==null&&e.push(`<span title="${F(V(`temperature`,i))}">${Y}${this.#n(s,1)} °C</span>`),c!==null&&e.push(`<span class="${c<20?`weak`:``}" title="${F(V(`battery`,i))}">${X(c)}${this.#n(c,0)} %</span>`),l!==null&&e.push(`<span title="${F(V(`quality`,i))}">${Z(l)}</span>`),e.length&&(g+=`<div class="details">${e.join(``)}</div>`)}return`${g}</div>`}#i(){let e=this.settings,t=this.systemLang,n=this.#t(e);return n?n.length?n.map((e,t)=>{let n={};for(let t of R)n[t]=this.states[`${e.id}.${t}`]?.val;return this.#r(e,n,t)}).join(``):this.objects[`${U}${K(e.instance)}`]===void 0?``:`<div class="message">${F(V(`noSensors`,t))}</div>`:this.editMode?this.#r(G.sensor,G.values,0):`<div class="message">${F(V(`chooseSensor`,t))}</div>`}render(){this.#e.innerHTML=`<style>${H}</style><div class="root">${this.#i()}</div>`}});
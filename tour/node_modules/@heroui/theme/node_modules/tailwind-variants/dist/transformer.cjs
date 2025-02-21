'use strict';

var V = require('tailwindcss/resolveConfig');
var w = require('fs');
var O = require('path');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var V__default = /*#__PURE__*/_interopDefault(V);
var w__default = /*#__PURE__*/_interopDefault(w);
var O__default = /*#__PURE__*/_interopDefault(O);

var S=t=>{w__default.default.writeFileSync(O__default.default.join(__dirname,"generated.d.ts"),t);},C=t=>`export type TVGeneratedScreens = ${Object.keys(t).map(r=>`"${r}"`).join(" | ")};
`,v=t=>{queueMicrotask(()=>{if(t!=null&&t.screens){let r=C(t.screens);S(r);}});};var p={tv:/tv\s*\(((\([^\)]*?\)|\[[^\]]*?\]|.)*?)\)/gs,tvExtend:/extend:\s*\w+(,| )\s*/,comment:/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm,blankLine:/^\s*$(?:\r\n?|\n)/gm,extension:/\.\w+/g},l=t=>Array.isArray(t),b=t=>typeof t=="string",d=t=>typeof t=="object",$=t=>typeof t=="boolean",y=t=>typeof t=="function",f=t=>!!(!t||l(t)&&t.length===0||b(t)&&t.length===0||d(t)&&Object.keys(t).length===0),k=(t,r)=>{let n={},e=r.length,s=Object.prototype.hasOwnProperty;for(let a=0;a<e;a++){let o=r[a];s.call(t,o)&&(n[o]=t[o]);}return n},A=(t,r)=>{let n="https://github.com/nextui-org/tailwind-variants/issues/new/choose";console.log("\x1B[31m%s\x1B[0m",`${t}: ${r.message}`),console.log(`If you think this is an issue, please submit it at ${n}`);},h=(...t)=>r=>t.reduce((n,e)=>e(n),r),P=t=>{let n=t.replace(p.comment,"$1").toString().replace(p.blankLine,"").toString(),e=s=>s[1].replace(p.tvExtend,"").toString();return Array.from(n.matchAll(p.tv),e)},F=t=>{let r=P(t);if(!f(r))return r.map(n=>n.includes("responsiveVariants")?new Function(`
      const [options, config] = [${n.toString()}];
      return {options, config};
    `)():{})},E=t=>t.flatMap(r=>r).toString().replaceAll(","," ").split(" "),I=(t,r)=>{let n={};for(let[e,s]of Object.entries(t))n[e]={},n[e].original=s,!f(s)&&(n.temp=l(s)?E(s):s.split(" "),r.forEach(a=>{let o="";n.temp.forEach(i=>{o+=`${a}:${i} `;}),n[e][a]=o.trimEnd();}),delete n.temp);return n},B=(t,r)=>b(t)?t.split(" "):l(t)?E(t):d(t)?I(t,r):t,x=(t,r)=>{let n={};for(let[e,s]of Object.entries(t))if(n[e]={},!f(s))for(let[a,o]of Object.entries(s)){if(n[e][a]={},n[e][a].original=o,f(o))continue;let i=B(o,r);if(!f(i)){if(!l(i)){n[e][a]=i;continue}r.forEach(c=>{let m="";i.forEach(u=>{m+=`${c}:${u} `;}),n[e][a][c]=m.trimEnd();});}}return n},T=({options:t,config:r},n)=>{var a,o;let e=(a=t==null?void 0:t.variants)!=null?a:{},s=(o=r==null?void 0:r.responsiveVariants)!=null?o:!1;if(!(!s||f(e))){if($(s))return x(e,n);if(l(s))return x(e,s);if(d(s)){let i=[];for(let[c,m]of Object.entries(s)){if(!m||f(m))continue;let j={options:{variants:k(e,[c])},config:{responsiveVariants:m}};i.push(T(j,n));}return i}}},D=(t,r,n)=>{try{let e=["tailwind-variants"];if(!(l(n==null?void 0:n.aliases)?[...n.aliases,...e]:e).some(u=>t.includes(u)))return t;let o=F(t);if(f(o))return t;let i=JSON.stringify(o.map(u=>T(u,r)),void 0,2),c=`
/* Tailwind Variants Transformed Content Start

`,m=`

Tailwind Variants Transformed Content End */
`;return t.concat(c+i+m)}catch(e){return A("Tailwind Variants Transform Failed",e),t}},g=t=>{let r=t.map(n=>{if(d(n)&&n.extension)return n.extension;let e=n.match(p.extension);return e||(e=n.split("{"),e=e.pop().replace("}","").split(",")),e.map(s=>s.replace(".","").split(".")).flat()}).flatMap(n=>n);return Array.from(new Set(r)).filter(n=>n!=="html")},G=(t,r)=>{var a;let n=V__default.default(t);if(v(n.theme),f((a=n.content)==null?void 0:a.files)||!l(n.content.files))return n;let e=o=>{var i,c;return D(o,Object.keys((c=(i=n.theme)==null?void 0:i.screens)!=null?c:{}),r)},s=n.content.transform;if(f(s)){let i=g(n.content.files).map(c=>[c,e]);return n.content.transform=Object.fromEntries(i),n}if(y(s)){let i=g(n.content.files).map(c=>[c,h(e,s)]);return n.content.transform=Object.fromEntries(i),n}if(d(s)){let i=g(n.content.files).map(c=>y(s[c])?[c,h(e,s[c])]:[c,e]);return n.content.transform=Object.fromEntries(i),n}return n};

exports.tvTransformer = D;
exports.withTV = G;

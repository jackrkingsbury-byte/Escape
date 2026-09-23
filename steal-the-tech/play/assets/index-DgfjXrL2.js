import{M as ha,G as Xe,a as _e,b as Nt,C as Y_,S as fm,R as fv,D as Bl,A as Zs,c as B_,B as pv,V as be,d as Ph,e as Ks,m as lm,f as tc,L as hv,O as Qh,g as Ws,h as Hl,i as Zo,j as _v,T as gv,P as pm,k as sm,I as Ko,Q as hm,l as G_,n as I_,o as bv,p as Ol,q as yv,r as vv,s as wv,E as xv,t as jv,u as kv,v as Sv,w as Tv,W as Nv,x as Ev,y as Mv,F as Av,z as Cv,H as zv,J as $v,K as Ov,N as Rv,U as qv,X as Dv,Y as Uv,Z as Lv}from"./three-aCZjbBTh.js";(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const m of document.querySelectorAll('link[rel="modulepreload"]'))r(m);new MutationObserver(m=>{for(const u of m)if(u.type==="childList")for(const f of u.addedNodes)f.tagName==="LINK"&&f.rel==="modulepreload"&&r(f)}).observe(document,{childList:!0,subtree:!0});function s(m){const u={};return m.integrity&&(u.integrity=m.integrity),m.referrerPolicy&&(u.referrerPolicy=m.referrerPolicy),m.crossOrigin==="use-credentials"?u.credentials="include":m.crossOrigin==="anonymous"?u.credentials="omit":u.credentials="same-origin",u}function r(m){if(m.ep)return;m.ep=!0;const u=s(m);fetch(m.href,u)}})();function Hv(a){return a&&a.__esModule&&Object.prototype.hasOwnProperty.call(a,"default")?a.default:a}var Yu={exports:{}},Ys={};var Zh;function Yv(){if(Zh)return Ys;Zh=1;var a=Symbol.for("react.transitional.element"),i=Symbol.for("react.fragment");function s(r,m,u){var f=null;if(u!==void 0&&(f=""+u),m.key!==void 0&&(f=""+m.key),"key"in m){u={};for(var _ in m)_!=="key"&&(u[_]=m[_])}else u=m;return m=u.ref,{$$typeof:a,type:r,key:f,ref:m!==void 0?m:null,props:u}}return Ys.Fragment=i,Ys.jsx=s,Ys.jsxs=s,Ys}var Kh;function Bv(){return Kh||(Kh=1,Yu.exports=Yv()),Yu.exports}var c=Bv(),Bu={exports:{}},Bs={},Gu={exports:{}},Iu={};var Wh;function Gv(){return Wh||(Wh=1,(function(a){function i(K,ue){var ce=K.length;K.push(ue);e:for(;0<ce;){var tt=ce-1>>>1,Ae=K[tt];if(0<m(Ae,ue))K[tt]=ue,K[ce]=Ae,ce=tt;else break e}}function s(K){return K.length===0?null:K[0]}function r(K){if(K.length===0)return null;var ue=K[0],ce=K.pop();if(ce!==ue){K[0]=ce;e:for(var tt=0,Ae=K.length,Lt=Ae>>>1;tt<Lt;){var $n=2*(tt+1)-1,qa=K[$n],S=$n+1,X=K[S];if(0>m(qa,ce))S<Ae&&0>m(X,qa)?(K[tt]=X,K[S]=ce,tt=S):(K[tt]=qa,K[$n]=ce,tt=$n);else if(S<Ae&&0>m(X,ce))K[tt]=X,K[S]=ce,tt=S;else break e}}return ue}function m(K,ue){var ce=K.sortIndex-ue.sortIndex;return ce!==0?ce:K.id-ue.id}if(a.unstable_now=void 0,typeof performance=="object"&&typeof performance.now=="function"){var u=performance;a.unstable_now=function(){return u.now()}}else{var f=Date,_=f.now();a.unstable_now=function(){return f.now()-_}}var h=[],b=[],x=1,y=null,v=3,w=!1,A=!1,z=!1,D=!1,R=typeof setTimeout=="function"?setTimeout:null,q=typeof clearTimeout=="function"?clearTimeout:null,V=typeof setImmediate<"u"?setImmediate:null;function Z(K){for(var ue=s(b);ue!==null;){if(ue.callback===null)r(b);else if(ue.startTime<=K)r(b),ue.sortIndex=ue.expirationTime,i(h,ue);else break;ue=s(b)}}function ee(K){if(z=!1,Z(K),!A)if(s(h)!==null)A=!0,ke||(ke=!0,le());else{var ue=s(b);ue!==null&&ne(ee,ue.startTime-K)}}var ke=!1,U=-1,ie=5,ye=-1;function it(){return D?!0:!(a.unstable_now()-ye<ie)}function mt(){if(D=!1,ke){var K=a.unstable_now();ye=K;var ue=!0;try{e:{A=!1,z&&(z=!1,q(U),U=-1),w=!0;var ce=v;try{t:{for(Z(K),y=s(h);y!==null&&!(y.expirationTime>K&&it());){var tt=y.callback;if(typeof tt=="function"){y.callback=null,v=y.priorityLevel;var Ae=tt(y.expirationTime<=K);if(K=a.unstable_now(),typeof Ae=="function"){y.callback=Ae,Z(K),ue=!0;break t}y===s(h)&&r(h),Z(K)}else r(h);y=s(h)}if(y!==null)ue=!0;else{var Lt=s(b);Lt!==null&&ne(ee,Lt.startTime-K),ue=!1}}break e}finally{y=null,v=ce,w=!1}ue=void 0}}finally{ue?le():ke=!1}}}var le;if(typeof V=="function")le=function(){V(mt)};else if(typeof MessageChannel<"u"){var Q=new MessageChannel,ge=Q.port2;Q.port1.onmessage=mt,le=function(){ge.postMessage(null)}}else le=function(){R(mt,0)};function ne(K,ue){U=R(function(){K(a.unstable_now())},ue)}a.unstable_IdlePriority=5,a.unstable_ImmediatePriority=1,a.unstable_LowPriority=4,a.unstable_NormalPriority=3,a.unstable_Profiling=null,a.unstable_UserBlockingPriority=2,a.unstable_cancelCallback=function(K){K.callback=null},a.unstable_forceFrameRate=function(K){0>K||125<K?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):ie=0<K?Math.floor(1e3/K):5},a.unstable_getCurrentPriorityLevel=function(){return v},a.unstable_next=function(K){switch(v){case 1:case 2:case 3:var ue=3;break;default:ue=v}var ce=v;v=ue;try{return K()}finally{v=ce}},a.unstable_requestPaint=function(){D=!0},a.unstable_runWithPriority=function(K,ue){switch(K){case 1:case 2:case 3:case 4:case 5:break;default:K=3}var ce=v;v=K;try{return ue()}finally{v=ce}},a.unstable_scheduleCallback=function(K,ue,ce){var tt=a.unstable_now();switch(typeof ce=="object"&&ce!==null?(ce=ce.delay,ce=typeof ce=="number"&&0<ce?tt+ce:tt):ce=tt,K){case 1:var Ae=-1;break;case 2:Ae=250;break;case 5:Ae=1073741823;break;case 4:Ae=1e4;break;default:Ae=5e3}return Ae=ce+Ae,K={id:x++,callback:ue,priorityLevel:K,startTime:ce,expirationTime:Ae,sortIndex:-1},ce>tt?(K.sortIndex=ce,i(b,K),s(h)===null&&K===s(b)&&(z?(q(U),U=-1):z=!0,ne(ee,ce-tt))):(K.sortIndex=Ae,i(h,K),A||w||(A=!0,ke||(ke=!0,le()))),K},a.unstable_shouldYield=it,a.unstable_wrapCallback=function(K){var ue=v;return function(){var ce=v;v=ue;try{return K.apply(this,arguments)}finally{v=ce}}}})(Iu)),Iu}var Jh;function Iv(){return Jh||(Jh=1,Gu.exports=Gv()),Gu.exports}var Xu={exports:{}},Ne={};var Fh;function Xv(){if(Fh)return Ne;Fh=1;var a=Symbol.for("react.transitional.element"),i=Symbol.for("react.portal"),s=Symbol.for("react.fragment"),r=Symbol.for("react.strict_mode"),m=Symbol.for("react.profiler"),u=Symbol.for("react.consumer"),f=Symbol.for("react.context"),_=Symbol.for("react.forward_ref"),h=Symbol.for("react.suspense"),b=Symbol.for("react.memo"),x=Symbol.for("react.lazy"),y=Symbol.for("react.activity"),v=Symbol.for("react.view_transition"),w=Symbol.iterator;function A(S){return S===null||typeof S!="object"?null:(S=w&&S[w]||S["@@iterator"],typeof S=="function"?S:null)}var z={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},D=Object.assign,R={};function q(S,X,me){this.props=S,this.context=X,this.refs=R,this.updater=me||z}q.prototype.isReactComponent={},q.prototype.setState=function(S,X){if(typeof S!="object"&&typeof S!="function"&&S!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,S,X,"setState")},q.prototype.forceUpdate=function(S){this.updater.enqueueForceUpdate(this,S,"forceUpdate")};function V(){}V.prototype=q.prototype;function Z(S,X,me){this.props=S,this.context=X,this.refs=R,this.updater=me||z}var ee=Z.prototype=new V;ee.constructor=Z,D(ee,q.prototype),ee.isPureReactComponent=!0;var ke=Array.isArray;function U(){}var ie={H:null,A:null,T:null,S:null},ye=Object.prototype.hasOwnProperty;function it(S,X,me){var fe=me.ref;return{$$typeof:a,type:S,key:X,ref:fe!==void 0?fe:null,props:me}}function mt(S,X){return it(S.type,X,S.props)}function le(S){return typeof S=="object"&&S!==null&&S.$$typeof===a}function Q(S){var X={"=":"=0",":":"=2"};return"$"+S.replace(/[=:]/g,function(me){return X[me]})}var ge=/\/+/g;function ne(S,X){return typeof S=="object"&&S!==null&&S.key!=null?Q(""+S.key):X.toString(36)}function K(S){switch(S.status){case"fulfilled":return S.value;case"rejected":throw S.reason;default:switch(typeof S.status=="string"?S.then(U,U):(S.status="pending",S.then(function(X){S.status==="pending"&&(S.status="fulfilled",S.value=X)},function(X){S.status==="pending"&&(S.status="rejected",S.reason=X)})),S.status){case"fulfilled":return S.value;case"rejected":throw S.reason}}throw S}function ue(S,X,me,fe,Qe){var Ce=typeof S;(Ce==="undefined"||Ce==="boolean")&&(S=null);var We=!1;if(S===null)We=!0;else switch(Ce){case"bigint":case"string":case"number":We=!0;break;case"object":switch(S.$$typeof){case a:case i:We=!0;break;case x:return We=S._init,ue(We(S._payload),X,me,fe,Qe)}}if(We)return Qe=Qe(S),We=fe===""?"."+ne(S,0):fe,ke(Qe)?(me="",We!=null&&(me=We.replace(ge,"$&/")+"/"),ue(Qe,X,me,"",function(bn){return bn})):Qe!=null&&(le(Qe)&&(Qe=mt(Qe,me+(Qe.key==null||S&&S.key===Qe.key?"":(""+Qe.key).replace(ge,"$&/")+"/")+We)),X.push(Qe)),1;We=0;var se=fe===""?".":fe+":";if(ke(S))for(var Te=0;Te<S.length;Te++)fe=S[Te],Ce=se+ne(fe,Te),We+=ue(fe,X,me,Ce,Qe);else if(Te=A(S),typeof Te=="function")for(S=Te.call(S),Te=0;!(fe=S.next()).done;)fe=fe.value,Ce=se+ne(fe,Te++),We+=ue(fe,X,me,Ce,Qe);else if(Ce==="object"){if(typeof S.then=="function")return ue(K(S),X,me,fe,Qe);throw X=String(S),Error("Objects are not valid as a React child (found: "+(X==="[object Object]"?"object with keys {"+Object.keys(S).join(", ")+"}":X)+"). If you meant to render a collection of children, use an array instead.")}return We}function ce(S,X,me){if(S==null)return S;var fe=[],Qe=0;return ue(S,fe,"","",function(Ce){return X.call(me,Ce,Qe++)}),fe}function tt(S){if(S._status===-1){var X=S._result,me=X();me.then(function(fe){(S._status===0||S._status===-1)&&(S._status=1,S._result=fe,me.status===void 0&&(me.status="fulfilled",me.value=fe))},function(fe){(S._status===0||S._status===-1)&&(S._status=2,S._result=fe,me.status===void 0&&(me.status="rejected",me.reason=fe))}),S._status===-1&&(S._status=0,S._result=me)}if(S._status===1)return S._result.default;throw S._result}var Ae=typeof reportError=="function"?reportError:function(S){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var X=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof S=="object"&&S!==null&&typeof S.message=="string"?String(S.message):String(S),error:S});if(!window.dispatchEvent(X))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",S);return}console.error(S)};function Lt(S){var X=ie.T,me={};me.types=X!==null?X.types:null,ie.T=me;try{var fe=S(),Qe=ie.S;Qe!==null&&Qe(me,fe),typeof fe=="object"&&fe!==null&&typeof fe.then=="function"&&fe.then(U,Ae)}catch(Ce){Ae(Ce)}finally{X!==null&&me.types!==null&&(X.types=me.types),ie.T=X}}function $n(S){var X=ie.T;if(X!==null){var me=X.types;me===null?X.types=[S]:me.indexOf(S)===-1&&me.push(S)}else Lt($n.bind(null,S))}var qa={map:ce,forEach:function(S,X,me){ce(S,function(){X.apply(this,arguments)},me)},count:function(S){var X=0;return ce(S,function(){X++}),X},toArray:function(S){return ce(S,function(X){return X})||[]},only:function(S){if(!le(S))throw Error("React.Children.only expected to receive a single React element child.");return S}};return Ne.Activity=y,Ne.Children=qa,Ne.Component=q,Ne.Fragment=s,Ne.Profiler=m,Ne.PureComponent=Z,Ne.StrictMode=r,Ne.Suspense=h,Ne.ViewTransition=v,Ne.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=ie,Ne.__COMPILER_RUNTIME={__proto__:null,c:function(S){return ie.H.useMemoCache(S)}},Ne.addTransitionType=$n,Ne.cache=function(S){return function(){return S.apply(null,arguments)}},Ne.cacheSignal=function(){return null},Ne.cloneElement=function(S,X,me){if(S==null)throw Error("The argument must be a React element, but you passed "+S+".");var fe=D({},S.props),Qe=S.key;if(X!=null)for(Ce in X.key!==void 0&&(Qe=""+X.key),X)!ye.call(X,Ce)||Ce==="key"||Ce==="__self"||Ce==="__source"||Ce==="ref"&&X.ref===void 0||(fe[Ce]=X[Ce]);var Ce=arguments.length-2;if(Ce===1)fe.children=me;else if(1<Ce){for(var We=Array(Ce),se=0;se<Ce;se++)We[se]=arguments[se+2];fe.children=We}return it(S.type,Qe,fe)},Ne.createContext=function(S){return S={$$typeof:f,_currentValue:S,_currentValue2:S,_threadCount:0,Provider:null,Consumer:null},S.Provider=S,S.Consumer={$$typeof:u,_context:S},S},Ne.createElement=function(S,X,me){var fe,Qe={},Ce=null;if(X!=null)for(fe in X.key!==void 0&&(Ce=""+X.key),X)ye.call(X,fe)&&fe!=="key"&&fe!=="__self"&&fe!=="__source"&&(Qe[fe]=X[fe]);var We=arguments.length-2;if(We===1)Qe.children=me;else if(1<We){for(var se=Array(We),Te=0;Te<We;Te++)se[Te]=arguments[Te+2];Qe.children=se}if(S&&S.defaultProps)for(fe in We=S.defaultProps,We)Qe[fe]===void 0&&(Qe[fe]=We[fe]);return it(S,Ce,Qe)},Ne.createRef=function(){return{current:null}},Ne.forwardRef=function(S){return{$$typeof:_,render:S}},Ne.isValidElement=le,Ne.lazy=function(S){return{$$typeof:x,_payload:{_status:-1,_result:S},_init:tt}},Ne.memo=function(S,X){return{$$typeof:b,type:S,compare:X===void 0?null:X}},Ne.startTransition=Lt,Ne.unstable_useCacheRefresh=function(){return ie.H.useCacheRefresh()},Ne.use=function(S){return ie.H.use(S)},Ne.useActionState=function(S,X,me){return ie.H.useActionState(S,X,me)},Ne.useCallback=function(S,X){return ie.H.useCallback(S,X)},Ne.useContext=function(S){return ie.H.useContext(S)},Ne.useDebugValue=function(){},Ne.useDeferredValue=function(S,X){return ie.H.useDeferredValue(S,X)},Ne.useEffect=function(S,X){return ie.H.useEffect(S,X)},Ne.useEffectEvent=function(S){return ie.H.useEffectEvent(S)},Ne.useId=function(){return ie.H.useId()},Ne.useImperativeHandle=function(S,X,me){return ie.H.useImperativeHandle(S,X,me)},Ne.useInsertionEffect=function(S,X){return ie.H.useInsertionEffect(S,X)},Ne.useLayoutEffect=function(S,X){return ie.H.useLayoutEffect(S,X)},Ne.useMemo=function(S,X){return ie.H.useMemo(S,X)},Ne.useOptimistic=function(S,X){return ie.H.useOptimistic(S,X)},Ne.useReducer=function(S,X,me){return ie.H.useReducer(S,X,me)},Ne.useRef=function(S){return ie.H.useRef(S)},Ne.useState=function(S){return ie.H.useState(S)},Ne.useSyncExternalStore=function(S,X,me){return ie.H.useSyncExternalStore(S,X,me)},Ne.useTransition=function(){return ie.H.useTransition()},Ne.version="19.3.0",Ne}var e_;function _m(){return e_||(e_=1,Xu.exports=Xv()),Xu.exports}var Vu={exports:{}},Wt={};var t_;function Vv(){if(t_)return Wt;t_=1;var a=_m();function i(x){var y="https://react.dev/errors/"+x;if(1<arguments.length){y+="?args[]="+encodeURIComponent(arguments[1]);for(var v=2;v<arguments.length;v++)y+="&args[]="+encodeURIComponent(arguments[v])}return"Minified React error #"+x+"; visit "+y+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function s(){}var r={d:{f:s,r:function(){throw Error(i(522))},D:s,C:s,L:s,m:s,X:s,S:s,M:s},p:0,findDOMNode:null},m=Symbol.for("react.portal"),u=Symbol.for("react.recoverable"),f=Symbol.for("react.optimistic_key");function _(x,y,v){var w=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:m,key:w==null?null:w===f?f:""+w,children:x,containerInfo:y,implementation:v}}var h=a.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function b(x,y){if(x==="font")return"";if(typeof y=="string")return y==="use-credentials"?y:""}return Wt.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=r,Wt.browser=function(x){return{$$typeof:u,_reason:x}},Wt.createPortal=function(x,y){var v=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!y||y.nodeType!==1&&y.nodeType!==9&&y.nodeType!==11)throw Error(i(299));return _(x,y,null,v)},Wt.flushSync=function(x){var y=h.T,v=r.p;try{if(h.T=null,r.p=2,x)return x()}finally{h.T=y,r.p=v,r.d.f()}},Wt.preconnect=function(x,y){typeof x=="string"&&(y?(y=y.crossOrigin,y=typeof y=="string"?y==="use-credentials"?y:"":void 0):y=null,r.d.C(x,y))},Wt.prefetchDNS=function(x){typeof x=="string"&&r.d.D(x)},Wt.preinit=function(x,y){if(typeof x=="string"&&y&&typeof y.as=="string"){var v=y.as,w=b(v,y.crossOrigin),A=typeof y.integrity=="string"?y.integrity:void 0,z=typeof y.fetchPriority=="string"?y.fetchPriority:void 0;v==="style"?r.d.S(x,typeof y.precedence=="string"?y.precedence:void 0,{crossOrigin:w,integrity:A,fetchPriority:z}):v==="script"&&r.d.X(x,{crossOrigin:w,integrity:A,fetchPriority:z,nonce:typeof y.nonce=="string"?y.nonce:void 0})}},Wt.preinitModule=function(x,y){if(typeof x=="string")if(typeof y=="object"&&y!==null){if(y.as==null||y.as==="script"){var v=b(y.as,y.crossOrigin);r.d.M(x,{crossOrigin:v,integrity:typeof y.integrity=="string"?y.integrity:void 0,nonce:typeof y.nonce=="string"?y.nonce:void 0,fetchPriority:typeof y.fetchPriority=="string"?y.fetchPriority:void 0})}}else y==null&&r.d.M(x)},Wt.preload=function(x,y){if(typeof x=="string"&&typeof y=="object"&&y!==null&&typeof y.as=="string"){var v=y.as,w=b(v,y.crossOrigin);r.d.L(x,v,{crossOrigin:w,integrity:typeof y.integrity=="string"?y.integrity:void 0,nonce:typeof y.nonce=="string"?y.nonce:void 0,type:typeof y.type=="string"?y.type:void 0,fetchPriority:typeof y.fetchPriority=="string"?y.fetchPriority:void 0,referrerPolicy:typeof y.referrerPolicy=="string"?y.referrerPolicy:void 0,imageSrcSet:typeof y.imageSrcSet=="string"?y.imageSrcSet:void 0,imageSizes:typeof y.imageSizes=="string"?y.imageSizes:void 0,media:typeof y.media=="string"?y.media:void 0})}},Wt.preloadModule=function(x,y){if(typeof x=="string")if(y){var v=b(y.as,y.crossOrigin);r.d.m(x,{as:typeof y.as=="string"&&y.as!=="script"?y.as:void 0,crossOrigin:v,integrity:typeof y.integrity=="string"?y.integrity:void 0,nonce:typeof y.nonce=="string"?y.nonce:void 0,fetchPriority:typeof y.fetchPriority=="string"?y.fetchPriority:void 0})}else r.d.m(x)},Wt.requestFormReset=function(x){r.d.r(x)},Wt.unstable_batchedUpdates=function(x,y){return x(y)},Wt.useFormState=function(x,y,v){return h.H.useFormState(x,y,v)},Wt.useFormStatus=function(){return h.H.useHostTransitionStatus()},Wt.version="19.3.0",Wt}var n_;function Pv(){if(n_)return Vu.exports;n_=1;function a(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(a)}catch(i){console.error(i)}}return a(),Vu.exports=Vv(),Vu.exports}var a_;function Qv(){if(a_)return Bs;a_=1;var a=Iv(),i=_m(),s=Pv();function r(e){var t="https://react.dev/errors/"+e;if(1<arguments.length){t+="?args[]="+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+="&args[]="+encodeURIComponent(arguments[n])}return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function m(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function u(e){for(var t=e,n=t;n&&!n.alternate;)t=n,(t.flags&4098)!==0&&(e=t.return),n=t.return;for(;t.return;)t=t.return;return t.tag===3?e:null}function f(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function _(e){if(e.tag===31){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function h(e){if(u(e)!==e)throw Error(r(188))}function b(e){var t=e.alternate;if(!t){if(t=u(e),t===null)throw Error(r(188));return t!==e?null:e}for(var n=e,l=t;;){var o=n.return;if(o===null)break;var d=o.alternate;if(d===null){if(l=o.return,l!==null){n=l;continue}break}if(o.child===d.child){for(d=o.child;d;){if(d===n)return h(o),e;if(d===l)return h(o),t;d=d.sibling}throw Error(r(188))}if(n.return!==l.return)n=o,l=d;else{for(var p=!1,g=o.child;g;){if(g===n){p=!0,n=o,l=d;break}if(g===l){p=!0,l=o,n=d;break}g=g.sibling}if(!p){for(g=d.child;g;){if(g===n){p=!0,n=d,l=o;break}if(g===l){p=!0,l=d,n=o;break}g=g.sibling}if(!p)throw Error(r(189))}}if(n.alternate!==l)throw Error(r(190))}if(n.tag!==3)throw Error(r(188));return n.stateNode.current===n?e:t}function x(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e;for(e=e.child;e!==null;){if(t=x(e),t!==null)return t;e=e.sibling}return null}function y(e,t,n,l,o,d){for(;e!==null;){if((e.tag===5||e.tag===27||e.tag===6)&&n(e,l,o,d)||(e.tag!==22||e.memoizedState===null)&&(t||e.tag!==5&&e.tag!==27)&&y(e.child,t,n,l,o,d))return!0;e=e.sibling}return!1}function v(e){for(e=e.return;e!==null;){if(e.tag===3||e.tag===5||e.tag===27)return e;e=e.return}return null}function w(e){var t=!1;for(e=e.return;e!==null&&(e.tag===4&&(t=!0),!(e.tag===3||e.tag===5||e.tag===27));)e=e.return;return t}function A(e){var t=[null,null],n=v(e);return n===null||z(t,e,n.child,{foundSelf:!1}),t}function z(e,t,n,l){for(;n!==null;){if(n===t)l.foundSelf=!0;else if(n.tag===5||n.tag===27||n.tag===6){if(l.foundSelf)return e[1]=n,!0;e[0]=n}else if((n.tag!==22||n.memoizedState===null)&&z(e,t,n.child,l))return!0;n=n.sibling}return!1}function D(e){switch(e.tag){case 5:case 27:case 6:return e.stateNode;case 3:return e.stateNode.containerInfo;default:throw Error(r(559))}}var R=null,q=null;function V(e,t,n){return e===n?!0:e===t?(R=e,!0):!1}function Z(e,t,n){return e===n?(q=e,!1):e===t?(q!==null&&(R=e),!0):!1}function ee(e){if(e===null)return null;do e=e===null?null:e.return;while(e&&e.tag!==5&&e.tag!==27&&e.tag!==3);return e||null}function ke(e,t,n){for(var l=0,o=e;o;o=n(o))l++;o=0;for(var d=t;d;d=n(d))o++;for(;0<l-o;)e=n(e),l--;for(;0<o-l;)t=n(t),o--;for(;l--;){if(e===t||t!==null&&e===t.alternate)return e;e=n(e),t=n(t)}return null}var U=Object.assign,ie=Symbol.for("react.element"),ye=Symbol.for("react.transitional.element"),it=Symbol.for("react.portal"),mt=Symbol.for("react.fragment"),le=Symbol.for("react.strict_mode"),Q=Symbol.for("react.profiler"),ge=Symbol.for("react.consumer"),ne=Symbol.for("react.context"),K=Symbol.for("react.forward_ref"),ue=Symbol.for("react.suspense"),ce=Symbol.for("react.suspense_list"),tt=Symbol.for("react.memo"),Ae=Symbol.for("react.lazy"),Lt=Symbol.for("react.activity"),$n=Symbol.for("react.legacy_hidden"),qa=Symbol.for("react.memo_cache_sentinel"),S=Symbol.for("react.view_transition"),X=Symbol.for("react.recoverable"),me=Symbol.iterator;function fe(e){return e===null||typeof e!="object"?null:(e=me&&e[me]||e["@@iterator"],typeof e=="function"?e:null)}var Qe=Symbol.for("react.client.reference");function Ce(e){if(e==null)return null;if(typeof e=="function")return e.$$typeof===Qe?null:e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case mt:return"Fragment";case Q:return"Profiler";case le:return"StrictMode";case ue:return"Suspense";case ce:return"SuspenseList";case Lt:return"Activity";case S:return"ViewTransition"}if(typeof e=="object")switch(e.$$typeof){case it:return"Portal";case ne:return e.displayName||"Context";case ge:return(e._context.displayName||"Context")+".Consumer";case K:var t=e.render;return e=e.displayName,e||(e=t.displayName||t.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case tt:return t=e.displayName||null,t!==null?t:Ce(e.type)||"Memo";case Ae:t=e._payload,e=e._init;try{return Ce(e(t))}catch{}}return null}var We=Array.isArray,se=i.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,Te=s.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,bn={pending:!1,data:null,method:null,action:null},P=[],we=-1;function Je(e){return{current:e}}function ze(e){0>we||(e.current=P[we],P[we]=null,we--)}function Le(e,t){we++,P[we]=e.current,e.current=t}var Mt=Je(null),Da=Je(null),dn=Je(null),At=Je(null);function On(e,t){switch(Le(dn,t),Le(Da,e),Le(Mt,null),t.nodeType){case 9:case 11:e=(e=t.documentElement)&&(e=e.namespaceURI)?nh(e):0;break;default:if(e=t.tagName,t=t.namespaceURI)t=nh(t),e=ah(t,e);else switch(e){case"svg":e=1;break;case"math":e=2;break;default:e=0}}ze(Mt),Le(Mt,e)}function Rn(){ze(Mt),ze(Da),ze(dn)}function rc(e){var t=e.memoizedState;t!==null&&(Cl._currentValue=t.memoizedState,Le(At,e)),t=Mt.current;var n=ah(t,e.type);t!==n&&(Le(Da,e),Le(Mt,n))}function er(e){Da.current===e&&(ze(Mt),ze(Da)),At.current===e&&(ze(At),Cl._currentValue=bn)}var oc,xm;function Ua(e){if(oc===void 0)try{throw Error()}catch(n){var t=n.stack.trim().match(/\n( *(at )?)/);oc=t&&t[1]||"",xm=-1<n.stack.indexOf(`
    at`)?" (<anonymous>)":-1<n.stack.indexOf("@")?"@unknown:0:0":""}return`
`+oc+e+xm}var cc=!1;function dc(e,t){if(!e||cc)return"";cc=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var l={DetermineComponentFrameRoot:function(){try{if(t){var Y=function(){throw Error()};if(Object.defineProperty(Y.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(Y,[])}catch(W){var T=W}Reflect.construct(e,[],Y)}else{try{Y.call()}catch(W){T=W}Y=!1;try{var $=Object.getOwnPropertyDescriptor(e.prototype,"props");Object.defineProperty(e.prototype,"props",{configurable:!0,set:function(){throw Error()}}),Y=!0,new e}finally{Y&&($!==void 0?Object.defineProperty(e.prototype,"props",$):delete e.prototype.props)}}}else{try{throw Error()}catch(W){T=W}(Y=e())&&typeof Y.catch=="function"&&Y.catch(function(){})}}catch(W){if(W&&T&&typeof W.stack=="string")return[W.stack,T.stack]}return[null,null]}};l.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var o=Object.getOwnPropertyDescriptor(l.DetermineComponentFrameRoot,"name");o&&o.configurable&&Object.defineProperty(l.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var d=l.DetermineComponentFrameRoot(),p=d[0],g=d[1];if(p&&g){var j=p.split(`
`),M=g.split(`
`);for(o=l=0;l<j.length&&!j[l].includes("DetermineComponentFrameRoot");)l++;for(;o<M.length&&!M[o].includes("DetermineComponentFrameRoot");)o++;if(l===j.length||o===M.length)for(l=j.length-1,o=M.length-1;1<=l&&0<=o&&j[l]!==M[o];)o--;for(;1<=l&&0<=o;l--,o--)if(j[l]!==M[o]){if(l!==1||o!==1)do if(l--,o--,0>o||j[l]!==M[o]){var O=`
`+j[l].replace(" at new "," at ");return e.displayName&&O.includes("<anonymous>")&&(O=O.replace("<anonymous>",e.displayName)),O}while(1<=l&&0<=o);break}}}finally{cc=!1,Error.prepareStackTrace=n}return(n=e?e.displayName||e.name:"")?Ua(n):""}function gg(e,t){switch(e.tag){case 26:case 27:case 5:return Ua(e.type);case 16:return Ua("Lazy");case 13:return e.child!==t&&t!==null?Ua("Suspense Fallback"):Ua("Suspense");case 19:return Ua("SuspenseList");case 0:case 15:return dc(e.type,!1);case 11:return dc(e.type.render,!1);case 1:return dc(e.type,!0);case 31:return Ua("Activity");case 30:return Ua("ViewTransition");default:return""}}function jm(e){try{var t="",n=null;do t+=gg(e,n),n=e,e=e.return;while(e);return t}catch(l){return`
Error generating stack: `+l.message+`
`+l.stack}}var uc=Object.prototype.hasOwnProperty,mc=a.unstable_scheduleCallback,fc=a.unstable_cancelCallback,bg=a.unstable_shouldYield,yg=a.unstable_requestPaint,yn=a.unstable_now,vg=a.unstable_getCurrentPriorityLevel,km=a.unstable_ImmediatePriority,Sm=a.unstable_UserBlockingPriority,tr=a.unstable_NormalPriority,wg=a.unstable_LowPriority,Tm=a.unstable_IdlePriority,xg=a.log,jg=a.unstable_setDisableYieldValue,Ql=null,vn=null;function La(e){if(typeof xg=="function"&&jg(e),vn&&typeof vn.setStrictMode=="function")try{vn.setStrictMode(Ql,e)}catch{}}var wn=Math.clz32?Math.clz32:Tg,kg=Math.log,Sg=Math.LN2;function Tg(e){return e>>>=0,e===0?32:31-(kg(e)/Sg|0)|0}var nr=256,ar=262144,ir=4194304;function bi(e){var t=e&42;if(t!==0)return t;switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:return e&-e;case 262144:case 524288:case 1048576:case 2097152:return e&3932160;case 4194304:case 8388608:case 16777216:case 33554432:return e&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return e}}function lr(e,t,n){var l=e.pendingLanes;if(l===0)return 0;var o=0,d=e.suspendedLanes,p=e.pingedLanes;e=e.warmLanes;var g=l&134217727;return g!==0?(l=g&~d,l!==0?o=bi(l):(p&=g,p!==0?o=bi(p):n||(n=g&~e,n!==0&&(o=bi(n))))):(g=l&~d,g!==0?o=bi(g):p!==0?o=bi(p):n||(n=l&~e,n!==0&&(o=bi(n)))),o===0?0:t!==0&&t!==o&&(t&d)===0&&(d=o&-o,n=t&-t,d>=n||d===32&&(n&4194048)!==0)?t:o}function Zl(e,t){return(e.pendingLanes&~(e.suspendedLanes&~e.pingedLanes)&t)===0}function Nm(e,t){(t&8)!==0&&(t|=t&32);var n=e.entangledLanes;if(n!==0)for(e=e.entanglements,n&=t;0<n;){var l=31-wn(n),o=1<<l;t|=e[l],n&=~o}return t}function Ng(e,t){switch(e){case 1:case 2:case 4:case 8:case 64:return t+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function Em(){var e=ir;return ir<<=1,(ir&62914560)===0&&(ir=4194304),e}function pc(e){for(var t=[],n=0;31>n;n++)t.push(e);return t}function Kl(e,t){e.pendingLanes|=t,t!==268435456&&(e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0)}function Eg(e,t,n,l,o,d){var p=e.pendingLanes;e.pendingLanes=n,e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0,e.expiredLanes&=n,e.entangledLanes&=n,e.errorRecoveryDisabledLanes&=n,e.shellSuspendCounter=0;var g=e.entanglements,j=e.expirationTimes,M=e.hiddenUpdates;for(n=p&~n;0<n;){var O=31-wn(n),Y=1<<O;g[O]=0,j[O]=-1;var T=M[O];if(T!==null)for(M[O]=null,O=0;O<T.length;O++){var $=T[O];$!==null&&($.lane&=-536870913)}n&=~Y}l!==0&&Mm(e,l,0),d!==0&&o===0&&e.tag!==0&&(e.suspendedLanes|=d&~(p&~t))}function Mm(e,t,n){e.pendingLanes|=t,e.suspendedLanes&=~t;var l=31-wn(t);e.entangledLanes|=t,e.entanglements[l]=e.entanglements[l]|1073741824|n&261930}function Am(e,t){var n=e.entangledLanes|=t;for(e=e.entanglements;n;){var l=31-wn(n),o=1<<l;o&t|e[l]&t&&(e[l]|=t),n&=~o}}function Cm(e,t){var n=t&-t;return n=(n&42)!==0?1:hc(n),(n&(e.suspendedLanes|t))!==0?0:n}function hc(e){switch(e){case 2:e=1;break;case 8:e=4;break;case 32:e=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:e=128;break;case 268435456:e=134217728;break;default:e=0}return e}function _c(e){return e&=-e,2<e?8<e?(e&134217727)!==0?32:268435456:8:2}function zm(){var e=Te.p;return e!==0?e:(e=window.event,e===void 0?32:Hh(e.type))}function $m(e,t){var n=Te.p;try{return Te.p=e,t()}finally{Te.p=n}}var ya=Math.random().toString(36).slice(2),Xt="__reactFiber$"+ya,un="__reactProps$"+ya,Xi="__reactContainer$"+ya,Om="__reactEvents$"+ya,Mg="__reactListeners$"+ya,Ag="__reactHandles$"+ya,Rm="__reactResources$"+ya,Wl="__reactMarker$"+ya,sr="__reactLoad$"+ya;function rr(e){delete e[Xt],delete e[un],delete e[Mg],delete e[Ag]}function yi(e){var t;if(t=e[Xt])return t;for(var n=e.parentNode;n;){if(t=n[Xi]||n[Xt]){if(n=t.alternate,t.child!==null||n!==null&&n.child!==null)for(e=vh(e);e!==null;){if(n=e[Xt])return n;e=vh(e)}return t}e=n,n=e.parentNode}return null}function Vi(e){if(e=e[Xt]||e[Xi]){var t=e.tag;if(t===5||t===6||t===13||t===31||t===26||t===27||t===3)return e}return null}function Jl(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e.stateNode;throw Error(r(33))}function Pi(e){var t=e[Rm];return t||(t=e[Rm]={hoistableStyles:new Map,hoistableScripts:new Map}),t}function Ht(e){e[Wl]=!0}function qm(e){e[sr]=void 0}var Dm=new Set,Um={};function vi(e,t){Qi(e,t),Qi(e+"Capture",t)}function Qi(e,t){for(Um[e]=t,e=0;e<t.length;e++)Dm.add(t[e])}var Cg=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),Lm={},Hm={};function zg(e){return uc.call(Hm,e)?!0:uc.call(Lm,e)?!1:Cg.test(e)?Hm[e]=!0:(Lm[e]=!0,!1)}var at=!1;function Ym(){var e=at;return at=!1,e}function or(e,t,n){if(zg(t))if(n===null)e.removeAttribute(t);else{switch(typeof n){case"undefined":case"function":case"symbol":e.removeAttribute(t);return;case"boolean":var l=t.toLowerCase().slice(0,5);if(l!=="data-"&&l!=="aria-"){e.removeAttribute(t);return}}e.setAttribute(t,n)}}function cr(e,t,n){if(n===null)e.removeAttribute(t);else{switch(typeof n){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(t);return}e.setAttribute(t,n)}}function va(e,t,n,l){if(l===null)e.removeAttribute(n);else{switch(typeof l){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(n);return}e.setAttributeNS(t,n,l)}}function xn(e){switch(typeof e){case"bigint":case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function Bm(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(t==="checkbox"||t==="radio")}function $g(e,t,n){var l=Object.getOwnPropertyDescriptor(e.constructor.prototype,t);if(!e.hasOwnProperty(t)&&typeof l<"u"&&typeof l.get=="function"&&typeof l.set=="function"){var o=l.get,d=l.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return o.call(this)},set:function(p){n=""+p,d.call(this,p)}}),Object.defineProperty(e,t,{enumerable:l.enumerable}),{getValue:function(){return n},setValue:function(p){n=""+p},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function gc(e){if(!e._valueTracker){var t=Bm(e)?"checked":"value";e._valueTracker=$g(e,t,""+e[t])}}function Gm(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var n=t.getValue(),l="";return e&&(l=Bm(e)?e.checked?"true":"false":e.value),e=l,e!==n?(t.setValue(e),!0):!1}var Og=/[\n"\\]/g;function qn(e){return e.replace(Og,function(t){return"\\"+t.charCodeAt(0).toString(16)+" "})}function bc(e,t,n,l,o,d,p,g){e.name="",p!=null&&typeof p!="function"&&typeof p!="symbol"&&typeof p!="boolean"?e.type=p:e.removeAttribute("type"),t!=null?p==="number"?(t===0&&e.value===""||e.value!=t)&&(e.value=""+xn(t)):e.value!==""+xn(t)&&(e.value=""+xn(t)):p!=="submit"&&p!=="reset"||e.removeAttribute("value"),t!=null?p==="number"&&e.value==t?yc(e,xn(e.value)):yc(e,xn(t)):n!=null?yc(e,xn(n)):l!=null&&e.removeAttribute("value"),o==null&&d!=null&&(e.defaultChecked=!!d),o!=null&&(e.checked=o&&typeof o!="function"&&typeof o!="symbol"),g!=null&&typeof g!="function"&&typeof g!="symbol"&&typeof g!="boolean"?e.name=""+xn(g):e.removeAttribute("name")}function Im(e,t,n,l,o,d,p,g){if(d!=null&&typeof d!="function"&&typeof d!="symbol"&&typeof d!="boolean"&&(e.type=d),t!=null||n!=null){if(!(d!=="submit"&&d!=="reset"||t!=null)){gc(e);return}n=n!=null?""+xn(n):"",t=t!=null?""+xn(t):n,g||t===e.value||(e.value=t),e.defaultValue=t}l=l??o,l=typeof l!="function"&&typeof l!="symbol"&&!!l,e.checked=g?e.checked:!!l,e.defaultChecked=!!l,p!=null&&typeof p!="function"&&typeof p!="symbol"&&typeof p!="boolean"&&(e.name=p),gc(e)}function yc(e,t){e.defaultValue!==""+t&&(e.defaultValue=""+t)}function Zi(e,t,n,l){if(e=e.options,t){t={};for(var o=0;o<n.length;o++)t["$"+n[o]]=!0;for(n=0;n<e.length;n++)o=t.hasOwnProperty("$"+e[n].value),e[n].selected!==o&&(e[n].selected=o),o&&l&&(e[n].defaultSelected=!0)}else{for(n=""+xn(n),t=null,o=0;o<e.length;o++){if(e[o].value===n){e[o].selected=!0,l&&(e[o].defaultSelected=!0);return}t!==null||e[o].disabled||(t=e[o])}t!==null&&(t.selected=!0)}}function Xm(e,t,n){if(t!=null&&(t=""+xn(t),t!==e.value&&(e.value=t),n==null)){e.defaultValue!==t&&(e.defaultValue=t);return}e.defaultValue=n!=null?""+xn(n):""}function Vm(e,t,n,l){if(t==null){if(l!=null){if(n!=null)throw Error(r(92));if(We(l)){if(1<l.length)throw Error(r(93));l=l[0]}n=l}n==null&&(n=""),t=n}n=xn(t),e.defaultValue=n,l=e.textContent,l===n&&l!==""&&l!==null&&(e.value=l),gc(e)}function Ki(e,t){if(t){var n=e.firstChild;if(n&&n===e.lastChild&&n.nodeType===3){n.nodeValue=t;return}}e.textContent=t}var Rg=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function Pm(e,t,n){var l=t.indexOf("--")===0;n==null||typeof n=="boolean"||n===""?l?e.setProperty(t,""):t==="float"?e.cssFloat="":e[t]="":l?e.setProperty(t,n):typeof n!="number"||n===0||Rg.has(t)?t==="float"?e.cssFloat=n:e[t]=(""+n).trim():e[t]=n+"px"}function Qm(e,t,n){if(t!=null&&typeof t!="object")throw Error(r(62));if(e=e.style,n!=null){for(var l in n)!n.hasOwnProperty(l)||t!=null&&t.hasOwnProperty(l)||(l.indexOf("--")===0?e.setProperty(l,""):l==="float"?e.cssFloat="":e[l]="",at=!0);for(var o in t)l=t[o],t.hasOwnProperty(o)&&n[o]!==l&&(Pm(e,o,l),at=!0)}else for(var d in t)t.hasOwnProperty(d)&&Pm(e,d,t[d])}function vc(e){if(e.indexOf("-")===-1)return!1;switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var qg=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["maskType","mask-type"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),Dg=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function dr(e){return Dg.test(""+e)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":e}function na(){}var wc=null;function xc(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var Wi=null,Ji=null;function Zm(e){var t=Vi(e);if(t&&(e=t.stateNode)){var n=e[un]||null;e:switch(e=t.stateNode,t.type){case"input":if(bc(e,n.value,n.defaultValue,n.defaultValue,n.checked,n.defaultChecked,n.type,n.name),t=n.name,n.type==="radio"&&t!=null){for(n=e;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll('input[name="'+qn(""+t)+'"][type="radio"]'),t=0;t<n.length;t++){var l=n[t];if(l!==e&&l.form===e.form){var o=l[un]||null;if(!o)throw Error(r(90));bc(l,o.value,o.defaultValue,o.defaultValue,o.checked,o.defaultChecked,o.type,o.name)}}for(t=0;t<n.length;t++)l=n[t],l.form===e.form&&Gm(l)}break e;case"textarea":Xm(e,n.value,n.defaultValue);break e;case"select":t=n.value,t!=null&&Zi(e,!!n.multiple,t,!1)}}}var jc=!1;function Km(e,t,n){if(jc)return e(t,n);jc=!0;try{var l=e(t);return l}finally{if(jc=!1,(Wi!==null||Ji!==null)&&(uo(),Wi&&(t=Wi,e=Ji,Ji=Wi=null,Zm(t),e)))for(t=0;t<e.length;t++)Zm(e[t])}}function Fl(e,t){var n=e.stateNode;if(n===null)return null;var l=n[un]||null;if(l===null)return null;n=l[t];e:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(l=!l.disabled)||(e=e.type,l=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!l;break e;default:e=!1}if(e)return null;if(n&&typeof n!="function")throw Error(r(231,t,typeof n));return n}var wa=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),kc=!1;if(wa)try{var es={};Object.defineProperty(es,"passive",{get:function(){kc=!0}}),window.addEventListener("test",es,es),window.removeEventListener("test",es,es)}catch{kc=!1}var Ha=null,Sc=null,ur=null;function Wm(){if(ur)return ur;var e,t=Sc,n=t.length,l,o="value"in Ha?Ha.value:Ha.textContent,d=o.length;for(e=0;e<n&&t[e]===o[e];e++);var p=n-e;for(l=1;l<=p&&t[n-l]===o[d-l];l++);return ur=o.slice(e,1<l?1-l:void 0)}function mr(e){var t=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function fr(){return!0}function Jm(){return!1}function ln(e){function t(n,l,o,d,p){this._reactName=n,this._targetInst=o,this.type=l,this.nativeEvent=d,this.target=p,this.currentTarget=null;for(var g in e)e.hasOwnProperty(g)&&(n=e[g],this[g]=n?n(d):d[g]);return this.isDefaultPrevented=(d.defaultPrevented!=null?d.defaultPrevented:d.returnValue===!1)?fr:Jm,this.isPropagationStopped=Jm,this}return U(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var n=this.nativeEvent;n&&(n.preventDefault?n.preventDefault():typeof n.returnValue!="unknown"&&(n.returnValue=!1),this.isDefaultPrevented=fr)},stopPropagation:function(){var n=this.nativeEvent;n&&(n.stopPropagation?n.stopPropagation():typeof n.cancelBubble!="unknown"&&(n.cancelBubble=!0),this.isPropagationStopped=fr)},persist:function(){},isPersistent:fr}),t}var Ya={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},pr=ln(Ya),ts=U({},Ya,{view:0,detail:0}),Ug=ln(ts),Tc,Nc,ns,hr=U({},ts,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:Mc,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==ns&&(ns&&e.type==="mousemove"?(Tc=e.screenX-ns.screenX,Nc=e.screenY-ns.screenY):Nc=Tc=0,ns=e),Tc)},movementY:function(e){return"movementY"in e?e.movementY:Nc}}),Fm=ln(hr),Lg=U({},hr,{dataTransfer:0}),Hg=ln(Lg),Yg=U({},ts,{relatedTarget:0}),Ec=ln(Yg),Bg=U({},Ya,{animationName:0,elapsedTime:0,pseudoElement:0}),Gg=ln(Bg),Ig=U({},Ya,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),Xg=ln(Ig),Vg=U({},Ya,{data:0}),ef=ln(Vg),Pg={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},Qg={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},Zg={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function Kg(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=Zg[e])?!!t[e]:!1}function Mc(){return Kg}var Wg=U({},ts,{key:function(e){if(e.key){var t=Pg[e.key]||e.key;if(t!=="Unidentified")return t}return e.type==="keypress"?(e=mr(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?Qg[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:Mc,charCode:function(e){return e.type==="keypress"?mr(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?mr(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),Jg=ln(Wg),Fg=U({},hr,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),tf=ln(Fg),eb=U({},Ya,{submitter:0}),tb=ln(eb),nb=U({},ts,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:Mc}),ab=ln(nb),ib=U({},Ya,{propertyName:0,elapsedTime:0,pseudoElement:0}),lb=ln(ib),sb=U({},hr,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),rb=ln(sb),ob=U({},Ya,{newState:0,oldState:0,source:0}),cb=ln(ob),db=[9,13,27,32],Ac=wa&&"CompositionEvent"in window,as=null;wa&&"documentMode"in document&&(as=document.documentMode);var ub=wa&&"TextEvent"in window&&!as,nf=wa&&(!Ac||as&&8<as&&11>=as),af=" ",lf=!1;function sf(e,t){switch(e){case"keyup":return db.indexOf(t.keyCode)!==-1;case"keydown":return t.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function rf(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var Fi=!1;function mb(e,t){switch(e){case"compositionend":return rf(t);case"keypress":return t.which!==32?null:(lf=!0,af);case"textInput":return e=t.data,e===af&&lf?null:e;default:return null}}function fb(e,t){if(Fi)return e==="compositionend"||!Ac&&sf(e,t)?(e=Wm(),ur=Sc=Ha=null,Fi=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return nf&&t.locale!=="ko"?null:t.data;default:return null}}var pb={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function of(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t==="input"?!!pb[e.type]:t==="textarea"}function cf(e,t,n,l){Wi?Ji?Ji.push(l):Ji=[l]:Wi=l,t=go(t,"onChange"),0<t.length&&(n=new pr("onChange","change",null,n,l),e.push({event:n,listeners:t}))}var is=null,ls=null;function hb(e){K0(e,0)}function _r(e){var t=Jl(e);if(Gm(t))return e}function df(e,t){if(e==="change")return t}var uf=!1;if(wa){var Cc;if(wa){var zc="oninput"in document;if(!zc){var mf=document.createElement("div");mf.setAttribute("oninput","return;"),zc=typeof mf.oninput=="function"}Cc=zc}else Cc=!1;uf=Cc&&(!document.documentMode||9<document.documentMode)}function ff(){is&&(is.detachEvent("onpropertychange",pf),ls=is=null)}function pf(e){if(e.propertyName==="value"&&_r(ls)){var t=[];cf(t,ls,e,xc(e)),Km(hb,t)}}function _b(e,t,n){e==="focusin"?(ff(),is=t,ls=n,is.attachEvent("onpropertychange",pf)):e==="focusout"&&ff()}function gb(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return _r(ls)}function bb(e,t){if(e==="click")return _r(t)}function yb(e,t){if(e==="input"||e==="change")return _r(t)}function vb(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var jn=typeof Object.is=="function"?Object.is:vb;function ss(e,t){if(jn(e,t))return!0;if(typeof e!="object"||e===null||typeof t!="object"||t===null)return!1;var n=Object.keys(e),l=Object.keys(t);if(n.length!==l.length)return!1;for(l=0;l<n.length;l++){var o=n[l];if(!uc.call(t,o)||!jn(e[o],t[o]))return!1}return!0}function $c(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}function hf(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function _f(e,t){var n=hf(e);e=0;for(var l;n;){if(n.nodeType===3){if(l=e+n.textContent.length,e<=t&&l>=t)return{node:n,offset:t-e};e=l}e:{for(;n;){if(n.nextSibling){n=n.nextSibling;break e}n=n.parentNode}n=void 0}n=hf(n)}}function gf(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?gf(e,t.parentNode):"contains"in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function bf(e){e=e!=null&&e.ownerDocument!=null&&e.ownerDocument.defaultView!=null?e.ownerDocument.defaultView:window;for(var t=$c(e.document);t instanceof e.HTMLIFrameElement;){try{var n=typeof t.contentWindow.location.href=="string"}catch{n=!1}if(n)e=t.contentWindow;else break;t=$c(e.document)}return t}function Oc(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||t==="textarea"||e.contentEditable==="true")}var wb=wa&&"documentMode"in document&&11>=document.documentMode,el=null,Rc=null,rs=null,qc=!1;function yf(e,t,n){var l=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;qc||el==null||el!==$c(l)||(l=el,"selectionStart"in l&&Oc(l)?l={start:l.selectionStart,end:l.selectionEnd}:(l=(l.ownerDocument&&l.ownerDocument.defaultView||window).getSelection(),l={anchorNode:l.anchorNode,anchorOffset:l.anchorOffset,focusNode:l.focusNode,focusOffset:l.focusOffset}),rs&&ss(rs,l)||(rs=l,l=go(Rc,"onSelect"),0<l.length&&(t=new pr("onSelect","select",null,t,n),e.push({event:t,listeners:l}),t.target=el)))}function wi(e,t){var n={};return n[e.toLowerCase()]=t.toLowerCase(),n["Webkit"+e]="webkit"+t,n["Moz"+e]="moz"+t,n}var tl={animationend:wi("Animation","AnimationEnd"),animationiteration:wi("Animation","AnimationIteration"),animationstart:wi("Animation","AnimationStart"),transitionrun:wi("Transition","TransitionRun"),transitionstart:wi("Transition","TransitionStart"),transitioncancel:wi("Transition","TransitionCancel"),transitionend:wi("Transition","TransitionEnd")},Dc={},vf={};wa&&(vf=document.createElement("div").style,"AnimationEvent"in window||(delete tl.animationend.animation,delete tl.animationiteration.animation,delete tl.animationstart.animation),"TransitionEvent"in window||delete tl.transitionend.transition);function xi(e){if(Dc[e])return Dc[e];if(!tl[e])return e;var t=tl[e],n;for(n in t)if(t.hasOwnProperty(n)&&n in vf)return Dc[e]=t[n];return e}var wf=xi("animationend"),xf=xi("animationiteration"),jf=xi("animationstart"),xb=xi("transitionrun"),jb=xi("transitionstart"),kb=xi("transitioncancel"),kf=xi("transitionend"),Sf=new Map,Uc="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");Uc.push("scrollEnd");function Qn(e,t){Sf.set(e,t),vi(t,[e])}var Sb=0;function xa(e,t){if(e.name!=null&&e.name!=="auto")return e.name;if(t.autoName!==null)return t.autoName;e=Jn.identifierPrefix;var n=Sb++;return e="_"+e+"t_"+n.toString(32)+"_",t.autoName=e}function Tf(e){if(e==null||typeof e=="string")return e;var t=null,n=wl;if(n!==null)for(var l=0;l<n.length;l++){var o=e[n[l]];if(o!=null){if(o==="none")return"none";t=t==null?o:t+(" "+o)}}return t??e.default}function ja(e,t){return e=Tf(e),t=Tf(t),t==null?e==="auto"?null:e:t==="auto"?null:t}var gr=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)},Dn=[],nl=0,Lc=0;function br(){for(var e=nl,t=Lc=nl=0;t<e;){var n=Dn[t];Dn[t++]=null;var l=Dn[t];Dn[t++]=null;var o=Dn[t];Dn[t++]=null;var d=Dn[t];if(Dn[t++]=null,l!==null&&o!==null){var p=l.pending;p===null?o.next=o:(o.next=p.next,p.next=o),l.pending=o}d!==0&&Nf(n,o,d)}}function yr(e,t,n,l){Dn[nl++]=e,Dn[nl++]=t,Dn[nl++]=n,Dn[nl++]=l,Lc|=l,e.lanes|=l,e=e.alternate,e!==null&&(e.lanes|=l)}function Hc(e,t,n,l){return yr(e,t,n,l),vr(e)}function ji(e,t){return yr(e,null,null,t),vr(e)}function Nf(e,t,n){e.lanes|=n;var l=e.alternate;l!==null&&(l.lanes|=n);for(var o=!1,d=e.return;d!==null;)d.childLanes|=n,l=d.alternate,l!==null&&(l.childLanes|=n),d.tag===22&&(e=d.stateNode,e===null||e._visibility&1||(o=!0)),e=d,d=d.return;return e.tag===3?(d=e.stateNode,o&&t!==null&&(o=31-wn(n),e=d.hiddenUpdates,l=e[o],l===null?e[o]=[t]:l.push(t),t.lane=n|536870912),d):null}function vr(e){if(50<Ms)throw Ms=0,co=null,Error(r(185));for(var t=e.return;t!==null;)e=t,t=e.return;return e.tag===3?e.stateNode:null}var al={};function Tb(e,t,n,l){this.tag=e,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=l,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function mn(e,t,n,l){return new Tb(e,t,n,l)}function Yc(e){return e=e.prototype,!(!e||!e.isReactComponent)}function ka(e,t){var n=e.alternate;return n===null?(n=mn(e.tag,t,e.key,e.mode),n.elementType=e.elementType,n.type=e.type,n.stateNode=e.stateNode,n.alternate=e,e.alternate=n):(n.pendingProps=t,n.type=e.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=e.flags&1206910976,n.childLanes=e.childLanes,n.lanes=e.lanes,n.child=e.child,n.memoizedProps=e.memoizedProps,n.memoizedState=e.memoizedState,n.updateQueue=e.updateQueue,t=e.dependencies,n.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},n.sibling=e.sibling,n.index=e.index,n.ref=e.ref,n.refCleanup=e.refCleanup,n}function Ef(e,t){e.flags&=1206910978;var n=e.alternate;return n===null?(e.childLanes=0,e.lanes=t,e.child=null,e.subtreeFlags=0,e.memoizedProps=null,e.memoizedState=null,e.updateQueue=null,e.dependencies=null,e.stateNode=null):(e.childLanes=n.childLanes,e.lanes=n.lanes,e.child=n.child,e.subtreeFlags=0,e.deletions=null,e.memoizedProps=n.memoizedProps,e.memoizedState=n.memoizedState,e.updateQueue=n.updateQueue,e.type=n.type,t=n.dependencies,e.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),e}function wr(e,t,n,l,o,d){var p=0;if(l=e,typeof l=="function")Yc(l)&&(p=1);else if(typeof l=="string")p=ev(e,n,Mt.current)?26:e==="html"||e==="head"||e==="body"?27:5;else e:switch(l){case Lt:return e=mn(31,n,t,o),e.elementType=Lt,e.lanes=d,e;case mt:return ki(n.children,o,d,t);case le:p=8,o|=24;break;case Q:return e=mn(12,n,t,o|2),e.elementType=Q,e.lanes=d,e;case ue:return e=mn(13,n,t,o),e.elementType=ue,e.lanes=d,e;case ce:return e=mn(19,n,t,o),e.elementType=ce,e.lanes=d,e;case $n:case S:return e=o|32,e=mn(30,n,t,e),e.elementType=S,e.lanes=d,e.stateNode={autoName:null,paired:null,clones:null,ref:null},e;default:if(typeof l=="object"&&l!==null)switch(l.$$typeof){case ne:p=10;break e;case ge:p=9;break e;case K:p=11;break e;case tt:p=14;break e;case Ae:p=16,l=null;break e}p=29,n=Error(r(130,e===null?"null":typeof e,"")),l=null}return t=mn(p,n,t,o),t.elementType=e,t.type=l,t.lanes=d,t}function ki(e,t,n,l){return e=mn(7,e,l,t),e.lanes=n,e}function Bc(e,t,n){return e=mn(6,e,null,t),e.lanes=n,e}function Mf(e){var t=mn(18,null,null,0);return t.stateNode=e,t}function Gc(e,t,n){return t=mn(4,e.children!==null?e.children:[],e.key,t),t.lanes=n,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}var Af=new WeakMap;function Un(e,t){if(typeof e=="object"&&e!==null){var n=Af.get(e);return n!==void 0?n:(t={value:e,source:t,stack:jm(t)},Af.set(e,t),t)}return{value:e,source:t,stack:jm(t)}}var il=[],ll=0,xr=null,os=0,Ln=[],Hn=0,Ba=null,aa=1,ia="";function Sa(e,t){il[ll++]=os,il[ll++]=xr,xr=e,os=t}function Cf(e,t,n){Ln[Hn++]=aa,Ln[Hn++]=ia,Ln[Hn++]=Ba,Ba=e;var l=aa;e=ia;var o=32-wn(l)-1;l&=~(1<<o),n+=1;var d=32-wn(t)+o;if(30<d){var p=o-o%5;d=(l&(1<<p)-1).toString(32),l>>=p,o-=p,aa=1<<32-wn(t)+o|n<<o|l,ia=d+e}else aa=1<<d|n<<o|l,ia=e}function jr(e){e.return!==null&&(Sa(e,1),Cf(e,1,0))}function Ic(e){for(;e===xr;)xr=il[--ll],il[ll]=null,os=il[--ll],il[ll]=null;for(;e===Ba;)Ba=Ln[--Hn],Ln[Hn]=null,ia=Ln[--Hn],Ln[Hn]=null,aa=Ln[--Hn],Ln[Hn]=null}function zf(e,t){Ln[Hn++]=aa,Ln[Hn++]=ia,Ln[Hn++]=Ba,aa=t.id,ia=t.overflow,Ba=e}var Yt=null,ht=null,He=!1,Ga=null,Yn=!1,Xc=Error(r(519));function Ia(e){var t=Error(r(418,1<arguments.length&&arguments[1]!==void 0&&arguments[1]?"text":"HTML",""));throw cs(Un(t,e)),Xc}function $f(e){var t=e.stateNode,n=e.type,l=e.memoizedProps;switch(t[Xt]=e,t[un]=l,n){case"dialog":Ie("cancel",t),Ie("close",t);break;case"iframe":case"object":case"embed":Ie("load",t);break;case"video":case"audio":for(n=0;n<Cs.length;n++)Ie(Cs[n],t);break;case"source":Ie("error",t);break;case"img":case"image":case"link":Ie("error",t),Ie("load",t);break;case"details":Ie("toggle",t);break;case"input":Ie("invalid",t),Im(t,l.value,l.defaultValue,l.checked,l.defaultChecked,l.type,l.name,!0);break;case"select":Ie("invalid",t);break;case"textarea":Ie("invalid",t),Vm(t,l.value,l.defaultValue,l.children)}n=l.children,typeof n!="string"&&typeof n!="number"&&typeof n!="bigint"||t.textContent===""+n||l.suppressHydrationWarning===!0||eh(t.textContent,n)?(l.popover!=null&&(Ie("beforetoggle",t),Ie("toggle",t)),l.onScroll!=null&&Ie("scroll",t),l.onScrollEnd!=null&&Ie("scrollend",t),l.onClick!=null&&(t.onclick=na),t=!0):t=!1,t||Ia(e,!0)}function kr(e){for(Yt=e.return;Yt;)switch(Yt.tag){case 5:case 31:case 13:Yn=!1;return;case 27:case 3:Yn=!0;return;default:Yt=Yt.return}}function sl(e){if(e!==Yt)return!1;if(!He)return kr(e),He=!0,!1;var t=e.tag,n;if((n=t!==3&&t!==27)&&((n=t===5)&&(n=e.type,n=!(n!=="form"&&n!=="button")||wu(e.type,e.memoizedProps)),n=!n),n&&ht&&Ia(e),kr(e),t===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(r(317));ht=yh(e)}else if(t===31){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(r(317));ht=yh(e)}else t===27?(t=ht,si(e.type)?(e=Au,Au=null,ht=e):ht=t):ht=Yt?Gn(e.stateNode.nextSibling):null;return!0}function Si(){ht=Yt=null,He=!1}function Vc(){var e=Ga;return e!==null&&(hn===null?hn=e:hn.push.apply(hn,e),Ga=null),e}function cs(e){Ga===null?Ga=[e]:Ga.push(e)}var Pc=Je(null),Ti=null,Ta=null;function Xa(e,t,n){Le(Pc,t._currentValue),t._currentValue=n}function Na(e){e._currentValue=Pc.current,ze(Pc)}function Sr(e,t,n){for(;e!==null;){var l=e.alternate;if((e.childLanes&t)!==t?(e.childLanes|=t,l!==null&&(l.childLanes|=t)):l!==null&&(l.childLanes&t)!==t&&(l.childLanes|=t),e===n)break;e=e.return}}function Qc(e,t,n,l){var o=e.child;for(o!==null&&(o.return=e);o!==null;){var d=o.dependencies;if(d!==null){var p=o.child;d=d.firstContext;e:for(;d!==null;){var g=d;d=o;for(var j=0;j<t.length;j++)if(g.context===t[j]){d.lanes|=n,g=d.alternate,g!==null&&(g.lanes|=n),Sr(d.return,n,e),l||(p=null);break e}d=g.next}}else if(o.tag===18){if(p=o.return,p===null)throw Error(r(341));p.lanes|=n,d=p.alternate,d!==null&&(d.lanes|=n),Sr(p,n,e),p=null}else o.tag===13&&o.memoizedState!==null&&o.memoizedState.dehydrated===null?(o.lanes|=n,p=o.alternate,p!==null&&(p.lanes|=n),Sr(o.return,n,e),p=o.child,p=p!==null?p.sibling:null):p=o.child;if(p!==null)p.return=o;else for(p=o;p!==null;){if(p===e){p=null;break}if(o=p.sibling,o!==null){o.return=p.return,p=o;break}p=p.return}o=p}}function Ni(e,t,n,l){e=null;for(var o=t,d=!1;o!==null;){if(!d){if((o.flags&524288)!==0)d=!0;else if((o.flags&262144)!==0)break}if(o.tag===10){var p=o.alternate;if(p===null)throw Error(r(387));if(p=p.memoizedProps,p!==null){var g=o.type;jn(o.pendingProps.value,p.value)||(e!==null?e.push(g):e=[g])}}else if(o===At.current){if(p=o.alternate,p===null)throw Error(r(387));p.memoizedState.memoizedState!==o.memoizedState.memoizedState&&(e!==null?e.push(Cl):e=[Cl])}o=o.return}return e!==null&&Qc(t,e,n,l),t.flags|=262144,e!==null}function Tr(e){for(e=e.firstContext;e!==null;){if(!jn(e.context._currentValue,e.memoizedValue))return!0;e=e.next}return!1}function Ei(e){Ti=e,Ta=null,e=e.dependencies,e!==null&&(e.firstContext=null)}function Vt(e){return Of(Ti,e)}function Nr(e,t){return Ti===null&&Ei(e),Of(e,t)}function Of(e,t){var n=t._currentValue;if(t={context:t,memoizedValue:n,next:null},Ta===null){if(e===null)throw Error(r(308));Ta=t,e.dependencies={lanes:0,firstContext:t},e.flags|=524288}else Ta=Ta.next=t;return n}var Nb=typeof AbortController<"u"?AbortController:function(){var e=[],t=this.signal={aborted:!1,addEventListener:function(n,l){e.push(l)}};this.abort=function(){t.aborted=!0,e.forEach(function(n){return n()})}},Eb=a.unstable_scheduleCallback,Mb=a.unstable_NormalPriority,Ct={$$typeof:ne,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function Zc(){return{controller:new Nb,data:new Map,refCount:0}}function ds(e){e.refCount--,e.refCount===0&&Eb(Mb,function(){e.controller.abort()})}function Rf(e,t){if((e.pendingLanes&4194048)!==0){var n=e.transitionTypes;for(n===null&&(n=e.transitionTypes=[]),e=0;e<t.length;e++){var l=t[e];n.indexOf(l)===-1&&n.push(l)}}}var us=null;function Ab(e){var t=e.transitionTypes;return e.transitionTypes=null,t}var ms=null,Kc=0,Mi=0,rl=null;function Cb(e,t){if(ms===null){var n=ms=[];Kc=0,Mi=mu(),rl={status:"pending",value:void 0,then:function(l){n.push(l)}}}return Kc++,t.then(qf,qf),t}function qf(){if(--Kc===0&&(us=null,ms!==null)){rl!==null&&(rl.status="fulfilled");var e=ms;ms=null,Mi=0,rl=null;for(var t=0;t<e.length;t++)(0,e[t])()}}function zb(e,t){var n=[],l={status:"pending",value:null,reason:null,then:function(o){n.push(o)}};return e.then(function(){l.status="fulfilled",l.value=t;for(var o=0;o<n.length;o++)(0,n[o])(t)},function(o){for(l.status="rejected",l.reason=o,o=0;o<n.length;o++)(0,n[o])(void 0)}),l}var Df=se.S;se.S=function(e,t){if(M0=yn(),typeof t=="object"&&t!==null&&typeof t.then=="function"&&Cb(e,t),us!==null)for(var n=Sl;n!==null;)Rf(n,us),n=n.next;if(n=e.types,n!==null){for(var l=Sl;l!==null;)Rf(l,n),l=l.next;if(Mi!==0){l=us,l===null&&(l=us=[]);for(var o=0;o<n.length;o++){var d=n[o];l.indexOf(d)===-1&&l.push(d)}}}Df!==null&&Df(e,t)};var Ai=Je(null);function Wc(){var e=Ai.current;return e!==null?e:ft.pooledCache}function Er(e,t){t===null?Le(Ai,Ai.current):Le(Ai,t.pool)}function Uf(){var e=Wc();return e===null?null:{parent:Ct._currentValue,pool:e}}var ol=Error(r(460)),Jc=Error(r(474)),Mr=Error(r(542)),Ar={then:function(){}};function Lf(e){return e=e.status,e==="fulfilled"||e==="rejected"}function Hf(e,t,n){switch(n=e[n],n===void 0?e.push(t):n!==t&&(t.then(na,na),t=n),t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,Bf(e),e===void 0&&!("reason"in t)?Error(r(600)):e;default:if(typeof t.status=="string")t.then(na,na);else{if(e=ft,e!==null&&100<e.shellSuspendCounter)throw Error(r(482));e=t,e.status="pending",e.then(function(l){if(t.status==="pending"){var o=t;o.status="fulfilled",o.value=l}},function(l){if(t.status==="pending"){var o=t;o.status="rejected",o.reason=l}})}switch(t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,Bf(e),e}throw zi=t,ol}}function Ci(e){try{var t=e._init;return t(e._payload)}catch(n){throw n!==null&&typeof n=="object"&&typeof n.then=="function"?(zi=n,ol):n}}var zi=null;function Yf(){if(zi===null)throw Error(r(459));var e=zi;return zi=null,e}function Bf(e){if(e===ol||e===Mr)throw Error(r(483))}var cl=null,fs=0;function Cr(e){var t=fs;return fs+=1,cl===null&&(cl=[]),Hf(cl,e,t)}function Va(e,t){t=t.props.ref,e.ref=t!==void 0?t:null}function zr(e,t){throw t.$$typeof===ie?Error(r(525)):(e=Object.prototype.toString.call(t),Error(r(31,e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e)))}function Gf(e){function t(E,k){if(e){var C=E.deletions;C===null?(E.deletions=[k],E.flags|=16):C.push(k)}}function n(E,k){if(!e)return null;for(;k!==null;)t(E,k),k=k.sibling;return null}function l(E){for(var k=new Map;E!==null;)E.key===null?k.set(E.index,E):k.set(E.key,E),E=E.sibling;return k}function o(E,k){return E=ka(E,k),E.index=0,E.sibling=null,E}function d(E,k,C){return E.index=C,e?(C=E.alternate,C!==null?(C=C.index,C<k?(E.flags|=2,k):C):(E.flags|=134217730,k)):(E.flags|=1048576,k)}function p(E){return e&&E.alternate===null&&(E.flags|=134217730),E}function g(E,k,C,H){return k===null||k.tag!==6?(k=Bc(C,E.mode,H),k.return=E,k):(k=o(k,C),k.return=E,k)}function j(E,k,C,H){var ae=C.type;return ae===mt?(E=O(E,k,C.props.children,H,C.key),Va(E,C),E):k!==null&&(k.elementType===ae||typeof ae=="object"&&ae!==null&&ae.$$typeof===Ae&&Ci(ae)===k.type)?(k=o(k,C.props),Va(k,C),k.return=E,k):(k=wr(C.type,C.key,C.props,null,E.mode,H),Va(k,C),k.return=E,k)}function M(E,k,C,H){return k===null||k.tag!==4||k.stateNode.containerInfo!==C.containerInfo||k.stateNode.implementation!==C.implementation?(k=Gc(C,E.mode,H),k.return=E,k):(k=o(k,C.children||[]),k.return=E,k)}function O(E,k,C,H,ae){return k===null||k.tag!==7?(k=ki(C,E.mode,H,ae),k.return=E,k):(k=o(k,C),k.return=E,k)}function Y(E,k,C){if(typeof k=="string"&&k!==""||typeof k=="number"||typeof k=="bigint")return k=Bc(""+k,E.mode,C),k.return=E,k;if(typeof k=="object"&&k!==null){switch(k.$$typeof){case ye:return C=wr(k.type,k.key,k.props,null,E.mode,C),Va(C,k),C.return=E,C;case it:return k=Gc(k,E.mode,C),k.return=E,k;case Ae:return k=Ci(k),Y(E,k,C)}if(We(k)||fe(k))return k=ki(k,E.mode,C,null),k.return=E,k;if(typeof k.then=="function")return Y(E,Cr(k),C);if(k.$$typeof===ne)return Y(E,Nr(E,k),C);zr(E,k)}return null}function T(E,k,C,H){var ae=k!==null?k.key:null;if(typeof C=="string"&&C!==""||typeof C=="number"||typeof C=="bigint")return ae!==null?null:g(E,k,""+C,H);if(typeof C=="object"&&C!==null){switch(C.$$typeof){case ye:return C.key===ae?j(E,k,C,H):null;case it:return C.key===ae?M(E,k,C,H):null;case Ae:return C=Ci(C),T(E,k,C,H)}if(We(C)||fe(C))return ae!==null?null:O(E,k,C,H,null);if(typeof C.then=="function")return T(E,k,Cr(C),H);if(C.$$typeof===ne)return T(E,k,Nr(E,C),H);zr(E,C)}return null}function $(E,k,C,H,ae){if(typeof H=="string"&&H!==""||typeof H=="number"||typeof H=="bigint")return E=E.get(C)||null,g(k,E,""+H,ae);if(typeof H=="object"&&H!==null){switch(H.$$typeof){case ye:return E=E.get(H.key===null?C:H.key)||null,j(k,E,H,ae);case it:return E=E.get(H.key===null?C:H.key)||null,M(k,E,H,ae);case Ae:return H=Ci(H),$(E,k,C,H,ae)}if(We(H)||fe(H))return E=E.get(C)||null,O(k,E,H,ae,null);if(typeof H.then=="function")return $(E,k,C,Cr(H),ae);if(H.$$typeof===ne)return $(E,k,C,Nr(k,H),ae);zr(k,H)}return null}function W(E,k,C,H){for(var ae=null,Pe=null,he=k,Se=k=0,Ot=null;he!==null&&Se<C.length;Se++){he.index>Se?(Ot=he,he=null):Ot=he.sibling;var Fe=T(E,he,C[Se],H);if(Fe===null){he===null&&(he=Ot);break}e&&he&&Fe.alternate===null&&t(E,he),k=d(Fe,k,Se),Pe===null?ae=Fe:Pe.sibling=Fe,Pe=Fe,he=Ot}if(Se===C.length)return n(E,he),He&&Sa(E,Se),ae;if(he===null){for(;Se<C.length;Se++)he=Y(E,C[Se],H),he!==null&&(k=d(he,k,Se),Pe===null?ae=he:Pe.sibling=he,Pe=he);return He&&Sa(E,Se),ae}for(he=l(he);Se<C.length;Se++)Ot=$(he,E,Se,C[Se],H),Ot!==null&&(e&&(Fe=Ot.alternate,Fe!==null&&he.delete(Fe.key===null?Se:Fe.key)),k=d(Ot,k,Se),Pe===null?ae=Ot:Pe.sibling=Ot,Pe=Ot);return e&&he.forEach(function(ui){return t(E,ui)}),He&&Sa(E,Se),ae}function re(E,k,C,H){if(C==null)throw Error(r(151));for(var ae=null,Pe=null,he=k,Se=k=0,Ot=null,Fe=C.next();he!==null&&!Fe.done;Se++,Fe=C.next()){he.index>Se?(Ot=he,he=null):Ot=he.sibling;var ui=T(E,he,Fe.value,H);if(ui===null){he===null&&(he=Ot);break}e&&he&&ui.alternate===null&&t(E,he),k=d(ui,k,Se),Pe===null?ae=ui:Pe.sibling=ui,Pe=ui,he=Ot}if(Fe.done)return n(E,he),He&&Sa(E,Se),ae;if(he===null){for(;!Fe.done;Se++,Fe=C.next())Fe=Y(E,Fe.value,H),Fe!==null&&(k=d(Fe,k,Se),Pe===null?ae=Fe:Pe.sibling=Fe,Pe=Fe);return He&&Sa(E,Se),ae}for(he=l(he);!Fe.done;Se++,Fe=C.next())Fe=$(he,E,Se,Fe.value,H),Fe!==null&&(e&&(Ot=Fe.alternate,Ot!==null&&he.delete(Ot.key===null?Se:Ot.key)),k=d(Fe,k,Se),Pe===null?ae=Fe:Pe.sibling=Fe,Pe=Fe);return e&&he.forEach(function(mv){return t(E,mv)}),He&&Sa(E,Se),ae}function Re(E,k,C,H){if(typeof C=="object"&&C!==null&&C.type===mt&&C.key===null&&C.props.ref===void 0&&(C=C.props.children),typeof C=="object"&&C!==null){switch(C.$$typeof){case ye:e:{for(var ae=C.key;k!==null;){if(k.key===ae){if(ae=C.type,ae===mt){if(k.tag===7){n(E,k.sibling),H=o(k,C.props.children),Va(H,C),H.return=E,E=H;break e}}else if(k.elementType===ae||typeof ae=="object"&&ae!==null&&ae.$$typeof===Ae&&Ci(ae)===k.type){n(E,k.sibling),H=o(k,C.props),Va(H,C),H.return=E,E=H;break e}n(E,k);break}else t(E,k);k=k.sibling}C.type===mt?(H=ki(C.props.children,E.mode,H,C.key),Va(H,C),H.return=E,E=H):(H=wr(C.type,C.key,C.props,null,E.mode,H),Va(H,C),H.return=E,E=H)}return p(E);case it:e:{for(ae=C.key;k!==null;){if(k.key===ae)if(k.tag===4&&k.stateNode.containerInfo===C.containerInfo&&k.stateNode.implementation===C.implementation){n(E,k.sibling),H=o(k,C.children||[]),H.return=E,E=H;break e}else{n(E,k);break}else t(E,k);k=k.sibling}H=Gc(C,E.mode,H),H.return=E,E=H}return p(E);case Ae:return C=Ci(C),Re(E,k,C,H)}if(We(C))return W(E,k,C,H);if(fe(C)){if(ae=fe(C),typeof ae!="function")throw Error(r(150));return C=ae.call(C),re(E,k,C,H)}if(typeof C.then=="function")return Re(E,k,Cr(C),H);if(C.$$typeof===ne)return Re(E,k,Nr(E,C),H);zr(E,C)}return typeof C=="string"&&C!==""||typeof C=="number"||typeof C=="bigint"?(C=""+C,k!==null&&k.tag===6?(n(E,k.sibling),H=o(k,C),H.return=E,E=H):(n(E,k),H=Bc(C,E.mode,H),H.return=E,E=H),p(E)):n(E,k)}return function(E,k,C,H){try{fs=0;var ae=Re(E,k,C,H);return cl=null,ae}catch(he){if(he===ol||he===Mr)throw he;var Pe=mn(29,he,null,E.mode);return Pe.lanes=H,Pe.return=E,Pe}}}var $i=Gf(!0),If=Gf(!1),Pa=!1;function Fc(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function ed(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,callbacks:null})}function Qa(e){return{lane:e,tag:0,payload:null,callback:null,next:null}}function Za(e,t,n){var l=e.updateQueue;if(l===null)return null;if(l=l.shared,(lt&2)!==0){var o=l.pending;return o===null?t.next=t:(t.next=o.next,o.next=t),l.pending=t,t=vr(e),Nf(e,null,n),t}return yr(e,l,t,n),vr(e)}function ps(e,t,n){if(t=t.updateQueue,t!==null&&(t=t.shared,(n&4194048)!==0)){var l=t.lanes;l&=e.pendingLanes,n|=l,t.lanes=n,Am(e,n)}}function td(e,t){var n=e.updateQueue,l=e.alternate;if(l!==null&&(l=l.updateQueue,n===l)){var o=null,d=null;if(n=n.firstBaseUpdate,n!==null){do{var p={lane:n.lane,tag:n.tag,payload:n.payload,callback:null,next:null};d===null?o=d=p:d=d.next=p,n=n.next}while(n!==null);d===null?o=d=t:d=d.next=t}else o=d=t;n={baseState:l.baseState,firstBaseUpdate:o,lastBaseUpdate:d,shared:l.shared,callbacks:l.callbacks},e.updateQueue=n;return}e=n.lastBaseUpdate,e===null?n.firstBaseUpdate=t:e.next=t,n.lastBaseUpdate=t}var nd=!1;function hs(){if(nd){var e=rl;if(e!==null)throw e}}function _s(e,t,n,l){nd=!1;var o=e.updateQueue;Pa=!1;var d=o.firstBaseUpdate,p=o.lastBaseUpdate,g=o.shared.pending;if(g!==null){o.shared.pending=null;var j=g,M=j.next;j.next=null,p===null?d=M:p.next=M,p=j;var O=e.alternate;O!==null&&(O=O.updateQueue,g=O.lastBaseUpdate,g!==p&&(g===null?O.firstBaseUpdate=M:g.next=M,O.lastBaseUpdate=j))}if(d!==null){var Y=o.baseState;p=0,O=M=j=null,g=d;do{var T=g.lane&-536870913,$=T!==g.lane;if($?(Ve&T)===T:(l&T)===T){T!==0&&T===Mi&&(nd=!0),O!==null&&(O=O.next={lane:0,tag:g.tag,payload:g.payload,callback:null,next:null});e:{var W=e,re=g;T=t;var Re=n;switch(re.tag){case 1:if(W=re.payload,typeof W=="function"){Y=W.call(Re,Y,T);break e}Y=W;break e;case 3:W.flags=W.flags&-65537|128;case 0:if(W=re.payload,T=typeof W=="function"?W.call(Re,Y,T):W,T==null)break e;Y=U({},Y,T);break e;case 2:Pa=!0}}T=g.callback,T!==null&&(e.flags|=64,$&&(e.flags|=8192),$=o.callbacks,$===null?o.callbacks=[T]:$.push(T))}else $={lane:T,tag:g.tag,payload:g.payload,callback:g.callback,next:null},O===null?(M=O=$,j=Y):O=O.next=$,p|=T;if(g=g.next,g===null){if(g=o.shared.pending,g===null)break;$=g,g=$.next,$.next=null,o.lastBaseUpdate=$,o.shared.pending=null}}while(!0);O===null&&(j=Y),o.baseState=j,o.firstBaseUpdate=M,o.lastBaseUpdate=O,d===null&&(o.shared.lanes=0),ni|=p,e.lanes=p,e.memoizedState=Y}}function Xf(e,t){if(typeof e!="function")throw Error(r(191,e));e.call(t)}function Vf(e,t){var n=e.callbacks;if(n!==null)for(e.callbacks=null,e=0;e<n.length;e++)Xf(n[e],t)}var Ka=Je(null),$r=Je(0);function Pf(e,t){e=za,Le($r,e),Le(Ka,t),za=e|t.baseLanes}function ad(){Le($r,za),Le(Ka,Ka.current)}function id(){za=$r.current,ze(Ka),ze($r)}var Pt=Je(null),en=null;function Wa(e){var t=e.alternate;Le(Qt,Qt.current&1),Le(Pt,e),en===null&&(t===null||Ka.current!==null||t.memoizedState!==null)&&(en=e)}function ld(e){Le(Qt,Qt.current),Le(Pt,e),en===null&&(en=e)}function Qf(e){e.tag===22?(Le(Qt,Qt.current),Le(Pt,e),en===null&&(en=e)):Ja()}function Ja(){Le(Qt,Qt.current),Le(Pt,Pt.current)}function kn(e){ze(Pt),en===e&&(en=null),ze(Qt)}var Qt=Je(0);function gs(e,t){Le(Pt,Pt.current),Le(Qt,t)}function sd(e){ze(Qt),ze(Pt),en===e&&(en=null)}function Or(e){for(var t=e;t!==null;){if(t.tag===13){var n=t.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||Eu(n)||Mu(n)))return t}else if(t.tag===19&&t.memoizedProps.revealOrder!=="independent"){if((t.flags&128)!==0)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var Ea=0,Oe=null,ut=null,zt=null,Rr=!1,dl=!1,Oi=!1,qr=0,bs=0,ul=null,$b=0;function jt(){throw Error(r(321))}function rd(e,t){if(t===null)return!1;for(var n=0;n<t.length&&n<e.length;n++)if(!jn(e[n],t[n]))return!1;return!0}function od(e,t,n,l,o,d){return Ea=d,Oe=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,se.H=e===null||e.memoizedState===null?Cp:zp,Oi=!1,d=n(l,o),Oi=!1,dl&&(d=Kf(t,n,l,o)),Zf(e),d}function Zf(e){se.H=Gr;var t=ut!==null&&ut.next!==null;if(Ea=0,zt=ut=Oe=null,Rr=!1,bs=0,ul=null,t)throw Error(r(300));e===null||$t||(e=e.dependencies,e!==null&&Tr(e)&&($t=!0))}function Kf(e,t,n,l){Oe=e;var o=0;do{if(dl&&(ul=null),bs=0,dl=!1,25<=o)throw Error(r(301));if(o+=1,zt=ut=null,e.updateQueue!=null){var d=e.updateQueue;d.lastEffect=null,d.events=null,d.stores=null,d.memoCache!=null&&(d.memoCache.index=0)}se.H=Yb,d=t(n,l)}while(dl);return d}function Ob(){var e=se.H,t=e.useState()[0];return t=typeof t.then=="function"?ys(t):t,e=e.useState()[0],(ut!==null?ut.memoizedState:null)!==e&&(Oe.flags|=1024),t}function cd(){var e=qr!==0;return qr=0,e}function dd(e,t,n){t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~n}function ud(e){if(Rr){for(e=e.memoizedState;e!==null;){var t=e.queue;t!==null&&(t.pending=null),e=e.next}Rr=!1}Ea=0,zt=ut=Oe=null,dl=!1,bs=qr=0,ul=null}function sn(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return zt===null?Oe.memoizedState=zt=e:zt=zt.next=e,zt}function St(){if(ut===null){var e=Oe.alternate;e=e!==null?e.memoizedState:null}else e=ut.next;var t=zt===null?Oe.memoizedState:zt.next;if(t!==null)zt=t,ut=e;else{if(e===null)throw Oe.alternate===null?Error(r(467)):Error(r(310));ut=e,e={memoizedState:ut.memoizedState,baseState:ut.baseState,baseQueue:ut.baseQueue,queue:ut.queue,next:null},zt===null?Oe.memoizedState=zt=e:zt=zt.next=e}return zt}function Dr(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function ys(e){var t=bs;return bs+=1,ul===null&&(ul=[]),e=Hf(ul,e,t),t=Oe,(zt===null?t.memoizedState:zt.next)===null&&(t=t.alternate,se.H=t===null||t.memoizedState===null?Cp:zp),e}function Ur(e){if(e!==null&&typeof e=="object"){if(typeof e.then=="function")return ys(e);if(e.$$typeof===X)return;if(e.$$typeof===ne)return Vt(e)}throw Error(r(438,String(e)))}function md(e){var t=null,n=Oe.updateQueue;if(n!==null&&(t=n.memoCache),t==null){var l=Oe.alternate;l!==null&&(l=l.updateQueue,l!==null&&(l=l.memoCache,l!=null&&(t={data:l.data.map(function(o){return o.slice()}),index:0})))}if(t==null&&(t={data:[],index:0}),n===null&&(n=Dr(),Oe.updateQueue=n),n.memoCache=t,n=t.data[t.index],n===void 0)for(n=t.data[t.index]=Array(e),l=0;l<e;l++)n[l]=qa;return t.index++,n}function Ma(e,t){return typeof t=="function"?t(e):t}function Lr(e){var t=St();return fd(t,ut,e)}function fd(e,t,n){var l=e.queue;if(l===null)throw Error(r(311));l.lastRenderedReducer=n;var o=e.baseQueue,d=l.pending;if(d!==null){if(o!==null){var p=o.next;o.next=d.next,d.next=p}t.baseQueue=o=d,l.pending=null}if(d=e.baseState,o===null)e.memoizedState=d;else{t=o.next;var g=p=null,j=null,M=t,O=!1;do{var Y=M.lane&-536870913;if(Y!==M.lane?(Ve&Y)===Y:(Ea&Y)===Y){var T=M.revertLane;if(T===0)j!==null&&(j=j.next={lane:0,revertLane:0,gesture:null,action:M.action,hasEagerState:M.hasEagerState,eagerState:M.eagerState,next:null}),Y===Mi&&(O=!0);else if((Ea&T)===T){M=M.next,T===Mi&&(O=!0);continue}else Y={lane:0,revertLane:M.revertLane,gesture:null,action:M.action,hasEagerState:M.hasEagerState,eagerState:M.eagerState,next:null},j===null?(g=j=Y,p=d):j=j.next=Y,Oe.lanes|=T,ni|=T;Y=M.action,Oi&&n(d,Y),d=M.hasEagerState?M.eagerState:n(d,Y)}else T={lane:Y,revertLane:M.revertLane,gesture:M.gesture,action:M.action,hasEagerState:M.hasEagerState,eagerState:M.eagerState,next:null},j===null?(g=j=T,p=d):j=j.next=T,Oe.lanes|=Y,ni|=Y;M=M.next}while(M!==null&&M!==t);if(j===null?p=d:j.next=g,!jn(d,e.memoizedState)&&($t=!0,O&&(n=rl,n!==null)))throw n;e.memoizedState=d,e.baseState=p,e.baseQueue=j,l.lastRenderedState=d}return o===null&&(l.lanes=0),[e.memoizedState,l.dispatch]}function pd(e){var t=St(),n=t.queue;if(n===null)throw Error(r(311));n.lastRenderedReducer=e;var l=n.dispatch,o=n.pending,d=t.memoizedState;if(o!==null){n.pending=null;var p=o=o.next;do d=e(d,p.action),p=p.next;while(p!==o);jn(d,t.memoizedState)||($t=!0),t.memoizedState=d,t.baseQueue===null&&(t.baseState=d),n.lastRenderedState=d}return[d,l]}function Wf(e,t,n){var l=Oe,o=St(),d=He;if(d){if(n===void 0)throw Error(r(407));n=n()}else n=t();var p=!jn((ut||o).memoizedState,n);if(p&&(o.memoizedState=n,$t=!0),o=o.queue,gd(ep.bind(null,l,o,e),[e]),e=o.getSnapshot!==t||p||zt!==null&&(zt.memoizedState.tag&1)!==0,ml(e?9:8,{destroy:void 0},Ff.bind(null,l,o,n,t),null),e){if(l.flags|=2048,ft===null)throw Error(r(349));d||(Ea&127)!==0||Jf(l,t,n)}return n}function Jf(e,t,n){e.flags|=16384,e={getSnapshot:t,value:n},t=Oe.updateQueue,t===null?(t=Dr(),Oe.updateQueue=t,t.stores=[e]):(n=t.stores,n===null?t.stores=[e]:n.push(e))}function Ff(e,t,n,l){t.value=n,t.getSnapshot=l,tp(t)&&np(e)}function ep(e,t,n){return n(function(){tp(t)&&np(e)})}function tp(e){var t=e.getSnapshot;e=e.value;try{var n=t();return!jn(e,n)}catch{return!0}}function np(e){var t=ji(e,2);t!==null&&_n(t,e,2)}function hd(e){var t=sn();if(typeof e=="function"){var n=e;if(e=n(),Oi){La(!0);try{n()}finally{La(!1)}}}return t.memoizedState=t.baseState=e,t.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Ma,lastRenderedState:e},t}function ap(e,t,n,l){return e.baseState=n,fd(e,ut,typeof l=="function"?l:Ma)}function Rb(e,t,n,l,o){if(Br(e))throw Error(r(485));if(e=t.action,e!==null){var d={payload:o,action:e,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(p){d.listeners.push(p)}};se.T!==null?n(!0):d.isTransition=!1,l(d),n=t.pending,n===null?(d.next=t.pending=d,ip(t,d)):(d.next=n.next,t.pending=n.next=d)}}function ip(e,t){var n=t.action,l=t.payload,o=e.state;if(t.isTransition){var d=se.T,p={};p.types=d!==null?d.types:null,se.T=p;try{var g=n(o,l),j=se.S;j!==null&&j(p,g),lp(e,t,g)}catch(M){_d(e,t,M)}finally{d!==null&&p.types!==null&&(d.types=p.types),se.T=d}}else try{d=n(o,l),lp(e,t,d)}catch(M){_d(e,t,M)}}function lp(e,t,n){n!==null&&typeof n=="object"&&typeof n.then=="function"?n.then(function(l){sp(e,t,l)},function(l){return _d(e,t,l)}):sp(e,t,n)}function sp(e,t,n){t.status="fulfilled",t.value=n,rp(t),e.state=n,t=e.pending,t!==null&&(n=t.next,n===t?e.pending=null:(n=n.next,t.next=n,ip(e,n)))}function _d(e,t,n){var l=e.pending;if(e.pending=null,l!==null){l=l.next;do t.status="rejected",t.reason=n,rp(t),t=t.next;while(t!==l)}e.action=null}function rp(e){e=e.listeners;for(var t=0;t<e.length;t++)(0,e[t])()}function op(e,t){return t}function cp(e,t){if(He){var n=ft.formState;if(n!==null){e:{var l=Oe;if(He){if(ht){t:{for(var o=ht,d=Yn;o.nodeType!==8;){if(!d){o=null;break t}if(o=Gn(o.nextSibling),o===null){o=null;break t}}d=o.data,o=d==="F!"||d==="F"?o:null}if(o){ht=Gn(o.nextSibling),l=o.data==="F!";break e}}Ia(l)}l=!1}l&&(t=n[0])}}return n=sn(),n.memoizedState=n.baseState=t,l={pending:null,lanes:0,dispatch:null,lastRenderedReducer:op,lastRenderedState:t},n.queue=l,n=Ep.bind(null,Oe,l),l.dispatch=n,l=hd(!1),d=xd.bind(null,Oe,!1,l.queue),l=sn(),o={state:t,dispatch:null,action:e,pending:null},l.queue=o,n=Rb.bind(null,Oe,o,d,n),o.dispatch=n,l.memoizedState=e,[t,n,!1]}function dp(e){var t=St();return up(t,ut,e)}function up(e,t,n){if(t=fd(e,t,op)[0],e=Lr(Ma)[0],typeof t=="object"&&t!==null&&typeof t.then=="function")try{var l=ys(t)}catch(p){throw p===ol?Mr:p}else l=t;t=St();var o=t.queue,d=o.dispatch;return n!==t.memoizedState&&(Oe.flags|=2048,ml(9,{destroy:void 0},qb.bind(null,o,n),null)),[l,d,e]}function qb(e,t){e.action=t}function mp(e){var t=St(),n=ut;if(n!==null)return up(t,n,e);St(),t=t.memoizedState,n=St();var l=n.queue.dispatch;return n.memoizedState=e,[t,l,!1]}function ml(e,t,n,l){return e={tag:e,create:n,deps:l,inst:t,next:null},t=Oe.updateQueue,t===null&&(t=Dr(),Oe.updateQueue=t),n=t.lastEffect,n===null?t.lastEffect=e.next=e:(l=n.next,n.next=e,e.next=l,t.lastEffect=e),e}function fp(){return St().memoizedState}function Hr(e,t,n,l){var o=sn();Oe.flags|=e,o.memoizedState=ml(1|t,{destroy:void 0},n,l===void 0?null:l)}function Yr(e,t,n,l){var o=St();l=l===void 0?null:l;var d=o.memoizedState.inst;ut!==null&&l!==null&&rd(l,ut.memoizedState.deps)?o.memoizedState=ml(t,d,n,l):(Oe.flags|=e,o.memoizedState=ml(1|t,d,n,l))}function pp(e,t){Hr(8390656,8,e,t)}function gd(e,t){Yr(2048,8,e,t)}function Db(e){Oe.flags|=4;var t=Oe.updateQueue;if(t===null)t=Dr(),Oe.updateQueue=t,t.events=[e];else{var n=t.events;n===null?t.events=[e]:n.push(e)}}function hp(e){var t=St().memoizedState;return Db({ref:t,nextImpl:e}),function(){if((lt&2)!==0)throw Error(r(440));return t.impl.apply(void 0,arguments)}}function _p(e,t){return Yr(4,2,e,t)}function gp(e,t){return Yr(4,4,e,t)}function bp(e,t){if(typeof t=="function"){e=e();var n=t(e);return function(){typeof n=="function"?n():t(null)}}if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function yp(e,t,n){n=n!=null?n.concat([e]):null,Yr(4,4,bp.bind(null,t,e),n)}function bd(){}function vp(e,t){var n=St();t=t===void 0?null:t;var l=n.memoizedState;return t!==null&&rd(t,l[1])?l[0]:(n.memoizedState=[e,t],e)}function wp(e,t){var n=St();t=t===void 0?null:t;var l=n.memoizedState;if(t!==null&&rd(t,l[1]))return l[0];if(l=e(),Oi){La(!0);try{e()}finally{La(!1)}}return n.memoizedState=[l,t],l}function yd(e,t,n){return n===void 0||(Ea&1073741824)!==0&&(Ve&261930)===0?e.memoizedState=t:(e.memoizedState=n,e=C0(),Oe.lanes|=e,ni|=e,n)}function xp(e,t,n,l){return jn(n,t)?n:Ka.current!==null?(e=yd(e,n,l),jn(e,t)||($t=!0),e):(Ea&106)===0||(Ea&1073741824)!==0&&(Ve&261930)===0?($t=!0,e.memoizedState=n):(e=C0(),Oe.lanes|=e,ni|=e,t)}function jp(e,t,n,l,o){var d=Te.p;Te.p=d!==0&&8>d?d:8;var p=se.T,g={};g.types=p!==null?p.types:null,se.T=g,xd(e,!1,t,n);try{var j=o(),M=se.S;if(M!==null&&M(g,j),j!==null&&typeof j=="object"&&typeof j.then=="function"){var O=zb(j,l);vs(e,t,O,En(e))}else vs(e,t,l,En(e))}catch(Y){vs(e,t,{then:function(){},status:"rejected",reason:Y},En())}finally{Te.p=d,p!==null&&g.types!==null&&(p.types=g.types),se.T=p}}function Ub(){}function vd(e,t,n,l){if(e.tag!==5)throw Error(r(476));var o=kp(e).queue;jp(e,o,t,bn,n===null?Ub:function(){return Sp(e),n(l)})}function kp(e){var t=e.memoizedState;if(t!==null)return t;t={memoizedState:bn,baseState:bn,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Ma,lastRenderedState:bn},next:null};var n={};return t.next={memoizedState:n,baseState:n,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Ma,lastRenderedState:n},next:null},e.memoizedState=t,e=e.alternate,e!==null&&(e.memoizedState=t),t}function Sp(e){var t=kp(e);t.next===null&&(t=e.alternate.memoizedState),vs(e,t.next.queue,{},En())}function wd(){return Vt(Cl)}function Tp(){return St().memoizedState}function Np(){return St().memoizedState}function Lb(e){for(var t=e.return;t!==null;){switch(t.tag){case 24:case 3:var n=En();e=Qa(n);var l=Za(t,e,n);l!==null&&(_n(l,t,n),ps(l,t,n)),t={cache:Zc()},e.payload=t;return}t=t.return}}function Hb(e,t,n){var l=En();n={lane:l,revertLane:0,gesture:null,action:n,hasEagerState:!1,eagerState:null,next:null},Br(e)?Mp(t,n):(n=Hc(e,t,n,l),n!==null&&(_n(n,e,l),Ap(n,t,l)))}function Ep(e,t,n){var l=En();vs(e,t,n,l)}function vs(e,t,n,l){var o={lane:l,revertLane:0,gesture:null,action:n,hasEagerState:!1,eagerState:null,next:null};if(Br(e))Mp(t,o);else{var d=e.alternate;if(e.lanes===0&&(d===null||d.lanes===0)&&(d=t.lastRenderedReducer,d!==null))try{var p=t.lastRenderedState,g=d(p,n);if(o.hasEagerState=!0,o.eagerState=g,jn(g,p))return yr(e,t,o,0),ft===null&&br(),!1}catch{}if(n=Hc(e,t,o,l),n!==null)return _n(n,e,l),Ap(n,t,l),!0}return!1}function xd(e,t,n,l){if(l={lane:2,revertLane:mu(),gesture:null,action:l,hasEagerState:!1,eagerState:null,next:null},Br(e)){if(t)throw Error(r(479))}else t=Hc(e,n,l,2),t!==null&&_n(t,e,2)}function Br(e){var t=e.alternate;return e===Oe||t!==null&&t===Oe}function Mp(e,t){dl=Rr=!0;var n=e.pending;n===null?t.next=t:(t.next=n.next,n.next=t),e.pending=t}function Ap(e,t,n){if((n&4194048)!==0){var l=t.lanes;l&=e.pendingLanes,n|=l,t.lanes=n,Am(e,n)}}var Gr={readContext:Vt,use:Ur,useCallback:jt,useContext:jt,useEffect:jt,useImperativeHandle:jt,useLayoutEffect:jt,useInsertionEffect:jt,useMemo:jt,useReducer:jt,useRef:jt,useState:jt,useDebugValue:jt,useDeferredValue:jt,useTransition:jt,useSyncExternalStore:jt,useId:jt,useHostTransitionStatus:jt,useFormState:jt,useActionState:jt,useOptimistic:jt,useMemoCache:jt,useCacheRefresh:jt,useEffectEvent:jt},Cp={readContext:Vt,use:Ur,useCallback:function(e,t){return sn().memoizedState=[e,t===void 0?null:t],e},useContext:Vt,useEffect:pp,useImperativeHandle:function(e,t,n){n=n!=null?n.concat([e]):null,Hr(4194308,4,bp.bind(null,t,e),n)},useLayoutEffect:function(e,t){return Hr(4194308,4,e,t)},useInsertionEffect:function(e,t){Hr(4,2,e,t)},useMemo:function(e,t){var n=sn();t=t===void 0?null:t;var l=e();if(Oi){La(!0);try{e()}finally{La(!1)}}return n.memoizedState=[l,t],l},useReducer:function(e,t,n){var l=sn();if(n!==void 0){var o=n(t);if(Oi){La(!0);try{n(t)}finally{La(!1)}}}else o=t;return l.memoizedState=l.baseState=o,e={pending:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:o},l.queue=e,e=e.dispatch=Hb.bind(null,Oe,e),[l.memoizedState,e]},useRef:function(e){var t=sn();return e={current:e},t.memoizedState=e},useState:function(e){e=hd(e);var t=e.queue,n=Ep.bind(null,Oe,t);return t.dispatch=n,[e.memoizedState,n]},useDebugValue:bd,useDeferredValue:function(e,t){var n=sn();return yd(n,e,t)},useTransition:function(){var e=hd(!1);return e=jp.bind(null,Oe,e.queue,!0,!1),sn().memoizedState=e,[!1,e]},useSyncExternalStore:function(e,t,n){var l=Oe,o=sn();if(He){if(n===void 0)throw Error(r(407));n=n()}else{if(n=t(),ft===null)throw Error(r(349));(Ve&127)!==0||Jf(l,t,n)}o.memoizedState=n;var d={value:n,getSnapshot:t};return o.queue=d,pp(ep.bind(null,l,d,e),[e]),l.flags|=2048,ml(9,{destroy:void 0},Ff.bind(null,l,d,n,t),null),n},useId:function(){var e=sn(),t=ft.identifierPrefix;if(He){var n=ia,l=aa;n=(l&~(1<<32-wn(l)-1)).toString(32)+n,t="_"+t+"R_"+n,n=qr++,0<n&&(t+="H"+n.toString(32)),t+="_"}else n=$b++,t="_"+t+"r_"+n.toString(32)+"_";return e.memoizedState=t},useHostTransitionStatus:wd,useFormState:cp,useActionState:cp,useOptimistic:function(e){var t=sn();t.memoizedState=t.baseState=e;var n={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return t.queue=n,t=xd.bind(null,Oe,!0,n),n.dispatch=t,[e,t]},useMemoCache:md,useCacheRefresh:function(){return sn().memoizedState=Lb.bind(null,Oe)},useEffectEvent:function(e){var t=sn(),n={impl:e};return t.memoizedState=n,function(){if((lt&2)!==0)throw Error(r(440));return n.impl.apply(void 0,arguments)}}},zp={readContext:Vt,use:Ur,useCallback:vp,useContext:Vt,useEffect:gd,useImperativeHandle:yp,useInsertionEffect:_p,useLayoutEffect:gp,useMemo:wp,useReducer:Lr,useRef:fp,useState:function(){return Lr(Ma)},useDebugValue:bd,useDeferredValue:function(e,t){var n=St();return xp(n,ut.memoizedState,e,t)},useTransition:function(){var e=Lr(Ma)[0],t=St().memoizedState;return[typeof e=="boolean"?e:ys(e),t]},useSyncExternalStore:Wf,useId:Tp,useHostTransitionStatus:wd,useFormState:dp,useActionState:dp,useOptimistic:function(e,t){var n=St();return ap(n,ut,e,t)},useMemoCache:md,useCacheRefresh:Np,useEffectEvent:hp},Yb={readContext:Vt,use:Ur,useCallback:vp,useContext:Vt,useEffect:gd,useImperativeHandle:yp,useInsertionEffect:_p,useLayoutEffect:gp,useMemo:wp,useReducer:pd,useRef:fp,useState:function(){return pd(Ma)},useDebugValue:bd,useDeferredValue:function(e,t){var n=St();return ut===null?yd(n,e,t):xp(n,ut.memoizedState,e,t)},useTransition:function(){var e=pd(Ma)[0],t=St().memoizedState;return[typeof e=="boolean"?e:ys(e),t]},useSyncExternalStore:Wf,useId:Tp,useHostTransitionStatus:wd,useFormState:mp,useActionState:mp,useOptimistic:function(e,t){var n=St();return ut!==null?ap(n,ut,e,t):(n.baseState=e,[e,n.queue.dispatch])},useMemoCache:md,useCacheRefresh:Np,useEffectEvent:hp};function jd(e,t,n,l){t=e.memoizedState,n=n(l,t),n=n==null?t:U({},t,n),e.memoizedState=n,e.lanes===0&&(e.updateQueue.baseState=n)}var kd={enqueueSetState:function(e,t,n){e=e._reactInternals;var l=En(),o=Qa(l);o.payload=t,n!=null&&(o.callback=n),t=Za(e,o,l),t!==null&&(_n(t,e,l),ps(t,e,l))},enqueueReplaceState:function(e,t,n){e=e._reactInternals;var l=En(),o=Qa(l);o.tag=1,o.payload=t,n!=null&&(o.callback=n),t=Za(e,o,l),t!==null&&(_n(t,e,l),ps(t,e,l))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var n=En(),l=Qa(n);l.tag=2,t!=null&&(l.callback=t),t=Za(e,l,n),t!==null&&(_n(t,e,n),ps(t,e,n))}};function $p(e,t,n,l,o,d,p){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(l,d,p):t.prototype&&t.prototype.isPureReactComponent?!ss(n,l)||!ss(o,d):!0}function Op(e,t,n,l){e=t.state,typeof t.componentWillReceiveProps=="function"&&t.componentWillReceiveProps(n,l),typeof t.UNSAFE_componentWillReceiveProps=="function"&&t.UNSAFE_componentWillReceiveProps(n,l),t.state!==e&&kd.enqueueReplaceState(t,t.state,null)}function Ri(e,t){var n=t;if("ref"in t){n={};for(var l in t)l!=="ref"&&(n[l]=t[l])}if(e=e.defaultProps){n===t&&(n=U({},n));for(var o in e)n[o]===void 0&&(n[o]=e[o])}return n}function Rp(e){gr(e)}function qp(e){console.error(e)}function Dp(e){gr(e)}function Ir(e,t){try{var n=e.onUncaughtError;n(t.value,{componentStack:t.stack})}catch(l){setTimeout(function(){throw l})}}function Up(e,t,n){try{var l=e.onCaughtError;l(n.value,{componentStack:n.stack,errorBoundary:t.tag===1?t.stateNode:null})}catch(o){setTimeout(function(){throw o})}}function Sd(e,t,n){return n=Qa(n),n.tag=3,n.payload={element:null},n.callback=function(){Ir(e,t)},n}function Lp(e){return e=Qa(e),e.tag=3,e}function Hp(e,t,n,l){var o=n.type.getDerivedStateFromError;if(typeof o=="function"){var d=l.value;e.payload=function(){return o(d)},e.callback=function(){Up(t,n,l)}}var p=n.stateNode;p!==null&&typeof p.componentDidCatch=="function"&&(e.callback=function(){Up(t,n,l),typeof o!="function"&&(ai===null?ai=new Set([this]):ai.add(this));var g=l.stack;this.componentDidCatch(l.value,{componentStack:g!==null?g:""})})}function Bb(e,t,n,l,o){if(n.flags|=32768,l!==null&&typeof l=="object"&&typeof l.then=="function"){if(t=n.alternate,t!==null&&Ni(t,n,o,!0),n=Pt.current,n!==null){switch(n.tag){case 31:case 13:case 19:return en===null?mo():n.alternate===null&&kt===0&&(kt=3),n.flags&=-257,n.flags|=65536,n.lanes=o,l===Ar?n.flags|=16384:(t=n.updateQueue,t===null?n.updateQueue=new Set([l]):t.add(l),cu(e,l,o)),!1;case 22:return n.flags|=65536,l===Ar?n.flags|=16384:(t=n.updateQueue,t===null?(t={transitions:null,markerInstances:null,retryQueue:new Set([l])},n.updateQueue=t):(n=t.retryQueue,n===null?t.retryQueue=new Set([l]):n.add(l)),cu(e,l,o)),!1}throw Error(r(435,n.tag))}return cu(e,l,o),mo(),!1}if(He)return t=Pt.current,t!==null?((t.flags&65536)===0&&(t.flags|=256),t.flags|=65536,t.lanes=o,l!==Xc&&(e=Error(r(422),{cause:l}),cs(Un(e,n)))):(l!==Xc&&(t=Error(r(423),{cause:l}),cs(Un(t,n))),e=e.current.alternate,e.flags|=65536,o&=-o,e.lanes|=o,l=Un(l,n),o=Sd(e.stateNode,l,o),td(e,o),kt!==4&&(kt=2)),!1;var d=Error(r(520),{cause:l});if(d=Un(d,n),Es===null?Es=[d]:Es.push(d),kt!==4&&(kt=2),t===null)return!0;l=Un(l,n),n=t;do{switch(n.tag){case 3:return n.flags|=65536,e=o&-o,n.lanes|=e,e=Sd(n.stateNode,l,e),td(n,e),!1;case 1:if(t=n.type,d=n.stateNode,(n.flags&128)===0&&(typeof t.getDerivedStateFromError=="function"||d!==null&&typeof d.componentDidCatch=="function"&&(ai===null||!ai.has(d))))return n.flags|=65536,o&=-o,n.lanes|=o,o=Lp(o),Hp(o,e,n,l),td(n,o),!1;break;case 22:if(n.memoizedState!==null)return n.flags|=65536,!1}n=n.return}while(n!==null);return!1}var Td=Error(r(461)),$t=!1;function qt(e,t,n,l){t.child=e===null?If(t,null,n,l):$i(t,e.child,n,l)}function Yp(e,t,n,l,o){n=n.render;var d=t.ref;if("ref"in l){var p={};for(var g in l)g!=="ref"&&(p[g]=l[g])}else p=l;return Ei(t),l=od(e,t,n,p,d,o),g=cd(),e!==null&&!$t?(dd(e,t,o),Aa(e,t,o)):(He&&g&&jr(t),t.flags|=1,qt(e,t,l,o),t.child)}function Bp(e,t,n,l,o){if(e===null){var d=n.type;return typeof d=="function"&&!Yc(d)&&d.defaultProps===void 0&&n.compare===null?(t.tag=15,t.type=d,Gp(e,t,d,l,o)):(e=wr(n.type,null,l,t,t.mode,o),e.ref=t.ref,e.return=t,t.child=e)}if(d=e.child,!Od(e,o)){var p=d.memoizedProps;if(n=n.compare,n=n!==null?n:ss,n(p,l)&&e.ref===t.ref)return Aa(e,t,o)}return t.flags|=1,e=ka(d,l),e.ref=t.ref,e.return=t,t.child=e}function Gp(e,t,n,l,o){if(e!==null){var d=e.memoizedProps;if(ss(d,l)&&e.ref===t.ref)if($t=!1,t.pendingProps=l=d,Od(e,o))(e.flags&131072)!==0&&($t=!0);else return t.lanes=e.lanes,Aa(e,t,o)}return Nd(e,t,n,l,o)}function Ip(e,t,n,l){var o=l.children,d=e!==null?e.memoizedState:null;if(e===null&&t.stateNode===null&&(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),l.mode==="hidden"){if((t.flags&128)!==0){if(d=d!==null?d.baseLanes|n:n,e!==null){for(l=t.child=e.child,o=0;l!==null;)o=o|l.lanes|l.childLanes,l=l.sibling;l=o&~d}else l=0,t.child=null;return Xp(e,t,d,n,l)}if((n&536870912)!==0)t.memoizedState={baseLanes:0,cachePool:null},e!==null&&Er(t,d!==null?d.cachePool:null),d!==null?Pf(t,d):ad(),Qf(t);else return l=t.lanes=536870912,Xp(e,t,d!==null?d.baseLanes|n:n,n,l)}else d!==null?(Er(t,d.cachePool),Pf(t,d),Ja(),t.memoizedState=null):(e!==null&&Er(t,null),ad(),Ja());return qt(e,t,o,n),t.child}function ws(e,t){return e!==null&&e.tag===22||t.stateNode!==null||(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),t.sibling}function Xp(e,t,n,l,o){var d=Wc();return d=d===null?null:{parent:Ct._currentValue,pool:d},t.memoizedState={baseLanes:n,cachePool:d},e!==null&&Er(t,null),ad(),Qf(t),e!==null&&Ni(e,t,l,!0),t.childLanes=o,null}function Xr(e,t){return t=Vr({mode:t.mode,children:t.children},e.mode),t.ref=e.ref,e.child=t,t.return=e,t}function Vp(e,t,n){return $i(t,e.child,null,n),e=Xr(t,t.pendingProps),e.flags|=2,kn(t),t.memoizedState=null,e}function Gb(e,t,n){var l=t.pendingProps,o=(t.flags&128)!==0;if(t.flags&=-129,e===null){if(He){if(l.mode==="hidden")return e=Xr(t,l),t.lanes=536870912,e.memoizedState={baseLanes:0,cachePool:null},ws(null,e);if(ld(t),(e=ht)?(e=bh(e,Yn),e=e!==null&&e.data==="&"?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:Ba!==null?{id:aa,overflow:ia}:null,retryLane:536870912,hydrationErrors:null},n=Mf(e),n.return=t,t.child=n,Yt=t,ht=null)):e=null,e===null)throw Ia(t);return t.lanes=536870912,null}return Xr(t,l)}var d=e.memoizedState;if(d!==null){var p=d.dehydrated;if(ld(t),o)if(t.flags&256)t.flags&=-257,t=Vp(e,t,n);else if(t.memoizedState!==null)t.child=e.child,t.flags|=128,t=null;else throw Error(r(558));else if($t||Ni(e,t,n,!1),o=(n&e.childLanes)!==0,$t||o){if(Ka.current===null){if(l=ft,l!==null&&(p=Cm(l,n),p!==0&&p!==d.retryLane))throw d.retryLane=p,ji(e,p),_n(l,e,p),Td;mo()}t=Vp(e,t,n)}else e=d.treeContext,ht=Gn(p.nextSibling),Yt=t,He=!0,Ga=null,Yn=!1,e!==null&&zf(t,e),t=Xr(t,l),t.flags|=134221824;return t}return e=ka(e.child,{mode:l.mode,children:l.children}),e.ref=t.ref,t.child=e,e.return=t,e}function fl(e,t){var n=t.ref;if(n===null)e!==null&&e.ref!==null&&(t.flags|=4194816);else{if(typeof n!="function"&&typeof n!="object")throw Error(r(284));(e===null||e.ref!==n)&&(t.flags|=4194816)}}function Nd(e,t,n,l,o){return Ei(t),n=od(e,t,n,l,void 0,o),l=cd(),e!==null&&!$t?(dd(e,t,o),Aa(e,t,o)):(He&&l&&jr(t),t.flags|=1,qt(e,t,n,o),t.child)}function Pp(e,t,n,l,o,d){return Ei(t),t.updateQueue=null,n=Kf(t,l,n,o),Zf(e),l=cd(),e!==null&&!$t?(dd(e,t,d),Aa(e,t,d)):(He&&l&&jr(t),t.flags|=1,qt(e,t,n,d),t.child)}function Qp(e,t,n,l,o){if(Ei(t),t.stateNode===null){var d=al,p=n.contextType;typeof p=="object"&&p!==null&&(d=Vt(p)),d=new n(l,d),t.memoizedState=d.state!==null&&d.state!==void 0?d.state:null,d.updater=kd,t.stateNode=d,d._reactInternals=t,d=t.stateNode,d.props=l,d.state=t.memoizedState,d.refs={},Fc(t),p=n.contextType,d.context=typeof p=="object"&&p!==null?Vt(p):al,d.state=t.memoizedState,p=n.getDerivedStateFromProps,typeof p=="function"&&(jd(t,n,p,l),d.state=t.memoizedState),typeof n.getDerivedStateFromProps=="function"||typeof d.getSnapshotBeforeUpdate=="function"||typeof d.UNSAFE_componentWillMount!="function"&&typeof d.componentWillMount!="function"||(p=d.state,typeof d.componentWillMount=="function"&&d.componentWillMount(),typeof d.UNSAFE_componentWillMount=="function"&&d.UNSAFE_componentWillMount(),p!==d.state&&kd.enqueueReplaceState(d,d.state,null),_s(t,l,d,o),hs(),d.state=t.memoizedState),typeof d.componentDidMount=="function"&&(t.flags|=4194308),l=!0}else if(e===null){d=t.stateNode;var g=t.memoizedProps,j=Ri(n,g);d.props=j;var M=d.context,O=n.contextType;p=al,typeof O=="object"&&O!==null&&(p=Vt(O));var Y=n.getDerivedStateFromProps;O=typeof Y=="function"||typeof d.getSnapshotBeforeUpdate=="function",g=t.pendingProps!==g,O||typeof d.UNSAFE_componentWillReceiveProps!="function"&&typeof d.componentWillReceiveProps!="function"||(g||M!==p)&&Op(t,d,l,p),Pa=!1;var T=t.memoizedState;d.state=T,_s(t,l,d,o),hs(),M=t.memoizedState,g||T!==M||Pa?(typeof Y=="function"&&(jd(t,n,Y,l),M=t.memoizedState),(j=Pa||$p(t,n,j,l,T,M,p))?(O||typeof d.UNSAFE_componentWillMount!="function"&&typeof d.componentWillMount!="function"||(typeof d.componentWillMount=="function"&&d.componentWillMount(),typeof d.UNSAFE_componentWillMount=="function"&&d.UNSAFE_componentWillMount()),typeof d.componentDidMount=="function"&&(t.flags|=4194308)):(typeof d.componentDidMount=="function"&&(t.flags|=4194308),t.memoizedProps=l,t.memoizedState=M),d.props=l,d.state=M,d.context=p,l=j):(typeof d.componentDidMount=="function"&&(t.flags|=4194308),l=!1)}else{d=t.stateNode,ed(e,t),p=t.memoizedProps,O=Ri(n,p),d.props=O,Y=t.pendingProps,T=d.context,M=n.contextType,j=al,typeof M=="object"&&M!==null&&(j=Vt(M)),g=n.getDerivedStateFromProps,(M=typeof g=="function"||typeof d.getSnapshotBeforeUpdate=="function")||typeof d.UNSAFE_componentWillReceiveProps!="function"&&typeof d.componentWillReceiveProps!="function"||(p!==Y||T!==j)&&Op(t,d,l,j),Pa=!1,T=t.memoizedState,d.state=T,_s(t,l,d,o),hs();var $=t.memoizedState;p!==Y||T!==$||Pa||e!==null&&e.dependencies!==null&&Tr(e.dependencies)?(typeof g=="function"&&(jd(t,n,g,l),$=t.memoizedState),(O=Pa||$p(t,n,O,l,T,$,j)||e!==null&&e.dependencies!==null&&Tr(e.dependencies))?(M||typeof d.UNSAFE_componentWillUpdate!="function"&&typeof d.componentWillUpdate!="function"||(typeof d.componentWillUpdate=="function"&&d.componentWillUpdate(l,$,j),typeof d.UNSAFE_componentWillUpdate=="function"&&d.UNSAFE_componentWillUpdate(l,$,j)),typeof d.componentDidUpdate=="function"&&(t.flags|=4),typeof d.getSnapshotBeforeUpdate=="function"&&(t.flags|=1024)):(typeof d.componentDidUpdate!="function"||p===e.memoizedProps&&T===e.memoizedState||(t.flags|=4),typeof d.getSnapshotBeforeUpdate!="function"||p===e.memoizedProps&&T===e.memoizedState||(t.flags|=1024),t.memoizedProps=l,t.memoizedState=$),d.props=l,d.state=$,d.context=j,l=O):(typeof d.componentDidUpdate!="function"||p===e.memoizedProps&&T===e.memoizedState||(t.flags|=4),typeof d.getSnapshotBeforeUpdate!="function"||p===e.memoizedProps&&T===e.memoizedState||(t.flags|=1024),l=!1)}return d=l,fl(e,t),l=(t.flags&128)!==0,d||l?(d=t.stateNode,n=l&&typeof n.getDerivedStateFromError!="function"?null:d.render(),t.flags|=1,e!==null&&l?(t.child=$i(t,e.child,null,o),t.child=$i(t,null,n,o)):qt(e,t,n,o),t.memoizedState=d.state,e=t.child):e=Aa(e,t,o),e}function Zp(e,t,n,l){return Si(),t.flags|=256,qt(e,t,n,l),t.child}var Ed={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function Md(e){return{baseLanes:e,cachePool:Uf()}}function Ad(e,t,n){return e=e!==null?e.childLanes&~n:0,t&&(e|=Nn),e}function Kp(e,t,n){var l=t.pendingProps,o=!1,d=(t.flags&128)!==0,p;if((p=d)||(p=e!==null&&e.memoizedState===null?!1:(Qt.current&2)!==0),p&&(o=!0,t.flags&=-129),p=(t.flags&32)!==0,t.flags&=-33,e===null){if(He){if(o?Wa(t):Ja(),(e=ht)?(e=bh(e,Yn),e=e!==null&&e.data!=="&"?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:Ba!==null?{id:aa,overflow:ia}:null,retryLane:536870912,hydrationErrors:null},n=Mf(e),n.return=t,t.child=n,Yt=t,ht=null)):e=null,e===null)throw Ia(t);return Mu(e)?t.lanes=32:t.lanes=536870912,null}return d=l.children,l=l.fallback,o?(Ja(),o=t.mode,d=Vr({mode:"hidden",children:d},o),l=ki(l,o,n,null),d.return=t,l.return=t,d.sibling=l,t.child=d,l=t.child,l.memoizedState=Md(n),l.childLanes=Ad(e,p,n),t.memoizedState=Ed,ws(null,l)):(Wa(t),Cd(t,d))}var g=e.memoizedState;if(g!==null){var j=g.dehydrated;if(j!==null)return Ib(e,t,d,p,l,j,g,n)}return o?(Ja(),o=l.fallback,d=t.mode,g=e.child,j=g.sibling,l=ka(g,{mode:"hidden",children:l.children}),l.subtreeFlags=g.subtreeFlags&1206910976,j!==null?o=ka(j,o):(o=ki(o,d,n,null),o.flags|=2),o.return=t,l.return=t,l.sibling=o,t.child=l,ws(null,l),l=t.child,o=e.child.memoizedState,o===null?o=Md(n):(d=o.cachePool,d!==null?(g=Ct._currentValue,d=d.parent!==g?{parent:g,pool:g}:d):d=Uf(),o={baseLanes:o.baseLanes|n,cachePool:d}),l.memoizedState=o,l.childLanes=Ad(e,p,n),t.memoizedState=Ed,ws(e.child,l)):(Wa(t),n=e.child,e=n.sibling,n=ka(n,{mode:"visible",children:l.children}),n.return=t,n.sibling=null,e!==null&&(p=t.deletions,p===null?(t.deletions=[e],t.flags|=16):p.push(e)),t.child=n,t.memoizedState=null,n)}function Cd(e,t){return t=Vr({mode:"visible",children:t},e.mode),t.return=e,e.child=t}function Vr(e,t){return e=mn(22,e,null,t),e.lanes=0,e}function Pr(e,t,n){return $i(t,e.child,null,n),e=Cd(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function Ib(e,t,n,l,o,d,p,g){if(n)return t.flags&256?(Wa(t),t.flags&=-257,Pr(e,t,g)):t.memoizedState!==null?(Ja(),t.child=e.child,t.flags|=128,null):(Ja(),d=o.fallback,p=t.mode,o=Vr({mode:"visible",children:o.children},p),d=ki(d,p,g,null),d.flags|=2,o.return=t,d.return=t,o.sibling=d,t.child=o,$i(t,e.child,null,g),o=t.child,o.memoizedState=Md(g),o.childLanes=Ad(e,l,g),t.memoizedState=Ed,ws(null,o));if(Wa(t),Mu(d)){if(l=d.nextSibling&&d.nextSibling.dataset,l)var j=l.dgst;return l=j,l!==""&&(o=Error(r(419)),o.stack="",o.digest=l,cs({value:o,source:null,stack:null})),Pr(e,t,g)}if($t||Ni(e,t,g,!1),l=(g&e.childLanes)!==0,$t||l){if(Ka.current!==null)return Pr(e,t,g);if(l=ft,l!==null&&(o=Cm(l,g),o!==0&&o!==p.retryLane))throw p.retryLane=o,ji(e,o),_n(l,e,o),Td;return Eu(d)||mo(),Pr(e,t,g)}return Eu(d)?(t.flags|=192,t.child=e.child,null):(e=p.treeContext,ht=Gn(d.nextSibling),Yt=t,He=!0,Ga=null,Yn=!1,e!==null&&zf(t,e),t=Cd(t,o.children),t.flags|=134221824,t)}function Wp(e,t,n){e.lanes|=t;var l=e.alternate;l!==null&&(l.lanes|=t),Sr(e.return,t,n)}function Jp(e){for(var t=null;e!==null;){var n=e.alternate;n!==null&&Or(n)===null&&(t=e),e=e.sibling}return t}function Qr(e,t,n,l,o,d){var p=e.memoizedState;p===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:l,tail:n,tailMode:o,treeForkCount:d}:(p.isBackwards=t,p.rendering=null,p.renderingStartTime=0,p.last=l,p.tail=n,p.tailMode=o,p.treeForkCount=d)}function zd(e){var t=e.child;for(e.child=null;t!==null;){var n=t.sibling;t.sibling=e.child,e.child=t,t=n}}function $d(e,t,n){var l=t.pendingProps,o=l.revealOrder,d=l.tail;l=l.children;var p=Qt.current;if(t.flags&128)return gs(t,p),null;var g=(p&2)!==0;if(g?(p=p&1|2,t.flags|=128):p&=1,gs(t,p),o==="backwards"&&e!==null?(zd(e),qt(e,t,l,n),zd(e)):qt(e,t,l,n),l=He?os:0,!g&&e!==null&&(e.flags&128)!==0)e:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&Wp(e,n,t);else if(e.tag===19)Wp(e,n,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break e;for(;e.sibling===null;){if(e.return===null||e.return===t)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}switch(o){case"backwards":n=Jp(t.child),n===null?(o=t.child,t.child=null):(o=n.sibling,n.sibling=null,zd(t)),Qr(t,!0,o,null,d,l);break;case"unstable_legacy-backwards":for(n=null,o=t.child,t.child=null;o!==null;){if(e=o.alternate,e!==null&&Or(e)===null){t.child=o;break}e=o.sibling,o.sibling=n,n=o,o=e}Qr(t,!0,n,null,d,l);break;case"together":Qr(t,!1,null,null,void 0,l);break;case"independent":t.memoizedState=null;break;default:n=Jp(t.child),n===null?(o=t.child,t.child=null):(o=n.sibling,n.sibling=null),Qr(t,!1,o,n,d,l)}return t.child}function Fp(e,t,n){var l=t.pendingProps;return Xa(t,t.type,l.value),qt(e,t,l.children,n),t.child}function Aa(e,t,n){if(e!==null&&(t.dependencies=e.dependencies),ni|=t.lanes,(n&t.childLanes)===0)if(e!==null){if(Ni(e,t,n,!1),(n&t.childLanes)===0)return null}else return null;if(e!==null&&t.child!==e.child)throw Error(r(153));if(t.child!==null){for(e=t.child,n=ka(e,e.pendingProps),t.child=n,n.return=t;e.sibling!==null;)e=e.sibling,n=n.sibling=ka(e,e.pendingProps),n.return=t;n.sibling=null}return t.child}function Od(e,t){return(e.lanes&t)!==0?!0:(e=e.dependencies,!!(e!==null&&Tr(e)))}function Xb(e,t,n){switch(t.tag){case 3:On(t,t.stateNode.containerInfo),Xa(t,Ct,e.memoizedState.cache),Si();break;case 27:case 5:rc(t);break;case 4:On(t,t.stateNode.containerInfo);break;case 10:Xa(t,t.type,t.memoizedProps.value);break;case 31:if(t.memoizedState!==null)return t.flags|=128,ld(t),null;break;case 13:var l=t.memoizedState;if(l!==null){if(l.dehydrated!==null)return Wa(t),t.flags|=128,null;l=Ni(e,t,n,!1);var o=t.child.childLanes;return l||(n&o)!==0?Kp(e,t,n):(Wa(t),e=Aa(e,t,n),e!==null?e.sibling:null)}Wa(t);break;case 19:if(t.flags&128)return $d(e,t,n);if(o=(e.flags&128)!==0,l=(n&t.childLanes)!==0,l||(Ni(e,t,n,!1),l=(n&t.childLanes)!==0),o){if(l)return $d(e,t,n);t.flags|=128}if(o=t.memoizedState,o!==null&&(o.rendering=null,o.tail=null,o.lastEffect=null),gs(t,Qt.current),l)break;return null;case 22:return t.lanes=0,Ip(e,t,n,t.pendingProps);case 24:Xa(t,Ct,e.memoizedState.cache)}return Aa(e,t,n)}function e0(e,t,n){if(e!==null)if(e.memoizedProps!==t.pendingProps)$t=!0;else{if(!Od(e,n)&&(t.flags&128)===0)return $t=!1,Xb(e,t,n);$t=(e.flags&131072)!==0}else $t=!1,He&&(t.flags&1048576)!==0&&Cf(t,os,t.index);switch(t.lanes=0,t.tag){case 16:e:{var l=t.pendingProps;if(e=Ci(t.elementType),t.type=e,typeof e=="function")Yc(e)?(l=Ri(e,l),t.tag=1,t=Qp(null,t,e,l,n)):(t.tag=0,t=Nd(null,t,e,l,n));else{if(e!=null){var o=e.$$typeof;if(o===K){t.tag=11,t=Yp(null,t,e,l,n);break e}else if(o===tt){t.tag=14,t=Bp(null,t,e,l,n);break e}else if(o===ne){t.tag=10,t.type=e,t=Fp(null,t,n);break e}}throw t=Ce(e)||e,Error(r(306,t,""))}}return t;case 0:return Nd(e,t,t.type,t.pendingProps,n);case 1:return l=t.type,o=Ri(l,t.pendingProps),Qp(e,t,l,o,n);case 3:e:{if(On(t,t.stateNode.containerInfo),e===null)throw Error(r(387));l=t.pendingProps;var d=t.memoizedState;o=d.element,ed(e,t),_s(t,l,null,n);var p=t.memoizedState;if(l=p.cache,Xa(t,Ct,l),l!==d.cache&&Qc(t,[Ct],n,!0),hs(),l=p.element,d.isDehydrated)if(d={element:l,isDehydrated:!1,cache:p.cache},t.updateQueue.baseState=d,t.memoizedState=d,t.flags&256){t=Zp(e,t,l,n);break e}else if(l!==o){o=Un(Error(r(424)),t),cs(o),t=Zp(e,t,l,n);break e}else for(e=t.stateNode.containerInfo,e.nodeType===9?e=e.body:e=e.nodeName==="HTML"?e.ownerDocument.body:e,ht=Gn(e.firstChild),Yt=t,He=!0,Ga=null,Yn=!0,n=If(t,null,l,n),t.child=n;n;)n.flags=n.flags&-3|134221824,n=n.sibling;else{if(Si(),l===o){t=Aa(e,t,n);break e}qt(e,t,l,n)}t=t.child}return t;case 26:return fl(e,t),e===null?(n=Sh(t.type,null,t.pendingProps,null))?t.memoizedState=n:He||(t.stateNode=ih(t.type,t.pendingProps,dn.current,t)):t.memoizedState=Sh(t.type,e.memoizedProps,t.pendingProps,e.memoizedState),null;case 27:return rc(t),e===null&&He&&(l=t.stateNode=wh(t.type,t.pendingProps,dn.current),Yt=t,Yn=!0,o=ht,si(t.type)?(Au=o,ht=Gn(l.firstChild)):ht=o),qt(e,t,t.pendingProps.children,n),fl(e,t),e===null&&(t.flags|=4194304),t.child;case 5:return e===null&&He&&((o=l=ht)&&(l=Ly(l,t.type,t.pendingProps,Yn),l!==null?(t.stateNode=l,Yt=t,ht=Gn(l.firstChild),Yn=!1,o=!0):o=!1),o||Ia(t)),rc(t),o=t.type,d=t.pendingProps,p=e!==null?e.memoizedProps:null,l=d.children,wu(o,d)?l=null:p!==null&&wu(o,p)&&(t.flags|=32),t.memoizedState!==null&&(o=od(e,t,Ob,null,null,n),Cl._currentValue=o),fl(e,t),qt(e,t,l,n),t.child;case 6:return e===null&&He&&((e=n=ht)&&(n=Hy(n,t.pendingProps,Yn),n!==null?(t.stateNode=n,Yt=t,ht=null,e=!0):e=!1),e||Ia(t)),null;case 13:return Kp(e,t,n);case 4:return On(t,t.stateNode.containerInfo),l=t.pendingProps,e===null?t.child=$i(t,null,l,n):qt(e,t,l,n),t.child;case 11:return Yp(e,t,t.type,t.pendingProps,n);case 7:return l=t.pendingProps,fl(e,t),qt(e,t,l,n),t.child;case 8:return qt(e,t,t.pendingProps.children,n),t.child;case 12:return qt(e,t,t.pendingProps.children,n),t.child;case 10:return Fp(e,t,n);case 9:return o=t.type._context,l=t.pendingProps.children,Ei(t),o=Vt(o),l=l(o),t.flags|=1,qt(e,t,l,n),t.child;case 14:return Bp(e,t,t.type,t.pendingProps,n);case 15:return Gp(e,t,t.type,t.pendingProps,n);case 19:return $d(e,t,n);case 31:return Gb(e,t,n);case 22:return Ip(e,t,n,t.pendingProps);case 24:return Ei(t),l=Vt(Ct),e===null?(o=Wc(),o===null&&(o=ft,d=Zc(),o.pooledCache=d,d.refCount++,d!==null&&(o.pooledCacheLanes|=n),o=d),t.memoizedState={parent:l,cache:o},Fc(t),Xa(t,Ct,o)):((e.lanes&n)!==0&&(ed(e,t),_s(t,null,null,n),hs()),o=e.memoizedState,d=t.memoizedState,o.parent!==l?(o={parent:l,cache:l},t.memoizedState=o,t.lanes===0&&(t.memoizedState=t.updateQueue.baseState=o),Xa(t,Ct,l)):(l=d.cache,Xa(t,Ct,l),l!==o.cache&&Qc(t,[Ct],n,!0))),qt(e,t,t.pendingProps.children,n),t.child;case 30:return t.stateNode===null&&(t.stateNode={autoName:null,paired:null,clones:null,ref:null}),l=t.pendingProps,l.name!=null&&l.name!=="auto"?t.flags|=e===null?18882560:18874368:He&&jr(t),e!==null&&e.memoizedProps.name!==l.name?t.flags|=4194816:fl(e,t),qt(e,t,l.children,n),t.child;case 29:throw t.pendingProps}throw Error(r(156,t.tag))}function Ca(e){e.flags|=4}function Rd(e,t,n,l,o){var d;if((d=(e.mode&32)!==0)&&(d=n===null?Mh(t,l):Mh(t,l)&&(l.src!==n.src||l.srcSet!==n.srcSet)),d){if(e.flags|=16777216,(o&335544128)===o)if(e.stateNode.complete)e.flags|=8192;else if(R0())e.flags|=8192;else throw zi=Ar,Jc}else e.flags&=-16777217}function t0(e,t){if(t.type!=="stylesheet"||(t.state.loading&4)!==0)e.flags&=-16777217;else if(e.flags|=16777216,!Ah(t))if(R0())e.flags|=8192;else throw zi=Ar,Jc}function Zr(e,t){t!==null&&(e.flags|=4),e.flags&16384&&(t=e.tag!==22?Em():536870912,e.lanes|=t,bl|=t)}function xs(e,t){if(!He)switch(e.tailMode){case"visible":break;case"collapsed":for(var n=e.tail,l=null;n!==null;)n.alternate!==null&&(l=n),n=n.sibling;l===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:l.sibling=null;break;default:for(t=e.tail,n=null;t!==null;)t.alternate!==null&&(n=t),t=t.sibling;n===null?e.tail=null:n.sibling=null}}function _t(e){var t=e.alternate!==null&&e.alternate.child===e.child,n=0,l=0;if(t)for(var o=e.child;o!==null;)n|=o.lanes|o.childLanes,l|=o.subtreeFlags&1206910976,l|=o.flags&1206910976,o.return=e,o=o.sibling;else for(o=e.child;o!==null;)n|=o.lanes|o.childLanes,l|=o.subtreeFlags,l|=o.flags,o.return=e,o=o.sibling;return e.subtreeFlags|=l,e.childLanes=n,t}function Vb(e,t,n){var l=t.pendingProps;switch(Ic(t),t.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return _t(t),null;case 1:return _t(t),null;case 3:return n=t.stateNode,l=null,e!==null&&(l=e.memoizedState.cache),t.memoizedState.cache!==l&&(t.flags|=2048),Na(Ct),Rn(),n.pendingContext&&(n.context=n.pendingContext,n.pendingContext=null),(e===null||e.child===null)&&(sl(t)?Ca(t):e===null||e.memoizedState.isDehydrated&&(t.flags&256)===0||(t.flags|=1024,Vc())),_t(t),null;case 26:var o=t.type,d=t.memoizedState;return e===null?(Ca(t),d!==null?(_t(t),t0(t,d)):(_t(t),Rd(t,o,null,l,n))):d?d!==e.memoizedState?(Ca(t),_t(t),t0(t,d)):(_t(t),t.flags&=-16777217):(e=e.memoizedProps,e!==l&&Ca(t),_t(t),Rd(t,o,e,l,n)),null;case 27:if(er(t),n=dn.current,o=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==l&&Ca(t);else{if(!l){if(t.stateNode===null)throw Error(r(166));return _t(t),t.subtreeFlags&=-33554433,null}e=Mt.current,sl(t)?$f(t):(e=wh(o,l,n),t.stateNode=e,Ca(t))}return _t(t),t.subtreeFlags&=-33554433,null;case 5:if(er(t),o=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==l&&Ca(t);else{if(!l){if(t.stateNode===null)throw Error(r(166));return _t(t),t.subtreeFlags&=-33554433,null}if(d=Mt.current,sl(t))$f(t);else{var p=$s(dn.current);switch(d){case 1:d=p.createElementNS("http://www.w3.org/2000/svg",o);break;case 2:d=p.createElementNS("http://www.w3.org/1998/Math/MathML",o);break;default:switch(o){case"svg":d=p.createElementNS("http://www.w3.org/2000/svg",o);break;case"math":d=p.createElementNS("http://www.w3.org/1998/Math/MathML",o);break;case"script":d=p.createElement("div"),d.innerHTML="<script><\/script>",d=d.removeChild(d.firstChild);break;case"select":d=typeof l.is=="string"?p.createElement("select",{is:l.is}):p.createElement("select"),l.multiple?d.multiple=!0:l.size&&(d.size=l.size);break;default:d=typeof l.is=="string"?p.createElement(o,{is:l.is}):p.createElement(o)}}d[Xt]=t,d[un]=l;e:for(p=t.child;p!==null;){if(p.tag===5||p.tag===6)d.appendChild(p.stateNode);else if(p.tag!==4&&p.tag!==27&&p.child!==null){p.child.return=p,p=p.child;continue}if(p===t)break e;for(;p.sibling===null;){if(p.return===null||p.return===t)break e;p=p.return}p.sibling.return=p.return,p=p.sibling}t.stateNode=d;e:switch(Kt(d,o,l),o){case"button":case"input":case"select":case"textarea":l=!!l.autoFocus;break e;case"img":l=!0;break e;default:l=!1}l&&Ca(t)}}return _t(t),t.subtreeFlags&=-33554433,Rd(t,t.type,e===null?null:e.memoizedProps,t.pendingProps,n),null;case 6:if(e&&t.stateNode!=null)e.memoizedProps!==l&&Ca(t);else{if(typeof l!="string"&&t.stateNode===null)throw Error(r(166));if(e=dn.current,sl(t)){if(e=t.stateNode,n=t.memoizedProps,l=null,o=Yt,o!==null)switch(o.tag){case 27:case 5:l=o.memoizedProps}e[Xt]=t,e=!!(e.nodeValue===n||l!==null&&l.suppressHydrationWarning===!0||eh(e.nodeValue,n)),e||Ia(t,!0)}else e=$s(e).createTextNode(l),e[Xt]=t,t.stateNode=e}return _t(t),null;case 31:if(n=t.memoizedState,e===null||e.memoizedState!==null){if(l=sl(t),n!==null){if(e===null){if(!l)throw Error(r(318));if(e=t.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(r(557));e[Xt]=t}else Si(),(t.flags&128)===0&&(t.memoizedState=null),t.flags|=4;_t(t),e=!1}else n=Vc(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=n),e=!0;if(!e)return t.flags&256?(kn(t),t):(kn(t),null);if((t.flags&128)!==0)throw Error(r(558))}return _t(t),null;case 13:if(l=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(o=sl(t),l!==null&&l.dehydrated!==null){if(e===null){if(!o)throw Error(r(318));if(o=t.memoizedState,o=o!==null?o.dehydrated:null,!o)throw Error(r(317));o[Xt]=t}else Si(),(t.flags&128)===0&&(t.memoizedState=null),t.flags|=4;_t(t),o=!1}else o=Vc(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=o),o=!0;if(!o)return t.flags&256?(kn(t),t):(kn(t),null)}return kn(t),(t.flags&128)!==0?(t.lanes=n,t):(n=l!==null,e=e!==null&&e.memoizedState!==null,n&&(l=t.child,o=null,l.alternate!==null&&l.alternate.memoizedState!==null&&l.alternate.memoizedState.cachePool!==null&&(o=l.alternate.memoizedState.cachePool.pool),d=null,l.memoizedState!==null&&l.memoizedState.cachePool!==null&&(d=l.memoizedState.cachePool.pool),d!==o&&(l.flags|=2048)),n!==e&&n&&(t.child.flags|=8192),Zr(t,t.updateQueue),_t(t),null);case 4:return Rn(),e===null&&_u(t.stateNode.containerInfo),t.flags|=67108864,_t(t),null;case 10:return Na(t.type),_t(t),null;case 19:if(sd(t),l=t.memoizedState,l===null)return _t(t),null;if(o=(t.flags&128)!==0,d=l.rendering,d===null)if(o)xs(l,!1);else{if(kt!==0||e!==null&&(e.flags&128)!==0)for(e=t.child;e!==null;){if(d=Or(e),d!==null){for(t.flags|=128,xs(l,!1),e=d.updateQueue,t.updateQueue=e,Zr(t,e),t.subtreeFlags=0,e=n,n=t.child;n!==null;)Ef(n,e),n=n.sibling;return gs(t,Qt.current&1|2),He&&Sa(t,l.treeForkCount),t.child}e=e.sibling}l.tail!==null&&yn()>ro&&(t.flags|=128,o=!0,xs(l,!1),t.lanes=4194304)}else{if(!o)if(e=Or(d),e!==null){if(t.flags|=128,o=!0,e=e.updateQueue,t.updateQueue=e,Zr(t,e),xs(l,!0),l.tail===null&&l.tailMode!=="collapsed"&&l.tailMode!=="visible"&&!d.alternate&&!He)return _t(t),null}else 2*yn()-l.renderingStartTime>ro&&n!==536870912&&(t.flags|=128,o=!0,xs(l,!1),t.lanes=4194304);l.isBackwards?(d.sibling=t.child,t.child=d):(e=l.last,e!==null?e.sibling=d:t.child=d,l.last=d)}if(l.tail!==null){e=l.tail;e:{for(n=e;n!==null;){if(n.alternate!==null){n=!1;break e}n=n.sibling}n=!0}return l.rendering=e,l.tail=e.sibling,l.renderingStartTime=yn(),e.sibling=null,d=Qt.current,d=o?d&1|2:d&1,l.tailMode==="visible"||l.tailMode==="collapsed"||!n||He?gs(t,d):(n=d,Le(Pt,t),Le(Qt,n),en===null&&(en=t)),He&&Sa(t,l.treeForkCount),e}return _t(t),null;case 22:case 23:return kn(t),id(),l=t.memoizedState!==null,e!==null?e.memoizedState!==null!==l&&(t.flags|=8192):l&&(t.flags|=8192),l?(n&536870912)!==0&&(t.flags&128)===0&&(_t(t),t.subtreeFlags&6&&(t.flags|=8192)):_t(t),n=t.updateQueue,n!==null&&Zr(t,n.retryQueue),n=null,e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),l=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(l=t.memoizedState.cachePool.pool),l!==n&&(t.flags|=2048),e!==null&&ze(Ai),null;case 24:return n=null,e!==null&&(n=e.memoizedState.cache),t.memoizedState.cache!==n&&(t.flags|=2048),Na(Ct),_t(t),null;case 25:return null;case 30:return t.flags|=33554432,_t(t),null}throw Error(r(156,t.tag))}function Pb(e,t){switch(Ic(t),t.tag){case 1:return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return Na(Ct),Rn(),e=t.flags,(e&65536)!==0&&(e&128)===0?(t.flags=e&-65537|128,t):null;case 26:case 27:case 5:return er(t),null;case 31:if(t.memoizedState!==null){if(kn(t),t.alternate===null)throw Error(r(340));Si()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 13:if(kn(t),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(r(340));Si()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return sd(t),e=t.flags,e&65536?(t.flags=e&-65537|128,e=t.memoizedState,e!==null&&(e.rendering=null,e.tail=null),t.flags|=4,t):null;case 4:return Rn(),null;case 10:return Na(t.type),null;case 22:case 23:return kn(t),id(),e!==null&&ze(Ai),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 24:return Na(Ct),null;case 25:return null;default:return null}}function n0(e,t){switch(Ic(t),t.tag){case 3:Na(Ct),Rn();break;case 26:case 27:case 5:er(t);break;case 4:Rn();break;case 31:t.memoizedState!==null&&kn(t);break;case 13:kn(t);break;case 19:sd(t);break;case 10:Na(t.type);break;case 22:case 23:kn(t),id(),e!==null&&ze(Ai);break;case 24:Na(Ct)}}function js(e,t){try{var n=t.updateQueue,l=n!==null?n.lastEffect:null;if(l!==null){var o=l.next;n=o;do{if((n.tag&e)===e){l=void 0;var d=n.create,p=n.inst;l=d(),p.destroy=l}n=n.next}while(n!==o)}}catch(g){ot(t,t.return,g)}}function Fa(e,t,n){try{var l=t.updateQueue,o=l!==null?l.lastEffect:null;if(o!==null){var d=o.next;l=d;do{if((l.tag&e)===e){var p=l.inst,g=p.destroy;if(g!==void 0){p.destroy=void 0,o=t;var j=n,M=g;try{M()}catch(O){ot(o,j,O)}}}l=l.next}while(l!==d)}}catch(O){ot(t,t.return,O)}}function a0(e){var t=e.updateQueue;if(t!==null){var n=e.stateNode;try{Vf(t,n)}catch(l){ot(e,e.return,l)}}}function i0(e,t,n){n.props=Ri(e.type,e.memoizedProps),n.state=e.memoizedState;try{n.componentWillUnmount()}catch(l){ot(e,t,l)}}function la(e,t){try{var n=e.ref;if(n!==null){switch(e.tag){case 26:case 27:case 5:var l=e.stateNode;break;case 30:var o=e.stateNode,d=xa(e.memoizedProps,o);(o.ref===null||o.ref.name!==d)&&(o.ref=uh(d)),l=o.ref;break;case 7:if(e.stateNode===null){var p=new Mn(e);y(e.child,!1,Dy,p,void 0,void 0),e.stateNode=p}l=e.stateNode;break;default:l=e.stateNode}typeof n=="function"?e.refCleanup=n(l):n.current=l}}catch(g){ot(e,t,g)}}function Zt(e,t){var n=e.ref,l=e.refCleanup;if(n!==null)if(typeof l=="function")try{l()}catch(o){ot(e,t,o)}finally{e.refCleanup=null,e=e.alternate,e!=null&&(e.refCleanup=null)}else if(typeof n=="function")try{n(null)}catch(o){ot(e,t,o)}else n.current=null}function Kr(e,t){if((e.tag===5||e.tag===27||e.tag===6)&&e.alternate===null&&t!==null)for(var n=0;n<t.length;n++)gh(e.stateNode,t[n])}function l0(e){for(var t=e.return;t!==null&&(Dd(t)&&gh(e.stateNode,t.stateNode),!qd(t));)t=t.return}function ks(e){for(var t=e.return;t!==null&&(Dd(t)&&Uy(e.stateNode,t.stateNode),!qd(t));)t=t.return}function qd(e){return e.tag===5||e.tag===3||e.tag===27}function Dd(e){return e&&e.tag===7&&e.stateNode!==null}function Ud(e){var t=e.type,n=e.memoizedProps,l=e.stateNode;try{e:switch(t){case"button":case"input":case"select":case"textarea":n.autoFocus&&l.focus();break e;case"img":n.src?l.src=n.src:n.srcSet&&(l.srcset=n.srcSet)}}catch(o){ot(e,e.return,o)}}function Ld(e,t,n){try{var l=e.stateNode;yy(l,e.type,n,t),l[un]=t}catch(o){ot(e,e.return,o)}}function s0(e){return e.tag===5||e.tag===3||e.tag===26||e.tag===27&&si(e.type)||e.tag===4}function Hd(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||s0(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.tag===27&&si(e.type)||e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function Yd(e,t,n,l){var o=e.tag;if(o===5||o===6)o=e.stateNode,t?(n.nodeType===9?n.body:n.nodeName==="HTML"?n.ownerDocument.body:n).insertBefore(o,t):(t=n.nodeType===9?n.body:n.nodeName==="HTML"?n.ownerDocument.body:n,t.appendChild(o),n=n._reactRootContainer,n!=null||t.onclick!==null||(t.onclick=na)),Kr(e,l),at=!0;else if(o!==4&&(o===27&&(Kr(e,l),l=null,si(e.type)&&(n=e.stateNode,t=null)),e=e.child,e!==null))for(Yd(e,t,n,l),e=e.sibling;e!==null;)Yd(e,t,n,l),e=e.sibling}function Wr(e,t,n,l){var o=e.tag;if(o===5||o===6)o=e.stateNode,t?n.insertBefore(o,t):n.appendChild(o),Kr(e,l),at=!0;else if(o!==4&&(o===27&&(Kr(e,l),l=null,si(e.type)&&(n=e.stateNode)),e=e.child,e!==null))for(Wr(e,t,n,l),e=e.sibling;e!==null;)Wr(e,t,n,l),e=e.sibling}function r0(e){var t=e.stateNode,n=e.memoizedProps;try{for(var l=e.type,o=t.attributes;o.length;)t.removeAttributeNode(o[0]);Kt(t,l,n),t[Xt]=e,t[un]=n}catch(d){ot(e,e.return,d)}}var Jr=!1,Sn=null;function o0(e){(e.tag===30||(e.subtreeFlags&33554432)!==0)&&(Jr=!0)}var sa=null;function c0(){var e=sa;return sa=null,e}var fn=0;function pl(e,t,n,l,o){return fn=0,d0(e.child,t,n,l,o)}function d0(e,t,n,l,o){for(var d=!1;e!==null;){if(e.tag===5){var p=e.stateNode;if(l!==null){var g=ku(p);l.push(g),g.view&&(d=!0)}else d||ku(p).view&&(d=!0);Jr=!0,ch(p,fn===0?t:t+"_"+fn,n),fn++}else(e.tag!==22||e.memoizedState===null)&&(e.tag===30&&o||d0(e.child,t,n,l,o)&&(d=!0));e=e.sibling}return d}function ra(e,t){for(;e!==null;)e.tag===5?dh(e.stateNode,e.memoizedProps):(e.tag!==22||e.memoizedState===null)&&(e.tag===30&&t||ra(e.child,t)),e=e.sibling}function Fr(e){if((e.subtreeFlags&18874368)!==0)for(e=e.child;e!==null;){if((e.tag!==22||e.memoizedState===null)&&(Fr(e),e.tag===30&&(e.flags&18874368)!==0&&e.stateNode.paired)){var t=e.memoizedProps;if(t.name==null||t.name==="auto")throw Error(r(544));var n=t.name;t=ja(t.default,t.share),t!=="none"&&(pl(e,n,t,null,!1)||ra(e.child,!1))}e=e.sibling}}function Bd(e,t){if(e.tag===30){var n=e.stateNode,l=e.memoizedProps,o=xa(l,n),d=ja(l.default,n.paired?l.share:l.enter);d!=="none"?pl(e,o,d,null,!1)?(Fr(e),n.paired||t||xl(e,l.onEnter)):ra(e.child,!1):Fr(e)}else if((e.subtreeFlags&33554432)!==0)for(e=e.child;e!==null;)Bd(e,t),e=e.sibling;else Fr(e)}function Gd(e){if(Sn!==null&&Sn.size!==0){var t=Sn;if((e.subtreeFlags&18874368)!==0)for(e=e.child;e!==null;){if(e.tag!==22||e.memoizedState===null){if(e.tag===30&&(e.flags&18874368)!==0){var n=e.memoizedProps,l=n.name;if(l!=null&&l!=="auto"){var o=t.get(l);if(o!==void 0){var d=ja(n.default,n.share);if(d!=="none"&&(pl(e,l,d,null,!1)?(d=e.stateNode,o.paired=d,d.paired=o,xl(e,n.onShare)):ra(e.child,!1)),t.delete(l),t.size===0)break}}}Gd(e)}e=e.sibling}}}function Id(e){if(e.tag===30){var t=e.memoizedProps,n=xa(t,e.stateNode),l=Sn!==null?Sn.get(n):void 0,o=ja(t.default,l!==void 0?t.share:t.exit);o!=="none"&&(pl(e,n,o,null,!1)?l!==void 0?(o=e.stateNode,l.paired=o,o.paired=l,Sn.delete(n),xl(e,t.onShare)):xl(e,t.onExit):ra(e.child,!1)),Sn!==null&&Gd(e)}else if((e.subtreeFlags&33554432)!==0)for(e=e.child;e!==null;)Id(e),e=e.sibling;else Sn!==null&&Gd(e)}function u0(e){for(e=e.child;e!==null;){if(e.tag===30){var t=e.memoizedProps,n=xa(t,e.stateNode);t=ja(t.default,t.update),e.flags&=-5,t!=="none"&&pl(e,n,t,e.memoizedState=[],!1)}else(e.subtreeFlags&33554432)!==0&&u0(e);e=e.sibling}}function Xd(e){if((e.subtreeFlags&18874368)!==0)for(e=e.child;e!==null;){if(e.tag!==22||e.memoizedState===null){if(e.tag===30&&(e.flags&18874368)!==0){var t=e.stateNode;t.paired!==null&&(t.paired=null,ra(e.child,!1))}Xd(e)}e=e.sibling}}function eo(e){if(e.tag===30)e.stateNode.paired=null,ra(e.child,!1),Xd(e);else if((e.subtreeFlags&33554432)!==0)for(e=e.child;e!==null;)eo(e),e=e.sibling;else Xd(e)}function m0(e){for(e=e.child;e!==null;)e.tag===30?ra(e.child,!1):(e.subtreeFlags&33554432)!==0&&m0(e),e=e.sibling}function Vd(e,t,n,l,o,d,p){for(var g=!1;t!==null;){if(t.tag===5){var j=t.stateNode;if(d!==null&&fn<d.length){var M=d[fn],O=ku(j);(M.view||O.view)&&(g=!0);var Y;if(Y=(e.flags&4)===0)if(O.clip)Y=!0;else{Y=M.rect;var T=O.rect;Y=Y.y!==T.y||Y.x!==T.x||Y.height!==T.height||Y.width!==T.width}Y&&(e.flags|=4),O.abs?O=!M.abs:(M=M.rect,O=O.rect,O=M.height!==O.height||M.width!==O.width),O&&(e.flags|=32)}else e.flags|=32;(e.flags&4)!==0&&ch(j,fn===0?n:n+"_"+fn,o),g&&(e.flags&4)!==0||(sa===null&&(sa=[]),sa.push(j,fn===0?l:l+"_"+fn,t.memoizedProps)),fn++}else(t.tag!==22||t.memoizedState===null)&&(t.tag===30&&p?e.flags|=t.flags&32:Vd(e,t.child,n,l,o,d,p)&&(g=!0));t=t.sibling}return g}function f0(e,t){for(e=e.child;e!==null;){if(e.tag===30){var n=e.memoizedProps,l=e.stateNode,o=xa(n,l),d=ja(n.default,n.update),p;p=e.memoizedState,e.memoizedState=null,l=e;var g=e.child;fn=0,o=Vd(l,g,o,o,d,p,!1),(e.flags&4)!==0&&o&&xl(e,n.onUpdate)}else(e.subtreeFlags&33554432)!==0&&f0(e);e=e.sibling}}var Bt=!1,st=!1,oa=!1,Pd=!1,p0=typeof WeakSet=="function"?WeakSet:Set,Gt=null,ca=!1,Ss=!1,to=!1,Qd=!1;function Qb(e,t,n){if(e=e.containerInfo,yu=zl,e=bf(e),Oc(e)){if("selectionStart"in e)var l={start:e.selectionStart,end:e.selectionEnd};else e:{l=(l=e.ownerDocument)&&l.defaultView||window;var o=l.getSelection&&l.getSelection();if(o&&o.rangeCount!==0){l=o.anchorNode;var d=o.anchorOffset,p=o.focusNode;o=o.focusOffset;try{l.nodeType,p.nodeType}catch{l=null;break e}var g=0,j=-1,M=-1,O=0,Y=0,T=e,$=null;t:for(;;){for(var W;T!==l||d!==0&&T.nodeType!==3||(j=g+d),T!==p||o!==0&&T.nodeType!==3||(M=g+o),T.nodeType===3&&(g+=T.nodeValue.length),(W=T.firstChild)!==null;)$=T,T=W;for(;;){if(T===e)break t;if($===l&&++O===d&&(j=g),$===p&&++Y===o&&(M=g),(W=T.nextSibling)!==null)break;T=$,$=T.parentNode}T=W}l=j===-1||M===-1?null:{start:j,end:M}}else l=null}l=l||{start:0,end:0}}else l=null;for(vu={focusedElem:e,selectionRange:l},zl=!1,n=(n&335544064)===n,Gt=t,t=n?9270:1024;Gt!==null;){if(e=Gt,n&&(l=e.deletions,l!==null))for(d=0;d<l.length;d++)n&&Id(l[d]);if(e.alternate===null&&(e.flags&2)!==0)n&&o0(e),no(n);else{if(e.tag===22){if(l=e.alternate,e.memoizedState!==null){l!==null&&l.memoizedState===null&&n&&Id(l),no(n);continue}else if(l!==null&&l.memoizedState!==null){n&&o0(e),no(n);continue}}l=e.child,(e.subtreeFlags&t)!==0&&l!==null?(l.return=e,Gt=l):(n&&u0(e),no(n))}}Sn=null}function no(e){for(;Gt!==null;){var t=Gt,n=e,l=t.alternate,o=t.flags;switch(t.tag){case 0:case 11:case 15:break;case 1:if((o&1024)!==0&&l!==null){n=void 0,o=l.memoizedProps,l=l.memoizedState;var d=t.stateNode;try{var p=Ri(t.type,o);n=d.getSnapshotBeforeUpdate(p,l),d.__reactInternalSnapshotBeforeUpdate=n}catch(g){ot(t,t.return,g)}}break;case 3:if((o&1024)!==0){if(l=t.stateNode.containerInfo,n=l.nodeType,n===9)Nu(l);else if(n===1)switch(l.nodeName){case"HEAD":case"HTML":case"BODY":Nu(l);break;default:l.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;case 30:n&&l!==null&&(n=xa(l.memoizedProps,l.stateNode),o=t.memoizedProps,o=ja(o.default,o.update),o!=="none"&&pl(l,n,o,l.memoizedState=[],!0));break;default:if((o&1024)!==0)throw Error(r(163))}if(l=t.sibling,l!==null){l.return=t.return,Gt=l;break}Gt=t.return}}function h0(e,t,n){var l=n.flags;switch(n.tag){case 0:case 11:case 15:da(e,n),l&4&&js(5,n);break;case 1:if(da(e,n),l&4)if(e=n.stateNode,t===null)try{e.componentDidMount()}catch(p){ot(n,n.return,p)}else{var o=Ri(n.type,t.memoizedProps);t=t.memoizedState;try{e.componentDidUpdate(o,t,e.__reactInternalSnapshotBeforeUpdate)}catch(p){ot(n,n.return,p)}}l&64&&a0(n),l&512&&la(n,n.return);break;case 3:if(da(e,n),l&64&&(e=n.updateQueue,e!==null)){if(t=null,n.child!==null)switch(n.child.tag){case 27:case 5:t=n.child.stateNode;break;case 1:t=n.child.stateNode}try{Vf(e,t)}catch(p){ot(n,n.return,p)}}break;case 27:t===null&&l&4&&r0(n);case 26:case 5:da(e,n),t===null&&l&4&&Ud(n),l&512&&la(n,n.return);break;case 12:da(e,n);break;case 31:da(e,n),l&4&&y0(e,n);break;case 13:da(e,n),l&4&&v0(e,n),l&64&&(e=n.memoizedState,e!==null&&(e=e.dehydrated,e!==null&&(n=sy.bind(null,n),Yy(e,n))));break;case 22:if(l=n.memoizedState!==null||Bt,!l){var d=t!==null&&t.memoizedState!==null||st;t=Bt,o=st,Bt=l,(st=d)&&!o?(l=2,(n.subtreeFlags&8772)!==0&&(l|=1),Wn(e,n,l)):da(e,n),Bt=t,st=o}break;case 30:da(e,n),l&512&&la(n,n.return);break;case 7:l&512&&la(n,n.return);default:da(e,n)}}function Zd(e,t){for(e=e.child;e!==null;)_0(e,t),e=e.sibling}function _0(e,t){switch(e.tag){case 5:case 26:try{var n=e.stateNode;if(t){var l=n.style;typeof l.setProperty=="function"?l.setProperty("display","none","important"):l.display="none"}else{var o=e.stateNode,d=e.memoizedProps.style,p=d!=null&&d.hasOwnProperty("display")?d.display:null;o.style.display=p==null||typeof p=="boolean"?"":(""+p).trim()}}catch(j){ot(e,e.return,j)}Kd(e,t);break;case 6:try{e.stateNode.nodeValue=t?"":e.memoizedProps,at=!0}catch(j){ot(e,e.return,j)}break;case 18:try{var g=e.stateNode;t?oh(g,!0):oh(e.stateNode,!1)}catch(j){ot(e,e.return,j)}break;case 22:case 23:e.memoizedState===null&&Zd(e,t);break;default:Zd(e,t)}}function Kd(e,t){if(e.subtreeFlags&67108864)for(e=e.child;e!==null;){e:{var n=e,l=t;switch(n.tag){case 4:_0(n,l);break e;case 22:n.memoizedState===null&&Kd(n,l);break e;default:Kd(n,l)}}e=e.sibling}}function g0(e){var t=e.alternate;t!==null&&(e.alternate=null,g0(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&rr(t)),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}var vt=null,pn=!1;function Zn(e,t,n){for(n=n.child;n!==null;)b0(e,t,n),n=n.sibling}function b0(e,t,n){if(vn&&typeof vn.onCommitFiberUnmount=="function")try{vn.onCommitFiberUnmount(Ql,n)}catch{}switch(n.tag){case 26:st||Zt(n,t),Zn(e,t,n),n.memoizedState?n.memoizedState.count--:n.stateNode&&!st&&(n=n.stateNode,n.parentNode.removeChild(n));break;case 27:st||Zt(n,t),ks(n);var l=vt,o=pn;si(n.type)&&(vt=n.stateNode,pn=!1),Zn(e,t,n),xh(n.stateNode,n.type,n.memoizedProps),vt=l,pn=o;break;case 5:st||Zt(n,t),ks(n);case 6:if(n.tag===6&&ks(n),l=vt,o=pn,vt=null,Zn(e,t,n),vt=l,pn=o,vt!==null)if(pn)try{(vt.nodeType===9?vt.body:vt.nodeName==="HTML"?vt.ownerDocument.body:vt).removeChild(n.stateNode),at=!0}catch(d){ot(n,t,d)}else try{vt.removeChild(n.stateNode),at=!0}catch(d){ot(n,t,d)}break;case 18:vt!==null&&(pn?(e=vt,rh(e.nodeType===9?e.body:e.nodeName==="HTML"?e.ownerDocument.body:e,n.stateNode),$l(e)):rh(vt,n.stateNode));break;case 4:l=vt,o=pn,vt=n.stateNode.containerInfo,pn=!0,Zn(e,t,n),vt=l,pn=o;break;case 0:case 11:case 14:case 15:Fa(2,n,t),st||Fa(4,n,t),Zn(e,t,n);break;case 1:st||(Zt(n,t),l=n.stateNode,typeof l.componentWillUnmount=="function"&&i0(n,t,l)),Zn(e,t,n);break;case 21:Zn(e,t,n);break;case 22:st=(l=st)||n.memoizedState!==null,Zn(e,t,n),st=l;break;case 30:Zt(n,t),Zn(e,t,n);break;case 7:st||Zt(n,t),Zn(e,t,n);break;default:Zn(e,t,n)}}function y0(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null))){e=e.dehydrated;try{$l(e)}catch(n){ot(t,t.return,n)}}}function v0(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null&&(e=e.dehydrated,e!==null))))try{$l(e)}catch(n){ot(t,t.return,n)}}function Zb(e){switch(e.tag){case 31:case 13:case 19:var t=e.stateNode;return t===null&&(t=e.stateNode=new p0),t;case 22:return e=e.stateNode,t=e._retryCache,t===null&&(t=e._retryCache=new p0),t;default:throw Error(r(435,e.tag))}}function ao(e,t){var n=Zb(e);t.forEach(function(l){if(!n.has(l)){n.add(l);var o=ry.bind(null,e,l);l.then(o,o)}})}function rn(e,t,n){var l=t.deletions;if(l!==null)for(var o=0;o<l.length;o++){var d=l[o],p=e,g=t,j=g;e:for(;j!==null;){switch(j.tag){case 27:if(si(j.type)){vt=j.stateNode,pn=!1;break e}break;case 5:vt=j.stateNode,pn=!1;break e;case 3:case 4:vt=j.stateNode.containerInfo,pn=!0;break e}j=j.return}if(vt===null)throw Error(r(160));b0(p,g,d),vt=null,pn=!1,p=d.alternate,p!==null&&(p.return=null),d.return=null}if(t.subtreeFlags&13886)for(t=t.child;t!==null;)w0(t,e,n),t=t.sibling}var Kn=null;function w0(e,t,n){var l=e.alternate,o=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if(o&4&&(l=e.updateQueue,l=l!==null?l.events:null,l!==null))for(var d=0;d<l.length;d++){var p=l[d];p.ref.impl=p.nextImpl}rn(t,e,n),on(e),o&4&&(Fa(3,e,e.return),js(3,e),Fa(5,e,e.return));break;case 1:rn(t,e,n),on(e),o&512&&(st||l===null||Zt(l,l.return)),o&64&&Bt&&(e=e.updateQueue,e!==null&&(t=e.callbacks,t!==null&&(n=e.shared.hiddenCallbacks,e.shared.hiddenCallbacks=n===null?t:n.concat(t))));break;case 26:if(d=Kn,rn(t,e,n),on(e),o&512&&(st||l===null||Zt(l,l.return)),o&4)if(o=l!==null?l.memoizedState:null,n=e.memoizedState,l===null)if(n===null)if(e.stateNode===null)if(Bt)e.stateNode=ih(e.type,e.memoizedProps,t.containerInfo,e);else{e:{t=e.type,n=e.memoizedProps,o=d.ownerDocument||d;t:switch(t){case"title":l=o.getElementsByTagName("title")[0],(!l||l[Wl]||l[Xt]||l.namespaceURI==="http://www.w3.org/2000/svg"||l.hasAttribute("itemprop"))&&(l=o.createElement(t),o.head.insertBefore(l,o.querySelector("head > title"))),Kt(l,t,n),l[Xt]=e,Ht(l),t=l;break e;case"link":if(d=Eh("link","href",o).get(t+(n.href||""))){for(p=0;p<d.length;p++)if(l=d[p],l.getAttribute("href")===(n.href==null||n.href===""?null:n.href)&&l.getAttribute("rel")===(n.rel==null?null:n.rel)&&l.getAttribute("title")===(n.title==null?null:n.title)&&l.getAttribute("crossorigin")===(n.crossOrigin==null?null:n.crossOrigin)){d.splice(p,1);break t}}l=o.createElement(t),Kt(l,t,n),o.head.appendChild(l);break;case"meta":if(d=Eh("meta","content",o).get(t+(n.content||""))){for(p=0;p<d.length;p++)if(l=d[p],l.getAttribute("content")===(n.content==null?null:""+n.content)&&l.getAttribute("name")===(n.name==null?null:n.name)&&l.getAttribute("property")===(n.property==null?null:n.property)&&l.getAttribute("http-equiv")===(n.httpEquiv==null?null:n.httpEquiv)&&l.getAttribute("charset")===(n.charSet==null?null:n.charSet)){d.splice(p,1);break t}}l=o.createElement(t),Kt(l,t,n),o.head.appendChild(l);break;default:throw Error(r(468,t))}l[Xt]=e,Ht(l),t=l}e.stateNode=t}else Bt||Ou(d,e.type,e.stateNode);else e.stateNode=Nh(d,n,e.memoizedProps);else o!==n?(o===null?(t=l.stateNode,t===null||st||t.parentNode.removeChild(t)):o.count--,n===null?Bt||Ou(d,e.type,e.stateNode):Nh(d,n,e.memoizedProps)):n===null&&e.stateNode!==null&&Ld(e,e.memoizedProps,l.memoizedProps);break;case 27:rn(t,e,n),on(e),o&512&&(st||l===null||Zt(l,l.return)),l!==null&&o&4&&Ld(e,e.memoizedProps,l.memoizedProps);break;case 5:if(d=oa,oa=!1,rn(t,e,n),oa=d,on(e),o&512&&(st||l===null||Zt(l,l.return)),e.flags&32){t=e.stateNode;try{Ki(t,""),at=!0}catch(O){ot(e,e.return,O)}}o&4&&e.stateNode!=null&&(t=e.memoizedProps,Ld(e,t,l!==null?l.memoizedProps:t)),o&1024&&(Pd=!0);break;case 6:if(rn(t,e,n),on(e),o&4){if(e.stateNode===null)throw Error(r(162));t=e.memoizedProps,n=e.stateNode;try{n.nodeValue=t,at=!0}catch(O){ot(e,e.return,O)}}break;case 3:if(at=!1,yo=null,d=Kn,Kn=Os(t.containerInfo),rn(t,e,n),Kn=d,on(e),o&4&&l!==null&&l.memoizedState.isDehydrated)try{$l(t.containerInfo)}catch(O){ot(e,e.return,O)}Pd&&(Pd=!1,x0(e)),at=!1;break;case 4:o=oa,oa=Bt,l=Ym(),d=Kn,Kn=Os(e.stateNode.containerInfo),rn(t,e,n),on(e),Kn=d,at&&Ss&&(to=!0),at=l,oa=o;break;case 12:rn(t,e,n),on(e);break;case 31:rn(t,e,n),on(e),o&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,ao(e,t)));break;case 13:rn(t,e,n),on(e),e.child.flags&8192&&e.memoizedState!==null!=(l!==null&&l.memoizedState!==null)&&(so=yn()),o&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,ao(e,t)));break;case 22:d=e.memoizedState!==null,p=l!==null&&l.memoizedState!==null;var g=Bt,j=st,M=oa;Bt=g||d,oa=M||d,st=j||p,rn(t,e,n),st=j,oa=M,Bt=g,on(e),o&8192&&(t=e.stateNode,t._visibility=d?t._visibility&-2:t._visibility|1,!d||l===null||p||Bt||st||(t=p||st,n=Bt,l=st,Bt=d||Bt,st=t,ei(e,2),Bt=n,st=l),!d&&oa||Zd(e,d)),o&4&&(t=e.updateQueue,t!==null&&(n=t.retryQueue,n!==null&&(t.retryQueue=null,ao(e,n))));break;case 19:rn(t,e,n),on(e),o&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,ao(e,t)));break;case 30:o&512&&(st||l===null||Zt(l,l.return)),o=Ym(),d=Ss,p=(n&335544064)===n,g=e.memoizedProps,Ss=p&&ja(g.default,g.update)!=="none",rn(t,e,n),on(e),p&&l!==null&&at&&(e.flags|=4),Ss=d,at=o;break;case 21:break;case 7:o&512&&(st||l===null||Zt(l,l.return)),l&&l.stateNode!==null&&(l.stateNode._fragmentFiber=e);default:rn(t,e,n),on(e)}}function on(e){var t=e.flags;if(t&2){try{for(var n,l=e.return;l!==null;){if(s0(l)){n=l;break}l=l.return}l=null;for(var o=e.return;o!==null;){if(Dd(o)){var d=o.stateNode;l===null?l=[d]:l.push(d)}if(qd(o))break;o=o.return}var p=l;if(n==null)throw Error(r(160));switch(n.tag){case 27:var g=n.stateNode,j=Hd(e);Wr(e,j,g,p);break;case 5:var M=n.stateNode;n.flags&32&&(Ki(M,""),n.flags&=-33);var O=Hd(e);Wr(e,O,M,p);break;case 3:case 4:var Y=n.stateNode.containerInfo,T=Hd(e);Yd(e,T,Y,p);break;default:throw Error(r(161))}}catch($){ot(e,e.return,$)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function x0(e){if(e.subtreeFlags&1024)for(e=e.child;e!==null;){var t=e;x0(t),t.tag===5&&t.flags&1024&&(t=t.stateNode,zl=!0,t.reset(),zl=!1),e=e.sibling}}function hl(e,t){if(t.subtreeFlags&9270)for(t=t.child;t!==null;)j0(t,e),t=t.sibling;else f0(t)}function j0(e,t){var n=e.alternate;if(n===null)Bd(e,!1);else switch(e.tag){case 3:if(Qd=ca=!1,c0(),hl(t,e),!ca&&!to){if(e=sa,e!==null)for(var l=0;l<e.length;l+=3){n=e[l];var o=e[l+1];dh(n,e[l+2]),n=n.ownerDocument.documentElement,n!==null&&n.animate({opacity:[0,0],pointerEvents:["none","none"]},{duration:0,fill:"forwards",pseudoElement:"::view-transition-group("+o+")"})}e=t.containerInfo,e=e.nodeType===9?e.documentElement:e.ownerDocument.documentElement,e!==null&&e.style.viewTransitionName===""&&(e.style.viewTransitionName="none",e.animate({opacity:[0,0],pointerEvents:["none","none"]},{duration:0,fill:"forwards",pseudoElement:"::view-transition-group(root)"}),e.animate({width:[0,0],height:[0,0]},{duration:0,fill:"forwards",pseudoElement:"::view-transition"})),Qd=!0}sa=null;break;case 5:hl(t,e);break;case 4:l=ca,ca=!1,hl(t,e),ca&&(to=!0),ca=l;break;case 22:e.memoizedState===null&&(n.memoizedState!==null?Bd(e,!1):hl(t,e));break;case 30:l=ca,o=c0(),ca=!1,hl(t,e),ca&&(e.flags|=4);var d=e.memoizedProps,p=e.stateNode;t=xa(d,p),p=xa(n.memoizedProps,p);var g=ja(d.default,d.update);g==="none"?t=!1:(d=n.memoizedState,n.memoizedState=null,n=e.child,fn=0,t=Vd(e,n,t,p,g,d,!0),fn!==(d===null?0:d.length)&&(e.flags|=32)),(e.flags&4)!==0&&t?(xl(e,e.memoizedProps.onUpdate),sa=o):o!==null&&(o.push.apply(o,sa),sa=o),ca=(e.flags&32)!==0?!0:l;break;default:hl(t,e)}}function da(e,t){if(t.subtreeFlags&8772)for(t=t.child;t!==null;)h0(e,t.alternate,t),t=t.sibling}function ei(e,t){for(e=e.child;e!==null;){var n=e,l=t;switch(n.tag){case 0:case 11:case 14:case 15:Fa(4,n,n.return),ei(n,l);break;case 1:Zt(n,n.return);var o=n.stateNode;typeof o.componentWillUnmount=="function"&&i0(n,n.return,o),ei(n,l);break;case 27:(l&2)!==0&&xh(n.stateNode,n.type,n.memoizedProps);case 5:Zt(n,n.return),n.tag!==5&&n.tag!==27||ks(n),ei(n,l);break;case 6:ks(n);break;case 26:Zt(n,n.return),o=n.stateNode,n.memoizedState!==null||o===null||st||o.parentNode.removeChild(o),ei(n,l);break;case 22:n.memoizedState===null&&ei(n,l);break;case 30:Zt(n,n.return),ei(n,l);break;case 7:Zt(n,n.return);default:ei(n,l)}e=e.sibling}}function Wn(e,t,n){for(n=(t.subtreeFlags&8772)!==0?n:n&-2,t=t.child;t!==null;){var l=t.alternate,o=e,d=t,p=d.flags,g=(n&1)!==0;switch(d.tag){case 0:case 11:case 15:Wn(o,d,n),js(4,d);break;case 1:if(Wn(o,d,n),l=d,o=l.stateNode,typeof o.componentDidMount=="function")try{o.componentDidMount()}catch(O){ot(l,l.return,O)}if(l=d,o=l.updateQueue,o!==null){var j=l.stateNode;try{var M=o.shared.hiddenCallbacks;if(M!==null)for(o.shared.hiddenCallbacks=null,o=0;o<M.length;o++)Xf(M[o],j)}catch(O){ot(l,l.return,O)}}g&&p&64&&a0(d),la(d,d.return);break;case 27:(n&2)!==0&&r0(d);case 5:d.tag!==5&&d.tag!==27||l0(d),Wn(o,d,n),g&&l===null&&p&4&&Ud(d),la(d,d.return);break;case 6:l0(d);break;case 26:j=d.stateNode,d.memoizedState!==null||j===null||Bt||Ou(Os(j.ownerDocument),d.type,j),Wn(o,d,n),g&&l===null&&p&4&&Ud(d),la(d,d.return);break;case 12:Wn(o,d,n);break;case 31:Wn(o,d,n),g&&p&4&&y0(o,d);break;case 13:Wn(o,d,n),g&&p&4&&v0(o,d);break;case 22:d.memoizedState===null&&Wn(o,d,n),la(d,d.return);break;case 30:Wn(o,d,n),la(d,d.return);break;case 7:la(d,d.return);default:Wn(o,d,n)}t=t.sibling}}function Wd(e,t){var n=null;e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),e=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(e=t.memoizedState.cachePool.pool),e!==n&&(e!=null&&e.refCount++,n!=null&&ds(n))}function Jd(e,t){e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&ds(e))}function Bn(e,t,n,l){var o=(n&335544064)===n;if(t.subtreeFlags&(o?10262:10256))for(t=t.child;t!==null;)k0(e,t,n,l),t=t.sibling;else o&&m0(t)}function k0(e,t,n,l){var o=(n&335544064)===n;o&&t.alternate===null&&t.return!==null&&t.return.alternate!==null&&eo(t);var d=t.flags;switch(t.tag){case 0:case 11:case 15:Bn(e,t,n,l),d&2048&&js(9,t);break;case 1:Bn(e,t,n,l);break;case 3:Bn(e,t,n,l),o&&Qd&&(e=e.containerInfo,e=e.nodeType===9?e.body:e.nodeName==="HTML"?e.ownerDocument.body:e,e.style.viewTransitionName==="root"&&(e.style.viewTransitionName=""),e=e.ownerDocument.documentElement,e!==null&&e.style.viewTransitionName==="none"&&(e.style.viewTransitionName="")),d&2048&&(d=null,t.alternate!==null&&(d=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==d&&(t.refCount++,d!=null&&ds(d)));break;case 12:if(d&2048){Bn(e,t,n,l),d=t.stateNode;try{var p=t.memoizedProps,g=p.id,j=p.onPostCommit;typeof j=="function"&&j(g,t.alternate===null?"mount":"update",d.passiveEffectDuration,-0)}catch(M){ot(t,t.return,M)}}else Bn(e,t,n,l);break;case 31:Bn(e,t,n,l);break;case 13:Bn(e,t,n,l);break;case 23:break;case 22:p=t.stateNode,g=t.alternate,t.memoizedState!==null?(o&&g!==null&&g.memoizedState===null&&eo(g),p._visibility&2?Bn(e,t,n,l):Ts(e,t)):(o&&g!==null&&g.memoizedState!==null&&eo(t),p._visibility&2?Bn(e,t,n,l):(p._visibility|=2,_l(e,t,n,l,(t.subtreeFlags&10256)!==0||!1))),d&2048&&Wd(g,t);break;case 24:Bn(e,t,n,l),d&2048&&Jd(t.alternate,t);break;case 30:o&&(d=t.alternate,d!==null&&(ra(d.child,!0),ra(t.child,!0))),Bn(e,t,n,l);break;default:Bn(e,t,n,l)}}function _l(e,t,n,l,o){for(o=o&&((t.subtreeFlags&10256)!==0||!1),t=t.child;t!==null;){var d=e,p=t,g=n,j=l,M=p.flags;switch(p.tag){case 0:case 11:case 15:_l(d,p,g,j,o),js(8,p);break;case 23:break;case 22:var O=p.stateNode;p.memoizedState!==null?O._visibility&2?_l(d,p,g,j,o):Ts(d,p):(O._visibility|=2,_l(d,p,g,j,o)),o&&M&2048&&Wd(p.alternate,p);break;case 24:_l(d,p,g,j,o),o&&M&2048&&Jd(p.alternate,p);break;default:_l(d,p,g,j,o)}t=t.sibling}}function Ts(e,t){if(t.subtreeFlags&10256)for(t=t.child;t!==null;){var n=e,l=t,o=l.flags;switch(l.tag){case 22:Ts(n,l),o&2048&&Wd(l.alternate,l);break;case 24:Ts(n,l),o&2048&&Jd(l.alternate,l);break;default:Ts(n,l)}t=t.sibling}}var qi=8192;function Di(e,t,n){if(e.subtreeFlags&qi)for(e=e.child;e!==null;)S0(e,t,n),e=e.sibling}function S0(e,t,n){switch(e.tag){case 26:Di(e,t,n),e.flags&qi&&(e.memoizedState!==null?tv(n,Kn,e.memoizedState,e.memoizedProps):(e=e.stateNode,(t&335544128)===t&&zh(n,e)));break;case 5:Di(e,t,n),e.flags&qi&&(e=e.stateNode,(t&335544128)===t&&zh(n,e));break;case 3:case 4:var l=Kn;Kn=Os(e.stateNode.containerInfo),Di(e,t,n),Kn=l;break;case 22:e.memoizedState===null&&(l=e.alternate,l!==null&&l.memoizedState!==null?(l=qi,qi=16777216,Di(e,t,n),qi=l):Di(e,t,n));break;case 30:if((e.flags&qi)!==0&&(l=e.memoizedProps.name,l!=null&&l!=="auto")){var o=e.stateNode;o.paired=null,Sn===null&&(Sn=new Map),Sn.set(l,o)}Di(e,t,n);break;default:Di(e,t,n)}}function T0(e){var t=e.alternate;if(t!==null&&(e=t.child,e!==null)){t.child=null;do t=e.sibling,e.sibling=null,e=t;while(e!==null)}}function Ns(e){var t=e.deletions;if((e.flags&16)!==0){if(t!==null)for(var n=0;n<t.length;n++){var l=t[n];Gt=l,E0(l,e)}T0(e)}if(e.subtreeFlags&10256)for(e=e.child;e!==null;)N0(e),e=e.sibling}function N0(e){switch(e.tag){case 0:case 11:case 15:Ns(e),e.flags&2048&&Fa(9,e,e.return);break;case 3:Ns(e);break;case 12:Ns(e);break;case 22:var t=e.stateNode;e.memoizedState!==null&&t._visibility&2&&(e.return===null||e.return.tag!==13)?(t._visibility&=-3,io(e)):Ns(e);break;default:Ns(e)}}function io(e){var t=e.deletions;if((e.flags&16)!==0){if(t!==null)for(var n=0;n<t.length;n++){var l=t[n];Gt=l,E0(l,e)}T0(e)}for(e=e.child;e!==null;){switch(t=e,t.tag){case 0:case 11:case 15:Fa(8,t,t.return),io(t);break;case 22:n=t.stateNode,n._visibility&2&&(n._visibility&=-3,io(t));break;default:io(t)}e=e.sibling}}function E0(e,t){for(;Gt!==null;){var n=Gt;switch(n.tag){case 0:case 11:case 15:Fa(8,n,t);break;case 23:case 22:if(n.memoizedState!==null&&n.memoizedState.cachePool!==null){var l=n.memoizedState.cachePool.pool;l!=null&&l.refCount++}break;case 24:ds(n.memoizedState.cache)}if(l=n.child,l!==null)l.return=n,Gt=l;else e:for(n=e;Gt!==null;){l=Gt;var o=l.sibling,d=l.return;if(g0(l),l===n){Gt=null;break e}if(o!==null){o.return=d,Gt=o;break e}Gt=d}}}var Kb={getCacheForType:function(e){var t=Vt(Ct),n=t.data.get(e);return n===void 0&&(n=e(),t.data.set(e,n)),n},cacheSignal:function(){return Vt(Ct).controller.signal}},Wb=typeof WeakMap=="function"?WeakMap:Map,lt=0,ft=null,Ge=null,Ve=0,rt=0,Tn=null,ti=!1,gl=!1,Fd=!1,za=0,kt=0,ni=0,Ui=0,lo=0,Nn=0,bl=0,Es=null,hn=null,eu=!1,so=0,M0=0,ro=1/0,oo=null,ai=null,xt=0,Jn=null,Li=null,ua=0,tu=0,nu=null,A0=null,yl=null,vl=null,wl=null,Ms=0,co=null;function En(){return(lt&2)!==0&&Ve!==0?Ve&-Ve:se.T!==null?mu():zm()}function C0(){if(Nn===0)if((Ve&536870912)===0||He){var e=ar;ar<<=1,(ar&3932160)===0&&(ar=262144),Nn=e}else Nn=536870912;return e=Pt.current,e!==null&&(e.flags|=32),Nn}function xl(e,t){if(t!=null){var n=e.stateNode,l=n.ref;l===null&&(l=n.ref=uh(xa(e.memoizedProps,n))),vl===null&&(vl=[]),vl.push(t.bind(null,l))}}function _n(e,t,n){(e===ft&&(rt===2||rt===9)||e.cancelPendingCommit!==null)&&(jl(e,0),ii(e,Ve,Nn,!1)),Kl(e,n),((lt&2)===0||e!==ft)&&(e===ft&&((lt&2)===0&&(Ui|=n),kt===4&&ii(e,Ve,Nn,!1)),ma(e))}function z0(e,t,n){if((lt&6)!==0)throw Error(r(327));var l=!n&&(t&127)===0&&(t&e.expiredLanes)===0||Zl(e,t),o=l?ey(e,t):iu(e,t,!0),d=l;do{if(o===0){gl&&!l&&ii(e,t,0,!1);break}else{if(n=e.current.alternate,d&&!Jb(n)){o=iu(e,t,!1),d=!1;continue}if(o===2){if(d=t,e.errorRecoveryDisabledLanes&d)var p=0;else p=e.pendingLanes&-536870913,p=p!==0?p:p&536870912?536870912:0;if(p!==0){t=p;e:{var g=e;o=Es;var j=g.current.memoizedState.isDehydrated;if(j&&(jl(g,p).flags|=256),p=iu(g,p,!1),p!==2&&p!==6){if(Fd&&!j){g.errorRecoveryDisabledLanes|=d,Ui|=d,o=4;break e}d=hn,hn=o,d!==null&&(hn===null?hn=d:hn.push.apply(hn,d))}o=p}if(d=!1,o!==2)continue}}if(o===1){jl(e,0),ii(e,t,0,!0);break}e:{switch(l=e,d=o,d){case 0:case 1:throw Error(r(345));case 4:if((t&4194048)!==t&&(t&62914560)!==t)break;case 6:ii(l,t,Nn,!ti);break e;case 2:hn=null;break;case 3:case 5:break;default:throw Error(r(329))}if((t&62914560)===t&&(o=so+300-yn(),10<o)){if(ii(l,t,Nn,!ti),lr(l,0,!0)!==0)break e;ua=t,l.timeoutHandle=ju($0.bind(null,l,n,hn,oo,eu,t,Nn,Ui,bl,ti,d,"Throttled",-0,0),o);break e}$0(l,n,hn,oo,eu,t,Nn,Ui,bl,ti,d,null,-0,0)}}break}while(!0);ma(e)}function $0(e,t,n,l,o,d,p,g,j,M,O,Y,T,$){e.timeoutHandle=-1;var W=t.subtreeFlags,re=(d&335544064)===d;if(Y=null,(re||W&8192||(W&16785408)===16785408)&&(Y={stylesheets:null,count:0,imgCount:0,imgBytes:0,suspenseyImages:[],waitingForImages:!0,waitingForViewTransition:!1,unsuspend:na},Sn=null,S0(t,d,Y),re&&(W=Y,re=e.containerInfo,re=(re.nodeType===9?re:re.ownerDocument).__reactViewTransition,re!=null&&(W.count++,W.waitingForViewTransition=!0,W=Ds.bind(W),re.finished.then(W,W))),W=(d&62914560)===d?so-yn():(d&4194048)===d?M0-yn():0,W=nv(Y,W),W!==null)){ua=d,e.cancelPendingCommit=W(Y0.bind(null,e,t,d,n,l,o,p,g,j,M,O,Y,null,T,$)),ii(e,d,p,!M);return}Y0(e,t,d,n,l,o,p,g,j,M,O,Y)}function Jb(e){for(var t=e;;){var n=t.tag;if((n===0||n===11||n===15)&&t.flags&16384&&(n=t.updateQueue,n!==null&&(n=n.stores,n!==null)))for(var l=0;l<n.length;l++){var o=n[l],d=o.getSnapshot;o=o.value;try{if(!jn(d(),o))return!1}catch{return!1}}if(n=t.child,t.subtreeFlags&16384&&n!==null)n.return=t,t=n;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function ii(e,t,n,l){t=Nm(e,t),t&=~lo,t&=~Ui,e.suspendedLanes|=t,e.pingedLanes&=~t,l&&(e.warmLanes|=t),l=e.expirationTimes;for(var o=t;0<o;){var d=31-wn(o),p=1<<d;l[d]=-1,o&=~p}n!==0&&Mm(e,n,t)}function uo(){return(lt&6)===0?(As(0),!1):!0}function au(){if(Ge!==null){if(rt===0)var e=Ge.return;else e=Ge,Ta=Ti=null,ud(e),cl=null,fs=0,e=Ge;for(;e!==null;)n0(e.alternate,e),e=e.return;Ge=null}}function jl(e,t){var n=e.timeoutHandle;return n!==-1&&(e.timeoutHandle=-1,xy(n)),n=e.cancelPendingCommit,n!==null&&(e.cancelPendingCommit=null,n()),ua=0,au(),ft=e,Ge=n=ka(e.current,null),Ve=t,rt=0,Tn=null,ti=!1,gl=Zl(e,t),Fd=!1,bl=Nn=lo=Ui=ni=kt=0,hn=Es=null,eu=!1,za=Nm(e,t),br(),n}function O0(e,t){Oe=null,se.H=Gr,t===ol||t===Mr?(t=Yf(),rt=3):t===Jc?(t=Yf(),rt=4):rt=t===Td?8:t!==null&&typeof t=="object"&&typeof t.then=="function"?6:1,Tn=t,Ge===null&&(kt=1,Ir(e,Un(t,e.current)))}function R0(){var e=Pt.current;return e===null?!0:(Ve&4194048)===Ve?en===null:(Ve&62914560)===Ve||(Ve&536870912)!==0?e===en:!1}function q0(){var e=se.H;return se.H=Gr,e===null?Gr:e}function D0(){var e=se.A;return se.A=Kb,e}function mo(){kt=4,ti||(Ve&4194048)!==Ve&&Pt.current!==null||(gl=!0),(ni&134217727)===0&&(Ui&134217727)===0||ft===null||ii(ft,Ve,Nn,!1)}function iu(e,t,n){var l=lt;lt|=2;var o=q0(),d=D0();(ft!==e||Ve!==t)&&(oo=null,jl(e,t)),t=!1;var p=kt;e:do try{if(rt!==0&&Ge!==null){var g=Ge,j=Tn;switch(rt){case 8:au(),p=6;break e;case 3:case 2:case 9:case 6:Pt.current===null&&(t=!0);var M=rt;if(rt=0,Tn=null,kl(e,g,j,M),n&&gl){p=0;break e}break;default:M=rt,rt=0,Tn=null,kl(e,g,j,M)}}Fb(),p=kt;break}catch(O){O0(e,O)}while(!0);return t&&e.shellSuspendCounter++,Ta=Ti=null,lt=l,se.H=o,se.A=d,Ge===null&&(ft=null,Ve=0,br()),p}function Fb(){for(;Ge!==null;)U0(Ge)}function ey(e,t){var n=lt;lt|=2;var l=q0(),o=D0();ft!==e||Ve!==t?(oo=null,ro=yn()+500,jl(e,t)):gl=Zl(e,t);e:do try{if(rt!==0&&Ge!==null){t=Ge;var d=Tn;t:switch(rt){case 1:rt=0,Tn=null,kl(e,t,d,1);break;case 2:case 9:if(Lf(d)){rt=0,Tn=null,L0(t);break}t=function(){rt!==2&&rt!==9||ft!==e||(rt=7),ma(e)},d.then(t,t);break e;case 3:rt=7;break e;case 4:rt=5;break e;case 7:Lf(d)?(rt=0,Tn=null,L0(t)):(rt=0,Tn=null,kl(e,t,d,7));break;case 5:var p=null;switch(Ge.tag){case 26:p=Ge.memoizedState;case 5:case 27:var g=Ge;if(p?Ah(p):g.stateNode.complete){rt=0,Tn=null;var j=g.sibling;if(j!==null)Ge=j;else{var M=g.return;M!==null?(Ge=M,fo(M)):Ge=null}break t}}rt=0,Tn=null,kl(e,t,d,5);break;case 6:rt=0,Tn=null,kl(e,t,d,6);break;case 8:au(),kt=6;break e;default:throw Error(r(462))}}ty();break}catch(O){O0(e,O)}while(!0);return Ta=Ti=null,se.H=l,se.A=o,lt=n,Ge!==null?0:(ft=null,Ve=0,br(),kt)}function ty(){for(;Ge!==null&&!bg();)U0(Ge)}function U0(e){var t=e0(e.alternate,e,za);e.memoizedProps=e.pendingProps,t===null?fo(e):Ge=t}function L0(e){var t=e,n=t.alternate;switch(t.tag){case 15:case 0:t=Pp(n,t,t.pendingProps,t.type,void 0,Ve);break;case 11:t=Pp(n,t,t.pendingProps,t.type.render,t.ref,Ve);break;case 5:ud(t);var l=t;l===Yt&&(He?(kr(l),l.tag===5&&l.stateNode!=null&&(ht=l.stateNode)):(kr(l),He=!0));default:n0(n,t),t=Ge=Ef(t,za),t=e0(n,t,za)}e.memoizedProps=e.pendingProps,t===null?fo(e):Ge=t}function kl(e,t,n,l){Ta=Ti=null,ud(t),cl=null,fs=0;var o=t.return;try{if(Bb(e,o,t,n,Ve)){kt=1,Ir(e,Un(n,e.current)),Ge=null;return}}catch(d){if(o!==null)throw Ge=o,d;kt=1,Ir(e,Un(n,e.current)),Ge=null;return}t.flags&32768?(He||l===1?e=!0:gl||(Ve&536870912)!==0?e=!1:(ti=e=!0,(l===2||l===9||l===3||l===6)&&(l=Pt.current,l!==null&&l.tag===13&&(l.flags|=16384))),H0(t,e)):fo(t)}function fo(e){var t=e;do{if((t.flags&32768)!==0){H0(t,ti);return}e=t.return;var n=Vb(t.alternate,t,za);if(n!==null){Ge=n;return}if(t=t.sibling,t!==null){Ge=t;return}Ge=t=e}while(t!==null);kt===0&&(kt=5)}function H0(e,t){do{var n=Pb(e.alternate,e);if(n!==null){n.flags&=32767,Ge=n;return}if(n=e.return,n!==null&&(n.flags|=32768,n.subtreeFlags=0,n.deletions=null),!t&&(e=e.sibling,e!==null)){Ge=e;return}Ge=e=n}while(e!==null);kt=6,Ge=null}function Y0(e,t,n,l,o,d,p,g,j,M,O,Y){e.cancelPendingCommit=null;do po();while(xt!==0);if((lt&6)!==0)throw Error(r(327));if(t!==null){if(t===e.current)throw Error(r(177));e===ft&&(Ge=ft=null,Ve=0),Li=t,Jn=e,ua=n,nu=o,A0=l,ny(e,t,n,p,g,j,Y)}}function ny(e,t,n,l,o,d,p){var g=t.lanes|t.childLanes;if(tu=g,g|=Lc,Eg(e,n,g,l,o,d),vl=null,(n&335544064)===n?(wl=Ab(e),l=10262):(wl=null,l=10256),(t.subtreeFlags&l)!==0||(t.flags&l)!==0?(e.callbackNode=null,e.callbackPriority=0,oy(tr,function(){return ou(),null})):(e.callbackNode=null,e.callbackPriority=0),Jr=!1,l=(t.flags&13878)!==0,(t.subtreeFlags&13878)!==0||l){l=se.T,se.T=null,o=Te.p,Te.p=2,d=lt,lt|=4;try{Qb(e,t,n)}finally{lt=d,Te.p=o,se.T=l}}xt=1,Jr?yl=Ey(p,e.containerInfo,wl,lu,su,iy,ru,ou,ay):(lu(),su(),ru())}function ay(e){if(xt!==0){var t=Jn.onRecoverableError;t(e,{componentStack:null})}}function iy(){xt===3&&(xt=0,j0(Li,Jn),xt=4)}function lu(){if(xt===1){xt=0;var e=Jn,t=Li,n=ua,l=(t.flags&13878)!==0;if((t.subtreeFlags&13878)!==0||l){l=se.T,se.T=null;var o=Te.p;Te.p=2;var d=lt;lt|=4;try{Ss=to=!1,w0(t,e,n),n=vu;var p=bf(e.containerInfo),g=n.focusedElem,j=n.selectionRange;if(p!==g&&g&&g.ownerDocument&&gf(g.ownerDocument.documentElement,g)){if(j!==null&&Oc(g)){var M=j.start,O=j.end;if(O===void 0&&(O=M),"selectionStart"in g)g.selectionStart=M,g.selectionEnd=Math.min(O,g.value.length);else{var Y=g.ownerDocument||document,T=Y&&Y.defaultView||window;if(T.getSelection){var $=T.getSelection(),W=g.textContent.length,re=Math.min(j.start,W),Re=j.end===void 0?re:Math.min(j.end,W);!$.extend&&re>Re&&(p=Re,Re=re,re=p);var E=_f(g,re),k=_f(g,Re);if(E&&k&&($.rangeCount!==1||$.anchorNode!==E.node||$.anchorOffset!==E.offset||$.focusNode!==k.node||$.focusOffset!==k.offset)){var C=Y.createRange();C.setStart(E.node,E.offset),$.removeAllRanges(),re>Re?($.addRange(C),$.extend(k.node,k.offset)):(C.setEnd(k.node,k.offset),$.addRange(C))}}}}for(Y=[],$=g;$=$.parentNode;)$.nodeType===1&&Y.push({element:$,left:$.scrollLeft,top:$.scrollTop});for(typeof g.focus=="function"&&g.focus(),g=0;g<Y.length;g++){var H=Y[g];H.element.scrollLeft=H.left,H.element.scrollTop=H.top}}zl=!!yu,vu=yu=null}finally{lt=d,Te.p=o,se.T=l}}e.current=t,xt=2}}function su(){if(xt===2){xt=0;var e=Jn,t=Li,n=(t.flags&8772)!==0;if((t.subtreeFlags&8772)!==0||n){n=se.T,se.T=null;var l=Te.p;Te.p=2;var o=lt;lt|=4;try{h0(e,t.alternate,t)}finally{lt=o,Te.p=l,se.T=n}}xt=3}}function ru(){if(xt===4||xt===3){xt=0;var e=yl;yl=null,yg();var t=Jn,n=Li,l=ua,o=A0,d=(l&335544064)===l?10262:10256;if((n.subtreeFlags&d)!==0||(n.flags&d)!==0?xt=5:(xt=0,Li=Jn=null,B0(t,t.pendingLanes)),d=t.pendingLanes,d===0&&(ai=null),_c(l),n=n.stateNode,vn&&typeof vn.onCommitFiberRoot=="function")try{vn.onCommitFiberRoot(Ql,n,void 0,(n.current.flags&128)===128)}catch{}if(o!==null){n=se.T,d=Te.p,Te.p=2,se.T=null;try{for(var p=t.onRecoverableError,g=0;g<o.length;g++){var j=o[g];p(j.value,{componentStack:j.stack})}}finally{se.T=n,Te.p=d}}if(o=vl,p=wl,wl=null,o!==null&&(vl=null,p===null&&(p=[]),e!==null))for(j=0;j<o.length;j++)n=(0,o[j])(p),n!==void 0&&e.finished.finally(n);(ua&3)!==0&&po(),ma(t),d=t.pendingLanes,(l&261930)!==0&&(d&42)!==0?t===co?Ms++:(Ms=0,co=t):(Ms=0,co=null),As(0)}}function B0(e,t){(e.pooledCacheLanes&=t)===0&&(t=e.pooledCache,t!=null&&(e.pooledCache=null,ds(t)))}function po(){return yl!==null&&(yl.skipTransition(),yl=null),lu(),su(),ru(),ou()}function ou(){if(xt!==5)return!1;var e=Jn,t=tu;tu=0;var n=_c(ua),l=se.T,o=Te.p;try{Te.p=32>n?32:n,se.T=null,n=nu,nu=null;var d=Jn,p=ua;if(xt=0,Li=Jn=null,ua=0,(lt&6)!==0)throw Error(r(331));var g=lt;if(lt|=4,N0(d.current),k0(d,d.current,p,n),lt=g,As(0,!1),vn&&typeof vn.onPostCommitFiberRoot=="function")try{vn.onPostCommitFiberRoot(Ql,d)}catch{}return!0}finally{Te.p=o,se.T=l,B0(e,t)}}function G0(e,t,n){t=Un(n,t),t=Sd(e.stateNode,t,2),e=Za(e,t,2),e!==null&&(Kl(e,2),ma(e))}function ot(e,t,n){if(e.tag===3)G0(e,e,n);else for(;t!==null;){if(t.tag===3){G0(t,e,n);break}else if(t.tag===1){var l=t.stateNode;if(typeof t.type.getDerivedStateFromError=="function"||typeof l.componentDidCatch=="function"&&(ai===null||!ai.has(l))){e=Un(n,e),n=Lp(2),l=Za(t,n,2),l!==null&&(Hp(n,l,t,e),Kl(l,2),ma(l));break}}t=t.return}}function cu(e,t,n){var l=e.pingCache;if(l===null){l=e.pingCache=new Wb;var o=new Set;l.set(t,o)}else o=l.get(t),o===void 0&&(o=new Set,l.set(t,o));o.has(n)||(Fd=!0,o.add(n),e=ly.bind(null,e,t,n),t.then(e,e))}function ly(e,t,n){var l=e.pingCache;l!==null&&l.delete(t),e.pingedLanes|=e.suspendedLanes&n,e.warmLanes&=~n,ft===e&&(Ve&n)===n&&((kt===4||kt===3&&(Ve&62914560)===Ve&&300>yn()-so)&&(lt&2)===0?jl(e,0):lo|=n,bl===Ve&&(bl=0)),ma(e)}function I0(e,t){t===0&&(t=Em()),e=ji(e,t),e!==null&&(Kl(e,t),ma(e))}function sy(e){var t=e.memoizedState,n=0;t!==null&&(n=t.retryLane),I0(e,n)}function ry(e,t){var n=0;switch(e.tag){case 31:case 13:var l=e.stateNode,o=e.memoizedState;o!==null&&(n=o.retryLane);break;case 19:l=e.stateNode;break;case 22:l=e.stateNode._retryCache;break;default:throw Error(r(314))}l!==null&&l.delete(t),I0(e,n)}function oy(e,t){return mc(e,t)}var Sl=null,Tl=null,du=!1,ho=!1,uu=!1,li=0;function ma(e){e!==Tl&&e.next===null&&(Tl===null?Sl=Tl=e:Tl=Tl.next=e),ho=!0,du||(du=!0,dy())}function As(e,t){if(!uu&&ho){uu=!0;do for(var n=!1,l=Sl;l!==null;){if(e!==0){var o=l.pendingLanes;if(o===0)var d=0;else{var p=l.suspendedLanes,g=l.pingedLanes;d=(1<<31-wn(42|e)+1)-1,d&=o&~(p&~g),d=d&201326741?d&201326741|1:d?d|2:0}d!==0&&(n=!0,Q0(l,d))}else d=Ve,d=lr(l,l===ft?d:0,l.cancelPendingCommit!==null||l.timeoutHandle!==-1),(d&3)===0||Zl(l,d)||(n=!0,Q0(l,d));l=l.next}while(n);uu=!1}}function cy(){X0()}function X0(){ho=du=!1;var e=0;li!==0&&wy()&&(e=li);for(var t=yn(),n=null,l=Sl;l!==null;){var o=l.next,d=V0(l,t);d===0?(l.next=null,n===null?Sl=o:n.next=o,o===null&&(Tl=n)):(n=l,(e!==0||(d&3)!==0)&&(ho=!0)),l=o}xt!==0&&xt!==5||As(e),li!==0&&(li=0)}function V0(e,t){for(var n=e.suspendedLanes,l=e.pingedLanes,o=e.expirationTimes,d=e.pendingLanes&-62914561;0<d;){var p=31-wn(d),g=1<<p,j=o[p];j===-1?((g&n)===0||(g&l)!==0)&&(o[p]=Ng(g,t)):j<=t&&(e.expiredLanes|=g),d&=~g}if(t=ft,n=Ve,n=lr(e,e===t?n:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),l=e.callbackNode,n===0||e===t&&(rt===2||rt===9)||e.cancelPendingCommit!==null)return l!==null&&l!==null&&fc(l),e.callbackNode=null,e.callbackPriority=0;if((n&3)===0||Zl(e,n)){if(t=n&-n,t===e.callbackPriority)return t;switch(l!==null&&fc(l),_c(n)){case 2:case 8:n=Sm;break;case 32:n=tr;break;case 268435456:n=Tm;break;default:n=tr}return l=P0.bind(null,e),n=mc(n,l),e.callbackPriority=t,e.callbackNode=n,t}return l!==null&&l!==null&&fc(l),e.callbackPriority=2,e.callbackNode=null,2}function P0(e,t){if(xt!==0&&xt!==5)return e.callbackNode=null,e.callbackPriority=0,null;var n=e.callbackNode;if(po()&&e.callbackNode!==n)return null;var l=Ve;return l=lr(e,e===ft?l:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),l===0?null:(z0(e,l,t),V0(e,yn()),e.callbackNode!=null&&e.callbackNode===n?P0.bind(null,e):null)}function Q0(e,t){if(po())return null;z0(e,t,!0)}function dy(){jy(function(){(lt&6)!==0?mc(km,cy):X0()})}function mu(){if(li===0){var e=Mi;e===0&&(e=nr,nr<<=1,(nr&261888)===0&&(nr=256)),li=e}return li}function Z0(e){return e==null||typeof e=="symbol"||typeof e=="boolean"?null:typeof e=="function"?e:dr(e)}function uy(e,t,n,l,o){if(t==="submit"&&n&&n.stateNode===o){var d=Z0((o[un]||null).action),p=l.submitter;p&&(t=(t=p[un]||null)?Z0(t.formAction):p.getAttribute("formAction"),t!==null&&(d=t,p=null));var g=new pr("action","action",null,l,o);e.push({event:g,listeners:[{instance:null,listener:function(){if(l.defaultPrevented){if(li!==0){var j=new FormData(o,p);vd(n,{pending:!0,data:j,method:o.method,action:d},null,j)}}else typeof d=="function"&&(g.preventDefault(),j=new FormData(o,p),vd(n,{pending:!0,data:j,method:o.method,action:d},d,j))},currentTarget:o}]})}}for(var fu=0;fu<Uc.length;fu++){var pu=Uc[fu],my=pu.toLowerCase(),fy=pu[0].toUpperCase()+pu.slice(1);Qn(my,"on"+fy)}Qn(wf,"onAnimationEnd"),Qn(xf,"onAnimationIteration"),Qn(jf,"onAnimationStart"),Qn("dblclick","onDoubleClick"),Qn("focusin","onFocus"),Qn("focusout","onBlur"),Qn(xb,"onTransitionRun"),Qn(jb,"onTransitionStart"),Qn(kb,"onTransitionCancel"),Qn(kf,"onTransitionEnd"),Qi("onMouseEnter",["mouseout","mouseover"]),Qi("onMouseLeave",["mouseout","mouseover"]),Qi("onPointerEnter",["pointerout","pointerover"]),Qi("onPointerLeave",["pointerout","pointerover"]),vi("onChange","change click focusin focusout input keydown keyup selectionchange".split(" ")),vi("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),vi("onBeforeInput",["compositionend","keypress","textInput","paste"]),vi("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" ")),vi("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" ")),vi("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var Cs="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),py=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Cs));function K0(e,t){t=(t&4)!==0;for(var n=0;n<e.length;n++){var l=e[n],o=l.event;l=l.listeners;e:{var d=void 0;if(t)for(var p=l.length-1;0<=p;p--){var g=l[p],j=g.instance,M=g.currentTarget;if(g=g.listener,j!==d&&o.isPropagationStopped())break e;d=g,o.currentTarget=M;try{d(o)}catch(O){gr(O)}o.currentTarget=null,d=j}else for(p=0;p<l.length;p++){if(g=l[p],j=g.instance,M=g.currentTarget,g=g.listener,j!==d&&o.isPropagationStopped())break e;d=g,o.currentTarget=M;try{d(o)}catch(O){gr(O)}o.currentTarget=null,d=j}}}}function Ie(e,t){var n=t[Om];n===void 0&&(n=t[Om]=new Set);var l=e+"__bubble";n.has(l)||(W0(t,e,2,!1),n.add(l))}function hu(e,t,n){var l=0;t&&(l|=4),W0(n,e,l,t)}var _o="_reactListening"+Math.random().toString(36).slice(2);function _u(e){if(!e[_o]){e[_o]=!0,Dm.forEach(function(n){n!=="selectionchange"&&(py.has(n)||hu(n,!1,e),hu(n,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[_o]||(t[_o]=!0,hu("selectionchange",!1,t))}}function W0(e,t,n,l){switch(Hh(t)){case 2:var o=sv;break;case 8:o=rv;break;default:o=qu}n=o.bind(null,t,n,e),o=void 0,!kc||t!=="touchstart"&&t!=="touchmove"&&t!=="wheel"||(o=!0),l?o!==void 0?e.addEventListener(t,n,{capture:!0,passive:o}):e.addEventListener(t,n,!0):o!==void 0?e.addEventListener(t,n,{passive:o}):e.addEventListener(t,n,!1)}function gu(e,t,n,l,o){var d=l;if((t&1)===0&&(t&2)===0&&l!==null)e:for(;;){if(l===null)return;var p=l.tag;if(p===3||p===4){var g=l.stateNode.containerInfo;if(g===o)break;if(p===4)for(p=l.return;p!==null;){var j=p.tag;if((j===3||j===4)&&p.stateNode.containerInfo===o)return;p=p.return}for(;g!==null;){if(p=yi(g),p===null)return;if(j=p.tag,j===5||j===6||j===26||j===27){l=d=p;continue e}g=g.parentNode}}l=l.return}Km(function(){var M=d,O=xc(n),Y=[];e:{var T=Sf.get(e);if(T!==void 0){var $=pr,W=e;switch(e){case"keypress":if(mr(n)===0)break e;case"keydown":case"keyup":$=Jg;break;case"focusin":W="focus",$=Ec;break;case"focusout":W="blur",$=Ec;break;case"beforeblur":case"afterblur":$=Ec;break;case"click":if(n.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":$=Fm;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":$=Hg;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":$=ab;break;case wf:case xf:case jf:$=Gg;break;case kf:$=lb;break;case"scroll":case"scrollend":$=Ug;break;case"wheel":$=rb;break;case"copy":case"cut":case"paste":$=Xg;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":$=tf;break;case"submit":$=tb;break;case"toggle":case"beforetoggle":$=cb}var re=(t&4)!==0,Re=!re&&(e==="scroll"||e==="scrollend"),E=re?T!==null?T+"Capture":null:T;re=[];for(var k=M,C;k!==null;){var H=k;if(C=H.stateNode,H=H.tag,H!==5&&H!==26&&H!==27||C===null||E===null||(H=Fl(k,E),H!=null&&re.push(zs(k,H,C))),Re)break;k=k.return}0<re.length&&(T=new $(T,W,null,n,O),Y.push({event:T,listeners:re}))}}if((t&7)===0){e:{if($=e==="mouseover"||e==="pointerover",T=e==="mouseout"||e==="pointerout",$&&n!==wc&&(W=n.relatedTarget||n.fromElement)&&(yi(W)||W[Xi]))break e;(T||$)&&(W=O.window===O?O:($=O.ownerDocument)?$.defaultView||$.parentWindow:window,T?($=n.relatedTarget||n.toElement,T=M,$=$?yi($):null,$!==null&&(Re=u($),re=$.tag,$!==Re||re!==5&&re!==27&&re!==6)&&($=null)):(T=null,$=M),T!==$&&(re=Fm,H="onMouseLeave",E="onMouseEnter",k="mouse",(e==="pointerout"||e==="pointerover")&&(re=tf,H="onPointerLeave",E="onPointerEnter",k="pointer"),Re=T==null?W:Jl(T),C=$==null?W:Jl($),W=new re(H,k+"leave",T,n,O),W.target=Re,W.relatedTarget=C,H=null,yi(O)===M&&(re=new re(E,k+"enter",$,n,O),re.target=C,re.relatedTarget=Re,H=re),Re=H,re=T&&$?ke(T,$,hy):null,T!==null&&J0(Y,W,T,re,!1),$!==null&&Re!==null&&J0(Y,Re,$,re,!0)))}e:{if(T=M?Jl(M):window,$=T.nodeName&&T.nodeName.toLowerCase(),$==="select"||$==="input"&&T.type==="file")var ae=df;else if(of(T))if(uf)ae=yb;else{ae=gb;var Pe=_b}else $=T.nodeName,!$||$.toLowerCase()!=="input"||T.type!=="checkbox"&&T.type!=="radio"?M&&vc(M.elementType)&&(ae=df):ae=bb;if(ae&&(ae=ae(e,M))){cf(Y,ae,n,O);break e}Pe&&Pe(e,T,M)}switch(Pe=M?Jl(M):window,e){case"focusin":(of(Pe)||Pe.contentEditable==="true")&&(el=Pe,Rc=M,rs=null);break;case"focusout":rs=Rc=el=null;break;case"mousedown":qc=!0;break;case"contextmenu":case"mouseup":case"dragend":qc=!1,yf(Y,n,O);break;case"selectionchange":if(wb)break;case"keydown":case"keyup":yf(Y,n,O)}var he;if(Ac)e:{switch(e){case"compositionstart":var Se="onCompositionStart";break e;case"compositionend":Se="onCompositionEnd";break e;case"compositionupdate":Se="onCompositionUpdate";break e}Se=void 0}else Fi?sf(e,n)&&(Se="onCompositionEnd"):e==="keydown"&&n.keyCode===229&&(Se="onCompositionStart");Se&&(nf&&n.locale!=="ko"&&(Fi||Se!=="onCompositionStart"?Se==="onCompositionEnd"&&Fi&&(he=Wm()):(Ha=O,Sc="value"in Ha?Ha.value:Ha.textContent,Fi=!0)),Pe=go(M,Se),0<Pe.length&&(Se=new ef(Se,e,null,n,O),Y.push({event:Se,listeners:Pe}),he?Se.data=he:(he=rf(n),he!==null&&(Se.data=he)))),(he=ub?mb(e,n):fb(e,n))&&(Se=go(M,"onBeforeInput"),0<Se.length&&(Pe=new ef("onBeforeInput","beforeinput",null,n,O),Y.push({event:Pe,listeners:Se}),Pe.data=he)),uy(Y,e,M,n,O)}K0(Y,t)})}function zs(e,t,n){return{instance:e,listener:t,currentTarget:n}}function go(e,t){for(var n=t+"Capture",l=[];e!==null;){var o=e,d=o.stateNode;if(o=o.tag,o!==5&&o!==26&&o!==27||d===null||(o=Fl(e,n),o!=null&&l.unshift(zs(e,o,d)),o=Fl(e,t),o!=null&&l.push(zs(e,o,d))),e.tag===3)return l;e=e.return}return[]}function hy(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5&&e.tag!==27);return e||null}function J0(e,t,n,l,o){for(var d=t._reactName,p=[];n!==null&&n!==l;){var g=n,j=g.alternate,M=g.stateNode;if(g=g.tag,j!==null&&j===l)break;g!==5&&g!==26&&g!==27||M===null||(j=M,o?(M=Fl(n,d),M!=null&&p.unshift(zs(n,M,j))):o||(M=Fl(n,d),M!=null&&p.push(zs(n,M,j)))),n=n.return}p.length!==0&&e.push({event:t,listeners:p})}var _y=/\r\n?/g,gy=/\u0000|\uFFFD/g;function F0(e){return(typeof e=="string"?e:""+e).replace(_y,`
`).replace(gy,"")}function eh(e,t){return t=F0(t),F0(e)===t}function ct(e,t,n,l,o,d){switch(n){case"children":if(typeof l=="string")t==="body"||t==="textarea"&&l===""||Ki(e,l);else if(typeof l=="number"||typeof l=="bigint")t!=="body"&&Ki(e,""+l);else return;break;case"className":cr(e,"class",l);break;case"tabIndex":cr(e,"tabindex",l);break;case"dir":case"role":case"viewBox":case"width":case"height":cr(e,n,l);break;case"style":Qm(e,l,d);return;case"data":if(t!=="object"){cr(e,"data",l);break}case"src":case"href":if(l===""&&(t!=="a"||n!=="href")){e.removeAttribute(n);break}if(l==null||typeof l=="function"||typeof l=="symbol"||typeof l=="boolean"){e.removeAttribute(n);break}l=dr(l),e.setAttribute(n,l);break;case"action":case"formAction":if(typeof l=="function"){e.setAttribute(n,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof d=="function"&&(n==="formAction"?(t!=="input"&&ct(e,t,"name",o.name,o,null),ct(e,t,"formEncType",o.formEncType,o,null),ct(e,t,"formMethod",o.formMethod,o,null),ct(e,t,"formTarget",o.formTarget,o,null)):(ct(e,t,"encType",o.encType,o,null),ct(e,t,"method",o.method,o,null),ct(e,t,"target",o.target,o,null)));if(l==null||typeof l=="symbol"||typeof l=="boolean"){e.removeAttribute(n);break}l=dr(l),e.setAttribute(n,l);break;case"onClick":l!=null&&(e.onclick=na);return;case"onScroll":l!=null&&Ie("scroll",e);return;case"onScrollEnd":l!=null&&Ie("scrollend",e);return;case"dangerouslySetInnerHTML":if(l!=null){if(typeof l!="object"||!("__html"in l))throw Error(r(61));if(n=l.__html,n!=null){if(o.children!=null)throw Error(r(60));d?.__html!==n&&(e.innerHTML=n)}}break;case"multiple":e.multiple=l&&typeof l!="function"&&typeof l!="symbol";break;case"muted":e.muted=l&&typeof l!="function"&&typeof l!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(l==null||typeof l=="function"||typeof l=="boolean"||typeof l=="symbol"){e.removeAttribute("xlink:href");break}n=dr(l),e.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",n);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":l!=null&&typeof l!="function"&&typeof l!="symbol"?e.setAttribute(n,l):e.removeAttribute(n);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"credentialless":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":l&&typeof l!="function"&&typeof l!="symbol"?e.setAttribute(n,""):e.removeAttribute(n);break;case"capture":case"download":l===!0?e.setAttribute(n,""):l!==!1&&l!=null&&typeof l!="function"&&typeof l!="symbol"?e.setAttribute(n,l):e.removeAttribute(n);break;case"cols":case"rows":case"size":case"span":l!=null&&typeof l!="function"&&typeof l!="symbol"&&!isNaN(l)&&1<=l?e.setAttribute(n,l):e.removeAttribute(n);break;case"rowSpan":case"start":l==null||typeof l=="function"||typeof l=="symbol"||isNaN(l)?e.removeAttribute(n):e.setAttribute(n,l);break;case"popover":Ie("beforetoggle",e),Ie("toggle",e),or(e,"popover",l);break;case"xlinkActuate":va(e,"http://www.w3.org/1999/xlink","xlink:actuate",l);break;case"xlinkArcrole":va(e,"http://www.w3.org/1999/xlink","xlink:arcrole",l);break;case"xlinkRole":va(e,"http://www.w3.org/1999/xlink","xlink:role",l);break;case"xlinkShow":va(e,"http://www.w3.org/1999/xlink","xlink:show",l);break;case"xlinkTitle":va(e,"http://www.w3.org/1999/xlink","xlink:title",l);break;case"xlinkType":va(e,"http://www.w3.org/1999/xlink","xlink:type",l);break;case"xmlBase":va(e,"http://www.w3.org/XML/1998/namespace","xml:base",l);break;case"xmlLang":va(e,"http://www.w3.org/XML/1998/namespace","xml:lang",l);break;case"xmlSpace":va(e,"http://www.w3.org/XML/1998/namespace","xml:space",l);break;case"is":or(e,"is",l);break;case"innerText":case"textContent":return;default:if(!(2<n.length)||n[0]!=="o"&&n[0]!=="O"||n[1]!=="n"&&n[1]!=="N")n=qg.get(n)||n,or(e,n,l);else return}at=!0}function bu(e,t,n,l,o,d){switch(n){case"style":Qm(e,l,d);return;case"dangerouslySetInnerHTML":if(l!=null){if(typeof l!="object"||!("__html"in l))throw Error(r(61));if(n=l.__html,n!=null){if(o.children!=null)throw Error(r(60));d?.__html!==n&&(e.innerHTML=n)}}break;case"children":if(typeof l=="string")Ki(e,l);else if(typeof l=="number"||typeof l=="bigint")Ki(e,""+l);else return;break;case"onScroll":l!=null&&Ie("scroll",e);return;case"onScrollEnd":l!=null&&Ie("scrollend",e);return;case"onClick":l!=null&&(e.onclick=na);return;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":return;case"innerText":case"textContent":return;default:if(!Um.hasOwnProperty(n))e:{if(n[0]==="o"&&n[1]==="n"&&(o=n.endsWith("Capture"),d=n.slice(2,o?n.length-7:void 0),t=e[un]||null,t=t!=null?t[n]:null,typeof t=="function"&&e.removeEventListener(d,t,o),typeof l=="function")){typeof t!="function"&&t!==null&&(n in e?e[n]=null:e.hasAttribute(n)&&e.removeAttribute(n)),e.addEventListener(d,l,o);break e}at=!0,n in e?e[n]=l:l===!0?e.setAttribute(n,""):or(e,n,l)}return}at=!0}function Kt(e,t,n){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":Ie("error",e),Ie("load",e);var l=!1,o=!1,d;for(d in n)if(n.hasOwnProperty(d)){var p=n[d];if(p!=null)switch(d){case"src":l=!0;break;case"srcSet":o=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error(r(137,t));default:ct(e,t,d,p,n,null)}}o&&ct(e,t,"srcSet",n.srcSet,n,null),l&&ct(e,t,"src",n.src,n,null);return;case"input":Ie("invalid",e);var g=d=p=o=null,j=null,M=null;for(l in n)if(n.hasOwnProperty(l)){var O=n[l];if(O!=null)switch(l){case"name":o=O;break;case"type":p=O;break;case"checked":j=O;break;case"defaultChecked":M=O;break;case"value":d=O;break;case"defaultValue":g=O;break;case"children":case"dangerouslySetInnerHTML":if(O!=null)throw Error(r(137,t));break;default:ct(e,t,l,O,n,null)}}Im(e,d,g,j,M,p,o,!1);return;case"select":Ie("invalid",e),l=p=d=null;for(o in n)if(n.hasOwnProperty(o)&&(g=n[o],g!=null))switch(o){case"value":d=g;break;case"defaultValue":p=g;break;case"multiple":l=g;default:ct(e,t,o,g,n,null)}t=d,n=p,e.multiple=!!l,t!=null?Zi(e,!!l,t,!1):n!=null&&Zi(e,!!l,n,!0);return;case"textarea":Ie("invalid",e),d=o=l=null;for(p in n)if(n.hasOwnProperty(p)&&(g=n[p],g!=null))switch(p){case"value":l=g;break;case"defaultValue":o=g;break;case"children":d=g;break;case"dangerouslySetInnerHTML":if(g!=null)throw Error(r(91));break;default:ct(e,t,p,g,n,null)}Vm(e,l,o,d);return;case"option":for(j in n)n.hasOwnProperty(j)&&(l=n[j],l!=null)&&(j==="selected"?e.selected=l&&typeof l!="function"&&typeof l!="symbol":ct(e,t,j,l,n,null));return;case"dialog":Ie("beforetoggle",e),Ie("toggle",e),Ie("cancel",e),Ie("close",e);break;case"iframe":case"object":Ie("load",e);break;case"video":case"audio":for(l=0;l<Cs.length;l++)Ie(Cs[l],e);break;case"image":Ie("error",e),Ie("load",e);break;case"details":Ie("toggle",e);break;case"embed":case"source":case"link":Ie("error",e),Ie("load",e);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for(M in n)if(n.hasOwnProperty(M)&&(l=n[M],l!=null))switch(M){case"children":case"dangerouslySetInnerHTML":throw Error(r(137,t));default:ct(e,t,M,l,n,null)}return;default:if(vc(t)){for(O in n)n.hasOwnProperty(O)&&(l=n[O],l!==void 0&&bu(e,t,O,l,n,void 0));return}}for(g in n)n.hasOwnProperty(g)&&(l=n[g],l!=null&&ct(e,t,g,l,n,null))}var by={};function yy(e,t,n,l){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var o=null,d=null,p=null,g=null,j=null,M=null,O=null;for($ in n){var Y=n[$];if(n.hasOwnProperty($)&&Y!=null)switch($){case"checked":break;case"value":break;case"defaultValue":j=Y;default:l.hasOwnProperty($)||ct(e,t,$,null,l,Y)}}for(var T in l){var $=l[T];if(Y=n[T],l.hasOwnProperty(T)&&($!=null||Y!=null))switch(T){case"type":$!==Y&&(at=!0),d=$;break;case"name":$!==Y&&(at=!0),o=$;break;case"checked":$!==Y&&(at=!0),M=$;break;case"defaultChecked":$!==Y&&(at=!0),O=$;break;case"value":$!==Y&&(at=!0),p=$;break;case"defaultValue":$!==Y&&(at=!0),g=$;break;case"children":case"dangerouslySetInnerHTML":if($!=null)throw Error(r(137,t));break;default:$!==Y&&ct(e,t,T,$,l,Y)}}bc(e,p,g,j,M,O,d,o);return;case"select":$=p=g=T=null;for(d in n)if(j=n[d],n.hasOwnProperty(d)&&j!=null)switch(d){case"value":break;case"multiple":$=j;default:l.hasOwnProperty(d)||ct(e,t,d,null,l,j)}for(o in l)if(d=l[o],j=n[o],l.hasOwnProperty(o)&&(d!=null||j!=null))switch(o){case"value":d!==j&&(at=!0),T=d;break;case"defaultValue":d!==j&&(at=!0),g=d;break;case"multiple":d!==j&&(at=!0),p=d;default:d!==j&&ct(e,t,o,d,l,j)}t=g,n=p,l=$,T!=null?Zi(e,!!n,T,!1):!!l!=!!n&&(t!=null?Zi(e,!!n,t,!0):Zi(e,!!n,n?[]:"",!1));return;case"textarea":$=T=null;for(g in n)if(o=n[g],n.hasOwnProperty(g)&&o!=null&&!l.hasOwnProperty(g))switch(g){case"value":break;case"children":break;default:ct(e,t,g,null,l,o)}for(p in l)if(o=l[p],d=n[p],l.hasOwnProperty(p)&&(o!=null||d!=null))switch(p){case"value":o!==d&&(at=!0),T=o;break;case"defaultValue":o!==d&&(at=!0),$=o;break;case"children":break;case"dangerouslySetInnerHTML":if(o!=null)throw Error(r(91));break;default:o!==d&&ct(e,t,p,o,l,d)}Xm(e,T,$);return;case"option":for(var W in n)T=n[W],n.hasOwnProperty(W)&&T!=null&&!l.hasOwnProperty(W)&&(W==="selected"?e.selected=!1:ct(e,t,W,null,l,T));for(j in l)T=l[j],$=n[j],l.hasOwnProperty(j)&&T!==$&&(T!=null||$!=null)&&(j==="selected"?(T!==$&&(at=!0),e.selected=T&&typeof T!="function"&&typeof T!="symbol"):ct(e,t,j,T,l,$));return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var re in n)T=n[re],n.hasOwnProperty(re)&&T!=null&&!l.hasOwnProperty(re)&&ct(e,t,re,null,l,T);for(M in l)if(T=l[M],$=n[M],l.hasOwnProperty(M)&&T!==$&&(T!=null||$!=null))switch(M){case"children":case"dangerouslySetInnerHTML":if(T!=null)throw Error(r(137,t));break;default:ct(e,t,M,T,l,$)}return;default:if(vc(t)){for(var Re in n)T=n[Re],n.hasOwnProperty(Re)&&T!==void 0&&!l.hasOwnProperty(Re)&&bu(e,t,Re,void 0,l,T);for(O in l)T=l[O],$=n[O],!l.hasOwnProperty(O)||T===$||T===void 0&&$===void 0||bu(e,t,O,T,l,$);return}}for(var E in n)T=n[E],n.hasOwnProperty(E)&&T!=null&&!l.hasOwnProperty(E)&&ct(e,t,E,null,l,T);for(Y in l)T=l[Y],$=n[Y],!l.hasOwnProperty(Y)||T===$||T==null&&$==null||ct(e,t,Y,T,l,$)}function th(e){switch(e){case"css":case"script":case"font":case"img":case"image":case"input":case"link":return!0;default:return!1}}function vy(){if(typeof performance.getEntriesByType=="function"){for(var e=0,t=0,n=performance.getEntriesByType("resource"),l=0;l<n.length;l++){var o=n[l],d=o.transferSize,p=o.initiatorType,g=o.duration;if(d&&g&&th(p)){for(p=0,g=o.responseEnd,l+=1;l<n.length;l++){var j=n[l],M=j.startTime;if(M>g)break;var O=j.transferSize,Y=j.initiatorType;O&&th(Y)&&(j=j.responseEnd,p+=O*(j<g?1:(g-M)/(j-M)))}if(--l,t+=8*(d+p)/(o.duration/1e3),e++,10<e)break}}if(0<e)return t/e/1e6}return navigator.connection&&(e=navigator.connection.downlink,typeof e=="number")?e:5}var yu=null,vu=null;function $s(e){return e.nodeType===9?e:e.ownerDocument}function nh(e){switch(e){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function ah(e,t){if(e===0)switch(t){case"svg":return 1;case"math":return 2;default:return 0}return e===1&&t==="foreignObject"?0:e}function ih(e,t,n,l){return n=$s(n).createElement(e),n[Xt]=l,n[un]=t,Kt(n,e,t),Ht(n),n}function wu(e,t){return e==="textarea"||e==="noscript"||typeof t.children=="string"||typeof t.children=="number"||typeof t.children=="bigint"||typeof t.dangerouslySetInnerHTML=="object"&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var xu=null;function wy(){var e=window.event;return e&&e.type==="popstate"?e===xu?!1:(xu=e,!0):(xu=null,!1)}var ju=typeof setTimeout=="function"?setTimeout:void 0,xy=typeof clearTimeout=="function"?clearTimeout:void 0,lh=typeof Promise=="function"?Promise:void 0,sh=typeof requestAnimationFrame=="function"?requestAnimationFrame:ju,jy=typeof queueMicrotask=="function"?queueMicrotask:typeof lh<"u"?function(e){return lh.resolve(null).then(e).catch(ky)}:ju;function ky(e){setTimeout(function(){throw e})}function si(e){return e==="head"}function rh(e,t){var n=t,l=0;do{var o=n.nextSibling;if(e.removeChild(n),o&&o.nodeType===8)if(n=o.data,n==="/$"||n==="/&"){if(l===0){e.removeChild(o),$l(t);return}l--}else if(n==="$"||n==="$?"||n==="$~"||n==="$!"||n==="&")l++;else if(n==="html")Cu(e.ownerDocument.documentElement);else if(n==="head"){n=e.ownerDocument.head,Cu(n);for(var d=n.firstChild;d;){var p=d.nextSibling,g=d.nodeName;d[Wl]||g==="SCRIPT"||g==="STYLE"||g==="LINK"&&d.rel.toLowerCase()==="stylesheet"||n.removeChild(d),d=p}}else n==="body"&&Cu(e.ownerDocument.body);n=o}while(n);$l(t)}function oh(e,t){var n=e;e=0;do{var l=n.nextSibling;if(n.nodeType===1?t?(n._stashedDisplay=n.style.display,n.style.display="none"):(n.style.display=n._stashedDisplay||"",n.getAttribute("style")===""&&n.removeAttribute("style")):n.nodeType===3&&(t?(n._stashedText=n.nodeValue,n.nodeValue=""):n.nodeValue=n._stashedText||""),l&&l.nodeType===8)if(n=l.data,n==="/$"){if(e===0)break;e--}else n!=="$"&&n!=="$?"&&n!=="$~"&&n!=="$!"||e++;n=l}while(n)}function ch(e,t,n){if(t=CSS.escape(t)!==t?"r-"+btoa(t).replace(/=/g,""):t,e.style.viewTransitionName=t,n!=null&&(e.style.viewTransitionClass=n),n=getComputedStyle(e),n.display==="inline"){if(t=e.getClientRects(),t.length===1)var l=1;else for(var o=l=0;o<t.length;o++){var d=t[o];0<d.width&&0<d.height&&l++}l===1&&(e=e.style,e.display=t.length===1?"inline-block":"block",e.marginTop="-"+n.paddingTop,e.marginBottom="-"+n.paddingBottom)}}function dh(e,t){e=e.style,t=t.style;var n=t!=null?t.hasOwnProperty("viewTransitionName")?t.viewTransitionName:t.hasOwnProperty("view-transition-name")?t["view-transition-name"]:null:null;e.viewTransitionName=n==null||typeof n=="boolean"?"":(""+n).trim(),n=t!=null?t.hasOwnProperty("viewTransitionClass")?t.viewTransitionClass:t.hasOwnProperty("view-transition-class")?t["view-transition-class"]:null:null,e.viewTransitionClass=n==null||typeof n=="boolean"?"":(""+n).trim(),e.display==="inline-block"&&(t==null?e.display=e.margin="":(n=t.display,e.display=n==null||typeof n=="boolean"?"":n,n=t.margin,n!=null?e.margin=n:(n=t.hasOwnProperty("marginTop")?t.marginTop:t["margin-top"],e.marginTop=n==null||typeof n=="boolean"?"":n,t=t.hasOwnProperty("marginBottom")?t.marginBottom:t["margin-bottom"],e.marginBottom=t==null||typeof t=="boolean"?"":t)))}function Sy(e,t,n){return n=n.ownerDocument.defaultView,{rect:e,abs:t.position==="absolute"||t.position==="fixed",clip:t.clipPath!=="none"||t.overflow!=="visible"||t.filter!=="none"||t.mask!=="none"||t.mask!=="none"||t.borderRadius!=="0px",view:0<=e.bottom&&0<=e.right&&e.top<=n.innerHeight&&e.left<=n.innerWidth}}function ku(e){var t=e.getBoundingClientRect(),n=getComputedStyle(e);return Sy(t,n,e)}function Ty(e){return e.documentElement.clientHeight}function Ny(e){this.addEventListener("load",e),this.addEventListener("error",e)}function Ey(e,t,n,l,o,d,p,g,j){var M=t.nodeType===9?t:t.ownerDocument;try{var O=M.startViewTransition({update:function(){var T=M.defaultView,$=T.navigation&&T.navigation.transition,W=M.fonts.status;l();var re=[];if(W==="loaded"&&(Ty(M),M.fonts.status==="loading"&&re.push(M.fonts.ready)),W=re.length,e!==null)for(var Re=e.suspenseyImages,E=0,k=0;k<Re.length;k++){var C=Re[k];if(!C.complete){var H=C.getBoundingClientRect();if(0<H.bottom&&0<H.right&&H.top<T.innerHeight&&H.left<T.innerWidth){if(E+=Ch(C),E>vo){re.length=W;break}C=new Promise(Ny.bind(C)),re.push(C)}}}if(0<re.length)return T=Promise.race([Promise.all(re),new Promise(function(ae){return setTimeout(ae,500)})]).then(o,o),($?Promise.allSettled([$.finished,T]):T).then(d,d);if(o(),$)return $.finished.then(d,d);d()},types:n});M.__reactViewTransition=O;var Y=[];return O.ready.then(function(){for(var T=M.documentElement.getAnimations({subtree:!0}),$=0;$<T.length;$++){var W=T[$],re=W.effect,Re=re.pseudoElement;if(Re!=null&&Re.startsWith("::view-transition")){Y.push(W),W=re.getKeyframes();for(var E=Re=void 0,k=!0,C=0;C<W.length;C++){var H=W[C],ae=H.width;if(Re===void 0)Re=ae;else if(Re!==ae){k=!1;break}if(ae=H.height,E===void 0)E=ae;else if(E!==ae){k=!1;break}delete H.width,delete H.height,H.transform==="none"&&delete H.transform}k&&Re!==void 0&&E!==void 0&&(re.setKeyframes(W),k=getComputedStyle(re.target,re.pseudoElement),k.width!==Re||k.height!==E)&&(k=W[0],k.width=Re,k.height=E,k=W[W.length-1],k.width=Re,k.height=E,re.setKeyframes(W))}}p()},function(T){M.__reactViewTransition===O&&(M.__reactViewTransition=null);try{typeof T=="object"&&T!==null&&T.name==="InvalidStateError"&&(T.message==="View transition was skipped because document visibility state is hidden."||T.message==="Skipping view transition because document visibility state has become hidden."||T.message==="Skipping view transition because viewport size changed."||T.message==="Transition was aborted because of invalid state")&&(T=null),T!==null&&j(T)}finally{l(),o(),p()}}),O.finished.finally(function(){for(var T=0;T<Y.length;T++)Y[T].cancel();M.__reactViewTransition===O&&(M.__reactViewTransition=null),g()}),O}catch{return l(),o(),p(),null}}function Hi(e,t){this._scope=document.documentElement,this._selector="::view-transition-"+e+"("+t+")"}Hi.prototype.animate=function(e,t){return t=typeof t=="number"?{duration:t}:U({},t),t.pseudoElement=this._selector,this._scope.animate(e,t)},Hi.prototype.getAnimations=function(){for(var e=this._scope,t=this._selector,n=e.getAnimations({subtree:!0}),l=[],o=0;o<n.length;o++){var d=n[o].effect;d!==null&&d.target===e&&d.pseudoElement===t&&l.push(n[o])}return l},Hi.prototype.getComputedStyle=function(){return getComputedStyle(this._scope,this._selector)};function uh(e){return{name:e,group:new Hi("group",e),imagePair:new Hi("image-pair",e),old:new Hi("old",e),new:new Hi("new",e)}}function Mn(e){this._fragmentFiber=e,this._observers=this._eventListeners=null}Mn.prototype.addEventListener=function(e,t,n){var l=null,o=null;if(!(n!=null&&typeof n!="boolean"&&(l=n.signal||null,l!==null&&l.aborted))){this._eventListeners===null&&(this._eventListeners=[]);var d=this._eventListeners;if(fh(d,e,t,n)===-1){var p=this,g=t;n!=null&&typeof n!="boolean"&&n.once===!0&&(g=function(j){p.removeEventListener(e,t,n),typeof t=="function"?t.call(this,j):t.handleEvent(j)}),l!==null&&(o=p.removeEventListener.bind(p,e,t,n),l.addEventListener("abort",o,{once:!0}),o=l.removeEventListener.bind(l,"abort",o)),l=Nl(n),d.push({type:e,listener:t,optionsOrUseCapture:n,attachedListener:g,cleanup:o}),y(this._fragmentFiber.child,!1,My,e,g,l)}this._eventListeners=d}};function My(e,t,n,l){return D(e).addEventListener(t,n,l),!1}Mn.prototype.removeEventListener=function(e,t,n){var l=this._eventListeners;if(l!==null&&(t=fh(l,e,t,n),t!==-1)){var o=l[t];n=o.attachedListener;var d=o.cleanup;o=Nl(o.optionsOrUseCapture),y(this._fragmentFiber.child,!1,Ay,e,n,o),l.splice(t,1),d!==null&&d()}};function Ay(e,t,n,l){return D(e).removeEventListener(t,n,l),!1}function Nl(e){return e!=null&&typeof e!="boolean"&&(e.once===!0||e.signal instanceof AbortSignal)?{capture:e.capture,passive:e.passive}:e}function mh(e){return e==null?"c=0":typeof e=="boolean"?"c="+(e?"1":"0"):"c="+(e.capture?"1":"0")}function fh(e,t,n,l){if(e.length===0)return-1;l=mh(l);for(var o=0;o<e.length;o++){var d=e[o];if(d.type===t&&d.listener===n&&mh(d.optionsOrUseCapture)===l)return o}return-1}Mn.prototype.dispatchEvent=function(e){var t=v(this._fragmentFiber);if(t===null)return!0;t=D(t);var n=this._eventListeners;if(n!==null&&0<n.length||!e.bubbles){var l=t.nodeType===9?t.createComment(""):document.createTextNode("");if(n)for(var o=0;o<n.length;o++){var d=n[o];l.addEventListener(d.type,d.attachedListener,Nl(d.optionsOrUseCapture))}if(t.appendChild(l),e=l.dispatchEvent(e),n)for(o=0;o<n.length;o++)d=n[o],l.removeEventListener(d.type,d.attachedListener,Nl(d.optionsOrUseCapture));return t.removeChild(l),e}return t.dispatchEvent(e)},Mn.prototype.focus=function(e){y(this._fragmentFiber.child,!0,ph,e,void 0,void 0)};function ph(e,t){return e.tag===6?!1:(e=D(e),By(e,t))}Mn.prototype.focusLast=function(e){var t=[];y(this._fragmentFiber.child,!0,Su,t,void 0,void 0);for(var n=t.length-1;0<=n&&!ph(t[n],e);n--);};function Su(e,t){return t.push(e),!1}Mn.prototype.blur=function(){var e=v(this._fragmentFiber);e!==null&&(e=D(e),e=$s(e).activeElement,e!==null&&y(this._fragmentFiber.child,!1,Cy,e,void 0,void 0))};function Cy(e,t){return e.tag===6?!1:(e=D(e),e===t||e.contains(t)?(t.blur(),!0):!1)}Mn.prototype.observeUsing=function(e){this._observers===null&&(this._observers=new Set),this._observers.add(e),y(this._fragmentFiber.child,!1,zy,e,void 0,void 0)};function zy(e,t){return e.tag===6||(e=D(e),t.observe(e)),!1}Mn.prototype.unobserveUsing=function(e){var t=this._observers;if(t!==null&&t.has(e)){t.delete(e),y(this._fragmentFiber.child,!1,$y,e,void 0,void 0);for(var n=t=0;n<Fn.length;n++){var l=Fn[n];l.fragmentInstance===this&&l.observer===e?e.unobserve(l.instance):Fn[t++]=l}Fn.length=t}};function $y(e,t){return e.tag===6||(e=D(e),t.unobserve(e)),!1}var Fn=[],Tu=!1;function Oy(e,t,n){Fn.push({fragmentInstance:e,observer:t,instance:n}),Tu||(Tu=!0,Gy(function(){Tu=!1;var l=Fn;Fn=[];for(var o=0;o<l.length;o++){var d=l[o];d.observer.unobserve(d.instance)}}))}Mn.prototype.getClientRects=function(){var e=[];return y(this._fragmentFiber.child,!1,Ry,e,void 0,void 0),e};function Ry(e,t){if(e.tag===6){e=e.stateNode;var n=e.ownerDocument.createRange();n.selectNodeContents(e),t.push.apply(t,n.getClientRects())}else e=D(e),t.push.apply(t,e.getClientRects());return!1}Mn.prototype.getRootNode=function(e){var t=v(this._fragmentFiber);return t===null?this:D(t).getRootNode(e)},Mn.prototype.compareDocumentPosition=function(e){var t=v(this._fragmentFiber);if(t===null)return Node.DOCUMENT_POSITION_DISCONNECTED;var n=[];y(this._fragmentFiber.child,!1,Su,n,void 0,void 0);var l=D(t);if(n.length===0){if(n=l,w(this._fragmentFiber)){e:{for(t=this._fragmentFiber.return;t!==null;){if(t.tag===4){t=t.stateNode.containerInfo;break e}if(t.tag===3||t.tag===5||t.tag===27)break;t=t.return}t=null}t!=null&&(n=t)}t=this._fragmentFiber;var o=l=n.compareDocumentPosition(e);return n===e?o=Node.DOCUMENT_POSITION_CONTAINS:l&Node.DOCUMENT_POSITION_CONTAINED_BY&&(n=A(t)[1],n===null?o=Node.DOCUMENT_POSITION_PRECEDING:(e=D(n).compareDocumentPosition(e),o=e===0||e&Node.DOCUMENT_POSITION_FOLLOWING?Node.DOCUMENT_POSITION_FOLLOWING:Node.DOCUMENT_POSITION_PRECEDING)),o|=Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC}t=D(n[0]),o=D(n[n.length-1]);var d=w(this._fragmentFiber)?t.parentElement:l;if(d==null)return Node.DOCUMENT_POSITION_DISCONNECTED;l=d.compareDocumentPosition(t)&Node.DOCUMENT_POSITION_CONTAINED_BY,d=d.compareDocumentPosition(o)&Node.DOCUMENT_POSITION_CONTAINED_BY;var p=t.compareDocumentPosition(e),g=o.compareDocumentPosition(e),j=p&Node.DOCUMENT_POSITION_CONTAINED_BY||g&Node.DOCUMENT_POSITION_CONTAINED_BY;return g=l&&d&&p&Node.DOCUMENT_POSITION_FOLLOWING&&g&Node.DOCUMENT_POSITION_PRECEDING,t=l&&t===e||d&&o===e||j||g?Node.DOCUMENT_POSITION_CONTAINED_BY:!l&&t===e||!d&&o===e?Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC:p,t&Node.DOCUMENT_POSITION_DISCONNECTED||t&Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC||qy(t,this._fragmentFiber,n[0],n[n.length-1],e)?t:Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC};function qy(e,t,n,l,o){var d=yi(o);if(e&Node.DOCUMENT_POSITION_CONTAINED_BY){if(n=!!d)e:{for(;d!==null;){if(d.tag===7&&(d===t||d.alternate===t)){n=!0;break e}d=d.return}n=!1}return n}if(e&Node.DOCUMENT_POSITION_CONTAINS){if(d===null)return d=o.ownerDocument,o===d||o===d.documentElement||o===d.body;e:{for(d=t,t=v(t);d!==null;){if(!(d.tag!==5&&d.tag!==3&&d.tag!==27||d!==t&&d.alternate!==t)){d=!0;break e}d=d.return}d=!1}return d}return e&Node.DOCUMENT_POSITION_PRECEDING?((t=!!d)&&!(t=d===n)&&(t=ke(n,d,ee),t===null?t=!1:(y(t,!0,V,d,n),d=R,R=null,t=d!==null)),t):e&Node.DOCUMENT_POSITION_FOLLOWING?((t=!!d)&&!(t=d===l)&&(t=ke(l,d,ee),t===null?t=!1:(y(t,!0,Z,d,l),d=R,q=R=null,t=d!==null)),t):!1}function hh(e,t){var n=e.ownerDocument.createRange();n.selectNodeContents(e),e=n.getBoundingClientRect(),window.scrollTo(window.scrollX+e.left,t?window.scrollY+e.top:window.scrollY+e.bottom-window.innerHeight)}Mn.prototype.scrollIntoView=function(e){if(typeof e=="object")throw Error(r(566));var t=[];y(this._fragmentFiber.child,!1,Su,t,void 0,void 0);var n=e!==!1;if(t.length===0){var l=A(this._fragmentFiber);if(l=n?l[1]||l[0]||v(this._fragmentFiber):l[0]||l[1],l===null)return;if(l.tag===6){e=D(l),hh(e,n);return}if(l=D(l),l.nodeType!==9){if(l.nodeType===11){n="host"in l?l.host:null,n!==null&&n.scrollIntoView(e);return}l.scrollIntoView(e)}}for(l=n?t.length-1:0;l!==(n?-1:t.length);){var o=t[l];o.tag===6?(o=D(o),hh(o,n)):D(o).scrollIntoView(e),l+=n?-1:1}};function Dy(e,t){return e=D(e),_h(e,t),!1}function _h(e,t){e.reactFragments==null&&(e.reactFragments=new Set),e.reactFragments.add(t)}function gh(e,t){var n=t._eventListeners;if(n!==null)for(var l=0;l<n.length;l++){var o=n[l];e.addEventListener(o.type,o.attachedListener,Nl(o.optionsOrUseCapture))}e.nodeType!==3&&(n=t._observers,n!==null&&n.forEach(function(d){for(var p=0,g=0;g<Fn.length;g++){var j=Fn[g];(j.fragmentInstance!==t||j.observer!==d||j.instance!==e)&&(Fn[p++]=j)}Fn.length=p,d.observe(e)}),_h(e,t))}function Uy(e,t){var n=t._eventListeners;if(n!==null)for(var l=0;l<n.length;l++){var o=n[l];e.removeEventListener(o.type,o.attachedListener,Nl(o.optionsOrUseCapture))}e.nodeType!==3&&(n=t._observers,n!==null&&n.forEach(function(d){typeof d.rootMargin=="string"?Oy(t,d,e):d.unobserve(e)}),e.reactFragments!=null&&e.reactFragments.delete(t))}function Nu(e){var t=e.firstChild;for(t&&t.nodeType===10&&(t=t.nextSibling);t;){var n=t;switch(t=t.nextSibling,n.nodeName){case"HTML":case"HEAD":case"BODY":Nu(n),rr(n);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(n.rel.toLowerCase()==="stylesheet")continue}e.removeChild(n)}}function Ly(e,t,n,l){for(;e.nodeType===1;){var o=n;if(e.nodeName.toLowerCase()!==t.toLowerCase()){if(!l&&(e.nodeName!=="INPUT"||e.type!=="hidden"))break}else if(l){if(!e[Wl])switch(t){case"meta":if(!e.hasAttribute("itemprop"))break;return e;case"link":if(d=e.getAttribute("rel"),d==="stylesheet"&&e.hasAttribute("data-precedence"))break;if(d!==o.rel||e.getAttribute("href")!==(o.href==null||o.href===""?null:o.href)||e.getAttribute("crossorigin")!==(o.crossOrigin==null?null:o.crossOrigin)||e.getAttribute("title")!==(o.title==null?null:o.title))break;return e;case"style":if(e.hasAttribute("data-precedence"))break;return e;case"script":if(d=e.getAttribute("src"),(d!==(o.src==null?null:o.src)||e.getAttribute("type")!==(o.type==null?null:o.type)||e.getAttribute("crossorigin")!==(o.crossOrigin==null?null:o.crossOrigin))&&d&&e.hasAttribute("async")&&!e.hasAttribute("itemprop"))break;return e;default:return e}}else if(t==="input"&&e.type==="hidden"){var d=o.name==null?null:""+o.name;if(o.type==="hidden"&&e.getAttribute("name")===d)return e}else return e;if(e=Gn(e.nextSibling),e===null)break}return null}function Hy(e,t,n){if(t==="")return null;for(;e.nodeType!==3;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!n||(e=Gn(e.nextSibling),e===null))return null;return e}function bh(e,t){for(;e.nodeType!==8;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!t||(e=Gn(e.nextSibling),e===null))return null;return e}function Eu(e){return e.data==="$?"||e.data==="$~"}function Mu(e){return e.data==="$!"||e.data==="$?"&&e.ownerDocument.readyState!=="loading"}function Yy(e,t){var n=e.ownerDocument;if(e.data==="$~")e._reactRetry=t;else if(e.data!=="$?"||n.readyState!=="loading")t();else{var l=function(){t(),n.removeEventListener("DOMContentLoaded",l)};n.addEventListener("DOMContentLoaded",l),e._reactRetry=l}}function Gn(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t==="$"||t==="$!"||t==="$?"||t==="$~"||t==="&"||t==="F!"||t==="F")break;if(t==="/$"||t==="/&")return null}}return e}var Au=null;function yh(e){e=e.nextSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="/$"||n==="/&"){if(t===0)return Gn(e.nextSibling);t--}else n!=="$"&&n!=="$!"&&n!=="$?"&&n!=="$~"&&n!=="&"||t++}e=e.nextSibling}return null}function vh(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="$"||n==="$!"||n==="$?"||n==="$~"||n==="&"){if(t===0)return e;t--}else n!=="/$"&&n!=="/&"||t++}e=e.previousSibling}return null}function By(e,t){function n(){l=!0}if(e.ownerDocument.activeElement===e)return!0;var l=!1;try{e.ownerDocument.addEventListener("focus",n,!0),(e.focus||HTMLElement.prototype.focus).call(e,t)}finally{e.ownerDocument.removeEventListener("focus",n,!0)}return l}function Gy(e){sh(function(){sh(function(t){return e(t)})})}function wh(e,t,n){switch(t=$s(n),e){case"html":if(e=t.documentElement,!e)throw Error(r(452));return e;case"head":if(e=t.head,!e)throw Error(r(453));return e;case"body":if(e=t.body,!e)throw Error(r(454));return e;default:throw Error(r(451))}}function xh(e,t,n){for(var l in n){var o=n[l];n.hasOwnProperty(l)&&o!=null&&ct(e,t,l,null,by,o)}n.dangerouslySetInnerHTML!=null&&(e.textContent=""),e.onclick===na&&(e.onclick=null),rr(e)}function Cu(e){for(var t=e.attributes;t.length;)e.removeAttributeNode(t[0]);rr(e)}var In=new Map,jh=new Set;function Os(e){if(typeof e.getRootNode=="function"){var t=e.getRootNode();if(t.nodeType===9||t.nodeType===11)return t}return e.nodeType===9?e:e.ownerDocument}var $a=Te.d;Te.d={f:Iy,r:Xy,D:Vy,C:Py,L:Qy,m:Zy,X:Wy,S:Ky,M:Jy};function Iy(){var e=$a.f(),t=uo();return e||t}function Xy(e){var t=Vi(e);t!==null&&t.tag===5&&t.type==="form"?Sp(t):$a.r(e)}var El=typeof document>"u"?null:document;function kh(e,t,n){var l=El;if(l&&typeof t=="string"&&t){var o=qn(t);o='link[rel="'+e+'"][href="'+o+'"]',typeof n=="string"&&(o+='[crossorigin="'+n+'"]'),jh.has(o)||(jh.add(o),e={rel:e,crossOrigin:n,href:t},l.querySelector(o)===null&&(t=l.createElement("link"),Kt(t,"link",e),Ht(t),l.head.appendChild(t)))}}function Vy(e){$a.D(e),kh("dns-prefetch",e,null)}function Py(e,t){$a.C(e,t),kh("preconnect",e,t)}function Qy(e,t,n){$a.L(e,t,n);var l=El;if(l&&e&&t){var o='link[rel="preload"][as="'+qn(t)+'"]';t==="image"&&n&&n.imageSrcSet?(o+='[imagesrcset="'+qn(n.imageSrcSet)+'"]',typeof n.imageSizes=="string"&&(o+='[imagesizes="'+qn(n.imageSizes)+'"]')):o+='[href="'+qn(e)+'"]';var d=o;switch(t){case"style":d=Ml(e);break;case"script":d=Al(e)}if(!(In.has(d)||(e=U({rel:"preload",href:t==="image"&&n&&n.imageSrcSet?void 0:e,as:t},n),In.set(d,e),l.querySelector(o)!==null||t==="style"&&l.querySelector(Rs(d))||t==="script"&&l.querySelector(qs(d))))){var p=l.createElement("link");Kt(p,"link",e),t==="style"&&(p[sr]=!0,p.onload=p.onerror=function(){qm(p)}),Ht(p),l.head.appendChild(p)}}}function Zy(e,t){$a.m(e,t);var n=El;if(n&&e){var l=t&&typeof t.as=="string"?t.as:"script",o='link[rel="modulepreload"][as="'+qn(l)+'"][href="'+qn(e)+'"]',d=o;switch(l){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":d=Al(e)}if(!In.has(d)&&(e=U({rel:"modulepreload",href:e},t),In.set(d,e),n.querySelector(o)===null)){switch(l){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(n.querySelector(qs(d)))return}l=n.createElement("link"),Kt(l,"link",e),Ht(l),n.head.appendChild(l)}}}function Ky(e,t,n){$a.S(e,t,n);var l=El;if(l&&e){var o=Pi(l).hoistableStyles,d=Ml(e);t=t||"default";var p=o.get(d);if(!p){var g={loading:0,preload:null};if(p=l.querySelector(Rs(d)))g.loading=5;else{e=U({rel:"stylesheet",href:e,"data-precedence":t},n),(n=In.get(d))&&zu(e,n);var j=p=l.createElement("link");Ht(j),Kt(j,"link",e),j._p=new Promise(function(M,O){j.onload=M,j.onerror=O}),j.addEventListener("load",function(){g.loading|=1}),j.addEventListener("error",function(){g.loading|=2}),g.loading|=4,bo(p,t,l)}p={type:"stylesheet",instance:p,count:1,state:g},o.set(d,p)}}}function Wy(e,t){$a.X(e,t);var n=El;if(n&&e){var l=Pi(n).hoistableScripts,o=Al(e),d=l.get(o);d||(d=n.querySelector(qs(o)),d||(e=U({src:e,async:!0},t),(t=In.get(o))&&$u(e,t),d=n.createElement("script"),Ht(d),Kt(d,"link",e),n.head.appendChild(d)),d={type:"script",instance:d,count:1,state:null},l.set(o,d))}}function Jy(e,t){$a.M(e,t);var n=El;if(n&&e){var l=Pi(n).hoistableScripts,o=Al(e),d=l.get(o);d||(d=n.querySelector(qs(o)),d||(e=U({src:e,async:!0,type:"module"},t),(t=In.get(o))&&$u(e,t),d=n.createElement("script"),Ht(d),Kt(d,"link",e),n.head.appendChild(d)),d={type:"script",instance:d,count:1,state:null},l.set(o,d))}}function Sh(e,t,n,l){var o=(o=dn.current)?Os(o):null;if(!o)throw Error(r(446));switch(e){case"meta":case"title":return null;case"style":return typeof n.precedence=="string"&&typeof n.href=="string"?(n=Ml(n.href),t=Pi(o).hoistableStyles,l=t.get(n),l||(l={type:"style",instance:null,count:0,state:null},t.set(n,l)),l):{type:"void",instance:null,count:0,state:null};case"link":if(n.rel==="stylesheet"&&typeof n.href=="string"&&typeof n.precedence=="string"){e=Ml(n.href);var d=Pi(o).hoistableStyles,p=d.get(e);if(p||(o=o.ownerDocument||o,p={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},d.set(e,p),(d=o.querySelector(Rs(e)))?d._p||(p.instance=d,p.state.loading=5):(d=In.get(e),d||(d={rel:"preload",as:"style",href:n.href,crossOrigin:n.crossOrigin,integrity:n.integrity,media:n.media,hrefLang:n.hrefLang,referrerPolicy:n.referrerPolicy},In.set(e,d)),Fy(o,e,d,p.state))),t&&l===null)throw Error(r(528,""));return p}if(t&&l!==null)throw Error(r(529,""));return null;case"script":return t=n.async,n=n.src,typeof n=="string"&&t&&typeof t!="function"&&typeof t!="symbol"?(n=Al(n),t=Pi(o).hoistableScripts,l=t.get(n),l||(l={type:"script",instance:null,count:0,state:null},t.set(n,l)),l):{type:"void",instance:null,count:0,state:null};default:throw Error(r(444,e))}}function Ml(e){return'href="'+qn(e)+'"'}function Rs(e){return'link[rel="stylesheet"]['+e+"]"}function Th(e){return U({},e,{"data-precedence":e.precedence,precedence:null})}function Fy(e,t,n,l){if(t=e.querySelector('link[rel="preload"][as="style"]['+t+"]")){if(t[sr]!==!0){l.loading=1;return}}else t=e.createElement("link"),t[sr]=!0,t.onload=t.onerror=qm.bind(null,t),Kt(t,"link",n),Ht(t),e.head.appendChild(t);l.preload=t,t.addEventListener("load",function(){return l.loading|=1}),t.addEventListener("error",function(){return l.loading|=2})}function Al(e){return'[src="'+qn(e)+'"]'}function qs(e){return"script[async]"+e}function Nh(e,t,n){if(t.count++,t.instance===null)switch(t.type){case"style":var l=e.querySelector('style[data-href~="'+qn(n.href)+'"]');if(l)return t.instance=l,Ht(l),l;var o=U({},n,{"data-href":n.href,"data-precedence":n.precedence,href:null,precedence:null});return l=(e.ownerDocument||e).createElement("style"),Ht(l),Kt(l,"style",o),bo(l,n.precedence,e),t.instance=l;case"stylesheet":o=Ml(n.href);var d=e.querySelector(Rs(o));if(d)return t.state.loading|=4,t.instance=d,Ht(d),d;l=Th(n),(o=In.get(o))&&zu(l,o),d=(e.ownerDocument||e).createElement("link"),Ht(d);var p=d;return p._p=new Promise(function(g,j){p.onload=g,p.onerror=j}),Kt(d,"link",l),t.state.loading|=4,bo(d,n.precedence,e),t.instance=d;case"script":return d=Al(n.src),(o=e.querySelector(qs(d)))?(t.instance=o,Ht(o),o):(l=n,(o=In.get(d))&&(l=U({},n),$u(l,o)),e=e.ownerDocument||e,o=e.createElement("script"),Ht(o),Kt(o,"link",l),e.head.appendChild(o),t.instance=o);case"void":return null;default:throw Error(r(443,t.type))}else t.type==="stylesheet"&&(t.state.loading&4)===0&&(l=t.instance,t.state.loading|=4,bo(l,n.precedence,e));return t.instance}function bo(e,t,n){for(var l=n.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),o=l.length?l[l.length-1]:null,d=o,p=0;p<l.length;p++){var g=l[p];if(g.dataset.precedence===t)d=g;else if(d!==o)break}d?d.parentNode.insertBefore(e,d.nextSibling):(t=n.nodeType===9?n.head:n,t.insertBefore(e,t.firstChild))}function zu(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.title==null&&(e.title=t.title)}function $u(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.integrity==null&&(e.integrity=t.integrity)}var yo=null;function Eh(e,t,n){if(yo===null){var l=new Map,o=yo=new Map;o.set(n,l)}else o=yo,l=o.get(n),l||(l=new Map,o.set(n,l));if(l.has(e))return l;for(l.set(e,null),n=n.getElementsByTagName(e),o=0;o<n.length;o++){var d=n[o];if(!(d[Wl]||d[Xt]||e==="link"&&d.getAttribute("rel")==="stylesheet")&&d.namespaceURI!=="http://www.w3.org/2000/svg"){var p=d.getAttribute(t)||"";p=e+p;var g=l.get(p);g?g.push(d):l.set(p,[d])}}return l}function Ou(e,t,n){e=e.ownerDocument||e,e.head.insertBefore(n,t==="title"?e.querySelector("head > title"):null)}function ev(e,t,n){if(n===1||t.itemProp!=null)return!1;switch(e){case"meta":case"title":return!0;case"style":if(typeof t.precedence!="string"||typeof t.href!="string"||t.href==="")break;return!0;case"link":if(typeof t.rel!="string"||typeof t.href!="string"||t.href===""||t.onLoad||t.onError)break;return t.rel==="stylesheet"?(e=t.disabled,typeof t.precedence=="string"&&e==null):!0;case"script":if(t.async&&typeof t.async!="function"&&typeof t.async!="symbol"&&!t.onLoad&&!t.onError&&t.src&&typeof t.src=="string")return!0}return!1}function Mh(e,t){return e==="img"&&t.src!=null&&t.src!==""&&t.onLoad==null&&t.loading!=="lazy"}function Ah(e){return!(e.type==="stylesheet"&&(e.state.loading&3)===0)}function Ch(e){return(e.width||100)*(e.height||100)*(typeof devicePixelRatio=="number"?devicePixelRatio:1)*.25}function zh(e,t){typeof t.decode=="function"&&(e.imgCount++,t.complete||(e.imgBytes+=Ch(t),e.suspenseyImages.push(t)),e=av.bind(e),t.decode().then(e,e))}function tv(e,t,n,l){if(n.type==="stylesheet"&&(typeof l.media!="string"||matchMedia(l.media).matches!==!1)&&(n.state.loading&4)===0){if(n.instance===null){var o=Ml(l.href),d=t.querySelector(Rs(o));if(d){t=d._p,t!==null&&typeof t=="object"&&typeof t.then=="function"&&(e.count++,e=Ds.bind(e),t.then(e,e)),n.state.loading|=4,n.instance=d,Ht(d);return}d=t.ownerDocument||t,l=Th(l),(o=In.get(o))&&zu(l,o),d=d.createElement("link"),Ht(d);var p=d;p._p=new Promise(function(g,j){p.onload=g,p.onerror=j}),Kt(d,"link",l),n.instance=d}e.stylesheets===null&&(e.stylesheets=new Map),e.stylesheets.set(n,t),(t=n.state.preload)&&(n.state.loading&3)===0&&(e.count++,n=Ds.bind(e),t.addEventListener("load",n),t.addEventListener("error",n))}}var vo=0;function nv(e,t){return e.stylesheets&&e.count===0&&xo(e,e.stylesheets),0<e.count||0<e.imgCount?function(n){var l=setTimeout(function(){if(e.stylesheets&&xo(e,e.stylesheets),e.unsuspend){var d=e.unsuspend;e.unsuspend=null,d()}},6e4+t);0<e.imgBytes&&vo===0&&(vo=62500*vy());var o=setTimeout(function(){if(e.waitingForImages=!1,e.count===0&&(e.stylesheets&&xo(e,e.stylesheets),e.unsuspend)){var d=e.unsuspend;e.unsuspend=null,d()}},(e.imgBytes>vo?50:800)+t);return e.unsuspend=n,function(){e.unsuspend=null,clearTimeout(l),clearTimeout(o)}}:null}function $h(e){if(e.count===0&&(e.imgCount===0||!e.waitingForImages)){if(e.stylesheets)xo(e,e.stylesheets);else if(e.unsuspend){var t=e.unsuspend;e.unsuspend=null,t()}}}function Ds(){this.count--,$h(this)}function av(){this.imgCount--,$h(this)}var wo=null;function xo(e,t){e.stylesheets=null,e.unsuspend!==null&&(e.count++,wo=new Map,t.forEach(iv,e),wo=null,Ds.call(e))}function iv(e,t){if(!(t.state.loading&4)){var n=wo.get(e);if(n)var l=n.get(null);else{n=new Map,wo.set(e,n);for(var o=e.querySelectorAll("link[data-precedence],style[data-precedence]"),d=0;d<o.length;d++){var p=o[d];(p.nodeName==="LINK"||p.getAttribute("media")!=="not all")&&(n.set(p.dataset.precedence,p),l=p)}l&&n.set(null,l)}o=t.instance,p=o.getAttribute("data-precedence"),d=n.get(p)||l,d===l&&n.set(null,o),n.set(p,o),this.count++,l=Ds.bind(this),o.addEventListener("load",l),o.addEventListener("error",l),d?d.parentNode.insertBefore(o,d.nextSibling):(e=e.nodeType===9?e.head:e,e.insertBefore(o,e.firstChild)),t.state.loading|=4}}var Cl={$$typeof:ne,Provider:null,Consumer:null,_currentValue:bn,_currentValue2:bn,_threadCount:0};function lv(e,t,n,l,o,d,p,g,j){this.tag=1,this.containerInfo=e,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=pc(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=pc(0),this.hiddenUpdates=pc(null),this.identifierPrefix=l,this.onUncaughtError=o,this.onCaughtError=d,this.onRecoverableError=p,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=j,this.transitionTypes=null,this.incompleteTransitions=new Map}function Oh(e,t,n,l,o,d,p,g,j,M,O,Y){return e=new lv(e,t,n,p,j,M,O,Y,g),t=1,d===!0&&(t|=24),d=mn(3,null,null,t),e.current=d,d.stateNode=e,t=Zc(),t.refCount++,e.pooledCache=t,t.refCount++,d.memoizedState={element:l,isDehydrated:n,cache:t},Fc(d),e}function Rh(e){return e?(e=al,e):al}function qh(e,t,n,l,o,d){o=Rh(o),l.context===null?l.context=o:l.pendingContext=o,l=Qa(t),l.payload={element:n},d=d===void 0?null:d,d!==null&&(l.callback=d),n=Za(e,l,t),n!==null&&(_n(n,e,t),ps(n,e,t))}function Dh(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var n=e.retryLane;e.retryLane=n!==0&&n<t?n:t}}function Ru(e,t){Dh(e,t),(e=e.alternate)&&Dh(e,t)}function Uh(e){if(e.tag===13||e.tag===31){var t=ji(e,67108864);t!==null&&_n(t,e,67108864),Ru(e,67108864)}}function Lh(e){if(e.tag===13||e.tag===31){var t=En();t=hc(t);var n=ji(e,t);n!==null&&_n(n,e,t),Ru(e,t)}}var zl=!0;function sv(e,t,n,l){var o=se.T;se.T=null;var d=Te.p;try{Te.p=2,qu(e,t,n,l)}finally{Te.p=d,se.T=o}}function rv(e,t,n,l){var o=se.T;se.T=null;var d=Te.p;try{Te.p=8,qu(e,t,n,l)}finally{Te.p=d,se.T=o}}function qu(e,t,n,l){if(zl){var o=Du(l);if(o===null)gu(e,t,l,jo,n),Yh(e,l);else if(cv(o,e,t,n,l))l.stopPropagation();else if(Yh(e,l),t&4&&-1<ov.indexOf(e)){for(;o!==null;){var d=Vi(o);if(d!==null)switch(d.tag){case 3:if(d=d.stateNode,d.current.memoizedState.isDehydrated){var p=bi(d.pendingLanes);if(p!==0){var g=d;for(g.pendingLanes|=2,g.entangledLanes|=2;p;){var j=1<<31-wn(p);g.entanglements[1]|=j,p&=~j}ma(d),(lt&6)===0&&(ro=yn()+500,As(0))}}break;case 31:case 13:g=ji(d,2),g!==null&&_n(g,d,2),uo(),Ru(d,2)}if(d=Du(l),d===null&&gu(e,t,l,jo,n),d===o)break;o=d}o!==null&&l.stopPropagation()}else gu(e,t,l,null,n)}}function Du(e){return e=xc(e),Uu(e)}var jo=null;function Uu(e){if(jo=null,e=yi(e),e!==null){var t=u(e);if(t===null)e=null;else{var n=t.tag;if(n===13){if(e=f(t),e!==null)return e;e=null}else if(n===31){if(e=_(t),e!==null)return e;e=null}else if(n===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null)}}return jo=e,null}function Hh(e){switch(e){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"fullscreenerror":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"resize":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(vg()){case km:return 2;case Sm:return 8;case tr:case wg:return 32;case Tm:return 268435456;default:return 32}default:return 32}}var Lu=!1,ri=null,oi=null,ci=null,Us=new Map,Ls=new Map,di=[],ov="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function Yh(e,t){switch(e){case"focusin":case"focusout":ri=null;break;case"dragenter":case"dragleave":oi=null;break;case"mouseover":case"mouseout":ci=null;break;case"pointerover":case"pointerout":Us.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":Ls.delete(t.pointerId)}}function Hs(e,t,n,l,o,d){return e===null||e.nativeEvent!==d?(e={blockedOn:t,domEventName:n,eventSystemFlags:l,nativeEvent:d,targetContainers:[o]},t!==null&&(t=Vi(t),t!==null&&Uh(t)),e):(e.eventSystemFlags|=l,t=e.targetContainers,o!==null&&t.indexOf(o)===-1&&t.push(o),e)}function cv(e,t,n,l,o){switch(t){case"focusin":return ri=Hs(ri,e,t,n,l,o),!0;case"dragenter":return oi=Hs(oi,e,t,n,l,o),!0;case"mouseover":return ci=Hs(ci,e,t,n,l,o),!0;case"pointerover":var d=o.pointerId;return Us.set(d,Hs(Us.get(d)||null,e,t,n,l,o)),!0;case"gotpointercapture":return d=o.pointerId,Ls.set(d,Hs(Ls.get(d)||null,e,t,n,l,o)),!0}return!1}function Bh(e){var t=yi(e.target);if(t!==null){var n=u(t);if(n!==null){if(t=n.tag,t===13){if(t=f(n),t!==null){e.blockedOn=t,$m(e.priority,function(){Lh(n)});return}}else if(t===31){if(t=_(n),t!==null){e.blockedOn=t,$m(e.priority,function(){Lh(n)});return}}else if(t===3&&n.stateNode.current.memoizedState.isDehydrated){e.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}e.blockedOn=null}function ko(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var n=Du(e.nativeEvent);if(n===null){n=e.nativeEvent;var l=new n.constructor(n.type,n);wc=l,n.target.dispatchEvent(l),wc=null}else return t=Vi(n),t!==null&&Uh(t),e.blockedOn=n,!1;t.shift()}return!0}function Gh(e,t,n){ko(e)&&n.delete(t)}function dv(){Lu=!1,ri!==null&&ko(ri)&&(ri=null),oi!==null&&ko(oi)&&(oi=null),ci!==null&&ko(ci)&&(ci=null),Us.forEach(Gh),Ls.forEach(Gh)}function So(e,t){e.blockedOn===t&&(e.blockedOn=null,Lu||(Lu=!0,a.unstable_scheduleCallback(a.unstable_NormalPriority,dv)))}var To=null;function Ih(e){To!==e&&(To=e,a.unstable_scheduleCallback(a.unstable_NormalPriority,function(){To===e&&(To=null);for(var t=0;t<e.length;t+=3){var n=e[t],l=e[t+1],o=e[t+2];if(typeof l!="function"){if(Uu(l||n)===null)continue;break}var d=Vi(n);d!==null&&(e.splice(t,3),t-=3,vd(d,{pending:!0,data:o,method:n.method,action:l},l,o))}}))}function $l(e){function t(j){return So(j,e)}ri!==null&&So(ri,e),oi!==null&&So(oi,e),ci!==null&&So(ci,e),Us.forEach(t),Ls.forEach(t);for(var n=0;n<di.length;n++){var l=di[n];l.blockedOn===e&&(l.blockedOn=null)}for(;0<di.length&&(n=di[0],n.blockedOn===null);)Bh(n),n.blockedOn===null&&di.shift();if(n=(e.ownerDocument||e).$$reactFormReplay,n!=null)for(l=0;l<n.length;l+=3){var o=n[l],d=n[l+1],p=o[un]||null;if(typeof d=="function")p||Ih(n);else if(p){var g=null;if(d&&d.hasAttribute("formAction")){if(o=d,p=d[un]||null)g=p.formAction;else if(Uu(o)!==null)continue}else g=p.action;typeof g=="function"?n[l+1]=g:(n.splice(l,3),l-=3),Ih(n)}}}function Xh(){function e(d){d.canIntercept&&d.info==="react-transition"&&d.intercept({handler:function(){return new Promise(function(p){return o=p})},focusReset:"manual",scroll:"manual"})}function t(){o!==null&&(o(),o=null),l||setTimeout(n,20)}function n(){if(!l&&!navigation.transition){var d=navigation.currentEntry;d&&d.url!=null&&navigation.navigate(d.url,{state:d.getState(),info:"react-transition",history:"replace"})}}if(typeof navigation=="object"){var l=!1,o=null;return navigation.addEventListener("navigate",e),navigation.addEventListener("navigatesuccess",t),navigation.addEventListener("navigateerror",t),setTimeout(n,100),function(){l=!0,navigation.removeEventListener("navigate",e),navigation.removeEventListener("navigatesuccess",t),navigation.removeEventListener("navigateerror",t),o!==null&&(o(),o=null)}}}function Hu(e){this._internalRoot=e}No.prototype.render=Hu.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(r(409));var n=t.current,l=En();qh(n,l,e,t,null,null)},No.prototype.unmount=Hu.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;qh(e.current,2,null,e,null,null),uo(),t[Xi]=null}};function No(e){this._internalRoot=e}No.prototype.unstable_scheduleHydration=function(e){if(e){var t=zm();e={blockedOn:null,target:e,priority:t};for(var n=0;n<di.length&&t!==0&&t<di[n].priority;n++);di.splice(n,0,e),n===0&&Bh(e)}};var Vh=i.version;if(Vh!=="19.3.0")throw Error(r(527,Vh,"19.3.0"));Te.findDOMNode=function(e){var t=e._reactInternals;if(t===void 0)throw typeof e.render=="function"?Error(r(188)):(e=Object.keys(e).join(","),Error(r(268,e)));return e=b(t),e=e!==null?x(e):null,e=e===null?null:e.stateNode,e};var uv={bundleType:0,version:"19.3.0",rendererPackageName:"react-dom",currentDispatcherRef:se,reconcilerVersion:"19.3.0"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var Eo=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!Eo.isDisabled&&Eo.supportsFiber)try{Ql=Eo.inject(uv),vn=Eo}catch{}}return Bs.createRoot=function(e,t){if(!m(e))throw Error(r(299));var n=!1,l="",o=Rp,d=qp,p=Dp;return t!=null&&(t.unstable_strictMode===!0&&(n=!0),t.identifierPrefix!==void 0&&(l=t.identifierPrefix),t.onUncaughtError!==void 0&&(o=t.onUncaughtError),t.onCaughtError!==void 0&&(d=t.onCaughtError),t.onRecoverableError!==void 0&&(p=t.onRecoverableError)),t=Oh(e,1,!1,null,null,n,l,null,o,d,p,Xh),e[Xi]=t.current,_u(e),new Hu(t)},Bs.hydrateRoot=function(e,t,n){if(!m(e))throw Error(r(299));var l=!1,o="",d=Rp,p=qp,g=Dp,j=null;return n!=null&&(n.unstable_strictMode===!0&&(l=!0),n.identifierPrefix!==void 0&&(o=n.identifierPrefix),n.onUncaughtError!==void 0&&(d=n.onUncaughtError),n.onCaughtError!==void 0&&(p=n.onCaughtError),n.onRecoverableError!==void 0&&(g=n.onRecoverableError),n.formState!==void 0&&(j=n.formState)),t=Oh(e,1,!0,t,n??null,l,o,j,d,p,g,Xh),t.context=Rh(null),n=t.current,l=En(),l=hc(l),o=Qa(l),o.callback=null,Za(n,o,l),n=l,t.current.lanes=n,Kl(t,n),ma(t),e[Xi]=t.current,_u(e),new No(t)},Bs.version="19.3.0",Bs}var i_;function Zv(){if(i_)return Bu.exports;i_=1;function a(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(a)}catch(i){console.error(i)}}return a(),Bu.exports=Qv(),Bu.exports}var Kv=Zv(),L=_m();const Mo=Hv(L),l_=a=>{let i;const s=new Set,r=(b,x)=>{const y=typeof b=="function"?b(i):b;if(!Object.is(y,i)){const v=i;i=x??(typeof y!="object"||y===null)?y:Object.assign({},i,y),s.forEach(w=>w(i,v))}},m=()=>i,_={setState:r,getState:m,getInitialState:()=>h,subscribe:b=>(s.add(b),()=>s.delete(b))},h=i=a(r,m,_);return _},Wv=(a=>a?l_(a):l_),Jv=a=>a;function Fv(a,i=Jv){const s=Mo.useSyncExternalStore(a.subscribe,Mo.useCallback(()=>i(a.getState()),[a,i]),Mo.useCallback(()=>i(a.getInitialState()),[a,i]));return Mo.useDebugValue(s),s}const s_=a=>{const i=Wv(a),s=r=>Fv(i,r);return Object.assign(s,i),s},X_=(a=>a?s_(a):s_),r_={volume:.6,muted:!1,music:!1,quality:"high",reduceMotion:!1,showNames:!0,joystickLeft:!0};function e1(){try{const i=localStorage.getItem("stt.settings");if(i)return{...r_,...JSON.parse(i)}}catch{}const a=typeof window<"u"&&window.matchMedia?.("(pointer: coarse)").matches;return{...r_,quality:a?"low":"high"}}const B=X_(()=>({phase:"title",backend:null,loadingMsg:"",loadingPct:0,fatal:null,catalog:null,itemsById:{},last:null,me:null,myItems:[],syncedAt:0,serverOffset:0,feed:[],feedSince:-1,market:{},marketAt:0,world:[],worldAt:0,belt:[],beltAt:0,panel:null,panelArg:null,toasts:[],drop:null,steal:null,bigReveal:null,banner:null,levelUp:null,confirm:null,settings:e1(),tutorialOpen:!1,focusPlot:null})),_i=[],G=()=>B.getState(),de=a=>B.setState(a),je=a=>a?new Date(a).getTime()-G().serverOffset:0;let t1=0;function Ee(a){const i=++t1,s={ttl:5e3,...a,id:i,at:Date.now()};de(r=>({toasts:[...r.toasts.slice(-5),s]})),window.setTimeout(()=>de(r=>({toasts:r.toasts.filter(m=>m.id!==i)})),s.ttl)}function De(a,i=null){de({panel:a,panelArg:i})}function Rl(a){const i={...G().settings,...a};de({settings:i});try{localStorage.setItem("stt.settings",JSON.stringify(i))}catch{}}function o_(){return G().me?.cash??0}let n1=0;function Oa(a){const i=++n1;de({banner:{ttl:2600,...a,id:i}}),window.setTimeout(()=>{G().banner?.id===i&&de({banner:null})},a.ttl??2600)}function ea(a){return a?G().catalog?.mutations?.find(i=>i.id===a)??null:null}const Xl=a=>ea(a)?.mult??1;function rm(a,i){const s=G(),r=s.itemsById[a];if(!r)return 0;const m=s.last?.event,u=m&&m.category&&m.category===r.category?m.income_mult:1;return r.base_income*Xl(i)*u*(1+(s.me?.income_bonus||0))}function Qs(a,i){if(a.location!=="display")return 0;const s=i??je(a.accrued_at),r=Math.min(43200,Math.max(0,(Date.now()-s)/1e3));return Math.floor(rm(a.item_id,a.mutation)*r)}function wt(a){return G().itemsById[a]}function Pn(a,i){const s=G().market[a]?.price??G().itemsById[a]?.base_value??0;return i?Math.round(s*Xl(i)):s}const Wo=["common","uncommon","rare","epic","legendary","mythic","ultra","limited","secret"],qe={common:{label:"COMMON",color:"#a3aec2",glow:"rgba(163,174,194,0.0)",tier:1},uncommon:{label:"UNCOMMON",color:"#4ade80",glow:"rgba(74,222,128,0.35)",tier:2},rare:{label:"RARE",color:"#38bdf8",glow:"rgba(56,189,248,0.55)",tier:3},epic:{label:"EPIC",color:"#a855f7",glow:"rgba(168,85,247,0.65)",tier:4},legendary:{label:"LEGENDARY",color:"#fbbf24",glow:"rgba(251,191,36,0.7)",tier:5},mythic:{label:"MYTHIC",color:"#f43f5e",glow:"rgba(244,63,94,0.75)",tier:6},ultra:{label:"ULTRA",color:"#e879f9",glow:"rgba(232,121,249,0.8)",tier:7},limited:{label:"LIMITED",color:"#fb923c",glow:"rgba(251,146,60,0.75)",tier:8},secret:{label:"SECRET",color:"#f8fafc",glow:"rgba(248,250,252,0.9)",tier:9}},a1=a=>qe[a]?.tier??1,Uo={TECH:"📺",GAMING:"🎮",CARS:"🏎️",FASHION:"👟",LUXURY:"💎",SPORTS:"🏆",RANDOM:"🎲"},i1=(a,i=90,s=65)=>`hsl(${a*120%360}, ${i}%, ${s}%)`;function pe(a){return"$"+Math.floor(Number(a)||0).toLocaleString("en-US")}function V_(a){const i=Number(a)||0,s=Math.abs(i),r=[[1e15,"Q"],[1e12,"T"],[1e9,"B"],[1e6,"M"],[1e3,"K"]];for(const[m,u]of r)if(s>=m){const f=i/m;return(f>=100?f.toFixed(0):f>=10?f.toFixed(1):f.toFixed(2)).replace(/\.0+$/,"")+u}return Math.floor(i).toString()}const Ue=a=>"$"+V_(a);function Cn(a){const i=Number(a)||0;return i<100?"$"+i.toFixed(i%1===0?0:1)+"/s":"$"+(i<1e6?Math.round(i).toLocaleString("en-US"):V_(i))+"/s"}function P_(a,i=1){return(a>0?"+":"")+a.toFixed(i)+"%"}function Ut(a){if(a<=0)return"0s";const i=Math.ceil(a/1e3);if(i<60)return i+"s";const s=Math.floor(i/60);if(s<60)return`${s}m ${i%60}s`;const r=Math.floor(s/60);return r<24?`${r}h ${s%60}m`:`${Math.floor(r/24)}d ${r%24}h`}function _a(a,i=Date.now()){const s=typeof a=="number"?a:new Date(a).getTime(),r=Math.max(0,Math.round((i-s)/1e3));if(r<10)return"just now";if(r<60)return r+"s ago";const m=Math.floor(r/60);if(m<60)return m+"m ago";const u=Math.floor(m/60);return u<24?u+"h ago":Math.floor(u/24)+"d ago"}function Yl(a){let i=0;for(let s=0;s<a.length;s++)i=i*31+a.charCodeAt(s)|0;return Math.abs(i)%360}function Q_(a){return a>=85?{label:"EXTREME",cls:"up"}:a>=65?{label:"HIGH",cls:"up"}:a>=35?{label:"MEDIUM",cls:"flat"}:{label:"LOW",cls:"down"}}let Yi=null,ta=null,Jo=.6,Bi=!1,c_=!1,Ao=null;function gm(){if(typeof window>"u")return null;if(!Yi){const a=window.AudioContext||window.webkitAudioContext;if(!a)return null;Yi=new a,ta=Yi.createGain(),ta.gain.value=Bi?0:Jo,ta.connect(Yi.destination)}return Yi.state==="suspended"&&Yi.resume().catch(()=>{}),Yi}function Z_(a){Jo=Math.max(0,Math.min(1,a)),ta&&(ta.gain.value=Bi?0:Jo)}function K_(a){Bi=a,ta&&(ta.gain.value=Bi?0:Jo)}function gt(a,i,s={}){const r=gm();if(!r||!ta||Bi)return;const m=r.currentTime+(s.delay||0),u=r.createOscillator(),f=r.createGain();u.type=s.type||"sine",u.frequency.setValueAtTime(a,m),s.slide&&u.frequency.exponentialRampToValueAtTime(Math.max(20,a*s.slide),m+i);const _=s.gain??.2;f.gain.setValueAtTime(1e-4,m),f.gain.exponentialRampToValueAtTime(_,m+(s.attack??.01)),f.gain.exponentialRampToValueAtTime(1e-4,m+i),u.connect(f),f.connect(ta),u.start(m),u.stop(m+i+.05)}function Xn(a,i={}){const s=gm();if(!s||!ta||Bi)return;const r=s.currentTime+(i.delay||0),m=Math.floor(s.sampleRate*a),u=s.createBuffer(1,m,s.sampleRate),f=u.getChannelData(0);for(let x=0;x<m;x++)f[x]=(Math.random()*2-1)*(1-x/m);const _=s.createBufferSource();_.buffer=u;const h=s.createBiquadFilter();h.type="bandpass",h.frequency.value=i.freq||1200;const b=s.createGain();b.gain.value=i.gain??.15,_.connect(h),h.connect(b),b.connect(ta),_.start(r)}const Vn=(a,i,s="triangle",r=.12,m=.06)=>a.forEach((u,f)=>gt(u,i,{type:s,gain:r,delay:f*m}));function te(a){switch(a){case"click":return gt(660,.06,{type:"square",gain:.05});case"tick":return gt(1200,.03,{type:"square",gain:.03});case"step":return Xn(.04,{gain:.03,freq:400});case"coin":return gt(988,.08,{type:"square",gain:.06}),gt(1319,.18,{type:"square",gain:.06,delay:.07});case"cash":return Vn([784,988,1319,1568],.25,"square",.05,.05);case"error":return gt(220,.15,{type:"sawtooth",gain:.08}),gt(160,.2,{type:"sawtooth",gain:.08,delay:.12});case"open":return Xn(.4,{gain:.2,freq:3e3}),gt(220,.5,{type:"sawtooth",gain:.1,slide:4});case"shake":return Xn(.12,{gain:.12,freq:600});case"whoosh":return Xn(.35,{gain:.12,freq:2200});case"levelup":return Vn([523,659,784,1047,1319],.5,"triangle",.12,.08);case"notify":return gt(880,.1,{gain:.08}),gt(1175,.15,{gain:.08,delay:.1});case"alarm":for(let i=0;i<4;i++)gt(880,.22,{type:"square",gain:.07,delay:i*.45}),gt(660,.22,{type:"square",gain:.07,delay:i*.45+.22});return;case"steal_ok":return Vn([392,523,659,784,1047],.4,"square",.07,.07);case"steal_fail":return gt(300,.3,{type:"sawtooth",gain:.1,slide:.4}),Xn(.3,{gain:.1,freq:300,delay:.1});case"defend":return Vn([330,440,660],.3,"square",.08,.04);case"trade":return Vn([523,784,1047],.3,"triangle",.1,.1);case"buy":return Vn([659,880],.2,"square",.06,.06);case"zap":return Xn(.5,{gain:.22,freq:4200}),gt(1400,.35,{type:"sawtooth",gain:.09,slide:.15}),gt(90,.4,{type:"square",gain:.1,delay:.05});case"grab":return gt(300,.12,{type:"square",gain:.06,slide:2}),Xn(.1,{gain:.08,freq:900});case"jump":return gt(330,.16,{type:"square",gain:.05,slide:2.2});case"land":return Xn(.08,{gain:.06,freq:300});case"laser":for(let i=0;i<3;i++)gt(1600-i*300,.18,{type:"sawtooth",gain:.05,slide:.3,delay:i*.08});return;case"spawn":return Vn([784,1047,1319],.22,"triangle",.08,.05);case"hype":return Vn([392,523,659,784,1047,1319],.6,"sawtooth",.06,.06),Xn(.9,{gain:.07,freq:6e3,delay:.1});case"pop":return gt(900,.07,{type:"triangle",gain:.08,slide:1.8});case"tag":return Vn([220,440],.15,"square",.12,.02),Xn(.2,{gain:.2,freq:800});case"run":return Vn([523,659,784],.14,"square",.06,.03);case"mutation":return Vn([659,831,988,1319,1661],.45,"triangle",.09,.05),Xn(.6,{gain:.06,freq:7e3,delay:.1})}}function d_(a){const i=Math.min(12,a),s=880*Math.pow(2,i/12);gt(s,.07,{type:"square",gain:.06}),gt(s*1.335,.2,{type:"square",gain:.06,delay:.06}),a>=3&&gt(s*2,.12,{type:"triangle",gain:.04,delay:.12})}function Fs(a){const i={common:[523],uncommon:[523,659],rare:[523,659,784],epic:[523,659,784,988],legendary:[523,659,784,1047,1319],mythic:[440,554,659,880,1109,1319],ultra:[392,494,587,784,988,1175,1568],limited:[440,554,659,880,1109,1319],secret:[262,330,392,523,659,784,1047,1319,1568]},s=i[a]||i.common,r=s.length;Vn(s,.35+r*.08,r>5?"sawtooth":"triangle",r>5?.07:.11,.07),r>=6&&Xn(1.2,{gain:.08,freq:5e3,delay:.2}),a==="secret"&&(gt(65,2.5,{type:"sine",gain:.35,attack:.3}),gt(98,2.5,{type:"sine",gain:.2,attack:.5,delay:.3}))}function W_(a){if(c_=a,Ao&&(clearInterval(Ao),Ao=null),!a)return;const i=[110,110,131,147,110,165,147,131];let s=0;Ao=window.setInterval(()=>{if(!c_||Bi)return;const r=i[s%i.length];gt(r,.5,{type:"triangle",gain:.035}),s%2===0&&gt(r*4,.12,{type:"square",gain:.012,delay:.25}),s++},420)}function l1(){gm()}const s1=`-- ============================================================================
-- STEAL THE TECH — schema
--
-- Security model
--   * Every game table lives in the private \`game\` schema with RLS enabled and
--     NO client policies: browsers can never read or write game tables directly.
--   * The only way to change anything is through \`public.stt_*\` RPC functions
--     (SECURITY DEFINER). They identify the caller with auth.uid(), lock the
--     rows they touch, validate everything and compute all outcomes (money,
--     loot, raid results, prices) on the server.
--   * The one exception is \`game.server_events\` (the live feed), which
--     signed-in players may SELECT (global rows + rows addressed to them) so
--     Supabase Realtime can push notifications.
--
-- Idempotent: safe to run more than once.
-- ============================================================================

create schema if not exists game;

-- Functions in \`game\` are internal: nobody but the owner may execute them.
alter default privileges in schema game revoke execute on functions from public;

-- ---------------------------------------------------------------------------
-- Static definitions (seeded by the catalog migration)
-- ---------------------------------------------------------------------------
create table if not exists game.rarities (
  id text primary key,
  tier int not null unique,
  label text not null,
  color text not null,
  steal_penalty numeric not null default 0,
  steal_extra_seconds int not null default 0,
  xp int not null default 0,
  expected_supply int not null default 0
);

create table if not exists game.items (
  id text primary key,
  name text not null,
  brand text not null,
  kind text not null,
  category text not null check (category in ('TECH','GAMING','CARS','FASHION','LUXURY','SPORTS')),
  rarity text not null references game.rarities(id),
  base_value bigint not null check (base_value > 0),
  base_income bigint not null check (base_income >= 0),
  max_supply int check (max_supply is null or max_supply > 0),
  tradeable boolean not null default true,
  droppable boolean not null default true,
  event_only boolean not null default false,
  color text not null default '#7dd3fc',
  accent text not null default '#0e7490',
  flavor text not null default '',
  sort int not null default 0
);

create table if not exists game.limited_item_supply (
  item_id text primary key references game.items(id),
  max_supply int not null check (max_supply > 0),
  minted int not null default 0,
  check (minted >= 0 and minted <= max_supply)
);

create table if not exists game.drop_types (
  id text primary key,
  name text not null,
  price bigint not null check (price > 0),
  min_level int not null default 1,
  requires_key boolean not null default false,
  event_only boolean not null default false,
  weights jsonb not null,
  xp int not null default 0,
  sort int not null default 0,
  description text not null default ''
);

create table if not exists game.upgrade_levels (
  kind text not null check (kind in ('base','security','vault')),
  level int not null,
  cost bigint not null,
  value int not null,
  name text not null,
  primary key (kind, level)
);

create table if not exists game.quests (
  id text primary key,
  period text not null check (period in ('daily','weekly')),
  title text not null,
  metric text not null,
  target bigint not null check (target > 0),
  reward jsonb not null,
  sort int not null default 0
);

create table if not exists game.achievements (
  id text primary key,
  title text not null,
  description text not null,
  icon text not null,
  xp int not null default 0,
  reward_cash bigint not null default 0,
  sort int not null default 0
);

create table if not exists game.cosmetics (
  id text primary key,
  slot text not null,
  name text not null,
  price bigint not null default 0,
  unlock text,
  data jsonb not null default '{}'::jsonb,
  sort int not null default 0
);

create table if not exists game.event_types (
  id text primary key,
  title text not null,
  icon text not null,
  description text not null,
  category text,
  price_mult numeric not null default 1,
  demand_boost numeric not null default 0,
  income_mult numeric not null default 1,
  luck_mult numeric not null default 1,
  weight int not null default 1
);

create table if not exists game.level_titles (
  level int primary key,
  title text not null
);

-- ---------------------------------------------------------------------------
-- Players
-- ---------------------------------------------------------------------------
-- profiles.id == auth.users.id for humans; fixed ids for NPC bots.
create table if not exists game.profiles (
  id uuid primary key,
  username text not null,
  is_bot boolean not null default false,
  bot jsonb,
  cash bigint not null default 0 check (cash >= 0),
  income_remainder double precision not null default 0,
  last_income_at timestamptz not null default now(),
  xp bigint not null default 0,
  level int not null default 1,
  prestige int not null default 0,
  collection_focus text not null default 'RANDOM',
  drop_tokens jsonb not null default '{}'::jsonb,
  secret_keys int not null default 0 check (secret_keys >= 0),
  tutorial_step int not null default 0,
  tutorial_flags jsonb not null default '{}'::jsonb,
  cosmetics jsonb not null default '{}'::jsonb,
  daily_streak int not null default 0,
  last_daily_day date,
  raid_cooldown_until timestamptz,
  items_rev bigint not null default 0,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create unique index if not exists profiles_username_ci on game.profiles (lower(username));
create index if not exists profiles_last_seen on game.profiles (last_seen_at desc);

create table if not exists game.bases (
  player_id uuid primary key references game.profiles(id) on delete cascade,
  base_level int not null default 1,
  security_level int not null default 1,
  vault_level int not null default 1,
  shield_until timestamptz
);

create table if not exists game.player_stats (
  player_id uuid primary key references game.profiles(id) on delete cascade,
  drops_opened int not null default 0,
  items_found int not null default 0,
  secrets_found int not null default 0,
  limiteds_found int not null default 0,
  steals_won int not null default 0,
  steals_failed int not null default 0,
  times_robbed int not null default 0,
  raids_defended int not null default 0,
  trades_done int not null default 0,
  market_sales int not null default 0,
  market_buys int not null default 0,
  quick_sales int not null default 0,
  cash_earned bigint not null default 0,
  best_item_value bigint not null default 0,
  events_joined int not null default 0
);

-- One row per physical item instance in the world.
create table if not exists game.player_items (
  id uuid primary key default gen_random_uuid(),
  item_id text not null references game.items(id),
  owner_id uuid not null references game.profiles(id) on delete cascade,
  location text not null default 'inventory' check (location in ('display','vault','inventory','listed')),
  slot int,
  serial int,
  soulbound boolean not null default false,
  acquired_via text not null,
  acquired_at timestamptz not null default now(),
  hot_until timestamptz,
  stolen_from uuid,
  check ((location = 'display') = (slot is not null))
);
create unique index if not exists player_items_display_slot on game.player_items (owner_id, slot) where location = 'display';
create index if not exists player_items_owner on game.player_items (owner_id, location);
create index if not exists player_items_item on game.player_items (item_id);

-- Ownership audit trail: every item creation / transfer / burn.
create table if not exists game.item_log (
  id bigserial primary key,
  player_item_id uuid not null,
  item_id text not null,
  from_id uuid,
  to_id uuid,
  via text not null,
  amount bigint,
  created_at timestamptz not null default now()
);
create index if not exists item_log_to on game.item_log (to_id, created_at);

create table if not exists game.player_collection (
  player_id uuid not null references game.profiles(id) on delete cascade,
  item_id text not null references game.items(id),
  first_found_at timestamptz not null default now(),
  times_found int not null default 1,
  primary key (player_id, item_id)
);

create table if not exists game.player_cosmetics (
  player_id uuid not null references game.profiles(id) on delete cascade,
  cosmetic_id text not null references game.cosmetics(id),
  acquired_at timestamptz not null default now(),
  primary key (player_id, cosmetic_id)
);

create table if not exists game.player_achievements (
  player_id uuid not null references game.profiles(id) on delete cascade,
  achievement_id text not null references game.achievements(id),
  unlocked_at timestamptz not null default now(),
  primary key (player_id, achievement_id)
);

create table if not exists game.player_quests (
  player_id uuid not null references game.profiles(id) on delete cascade,
  quest_id text not null references game.quests(id),
  period_key text not null,
  progress bigint not null default 0,
  claimed_at timestamptz,
  primary key (player_id, quest_id, period_key)
);

create table if not exists game.daily_rewards (
  player_id uuid not null references game.profiles(id) on delete cascade,
  day date not null,
  streak int not null,
  cycle_day int not null,
  reward jsonb not null,
  primary key (player_id, day)
);

create table if not exists game.security_upgrades (
  id bigserial primary key,
  player_id uuid not null references game.profiles(id) on delete cascade,
  kind text not null,
  from_level int not null,
  to_level int not null,
  cost bigint not null,
  created_at timestamptz not null default now()
);

-- Every change to a player's cash except passive income ticks.
create table if not exists game.transactions (
  id bigserial primary key,
  player_id uuid not null references game.profiles(id) on delete cascade,
  kind text not null,
  amount bigint not null,
  balance_after bigint not null,
  ref jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists transactions_player on game.transactions (player_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Market
-- ---------------------------------------------------------------------------
create table if not exists game.market_state (
  item_id text primary key references game.items(id),
  price bigint not null check (price > 0),
  demand numeric not null default 50,
  supply int not null default 0,
  listed int not null default 0,
  volume_24h int not null default 0,
  updated_at timestamptz not null default now(),
  last_alert_at timestamptz
);

create table if not exists game.market_history (
  item_id text not null references game.items(id),
  ts timestamptz not null,
  price bigint not null,
  demand numeric not null default 50,
  supply int not null default 0,
  listed int not null default 0,
  volume int not null default 0,
  primary key (item_id, ts)
);

create table if not exists game.market_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references game.profiles(id) on delete cascade,
  player_item_id uuid not null references game.player_items(id) on delete cascade,
  item_id text not null references game.items(id),
  price bigint not null check (price > 0),
  status text not null default 'active' check (status in ('active','sold','cancelled')),
  buyer_id uuid,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create unique index if not exists market_listings_one_active on game.market_listings (player_item_id) where status = 'active';
create index if not exists market_listings_item on game.market_listings (item_id, status, price);
create index if not exists market_listings_seller on game.market_listings (seller_id, status);

create table if not exists game.market_sales (
  id bigserial primary key,
  item_id text not null references game.items(id),
  price bigint not null,
  seller_id uuid,
  buyer_id uuid,
  kind text not null check (kind in ('listing','quick_sell')),
  created_at timestamptz not null default now()
);
create index if not exists market_sales_item on game.market_sales (item_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Trades & raids
-- ---------------------------------------------------------------------------
create table if not exists game.trades (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references game.profiles(id) on delete cascade,
  to_id uuid not null references game.profiles(id) on delete cascade,
  offer_items uuid[] not null default '{}',
  offer_cash bigint not null default 0 check (offer_cash >= 0),
  request_items uuid[] not null default '{}',
  request_cash bigint not null default 0 check (request_cash >= 0),
  message text not null default '',
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled','expired','failed')),
  note text,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists trades_to on game.trades (to_id, status);
create index if not exists trades_from on game.trades (from_id, status);

create table if not exists game.raids (
  id uuid primary key default gen_random_uuid(),
  attacker_id uuid not null references game.profiles(id) on delete cascade,
  defender_id uuid not null references game.profiles(id) on delete cascade,
  player_item_id uuid not null,
  item_id text not null references game.items(id),
  status text not null default 'active' check (status in ('active','success','failed','blocked')),
  chance numeric not null,
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  defended boolean not null default false,
  defended_at timestamptz,
  is_revenge boolean not null default false,
  is_tutorial boolean not null default false,
  revenge_used boolean not null default false,
  fine bigint not null default 0,
  note text,
  resolved_at timestamptz
);
create unique index if not exists raids_one_active_attacker on game.raids (attacker_id) where status = 'active';
create unique index if not exists raids_one_active_item on game.raids (player_item_id) where status = 'active';
create index if not exists raids_defender on game.raids (defender_id, status, resolved_at desc);
create index if not exists raids_attacker on game.raids (attacker_id, started_at desc);

-- ---------------------------------------------------------------------------
-- World, events & live feed
-- ---------------------------------------------------------------------------
create table if not exists game.world (
  id int primary key default 1 check (id = 1),
  last_tick_at timestamptz,
  last_history_at timestamptz,
  next_event_at timestamptz,
  last_bot_raid_at timestamptz,
  tick_count bigint not null default 0,
  seeded_at timestamptz
);
insert into game.world (id) values (1) on conflict (id) do nothing;

create table if not exists game.events (
  id bigserial primary key,
  type_id text not null references game.event_types(id),
  category text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  announced_end boolean not null default false
);
create index if not exists events_time on game.events (ends_at desc);

create table if not exists game.server_events (
  id bigserial primary key,
  kind text not null,
  target_id uuid,           -- null = everyone
  actor_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists server_events_target on game.server_events (target_id, id);
create index if not exists server_events_created on game.server_events (created_at);

-- ---------------------------------------------------------------------------
-- Row level security: deny by default
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'game' loop
    execute format('alter table game.%I enable row level security', t);
  end loop;
end $$;

drop policy if exists server_events_read on game.server_events;
create policy server_events_read on game.server_events
  for select to authenticated
  using (target_id is null or target_id = auth.uid());

revoke all on all tables in schema game from anon, authenticated;
revoke all on all sequences in schema game from anon, authenticated;
grant usage on schema game to authenticated;
grant select on game.server_events to authenticated;

-- Supabase Realtime: stream the live feed (no-op outside Supabase).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'game' and tablename = 'server_events') then
    execute 'alter publication supabase_realtime add table game.server_events';
  end if;
end $$;
`,r1=`-- ============================================================================
-- STEAL THE TECH — catalog seed (GENERATED by scripts/gen-catalog.mjs — do not edit)
-- Idempotent: safe to re-run; updates definitions in place.
-- ============================================================================

insert into game.rarities (id, tier, label, color, steal_penalty, steal_extra_seconds, xp, expected_supply) values
  ('common', 1, 'COMMON', '#a3aec2', 0, 0, 4, 400),
  ('uncommon', 2, 'UNCOMMON', '#4ade80', 0.02, 0, 10, 250),
  ('rare', 3, 'RARE', '#38bdf8', 0.05, 1, 30, 120),
  ('epic', 4, 'EPIC', '#a855f7', 0.08, 1, 80, 60),
  ('legendary', 5, 'LEGENDARY', '#fbbf24', 0.12, 2, 220, 30),
  ('mythic', 6, 'MYTHIC', '#f43f5e', 0.16, 3, 600, 15),
  ('ultra', 7, 'ULTRA', '#e879f9', 0.2, 4, 1500, 8),
  ('secret', 9, 'SECRET', '#f8fafc', 0.25, 6, 5000, 4),
  ('limited', 8, 'LIMITED', '#fb923c', 0.2, 4, 2000, 0)
on conflict (id) do update set tier = excluded.tier, label = excluded.label, color = excluded.color, steal_penalty = excluded.steal_penalty, steal_extra_seconds = excluded.steal_extra_seconds, xp = excluded.xp, expected_supply = excluded.expected_supply;

insert into game.items (id, name, brand, kind, category, rarity, base_value, base_income, max_supply, tradeable, droppable, event_only, color, accent, flavor, sort) values
  ('nova-starter-tv', 'NOVA 32" Starter TV', 'NOVA', 'tv', 'TECH', 'common', 150, 8, null, false, false, false, '#22d3ee', '#0e7490', 'Everyone starts somewhere. Yours forever.', 0),
  ('volt-pocket-phone', 'VOLT Pocket Phone', 'VOLT', 'phone', 'TECH', 'common', 260, 7, null, true, true, false, '#facc15', '#a16207', '', 1),
  ('nova-40-basic-tv', 'NOVA 40" Basic TV', 'NOVA', 'tv', 'TECH', 'common', 62, 2, null, true, true, false, '#22d3ee', '#0e7490', '', 2),
  ('orbit-snap-cam', 'ORBIT Snap Cam', 'ORBIT', 'camera', 'TECH', 'common', 230, 6, null, true, true, false, '#60a5fa', '#1e40af', '', 3),
  ('pulse-mini-speaker', 'PULSE Mini Speaker', 'PULSE', 'speaker', 'TECH', 'common', 200, 5, null, true, true, false, '#f472b6', '#9d174d', '', 4),
  ('luma-43-smart-tv', 'LUMA 43" Smart TV', 'LUMA', 'tv', 'TECH', 'common', 240, 6, null, true, true, false, '#fdba74', '#c2410c', '', 5),
  ('orbit-32-kitchen-tv', 'ORBIT 32" Kitchen TV', 'ORBIT', 'tv', 'TECH', 'common', 260, 7, null, true, true, false, '#60a5fa', '#1e40af', '', 6),
  ('volt-pad-controller', 'VOLT Pad Controller', 'VOLT', 'controller', 'GAMING', 'common', 79, 2, null, true, true, false, '#facc15', '#a16207', '', 7),
  ('nexus-clicky-keyboard', 'NEXUS Clicky Keyboard', 'NEXUS', 'keyboard', 'GAMING', 'common', 140, 4, null, true, true, false, '#a78bfa', '#5b21b6', '', 8),
  ('apex-24-monitor', 'APEX 24" Monitor', 'APEX', 'monitor', 'GAMING', 'common', 74, 2, null, true, true, false, '#f87171', '#991b1b', '', 9),
  ('kryo-retro-handheld', 'KRYO Retro Handheld', 'KRYO', 'handheld', 'GAMING', 'common', 70, 2, null, true, true, false, '#a5f3fc', '#0369a1', '', 10),
  ('zenith-city-hatch', 'ZENITH City Hatch', 'ZENITH', 'car', 'CARS', 'common', 110, 3, null, true, true, false, '#e2e8f0', '#475569', '', 11),
  ('volt-scoot-e-moped', 'VOLT Scoot-E Moped', 'VOLT', 'motorbike', 'CARS', 'common', 160, 4, null, true, true, false, '#facc15', '#a16207', '', 12),
  ('pulse-dune-buggy', 'PULSE Dune Buggy', 'PULSE', 'car', 'CARS', 'common', 220, 6, null, true, true, false, '#f472b6', '#9d174d', '', 13),
  ('orbit-compact-coupe', 'ORBIT Compact Coupe', 'ORBIT', 'car', 'CARS', 'common', 100, 3, null, true, true, false, '#60a5fa', '#1e40af', '', 14),
  ('vertex-canvas-sneakers', 'VERTEX Canvas Sneakers', 'VERTEX', 'sneakers', 'FASHION', 'common', 98, 2, null, true, true, false, '#a3e635', '#3f6212', '', 15),
  ('luma-logo-cap', 'LUMA Logo Cap', 'LUMA', 'cap', 'FASHION', 'common', 140, 4, null, true, true, false, '#fdba74', '#c2410c', '', 16),
  ('nova-basic-hoodie', 'NOVA Basic Hoodie', 'NOVA', 'hoodie', 'FASHION', 'common', 130, 3, null, true, true, false, '#22d3ee', '#0e7490', '', 17),
  ('orbit-shades', 'ORBIT Shades', 'ORBIT', 'sunglasses', 'FASHION', 'common', 68, 2, null, true, true, false, '#60a5fa', '#1e40af', '', 18),
  ('zenith-steel-watch', 'ZENITH Steel Watch', 'ZENITH', 'luxury_watch', 'LUXURY', 'common', 200, 5, null, true, true, false, '#e2e8f0', '#475569', '', 19),
  ('onyx-silver-chain', 'ONYX Silver Chain', 'ONYX', 'chain', 'LUXURY', 'common', 250, 6, null, true, true, false, '#fbbf24', '#111827', '', 20),
  ('luma-cologne-no-1', 'LUMA Cologne No.1', 'LUMA', 'perfume', 'LUXURY', 'common', 250, 6, null, true, true, false, '#fdba74', '#c2410c', '', 21),
  ('pulse-street-ball', 'PULSE Street Ball', 'PULSE', 'ball', 'SPORTS', 'common', 140, 4, null, true, true, false, '#f472b6', '#9d174d', '', 22),
  ('vertex-cruiser-board', 'VERTEX Cruiser Board', 'VERTEX', 'skateboard', 'SPORTS', 'common', 150, 4, null, true, true, false, '#a3e635', '#3f6212', '', 23),
  ('apex-club-racket', 'APEX Club Racket', 'APEX', 'racket', 'SPORTS', 'common', 120, 3, null, true, true, false, '#f87171', '#991b1b', '', 24),
  ('kryo-trail-bike', 'KRYO Trail Bike', 'KRYO', 'bicycle', 'SPORTS', 'common', 120, 3, null, true, true, false, '#a5f3fc', '#0369a1', '', 25),
  ('nova-55-4k-tv', 'NOVA 55" 4K TV', 'NOVA', 'tv', 'TECH', 'uncommon', 540, 10, null, true, true, false, '#22d3ee', '#0e7490', '', 26),
  ('volt-50-neon-tv', 'VOLT 50" Neon TV', 'VOLT', 'tv', 'TECH', 'uncommon', 750, 14, null, true, true, false, '#facc15', '#a16207', '', 27),
  ('zenith-48-gallery-tv', 'ZENITH 48" Gallery TV', 'ZENITH', 'tv', 'TECH', 'uncommon', 540, 10, null, true, true, false, '#e2e8f0', '#475569', '', 28),
  ('volt-tab-11', 'VOLT Tab 11', 'VOLT', 'tablet', 'TECH', 'uncommon', 470, 9, null, true, true, false, '#facc15', '#a16207', '', 29),
  ('nexus-buds-pro', 'NEXUS Buds Pro', 'NEXUS', 'headphones', 'TECH', 'uncommon', 680, 12, null, true, true, false, '#a78bfa', '#5b21b6', '', 30),
  ('orbit-air-laptop', 'ORBIT Air Laptop', 'ORBIT', 'laptop', 'TECH', 'uncommon', 640, 12, null, true, true, false, '#60a5fa', '#1e40af', '', 31),
  ('nexus-fit-watch', 'NEXUS Fit Watch', 'NEXUS', 'smartwatch', 'TECH', 'uncommon', 790, 14, null, true, true, false, '#a78bfa', '#5b21b6', '', 32),
  ('apex-27-gaming-monitor', 'APEX 27" Gaming Monitor', 'APEX', 'monitor', 'GAMING', 'uncommon', 820, 15, null, true, true, false, '#f87171', '#991b1b', '', 33),
  ('volt-switchback-console', 'VOLT Switchback Console', 'VOLT', 'console', 'GAMING', 'uncommon', 410, 7, null, true, true, false, '#facc15', '#a16207', '', 34),
  ('kryo-rgb-keyboard', 'KRYO RGB Keyboard', 'KRYO', 'keyboard', 'GAMING', 'uncommon', 590, 11, null, true, true, false, '#a5f3fc', '#0369a1', '', 35),
  ('nexus-pro-controller', 'NEXUS Pro Controller', 'NEXUS', 'controller', 'GAMING', 'uncommon', 430, 8, null, true, true, false, '#a78bfa', '#5b21b6', '', 36),
  ('volt-e-hatch', 'VOLT E-Hatch', 'VOLT', 'car', 'CARS', 'uncommon', 920, 17, null, true, true, false, '#facc15', '#a16207', '', 37),
  ('apex-street-bike', 'APEX Street Bike', 'APEX', 'motorbike', 'CARS', 'uncommon', 460, 8, null, true, true, false, '#f87171', '#991b1b', '', 38),
  ('zenith-sport-coupe', 'ZENITH Sport Coupe', 'ZENITH', 'sports_car', 'CARS', 'uncommon', 420, 8, null, true, true, false, '#e2e8f0', '#475569', '', 39),
  ('kryo-puffer-jacket', 'KRYO Puffer Jacket', 'KRYO', 'jacket', 'FASHION', 'uncommon', 530, 10, null, true, true, false, '#a5f3fc', '#0369a1', '', 40),
  ('vertex-runner-sneakers', 'VERTEX Runner Sneakers', 'VERTEX', 'sneakers', 'FASHION', 'uncommon', 920, 17, null, true, true, false, '#a3e635', '#3f6212', '', 41),
  ('orbit-tech-backpack', 'ORBIT Tech Backpack', 'ORBIT', 'backpack', 'FASHION', 'uncommon', 720, 13, null, true, true, false, '#60a5fa', '#1e40af', '', 42),
  ('pulse-snapback', 'PULSE Snapback', 'PULSE', 'cap', 'FASHION', 'uncommon', 550, 10, null, true, true, false, '#f472b6', '#9d174d', '', 43),
  ('zenith-gold-tone-watch', 'ZENITH Gold-Tone Watch', 'ZENITH', 'luxury_watch', 'LUXURY', 'uncommon', 590, 11, null, true, true, false, '#e2e8f0', '#475569', '', 44),
  ('onyx-signet-ring', 'ONYX Signet Ring', 'ONYX', 'ring', 'LUXURY', 'uncommon', 570, 10, null, true, true, false, '#fbbf24', '#111827', '', 45),
  ('luma-eau-de-neon', 'LUMA Eau de Neon', 'LUMA', 'perfume', 'LUXURY', 'uncommon', 690, 13, null, true, true, false, '#fdba74', '#c2410c', '', 46),
  ('apex-pro-football', 'APEX Pro Football', 'APEX', 'ball', 'SPORTS', 'uncommon', 670, 12, null, true, true, false, '#f87171', '#991b1b', '', 47),
  ('pulse-carbon-racket', 'PULSE Carbon Racket', 'PULSE', 'racket', 'SPORTS', 'uncommon', 420, 8, null, true, true, false, '#f472b6', '#9d174d', '', 48),
  ('vertex-park-skateboard', 'VERTEX Park Skateboard', 'VERTEX', 'skateboard', 'SPORTS', 'uncommon', 920, 17, null, true, true, false, '#a3e635', '#3f6212', '', 49),
  ('kryo-surfboard', 'KRYO Surfboard', 'KRYO', 'surfboard', 'SPORTS', 'uncommon', 520, 9, null, true, true, false, '#a5f3fc', '#0369a1', '', 50),
  ('nova-65-qled-tv', 'NOVA 65" QLED TV', 'NOVA', 'tv', 'TECH', 'rare', 4800, 69, null, true, true, false, '#22d3ee', '#0e7490', '', 51),
  ('luma-58-frame-tv', 'LUMA 58" Frame TV', 'LUMA', 'tv', 'TECH', 'rare', 4200, 60, null, true, true, false, '#fdba74', '#c2410c', '', 52),
  ('quantum-fold-phone', 'QUANTUM Fold Phone', 'QUANTUM', 'phone', 'TECH', 'rare', 5200, 74, null, true, true, false, '#2dd4bf', '#a21caf', '', 53),
  ('orbit-mirrorless-cam', 'ORBIT Mirrorless Cam', 'ORBIT', 'camera', 'TECH', 'rare', 2700, 39, null, true, true, false, '#60a5fa', '#1e40af', '', 54),
  ('pulse-tower-speaker', 'PULSE Tower Speaker', 'PULSE', 'speaker', 'TECH', 'rare', 2200, 31, null, true, true, false, '#f472b6', '#9d174d', '', 55),
  ('nexus-gaming-laptop', 'NEXUS Gaming Laptop', 'NEXUS', 'laptop', 'GAMING', 'rare', 5600, 80, null, true, true, false, '#a78bfa', '#5b21b6', '', 56),
  ('apex-titan-gpu', 'APEX Titan GPU', 'APEX', 'gpu', 'GAMING', 'rare', 6000, 86, null, true, true, false, '#f87171', '#991b1b', '', 57),
  ('volt-vr-lite', 'VOLT VR Lite', 'VOLT', 'vr_headset', 'GAMING', 'rare', 2700, 39, null, true, true, false, '#facc15', '#a16207', '', 58),
  ('quantum-handheld-x', 'QUANTUM Handheld X', 'QUANTUM', 'handheld', 'GAMING', 'rare', 3400, 49, null, true, true, false, '#2dd4bf', '#a21caf', '', 59),
  ('apex-roadster', 'APEX Roadster', 'APEX', 'sports_car', 'CARS', 'rare', 4800, 69, null, true, true, false, '#f87171', '#991b1b', '', 60),
  ('zenith-electric-suv', 'ZENITH Electric SUV', 'ZENITH', 'suv', 'CARS', 'rare', 3500, 50, null, true, true, false, '#e2e8f0', '#475569', '', 61),
  ('volt-cafe-racer', 'VOLT Cafe Racer', 'VOLT', 'motorbike', 'CARS', 'rare', 2200, 31, null, true, true, false, '#facc15', '#a16207', '', 62),
  ('vertex-hi-top-sneakers', 'VERTEX Hi-Top Sneakers', 'VERTEX', 'sneakers', 'FASHION', 'rare', 5500, 79, null, true, true, false, '#a3e635', '#3f6212', '', 63),
  ('nova-reflective-jacket', 'NOVA Reflective Jacket', 'NOVA', 'jacket', 'FASHION', 'rare', 3600, 51, null, true, true, false, '#22d3ee', '#0e7490', '', 64),
  ('onyx-designer-shades', 'ONYX Designer Shades', 'ONYX', 'sunglasses', 'FASHION', 'rare', 4600, 66, null, true, true, false, '#fbbf24', '#111827', '', 65),
  ('zenith-diver-watch', 'ZENITH Diver Watch', 'ZENITH', 'luxury_watch', 'LUXURY', 'rare', 2500, 36, null, true, true, false, '#e2e8f0', '#475569', '', 66),
  ('onyx-gold-chain', 'ONYX Gold Chain', 'ONYX', 'chain', 'LUXURY', 'rare', 3500, 50, null, true, true, false, '#fbbf24', '#111827', '', 67),
  ('luma-crystal-perfume', 'LUMA Crystal Perfume', 'LUMA', 'perfume', 'LUXURY', 'rare', 4800, 69, null, true, true, false, '#fdba74', '#c2410c', '', 68),
  ('pulse-pro-road-bike', 'PULSE Pro Road Bike', 'PULSE', 'bicycle', 'SPORTS', 'rare', 5500, 79, null, true, true, false, '#f472b6', '#9d174d', '', 69),
  ('apex-golf-driver', 'APEX Golf Driver', 'APEX', 'golf', 'SPORTS', 'rare', 4400, 63, null, true, true, false, '#f87171', '#991b1b', '', 70),
  ('kryo-pro-surfboard', 'KRYO Pro Surfboard', 'KRYO', 'surfboard', 'SPORTS', 'rare', 6300, 90, null, true, true, false, '#a5f3fc', '#0369a1', '', 71),
  ('vertex-signature-deck', 'VERTEX Signature Deck', 'VERTEX', 'skateboard', 'SPORTS', 'rare', 3200, 46, null, true, true, false, '#a3e635', '#3f6212', '', 72),
  ('nova-75-oled-tv', 'NOVA 75" OLED TV', 'NOVA', 'tv', 'TECH', 'epic', 15000, 180, null, true, true, false, '#22d3ee', '#0e7490', '', 73),
  ('luma-77-theater-tv', 'LUMA 77" Theater TV', 'LUMA', 'tv', 'TECH', 'epic', 32000, 380, null, true, true, false, '#fdba74', '#c2410c', '', 74),
  ('quantum-pro-phone', 'QUANTUM Pro Phone', 'QUANTUM', 'phone', 'TECH', 'epic', 21000, 250, null, true, true, false, '#2dd4bf', '#a21caf', '', 75),
  ('orbit-cinema-tablet', 'ORBIT Cinema Tablet', 'ORBIT', 'tablet', 'TECH', 'epic', 20000, 240, null, true, true, false, '#60a5fa', '#1e40af', '', 76),
  ('nexus-studio-headphones', 'NEXUS Studio Headphones', 'NEXUS', 'headphones', 'TECH', 'epic', 47000, 550, null, true, true, false, '#a78bfa', '#5b21b6', '', 77),
  ('nexus-epic-gaming-pc', 'NEXUS Epic Gaming PC', 'NEXUS', 'gaming_pc', 'GAMING', 'epic', 16000, 190, null, true, true, false, '#a78bfa', '#5b21b6', '', 78),
  ('apex-49-ultrawide', 'APEX 49" Ultrawide', 'APEX', 'monitor', 'GAMING', 'epic', 24000, 280, null, true, true, false, '#f87171', '#991b1b', '', 79),
  ('volt-elite-controller', 'VOLT Elite Controller', 'VOLT', 'controller', 'GAMING', 'epic', 38000, 450, null, true, true, false, '#facc15', '#a16207', '', 80),
  ('kryo-liquid-gpu', 'KRYO Liquid GPU', 'KRYO', 'gpu', 'GAMING', 'epic', 15000, 180, null, true, true, false, '#a5f3fc', '#0369a1', '', 81),
  ('apex-gt-coupe', 'APEX GT Coupe', 'APEX', 'sports_car', 'CARS', 'epic', 20000, 240, null, true, true, false, '#f87171', '#991b1b', '', 82),
  ('zenith-luxury-suv', 'ZENITH Luxury SUV', 'ZENITH', 'suv', 'CARS', 'epic', 29000, 340, null, true, true, false, '#e2e8f0', '#475569', '', 83),
  ('volt-superbike', 'VOLT Superbike', 'VOLT', 'motorbike', 'CARS', 'epic', 23000, 270, null, true, true, false, '#facc15', '#a16207', '', 84),
  ('vertex-glow-sneakers', 'VERTEX Glow Sneakers', 'VERTEX', 'sneakers', 'FASHION', 'epic', 30000, 350, null, true, true, false, '#a3e635', '#3f6212', '', 85),
  ('kryo-designer-parka', 'KRYO Designer Parka', 'KRYO', 'jacket', 'FASHION', 'epic', 16000, 190, null, true, true, false, '#a5f3fc', '#0369a1', '', 86),
  ('zenith-chronograph', 'ZENITH Chronograph', 'ZENITH', 'luxury_watch', 'LUXURY', 'epic', 37000, 440, null, true, true, false, '#e2e8f0', '#475569', '', 87),
  ('onyx-diamond-studs', 'ONYX Diamond Studs', 'ONYX', 'diamond', 'LUXURY', 'epic', 26000, 310, null, true, true, false, '#fbbf24', '#111827', '', 88),
  ('luma-parfum-royale', 'LUMA Parfum Royale', 'LUMA', 'perfume', 'LUXURY', 'epic', 24000, 280, null, true, true, false, '#fdba74', '#c2410c', '', 89),
  ('pulse-carbon-race-bike', 'PULSE Carbon Race Bike', 'PULSE', 'bicycle', 'SPORTS', 'epic', 32000, 380, null, true, true, false, '#f472b6', '#9d174d', '', 90),
  ('apex-signature-ball', 'APEX Signature Ball', 'APEX', 'ball', 'SPORTS', 'epic', 43000, 510, null, true, true, false, '#f87171', '#991b1b', '', 91),
  ('kryo-pro-golf-set', 'KRYO Pro Golf Set', 'KRYO', 'golf', 'SPORTS', 'epic', 24000, 280, null, true, true, false, '#a5f3fc', '#0369a1', '', 92),
  ('quantum-oled-85', 'QUANTUM OLED 85"', 'QUANTUM', 'tv', 'TECH', 'legendary', 120000, 1100, null, true, true, false, '#2dd4bf', '#a21caf', '', 93),
  ('nova-pro-camera-rig', 'NOVA Pro Camera Rig', 'NOVA', 'camera', 'TECH', 'legendary', 150000, 1400, null, true, true, false, '#22d3ee', '#0e7490', '', 94),
  ('orbit-sky-drone', 'ORBIT Sky Drone', 'ORBIT', 'drone', 'TECH', 'legendary', 160000, 1500, null, true, true, false, '#60a5fa', '#1e40af', '', 95),
  ('nexus-legendary-gaming-pc', 'NEXUS Legendary Gaming PC', 'NEXUS', 'gaming_pc', 'GAMING', 'legendary', 140000, 1300, null, true, true, false, '#a78bfa', '#5b21b6', '', 96),
  ('volt-pro-console-elite', 'VOLT Pro Console Elite', 'VOLT', 'console', 'GAMING', 'legendary', 260000, 2500, null, true, true, false, '#facc15', '#a16207', '', 97),
  ('apex-4k-240hz-monitor', 'APEX 4K 240Hz Monitor', 'APEX', 'monitor', 'GAMING', 'legendary', 170000, 1600, null, true, true, false, '#f87171', '#991b1b', '', 98),
  ('apex-supercar-s', 'APEX Supercar S', 'APEX', 'supercar', 'CARS', 'legendary', 230000, 2200, null, true, true, false, '#f87171', '#991b1b', '', 99),
  ('zenith-grand-tourer', 'ZENITH Grand Tourer', 'ZENITH', 'sports_car', 'CARS', 'legendary', 110000, 1000, null, true, true, false, '#e2e8f0', '#475569', '', 100),
  ('volt-track-bike', 'VOLT Track Bike', 'VOLT', 'motorbike', 'CARS', 'legendary', 100000, 950, null, true, true, false, '#facc15', '#a16207', '', 101),
  ('vertex-golden-kicks', 'VERTEX Golden Kicks', 'VERTEX', 'sneakers', 'FASHION', 'legendary', 200000, 1900, null, true, true, false, '#a3e635', '#3f6212', '', 102),
  ('onyx-couture-jacket', 'ONYX Couture Jacket', 'ONYX', 'jacket', 'FASHION', 'legendary', 130000, 1200, null, true, true, false, '#fbbf24', '#111827', '', 103),
  ('nova-holo-backpack', 'NOVA Holo Backpack', 'NOVA', 'backpack', 'FASHION', 'legendary', 170000, 1600, null, true, true, false, '#22d3ee', '#0e7490', '', 104),
  ('zenith-tourbillon', 'ZENITH Tourbillon', 'ZENITH', 'luxury_watch', 'LUXURY', 'legendary', 310000, 3000, null, true, true, false, '#e2e8f0', '#475569', '', 105),
  ('onyx-diamond-chain', 'ONYX Diamond Chain', 'ONYX', 'chain', 'LUXURY', 'legendary', 100000, 950, null, true, true, false, '#fbbf24', '#111827', '', 106),
  ('luma-gold-bar-set', 'LUMA Gold Bar Set', 'LUMA', 'gold_bar', 'LUXURY', 'legendary', 110000, 1000, null, true, true, false, '#fdba74', '#c2410c', '', 107),
  ('pulse-championship-ball', 'PULSE Championship Ball', 'PULSE', 'ball', 'SPORTS', 'legendary', 310000, 3000, null, true, true, false, '#f472b6', '#9d174d', '', 108),
  ('kryo-titanium-bike', 'KRYO Titanium Bike', 'KRYO', 'bicycle', 'SPORTS', 'legendary', 270000, 2600, null, true, true, false, '#a5f3fc', '#0369a1', '', 109),
  ('apex-golden-racket', 'APEX Golden Racket', 'APEX', 'racket', 'SPORTS', 'legendary', 140000, 1300, null, true, true, false, '#f87171', '#991b1b', '', 110),
  ('nova-ultra-oled-98', 'NOVA Ultra OLED 98"', 'NOVA', 'tv', 'TECH', 'mythic', 1700000, 14000, null, true, true, false, '#22d3ee', '#0e7490', '', 111),
  ('quantum-fold-x-phone', 'QUANTUM Fold X Phone', 'QUANTUM', 'phone', 'TECH', 'mythic', 1700000, 14000, null, true, true, false, '#2dd4bf', '#a21caf', '', 112),
  ('orbit-cinema-cam-12k', 'ORBIT Cinema Cam 12K', 'ORBIT', 'camera', 'TECH', 'mythic', 1100000, 8800, null, true, true, false, '#60a5fa', '#1e40af', '', 113),
  ('quantum-gaming-pc', 'QUANTUM Gaming PC', 'QUANTUM', 'gaming_pc', 'GAMING', 'mythic', 1500000, 12000, null, true, true, false, '#2dd4bf', '#a21caf', '', 114),
  ('nexus-command-center', 'NEXUS Command Center', 'NEXUS', 'gaming_setup', 'GAMING', 'mythic', 760000, 6100, null, true, true, false, '#a78bfa', '#5b21b6', '', 115),
  ('volt-phantom-controller', 'VOLT Phantom Controller', 'VOLT', 'controller', 'GAMING', 'mythic', 1300000, 10000, null, true, true, false, '#facc15', '#a16207', '', 116),
  ('apex-gt-supercar', 'APEX GT Supercar', 'APEX', 'supercar', 'CARS', 'mythic', 690000, 5500, null, true, true, false, '#f87171', '#991b1b', '', 117),
  ('zenith-hyper-gt', 'ZENITH Hyper GT', 'ZENITH', 'hypercar', 'CARS', 'mythic', 1100000, 8800, null, true, true, false, '#e2e8f0', '#475569', '', 118),
  ('vertex-aurora-jacket', 'VERTEX Aurora Jacket', 'VERTEX', 'jacket', 'FASHION', 'mythic', 740000, 5900, null, true, true, false, '#a3e635', '#3f6212', '', 119),
  ('kryo-crystal-sneakers', 'KRYO Crystal Sneakers', 'KRYO', 'sneakers', 'FASHION', 'mythic', 750000, 6000, null, true, true, false, '#a5f3fc', '#0369a1', '', 120),
  ('zenith-skeleton-watch', 'ZENITH Skeleton Watch', 'ZENITH', 'luxury_watch', 'LUXURY', 'mythic', 1200000, 9600, null, true, true, false, '#e2e8f0', '#475569', '', 121),
  ('onyx-emerald-diamond', 'ONYX Emerald Diamond', 'ONYX', 'diamond', 'LUXURY', 'mythic', 890000, 7100, null, true, true, false, '#fbbf24', '#111827', '', 122),
  ('kryo-hoverboard', 'KRYO Hoverboard', 'KRYO', 'skateboard', 'SPORTS', 'mythic', 1600000, 13000, null, true, true, false, '#a5f3fc', '#0369a1', '', 123),
  ('pulse-golden-trophy', 'PULSE Golden Trophy', 'PULSE', 'trophy', 'SPORTS', 'mythic', 1400000, 11000, null, true, true, false, '#f472b6', '#9d174d', '', 124),
  ('quantum-holo-wall-150', 'QUANTUM Holo Wall 150"', 'QUANTUM', 'tv', 'TECH', 'ultra', 11000000, 76000, null, true, true, false, '#2dd4bf', '#a21caf', '', 125),
  ('nova-stratos-drone', 'NOVA Stratos Drone', 'NOVA', 'drone', 'TECH', 'ultra', 14000000, 97000, null, true, true, false, '#22d3ee', '#0e7490', '', 126),
  ('nexus-titan-rig-x', 'NEXUS Titan Rig X', 'NEXUS', 'gaming_pc', 'GAMING', 'ultra', 11000000, 76000, null, true, true, false, '#a78bfa', '#5b21b6', '', 127),
  ('volt-aurora-vr-pro', 'VOLT Aurora VR Pro', 'VOLT', 'vr_headset', 'GAMING', 'ultra', 15000000, 100000, null, true, true, false, '#facc15', '#a16207', '', 128),
  ('kryo-frostbite-gpu', 'KRYO Frostbite GPU', 'KRYO', 'gpu', 'GAMING', 'ultra', 7700000, 53000, null, true, true, false, '#a5f3fc', '#0369a1', '', 129),
  ('apex-vortex-hypercar', 'APEX Vortex Hypercar', 'APEX', 'hypercar', 'CARS', 'ultra', 8800000, 61000, null, true, true, false, '#f87171', '#991b1b', '', 130),
  ('pulse-neon-superbike', 'PULSE Neon Superbike', 'PULSE', 'motorbike', 'CARS', 'ultra', 9800000, 68000, null, true, true, false, '#f472b6', '#9d174d', '', 131),
  ('vertex-diamond-kicks', 'VERTEX Diamond Kicks', 'VERTEX', 'sneakers', 'FASHION', 'ultra', 10000000, 69000, null, true, true, false, '#a3e635', '#3f6212', '', 132),
  ('zenith-royal-tourbillon', 'ZENITH Royal Tourbillon', 'ZENITH', 'luxury_watch', 'LUXURY', 'ultra', 13000000, 90000, null, true, true, false, '#e2e8f0', '#475569', '', 133),
  ('onyx-crown-chain', 'ONYX Crown Chain', 'ONYX', 'chain', 'LUXURY', 'ultra', 7900000, 54000, null, true, true, false, '#fbbf24', '#111827', '', 134),
  ('pulse-platinum-trophy', 'PULSE Platinum Trophy', 'PULSE', 'trophy', 'SPORTS', 'ultra', 6500000, 45000, null, true, true, false, '#f472b6', '#9d174d', '', 135),
  ('quantum-120-void-oled', 'QUANTUM 120" VOID OLED', 'QUANTUM', 'tv', 'TECH', 'secret', 95000000, 560000, 10, true, true, false, '#2dd4bf', '#a21caf', 'A screen so black it swallows light. Ten were ever made.', 136),
  ('zero-lag-future-phone', 'ZERO-LAG FUTURE PHONE', 'APEX', 'phone', 'TECH', 'secret', 48000000, 280000, 10, true, true, false, '#f87171', '#991b1b', 'Replies before you finish typing.', 137),
  ('nova-hyper-display', 'NOVA HYPER DISPLAY', 'NOVA', 'monitor', 'GAMING', 'secret', 62000000, 360000, 10, true, true, false, '#22d3ee', '#0e7490', 'Refresh rate: yes.', 138),
  ('infinite-gaming-setup', 'INFINITE GAMING SETUP', 'NEXUS', 'gaming_setup', 'GAMING', 'secret', 120000000, 710000, 10, true, true, false, '#a78bfa', '#5b21b6', 'The final form of the battlestation.', 139),
  ('phantom-prototype-console', 'PHANTOM PROTOTYPE CONSOLE', 'VOLT', 'console', 'GAMING', 'secret', 72000000, 420000, 10, true, true, false, '#facc15', '#a16207', 'Never announced. Never released. Somehow here.', 140),
  ('zenith-eclipse-hypercar', 'ZENITH ECLIPSE HYPERCAR', 'ZENITH', 'hypercar', 'CARS', 'secret', 125000000, 740000, 5, true, true, false, '#e2e8f0', '#475569', 'Only five exist. It is very fast and very stealable.', 141),
  ('onyx-singularity-diamond', 'ONYX SINGULARITY DIAMOND', 'ONYX', 'diamond', 'LUXURY', 'secret', 110000000, 650000, 5, true, true, false, '#fbbf24', '#111827', 'Heavier than it should be.', 142),
  ('kryo-zero-g-sneakers', 'KRYO ZERO-G SNEAKERS', 'KRYO', 'sneakers', 'FASHION', 'secret', 40000000, 240000, 10, true, true, false, '#a5f3fc', '#0369a1', 'Laces optional. Gravity optional.', 143),
  ('pulse-infinity-ball', 'PULSE INFINITY BALL', 'PULSE', 'ball', 'SPORTS', 'secret', 38000000, 220000, 10, true, true, false, '#f472b6', '#9d174d', 'Never lands out.', 144),
  ('phantom-tv', 'PHANTOM TV', 'NOVA', 'tv', 'TECH', 'limited', 2600000, 18000, 100, true, true, false, '#22d3ee', '#0e7490', 'Limited run of 100. Look for the serial.', 145),
  ('volt-aurora-console-ltd', 'VOLT Aurora Console LTD', 'VOLT', 'console', 'GAMING', 'limited', 1600000, 11000, 250, true, true, false, '#facc15', '#a16207', '', 146),
  ('quantum-founders-gpu', 'QUANTUM Founders GPU', 'QUANTUM', 'gpu', 'GAMING', 'limited', 6200000, 43000, 75, true, true, false, '#2dd4bf', '#a21caf', '', 147),
  ('apex-midnight-hypercar', 'APEX Midnight Hypercar', 'APEX', 'hypercar', 'CARS', 'limited', 42000000, 290000, 25, true, true, false, '#f87171', '#991b1b', '', 148),
  ('zenith-chrono-gold-ltd', 'ZENITH Chrono Gold LTD', 'ZENITH', 'luxury_watch', 'LUXURY', 'limited', 12500000, 86000, 50, true, true, false, '#e2e8f0', '#475569', '', 149),
  ('vertex-genesis-sneakers', 'VERTEX Genesis Sneakers', 'VERTEX', 'sneakers', 'FASHION', 'limited', 2100000, 14000, 150, true, true, false, '#a3e635', '#3f6212', '', 150),
  ('orbit-moonshot-drone', 'ORBIT Moonshot Drone', 'ORBIT', 'drone', 'TECH', 'limited', 3100000, 21000, 120, true, true, false, '#60a5fa', '#1e40af', '', 151),
  ('pulse-26-championship-trophy', 'PULSE ''26 Championship Trophy', 'PULSE', 'trophy', 'SPORTS', 'limited', 8400000, 58000, 60, true, true, false, '#f472b6', '#9d174d', '', 152),
  ('nova-festival-headset', 'NOVA Festival Headset', 'NOVA', 'headphones', 'GAMING', 'epic', 21000, 250, null, true, false, true, '#22d3ee', '#0e7490', '', 153),
  ('apex-rally-kart', 'APEX Rally Kart', 'APEX', 'car', 'CARS', 'epic', 47000, 550, null, true, false, true, '#f87171', '#991b1b', '', 154),
  ('vertex-hype-hoodie', 'VERTEX Hype Hoodie', 'VERTEX', 'hoodie', 'FASHION', 'epic', 29000, 340, null, true, false, true, '#a3e635', '#3f6212', '', 155),
  ('volt-streak-hoverboard', 'VOLT Streak Hoverboard', 'VOLT', 'skateboard', 'SPORTS', 'legendary', 190000, 1800, null, true, false, true, '#facc15', '#a16207', '', 156),
  ('zenith-gala-watch', 'ZENITH Gala Watch', 'ZENITH', 'luxury_watch', 'LUXURY', 'legendary', 190000, 1800, null, true, false, true, '#e2e8f0', '#475569', '', 157),
  ('quantum-boom-box', 'QUANTUM Boom Box', 'QUANTUM', 'speaker', 'TECH', 'legendary', 140000, 1300, null, true, false, true, '#2dd4bf', '#a21caf', '', 158)
on conflict (id) do update set name = excluded.name, brand = excluded.brand, kind = excluded.kind, category = excluded.category, rarity = excluded.rarity, base_value = excluded.base_value, base_income = excluded.base_income, max_supply = excluded.max_supply, tradeable = excluded.tradeable, droppable = excluded.droppable, event_only = excluded.event_only, color = excluded.color, accent = excluded.accent, flavor = excluded.flavor, sort = excluded.sort;

insert into game.limited_item_supply (item_id, max_supply) values
  ('quantum-120-void-oled', 10),
  ('zero-lag-future-phone', 10),
  ('nova-hyper-display', 10),
  ('infinite-gaming-setup', 10),
  ('phantom-prototype-console', 10),
  ('zenith-eclipse-hypercar', 5),
  ('onyx-singularity-diamond', 5),
  ('kryo-zero-g-sneakers', 10),
  ('pulse-infinity-ball', 10),
  ('phantom-tv', 100),
  ('volt-aurora-console-ltd', 250),
  ('quantum-founders-gpu', 75),
  ('apex-midnight-hypercar', 25),
  ('zenith-chrono-gold-ltd', 50),
  ('vertex-genesis-sneakers', 150),
  ('orbit-moonshot-drone', 120),
  ('pulse-26-championship-trophy', 60)
on conflict (item_id) do update set max_supply = excluded.max_supply;

insert into game.market_state (item_id, price, demand) values
  ('nova-starter-tv', 150, 50),
  ('volt-pocket-phone', 260, 50),
  ('nova-40-basic-tv', 62, 50),
  ('orbit-snap-cam', 230, 50),
  ('pulse-mini-speaker', 200, 50),
  ('luma-43-smart-tv', 240, 50),
  ('orbit-32-kitchen-tv', 260, 50),
  ('volt-pad-controller', 79, 50),
  ('nexus-clicky-keyboard', 140, 50),
  ('apex-24-monitor', 74, 50),
  ('kryo-retro-handheld', 70, 50),
  ('zenith-city-hatch', 110, 50),
  ('volt-scoot-e-moped', 160, 50),
  ('pulse-dune-buggy', 220, 50),
  ('orbit-compact-coupe', 100, 50),
  ('vertex-canvas-sneakers', 98, 50),
  ('luma-logo-cap', 140, 50),
  ('nova-basic-hoodie', 130, 50),
  ('orbit-shades', 68, 50),
  ('zenith-steel-watch', 200, 50),
  ('onyx-silver-chain', 250, 50),
  ('luma-cologne-no-1', 250, 50),
  ('pulse-street-ball', 140, 50),
  ('vertex-cruiser-board', 150, 50),
  ('apex-club-racket', 120, 50),
  ('kryo-trail-bike', 120, 50),
  ('nova-55-4k-tv', 540, 50),
  ('volt-50-neon-tv', 750, 50),
  ('zenith-48-gallery-tv', 540, 50),
  ('volt-tab-11', 470, 50),
  ('nexus-buds-pro', 680, 50),
  ('orbit-air-laptop', 640, 50),
  ('nexus-fit-watch', 790, 50),
  ('apex-27-gaming-monitor', 820, 50),
  ('volt-switchback-console', 410, 50),
  ('kryo-rgb-keyboard', 590, 50),
  ('nexus-pro-controller', 430, 50),
  ('volt-e-hatch', 920, 50),
  ('apex-street-bike', 460, 50),
  ('zenith-sport-coupe', 420, 50),
  ('kryo-puffer-jacket', 530, 50),
  ('vertex-runner-sneakers', 920, 50),
  ('orbit-tech-backpack', 720, 50),
  ('pulse-snapback', 550, 50),
  ('zenith-gold-tone-watch', 590, 50),
  ('onyx-signet-ring', 570, 50),
  ('luma-eau-de-neon', 690, 50),
  ('apex-pro-football', 670, 50),
  ('pulse-carbon-racket', 420, 50),
  ('vertex-park-skateboard', 920, 50),
  ('kryo-surfboard', 520, 50),
  ('nova-65-qled-tv', 4800, 50),
  ('luma-58-frame-tv', 4200, 50),
  ('quantum-fold-phone', 5200, 50),
  ('orbit-mirrorless-cam', 2700, 50),
  ('pulse-tower-speaker', 2200, 50),
  ('nexus-gaming-laptop', 5600, 50),
  ('apex-titan-gpu', 6000, 50),
  ('volt-vr-lite', 2700, 50),
  ('quantum-handheld-x', 3400, 50),
  ('apex-roadster', 4800, 50),
  ('zenith-electric-suv', 3500, 50),
  ('volt-cafe-racer', 2200, 50),
  ('vertex-hi-top-sneakers', 5500, 50),
  ('nova-reflective-jacket', 3600, 50),
  ('onyx-designer-shades', 4600, 50),
  ('zenith-diver-watch', 2500, 50),
  ('onyx-gold-chain', 3500, 50),
  ('luma-crystal-perfume', 4800, 50),
  ('pulse-pro-road-bike', 5500, 50),
  ('apex-golf-driver', 4400, 50),
  ('kryo-pro-surfboard', 6300, 50),
  ('vertex-signature-deck', 3200, 50),
  ('nova-75-oled-tv', 15000, 50),
  ('luma-77-theater-tv', 32000, 50),
  ('quantum-pro-phone', 21000, 50),
  ('orbit-cinema-tablet', 20000, 50),
  ('nexus-studio-headphones', 47000, 50),
  ('nexus-epic-gaming-pc', 16000, 50),
  ('apex-49-ultrawide', 24000, 50),
  ('volt-elite-controller', 38000, 50),
  ('kryo-liquid-gpu', 15000, 50),
  ('apex-gt-coupe', 20000, 50),
  ('zenith-luxury-suv', 29000, 50),
  ('volt-superbike', 23000, 50),
  ('vertex-glow-sneakers', 30000, 50),
  ('kryo-designer-parka', 16000, 50),
  ('zenith-chronograph', 37000, 50),
  ('onyx-diamond-studs', 26000, 50),
  ('luma-parfum-royale', 24000, 50),
  ('pulse-carbon-race-bike', 32000, 50),
  ('apex-signature-ball', 43000, 50),
  ('kryo-pro-golf-set', 24000, 50),
  ('quantum-oled-85', 120000, 50),
  ('nova-pro-camera-rig', 150000, 50),
  ('orbit-sky-drone', 160000, 50),
  ('nexus-legendary-gaming-pc', 140000, 50),
  ('volt-pro-console-elite', 260000, 50),
  ('apex-4k-240hz-monitor', 170000, 50),
  ('apex-supercar-s', 230000, 50),
  ('zenith-grand-tourer', 110000, 50),
  ('volt-track-bike', 100000, 50),
  ('vertex-golden-kicks', 200000, 50),
  ('onyx-couture-jacket', 130000, 50),
  ('nova-holo-backpack', 170000, 50),
  ('zenith-tourbillon', 310000, 50),
  ('onyx-diamond-chain', 100000, 50),
  ('luma-gold-bar-set', 110000, 50),
  ('pulse-championship-ball', 310000, 50),
  ('kryo-titanium-bike', 270000, 50),
  ('apex-golden-racket', 140000, 50),
  ('nova-ultra-oled-98', 1700000, 50),
  ('quantum-fold-x-phone', 1700000, 50),
  ('orbit-cinema-cam-12k', 1100000, 50),
  ('quantum-gaming-pc', 1500000, 50),
  ('nexus-command-center', 760000, 50),
  ('volt-phantom-controller', 1300000, 50),
  ('apex-gt-supercar', 690000, 50),
  ('zenith-hyper-gt', 1100000, 50),
  ('vertex-aurora-jacket', 740000, 50),
  ('kryo-crystal-sneakers', 750000, 50),
  ('zenith-skeleton-watch', 1200000, 50),
  ('onyx-emerald-diamond', 890000, 50),
  ('kryo-hoverboard', 1600000, 50),
  ('pulse-golden-trophy', 1400000, 50),
  ('quantum-holo-wall-150', 11000000, 50),
  ('nova-stratos-drone', 14000000, 50),
  ('nexus-titan-rig-x', 11000000, 50),
  ('volt-aurora-vr-pro', 15000000, 50),
  ('kryo-frostbite-gpu', 7700000, 50),
  ('apex-vortex-hypercar', 8800000, 50),
  ('pulse-neon-superbike', 9800000, 50),
  ('vertex-diamond-kicks', 10000000, 50),
  ('zenith-royal-tourbillon', 13000000, 50),
  ('onyx-crown-chain', 7900000, 50),
  ('pulse-platinum-trophy', 6500000, 50),
  ('quantum-120-void-oled', 95000000, 50),
  ('zero-lag-future-phone', 48000000, 50),
  ('nova-hyper-display', 62000000, 50),
  ('infinite-gaming-setup', 120000000, 50),
  ('phantom-prototype-console', 72000000, 50),
  ('zenith-eclipse-hypercar', 125000000, 50),
  ('onyx-singularity-diamond', 110000000, 50),
  ('kryo-zero-g-sneakers', 40000000, 50),
  ('pulse-infinity-ball', 38000000, 50),
  ('phantom-tv', 2600000, 50),
  ('volt-aurora-console-ltd', 1600000, 50),
  ('quantum-founders-gpu', 6200000, 50),
  ('apex-midnight-hypercar', 42000000, 50),
  ('zenith-chrono-gold-ltd', 12500000, 50),
  ('vertex-genesis-sneakers', 2100000, 50),
  ('orbit-moonshot-drone', 3100000, 50),
  ('pulse-26-championship-trophy', 8400000, 50),
  ('nova-festival-headset', 21000, 50),
  ('apex-rally-kart', 47000, 50),
  ('vertex-hype-hoodie', 29000, 50),
  ('volt-streak-hoverboard', 190000, 50),
  ('zenith-gala-watch', 190000, 50),
  ('quantum-boom-box', 140000, 50)
on conflict (item_id) do nothing;

insert into game.drop_types (id, name, price, min_level, requires_key, event_only, weights, xp, sort, description) values
  ('basic', 'BASIC DROP', 890, 1, false, false, '{"common":70,"uncommon":24,"rare":5.2,"epic":0.7,"legendary":0.1}'::jsonb, 12, 0, 'Cheap and cheerful. Mostly Common & Uncommon.'),
  ('premium', 'PREMIUM DROP', 8800, 3, false, false, '{"common":8,"uncommon":42,"rare":38,"epic":10.5,"legendary":1.4,"mythic":0.1}'::jsonb, 30, 1, 'Better odds of Rare and Epic tech.'),
  ('elite', 'ELITE DROP', 250000, 8, false, false, '{"rare":20,"epic":45,"legendary":28,"mythic":6,"ultra":0.9,"limited":0.1}'::jsonb, 80, 2, 'Serious odds of Legendary and Mythic.'),
  ('ultra', 'ULTRA DROP', 3500000, 15, false, false, '{"legendary":35,"mythic":45,"ultra":16,"limited":2.8,"secret":1.2}'::jsonb, 200, 3, 'Where Ultra items live. Secrets have been seen.'),
  ('event', 'EVENT DROP', 54000, 3, false, true, '{"uncommon":20,"rare":40,"epic":28,"legendary":10,"mythic":2}'::jsonb, 60, 4, 'Only during live events. Themed items + event exclusives.'),
  ('secret', 'SECRET DROP', 16000000, 20, true, false, '{"mythic":30,"ultra":50,"limited":8,"secret":12}'::jsonb, 600, 5, 'Requires a Secret Key. The best odds in the game.')
on conflict (id) do update set name = excluded.name, price = excluded.price, min_level = excluded.min_level, requires_key = excluded.requires_key, event_only = excluded.event_only, weights = excluded.weights, xp = excluded.xp, sort = excluded.sort, description = excluded.description;

insert into game.upgrade_levels (kind, level, cost, value, name) values
  ('base', 1, 0, 4, 'Starter Garage'),
  ('base', 2, 3000, 8, 'Tech Loft'),
  ('base', 3, 40000, 12, 'Neon Warehouse'),
  ('base', 4, 500000, 16, 'Collector Hall'),
  ('base', 5, 6000000, 24, 'Tech Mansion'),
  ('base', 6, 80000000, 32, 'Sky Vault Tower'),
  ('base', 7, 1000000000, 40, 'Mega Complex'),
  ('base', 8, 15000000000, 50, 'Tech Megaplex'),
  ('security', 1, 0, 1, 'Basic Alarm'),
  ('security', 2, 6000, 2, 'Camera'),
  ('security', 3, 75000, 3, 'Security Door'),
  ('security', 4, 900000, 4, 'Advanced Scanner'),
  ('security', 5, 12000000, 5, 'Elite Security'),
  ('security', 6, 150000000, 6, 'Quantum Security'),
  ('vault', 1, 0, 3, 'Lockbox'),
  ('vault', 2, 5000, 5, 'Safe'),
  ('vault', 3, 60000, 10, 'Vault Room'),
  ('vault', 4, 750000, 15, 'Bank Vault'),
  ('vault', 5, 9000000, 25, 'Titan Vault'),
  ('vault', 6, 110000000, 40, 'Quantum Vault')
on conflict (kind, level) do update set cost = excluded.cost, value = excluded.value, name = excluded.name;

insert into game.quests (id, period, title, metric, target, reward, sort) values
  ('d_open5', 'daily', 'Open 5 drops', 'open_drops', 5, '{"cash":4000,"income_secs":240,"xp":120,"tokens":{"basic":1}}'::jsonb, 0),
  ('d_earn50k', 'daily', 'Earn $50,000', 'earn_cash', 50000, '{"cash":6000,"income_secs":300,"xp":150}'::jsonb, 1),
  ('d_raid3', 'daily', 'Raid 3 players', 'raid_players', 3, '{"cash":5000,"income_secs":300,"xp":180,"tokens":{"basic":1}}'::jsonb, 2),
  ('d_sell1', 'daily', 'Sell an item', 'sell_item', 1, '{"cash":2500,"income_secs":120,"xp":80}'::jsonb, 3),
  ('d_rare', 'daily', 'Find a Rare', 'find_rare', 1, '{"cash":3000,"income_secs":180,"xp":100}'::jsonb, 4),
  ('d_legend', 'daily', 'Find a Legendary', 'find_legendary', 1, '{"cash":20000,"income_secs":600,"xp":400,"tokens":{"premium":1}}'::jsonb, 5),
  ('d_belt5', 'daily', 'Buy 5 items off the Tech Belt', 'belt_buys', 5, '{"cash":3000,"income_secs":180,"xp":120}'::jsonb, 6),
  ('d_collect20', 'daily', 'Collect podium cash 20 times', 'collects', 20, '{"cash":2500,"income_secs":240,"xp":100}'::jsonb, 7),
  ('d_lock3', 'daily', 'Lock your base 3 times', 'lock_base', 3, '{"cash":2000,"income_secs":120,"xp":80}'::jsonb, 8),
  ('w_mythic', 'weekly', 'Find a Mythic', 'find_mythic', 1, '{"cash":250000,"income_secs":1800,"xp":2000,"secret_keys":1}'::jsonb, 9),
  ('w_trades20', 'weekly', 'Complete 20 trades (direct or market)', 'complete_trades', 20, '{"cash":150000,"income_secs":1800,"xp":1500,"tokens":{"elite":1}}'::jsonb, 10),
  ('w_mutant', 'weekly', 'Get 3 mutated items', 'mutations', 3, '{"cash":120000,"income_secs":1500,"xp":1500,"tokens":{"premium":2}}'::jsonb, 11),
  ('w_tvs10', 'weekly', 'Collect 10 different TVs', 'collect_tvs', 10, '{"cash":100000,"income_secs":1200,"xp":1200,"tokens":{"premium":2},"cosmetic":"plat-screenwall"}'::jsonb, 12)
on conflict (id) do update set period = excluded.period, title = excluded.title, metric = excluded.metric, target = excluded.target, reward = excluded.reward, sort = excluded.sort;

insert into game.achievements (id, title, description, icon, xp, reward_cash, sort) values
  ('first_drop', 'Unboxed', 'Open your first drop', '📦', 50, 500, 0),
  ('first_rare', 'Blue Glow', 'Find a Rare item', '💠', 80, 1000, 1),
  ('first_epic', 'Purple Haze', 'Find an Epic item', '🟣', 150, 5000, 2),
  ('first_legendary', 'Golden Hour', 'Find a Legendary item', '🌟', 400, 25000, 3),
  ('first_mythic', 'Myth Made Real', 'Find a Mythic item', '🔥', 1000, 150000, 4),
  ('first_ultra', 'Beyond Ultra', 'Find an Ultra item', '🌈', 2500, 1000000, 5),
  ('first_secret', 'SECRET DISCOVERED', 'Find a Secret item', '🕳️', 8000, 5000000, 6),
  ('first_limited', 'Numbered', 'Own a Limited item', '🔢', 2000, 500000, 7),
  ('first_steal', 'Sticky Fingers', 'Steal your first item', '🥷', 100, 2000, 8),
  ('steal_10', 'Cat Burglar', 'Steal 10 items', '🐈‍⬛', 500, 50000, 9),
  ('steal_50', 'Master Thief', 'Steal 50 items', '💰', 3000, 2000000, 10),
  ('defend_1', 'Not Today', 'Stop a raid on your base', '🛡️', 100, 3000, 11),
  ('defend_10', 'Fortress', 'Stop 10 raids', '🏰', 800, 100000, 12),
  ('first_trade', 'Deal!', 'Complete a trade', '🤝', 100, 2000, 13),
  ('trade_20', 'Wheeler Dealer', 'Complete 20 trades', '📈', 800, 100000, 14),
  ('first_sale', 'Open for Business', 'Sell an item on the market', '🏷️', 60, 1000, 15),
  ('base_3', 'Moving Up', 'Upgrade your base to Level 3', '🏠', 200, 5000, 16),
  ('base_5', 'Mansion Life', 'Upgrade your base to Level 5', '🏛️', 2000, 500000, 17),
  ('security_4', 'Locked Down', 'Reach Security Level 4', '🔐', 800, 50000, 18),
  ('security_6', 'Quantum Locked', 'Reach Security Level 6', '⚛️', 5000, 5000000, 19),
  ('collect_25', 'Collector', 'Discover 25 different items', '📚', 400, 20000, 20),
  ('collect_75', 'Archivist', 'Discover 75 different items', '🗂️', 2500, 1000000, 21),
  ('category_complete', 'Completionist', 'Complete a whole collection category', '🏆', 5000, 5000000, 22),
  ('millionaire', 'Millionaire', 'Hold $1,000,000 cash', '💵', 500, 0, 23),
  ('billionaire', 'Billionaire', 'Hold $1,000,000,000 cash', '💎', 5000, 0, 24),
  ('level_10', 'Trader', 'Reach Level 10', '🔟', 0, 50000, 25),
  ('level_25', 'Mastermind', 'Reach Level 25', '🧠', 0, 2500000, 26),
  ('prestige_1', 'Reborn', 'Prestige for the first time', '✨', 0, 0, 27),
  ('streak_7', 'Seven Day Streak', 'Claim 7 daily rewards in a row', '📅', 500, 25000, 28),
  ('first_mutation', 'Mutant', 'Get a mutated item (GOLD or better)', '🧬', 150, 5000, 29),
  ('rainbow', 'Taste the Rainbow', 'Own a RAINBOW item', '🌈', 3000, 500000, 30),
  ('belt_sniper', 'Belt Sniper', 'Buy a Legendary or better off the Tech Belt', '🎯', 400, 25000, 31),
  ('tagger', 'Tag, You''re It', 'Catch a thief red-handed', '🫵', 200, 5000, 32)
on conflict (id) do update set title = excluded.title, description = excluded.description, icon = excluded.icon, xp = excluded.xp, reward_cash = excluded.reward_cash, sort = excluded.sort;

insert into game.cosmetics (id, slot, name, price, unlock, data, sort) values
  ('theme-neon', 'theme', 'Neon Night', 0, null, '{"floor":"#131a2e","wall":"#1e293b","glow":"#22d3ee"}'::jsonb, 0),
  ('theme-garage', 'theme', 'Cyber Garage', 15000, null, '{"floor":"#1c1917","wall":"#292524","glow":"#f97316"}'::jsonb, 1),
  ('theme-arctic', 'theme', 'Arctic Lab', 60000, null, '{"floor":"#0f2230","wall":"#164e63","glow":"#a5f3fc"}'::jsonb, 2),
  ('theme-sakura', 'theme', 'Sakura Studio', 250000, null, '{"floor":"#2a1522","wall":"#4a1d3a","glow":"#f9a8d4"}'::jsonb, 3),
  ('theme-gold', 'theme', 'Gold Vault', 2500000, null, '{"floor":"#241c0b","wall":"#3f2f0c","glow":"#fbbf24"}'::jsonb, 4),
  ('theme-void', 'theme', 'Void', 0, 'prestige:1', '{"floor":"#05030a","wall":"#140a24","glow":"#c084fc"}'::jsonb, 5),
  ('theme-prestige', 'theme', 'Prestige Platinum', 0, 'prestige:2', '{"floor":"#1a1d24","wall":"#2d3340","glow":"#e2e8f0"}'::jsonb, 6),
  ('floor-grid', 'floor', 'Glow Grid', 0, null, '{"pattern":"grid"}'::jsonb, 7),
  ('floor-hex', 'floor', 'Hex Tiles', 8000, null, '{"pattern":"hex"}'::jsonb, 8),
  ('floor-checker', 'floor', 'Race Checker', 30000, null, '{"pattern":"checker"}'::jsonb, 9),
  ('floor-marble', 'floor', 'Dark Marble', 400000, null, '{"pattern":"marble"}'::jsonb, 10),
  ('wall-panel', 'wall', 'Tech Panels', 0, null, '{"pattern":"panel"}'::jsonb, 11),
  ('wall-brick', 'wall', 'Neon Brick', 10000, null, '{"pattern":"brick"}'::jsonb, 12),
  ('wall-glass', 'wall', 'Glass Wall', 120000, null, '{"pattern":"glass"}'::jsonb, 13),
  ('light-cyan', 'lighting', 'Cyan Lights', 0, null, '{"color":"#22d3ee"}'::jsonb, 14),
  ('light-magenta', 'lighting', 'Magenta Lights', 5000, null, '{"color":"#e879f9"}'::jsonb, 15),
  ('light-lime', 'lighting', 'Toxic Lime', 5000, null, '{"color":"#a3e635"}'::jsonb, 16),
  ('light-rainbow', 'lighting', 'Rainbow Cycle', 0, 'level:15', '{"color":"rainbow"}'::jsonb, 17),
  ('plat-basic', 'platform', 'Steel Pads', 0, null, '{"style":"basic"}'::jsonb, 18),
  ('plat-glass', 'platform', 'Glass Plinths', 20000, null, '{"style":"glass"}'::jsonb, 19),
  ('plat-holo', 'platform', 'Holo Rings', 300000, null, '{"style":"holo"}'::jsonb, 20),
  ('plat-screenwall', 'platform', 'Screen Wall', 0, 'quest', '{"style":"screen"}'::jsonb, 21),
  ('trail-none', 'trail', 'No Trail', 0, null, '{"style":"none"}'::jsonb, 22),
  ('trail-spark', 'trail', 'Sparks', 3000, null, '{"style":"spark","color":"#fde047"}'::jsonb, 23),
  ('trail-cash', 'trail', 'Cash Trail', 50000, null, '{"style":"cash","color":"#4ade80"}'::jsonb, 24),
  ('trail-glitch', 'trail', 'Glitch', 0, 'level:10', '{"style":"glitch","color":"#22d3ee"}'::jsonb, 25),
  ('trail-comet', 'trail', 'Comet', 0, 'prestige:1', '{"style":"comet","color":"#c084fc"}'::jsonb, 26),
  ('name-default', 'nameplate', 'Standard', 0, null, '{"style":"default"}'::jsonb, 27),
  ('name-neon', 'nameplate', 'Neon Tag', 7500, null, '{"style":"neon"}'::jsonb, 28),
  ('name-gold', 'nameplate', 'Gold Tag', 900000, null, '{"style":"gold"}'::jsonb, 29),
  ('name-legend', 'nameplate', 'Tech Legend', 0, 'level:50', '{"style":"legend"}'::jsonb, 30),
  ('emote-wave', 'emote', 'Wave 👋', 0, null, '{"emoji":"👋"}'::jsonb, 31),
  ('emote-flex', 'emote', 'Flex 💪', 0, null, '{"emoji":"💪"}'::jsonb, 32),
  ('emote-lol', 'emote', 'LOL 😂', 2000, null, '{"emoji":"😂"}'::jsonb, 33),
  ('emote-money', 'emote', 'Make It Rain 💸', 25000, null, '{"emoji":"💸"}'::jsonb, 34),
  ('emote-ninja', 'emote', 'Ninja 🥷', 0, 'level:5', '{"emoji":"🥷"}'::jsonb, 35),
  ('emote-crown', 'emote', 'Crown 👑', 0, 'prestige:1', '{"emoji":"👑"}'::jsonb, 36),
  ('anim-sparkle', 'item_fx', 'Sparkle Items', 150000, null, '{"style":"sparkle"}'::jsonb, 37),
  ('anim-orbit', 'item_fx', 'Orbiting Rings', 1500000, null, '{"style":"orbit"}'::jsonb, 38)
on conflict (id) do update set slot = excluded.slot, name = excluded.name, price = excluded.price, unlock = excluded.unlock, data = excluded.data, sort = excluded.sort;

insert into game.event_types (id, title, icon, description, category, price_mult, demand_boost, income_mult, luck_mult, weight) values
  ('tech_boom', 'TECH BOOM', '🔥', 'Technology demand is surging. TECH items are worth more and earn +25%.', 'TECH', 1.3, 30, 1.25, 1, 3),
  ('car_week', 'CAR WEEK', '🚗', 'Vehicle demand is up. CARS are worth more and earn +25%.', 'CARS', 1.35, 30, 1.25, 1, 3),
  ('gaming_fest', 'GAMING FESTIVAL', '🎮', 'Gaming items become more valuable and earn +25%.', 'GAMING', 1.3, 30, 1.25, 1, 3),
  ('fashion_week', 'FASHION WEEK', '👟', 'Fashion items are the talk of the town.', 'FASHION', 1.3, 30, 1.25, 1, 2),
  ('secret_hunt', 'SECRET HUNT', '💎', 'Rare items become far more discoverable. Mythic+ luck x2.5!', null, 1, 0, 1, 2.5, 2),
  ('market_crash', 'MARKET CRASH', '📉', 'Panic selling! One category is temporarily worth much less.', '*', 0.7, -30, 1, 1, 2)
on conflict (id) do update set title = excluded.title, icon = excluded.icon, description = excluded.description, category = excluded.category, price_mult = excluded.price_mult, demand_boost = excluded.demand_boost, income_mult = excluded.income_mult, luck_mult = excluded.luck_mult, weight = excluded.weight;

insert into game.level_titles (level, title) values
  (1, 'Rookie'),
  (3, 'Scavenger'),
  (5, 'Collector'),
  (8, 'Dealer'),
  (10, 'Trader'),
  (15, 'Hustler'),
  (20, 'Raider'),
  (25, 'Mastermind'),
  (30, 'Tycoon'),
  (40, 'Kingpin'),
  (50, 'Tech Legend')
on conflict (level) do update set title = excluded.title;

-- NPC players. Their starting collections are rolled on the first world tick.
insert into game.profiles (id, username, is_bot, bot, cash, level, xp) values
  ('00000000-0000-4000-8000-000000000001', 'RookieRick', true, '{"style":"rookie","plan":["common","common","uncommon","common"],"defend":0.05,"extra":[],"tutorial":true,"bio":"Just moved in. Leaves the door open.","seeded":false}'::jsonb, 800, 4, 0),
  ('00000000-0000-4000-8000-000000000002', 'PixelPip', true, '{"style":"rookie","plan":["common","uncommon","uncommon","rare","common","uncommon"],"defend":0.15,"extra":[],"tutorial":false,"bio":"Collects anything that glows.","seeded":false}'::jsonb, 3000, 6, 0),
  ('00000000-0000-4000-8000-000000000003', 'ByteBandit', true, '{"style":"raider","plan":["uncommon","rare","rare","uncommon","rare","epic"],"defend":0.25,"extra":[],"tutorial":false,"bio":"Steals first, asks never.","seeded":false}'::jsonb, 12000, 18, 0),
  ('00000000-0000-4000-8000-000000000004', 'GlitchGoblin', true, '{"style":"collector","plan":["rare","rare","epic","uncommon","rare","epic","rare","uncommon"],"defend":0.25,"extra":[],"tutorial":false,"bio":"Hoards glitchy gadgets.","seeded":false}'::jsonb, 40000, 18, 0),
  ('00000000-0000-4000-8000-000000000005', 'VoltVixen', true, '{"style":"trader","plan":["rare","epic","epic","rare","legendary","rare","epic","rare"],"defend":0.3,"extra":[],"tutorial":false,"bio":"Buys low. Sells to you.","seeded":false}'::jsonb, 150000, 22, 0),
  ('00000000-0000-4000-8000-000000000006', 'NeonVandal', true, '{"style":"raider","plan":["epic","epic","rare","legendary","epic","rare","epic","epic","rare"],"defend":0.3,"extra":[],"tutorial":false,"bio":"Tags every base they rob.","seeded":false}'::jsonb, 120000, 20, 0),
  ('00000000-0000-4000-8000-000000000007', 'ChromeCobra', true, '{"style":"raider","plan":["legendary","epic","legendary","epic","mythic","epic","legendary","rare","epic","legendary"],"defend":0.35,"extra":[],"tutorial":false,"bio":"Strikes fast. Never misses twice.","seeded":false}'::jsonb, 900000, 22, 0),
  ('00000000-0000-4000-8000-000000000008', 'ZeroLagZed', true, '{"style":"trader","plan":["legendary","legendary","epic","mythic","epic","legendary","epic","rare","legendary"],"defend":0.35,"extra":[],"tutorial":false,"bio":"Market maker. Always has a deal.","seeded":false}'::jsonb, 1200000, 24, 0),
  ('00000000-0000-4000-8000-000000000009', 'TechGhost', true, '{"style":"whale","plan":["mythic","legendary","legendary","epic","mythic","legendary","epic","legendary"],"defend":0.4,"extra":["quantum-120-void-oled"],"tutorial":false,"bio":"Nobody knows how they got that TV.","seeded":false}'::jsonb, 5000000, 38, 0),
  ('00000000-0000-4000-8000-000000000010', 'NovaKnight', true, '{"style":"collector","plan":["mythic","mythic","legendary","legendary","mythic","epic","legendary","mythic","legendary","epic","legendary","mythic"],"defend":0.4,"extra":["phantom-tv"],"tutorial":false,"bio":"Guards a museum of the finest tech.","seeded":false}'::jsonb, 15000000, 22, 0),
  ('00000000-0000-4000-8000-000000000011', 'QuantumQueen', true, '{"style":"whale","plan":["ultra","mythic","mythic","legendary","mythic","ultra","legendary","mythic","legendary","mythic","legendary","legendary"],"defend":0.45,"extra":[],"tutorial":false,"bio":"Rules the leaderboards.","seeded":false}'::jsonb, 60000000, 40, 0),
  ('00000000-0000-4000-8000-000000000012', 'ApexAce', true, '{"style":"whale","plan":["ultra","ultra","mythic","mythic","mythic","legendary","ultra","mythic","mythic","legendary","mythic","ultra","mythic","legendary"],"defend":0.5,"extra":["infinite-gaming-setup"],"tutorial":false,"bio":"Quantum security. Quantum ego.","seeded":false}'::jsonb, 250000000, 42, 0)
on conflict (id) do update set bot = game.profiles.bot || jsonb_build_object('style', excluded.bot->'style', 'plan', excluded.bot->'plan', 'defend', excluded.bot->'defend', 'extra', excluded.bot->'extra', 'tutorial', excluded.bot->'tutorial', 'bio', excluded.bot->'bio');

insert into game.bases (player_id, base_level, security_level, vault_level) values
  ('00000000-0000-4000-8000-000000000001', 1, 1, 1),
  ('00000000-0000-4000-8000-000000000002', 2, 1, 1),
  ('00000000-0000-4000-8000-000000000003', 2, 2, 2),
  ('00000000-0000-4000-8000-000000000004', 3, 2, 2),
  ('00000000-0000-4000-8000-000000000005', 3, 3, 3),
  ('00000000-0000-4000-8000-000000000006', 3, 3, 2),
  ('00000000-0000-4000-8000-000000000007', 4, 4, 3),
  ('00000000-0000-4000-8000-000000000008', 4, 4, 4),
  ('00000000-0000-4000-8000-000000000009', 4, 4, 3),
  ('00000000-0000-4000-8000-000000000010', 5, 5, 4),
  ('00000000-0000-4000-8000-000000000011', 5, 5, 5),
  ('00000000-0000-4000-8000-000000000012', 6, 6, 5)
on conflict (player_id) do nothing;

insert into game.player_stats (player_id) values
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000003'),
  ('00000000-0000-4000-8000-000000000004'),
  ('00000000-0000-4000-8000-000000000005'),
  ('00000000-0000-4000-8000-000000000006'),
  ('00000000-0000-4000-8000-000000000007'),
  ('00000000-0000-4000-8000-000000000008'),
  ('00000000-0000-4000-8000-000000000009'),
  ('00000000-0000-4000-8000-000000000010'),
  ('00000000-0000-4000-8000-000000000011'),
  ('00000000-0000-4000-8000-000000000012')
on conflict (player_id) do nothing;
`,o1=`-- ============================================================================
-- STEAL THE TECH — game engine (internal functions, schema \`game\`)
--
-- Nothing in here is callable by clients. Public RPCs (20260922000005_api.sql)
-- resolve the caller with auth.uid() and delegate to the act_* functions below,
-- which take the acting player id explicitly so NPC bots can use the exact
-- same rules as humans.
--
-- Conventions
--   * act_* functions lock the acting player's profile row first
--     (SELECT ... FOR UPDATE) so concurrent requests from one player serialize:
--     no double-spending, no duplicated items.
--   * When two players are involved, both profile rows are locked in id order
--     to avoid deadlocks.
--   * Passive income is settled (credited) before anything that changes what a
--     player has on display, so income is always paid at the correct rate.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Small helpers
-- ---------------------------------------------------------------------------
create or replace function game._uid() returns uuid
language plpgsql stable set search_path = pg_catalog, game, pg_temp as $$
declare v uuid;
begin
  v := auth.uid();
  if v is null then
    raise exception 'You need to be signed in to play.';
  end if;
  return v;
end $$;

create or replace function game.fmt_money(n numeric) returns text
language sql immutable set search_path = pg_catalog, game, pg_temp as $$
  select '$' || to_char(coalesce(n, 0), 'FM999,999,999,999,999,990')
$$;

create or replace function game.xp_for_level(p_level int) returns bigint
language sql immutable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce(sum(round(100 * power(l, 1.5)))::bigint, 0)
  from generate_series(1, greatest(p_level, 1) - 1) l
$$;

create or replace function game.level_for_xp(p_xp bigint) returns int
language plpgsql immutable set search_path = pg_catalog, game, pg_temp as $$
declare l int := 1; need bigint := 0;
begin
  loop
    need := need + round(100 * power(l, 1.5))::bigint;
    exit when p_xp < need or l >= 200;
    l := l + 1;
  end loop;
  return l;
end $$;

create or replace function game.level_title(p_level int) returns text
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce((select title from game.level_titles where level <= p_level order by level desc limit 1), 'Rookie')
$$;

create or replace function game._period_key(p_period text) returns text
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select case when p_period = 'daily'
    then to_char(now() at time zone 'utc', 'YYYY-MM-DD')
    else to_char(now() at time zone 'utc', 'IYYY-"W"IW') end
$$;

create or replace function game._period_end(p_period text) returns timestamptz
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select case when p_period = 'daily'
    then (date_trunc('day', now() at time zone 'utc') + interval '1 day') at time zone 'utc'
    else (date_trunc('week', now() at time zone 'utc') + interval '7 days') at time zone 'utc' end
$$;

create or replace function game._upgrade_value(p_kind text, p_level int) returns int
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select value from game.upgrade_levels where kind = p_kind and level = p_level
$$;

create or replace function game._slots(p_pid uuid) returns int
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select ul.value from game.bases b
  join game.upgrade_levels ul on ul.kind = 'base' and ul.level = b.base_level
  where b.player_id = p_pid
$$;

create or replace function game._vault_capacity(p_pid uuid) returns int
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select ul.value from game.bases b
  join game.upgrade_levels ul on ul.kind = 'vault' and ul.level = b.vault_level
  where b.player_id = p_pid
$$;

create or replace function game._is_bot(p_pid uuid) returns boolean
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce((select is_bot from game.profiles where id = p_pid), false)
$$;

create or replace function game._current_event()
returns table (event_id bigint, type_id text, category text, title text, icon text, description text,
               price_mult numeric, demand_boost numeric, income_mult numeric, luck_mult numeric,
               starts_at timestamptz, ends_at timestamptz)
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select e.id, e.type_id, e.category, t.title, t.icon, t.description,
         t.price_mult, t.demand_boost, t.income_mult, t.luck_mult, e.starts_at, e.ends_at
  from game.events e join game.event_types t on t.id = e.type_id
  where now() >= e.starts_at and now() < e.ends_at
  order by e.starts_at desc
  limit 1
$$;

create or replace function game._emit(p_kind text, p_target uuid, p_actor uuid, p_payload jsonb) returns void
language sql set search_path = pg_catalog, game, pg_temp as $$
  insert into game.server_events (kind, target_id, actor_id, payload)
  values (p_kind, p_target, p_actor, coalesce(p_payload, '{}'::jsonb))
$$;

create or replace function game._item_json(p game.player_items) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object(
    'id', p.id, 'item_id', p.item_id, 'location', p.location, 'slot', p.slot, 'serial', p.serial,
    'soulbound', p.soulbound, 'hot_until', p.hot_until, 'acquired_via', p.acquired_via,
    'acquired_at', p.acquired_at, 'stolen_from', p.stolen_from)
$$;

-- ---------------------------------------------------------------------------
-- Economy core: income, cash, XP
-- ---------------------------------------------------------------------------
create or replace function game._luck(p_pid uuid) returns numeric
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select case when prestige <= 0 then 0 else least(0.5, 0.03 * prestige - 0.01) end
  from game.profiles where id = p_pid
$$;

create or replace function game._income_rate(p_pid uuid) returns double precision
language plpgsql stable set search_path = pg_catalog, game, pg_temp as $$
declare r double precision; ev record; pr int;
begin
  select * into ev from game._current_event();
  select prestige into pr from profiles where id = p_pid;
  select coalesce(sum(i.base_income * case when ev.category is not null and i.category = ev.category
                                           then ev.income_mult else 1 end), 0)
    into r
  from player_items pi join items i on i.id = pi.item_id
  where pi.owner_id = p_pid and pi.location = 'display';
  return r * (1 + 0.05 * coalesce(pr, 0));
end $$;

-- Credit passive income earned since the last settle (capped at 12h offline).
create or replace function game._settle(p_pid uuid) returns bigint
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare p record; rate double precision; elapsed double precision; earned double precision; whole bigint;
begin
  select cash, income_remainder, last_income_at, is_bot into p from profiles where id = p_pid;
  if not found then return 0; end if;
  elapsed := extract(epoch from (now() - p.last_income_at));
  if elapsed <= 0 then return p.cash; end if;
  elapsed := least(elapsed, 43200);
  rate := game._income_rate(p_pid);
  earned := rate * elapsed + p.income_remainder;
  whole := floor(earned)::bigint;
  update profiles set cash = cash + whole, income_remainder = earned - whole, last_income_at = now()
  where id = p_pid;
  if whole > 0 and not p.is_bot then
    update player_stats set cash_earned = cash_earned + whole where player_id = p_pid;
    perform game._quest_progress(p_pid, 'earn_cash', whole);
  end if;
  return p.cash + whole;
end $$;

-- Every non-income cash change goes through here and is written to transactions.
create or replace function game._cash(p_pid uuid, p_delta bigint, p_kind text, p_ref jsonb default '{}'::jsonb)
returns bigint
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare bal bigint;
begin
  select cash into bal from profiles where id = p_pid;
  if bal is null then raise exception 'Player not found.'; end if;
  if bal + p_delta < 0 then
    raise exception 'Not enough cash — you need % more.', game.fmt_money(-(bal + p_delta));
  end if;
  if p_delta = 0 then return bal; end if;
  update profiles set cash = cash + p_delta where id = p_pid returning cash into bal;
  insert into transactions (player_id, kind, amount, balance_after, ref)
  values (p_pid, p_kind, p_delta, bal, coalesce(p_ref, '{}'::jsonb));
  return bal;
end $$;

create or replace function game._add_tokens(p_pid uuid, p_drop text, p_n int) returns void
language sql set search_path = pg_catalog, game, pg_temp as $$
  update game.profiles
  set drop_tokens = jsonb_set(drop_tokens, array[p_drop], to_jsonb(greatest(0, coalesce((drop_tokens->>p_drop)::int, 0) + p_n)))
  where id = p_pid
$$;

create or replace function game._quest_progress(p_pid uuid, p_metric text, p_amount bigint) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
begin
  if p_amount is null or p_amount <= 0 or game._is_bot(p_pid) then return; end if;
  insert into player_quests (player_id, quest_id, period_key, progress)
  select p_pid, q.id, game._period_key(q.period), p_amount from quests q where q.metric = p_metric
  on conflict (player_id, quest_id, period_key)
  do update set progress = player_quests.progress + excluded.progress;
end $$;

create or replace function game._achieve(p_pid uuid, p_id text) returns boolean
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare a record; n int;
begin
  if game._is_bot(p_pid) then return false; end if;
  insert into player_achievements (player_id, achievement_id) values (p_pid, p_id) on conflict do nothing;
  get diagnostics n = row_count;
  if n = 0 then return false; end if;
  select * into a from achievements where id = p_id;
  if a.reward_cash > 0 then
    perform game._cash(p_pid, a.reward_cash, 'achievement', jsonb_build_object('id', p_id));
  end if;
  perform game._emit('achievement', p_pid, p_pid,
    jsonb_build_object('id', p_id, 'title', a.title, 'icon', a.icon, 'cash', a.reward_cash, 'xp', a.xp));
  if a.xp > 0 then perform game._xp(p_pid, a.xp, 'achievement'); end if;
  return true;
end $$;

create or replace function game._xp(p_pid uuid, p_amount bigint, p_reason text default null) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare p record; newlvl int; l int; total bigint := 0;
begin
  if p_amount is null or p_amount <= 0 then return; end if;
  update profiles set xp = xp + p_amount where id = p_pid
  returning xp, level, is_bot, username into p;
  if not found then return; end if;
  newlvl := game.level_for_xp(p.xp);
  if newlvl <= p.level then return; end if;
  update profiles set level = newlvl where id = p_pid;
  if p.is_bot then return; end if;
  for l in p.level + 1 .. newlvl loop
    total := total + 250::bigint * l * l;
  end loop;
  perform game._cash(p_pid, total, 'level_reward', jsonb_build_object('level', newlvl));
  insert into player_cosmetics (player_id, cosmetic_id)
    select p_pid, c.id from cosmetics c
    where c.unlock like 'level:%' and split_part(c.unlock, ':', 2)::int <= newlvl
  on conflict do nothing;
  perform game._emit('level_up', p_pid, p_pid,
    jsonb_build_object('level', newlvl, 'title', game.level_title(newlvl), 'cash', total));
  if newlvl in (5, 10, 20, 25, 30, 40, 50) then
    perform game._emit('level_milestone', null, p_pid,
      jsonb_build_object('player', p.username, 'level', newlvl, 'title', game.level_title(newlvl)));
  end if;
  if newlvl >= 10 then perform game._achieve(p_pid, 'level_10'); end if;
  if newlvl >= 25 then perform game._achieve(p_pid, 'level_25'); end if;
end $$;

create or replace function game._check_achievements(p_pid uuid) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare p record; s record; b record; ncol int;
begin
  select * into p from profiles where id = p_pid;
  if not found or p.is_bot then return; end if;
  select * into s from player_stats where player_id = p_pid;
  select * into b from bases where player_id = p_pid;
  if s.drops_opened >= 1 then perform game._achieve(p_pid, 'first_drop'); end if;
  if s.steals_won >= 1 then perform game._achieve(p_pid, 'first_steal'); end if;
  if s.steals_won >= 10 then perform game._achieve(p_pid, 'steal_10'); end if;
  if s.steals_won >= 50 then perform game._achieve(p_pid, 'steal_50'); end if;
  if s.raids_defended >= 1 then perform game._achieve(p_pid, 'defend_1'); end if;
  if s.raids_defended >= 10 then perform game._achieve(p_pid, 'defend_10'); end if;
  if s.trades_done >= 1 then perform game._achieve(p_pid, 'first_trade'); end if;
  if s.trades_done >= 20 then perform game._achieve(p_pid, 'trade_20'); end if;
  if s.market_sales >= 1 then perform game._achieve(p_pid, 'first_sale'); end if;
  if b.base_level >= 3 then perform game._achieve(p_pid, 'base_3'); end if;
  if b.base_level >= 5 then perform game._achieve(p_pid, 'base_5'); end if;
  if b.security_level >= 4 then perform game._achieve(p_pid, 'security_4'); end if;
  if b.security_level >= 6 then perform game._achieve(p_pid, 'security_6'); end if;
  select count(*) into ncol from player_collection where player_id = p_pid;
  if ncol >= 25 then perform game._achieve(p_pid, 'collect_25'); end if;
  if ncol >= 75 then perform game._achieve(p_pid, 'collect_75'); end if;
  if ncol >= 20 and exists (
      select 1 from (
        select i.category, count(*) as total, count(pc.item_id) as got
        from items i
        left join player_collection pc on pc.item_id = i.id and pc.player_id = p_pid
        where i.droppable or i.event_only
        group by i.category) x
      where x.got = x.total) then
    perform game._achieve(p_pid, 'category_complete');
  end if;
  if p.cash >= 1000000 then perform game._achieve(p_pid, 'millionaire'); end if;
  if p.cash >= 1000000000 then perform game._achieve(p_pid, 'billionaire'); end if;
  if p.daily_streak >= 7 then perform game._achieve(p_pid, 'streak_7'); end if;
  if p.prestige >= 1 then perform game._achieve(p_pid, 'prestige_1'); end if;
end $$;

-- ---------------------------------------------------------------------------
-- Items: creation, discovery, transfer, placement
-- ---------------------------------------------------------------------------
create or replace function game._discover(p_pid uuid, p_item text) returns boolean
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
begin
  update player_collection set times_found = times_found + 1 where player_id = p_pid and item_id = p_item;
  if found then return false; end if;
  insert into player_collection (player_id, item_id) values (p_pid, p_item) on conflict do nothing;
  return true;
end $$;

-- Mint a brand-new item instance (drops, rewards). Enforces limited supply.
create or replace function game._grant(p_pid uuid, p_item text, p_via text) returns uuid
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare it record; v_serial int; v_id uuid; pname text; pbot boolean; remaining int; mprice bigint;
begin
  select i.*, r.tier, r.xp as rxp into it from items i join rarities r on r.id = i.rarity where i.id = p_item;
  if not found then raise exception 'Unknown item %', p_item; end if;
  if it.max_supply is not null then
    update limited_item_supply set minted = minted + 1
    where item_id = p_item and minted < max_supply
    returning minted into v_serial;
    if v_serial is null then raise exception 'SOLD_OUT'; end if;
    remaining := it.max_supply - v_serial;
  end if;
  insert into player_items (item_id, owner_id, location, serial, soulbound, acquired_via)
  values (p_item, p_pid, 'inventory', v_serial, not it.tradeable, p_via)
  returning id into v_id;
  insert into item_log (player_item_id, item_id, from_id, to_id, via) values (v_id, p_item, null, p_pid, p_via);
  select username, is_bot into pname, pbot from profiles where id = p_pid;
  perform game._discover(p_pid, p_item);
  select price into mprice from market_state where item_id = p_item;
  update player_stats set
    items_found = items_found + 1,
    secrets_found = secrets_found + (it.rarity = 'secret')::int,
    limiteds_found = limiteds_found + (it.rarity = 'limited')::int,
    best_item_value = greatest(best_item_value, coalesce(mprice, it.base_value))
  where player_id = p_pid;
  update market_state set demand = greatest(0, demand - 0.4) where item_id = p_item;

  if not pbot then
    perform game._xp(p_pid, it.rxp, 'find');
    if it.tier >= 3 then perform game._quest_progress(p_pid, 'find_rare', 1); perform game._achieve(p_pid, 'first_rare'); end if;
    if it.tier >= 4 then perform game._achieve(p_pid, 'first_epic'); end if;
    if it.tier >= 5 then perform game._quest_progress(p_pid, 'find_legendary', 1); perform game._achieve(p_pid, 'first_legendary'); end if;
    if it.tier >= 6 then perform game._quest_progress(p_pid, 'find_mythic', 1); perform game._achieve(p_pid, 'first_mythic'); end if;
    if it.rarity in ('ultra', 'secret') then perform game._achieve(p_pid, 'first_ultra'); end if;
    if it.rarity = 'secret' then perform game._achieve(p_pid, 'first_secret'); end if;
    if it.rarity = 'limited' then perform game._achieve(p_pid, 'first_limited'); end if;
  end if;

  if p_via <> 'seed' then
    if it.rarity = 'secret' then
      perform game._emit('secret_found', null, p_pid, jsonb_build_object(
        'player', pname, 'item_id', p_item, 'item', it.name, 'serial', v_serial,
        'max_supply', it.max_supply, 'via', p_via, 'is_bot', pbot));
    elsif it.rarity in ('ultra', 'limited') or (it.rarity = 'mythic' and p_via = 'drop') then
      perform game._emit('big_pull', null, p_pid, jsonb_build_object(
        'player', pname, 'item_id', p_item, 'item', it.name, 'rarity', it.rarity,
        'serial', v_serial, 'max_supply', it.max_supply, 'is_bot', pbot));
    end if;
    if remaining is not null and (remaining in (0, 1, 3, 5, 10, 25)) then
      perform game._emit('supply_alert', null, null, jsonb_build_object(
        'item_id', p_item, 'item', it.name, 'remaining', remaining, 'max_supply', it.max_supply));
    end if;
  end if;
  return v_id;
end $$;

-- Move an existing item to a new owner (steal / trade / market). Always lands in inventory.
create or replace function game._transfer(p_piid uuid, p_to uuid, p_via text, p_amount bigint default null,
                                          p_hot interval default null) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare pi record;
begin
  select * into pi from player_items where id = p_piid for update;
  if not found then raise exception 'Item vanished.'; end if;
  update player_items set
    owner_id = p_to, location = 'inventory', slot = null, acquired_via = p_via, acquired_at = now(),
    hot_until = case when p_hot is null then null else now() + p_hot end,
    stolen_from = case when p_via = 'steal' then pi.owner_id else null end
  where id = p_piid;
  insert into item_log (player_item_id, item_id, from_id, to_id, via, amount)
  values (p_piid, pi.item_id, pi.owner_id, p_to, p_via, p_amount);
  perform game._discover(p_to, pi.item_id);
end $$;

create or replace function game._free_slot(p_pid uuid) returns int
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select min(g) from generate_series(0, coalesce(game._slots(p_pid), 4) - 1) g
  where not exists (select 1 from game.player_items
                    where owner_id = p_pid and location = 'display' and slot = g)
$$;

-- Put an inventory item into the first free display slot (if any). Caller must have settled.
create or replace function game._autoplace(p_pid uuid, p_piid uuid) returns int
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare s int;
begin
  s := game._free_slot(p_pid);
  if s is null then return null; end if;
  update player_items set location = 'display', slot = s
  where id = p_piid and owner_id = p_pid and location = 'inventory';
  if not found then return null; end if;
  return s;
end $$;

-- Fill display slots with the highest-earning items that aren't vaulted or listed.
create or replace function game._arrange_best(p_pid uuid) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare n int;
begin
  n := coalesce(game._slots(p_pid), 4);
  update player_items set location = 'inventory', slot = null where owner_id = p_pid and location = 'display';
  with c as (
    select pi.id, row_number() over (order by i.base_income desc, pi.acquired_at, pi.id) - 1 as rn
    from player_items pi join items i on i.id = pi.item_id
    where pi.owner_id = p_pid and pi.location = 'inventory')
  update player_items set location = 'display', slot = c.rn
  from c where player_items.id = c.id and c.rn < n;
end $$;

-- ---------------------------------------------------------------------------
-- Drops
-- ---------------------------------------------------------------------------
create or replace function game._roll_rarity(p_weights jsonb, p_luck numeric, p_high_mult numeric) returns text
language plpgsql volatile set search_path = pg_catalog, game, pg_temp as $$
declare rec record; total numeric := 0; pick numeric; acc numeric := 0; last text;
begin
  for rec in
    select ra.id, (p_weights->>ra.id)::numeric
             * (case when ra.tier >= 3 then 1 + coalesce(p_luck, 0) else 1 end)
             * (case when ra.tier >= 6 then coalesce(p_high_mult, 1) else 1 end) as w
    from rarities ra where p_weights ? ra.id order by ra.tier
  loop
    total := total + rec.w;
  end loop;
  pick := random()::numeric * total;
  for rec in
    select ra.id, (p_weights->>ra.id)::numeric
             * (case when ra.tier >= 3 then 1 + coalesce(p_luck, 0) else 1 end)
             * (case when ra.tier >= 6 then coalesce(p_high_mult, 1) else 1 end) as w
    from rarities ra where p_weights ? ra.id order by ra.tier
  loop
    acc := acc + rec.w;
    last := rec.id;
    if pick < acc then return rec.id; end if;
  end loop;
  return last;
end $$;

create or replace function game._pick_item(p_pid uuid, p_rarity text, p_category text, p_event_pool boolean,
                                           p_bot boolean default false) returns text
language plpgsql volatile set search_path = pg_catalog, game, pg_temp as $$
declare v_focus text; res text; cat text;
begin
  if p_rarity in ('limited', 'secret') then
    -- weighted by remaining supply; bots never take the last half of any run
    select i.id into res
    from items i join limited_item_supply s on s.item_id = i.id
    where i.rarity = p_rarity and i.droppable and s.minted < s.max_supply
      and (not p_bot or s.minted < s.max_supply / 2)
    order by -ln(1 - random()) / (s.max_supply - s.minted)
    limit 1;
    return res;
  end if;
  if p_event_pool and random() < 0.35 then
    select i.id into res from items i where i.rarity = p_rarity and i.event_only order by random() limit 1;
    if res is not null then return res; end if;
  end if;
  select collection_focus into v_focus from profiles where id = p_pid;
  cat := p_category;
  if cat is null and v_focus is not null and v_focus <> 'RANDOM' and random() < 0.5 then cat := v_focus; end if;
  select i.id into res from items i
  where i.rarity = p_rarity and i.droppable and (cat is null or i.category = cat)
  order by random() limit 1;
  if res is null then
    select i.id into res from items i where i.rarity = p_rarity and i.droppable order by random() limit 1;
  end if;
  return res;
end $$;

create or replace function game._roll_drop(p_pid uuid, p_drop text, p_bot boolean default false) returns text
language plpgsql volatile set search_path = pg_catalog, game, pg_temp as $$
declare d record; ev record; hm numeric := 1; rar text; v_item text; cat text; tries int := 0;
begin
  select * into d from drop_types where id = p_drop;
  select * into ev from game._current_event();
  if ev.luck_mult is not null then hm := ev.luck_mult; end if;
  if d.event_only and ev.type_id is not null and ev.type_id <> 'market_crash' then cat := ev.category; end if;
  rar := game._roll_rarity(d.weights, game._luck(p_pid), hm);
  loop
    v_item := game._pick_item(p_pid, rar, cat, d.event_only, p_bot);
    exit when v_item is not null;
    tries := tries + 1;
    if tries > 10 then raise exception 'The drop machine jammed — try again.'; end if;
    -- supply exhausted: fall back to the next tier down
    rar := case rar when 'secret' then 'ultra' when 'limited' then 'ultra' when 'ultra' then 'mythic'
                    when 'mythic' then 'legendary' when 'legendary' then 'epic' when 'epic' then 'rare'
                    when 'rare' then 'uncommon' else 'common' end;
  end loop;
  return v_item;
end $$;

create or replace function game.act_open_drop(p_pid uuid, p_drop text, p_use_token boolean) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare p record; d record; ev record; tokens int; v_item text; v_id uuid; is_new boolean; bal bigint;
        v_slot int; it record; pi game.player_items;
begin
  select * into p from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  select * into d from drop_types where id = p_drop;
  if not found then raise exception 'Unknown drop.'; end if;
  if p.level < d.min_level then raise exception '% unlocks at level %.', d.name, d.min_level; end if;
  if d.event_only then
    select * into ev from game._current_event();
    if ev.type_id is null then raise exception 'Event Drops are only available during live events.'; end if;
  end if;
  if d.requires_key and p.secret_keys < 1 then
    raise exception 'You need a Secret Key to open the %.', d.name;
  end if;
  perform game._settle(p_pid);
  if p_use_token then
    tokens := coalesce((p.drop_tokens->>p_drop)::int, 0);
    if tokens < 1 then raise exception 'You have no free % tokens.', d.name; end if;
    perform game._add_tokens(p_pid, p_drop, -1);
  else
    perform game._cash(p_pid, -d.price, 'drop', jsonb_build_object('drop', p_drop));
  end if;
  if d.requires_key then
    update profiles set secret_keys = secret_keys - 1 where id = p_pid;
  end if;

  v_item := game._roll_drop(p_pid, p_drop, p.is_bot);
  begin
    is_new := not exists (select 1 from player_collection where player_id = p_pid and item_id = v_item);
    v_id := game._grant(p_pid, v_item, 'drop');
  exception when others then
    if sqlerrm <> 'SOLD_OUT' then raise; end if;
    select id into v_item from items where rarity = 'ultra' and droppable order by random() limit 1;
    is_new := not exists (select 1 from player_collection where player_id = p_pid and item_id = v_item);
    v_id := game._grant(p_pid, v_item, 'drop');
  end;

  update player_stats set drops_opened = drops_opened + 1,
                          events_joined = events_joined + (d.event_only)::int
  where player_id = p_pid;
  v_slot := game._autoplace(p_pid, v_id);
  if not p.is_bot then
    perform game._quest_progress(p_pid, 'open_drops', 1);
    perform game._xp(p_pid, d.xp, 'drop');
    perform game._check_achievements(p_pid);
  end if;

  select i.*, r.xp as rxp into it from items i join rarities r on r.id = i.rarity where i.id = v_item;
  select * into pi from player_items where id = v_id;
  select cash into bal from profiles where id = p_pid;
  return jsonb_build_object(
    'player_item', game._item_json(pi),
    'item_id', v_item, 'rarity', it.rarity, 'serial', pi.serial, 'is_new', is_new,
    'placed', v_slot is not null, 'slot', v_slot,
    'xp', d.xp + it.rxp, 'cash', bal, 'drop', p_drop);
end $$;

-- ---------------------------------------------------------------------------
-- Base management
-- ---------------------------------------------------------------------------
create or replace function game._own_item(p_pid uuid, p_piid uuid) returns game.player_items
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare pi game.player_items;
begin
  select * into pi from player_items where id = p_piid and owner_id = p_pid for update;
  if not found then raise exception 'That item isn''t yours.'; end if;
  return pi;
end $$;

create or replace function game._under_raid(p_piid uuid) returns boolean
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select exists (select 1 from game.raids where player_item_id = p_piid and status = 'active')
$$;

create or replace function game.act_place(p_pid uuid, p_piid uuid, p_slot int) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare pi game.player_items; occ record; n int; v_slot int := p_slot;
begin
  perform 1 from profiles where id = p_pid for update;
  pi := game._own_item(p_pid, p_piid);
  if pi.location = 'listed' then raise exception 'Cancel the market listing first.'; end if;
  n := game._slots(p_pid);
  if v_slot is null then
    if pi.location = 'display' then return jsonb_build_object('ok', true, 'slot', pi.slot); end if;
    v_slot := game._free_slot(p_pid);
    if v_slot is null then raise exception 'Your base is full — upgrade it or swap an item out.'; end if;
  end if;
  if v_slot < 0 or v_slot >= n then raise exception 'That display slot doesn''t exist.'; end if;
  if pi.location = 'display' and pi.slot = v_slot then return jsonb_build_object('ok', true, 'slot', v_slot); end if;
  perform game._settle(p_pid);
  select * into occ from player_items
  where owner_id = p_pid and location = 'display' and slot = v_slot and id <> p_piid for update;
  if found then
    if pi.location = 'display' then
      update player_items set slot = -1 where id = occ.id;
      update player_items set slot = v_slot where id = p_piid;
      update player_items set slot = pi.slot where id = occ.id;
    else
      update player_items set location = 'inventory', slot = null where id = occ.id;
      update player_items set location = 'display', slot = v_slot where id = p_piid;
    end if;
  else
    update player_items set location = 'display', slot = v_slot where id = p_piid;
  end if;
  return jsonb_build_object('ok', true, 'slot', v_slot);
end $$;

create or replace function game.act_store(p_pid uuid, p_piid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare pi game.player_items;
begin
  perform 1 from profiles where id = p_pid for update;
  pi := game._own_item(p_pid, p_piid);
  if pi.location = 'listed' then raise exception 'Cancel the market listing first.'; end if;
  if pi.location = 'inventory' then return jsonb_build_object('ok', true); end if;
  perform game._settle(p_pid);
  update player_items set location = 'inventory', slot = null where id = p_piid;
  return jsonb_build_object('ok', true);
end $$;

create or replace function game.act_vault(p_pid uuid, p_piid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare pi game.player_items; cap int; used int; saved boolean;
begin
  perform 1 from profiles where id = p_pid for update;
  pi := game._own_item(p_pid, p_piid);
  if pi.location = 'vault' then return jsonb_build_object('ok', true); end if;
  if pi.location = 'listed' then raise exception 'Cancel the market listing first.'; end if;
  cap := game._vault_capacity(p_pid);
  select count(*) into used from player_items where owner_id = p_pid and location = 'vault';
  if used >= cap then raise exception 'Your vault is full (%/%). Upgrade it to protect more items.', used, cap; end if;
  saved := game._under_raid(p_piid);
  perform game._settle(p_pid);
  update player_items set location = 'vault', slot = null where id = p_piid;
  return jsonb_build_object('ok', true, 'saved_from_raid', saved);
end $$;

create or replace function game.act_auto_arrange(p_pid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
begin
  perform 1 from profiles where id = p_pid for update;
  perform game._settle(p_pid);
  perform game._arrange_best(p_pid);
  return jsonb_build_object('ok', true);
end $$;

create or replace function game.act_quick_sell(p_pid uuid, p_piid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare pi game.player_items; mprice bigint; v_price bigint; bal bigint;
begin
  perform 1 from profiles where id = p_pid for update;
  pi := game._own_item(p_pid, p_piid);
  if pi.soulbound then raise exception 'Your starter item can''t be sold.'; end if;
  if pi.location = 'listed' then raise exception 'Cancel the market listing first.'; end if;
  if pi.hot_until > now() then
    raise exception 'That item is too hot to sell — wait %s.', ceil(extract(epoch from pi.hot_until - now()));
  end if;
  if game._under_raid(p_piid) then raise exception 'Someone is stealing that right now — sound the alarm or vault it!'; end if;
  select price into mprice from market_state where item_id = pi.item_id;
  v_price := greatest(1, floor(mprice * 0.6))::bigint;
  perform game._settle(p_pid);
  delete from player_items where id = p_piid;
  insert into item_log (player_item_id, item_id, from_id, to_id, via, amount)
  values (p_piid, pi.item_id, p_pid, null, 'quick_sell', v_price);
  insert into market_sales (item_id, price, seller_id, kind) values (pi.item_id, v_price, p_pid, 'quick_sell');
  bal := game._cash(p_pid, v_price, 'quick_sell', jsonb_build_object('item_id', pi.item_id));
  update market_state set demand = greatest(0, demand - 1) where item_id = pi.item_id;
  update player_stats set quick_sales = quick_sales + 1 where player_id = p_pid;
  perform game._quest_progress(p_pid, 'sell_item', 1);
  perform game._xp(p_pid, 10, 'sell');
  perform game._check_achievements(p_pid);
  return jsonb_build_object('ok', true, 'price', v_price, 'cash', bal);
end $$;

create or replace function game.act_upgrade(p_pid uuid, p_kind text) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare b record; cur int; nxt record; bal bigint; pname text;
begin
  select username into pname from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  select * into b from bases where player_id = p_pid for update;
  cur := case p_kind when 'base' then b.base_level when 'security' then b.security_level
                     when 'vault' then b.vault_level else null end;
  if cur is null then raise exception 'Unknown upgrade.'; end if;
  select * into nxt from upgrade_levels where kind = p_kind and level = cur + 1;
  if not found then raise exception 'Already at the maximum level.'; end if;
  perform game._settle(p_pid);
  bal := game._cash(p_pid, -nxt.cost, 'upgrade', jsonb_build_object('kind', p_kind, 'level', nxt.level));
  update bases set
    base_level = case when p_kind = 'base' then nxt.level else base_level end,
    security_level = case when p_kind = 'security' then nxt.level else security_level end,
    vault_level = case when p_kind = 'vault' then nxt.level else vault_level end
  where player_id = p_pid;
  insert into security_upgrades (player_id, kind, from_level, to_level, cost)
  values (p_pid, p_kind, cur, nxt.level, nxt.cost);
  perform game._xp(p_pid, 40 * nxt.level * nxt.level, 'upgrade');
  perform game._check_achievements(p_pid);
  if nxt.level >= 5 and not game._is_bot(p_pid) then
    perform game._emit('upgrade', null, p_pid,
      jsonb_build_object('player', pname, 'kind', p_kind, 'level', nxt.level, 'name', nxt.name));
  end if;
  return jsonb_build_object('ok', true, 'kind', p_kind, 'level', nxt.level, 'name', nxt.name, 'cash', bal);
end $$;

-- ---------------------------------------------------------------------------
-- Raids & stealing
-- ---------------------------------------------------------------------------
create or replace function game._raid_chance(p_att uuid, p_def uuid, p_item text, p_revenge boolean) returns numeric
language plpgsql stable set search_path = pg_catalog, game, pg_temp as $$
declare a record; d record; sec int; pen numeric; c numeric;
begin
  select level, prestige into a from profiles where id = p_att;
  select level into d from profiles where id = p_def;
  select security_level into sec from bases where player_id = p_def;
  select ra.steal_penalty into pen from items i join rarities ra on ra.id = i.rarity where i.id = p_item;
  c := 0.62 - 0.07 * (coalesce(sec, 1) - 1) - coalesce(pen, 0)
       + greatest(-0.10, least(0.10, (a.level - d.level) * 0.01))
       + 0.01 * least(coalesce(a.prestige, 0), 10)
       + case when p_revenge then 0.15 else 0 end;
  return round(greatest(0.05, least(0.90, c)), 3);
end $$;

create or replace function game._raid_seconds(p_def uuid, p_item text, p_revenge boolean) returns numeric
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select greatest(6, 5 + 2 * b.security_level + ra.steal_extra_seconds - case when p_revenge then 2 else 0 end)::numeric
  from game.bases b, game.items i join game.rarities ra on ra.id = i.rarity
  where b.player_id = p_def and i.id = p_item
$$;

-- Why can't \`p_att\` raid \`p_def\` right now? (null = they can)
create or replace function game._raid_block_reason(p_att uuid, p_def uuid, p_revenge boolean) returns text
language plpgsql stable set search_path = pg_catalog, game, pg_temp as $$
declare d record; b record;
begin
  if p_att = p_def then return 'That''s your own base.'; end if;
  select * into d from profiles where id = p_def;
  if not found then return 'Player not found.'; end if;
  select * into b from bases where player_id = p_def;
  if not d.is_bot and d.level < 3 then return d.username || ' is under new-player protection.'; end if;
  if not p_revenge and b.shield_until > now() then
    return d.username || '''s base is shielded for ' || ceil(extract(epoch from b.shield_until - now()))::text || 's.';
  end if;
  return null;
end $$;

create or replace function game._revenge_row(p_victim uuid, p_thief uuid) returns uuid
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select id from game.raids
  where attacker_id = p_thief and defender_id = p_victim and status = 'success'
    and not revenge_used and resolved_at > now() - interval '24 hours'
  order by resolved_at desc limit 1
$$;

create or replace function game.act_start_steal(p_pid uuid, p_piid uuid, p_revenge boolean default false) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare a record; pi record; d record; it record; v_chance numeric; dur numeric; rid uuid; tut boolean := false;
        ends timestamptz; reason text; rv uuid;
begin
  select * into a from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  if a.raid_cooldown_until > now() then
    raise exception 'You''re laying low — you can raid again in %s.', ceil(extract(epoch from a.raid_cooldown_until - now()));
  end if;
  if exists (select 1 from raids where attacker_id = p_pid and status = 'active') then
    raise exception 'You''re already in the middle of a raid.';
  end if;
  select * into pi from player_items where id = p_piid for update;
  if not found then raise exception 'That item is gone.'; end if;
  if pi.owner_id = p_pid then raise exception 'You can''t steal from yourself.'; end if;
  if pi.location <> 'display' then raise exception 'That item isn''t on display any more.'; end if;
  if pi.soulbound then raise exception 'Starter items can''t be stolen.'; end if;
  reason := game._raid_block_reason(p_pid, pi.owner_id, p_revenge);
  if reason is not null then raise exception '%', reason; end if;
  if game._under_raid(p_piid) then raise exception 'Someone else is already stealing that!'; end if;
  select * into d from profiles where id = pi.owner_id;
  if p_revenge then
    rv := game._revenge_row(p_pid, pi.owner_id);
    if rv is null then raise exception 'You have no revenge available against %.', d.username; end if;
    update raids set revenge_used = true where id = rv;
  end if;
  select i.*, r.tier into it from items i join rarities r on r.id = i.rarity where i.id = pi.item_id;
  v_chance := game._raid_chance(p_pid, pi.owner_id, pi.item_id, p_revenge);
  dur := game._raid_seconds(pi.owner_id, pi.item_id, p_revenge);
  if coalesce((d.bot->>'tutorial')::boolean, false) and a.tutorial_step between 7 and 11
     and not coalesce((a.tutorial_flags->>'tutorial_raid')::boolean, false) then
    tut := true; v_chance := 1.0; dur := 6;  -- the one-time beginner raid always works
  end if;
  if not a.is_bot and not d.is_bot then
    dur := greatest(dur, 10);  -- a real owner always gets a chance to react
  end if;
  ends := now() + make_interval(secs => dur);
  insert into raids (attacker_id, defender_id, player_item_id, item_id, chance, ends_at, is_revenge, is_tutorial)
  values (p_pid, pi.owner_id, p_piid, pi.item_id, v_chance, ends, p_revenge, tut)
  returning id into rid;
  perform game._emit('raid_warning', pi.owner_id, p_pid, jsonb_build_object(
    'raid_id', rid, 'attacker', a.username, 'attacker_id', p_pid, 'item_id', pi.item_id, 'item', it.name,
    'rarity', it.rarity, 'player_item_id', p_piid, 'ends_at', ends, 'revenge', p_revenge));
  if it.tier >= 7 then
    perform game._emit('raid_alert', null, null, jsonb_build_object(
      'item_id', pi.item_id, 'item', it.name, 'rarity', it.rarity, 'defender', d.username));
  end if;
  return jsonb_build_object('raid_id', rid, 'ends_at', ends, 'started_at', now(), 'duration', dur,
    'chance', v_chance, 'item_id', pi.item_id, 'player_item_id', p_piid, 'defender', d.username,
    'defender_id', d.id, 'tutorial', tut, 'revenge', p_revenge);
end $$;

create or replace function game.act_defend(p_pid uuid, p_raid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record; dname text;
begin
  select * into r from raids where id = p_raid for update;
  if not found or r.defender_id <> p_pid then raise exception 'Raid not found.'; end if;
  if r.status <> 'active' then raise exception 'That raid is already over.'; end if;
  if now() >= r.ends_at then raise exception 'Too late — they''re already out the door!'; end if;
  if r.defended then return jsonb_build_object('ok', true, 'already', true); end if;
  update raids set defended = true, defended_at = now() where id = p_raid;
  select username into dname from profiles where id = p_pid;
  perform game._emit('raid_defended', r.attacker_id, p_pid, jsonb_build_object('raid_id', p_raid, 'defender', dname));
  return jsonb_build_object('ok', true);
end $$;

create or replace function game._raid_result(p_raid uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object(
    'raid_id', r.id, 'status', r.status, 'item_id', r.item_id, 'player_item_id', r.player_item_id,
    'attacker_id', r.attacker_id, 'attacker', a.username, 'defender_id', r.defender_id, 'defender', d.username,
    'defended', r.defended, 'fine', r.fine, 'chance', r.chance, 'note', r.note, 'is_revenge', r.is_revenge,
    'is_tutorial', r.is_tutorial, 'resolved_at', r.resolved_at, 'ends_at', r.ends_at)
  from game.raids r
  join game.profiles a on a.id = r.attacker_id
  join game.profiles d on d.id = r.defender_id
  where r.id = p_raid
$$;

create or replace function game._resolve_raid(p_raid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record; a record; d record; pi record; it record; eff numeric; ok boolean; v_fine bigint := 0;
        v_defended boolean; mprice bigint; res jsonb;
begin
  select * into r from raids where id = p_raid for update;
  if not found then raise exception 'Raid not found.'; end if;
  if r.status <> 'active' then return game._raid_result(p_raid); end if;
  perform 1 from profiles where id in (r.attacker_id, r.defender_id) order by id for update;
  select * into a from profiles where id = r.attacker_id;
  select * into d from profiles where id = r.defender_id;
  select i.*, ra.tier, ra.xp as rxp into it from items i join rarities ra on ra.id = i.rarity where i.id = r.item_id;
  select price into mprice from market_state where item_id = r.item_id;
  select * into pi from player_items where id = r.player_item_id for update;

  if pi.id is null or pi.owner_id <> r.defender_id or pi.location <> 'display' then
    update raids set status = 'blocked', resolved_at = now(), note = 'The owner locked it away just in time!'
    where id = p_raid;
    update profiles set raid_cooldown_until = now() + interval '15 seconds' where id = r.attacker_id;
    perform game._quest_progress(r.attacker_id, 'raid_players', 1);
    if not d.is_bot then
      update player_stats set raids_defended = raids_defended + 1 where player_id = d.id;
      perform game._xp(d.id, 25, 'defend');
      perform game._check_achievements(d.id);
    end if;
    res := game._raid_result(p_raid);
    perform game._emit('raid_result', r.attacker_id, r.defender_id, res);
    perform game._emit('raid_over', r.defender_id, r.attacker_id, res);
    return res;
  end if;

  v_defended := r.defended;
  if d.is_bot and not v_defended and not r.is_tutorial then
    v_defended := random() < coalesce((d.bot->>'defend')::numeric, 0.2);
    if v_defended then update raids set defended = true, defended_at = now() where id = p_raid; end if;
  end if;
  eff := r.chance * case when v_defended then 0.3 else 1 end;
  ok := random() < eff;

  if ok then
    perform game._settle(r.defender_id);
    perform game._transfer(r.player_item_id, r.attacker_id, 'steal', null, interval '5 minutes');
    update bases set shield_until = now() + case when d.is_bot then interval '45 seconds' else interval '10 minutes' end
    where player_id = r.defender_id;
    update profiles set raid_cooldown_until = now() + interval '20 seconds' where id = r.attacker_id;
    update player_stats set steals_won = steals_won + 1, best_item_value = greatest(best_item_value, mprice)
    where player_id = r.attacker_id;
    update player_stats set times_robbed = times_robbed + 1 where player_id = r.defender_id;
    update raids set status = 'success', resolved_at = now() where id = p_raid;
    if r.is_tutorial then
      update profiles set tutorial_flags = tutorial_flags || '{"tutorial_raid": true}'::jsonb where id = r.attacker_id;
    end if;
    perform game._settle(r.attacker_id);
    perform game._autoplace(r.attacker_id, r.player_item_id);
    perform game._xp(r.attacker_id, 40 + it.rxp, 'steal');
    perform game._quest_progress(r.attacker_id, 'raid_players', 1);
    perform game._check_achievements(r.attacker_id);
    res := game._raid_result(p_raid);
    perform game._emit('raid_result', r.attacker_id, r.defender_id, res || jsonb_build_object('item', it.name, 'rarity', it.rarity));
    perform game._emit('item_stolen', r.defender_id, r.attacker_id, res || jsonb_build_object('item', it.name, 'rarity', it.rarity));
    if it.tier >= 5 then
      perform game._emit('steal', null, r.attacker_id, jsonb_build_object(
        'attacker', a.username, 'defender', d.username, 'item_id', it.id, 'item', it.name, 'rarity', it.rarity,
        'revenge', r.is_revenge));
    end if;
  else
    if not r.is_tutorial then
      v_fine := least(floor(a.cash * 0.03), floor(coalesce(mprice, it.base_value) * 0.05))::bigint;
    end if;
    if v_fine > 0 then
      perform game._cash(r.attacker_id, -v_fine, 'raid_fine', jsonb_build_object('raid_id', p_raid));
      perform game._cash(r.defender_id, v_fine, 'raid_bounty', jsonb_build_object('raid_id', p_raid));
    end if;
    update profiles set raid_cooldown_until = now() + case when v_defended then interval '60 seconds' else interval '40 seconds' end
    where id = r.attacker_id;
    update player_stats set steals_failed = steals_failed + 1 where player_id = r.attacker_id;
    if v_defended then
      update player_stats set raids_defended = raids_defended + 1 where player_id = r.defender_id;
      perform game._xp(r.defender_id, 25, 'defend');
    end if;
    update raids set status = 'failed', fine = v_fine, resolved_at = now(),
      note = case when v_defended then 'The alarm went off!' else 'You got spotted by security.' end
    where id = p_raid;
    perform game._xp(r.attacker_id, 5, 'raid');
    perform game._quest_progress(r.attacker_id, 'raid_players', 1);
    perform game._check_achievements(r.attacker_id);
    perform game._check_achievements(r.defender_id);
    res := game._raid_result(p_raid);
    perform game._emit('raid_result', r.attacker_id, r.defender_id, res || jsonb_build_object('item', it.name, 'rarity', it.rarity));
    perform game._emit('raid_over', r.defender_id, r.attacker_id, res || jsonb_build_object('item', it.name, 'rarity', it.rarity));
  end if;
  return res;
end $$;

create or replace function game.act_finish_steal(p_pid uuid, p_raid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record;
begin
  select * into r from raids where id = p_raid;
  if not found or r.attacker_id <> p_pid then raise exception 'Raid not found.'; end if;
  if r.status <> 'active' then return game._raid_result(p_raid); end if;
  if now() < r.ends_at - interval '750 milliseconds' then
    raise exception 'Still stealing… %s to go!', ceil(extract(epoch from r.ends_at - now()));
  end if;
  return game._resolve_raid(p_raid);
end $$;

-- ---------------------------------------------------------------------------
-- Market
-- ---------------------------------------------------------------------------
create or replace function game.act_list(p_pid uuid, p_piid uuid, p_price bigint) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare pi game.player_items; mprice bigint; lo bigint; hi bigint; lid uuid; it record;
begin
  perform 1 from profiles where id = p_pid for update;
  pi := game._own_item(p_pid, p_piid);
  if pi.soulbound then raise exception 'Your starter item can''t be sold.'; end if;
  if pi.location = 'listed' then raise exception 'That item is already listed.'; end if;
  if pi.hot_until > now() then
    raise exception 'That item is too hot to sell — wait %s.', ceil(extract(epoch from pi.hot_until - now()));
  end if;
  if game._under_raid(p_piid) then raise exception 'Someone is stealing that right now!'; end if;
  select i.* into it from items i where i.id = pi.item_id;
  if not it.tradeable then raise exception 'That item can''t be traded.'; end if;
  select price into mprice from market_state where item_id = pi.item_id;
  lo := greatest(1, floor(mprice * 0.25))::bigint;
  hi := (mprice * 5)::bigint;
  if p_price is null or p_price < lo or p_price > hi then
    raise exception 'Price must be between % and %.', game.fmt_money(lo), game.fmt_money(hi);
  end if;
  if (select count(*) from market_listings where seller_id = p_pid and status = 'active') >= 20 then
    raise exception 'You can have at most 20 active listings.';
  end if;
  perform game._settle(p_pid);
  update player_items set location = 'listed', slot = null where id = p_piid;
  insert into market_listings (seller_id, player_item_id, item_id, price)
  values (p_pid, p_piid, pi.item_id, p_price) returning id into lid;
  update market_state set listed = listed + 1 where item_id = pi.item_id;
  return jsonb_build_object('ok', true, 'listing_id', lid);
end $$;

create or replace function game.act_cancel_listing(p_pid uuid, p_lid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare l record;
begin
  perform 1 from profiles where id = p_pid for update;
  select * into l from market_listings where id = p_lid and seller_id = p_pid for update;
  if not found or l.status <> 'active' then raise exception 'Listing not found.'; end if;
  update market_listings set status = 'cancelled', resolved_at = now() where id = p_lid;
  update player_items set location = 'inventory' where id = l.player_item_id;
  update market_state set listed = greatest(0, listed - 1) where item_id = l.item_id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function game.act_buy_listing(p_pid uuid, p_lid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare l record; fee bigint; bal bigint; it record; bname text; sname text; sbot boolean; v_slot int;
begin
  select * into l from market_listings where id = p_lid for update;
  if not found or l.status <> 'active' then raise exception 'That listing is no longer available.'; end if;
  if l.seller_id = p_pid then raise exception 'You can''t buy your own listing.'; end if;
  perform 1 from profiles where id in (p_pid, l.seller_id) order by id for update;
  select username into bname from profiles where id = p_pid;
  if bname is null then raise exception 'Create your player first.'; end if;
  select username, is_bot into sname, sbot from profiles where id = l.seller_id;
  select i.*, r.tier into it from items i join rarities r on r.id = i.rarity where i.id = l.item_id;
  perform game._settle(p_pid);
  bal := game._cash(p_pid, -l.price, 'market_buy', jsonb_build_object('listing_id', p_lid, 'item_id', l.item_id));
  fee := ceil(l.price * 0.05)::bigint;
  perform game._cash(l.seller_id, l.price - fee, 'market_sale',
    jsonb_build_object('listing_id', p_lid, 'item_id', l.item_id, 'fee', fee));
  perform game._transfer(l.player_item_id, p_pid, 'market', l.price);
  update market_listings set status = 'sold', buyer_id = p_pid, resolved_at = now() where id = p_lid;
  insert into market_sales (item_id, price, seller_id, buyer_id, kind)
  values (l.item_id, l.price, l.seller_id, p_pid, 'listing');
  update market_state set
    price = greatest(1, round(price * 0.85 + greatest(price * 0.6, least(price * 1.6, l.price)) * 0.15)),
    demand = least(100, demand + 2),
    listed = greatest(0, listed - 1)
  where item_id = l.item_id;
  update player_stats set market_buys = market_buys + 1 where player_id = p_pid;
  update player_stats set market_sales = market_sales + 1 where player_id = l.seller_id;
  perform game._quest_progress(p_pid, 'complete_trades', 1);
  perform game._quest_progress(l.seller_id, 'complete_trades', 1);
  perform game._quest_progress(l.seller_id, 'sell_item', 1);
  perform game._xp(p_pid, 15, 'market');
  perform game._xp(l.seller_id, 15, 'market');
  v_slot := game._autoplace(p_pid, l.player_item_id);
  perform game._check_achievements(p_pid);
  perform game._check_achievements(l.seller_id);
  perform game._emit('listing_sold', l.seller_id, p_pid, jsonb_build_object(
    'buyer', bname, 'item_id', l.item_id, 'item', it.name, 'price', l.price, 'fee', fee));
  if it.tier >= 6 then
    perform game._emit('big_sale', null, p_pid, jsonb_build_object(
      'buyer', bname, 'seller', sname, 'item_id', l.item_id, 'item', it.name, 'rarity', it.rarity, 'price', l.price));
  end if;
  return jsonb_build_object('ok', true, 'price', l.price, 'cash', bal, 'player_item_id', l.player_item_id,
                            'placed', v_slot is not null);
end $$;

-- ---------------------------------------------------------------------------
-- Trades (both players must confirm: proposing = confirm #1, accepting = confirm #2)
-- ---------------------------------------------------------------------------
create or replace function game._value_of(p_items uuid[]) returns bigint
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce(sum(ms.price), 0)::bigint
  from game.player_items pi join game.market_state ms on ms.item_id = pi.item_id
  where pi.id = any(p_items)
$$;

create or replace function game.act_trade_propose(p_pid uuid, p jsonb) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare v_to uuid; oi uuid[]; ri uuid[]; oc bigint; rc bigint; msg text; me record; them record; tid uuid;
begin
  begin
    v_to := (p->>'to')::uuid;
    oi := coalesce(array(select (jsonb_array_elements_text(coalesce(p->'offer_items', '[]'::jsonb)))::uuid), '{}');
    ri := coalesce(array(select (jsonb_array_elements_text(coalesce(p->'request_items', '[]'::jsonb)))::uuid), '{}');
    oc := coalesce((p->>'offer_cash')::bigint, 0);
    rc := coalesce((p->>'request_cash')::bigint, 0);
  exception when others then
    raise exception 'Invalid trade offer.';
  end;
  msg := left(coalesce(p->>'message', ''), 140);
  if v_to is null or v_to = p_pid then raise exception 'Pick someone else to trade with.'; end if;
  if oc < 0 or rc < 0 then raise exception 'Cash amounts can''t be negative.'; end if;
  if cardinality(oi) > 8 or cardinality(ri) > 8 then raise exception 'At most 8 items on each side.'; end if;
  if cardinality(oi) = 0 and cardinality(ri) = 0 then raise exception 'A trade needs at least one item.'; end if;
  if (select count(distinct x) from unnest(oi || ri) x) <> cardinality(oi) + cardinality(ri) then
    raise exception 'Duplicate items in the offer.';
  end if;
  select * into me from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  select * into them from profiles where id = v_to;
  if not found then raise exception 'Player not found.'; end if;
  if oc > me.cash then raise exception 'You don''t have that much cash.'; end if;
  if exists (select 1 from unnest(oi) x left join player_items pi on pi.id = x
             where pi.id is null or pi.owner_id <> p_pid) then
    raise exception 'You can only offer your own items.';
  end if;
  if exists (select 1 from player_items pi join items i on i.id = pi.item_id where pi.id = any(oi)
             and (pi.soulbound or not i.tradeable or pi.location = 'listed' or pi.hot_until > now())) then
    raise exception 'Some offered items can''t be traded right now (starter, listed or too hot).';
  end if;
  if exists (select 1 from unnest(ri) x left join player_items pi on pi.id = x
             where pi.id is null or pi.owner_id <> v_to) then
    raise exception 'Requested items must belong to %.', them.username;
  end if;
  if exists (select 1 from player_items pi join items i on i.id = pi.item_id where pi.id = any(ri)
             and (pi.soulbound or not i.tradeable or pi.location in ('listed', 'vault') or pi.hot_until > now())) then
    raise exception 'Some requested items aren''t available for trade.';
  end if;
  if (select count(*) from trades where from_id = p_pid and status = 'pending') >= 10 then
    raise exception 'You already have 10 open offers — cancel some first.';
  end if;
  insert into trades (from_id, to_id, offer_items, offer_cash, request_items, request_cash, message, snapshot)
  values (p_pid, v_to, oi, oc, ri, rc, msg, jsonb_build_object(
    'offer_value', game._value_of(oi) + oc, 'request_value', game._value_of(ri) + rc))
  returning id into tid;
  perform game._emit('trade_offer', v_to, p_pid, jsonb_build_object(
    'trade_id', tid, 'from', me.username, 'offer_value', game._value_of(oi) + oc,
    'request_value', game._value_of(ri) + rc));
  return jsonb_build_object('ok', true, 'trade_id', tid);
end $$;

create or replace function game._execute_trade(p_trade uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare t record; bad text; v_x uuid; fname text; tname text; total bigint;
begin
  select * into t from trades where id = p_trade for update;
  if t.status <> 'pending' then raise exception 'That offer is no longer pending.'; end if;
  perform 1 from profiles where id in (t.from_id, t.to_id) order by id for update;
  select username into fname from profiles where id = t.from_id;
  select username into tname from profiles where id = t.to_id;
  if exists (select 1 from unnest(t.offer_items) x left join player_items pi on pi.id = x
             where pi.id is null or pi.owner_id <> t.from_id or pi.location = 'listed' or pi.soulbound
                or pi.hot_until > now()) then
    bad := fname || ' no longer has everything they offered.';
  elsif exists (select 1 from unnest(t.request_items) x left join player_items pi on pi.id = x
             where pi.id is null or pi.owner_id <> t.to_id or pi.location in ('listed', 'vault') or pi.soulbound
                or pi.hot_until > now()) then
    bad := tname || ' no longer has everything requested.';
  elsif exists (select 1 from raids where status = 'active' and player_item_id = any(t.offer_items || t.request_items)) then
    bad := 'An item in this trade is being stolen right now!';
  elsif (select cash from profiles where id = t.from_id) < t.offer_cash then
    bad := fname || ' doesn''t have enough cash any more.';
  elsif (select cash from profiles where id = t.to_id) < t.request_cash then
    bad := tname || ' doesn''t have enough cash.';
  end if;
  if bad is not null then
    update trades set status = 'failed', note = bad, resolved_at = now() where id = p_trade;
    perform game._emit('trade_failed', t.from_id, t.to_id, jsonb_build_object('trade_id', p_trade, 'reason', bad));
    perform game._emit('trade_failed', t.to_id, t.from_id, jsonb_build_object('trade_id', p_trade, 'reason', bad));
    return jsonb_build_object('ok', false, 'reason', bad);
  end if;
  total := game._value_of(t.offer_items || t.request_items) + t.offer_cash + t.request_cash;
  perform game._settle(t.from_id);
  perform game._settle(t.to_id);
  foreach v_x in array t.offer_items loop perform game._transfer(v_x, t.to_id, 'trade'); end loop;
  foreach v_x in array t.request_items loop perform game._transfer(v_x, t.from_id, 'trade'); end loop;
  if t.offer_cash > 0 then
    perform game._cash(t.from_id, -t.offer_cash, 'trade', jsonb_build_object('trade_id', p_trade));
    perform game._cash(t.to_id, t.offer_cash, 'trade', jsonb_build_object('trade_id', p_trade));
  end if;
  if t.request_cash > 0 then
    perform game._cash(t.to_id, -t.request_cash, 'trade', jsonb_build_object('trade_id', p_trade));
    perform game._cash(t.from_id, t.request_cash, 'trade', jsonb_build_object('trade_id', p_trade));
  end if;
  foreach v_x in array t.offer_items loop perform game._autoplace(t.to_id, v_x); end loop;
  foreach v_x in array t.request_items loop perform game._autoplace(t.from_id, v_x); end loop;
  update trades set status = 'accepted', resolved_at = now() where id = p_trade;
  update player_stats set trades_done = trades_done + 1 where player_id in (t.from_id, t.to_id);
  perform game._quest_progress(t.from_id, 'complete_trades', 1);
  perform game._quest_progress(t.to_id, 'complete_trades', 1);
  perform game._xp(t.from_id, 30, 'trade');
  perform game._xp(t.to_id, 30, 'trade');
  perform game._check_achievements(t.from_id);
  perform game._check_achievements(t.to_id);
  perform game._emit('trade_done', t.from_id, t.to_id, jsonb_build_object('trade_id', p_trade, 'with', tname));
  perform game._emit('trade_done', t.to_id, t.from_id, jsonb_build_object('trade_id', p_trade, 'with', fname));
  if total >= 1000000 then
    perform game._emit('big_trade', null, t.from_id, jsonb_build_object('a', fname, 'b', tname, 'value', total));
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function game.act_trade_respond(p_pid uuid, p_trade uuid, p_accept boolean) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare t record; me text;
begin
  select * into t from trades where id = p_trade for update;
  if not found or t.to_id <> p_pid then raise exception 'Trade not found.'; end if;
  if t.status <> 'pending' then raise exception 'That offer is no longer pending (%).', t.status; end if;
  if not p_accept then
    update trades set status = 'declined', resolved_at = now() where id = p_trade;
    select username into me from profiles where id = p_pid;
    perform game._emit('trade_declined', t.from_id, p_pid, jsonb_build_object('trade_id', p_trade, 'by', me));
    return jsonb_build_object('ok', true, 'status', 'declined');
  end if;
  return game._execute_trade(p_trade);
end $$;

create or replace function game.act_trade_cancel(p_pid uuid, p_trade uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare t record;
begin
  select * into t from trades where id = p_trade for update;
  if not found or t.from_id <> p_pid then raise exception 'Trade not found.'; end if;
  if t.status <> 'pending' then raise exception 'That offer is no longer pending.'; end if;
  update trades set status = 'cancelled', resolved_at = now() where id = p_trade;
  return jsonb_build_object('ok', true);
end $$;

-- ---------------------------------------------------------------------------
-- Quests, daily rewards, cosmetics, focus, tutorial, prestige
-- ---------------------------------------------------------------------------
create or replace function game._tvs_this_week(p_pid uuid) returns bigint
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select count(distinct l.item_id) from game.item_log l join game.items i on i.id = l.item_id
  where l.to_id = p_pid and i.kind = 'tv'
    and l.created_at >= (date_trunc('week', now() at time zone 'utc') at time zone 'utc')
$$;

create or replace function game.act_quests(p_pid uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', q.id, 'period', q.period, 'title', q.title, 'metric', q.metric, 'target', q.target, 'reward', q.reward,
    'progress', least(q.target, case when q.metric = 'collect_tvs' then game._tvs_this_week(p_pid) else coalesce(pq.progress, 0) end),
    'claimed', pq.claimed_at is not null,
    'resets_at', game._period_end(q.period)) order by q.sort), '[]'::jsonb)
  from game.quests q
  left join game.player_quests pq on pq.player_id = p_pid and pq.quest_id = q.id and pq.period_key = game._period_key(q.period)
$$;

create or replace function game.act_claim_quest(p_pid uuid, p_quest text) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare q record; v_key text; v_progress bigint; v_claimed timestamptz; rate double precision; v_cash bigint := 0;
        r jsonb; tk record;
begin
  perform 1 from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  select * into q from quests where id = p_quest;
  if not found then raise exception 'Unknown quest.'; end if;
  v_key := game._period_key(q.period);
  select progress, claimed_at into v_progress, v_claimed from player_quests
  where player_id = p_pid and quest_id = p_quest and period_key = v_key for update;
  if q.metric = 'collect_tvs' then v_progress := game._tvs_this_week(p_pid); end if;
  if coalesce(v_progress, 0) < q.target then raise exception 'Quest not complete yet.'; end if;
  if v_claimed is not null then raise exception 'Already claimed — new quests soon!'; end if;
  insert into player_quests (player_id, quest_id, period_key, progress, claimed_at)
  values (p_pid, p_quest, v_key, v_progress, now())
  on conflict (player_id, quest_id, period_key) do update set claimed_at = now();
  perform game._settle(p_pid);
  rate := game._income_rate(p_pid);
  r := q.reward;
  v_cash := greatest(coalesce((r->>'cash')::bigint, 0), floor(rate * coalesce((r->>'income_secs')::numeric, 0))::bigint);
  if v_cash > 0 then perform game._cash(p_pid, v_cash, 'quest', jsonb_build_object('quest', p_quest)); end if;
  if r ? 'tokens' then
    for tk in select key, value::int as n from jsonb_each_text(r->'tokens') loop
      perform game._add_tokens(p_pid, tk.key, tk.n);
    end loop;
  end if;
  if r ? 'secret_keys' then
    update profiles set secret_keys = secret_keys + (r->>'secret_keys')::int where id = p_pid;
  end if;
  if r ? 'cosmetic' then
    insert into player_cosmetics (player_id, cosmetic_id) values (p_pid, r->>'cosmetic') on conflict do nothing;
  end if;
  perform game._xp(p_pid, coalesce((r->>'xp')::bigint, 0), 'quest');
  perform game._check_achievements(p_pid);
  return jsonb_build_object('ok', true, 'cash', v_cash, 'tokens', r->'tokens', 'xp', r->'xp',
                            'secret_keys', r->'secret_keys', 'cosmetic', r->'cosmetic');
end $$;

create or replace function game._daily_status(p_pid uuid) returns jsonb
language plpgsql stable set search_path = pg_catalog, game, pg_temp as $$
declare p record; today date := (now() at time zone 'utc')::date; nxt int; can boolean;
begin
  select daily_streak, last_daily_day into p from profiles where id = p_pid;
  can := p.last_daily_day is distinct from today;
  nxt := case when p.last_daily_day = today - 1 or p.last_daily_day = today then p.daily_streak + (case when can then 1 else 0 end) else 1 end;
  return jsonb_build_object('can_claim', can, 'streak', case when p.last_daily_day >= today - 1 then p.daily_streak else 0 end,
    'next_day', ((greatest(nxt, 1) - 1) % 7) + 1,
    'resets_at', (date_trunc('day', now() at time zone 'utc') + interval '1 day') at time zone 'utc');
end $$;

create or replace function game.act_claim_daily(p_pid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare p record; today date := (now() at time zone 'utc')::date; v_streak int; v_day int; rate double precision;
        reward jsonb; v_cash bigint; v_item text; v_id uuid;
begin
  select * into p from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  if p.last_daily_day = today then raise exception 'Already claimed today — come back tomorrow!'; end if;
  v_streak := case when p.last_daily_day = today - 1 then p.daily_streak + 1 else 1 end;
  v_day := ((v_streak - 1) % 7) + 1;
  perform game._settle(p_pid);
  rate := game._income_rate(p_pid);
  if v_day = 1 then
    v_cash := greatest(2500, floor(rate * 120))::bigint;
    perform game._cash(p_pid, v_cash, 'daily', jsonb_build_object('day', v_day));
    reward := jsonb_build_object('type', 'cash', 'cash', v_cash);
  elsif v_day = 2 then
    perform game._add_tokens(p_pid, 'basic', 2);
    reward := jsonb_build_object('type', 'tokens', 'drop', 'basic', 'count', 2);
  elsif v_day = 3 then
    v_cash := greatest(6000, floor(rate * 300))::bigint;
    perform game._cash(p_pid, v_cash, 'daily', jsonb_build_object('day', v_day));
    reward := jsonb_build_object('type', 'cash', 'cash', v_cash);
  elsif v_day = 4 then
    select id into v_item from items where rarity = 'rare' and droppable order by random() limit 1;
    v_id := game._grant(p_pid, v_item, 'daily');
    perform game._autoplace(p_pid, v_id);
    reward := jsonb_build_object('type', 'item', 'item_id', v_item, 'player_item_id', v_id);
  elsif v_day = 5 then
    perform game._add_tokens(p_pid, 'premium', 1);
    reward := jsonb_build_object('type', 'tokens', 'drop', 'premium', 'count', 1);
  elsif v_day = 6 then
    v_cash := greatest(30000, floor(rate * 900))::bigint;
    perform game._cash(p_pid, v_cash, 'daily', jsonb_build_object('day', v_day));
    reward := jsonb_build_object('type', 'cash', 'cash', v_cash);
  else
    select id into v_item from items where event_only order by random() limit 1;
    v_id := game._grant(p_pid, v_item, 'daily');
    perform game._autoplace(p_pid, v_id);
    update profiles set secret_keys = secret_keys + 1 where id = p_pid;
    reward := jsonb_build_object('type', 'item', 'item_id', v_item, 'player_item_id', v_id, 'secret_keys', 1);
  end if;
  update profiles set daily_streak = v_streak, last_daily_day = today where id = p_pid;
  insert into daily_rewards (player_id, day, streak, cycle_day, reward) values (p_pid, today, v_streak, v_day, reward)
  on conflict (player_id, day) do update set streak = excluded.streak, cycle_day = excluded.cycle_day, reward = excluded.reward;
  perform game._xp(p_pid, 25 * v_day, 'daily');
  perform game._check_achievements(p_pid);
  return reward || jsonb_build_object('ok', true, 'day', v_day, 'streak', v_streak);
end $$;

create or replace function game.act_buy_cosmetic(p_pid uuid, p_id text) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare c record; p record;
begin
  select * into p from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  select * into c from cosmetics where id = p_id;
  if not found then raise exception 'Unknown cosmetic.'; end if;
  if exists (select 1 from player_cosmetics where player_id = p_pid and cosmetic_id = p_id) then
    raise exception 'You already own that.';
  end if;
  if c.unlock is not null then
    if c.unlock like 'level:%' and p.level >= split_part(c.unlock, ':', 2)::int then null;
    elsif c.unlock like 'prestige:%' and p.prestige >= split_part(c.unlock, ':', 2)::int then null;
    else raise exception 'Locked — %.', case
        when c.unlock like 'level:%' then 'reach level ' || split_part(c.unlock, ':', 2)
        when c.unlock like 'prestige:%' then 'reach prestige ' || split_part(c.unlock, ':', 2)
        else 'earn it from a quest' end;
    end if;
  else
    perform game._settle(p_pid);
    perform game._cash(p_pid, -c.price, 'cosmetic', jsonb_build_object('id', p_id));
  end if;
  insert into player_cosmetics (player_id, cosmetic_id) values (p_pid, p_id);
  return jsonb_build_object('ok', true);
end $$;

create or replace function game.act_equip(p_pid uuid, p_id text) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare c record;
begin
  perform 1 from profiles where id = p_pid for update;
  select * into c from cosmetics where id = p_id;
  if not found then raise exception 'Unknown cosmetic.'; end if;
  if not exists (select 1 from player_cosmetics where player_id = p_pid and cosmetic_id = p_id) then
    raise exception 'You don''t own that yet.';
  end if;
  update profiles set cosmetics = cosmetics || jsonb_build_object(c.slot, p_id) where id = p_pid;
  return jsonb_build_object('ok', true);
end $$;

create or replace function game.act_set_focus(p_pid uuid, p_focus text) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare lvl int;
begin
  select level into lvl from profiles where id = p_pid for update;
  if p_focus not in ('RANDOM', 'TECH', 'GAMING', 'CARS', 'FASHION', 'LUXURY', 'SPORTS') then
    raise exception 'Unknown collection.';
  end if;
  if p_focus <> 'RANDOM' and lvl < 5 then raise exception 'Choosing a collection focus unlocks at level 5.'; end if;
  update profiles set collection_focus = p_focus where id = p_pid;
  return jsonb_build_object('ok', true, 'focus', p_focus);
end $$;

-- Tutorial steps (client and server agree):
--  1 welcome · 2 first TV · 3 your base · 4 income · 5 cash for first drop · 6 open it
--  7 rarities · 8 another base · 9 stealing · 10 beginner raid · 11 market · 12 explore (99 = done)
create or replace function game.act_tutorial(p_pid uuid, p_step int) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare p record; basic bigint; granted bigint := 0;
begin
  select * into p from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  if p.tutorial_step >= 99 then return jsonb_build_object('ok', true, 'step', 99); end if;
  if p_step is null or p_step <= p.tutorial_step then return jsonb_build_object('ok', true, 'step', p.tutorial_step); end if;
  select price into basic from drop_types where id = 'basic';
  if p_step >= 5 and not coalesce((p.tutorial_flags->>'first_drop_cash')::boolean, false)
     and not exists (select 1 from player_stats where player_id = p_pid and drops_opened > 0) then
    perform game._cash(p_pid, basic, 'tutorial', jsonb_build_object('step', 5));
    granted := basic;
    update profiles set tutorial_flags = tutorial_flags || '{"first_drop_cash": true}'::jsonb where id = p_pid;
  end if;
  if p_step >= 12 then
    if not coalesce((p.tutorial_flags->>'done')::boolean, false) then
      perform game._add_tokens(p_pid, 'basic', 1);
      update profiles set tutorial_flags = tutorial_flags || '{"done": true}'::jsonb where id = p_pid;
    end if;
    update profiles set tutorial_step = 99 where id = p_pid;
    return jsonb_build_object('ok', true, 'step', 99, 'cash', granted, 'tokens', jsonb_build_object('basic', 1));
  end if;
  update profiles set tutorial_step = p_step where id = p_pid;
  return jsonb_build_object('ok', true, 'step', p_step, 'cash', granted);
end $$;

create or replace function game.act_prestige(p_pid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare p record; newp int; burned int; oldcash bigint; newcash bigint;
begin
  select * into p from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  if p.level < 25 then raise exception 'Reach level 25 to prestige.'; end if;
  if exists (select 1 from raids where attacker_id = p_pid and status = 'active') then
    raise exception 'Finish your raid first.';
  end if;
  perform game._settle(p_pid);
  update trades set status = 'cancelled', note = 'Prestige reset', resolved_at = now()
  where status = 'pending' and (from_id = p_pid or to_id = p_pid);
  update market_listings set status = 'cancelled', resolved_at = now() where seller_id = p_pid and status = 'active';
  insert into item_log (player_item_id, item_id, from_id, to_id, via)
    select id, item_id, owner_id, null, 'prestige' from player_items
    where owner_id = p_pid and location <> 'vault' and not soulbound;
  delete from player_items where owner_id = p_pid and location <> 'vault' and not soulbound;
  get diagnostics burned = row_count;
  newp := p.prestige + 1;
  select cash into oldcash from profiles where id = p_pid;
  newcash := 5000::bigint * newp;
  update profiles set prestige = newp, level = 1, xp = 0, cash = newcash, income_remainder = 0,
    drop_tokens = jsonb_build_object('basic', 3, 'premium', 1), raid_cooldown_until = null
  where id = p_pid;
  insert into transactions (player_id, kind, amount, balance_after, ref)
  values (p_pid, 'prestige_reset', newcash - oldcash, newcash, jsonb_build_object('prestige', newp));
  update bases set base_level = 1, security_level = 1, shield_until = now() + interval '30 minutes'
  where player_id = p_pid;
  update player_items set location = 'display', slot = 0 where owner_id = p_pid and soulbound and location <> 'vault';
  insert into player_cosmetics (player_id, cosmetic_id)
    select p_pid, c.id from cosmetics c
    where c.unlock like 'prestige:%' and split_part(c.unlock, ':', 2)::int <= newp
  on conflict do nothing;
  perform game._check_achievements(p_pid);
  perform game._emit('prestige', null, p_pid, jsonb_build_object('player', p.username, 'prestige', newp));
  return jsonb_build_object('ok', true, 'prestige', newp, 'burned', burned);
end $$;

-- ---------------------------------------------------------------------------
-- Player creation
-- ---------------------------------------------------------------------------
create or replace function game.act_join(p_pid uuid, p_username text) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare v_name text := trim(coalesce(p_username, '')); v_id uuid;
begin
  if exists (select 1 from profiles where id = p_pid) then return jsonb_build_object('ok', true, 'existing', true); end if;
  if v_name !~ '^[A-Za-z0-9_]{3,16}$' then
    raise exception 'Usernames are 3–16 characters: letters, numbers or _.';
  end if;
  if exists (select 1 from profiles where lower(username) = lower(v_name)) then
    raise exception 'That username is taken.';
  end if;
  insert into profiles (id, username, cash, cosmetics)
  values (p_pid, v_name, 500, jsonb_build_object(
    'theme', 'theme-neon', 'floor', 'floor-grid', 'wall', 'wall-panel', 'lighting', 'light-cyan',
    'platform', 'plat-basic', 'trail', 'trail-none', 'nameplate', 'name-default', 'emote', 'emote-wave'));
  insert into bases (player_id) values (p_pid);
  insert into player_stats (player_id) values (p_pid);
  insert into player_cosmetics (player_id, cosmetic_id)
    select p_pid, id from cosmetics where price = 0 and unlock is null
  on conflict do nothing;
  v_id := game._grant(p_pid, 'nova-starter-tv', 'starter');
  update player_items set location = 'display', slot = 0 where id = v_id;
  perform game._emit('player_joined', null, p_pid, jsonb_build_object('player', v_name));
  return jsonb_build_object('ok', true, 'existing', false);
end $$;

-- Keep items_rev in sync so clients can skip re-downloading unchanged inventories.
create or replace function game._bump_items_rev() returns trigger
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    update profiles set items_rev = items_rev + 1 where id = new.owner_id;
  end if;
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and old.owner_id <> new.owner_id) then
    update profiles set items_rev = items_rev + 1 where id = old.owner_id;
  end if;
  return null;
end $$;

drop trigger if exists player_items_rev on game.player_items;
create trigger player_items_rev after insert or update or delete on game.player_items
  for each row execute function game._bump_items_rev();
`,c1=`-- ============================================================================
-- STEAL THE TECH — the living world
--
-- world_tick() advances the simulation: live events, the dynamic market,
-- price history, raid resolution, expiring trades and NPC bot behaviour.
-- It runs lazily (at most every 10s) whenever any player calls the API, and
-- can also be scheduled with pg_cron:  select cron.schedule('stt-tick', '* * * * *', 'select game.world_tick()');
-- ============================================================================

create index if not exists market_history_ts on game.market_history (ts);

-- ---------------------------------------------------------------------------
-- One-time world seeding: NPC collections + 30 days of market history
-- ---------------------------------------------------------------------------
create or replace function game._seed_bots() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare b record; r text; v_item text; x text;
begin
  for b in select * from profiles where is_bot and not coalesce((bot->>'seeded')::boolean, false) loop
    for r in select jsonb_array_elements_text(b.bot->'plan') loop
      select id into v_item from items where rarity = r and droppable order by random() limit 1;
      if v_item is not null then perform game._grant(b.id, v_item, 'seed'); end if;
    end loop;
    for x in select jsonb_array_elements_text(coalesce(b.bot->'extra', '[]'::jsonb)) loop
      begin
        perform game._grant(b.id, x, 'seed');
      exception when others then null;  -- sold out or unknown: skip
      end;
    end loop;
    perform game._arrange_best(b.id);
    update profiles set bot = bot || '{"seeded": true}'::jsonb, last_income_at = now() where id = b.id;
  end loop;
end $$;

create or replace function game._seed_history() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare base timestamptz := date_trunc('hour', now());
begin
  if exists (select 1 from market_history limit 1) then return; end if;
  -- Backwards random walk that ends at today's price.
  insert into market_history (item_id, ts, price, demand, supply, listed, volume)
  select item_id, ts,
         greatest(1, round(price * exp(walk)))::bigint,
         round(greatest(5, least(95, 50 + walk * 60))::numeric, 1), 0, 0, 0
  from (
    select ms.item_id, ms.price, t.ts,
           sum(t.step * (random() - 0.5) * 0.05) over (partition by ms.item_id order by t.ts desc
             rows between unbounded preceding and current row) as walk
    from market_state ms
    cross join lateral (
      select g as ts, 1.0 as step from generate_series(base - interval '2 hours', base, interval '10 minutes') g
      union all
      select g, 1.6 from generate_series(base - interval '48 hours', base - interval '3 hours', interval '1 hour') g
      union all
      select g, 2.6 from generate_series(base - interval '7 days', base - interval '52 hours', interval '4 hours') g
      union all
      select g, 4.2 from generate_series(date_trunc('day', base) - interval '30 days', date_trunc('day', base) - interval '8 days', interval '1 day') g
    ) t
  ) w
  on conflict (item_id, ts) do nothing;
end $$;

-- ---------------------------------------------------------------------------
-- Tick pieces
-- ---------------------------------------------------------------------------
create or replace function game._tick_events() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare ev record; w record; et record; cat text; dur interval := interval '8 minutes';
begin
  for ev in
    select e.*, t.title, t.icon from events e join event_types t on t.id = e.type_id
    where e.ends_at <= now() and not e.announced_end
  loop
    update events set announced_end = true where id = ev.id;
    perform game._emit('event_end', null, null, jsonb_build_object('type', ev.type_id, 'title', ev.title, 'icon', ev.icon));
  end loop;
  if exists (select 1 from events where now() >= starts_at and now() < ends_at) then return; end if;
  select * into w from world where id = 1;
  if w.next_event_at is null then
    update world set next_event_at = now() + interval '2 minutes' where id = 1;
    return;
  end if;
  if now() < w.next_event_at then return; end if;
  select * into et from event_types order by -ln(1 - random()) / weight limit 1;
  cat := case when et.category = '*'
              then (array['TECH','GAMING','CARS','FASHION','LUXURY','SPORTS'])[1 + floor(random() * 6)::int]
              else et.category end;
  insert into events (type_id, category, starts_at, ends_at) values (et.id, cat, now(), now() + dur);
  update world set next_event_at = now() + dur + make_interval(mins => 4 + floor(random() * 6)::int) where id = 1;
  perform game._emit('event_start', null, null, jsonb_build_object(
    'type', et.id, 'title', et.title, 'icon', et.icon, 'description', et.description,
    'category', cat, 'ends_at', now() + dur));
end $$;

create or replace function game._tick_market(p_dt double precision) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare ev record; m record; k double precision; newd double precision; tdemand double precision;
        sf double precision; df double precision; lp double precision;
        em double precision; target double precision; newp double precision; old1h bigint; alerted boolean := false;
        chg double precision;
begin
  select * into ev from game._current_event();
  k := 1 - exp(-p_dt / 300.0);
  for m in
    with sup as (select item_id, count(*)::int as c from player_items group by item_id),
         lst as (select item_id, count(*)::int as c from market_listings where status = 'active' group by item_id),
         vol as (select item_id, count(*)::int as c from market_sales
                 where kind = 'listing' and created_at > now() - interval '24 hours' group by item_id),
         peer as (select i2.rarity, avg(coalesce(s2.c, 0))::double precision as a
                  from items i2 left join sup s2 on s2.item_id = i2.id
                  where i2.droppable or i2.event_only group by i2.rarity)
    select ms.item_id, ms.price, ms.demand, ms.last_alert_at, i.base_value, i.category, i.name, i.rarity,
           i.max_supply, ra.tier, coalesce(peer.a, 0) as peer_sup, coalesce(ls.minted, 0) as minted,
           coalesce(sup.c, 0) as sup, coalesce(lst.c, 0) as lst, coalesce(vol.c, 0) as vol
    from market_state ms
    join items i on i.id = ms.item_id
    join rarities ra on ra.id = i.rarity
    left join peer on peer.rarity = i.rarity
    left join limited_item_supply ls on ls.item_id = ms.item_id
    left join sup on sup.item_id = ms.item_id
    left join lst on lst.item_id = ms.item_id
    left join vol on vol.item_id = ms.item_id
  loop
    tdemand := 50 + case when ev.category is not null and m.category = ev.category then ev.demand_boost else 0 end;
    newd := m.demand + (tdemand - m.demand) * (1 - exp(-p_dt / 240.0)) + (random() - 0.5) * 4 * sqrt(p_dt / 10.0);
    newd := greatest(0, least(100, newd));
    -- Scarcity is relative: an item is pricier when fewer exist than its same-rarity peers.
    -- Numbered runs (limited/secret) get pricier as they sell out.
    if m.max_supply is not null then
      sf := 0.9 + 0.5 * (m.minted::double precision / m.max_supply);
    else
      sf := power(greatest(0.6, least(1.6, (m.peer_sup + 3.0) / (m.sup + 3.0))), 0.4);
    end if;
    df := 0.6 + 0.8 * newd / 100.0;
    lp := 1 - least(0.15, m.lst::double precision / (m.sup + 1) * 0.3);
    em := case when ev.category is not null and m.category = ev.category then ev.price_mult else 1 end;
    target := m.base_value * sf * df * lp * em;
    newp := m.price + (target - m.price) * k + m.price * (random() - 0.5) * 0.012 * sqrt(p_dt / 10.0);
    newp := greatest(m.base_value * 0.2, least(m.base_value * 6.0, newp));
    update market_state set price = greatest(1, round(newp))::bigint, demand = round(newd::numeric, 2),
      supply = m.sup, listed = m.lst, volume_24h = m.vol, updated_at = now()
    where item_id = m.item_id;
    if not alerted and m.tier >= 3 and (m.last_alert_at is null or m.last_alert_at < now() - interval '30 minutes')
       and random() < 0.25 then
      select price into old1h from market_history
      where item_id = m.item_id and ts <= now() - interval '1 hour' order by ts desc limit 1;
      if old1h is not null and old1h > 0 then
        chg := (newp - old1h) / old1h;
        if abs(chg) >= 0.15 then
          update market_state set last_alert_at = now() where item_id = m.item_id;
          perform game._emit('market_alert', null, null, jsonb_build_object(
            'item_id', m.item_id, 'item', m.name, 'rarity', m.rarity,
            'change', round((chg * 100)::numeric, 1), 'direction', case when chg > 0 then 'up' else 'down' end));
          alerted := true;
        end if;
      end if;
    end if;
  end loop;
end $$;

create or replace function game._tick_history() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare w record; bucket timestamptz; u timestamp := now() at time zone 'utc';
begin
  select * into w from world where id = 1;
  bucket := (date_trunc('hour', u) + floor(extract(minute from u) / 5) * interval '5 minutes') at time zone 'utc';
  if w.last_history_at is not null and w.last_history_at >= bucket then return; end if;
  insert into market_history (item_id, ts, price, demand, supply, listed, volume)
    select item_id, bucket, price, round(demand, 1), supply, listed, volume_24h from market_state
  on conflict (item_id, ts) do update set price = excluded.price, demand = excluded.demand,
    supply = excluded.supply, listed = excluded.listed, volume = excluded.volume;
  update world set last_history_at = bucket where id = 1;
  -- Downsample: 5-min points for 48h, hourly for 30 days, daily after that.
  delete from market_history where ts < now() - interval '48 hours'
    and date_part('minute', ts at time zone 'utc') <> 0;
  delete from market_history where ts < now() - interval '30 days'
    and (date_part('hour', ts at time zone 'utc') <> 0 or date_part('minute', ts at time zone 'utc') <> 0);
end $$;

create or replace function game._tick_raids() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record;
begin
  -- Bots finish on time; humans who closed the tab get resolved fairly a few seconds later.
  for r in
    select rd.id from raids rd join profiles a on a.id = rd.attacker_id
    where rd.status = 'active'
      and (rd.ends_at < now() - interval '8 seconds' or (a.is_bot and rd.ends_at <= now()))
    order by rd.ends_at limit 50
  loop
    perform game._resolve_raid(r.id);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- NPC bots
-- ---------------------------------------------------------------------------
create or replace function game._bot_answer_trade(p_trade uuid) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare t record; b record; vin bigint; vout bigint; need numeric; style text; bname text; res jsonb; v_note text;
begin
  select * into t from trades where id = p_trade for update;
  if t.status <> 'pending' then return; end if;
  select * into b from profiles where id = t.to_id;
  style := coalesce(b.bot->>'style', 'trader');
  vin := game._value_of(t.offer_items) + t.offer_cash;
  vout := game._value_of(t.request_items) + t.request_cash;
  need := case style when 'rookie' then 0.9 when 'trader' then 1.03 when 'collector' then 1.08
                     when 'raider' then 1.1 else 1.15 end;
  if vout = 0 or vin >= vout * need then
    res := game._execute_trade(p_trade);
    if not coalesce((res->>'ok')::boolean, false) then return; end if;
  else
    v_note := b.username || ': ' || (array[
      'Nah, that''s a lowball.', 'Not even close. Try again.', 'You''ll have to do better than that.',
      'I know what that''s worth, friend.'])[1 + floor(random() * 4)::int]
      || ' I''d need about ' || game.fmt_money(ceil(vout * need - vin)) || ' more.';
    update trades set status = 'declined', note = v_note, resolved_at = now() where id = p_trade;
    perform game._emit('trade_declined', t.from_id, t.to_id, jsonb_build_object('trade_id', p_trade, 'by', b.username, 'note', v_note));
  end if;
end $$;

create or replace function game._bot_restock(p_bot uuid) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare b record; shown int; inv int; slots int; r text; v_item text;
begin
  select * into b from profiles where id = p_bot;
  slots := game._slots(p_bot);
  select count(*) filter (where location = 'display'), count(*) filter (where location = 'inventory')
    into shown, inv from player_items where owner_id = p_bot;
  if shown < slots and inv > 0 then
    perform game._arrange_best(p_bot);
    return;
  end if;
  -- Robbed bots slowly restock from their personal "plan" so there's always something to raid.
  if shown < least(slots, jsonb_array_length(b.bot->'plan')) and random() < 0.25 then
    r := b.bot->'plan'->>floor(random() * jsonb_array_length(b.bot->'plan'))::int;
    select id into v_item from items where rarity = r and droppable order by random() limit 1;
    if v_item is not null then
      perform game._grant(p_bot, v_item, 'restock');
      perform game._arrange_best(p_bot);
    end if;
  end if;
end $$;

create or replace function game._bot_open_drop(p_bot uuid) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare b record; d record;
begin
  select * into b from profiles where id = p_bot;
  select * into d from drop_types
  where not requires_key and not event_only and min_level <= b.level and price * 4 <= b.cash
  order by price desc limit 1;
  if not found then return; end if;
  -- whales sometimes splurge on a cheaper drop too, keeps the feed varied
  if random() < 0.3 then
    select * into d from drop_types
    where not requires_key and not event_only and min_level <= b.level and price * 4 <= b.cash
    order by random() limit 1;
  end if;
  perform game.act_open_drop(p_bot, d.id, false);
  perform game._arrange_best(p_bot);
  -- keep bot inventories small: sell the weakest spare
  if (select count(*) from player_items where owner_id = p_bot and location = 'inventory') > 4 then
    perform game.act_quick_sell(p_bot, pi.id) from (
      select pi.id from player_items pi join items i on i.id = pi.item_id
      where pi.owner_id = p_bot and pi.location = 'inventory' and not pi.soulbound
        and (pi.hot_until is null or pi.hot_until < now())
      order by i.base_income asc limit 1) pi;
  end if;
end $$;

create or replace function game._bot_market(p_bot uuid) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare b record; l record; pi record; mprice bigint; v_price bigint; nlist int;
begin
  select * into b from profiles where id = p_bot;
  -- Buy a fair or cheap listing (humans first).
  if random() < 0.6 then
    select ml.id, ml.price into l
    from market_listings ml join market_state ms on ms.item_id = ml.item_id
    join profiles s on s.id = ml.seller_id
    where ml.status = 'active' and ml.seller_id <> p_bot and ml.price <= ms.price * 0.95
      and ml.price * 2 <= b.cash and ml.created_at < now() - interval '20 seconds'
    order by s.is_bot, ml.price::numeric / ms.price, random() limit 1;
    if found then
      begin
        perform game.act_buy_listing(p_bot, l.id);
        perform game._arrange_best(p_bot);
      exception when others then null;
      end;
    end if;
  end if;
  -- Cancel stale listings.
  perform game.act_cancel_listing(p_bot, x.id) from (
    select id from market_listings where seller_id = p_bot and status = 'active'
      and created_at < now() - interval '25 minutes') x;
  -- List a spare item (or occasionally a displayed one) at a markup.
  select count(*) into nlist from market_listings where seller_id = p_bot and status = 'active';
  if nlist < 3 then
    select p.id, p.item_id into pi from player_items p join items i on i.id = p.item_id
    where p.owner_id = p_bot and p.location in ('inventory', 'display') and not p.soulbound
      and i.rarity not in ('secret', 'limited')  -- NPCs keep their trophies on show
      and (p.hot_until is null or p.hot_until < now())
      and not exists (select 1 from raids r where r.player_item_id = p.id and r.status = 'active')
    order by (p.location = 'inventory') desc, random() limit 1;
    if found and (random() < 0.5 or exists (select 1 from player_items where id = pi.id and location = 'inventory')) then
      select price into mprice from market_state where item_id = pi.item_id;
      v_price := greatest(1, round(mprice * (1.03 + random() * 0.22)))::bigint;
      begin
        perform game.act_list(p_bot, pi.id, v_price);
      exception when others then null;
      end;
    end if;
  end if;
end $$;

-- An NPC raider targets an active human (never during the tutorial, never twice in 8 minutes).
create or replace function game._bot_raid_human() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare h record; b record; v_pi record; res jsonb;
begin
  select p.id, p.username into h from profiles p join bases bs on bs.player_id = p.id
  where not p.is_bot and p.level >= 3 and p.tutorial_step >= 99
    and p.last_seen_at > now() - interval '40 seconds'
    and (bs.shield_until is null or bs.shield_until < now())
    and not exists (select 1 from raids r where r.defender_id = p.id and r.status = 'active')
    and not exists (select 1 from raids r join profiles a on a.id = r.attacker_id
                    where r.defender_id = p.id and a.is_bot and r.started_at > now() - interval '8 minutes')
    and exists (select 1 from player_items pi where pi.owner_id = p.id and pi.location = 'display' and not pi.soulbound)
  order by random() limit 1;
  if not found then return; end if;
  select * into b from profiles p
  where p.is_bot and p.bot->>'style' in ('raider', 'whale', 'trader')
    and (p.raid_cooldown_until is null or p.raid_cooldown_until < now())
    and not exists (select 1 from raids r where r.attacker_id = p.id and r.status = 'active')
  order by random() limit 1;
  if not found then return; end if;
  select p.id into v_pi from player_items p join market_state ms on ms.item_id = p.item_id
  where p.owner_id = h.id and p.location = 'display' and not p.soulbound
    and not exists (select 1 from raids r where r.player_item_id = p.id and r.status = 'active')
  order by -ln(1 - random()) / sqrt(ms.price::double precision) limit 1;
  if not found then return; end if;
  res := game.act_start_steal(b.id, v_pi.id, false);
  -- humans always get at least 12 seconds to react
  update raids set ends_at = greatest(ends_at, started_at + interval '12 seconds') where id = (res->>'raid_id')::uuid;
  update world set last_bot_raid_at = now() where id = 1;
end $$;

-- Bot-on-bot heists keep the global feed lively.
create or replace function game._bot_heist() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare a record; d record; pi record; res jsonb;
begin
  select * into a from profiles p where p.is_bot and p.bot->>'style' in ('raider', 'whale')
    and (p.raid_cooldown_until is null or p.raid_cooldown_until < now())
    and not exists (select 1 from raids r where r.attacker_id = p.id and r.status = 'active')
  order by random() limit 1;
  if not found then return; end if;
  select p.* into d from profiles p join bases bs on bs.player_id = p.id
  where p.is_bot and p.id <> a.id and (bs.shield_until is null or bs.shield_until < now())
    and not coalesce((p.bot->>'tutorial')::boolean, false)
  order by random() limit 1;
  if not found then return; end if;
  select p.id into pi from player_items p where p.owner_id = d.id and p.location = 'display' and not p.soulbound
    and not exists (select 1 from raids r where r.player_item_id = p.id and r.status = 'active')
  order by random() limit 1;
  if not found then return; end if;
  res := game.act_start_steal(a.id, pi.id, false);
  perform game._resolve_raid((res->>'raid_id')::uuid);
  perform game._arrange_best(a.id);
end $$;

-- A bot makes a cash (or item) offer for something an active human is showing off.
create or replace function game._bot_offer_trade() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare h record; b record; want record; give record; v_cash bigint;
begin
  select p.id into h from profiles p
  where not p.is_bot and p.tutorial_step >= 99 and p.last_seen_at > now() - interval '60 seconds'
    and not exists (select 1 from trades t join profiles f on f.id = t.from_id
                    where t.to_id = p.id and f.is_bot and t.status = 'pending')
  order by random() limit 1;
  if not found then return; end if;
  select pi.id, pi.item_id, ms.price into want
  from player_items pi join items i on i.id = pi.item_id join rarities r on r.id = i.rarity
  join market_state ms on ms.item_id = pi.item_id
  where pi.owner_id = h.id and pi.location = 'display' and not pi.soulbound and r.tier >= 2
    and (pi.hot_until is null or pi.hot_until < now())
  order by random() limit 1;
  if not found then return; end if;
  select * into b from profiles
  where is_bot and bot->>'style' in ('trader', 'collector', 'whale') and cash > want.price * 2
  order by random() limit 1;
  if not found then return; end if;
  -- Sometimes offer an item of similar value, otherwise a cash premium.
  select pi.id, ms.price into give
  from player_items pi join market_state ms on ms.item_id = pi.item_id
  where pi.owner_id = b.id and pi.location in ('inventory', 'display') and not pi.soulbound
    and (pi.hot_until is null or pi.hot_until < now())
    and ms.price between want.price * 0.9 and want.price * 1.3
    and not exists (select 1 from raids r where r.player_item_id = pi.id and r.status = 'active')
  order by random() limit 1;
  if found and random() < 0.4 then
    perform game.act_trade_propose(b.id, jsonb_build_object(
      'to', h.id, 'offer_items', jsonb_build_array(give.id), 'request_items', jsonb_build_array(want.id),
      'message', 'Straight swap? Mine''s worth a little more 😉'));
  else
    v_cash := round(want.price * (1.05 + random() * 0.2))::bigint;
    perform game.act_trade_propose(b.id, jsonb_build_object(
      'to', h.id, 'offer_cash', v_cash, 'request_items', jsonb_build_array(want.id),
      'message', 'I''ll pay over market for that. Deal?'));
  end if;
end $$;

create or replace function game._tick_bots(p_dt double precision) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare b record; f double precision := least(1.0, p_dt / 10.0); t record;
begin
  for b in select id, bot from profiles where is_bot loop
    perform game._settle(b.id);
    update profiles set cash = least(cash, 400000000) where id = b.id;
    begin
      perform game._bot_restock(b.id);
      if random() < 0.10 * f then perform game._bot_open_drop(b.id); end if;
      if b.bot->>'style' in ('trader', 'collector', 'whale') and random() < 0.15 * f then
        perform game._bot_market(b.id);
      end if;
    exception when others then
      raise warning 'bot % action failed: %', b.id, sqlerrm;
    end;
  end loop;
  -- bots answer offers after a short "think"
  for t in
    select tr.id from trades tr join profiles p on p.id = tr.to_id
    where tr.status = 'pending' and p.is_bot and tr.created_at < now() - interval '3 seconds'
    order by tr.created_at limit 10
  loop
    begin
      perform game._bot_answer_trade(t.id);
    exception when others then
      raise warning 'bot trade failed: %', sqlerrm;
    end;
  end loop;
  begin
    if random() < 0.35 then perform game._bot_raid_human(); end if;
    if random() < 0.07 * f then perform game._bot_heist(); end if;
    if random() < 0.05 * f then perform game._bot_offer_trade(); end if;
  exception when others then
    raise warning 'bot social action failed: %', sqlerrm;
  end;
end $$;

create or replace function game._tick_cleanup() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
begin
  update trades set status = 'expired', resolved_at = now()
  where status = 'pending' and created_at < now() - interval '24 hours';
  delete from server_events where created_at < now() - interval '3 days';
  delete from market_sales where created_at < now() - interval '30 days';
end $$;

-- ---------------------------------------------------------------------------
-- The tick itself
-- ---------------------------------------------------------------------------
create or replace function game.world_tick(p_force boolean default false) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare w record; dt double precision;
begin
  select * into w from world where id = 1 for update;
  if not p_force and w.last_tick_at is not null and w.last_tick_at > now() - interval '10 seconds' then
    return jsonb_build_object('skipped', true);
  end if;
  dt := coalesce(extract(epoch from now() - w.last_tick_at), 10);
  dt := least(greatest(dt, 1), 3600);
  update world set last_tick_at = now(), tick_count = tick_count + 1 where id = 1;
  if w.seeded_at is null then
    perform game._seed_bots();
    perform game._seed_history();
    update world set seeded_at = now(), next_event_at = now() + interval '90 seconds', last_history_at = null where id = 1;
  end if;
  perform game._tick_events();
  perform game._tick_market(dt);
  perform game._tick_history();
  perform game._tick_raids();
  perform game._tick_bots(dt);
  if w.tick_count % 30 = 0 then perform game._tick_cleanup(); end if;
  return jsonb_build_object('ok', true, 'dt', dt);
end $$;

-- Called at the start of every public RPC. Never blocks and never breaks the caller.
create or replace function game._maybe_tick() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare last timestamptz;
begin
  select last_tick_at into last from world where id = 1;
  if last is not null and last > now() - interval '10 seconds' then return; end if;
  if not pg_try_advisory_xact_lock(727274) then return; end if;
  begin
    perform game.world_tick(false);
  exception when others then
    raise warning 'world_tick failed: %', sqlerrm;
  end;
end $$;
`,d1=`-- ============================================================================
-- STEAL THE TECH — public API
--
-- The ONLY functions a browser can call. Every one of them:
--   * takes a single jsonb argument \`p\`, returns jsonb;
--   * identifies the player with auth.uid() (never trusts an id from the client);
--   * runs SECURITY DEFINER with a pinned search_path;
--   * is executable by \`authenticated\` only (not anon).
-- supabase-js:  supabase.rpc('stt_open_drop', { p: { drop: 'basic' } })
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Argument helpers (friendly errors instead of cast failures)
-- ---------------------------------------------------------------------------
create or replace function game._p_uuid(p jsonb, k text) returns uuid
language plpgsql immutable set search_path = pg_catalog, game, pg_temp as $$
begin
  if p->>k is null then raise exception 'Missing %.', k; end if;
  return (p->>k)::uuid;
exception when invalid_text_representation then
  raise exception 'Invalid %.', k;
end $$;

create or replace function game._p_bigint(p jsonb, k text) returns bigint
language plpgsql immutable set search_path = pg_catalog, game, pg_temp as $$
begin
  return (p->>k)::numeric::bigint;
exception when others then
  raise exception 'Invalid %.', k;
end $$;

create or replace function game._now_ms() returns bigint
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select (extract(epoch from now()) * 1000)::bigint
$$;

-- ---------------------------------------------------------------------------
-- Read models
-- ---------------------------------------------------------------------------
create or replace function game._base_value(p_pid uuid) returns bigint
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce(sum(ms.price), 0)::bigint from game.player_items pi
  join game.market_state ms on ms.item_id = pi.item_id
  where pi.owner_id = p_pid and pi.location = 'display'
$$;

create or replace function game.q_sync(p_pid uuid, p_since bigint, p_items_rev bigint) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare p record; b record; s record; ev record; w record; rate double precision; v_r record;
        v_items jsonb; v_feed jsonb; v_claimable int;
begin
  perform 1 from profiles where id = p_pid;
  if not found then
    return jsonb_build_object('needs_join', true, 'server_time', game._now_ms());
  end if;
  -- Resolve raids that are due and involve me, so results appear instantly.
  for v_r in
    select rd.id from raids rd join profiles a on a.id = rd.attacker_id
    where rd.status = 'active'
      and ((rd.defender_id = p_pid and a.is_bot and rd.ends_at <= now())
        or (rd.attacker_id = p_pid and rd.ends_at < now() - interval '8 seconds'))
  loop
    perform game._resolve_raid(v_r.id);
  end loop;
  perform game._settle(p_pid);
  update profiles set last_seen_at = now() where id = p_pid;
  select * into p from profiles where id = p_pid;
  select * into b from bases where player_id = p_pid;
  select * into s from player_stats where player_id = p_pid;
  select * into ev from game._current_event();
  select * into w from world where id = 1;
  rate := game._income_rate(p_pid);

  if p_items_rev is distinct from p.items_rev then
    select coalesce(jsonb_agg(game._item_json(pi) order by pi.acquired_at, pi.id), '[]'::jsonb) into v_items
    from player_items pi where pi.owner_id = p_pid;
  end if;

  if p_since is null or p_since < 0 then
    select coalesce(jsonb_agg(to_jsonb(x) order by x.id), '[]'::jsonb) into v_feed from (
      select id, kind, target_id, actor_id, payload, created_at from server_events
      where target_id is null or target_id = p_pid order by id desc limit 30) x;
  else
    select coalesce(jsonb_agg(to_jsonb(x) order by x.id), '[]'::jsonb) into v_feed from (
      select id, kind, target_id, actor_id, payload, created_at from server_events
      where id > p_since and (target_id is null or target_id = p_pid) order by id limit 80) x;
  end if;

  select count(*) into v_claimable from jsonb_array_elements(game.act_quests(p_pid)) q
  where (q->>'progress')::bigint >= (q->>'target')::bigint and not (q->>'claimed')::boolean;

  return jsonb_build_object(
    'server_time', game._now_ms(),
    'me', jsonb_build_object(
      'id', p.id, 'username', p.username, 'cash', p.cash, 'income', round(rate::numeric, 2),
      'base_value', game._base_value(p_pid),
      'xp', p.xp, 'level', p.level, 'title', game.level_title(p.level),
      'xp_level', game.xp_for_level(p.level), 'xp_next', game.xp_for_level(p.level + 1),
      'prestige', p.prestige, 'income_bonus', 0.05 * p.prestige, 'luck', game._luck(p_pid),
      'focus', p.collection_focus, 'drop_tokens', p.drop_tokens, 'secret_keys', p.secret_keys,
      'tutorial_step', p.tutorial_step, 'tutorial_flags', p.tutorial_flags, 'cosmetics', p.cosmetics,
      'owned_cosmetics', (select coalesce(jsonb_agg(cosmetic_id), '[]'::jsonb) from player_cosmetics where player_id = p_pid),
      'raid_cooldown_until', p.raid_cooldown_until, 'items_rev', p.items_rev,
      'base_level', b.base_level, 'slots', game._slots(p_pid), 'security_level', b.security_level,
      'vault_level', b.vault_level, 'vault_capacity', game._vault_capacity(p_pid), 'shield_until', b.shield_until,
      'stats', to_jsonb(s) - 'player_id',
      'daily', game._daily_status(p_pid),
      'collection_count', (select count(*) from player_collection where player_id = p_pid),
      'created_at', p.created_at),
    'items', v_items,
    'listings', (select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'player_item_id', l.player_item_id,
                   'item_id', l.item_id, 'price', l.price, 'created_at', l.created_at) order by l.created_at desc), '[]'::jsonb)
                 from market_listings l where l.seller_id = p_pid and l.status = 'active'),
    'incoming_raids', (select coalesce(jsonb_agg(jsonb_build_object('id', r.id, 'attacker', a.username,
                   'attacker_id', a.id, 'attacker_bot', a.is_bot, 'item_id', r.item_id, 'player_item_id', r.player_item_id,
                   'started_at', r.started_at, 'ends_at', r.ends_at, 'defended', r.defended, 'revenge', r.is_revenge)), '[]'::jsonb)
                 from raids r join profiles a on a.id = r.attacker_id
                 where r.defender_id = p_pid and r.status = 'active'),
    'outgoing_raid', (select jsonb_build_object('id', r.id, 'defender', d.username, 'defender_id', d.id,
                   'item_id', r.item_id, 'player_item_id', r.player_item_id, 'started_at', r.started_at,
                   'ends_at', r.ends_at, 'defended', r.defended, 'chance', r.chance, 'revenge', r.is_revenge,
                   'tutorial', r.is_tutorial)
                 from raids r join profiles d on d.id = r.defender_id
                 where r.attacker_id = p_pid and r.status = 'active' limit 1),
    'event', case when ev.type_id is null then null else jsonb_build_object(
                   'type', ev.type_id, 'title', ev.title, 'icon', ev.icon, 'description', ev.description,
                   'category', ev.category, 'price_mult', ev.price_mult, 'income_mult', ev.income_mult,
                   'luck_mult', ev.luck_mult, 'starts_at', ev.starts_at, 'ends_at', ev.ends_at) end,
    'next_event_at', w.next_event_at,
    'feed', v_feed,
    'trades', jsonb_build_object(
      'incoming', (select count(*) from trades where to_id = p_pid and status = 'pending'),
      'outgoing', (select count(*) from trades where from_id = p_pid and status = 'pending')),
    'quests_claimable', v_claimable,
    'revenge', (select count(*) from raids where defender_id = p_pid and status = 'success'
                and not revenge_used and resolved_at > now() - interval '24 hours'),
    'online', (select count(*) from profiles where not is_bot and last_seen_at > now() - interval '60 seconds')
  );
end $$;

create or replace function game._plot_json(p_pid uuid, p_viewer uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object(
    'id', p.id, 'username', p.username, 'is_bot', p.is_bot, 'level', p.level, 'prestige', p.prestige,
    'title', game.level_title(p.level), 'bio', coalesce(p.bot->>'bio', ''),
    'base_level', b.base_level, 'slots', game._slots(p.id), 'security_level', b.security_level,
    'vault_level', b.vault_level, 'cosmetics', p.cosmetics, 'base_value', game._base_value(p.id),
    'shield_until', b.shield_until, 'protected', (not p.is_bot and p.level < 3),
    'online', p.is_bot or p.last_seen_at > now() - interval '60 seconds',
    'vault_used', (select count(*) from game.player_items v where v.owner_id = p.id and v.location = 'vault'),
    'items', (select coalesce(jsonb_agg(jsonb_build_object('id', pi.id, 'item_id', pi.item_id, 'slot', pi.slot,
                'serial', pi.serial, 'soulbound', pi.soulbound, 'hot_until', pi.hot_until,
                'under_raid', exists (select 1 from game.raids r where r.player_item_id = pi.id and r.status = 'active'))
                order by pi.slot), '[]'::jsonb)
              from game.player_items pi where pi.owner_id = p.id and pi.location = 'display'))
  from game.profiles p join game.bases b on b.player_id = p.id
  where p.id = p_pid
$$;

create or replace function game.q_world(p_pid uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  with ps as (
    select id, 0 as ord from game.profiles where id = p_pid
    union all
    select id, 1 from game.profiles where is_bot
    union all
    (select id, 2 from game.profiles where not is_bot and id <> p_pid order by last_seen_at desc limit 12)
  )
  select jsonb_build_object(
    'server_time', game._now_ms(),
    'players', coalesce(jsonb_agg(game._plot_json(ps.id, p_pid) order by ps.ord, ps.id), '[]'::jsonb),
    'online', (select count(*) from game.profiles where not is_bot and last_seen_at > now() - interval '60 seconds'))
  from ps
$$;

create or replace function game.q_base(p_viewer uuid, p_target uuid) returns jsonb
language plpgsql stable set search_path = pg_catalog, game, pg_temp as $$
declare j jsonb; rv boolean; reason text; items jsonb; sec text;
begin
  j := game._plot_json(p_target, p_viewer);
  if j is null then raise exception 'Player not found.'; end if;
  rv := game._revenge_row(p_viewer, p_target) is not null;
  reason := game._raid_block_reason(p_viewer, p_target, rv);
  select name into sec from upgrade_levels where kind = 'security' and level = (j->>'security_level')::int;
  select coalesce(jsonb_agg(x.it || jsonb_build_object(
           'chance', game._raid_chance(p_viewer, p_target, x.it->>'item_id', rv),
           'seconds', game._raid_seconds(p_target, x.it->>'item_id', rv))), '[]'::jsonb)
    into items from jsonb_array_elements(j->'items') as x(it);
  return j || jsonb_build_object('items', items, 'revenge_available', rv, 'raid_block', reason,
    'security_name', sec, 'income', round(game._income_rate(p_target)::numeric, 2),
    'is_me', p_viewer = p_target);
end $$;

create or replace function game.q_raid_targets(p_pid uuid, p_sort text) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  with me as (select level from game.profiles where id = p_pid),
  t as (
    select p.id, p.username, p.is_bot, p.level, p.prestige, b.security_level, b.shield_until,
           (not p.is_bot and p.level < 3) as protected,
           p.is_bot or p.last_seen_at > now() - interval '60 seconds' as online,
           game._base_value(p.id) as base_value,
           (select count(*) from game.player_items x where x.owner_id = p.id and x.location = 'display') as shown,
           (select jsonb_build_object('item_id', pi.item_id, 'price', ms.price, 'serial', pi.serial)
              from game.player_items pi join game.market_state ms on ms.item_id = pi.item_id
              where pi.owner_id = p.id and pi.location = 'display' and not pi.soulbound
              order by ms.price desc limit 1) as top_item,
           game._revenge_row(p_pid, p.id) is not null as revenge,
           (select name from game.upgrade_levels ul where ul.kind = 'security' and ul.level = b.security_level) as security_name
    from game.profiles p join game.bases b on b.player_id = p.id
    where p.id <> p_pid
  )
  select coalesce(jsonb_agg(to_jsonb(t) order by
      t.revenge desc,
      case when p_sort = 'value' then -t.base_value
           when p_sort = 'security' then t.security_level
           else abs(t.level - (select level from me)) * 1000 - t.base_value / 1000000.0 end), '[]'::jsonb)
  from (select * from t order by revenge desc, base_value desc limit 60) t
$$;

create or replace function game.q_revenge(p_pid uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'raid_id', r.id, 'attacker_id', r.attacker_id, 'attacker', a.username, 'attacker_bot', a.is_bot,
    'item_id', r.item_id, 'player_item_id', r.player_item_id, 'resolved_at', r.resolved_at,
    'still_theirs', exists (select 1 from game.player_items pi where pi.id = r.player_item_id and pi.owner_id = r.attacker_id),
    'on_display', exists (select 1 from game.player_items pi where pi.id = r.player_item_id and pi.owner_id = r.attacker_id and pi.location = 'display'),
    'expires_at', r.resolved_at + interval '24 hours') order by r.resolved_at desc), '[]'::jsonb)
  from game.raids r join game.profiles a on a.id = r.attacker_id
  where r.defender_id = p_pid and r.status = 'success' and not r.revenge_used
    and r.resolved_at > now() - interval '24 hours'
$$;

create or replace function game.q_leaderboard(p_pid uuid, p_kind text) returns jsonb
language plpgsql stable set search_path = pg_catalog, game, pg_temp as $$
declare rows jsonb; mine jsonb;
begin
  if p_kind not in ('richest', 'base_value', 'items', 'secrets', 'raids', 'trades', 'level', 'collection') then
    raise exception 'Unknown leaderboard.';
  end if;
  with base as (
    select p.id, p.username, p.is_bot, p.level, p.prestige, p.xp, p.cash,
      case p_kind
        when 'richest' then p.cash::numeric
        when 'base_value' then game._base_value(p.id)::numeric
        when 'items' then (select count(*) from player_items x where x.owner_id = p.id)::numeric
        when 'secrets' then (select count(*) from player_items x join items i on i.id = x.item_id
                             where x.owner_id = p.id and i.rarity = 'secret')::numeric
        when 'raids' then s.steals_won::numeric
        when 'trades' then (s.trades_done + s.market_sales + s.market_buys)::numeric
        when 'level' then p.prestige::numeric * 1000000000000 + p.xp
        when 'collection' then (select count(*) from player_collection c where c.player_id = p.id)::numeric
      end as score
    from profiles p join player_stats s on s.player_id = p.id
  ), ranked as (
    select *, row_number() over (order by score desc, id) as rank from base
  )
  select coalesce(jsonb_agg(jsonb_build_object('rank', rank, 'id', id, 'username', username, 'is_bot', is_bot,
           'level', level, 'prestige', prestige, 'score', score, 'me', id = p_pid) order by rank)
           filter (where rank <= 50), '[]'::jsonb),
         (jsonb_agg(jsonb_build_object('rank', rank, 'id', id, 'username', username, 'is_bot', is_bot,
           'level', level, 'prestige', prestige, 'score', score, 'me', true)) filter (where id = p_pid)) -> 0
    into rows, mine
  from ranked;
  return jsonb_build_object('kind', p_kind, 'rows', rows, 'me', mine);
end $$;

create or replace function game.q_profile(p_viewer uuid, p_target uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object(
    'id', p.id, 'username', p.username, 'is_bot', p.is_bot, 'bio', coalesce(p.bot->>'bio', ''),
    'level', p.level, 'title', game.level_title(p.level), 'prestige', p.prestige,
    'base_value', game._base_value(p.id), 'income', round(game._income_rate(p.id)::numeric, 2),
    'base_level', b.base_level, 'security_level', b.security_level, 'cosmetics', p.cosmetics,
    'collection', (select count(*) from game.player_collection c where c.player_id = p.id),
    'collection_total', (select count(*) from game.items i where i.droppable or i.event_only),
    'rare_items', (select count(*) from game.player_items x join game.items i on i.id = x.item_id
                   join game.rarities r on r.id = i.rarity where x.owner_id = p.id and r.tier >= 5),
    'secrets', (select coalesce(jsonb_agg(jsonb_build_object('item_id', x.item_id, 'serial', x.serial)), '[]'::jsonb)
                from game.player_items x join game.items i on i.id = x.item_id
                where x.owner_id = p.id and i.rarity = 'secret' and x.location <> 'vault'),
    'showcase', (select coalesce(jsonb_agg(s.j), '[]'::jsonb) from (
                   select jsonb_build_object('item_id', x.item_id, 'serial', x.serial) as j
                   from game.player_items x join game.market_state ms on ms.item_id = x.item_id
                   where x.owner_id = p.id and x.location = 'display' order by ms.price desc limit 6) s),
    'achievements', (select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'title', a.title, 'icon', a.icon,
                       'unlocked_at', pa.unlocked_at) order by pa.unlocked_at desc), '[]'::jsonb)
                     from game.player_achievements pa join game.achievements a on a.id = pa.achievement_id
                     where pa.player_id = p.id),
    'stats', to_jsonb(st) - 'player_id',
    'online', p.is_bot or p.last_seen_at > now() - interval '60 seconds',
    'shield_until', b.shield_until, 'protected', (not p.is_bot and p.level < 3),
    'created_at', p.created_at, 'is_me', p.id = p_viewer)
  from game.profiles p join game.bases b on b.player_id = p.id join game.player_stats st on st.player_id = p.id
  where p.id = p_target
$$;

create or replace function game.q_collection(p_target uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object(
    'player_id', p_target,
    'username', (select username from game.profiles where id = p_target),
    'discovered', (select coalesce(jsonb_agg(jsonb_build_object('item_id', c.item_id, 'first_found_at', c.first_found_at,
                     'times_found', c.times_found)), '[]'::jsonb) from game.player_collection c where c.player_id = p_target),
    'owned', (select coalesce(jsonb_object_agg(item_id, n), '{}'::jsonb) from (
                select item_id, count(*) as n from game.player_items where owner_id = p_target group by item_id) o))
$$;

create or replace function game.q_catalog() returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object(
    'items', (select jsonb_agg(jsonb_build_object('id', i.id, 'name', i.name, 'brand', i.brand, 'kind', i.kind,
                'category', i.category, 'rarity', i.rarity, 'base_value', i.base_value, 'base_income', i.base_income,
                'max_supply', i.max_supply, 'tradeable', i.tradeable, 'droppable', i.droppable, 'event_only', i.event_only,
                'color', i.color, 'accent', i.accent, 'flavor', i.flavor) order by i.sort) from game.items i),
    'rarities', (select jsonb_agg(to_jsonb(r) order by r.tier) from game.rarities r),
    'drops', (select jsonb_agg(to_jsonb(d) order by d.sort) from game.drop_types d),
    'upgrades', (select jsonb_agg(to_jsonb(u) order by u.kind, u.level) from game.upgrade_levels u),
    'quests', (select jsonb_agg(to_jsonb(q) order by q.sort) from game.quests q),
    'achievements', (select jsonb_agg(to_jsonb(a) order by a.sort) from game.achievements a),
    'cosmetics', (select jsonb_agg(to_jsonb(c) order by c.sort) from game.cosmetics c),
    'event_types', (select jsonb_agg(to_jsonb(e)) from game.event_types e),
    'level_titles', (select jsonb_agg(to_jsonb(l) order by l.level) from game.level_titles l),
    'rules', jsonb_build_object('quick_sell_rate', 0.6, 'market_fee', 0.05, 'list_min', 0.25, 'list_max', 5,
                                'prestige_level', 25, 'focus_level', 5, 'protection_level', 3,
                                'shield_minutes', 10, 'hot_minutes', 5, 'offline_cap_hours', 12))
$$;

create or replace function game.q_market() returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object('server_time', game._now_ms(), 'items', coalesce(jsonb_agg(jsonb_build_object(
    'item_id', ms.item_id, 'price', ms.price, 'demand', round(ms.demand, 1), 'supply', ms.supply,
    'listed', ms.listed, 'volume_24h', ms.volume_24h, 'minted', s.minted,
    'change_24h', case when h.price is null or h.price = 0 then 0
                       else round(((ms.price - h.price)::numeric / h.price) * 100, 1) end,
    'low', (select min(l.price) from game.market_listings l where l.item_id = ms.item_id and l.status = 'active'))), '[]'::jsonb))
  from game.market_state ms
  left join game.limited_item_supply s on s.item_id = ms.item_id
  left join lateral (select price from game.market_history mh
                     where mh.item_id = ms.item_id and mh.ts <= now() - interval '24 hours'
                     order by mh.ts desc limit 1) h on true
$$;

create or replace function game.q_market_item(p_viewer uuid, p_item text, p_range text) returns jsonb
language plpgsql stable set search_path = pg_catalog, game, pg_temp as $$
declare since timestamptz; hist jsonb; ms record; h24 bigint;
begin
  select * into ms from market_state where item_id = p_item;
  if not found then raise exception 'Unknown item.'; end if;
  since := now() - case p_range when '1H' then interval '1 hour' when '24H' then interval '24 hours'
                                 when '7D' then interval '7 days' when '30D' then interval '30 days'
                                 else interval '100 years' end;
  select coalesce(jsonb_agg(jsonb_build_array((extract(epoch from ts) * 1000)::bigint, price, demand, supply, listed, volume)
           order by ts), '[]'::jsonb) into hist
  from market_history
  where item_id = p_item and ts >= since
    and (p_range in ('1H', '24H')
         or (p_range = '7D' and (ts > now() - interval '48 hours' and date_part('minute', ts at time zone 'utc')::int % 30 = 0
                                 or date_part('minute', ts at time zone 'utc') = 0))
         or (p_range = '30D' and date_part('minute', ts at time zone 'utc') = 0 and date_part('hour', ts at time zone 'utc')::int % 4 = 0)
         or (p_range not in ('1H', '24H', '7D', '30D') and date_part('minute', ts at time zone 'utc') = 0
             and date_part('hour', ts at time zone 'utc') = 0));
  select price into h24 from market_history where item_id = p_item and ts <= now() - interval '24 hours' order by ts desc limit 1;
  return jsonb_build_object(
    'item_id', p_item, 'range', p_range, 'price', ms.price, 'demand', round(ms.demand, 1),
    'supply', ms.supply, 'listed', ms.listed, 'volume_24h', ms.volume_24h,
    'change_24h', case when h24 is null or h24 = 0 then 0 else round(((ms.price - h24)::numeric / h24) * 100, 1) end,
    'owners', (select count(distinct owner_id) from player_items where item_id = p_item),
    'minted', (select minted from limited_item_supply where item_id = p_item),
    'mine', (select count(*) from player_items where item_id = p_item and owner_id = p_viewer),
    'history', hist,
    'sales', (select coalesce(jsonb_agg(jsonb_build_object('price', s.price, 'kind', s.kind, 'at', s.created_at,
                'buyer', b.username, 'seller', sl.username) order by s.created_at desc), '[]'::jsonb)
              from (select * from market_sales where item_id = p_item order by created_at desc limit 12) s
              left join profiles b on b.id = s.buyer_id left join profiles sl on sl.id = s.seller_id),
    'listings', (select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'price', l.price, 'seller', p.username,
                   'seller_id', p.id, 'seller_bot', p.is_bot, 'serial', pi.serial, 'created_at', l.created_at,
                   'mine', l.seller_id = p_viewer) order by l.price, l.created_at), '[]'::jsonb)
                 from (select * from market_listings where item_id = p_item and status = 'active' order by price limit 30) l
                 join profiles p on p.id = l.seller_id join player_items pi on pi.id = l.player_item_id));
end $$;

create or replace function game.q_listings(p_viewer uuid, p_filter jsonb) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce(jsonb_agg(x.j order by x.ratio, x.created_at), '[]'::jsonb) from (
    select jsonb_build_object('id', l.id, 'item_id', l.item_id, 'price', l.price, 'market', ms.price,
             'seller', p.username, 'seller_id', p.id, 'seller_bot', p.is_bot, 'serial', pi.serial,
             'created_at', l.created_at, 'mine', l.seller_id = p_viewer) as j,
           l.price::numeric / ms.price as ratio, l.created_at
    from game.market_listings l
    join game.market_state ms on ms.item_id = l.item_id
    join game.profiles p on p.id = l.seller_id
    join game.player_items pi on pi.id = l.player_item_id
    join game.items i on i.id = l.item_id
    where l.status = 'active'
      and (p_filter->>'category' is null or i.category = p_filter->>'category')
      and (p_filter->>'rarity' is null or i.rarity = p_filter->>'rarity')
      and (not coalesce((p_filter->>'mine')::boolean, false) or l.seller_id = p_viewer)
    order by l.price::numeric / ms.price, l.created_at
    limit 80) x
$$;

create or replace function game.q_trades(p_pid uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', t.id, 'from_id', t.from_id, 'from', f.username, 'from_bot', f.is_bot,
    'to_id', t.to_id, 'to', tt.username, 'to_bot', tt.is_bot,
    'offer_cash', t.offer_cash, 'request_cash', t.request_cash, 'message', t.message,
    'status', t.status, 'note', t.note, 'created_at', t.created_at, 'resolved_at', t.resolved_at,
    'incoming', t.to_id = p_pid,
    'offer_items', (select coalesce(jsonb_agg(jsonb_build_object('id', pi.id, 'item_id', pi.item_id, 'serial', pi.serial,
                      'available', pi.owner_id = t.from_id)), '[]'::jsonb)
                    from game.player_items pi where pi.id = any(t.offer_items)),
    'request_items', (select coalesce(jsonb_agg(jsonb_build_object('id', pi.id, 'item_id', pi.item_id, 'serial', pi.serial,
                      'available', pi.owner_id = t.to_id)), '[]'::jsonb)
                    from game.player_items pi where pi.id = any(t.request_items)),
    'offer_value', game._value_of(t.offer_items) + t.offer_cash,
    'request_value', game._value_of(t.request_items) + t.request_cash,
    'snapshot', t.snapshot) order by (t.status = 'pending') desc, t.created_at desc), '[]'::jsonb)
  from (select * from game.trades where (from_id = p_pid or to_id = p_pid)
          and (status = 'pending' or resolved_at > now() - interval '3 days')
        order by created_at desc limit 40) t
  join game.profiles f on f.id = t.from_id
  join game.profiles tt on tt.id = t.to_id
$$;

create or replace function game.q_activity(p_pid uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object(
    'transactions', (select coalesce(jsonb_agg(to_jsonb(x) - 'player_id' order by x.id desc), '[]'::jsonb) from (
                       select * from game.transactions where player_id = p_pid order by id desc limit 40) x),
    'raids', (select coalesce(jsonb_agg(jsonb_build_object('id', r.id, 'status', r.status, 'item_id', r.item_id,
                'attacker', a.username, 'defender', d.username, 'mine', r.attacker_id = p_pid,
                'fine', r.fine, 'defended', r.defended, 'at', coalesce(r.resolved_at, r.started_at)) order by r.started_at desc), '[]'::jsonb)
              from (select * from game.raids where attacker_id = p_pid or defender_id = p_pid order by started_at desc limit 30) r
              join game.profiles a on a.id = r.attacker_id join game.profiles d on d.id = r.defender_id))
$$;

-- ---------------------------------------------------------------------------
-- Public RPCs
-- ---------------------------------------------------------------------------
create or replace function public.stt_join(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin
  perform game._maybe_tick();
  perform game.act_join(uid, p->>'username');
  return game.q_sync(uid, -1, -1);
end $$;

create or replace function public.stt_sync(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin
  perform game._maybe_tick();
  return game.q_sync(uid, coalesce((p->>'since')::bigint, -1), coalesce((p->>'items_rev')::bigint, -1));
end $$;

create or replace function public.stt_catalog(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
begin perform game._uid(); return game.q_catalog(); end $$;

create or replace function public.stt_world(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
begin return game.q_world(game._uid()); end $$;

create or replace function public.stt_base(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
begin return game.q_base(game._uid(), game._p_uuid(p, 'player_id')); end $$;

create or replace function public.stt_raid_targets(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
begin return game.q_raid_targets(game._uid(), coalesce(p->>'sort', 'recommended')); end $$;

create or replace function public.stt_revenge(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
begin return game.q_revenge(game._uid()); end $$;

create or replace function public.stt_leaderboard(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
begin return game.q_leaderboard(game._uid(), coalesce(p->>'kind', 'base_value')); end $$;

create or replace function public.stt_profile(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid(); r jsonb;
begin
  r := game.q_profile(uid, case when p ? 'player_id' then game._p_uuid(p, 'player_id') else uid end);
  if r is null then raise exception 'Player not found.'; end if;
  return r;
end $$;

create or replace function public.stt_collection(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin
  return game.q_collection(case when p ? 'player_id' then game._p_uuid(p, 'player_id') else uid end);
end $$;

create or replace function public.stt_market(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
begin perform game._uid(); return game.q_market(); end $$;

create or replace function public.stt_market_item(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
begin return game.q_market_item(game._uid(), p->>'item_id', coalesce(p->>'range', '24H')); end $$;

create or replace function public.stt_listings(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
begin return game.q_listings(game._uid(), p); end $$;

create or replace function public.stt_trades(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
begin return game.q_trades(game._uid()); end $$;

create or replace function public.stt_quests(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin
  return jsonb_build_object('quests', game.act_quests(uid), 'daily', game._daily_status(uid));
end $$;

create or replace function public.stt_activity(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
begin return game.q_activity(game._uid()); end $$;

-- Writes ---------------------------------------------------------------------
create or replace function public.stt_open_drop(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin
  perform game._maybe_tick();
  return game.act_open_drop(uid, p->>'drop', coalesce((p->>'use_token')::boolean, false));
end $$;

create or replace function public.stt_place(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin
  perform game._maybe_tick();
  return game.act_place(uid, game._p_uuid(p, 'player_item_id'),
                        case when p->>'slot' is null then null else game._p_bigint(p, 'slot')::int end);
end $$;

create or replace function public.stt_store(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_store(uid, game._p_uuid(p, 'player_item_id')); end $$;

create or replace function public.stt_vault(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_vault(uid, game._p_uuid(p, 'player_item_id')); end $$;

create or replace function public.stt_auto_arrange(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_auto_arrange(uid); end $$;

create or replace function public.stt_quick_sell(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_quick_sell(uid, game._p_uuid(p, 'player_item_id')); end $$;

create or replace function public.stt_upgrade(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_upgrade(uid, p->>'kind'); end $$;

create or replace function public.stt_start_steal(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin
  perform game._maybe_tick();
  return game.act_start_steal(uid, game._p_uuid(p, 'player_item_id'), coalesce((p->>'revenge')::boolean, false));
end $$;

create or replace function public.stt_finish_steal(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_finish_steal(uid, game._p_uuid(p, 'raid_id')); end $$;

create or replace function public.stt_defend(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin return game.act_defend(uid, game._p_uuid(p, 'raid_id')); end $$;

create or replace function public.stt_list(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_list(uid, game._p_uuid(p, 'player_item_id'), game._p_bigint(p, 'price')); end $$;

create or replace function public.stt_cancel_listing(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_cancel_listing(uid, game._p_uuid(p, 'listing_id')); end $$;

create or replace function public.stt_buy_listing(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_buy_listing(uid, game._p_uuid(p, 'listing_id')); end $$;

create or replace function public.stt_trade_propose(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_trade_propose(uid, p); end $$;

create or replace function public.stt_trade_respond(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin
  perform game._maybe_tick();
  return game.act_trade_respond(uid, game._p_uuid(p, 'trade_id'), coalesce((p->>'accept')::boolean, false));
end $$;

create or replace function public.stt_trade_cancel(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_trade_cancel(uid, game._p_uuid(p, 'trade_id')); end $$;

create or replace function public.stt_claim_quest(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_claim_quest(uid, p->>'quest_id'); end $$;

create or replace function public.stt_claim_daily(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_claim_daily(uid); end $$;

create or replace function public.stt_buy_cosmetic(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin return game.act_buy_cosmetic(uid, p->>'cosmetic_id'); end $$;

create or replace function public.stt_equip(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin return game.act_equip(uid, p->>'cosmetic_id'); end $$;

create or replace function public.stt_set_focus(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin return game.act_set_focus(uid, upper(coalesce(p->>'focus', 'RANDOM'))); end $$;

create or replace function public.stt_tutorial(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin return game.act_tutorial(uid, game._p_bigint(p, 'step')::int); end $$;

create or replace function public.stt_prestige(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_prestige(uid); end $$;

-- ---------------------------------------------------------------------------
-- Privileges: only signed-in players may call stt_*; nobody may call game.*
-- ---------------------------------------------------------------------------
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'stt\\_%'
  loop
    execute format('revoke all on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated, service_role', f.sig);
  end loop;
  for f in
    select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'game'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;
`,u1=`-- ============================================================================
-- STEAL THE TECH — the Tech Belt update
--
--   * MUTATIONS  GOLD · DIAMOND · NEON · HOLO · GLITCH · RAINBOW multiply an
--                item's income and value (1.25× … 10×).
--   * PODIUM CASH  every displayed item piles up cash on its podium; walk over
--                it (act_collect) to bank it. Bots still bank automatically.
--   * TECH BELT  a shared conveyor of items rolling through the middle of the
--                city. Anyone can buy what's on it while it passes.
--   * BASE LOCK  lasers on your door block every raid for 40–90s.
--   * GRAB → CARRY  a steal is two phases: GRAB at the podium (security roll),
--                then CARRY it home. The owner can tag you and take it back.
--
-- Idempotent: safe to run more than once. Replaces some functions from the
-- earlier migrations with mutation / carry aware versions.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------
create table if not exists game.mutations (
  id text primary key,
  label text not null,
  mult numeric not null check (mult >= 1),
  color text not null,
  weight int not null check (weight >= 0),
  sort int not null default 0
);
insert into game.mutations (id, label, mult, color, weight, sort) values
  ('gold', 'GOLD', 1.25, '#fbbf24', 50, 1),
  ('diamond', 'DIAMOND', 1.5, '#67e8f9', 25, 2),
  ('neon', 'NEON', 2, '#f472b6', 12, 3),
  ('holo', 'HOLO', 3, '#c4b5fd', 7, 4),
  ('glitch', 'GLITCH', 5, '#22d3ee', 4, 5),
  ('rainbow', 'RAINBOW', 10, '#ffffff', 2, 6)
on conflict (id) do update set label = excluded.label, mult = excluded.mult, color = excluded.color,
  weight = excluded.weight, sort = excluded.sort;

alter table game.player_items add column if not exists mutation text references game.mutations(id);
alter table game.player_items add column if not exists accrued_at timestamptz not null default now();
alter table game.bases add column if not exists lock_until timestamptz;
alter table game.raids add column if not exists phase text not null default 'grab';
alter table game.raids add column if not exists grabbed_at timestamptz;
alter table game.raids add column if not exists carry_until timestamptz;
alter table game.raids add column if not exists deliver_after timestamptz;
alter table game.world add column if not exists belt_next_at timestamptz;
alter table game.player_stats add column if not exists belt_buys int not null default 0;
alter table game.player_stats add column if not exists collects int not null default 0;
alter table game.player_stats add column if not exists mutations_found int not null default 0;
alter table game.player_stats add column if not exists thieves_caught int not null default 0;

do $$
begin
  alter table game.raids add constraint raids_phase_check check (phase in ('grab', 'carry'));
exception when duplicate_object then null;
end $$;

-- The Tech Belt. Rows are scheduled a little ahead of time so every client
-- sees a smooth stream no matter how often the world ticks.
create table if not exists game.belt (
  id bigserial primary key,
  item_id text not null references game.items(id),
  mutation text references game.mutations(id),
  price bigint not null check (price > 0),
  spawned_at timestamptz not null,
  ends_at timestamptz not null,
  sold_to uuid references game.profiles(id) on delete set null,
  sold_at timestamptz,
  player_item_id uuid
);
create index if not exists belt_ends on game.belt (ends_at);
create index if not exists belt_sold on game.belt (sold_at) where sold_at is not null;

alter table game.mutations enable row level security;
alter table game.belt enable row level security;
revoke all on game.mutations, game.belt from anon, authenticated;
revoke all on sequence game.belt_id_seq from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Mutations
-- ---------------------------------------------------------------------------
create or replace function game._mut_mult(p_mut text) returns numeric
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce((select m.mult from game.mutations m where m.id = p_mut), 1)
$$;

create or replace function game._roll_mutation(p_chance numeric) returns text
language plpgsql volatile set search_path = pg_catalog, game, pg_temp as $$
declare total numeric; pick numeric; acc numeric := 0; m record;
begin
  if p_chance is null or random() >= p_chance then return null; end if;
  select sum(weight) into total from mutations;
  if coalesce(total, 0) <= 0 then return null; end if;
  pick := random()::numeric * total;
  for m in select id, weight from mutations order by sort loop
    acc := acc + m.weight;
    if pick < acc then return m.id; end if;
  end loop;
  return null;
end $$;

create or replace function game._item_json(p game.player_items) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object(
    'id', p.id, 'item_id', p.item_id, 'location', p.location, 'slot', p.slot, 'serial', p.serial,
    'soulbound', p.soulbound, 'hot_until', p.hot_until, 'acquired_via', p.acquired_via,
    'acquired_at', p.acquired_at, 'stolen_from', p.stolen_from, 'mutation', p.mutation,
    'accrued_at', p.accrued_at)
$$;

-- ---------------------------------------------------------------------------
-- Income: cash piles up on each podium until the owner walks over it
-- ---------------------------------------------------------------------------
create or replace function game._income_rate(p_pid uuid) returns double precision
language plpgsql stable set search_path = pg_catalog, game, pg_temp as $$
declare r double precision; ev record; pr int;
begin
  select * into ev from game._current_event();
  select prestige into pr from profiles where id = p_pid;
  select coalesce(sum(i.base_income * coalesce(m.mult, 1)
                      * case when ev.category is not null and i.category = ev.category then ev.income_mult else 1 end), 0)
    into r
  from player_items pi join items i on i.id = pi.item_id left join mutations m on m.id = pi.mutation
  where pi.owner_id = p_pid and pi.location = 'display';
  return r * (1 + 0.05 * coalesce(pr, 0));
end $$;

-- Income per second of one item for its owner right now.
create or replace function game._item_rate(p_item text, p_mut text, p_owner uuid) returns double precision
language plpgsql stable set search_path = pg_catalog, game, pg_temp as $$
declare it record; ev record; pr int;
begin
  select base_income, category into it from items where id = p_item;
  if not found then return 0; end if;
  select * into ev from game._current_event();
  select prestige into pr from profiles where id = p_owner;
  return it.base_income * game._mut_mult(p_mut)
         * (case when ev.category is not null and it.category = ev.category then ev.income_mult else 1 end)
         * (1 + 0.05 * coalesce(pr, 0));
end $$;

-- Cash waiting on a podium (capped at 12 hours of earnings).
create or replace function game._pending(p game.player_items) returns bigint
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select case when p.location <> 'display' then 0::bigint else
    floor(game._item_rate(p.item_id, p.mutation, p.owner_id)
          * least(43200, greatest(0, extract(epoch from now() - p.accrued_at))))::bigint end
$$;

create or replace function game._credit_income(p_pid uuid, p_amount bigint, p_src text) returns bigint
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare bal bigint;
begin
  if p_amount is null or p_amount <= 0 then
    select cash into bal from profiles where id = p_pid;
    return bal;
  end if;
  update profiles set cash = cash + p_amount where id = p_pid returning cash into bal;
  if not found then return null; end if;
  insert into transactions (player_id, kind, amount, balance_after, ref)
  values (p_pid, 'income', p_amount, bal, jsonb_build_object('src', p_src));
  update player_stats set cash_earned = cash_earned + p_amount where player_id = p_pid;
  perform game._quest_progress(p_pid, 'earn_cash', p_amount);
  return bal;
end $$;

-- Bots bank passive income automatically; humans collect it from their podiums.
create or replace function game._settle(p_pid uuid) returns bigint
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare p record; rate double precision; elapsed double precision; earned double precision; whole bigint;
begin
  select cash, income_remainder, last_income_at, is_bot into p from profiles where id = p_pid;
  if not found then return 0; end if;
  if not p.is_bot then return p.cash; end if;
  elapsed := extract(epoch from (now() - p.last_income_at));
  if elapsed <= 0 then return p.cash; end if;
  elapsed := least(elapsed, 43200);
  rate := game._income_rate(p_pid);
  earned := rate * elapsed + p.income_remainder;
  whole := floor(earned)::bigint;
  update profiles set cash = cash + whole, income_remainder = earned - whole, last_income_at = now()
  where id = p_pid;
  return p.cash + whole;
end $$;

-- Whenever an item leaves a podium (stored, vaulted, sold, stolen, traded…) the
-- cash waiting on it goes to its owner first; an item arriving on a podium
-- starts a fresh pile.
create or replace function game._items_accrual() returns trigger
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare bot boolean; amt bigint;
begin
  if tg_op = 'DELETE' then
    if old.location = 'display' then
      select is_bot into bot from profiles where id = old.owner_id;
      if bot is false then
        amt := game._pending(old);
        if amt > 0 then perform game._credit_income(old.owner_id, amt, 'auto'); end if;
      end if;
    end if;
    return old;
  end if;
  if old.location = 'display' and (new.location <> 'display' or new.owner_id <> old.owner_id) then
    select is_bot into bot from profiles where id = old.owner_id;
    if bot is false then
      amt := game._pending(old);
      if amt > 0 then perform game._credit_income(old.owner_id, amt, 'auto'); end if;
    end if;
  end if;
  if new.location = 'display' and (old.location <> 'display' or new.owner_id <> old.owner_id) then
    new.accrued_at := now();
  end if;
  return new;
end $$;

drop trigger if exists player_items_accrual on game.player_items;
create trigger player_items_accrual before update or delete on game.player_items
  for each row execute function game._items_accrual();

-- Walk over a podium (or the base's collect pad) to bank its cash.
create or replace function game.act_collect(p_pid uuid, p_piid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare pi game.player_items; amt bigint; total bigint := 0; got jsonb := '[]'::jsonb; bal bigint;
begin
  perform 1 from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  for pi in
    select * from player_items where owner_id = p_pid and location = 'display'
      and (p_piid is null or id = p_piid)
    order by slot for update
  loop
    amt := game._pending(pi);
    if amt > 0 then
      update player_items set accrued_at = now() where id = pi.id;
      total := total + amt;
      got := got || jsonb_build_object('id', pi.id, 'slot', pi.slot, 'amount', amt);
    end if;
  end loop;
  if total > 0 then
    bal := game._credit_income(p_pid, total, 'collect');
    update player_stats set collects = collects + 1 where player_id = p_pid;
    perform game._quest_progress(p_pid, 'collects', 1);
    perform game._check_achievements(p_pid);
  else
    select cash into bal from profiles where id = p_pid;
  end if;
  return jsonb_build_object('ok', true, 'collected', total, 'items', got, 'cash', bal);
end $$;

-- ---------------------------------------------------------------------------
-- Value helpers (mutations multiply value)
-- ---------------------------------------------------------------------------
create or replace function game._base_value(p_pid uuid) returns bigint
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce(sum(ms.price * coalesce(m.mult, 1)), 0)::bigint from game.player_items pi
  join game.market_state ms on ms.item_id = pi.item_id
  left join game.mutations m on m.id = pi.mutation
  where pi.owner_id = p_pid and pi.location = 'display'
$$;

create or replace function game._value_of(p_items uuid[]) returns bigint
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce(sum(ms.price * coalesce(m.mult, 1)), 0)::bigint
  from game.player_items pi join game.market_state ms on ms.item_id = pi.item_id
  left join game.mutations m on m.id = pi.mutation
  where pi.id = any(p_items)
$$;

create or replace function game._being_carried(p_piid uuid) returns boolean
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select exists (select 1 from game.raids where player_item_id = p_piid and status = 'active' and phase = 'carry')
$$;

-- Fill display slots with the best earners. Items somebody is stealing stay put.
create or replace function game._arrange_best(p_pid uuid) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare n int;
begin
  n := coalesce(game._slots(p_pid), 4);
  update player_items set location = 'inventory', slot = null
  where owner_id = p_pid and location = 'display'
    and not exists (select 1 from raids r where r.player_item_id = player_items.id and r.status = 'active');
  with taken as (
    select slot from player_items where owner_id = p_pid and location = 'display'
  ), free as (
    select g as slot, row_number() over (order by g) as k
    from generate_series(0, n - 1) g where g not in (select slot from taken)
  ), c as (
    select pi.id, row_number() over (order by i.base_income * coalesce(m.mult, 1) desc, pi.acquired_at, pi.id) as k
    from player_items pi join items i on i.id = pi.item_id left join mutations m on m.id = pi.mutation
    where pi.owner_id = p_pid and pi.location = 'inventory'
  )
  update player_items set location = 'display', slot = free.slot
  from c join free on free.k = c.k
  where player_items.id = c.id;
end $$;

-- ---------------------------------------------------------------------------
-- Base management: nothing moves while a thief is running off with it
-- ---------------------------------------------------------------------------
create or replace function game.act_place(p_pid uuid, p_piid uuid, p_slot int) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare pi game.player_items; occ record; n int; v_slot int := p_slot;
begin
  perform 1 from profiles where id = p_pid for update;
  pi := game._own_item(p_pid, p_piid);
  if pi.location = 'listed' then raise exception 'Cancel the market listing first.'; end if;
  if game._being_carried(p_piid) then raise exception 'A thief is running off with that — chase them!'; end if;
  n := game._slots(p_pid);
  if v_slot is null then
    if pi.location = 'display' then return jsonb_build_object('ok', true, 'slot', pi.slot); end if;
    v_slot := game._free_slot(p_pid);
    if v_slot is null then raise exception 'Your base is full — upgrade it or swap an item out.'; end if;
  end if;
  if v_slot < 0 or v_slot >= n then raise exception 'That display slot doesn''t exist.'; end if;
  if pi.location = 'display' and pi.slot = v_slot then return jsonb_build_object('ok', true, 'slot', v_slot); end if;
  select * into occ from player_items
  where owner_id = p_pid and location = 'display' and slot = v_slot and id <> p_piid for update;
  if found then
    if game._being_carried(occ.id) then raise exception 'A thief is running off with the item in that slot!'; end if;
    if pi.location = 'display' then
      update player_items set slot = -1 where id = occ.id;
      update player_items set slot = v_slot where id = p_piid;
      update player_items set slot = pi.slot where id = occ.id;
    else
      update player_items set location = 'inventory', slot = null where id = occ.id;
      update player_items set location = 'display', slot = v_slot where id = p_piid;
    end if;
  else
    update player_items set location = 'display', slot = v_slot where id = p_piid;
  end if;
  return jsonb_build_object('ok', true, 'slot', v_slot);
end $$;

create or replace function game.act_store(p_pid uuid, p_piid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare pi game.player_items;
begin
  perform 1 from profiles where id = p_pid for update;
  pi := game._own_item(p_pid, p_piid);
  if pi.location = 'listed' then raise exception 'Cancel the market listing first.'; end if;
  if pi.location = 'inventory' then return jsonb_build_object('ok', true); end if;
  if game._being_carried(p_piid) then raise exception 'A thief is running off with that — chase them!'; end if;
  update player_items set location = 'inventory', slot = null where id = p_piid;
  return jsonb_build_object('ok', true);
end $$;

create or replace function game.act_vault(p_pid uuid, p_piid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare pi game.player_items; cap int; used int; saved boolean;
begin
  perform 1 from profiles where id = p_pid for update;
  pi := game._own_item(p_pid, p_piid);
  if pi.location = 'vault' then return jsonb_build_object('ok', true); end if;
  if pi.location = 'listed' then raise exception 'Cancel the market listing first.'; end if;
  if game._being_carried(p_piid) then
    raise exception 'Too late for the vault — it''s already out the door. Chase the thief!';
  end if;
  cap := game._vault_capacity(p_pid);
  select count(*) into used from player_items where owner_id = p_pid and location = 'vault';
  if used >= cap then raise exception 'Your vault is full (%/%). Upgrade it to protect more items.', used, cap; end if;
  saved := game._under_raid(p_piid);
  update player_items set location = 'vault', slot = null where id = p_piid;
  return jsonb_build_object('ok', true, 'saved_from_raid', saved);
end $$;

create or replace function game.act_auto_arrange(p_pid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
begin
  perform 1 from profiles where id = p_pid for update;
  perform game._arrange_best(p_pid);
  return jsonb_build_object('ok', true);
end $$;

create or replace function game.act_quick_sell(p_pid uuid, p_piid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare pi game.player_items; mprice bigint; v_price bigint; bal bigint;
begin
  perform 1 from profiles where id = p_pid for update;
  pi := game._own_item(p_pid, p_piid);
  if pi.soulbound then raise exception 'Your starter item can''t be sold.'; end if;
  if pi.location = 'listed' then raise exception 'Cancel the market listing first.'; end if;
  if pi.hot_until > now() then
    raise exception 'That item is too hot to sell — wait %s.', ceil(extract(epoch from pi.hot_until - now()));
  end if;
  if game._under_raid(p_piid) then raise exception 'Someone is stealing that right now — lock up or chase them!'; end if;
  select price into mprice from market_state where item_id = pi.item_id;
  v_price := greatest(1, floor(mprice * game._mut_mult(pi.mutation) * 0.6))::bigint;
  perform game._settle(p_pid);
  delete from player_items where id = p_piid;
  insert into item_log (player_item_id, item_id, from_id, to_id, via, amount)
  values (p_piid, pi.item_id, p_pid, null, 'quick_sell', v_price);
  insert into market_sales (item_id, price, seller_id, kind)
  values (pi.item_id, round(v_price / game._mut_mult(pi.mutation))::bigint, p_pid, 'quick_sell');
  bal := game._cash(p_pid, v_price, 'quick_sell', jsonb_build_object('item_id', pi.item_id, 'mutation', pi.mutation));
  update market_state set demand = greatest(0, demand - 1) where item_id = pi.item_id;
  update player_stats set quick_sales = quick_sales + 1 where player_id = p_pid;
  perform game._quest_progress(p_pid, 'sell_item', 1);
  perform game._xp(p_pid, 10, 'sell');
  perform game._check_achievements(p_pid);
  return jsonb_build_object('ok', true, 'price', v_price, 'cash', bal);
end $$;

-- ---------------------------------------------------------------------------
-- Market: listing bounds and price discovery use the mutation-adjusted value
-- ---------------------------------------------------------------------------
create or replace function game.act_list(p_pid uuid, p_piid uuid, p_price bigint) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare pi game.player_items; mprice numeric; lo bigint; hi bigint; lid uuid; it record;
begin
  perform 1 from profiles where id = p_pid for update;
  pi := game._own_item(p_pid, p_piid);
  if pi.soulbound then raise exception 'Your starter item can''t be sold.'; end if;
  if pi.location = 'listed' then raise exception 'That item is already listed.'; end if;
  if pi.hot_until > now() then
    raise exception 'That item is too hot to sell — wait %s.', ceil(extract(epoch from pi.hot_until - now()));
  end if;
  if game._under_raid(p_piid) then raise exception 'Someone is stealing that right now!'; end if;
  select i.* into it from items i where i.id = pi.item_id;
  if not it.tradeable then raise exception 'That item can''t be traded.'; end if;
  select price * game._mut_mult(pi.mutation) into mprice from market_state where item_id = pi.item_id;
  lo := greatest(1, floor(mprice * 0.25))::bigint;
  hi := floor(mprice * 5)::bigint;
  if p_price is null or p_price < lo or p_price > hi then
    raise exception 'Price must be between % and %.', game.fmt_money(lo), game.fmt_money(hi);
  end if;
  if (select count(*) from market_listings where seller_id = p_pid and status = 'active') >= 20 then
    raise exception 'You can have at most 20 active listings.';
  end if;
  perform game._settle(p_pid);
  update player_items set location = 'listed', slot = null where id = p_piid;
  insert into market_listings (seller_id, player_item_id, item_id, price)
  values (p_pid, p_piid, pi.item_id, p_price) returning id into lid;
  update market_state set listed = listed + 1 where item_id = pi.item_id;
  return jsonb_build_object('ok', true, 'listing_id', lid);
end $$;

create or replace function game.act_buy_listing(p_pid uuid, p_lid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare l record; fee bigint; bal bigint; it record; bname text; sname text; sbot boolean; v_slot int;
        v_mult numeric; v_norm numeric;
begin
  select * into l from market_listings where id = p_lid for update;
  if not found or l.status <> 'active' then raise exception 'That listing is no longer available.'; end if;
  if l.seller_id = p_pid then raise exception 'You can''t buy your own listing.'; end if;
  perform 1 from profiles where id in (p_pid, l.seller_id) order by id for update;
  select username into bname from profiles where id = p_pid;
  if bname is null then raise exception 'Create your player first.'; end if;
  select username, is_bot into sname, sbot from profiles where id = l.seller_id;
  select i.*, r.tier into it from items i join rarities r on r.id = i.rarity where i.id = l.item_id;
  select game._mut_mult(mutation) into v_mult from player_items where id = l.player_item_id;
  v_norm := l.price / coalesce(v_mult, 1);
  perform game._settle(p_pid);
  bal := game._cash(p_pid, -l.price, 'market_buy', jsonb_build_object('listing_id', p_lid, 'item_id', l.item_id));
  fee := ceil(l.price * 0.05)::bigint;
  perform game._cash(l.seller_id, l.price - fee, 'market_sale',
    jsonb_build_object('listing_id', p_lid, 'item_id', l.item_id, 'fee', fee));
  perform game._transfer(l.player_item_id, p_pid, 'market', l.price);
  update market_listings set status = 'sold', buyer_id = p_pid, resolved_at = now() where id = p_lid;
  insert into market_sales (item_id, price, seller_id, buyer_id, kind)
  values (l.item_id, round(v_norm)::bigint, l.seller_id, p_pid, 'listing');
  update market_state set
    price = greatest(1, round(price * 0.85 + greatest(price * 0.6, least(price * 1.6, v_norm)) * 0.15)),
    demand = least(100, demand + 2),
    listed = greatest(0, listed - 1)
  where item_id = l.item_id;
  update player_stats set market_buys = market_buys + 1 where player_id = p_pid;
  update player_stats set market_sales = market_sales + 1 where player_id = l.seller_id;
  perform game._quest_progress(p_pid, 'complete_trades', 1);
  perform game._quest_progress(l.seller_id, 'complete_trades', 1);
  perform game._quest_progress(l.seller_id, 'sell_item', 1);
  perform game._xp(p_pid, 15, 'market');
  perform game._xp(l.seller_id, 15, 'market');
  v_slot := game._autoplace(p_pid, l.player_item_id);
  perform game._check_achievements(p_pid);
  perform game._check_achievements(l.seller_id);
  perform game._emit('listing_sold', l.seller_id, p_pid, jsonb_build_object(
    'buyer', bname, 'item_id', l.item_id, 'item', it.name, 'price', l.price, 'fee', fee));
  if it.tier >= 6 then
    perform game._emit('big_sale', null, p_pid, jsonb_build_object(
      'buyer', bname, 'seller', sname, 'item_id', l.item_id, 'item', it.name, 'rarity', it.rarity, 'price', l.price));
  end if;
  return jsonb_build_object('ok', true, 'price', l.price, 'cash', bal, 'player_item_id', l.player_item_id,
                            'placed', v_slot is not null);
end $$;

-- ---------------------------------------------------------------------------
-- Drops can come out mutated (3%)
-- ---------------------------------------------------------------------------
create or replace function game.act_open_drop(p_pid uuid, p_drop text, p_use_token boolean) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare p record; d record; ev record; tokens int; v_item text; v_id uuid; is_new boolean; bal bigint;
        v_slot int; it record; pi game.player_items; v_mut text;
begin
  select * into p from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  select * into d from drop_types where id = p_drop;
  if not found then raise exception 'Unknown drop.'; end if;
  if p.level < d.min_level then raise exception '% unlocks at level %.', d.name, d.min_level; end if;
  if d.event_only then
    select * into ev from game._current_event();
    if ev.type_id is null then raise exception 'Event Drops are only available during live events.'; end if;
  end if;
  if d.requires_key and p.secret_keys < 1 then
    raise exception 'You need a Secret Key to open the %.', d.name;
  end if;
  perform game._settle(p_pid);
  if p_use_token then
    tokens := coalesce((p.drop_tokens->>p_drop)::int, 0);
    if tokens < 1 then raise exception 'You have no free % tokens.', d.name; end if;
    perform game._add_tokens(p_pid, p_drop, -1);
  else
    perform game._cash(p_pid, -d.price, 'drop', jsonb_build_object('drop', p_drop));
  end if;
  if d.requires_key then
    update profiles set secret_keys = secret_keys - 1 where id = p_pid;
  end if;

  v_item := game._roll_drop(p_pid, p_drop, p.is_bot);
  begin
    is_new := not exists (select 1 from player_collection where player_id = p_pid and item_id = v_item);
    v_id := game._grant(p_pid, v_item, 'drop');
  exception when others then
    if sqlerrm <> 'SOLD_OUT' then raise; end if;
    select id into v_item from items where rarity = 'ultra' and droppable order by random() limit 1;
    is_new := not exists (select 1 from player_collection where player_id = p_pid and item_id = v_item);
    v_id := game._grant(p_pid, v_item, 'drop');
  end;
  v_mut := game._roll_mutation(0.03);
  if v_mut is not null then
    update player_items set mutation = v_mut where id = v_id;
    update player_stats set mutations_found = mutations_found + 1 where player_id = p_pid;
  end if;

  update player_stats set drops_opened = drops_opened + 1,
                          events_joined = events_joined + (d.event_only)::int
  where player_id = p_pid;
  v_slot := game._autoplace(p_pid, v_id);
  if not p.is_bot then
    perform game._quest_progress(p_pid, 'open_drops', 1);
    perform game._xp(p_pid, d.xp, 'drop');
    if v_mut is not null then
      perform game._quest_progress(p_pid, 'mutations', 1);
      perform game._achieve(p_pid, 'first_mutation');
      if v_mut = 'rainbow' then perform game._achieve(p_pid, 'rainbow'); end if;
    end if;
    perform game._check_achievements(p_pid);
  end if;

  select i.*, r.xp as rxp into it from items i join rarities r on r.id = i.rarity where i.id = v_item;
  select * into pi from player_items where id = v_id;
  select cash into bal from profiles where id = p_pid;
  return jsonb_build_object(
    'player_item', game._item_json(pi),
    'item_id', v_item, 'rarity', it.rarity, 'serial', pi.serial, 'is_new', is_new,
    'placed', v_slot is not null, 'slot', v_slot, 'mutation', v_mut,
    'xp', d.xp + it.rxp, 'cash', bal, 'drop', p_drop);
end $$;

-- ---------------------------------------------------------------------------
-- The Tech Belt
-- ---------------------------------------------------------------------------
-- Schedule items onto the belt up to 25 seconds ahead.
create or replace function game._belt_fill() returns int
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare nxt timestamptz; horizon timestamptz := now() + interval '25 seconds'; n int := 0; rar text;
        v_item text; v_mut text; ev record; mprice bigint; w jsonb; cat text; secs numeric := 36;
begin
  select belt_next_at into nxt from world where id = 1 for update;
  -- first run (or after a long sleep): start far enough back that the whole belt is already full
  if nxt is null or nxt < now() - make_interval(secs => secs) then nxt := now() - make_interval(secs => secs - 1); end if;
  select * into ev from game._current_event();
  w := '{"common": 460, "uncommon": 280, "rare": 140, "epic": 70, "legendary": 32, "mythic": 12,
         "ultra": 4.5, "limited": 0.8, "secret": 0.7}'::jsonb;
  while nxt < horizon and n < 40 loop
    rar := game._roll_rarity(w, 0, coalesce(ev.luck_mult, 1));
    v_item := null;
    if rar in ('limited', 'secret') then
      select i.id into v_item from items i join limited_item_supply s on s.item_id = i.id
      where i.rarity = rar and i.droppable and s.minted < s.max_supply
      order by random() limit 1;
    else
      cat := case when ev.category is not null and random() < 0.5 then ev.category else null end;
      select i.id into v_item from items i
      where i.rarity = rar and i.droppable and (cat is null or i.category = cat)
      order by random() limit 1;
      if v_item is null then
        select i.id into v_item from items i where i.rarity = rar and i.droppable order by random() limit 1;
      end if;
    end if;
    if v_item is not null then
      v_mut := game._roll_mutation(0.15);
      select price into mprice from market_state where item_id = v_item;
      insert into belt (item_id, mutation, price, spawned_at, ends_at)
      values (v_item, v_mut, greatest(1, ceil(mprice * game._mut_mult(v_mut) * 1.05))::bigint,
              nxt, nxt + make_interval(secs => secs));
      n := n + 1;
    end if;
    nxt := nxt + make_interval(secs => 2.2 + random() * 1.6);
  end loop;
  update world set belt_next_at = nxt where id = 1;
  delete from belt where ends_at < now() - interval '10 minutes';
  return n;
end $$;

create or replace function game.act_buy_belt(p_pid uuid, p_belt bigint) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare b record; p record; it record; v_id uuid; v_slot int; bal bigint; is_new boolean;
        pi game.player_items; bname text;
begin
  select * into p from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  select * into b from belt where id = p_belt for update;
  if not found then raise exception 'That item already left the belt.'; end if;
  if b.sold_to is not null then
    select username into bname from profiles where id = b.sold_to;
    raise exception 'Too slow! % grabbed it first.', coalesce(bname, 'Someone');
  end if;
  if now() < b.spawned_at then raise exception 'That item hasn''t rolled onto the belt yet.'; end if;
  if now() > b.ends_at + interval '1 second' then raise exception 'That item already left the belt.'; end if;
  select i.*, r.tier into it from items i join rarities r on r.id = i.rarity where i.id = b.item_id;
  perform game._settle(p_pid);
  bal := game._cash(p_pid, -b.price, 'belt_buy', jsonb_build_object('belt_id', b.id, 'item_id', b.item_id));
  is_new := not exists (select 1 from player_collection where player_id = p_pid and item_id = b.item_id);
  begin
    v_id := game._grant(p_pid, b.item_id, 'belt');
  exception when others then
    if sqlerrm = 'SOLD_OUT' then raise exception '% just sold out!', it.name; end if;
    raise;
  end;
  if b.mutation is not null then update player_items set mutation = b.mutation where id = v_id; end if;
  update belt set sold_to = p_pid, sold_at = now(), player_item_id = v_id where id = b.id;
  v_slot := game._autoplace(p_pid, v_id);
  update market_state set demand = least(100, demand + 1.5) where item_id = b.item_id;
  update player_stats set belt_buys = belt_buys + 1,
                          mutations_found = mutations_found + (b.mutation is not null)::int
  where player_id = p_pid;
  if not p.is_bot then
    perform game._quest_progress(p_pid, 'belt_buys', 1);
    perform game._xp(p_pid, 5 + it.tier * 3, 'belt');
    if b.mutation is not null then
      perform game._quest_progress(p_pid, 'mutations', 1);
      perform game._achieve(p_pid, 'first_mutation');
      if b.mutation = 'rainbow' then perform game._achieve(p_pid, 'rainbow'); end if;
    end if;
    if it.tier >= 5 then perform game._achieve(p_pid, 'belt_sniper'); end if;
    perform game._check_achievements(p_pid);
  end if;
  if (it.tier between 5 and 6) or b.mutation in ('glitch', 'rainbow') then
    perform game._emit('belt_buy', null, p_pid, jsonb_build_object(
      'player', p.username, 'item_id', b.item_id, 'item', it.name, 'rarity', it.rarity,
      'mutation', b.mutation, 'price', b.price, 'is_bot', p.is_bot));
  end if;
  select * into pi from player_items where id = v_id;
  select cash into bal from profiles where id = p_pid;
  return jsonb_build_object('ok', true, 'player_item', game._item_json(pi), 'belt_id', b.id,
    'item_id', b.item_id, 'rarity', it.rarity, 'mutation', b.mutation, 'serial', pi.serial,
    'is_new', is_new, 'placed', v_slot is not null, 'slot', v_slot, 'price', b.price, 'cash', bal);
end $$;

create or replace function game.q_belt(p_pid uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object('server_time', game._now_ms(), 'seconds', 36,
    'items', coalesce(jsonb_agg(jsonb_build_object(
      'id', b.id, 'item_id', b.item_id, 'mutation', b.mutation, 'price', b.price,
      'spawned_at', b.spawned_at, 'ends_at', b.ends_at, 'sold_to', b.sold_to, 'buyer', p.username,
      'sold_at', b.sold_at, 'mine', b.sold_to = p_pid) order by b.spawned_at), '[]'::jsonb))
  from game.belt b left join game.profiles p on p.id = b.sold_to
  where b.spawned_at < now() + interval '30 seconds'
    and ((b.sold_to is null and b.ends_at > now() - interval '2 seconds')
         or b.sold_at > now() - interval '12 seconds')
$$;

-- NPCs shop the belt too — but only once an item is well along, so humans get first pick.
create or replace function game._bot_belt() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare b record; v_bot uuid; n int := 0; extra int;
begin
  for b in
    select bl.id, bl.price, bl.mutation, r.tier
    from belt bl join items i on i.id = bl.item_id join rarities r on r.id = i.rarity
    where bl.sold_to is null and bl.spawned_at < now() - interval '15 seconds'
      and bl.ends_at > now() + interval '2 seconds'
    order by r.tier desc, bl.price desc limit 6
  loop
    if random() < (case when b.tier >= 7 then 0.45 when b.tier >= 5 then 0.3 when b.tier >= 3 then 0.12 else 0.05 end
                   + case when b.mutation is not null then 0.1 else 0 end) then
      select p.id into v_bot from profiles p
      where p.is_bot and p.cash > b.price * 1.5 and not coalesce((p.bot->>'tutorial')::boolean, false)
      order by random() limit 1;
      if v_bot is not null then
        begin
          perform game.act_buy_belt(v_bot, b.id);
          perform game._arrange_best(v_bot);
          select count(*) into extra from player_items where owner_id = v_bot and location = 'inventory';
          if extra > 5 then
            perform game.act_quick_sell(v_bot, x.id) from (
              select pi.id from player_items pi join items i on i.id = pi.item_id
              where pi.owner_id = v_bot and pi.location = 'inventory' and not pi.soulbound
                and (pi.hot_until is null or pi.hot_until < now())
              order by i.base_income asc limit 1) x;
          end if;
          n := n + 1;
        exception when others then null;
        end;
      end if;
    end if;
    exit when n >= 2;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Base lock: lasers on the door. 30s + 10s per security level, then a short recharge.
-- ---------------------------------------------------------------------------
create or replace function game.act_lock_base(p_pid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare b record; dur int; v_until timestamptz;
begin
  perform 1 from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  select * into b from bases where player_id = p_pid for update;
  if b.lock_until > now() then
    raise exception 'Already locked — %s left.', ceil(extract(epoch from b.lock_until - now()));
  end if;
  if b.lock_until > now() - interval '10 seconds' then
    raise exception 'Lasers recharging — ready in %s.', ceil(extract(epoch from b.lock_until + interval '10 seconds' - now()));
  end if;
  dur := 30 + 10 * b.security_level;
  v_until := now() + make_interval(secs => dur);
  update bases set lock_until = v_until where player_id = p_pid;
  perform game._quest_progress(p_pid, 'lock_base', 1);
  return jsonb_build_object('ok', true, 'lock_until', v_until, 'seconds', dur);
end $$;

-- ---------------------------------------------------------------------------
-- Raids: GRAB (security roll at the podium) → CARRY (run it home)
-- ---------------------------------------------------------------------------
-- Grab time: quick for cheap items in weak bases, slow for secrets behind quantum locks.
create or replace function game._raid_seconds(p_def uuid, p_item text, p_revenge boolean) returns numeric
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select greatest(3, 2 + b.security_level + ra.steal_extra_seconds - case when p_revenge then 1 else 0 end)::numeric
  from game.bases b, game.items i join game.rarities ra on ra.id = i.rarity
  where b.player_id = p_def and i.id = p_item
$$;

create or replace function game._raid_block_reason(p_att uuid, p_def uuid, p_revenge boolean) returns text
language plpgsql stable set search_path = pg_catalog, game, pg_temp as $$
declare d record; b record;
begin
  if p_att = p_def then return 'That''s your own base.'; end if;
  select * into d from profiles where id = p_def;
  if not found then return 'Player not found.'; end if;
  select * into b from bases where player_id = p_def;
  if not d.is_bot and d.level < 3 then return d.username || ' is under new-player protection.'; end if;
  if b.lock_until > now() then
    return d.username || '''s base is LOCKED for ' || ceil(extract(epoch from b.lock_until - now()))::text || 's.';
  end if;
  if not p_revenge and b.shield_until > now() then
    return d.username || '''s base is shielded for ' || ceil(extract(epoch from b.shield_until - now()))::text || 's.';
  end if;
  return null;
end $$;

create or replace function game._raid_result(p_raid uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object(
    'raid_id', r.id, 'status', r.status, 'phase', r.phase, 'item_id', r.item_id, 'player_item_id', r.player_item_id,
    'attacker_id', r.attacker_id, 'attacker', a.username, 'defender_id', r.defender_id, 'defender', d.username,
    'defended', r.defended, 'fine', r.fine, 'chance', r.chance, 'note', r.note, 'is_revenge', r.is_revenge,
    'is_tutorial', r.is_tutorial, 'resolved_at', r.resolved_at, 'ends_at', r.ends_at,
    'grabbed_at', r.grabbed_at, 'carry_until', r.carry_until, 'deliver_after', r.deliver_after,
    'mutation', (select pi.mutation from game.player_items pi where pi.id = r.player_item_id))
  from game.raids r
  join game.profiles a on a.id = r.attacker_id
  join game.profiles d on d.id = r.defender_id
  where r.id = p_raid
$$;

create or replace function game.act_start_steal(p_pid uuid, p_piid uuid, p_revenge boolean default false) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare a record; pi record; d record; it record; v_chance numeric; dur numeric; rid uuid; tut boolean := false;
        ends timestamptz; reason text; rv uuid;
begin
  select * into a from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  if a.raid_cooldown_until > now() then
    raise exception 'You''re laying low — you can raid again in %s.', ceil(extract(epoch from a.raid_cooldown_until - now()));
  end if;
  if exists (select 1 from raids where attacker_id = p_pid and status = 'active') then
    raise exception 'You''re already in the middle of a raid.';
  end if;
  select * into pi from player_items where id = p_piid for update;
  if not found then raise exception 'That item is gone.'; end if;
  if pi.owner_id = p_pid then raise exception 'You can''t steal from yourself.'; end if;
  if pi.location <> 'display' then raise exception 'That item isn''t on display any more.'; end if;
  if pi.soulbound then raise exception 'Starter items can''t be stolen.'; end if;
  reason := game._raid_block_reason(p_pid, pi.owner_id, p_revenge);
  if reason is not null then raise exception '%', reason; end if;
  if game._under_raid(p_piid) then raise exception 'Someone else is already stealing that!'; end if;
  select * into d from profiles where id = pi.owner_id;
  if p_revenge then
    rv := game._revenge_row(p_pid, pi.owner_id);
    if rv is null then raise exception 'You have no revenge available against %.', d.username; end if;
    update raids set revenge_used = true where id = rv;
  end if;
  select i.*, r.tier into it from items i join rarities r on r.id = i.rarity where i.id = pi.item_id;
  v_chance := game._raid_chance(p_pid, pi.owner_id, pi.item_id, p_revenge);
  dur := game._raid_seconds(pi.owner_id, pi.item_id, p_revenge);
  if coalesce((d.bot->>'tutorial')::boolean, false) and a.tutorial_step between 8 and 11
     and not coalesce((a.tutorial_flags->>'tutorial_raid')::boolean, false) then
    tut := true; v_chance := 1.0; dur := 3;  -- the one-time beginner raid always works
  end if;
  if not a.is_bot and not d.is_bot then
    dur := greatest(dur, 6);  -- a real owner always gets a moment to react
  end if;
  ends := now() + make_interval(secs => dur);
  insert into raids (attacker_id, defender_id, player_item_id, item_id, chance, ends_at, is_revenge, is_tutorial, phase)
  values (p_pid, pi.owner_id, p_piid, pi.item_id, v_chance, ends, p_revenge, tut, 'grab')
  returning id into rid;
  perform game._emit('raid_warning', pi.owner_id, p_pid, jsonb_build_object(
    'raid_id', rid, 'attacker', a.username, 'attacker_id', p_pid, 'item_id', pi.item_id, 'item', it.name,
    'rarity', it.rarity, 'player_item_id', p_piid, 'ends_at', ends, 'revenge', p_revenge));
  if it.tier >= 7 then
    perform game._emit('raid_alert', null, null, jsonb_build_object(
      'item_id', pi.item_id, 'item', it.name, 'rarity', it.rarity, 'defender', d.username));
  end if;
  return jsonb_build_object('raid_id', rid, 'ends_at', ends, 'started_at', now(), 'duration', dur,
    'chance', v_chance, 'item_id', pi.item_id, 'player_item_id', p_piid, 'defender', d.username,
    'defender_id', d.id, 'tutorial', tut, 'revenge', p_revenge, 'phase', 'grab', 'mutation', pi.mutation);
end $$;

-- The owner changed the item before the thief got it out.
create or replace function game._block_raid(p_raid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record; d record; res jsonb;
begin
  select * into r from raids where id = p_raid for update;
  if r.status <> 'active' then return game._raid_result(p_raid); end if;
  select * into d from profiles where id = r.defender_id;
  update raids set status = 'blocked', resolved_at = now(), note = 'The owner locked it away just in time!'
  where id = p_raid;
  update profiles set raid_cooldown_until = now() + interval '15 seconds' where id = r.attacker_id;
  perform game._quest_progress(r.attacker_id, 'raid_players', 1);
  if not d.is_bot then
    update player_stats set raids_defended = raids_defended + 1 where player_id = d.id;
    perform game._xp(d.id, 25, 'defend');
    perform game._check_achievements(d.id);
  end if;
  res := game._raid_result(p_raid);
  perform game._emit('raid_result', r.attacker_id, r.defender_id, res);
  perform game._emit('raid_over', r.defender_id, r.attacker_id, res);
  return res;
end $$;

create or replace function game._fail_raid(p_raid uuid, p_defended boolean, p_note text, p_fine boolean) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record; a record; d record; it record; mprice bigint; v_fine bigint := 0; res jsonb;
begin
  select * into r from raids where id = p_raid for update;
  if r.status <> 'active' then return game._raid_result(p_raid); end if;
  perform 1 from profiles where id in (r.attacker_id, r.defender_id) order by id for update;
  select * into a from profiles where id = r.attacker_id;
  select * into d from profiles where id = r.defender_id;
  select i.*, ra.tier into it from items i join rarities ra on ra.id = i.rarity where i.id = r.item_id;
  select price into mprice from market_state where item_id = r.item_id;
  if p_fine and not r.is_tutorial then
    v_fine := least(floor(a.cash * 0.03), floor(coalesce(mprice, it.base_value) * 0.05))::bigint;
  end if;
  if v_fine > 0 then
    perform game._cash(r.attacker_id, -v_fine, 'raid_fine', jsonb_build_object('raid_id', p_raid));
    perform game._cash(r.defender_id, v_fine, 'raid_bounty', jsonb_build_object('raid_id', p_raid));
  end if;
  update profiles set raid_cooldown_until = now() + case when p_defended then interval '30 seconds' else interval '20 seconds' end
  where id = r.attacker_id;
  update player_stats set steals_failed = steals_failed + 1 where player_id = r.attacker_id;
  if p_defended then
    update player_stats set raids_defended = raids_defended + 1 where player_id = r.defender_id;
    perform game._xp(r.defender_id, 25, 'defend');
  end if;
  update raids set status = 'failed', fine = v_fine, resolved_at = now(),
    defended = defended or p_defended,
    defended_at = case when p_defended then coalesce(defended_at, now()) else defended_at end,
    note = p_note
  where id = p_raid;
  perform game._xp(r.attacker_id, 5, 'raid');
  perform game._quest_progress(r.attacker_id, 'raid_players', 1);
  perform game._check_achievements(r.attacker_id);
  perform game._check_achievements(r.defender_id);
  res := game._raid_result(p_raid) || jsonb_build_object('item', it.name, 'rarity', it.rarity);
  perform game._emit('raid_result', r.attacker_id, r.defender_id, res);
  perform game._emit('raid_over', r.defender_id, r.attacker_id, res);
  return res;
end $$;

-- The thief made it home: the item changes hands.
create or replace function game._complete_steal(p_raid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record; a record; d record; pi record; it record; mprice bigint; res jsonb;
begin
  select * into r from raids where id = p_raid for update;
  if r.status <> 'active' then return game._raid_result(p_raid); end if;
  perform 1 from profiles where id in (r.attacker_id, r.defender_id) order by id for update;
  select * into a from profiles where id = r.attacker_id;
  select * into d from profiles where id = r.defender_id;
  select i.*, ra.tier, ra.xp as rxp into it from items i join rarities ra on ra.id = i.rarity where i.id = r.item_id;
  select price into mprice from market_state where item_id = r.item_id;
  select * into pi from player_items where id = r.player_item_id for update;
  if pi.id is null or pi.owner_id <> r.defender_id or pi.location <> 'display' then
    return game._block_raid(p_raid);
  end if;
  perform game._settle(r.defender_id);
  perform game._transfer(r.player_item_id, r.attacker_id, 'steal', null, interval '5 minutes');
  update bases set shield_until = now() + case when d.is_bot then interval '45 seconds' else interval '10 minutes' end
  where player_id = r.defender_id;
  update profiles set raid_cooldown_until = now() + interval '12 seconds' where id = r.attacker_id;
  update player_stats set steals_won = steals_won + 1, best_item_value = greatest(best_item_value, mprice)
  where player_id = r.attacker_id;
  update player_stats set times_robbed = times_robbed + 1 where player_id = r.defender_id;
  update raids set status = 'success', resolved_at = now() where id = p_raid;
  if r.is_tutorial then
    update profiles set tutorial_flags = tutorial_flags || '{"tutorial_raid": true}'::jsonb where id = r.attacker_id;
  end if;
  perform game._settle(r.attacker_id);
  perform game._autoplace(r.attacker_id, r.player_item_id);
  perform game._xp(r.attacker_id, 40 + it.rxp, 'steal');
  perform game._quest_progress(r.attacker_id, 'raid_players', 1);
  if pi.mutation = 'rainbow' then perform game._achieve(r.attacker_id, 'rainbow'); end if;
  perform game._check_achievements(r.attacker_id);
  res := game._raid_result(p_raid);
  perform game._emit('raid_result', r.attacker_id, r.defender_id,
    res || jsonb_build_object('item', it.name, 'rarity', it.rarity));
  perform game._emit('item_stolen', r.defender_id, r.attacker_id,
    res || jsonb_build_object('item', it.name, 'rarity', it.rarity));
  if it.tier >= 5 then
    perform game._emit('steal', null, r.attacker_id, jsonb_build_object(
      'attacker', a.username, 'defender', d.username, 'item_id', it.id, 'item', it.name, 'rarity', it.rarity,
      'revenge', r.is_revenge, 'mutation', pi.mutation));
  end if;
  return res;
end $$;

-- Grab time is up: roll the security check. Pass → the thief is off and running.
create or replace function game._resolve_grab(p_raid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record; a record; d record; pi record; it record; v_defended boolean; eff numeric; ok boolean; res jsonb;
begin
  select * into r from raids where id = p_raid for update;
  if not found then raise exception 'Raid not found.'; end if;
  if r.status <> 'active' or r.phase <> 'grab' then return game._raid_result(p_raid); end if;
  select * into a from profiles where id = r.attacker_id;
  select * into d from profiles where id = r.defender_id;
  select * into pi from player_items where id = r.player_item_id;
  if pi.id is null or pi.owner_id <> r.defender_id or pi.location <> 'display' then
    return game._block_raid(p_raid);
  end if;
  v_defended := r.defended;
  if d.is_bot and not v_defended and not r.is_tutorial then
    v_defended := random() < coalesce((d.bot->>'defend')::numeric, 0.2);
    if v_defended then update raids set defended = true, defended_at = now() where id = p_raid; end if;
  end if;
  eff := r.chance * case when v_defended then 0.3 else 1 end;
  ok := random() < eff;
  if not ok then
    return game._fail_raid(p_raid, v_defended,
      case when v_defended then 'The alarm went off — ZAPPED!' else 'The security lasers ZAPPED you!' end, true);
  end if;
  if a.is_bot and d.is_bot then
    update raids set phase = 'carry', grabbed_at = now(), carry_until = now(), deliver_after = now() where id = p_raid;
    return game._complete_steal(p_raid);
  end if;
  update raids set phase = 'carry', grabbed_at = now(),
    carry_until = now() + interval '45 seconds',
    deliver_after = now() + case when a.is_bot then make_interval(secs => 9 + random() * 4)
                                 when r.is_tutorial then interval '1 second'
                                 else interval '3 seconds' end
  where id = p_raid;
  select name, rarity into it from items where id = r.item_id;
  res := game._raid_result(p_raid) || jsonb_build_object('item', it.name, 'rarity', it.rarity);
  perform game._emit('raid_grabbed', r.defender_id, r.attacker_id, res);
  return res;
end $$;

-- Resolve whatever is due on a raid (used by the world tick and by sync).
create or replace function game._resolve_raid(p_raid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record; abot boolean;
begin
  select * into r from raids where id = p_raid for update;
  if not found then raise exception 'Raid not found.'; end if;
  if r.status <> 'active' then return game._raid_result(p_raid); end if;
  if r.phase = 'grab' then return game._resolve_grab(p_raid); end if;
  select is_bot into abot from profiles where id = r.attacker_id;
  if abot then
    if now() >= r.deliver_after then return game._complete_steal(p_raid); end if;
    return game._raid_result(p_raid);
  end if;
  if now() > r.carry_until then
    return game._fail_raid(p_raid, false, 'Too slow — the item snapped back to its podium.', false);
  end if;
  return game._raid_result(p_raid);
end $$;

-- The thief finished grabbing.
create or replace function game.act_finish_steal(p_pid uuid, p_raid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record;
begin
  select * into r from raids where id = p_raid;
  if not found or r.attacker_id <> p_pid then raise exception 'Raid not found.'; end if;
  if r.status <> 'active' or r.phase <> 'grab' then return game._raid_result(p_raid); end if;
  if now() < r.ends_at - interval '750 milliseconds' then
    raise exception 'Still grabbing… %s to go!', ceil(extract(epoch from r.ends_at - now()));
  end if;
  return game._resolve_grab(p_raid);
end $$;

-- The thief reached their own base.
create or replace function game.act_deliver_steal(p_pid uuid, p_raid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record;
begin
  select * into r from raids where id = p_raid for update;
  if not found or r.attacker_id <> p_pid then raise exception 'Raid not found.'; end if;
  if r.status <> 'active' then return game._raid_result(p_raid); end if;
  if r.phase <> 'carry' then raise exception 'Grab it first!'; end if;
  if now() < r.deliver_after - interval '500 milliseconds' then
    raise exception 'Keep running — %s!', ceil(extract(epoch from r.deliver_after - now()));
  end if;
  if now() > r.carry_until + interval '3 seconds' then
    return game._fail_raid(p_raid, false, 'Too slow — the item snapped back to its podium.', false);
  end if;
  return game._complete_steal(p_raid);
end $$;

-- The thief backs off, or reports being caught by the owner's security.
create or replace function game.act_abort_steal(p_pid uuid, p_raid uuid, p_reason text) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record; dname text; res jsonb;
begin
  select * into r from raids where id = p_raid for update;
  if not found or r.attacker_id <> p_pid then raise exception 'Raid not found.'; end if;
  if r.status <> 'active' then return game._raid_result(p_raid); end if;
  select username into dname from profiles where id = r.defender_id;
  if p_reason = 'caught' then
    return game._fail_raid(p_raid, true, 'Caught by ' || dname || '''s security!', true);
  end if;
  res := game._fail_raid(p_raid, false, 'You backed off.', false);
  update profiles set raid_cooldown_until = now() + interval '8 seconds' where id = p_pid;
  return res;
end $$;

-- The owner fights back. Tag = you caught the thief in person (grab or carry).
drop function if exists game.act_defend(uuid, uuid);
create or replace function game.act_defend(p_pid uuid, p_raid uuid, p_tag boolean) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record; dname text;
begin
  select * into r from raids where id = p_raid for update;
  if not found or r.defender_id <> p_pid then raise exception 'Raid not found.'; end if;
  if r.status <> 'active' then raise exception 'That raid is already over.'; end if;
  select username into dname from profiles where id = p_pid;
  if p_tag then
    if r.phase = 'carry' and now() > r.carry_until + interval '2 seconds' then
      raise exception 'Too late — they got away!';
    end if;
    update player_stats set thieves_caught = thieves_caught + 1 where player_id = p_pid;
    perform game._achieve(p_pid, 'tagger');
    return game._fail_raid(p_raid, true, 'Tagged by ' || dname || ' — caught red-handed!', true)
           || jsonb_build_object('ok', true, 'tagged', true);
  end if;
  if r.phase = 'carry' then raise exception 'They''re running with it — catch them to get it back!'; end if;
  if now() >= r.ends_at then raise exception 'Too late — they''re already out the door!'; end if;
  if r.defended then return jsonb_build_object('ok', true, 'already', true); end if;
  update raids set defended = true, defended_at = now() where id = p_raid;
  perform game._emit('raid_defended', r.attacker_id, p_pid, jsonb_build_object('raid_id', p_raid, 'defender', dname));
  return jsonb_build_object('ok', true);
end $$;

create or replace function game._tick_raids() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record;
begin
  -- Bots finish on time; humans who closed the tab get resolved fairly a few seconds later.
  for r in
    select rd.id from raids rd join profiles a on a.id = rd.attacker_id
    where rd.status = 'active' and (
      (rd.phase = 'grab' and (rd.ends_at < now() - interval '8 seconds' or (a.is_bot and rd.ends_at <= now())))
      or (rd.phase = 'carry' and ((a.is_bot and rd.deliver_after <= now()) or rd.carry_until < now() - interval '3 seconds')))
    order by rd.ends_at limit 50
  loop
    perform game._resolve_raid(r.id);
  end loop;
end $$;

-- An NPC raider targets an active human (never during the tutorial, never twice in 8 minutes).
create or replace function game._bot_raid_human() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare h record; b record; v_pi record; res jsonb;
begin
  select p.id, p.username into h from profiles p join bases bs on bs.player_id = p.id
  where not p.is_bot and p.level >= 3 and p.tutorial_step >= 99
    and p.last_seen_at > now() - interval '40 seconds'
    and (bs.shield_until is null or bs.shield_until < now())
    and (bs.lock_until is null or bs.lock_until < now())
    and not exists (select 1 from raids r where r.defender_id = p.id and r.status = 'active')
    and not exists (select 1 from raids r join profiles a on a.id = r.attacker_id
                    where r.defender_id = p.id and a.is_bot and r.started_at > now() - interval '8 minutes')
    and exists (select 1 from player_items pi where pi.owner_id = p.id and pi.location = 'display' and not pi.soulbound)
  order by random() limit 1;
  if not found then return; end if;
  select * into b from profiles p
  where p.is_bot and p.bot->>'style' in ('raider', 'whale', 'trader')
    and (p.raid_cooldown_until is null or p.raid_cooldown_until < now())
    and not exists (select 1 from raids r where r.attacker_id = p.id and r.status = 'active')
  order by random() limit 1;
  if not found then return; end if;
  select p.id into v_pi from player_items p join market_state ms on ms.item_id = p.item_id
  where p.owner_id = h.id and p.location = 'display' and not p.soulbound
    and not exists (select 1 from raids r where r.player_item_id = p.id and r.status = 'active')
  order by -ln(1 - random()) / sqrt(ms.price::double precision * game._mut_mult(p.mutation)) limit 1;
  if not found then return; end if;
  res := game.act_start_steal(b.id, v_pi.id, false);
  -- the thief needs time to walk in; the owner always gets at least 8 seconds to react before the grab
  update raids set ends_at = greatest(ends_at, started_at + interval '8 seconds') where id = (res->>'raid_id')::uuid;
  update world set last_bot_raid_at = now() where id = 1;
end $$;

-- Bot-on-bot heists keep the global feed lively.
create or replace function game._bot_heist() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare a record; d record; pi record; res jsonb;
begin
  select * into a from profiles p where p.is_bot and p.bot->>'style' in ('raider', 'whale')
    and (p.raid_cooldown_until is null or p.raid_cooldown_until < now())
    and not exists (select 1 from raids r where r.attacker_id = p.id and r.status = 'active')
  order by random() limit 1;
  if not found then return; end if;
  select p.* into d from profiles p join bases bs on bs.player_id = p.id
  where p.is_bot and p.id <> a.id and (bs.shield_until is null or bs.shield_until < now())
    and (bs.lock_until is null or bs.lock_until < now())
    and not coalesce((p.bot->>'tutorial')::boolean, false)
  order by random() limit 1;
  if not found then return; end if;
  select p.id into pi from player_items p where p.owner_id = d.id and p.location = 'display' and not p.soulbound
    and not exists (select 1 from raids r where r.player_item_id = p.id and r.status = 'active')
  order by random() limit 1;
  if not found then return; end if;
  res := game.act_start_steal(a.id, pi.id, false);
  perform game._resolve_raid((res->>'raid_id')::uuid);
  perform game._arrange_best(a.id);
end $$;

create or replace function game._bot_market(p_bot uuid) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare b record; l record; pi record; mprice numeric; v_price bigint; nlist int;
begin
  select * into b from profiles where id = p_bot;
  -- Buy a fair or cheap listing (humans first).
  if random() < 0.6 then
    select ml.id, ml.price into l
    from market_listings ml join market_state ms on ms.item_id = ml.item_id
    join profiles s on s.id = ml.seller_id
    join player_items x on x.id = ml.player_item_id
    where ml.status = 'active' and ml.seller_id <> p_bot
      and ml.price <= ms.price * game._mut_mult(x.mutation) * 0.95
      and ml.price * 2 <= b.cash and ml.created_at < now() - interval '20 seconds'
    order by s.is_bot, ml.price::numeric / (ms.price * game._mut_mult(x.mutation)), random() limit 1;
    if found then
      begin
        perform game.act_buy_listing(p_bot, l.id);
        perform game._arrange_best(p_bot);
      exception when others then null;
      end;
    end if;
  end if;
  -- Cancel stale listings.
  perform game.act_cancel_listing(p_bot, x.id) from (
    select id from market_listings where seller_id = p_bot and status = 'active'
      and created_at < now() - interval '25 minutes') x;
  -- List a spare item (or occasionally a displayed one) at a markup.
  select count(*) into nlist from market_listings where seller_id = p_bot and status = 'active';
  if nlist < 3 then
    select p.id, p.item_id, p.mutation into pi from player_items p join items i on i.id = p.item_id
    where p.owner_id = p_bot and p.location in ('inventory', 'display') and not p.soulbound
      and i.rarity not in ('secret', 'limited')  -- NPCs keep their trophies on show
      and (p.hot_until is null or p.hot_until < now())
      and not exists (select 1 from raids r where r.player_item_id = p.id and r.status = 'active')
    order by (p.location = 'inventory') desc, random() limit 1;
    if found and (random() < 0.5 or exists (select 1 from player_items where id = pi.id and location = 'inventory')) then
      select price * game._mut_mult(pi.mutation) into mprice from market_state where item_id = pi.item_id;
      v_price := greatest(1, round(mprice * (1.03 + random() * 0.22)))::bigint;
      begin
        perform game.act_list(p_bot, pi.id, v_price);
      exception when others then null;
      end;
    end if;
  end if;
end $$;

-- A bot makes a cash (or item) offer for something an active human is showing off.
create or replace function game._bot_offer_trade() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare h record; b record; want record; give record; v_cash bigint;
begin
  select p.id into h from profiles p
  where not p.is_bot and p.tutorial_step >= 99 and p.last_seen_at > now() - interval '60 seconds'
    and not exists (select 1 from trades t join profiles f on f.id = t.from_id
                    where t.to_id = p.id and f.is_bot and t.status = 'pending')
  order by random() limit 1;
  if not found then return; end if;
  select pi.id, pi.item_id, ms.price * game._mut_mult(pi.mutation) as price into want
  from player_items pi join items i on i.id = pi.item_id join rarities r on r.id = i.rarity
  join market_state ms on ms.item_id = pi.item_id
  where pi.owner_id = h.id and pi.location = 'display' and not pi.soulbound and r.tier >= 2
    and (pi.hot_until is null or pi.hot_until < now())
    and not exists (select 1 from raids rd where rd.player_item_id = pi.id and rd.status = 'active')
  order by random() limit 1;
  if not found then return; end if;
  select * into b from profiles
  where is_bot and bot->>'style' in ('trader', 'collector', 'whale') and cash > want.price * 2
  order by random() limit 1;
  if not found then return; end if;
  -- Sometimes offer an item of similar value, otherwise a cash premium.
  select pi.id, ms.price * game._mut_mult(pi.mutation) as price into give
  from player_items pi join market_state ms on ms.item_id = pi.item_id
  where pi.owner_id = b.id and pi.location in ('inventory', 'display') and not pi.soulbound
    and (pi.hot_until is null or pi.hot_until < now())
    and ms.price * game._mut_mult(pi.mutation) between want.price * 0.9 and want.price * 1.3
    and not exists (select 1 from raids r where r.player_item_id = pi.id and r.status = 'active')
  order by random() limit 1;
  if found and random() < 0.4 then
    perform game.act_trade_propose(b.id, jsonb_build_object(
      'to', h.id, 'offer_items', jsonb_build_array(give.id), 'request_items', jsonb_build_array(want.id),
      'message', 'Straight swap? Mine''s worth a little more 😉'));
  else
    v_cash := round(want.price * (1.05 + random() * 0.2))::bigint;
    perform game.act_trade_propose(b.id, jsonb_build_object(
      'to', h.id, 'offer_cash', v_cash, 'request_items', jsonb_build_array(want.id),
      'message', 'I''ll pay over market for that. Deal?'));
  end if;
end $$;

create or replace function game._tick_bots(p_dt double precision) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare b record; f double precision := least(1.0, p_dt / 10.0); t record;
begin
  for b in select id, bot from profiles where is_bot loop
    perform game._settle(b.id);
    update profiles set cash = least(cash, 400000000) where id = b.id;
    begin
      perform game._bot_restock(b.id);
      if random() < 0.10 * f then perform game._bot_open_drop(b.id); end if;
      if b.bot->>'style' in ('trader', 'collector', 'whale') and random() < 0.15 * f then
        perform game._bot_market(b.id);
      end if;
      -- NPCs flip their door lasers on now and then (never the tutorial base)
      if random() < 0.04 * f and not coalesce((b.bot->>'tutorial')::boolean, false) then
        update bases set lock_until = now() + make_interval(secs => 30 + 10 * security_level)
        where player_id = b.id and (lock_until is null or lock_until < now() - interval '10 seconds');
      end if;
    exception when others then
      raise warning 'bot % action failed: %', b.id, sqlerrm;
    end;
  end loop;
  -- bots answer offers after a short "think"
  for t in
    select tr.id from trades tr join profiles p on p.id = tr.to_id
    where tr.status = 'pending' and p.is_bot and tr.created_at < now() - interval '3 seconds'
    order by tr.created_at limit 10
  loop
    begin
      perform game._bot_answer_trade(t.id);
    exception when others then
      raise warning 'bot trade failed: %', sqlerrm;
    end;
  end loop;
  begin
    perform game._bot_belt();
  exception when others then
    raise warning 'bot belt failed: %', sqlerrm;
  end;
  begin
    if random() < 0.35 then perform game._bot_raid_human(); end if;
    if random() < 0.07 * f then perform game._bot_heist(); end if;
    if random() < 0.05 * f then perform game._bot_offer_trade(); end if;
  exception when others then
    raise warning 'bot social action failed: %', sqlerrm;
  end;
end $$;

create or replace function game.world_tick(p_force boolean default false) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare w record; dt double precision;
begin
  select * into w from world where id = 1 for update;
  if not p_force and w.last_tick_at is not null and w.last_tick_at > now() - interval '10 seconds' then
    return jsonb_build_object('skipped', true);
  end if;
  dt := coalesce(extract(epoch from now() - w.last_tick_at), 10);
  dt := least(greatest(dt, 1), 3600);
  update world set last_tick_at = now(), tick_count = tick_count + 1 where id = 1;
  if w.seeded_at is null then
    perform game._seed_bots();
    perform game._seed_history();
    update world set seeded_at = now(), next_event_at = now() + interval '90 seconds', last_history_at = null where id = 1;
  end if;
  perform game._tick_events();
  perform game._tick_market(dt);
  perform game._tick_history();
  perform game._tick_raids();
  perform game._belt_fill();
  perform game._tick_bots(dt);
  if w.tick_count % 30 = 0 then perform game._tick_cleanup(); end if;
  return jsonb_build_object('ok', true, 'dt', dt);
end $$;

-- ---------------------------------------------------------------------------
-- Tutorial (client and server agree):
--  1 welcome · 2 your base · 3 collect · 4 the Tech Belt · 5 mutations · 6 lock
--  7 drops · 8 another base · 9 grab · 10 carry it home · 11 market · 12 done (99)
-- ---------------------------------------------------------------------------
create or replace function game.act_tutorial(p_pid uuid, p_step int) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare p record; basic bigint; granted bigint := 0;
begin
  select * into p from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  if p.tutorial_step >= 99 then return jsonb_build_object('ok', true, 'step', 99); end if;
  if p_step is null or p_step <= p.tutorial_step then return jsonb_build_object('ok', true, 'step', p.tutorial_step); end if;
  if p_step >= 4 and not coalesce((p.tutorial_flags->>'belt_cash')::boolean, false)
     and not exists (select 1 from player_stats where player_id = p_pid and belt_buys > 0) then
    perform game._cash(p_pid, 600, 'tutorial', jsonb_build_object('step', 4));
    granted := granted + 600;
    update profiles set tutorial_flags = tutorial_flags || '{"belt_cash": true}'::jsonb where id = p_pid;
  end if;
  select price into basic from drop_types where id = 'basic';
  if p_step >= 7 and not coalesce((p.tutorial_flags->>'first_drop_cash')::boolean, false)
     and not exists (select 1 from player_stats where player_id = p_pid and drops_opened > 0) then
    perform game._cash(p_pid, basic, 'tutorial', jsonb_build_object('step', 7));
    granted := granted + basic;
    update profiles set tutorial_flags = tutorial_flags || '{"first_drop_cash": true}'::jsonb where id = p_pid;
  end if;
  if p_step >= 12 then
    if not coalesce((p.tutorial_flags->>'done')::boolean, false) then
      perform game._add_tokens(p_pid, 'basic', 1);
      update profiles set tutorial_flags = tutorial_flags || '{"done": true}'::jsonb where id = p_pid;
    end if;
    update profiles set tutorial_step = 99 where id = p_pid;
    return jsonb_build_object('ok', true, 'step', 99, 'cash', granted, 'tokens', jsonb_build_object('basic', 1));
  end if;
  update profiles set tutorial_step = p_step where id = p_pid;
  return jsonb_build_object('ok', true, 'step', p_step, 'cash', granted);
end $$;

-- ---------------------------------------------------------------------------
-- Read models
-- ---------------------------------------------------------------------------
create or replace function game._plot_json(p_pid uuid, p_viewer uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object(
    'id', p.id, 'username', p.username, 'is_bot', p.is_bot, 'level', p.level, 'prestige', p.prestige,
    'title', game.level_title(p.level), 'bio', coalesce(p.bot->>'bio', ''),
    'base_level', b.base_level, 'slots', game._slots(p.id), 'security_level', b.security_level,
    'vault_level', b.vault_level, 'cosmetics', p.cosmetics, 'base_value', game._base_value(p.id),
    'shield_until', b.shield_until, 'lock_until', b.lock_until, 'protected', (not p.is_bot and p.level < 3),
    'online', p.is_bot or p.last_seen_at > now() - interval '60 seconds',
    'vault_used', (select count(*) from game.player_items v where v.owner_id = p.id and v.location = 'vault'),
    'items', (select coalesce(jsonb_agg(jsonb_build_object('id', pi.id, 'item_id', pi.item_id, 'slot', pi.slot,
                'serial', pi.serial, 'soulbound', pi.soulbound, 'hot_until', pi.hot_until, 'mutation', pi.mutation,
                'under_raid', rd.id is not null,
                'raid', case when rd.id is null then null else jsonb_build_object(
                          'id', rd.id, 'phase', rd.phase, 'attacker_id', rd.attacker_id, 'attacker', ra.username,
                          'started_at', rd.started_at, 'ends_at', rd.ends_at, 'grabbed_at', rd.grabbed_at,
                          'deliver_after', rd.deliver_after, 'carry_until', rd.carry_until) end)
                order by pi.slot), '[]'::jsonb)
              from game.player_items pi
              left join game.raids rd on rd.player_item_id = pi.id and rd.status = 'active'
              left join game.profiles ra on ra.id = rd.attacker_id
              where pi.owner_id = p.id and pi.location = 'display'))
  from game.profiles p join game.bases b on b.player_id = p.id
  where p.id = p_pid
$$;

create or replace function game.q_sync(p_pid uuid, p_since bigint, p_items_rev bigint) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare p record; b record; s record; ev record; w record; rate double precision; v_r record;
        v_items jsonb; v_feed jsonb; v_claimable int; v_pending bigint;
begin
  perform 1 from profiles where id = p_pid;
  if not found then
    return jsonb_build_object('needs_join', true, 'server_time', game._now_ms());
  end if;
  -- Resolve raids that are due and involve me, so results appear instantly.
  for v_r in
    select rd.id from raids rd join profiles a on a.id = rd.attacker_id
    where rd.status = 'active' and (
      (rd.defender_id = p_pid and a.is_bot and (
         (rd.phase = 'grab' and rd.ends_at <= now()) or (rd.phase = 'carry' and rd.deliver_after <= now())))
      or (rd.attacker_id = p_pid and (
         (rd.phase = 'grab' and rd.ends_at < now() - interval '8 seconds')
         or (rd.phase = 'carry' and rd.carry_until < now() - interval '3 seconds'))))
  loop
    perform game._resolve_raid(v_r.id);
  end loop;
  update profiles set last_seen_at = now() where id = p_pid;
  select * into p from profiles where id = p_pid;
  select * into b from bases where player_id = p_pid;
  select * into s from player_stats where player_id = p_pid;
  select * into ev from game._current_event();
  select * into w from world where id = 1;
  rate := game._income_rate(p_pid);
  select coalesce(sum(game._pending(pi)), 0) into v_pending
  from player_items pi where pi.owner_id = p_pid and pi.location = 'display';

  if p_items_rev is distinct from p.items_rev then
    select coalesce(jsonb_agg(game._item_json(pi) order by pi.acquired_at, pi.id), '[]'::jsonb) into v_items
    from player_items pi where pi.owner_id = p_pid;
  end if;

  if p_since is null or p_since < 0 then
    select coalesce(jsonb_agg(to_jsonb(x) order by x.id), '[]'::jsonb) into v_feed from (
      select id, kind, target_id, actor_id, payload, created_at from server_events
      where target_id is null or target_id = p_pid order by id desc limit 30) x;
  else
    select coalesce(jsonb_agg(to_jsonb(x) order by x.id), '[]'::jsonb) into v_feed from (
      select id, kind, target_id, actor_id, payload, created_at from server_events
      where id > p_since and (target_id is null or target_id = p_pid) order by id limit 80) x;
  end if;

  select count(*) into v_claimable from jsonb_array_elements(game.act_quests(p_pid)) q
  where (q->>'progress')::bigint >= (q->>'target')::bigint and not (q->>'claimed')::boolean;

  return jsonb_build_object(
    'server_time', game._now_ms(),
    'me', jsonb_build_object(
      'id', p.id, 'username', p.username, 'cash', p.cash, 'income', round(rate::numeric, 2),
      'pending', v_pending, 'base_value', game._base_value(p_pid),
      'xp', p.xp, 'level', p.level, 'title', game.level_title(p.level),
      'xp_level', game.xp_for_level(p.level), 'xp_next', game.xp_for_level(p.level + 1),
      'prestige', p.prestige, 'income_bonus', 0.05 * p.prestige, 'luck', game._luck(p_pid),
      'focus', p.collection_focus, 'drop_tokens', p.drop_tokens, 'secret_keys', p.secret_keys,
      'tutorial_step', p.tutorial_step, 'tutorial_flags', p.tutorial_flags, 'cosmetics', p.cosmetics,
      'owned_cosmetics', (select coalesce(jsonb_agg(cosmetic_id), '[]'::jsonb) from player_cosmetics where player_id = p_pid),
      'raid_cooldown_until', p.raid_cooldown_until, 'items_rev', p.items_rev,
      'base_level', b.base_level, 'slots', game._slots(p_pid), 'security_level', b.security_level,
      'vault_level', b.vault_level, 'vault_capacity', game._vault_capacity(p_pid), 'shield_until', b.shield_until,
      'lock_until', b.lock_until, 'lock_seconds', 30 + 10 * b.security_level,
      'stats', to_jsonb(s) - 'player_id',
      'daily', game._daily_status(p_pid),
      'collection_count', (select count(*) from player_collection where player_id = p_pid),
      'created_at', p.created_at),
    'items', v_items,
    'listings', (select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'player_item_id', l.player_item_id,
                   'item_id', l.item_id, 'price', l.price, 'created_at', l.created_at) order by l.created_at desc), '[]'::jsonb)
                 from market_listings l where l.seller_id = p_pid and l.status = 'active'),
    'incoming_raids', (select coalesce(jsonb_agg(jsonb_build_object('id', r.id, 'attacker', a.username,
                   'attacker_id', a.id, 'attacker_bot', a.is_bot, 'item_id', r.item_id, 'player_item_id', r.player_item_id,
                   'started_at', r.started_at, 'ends_at', r.ends_at, 'defended', r.defended, 'revenge', r.is_revenge,
                   'phase', r.phase, 'grabbed_at', r.grabbed_at, 'carry_until', r.carry_until,
                   'deliver_after', r.deliver_after)), '[]'::jsonb)
                 from raids r join profiles a on a.id = r.attacker_id
                 where r.defender_id = p_pid and r.status = 'active'),
    'outgoing_raid', (select jsonb_build_object('id', r.id, 'defender', d.username, 'defender_id', d.id,
                   'item_id', r.item_id, 'player_item_id', r.player_item_id, 'started_at', r.started_at,
                   'ends_at', r.ends_at, 'defended', r.defended, 'chance', r.chance, 'revenge', r.is_revenge,
                   'tutorial', r.is_tutorial, 'phase', r.phase, 'grabbed_at', r.grabbed_at,
                   'carry_until', r.carry_until, 'deliver_after', r.deliver_after)
                 from raids r join profiles d on d.id = r.defender_id
                 where r.attacker_id = p_pid and r.status = 'active' limit 1),
    'event', case when ev.type_id is null then null else jsonb_build_object(
                   'type', ev.type_id, 'title', ev.title, 'icon', ev.icon, 'description', ev.description,
                   'category', ev.category, 'price_mult', ev.price_mult, 'income_mult', ev.income_mult,
                   'luck_mult', ev.luck_mult, 'starts_at', ev.starts_at, 'ends_at', ev.ends_at) end,
    'next_event_at', w.next_event_at,
    'feed', v_feed,
    'trades', jsonb_build_object(
      'incoming', (select count(*) from trades where to_id = p_pid and status = 'pending'),
      'outgoing', (select count(*) from trades where from_id = p_pid and status = 'pending')),
    'quests_claimable', v_claimable,
    'revenge', (select count(*) from raids where defender_id = p_pid and status = 'success'
                and not revenge_used and resolved_at > now() - interval '24 hours'),
    'online', (select count(*) from profiles where not is_bot and last_seen_at > now() - interval '60 seconds')
  );
end $$;

create or replace function game.q_catalog() returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object(
    'items', (select jsonb_agg(jsonb_build_object('id', i.id, 'name', i.name, 'brand', i.brand, 'kind', i.kind,
                'category', i.category, 'rarity', i.rarity, 'base_value', i.base_value, 'base_income', i.base_income,
                'max_supply', i.max_supply, 'tradeable', i.tradeable, 'droppable', i.droppable, 'event_only', i.event_only,
                'color', i.color, 'accent', i.accent, 'flavor', i.flavor) order by i.sort) from game.items i),
    'rarities', (select jsonb_agg(to_jsonb(r) order by r.tier) from game.rarities r),
    'mutations', (select jsonb_agg(to_jsonb(m) order by m.sort) from game.mutations m),
    'drops', (select jsonb_agg(to_jsonb(d) order by d.sort) from game.drop_types d),
    'upgrades', (select jsonb_agg(to_jsonb(u) order by u.kind, u.level) from game.upgrade_levels u),
    'quests', (select jsonb_agg(to_jsonb(q) order by q.sort) from game.quests q),
    'achievements', (select jsonb_agg(to_jsonb(a) order by a.sort) from game.achievements a),
    'cosmetics', (select jsonb_agg(to_jsonb(c) order by c.sort) from game.cosmetics c),
    'event_types', (select jsonb_agg(to_jsonb(e)) from game.event_types e),
    'level_titles', (select jsonb_agg(to_jsonb(l) order by l.level) from game.level_titles l),
    'rules', jsonb_build_object('quick_sell_rate', 0.6, 'market_fee', 0.05, 'list_min', 0.25, 'list_max', 5,
                                'prestige_level', 25, 'focus_level', 5, 'protection_level', 3,
                                'shield_minutes', 10, 'hot_minutes', 5, 'offline_cap_hours', 12,
                                'belt_seconds', 36, 'belt_markup', 1.05, 'carry_seconds', 45,
                                'lock_base_seconds', 30, 'lock_per_security', 10, 'lock_recharge', 10))
$$;

create or replace function game.q_listings(p_viewer uuid, p_filter jsonb) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce(jsonb_agg(x.j order by x.ratio, x.created_at), '[]'::jsonb) from (
    select jsonb_build_object('id', l.id, 'item_id', l.item_id, 'price', l.price,
             'market', round(ms.price * coalesce(m.mult, 1)), 'mutation', pi.mutation,
             'seller', p.username, 'seller_id', p.id, 'seller_bot', p.is_bot, 'serial', pi.serial,
             'created_at', l.created_at, 'mine', l.seller_id = p_viewer) as j,
           l.price::numeric / (ms.price * coalesce(m.mult, 1)) as ratio, l.created_at
    from game.market_listings l
    join game.market_state ms on ms.item_id = l.item_id
    join game.profiles p on p.id = l.seller_id
    join game.player_items pi on pi.id = l.player_item_id
    left join game.mutations m on m.id = pi.mutation
    join game.items i on i.id = l.item_id
    where l.status = 'active'
      and (p_filter->>'category' is null or i.category = p_filter->>'category')
      and (p_filter->>'rarity' is null or i.rarity = p_filter->>'rarity')
      and (not coalesce((p_filter->>'mine')::boolean, false) or l.seller_id = p_viewer)
    order by l.price::numeric / (ms.price * coalesce(m.mult, 1)), l.created_at
    limit 80) x
$$;

create or replace function game.q_market_item(p_viewer uuid, p_item text, p_range text) returns jsonb
language plpgsql stable set search_path = pg_catalog, game, pg_temp as $$
declare since timestamptz; hist jsonb; ms record; h24 bigint;
begin
  select * into ms from market_state where item_id = p_item;
  if not found then raise exception 'Unknown item.'; end if;
  since := now() - case p_range when '1H' then interval '1 hour' when '24H' then interval '24 hours'
                                 when '7D' then interval '7 days' when '30D' then interval '30 days'
                                 else interval '100 years' end;
  select coalesce(jsonb_agg(jsonb_build_array((extract(epoch from ts) * 1000)::bigint, price, demand, supply, listed, volume)
           order by ts), '[]'::jsonb) into hist
  from market_history
  where item_id = p_item and ts >= since
    and (p_range in ('1H', '24H')
         or (p_range = '7D' and (ts > now() - interval '48 hours' and date_part('minute', ts at time zone 'utc')::int % 30 = 0
                                 or date_part('minute', ts at time zone 'utc') = 0))
         or (p_range = '30D' and date_part('minute', ts at time zone 'utc') = 0 and date_part('hour', ts at time zone 'utc')::int % 4 = 0)
         or (p_range not in ('1H', '24H', '7D', '30D') and date_part('minute', ts at time zone 'utc') = 0
             and date_part('hour', ts at time zone 'utc') = 0));
  select price into h24 from market_history where item_id = p_item and ts <= now() - interval '24 hours' order by ts desc limit 1;
  return jsonb_build_object(
    'item_id', p_item, 'range', p_range, 'price', ms.price, 'demand', round(ms.demand, 1),
    'supply', ms.supply, 'listed', ms.listed, 'volume_24h', ms.volume_24h,
    'change_24h', case when h24 is null or h24 = 0 then 0 else round(((ms.price - h24)::numeric / h24) * 100, 1) end,
    'owners', (select count(distinct owner_id) from player_items where item_id = p_item),
    'minted', (select minted from limited_item_supply where item_id = p_item),
    'mine', (select count(*) from player_items where item_id = p_item and owner_id = p_viewer),
    'history', hist,
    'sales', (select coalesce(jsonb_agg(jsonb_build_object('price', s.price, 'kind', s.kind, 'at', s.created_at,
                'buyer', b.username, 'seller', sl.username) order by s.created_at desc), '[]'::jsonb)
              from (select * from market_sales where item_id = p_item order by created_at desc limit 12) s
              left join profiles b on b.id = s.buyer_id left join profiles sl on sl.id = s.seller_id),
    'listings', (select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'price', l.price, 'seller', p.username,
                   'seller_id', p.id, 'seller_bot', p.is_bot, 'serial', pi.serial, 'created_at', l.created_at,
                   'mutation', pi.mutation, 'market', round(ms.price * game._mut_mult(pi.mutation)),
                   'mine', l.seller_id = p_viewer) order by l.price, l.created_at), '[]'::jsonb)
                 from (select * from market_listings where item_id = p_item and status = 'active' order by price limit 30) l
                 join profiles p on p.id = l.seller_id join player_items pi on pi.id = l.player_item_id));
end $$;

create or replace function game.q_trades(p_pid uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', t.id, 'from_id', t.from_id, 'from', f.username, 'from_bot', f.is_bot,
    'to_id', t.to_id, 'to', tt.username, 'to_bot', tt.is_bot,
    'offer_cash', t.offer_cash, 'request_cash', t.request_cash, 'message', t.message,
    'status', t.status, 'note', t.note, 'created_at', t.created_at, 'resolved_at', t.resolved_at,
    'incoming', t.to_id = p_pid,
    'offer_items', (select coalesce(jsonb_agg(jsonb_build_object('id', pi.id, 'item_id', pi.item_id, 'serial', pi.serial,
                      'mutation', pi.mutation, 'available', pi.owner_id = t.from_id)), '[]'::jsonb)
                    from game.player_items pi where pi.id = any(t.offer_items)),
    'request_items', (select coalesce(jsonb_agg(jsonb_build_object('id', pi.id, 'item_id', pi.item_id, 'serial', pi.serial,
                      'mutation', pi.mutation, 'available', pi.owner_id = t.to_id)), '[]'::jsonb)
                    from game.player_items pi where pi.id = any(t.request_items)),
    'offer_value', game._value_of(t.offer_items) + t.offer_cash,
    'request_value', game._value_of(t.request_items) + t.request_cash,
    'snapshot', t.snapshot) order by (t.status = 'pending') desc, t.created_at desc), '[]'::jsonb)
  from (select * from game.trades where (from_id = p_pid or to_id = p_pid)
          and (status = 'pending' or resolved_at > now() - interval '3 days')
        order by created_at desc limit 40) t
  join game.profiles f on f.id = t.from_id
  join game.profiles tt on tt.id = t.to_id
$$;

create or replace function game.q_raid_targets(p_pid uuid, p_sort text) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  with me as (select level from game.profiles where id = p_pid),
  t as (
    select p.id, p.username, p.is_bot, p.level, p.prestige, b.security_level, b.shield_until, b.lock_until,
           (not p.is_bot and p.level < 3) as protected,
           p.is_bot or p.last_seen_at > now() - interval '60 seconds' as online,
           game._base_value(p.id) as base_value,
           (select count(*) from game.player_items x where x.owner_id = p.id and x.location = 'display') as shown,
           (select jsonb_build_object('item_id', pi.item_id, 'price', round(ms.price * coalesce(m.mult, 1)),
                                      'serial', pi.serial, 'mutation', pi.mutation)
              from game.player_items pi join game.market_state ms on ms.item_id = pi.item_id
              left join game.mutations m on m.id = pi.mutation
              where pi.owner_id = p.id and pi.location = 'display' and not pi.soulbound
              order by ms.price * coalesce(m.mult, 1) desc limit 1) as top_item,
           game._revenge_row(p_pid, p.id) is not null as revenge,
           (select name from game.upgrade_levels ul where ul.kind = 'security' and ul.level = b.security_level) as security_name
    from game.profiles p join game.bases b on b.player_id = p.id
    where p.id <> p_pid
  )
  select coalesce(jsonb_agg(to_jsonb(t) order by
      t.revenge desc,
      case when p_sort = 'value' then -t.base_value
           when p_sort = 'security' then t.security_level
           else abs(t.level - (select level from me)) * 1000 - t.base_value / 1000000.0 end), '[]'::jsonb)
  from (select * from t order by revenge desc, base_value desc limit 60) t
$$;

-- ---------------------------------------------------------------------------
-- Public RPCs
-- ---------------------------------------------------------------------------
create or replace function public.stt_belt(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid(); nxt timestamptz;
begin
  perform game._maybe_tick();
  select belt_next_at into nxt from game.world where id = 1;
  if (nxt is null or nxt < now() + interval '12 seconds') and pg_try_advisory_xact_lock(727275) then
    perform game._belt_fill();
  end if;
  return game.q_belt(uid);
end $$;

create or replace function public.stt_buy_belt(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_buy_belt(uid, game._p_bigint(p, 'belt_id')); end $$;

create or replace function public.stt_collect(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin
  return game.act_collect(uid, case when p->>'player_item_id' is null then null
                                    else game._p_uuid(p, 'player_item_id') end);
end $$;

create or replace function public.stt_lock_base(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_lock_base(uid); end $$;

create or replace function public.stt_deliver_steal(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_deliver_steal(uid, game._p_uuid(p, 'raid_id')); end $$;

create or replace function public.stt_abort_steal(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin
  perform game._maybe_tick();
  return game.act_abort_steal(uid, game._p_uuid(p, 'raid_id'), coalesce(p->>'reason', 'abort'));
end $$;

create or replace function public.stt_defend(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin
  return game.act_defend(uid, game._p_uuid(p, 'raid_id'), coalesce((p->>'tag')::boolean, false));
end $$;

-- ---------------------------------------------------------------------------
-- Privileges: only signed-in players may call stt_*; nobody may call game.*
-- ---------------------------------------------------------------------------
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'stt\\_%'
  loop
    execute format('revoke all on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated, service_role', f.sig);
  end loop;
  for f in
    select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'game'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;
`,m1=`-- ============================================================================
-- STEAL THE TECH — local shim
--
-- Recreates the tiny slice of Supabase that the game schema relies on, so the
-- exact same migrations can run on a plain Postgres (tests) or on PGlite in the
-- browser (offline mode).
--
-- NEVER run this file on a real Supabase project: Supabase already provides
-- all of this (auth schema, auth.uid(), the anon/authenticated roles).
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key,
  email text,
  created_at timestamptz not null default now()
);

-- Same contract as Supabase's auth.uid(): read the JWT "sub" claim that the
-- API layer places in the request settings.
create or replace function auth.uid() returns uuid
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
`,u_=Object.assign({"../../../supabase/migrations/20260922000001_schema.sql":s1,"../../../supabase/migrations/20260922000002_catalog.sql":r1,"../../../supabase/migrations/20260922000003_engine.sql":o1,"../../../supabase/migrations/20260922000004_world.sql":c1,"../../../supabase/migrations/20260922000005_api.sql":d1,"../../../supabase/migrations/20260923000006_belt.sql":u1}),f1="idb://steal-the-tech",Pu="stt.offline.uid";function p1(a){let i=3735928559^a.length,s=1103547991^a.length;for(let r=0;r<a.length;r++){const m=a.charCodeAt(r);i=Math.imul(i^m,2654435761),s=Math.imul(s^m,1597334677)}return i=Math.imul(i^i>>>16,2246822507)^Math.imul(s^s>>>13,3266489909),s=Math.imul(s^s>>>16,2246822507)^Math.imul(i^i>>>13,3266489909),(4294967296*(2097151&s)+(i>>>0)).toString(36)}function h1(){if(crypto.randomUUID)return crypto.randomUUID();const a=crypto.getRandomValues(new Uint8Array(16));a[6]=a[6]&15|64,a[8]=a[8]&63|128;const i=[...a].map(s=>s.toString(16).padStart(2,"0")).join("");return`${i.slice(0,8)}-${i.slice(8,12)}-${i.slice(12,16)}-${i.slice(16,20)}-${i.slice(20)}`}function _1(a){try{return localStorage.getItem(a)}catch{return null}}function m_(a,i){try{i===null?localStorage.removeItem(a):localStorage.setItem(a,i)}catch{}}class g1{constructor(i){this.pgliteUrl=i,this.mode="offline",this.label="Offline practice (this device)",this.worker=null,this.seq=0,this.pending=new Map,this.uid=_1(Pu)}send(i){const s=++this.seq;return new Promise((r,m)=>{this.pending.set(s,{resolve:r,reject:m}),this.worker.postMessage({...i,id:s})})}async init(i){this.progress=i,this.worker=new Worker(new URL(""+new URL("pglite.worker-a8GxeoxG.js",import.meta.url).href,import.meta.url),{type:"module"}),this.worker.onmessage=m=>{const u=m.data;if(u.type==="progress"){this.progress?.(u.msg,u.pct);return}const f=this.pending.get(u.id);f&&(this.pending.delete(u.id),u.ok?f.resolve(u.data):f.reject(new Error(u.error)))},this.worker.onerror=m=>{for(const u of this.pending.values())u.reject(new Error(m.message||"Engine crashed"));this.pending.clear()};const s=[{name:"local runtime",sql:m1},...Object.keys(u_).sort().map(m=>({name:m.split("/").pop().replace(/^\d+_/,"").replace(".sql",""),sql:u_[m]}))],r=p1(s.map(m=>m.sql).join(`
`));await this.send({type:"init",url:this.pgliteUrl,files:s,hash:r,dataDir:f1})}userId(){return this.uid}isGuest(){return!0}email(){return null}async signInGuest(){this.uid||(this.uid=h1(),m_(Pu,this.uid))}async signOut(){}rpc(i,s={}){return this.uid?this.send({type:"rpc",uid:this.uid,fn:i,p:s}):Promise.reject(new Error("You need to be signed in to play."))}async reset(){try{await this.send({type:"close"})}catch{}this.worker?.terminate(),this.worker=null,m_(Pu,null);const i=new Set(["/pglite/steal-the-tech","steal-the-tech"]);try{const s=await indexedDB.databases?.()||[];for(const r of s)r.name&&r.name.includes("steal-the-tech")&&i.add(r.name)}catch{}await Promise.all([...i].map(s=>new Promise(r=>{const m=indexedDB.deleteDatabase(s);m.onsuccess=m.onerror=m.onblocked=()=>r()})))}}const b1="modulepreload",y1=function(a,i){return new URL(a,i).href},f_={},v1=function(i,s,r){let m=Promise.resolve();if(s&&s.length>0){let b=function(x){return Promise.all(x.map(y=>Promise.resolve(y).then(v=>({status:"fulfilled",value:v}),v=>({status:"rejected",reason:v}))))};const f=document.getElementsByTagName("link"),_=document.querySelector("meta[property=csp-nonce]"),h=_?.nonce||_?.getAttribute("nonce");m=b(s.map(x=>{if(x=y1(x,r),x in f_)return;f_[x]=!0;const y=x.endsWith(".css"),v=y?'[rel="stylesheet"]':"";if(r)for(let A=f.length-1;A>=0;A--){const z=f[A];if(z.href===x&&(!y||z.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${x}"]${v}`))return;const w=document.createElement("link");if(w.rel=y?"stylesheet":b1,y||(w.as="script"),w.crossOrigin="",w.href=x,h&&w.setAttribute("nonce",h),document.head.appendChild(w),y)return new Promise((A,z)=>{w.addEventListener("load",A),w.addEventListener("error",()=>z(new Error(`Unable to preload CSS for ${x}`)))})}))}function u(f){const _=new Event("vite:preloadError",{cancelable:!0});if(_.payload=f,window.dispatchEvent(_),!_.defaultPrevented)throw f}return m.then(f=>{for(const _ of f||[])_.status==="rejected"&&u(_.reason);return i().catch(u)})};class w1{constructor(i,s){this.url=i,this.anonKey=s,this.mode="online",this.label="Online",this.uid=null,this.guest=!0,this.mail=null,this.feed=null,this.world=null,this.pushSubs=new Set,this.peerMap=new Map,this.lastSent=0,this.presence={start:r=>{this.world||!this.uid||(this.world=this.sb.channel("stt-world",{config:{broadcast:{self:!1}}}),this.world.on("broadcast",{event:"pos"},({payload:m})=>{const u=m;!u?.id||u.id===this.uid||this.peerMap.set(u.id,{...u,t:Date.now()})}).on("broadcast",{event:"bye"},({payload:m})=>{this.peerMap.delete(m.id)}).subscribe(m=>{m==="SUBSCRIBED"&&this.presence.update(r)}))},update:r=>{if(!this.world)return;const m=Date.now();m-this.lastSent<180||(this.lastSent=m,this.world.send({type:"broadcast",event:"pos",payload:{...r,t:m}}))},peers:()=>{const r=Date.now();for(const[m,u]of this.peerMap)r-u.t>8e3&&this.peerMap.delete(m);return[...this.peerMap.values()]},stop:()=>{this.world&&(this.world.send({type:"broadcast",event:"bye",payload:{id:this.uid}}),this.sb.removeChannel(this.world),this.world=null,this.peerMap.clear())}}}async init(i){i?.("Connecting to the Tech City servers…",20);const{createClient:s}=await v1(async()=>{const{createClient:m}=await import("./index-Chk-qjf_.js");return{createClient:m}},[],import.meta.url);this.sb=s(this.url,this.anonKey,{auth:{persistSession:!0,autoRefreshToken:!0,storageKey:"stt.supabase.auth"},realtime:{params:{eventsPerSecond:20}}});const{data:r}=await this.sb.auth.getSession();this.applySession(r.session),this.sb.auth.onAuthStateChange((m,u)=>{const f=this.uid;this.applySession(u),f!==this.uid&&this.subscribeFeed()}),this.subscribeFeed(),i?.("Connected",90)}applySession(i){this.uid=i?.user?.id??null,this.guest=!!i?.user?.is_anonymous,this.mail=i?.user?.email??null}subscribeFeed(){this.feed&&this.sb.removeChannel(this.feed),this.feed=null,this.uid&&(this.feed=this.sb.channel("stt-feed-"+this.uid).on("postgres_changes",{event:"INSERT",schema:"game",table:"server_events"},i=>{const s=i.new||{};for(const r of this.pushSubs)r(s)}).subscribe())}userId(){return this.uid}isGuest(){return this.guest}email(){return this.mail}async signInGuest(){if(this.uid)return;const{error:i}=await this.sb.auth.signInAnonymously();if(i)throw new Error(/anonymous/i.test(i.message)?"Guest play is disabled on this server — sign in with email instead.":i.message)}async signInEmail(i,s,r){const{error:m}=r?await this.sb.auth.signUp({email:i,password:s}):await this.sb.auth.signInWithPassword({email:i,password:s});if(m)throw new Error(m.message);const{data:u}=await this.sb.auth.getSession();if(this.applySession(u.session),!this.uid)throw new Error("Check your inbox to confirm your email, then sign in.")}async upgradeGuest(i,s){const{error:r}=await this.sb.auth.updateUser({email:i,password:s});if(r)throw new Error(r.message)}async signOut(){this.presence.stop(),await this.sb.auth.signOut(),this.uid=null}async rpc(i,s={}){const{data:r,error:m}=await this.sb.rpc(i,{p:s});if(m)throw new Error(m.message);return r}onPush(i){return this.pushSubs.add(i),()=>this.pushSubs.delete(i)}}const x1="0.5.8";function J_(){const a=window.STT_CONFIG||{};return{supabaseUrl:(a.supabaseUrl||void 0||"").trim(),supabaseAnonKey:(a.supabaseAnonKey||void 0||"").trim(),pgliteUrl:(a.pgliteUrl||`https://cdn.jsdelivr.net/npm/@electric-sql/pglite@${x1}/dist/index.js`).trim()}}function F_(){const a=J_();return!!(a.supabaseUrl&&a.supabaseAnonKey)}function j1(a){const i=J_();if(a==="online"){if(!F_())throw new Error("Online servers are not configured.");return new w1(i.supabaseUrl,i.supabaseAnonKey)}return new g1(i.pgliteUrl)}const et={x0:-60,x1:60,z:0,width:3.4,height:.32},It={minX:-114,maxX:114,minZ:-44,maxZ:44},bt=20,Rt=24,eg=6,p_=[0,22,-22,44,-44],pi=[...p_.map(a=>({cx:a,side:1})),...p_.map(a=>({cx:a,side:-1}))].map((a,i)=>({...a,index:i}));function Ze(a,i,s){return{x:a.cx+i*a.side,z:a.side*(eg+s)}}function tg(a,i,s){return{lx:(i-a.cx)*a.side,ld:s*a.side-eg}}function mi(a,i,s,r=0){const{lx:m,ld:u}=tg(a,i,s);return Math.abs(m)<=bt/2+r&&u>=-r&&u<=Rt+r}function ql(a){return Ze(a,0,3)}function k1(a){return Ze(a,0,-2.2)}const Qu=a=>Ze(a,-6.6,2.2),Zu=a=>Ze(a,6.6,2.2),S1=a=>Ze(a,8,22.2);function ng(a){return a<=4?{cols:2,rows:2}:a<=8?{cols:4,rows:2}:a<=12?{cols:4,rows:3}:a<=16?{cols:4,rows:4}:a<=24?{cols:6,rows:4}:a<=32?{cols:8,rows:4}:a<=40?{cols:8,rows:5}:{cols:10,rows:5}}function ag(a,i,s){const{cols:r,rows:m}=ng(i),u=16,f=15.5,_=u/r,h=f/m,b=s%r,x=Math.floor(s/r),y=-u/2+_*(b+.5),v=5.2+h*(x+.5),w=Math.min(1.9,Math.min(_,h)*.62);return{...Ze(a,y,v),size:w,lx:y,ld:v}}function T1(a,i,s){const r=ag(a,i,s),{rows:m}=ng(i),u=15.5/m;return Ze(a,r.lx,r.ld-Math.min(1.25,u*.42))}const fi=[{id:"drops",label:"DROP ZONE",icon:"📦",x0:-84,x1:-70,z0:-15,z1:15,anchor:{x:-72,z:0}},{id:"market",label:"CENTRAL MARKET",icon:"📈",x0:-99,x1:-89,z0:-11,z1:11,anchor:{x:-91,z:0}},{id:"leaderboard",label:"HALL OF FAME",icon:"🏆",x0:-80,x1:-66,z0:-34,z1:-24,anchor:{x:-73,z:-25}},{id:"quests",label:"MISSIONS",icon:"🎯",x0:-80,x1:-66,z0:24,z1:34,anchor:{x:-73,z:25}},{id:"raid",label:"RAID BOARD",icon:"🥷",x0:68,x1:82,z0:-22,z1:-10,anchor:{x:72,z:-14}},{id:"trade",label:"TRADE HUB",icon:"🤝",x0:68,x1:82,z0:10,z1:22,anchor:{x:72,z:14}},{id:"event",label:"EVENT STAGE",icon:"🎪",x0:86,x1:96,z0:-10,z1:10,anchor:{x:88,z:0}},{id:"collection",label:"COLLECTION MUSEUM",icon:"🎒",x0:68,x1:82,z0:26,z1:38,anchor:{x:72,z:30}}];function N1(a,i,s){return i>=a.x0&&i<=a.x1&&s>=a.z0&&s<=a.z1}const Ku=.5;function E1(){const a=[{x0:-110,x1:-100,z0:-22,z1:22},{x0:-83,x1:-79,z0:-14,z1:14},{x0:-66,x1:-61,z0:-4.5,z1:-2.2},{x0:-66,x1:-61,z0:2.2,z1:4.5},{x0:61,x1:66,z0:-4.5,z1:-2.2},{x0:61,x1:66,z0:2.2,z1:4.5},{x0:80,x1:83,z0:-21,z1:-11},{x0:80,x1:83,z0:11,z1:21},{x0:97,x1:110,z0:-12,z1:12},{x0:-75,x1:-71,z0:-32,z1:-28},{x0:-75,x1:-71,z0:28,z1:32},{x0:80,x1:88,z0:28,z1:38}];for(const i of pi){const s=Ze(i,-bt/2,0),r=Ze(i,-bt/2,Rt);a.push(Lo(s.x,r.x,s.z,r.z,Ku));const m=Ze(i,bt/2,0),u=Ze(i,bt/2,Rt);a.push(Lo(m.x,u.x,m.z,u.z,Ku));const f=Ze(i,-bt/2,Rt),_=Ze(i,bt/2,Rt);a.push(Lo(f.x,_.x,f.z,_.z,Ku))}return a}function Lo(a,i,s,r,m){return{x0:Math.min(a,i)-m/2,x1:Math.max(a,i)+m/2,z0:Math.min(s,r)-m/2,z1:Math.max(s,r)+m/2}}function M1(a){const i=Ze(a,-bt/2,.2),s=Ze(a,bt/2,.2);return Lo(i.x,s.x,i.z,s.z,.6)}function h_(a,i,s,r){const m=Math.max(r.x0,Math.min(a,r.x1)),u=Math.max(r.z0,Math.min(i,r.z1)),f=a-m,_=i-u;return f*f+_*_<s*s}const hi=Ze(pi[0],0,1.8);function A1(a){return et.x0+(et.x1-et.x0)*a}let Ho=null,Yo=null,Bo=null,Go=null,Wu=!1,Ju=!1,om=null,__=null;async function C1(a){const i=G().settings;Z_(i.volume),K_(i.muted),W_(i.music),de({phase:"loading",loadingMsg:"Starting…",loadingPct:2,fatal:null});let s;try{s=j1(a),de({backend:s}),await s.init((r,m)=>de({loadingMsg:r,loadingPct:m}))}catch(r){const m=String(r?.message||r);de({phase:"error",fatal:a==="offline"?`Couldn't start the offline game engine. ${m}. Check your connection (the engine downloads once from cdn.jsdelivr.net) and reload.`:`Couldn't reach the online servers: ${m}`});return}if(a==="offline"&&await s.signInGuest(),!s.userId()){de({phase:"auth"});return}await ig()}async function ig(){const a=G().backend;de({phase:"loading",loadingMsg:"Loading the catalog…",loadingPct:96});try{const i=await a.rpc("stt_catalog"),s=Object.fromEntries(i.items.map(m=>[m.id,m]));de({catalog:i,itemsById:s});const r=await a.rpc("stt_sync",{since:-1,items_rev:-1});if(r.needs_join){de({phase:"join"});return}bm(r,!0),await Promise.all([Vl(),Et(),nc()]),lg()}catch(i){de({phase:"error",fatal:String(i?.message||i)})}}async function z1(a){const s=await G().backend.rpc("stt_join",{username:a});bm(s,!0),await Promise.all([Vl(),Et(),nc()]),lg()}function lg(){de({phase:"playing"});const a=G().me;a.tutorial_step<99&&de({tutorialOpen:!0}),rg();const i=G().backend,s=i.mode==="online";Ho=window.setInterval(()=>Gi(),s?3e3:2e3),Yo=window.setInterval(()=>Et(),12e3),Bo=window.setInterval(()=>Vl(),15e3),Go=window.setInterval(()=>{document.visibilityState==="visible"&&nc()},s?2e3:1500),i.onPush&&(om=i.onPush(r=>{r.target_id&&r.target_id===G().me?.id&&Gi()})),i.presence&&i.presence.start({id:a.id,name:a.username,x:hi.x,y:hi.z,dir:0,moving:!1,plot:null,trail:a.cosmetics?.trail}),document.addEventListener("visibilitychange",sg)}function sg(){document.visibilityState==="visible"&&(Gi(),Et())}function rg(){Ho&&clearInterval(Ho),Yo&&clearInterval(Yo),Bo&&clearInterval(Bo),Go&&clearInterval(Go),Ho=Yo=Bo=Go=null,om?.(),om=null,document.removeEventListener("visibilitychange",sg)}async function $1(){rg();const a=G().backend;a?.presence?.stop(),await a?.signOut().catch(()=>{}),de({phase:"title",backend:null,me:null,last:null,myItems:[],feed:[],feedSince:-1,panel:null})}async function Gi(){const a=G().backend;if(!(!a||!a.userId())){if(Wu){Ju=!0;return}Wu=!0;try{const{feedSince:i,me:s}=G(),r=await a.rpc("stt_sync",{since:i,items_rev:s?.items_rev??-1});r.needs_join||bm(r,!1)}catch(i){console.warn("sync failed",i)}finally{Wu=!1,Ju&&(Ju=!1,Gi())}}}function bm(a,i){const s=G().me,r=a.server_time-Date.now(),m={last:a,me:a.me,syncedAt:Date.now(),serverOffset:r};if(a.items&&(m.myItems=a.items),a.feed.length){const _=a.feed[a.feed.length-1].id;m.feedSince=Math.max(G().feedSince,_),m.feed=[...G().feed,...a.feed.filter(h=>h.id>G().feedSince)].slice(-120)}else i&&(m.feedSince=0);if(de(m),!i&&s)for(const _ of a.feed)O1(_);const u=a.incoming_raids[0];u&&u.id!==__&&(__=u.id,te("alarm"),navigator.vibrate&&navigator.vibrate([200,100,200,100,400]));const f=G().steal;f&&a.outgoing_raid&&a.outgoing_raid.id===f.raidId&&a.outgoing_raid.defended&&!f.defended&&(de({steal:{...f,defended:!0}}),te("alarm"))}async function Vl(){const a=G().backend;if(a)try{const i=await a.rpc("stt_market");de({market:Object.fromEntries(i.items.map(s=>[s.item_id,s])),marketAt:Date.now()})}catch(i){console.warn("market failed",i)}}let Fu=!1;async function nc(){const a=G().backend;if(!(!a||Fu)){Fu=!0;try{const i=await a.rpc("stt_belt"),s=new Map(G().belt.filter(m=>m.mine&&m.sold_to).map(m=>[m.id,m])),r=i.items.map(m=>s.has(m.id)&&!m.sold_to?s.get(m.id):m);de({belt:r,beltAt:Date.now()})}catch(i){console.warn("belt failed",i)}finally{Fu=!1}}}async function Et(){const a=G().backend;if(a)try{const i=await a.rpc("stt_world");de({world:i.players,worldAt:Date.now()})}catch(i){console.warn("world failed",i)}}const Co=a=>a&&wt(a)?.name||"an item";function O1(a){const i=G().me,s=a.payload||{},r=a.target_id&&i&&a.target_id===i.id,m=a.actor_id&&i&&a.actor_id===i.id;switch(a.kind){case"secret_found":de({bigReveal:a}),Fs("secret");break;case"big_pull":m||Ee({kind:"epic",icon:"🌈",itemId:s.item_id,title:`${s.player} pulled ${qe[s.rarity]?.label??""} ${s.item}!`,body:s.serial?`Serial #${s.serial}/${s.max_supply}`:void 0});break;case"steal":!m&&a.target_id===null&&Ee({kind:"info",icon:"🔥",itemId:s.item_id,title:`${s.attacker} stole ${s.item}`,body:`from ${s.defender}${s.revenge?" — REVENGE!":""}`});break;case"raid_alert":Ee({kind:"bad",icon:"🚨",itemId:s.item_id,title:"RAID ALERT",body:`Someone is attempting to steal ${s.defender}'s ${String(s.rarity).toUpperCase()} ${s.item}!`});break;case"market_alert":Ee({kind:s.direction==="up"?"good":"bad",icon:s.direction==="up"?"🔥":"📉",itemId:s.item_id,title:"MARKET ALERT",body:`${s.item} is ${s.direction==="up"?"suddenly trending":"crashing"} (${s.change>0?"+":""}${s.change}% in 1h)`,action:{label:"VIEW",run:()=>De("market",{item:s.item_id})}});break;case"supply_alert":Ee({kind:"epic",icon:"⚠️",itemId:s.item_id,title:s.remaining===0?`${s.item} SOLD OUT`:`ONLY ${s.remaining} LEFT`,body:`${s.item} — supply ${s.max_supply-s.remaining}/${s.max_supply}`});break;case"event_start":te("levelup"),Ee({kind:"epic",icon:s.icon,title:`${s.title} IS LIVE`,body:s.description,ttl:8e3,action:{label:"EVENT DROP",run:()=>De("drops")}});break;case"event_end":Ee({kind:"info",icon:s.icon,title:`${s.title} has ended`});break;case"raid_warning":break;case"raid_grabbed":r&&(te("alarm"),Oa({kind:"bad",title:"THEY GRABBED IT!",sub:`${s.attacker} is running off with your ${Co(s.item_id)} — CATCH THEM!`,itemId:s.item_id,ttl:3200}),navigator.vibrate&&navigator.vibrate([300,100,300]));break;case"belt_buy":m||Ee({kind:"epic",icon:"🛒",itemId:s.item_id,title:`${s.player}${s.is_bot?" 🤖":""} grabbed ${s.mutation?String(s.mutation).toUpperCase()+" ":""}${s.item}`,body:`straight off the Tech Belt for ${pe(s.price)}`});break;case"item_stolen":r&&(te("steal_fail"),Ee({kind:"bad",icon:"🚨",itemId:s.item_id,title:"ITEM STOLEN",body:`${s.attacker} stole your ${String(s.rarity||"").toUpperCase()} ${s.item||Co(s.item_id)}.`,ttl:9e3,action:{label:"REVENGE",run:()=>De("visit",{playerId:s.attacker_id,revenge:!0})}}));break;case"raid_over":if(r){const u=s.status==="blocked";te("defend"),Ee({kind:"good",icon:"🛡️",itemId:s.item_id,title:u?"THEFT BLOCKED":"RAID STOPPED",body:u?`${s.attacker} left empty-handed — your ${Co(s.item_id)} is safe.`:`${s.attacker} got caught${s.fine?` and paid you a ${pe(s.fine)} bounty`:""}.`})}break;case"raid_result":{const u=G().steal;if(r&&u&&u.raidId===s.raid_id&&!u.result&&!u.finishing){const f=/caught|Tagged/i.test(s.note||"");de({steal:{...u,result:{status:s.status,fine:s.fine,note:s.note,caught:f}}}),te(s.status==="success"?"steal_ok":"zap");break}r&&(!u||u.raidId!==s.raid_id)&&Ee({kind:s.status==="success"?"good":"bad",icon:s.status==="success"?"🔥":"🚨",itemId:s.item_id,title:s.status==="success"?"ITEM STOLEN!":"RAID FAILED",body:s.status==="success"?`You got ${Co(s.item_id)} from ${s.defender}.`:s.note||""});break}case"raid_defended":break;case"trade_offer":r&&(te("notify"),Ee({kind:"info",icon:"📨",title:`Trade offer from ${s.from}`,body:`They offer ${pe(s.offer_value)} in value for ${pe(s.request_value)}.`,ttl:8e3,action:{label:"VIEW",run:()=>De("trade",{tab:"incoming"})}}));break;case"trade_declined":r&&Ee({kind:"bad",icon:"🙅",title:`${s.by} declined your offer`,body:s.note||void 0,ttl:8e3});break;case"trade_failed":r&&Ee({kind:"bad",icon:"⚠️",title:"Trade failed",body:s.reason});break;case"trade_done":r&&(te("trade"),Ee({kind:"good",icon:"🤝",title:`Trade complete with ${s.with}`}));break;case"listing_sold":r&&(te("cash"),Ee({kind:"good",icon:"💰",itemId:s.item_id,title:"SOLD!",body:`${s.buyer} bought your ${s.item} for ${pe(s.price)} (fee ${pe(s.fee)}).`}));break;case"achievement":r&&(te("levelup"),Ee({kind:"epic",icon:s.icon,title:`Achievement: ${s.title}`,body:[s.cash?`+${pe(s.cash)}`:"",s.xp?`+${s.xp} XP`:""].filter(Boolean).join("  "),ttl:6e3}));break;case"level_up":r&&(te("levelup"),de({levelUp:{level:s.level,title:s.title,cash:s.cash}}));break;case"prestige":m||Ee({kind:"epic",icon:"✨",title:`${s.player} reached PRESTIGE ${s.prestige}`});break;case"big_trade":Ee({kind:"info",icon:"🤝",title:"MEGA TRADE",body:`${s.a} ⇄ ${s.b} — ${pe(s.value)} changed hands`});break;case"big_sale":m||Ee({kind:"info",icon:"💸",itemId:s.item_id,title:`${s.buyer} bought ${s.item}`,body:`for ${pe(s.price)} from ${s.seller}`});break}}function og(a){const i=a.payload||{};switch(a.kind){case"secret_found":return{icon:"🕳️",text:`${i.player} found the SECRET ${i.item}!`,tone:"secret"};case"big_pull":return{icon:"🌈",text:`${i.player} pulled ${String(i.rarity).toUpperCase()} ${i.item}${i.serial?` #${i.serial}`:""}`,tone:String(i.rarity)};case"steal":return{icon:"🔥",text:`${i.attacker} stole ${i.item} from ${i.defender}${i.revenge?" (revenge!)":""}`,tone:"bad"};case"raid_alert":return{icon:"🚨",text:`Someone is trying to steal ${i.defender}'s ${i.item}!`,tone:"bad"};case"market_alert":return{icon:i.direction==="up"?"📈":"📉",text:`${i.item} ${i.change>0?"+":""}${i.change}% in the last hour`,tone:i.direction==="up"?"good":"bad"};case"supply_alert":return{icon:"⚠️",text:`Only ${i.remaining} ${i.item} left (of ${i.max_supply})`,tone:"limited"};case"event_start":return{icon:i.icon,text:`${i.title} is live!`,tone:"epic"};case"event_end":return{icon:i.icon,text:`${i.title} ended`,tone:"info"};case"player_joined":return{icon:"👋",text:`${i.player} moved into Tech City`,tone:"info"};case"level_milestone":return{icon:"⭐",text:`${i.player} reached level ${i.level} — ${i.title}`,tone:"info"};case"prestige":return{icon:"✨",text:`${i.player} prestiged (P${i.prestige})`,tone:"epic"};case"big_trade":return{icon:"🤝",text:`${i.a} ⇄ ${i.b}: ${pe(i.value)} trade`,tone:"info"};case"big_sale":return{icon:"💸",text:`${i.buyer} bought ${i.item} for ${pe(i.price)}`,tone:"good"};case"belt_buy":return{icon:"🛒",text:`${i.player} grabbed ${i.mutation?String(i.mutation).toUpperCase()+" ":""}${i.item} off the belt`,tone:String(i.rarity)};case"raid_grabbed":return{icon:"🏃",text:`${i.attacker} grabbed your ${i.item||"item"}`,tone:"bad"};case"upgrade":return{icon:"🏗️",text:`${i.player} upgraded to ${i.name}`,tone:"info"};case"item_stolen":return{icon:"🚨",text:`${i.attacker} stole your ${i.item}`,tone:"bad"};case"raid_over":return{icon:"🛡️",text:`You stopped ${i.attacker}`,tone:"good"};case"raid_result":return{icon:i.status==="success"?"🥷":"❌",text:i.status==="success"?`You stole ${i.item} from ${i.defender}`:`Raid on ${i.defender} failed`,tone:i.status==="success"?"good":"bad"};case"trade_offer":return{icon:"📨",text:`${i.from} sent you an offer`,tone:"info"};case"trade_done":return{icon:"🤝",text:`Trade with ${i.with} complete`,tone:"good"};case"listing_sold":return{icon:"💰",text:`${i.buyer} bought your ${i.item} for ${pe(i.price)}`,tone:"good"};case"achievement":return{icon:i.icon,text:`Achievement unlocked: ${i.title}`,tone:"epic"};case"level_up":return{icon:"⬆️",text:`You reached level ${i.level}`,tone:"good"};default:return null}}async function dt(a,i={},s={}){const r=G().backend;if(!r)throw new Error("Not connected");try{const m=await r.rpc(a,i);return s.sync!==!1&&Gi(),m}catch(m){const u=String(m?.message||m).replace(/^.*?ERROR:\s*/i,"");throw s.quiet||(te("error"),Ee({kind:"bad",icon:"⛔",title:u})),new Error(u)}}async function cm(a,i=!1){if(!G().drop){de({drop:{drop:a,startedAt:Date.now(),result:null,error:null}}),te("shake");try{const s=await dt("stt_open_drop",{drop:a,use_token:i},{quiet:!0});de(r=>({drop:r.drop?{...r.drop,result:s}:null})),Et()}catch(s){te("error"),de({drop:null}),Ee({kind:"bad",icon:"⛔",title:s.message})}}}async function cg(a,i=null){await dt("stt_place",{player_item_id:a,slot:i}),te("click"),Et()}async function R1(a){await dt("stt_store",{player_item_id:a}),te("click"),Et()}async function dg(a){const i=await dt("stt_vault",{player_item_id:a});te(i.saved_from_raid?"defend":"click"),i.saved_from_raid&&Ee({kind:"good",icon:"🔒",title:"Locked in the vault!",body:"The thief will leave empty-handed."}),Et()}async function q1(){await dt("stt_auto_arrange"),te("coin"),Ee({kind:"good",icon:"✨",title:"Base arranged",body:"Your best earners are on display."}),Et()}async function g_(a,i){const s=await dt("stt_quick_sell",{player_item_id:a});te("cash"),Ee({kind:"good",icon:"💵",itemId:i,title:`Sold for ${pe(s.price)}`,body:wt(i)?.name}),Et()}async function D1(a){const i=await dt("stt_upgrade",{kind:a});te("levelup"),Ee({kind:"epic",icon:a==="base"?"🏗️":a==="security"?"🔐":"🏦",title:`${i.name} unlocked!`,body:`${a.toUpperCase()} level ${i.level}`}),Et()}async function Io(a,i=!1){if(G().steal&&!G().steal.result){Ee({kind:"bad",icon:"🥷",title:"Finish your current raid first."});return}const s=await dt("stt_start_steal",{player_item_id:a,revenge:i});te("grab"),de({steal:{raidId:s.raid_id,itemId:s.item_id,playerItemId:a,defender:s.defender,defenderId:s.defender_id,startedAt:je(s.started_at),endsAt:je(s.ends_at),chance:s.chance,tutorial:s.tutorial,revenge:s.revenge,defended:!1,phase:"grab",grabbedAt:0,carryUntil:0,deliverAfter:0,mutation:s.mutation??null,result:null,finishing:!1}})}function ym(a){const i=G().steal;if(!i)return;if(a.status==="active"&&a.phase==="carry"){de({steal:{...i,finishing:!1,defended:!!a.defended,phase:"carry",grabbedAt:je(a.grabbed_at),carryUntil:je(a.carry_until),deliverAfter:je(a.deliver_after)}}),te("run"),Oa({kind:"good",title:"GOT IT! RUN!",sub:`Get it back to your base before ${i.defender} catches you`,itemId:i.itemId,mutation:i.mutation,ttl:2200});return}const s=/caught|Tagged/i.test(a.note||"");de({steal:{...i,finishing:!1,defended:!!a.defended,result:{status:a.status,fine:a.fine,note:a.note,caught:s}}}),a.status==="success"?(te("steal_ok"),Fs(wt(i.itemId)?.rarity||"common")):te(a.status==="blocked"?"defend":"zap"),Et()}async function ug(){const a=G().steal;if(!(!a||a.finishing||a.result||a.phase!=="grab")){de({steal:{...a,finishing:!0}});try{const i=await dt("stt_finish_steal",{raid_id:a.raidId},{quiet:!0});ym(i)}catch(i){de({steal:{...G().steal,finishing:!1}}),/Still grabbing/.test(i.message)?window.setTimeout(ug,700):Ee({kind:"bad",icon:"⛔",title:i.message})}}}async function U1(){const a=G().steal;if(!(!a||a.finishing||a.result||a.phase!=="carry")){de({steal:{...a,finishing:!0}});try{const i=await dt("stt_deliver_steal",{raid_id:a.raidId},{quiet:!0});ym(i)}catch(i){de({steal:{...G().steal,finishing:!1}}),/Keep running/.test(i.message)||Ee({kind:"bad",icon:"⛔",title:i.message})}}}async function Xo(a){const i=G().steal;if(!(!i||i.finishing||i.result)){de({steal:{...i,finishing:!0}});try{const s=await dt("stt_abort_steal",{raid_id:i.raidId,reason:a},{quiet:!0});if(a==="abort"){de({steal:null}),Ee({kind:"info",icon:"🫥",title:"You backed off",body:"No harm done — lay low for a few seconds."}),Et();return}ym(s)}catch{de({steal:{...G().steal,finishing:!1}})}}}async function mg(a,i=!1){const s=await dt("stt_defend",{raid_id:a,tag:i});return i?(te("tag"),Oa({kind:"good",title:"TAGGED!",sub:s.fine?`They dropped it and paid you ${pe(s.fine)}`:"They dropped your item",itemId:s.item_id}),Et()):(te("defend"),Ee({kind:"good",icon:"🚨",title:"ALARM SOUNDED!",body:"Their odds just collapsed — now go catch them!"})),s}async function b_(a){const i=G(),s=i.belt.find(r=>r.id===a);if(!s)return null;if(i.me&&i.me.cash<s.price)return te("error"),Ee({kind:"bad",icon:"💸",itemId:s.item_id,title:`Need ${pe(s.price-i.me.cash)} more`,body:"Walk over your podiums to collect your cash."}),null;de({belt:i.belt.map(r=>r.id===a?{...r,sold_to:i.me?.id??null,buyer:i.me?.username??null,sold_at:new Date(Date.now()+G().serverOffset).toISOString(),mine:!0}:r),beltAt:Date.now()});try{const r=await dt("stt_buy_belt",{belt_id:a},{quiet:!0}),m=wt(r.item_id),u=qe[r.rarity]?.tier??1;if(i.me&&de({me:{...G().me,cash:r.cash}}),te("buy"),r.mutation){te("mutation");const f=ea(r.mutation);Oa({kind:"epic",title:`${f?.label??r.mutation} ${m?.name??""}!`,sub:`${f?.mult??""}× income & value`,itemId:r.item_id,mutation:r.mutation})}else u>=5&&(Fs(r.rarity),Oa({kind:"epic",title:`${qe[r.rarity].label}!`,sub:m?.name,itemId:r.item_id}));return r.placed||Ee({kind:"info",icon:"📦",itemId:r.item_id,title:"Base full — sent to storage",body:"Upgrade your base or swap it in from BASE."}),r.is_new&&Ee({kind:"good",icon:"✨",itemId:r.item_id,title:"NEW DISCOVERY!",body:m?.name}),Et(),r}catch(r){return te("error"),Ee({kind:"bad",icon:/Too slow/.test(r.message)?"🐌":"⛔",itemId:s.item_id,title:r.message}),nc(),null}}async function y_(a){try{const i=await dt("stt_collect",a?{player_item_id:a}:{},{quiet:!0,sync:!1});return G().me&&de({me:{...G().me,cash:i.cash,pending:Math.max(0,(G().me.pending||0)-i.collected)}}),Gi(),i.collected}catch{return 0}}async function L1(){try{const a=await dt("stt_lock_base",{},{quiet:!0});return G().me&&de({me:{...G().me,lock_until:a.lock_until}}),te("laser"),Oa({kind:"info",title:"🔒 BASE LOCKED",sub:`Lasers up for ${a.seconds}s — nobody gets in`,color:"#f43f5e",ttl:1800}),!0}catch(a){return Ee({kind:"info",icon:"🔒",title:a.message}),!1}}async function H1(a){try{return await dt("stt_base",{player_id:a},{quiet:!0,sync:!1})}catch{return null}}async function Y1(a,i){await dt("stt_list",{player_item_id:a,price:Math.round(i)}),te("coin"),Ee({kind:"good",icon:"🏷️",title:"Listed on the market",body:pe(i)}),Vl(),Et()}async function vm(a){await dt("stt_cancel_listing",{listing_id:a}),te("click"),Vl()}async function fg(a,i,s){await dt("stt_buy_listing",{listing_id:a}),te("buy"),Ee({kind:"good",icon:"🛒",itemId:i,title:`Bought ${wt(i)?.name??"item"}`,body:pe(s)}),Vl(),Et()}async function B1(a){await dt("stt_trade_propose",a),te("trade"),Ee({kind:"good",icon:"📨",title:"Offer sent",body:"Both sides must confirm before anything moves."})}async function v_(a,i){const s=await dt("stt_trade_respond",{trade_id:a,accept:i});return i&&s.ok===!1&&Ee({kind:"bad",icon:"⚠️",title:"Trade failed",body:s.reason}),Et(),s}async function G1(a){await dt("stt_trade_cancel",{trade_id:a})}async function I1(a){const i=await dt("stt_claim_quest",{quest_id:a});te("cash");const s=[i.cash?`+${pe(i.cash)}`:"",i.xp?`+${i.xp} XP`:"",i.tokens?Object.entries(i.tokens).map(([r,m])=>`+${m} ${r} drop`).join(" "):"",i.secret_keys?`+${i.secret_keys} Secret Key`:""];Ee({kind:"epic",icon:"🎯",title:"Quest complete!",body:s.filter(Boolean).join("  ")})}async function X1(){const a=await dt("stt_claim_daily");return te("cash"),Et(),a}async function w_(a){await dt("stt_buy_cosmetic",{cosmetic_id:a}),te("buy")}async function V1(a){await dt("stt_equip",{cosmetic_id:a}),te("click"),Et()}async function P1(a){await dt("stt_set_focus",{focus:a}),te("click")}async function Q1(){const a=await dt("stt_prestige");te("levelup"),Ee({kind:"epic",icon:"✨",title:`PRESTIGE ${a.prestige}!`,body:"Permanent bonuses unlocked.",ttl:8e3}),Et()}async function em(a){return dt("stt_tutorial",{step:a},{quiet:!0})}function Js(a,i=!1){de({focusPlot:a}),De("visit",{playerId:a,revenge:i})}const x_=new Map;function Pl(a,i){let s=x_.get(a);return s||(s=i(),x_.set(a,s)),s}const I=(a,i,s)=>Pl(`b${a},${i},${s}`,()=>new Zo(a,i,s)),oe=(a,i,s,r=.04)=>Pl(`rb${a},${i},${s},${r}`,()=>new _v(a,i,s,2,Math.min(r,a/2-.001,i/2-.001,s/2-.001))),ve=(a,i,s,r=18)=>Pl(`c${a},${i},${s},${r}`,()=>new B_(a,i,s,r)),tn=(a,i=16,s=12)=>Pl(`s${a},${i},${s}`,()=>new Ks(a,i,s)),Tt=(a,i,s=Math.PI*2,r=8,m=24)=>Pl(`t${a},${i},${s},${r},${m}`,()=>new gv(a,i,r,m,s)),Dt=(a,i)=>Pl(`p${a},${i}`,()=>new pm(a,i)),Gl=new Map;function J(a,i={}){const s=`std|${a}|${i.metal??.1}|${i.rough??.55}|${i.emissive??""}|${i.ei??1}|${i.opacity??1}|${i.flat?1:0}`;let r=Gl.get(s);return r||(r=new ha({color:a,metalness:i.metal??.1,roughness:i.rough??.55,emissive:i.emissive??0,emissiveIntensity:i.ei??1,transparent:(i.opacity??1)<1,opacity:i.opacity??1,flatShading:!!i.flat}),Gl.set(s,r)),r}function $e(a,i=1){const s=`glow|${a}|${i}`;let r=Gl.get(s);return r||(r=new Nt({color:a,toneMapped:!1,transparent:i<1,opacity:i,depthWrite:i>=1}),Gl.set(s,r)),r}function N(a,i,s=0,r=0,m=0,u){const f=new _e(a,i);return f.position.set(s,r,m),f.castShadow=!0,u&&u.add(f),f}function gn(a,i,s,r=!1){const m=document.createElement("canvas");m.width=a,m.height=i;const u=m.getContext("2d");s(u);const f=new Y_(m);return f.colorSpace=fm,f.anisotropy=4,r&&(f.wrapS=f.wrapT=fv),f}const j_=new Map;function Ii(a,i){let s=j_.get(a);return s||(s=i(),j_.set(a,s)),s}function Z1(a){const i="screen|"+a.brand+a.color+a.accent,s=Ii(i,()=>gn(256,160,u=>{const f=u.createLinearGradient(0,0,256,160);f.addColorStop(0,a.accent),f.addColorStop(.55,a.color),f.addColorStop(1,"#0b1020"),u.fillStyle=f,u.fillRect(0,0,256,160),u.fillStyle="rgba(255,255,255,0.14)",u.beginPath(),u.moveTo(0,0),u.lineTo(150,0),u.lineTo(60,160),u.lineTo(0,160),u.fill(),u.font="900 40px 'Orbitron', 'Rajdhani', system-ui, sans-serif",u.textAlign="center",u.textBaseline="middle",u.fillStyle="#ffffff",u.shadowColor=a.color,u.shadowBlur=16,u.fillText(a.brand,128,82)})),r="screenmat|"+i;let m=Gl.get(r);return m||(m=new Nt({map:s,color:"#d8d8d8"}),Gl.set(r,m)),m}function K1(a){const i=new tc(a.accent).multiplyScalar(.35).getStyle();return{c:a.color,a:a.accent,body:J(a.color,{metal:.25,rough:.4}),accent:J(a.accent,{metal:.3,rough:.45}),dark:J(i,{metal:.3,rough:.5}),black:J("#10131c",{metal:.4,rough:.3}),metal:J("#c9d1dc",{metal:.9,rough:.25}),gold:J("#f5c542",{metal:1,rough:.25}),white:J("#f1f5f9",{rough:.6}),glass:J("#9ad8ff",{metal:.1,rough:.05,opacity:.35}),glowA:$e(a.accent),glowC:$e(a.color),screen:Z1(a),rubber:J("#1c1f26",{rough:.9})}}function Vo(a,i,s,r,m,u=.08,f=.05){N(oe(s,r,u,.03),i.black,0,m,0,a);const _=N(Dt(s-f*2,r-f*2),i.screen,0,m,u/2+.002,a);_.userData.screen=!0}function W1(a,i,s,r,m,u,f=.14){const _=N(ve(u,u,f,16),i.rubber,s,r,m,a);_.rotation.x=Math.PI/2;const h=N(ve(u*.55,u*.55,f+.01,12),i.metal,s,r,m,a);h.rotation.x=Math.PI/2}function Gs(a,i,s){const r=new Xe;r.rotation.y=-.5,a.add(r);const m=s.lift+s.h/2;N(oe(s.len,s.h,s.w,.09),i.body,0,m,0,r),N(oe(s.cabLen,s.cabH,s.w*.86,.1),i.glass,s.cabX,m+s.h/2+s.cabH/2-.03,0,r),N(oe(s.cabLen*.96,.05,s.w*.88,.02),i.body,s.cabX,m+s.h/2+s.cabH-.03,0,r),N(I(s.len*.98,.05,s.w+.01),i.accent,0,m+s.h*.1,0,r);const u=s.len*.33,f=s.w/2-.02;for(const _ of[-1,1])for(const h of[-1,1])W1(r,i,_*u,s.wheelR,h*f,s.wheelR);N(I(.04,.07,s.w*.7),$e("#fffbe6"),s.len/2+.01,m+.02,0,r),N(I(.04,.06,s.w*.7),$e("#ff3b3b"),-s.len/2-.01,m+.03,0,r),s.spoiler&&N(I(.2,.04,s.w*.9),i.dark,-s.len/2+.12,m+s.h/2+.12,0,r),s.wing&&(N(I(.32,.05,s.w*1.05),i.accent,-s.len/2+.1,m+s.h/2+.3,0,r),N(I(.05,.3,.05),i.dark,-s.len/2+.1,m+s.h/2+.15,s.w*.3,r),N(I(.05,.3,.05),i.dark,-s.len/2+.1,m+s.h/2+.15,-s.w*.3,r),N(I(s.len*.8,.02,s.w*.8),i.glowA,0,s.lift-.01,0,r))}const J1={tv(a,i,s){const r=Number((s.name.match(/(\d+)"/)||[])[1]||50),m=1.1+(Math.min(85,Math.max(32,r))-32)/55,u=m*.58;N(I(.55,.04,.3),i.dark,0,.02,0,a),N(I(.08,.26,.06),i.dark,0,.16,0,a),Vo(a,i,m,u,.3+u/2),N(I(m,.035,.1),i.accent,0,.3+.02,0,a)},monitor(a,i){N(ve(.28,.3,.04,20),i.dark,0,.02,0,a),N(I(.07,.42,.07),i.metal,0,.23,-.05,a),Vo(a,i,1.1,.64,.72),N(I(1.1,.03,.1),i.accent,0,.4,0,a)},phone(a,i){N(oe(.52,1.02,.08,.08),i.body,0,.51,0,a);const s=N(Dt(.44,.92),i.screen,0,.51,.042,a);s.userData.screen=!0,N(oe(.2,.2,.04,.05),i.dark,-.1,.84,-.05,a),N(ve(.05,.05,.03,12),i.black,-.1,.84,-.075,a).rotation.x=Math.PI/2},tablet(a,i){N(oe(.95,1.25,.06,.07),i.body,0,.63,0,a);const s=N(Dt(.86,1.14),i.screen,0,.63,.032,a);s.userData.screen=!0,N(I(.7,.05,.25),i.dark,0,.025,.05,a)},laptop(a,i){N(oe(1.2,.06,.8,.03),i.body,0,.03,.1,a),N(Dt(1.05,.5),i.dark,0,.061,.12,a).rotation.x=-Math.PI/2;const s=new Xe;s.position.set(0,.06,-.3),s.rotation.x=-.25,a.add(s),N(oe(1.2,.78,.05,.03),i.body,0,.39,0,s);const r=N(Dt(1.08,.66),i.screen,0,.39,.027,s);r.userData.screen=!0},camera(a,i){N(oe(1,.62,.45,.06),i.black,0,.36,0,a),N(oe(1,.12,.46,.04),i.body,0,.66,0,a);const s=N(ve(.22,.25,.36,22),i.dark,.05,.36,.38,a);s.rotation.x=Math.PI/2,N(Tt(.23,.03),i.accent,.05,.36,.52,a),N(ve(.17,.17,.02,20),$e("#6ee7ff"),.05,.36,.56,a).rotation.x=Math.PI/2,N(I(.16,.08,.1),$e("#ffffff"),-.35,.58,.2,a),N(oe(.18,.5,.2,.06),i.body,-.44,.32,.18,a)},speaker(a,i){N(oe(.72,1.25,.62,.08),i.body,0,.63,0,a);for(const[s,r]of[[.95,.2],[.45,.27]]){const m=N(ve(r,r,.04,22),i.black,0,s,.31,a);m.rotation.x=Math.PI/2,N(Tt(r+.02,.025),i.glowA,0,s,.33,a)}},headphones(a,i){const s=N(Tt(.46,.06,Math.PI,8,24),i.body,0,.42,0,a);s.rotation.z=0;for(const r of[-1,1]){const m=N(ve(.22,.22,.2,20),i.accent,r*.46,.34,0,a);m.rotation.z=Math.PI/2;const u=N(ve(.19,.19,.08,18),i.black,r*.34,.34,0,a);u.rotation.z=Math.PI/2,N(Tt(.12,.02),i.glowC,r*.57,.34,0,a).rotation.y=Math.PI/2}},smartwatch(a,i){N(I(.34,1.1,.06),i.body,0,.6,-.02,a),N(oe(.52,.6,.16,.09),i.black,0,.6,.04,a);const s=N(Dt(.42,.5),i.screen,0,.6,.121,a);s.userData.screen=!0,N(ve(.05,.05,.08,12),i.accent,.29,.66,.04,a).rotation.z=Math.PI/2},luxury_watch(a,i,s){const r=/GOLD|ONYX|ZENITH/i.test(s.name+s.brand)?i.gold:i.metal;N(I(.36,1.2,.07),i.accent,0,.62,-.04,a);const m=N(ve(.36,.36,.14,32),r,0,.62,.03,a);m.rotation.x=Math.PI/2;const u=N(ve(.3,.3,.02,32),i.dark,0,.62,.105,a);u.rotation.x=Math.PI/2,N(Tt(.32,.03,Math.PI*2,8,32),r,0,.62,.11,a),N(I(.03,.22,.01),i.glowA,0,.7,.12,a),N(I(.16,.03,.01),i.white,.07,.62,.12,a),N(ve(.05,.05,.08,12),r,.4,.62,.03,a).rotation.z=Math.PI/2},controller(a,i){N(oe(1,.34,.52,.14),i.body,0,.42,0,a);for(const r of[-1,1])N(tn(.24),i.body,r*.4,.28,.02,a).scale.set(1,1.3,1);for(const r of[-1,1])N(ve(.07,.08,.12,12),i.black,r*.18,.62,.05,a);["#22c55e","#ef4444","#3b82f6","#facc15"].forEach((r,m)=>N(tn(.045,10,8),$e(r),.34+(m%2?.07:-.07)*(m<2?1:0),.6,.12+(m>=2?m===2?.07:-.07:0),a)),N(I(.4,.02,.05),i.glowA,0,.5,.26,a)},keyboard(a,i){const s=new Xe;s.rotation.x=.35,s.position.y=.25,a.add(s),N(oe(1.4,.1,.5,.03),i.dark,0,0,0,s);const r=Ii("keys|"+i.a,()=>gn(256,96,f=>{f.fillStyle="#0b0f19",f.fillRect(0,0,256,96);for(let _=0;_<4;_++)for(let h=0;h<14;h++)f.fillStyle=`hsl(${(h*26+_*40)%360},90%,60%)`,f.fillRect(4+h*18,6+_*22,14,16)})),m=new Nt({map:r,toneMapped:!1}),u=N(Dt(1.34,.44),m,0,.051,0,s);u.rotation.x=-Math.PI/2,u.userData.screen=!0,N(I(1.4,.03,.05),i.glowA,0,-.03,.26,s)},handheld(a,i){N(oe(1.15,.56,.12,.12),i.body,0,.3,0,a);const s=N(Dt(.56,.38),i.screen,0,.32,.062,a);s.userData.screen=!0,N(I(.14,.04,.03),i.black,-.42,.3,.07,a),N(I(.04,.14,.03),i.black,-.42,.3,.07,a),N(tn(.04,8,6),$e("#ef4444"),.42,.34,.07,a),N(tn(.04,8,6),$e("#22c55e"),.36,.27,.07,a)},console(a,i){N(oe(.52,1.15,.9,.06),i.body,0,.58,0,a),N(I(.54,1,.04),i.glowA,0,.58,.45,a).scale.set(.12,1,1),N(I(.3,.02,.02),i.black,.05,.9,.46,a),N(oe(.7,.05,1,.02),i.dark,0,.025,0,a)},gaming_pc(a,i){N(oe(.62,1.2,1,.04),i.black,0,.6,0,a),N(I(.02,1.05,.9),J("#9ad8ff",{rough:.05,opacity:.25}),.32,.6,0,a),["#f43f5e","#22d3ee","#a855f7"].forEach((r,m)=>{N(Tt(.16,.025),$e(r),0,.95-m*.34,.505,a),N(ve(.13,.13,.02,14),i.dark,0,.95-m*.34,.5,a).rotation.x=Math.PI/2}),N(I(.64,.05,1.02),i.accent,0,1.2,0,a),N(I(.3,.3,.3),$e(i.c),.15,.6,-.1,a).scale.set(.3,1,1)},gpu(a,i){N(oe(1.4,.58,.2,.04),i.black,0,.35,0,a),N(oe(1.38,.5,.05,.03),i.body,0,.35,.11,a);for(const s of[-.42,0,.42]){const r=N(ve(.2,.2,.03,20),i.dark,s,.35,.14,a);r.rotation.x=Math.PI/2,r.userData.spin=12,N(Tt(.21,.02),i.glowA,s,.35,.15,a)}N(I(1.3,.04,.22),i.glowC,0,.66,0,a),N(I(.4,.06,.18),i.gold,-.3,.04,0,a)},gaming_setup(a,i){N(I(1.7,.06,.7),i.dark,0,.55,0,a);for(const s of[-1,1])N(I(.06,.55,.6),i.black,s*.8,.27,0,a);for(const s of[-.42,.42]){const r=new Xe;r.position.set(s,.58,-.12),r.rotation.y=-s*.5,a.add(r),Vo(r,i,.78,.46,.35,.05,.03)}N(oe(.25,.45,.4,.03),i.black,.62,.8,.05,a),N(I(.02,.4,.3),i.glowA,.745,.8,.05,a),N(I(1.7,.02,.02),i.glowC,0,.52,.35,a)},vr_headset(a,i){N(oe(.95,.5,.5,.18),i.body,0,.5,.05,a),N(oe(.85,.4,.06,.12),i.black,0,.5,.3,a);for(const r of[-1,1])N(ve(.1,.1,.02,16),i.glowA,r*.2,.5,.335,a).rotation.x=Math.PI/2;const s=N(Tt(.42,.045,Math.PI,8,20),i.dark,0,.5,-.2,a);s.rotation.x=-Math.PI/2},drone(a,i){N(oe(.55,.2,.55,.08),i.body,0,.45,0,a);for(let s=0;s<4;s++){const r=Math.PI/4+s*Math.PI/2,m=N(I(.62,.05,.08),i.dark,Math.cos(r)*.3,.45,Math.sin(r)*.3,a);m.rotation.y=-r;const u=Math.cos(r)*.6,f=Math.sin(r)*.6;N(ve(.04,.04,.12,8),i.black,u,.5,f,a);const _=N(I(.5,.01,.06),J("#e2e8f0",{opacity:.8}),u,.57,f,a);_.userData.spin=30,N(tn(.035,8,6),$e(s<2?"#22c55e":"#ef4444"),u,.44,f,a)}N(tn(.1,12,10),i.black,0,.36,.2,a);for(const s of[-1,1])N(I(.05,.3,.05),i.dark,s*.2,.2,0,a)},car(a,i){Gs(a,i,{len:1.6,h:.42,w:.8,cabLen:.95,cabH:.38,cabX:-.05,wheelR:.2,lift:.12})},sports_car(a,i){Gs(a,i,{len:1.85,h:.34,w:.84,cabLen:.8,cabH:.3,cabX:-.2,wheelR:.2,lift:.1,spoiler:!0})},supercar(a,i){Gs(a,i,{len:1.95,h:.3,w:.88,cabLen:.72,cabH:.26,cabX:-.12,wheelR:.21,lift:.08,spoiler:!0})},hypercar(a,i){Gs(a,i,{len:2.05,h:.27,w:.9,cabLen:.66,cabH:.24,cabX:-.05,wheelR:.21,lift:.07,wing:!0})},suv(a,i){Gs(a,i,{len:1.75,h:.6,w:.9,cabLen:1.35,cabH:.42,cabX:-.1,wheelR:.27,lift:.18})},motorbike(a,i){const s=new Xe;s.rotation.y=-.6,a.add(s);for(const m of[-.55,.55])N(Tt(.26,.07,Math.PI*2,10,24),i.rubber,m,.33,0,s),N(ve(.1,.1,.08,12),i.metal,m,.33,0,s).rotation.x=Math.PI/2;N(oe(.8,.28,.3,.08),i.body,.02,.62,0,s),N(oe(.42,.12,.28,.05),i.black,-.3,.8,0,s),N(oe(.34,.24,.32,.1),i.accent,.18,.8,0,s);const r=N(I(.05,.6,.05),i.metal,.47,.6,0,s);r.rotation.z=.35,N(I(.05,.05,.6),i.black,.38,.92,0,s),N(I(.05,.1,.2),$e("#fffbe6"),.62,.78,0,s),N(ve(.06,.08,.4,10),i.metal,-.3,.42,.18,s).rotation.z=Math.PI/2},bicycle(a,i){const s=new Xe;s.rotation.y=-.6,a.add(s);for(const m of[-.5,.5])N(Tt(.32,.03,Math.PI*2,8,28),i.rubber,m,.35,0,s),N(Tt(.29,.01,Math.PI*2,6,28),i.metal,m,.35,0,s);const r=[[0,.52,.72,.04,.2],[-.25,.45,.55,.04,-1],[.22,.45,.5,.04,1.1],[-.37,.35,.3,.04,0]];for(const[m,u,f,_,h]of r){const b=N(I(f,_,_),i.body,m,u,0,s);b.rotation.z=h}N(oe(.24,.06,.12,.03),i.black,-.2,.82,0,s),N(I(.04,.4,.04),i.metal,.44,.62,0,s),N(I(.04,.04,.45),i.black,.44,.84,0,s)},skateboard(a,i){const s=new Xe;s.rotation.z=.35,s.rotation.y=-.4,s.position.y=.35,a.add(s),N(oe(1.4,.06,.38,.03),i.body,0,.1,0,s),N(I(1.1,.01,.3),i.accent,0,.135,0,s);for(const r of[-.45,.45]){N(I(.08,.06,.3),i.metal,r,.04,0,s);for(const m of[-.16,.16])N(ve(.06,.06,.06,12),$e(i.a),r,0,m,s).rotation.x=Math.PI/2}},surfboard(a,i){N(tn(.5,20,16),i.body,0,.72,0,a).scale.set(.42,1.45,.1),N(I(.06,1.8,.11),i.accent,0,.72,0,a).scale.set(1,1,1),N(I(.04,.16,.14),i.dark,0,.2,-.08,a)},sneakers(a,i){for(const s of[-.24,.24]){const r=new Xe;r.position.set(s*.2,0,s),r.rotation.y=-.5,a.add(r),N(oe(1,.14,.38,.06),i.white,0,.07,0,r),N(oe(.82,.34,.36,.14),i.body,-.06,.3,0,r),N(oe(.36,.22,.34,.1),i.body,.3,.22,0,r);const m=N(I(.5,.06,.37),i.accent,0,.26,0,r);m.rotation.z=.25;for(let u=0;u<3;u++)N(I(.03,.02,.2),i.white,.12-u*.1,.47,0,r);N(I(.1,.18,.2),i.accent,-.46,.4,0,r)}},cap(a,i){N(new Ks(.42,20,10,0,Math.PI*2,0,Math.PI/2),i.body,0,.05,0,a).scale.set(1,.9,1),N(ve(.42,.42,.035,24),i.accent,0,.06,.32,a).scale.set(.9,1,.8),N(tn(.05,8,6),i.accent,0,.43,0,a),N(I(.22,.12,.01),i.glowA,0,.22,.41,a),a.position.y=0},hoodie(a,i){N(oe(.82,.9,.36,.12),i.body,0,.55,0,a);for(const r of[-1,1]){const m=N(oe(.24,.82,.28,.1),i.body,r*.52,.5,0,a);m.rotation.z=r*.12}N(tn(.28,16,12),i.accent,0,1,-.08,a).scale.set(1,.8,.9),N(oe(.5,.2,.05,.05),i.accent,0,.32,.18,a);for(const r of[-1,1])N(I(.02,.25,.02),i.white,r*.08,.8,.19,a)},jacket(a,i){N(oe(.84,.95,.38,.1),i.body,0,.55,0,a);for(const s of[-1,1]){const r=N(oe(.24,.85,.28,.08),i.body,s*.53,.52,0,a);r.rotation.z=s*.1,N(I(.2,.25,.04),i.accent,s*.2,.95,.18,a).rotation.z=s*-.5}N(I(.03,.9,.02),i.gold,0,.55,.2,a),N(I(.84,.06,.39),i.accent,0,.12,0,a)},sunglasses(a,i){for(const s of[-1,1]){const r=N(ve(.2,.2,.03,24),J("#0b0f19",{metal:.8,rough:.05}),s*.24,.45,0,a);r.rotation.x=Math.PI/2,r.scale.set(1.15,1,.85),N(Tt(.2,.025,Math.PI*2,6,24),i.body,s*.24,.45,.01,a).scale.set(1.15,.85,1),N(I(.03,.03,.6),i.body,s*.46,.5,-.3,a)}N(I(.1,.03,.03),i.body,0,.5,.01,a),N(I(.1,.04,.01),i.glowA,.24,.52,.025,a)},chain(a,i,s){const r=/SILVER/i.test(s.name)?i.metal:i.gold;for(let m=0;m<14;m++){const u=m/14*Math.PI*2,f=N(Tt(.07,.022,Math.PI*2,6,14),r,Math.cos(u)*.42,.62+Math.sin(u)*.42,0,a);f.rotation.z=u,m%2&&(f.rotation.x=Math.PI/2)}N(oe(.26,.3,.06,.04),i.body,0,.12,.02,a),N(I(.1,.14,.02),i.glowA,0,.12,.06,a)},ring(a,i){N(Tt(.32,.075,Math.PI*2,12,32),i.gold,0,.42,0,a),N(new Qh(.2),J(i.c,{metal:.2,rough:.05,emissive:i.c,ei:.4,flat:!0}),0,.86,0,a).scale.set(1,1.2,1)},diamond(a,i){N(new Qh(.55,0),J(i.c,{metal:.3,rough:.02,emissive:i.c,ei:.35,flat:!0}),0,.62,0,a).scale.set(1,1.15,1),N(ve(.3,.38,.1,6),i.dark,0,.05,0,a)},gold_bar(a,i){for(const[s,r,m]of[[-.3,.16,0],[.3,.16,0],[0,.46,0]]){const u=N(ve(.3,.42,.3,4),i.gold,s,r,m,a);u.rotation.y=Math.PI/4,u.scale.set(1.4,1,.8)}},perfume(a,i){N(oe(.6,.72,.34,.1),J(i.c,{rough:.05,opacity:.55}),0,.37,0,a),N(oe(.46,.5,.22,.08),$e(i.c,.6),0,.33,0,a),N(ve(.1,.12,.08,12),i.gold,0,.77,0,a),N(oe(.3,.28,.3,.06),i.gold,0,.93,0,a),N(Dt(.3,.14),i.white,0,.4,.172,a)},ball(a,i){const s=Ii("ball|"+i.c+i.a,()=>gn(128,64,m=>{m.fillStyle=i.c,m.fillRect(0,0,128,64),m.fillStyle=i.a;for(let u=0;u<4;u++)m.fillRect(u*32+12,0,6,64);m.fillRect(0,29,128,6)})),r=new ha({map:s,roughness:.55});N(tn(.5,24,18),r,0,.5,0,a)},racket(a,i){N(Tt(.36,.04,Math.PI*2,8,28),i.body,0,.95,0,a).scale.set(1,1.3,1),N(Dt(.66,.9),J("#e2e8f0",{opacity:.35}),0,.95,0,a).scale.set(1,1,1),N(ve(.045,.05,.5,10),i.accent,0,.25,0,a),N(ve(.055,.055,.22,10),i.black,0,.12,0,a)},golf(a,i){const s=N(ve(.02,.025,1.3,8),i.metal,.1,.72,0,a);s.rotation.z=.18,N(oe(.32,.12,.14,.05),i.body,-.03,.08,.02,a),N(ve(.05,.05,.28,10),i.black,.21,1.3,0,a).rotation.z=.18,N(tn(.08,12,10),i.white,.3,.12,.1,a),N(ve(.3,.35,.04,20),J("#166534"),0,.02,0,a)},trophy(a,i,s){const r=/SILVER/i.test(s.name)?i.metal:i.gold,m=[];for(let u=0;u<=10;u++){const f=u/10;m.push(new sm(.12+Math.sin(f*Math.PI*.5)*.3,.6+f*.55))}N(new hv(m,24),r,0,0,0,a),N(ve(.06,.1,.35,12),r,0,.42,0,a);for(const u of[-1,1])N(Tt(.16,.03,Math.PI,8,16),r,u*.4,.95,0,a).rotation.z=u>0?-Math.PI/2:Math.PI/2;N(oe(.5,.25,.5,.04),i.dark,0,.12,0,a),N(I(.3,.1,.01),i.glowA,0,.12,.26,a)},backpack(a,i){N(oe(.75,.95,.4,.16),i.body,0,.5,0,a),N(oe(.55,.42,.14,.1),i.accent,0,.35,.24,a),N(Tt(.12,.03,Math.PI,6,12),i.dark,0,.98,0,a);for(const s of[-1,1])N(I(.08,.8,.06),i.dark,s*.22,.5,-.22,a);N(I(.4,.02,.02),i.glowA,0,.58,.315,a)}},F1={car:1.9,sports_car:2,supercar:2.05,hypercar:2.15,suv:1.95,motorbike:1.6,bicycle:1.5,tv:1.55,monitor:1.3,gaming_setup:1.7,gaming_pc:1.35,console:1.2,surfboard:1.6,ring:.9,chain:1,sunglasses:1,luxury_watch:1.05,smartwatch:1,diamond:1.1,cap:.95},e2=()=>J("#ffffff",{rough:.35}),k_=new Map;function t2(a){const i=Math.round(a*20)/20;let s=k_.get(i);if(s)return s;const r=Math.max(.09,Math.min(.16,a*.1)),m=Math.max(r*1.25,Math.min(a*.22,.3)),u=[],f=[];for(const _ of[-1,1])u.push(new Ks(r,14,10).scale(1,1,.55).translate(_*m,0,0)),f.push(new Ks(r*.5,10,8).translate(_*m,-r*.1,r*.42));return s={whites:lm(u),pupils:lm(f)},k_.set(i,s),s}const n2=()=>J("#0b0b0f",{rough:.2,metal:.2}),S_=new Map;function a2(a){a.updateMatrixWorld(!0);const i=new Map,s=new Ws().copy(a.matrixWorld).invert();a.traverse(m=>{const u=m;if(!u.isMesh||Array.isArray(u.material))return;let f=u.geometry.clone();f.index&&(f=f.toNonIndexed());for(const h of Object.keys(f.attributes))h!=="position"&&h!=="normal"&&h!=="uv"&&f.deleteAttribute(h);f.attributes.uv||f.setAttribute("uv",new Hl(new Float32Array(f.attributes.position.count*2),2)),f.applyMatrix4(new Ws().multiplyMatrices(s,u.matrixWorld));const _=i.get(u.material)||[];_.push(f),i.set(u.material,_)});const r=new Xe;for(const[m,u]of i){const f=u.length===1?u[0]:lm(u,!1);if(!f)continue;f.computeBoundingSphere();const _=new _e(f,m);_.castShadow=!0,r.add(_)}return r}function i2(a){let i=S_.get(a.id);if(i)return i;const s=new Xe,r=K1(a);(J1[a.kind]||l2)(s,r,a);const m=a2(s),u=new pv().setFromObject(m),f=new be;u.getSize(f);const _=qe[a.rarity]?.tier??1,b=(F1[a.kind]??1.2)*(1+.07*Math.max(0,_-3))/Math.max(f.x,f.y,f.z,.01),x=new Xe;return m.scale.setScalar(b),m.position.set(-((u.min.x+u.max.x)/2)*b,-u.min.y*b,-((u.min.z+u.max.z)/2)*b),x.add(m),i={group:x,height:f.y*b,width:f.x*b,depth:f.z*b,eyeY:f.y*b*.72,eyeZ:f.z*b/2+.02},S_.set(a.id,i),i}const l2=(a,i)=>{N(oe(.9,.9,.9,.12),i.body,0,.45,0,a),Vo(a,i,.7,.5,.5,.02,.02)},Dl={gold:"#fbbf24",diamond:"#67e8f9",neon:"#f472b6",holo:"#c4b5fd",glitch:"#22d3ee",rainbow:"#ffffff"},tm={},dm=new ha({color:"#ff0000",emissive:"#ff0000",emissiveIntensity:.55,metalness:.4,roughness:.25}),um=new ha({color:"#22d3ee",emissive:"#0ea5e9",emissiveIntensity:.6,metalness:.2,roughness:.3});function s2(a){if(tm[a])return tm[a];let i=null;switch(a){case"gold":i=new ha({color:"#f7c948",metalness:1,roughness:.2,emissive:"#3a2600",emissiveIntensity:.4});break;case"diamond":i=new Ph({color:"#c9f6ff",metalness:.15,roughness:.03,clearcoat:1,clearcoatRoughness:.02,emissive:"#1b7f99",emissiveIntensity:.35,envMapIntensity:2});break;case"neon":i=new ha({color:"#ff5fd7",emissive:"#ff2fd0",emissiveIntensity:1.1,roughness:.4});break;case"holo":i=new Ph({color:"#eef2ff",metalness:.6,roughness:.12,iridescence:1,iridescenceIOR:1.7,iridescenceThicknessRange:[120,900],emissive:"#6d28d9",emissiveIntensity:.15});break;case"glitch":i=um;break;case"rainbow":i=dm;break}return i&&(tm[a]=i),i}function r2(a){const i=a*.25%1;dm.color.setHSL(i,.95,.55),dm.emissive.setHSL((i+.05)%1,1,.45);const s=Math.floor(a*9)%5===0;um.color.set(s?"#f0f":"#22d3ee"),um.emissive.set(s?"#c026d3":"#0ea5e9")}function Is(a,i=null,s={}){const r=i2(a),m=new Xe,u=new Xe;m.add(u);const f=r.group.clone(!0);u.add(f);const _=i?s2(i):null;_&&f.traverse(y=>{y.isMesh&&(y.material=_)});const h=new Xe,b=[];if(s.eyes!==!1){const y=t2(r.width),v=new _e(y.whites,e2());v.position.set(0,r.eyeY,r.eyeZ);const w=new _e(y.pupils,n2());w.position.set(0,r.eyeY,r.eyeZ),w.userData.base=w.position.clone(),b.push(w),h.add(v,w),u.add(h)}const x=[];if(s.legs){const y=J("#1f2937",{rough:.7}),v=J("#f8fafc",{rough:.6});for(const w of[-1,1]){const A=new Xe;A.position.set(w*Math.min(.28,r.width*.22),.34,0);const z=new _e(I(.07,.34,.07),y);z.position.y=-.17;const D=new _e(I(.14,.06,.2),v);D.position.set(0,-.34,.04),A.add(z,D),m.add(A),x.push(A)}u.position.y=.34}return m.traverse(y=>{y.isMesh&&(y.castShadow=!0,y.receiveShadow=!1)}),{root:m,body:u,legs:x,eyes:h,height:r.height+(s.legs?.34:0),width:r.width,pupils:b}}const o2=()=>Ii("beam",()=>gn(8,128,a=>{const i=a.createLinearGradient(0,0,0,128);i.addColorStop(0,"rgba(255,255,255,0)"),i.addColorStop(.6,"rgba(255,255,255,0.35)"),i.addColorStop(1,"rgba(255,255,255,0.9)"),a.fillStyle=i,a.fillRect(0,0,8,128)}));function T_(a,i=9,s=.55){const r=new Nt({color:a,map:o2(),transparent:!0,depthWrite:!1,blending:Zs,side:Bl,toneMapped:!1,opacity:.8}),m=new _e(new B_(s*.6,s,i,16,1,!0),r);return m.position.y=i/2,m.renderOrder=2,m}function pg(a,i){const s=new _e(Tt(i,.04,Math.PI*2,6,40),$e(a));return s.rotation.x=Math.PI/2,s}const c2=()=>Ii("blob",()=>gn(64,64,a=>{const i=a.createRadialGradient(32,32,0,32,32,32);i.addColorStop(0,"rgba(0,0,0,0.55)"),i.addColorStop(1,"rgba(0,0,0,0)"),a.fillStyle=i,a.fillRect(0,0,64,64)}));function d2(a){const i=new _e(Dt(a*2,a*2),new Nt({map:c2(),transparent:!0,depthWrite:!1}));return i.rotation.x=-Math.PI/2,i.position.y=.02,i}function u2(){return Ii("dot",()=>gn(64,64,a=>{const i=a.createRadialGradient(32,32,0,32,32,32);i.addColorStop(0,"rgba(255,255,255,1)"),i.addColorStop(.35,"rgba(255,255,255,0.8)"),i.addColorStop(1,"rgba(255,255,255,0)"),a.fillStyle=i,a.fillRect(0,0,64,64)}))}function m2(a,i,s){const r=new Xe,m=new _e(ve(a*.5,a*.58,.42,24),J("#1b2238",{metal:.6,rough:.35}));m.position.y=.21,m.castShadow=!0,m.receiveShadow=!0;const u=new _e(ve(a*.52,a*.5,.06,24),J("#2b3552",{metal:.7,rough:.25}));u.position.y=.45,u.receiveShadow=!0;const f=pg(i,a*.52);f.position.y=.46,r.add(m,u,f);const _=new Nt({color:"#22c55e",transparent:!0,opacity:.25,toneMapped:!1}),h=new _e(oe(a*.9,.05,.55,.02),_);return h.position.set(0,.03,s),r.add(h),{root:r,ring:f,plate:h,plateMat:_}}const f2=a=>Ii("face"+a,()=>gn(64,64,i=>{i.clearRect(0,0,64,64),a?(i.fillStyle="#0b1020",i.fillRect(8,18,48,20),i.fillStyle="#22d3ee",i.shadowColor="#22d3ee",i.shadowBlur=8,i.fillRect(14,24,12,8),i.fillRect(38,24,12,8),i.fillRect(22,44,20,4)):(i.fillStyle="#0b0b0f",i.fillRect(16,22,8,12),i.fillRect(40,22,8,12),i.fillStyle="#ffffff",i.fillRect(18,24,3,4),i.fillRect(42,24,3,4),i.strokeStyle="#0b0b0f",i.lineWidth=4,i.beginPath(),i.arc(32,38,10,.15*Math.PI,.85*Math.PI),i.stroke())}));function zo(a){const i=new Xe,s=new Xe;i.add(s);const r=J(a.shirt,{rough:.6}),m=J(a.pants||"#1e293b",{rough:.7}),u=a.bot?J("#a8b3c7",{metal:.8,rough:.3}):J(a.skin||"#f2c9a0",{rough:.7}),f=$e(a.accent||"#22d3ee"),_=(q,V)=>{const Z=new Xe;return Z.position.set(q,V,0),s.add(Z),Z},h=_(-.17,.82),b=_(.17,.82);for(const q of[h,b]){const V=new _e(I(.28,.82,.3),m);V.position.y=-.41,V.castShadow=!0;const Z=new _e(I(.3,.12,.38),J("#0f172a"));Z.position.set(0,-.78,.04),q.add(V,Z)}const x=new _e(oe(.74,.76,.42,.06),r);x.position.y=1.2,x.castShadow=!0,s.add(x);const y=new _e(I(.76,.06,.44),f);y.position.y=1.02,s.add(y);const v=_(-.5,1.52),w=_(.5,1.52);for(const q of[v,w]){const V=new _e(oe(.24,.66,.26,.05),r);V.position.y=-.3,V.castShadow=!0;const Z=new _e(I(.22,.16,.24),u);Z.position.y=-.7,q.add(V,Z)}const A=new Xe;A.position.y=1.9,s.add(A);const z=new _e(oe(.58,.56,.56,.08),u);z.castShadow=!0,A.add(z);const D=new _e(Dt(.52,.52),new Nt({map:f2(!!a.bot),transparent:!0,toneMapped:!a.bot}));if(D.position.z=.285,A.add(D),a.bot){const q=new _e(ve(.02,.02,.3,6),J("#94a3b8",{metal:.9}));q.position.y=.42;const V=new _e(tn(.06,10,8),f);V.position.y=.6,A.add(q,V)}else{const q=new _e(oe(.6,.14,.58,.05),J("#2a1a12",{rough:.9}));q.position.y=.3,A.add(q)}if(a.crown){const q=new _e(ve(.24,.3,.2,8),J("#facc15",{metal:1,rough:.2}));q.position.y=.4,A.add(q)}const R=new Xe;return R.position.set(0,2.55,0),s.add(R),i.add(d2(.6)),{root:i,body:s,legL:h,legR:b,armL:v,armR:w,head:A,hold:R,walk:0}}function Xs(a,i,s){const r=s.speed>.3;a.walk+=i*(r?3+s.speed*1.1:0);const m=r?Math.sin(a.walk)*Math.min(.9,.25+s.speed*.08):0;if(a.legL.rotation.x=s.air?-.5:m,a.legR.rotation.x=s.air?.4:-m,s.carrying)a.armL.rotation.set(Math.PI-.15,0,.12),a.armR.rotation.set(Math.PI-.15,0,-.12);else if(s.grabbing){const u=Math.sin(s.t*30)*.15;a.armL.rotation.set(-1.4+u,0,0),a.armR.rotation.set(-1.4-u,0,0)}else s.emote?(a.armL.rotation.set(0,0,.3),a.armR.rotation.set(Math.PI*.85+Math.sin(s.t*12)*.4,0,-.2)):(a.armL.rotation.set(-m*.9,0,.05),a.armR.rotation.set(m*.9,0,-.05));a.body.position.y=r&&!s.air?Math.abs(Math.sin(a.walk))*.08:Math.sin(s.t*2)*.015}function Ul(a,i){const s=document.createElement("canvas");s.width=a,s.height=i;const r=s.getContext("2d"),m=new Y_(s);return m.colorSpace=fm,{tex:m,c:r,w:a,h:i}}const N_={basic:["#64748b","#94a3b8"],premium:["#1d4ed8","#38bdf8"],elite:["#6d28d9","#a855f7"],ultra:["#be185d","#e879f9"],event:["#c2410c","#fb923c"],secret:["#0b0612","#c084fc"]};function xe(a,i,s,r,m,u,f=!0){const _=new _e(i,s);return _.position.set(r,m,u),_.castShadow=f,_.receiveShadow=!0,a.add(_),_}function p2(a){const i=new Xe,s=[],r=gn(256,256,P=>{P.fillStyle="#0d1326",P.fillRect(0,0,256,256),P.strokeStyle="rgba(56,189,248,0.16)",P.lineWidth=2;for(let we=0;we<=256;we+=64)P.beginPath(),P.moveTo(we,0),P.lineTo(we,256),P.stroke(),P.beginPath(),P.moveTo(0,we),P.lineTo(256,we),P.stroke();P.fillStyle="rgba(232,121,249,0.08)",P.fillRect(0,0,4,4)},!0);r.repeat.set((It.maxX-It.minX+80)/8,(It.maxZ-It.minZ+80)/8);const m=new _e(new pm(It.maxX-It.minX+80,It.maxZ-It.minZ+80),new ha({map:r,roughness:.9,metalness:.1}));m.rotation.x=-Math.PI/2,m.receiveShadow=!0,m.name="ground",i.add(m);const u=J("#161d36",{rough:.8});for(const P of[-1,1]){const we=xe(i,I(et.x1-et.x0+30,.04,4.2),u,0,.02,P*3.8,!1);we.receiveShadow=!0,xe(i,I(et.x1-et.x0+30,.05,.12),$e(P>0?"#22d3ee":"#e879f9",.9),0,.03,P*5.95,!1)}const f=gn(128,128,P=>{P.fillStyle="#1a1f33",P.fillRect(0,0,128,128),P.strokeStyle="rgba(250,204,21,0.75)",P.lineWidth=10;for(let we=-1;we<3;we++)P.beginPath(),P.moveTo(20+we*64,20),P.lineTo(52+we*64,64),P.lineTo(20+we*64,108),P.stroke()},!0),_=et.x1-et.x0+8;f.repeat.set(_/3.4,1);const h=new _e(new Zo(_,et.height,et.width),[J("#11152a"),J("#11152a"),new ha({map:f,roughness:.6,metalness:.3,emissive:"#3b2f00",emissiveIntensity:.25}),J("#11152a"),J("#11152a"),J("#11152a")]);h.position.set(0,et.height/2,0),h.receiveShadow=!0,i.add(h);for(const P of[-1,1])xe(i,I(_,.16,.18),J("#2b3552",{metal:.8,rough:.3}),0,et.height+.05,P*(et.width/2+.05)),xe(i,I(_,.04,.05),$e("#22d3ee"),0,et.height+.14,P*(et.width/2+.05),!1);for(let P=et.x0;P<=et.x1;P+=6)xe(i,ve(.18,.18,et.width+.4,10),J("#394260",{metal:.8}),P,.12,0,!1).rotation.x=Math.PI/2;const b=(P,we,Je,ze)=>{const Le=new Xe;Le.position.set(P,0,0),i.add(Le);for(const At of[-1,1])xe(Le,oe(4.2,7.5,2.4,.2),J("#1b2238",{metal:.7,rough:.35}),0,3.75,At*3.4),xe(Le,I(.15,7,.15),$e(we),-2.15*ze,3.6,At*2.25,!1);xe(Le,oe(4.2,1.6,9.2,.2),J("#1b2238",{metal:.7,rough:.35}),0,7.9,0),xe(Le,I(4.3,.18,9.3),$e(we),0,7.05,0,!1);const Mt=gn(256,256,At=>{const On=At.createRadialGradient(128,128,10,128,128,128);On.addColorStop(0,"#ffffff"),On.addColorStop(.3,we),On.addColorStop(1,"#05030a"),At.fillStyle=On,At.fillRect(0,0,256,256),At.strokeStyle="rgba(255,255,255,0.35)",At.lineWidth=6;for(let Rn=0;Rn<6;Rn++)At.beginPath(),At.arc(128,128,20+Rn*18,Rn,Rn+2.4),At.stroke()},!0),Da=new Nt({map:Mt,toneMapped:!1,side:Bl,transparent:!0,opacity:.92}),dn=new _e(Dt(4.4,6.4),Da);return dn.rotation.y=Math.PI/2,dn.position.set(.3*ze,3.4,0),Le.add(dn),{tex:Mt,label:Je,pos:new be(P,9.8,0)}},x=b(et.x0-3.5,"#22d3ee","TECH FACTORY",1),y=b(et.x1+3.5,"#f43f5e","RECYCLER",-1),v=[],w=a.length;a.forEach((P,we)=>{const Je=-12+24*we/Math.max(1,w-1),ze=new Xe;ze.position.set(-81,0,Je),ze.rotation.y=Math.PI/2,i.add(ze);const[Le,Mt]=N_[P]||N_.basic;xe(ze,oe(3,1.4,2.6,.2),J("#1b2238",{metal:.6,rough:.35}),0,.7,0),xe(ze,oe(3.1,.12,2.7,.05),$e(Mt),0,1.45,0,!1),xe(ze,tn(1.25,24,16),J("#bfe7ff",{rough:.05,opacity:.18}),0,2.4,0,!1).scale.set(1,1.1,1);const dn=new ha({color:Le,emissive:Mt,emissiveIntensity:.55,metalness:.4,roughness:.3}),At=xe(ze,oe(1.1,1.1,1.1,.12),dn,0,2.35,0);xe(At,I(1.14,.18,1.14),$e(P==="secret"?"#c084fc":"#ffffff"),0,0,0,!1);const On=$e(Mt);xe(ze,Tt(1.3,.05,Math.PI*2,6,36),On,0,1.52,0,!1).rotation.x=Math.PI/2,xe(ze,I(2.2,.5,.1),$e("#0b1020"),0,.85,1.32,!1),s.push(At),v.push({id:P,group:ze,crate:At,light:On,pos:new be(-81,3.9,Je)})});const A=new Xe;A.position.set(-105,0,0),i.add(A),xe(A,I(10,12,44),J("#141b33",{metal:.5,rough:.5}),0,6,0);for(let P=2;P<12;P+=2.5)xe(A,I(10.2,.12,44.2),$e("#22d3ee",.8),0,P,0,!1);const z=Ul(1024,256),D=new _e(Dt(30,7.5),new Nt({map:z.tex,toneMapped:!1}));D.rotation.y=Math.PI/2,D.position.set(5.08,7.2,0),A.add(D);for(const P of[-7,0,7])xe(i,oe(3,1.1,4,.1),J("#1f2a4a",{metal:.5}),-97.5,.55,P),xe(i,I(3.05,.08,4.05),$e("#fbbf24"),-97.5,1.12,P,!1);const R=Ul(512,384),q=new Xe;q.position.set(81.5,0,-16),i.add(q),xe(q,I(1,9,1),J("#2b3552",{metal:.8}),0,4.5,-5.5),xe(q,I(1,9,1),J("#2b3552",{metal:.8}),0,4.5,5.5),xe(q,I(.6,7,12.5),J("#1b0f16"),0,5.5,0);const V=new _e(Dt(12,6.6),new Nt({map:R.tex,toneMapped:!1}));V.rotation.y=-Math.PI/2,V.position.set(-.32,5.5,0),q.add(V),xe(q,I(.7,.2,12.6),$e("#f43f5e"),0,9.05,0,!1);const Z=new Xe;Z.position.set(81.5,0,16),i.add(Z),xe(Z,oe(3,1.2,10,.15),J("#1f2a4a",{metal:.5}),0,.6,0),xe(Z,I(3.05,.1,10.05),$e("#4ade80"),0,1.22,0,!1),xe(Z,I(.4,6,.4),J("#2b3552",{metal:.8}),1,3,-4.6),xe(Z,I(.4,6,.4),J("#2b3552",{metal:.8}),1,3,4.6),xe(Z,I(.6,1.2,9.6),J("#12301f"),1,6.2,0);const ee=new Xe;ee.position.set(-.5,3.2,0),Z.add(ee),xe(ee,Tt(.9,.12,Math.PI*1.6,8,30),$e("#4ade80"),0,0,0,!1),xe(ee,Tt(.6,.1,Math.PI*1.6,8,30),$e("#22d3ee"),0,0,0,!1).rotation.z=Math.PI,s.push(ee);const ke=new Xe;ke.position.set(103.5,0,0),i.add(ke),xe(ke,I(13,1.4,24),J("#1b2238",{metal:.5}),0,.7,0),xe(ke,I(13.1,.1,24.1),$e("#e879f9"),0,1.42,0,!1);for(const P of[-11,11])xe(ke,I(.5,12,.5),J("#475569",{metal:.9}),-5,6,P);xe(ke,I(.5,.5,22.5),J("#475569",{metal:.9}),-5,12,0);const U=Ul(768,384),ie=new _e(Dt(18,9),new Nt({map:U.tex,toneMapped:!1}));ie.rotation.y=-Math.PI/2,ie.position.set(4,7.5,0),ke.add(ie),xe(ke,I(.4,9.4,18.4),J("#0b0f19"),4.25,7.5,0);const ye=Ul(256,512),it=new Xe;it.position.set(-73,0,-30),i.add(it),xe(it,ve(1.6,2.4,1,6),J("#1b2238",{metal:.7}),0,.5,0),xe(it,ve(.9,1.4,11,4),J("#141b33",{metal:.7,rough:.3}),0,6.5,0).rotation.y=Math.PI/4;const mt=new _e(Dt(1.8,3.6),new Nt({map:ye.tex,toneMapped:!1}));mt.position.set(0,6,1.18),mt.rotation.x=.05,it.add(mt);const le=xe(it,ve(.6,.8,.8,8),$e("#fbbf24"),0,12.6,0,!1);s.push(le);const Q=Ul(256,256),ge=new Xe;ge.position.set(-73,0,30),i.add(ge),xe(ge,oe(3.4,3,3.4,.3),J("#1b2238",{metal:.6}),0,1.5,0);const ne=new _e(Dt(2.6,2.6),new Nt({map:Q.tex,toneMapped:!1}));ne.position.set(0,1.6,-1.72),ne.rotation.y=Math.PI,ge.add(ne);const K=xe(ge,I(.5,1.6,.5),$e("#fde047"),0,5,0,!1);xe(ge,I(.5,.5,.5),$e("#fde047"),0,3.8,0,!1),s.push(K);const ue=Ul(256,128),ce=new Xe;ce.position.set(84,0,33),i.add(ce),xe(ce,I(8,.8,10),J("#e2e8f0",{rough:.8}),0,.4,0);for(const P of[-4,-1.35,1.35,4])xe(ce,ve(.35,.35,5.5,12),J("#f1f5f9",{rough:.7}),-3.4,3.5,P);xe(ce,I(8.4,.8,10.4),J("#e2e8f0",{rough:.8}),0,6.6,0);const tt=xe(ce,ve(.01,6,2.2,4),J("#cbd5e1"),0,8.1,0);tt.rotation.y=Math.PI/4,tt.scale.set(1,1,1.2);const Ae=new _e(Dt(4,2),new Nt({map:ue.tex,toneMapped:!1}));Ae.rotation.y=-Math.PI/2,Ae.position.set(-4.25,6.6,0),ce.add(Ae);const Lt=J("#2b3552",{metal:.8,rough:.3});for(let P=et.x0+4;P<=et.x1-4;P+=11)for(const we of[-1,1])xe(i,ve(.08,.1,4.2,8),Lt,P,2.1,we*5.6,!1),xe(i,I(.9,.12,.3),Lt,P,4.2,we*5.3,!1),xe(i,I(.7,.06,.22),$e(we>0?"#a5f3fc":"#f5d0fe"),P,4.12,we*5.2,!1);const $n=["#22d3ee","#e879f9","#a3e635"];[[-66,-14],[-66,14],[66,-8],[66,8],[-92,-30],[-92,30],[95,-30],[95,30],[-60,-38],[60,38],[-30,38],[30,-38]].forEach(([P,we],Je)=>{xe(i,ve(.25,.35,2,8),J("#3b2a1a"),P,1,we),xe(i,ve(0,1.6,3.6,6),J($n[Je%3],{emissive:$n[Je%3],ei:.45,flat:!0}),P,3.8,we)});const S=gn(64,128,P=>{P.fillStyle="#0a0f22",P.fillRect(0,0,64,128);for(let we=4;we<128;we+=10)for(let Je=4;Je<64;Je+=12){const ze=Math.random()<.45;P.fillStyle=ze?Math.random()<.5?"#fde68a":"#7dd3fc":"#141b33",P.fillRect(Je,we,7,5)}},!0),X=new Nt({map:S,color:"#b8c4e8"}),me=new Ko(new Zo(1,1,1),X,70),fe=new Ws;let Qe=0;const Ce=(P,we)=>P+Math.random()*(we-P);for(let P=0;P<70;P++){const we=P%4;let Je=0,ze=0;we===0?(Je=Ce(-150,150),ze=Ce(-95,-70)):we===1?(Je=Ce(-150,150),ze=Ce(70,95)):we===2?(Je=Ce(-160,-135),ze=Ce(-70,70)):(Je=Ce(135,160),ze=Ce(-70,70));const Le=Ce(18,70),Mt=Ce(8,16);fe.compose(new be(Je,Le/2,ze),new hm,new be(Mt,Le,Mt)),me.setMatrixAt(Qe++,fe)}i.add(me);const We=new G_,se=new Float32Array(600*3);for(let P=0;P<600;P++){const we=Math.random()*Math.PI*2,Je=.15+Math.random()*1.2,ze=320;se[P*3]=Math.cos(we)*Math.cos(Je)*ze,se[P*3+1]=Math.sin(Je)*ze,se[P*3+2]=Math.sin(we)*Math.cos(Je)*ze}We.setAttribute("position",new Hl(se,3));const Te=new I_(We,new bv({color:"#dbeafe",size:1.4,sizeAttenuation:!1,fog:!1}));i.add(Te);const bn={drops:new be(-81,7.5,0),market:new be(-100,13.5,0),leaderboard:new be(-73,14.5,-30),quests:new be(-73,7,30),raid:new be(81.5,10.5,-16),trade:new be(81.5,7.8,16),event:new be(103.5,13.5,0),collection:new be(84,10.2,33),factory:x.pos,recycler:y.pos};for(const P of fi)bn[P.id]||(bn[P.id]=new be(P.anchor.x,6,P.anchor.z));return{group:i,beltTex:f,portalTexA:x.tex,portalTexB:y.tex,screens:{market:z,raid:R,stage:U,fame:ye,kiosk:Q,museum:ue},machines:v,zoneLabelPos:bn,spinners:s,update(P,we){f.offset.x-=we*(1/3.4)*((et.x1-et.x0)/36),x.tex.rotation=P*.8,x.tex.center.set(.5,.5),y.tex.rotation=-P*.8,y.tex.center.set(.5,.5);for(const Je of s)Je.rotation.y+=we*1.2}}}const fa=1600,E_=260,nm=420,$o=new Ws,Oo=new hm,Ro=new xv,qo=new be,Ll=new tc;class h2{constructor(){this.group=new Xe,this.sPos=new Float32Array(fa*3),this.sVel=new Float32Array(fa*3),this.sCol=new Float32Array(fa*3),this.sSize=new Float32Array(fa),this.sLife=new Float32Array(fa),this.sMax=new Float32Array(fa),this.sGrav=new Float32Array(fa),this.sAlpha=new Float32Array(fa),this.sNext=0,this.sGeo=new G_,this.coins=[],this.conf=[],this.rings=[],this.lowQuality=!1,this.sGeo.setAttribute("position",new Hl(this.sPos,3).setUsage(Ol)),this.sGeo.setAttribute("color",new Hl(this.sCol,3).setUsage(Ol)),this.sGeo.setAttribute("size",new Hl(this.sSize,1).setUsage(Ol)),this.sGeo.setAttribute("alpha",new Hl(this.sAlpha,1).setUsage(Ol));const i=new yv({uniforms:{map:{value:u2()},scale:{value:400}},vertexShader:`
        attribute float size; attribute float alpha; attribute vec3 color;
        varying vec3 vColor; varying float vAlpha; uniform float scale;
        void main() {
          vColor = color; vAlpha = alpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * scale / max(0.1, -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,fragmentShader:`
        uniform sampler2D map; varying vec3 vColor; varying float vAlpha;
        void main() {
          vec4 t = texture2D(map, gl_PointCoord);
          if (vAlpha <= 0.0) discard;
          gl_FragColor = vec4(vColor * 1.6, t.a * vAlpha);
        }`,transparent:!0,depthWrite:!1,blending:Zs,toneMapped:!1}),s=new I_(this.sGeo,i);s.frustumCulled=!1,this.group.add(s),this.coinMesh=new Ko(ve(.16,.16,.04,14),J("#fbbf24",{metal:1,rough:.25,emissive:"#6b4a00",ei:.6}),E_),this.coinMesh.instanceMatrix.setUsage(Ol),this.coinMesh.count=0,this.coinMesh.frustumCulled=!1,this.group.add(this.coinMesh);const r=new Nt({side:Bl,toneMapped:!1});this.confMesh=new Ko(new pm(.16,.09),r,nm),this.confMesh.instanceMatrix.setUsage(Ol),this.confMesh.instanceColor=new vv(new Float32Array(nm*3),3),this.confMesh.count=0,this.confMesh.frustumCulled=!1,this.group.add(this.confMesh)}setPixelScale(i){this.group.children[0].material.uniforms.scale.value=i*.55}spark(i,s={}){let r=s.n??20;this.lowQuality&&(r=Math.ceil(r/3));const m=Ll.set(s.color??"#fde047");for(let u=0;u<r;u++){const f=this.sNext;this.sNext=(this.sNext+1)%fa;const _=Math.random()*Math.PI*2,h=(Math.random()-.3)*Math.PI*(s.spread??.9),b=(s.speed??4)*(.35+Math.random()*.8);this.sPos[f*3]=i.x+(Math.random()-.5)*.2,this.sPos[f*3+1]=i.y+(Math.random()-.5)*.2,this.sPos[f*3+2]=i.z+(Math.random()-.5)*.2,this.sVel[f*3]=Math.cos(_)*Math.cos(h)*b,this.sVel[f*3+1]=Math.sin(h)*b+(s.up??2),this.sVel[f*3+2]=Math.sin(_)*Math.cos(h)*b,s.rainbow&&Ll.setHSL(Math.random(),1,.6),this.sCol[f*3]=s.rainbow?Ll.r:m.r,this.sCol[f*3+1]=s.rainbow?Ll.g:m.g,this.sCol[f*3+2]=s.rainbow?Ll.b:m.b,s.rainbow||Ll.copy(m),this.sSize[f]=(s.size??.35)*(.6+Math.random()*.8),this.sLife[f]=0,this.sMax[f]=(s.life??.9)*(.6+Math.random()*.7),this.sGrav[f]=s.gravity??6,this.sAlpha[f]=1}}coinsBurst(i,s,r=null){this.lowQuality&&(s=Math.ceil(s/2));for(let m=0;m<s;m++){this.coins.length>=E_&&this.coins.shift();const u=Math.random()*Math.PI*2,f=2+Math.random()*3.5;this.coins.push({p:i.clone().add(new be((Math.random()-.5)*.4,Math.random()*.3,(Math.random()-.5)*.4)),v:new be(Math.cos(u)*f*.6,4+Math.random()*4,Math.sin(u)*f*.6),life:0,max:r?1.6:1.4+Math.random()*.6,spin:(Math.random()-.5)*20,target:r,delay:m*.012})}}confetti(i,s=120,r=4){this.lowQuality&&(s=Math.ceil(s/3));for(let m=0;m<s;m++){this.conf.length>=nm&&this.conf.shift();const u=Math.random()*Math.PI*2,f=Math.random()*r;this.conf.push({p:i.clone(),v:new be(Math.cos(u)*f,5+Math.random()*6,Math.sin(u)*f),r:new be(Math.random()*6,Math.random()*6,Math.random()*6),w:new be((Math.random()-.5)*14,(Math.random()-.5)*14,(Math.random()-.5)*14),life:0,max:2.2+Math.random()*1.5,col:new tc().setHSL(Math.random(),.9,.6)})}}ring(i,s,r=5,m=.7){const u=new _e(new wv(.8,1,48),new Nt({color:s,transparent:!0,side:Bl,depthWrite:!1,blending:Zs,toneMapped:!1}));u.rotation.x=-Math.PI/2,u.position.copy(i),u.position.y+=.08,this.group.add(u),this.rings.push({m:u,life:0,max:m,to:r})}update(i){for(let u=0;u<fa;u++)if(!(this.sAlpha[u]<=0)){if(this.sLife[u]+=i,this.sLife[u]>=this.sMax[u]){this.sAlpha[u]=0;continue}this.sVel[u*3+1]-=this.sGrav[u]*i,this.sVel[u*3]*=.985,this.sVel[u*3+2]*=.985,this.sPos[u*3]+=this.sVel[u*3]*i,this.sPos[u*3+1]+=this.sVel[u*3+1]*i,this.sPos[u*3+2]+=this.sVel[u*3+2]*i,this.sAlpha[u]=1-this.sLife[u]/this.sMax[u]}this.sGeo.attributes.position.needsUpdate=!0,this.sGeo.attributes.alpha.needsUpdate=!0,this.sGeo.attributes.color.needsUpdate=!0,this.sGeo.attributes.size.needsUpdate=!0;let s=0;this.coins=this.coins.filter(u=>{if(u.delay-=i,u.delay>0)return!0;if(u.life+=i,u.life>u.max)return!1;if(u.target&&u.life>.45){const _=Math.min(1,(u.life-.45)/.5);if(u.p.lerp(u.target,.12+_*.35),u.p.distanceToSquared(u.target)<.15)return!1}else u.v.y-=14*i,u.p.addScaledVector(u.v,i),u.p.y<.05&&(u.p.y=.05,u.v.y*=-.35,u.v.x*=.6,u.v.z*=.6);Ro.set(Math.PI/2,u.life*u.spin,0),Oo.setFromEuler(Ro);const f=u.max-u.life<.25?(u.max-u.life)/.25:1;return qo.setScalar(f),$o.compose(u.p,Oo,qo),this.coinMesh.setMatrixAt(s++,$o),!0}),this.coinMesh.count=s,this.coinMesh.instanceMatrix.needsUpdate=!0;let r=0;const m=[];for(const u of this.conf)u.life+=i,!(u.life>u.max)&&(u.v.y-=7*i,u.v.multiplyScalar(.985),u.v.y<-2.2&&(u.v.y=-2.2),u.p.addScaledVector(u.v,i),u.r.addScaledVector(u.w,i),Ro.set(u.r.x,u.r.y,u.r.z),Oo.setFromEuler(Ro),qo.setScalar(1),$o.compose(u.p,Oo,qo),this.confMesh.setMatrixAt(r,$o),this.confMesh.setColorAt(r,u.col),r++,m.push(u));this.conf=m,this.confMesh.count=r,this.confMesh.instanceMatrix.needsUpdate=!0,this.confMesh.instanceColor&&(this.confMesh.instanceColor.needsUpdate=!0),this.rings=this.rings.filter(u=>{u.life+=i;const f=u.life/u.max;return f>=1?(this.group.remove(u.m),u.m.geometry.dispose(),u.m.material.dispose(),!1):(u.m.scale.setScalar(.5+f*u.to),u.m.material.opacity=1-f,!0)})}}const Jt=new be;class _2{constructor(i){this.labels=new Map,this.root=document.createElement("div"),this.root.className="label-layer",i.appendChild(this.root)}destroy(){this.root.remove(),this.labels.clear()}get(i){return this.labels.get(i)}set(i,s){let r=this.labels.get(i);if(!r){const m=document.createElement("div");m.className="wlabel "+(s.cls||""),this.root.appendChild(m),r={el:m,target:null,pos:new be,offsetY:0,maxDist:40,html:"",cls:s.cls||"",visible:!0,scaleWithDistance:s.scale!==!1},this.labels.set(i,r)}return r.target=s.target??null,s.pos&&r.pos.copy(s.pos),r.offsetY=s.offsetY??0,r.maxDist=s.maxDist??40,r.scaleWithDistance=s.scale!==!1,s.cls!==void 0&&s.cls!==r.cls&&(r.cls=s.cls,r.el.className="wlabel "+s.cls),s.html!==r.html&&(r.html=s.html,r.el.innerHTML=s.html),r.visible=!0,r}hide(i){const s=this.labels.get(i);s&&(s.visible=!1)}remove(i){const s=this.labels.get(i);s&&(s.el.remove(),this.labels.delete(i))}removePrefix(i){for(const s of[...this.labels.keys()])s.startsWith(i)&&this.remove(s)}keys(){return this.labels.keys()}update(i,s,r){const m=i.position;for(const u of this.labels.values()){if(!u.visible){u.el.style.display!=="none"&&(u.el.style.display="none");continue}if(u.target){if(!u.target.parent){u.el.style.display="none";continue}u.target.getWorldPosition(Jt)}else Jt.copy(u.pos);Jt.y+=u.offsetY;const f=Jt.distanceTo(m);if(f>u.maxDist){u.el.style.display!=="none"&&(u.el.style.display="none");continue}if(Jt.project(i),Jt.z>1||Jt.z<-1||Jt.x<-1.3||Jt.x>1.3||Jt.y<-1.3||Jt.y>1.3){u.el.style.display!=="none"&&(u.el.style.display="none");continue}const _=(Jt.x*.5+.5)*s,h=(-Jt.y*.5+.5)*r,b=u.scaleWithDistance?Math.max(.55,Math.min(1.15,14/f)):1;u.el.style.display==="none"&&(u.el.style.display=""),u.el.style.transform=`translate3d(${_.toFixed(1)}px, ${h.toFixed(1)}px, 0) translate(-50%, -100%) scale(${b.toFixed(3)})`,u.el.style.zIndex=String(1e3-Math.round(f))}}}class g2{constructor(i){this.root=document.createElement("div"),this.root.className="pop-layer",i.appendChild(this.root)}destroy(){this.root.remove()}at(i,s,r,m,u,f="",_=1){if(Jt.copy(m).project(i),Jt.z>1)return;const h=(Jt.x*.5+.5)*s,b=(-Jt.y*.5+.5)*r;this.screen(h,b,u,f,_)}screen(i,s,r,m="",u=1){this.root.childElementCount>40&&this.root.firstElementChild?.remove();const f=document.createElement("div");f.className="pop "+m,f.textContent=r,f.style.left=i+"px",f.style.top=s+"px",f.style.fontSize=22*u+"px",f.style.setProperty("--dx",(Math.random()-.5)*40+"px"),this.root.appendChild(f),window.setTimeout(()=>f.remove(),1500)}}const pt=X_(()=>({prompt:null,hover:null,selected:null,here:null,fade:0,home:null})),M_={market:"market",drops:"drops",raid:"raid",trade:"trade",event:"event",leaderboard:"leaderboard",quests:"quests",collection:"collection"},b2=7.2,y2=10.5,v2=6.4,A_=.45,Ye=new be,Vs=new be;class w2{constructor(i,s){this.scene=new jv,this.camera=new kv(55,1,.1,700),this.composer=null,this.bloom=null,this.fx=new h2,this.raf=0,this.last=0,this.t=0,this.w=1,this.h=1,this.quality="high",this.slowmo=0,this.pos=new be(hi.x,0,hi.z),this.vel=new be,this.vy=0,this.grounded=!0,this.facing=Math.PI,this.speedNow=0,this.keys=new Set,this.joy={x:0,y:0},this.sprint=!1,this.target=null,this.chaseId=null,this.beltFocus=null,this.emote=null,this.carryModel=null,this.lastPromptKey="",this.camYaw=Math.PI,this.camPitch=.62,this.camDist=14,this.yawGoal=null,this.shake=0,this.fovKick=0,this.drag=null,this.touches=new Map,this.pinch=0,this.colliders=E1(),this.plots=new Map,this.assign=new Map,this.ownerPlot=new Map,this.lastWorldAt=-1,this.lastItemsRef=null,this.lastMeSig="",this.belt=new Map,this.lastBeltAt=-1,this.walkers=new Map,this.shopkeepers=[],this.bubble=null,this.peers=new Map,this.chasers=[],this.chaseRaid="",this.pickables=[],this.raycaster=new Sv,this.groundPlane=new Tv(new be(0,1,0),0),this.localAccrued=new Map,this.arriving=new Map,this.flyers=[],this.coinsAt=0,this.plateCooldown=new Map,this.onPlate=null,this.onColPad=!1,this.combo=0,this.comboAt=0,this.lockCooldown=0,this.collectAllCooldown=0,this.baseInfo=new Map,this.tagged=new Set,this.lastStealSig="",this.deliverTry=0,this.grabPos=null,this.lastSteal=null,this.screensAt=0,this.homeAt=0,this.hoverAt=0,this.mapAt=0,this.lastFocus=null,this.knock=new be,this.stepAt=0,this.travelSeq=0,this.resize=()=>{const h=this.canvas.getBoundingClientRect();this.w=Math.max(1,h.width),this.h=Math.max(1,h.height);const b=Math.min(window.devicePixelRatio||1,this.quality==="high"?1.75:1);this.renderer.setPixelRatio(b),this.renderer.setSize(this.w,this.h,!1),this.camera.aspect=this.w/this.h,this.camera.updateProjectionMatrix(),this.composer?.setSize(this.w,this.h),this.composer?.setPixelRatio(b),this.fx.setPixelScale(this.h),this.w<700&&this.camDist>15&&(this.camDist=15)},this.frame=h=>{this.raf=requestAnimationFrame(this.frame);let b=Math.min(.05,(h-(this.last||h))/1e3);this.last=h,this.slowmo>0&&(this.slowmo-=b,b*=.35),this.t+=b;try{this.update(b,h),this.render()}catch(x){console.error(x)}},this.bootAt=Date.now(),this.onKey=h=>{if(this.typing(h))return;const b=h.key.toLowerCase();if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright","shift"].includes(b)){if(G().panel&&b.startsWith("arrow"))return;this.keys.add(b),this.target=null,b.startsWith("arrow")&&h.preventDefault()}else b===" "&&!G().panel?(this.jump(),h.preventDefault()):(b==="e"||b==="enter")&&!G().panel&&(h.repeat||this.interact(),h.preventDefault())},this.onKeyUp=h=>this.keys.delete(h.key.toLowerCase()),this.onBlur=()=>this.keys.clear(),this.onPointerDown=h=>{if(this.canvas.setPointerCapture?.(h.pointerId),this.touches.set(h.pointerId,{x:h.clientX,y:h.clientY}),this.touches.size===2){const[b,x]=[...this.touches.values()];this.pinch=Math.hypot(b.x-x.x,b.y-x.y),this.drag=null;return}this.drag={id:h.pointerId,x:h.clientX,y:h.clientY,moved:!1,button:h.button}},this.onPointerMove=h=>{if(this.touches.has(h.pointerId)&&this.touches.set(h.pointerId,{x:h.clientX,y:h.clientY}),this.touches.size===2){const[b,x]=[...this.touches.values()],y=Math.hypot(b.x-x.x,b.y-x.y);this.pinch>0&&(this.camDist=am(this.camDist*(this.pinch/Math.max(1,y)),5,28)),this.pinch=y;return}if(this.drag&&this.drag.id===h.pointerId){const b=h.clientX-this.drag.x,x=h.clientY-this.drag.y;!this.drag.moved&&Math.hypot(b,x)>6&&(this.drag.moved=!0),this.drag.moved&&(this.yawGoal=null,this.camYaw-=b*.006,this.camPitch=am(this.camPitch+x*.004,.12,1.3),this.drag.x=h.clientX,this.drag.y=h.clientY);return}if(h.pointerType==="mouse"){const b=performance.now();if(b-this.hoverAt<60)return;this.hoverAt=b;const x=this.pick(h.clientX,h.clientY),y=pt.getState().hover;if(x){const v=this.canvas.getBoundingClientRect(),w=h.clientX-v.left,A=h.clientY-v.top;if(!y||y.itemId!==x.itemId||Math.abs(y.sx-w)>4||Math.abs(y.sy-A)>4){const z=x.beltId?this.belt.get(x.beltId):null;pt.setState({hover:{itemId:x.itemId,ownerName:z?"Tech Belt":x.ownerName||"",mutation:x.mutation,price:z?.row.price,sx:w,sy:A}})}this.canvas.style.cursor="pointer"}else y&&pt.setState({hover:null}),this.canvas.style.cursor="grab"}},this.onPointerUp=h=>{this.touches.delete(h.pointerId),this.touches.size<2&&(this.pinch=0);const b=this.drag;!b||b.id!==h.pointerId||(this.drag=null,!(b.moved||b.button===2)&&this.click(h.clientX,h.clientY))},this.onWheel=h=>{this.camDist=am(this.camDist*(1+h.deltaY*.0012),5,28)},this.canvas=i,this.renderer=new Nv({canvas:i,antialias:!0,powerPreference:"high-performance"}),this.renderer.outputColorSpace=fm,this.renderer.toneMapping=Ev,this.renderer.toneMappingExposure=.95,this.renderer.shadowMap.type=Mv,this.scene.background=new tc("#0a0f24"),this.scene.fog=new Av("#0a0f24",70,230);const r=new Cv(this.renderer);this.scene.environment=r.fromScene(new zv,.04).texture,this.scene.environmentIntensity=.42,r.dispose();const m=new $v("#9db8ff","#2a1740",.75);this.scene.add(m),this.sun=new Ov("#fff4e0",1.25),this.sun.position.set(30,60,25),this.sun.shadow.mapSize.set(2048,2048);const u=this.sun.shadow.camera;u.left=-38,u.right=38,u.top=38,u.bottom=-38,u.near=1,u.far=160,this.sun.shadow.bias=-8e-4,this.scene.add(this.sun,this.sun.target);const f=G();this.scenery=p2((f.catalog?.drops||[]).map(h=>h.id)),this.scene.add(this.scenery.group),this.scene.add(this.fx.group),this.labels=new _2(s),this.pops=new g2(s),this.minimap=document.createElement("canvas"),this.minimap.className="minimap",this.minimap.width=220,this.minimap.height=110,s.appendChild(this.minimap);const _=f.me;this.rig=zo({shirt:`hsl(${Yl(_?.id||"me")},70%,52%)`,accent:"#fde047",crown:(_?.prestige||0)>0}),this.scene.add(this.rig.root),this.pos.set(hi.x,0,hi.z),this.facing=0,this.buildShopkeepers(),this.buildZoneLabels(),this.coinStacks=new Ko(ve(.15,.15,.045,14),J("#fbbf24",{metal:1,rough:.28,emissive:"#5a3a00",ei:.5}),600),this.coinStacks.count=0,this.coinStacks.frustumCulled=!1,this.scene.add(this.coinStacks),this.applyQuality(!0),this.resize(),window.addEventListener("resize",this.resize),window.addEventListener("keydown",this.onKey),window.addEventListener("keyup",this.onKeyUp),window.addEventListener("blur",this.onBlur),i.addEventListener("pointerdown",this.onPointerDown),i.addEventListener("pointermove",this.onPointerMove),i.addEventListener("pointerup",this.onPointerUp),i.addEventListener("pointercancel",this.onPointerUp),i.addEventListener("pointerleave",()=>pt.setState({hover:null})),i.addEventListener("wheel",this.onWheel,{passive:!0}),i.addEventListener("contextmenu",h=>h.preventDefault()),this.raf=requestAnimationFrame(this.frame)}destroy(){cancelAnimationFrame(this.raf),window.removeEventListener("resize",this.resize),window.removeEventListener("keydown",this.onKey),window.removeEventListener("keyup",this.onKeyUp),window.removeEventListener("blur",this.onBlur),this.labels.destroy(),this.pops.destroy(),this.minimap.remove(),this.renderer.dispose()}setJoystick(i,s){this.joy={x:i,y:s},(i||s)&&(this.target=null)}setSprint(i){this.sprint=i}jump(){!this.grounded||this.stealPhase()==="grab"||(this.vy=8.2,this.grounded=!1,te("jump"),this.fx.spark(this.pos.clone().setY(.1),{n:8,color:"#a5f3fc",speed:2,up:.5,size:.25}))}interact(){const i=pt.getState().prompt;if(!(!i||i.disabled))switch(i.kind){case"zone":te("click"),De(M_[i.id]);break;case"plot":te("click"),i.mine?De("base"):i.playerId&&De("visit",{playerId:i.playerId});break;case"belt":this.tryBuy(Number(i.id));break;case"steal":this.tryStartSteal(i.id);break;case"grab":Xo("abort");break;case"tag":this.tryTag(i.id);break}}doEmote(i){this.emote={e:i,until:performance.now()+3e3},this.fx.spark(Ye.copy(this.pos).setY(2.6),{n:14,color:"#fde047",speed:3})}travelTo(i,s,r=!0){pt.setState({fade:1,selected:null}),te("whoosh");const m=++this.travelSeq;window.setTimeout(()=>{m===this.travelSeq&&(this.pos.set(i,0,s),this.vel.set(0,0,0),this.target=null,r&&(this.facing=s>0?0:Math.PI,this.camYaw=s>0?Math.PI:0),this.snapCamera(),pt.setState({fade:0}))},180)}travelHome(){this.travelTo(hi.x,hi.z)}travelToZone(i){const s=fi.find(u=>u.id===i);if(!s)return;this.travelTo(s.anchor.x,s.anchor.z,!1);const r=s.anchor.x<0,m=Math.abs(s.anchor.z)>20?Math.sign(s.anchor.z):0;window.setTimeout(()=>{this.camYaw=Math.atan2(r?1:-1,-m*.8),this.facing=Math.atan2(r?-1:1,m*.8),this.yawGoal=null,this.snapCamera()},200)}travelToPlot(i){const s=this.ownerPlot.get(i);if(s){const r=ql(s);this.travelTo(r.x,r.z)}}plotOf(i){return this.ownerPlot.get(i)}stealFromPanel(i,s,r=!1){const m=this.findPodium(i,s);if(!m){Io(s,r).catch(()=>{});return}const u=m.plate;this.travelTo(u.x,u.z,!1),this.facing=Math.atan2(m.pos.x-u.x,m.pos.z-u.z),window.setTimeout(()=>{this.grabPos=m.pos.clone(),Io(s,r).catch(()=>{})},260)}debugState(){const i=this.renderer.info.render;return{calls:i.calls,triangles:i.triangles,x:this.pos.x,z:this.pos.z,prompt:pt.getState().prompt,belt:[...this.belt.values()].filter(s=>s.model.root.visible&&!s.leave).map(s=>({id:s.row.id,item:s.row.item_id,x:s.model.root.position.x,price:s.row.price,sold:!!s.row.sold_to})),plots:[...this.plots.values()].map(s=>({index:s.def.index,owner:s.owner.username,items:s.podiums.filter(r=>r.piid).length})),walkers:this.walkers.size}}teleport(i,s){this.travelSeq++,pt.setState({fade:0}),this.pos.set(i,0,s),this.target=null,this.snapCamera()}applyQuality(i=!1){const s=G().settings.quality;!i&&s===this.quality||(this.quality=s,this.renderer.shadowMap.enabled=s==="high",this.sun.castShadow=s==="high",this.fx.lowQuality=s==="low",s==="high"?(this.composer=new Rv(this.renderer),this.composer.addPass(new qv(this.scene,this.camera)),this.bloom=new Dv(new sm(this.w/2,this.h/2),.62,.5,.9),this.composer.addPass(this.bloom),this.composer.addPass(new Uv)):(this.composer?.dispose(),this.composer=null,this.bloom=null),this.scene.traverse(r=>{const m=r;if(m.isMesh&&m.material){const u=Array.isArray(m.material)?m.material:[m.material];for(const f of u)f.needsUpdate=!0}}),this.resize())}buildShopkeepers(){[[-95,3,"#f59e0b","Max the Broker",["Prices move every few seconds.","Low supply + high demand = 📈","Buy low, flip it later."]],[-72,11,"#e879f9","Dropmaster Dee",["Feeling lucky?","Secrets are out there…","3% of drops come out MUTATED!"]],[73,-9,"#f43f5e","The Fixer",["Grab it, then RUN.","Owners can tag you. Be quick.","Locked bases? Wait them out."]],[73,9,"#4ade80","Deal-Maker Dex",["Both sides must confirm.","NPCs love a premium offer.","Fair trades make friends."]],[89,6,"#22d3ee","MC Volt",["Events shake up the whole city!","Watch the belt during events.","Make some noise!"]]].forEach(([s,r,m,u,f],_)=>{const h=zo({shirt:m,accent:"#ffffff",crown:_===0});h.root.position.set(s,0,r),h.root.rotation.y=s<0?Math.PI/2:-Math.PI/2,this.scene.add(h.root);const b="shop"+_;this.shopkeepers.push({rig:h,pos:new be(s,0,r),lines:f,name:u,key:b}),this.labels.set(b,{target:h.root,offsetY:2.9,html:`<span class="nm npc">${u}</span>`,cls:"tag",maxDist:34})})}buildZoneLabels(){for(const s of fi){const r=this.scenery.zoneLabelPos[s.id];this.labels.set("zone:"+s.id,{pos:r,html:`<span class="zn">${s.icon} ${s.label}</span>`,cls:"zone",maxDist:120,scale:!1})}this.labels.set("zone:factory",{pos:this.scenery.zoneLabelPos.factory,html:'<span class="zn">🏭 TECH FACTORY</span>',cls:"zone",maxDist:120,scale:!1}),this.labels.set("zone:recycler",{pos:this.scenery.zoneLabelPos.recycler,html:'<span class="zn">♻️ RECYCLER</span>',cls:"zone",maxDist:120,scale:!1});const i=G().catalog?.drops||[];for(const s of this.scenery.machines){const r=i.find(m=>m.id===s.id);r&&this.labels.set("mach:"+s.id,{pos:s.pos,html:`<b>${r.name}</b><i>${Ue(r.price)}</i>`,cls:"mach",maxDist:40})}}update(i,s){G(),Math.floor(this.t*2)!==Math.floor((this.t-i)*2)&&this.applyQuality(),r2(this.t),this.syncPlots(),this.syncBelt(),this.syncWalkers(),this.syncSteal(),this.focusRequests(),this.updatePlayer(i),this.updateCamera(i),this.updatePlots(i),this.updateBelt(i),this.updateWalkers(i),this.updateChasers(i),this.updatePeers(i),this.updateShopkeepers(i,s),this.updateInteractions(i),this.updateFlyers(i),s-this.coinsAt>200&&(this.coinsAt=s,this.updateCoinStacks()),this.fx.update(i),this.scenery.update(this.t,i);for(const r of this.scenery.machines)r.crate.position.y=2.35+Math.sin(this.t*2+r.pos.z)*.12;s-this.screensAt>2e3&&(this.screensAt=s,this.drawScreens()),s-this.mapAt>140&&(this.mapAt=s,this.drawMinimap()),this.sun.position.set(this.pos.x+30,60,this.pos.z+25),this.sun.target.position.set(this.pos.x,0,this.pos.z)}render(){this.labels.update(this.camera,this.w,this.h),this.composer?this.composer.render():this.renderer.render(this.scene,this.camera)}syncPlots(){const i=G(),s=i.me;if(!s)return;const r=`${s.slots}|${s.security_level}|${JSON.stringify(s.cosmetics)}|${s.lock_until}|${s.shield_until}`,m=(i.last?.incoming_raids||[]).map(v=>v.id+v.phase).join(",");if(i.worldAt===this.lastWorldAt&&i.myItems===this.lastItemsRef&&r+m===this.lastMeSig)return;this.lastWorldAt=i.worldAt,this.lastItemsRef=i.myItems,this.lastMeSig=r+m;const u=i.world.filter(v=>v.id!==s.id),f=new Set(u.map(v=>v.id));for(const[v,w]of this.assign)(!f.has(v)||w===0)&&this.assign.delete(v);const _=new Set(this.assign.values()),h=u.find(v=>v.username==="RookieRick"),b=[...h?[h]:[],...u.filter(v=>!v.is_bot).sort((v,w)=>Number(w.online)-Number(v.online)),...u.filter(v=>v.is_bot&&v!==h)];for(const v of b){if(this.assign.has(v.id))continue;const w=pi.find(A=>A.index>0&&!_.has(A.index));if(!w)break;this.assign.set(v.id,w.index),_.add(w.index)}const x=i.world.find(v=>v.id===s.id)||{id:s.id,username:s.username,is_bot:!1,level:s.level,prestige:s.prestige,title:s.title,bio:"",base_level:s.base_level,slots:s.slots,security_level:s.security_level,vault_level:s.vault_level,vault_used:0,cosmetics:s.cosmetics,base_value:s.base_value,shield_until:s.shield_until,lock_until:s.lock_until,protected:s.level<3,online:!0,items:[]};this.ownerPlot.clear();const y=new Map([[0,{...x,slots:s.slots,security_level:s.security_level,cosmetics:s.cosmetics,lock_until:s.lock_until,shield_until:s.shield_until}]]);for(const[v,w]of this.assign){const A=u.find(z=>z.id===v);A&&y.set(w,A)}for(const[v,w]of y)this.ownerPlot.set(w.id,pi[v]);for(const[v,w]of this.plots)(!y.has(v)||y.get(v).id!==w.owner.id)&&(this.scene.remove(w.group),this.labels.removePrefix(`plot${v}:`),this.plots.delete(v));for(const[v,w]of y){const A=pi[v],z=v===0;let D=this.plots.get(v);const R=JSON.stringify(w.cosmetics||{})+"|"+w.slots+"|"+w.security_level;(!D||D.themeSig!==R)&&(D&&(this.scene.remove(D.group),this.labels.removePrefix(`plot${v}:`)),D=this.buildPlot(A,w,z,R),this.plots.set(v,D)),D.owner=w;const q=[];if(z){const Z=new Set((i.last?.incoming_raids||[]).filter(ee=>ee.phase==="carry").map(ee=>ee.player_item_id));for(const ee of i.myItems)ee.location==="display"&&ee.slot!=null&&q.push({piid:ee.id,itemId:ee.item_id,mutation:ee.mutation,slot:ee.slot,hidden:Z.has(ee.id)})}else{const Z=i.steal&&!i.steal.result&&i.steal.phase==="carry"?i.steal.playerItemId:null;for(const ee of w.items)q.push({piid:ee.id,itemId:ee.item_id,mutation:ee.mutation,slot:ee.slot,hidden:ee.id===Z||ee.raid?.phase==="carry"})}const V=new Map(q.map(Z=>[Z.slot,Z]));for(const Z of D.podiums)this.setPodiumItem(D,Z,V.get(Z.slot)||null)}this.rebuildPickables()}theme(i){const s=G().catalog?.cosmetics||[],r=u=>s.find(f=>f.id===u)?.data||{},m=r(i.cosmetics?.theme||"theme-neon");return{floor:m.floor||"#131a2e",wall:m.wall||"#1e293b",glow:m.glow||"#22d3ee",pattern:r(i.cosmetics?.floor).pattern||"grid",light:r(i.cosmetics?.lighting).color||m.glow||"#22d3ee"}}floorTex(i,s,r){return gn(256,256,m=>{if(m.fillStyle=s,m.fillRect(0,0,256,256),m.strokeStyle=r+"55",m.lineWidth=3,i==="checker"){m.fillStyle="rgba(255,255,255,0.06)";for(let u=0;u<4;u++)for(let f=0;f<4;f++)(f+u)%2&&m.fillRect(f*64,u*64,64,64)}else if(i==="hex")for(let u=0;u<5;u++)for(let f=0;f<5;f++){const _=f*58+u%2*29,h=u*50;m.beginPath();for(let b=0;b<6;b++)m.lineTo(_+Math.cos(b*Math.PI/3)*28,h+Math.sin(b*Math.PI/3)*28);m.closePath(),m.stroke()}else if(i==="marble"){m.strokeStyle="rgba(255,255,255,0.12)";for(let u=0;u<12;u++)m.beginPath(),m.moveTo(Math.random()*256,0),m.bezierCurveTo(Math.random()*256,90,Math.random()*256,170,Math.random()*256,256),m.stroke()}else for(let u=0;u<=256;u+=64)m.beginPath(),m.moveTo(u,0),m.lineTo(u,256),m.stroke(),m.beginPath(),m.moveTo(0,u),m.lineTo(256,u),m.stroke()},!0)}buildPlot(i,s,r,m){const u=new Xe;this.scene.add(u);const f=this.theme(s),_=Ze(i,0,Rt/2),h=this.floorTex(f.pattern,f.floor,f.glow);h.repeat.set(bt/6,Rt/6);const b=new _e(new Zo(bt,.14,Rt),new ha({map:h,roughness:.7,metalness:.2}));b.position.set(_.x,.07,_.z),b.receiveShadow=!0,u.add(b);const x=J(f.wall,{metal:.4,rough:.5}),y=$e(r?"#fde047":f.glow),v=(le,Q,ge,ne,K)=>{const ue=Ze(i,le,Q),ce=Ze(i,ge,ne),tt=Math.hypot(ce.x-ue.x,ce.z-ue.z),Ae=new _e(I(tt,K,.4),x);Ae.position.set((ue.x+ce.x)/2,K/2,(ue.z+ce.z)/2),Ae.rotation.y=-Math.atan2(ce.z-ue.z,ce.x-ue.x),Ae.castShadow=!0,Ae.receiveShadow=!0,u.add(Ae);const Lt=new _e(I(tt,.08,.44),y);Lt.position.set(Ae.position.x,K+.02,Ae.position.z),Lt.rotation.y=Ae.rotation.y,u.add(Lt)};v(-bt/2,0,-bt/2,Rt,1.3),v(bt/2,0,bt/2,Rt,1.3),v(-bt/2,Rt,bt/2,Rt,1.3),v(-4.5,Rt,4.5,Rt,3.6);for(const le of[-1,1]){const Q=Ze(i,le*(bt/2),0),ge=new _e(oe(.7,3.2,.7,.1),x);ge.position.set(Q.x,1.6,Q.z),ge.castShadow=!0,u.add(ge);const ne=new _e(I(.75,.2,.75),y);ne.position.set(Q.x,3.25,Q.z),u.add(ne)}const w=new Xe,A=Ze(i,0,.2);for(let le=0;le<6;le++){const Q=new _e(I(bt-.8,.05,.05),$e("#ff2a4f"));Q.position.set(A.x,.35+le*.42,A.z),w.add(Q)}w.visible=!1,u.add(w);const z=Qu(i),D=gn(128,128,le=>{le.fillStyle="#3f0a14",le.beginPath(),le.arc(64,64,60,0,Math.PI*2),le.fill(),le.strokeStyle="#ff4d6d",le.lineWidth=8,le.stroke(),le.font="64px system-ui, sans-serif",le.textAlign="center",le.textBaseline="middle",le.fillText("🔒",64,68)}),R=new _e(ve(1,1,.08,32),[J("#3f0a14"),new Nt({map:D,toneMapped:!1}),J("#3f0a14")]);R.position.set(z.x,.16,z.z),u.add(R);const q=Zu(i),V=gn(128,128,le=>{le.fillStyle="#052e16",le.beginPath(),le.arc(64,64,60,0,Math.PI*2),le.fill(),le.strokeStyle="#4ade80",le.lineWidth=8,le.stroke(),le.font="64px system-ui, sans-serif",le.textAlign="center",le.textBaseline="middle",le.fillText("💰",64,68)}),Z=new _e(ve(1,1,.08,32),[J("#052e16"),new Nt({map:V,toneMapped:!1}),J("#052e16")]);Z.position.set(q.x,.16,q.z),u.add(Z);const ee=S1(i),ke=new _e(oe(1.6,1.8,1.4,.1),J("#475569",{metal:.9,rough:.3}));ke.position.set(ee.x,.9,ee.z),ke.castShadow=!0,u.add(ke);const U=new _e(ve(.3,.3,.1,18),J("#cbd5e1",{metal:1,rough:.2}));U.rotation.x=Math.PI/2,U.position.set(ee.x,1,ee.z-i.side*.72),u.add(U);const ie=new Xe;u.add(ie),this.buildSecurity(i,ie,s.security_level);const ye=new _e(new Ks(16,32,16,0,Math.PI*2,0,Math.PI/2),new Nt({color:"#60a5fa",transparent:!0,opacity:.12,depthWrite:!1,blending:Zs,side:Bl,toneMapped:!1}));ye.scale.set(.72,.5,.86),ye.position.set(_.x,0,_.z),ye.visible=!1,u.add(ye);const it=[];for(let le=0;le<s.slots;le++){const Q=ag(i,s.slots,le),ge=T1(i,s.slots,le),ne=m2(Q.size,"#475569",0);ne.root.position.set(Q.x,.14,Q.z),u.add(ne.root),ne.plate.position.set(ge.x-Q.x,0,ge.z-Q.z),ne.plate.visible=r,it.push({slot:le,pod:ne,pos:new be(Q.x,.62,Q.z),plate:new be(ge.x,0,ge.z),size:Q.size,sig:"",model:null,beam:null,piid:null,itemId:null,mutation:null,tier:0,hidden:!1,baseScale:1,popT:null,awaiting:!1})}return{def:i,owner:s,mine:r,group:u,podiums:it,slots:s.slots,themeSig:m,lasers:w,shield:ye,gate:M1(i),sec:ie,secLevel:s.security_level}}buildSecurity(i,s,r){if(r>=2)for(const m of[-1,1]){const u=Ze(i,m*(bt/2-.2),Rt-.3),f=new _e(I(.5,.3,.3),J("#e2e8f0",{metal:.6}));f.position.set(u.x,1.7,u.z);const _=new _e(tn(.06,8,6),$e("#ef4444"));_.position.set(u.x,1.75,u.z-i.side*.18),s.add(f,_)}if(r>=4)for(const m of[-1,1]){const u=Ze(i,m*(bt/2-.6),.6),f=new _e(ve(.25,.35,.6,10),J("#334155",{metal:.8}));f.position.set(u.x,3.6,u.z);const _=new _e(tn(.12,10,8),$e("#f43f5e"));_.position.set(u.x,3.7,u.z-i.side*.3),s.add(f,_)}if(r>=6){const m=pg("#a855f7",3),u=Ze(i,0,Rt/2);m.position.set(u.x,.2,u.z),m.scale.set(3.2,3.9,1),s.add(m)}}setPodiumItem(i,s,r){const m=r?`${r.piid}|${r.itemId}|${r.mutation}`:"";if(m===s.sig){s.model&&(s.model.root.visible=!(r?.hidden??!1)&&!s.awaiting),s.hidden=!!r?.hidden;return}if(s.sig=m,s.model&&(s.model.root.parent?.remove(s.model.root),s.model=null),s.beam&&(s.beam.parent?.remove(s.beam),s.beam=null),s.piid=r?.piid??null,s.itemId=r?.itemId??null,s.mutation=r?.mutation??null,s.tier=0,s.pod.ring.material,!r){s.pod.ring.material=$e("#334155"),this.labels.remove(`plot${i.def.index}:pod${s.slot}`);return}const u=G().itemsById[r.itemId];if(!u)return;const f=qe[u.rarity]?.tier??1;s.tier=f;const _=u.rarity==="ultra"?"#e879f9":qe[u.rarity].color;s.pod.ring.material=$e(r.mutation&&Dl[r.mutation]||_);const h=Is(u,r.mutation),b=Math.max(.42,Math.min(1.05,s.size*1.25/Math.max(.8,h.width)));h.root.scale.setScalar(b),s.baseScale=b,s.popT=null;const x=this.arriving.get(r.piid);if(s.awaiting=!!x&&x.until>Date.now(),h.root.position.copy(s.pos),h.root.position.y=.62,h.root.rotation.y=i.def.side>0?Math.PI:0,h.root.userData={pick:"podium",plot:i.def.index,slot:s.slot,piid:r.piid,itemId:r.itemId,ownerId:i.owner.id,ownerName:i.owner.username,mine:i.mine,mutation:r.mutation},h.root.visible=!r.hidden&&!s.awaiting,s.hidden=r.hidden,i.group.add(h.root),s.model=h,s.awaiting?h.root.scale.setScalar(.01):i.mine&&this.lastWorldAt>0&&Date.now()-this.bootAt>4e3&&this.popIn(s),f>=5||r.mutation==="rainbow"||r.mutation==="glitch"){const y=T_(r.mutation&&Dl[r.mutation]||_,f>=7?14:9,s.size*.45);y.position.x=s.pos.x,y.position.z=s.pos.z,y.position.y+=.5,i.group.add(y),s.beam=y}}popIn(i){if(!i.model)return;i.awaiting=!1,i.model.root.visible=!i.hidden,i.popT=0;const s=i.itemId?G().itemsById[i.itemId]:null,r=i.mutation?Dl[i.mutation]:s?qe[s.rarity].color:"#4ade80";this.fx.spark(i.pos.clone().setY(1.2),{n:40,color:r,speed:5,rainbow:i.mutation==="rainbow"}),this.fx.ring(i.pos.clone().setY(.5),r,3.5),i.pos.distanceTo(this.pos)<30&&te("pop")}rebuildPickables(){this.pickables=[];for(const i of this.plots.values())for(const s of i.podiums)s.model&&!s.hidden&&this.pickables.push(s.model.root);for(const i of this.belt.values())!i.leave&&!i.done&&this.pickables.push(i.model.root)}findPodium(i,s){const r=this.ownerPlot.get(i);return r&&this.plots.get(r.index)?.podiums.find(u=>u.piid===s)||null}updatePlots(i){const s=G(),r=s.me,m=Date.now();for(const u of this.plots.values()){const f=u.mine?r?.lock_until:u.owner.lock_until,_=!!f&&je(f)>m;if(u.lasers.visible=_,_)for(const[z,D]of u.lasers.children.entries())D.visible=Math.sin(this.t*20+z)>-.6;const h=u.mine?r?.shield_until:u.owner.shield_until;u.shield.visible=!!h&&je(h)>m,u.shield.visible&&(u.shield.material.opacity=.08+Math.sin(this.t*3)*.04);const b=mi(u.def,this.pos.x,this.pos.z,4)||this.pos.distanceTo(Ye.set(u.def.cx,0,u.def.side*18))<26;for(const z of u.podiums){if(!z.model)continue;if(z.awaiting&&z.piid){const q=this.arriving.get(z.piid);(!q||q.until<Date.now())&&(this.arriving.delete(z.piid),this.popIn(z))}if(z.popT!=null){z.popT+=i;const q=Math.min(1,z.popT/.45),V=1+2.7*Math.pow(q-1,3)+1.7*Math.pow(q-1,2);z.model.root.scale.setScalar(z.baseScale*Math.max(.01,V)),q>=1&&(z.popT=null)}const D=z.model.body;D.rotation.y=Math.sin(this.t*.6+z.slot)*.35,D.position.y=Math.sin(this.t*1.6+z.slot)*.05,z.tier>=6&&Math.random()<i*2.5&&b&&!z.hidden&&this.fx.spark(Ye.copy(z.pos).setY(1.4),{n:2,color:qe[G().itemsById[z.itemId]?.rarity||"mythic"].color,speed:1.2,up:1.5,gravity:0,size:.3,life:1.2}),z.mutation==="rainbow"&&Math.random()<i*4&&b&&this.fx.spark(Ye.copy(z.pos).setY(1.2),{n:2,rainbow:!0,speed:1.5,up:1.2,gravity:0,size:.28}),z.mutation==="glitch"&&z.model&&(z.model.body.position.x=Math.random()<.05?(Math.random()-.5)*.15:0),this.lookEyes(z.model,z.model.root);const R=`plot${u.def.index}:pod${z.slot}`;if(u.mine&&z.piid&&!z.hidden){const q=s.myItems.find(V=>V.id===z.piid);if(q){const V=Qs(q,this.localAccrued.get(q.id)),Z=rm(q.item_id,q.mutation),ee=V>Z*90;z.pod.plateMat.opacity=V>=1?.35+(ee?.35+Math.sin(this.t*6)*.2:.1):.12,this.labels.set(R,{pos:Ye.copy(z.pos).setY(z.pos.y+z.model.height*z.model.root.scale.x+.5),html:`<b>${Ue(V)}</b><i>+${Cn(Z)}</i>`,cls:"cash"+(ee?" big":""),maxDist:34})}}else if(!u.mine&&z.itemId&&b&&!z.hidden){const q=s.itemsById[z.itemId];if(q){const V=z.mutation?ea(z.mutation):null;this.labels.set(R,{pos:Ye.copy(z.pos).setY(z.pos.y+z.model.height*z.model.root.scale.x+.4),html:`${V?`<u class="mut m-${z.mutation}">${V.label}</u>`:""}<s class="r-${q.rarity}">${qe[q.rarity].label}</s><b>${q.name}</b><i>${Ue(Pn(q.id,z.mutation))}</i>`,cls:"podtag",maxDist:18})}}else this.labels.hide(R)}const x=Ze(u.def,0,Rt+.2),y=_?Math.ceil((je(f)-m)/1e3):0,v=u.shield.visible?je(h)-m:0,w=u.mine&&r?r.base_value:u.owner.base_value,A=u.mine&&r?r.security_level:u.owner.security_level;if(this.labels.set(`plot${u.def.index}:sign`,{pos:Ye.set(x.x,4.6,x.z),html:`<b>${u.mine?"⭐ YOUR BASE":(u.owner.is_bot?"🤖 ":"")+pa(u.owner.username)}</b><i>${Ue(w)} · SEC ${A}</i>${_?`<em class="lk">🔒 LOCKED ${y}s</em>`:v>0?`<em class="sh">🛡️ ${Ut(v)}</em>`:!u.mine&&u.owner.protected?'<em class="sh">🐣 PROTECTED</em>':""}`,cls:"sign"+(u.mine?" mine":""),maxDist:90,scale:!1}),u.mine&&r){const z=Qu(u.def),D=!r.lock_until||je(r.lock_until)<m-(G().catalog?.rules.lock_recharge??10)*1e3,R=r.lock_until?Math.ceil((je(r.lock_until)+1e4-m)/1e3):0;this.labels.set("plot0:lockpad",{pos:Ye.set(z.x,1.3,z.z),html:_?`<b>🔒 ${y}s</b>`:D?`<b>STEP TO LOCK</b><i>${r.lock_seconds}s of lasers</i>`:`<b>RECHARGING</b><i>${R}s</i>`,cls:"pad lock"+(_?" on":""),maxDist:26});const q=Zu(u.def);this.labels.set("plot0:colpad",{pos:Ye.set(q.x,1.3,q.z),html:`<b>COLLECT ALL</b><i>${Ue(this.totalPending())}</i>`,cls:"pad col",maxDist:26})}}}updateFlyers(i){this.flyers=this.flyers.filter(s=>{s.t+=i;const r=Math.min(1,s.t/s.dur),m=r<.5?2*r*r:1-Math.pow(-2*r+2,2)/2;return s.obj.position.lerpVectors(s.from,s.to,m),s.obj.position.y+=Math.sin(r*Math.PI)*s.arc,s.obj.rotation.y+=i*s.spin,r>=1?(s.onDone?.(),!1):!0})}updateCoinStacks(){const i=this.plots.get(0),s=G();let r=0;const m=new Ws,u=new hm,f=new be(1,1,1),_=new be;if(i)for(const h of i.podiums){if(!h.piid||h.hidden)continue;const b=s.myItems.find(w=>w.id===h.piid);if(!b)continue;const x=Qs(b,this.localAccrued.get(b.id));if(x<1)continue;const y=Math.max(.1,rm(b.item_id,b.mutation)),v=Math.max(1,Math.min(12,Math.ceil(Math.log2(1+x/(y*4))*2)));for(let w=0;w<v&&r<600;w++){const A=Math.sin(w*12.9898+h.slot)*.06,z=Math.cos(w*78.233+h.slot)*.06,D=w%2?-.14:.14;_.set(h.plate.x+D+A,.08+Math.floor(w/2)*.05,h.plate.z+z),u.setFromAxisAngle(Vs.set(0,1,0),w*.7),m.compose(_,u,f),this.coinStacks.setMatrixAt(r++,m)}}this.coinStacks.count=r,this.coinStacks.instanceMatrix.needsUpdate=!0}totalPending(){let i=0;for(const s of G().myItems)s.location==="display"&&(i+=Qs(s,this.localAccrued.get(s.id)));return i}lookEyes(i,s){if(i.pupils.length){i.body.worldToLocal(Vs.copy(this.pos).setY(1.6));for(const r of i.pupils){const m=r.userData.base,u=Math.max(-1,Math.min(1,Vs.x*.08)),f=Math.max(-1,Math.min(1,(Vs.y-m.y)*.08));r.position.set(m.x+u*.04,m.y+f*.035,m.z)}}}syncBelt(){const i=G();if(i.beltAt===this.lastBeltAt)return;this.lastBeltAt=i.beltAt;const s=new Set;for(const r of i.belt){s.add(r.id);let m=this.belt.get(r.id);if(!m){const u=i.itemsById[r.item_id];if(!u)continue;const f=Is(u,r.mutation,{legs:!0});f.root.userData={pick:"belt",beltId:r.id,itemId:r.item_id,mutation:r.mutation},f.root.visible=!1,this.scene.add(f.root);const _=qe[u.rarity]?.tier??1;let h=null;(_>=5||r.mutation==="rainbow"||r.mutation==="glitch")&&(h=T_(r.mutation?Dl[r.mutation]:u.rarity==="ultra"?"#e879f9":qe[u.rarity].color,_>=7?22:12,.9),f.root.add(h)),m={row:r,it:u,model:f,spawnedAt:je(r.spawned_at),endsAt:je(r.ends_at),beam:h,announced:!1,leave:null,done:!1,phase:Math.random()*6,preAnnounced:!1},this.belt.set(r.id,m)}m.row=r}for(const[r,m]of this.belt)!s.has(r)&&!m.leave&&this.removeBelt(r);this.rebuildPickables()}removeBelt(i){const s=this.belt.get(i);s&&(this.scene.remove(s.model.root),this.labels.remove("belt:"+i),this.belt.delete(i))}updateBelt(i){const s=Date.now(),r=G().me;for(const[m,u]of this.belt){const f=u.model.root;if(u.leave){const w=Math.min(1,(s-u.leave.t0)/u.leave.dur);if(f.position.lerpVectors(u.leave.from,u.leave.to,w),u.leave.fly?(f.position.y+=Math.sin(w*Math.PI)*3+w*4,f.scale.setScalar(Math.max(.01,1-w))):(f.position.y=Math.abs(Math.sin(w*Math.PI*Math.max(2,u.leave.dur/350)))*.5+(w<.12?Math.sin(w/.12*Math.PI)*1.2:0),this.walkLegs(u,i,2.2),f.rotation.y=Math.atan2(u.leave.to.x-u.leave.from.x,u.leave.to.z-u.leave.from.z)),w>=1){if(!u.done){u.done=!0,this.fx.spark(f.position.clone().setY(1),{n:30,color:qe[u.it.rarity].color,speed:4}),this.fx.ring(f.position.clone().setY(.2),qe[u.it.rarity].color,3);for(const[A,z]of this.arriving){if(z.beltId!==m)continue;this.arriving.delete(A);const D=this.plots.get(0)?.podiums.find(R=>R.piid===A);D&&this.popIn(D)}u.row.sold_to===r?.id&&te("pop")}this.removeBelt(m)}continue}if(u.row.sold_to&&!u.leave){this.startLeave(u);continue}const _=(s-u.spawnedAt)/Math.max(1,u.endsAt-u.spawnedAt);if(_<0){f.visible=!1;const w=qe[u.it.rarity]?.tier??1,A=u.spawnedAt-s;!u.preAnnounced&&A<12e3&&(w>=7||u.row.mutation==="rainbow")&&(u.preAnnounced=!0,te("alarm"),Oa({kind:w>=8?"secret":"epic",title:`⚠️ INCOMING: ${u.row.mutation?(ea(u.row.mutation)?.label??"")+" ":""}${qe[u.it.rarity].label}`,sub:`${u.it.name} rolls out of the Tech Factory in ${Math.ceil(A/1e3)}s — get to the belt!`,itemId:u.it.id,mutation:u.row.mutation,ttl:3600}));continue}if(_>1.02){f.visible=!1,this.labels.hide("belt:"+m),_>1.3&&this.removeBelt(m);continue}f.visible=!0,f.position.set(A1(_),et.height,et.z),f.rotation.y=Math.PI/2+Math.sin(this.t*3+u.phase)*.15;const h=Math.min(_/.03,(1-_)/.03,1);f.scale.setScalar(Math.max(.05,h)),this.walkLegs(u,i,1),this.lookEyes(u.model,f),u.beam&&(u.beam.visible=!0),u.announced||(u.announced=!0,this.announceBelt(u,_));const b=f.position.distanceTo(this.pos),x=Cn(u.it.base_income*(ea(u.row.mutation)?.mult??1)),y=u.row.mutation?ea(u.row.mutation):null,v=!r||r.cash>=u.row.price;this.labels.set("belt:"+m,{target:f,offsetY:u.model.height*f.scale.y+.55,html:`${y?`<u class="mut m-${u.row.mutation}">${y.label} ×${y.mult}</u>`:""}<s class="r-${u.it.rarity}">${qe[u.it.rarity].label}</s><b>${pa(u.it.name)}</b><i class="${v?"ok":"no"}">${Ue(u.row.price)}</i><em>+${x}</em>`,cls:"belttag r-"+u.it.rarity+(b<3.2?" near":""),maxDist:30+(qe[u.it.rarity].tier>=5?40:0)}),qe[u.it.rarity].tier>=6&&Math.random()<i*5&&this.fx.spark(Ye.copy(f.position).setY(1.2),{n:2,color:qe[u.it.rarity].color,speed:1.5,gravity:0,up:1,size:.3}),u.row.mutation==="rainbow"&&Math.random()<i*6&&this.fx.spark(Ye.copy(f.position).setY(1),{n:2,rainbow:!0,speed:1.5,gravity:0,up:1})}}walkLegs(i,s,r){i.phase+=s*9*r;const m=Math.sin(i.phase)*.7;i.model.legs[0]&&(i.model.legs[0].rotation.x=m),i.model.legs[1]&&(i.model.legs[1].rotation.x=-m),i.model.body.position.y=.34+Math.abs(Math.sin(i.phase))*.06,i.model.body.rotation.z=Math.sin(i.phase)*.06}announceBelt(i,s){const r=qe[i.it.rarity]?.tier??1,m=i.row.mutation;s>.15||(r>=8||i.it.rarity==="secret"?(te("hype"),Fs(i.it.rarity),this.shake=Math.max(this.shake,.5),Oa({kind:"secret",title:`⚠️ ${qe[i.it.rarity].label} ON THE BELT ⚠️`,sub:`${i.it.name} · ${Ue(i.row.price)} — GO GO GO`,itemId:i.it.id,mutation:m,ttl:4200})):r>=5||m==="rainbow"||m==="glitch"?(te("hype"),Oa({kind:"epic",title:`${m?(ea(m)?.label??"")+" ":""}${qe[i.it.rarity].label} ON THE BELT!`,sub:`${i.it.name} · ${Ue(i.row.price)}`,itemId:i.it.id,mutation:m,color:qe[i.it.rarity].color,ttl:3e3})):(r>=4||m)&&te("spawn"),this.fx.spark(new be(et.x0+1,2.5,0),{n:r>=5?60:14,color:m?Dl[m]:qe[i.it.rarity].color,speed:5,rainbow:m==="rainbow"}))}startLeave(i){const s=G(),r=i.model.root.position.clone();if(!i.model.root.visible){this.removeBelt(i.row.id);return}const m=i.row.sold_to,u=this.ownerPlot.get(m);let f,_=!1;if(u)if(m===s.me?.id){const b=this.plots.get(0)?.podiums.find(x=>!x.piid);f=b?b.pos.clone().setY(.6):new be(ql(u).x,0,ql(u).z)}else{const b=Ze(u,(Math.random()-.5)*8,8+Math.random()*8);f=new be(b.x,0,b.z)}else f=r.clone().add(new be(0,0,.1)),_=!0;const h=r.distanceTo(f);i.leave={from:r,to:f,t0:Date.now(),dur:_?900:Math.max(900,h/9*1e3),fly:_},this.labels.set("belt:"+i.row.id,{target:i.model.root,offsetY:i.model.height+.5,html:`<b>${m===s.me?.id?"✅ YOURS!":"🛒 "+pa(i.row.buyer||"?")}</b>`,cls:"belttag sold",maxDist:40}),m===s.me?.id&&(this.fx.spark(r.clone().setY(1),{n:40,color:"#4ade80",speed:5}),this.fx.ring(r.clone().setY(.35),"#4ade80",4)),this.rebuildPickables()}nearestBelt(i){let s=null,r=i;for(const m of this.belt.values()){if(m.leave||m.row.sold_to||!m.model.root.visible)continue;const u=m.model.root.position,f=Math.hypot(u.x-this.pos.x,u.z-this.pos.z);f<r&&(r=f,s=m)}return s}tryBuy(i){const s=this.belt.get(i);if(!s||s.row.sold_to)return;const r=G().me;if(r&&r.cash<s.row.price){b_(i),this.pops.at(this.camera,this.w,this.h,Ye.copy(s.model.root.position).setY(2),"NEED "+Ue(s.row.price-r.cash),"bad",.9);return}this.fx.coinsBurst(this.pos.clone().setY(1.4),10,s.model.root.position.clone().setY(1)),this.pops.at(this.camera,this.w,this.h,Ye.copy(s.model.root.position).setY(2.2),"-"+Ue(s.row.price),"spend",1),b_(i).then(m=>{if(m){if(m.placed){this.arriving.set(m.player_item.id,{beltId:i,until:Date.now()+9e3});const f=this.belt.get(i),_=this.plots.get(0),h=m.slot!=null?_?.podiums.find(b=>b.slot===m.slot):null;f?.leave&&h&&(f.leave.to=h.pos.clone().setY(.6),f.leave.dur=Math.max(900,f.leave.from.distanceTo(f.leave.to)/9*1e3))}const u=qe[m.rarity]?.tier??1;(u>=5||m.mutation)&&(this.fx.confetti(this.pos.clone().setY(2),u>=7?200:90),this.fovKick=8,this.slowmo=.35)}})}syncWalkers(){const i=G();for(const s of i.world)!s.is_bot||this.walkers.has(s.id)||this.walkers.set(s.id,this.makeWalker(s.id,s.username,s.level,!0))}makeWalker(i,s,r,m){const u=Yl(i),f=zo({shirt:`hsl(${u},55%,45%)`,bot:m,accent:`hsl(${(u+180)%360},90%,60%)`}),_=this.ownerPlot.get(i),h=_?Ze(_,(Math.random()-.5)*10,3+Math.random()*10):{x:(Math.random()-.5)*100,z:(Math.random()<.5?-1:1)*4};f.root.position.set(h.x,0,h.z),this.scene.add(f.root);const b={id:i,name:s,level:r,rig:f,pos:f.root.position,target:null,wait:Math.random()*3,speed:3+Math.random(),mode:"wander",raid:null,carry:null,carryKey:"",stun:0,stuck:0,lastPos:new be,ghost:!m,facing:0,speedNow:0,bot:m};return this.labels.set("w:"+i,{target:f.root,offsetY:2.75,html:`<span class="nm ${m?"bot":""}">${m?"🤖 ":""}${pa(s)}</span><span class="lv">${r}</span>`,cls:"tag",maxDist:36}),b}wanderTarget(i){const s=this.ownerPlot.get(i.id),r=Math.random();if(s&&r<.4){const u=Ze(s,(Math.random()-.5)*12,2+Math.random()*16);return new be(u.x,0,u.z)}if(r<.75)return new be(-50+Math.random()*100,0,(Math.random()<.5?-1:1)*(2.6+Math.random()*2.2));const m=fi[Math.floor(Math.random()*fi.length)];return new be(m.anchor.x+(Math.random()-.5)*6,0,m.anchor.z+(Math.random()-.5)*6)}updateWalkers(i){const s=G(),r=Date.now(),m=s.last?.incoming_raids||[],u=new Map(m.map(_=>[_.attacker_id,_]));for(const _ of m)this.walkers.has(_.attacker_id)||this.walkers.set(_.attacker_id,this.makeWalker(_.attacker_id,_.attacker,1,!1));const f=this.plots.get(0);for(const[_,h]of this.walkers){const b=u.get(_)||null;if(b&&h.mode!=="chase"?(h.mode="thief",h.raid=b):!b&&h.mode==="thief"&&this.releaseThief(h),h.ghost&&!b&&h.mode!=="thief"){this.scene.remove(h.rig.root),this.labels.remove("w:"+_),this.walkers.delete(_);continue}if(h.stun>0){h.stun-=i,h.rig.root.rotation.y+=i*12,Xs(h.rig,i,{speed:0,t:this.t});continue}let x=null,y=h.speed,v=!1;if(h.mode==="thief"&&h.raid&&f){const w=f.podiums.find(z=>z.piid===h.raid.player_item_id),A=w?w.plate.clone():new be(ql(f.def).x,0,ql(f.def).z);if(h.raid.phase==="grab"){const z=k1(f.def);h.pos.distanceTo(A)>30&&(h.pos.set(z.x+(Math.random()-.5)*2,0,z.z),this.fx.spark(h.pos.clone().setY(1),{n:30,color:"#94a3b8",speed:3})),x=A,y=6.2,h.pos.distanceTo(A)<.6&&(v=!0,x=null,w&&(h.facing=Math.atan2(w.pos.x-h.pos.x,w.pos.z-h.pos.z)));const D=Math.max(0,je(h.raid.ends_at)-r);this.labels.set("w:"+_,{target:h.rig.root,offsetY:2.75,html:`<span class="nm thief">🥷 ${pa(h.name)}</span><span class="lv warn">GRABBING ${Math.ceil(D/1e3)}s</span>`,cls:"tag alert",maxDist:60})}else{if(!h.carry){const q=s.itemsById[h.raid.item_id];if(q){const V=s.myItems.find(Z=>Z.id===h.raid.player_item_id);h.carry=Is(q,V?.mutation??null),h.carry.root.scale.setScalar(.75),h.rig.hold.add(h.carry.root)}}const z=this.ownerPlot.get(_),D=z?Ze(z,0,6):{x:h.pos.x+40,z:20};x=new be(D.x,0,D.z);const R=Math.max(.4,(je(h.raid.deliver_after||h.raid.ends_at)-r)/1e3);y=Math.max(4.2,Math.min(7.6,h.pos.distanceTo(x)/R)),this.labels.set("w:"+_,{target:h.rig.root,offsetY:3.4,html:`<span class="nm thief">🏃 ${pa(h.name)}</span><span class="lv warn">HAS YOUR ITEM — TAG THEM!</span>`,cls:"tag alert",maxDist:90})}}else h.mode==="wander"?(h.wait>0?h.wait-=i:(!h.target||h.pos.distanceTo(h.target)<.8)&&(h.target=this.wanderTarget(h),h.wait=1+Math.random()*5),x=h.wait>0?null:h.target,y=h.speed):h.mode==="chase"&&(x=null);if(x){Ye.subVectors(x,h.pos).setY(0);const w=Ye.length();w>.1?(Ye.multiplyScalar(Math.min(w,y*i)/w),this.moveWithCollision(h.pos,Ye.x,Ye.z,!0,h.mode==="thief"),h.facing=Math.atan2(Ye.x,Ye.z),h.speedNow=y):h.speedNow=0,h.pos.distanceTo(h.lastPos)<y*i*.2?(h.stuck+=i,h.stuck>1.5&&h.mode==="wander"&&(h.target=this.wanderTarget(h),h.stuck=0)):h.stuck=0,h.lastPos.copy(h.pos)}else h.mode!=="chase"&&(h.speedNow=0);h.rig.root.rotation.y=Do(h.rig.root.rotation.y,h.facing,1-Math.exp(-i*10)),Xs(h.rig,i,{speed:h.speedNow,carrying:!!h.carry,grabbing:v,t:this.t}),h.mode==="wander"&&this.labels.set("w:"+_,{target:h.rig.root,offsetY:2.75,html:`<span class="nm ${h.bot?"bot":""}">${h.bot?"🤖 ":""}${pa(h.name)}</span><span class="lv">${h.level}</span>`,cls:"tag",maxDist:36})}}releaseThief(i){i.carry&&(i.rig.hold.remove(i.carry.root),i.carry=null),i.mode="wander",i.raid=null,i.target=null}tryTag(i){const s=this.walkers.get(i),r=s?.raid;!s||!r||this.tagged.has(r.id)||(this.tagged.add(r.id),s.stun=1.6,this.fx.spark(s.pos.clone().setY(1.4),{n:60,color:"#fde047",speed:6}),this.fx.ring(s.pos.clone(),"#fde047",4),this.shake=Math.max(this.shake,.4),this.pops.at(this.camera,this.w,this.h,Ye.copy(s.pos).setY(2.6),"TAGGED!","tag",1.6),te("tag"),mg(r.id,!0).then(()=>{this.releaseThief(s),s.stun=2,this.fx.confetti(this.pos.clone().setY(2),80)}).catch(()=>{this.tagged.delete(r.id)}))}startChase(){const i=G().steal;if(!i||i.tutorial)return;const s=G().world.find(u=>u.id===i.defenderId);if(!s||!s.is_bot)return;const r=this.ownerPlot.get(s.id),m=this.walkers.get(s.id);if(m&&(m.mode="chase",m.raid=null,this.chasers.push({kind:"owner",walker:m,pos:m.pos,speed:6,t:0}),this.labels.set("w:"+m.id,{target:m.rig.root,offsetY:2.75,html:`<span class="nm thief">😡 ${pa(m.name)}</span><span class="lv warn">CHASING YOU</span>`,cls:"tag alert",maxDist:90})),r&&s.security_level>=2){const u=this.makeDrone(),f=Ze(r,0,Rt-2);u.position.set(f.x,2.4,f.z),this.scene.add(u),this.chasers.push({kind:"drone",obj:u,pos:u.position,speed:5.3+.3*s.security_level,t:0}),this.labels.set("drone",{target:u,offsetY:1.1,html:'<span class="nm thief">🚨 SECURITY DRONE</span>',cls:"tag alert",maxDist:90}),te("alarm")}}makeDrone(){const i=new Xe,s=new _e(oe(.9,.35,.9,.12),J("#1e293b",{metal:.8,rough:.3}));i.add(s);const r=new _e(tn(.16,12,10),$e("#ef4444"));r.position.set(0,-.05,.45),i.add(r);for(let u=0;u<4;u++){const f=Math.PI/4+u*Math.PI/2,_=new _e(ve(.3,.3,.03,12),J("#94a3b8",{opacity:.6}));_.position.set(Math.cos(f)*.62,.2,Math.sin(f)*.62),_.userData.spin=40,i.add(_)}const m=new _e(new Lv(.9,2.4,16,1,!0),new Nt({color:"#ef4444",transparent:!0,opacity:.15,depthWrite:!1,blending:Zs,side:Bl,toneMapped:!1}));return m.position.y=-1.3,i.add(m),i}stopChase(){for(const i of this.chasers)i.kind==="owner"&&i.walker&&(i.walker.mode="wander",i.walker.target=null),i.kind==="drone"&&i.obj&&(this.fx.spark(i.obj.position.clone(),{n:30,color:"#94a3b8",speed:3}),this.scene.remove(i.obj),this.labels.remove("drone"));this.chasers=[]}updateChasers(i){if(!this.chasers.length)return;const s=G().steal;if(!s||s.result||s.phase!=="carry"){this.stopChase();return}const r=pi[0],m=mi(r,this.pos.x,this.pos.z,.2);for(const u of this.chasers){u.t+=i;const f=u.speed+Math.max(0,u.t-4)*.14;Ye.subVectors(this.pos,u.pos).setY(0);const _=Ye.length();if(_>.05){Ye.multiplyScalar(Math.min(_,f*i)/_);const h=u.pos.x+Ye.x,b=u.pos.z+Ye.z;mi(r,h,b,.3)||(u.kind==="drone"?(u.pos.x=h,u.pos.z=b):this.moveWithCollision(u.pos,Ye.x,Ye.z,!0,!1))}if(u.kind==="drone"&&u.obj&&(u.obj.position.y=2.4+Math.sin(this.t*4)*.2,u.obj.lookAt(this.pos.x,2.2,this.pos.z),u.obj.children.forEach(h=>{h.userData.spin&&(h.rotation.y+=i*h.userData.spin)})),u.kind==="owner"&&u.walker&&(u.walker.facing=Math.atan2(Ye.x,Ye.z),u.walker.speedNow=f),!m&&Math.hypot(this.pos.x-u.pos.x,this.pos.z-u.pos.z)<1.15){this.onCaught();return}}}onCaught(){const i=G().steal;!i||i.finishing||i.result||(this.stopChase(),this.zapFx("CAUGHT!"),Xo("caught"))}stealPhase(){const i=G().steal;return!i||i.result?null:i.phase}syncSteal(){const i=G().steal,s=i?`${i.raidId}|${i.phase}|${i.result?.status??""}`:"";if(s===this.lastStealSig)return;const r=this.lastStealSig;if(this.lastStealSig=s,!i){this.dropCarry(),this.stopChase(),this.grabPos=null;return}if(i.raidId!==this.lastSteal){this.lastSteal=i.raidId;const m=this.findPodium(i.defenderId,i.playerItemId);m&&((!this.grabPos||this.grabPos.distanceTo(m.pos)>.5)&&(this.grabPos=m.pos.clone()),Math.hypot(this.pos.x-m.plate.x,this.pos.z-m.plate.z)>3.5&&this.travelTo(m.plate.x,m.plate.z,!1),this.facing=Math.atan2(m.pos.x-m.plate.x,m.pos.z-m.plate.z)),this.fx.spark(this.pos.clone().setY(1.5),{n:20,color:"#f43f5e",speed:3})}if(i.result){const m=i.result.status==="success";if(this.stopChase(),m){this.slamLoot();const u=qe[G().itemsById[i.itemId]?.rarity||"common"].tier;this.fx.confetti(this.pos.clone().setY(2.2),160+u*20),this.fx.coinsBurst(this.pos.clone().setY(1.5),30),this.fx.ring(this.pos.clone(),"#fde047",7),this.fovKick=10,this.slowmo=.5,this.pops.at(this.camera,this.w,this.h,Ye.copy(this.pos).setY(3),"STOLEN!","win",2)}else this.dropCarry(),i.result.status!=="blocked"&&!r.endsWith("failed")&&this.zapFx(i.result.caught?"CAUGHT!":"ZAPPED!");return}if(i.phase==="carry"){const m=G().itemsById[i.itemId];m&&!this.carryModel&&(this.carryModel=Is(m,i.mutation),this.carryModel.root.scale.setScalar(.8),this.rig.hold.add(this.carryModel.root)),this.fx.spark(this.pos.clone().setY(2.6),{n:50,color:"#fde047",speed:5}),this.fx.ring(this.pos.clone(),"#fde047",3),this.fovKick=6,this.chaseRaid!==i.raidId&&(this.chaseRaid=i.raidId,this.startChase())}}slamLoot(){const i=this.carryModel;if(!i)return;this.carryModel=null;const s=new be;i.root.getWorldPosition(s),this.rig.hold.remove(i.root),i.root.position.copy(s),i.root.scale.setScalar(.8),this.scene.add(i.root);const r=this.plots.get(0),m=r?.podiums.find(_=>!_.piid),u=m?m.pos.clone():r?new be(r.def.cx,.6,r.def.side*14):this.pos.clone(),f=G().steal;f&&this.arriving.set(f.playerItemId,{beltId:-1,until:Date.now()+2500}),this.flyers.push({obj:i.root,from:s,to:u,t:0,dur:.75,arc:3,spin:12,onDone:()=>{this.scene.remove(i.root),this.fx.ring(u.clone().setY(.3),"#fde047",6),this.fx.spark(u.clone().setY(1),{n:70,color:"#fde047",speed:7}),this.fx.coinsBurst(u.clone().setY(1),20),this.shake=Math.max(this.shake,.6),te("land");const _=f?.playerItemId;if(_){this.arriving.delete(_);const h=this.plots.get(0)?.podiums.find(b=>b.piid===_);h&&this.popIn(h)}}})}dropCarry(){this.carryModel&&(this.rig.hold.remove(this.carryModel.root),this.carryModel=null)}zapFx(i){te("zap"),this.shake=Math.max(this.shake,.9),this.fx.spark(this.pos.clone().setY(1.3),{n:90,color:"#67e8f9",speed:7,gravity:2,size:.3}),this.fx.spark(this.pos.clone().setY(1.3),{n:40,color:"#ffffff",speed:9,gravity:1,size:.22}),this.fx.ring(this.pos.clone(),"#67e8f9",5,.5),this.pops.at(this.camera,this.w,this.h,Ye.copy(this.pos).setY(3),i,"zap",1.8);const s=this.grabPos?Ye.subVectors(this.pos,this.grabPos).setY(0):Ye.set(0,0,1);s.lengthSq()<.01&&s.set(0,0,1),s.normalize().multiplyScalar(9),this.knock.copy(s),this.vy=5,this.grounded=!1}moveWithCollision(i,s,r,m=!1,u=!1){const f=(h,b)=>{if(h<It.minX||h>It.maxX||b<It.minZ||b>It.maxZ)return!1;for(const x of this.colliders)if(h_(h,b,A_,x))return!1;if(!u)for(const x of this.plots.values()){if(x.mine&&!m)continue;const y=x.mine?G().me?.lock_until:x.owner.lock_until;if(!(!y||je(y)<=Date.now())&&!mi(x.def,i.x,i.z,-.2)&&h_(h,b,A_,x.gate))return!1}return!0};let _=!1;return f(i.x+s,i.z)&&(i.x+=s,_=!0),f(i.x,i.z+r)&&(i.z+=r,_=!0),_}updatePlayer(i){const s=G(),r=this.stealPhase();let m=0,u=0;if((this.keys.has("a")||this.keys.has("arrowleft"))&&(m-=1),(this.keys.has("d")||this.keys.has("arrowright"))&&(m+=1),(this.keys.has("w")||this.keys.has("arrowup"))&&(u+=1),(this.keys.has("s")||this.keys.has("arrowdown"))&&(u-=1),(this.joy.x||this.joy.y)&&(m=this.joy.x,u=-this.joy.y),(m||u)&&(this.chaseId=null),this.chaseId){const V=this.walkers.get(this.chaseId);!V||V.mode!=="thief"||!V.raid||this.tagged.has(V.raid.id)?this.chaseId=null:this.target={x:V.pos.x,z:V.pos.z}}const f=-Math.sin(this.camYaw),_=-Math.cos(this.camYaw),h=Math.cos(this.camYaw),b=-Math.sin(this.camYaw);let x=h*m+f*u,y=b*m+_*u;if(!m&&!u&&this.target){const V=this.target.x-this.pos.x,Z=this.target.z-this.pos.z,ee=Math.hypot(V,Z);if(ee<.5){const ke=this.target.then;this.target=null,ke?.()}else x=V/ee,y=Z/ee}const v=Math.hypot(x,y);let w=r==="carry"?v2:this.sprint||this.keys.has("shift")?y2:b2;r==="grab"&&(w=0);const A=new be(v>.01?x/Math.max(1,v)*w:0,0,v>.01?y/Math.max(1,v)*w:0);this.vel.lerp(A,1-Math.exp(-i*12)),this.vel.add(this.knock),this.knock.multiplyScalar(Math.exp(-i*6)),this.knock.lengthSq()<.01&&this.knock.set(0,0,0),!this.moveWithCollision(this.pos,this.vel.x*i,this.vel.z*i)&&this.target&&(this.target=null),this.speedNow=Math.hypot(this.vel.x,this.vel.z),this.speedNow>.4&&(this.facing=Do(this.facing,Math.atan2(this.vel.x,this.vel.z),1-Math.exp(-i*14))),this.vy-=24*i,this.pos.y+=this.vy*i,this.pos.y<=0&&(!this.grounded&&this.vy<-6&&te("land"),this.pos.y=0,this.vy=0,this.grounded=!0),this.rig.root.position.copy(this.pos),this.rig.root.rotation.y=this.facing;const D=!!this.emote&&performance.now()<this.emote.until;if(Xs(this.rig,i,{speed:this.speedNow,carrying:r==="carry",grabbing:r==="grab",air:!this.grounded,t:this.t,emote:D}),this.carryModel&&(this.carryModel.body.rotation.y+=i*2),this.speedNow>1&&this.grounded&&(this.stepAt+=i*this.speedNow,this.stepAt>2.4)){this.stepAt=0;const V=s.me?.cosmetics?.trail;if(V&&V!=="trail-none"){const Z=V==="trail-cash"?"#4ade80":V==="trail-glitch"?"#22d3ee":V==="trail-comet"?"#c084fc":"#fde047";this.fx.spark(this.pos.clone().setY(.2),{n:6,color:Z,speed:1,up:1,size:.3})}r==="carry"&&this.fx.spark(this.pos.clone().setY(.2),{n:4,color:"#fde047",speed:1.5,up:.8,size:.25})}const R=s.me;if(R){const V=D?`<span class="emo">${this.emote.e}</span>`:"";this.labels.set("me",{target:this.rig.root,offsetY:r==="carry"?3.7:2.45,html:`${V}<span class="nm me">${pa(R.username)}</span><span class="lv">${R.level}</span>`,cls:"tag",maxDist:80})}const q=s.backend;if(q?.presence&&R){let V=null,Z=this.pos.x,ee=this.pos.z;for(const ke of this.plots.values())if(mi(ke.def,this.pos.x,this.pos.z,.5)){V=ke.owner.id;const U=tg(ke.def,this.pos.x,this.pos.z);Z=U.lx,ee=U.ld;break}q.presence.update({id:R.id,name:R.username,x:Math.round(Z*10)/10,y:Math.round(ee*10)/10,dir:this.facing,moving:this.speedNow>.5,plot:V,carry:r==="carry"?s.steal?.itemId??null:null,emote:D?this.emote.e:null,trail:R.cosmetics?.trail})}}updatePeers(i){const s=G().backend;if(!s?.presence)return;const r=performance.now(),m=new Set;for(const u of s.presence.peers()){if(this.walkers.has(u.id))continue;m.add(u.id);let f=u.x,_=u.y;if(u.plot){const b=this.ownerPlot.get(u.plot);if(!b)continue;const x=Ze(b,u.x,u.y);f=x.x,_=x.z}let h=this.peers.get(u.id);if(!h){const b=zo({shirt:`hsl(${Yl(u.id)},70%,52%)`,accent:"#f0abfc"});b.root.position.set(f,0,_),this.scene.add(b.root),h={id:u.id,rig:b,pos:b.root.position,target:new be(f,0,_),facing:u.dir,carry:null,carryId:null,seen:r},this.peers.set(u.id,h)}if(h.target.set(f,0,_),h.facing=u.dir,h.seen=r,(u.carry||null)!==h.carryId){h.carry&&h.rig.hold.remove(h.carry.root),h.carry=null,h.carryId=u.carry||null;const b=u.carry?G().itemsById[u.carry]:null;b&&(h.carry=Is(b,null),h.carry.root.scale.setScalar(.75),h.rig.hold.add(h.carry.root))}this.labels.set("peer:"+u.id,{target:h.rig.root,offsetY:h.carry?3.9:2.8,html:`${u.emote?`<span class="emo">${u.emote}</span>`:""}<span class="nm peer">${pa(u.name)}</span>`,cls:"tag",maxDist:50})}for(const[u,f]of this.peers){if(!m.has(u)){this.scene.remove(f.rig.root),this.labels.remove("peer:"+u),this.peers.delete(u);continue}const _=f.pos.distanceTo(f.target);_>12?f.pos.copy(f.target):f.pos.lerp(f.target,1-Math.exp(-i*8)),f.rig.root.rotation.y=Do(f.rig.root.rotation.y,f.facing,1-Math.exp(-i*10)),Xs(f.rig,i,{speed:_*6,carrying:!!f.carry,t:this.t})}}updateShopkeepers(i,s){if(!this.bubble||s>this.bubble.until){if(this.bubble){const r=this.shopkeepers[this.bubble.i];this.labels.set(r.key,{target:r.rig.root,offsetY:2.9,html:`<span class="nm npc">${r.name}</span>`,cls:"tag",maxDist:34}),this.bubble=null}if(Math.random()<i*.25){const r=Math.floor(Math.random()*this.shopkeepers.length),m=this.shopkeepers[r],u=m.lines[Math.floor(Math.random()*m.lines.length)];this.bubble={i:r,until:s+4200},this.labels.set(m.key,{target:m.rig.root,offsetY:2.9,html:`<span class="say">${u}</span><span class="nm npc">${m.name}</span>`,cls:"tag",maxDist:34})}}for(const r of this.shopkeepers)Xs(r.rig,i,{speed:0,t:this.t+r.pos.x,emote:this.bubble?.i===this.shopkeepers.indexOf(r)})}updateInteractions(i){const s=G(),r=s.me;if(!r)return;(!this.plots.get(0)||!mi(pi[0],this.pos.x,this.pos.z,0))&&(this.onPlate=null,this.onColPad=!1);const m=s.steal,u=this.stealPhase(),f=Date.now();let _=null,h=null;const b=this.plots.get(0),x=b?mi(b.def,this.pos.x,this.pos.z,0):!1;for(const w of this.plots.values())if(mi(w.def,this.pos.x,this.pos.z,0)){h={playerId:w.owner.id,name:w.owner.username,mine:w.mine};break}if(u==="grab"&&m)this.grabPos&&Math.hypot(this.pos.x-this.grabPos.x,this.pos.z-this.grabPos.z)>5.5&&!m.finishing&&Xo("abort");else if(u==="carry"&&m){const w=Math.max(0,m.carryUntil-f);x?(_={kind:"carry",id:m.raidId,label:f>=m.deliverAfter-300?"DELIVERING…":"SAFE! HOLD ON…",icon:"🏠",tone:"good"},f>=m.deliverAfter-300&&!m.finishing&&f-this.deliverTry>800&&(this.deliverTry=f,U1())):_={kind:"carry",id:m.raidId,label:`RUN HOME! ${Math.ceil(w/1e3)}s`,icon:"🏃",sub:"Get it inside your base",tone:"gold"}}if(!_)for(const w of this.walkers.values()){if(w.mode!=="thief"||!w.raid||w.stun>0||this.tagged.has(w.raid.id))continue;const A=Math.hypot(w.pos.x-this.pos.x,w.pos.z-this.pos.z);if(A<1.5){this.tryTag(w.id);break}if(A<4){_={kind:"tag",id:w.id,label:`TAG ${w.name}!`,icon:"👊",tone:"hot"};break}}if(!_&&!u&&Math.abs(this.pos.z)<5.2){let w=this.beltFocus!=null?this.belt.get(this.beltFocus)??null:null;if(w&&(w.leave||w.row.sold_to||!w.model.root.visible||Math.hypot(w.model.root.position.x-this.pos.x,w.model.root.position.z-this.pos.z)>4.6)&&(w=null),w||(w=this.nearestBelt(3.3)),this.beltFocus=w?w.row.id:null,w){const A=r.cash>=w.row.price;_={kind:"belt",id:String(w.row.id),icon:"🛒",tone:A?"good":void 0,label:A?`BUY ${w.it.name}`:`NEED ${Ue(w.row.price-r.cash)} MORE`,sub:`${Ue(w.row.price)} · +${Cn(w.it.base_income*(ea(w.row.mutation)?.mult??1))}${w.row.mutation?" · "+(ea(w.row.mutation)?.label??""):""}`}}}if(!_&&!u&&h&&!h.mine){const w=this.plots.get(this.ownerPlot.get(h.playerId).index);let A=null,z=2.6;for(const D of w.podiums){if(!D.model||D.hidden)continue;const R=Math.min(Math.hypot(D.pos.x-this.pos.x,D.pos.z-this.pos.z),Math.hypot(D.plate.x-this.pos.x,D.plate.z-this.pos.z)+.3);R<z&&(z=R,A=D)}if(A&&A.itemId){const D=this.getBaseInfo(w.owner.id),R=D?.items.find(U=>U.id===A.piid),q=s.itemsById[A.itemId],V=R?.soulbound,Z=D?.raid_block,ee=r.raid_cooldown_until&&je(r.raid_cooldown_until)>f?Math.ceil((je(r.raid_cooldown_until)-f)/1e3):0,ke=R?.chance!=null?Math.round(R.chance*100):null;_={kind:"steal",id:A.piid,icon:"🥷",tone:"hot",label:V?"STARTER — CAN'T STEAL":Z?Z.replace(/\.$/,""):ee?`LAY LOW ${ee}s`:`STEAL ${q?.name??""}`,sub:V||Z||ee?void 0:`${ke!=null?ke+"% · ":""}${R?.seconds??"?"}s grab · then RUN`,disabled:!!(V||Z||ee),playerId:w.owner.id}}_||(_={kind:"plot",id:h.playerId,label:`${h.name}'s BASE`,icon:"👀",playerId:h.playerId,mine:!1})}if(x&&b&&!u){const w=Qu(b.def);Math.hypot(w.x-this.pos.x,w.z-this.pos.z)<1.1&&f>this.lockCooldown&&(this.lockCooldown=f+3e3,r.lock_until&&je(r.lock_until)>f||L1().then(q=>{if(q){this.fx.spark(new be(w.x,.5,w.z),{n:50,color:"#ff2a4f",speed:5});const V=Ze(b.def,0,.2);this.fx.ring(new be(V.x,.2,V.z),"#ff2a4f",9)}}));const A=Zu(b.def),z=Math.hypot(A.x-this.pos.x,A.z-this.pos.z)<1.1;z&&!this.onColPad&&f>this.collectAllCooldown&&(this.collectAllCooldown=f+1500,this.collectAll(new be(A.x,.4,A.z))),this.onColPad=z;let D=null;for(const R of b.podiums)if(!(!R.piid||R.hidden)&&Math.hypot(R.plate.x-this.pos.x,R.plate.z-this.pos.z)<.85){D=R.piid,this.onPlate!==R.piid&&this.collectPodium(R);break}this.onPlate=D,_||(_={kind:"plot",id:r.id,label:"MANAGE MY BASE",icon:"🏠",playerId:r.id,mine:!0})}if(!_&&!u){for(const w of fi)if(N1(w,this.pos.x,this.pos.z)){_={kind:"zone",id:w.id,label:`ENTER ${w.label}`,icon:w.icon,tone:"primary"};break}}const y=_?`${_.kind}|${_.id}|${_.label}|${_.sub}|${_.disabled}`:"",v=pt.getState();if((y!==this.lastPromptKey||h?.playerId!==v.here?.playerId)&&(this.lastPromptKey=y,pt.setState({prompt:_,here:h})),f-this.homeAt>100)if(this.homeAt=f,u==="carry"&&b){const w=ql(b.def),A=w.x-this.pos.x,z=w.z-this.pos.z,D=Math.atan2(A,z)-Math.atan2(-Math.sin(this.camYaw),-Math.cos(this.camYaw));pt.setState({home:{angle:-D,dist:Math.hypot(A,z),inside:x}})}else v.home&&pt.setState({home:null});this.combo&&f-this.comboAt>1500&&(this.combo=0)}getBaseInfo(i){const s=Date.now(),r=this.baseInfo.get(i);if(!r||s-r.at>12e3&&!r.loading){const m=r||{at:s,data:null,loading:!0};m.loading=!0,m.at=s,this.baseInfo.set(i,m),H1(i).then(u=>{m.data=u,m.loading=!1,m.at=Date.now()})}return this.baseInfo.get(i)?.data??null}tryStartSteal(i){const s=G().steal;if(s&&!s.result)return;const r=[...this.plots.values()].find(u=>u.podiums.some(f=>f.piid===i)),m=r?.podiums.find(u=>u.piid===i);m&&(this.grabPos=m.pos.clone(),this.facing=Math.atan2(m.pos.x-this.pos.x,m.pos.z-this.pos.z)),s?.result&&de({steal:null}),Io(i).then(()=>{r&&this.baseInfo.delete(r.owner.id),this.shake=Math.max(this.shake,.2)}).catch(()=>{})}collectPodium(i){const s=Date.now();if((this.plateCooldown.get(i.piid)||0)>s)return;const r=G().myItems.find(f=>f.id===i.piid);if(!r)return;const m=Qs(r,this.localAccrued.get(r.id));if(m<1)return;this.plateCooldown.set(i.piid,s+1200),this.localAccrued.set(r.id,s),this.combo=s-this.comboAt<1500?this.combo+1:1,this.comboAt=s,d_(this.combo);const u=i.pos.clone().setY(1.2);this.fx.coinsBurst(u,Math.max(5,Math.min(34,Math.round(Math.log10(m+1)*7))),this.pos.clone().setY(1.3)),this.fx.spark(u,{n:18,color:"#4ade80",speed:3}),this.pops.at(this.camera,this.w,this.h,Ye.copy(u).setY(2.2),"+"+Ue(m),"cash",Math.min(1.8,.9+Math.log10(m+1)*.12)),this.combo>=3&&this.pops.at(this.camera,this.w,this.h,Ye.copy(this.pos).setY(3.2),`x${this.combo} COMBO!`,"combo",1.1+Math.min(.8,this.combo*.05)),y_(r.id).then(f=>{f<=0&&this.localAccrued.delete(r.id)})}collectAll(i){const s=this.totalPending();if(s<1){this.pops.at(this.camera,this.w,this.h,Ye.copy(i).setY(2),"NOTHING YET","dim",.8);return}const r=Date.now();for(const m of G().myItems)m.location==="display"&&this.localAccrued.set(m.id,r);for(const m of this.plots.get(0)?.podiums||[])m.piid&&!m.hidden&&this.fx.coinsBurst(m.pos.clone().setY(1.2),6,this.pos.clone().setY(1.3));d_(6),te("cash"),this.pops.at(this.camera,this.w,this.h,Ye.copy(i).setY(2.4),"+"+Ue(s),"cash",1.8),this.fovKick=4,y_(null)}focusRequests(){const i=G();i.focusPlot&&i.focusPlot!==this.lastFocus&&(this.lastFocus=i.focusPlot,this.travelToPlot(i.focusPlot),window.setTimeout(()=>{de({focusPlot:null}),this.lastFocus=null},400))}snapCamera(){this.updateCamera(1,!0)}updateCamera(i,s=!1){this.yawGoal!=null&&(this.camYaw=Do(this.camYaw,this.yawGoal,1-Math.exp(-i*4)),Math.abs(x2(this.camYaw,this.yawGoal))<.01&&(this.yawGoal=null));const r=Ye.copy(this.pos).add(new be(0,1.7,0)),m=Math.cos(this.camPitch),u=Vs.set(r.x+Math.sin(this.camYaw)*m*this.camDist,r.y+Math.sin(this.camPitch)*this.camDist,r.z+Math.cos(this.camYaw)*m*this.camDist);if(s?this.camera.position.copy(u):this.camera.position.lerp(u,1-Math.exp(-i*10)),this.shake>0&&!G().settings.reduceMotion){const _=this.shake*.4;this.camera.position.x+=(Math.random()-.5)*_,this.camera.position.y+=(Math.random()-.5)*_,this.camera.position.z+=(Math.random()-.5)*_}this.shake=Math.max(0,this.shake-i*2.2),this.camera.lookAt(r);const f=55+this.fovKick;Math.abs(this.camera.fov-f)>.01&&(this.camera.fov=f,this.camera.updateProjectionMatrix()),this.fovKick=Math.max(0,this.fovKick-i*14)}typing(i){const s=i.target;return!!s&&(s.tagName==="INPUT"||s.tagName==="TEXTAREA"||s.tagName==="SELECT"||s.isContentEditable)}ndc(i,s){const r=this.canvas.getBoundingClientRect();return new sm((i-r.left)/r.width*2-1,-((s-r.top)/r.height)*2+1)}pick(i,s){this.raycaster.setFromCamera(this.ndc(i,s),this.camera);const r=this.raycaster.intersectObjects(this.pickables,!0);for(const m of r){let u=m.object;for(;u&&!u.userData.pick;)u=u.parent;if(u&&u.visible)return u.userData}return null}click(i,s){const r=this.pick(i,s),m=this.canvas.getBoundingClientRect();if(r){if(te("click"),r.pick==="belt"){const _=this.belt.get(r.beltId);if(!_||_.row.sold_to)return;pt.setState({selected:{playerItemId:"",itemId:r.itemId,ownerId:"",ownerName:"Tech Belt",mine:!1,mutation:r.mutation,beltId:r.beltId,price:_.row.price,sx:i-m.left,sy:s-m.top}})}else pt.setState({selected:{playerItemId:r.piid,itemId:r.itemId,ownerId:r.ownerId,ownerName:r.ownerName,mine:r.mine,mutation:r.mutation,sx:i-m.left,sy:s-m.top}});return}pt.setState({selected:null}),this.raycaster.setFromCamera(this.ndc(i,s),this.camera);const u=new be;if(!this.raycaster.ray.intersectPlane(this.groundPlane,u))return;const f=fi.find(_=>u.x>=_.x0-6&&u.x<=_.x1+6&&u.z>=_.z0-4&&u.z<=_.z1+4);f&&Math.hypot(u.x-this.pos.x,u.z-this.pos.z)>3?this.target={x:f.anchor.x,z:f.anchor.z,then:()=>De(M_[f.id])}:this.target={x:u.x,z:u.z},this.fx.ring(u,"#67e8f9",1.2,.4)}lookToward(i,s){const r=i-this.pos.x,m=s-this.pos.z;Math.hypot(r,m)<.1||(this.yawGoal=Math.atan2(-r,-m))}lookAtBelt(){this.lookToward(this.pos.x,0)}lookAtMyBase(){const i=pi[0],s=Ze(i,0,12);this.lookToward(s.x,s.z)}chase(i){const s=this.walkers.get(i);if(s&&(this.chaseId=i,te("run"),this.pos.distanceTo(s.pos)>45)){const r=s.pos.clone().add(new be(2,0,2));this.travelTo(r.x,r.z,!1)}}runToBuy(i){const s=this.belt.get(i);if(!s)return;const r=Math.hypot(s.model.root.position.x-this.pos.x,s.model.root.position.z-this.pos.z);if(r<3.3){this.tryBuy(i);return}const m=Math.min(10,r/7)*((et.x1-et.x0)/36),u=this.pos.z>=0?2.4:-2.4;this.target={x:Math.min(et.x1-1,s.model.root.position.x+m),z:u,then:()=>{const f=this.belt.get(i);f&&!f.row.sold_to&&Math.hypot(f.model.root.position.x-this.pos.x,f.model.root.position.z-this.pos.z)<4.5&&this.tryBuy(i)}}}runToSteal(i,s){const r=this.findPodium(i,s);if(!r){this.stealFromPanel(i,s);return}this.target={x:r.plate.x,z:r.plate.z,then:()=>this.tryStartSteal(s)}}drawScreens(){const i=G(),s=this.scenery.screens;{const{c:m,w:u,h:f}=s.market;m.fillStyle="#050816",m.fillRect(0,0,u,f),m.font="900 44px 'Orbitron', sans-serif",m.fillStyle="#22d3ee",m.fillText("CENTRAL MARKET",24,58);const _=Object.values(i.market).filter(h=>(qe[i.itemsById[h.item_id]?.rarity]?.tier??0)>=3).sort((h,b)=>Math.abs(b.change_24h)-Math.abs(h.change_24h)).slice(0,6);m.font="700 30px 'Rajdhani', sans-serif",_.forEach((h,b)=>{const x=24+b%3*330,y=120+Math.floor(b/3)*70;m.fillStyle="#e2e8f0",m.fillText((i.itemsById[h.item_id]?.name||h.item_id).slice(0,16),x,y),m.fillStyle=h.change_24h>=0?"#4ade80":"#f87171",m.fillText(`${h.change_24h>=0?"▲":"▼"} ${Math.abs(h.change_24h).toFixed(1)}%  ${Ue(h.price)}`,x,y+32)}),s.market.tex.needsUpdate=!0}{const{c:m,w:u,h:f}=s.raid;m.fillStyle="#12060b",m.fillRect(0,0,u,f),m.font="900 38px 'Orbitron', sans-serif",m.fillStyle="#fb7185",m.fillText("MOST WANTED",24,52);const _=i.world.filter(h=>h.id!==i.me?.id).sort((h,b)=>b.base_value-h.base_value).slice(0,5);m.font="800 30px 'Rajdhani', sans-serif",_.forEach((h,b)=>{const x=110+b*54;m.fillStyle="#fde68a",m.fillText(`${b+1}. ${h.is_bot?"🤖 ":""}${h.username}`,24,x),m.fillStyle="#4ade80",m.textAlign="right",m.fillText(`${Ue(h.base_value)} · SEC ${h.security_level}${h.lock_until&&je(h.lock_until)>Date.now()?" 🔒":""}`,u-20,x),m.textAlign="left"}),s.raid.tex.needsUpdate=!0}{const{c:m,w:u,h:f}=s.stage,_=i.last?.event,h=m.createLinearGradient(0,0,u,f);h.addColorStop(0,"#2e1065"),h.addColorStop(1,"#831843"),m.fillStyle=h,m.fillRect(0,0,u,f),m.textAlign="center",m.fillStyle="#fff",m.font="900 54px 'Orbitron', sans-serif",_?(m.fillText(`${_.icon} ${_.title}`,u/2,150),m.font="700 34px 'Rajdhani', sans-serif",m.fillText(_.description.slice(0,48),u/2,220),m.fillStyle="#fde047",m.fillText("ENDS IN "+Ut(je(_.ends_at)-Date.now()),u/2,300)):(m.fillText("NEXT EVENT",u/2,150),m.fillStyle="#fde047",m.font="900 64px 'Orbitron', sans-serif",m.fillText(i.last?.next_event_at?Ut(je(i.last.next_event_at)-Date.now()):"—",u/2,250)),m.textAlign="left",s.stage.tex.needsUpdate=!0}{const{c:m,w:u,h:f}=s.fame;m.fillStyle="#0b1020",m.fillRect(0,0,u,f),m.textAlign="center",m.font="900 28px 'Orbitron', sans-serif",m.fillStyle="#fbbf24",m.fillText("HALL OF",u/2,50),m.fillText("FAME",u/2,84);const _=[...i.world].sort((h,b)=>b.base_value-h.base_value).slice(0,5);m.font="800 24px 'Rajdhani', sans-serif",_.forEach((h,b)=>{m.fillStyle=b===0?"#fde047":"#e2e8f0",m.fillText(`${["👑","🥈","🥉","4","5"][b]} ${h.username.slice(0,12)}`,u/2,150+b*60),m.fillStyle="#4ade80",m.fillText(Ue(h.base_value),u/2,176+b*60)}),m.textAlign="left",s.fame.tex.needsUpdate=!0}{const{c:m,w:u,h:f}=s.kiosk;m.fillStyle="#1e1b4b",m.fillRect(0,0,u,f),m.textAlign="center",m.font="900 30px 'Orbitron', sans-serif",m.fillStyle="#fde047",m.fillText("MISSIONS",u/2,70);const _=(i.last?.quests_claimable||0)+(i.me?.daily.can_claim?1:0);m.font="900 90px 'Orbitron', sans-serif",m.fillStyle=_?"#4ade80":"#64748b",m.fillText(String(_),u/2,180),m.font="700 24px 'Rajdhani', sans-serif",m.fillStyle="#e2e8f0",m.fillText(_?"READY TO CLAIM":"keep playing",u/2,230),m.textAlign="left",s.kiosk.tex.needsUpdate=!0}{const{c:m,w:u,h:f}=s.museum;m.fillStyle="#f8fafc",m.fillRect(0,0,u,f),m.textAlign="center",m.fillStyle="#0f172a",m.font="900 24px 'Orbitron', sans-serif",m.fillText("MUSEUM",u/2,40);const _=i.catalog?i.catalog.items.filter(h=>h.droppable||h.event_only).length:1;m.font="900 44px 'Orbitron', sans-serif",m.fillStyle="#7c3aed",m.fillText(Math.round((i.me?.collection_count||0)/_*100)+"%",u/2,100),m.textAlign="left",s.museum.tex.needsUpdate=!0}const r=i.catalog?.drops||[];for(const m of this.scenery.machines){const u=r.find(h=>h.id===m.id),f=!i.me||!u||i.me.level<u.min_level||u.event_only&&!i.last?.event||u.requires_key&&(i.me.secret_keys||0)<1;m.light.opacity=f?.25:1,m.light.transparent=f;const _=i.me?.drop_tokens?.[m.id]||0;u&&this.labels.set("mach:"+m.id,{pos:m.pos,html:`<b>${u.name}</b><i>${f?"🔒 "+(u.event_only?"EVENTS ONLY":u.requires_key?"NEEDS KEY":"LV "+u.min_level):Ue(u.price)}</i>${_?`<em>${_} FREE</em>`:""}`,cls:"mach"+(f?" locked":""),maxDist:40})}}drawMinimap(){const i=this.minimap;if(this.w<700){i.style.display="none";return}i.style.display="";const s=i.getContext("2d"),r=i.width,m=i.height,u=r/(It.maxX-It.minX),f=m/(It.maxZ-It.minZ),_=b=>(b-It.minX)*u,h=b=>(b-It.minZ)*f;s.clearRect(0,0,r,m),s.fillStyle="rgba(2,6,23,0.8)",s.fillRect(0,0,r,m),s.fillStyle="#334155",s.fillRect(_(et.x0),h(-1.7),(et.x1-et.x0)*u,3.4*f);for(const b of this.plots.values()){const x=Ze(b.def,-bt/2,0),y=Ze(b.def,bt/2,Rt);s.fillStyle=b.mine?"#facc15":b.owner.is_bot?"#475569":"#38bdf8",s.fillRect(_(Math.min(x.x,y.x)),h(Math.min(x.z,y.z)),bt*u,Rt*f);const v=b.mine?G().me?.lock_until:b.owner.lock_until;v&&je(v)>Date.now()&&(s.fillStyle="#ef4444",s.fillRect(_(Math.min(x.x,y.x)),h(b.def.side>0?x.z:x.z-1),bt*u,2))}for(const b of fi)s.fillStyle="#e879f9",s.fillRect(_(b.anchor.x)-2,h(b.anchor.z)-2,4,4);for(const b of this.belt.values()){if(!b.model.root.visible||b.leave)continue;const x=qe[b.it.rarity].tier;x<3&&!b.row.mutation||(s.fillStyle=b.row.mutation?Dl[b.row.mutation]:qe[b.it.rarity].color,s.beginPath(),s.arc(_(b.model.root.position.x),h(0),x>=5?3.5:2,0,Math.PI*2),s.fill())}for(const b of this.walkers.values())s.fillStyle=b.mode==="thief"||b.mode==="chase"?"#f43f5e":"#94a3b8",s.fillRect(_(b.pos.x)-1.5,h(b.pos.z)-1.5,3,3);s.fillStyle="#ffffff",s.beginPath(),s.arc(_(this.pos.x),h(this.pos.z),3.5,0,Math.PI*2),s.fill(),s.strokeStyle="rgba(56,189,248,0.5)",s.strokeRect(.5,.5,r-1,m-1)}}function am(a,i,s){return Math.max(i,Math.min(s,a))}function x2(a,i){let s=(i-a+Math.PI)%(Math.PI*2)-Math.PI;return s<-Math.PI&&(s+=Math.PI*2),s}function Do(a,i,s){let r=(i-a+Math.PI)%(Math.PI*2)-Math.PI;return r<-Math.PI&&(r+=Math.PI*2),a+r*s}function pa(a){return String(a).replace(/[&<>"]/g,i=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[i])}let yt=null;function C_(a){yt=a}const j2=["BUY OFF THE BELT","DISPLAY","COLLECT","LOCK","GRAB","RUN","STEAL","TRADE","SELL","UPGRADE","REPEAT"];function k2(){const a=F_(),i=s=>{l1(),te("open"),C1(s)};return c.jsxs("div",{className:"screen",children:[c.jsxs("div",{className:"logo",children:["STEAL",c.jsx("br",{}),"THE TECH",c.jsx("small",{children:"TECH CITY"})]}),c.jsx("div",{className:"tagline",children:"Grab gadgets off the Tech Belt, stack cash on your podiums, lock your base — then sneak into everyone else's and RUN with their best stuff."}),c.jsx("div",{className:"loop",children:j2.map(s=>c.jsx("span",{children:s},s))}),c.jsx("div",{className:"col",style:{width:"min(420px, 90vw)"},children:a?c.jsxs(c.Fragment,{children:[c.jsx("button",{className:"btn primary big block",onClick:()=>i("online"),"data-testid":"play-online",children:"▶ PLAY ONLINE"}),c.jsx("button",{className:"btn big block",onClick:()=>i("offline"),"data-testid":"play-offline",children:"OFFLINE PRACTICE"})]}):c.jsxs(c.Fragment,{children:[c.jsx("button",{className:"btn primary big block",onClick:()=>i("offline"),"data-testid":"play-offline",children:"▶ PLAY"}),c.jsxs("div",{className:"fineprint",children:["This copy runs in ",c.jsx("b",{children:"offline practice mode"}),": the full game server runs inside your browser and the other bases belong to NPC players. Connect a Supabase project (see README) to turn on real online multiplayer."]})]})}),c.jsx("div",{className:"fineprint",children:"Fictional in-game currency only — no real money, no gambling, no cash-outs. Works on phone, tablet and desktop."})]})}function S2(){const a=B(s=>s.loadingMsg),i=B(s=>s.loadingPct);return c.jsxs("div",{className:"screen",children:[c.jsx("div",{className:"logo",style:{fontSize:"clamp(34px, 8vw, 64px)"},children:"STEAL THE TECH"}),c.jsx("div",{className:"progress",children:c.jsx("i",{style:{width:i+"%"}})}),c.jsx("div",{className:"muted",style:{fontWeight:800},children:a})]})}function T2(){const a=B(i=>i.fatal);return c.jsxs("div",{className:"screen",children:[c.jsx("div",{style:{fontSize:60},children:"⚠️"}),c.jsx("h2",{className:"display",children:"Something went wrong"}),c.jsx("div",{className:"muted",style:{maxWidth:520,fontWeight:700},children:a}),c.jsxs("div",{className:"row",children:[c.jsx("button",{className:"btn primary",onClick:()=>location.reload(),children:"RELOAD"}),c.jsx("button",{className:"btn",onClick:()=>de({phase:"title",fatal:null}),children:"BACK"})]})]})}function N2(){const a=B(v=>v.backend),[i,s]=L.useState(""),[r,m]=L.useState(""),[u,f]=L.useState("in"),[_,h]=L.useState(null),[b,x]=L.useState(!1),y=async v=>{x(!0),h(null);try{await v(),await ig()}catch(w){h(String(w.message||w))}finally{x(!1)}};return c.jsxs("div",{className:"screen",children:[c.jsx("div",{className:"logo",style:{fontSize:"clamp(34px, 8vw, 64px)"},children:"STEAL THE TECH"}),c.jsxs("div",{className:"card col",style:{width:"min(420px, 92vw)"},children:[c.jsx("button",{className:"btn primary big block",disabled:b,onClick:()=>y(()=>a.signInGuest()),"data-testid":"guest",children:"▶ PLAY AS GUEST"}),c.jsx("div",{className:"muted",style:{fontWeight:700},children:"— or keep your account on every device —"}),c.jsx("input",{className:"field",placeholder:"email",autoComplete:"email",value:i,onChange:v=>s(v.target.value)}),c.jsx("input",{className:"field",placeholder:"password",type:"password",autoComplete:u==="in"?"current-password":"new-password",value:r,onChange:v=>m(v.target.value)}),c.jsx("button",{className:"btn block big",disabled:b||!i||r.length<6,onClick:()=>y(()=>a.signInEmail(i,r,u==="up")),children:u==="in"?"SIGN IN":"CREATE ACCOUNT"}),c.jsx("button",{className:"btn ghost small",onClick:()=>f(u==="in"?"up":"in"),children:u==="in"?"New here? Create an account":"Have an account? Sign in"}),_&&c.jsx("div",{className:"bad-t",style:{fontWeight:800},children:_})]})]})}function E2(){const[a,i]=L.useState(""),[s,r]=L.useState(null),[m,u]=L.useState(!1),f=async()=>{u(!0),r(null);try{await z1(a.trim()),te("levelup")}catch(_){r(String(_.message||_).replace(/^.*?ERROR:\s*/i,"")),te("error")}finally{u(!1)}};return c.jsxs("div",{className:"screen",children:[c.jsx("div",{className:"logo",style:{fontSize:"clamp(34px, 8vw, 64px)"},children:"WELCOME TO TECH CITY"}),c.jsx("div",{className:"tagline",children:'Pick a name. Everyone in the city will see it — on the leaderboards, on the raid board, and on the "ITEM STOLEN" alerts.'}),c.jsxs("div",{className:"col",style:{width:"min(420px, 92vw)"},children:[c.jsx("input",{className:"field",style:{textAlign:"center",fontSize:24,minHeight:60},maxLength:16,placeholder:"YourName",value:a,"data-testid":"username",onChange:_=>i(_.target.value.replace(/[^A-Za-z0-9_]/g,"")),onKeyDown:_=>_.key==="Enter"&&a.length>=3&&f(),autoFocus:!0}),c.jsx("button",{className:"btn primary big block",disabled:m||a.length<3,onClick:f,"data-testid":"join",children:"MOVE IN"}),s&&c.jsx("div",{className:"bad-t",style:{fontWeight:800},children:s}),c.jsx("div",{className:"fineprint",children:"3–16 letters, numbers or _"})]})]})}function F(a,i){const s=a.replace("#",""),r=parseInt(s.length===3?s.split("").map(_=>_+_).join(""):s,16);let m=r>>16&255,u=r>>8&255,f=r&255;return i>=0?(m+=(255-m)*i,u+=(255-u)*i,f+=(255-f)*i):(m*=1+i,u*=1+i,f*=1+i),`rgb(${m|0},${u|0},${f|0})`}function Fo(a,i,s,r,m,u){const f=Math.min(u,r/2,m/2);a.beginPath(),a.moveTo(i+f,s),a.arcTo(i+r,s,i+r,s+m,f),a.arcTo(i+r,s+m,i,s+m,f),a.arcTo(i,s+m,i,s,f),a.arcTo(i,s,i+r,s,f),a.closePath()}function Ke(a,i,s,r,m,u){const f=a.createLinearGradient(i,s,r,m);for(const[_,h]of u)f.addColorStop(_,h);return f}function Me(a,i,s,r,m,u,f,_,h=1.5){Fo(a,i,s,r,m,u),a.fillStyle=f,a.fill(),_&&(a.lineWidth=h,a.strokeStyle=_,a.stroke())}function cn(a,i,s,r,m,u,f,_=3){a.fillStyle=F(f,-.45),a.beginPath(),a.moveTo(i+r,s),a.lineTo(i+r+u,s-u*.6),a.lineTo(i+r+u,s+m-u*.6),a.lineTo(i+r,s+m),a.closePath(),a.fill(),a.fillStyle=F(f,.2),a.beginPath(),a.moveTo(i,s),a.lineTo(i+u,s-u*.6),a.lineTo(i+r+u,s-u*.6),a.lineTo(i+r,s),a.closePath(),a.fill(),Me(a,i,s,r,m,_,Ke(a,i,s,i,s+m,[[0,F(f,.08)],[1,F(f,-.25)]]))}function zn(a,i,s,r,m){a.save(),a.globalAlpha=.28,a.fillStyle=Ke(a,i,s,i+r*.6,s+m,[[0,"#ffffff"],[.45,"rgba(255,255,255,0.15)"],[.46,"rgba(255,255,255,0)"],[1,"rgba(255,255,255,0)"]]),a.fillRect(i,s,r,m),a.restore()}function ga(a,i,s,r,m,u,f=2){const _=u.rarity==="secret",h=_?Ke(a,i,s,i+r,s+m,[[0,"#050208"],[.5,"#12061f"],[1,"#000000"]]):Ke(a,i,s,i+r,s+m,[[0,F(u.color,.25)],[.55,u.accent],[1,F(u.accent,-.5)]]);Me(a,i,s,r,m,f,h),_?(a.save(),a.strokeStyle="rgba(192,132,252,0.9)",a.lineWidth=1.5,a.shadowColor="#c084fc",a.shadowBlur=10,Fo(a,i+1,s+1,r-2,m-2,f),a.stroke(),a.restore()):(a.save(),Fo(a,i,s,r,m,f),a.clip(),a.globalAlpha=.35,a.fillStyle=F(u.color,.6),a.beginPath(),a.arc(i+r*.3,s+m*.65,m*.35,0,Math.PI*2),a.fill(),a.globalAlpha=.25,a.fillStyle="#ffffff",a.beginPath(),a.arc(i+r*.72,s+m*.35,m*.22,0,Math.PI*2),a.fill(),a.restore()),zn(a,i,s,r,m)}function Be(a,i,s,r,m,u,f=1.5){a.beginPath(),a.arc(i,s,r,0,Math.PI*2),a.fillStyle=m,a.fill(),u&&(a.lineWidth=f,a.strokeStyle=u,a.stroke())}function Po(a,i,s,r,m){Be(a,i,s,r,"#0b0f19",F(m,.1),1.8),a.save(),a.strokeStyle=m,a.shadowColor=m,a.shadowBlur=6,a.lineWidth=1.4,a.beginPath(),a.arc(i,s,r*.82,0,Math.PI*2),a.stroke(),a.restore(),a.fillStyle="#334155";for(let u=0;u<5;u++){const f=u/5*Math.PI*2;a.beginPath(),a.ellipse(i+Math.cos(f)*r*.42,s+Math.sin(f)*r*.42,r*.4,r*.16,f+.6,0,Math.PI*2),a.fill()}Be(a,i,s,r*.22,F(m,-.2))}function Il(a,i,s,r,m="#cbd5e1"){Be(a,i,s,r,"#0f172a"),Be(a,i,s,r*.62,Ke(a,i-r,s-r,i+r,s+r,[[0,F(m,.3)],[1,F(m,-.4)]])),a.strokeStyle="#1e293b",a.lineWidth=1.2;for(let u=0;u<5;u++){const f=u/5*Math.PI*2;a.beginPath(),a.moveTo(i,s),a.lineTo(i+Math.cos(f)*r*.6,s+Math.sin(f)*r*.6),a.stroke()}Be(a,i,s,r*.15,"#0f172a")}function M2(a,i,s=1){const r=["legendary","mythic","ultra","secret","limited"].includes(i.rarity),m=88*s,u=52,f=-m/2,_=-34;a.fillStyle="#1f2937",a.beginPath(),a.moveTo(-18,26),a.lineTo(18,26),a.lineTo(24,32),a.lineTo(-24,32),a.closePath(),a.fill(),a.fillStyle="#374151",a.fillRect(-4,16,8,12),cn(a,f,_,m,u,4,"#111827",3);const h=r?1.5:3.5;ga(a,f+h,_+h,m-2*h,u-2*h,i,2),a.fillStyle=i.color,a.fillRect(-3,_+u-2,6,1.5)}function A2(a,i){const s=/ultrawide|49/i.test(i.name),r=s?92:72,m=s?36:44,u=-r/2,f=-36;a.fillStyle="#1f2937",a.fillRect(-4,f+m-2,8,22),Me(a,-20,22,40,7,3,"#111827"),s?(a.save(),a.beginPath(),a.moveTo(u,f+4),a.quadraticCurveTo(0,f-4,u+r,f+4),a.lineTo(u+r,f+m+4),a.quadraticCurveTo(0,f+m-4,u,f+m+4),a.closePath(),a.fillStyle="#0b1120",a.fill(),a.clip(),ga(a,u+2,f-2,r-4,m+6,i,1),a.restore()):(cn(a,u,f,r,m,3,"#0b1120",3),ga(a,u+2.5,f+2.5,r-5,m-5,i,2)),a.save(),a.strokeStyle=i.color,a.shadowColor=i.color,a.shadowBlur=6,a.lineWidth=1.5,a.beginPath(),a.moveTo(-14,29),a.lineTo(14,29),a.stroke(),a.restore()}function C2(a,i){const s=/fold/i.test(i.name),r=s?50:36,m=70;cn(a,-r/2,-m/2,r,m,3,"#0f172a",7),ga(a,-r/2+2.5,-m/2+2.5,r-5,m-5,i,5),s&&(a.strokeStyle="rgba(255,255,255,0.25)",a.lineWidth=1,a.beginPath(),a.moveTo(0,-m/2+3),a.lineTo(0,m/2-3),a.stroke()),Me(a,-6,-m/2+5,12,3.5,2,"#020617"),a.fillStyle=F(i.color,-.2),a.fillRect(r/2+2,-12,1.8,10)}function z2(a,i){cn(a,-40,-28,80,56,3,"#111827",6),ga(a,-36,-24,72,48,i,3),Be(a,0,-26,1.2,"#334155")}function $2(a,i){const s=/gaming/i.test(i.name);a.fillStyle="#111827",a.beginPath(),a.moveTo(-36,-30),a.lineTo(36,-30),a.lineTo(40,12),a.lineTo(-40,12),a.closePath(),a.fill(),a.save(),a.beginPath(),a.moveTo(-32,-26),a.lineTo(32,-26),a.lineTo(35.5,9),a.lineTo(-35.5,9),a.closePath(),a.clip(),ga(a,-36,-27,72,37,i,0),a.restore(),a.fillStyle=Ke(a,0,12,0,28,[[0,"#94a3b8"],[1,"#475569"]]),a.beginPath(),a.moveTo(-42,12),a.lineTo(42,12),a.lineTo(50,26),a.lineTo(-50,26),a.closePath(),a.fill(),a.fillStyle="#1e293b";for(let r=0;r<3;r++)for(let m=0;m<10;m++){const u=m/10,f=-38-r*2+u*(76+r*4);a.fillRect(f,14.5+r*3.4,6.4+r*.3,2.3)}s&&(a.save(),a.shadowColor=i.color,a.shadowBlur=8,a.strokeStyle=i.color,a.lineWidth=1.5,a.beginPath(),a.moveTo(-50,26.5),a.lineTo(50,26.5),a.stroke(),a.restore())}function O2(a,i){const s=/cinema|rig|12k/i.test(i.name);cn(a,-38,-20,76,44,5,s?"#1f2937":"#334155",6),Me(a,-26,-30,24,12,3,"#1f2937"),Me(a,-38,-20,16,44,5,"#111827"),Be(a,8,2,20,"#0f172a","#475569",3),Be(a,8,2,14,Ke(a,-6,-12,22,16,[[0,F(i.color,.3)],[.5,i.accent],[1,"#020617"]])),Be(a,3,-3,4,"rgba(255,255,255,0.55)"),Be(a,28,-14,3,i.color),s&&(Me(a,26,-36,20,14,2,"#111827"),ga(a,28,-34,16,10,i,1))}function R2(a,i){const s=/tower/i.test(i.name);if(/boom/i.test(i.name)){cn(a,-46,-22,92,44,5,i.accent,8),Be(a,-24,0,15,"#0f172a",F(i.color,.2),2.5),Be(a,24,0,15,"#0f172a",F(i.color,.2),2.5),Be(a,-24,0,7,i.color),Be(a,24,0,7,i.color),Me(a,-8,-14,16,8,2,F(i.color,.4)),a.strokeStyle="#cbd5e1",a.lineWidth=3,a.beginPath(),a.moveTo(-30,-22),a.quadraticCurveTo(0,-44,30,-22),a.stroke();return}const m=s?82:58;cn(a,-22,-m/2,44,m,5,"#1f2937",6),Be(a,0,-m/2+16,9,"#0f172a","#475569",2),Be(a,0,-m/2+16,4,i.color),Be(a,0,m/2-22,15,"#0f172a","#475569",2.5),Be(a,0,m/2-22,7,i.color),a.save(),a.strokeStyle=i.color,a.shadowColor=i.color,a.shadowBlur=6,a.lineWidth=1.2,a.beginPath(),a.arc(0,m/2-22,12,0,Math.PI*2),a.stroke(),a.restore()}function q2(a,i){Me(a,-12,-44,24,30,5,F(i.accent,-.2)),Me(a,-12,14,24,30,5,F(i.accent,-.2)),cn(a,-20,-22,40,44,3,"#1f2937",10),ga(a,-16,-18,32,36,i,8),a.save(),a.strokeStyle="#ffffff",a.globalAlpha=.85,a.lineWidth=3,a.lineCap="round",a.beginPath(),a.arc(0,0,10,-Math.PI/2,Math.PI*.9),a.stroke(),a.restore(),Me(a,22,-6,4,10,2,"#64748b")}function D2(a,i){a.strokeStyle=F(i.accent,-.3),a.lineWidth=7,a.lineCap="round",a.beginPath(),a.arc(0,4,34,Math.PI*1.05,Math.PI*1.95),a.stroke(),a.strokeStyle=F(i.color,.1),a.lineWidth=3,a.beginPath(),a.arc(0,4,34,Math.PI*1.1,Math.PI*1.9),a.stroke();for(const s of[-1,1])Me(a,s*34-11,-8,22,36,10,Ke(a,0,-8,0,28,[[0,F(i.color,.1)],[1,F(i.accent,-.3)]])),Me(a,s*34-7,-3,14,26,7,"#0f172a"),Be(a,s*34,10,3,i.color)}function U2(a,i){a.strokeStyle="#334155",a.lineWidth=5;for(const[s,r]of[[-30,-18],[30,-18],[-30,18],[30,18]])a.beginPath(),a.moveTo(0,0),a.lineTo(s,r),a.stroke();for(const[s,r]of[[-30,-18],[30,-18],[-30,18],[30,18]])Be(a,s,r,5,"#1f2937"),a.save(),a.globalAlpha=.45,a.fillStyle=i.color,a.beginPath(),a.ellipse(s,r-3,17,4,0,0,Math.PI*2),a.fill(),a.restore();Me(a,-16,-12,32,24,8,Ke(a,0,-12,0,12,[[0,F(i.color,.25)],[1,i.accent]])),Be(a,0,13,6,"#0f172a","#475569",1.5),Be(a,0,13,3,F(i.color,.4)),zn(a,-16,-12,32,12)}function L2(a,i){const s=/titan|rig x/i.test(i.name),r=s?52:44,m=s?86:78;cn(a,-r/2,-m/2,r,m,10,"#0f172a",4),Me(a,-r/2+4,-m/2+4,r-8,m-8,3,"rgba(15,23,42,0.6)","rgba(148,163,184,0.35)",1);const u=(r-12)/4.2;Po(a,-r/4+1,-m/2+16,u,i.color),Po(a,r/4-1,-m/2+16,u,i.color),Po(a,0,-m/2+16+u*2.4,u*1.1,F(i.color,.2)),Me(a,-r/2+7,m/2-26,r-14,7,1.5,"#1e293b"),a.save(),a.fillStyle=i.color,a.shadowColor=i.color,a.shadowBlur=8,a.fillRect(-r/2+7,m/2-20,r-14,2),a.fillRect(-r/2+2,-m/2+6,1.8,m-12),a.restore(),zn(a,-r/2,-m/2,r,m)}function H2(a,i){const s=/prototype|phantom/i.test(i.name);cn(a,-44,-14,88,30,9,s?"#0b0b12":"#e5e7eb",5),s||Me(a,-44,-14,88,9,4,F(i.color,.2)),a.save(),a.fillStyle=s?"#c084fc":i.color,a.shadowColor=a.fillStyle,a.shadowBlur=10,a.fillRect(-36,6,72,2.2),a.restore(),Me(a,14,-4,22,3,1.5,"#1f2937"),Be(a,-32,1,2.2,s?"#c084fc":"#22c55e"),zn(a,-44,-14,88,30)}function Y2(a,i){const s=Ke(a,0,-20,0,24,[[0,F(i.color,.15)],[1,F(i.accent,-.25)]]);a.beginPath(),a.moveTo(-30,-16),a.bezierCurveTo(-12,-22,12,-22,30,-16),a.bezierCurveTo(44,-12,50,18,42,26),a.bezierCurveTo(34,34,24,20,16,14),a.lineTo(-16,14),a.bezierCurveTo(-24,20,-34,34,-42,26),a.bezierCurveTo(-50,18,-44,-12,-30,-16),a.closePath(),a.fillStyle=s,a.fill(),a.strokeStyle=F(i.accent,-.5),a.lineWidth=1.5,a.stroke(),a.fillStyle="#1e293b",a.fillRect(-32,-6,14,4.5),a.fillRect(-27.3,-11,4.5,14);const r=["#22d3ee","#f43f5e","#facc15","#4ade80"];[[26,-10],[32,-4],[26,2],[20,-4]].forEach(([m,u],f)=>Be(a,m,u,3,r[f])),Be(a,-10,6,6,"#0f172a","#334155",2),Be(a,10,6,6,"#0f172a","#334155",2),zn(a,-44,-20,88,16)}function B2(a,i){cn(a,-46,-16,92,34,7,"#111827",4),Me(a,-50,-18,5,40,1,"#94a3b8");const s=/founders|frostbite/i.test(i.name)?3:2;for(let r=0;r<s;r++){const m=-46+92/(s+1)*(r+1);Po(a,m,1,13,i.color)}a.save(),a.fillStyle=i.color,a.shadowColor=i.color,a.shadowBlur=10,a.fillRect(-44,-15,88,2),a.restore(),Me(a,-40,18,60,4,1,"#b45309")}function G2(a,i){a.fillStyle="#1f2937",a.fillRect(-46,18,4,22),a.fillRect(42,18,4,22),cn(a,-48,12,96,7,6,"#334155",2);const s=(r,m,u,f)=>{a.fillStyle="#111827",a.fillRect(r+u/2-1.5,m+f,3,12-(m+f-0)),Me(a,r,m,u,f,2,"#0b1120"),ga(a,r+1.5,m+1.5,u-3,f-3,i,1)};s(-44,-16,28,20),s(-15,-24,34,26),s(20,-16,28,20),cn(a,30,-6,14,18,4,"#0f172a",2),a.save(),a.fillStyle=i.color,a.shadowColor=i.color,a.shadowBlur=8,a.fillRect(32,-3,1.5,12),a.fillRect(-46,19.5,92,1.5),a.restore(),Me(a,-14,6,26,5,1.5,"#0f172a"),Me(a,16,6,7,5,2,"#475569")}function I2(a,i){a.strokeStyle="#1f2937",a.lineWidth=6,a.beginPath(),a.ellipse(0,-6,42,26,0,Math.PI,Math.PI*2),a.stroke(),cn(a,-40,-14,80,36,6,F(i.accent,-.2),14),Me(a,-35,-10,70,26,12,Ke(a,-35,-10,35,16,[[0,"#020617"],[.5,F(i.accent,-.3)],[1,"#020617"]])),a.save(),a.globalAlpha=.8,a.fillStyle=i.color,a.shadowColor=i.color,a.shadowBlur=12,a.fillRect(-26,1,52,2.5),a.restore(),zn(a,-35,-10,70,26)}function X2(a,i){a.fillStyle="#111827",a.beginPath(),a.moveTo(-40,-14),a.lineTo(40,-14),a.lineTo(48,16),a.lineTo(-48,16),a.closePath(),a.fill();for(let s=0;s<4;s++)for(let r=0;r<11;r++){const m=(s+.5)/4,u=-40-8*m,f=80+16*m,_=u+r/11*f+.8,h=(r*30+s*40)%360;a.fillStyle=/rgb|kryo/i.test(i.name)?`hsl(${h},80%,60%)`:"#334155",a.fillRect(_,-11+s*6.6,f/11-1.6,4.8)}a.save(),a.strokeStyle=i.color,a.shadowColor=i.color,a.shadowBlur=8,a.lineWidth=1.5,a.beginPath(),a.moveTo(-48,17),a.lineTo(48,17),a.stroke(),a.restore()}function V2(a,i){Me(a,-48,-20,96,40,18,Ke(a,0,-20,0,20,[[0,F(i.color,.1)],[1,F(i.accent,-.3)]])),Me(a,-26,-14,52,28,3,"#0b1120"),ga(a,-24,-12,48,24,i,2),Be(a,-37,-2,5,"#0f172a","#334155",1.5),[[36,-8],[41,-3],[36,2],[31,-3]].forEach(([s,r])=>Be(a,s,r,2.4,"#1e293b"))}function Ps(a,i,s){const r=i.color,m=Ke(a,0,-20,0,20,[[0,F(r,.35)],[.5,r],[1,F(r,-.45)]]);a.beginPath(),s==="suv"?(a.moveTo(-48,14),a.lineTo(-48,-2),a.lineTo(-40,-6),a.lineTo(-30,-24),a.lineTo(24,-24),a.lineTo(36,-6),a.lineTo(48,-2),a.lineTo(48,14)):s==="car"?(a.moveTo(-46,14),a.lineTo(-46,-2),a.lineTo(-38,-5),a.lineTo(-26,-22),a.lineTo(14,-22),a.lineTo(30,-6),a.lineTo(46,-2),a.lineTo(46,14)):s==="sports_car"?(a.moveTo(-48,12),a.lineTo(-48,0),a.lineTo(-30,-4),a.quadraticCurveTo(-14,-20,8,-18),a.lineTo(26,-6),a.lineTo(48,-2),a.lineTo(48,12)):(a.moveTo(-50,10),a.lineTo(-50,-2),a.lineTo(-32,-6),a.quadraticCurveTo(-10,-18,10,-14),a.lineTo(30,-6),a.lineTo(50,0),a.lineTo(50,10)),a.closePath(),a.fillStyle=m,a.fill(),a.strokeStyle=F(r,-.6),a.lineWidth=1.2,a.stroke(),a.beginPath(),s==="suv"?(a.moveTo(-36,-7),a.lineTo(-28,-21),a.lineTo(22,-21),a.lineTo(32,-7)):s==="car"?(a.moveTo(-34,-6),a.lineTo(-24,-19),a.lineTo(12,-19),a.lineTo(25,-6)):s==="sports_car"?(a.moveTo(-26,-5),a.quadraticCurveTo(-12,-16,6,-15),a.lineTo(20,-6)):(a.moveTo(-26,-6),a.quadraticCurveTo(-8,-15,8,-12),a.lineTo(22,-6)),a.closePath(),a.fillStyle=Ke(a,0,-20,0,-5,[[0,"#94a3b8"],[1,"#0f172a"]]),a.fill(),Be(a,46,2,2.5,"#fef9c3"),a.fillStyle="#ef4444",a.fillRect(-49,1,3,4),s==="hypercar"&&(a.fillStyle=F(r,-.5),a.fillRect(-50,-16,16,3),a.fillRect(-44,-13,2,8),a.save(),a.strokeStyle=i.rarity==="secret"?"#c084fc":F(r,.6),a.shadowColor=a.strokeStyle,a.shadowBlur=8,a.lineWidth=1.5,a.beginPath(),a.moveTo(-40,6),a.lineTo(40,4),a.stroke(),a.restore());const u=s==="suv"?11:s==="car"?10:10.5;Il(a,-28,13,u),Il(a,30,13,u),zn(a,-48,-22,96,18)}function P2(a,i){const s=/moped|scoot/i.test(i.name);Il(a,-30,16,14),Il(a,32,16,14),a.strokeStyle="#475569",a.lineWidth=3,a.beginPath(),a.moveTo(-30,16),a.lineTo(-6,-2),a.lineTo(22,-2),a.lineTo(32,16),a.stroke(),a.beginPath(),a.moveTo(24,-2),a.lineTo(28,-20),a.stroke(),a.fillStyle="#1f2937",a.fillRect(22,-23,14,3);const r=Ke(a,0,-14,0,6,[[0,F(i.color,.3)],[1,i.accent]]);a.beginPath(),s?(a.moveTo(-18,8),a.lineTo(-10,-8),a.lineTo(10,-8),a.lineTo(16,8),a.closePath()):(a.moveTo(-14,-2),a.quadraticCurveTo(-2,-18,18,-10),a.lineTo(22,2),a.lineTo(-12,4),a.closePath()),a.fillStyle=r,a.fill(),Me(a,-26,-8,20,6,3,"#111827"),/neon|superbike|track/i.test(i.name)&&(a.save(),a.strokeStyle=i.color,a.shadowColor=i.color,a.shadowBlur=10,a.lineWidth=1.5,a.beginPath(),a.arc(-30,16,14,0,Math.PI*2),a.arc(32,16,14,0,Math.PI*2),a.stroke(),a.restore())}function Q2(a,i){const s=Ke(a,0,-20,0,14,[[0,F(i.color,.25)],[1,F(i.accent,-.1)]]);a.beginPath(),a.moveTo(-44,10),a.lineTo(-44,-6),a.quadraticCurveTo(-42,-20,-26,-20),a.lineTo(-10,-14),a.quadraticCurveTo(8,-2,30,-2),a.quadraticCurveTo(46,0,46,10),a.closePath(),a.fillStyle=s,a.fill(),a.strokeStyle=F(i.accent,-.5),a.lineWidth=1.2,a.stroke(),Me(a,-46,8,94,9,4,i.rarity==="secret"?"#1e1b4b":"#f8fafc"),a.fillStyle=F(i.color,-.3),a.fillRect(-44,14,90,2),a.fillStyle=i.rarity==="secret"?"#c084fc":"#ffffff",a.beginPath(),a.moveTo(-30,2),a.lineTo(-6,-8),a.lineTo(-10,-2),a.lineTo(16,-6),a.lineTo(-8,6),a.lineTo(-4,0),a.closePath(),a.fill(),a.strokeStyle="#ffffff",a.lineWidth=1.4;for(let r=0;r<4;r++)a.beginPath(),a.moveTo(-22+r*5,-17+r*2.2),a.lineTo(-17+r*5,-13+r*2.2),a.stroke();/zero-g|hover|glow/i.test(i.name)&&(a.save(),a.fillStyle=i.rarity==="secret"?"#c084fc":i.color,a.shadowColor=a.fillStyle,a.shadowBlur=14,a.globalAlpha=.7,a.fillRect(-42,19,86,2),a.restore())}function z_(a,i,s){const r=Ke(a,0,-30,0,36,[[0,F(i.color,.2)],[1,F(i.accent,-.2)]]);a.beginPath(),a.moveTo(-18,-30),a.lineTo(-40,-18),a.lineTo(-48,16),a.lineTo(-36,18),a.lineTo(-30,-2),a.lineTo(-28,36),a.lineTo(28,36),a.lineTo(30,-2),a.lineTo(36,18),a.lineTo(48,16),a.lineTo(40,-18),a.lineTo(18,-30),a.quadraticCurveTo(0,-18,-18,-30),a.closePath(),a.fillStyle=r,a.fill(),a.strokeStyle=F(i.accent,-.5),a.lineWidth=1.2,a.stroke(),s?(a.strokeStyle="#e2e8f0",a.lineWidth=1.5,a.beginPath(),a.moveTo(0,-22),a.lineTo(0,36),a.stroke(),a.fillStyle=F(i.color,.4),a.fillRect(-28,30,56,6),a.fillStyle=F(i.color,-.3),a.beginPath(),a.moveTo(-18,-30),a.lineTo(-6,-14),a.lineTo(0,-22),a.lineTo(6,-14),a.lineTo(18,-30),a.quadraticCurveTo(0,-24,-18,-30),a.fill(),/reflect|aurora/i.test(i.name)&&(a.save(),a.fillStyle=/aurora/i.test(i.name)?"#a5f3fc":"#e2e8f0",a.globalAlpha=.8,a.fillRect(-28,10,56,3),a.fillRect(-44,8,8,3),a.fillRect(36,8,8,3),a.restore())):(a.strokeStyle=F(i.accent,-.4),a.lineWidth=2,a.beginPath(),a.moveTo(-16,-30),a.quadraticCurveTo(0,-6,16,-30),a.stroke(),Me(a,-16,14,32,12,4,F(i.color,-.12)),a.strokeStyle="#f8fafc",a.lineWidth=1.2,a.beginPath(),a.moveTo(-5,-16),a.lineTo(-6,-2),a.moveTo(5,-16),a.lineTo(6,-2),a.stroke()),zn(a,-40,-30,80,30)}function Z2(a,i){a.beginPath(),a.moveTo(-34,8),a.quadraticCurveTo(-34,-30,0,-30),a.quadraticCurveTo(34,-30,34,8),a.closePath(),a.fillStyle=Ke(a,0,-30,0,8,[[0,F(i.color,.3)],[1,i.accent]]),a.fill(),a.beginPath(),a.moveTo(-10,6),a.quadraticCurveTo(30,0,52,14),a.quadraticCurveTo(28,18,-10,14),a.closePath(),a.fillStyle=F(i.accent,-.3),a.fill(),Be(a,0,-29,3,F(i.accent,-.3)),Me(a,-10,-16,20,10,3,"#f8fafc"),a.fillStyle=i.accent,a.font="bold 7px system-ui, sans-serif",a.textAlign="center",a.fillText(i.brand[0],0,-8.5)}function K2(a,i){a.strokeStyle="#1f2937",a.lineWidth=3,a.beginPath(),a.moveTo(-46,-8),a.lineTo(-40,-6),a.moveTo(46,-8),a.lineTo(40,-6),a.moveTo(-6,-4),a.quadraticCurveTo(0,-9,6,-4),a.stroke();for(const s of[-1,1])a.beginPath(),a.ellipse(s*22,2,19,13,0,0,Math.PI*2),a.fillStyle=Ke(a,s*22-19,-11,s*22+19,15,[[0,F(i.color,.2)],[.6,i.accent],[1,"#020617"]]),a.fill(),a.strokeStyle="#111827",a.lineWidth=2.5,a.stroke(),zn(a,s*22-19,-11,38,13)}function W2(a,i){a.strokeStyle=F(i.accent,-.4),a.lineWidth=5,a.beginPath(),a.arc(0,-30,10,Math.PI,Math.PI*2),a.stroke(),Me(a,-30,-32,60,70,18,Ke(a,0,-32,0,38,[[0,F(i.color,.2)],[1,i.accent]]),F(i.accent,-.5)),Me(a,-20,6,40,24,8,F(i.color,-.15)),a.strokeStyle="#f8fafc",a.lineWidth=1.5,a.beginPath(),a.moveTo(-14,10),a.lineTo(14,10),a.stroke(),/holo/i.test(i.name)&&(a.save(),a.globalAlpha=.55,a.fillStyle=Ke(a,-30,-32,30,38,[[0,"#f0abfc"],[.5,"#67e8f9"],[1,"#fde68a"]]),Fo(a,-30,-32,60,70,18),a.fill(),a.restore()),zn(a,-30,-32,60,40)}function J2(a,i){const s=/gold|royal|tourbillon|gala|chrono/i.test(i.name),r=s?"#b45309":"#475569";Me(a,-13,-48,26,30,4,r),Me(a,-13,18,26,30,4,r);for(let f=0;f<4;f++)a.fillStyle="rgba(0,0,0,0.25)",a.fillRect(-13,-44+f*7,26,1.2),a.fillRect(-13,22+f*7,26,1.2);const m=s?Ke(a,-26,-26,26,26,[[0,"#fde68a"],[.5,"#f59e0b"],[1,"#78350f"]]):Ke(a,-26,-26,26,26,[[0,"#f1f5f9"],[1,"#475569"]]);Be(a,0,0,26,m);const u=/skeleton|tourbillon/i.test(i.name);if(Be(a,0,0,21,u?"#0f172a":Ke(a,0,-21,0,21,[[0,F(i.color,.3)],[1,i.accent]])),u){a.strokeStyle=s?"#fbbf24":"#94a3b8",a.lineWidth=1;for(let f=0;f<6;f++)a.beginPath(),a.arc(0,0,5+f*2.6,f,f+2.5),a.stroke();Be(a,0,8,6,"rgba(251,191,36,0.3)","#fbbf24",1)}a.fillStyle=s?"#fef3c7":"#f8fafc";for(let f=0;f<12;f++){const _=f/12*Math.PI*2;a.fillRect(Math.cos(_)*17-1,Math.sin(_)*17-1,2,2)}a.strokeStyle=s?"#fef3c7":"#f8fafc",a.lineWidth=2,a.lineCap="round",a.beginPath(),a.moveTo(0,0),a.lineTo(0,-13),a.moveTo(0,0),a.lineTo(9,5),a.stroke(),Me(a,25,-4,5,8,2,s?"#f59e0b":"#94a3b8"),zn(a,-21,-21,42,21)}function F2(a,i){const r=!/silver/i.test(i.name)?"#fbbf24":"#e2e8f0";a.lineWidth=2.5;for(let f=0;f<=18;f++){const _=Math.PI*.12+f/18*Math.PI*.76,h=Math.cos(_)*40,b=-32+Math.sin(_)*50;a.strokeStyle=f%2?F(r,-.25):r,a.beginPath(),a.ellipse(h,b,4,2.6,_,0,Math.PI*2),a.stroke()}const m=/crown/i.test(i.name),u=Ke(a,-14,16,14,42,[[0,F(r,.4)],[1,F(r,-.4)]]);a.fillStyle=u,a.beginPath(),m?(a.moveTo(-14,36),a.lineTo(-14,20),a.lineTo(-7,28),a.lineTo(0,16),a.lineTo(7,28),a.lineTo(14,20),a.lineTo(14,36)):(a.moveTo(0,16),a.lineTo(13,29),a.lineTo(0,42),a.lineTo(-13,29)),a.closePath(),a.fill(),/diamond|crown/i.test(i.name)&&(Be(a,0,29,4,"#e0f2fe"),Be(a,-1,28,1.5,"#ffffff"))}function ew(a,i){a.lineWidth=7,a.strokeStyle=Ke(a,-26,0,26,0,[[0,"#fde68a"],[.5,"#b45309"],[1,"#fde68a"]]),a.beginPath(),a.ellipse(0,12,26,20,0,0,Math.PI*2),a.stroke(),Qo(a,0,-16,13,i.color)}function Qo(a,i,s,r,m){const u=[[-1,-.35],[-.55,-.9],[.55,-.9],[1,-.35],[0,1]];a.beginPath(),u.forEach(([f,_],h)=>h?a.lineTo(i+f*r,s+_*r):a.moveTo(i+f*r,s+_*r)),a.closePath(),a.fillStyle=Ke(a,i-r,s-r,i+r,s+r,[[0,F(m,.6)],[.5,m],[1,F(m,-.5)]]),a.fill(),a.strokeStyle="rgba(255,255,255,0.7)",a.lineWidth=.9,a.beginPath(),a.moveTo(i-r,s-.35*r),a.lineTo(i+r,s-.35*r),a.moveTo(i-.55*r,s-.9*r),a.lineTo(i-.3*r,s-.35*r),a.lineTo(i,s+r),a.lineTo(i+.3*r,s-.35*r),a.lineTo(i+.55*r,s-.9*r),a.stroke()}function tw(a,i){const s=i.rarity==="secret"?"#1e1b4b":/emerald/i.test(i.name)?"#34d399":/studs/i.test(i.name)?"#e0f2fe":i.color;if(/studs/i.test(i.name)){Qo(a,-20,0,18,s),Qo(a,20,0,18,s);return}Qo(a,0,4,42,s),i.rarity==="secret"&&(a.save(),a.strokeStyle="#c084fc",a.shadowColor="#c084fc",a.shadowBlur=16,a.lineWidth=2,a.beginPath(),a.arc(0,4,20,0,Math.PI*2),a.stroke(),a.restore())}function nw(a){const i=(s,r)=>{a.beginPath(),a.moveTo(s-20,r+10),a.lineTo(s-14,r-6),a.lineTo(s+14,r-6),a.lineTo(s+20,r+10),a.closePath(),a.fillStyle=Ke(a,s,r-6,s,r+10,[[0,"#fde68a"],[.5,"#f59e0b"],[1,"#92400e"]]),a.fill(),a.fillStyle="rgba(255,255,255,0.45)",a.fillRect(s-12,r-4,24,2)};i(-21,22),i(21,22),i(0,6),i(-10,-10),i(12,-10)}function aw(a,i){Me(a,-8,-44,16,14,3,"#fbbf24"),Me(a,-5,-32,10,8,1,"#d97706"),a.beginPath(),a.moveTo(-24,-24),a.lineTo(24,-24),a.lineTo(30,30),a.quadraticCurveTo(0,40,-30,30),a.closePath(),a.fillStyle="rgba(226,232,240,0.35)",a.fill(),a.strokeStyle="rgba(255,255,255,0.7)",a.lineWidth=1.5,a.stroke(),a.save(),a.clip(),a.fillStyle=Ke(a,0,-10,0,36,[[0,F(i.color,.2)],[1,i.accent]]),a.fillRect(-32,-8,64,46),a.restore(),Me(a,-14,2,28,14,2,"#f8fafc"),a.fillStyle="#0f172a",a.font="bold 7px system-ui, sans-serif",a.textAlign="center",a.fillText(i.brand,0,12),zn(a,-24,-24,48,60)}function iw(a,i){const s=i.rarity==="secret";if(Be(a,0,0,36,s?Ke(a,-36,-36,36,36,[[0,"#1e1b4b"],[1,"#020617"]]):Ke(a,-36,-36,36,36,[[0,F(i.color,.5)],[.6,i.color],[1,F(i.accent,-.3)]])),a.strokeStyle=s?"#c084fc":F(i.accent,-.4),a.lineWidth=2,a.beginPath(),a.arc(0,0,36,0,Math.PI*2),a.moveTo(-36,0),a.quadraticCurveTo(0,14,36,0),a.moveTo(0,-36),a.quadraticCurveTo(-14,0,0,36),a.stroke(),/championship|signature|golden/i.test(i.name)){a.fillStyle="#fbbf24",a.beginPath();for(let r=0;r<10;r++){const m=r%2?5:11,u=r/10*Math.PI*2-Math.PI/2;a.lineTo(Math.cos(u)*m-14,Math.sin(u)*m-12)}a.closePath(),a.fill()}a.save(),a.globalAlpha=.35,Be(a,-12,-14,12,"#ffffff"),a.restore()}function lw(a,i){const s=/hover/i.test(i.name);a.save(),a.rotate(-.18),s?(a.save(),a.fillStyle=i.color,a.shadowColor=i.color,a.shadowBlur=18,a.globalAlpha=.6,a.beginPath(),a.ellipse(0,14,40,5,0,0,Math.PI*2),a.fill(),a.restore()):(Il(a,-30,12,5.5,"#fde68a"),Il(a,30,12,5.5,"#fde68a")),Me(a,-48,-2,96,10,5,Ke(a,0,-2,0,8,[[0,F(i.color,.3)],[1,i.accent]]),F(i.accent,-.5)),a.fillStyle="rgba(0,0,0,0.3)",a.fillRect(-30,0,60,2),a.restore()}function sw(a,i){for(const r of[-28,28]){a.strokeStyle="#0f172a",a.lineWidth=4,a.beginPath(),a.arc(r,14,18,0,Math.PI*2),a.stroke(),a.strokeStyle="#94a3b8",a.lineWidth=.8;for(let m=0;m<8;m++){const u=m/8*Math.PI*2;a.beginPath(),a.moveTo(r,14),a.lineTo(r+Math.cos(u)*18,14+Math.sin(u)*18),a.stroke()}}a.strokeStyle=i.color,a.lineWidth=4,a.lineJoin="round",a.beginPath(),a.moveTo(-28,14),a.lineTo(-8,-10),a.lineTo(20,-10),a.lineTo(0,14),a.lineTo(-28,14),a.moveTo(0,14),a.lineTo(-10,-16),a.moveTo(20,-10),a.lineTo(28,14),a.moveTo(20,-10),a.lineTo(18,-20),a.stroke(),Me(a,-18,-21,16,5,2.5,"#111827"),a.strokeStyle="#111827",a.lineWidth=3,a.beginPath(),a.moveTo(12,-21),a.lineTo(26,-20),a.stroke()}function rw(a,i){a.save(),a.rotate(-.5);const s=/golden/i.test(i.name)?"#fbbf24":i.color;a.beginPath(),a.ellipse(0,-14,22,28,0,0,Math.PI*2),a.strokeStyle=s,a.lineWidth=5,a.stroke(),a.save(),a.clip(),a.strokeStyle="rgba(255,255,255,0.6)",a.lineWidth=.8;for(let r=-22;r<=22;r+=5)a.beginPath(),a.moveTo(r,-44),a.lineTo(r,16),a.stroke(),a.beginPath(),a.moveTo(-24,r-14),a.lineTo(24,r-14),a.stroke();a.restore(),a.fillStyle=s,a.fillRect(-2.5,14,5,12),Me(a,-4,24,8,24,3,"#1f2937"),a.restore()}function ow(a,i){a.strokeStyle="#cbd5e1",a.lineWidth=3,a.beginPath(),a.moveTo(-26,-40),a.lineTo(10,26),a.stroke(),Me(a,-32,-46,10,14,3,"#111827"),a.beginPath(),a.moveTo(6,22),a.quadraticCurveTo(30,18,30,30),a.lineTo(8,32),a.closePath(),a.fillStyle=Ke(a,6,18,30,32,[[0,F(i.color,.4)],[1,i.accent]]),a.fill(),/set/i.test(i.name)&&(a.strokeStyle="#94a3b8",a.beginPath(),a.moveTo(20,-40),a.lineTo(-6,26),a.stroke(),Me(a,16,-46,10,12,3,"#111827")),Be(a,34,36,6,"#f8fafc","#cbd5e1",1)}function cw(a,i){a.save(),a.rotate(.6),a.beginPath(),a.ellipse(0,0,16,48,0,0,Math.PI*2),a.fillStyle=Ke(a,-16,0,16,0,[[0,F(i.color,.3)],[1,i.accent]]),a.fill(),a.strokeStyle="#f8fafc",a.lineWidth=3,a.beginPath(),a.moveTo(0,-46),a.lineTo(0,46),a.stroke(),a.fillStyle="#0f172a",a.beginPath(),a.moveTo(-3,36),a.lineTo(0,46),a.lineTo(3,36),a.fill(),a.restore()}function dw(a,i){const s=/platinum/i.test(i.name),r=s?["#f1f5f9","#94a3b8","#475569"]:["#fef3c7","#f59e0b","#78350f"],m=Ke(a,-24,-40,24,10,[[0,r[0]],[.5,r[1]],[1,r[2]]]);a.strokeStyle=r[1],a.lineWidth=5,a.beginPath(),a.arc(-24,-18,10,Math.PI*.5,Math.PI*1.5),a.arc(24,-18,10,-Math.PI*.5,Math.PI*.5),a.stroke(),a.beginPath(),a.moveTo(-26,-40),a.lineTo(26,-40),a.quadraticCurveTo(24,0,0,6),a.quadraticCurveTo(-24,0,-26,-40),a.closePath(),a.fillStyle=m,a.fill(),a.fillStyle=r[1],a.fillRect(-4,6,8,14),cn(a,-20,20,40,14,5,"#1f2937",2),Me(a,-12,24,24,6,1,r[1]),a.fillStyle=s?"#e879f9":i.color,a.beginPath();for(let u=0;u<10;u++){const f=u%2?4:9,_=u/10*Math.PI*2-Math.PI/2;a.lineTo(Math.cos(_)*f,-20+Math.sin(_)*f)}a.closePath(),a.fill(),zn(a,-26,-40,52,20)}const $_={tv:(a,i)=>M2(a,i,/120|150|98|holo|hyper/i.test(i.name)?1.08:1),monitor:A2,phone:C2,tablet:z2,laptop:$2,camera:O2,speaker:R2,smartwatch:q2,headphones:D2,drone:U2,gaming_pc:L2,console:H2,controller:Y2,gpu:B2,gaming_setup:G2,vr_headset:I2,keyboard:X2,handheld:V2,car:(a,i)=>Ps(a,i,"car"),suv:(a,i)=>Ps(a,i,"suv"),sports_car:(a,i)=>Ps(a,i,"sports_car"),supercar:(a,i)=>Ps(a,i,"supercar"),hypercar:(a,i)=>Ps(a,i,"hypercar"),motorbike:P2,sneakers:Q2,hoodie:(a,i)=>z_(a,i,!1),jacket:(a,i)=>z_(a,i,!0),cap:Z2,sunglasses:K2,backpack:W2,luxury_watch:J2,chain:F2,ring:ew,diamond:tw,gold_bar:a=>nw(a),perfume:aw,ball:iw,skateboard:lw,bicycle:sw,racket:rw,golf:ow,surfboard:cw,trophy:dw};function uw(a,i,s){a.save(),a.scale(s/100,s/100),a.lineJoin="round";const r=$_[i.kind]||$_.tablet;try{r(a,i)}catch(m){console.warn("art failed",i.kind,m)}a.restore()}const O_=new Map,R_=new Map;function mw(a,i){const s=a.id+"@"+i;let r=O_.get(s);if(r)return r;r=document.createElement("canvas"),r.width=i,r.height=i;const m=r.getContext("2d");return m.translate(i/2,i/2),uw(m,a,i*.86),O_.set(s,r),r}function ac(a,i=128){const s=a.id+"@"+i;let r=R_.get(s);return r||(r=mw(a,i).toDataURL("image/png"),R_.set(s,r)),r}function Ft({id:a,size:i=40,className:s="",mutation:r}){const m=B(u=>u.itemsById[a]);return m?c.jsx("img",{className:"item-icon "+s+(r?" mutf-"+r:""),src:ac(m,i>80?160:96),width:i,height:i,alt:m.name,draggable:!1}):c.jsx("span",{style:{width:i,height:i,display:"inline-block"}})}function Ra({m:a,mult:i=!0}){const s=ea(a);return!a||!s?null:c.jsxs("span",{className:"mut m-"+a,children:[s.label,i?` ×${s.mult}`:""]})}function gi({r:a}){return c.jsx("span",{className:`rlabel r-${a}`,children:qe[a]?.label??a})}function fw({it:a}){const i=B(s=>s.market[a.id]?.minted);return a.max_supply?c.jsxs("span",{className:"supply",children:[i??"?","/",a.max_supply]}):null}function An({id:a,serial:i,onClick:s,selected:r,unknown:m,footer:u,badge:f,showIncome:_=!0,mutation:h}){const b=B(w=>w.itemsById[a]),x=B(w=>w.market[a]?.price),y=B(w=>h?w.catalog?.mutations?.find(A=>A.id===h)?.mult??1:1);if(!b)return null;const v=b.rarity;return c.jsxs("div",{className:`icard r-${v} ${r?"sel":""} ${m?"unknown":""} ${h?"mutated m-"+h:""}`,onClick:s,role:s?"button":void 0,children:[c.jsxs("div",{className:"corner",children:[f,h&&c.jsx(Ra,{m:h})]}),c.jsx("div",{className:"corner-r",children:!m&&b.max_supply?c.jsx(fw,{it:b}):null}),c.jsx("img",{className:"art"+(h?" mutf-"+h:""),src:ac(b,160),alt:m?"Unknown item":b.name,draggable:!1}),c.jsx("div",{className:"nm",children:m?"???":b.name}),c.jsxs("div",{style:{margin:"4px 0"},children:[c.jsx(gi,{r:v}),i?c.jsxs("span",{className:"dim",style:{fontWeight:800,fontSize:12,marginLeft:6},children:["#",i]}):null]}),!m&&c.jsxs(c.Fragment,{children:[c.jsx("div",{className:"val",children:Ue((x??b.base_value)*y)}),_&&c.jsxs("div",{className:"inc",children:["+",Cn(b.base_income*y)]})]}),u]})}function ic({children:a,onConfirm:i,className:s="btn primary big block",ms:r=900,disabled:m}){const[u,f]=L.useState(0),_=L.useRef(0),h=L.useRef(0),b=L.useRef(!1),x=()=>{cancelAnimationFrame(_.current),b.current||f(0)},y=()=>{if(m)return;b.current=!1,h.current=performance.now();const v=w=>{const A=Math.min(1,(w-h.current)/r);if(f(A),A>=1){b.current=!0,te("coin"),i(),window.setTimeout(()=>f(0),300);return}_.current=requestAnimationFrame(v)};_.current=requestAnimationFrame(v)};return L.useEffect(()=>()=>cancelAnimationFrame(_.current),[]),c.jsxs("button",{className:s+" hold",disabled:m,onPointerDown:y,onPointerUp:x,onPointerLeave:x,onPointerCancel:x,onKeyDown:v=>{(v.key==="Enter"||v.key===" ")&&(v.preventDefault(),i())},children:[c.jsx("i",{className:"fill",style:{transform:`scaleX(${u})`}}),c.jsx("span",{children:u>0&&u<1?"KEEP HOLDING…":a})]})}function nn({title:a,icon:i,children:s,onClose:r,head:m}){return c.jsx("div",{className:"panel-wrap",children:c.jsxs("div",{className:"panel",role:"dialog","aria-label":a,children:[c.jsxs("div",{className:"panel-head",children:[c.jsx("span",{className:"e",children:i}),c.jsx("h2",{children:a}),m,c.jsx("button",{className:"icon-btn","aria-label":"Close",onClick:()=>{te("click"),(r||(()=>De(null)))()},children:"✕"})]}),c.jsx("div",{className:"panel-body",children:s})]})})}function ba({tabs:a,value:i,onChange:s}){return c.jsx("div",{className:"tabs",role:"tablist",children:a.map(r=>c.jsxs("button",{role:"tab","aria-selected":i===r.id,className:i===r.id?"on":"",onClick:()=>{te("tick"),s(r.id)},children:[r.label,r.badge?c.jsx("span",{className:"badge",children:r.badge}):null]},r.id))})}function nt({k:a,v:i,cls:s=""}){return c.jsxs("div",{className:"stat",children:[c.jsx("div",{className:"k",children:a}),c.jsx("div",{className:"v "+s,children:i})]})}function lc({id:a,name:i,bot:s,level:r}){return c.jsxs("span",{className:"row",style:{gap:6,display:"inline-flex"},children:[c.jsx("b",{style:{cursor:"pointer"},onClick:()=>De("profile",{playerId:a}),children:i}),s&&c.jsx("span",{className:"tag bot",children:"NPC"}),r?c.jsxs("span",{className:"tag",children:["Lv ",r]}):null]})}function an(a=1e3){const[i,s]=L.useState(Date.now());return L.useEffect(()=>{const r=window.setInterval(()=>s(Date.now()),a);return()=>clearInterval(r)},[a]),i}function hg({id:a,serial:i,owned:s}){const r=wt(a),m=B(u=>u.market[a]);return r?c.jsx("div",{className:"col",children:c.jsxs("div",{className:"row",style:{alignItems:"flex-start"},children:[c.jsx("div",{style:{width:130,flex:"0 0 130px"},children:c.jsx(An,{id:a,serial:i,showIncome:!1})}),c.jsxs("div",{className:"col grow",style:{gap:6},children:[c.jsx("div",{style:{fontWeight:900,fontSize:20},children:r.name}),c.jsxs("div",{className:"muted",style:{fontWeight:700},children:[r.brand," · ",r.category," · ",r.kind.replace("_"," ")]}),r.flavor&&c.jsxs("div",{style:{fontStyle:"italic",color:"#c7d2fe"},children:["“",r.flavor,"”"]}),c.jsxs("div",{className:"stats",children:[c.jsx(nt,{k:"Market",v:pe(m?.price??r.base_value)}),c.jsx(nt,{k:"Base",v:pe(r.base_value)}),c.jsx(nt,{k:"Income",v:Cn(r.base_income),cls:"good-t"}),c.jsx(nt,{k:"Supply",v:r.max_supply?`${m?.minted??"?"}/${r.max_supply}`:m?.supply??"—"}),s!=null&&c.jsx(nt,{k:"You own",v:s})]}),!r.tradeable&&c.jsx("div",{className:"tag",children:"Soulbound · can't be sold, traded or stolen"})]})]})}):null}function pw({points:a,height:i=220}){const s=L.useRef(null),[r,m]=L.useState(520),[u,f]=L.useState(null);L.useEffect(()=>{if(!s.current)return;const A=new ResizeObserver(([z])=>m(Math.max(260,z.contentRect.width)));return A.observe(s.current),()=>A.disconnect()},[]);const _=L.useMemo(()=>{if(a.length<2)return null;const A=56,z=58,D=14,R=26,q=a.map(ne=>ne[0]),V=a.map(ne=>ne[1]),Z=Math.min(...q),ee=Math.max(...q);let ke=Math.min(...V),U=Math.max(...V);const ie=U-ke||U*.1||1,ye=hw(ie/4);ke=Math.floor((ke-ie*.05)/ye)*ye,U=Math.ceil((U+ie*.05)/ye)*ye;const it=[];for(let ne=ke;ne<=U+1e-9;ne+=ye)it.push(ne);const mt=ne=>A+(ne-Z)/Math.max(1,ee-Z)*(r-A-z),le=ne=>D+(1-(ne-ke)/Math.max(1e-9,U-ke))*(i-D-R),Q=a.map((ne,K)=>`${K?"L":"M"}${mt(ne[0]).toFixed(1)},${le(ne[1]).toFixed(1)}`).join(""),ge=`${Q}L${mt(ee)},${le(ke)}L${mt(Z)},${le(ke)}Z`;return{X:mt,Y:le,line:Q,area:ge,ticks:it,x0:Z,x1:ee,padL:A,padR:z,padT:D,padB:R}},[a,r,i]);if(!_)return c.jsx("div",{className:"empty",children:"Not enough history yet — check back soon."});const h=a[a.length-1],b=h[1]>=a[0][1],x="#22d3ee",y=A=>{const z=A.currentTarget.getBoundingClientRect(),D=A.clientX-z.left;let R=0,q=1/0;a.forEach((V,Z)=>{const ee=Math.abs(_.X(V[0])-D);ee<q&&(q=ee,R=Z)}),f(R)},v=u!=null?a[u]:null,w=A=>{const z=new Date(A);return _.x1-_.x0>3*864e5?z.toLocaleDateString(void 0,{month:"short",day:"numeric"}):z.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})};return c.jsxs("div",{className:"chart-wrap",ref:s,onPointerMove:y,onPointerLeave:()=>f(null),style:{touchAction:"pan-y"},children:[c.jsxs("svg",{width:r,height:i,role:"img","aria-label":"Price history",children:[_.ticks.map(A=>c.jsxs("g",{children:[c.jsx("line",{x1:_.padL,x2:r-_.padR,y1:_.Y(A),y2:_.Y(A),stroke:"rgba(148,163,184,0.16)",strokeWidth:1}),c.jsx("text",{x:_.padL-8,y:_.Y(A)+4,textAnchor:"end",fill:"#94a3b8",fontSize:"12",fontWeight:700,children:Ue(A)})]},A)),c.jsx("text",{x:_.padL,y:i-6,fill:"#64748b",fontSize:"12",fontWeight:700,children:w(_.x0)}),c.jsx("text",{x:r-_.padR,y:i-6,fill:"#64748b",fontSize:"12",fontWeight:700,textAnchor:"end",children:w(_.x1)}),c.jsx("path",{d:_.area,fill:x,opacity:.1}),c.jsx("path",{d:_.line,fill:"none",stroke:x,strokeWidth:2,strokeLinejoin:"round",strokeLinecap:"round"}),c.jsx("circle",{cx:_.X(h[0]),cy:_.Y(h[1]),r:5,fill:x,stroke:"#0a0f20",strokeWidth:2}),c.jsx("text",{x:_.X(h[0])+9,y:_.Y(h[1])+4,fill:"#e2e8f0",fontSize:"13",fontWeight:800,children:Ue(h[1])}),v&&c.jsxs(c.Fragment,{children:[c.jsx("line",{x1:_.X(v[0]),x2:_.X(v[0]),y1:_.padT,y2:i-_.padB,stroke:"rgba(226,232,240,0.5)",strokeWidth:1}),c.jsx("circle",{cx:_.X(v[0]),cy:_.Y(v[1]),r:5,fill:x,stroke:"#0a0f20",strokeWidth:2})]})]}),v&&c.jsxs("div",{className:"chart-tip",style:{left:_.X(v[0]),top:_.Y(v[1])},children:[c.jsx("b",{children:pe(v[1])})," ",c.jsxs("span",{className:"muted",children:["· ",new Date(v[0]).toLocaleString(void 0,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})]})]}),c.jsxs("div",{className:"dim",style:{fontSize:12,fontWeight:700},children:[b?"▲":"▼"," over this range · hover or drag for exact prices"]})]})}function hw(a){const i=Math.pow(10,Math.floor(Math.log10(Math.max(a,1e-9)))),s=a/i;return(s<=1?1:s<=2?2:s<=2.5?2.5:s<=5?5:10)*i}function _w(){const a=B(v=>v.me),i=B(v=>v.last?.event),s=B(v=>v.last?.next_event_at),r=B(v=>v.feed.length),m=B(v=>(v.last?.quests_claimable||0)+(v.me?.daily.can_claim?1:0)),u=B(v=>v.last?.online??0),f=B(v=>v.backend?.mode),_=L.useRef(null),[h,b]=L.useState(r);if(an(1e3),L.useEffect(()=>{let v=0,w=o_(),A=w;const z=()=>{const D=o_();D!==A&&(D>A&&_.current&&(_.current.classList.remove("bump"),_.current.offsetWidth,_.current.classList.add("bump")),A=D);const R=D-w;w=Math.abs(R)<1?D:w+R*.18,_.current&&(_.current.textContent=pe(Math.round(w))),v=requestAnimationFrame(z)};return v=requestAnimationFrame(z),()=>cancelAnimationFrame(v)},[]),!a)return null;const x=Math.max(0,Math.min(100,(a.xp-a.xp_level)/Math.max(1,a.xp_next-a.xp_level)*100)),y=Yl(a.id);return c.jsxs("div",{className:"hud",children:[c.jsxs("div",{className:"hud-me",onClick:()=>De("profile"),title:"Your profile",children:[c.jsxs("div",{className:"avatar-dot",style:{background:`hsl(${y},70%,55%)`},children:[a.username[0].toUpperCase(),c.jsx("span",{className:"lvl",children:a.level})]}),c.jsxs("div",{style:{minWidth:0},children:[c.jsxs("div",{className:"name",children:[a.username," ",a.prestige>0&&c.jsxs("span",{className:"tag",style:{color:"#f0abfc"},children:["P",a.prestige]})]}),c.jsxs("div",{className:"title",children:[a.title," · Lv ",a.level]}),c.jsx("div",{className:"xp",title:`${a.xp-a.xp_level} / ${a.xp_next-a.xp_level} XP`,children:c.jsx("i",{style:{width:x+"%"}})})]})]}),c.jsxs("div",{className:"hud-mid",children:[c.jsxs("div",{className:"hud-cash",onClick:()=>De("base"),title:"Your cash — tap for your base",children:[c.jsx("div",{className:"cash",ref:_,"data-testid":"cash",children:pe(a.cash)}),c.jsxs("div",{className:"sub",children:[c.jsxs("span",{className:"inc",children:["+",Cn(a.income)]}),c.jsxs("span",{children:["BASE ",c.jsx("b",{children:Ue(a.base_value)})]})]})]}),c.jsx(gw,{}),i?c.jsxs("div",{className:"event-pill",onClick:()=>De("event"),children:[c.jsx("span",{style:{fontSize:20},children:i.icon}),c.jsx("span",{children:i.title}),c.jsx("small",{children:Ut(je(i.ends_at)-Date.now())})]}):s?c.jsxs("div",{className:"event-pill next",onClick:()=>De("event"),children:["🎪 ",c.jsxs("small",{children:["NEXT EVENT ",Ut(je(s)-Date.now())]})]}):null]}),c.jsxs("div",{className:"hud-right",children:[c.jsxs("button",{className:"icon-btn",title:"Missions & daily reward",onClick:()=>De("quests"),children:["🎯",m>0&&c.jsx("span",{className:"badge",children:m})]}),c.jsxs("button",{className:"icon-btn",title:"Live feed",onClick:()=>{b(r),De("feed")},children:["🔔",r-h>0&&c.jsx("span",{className:"badge",children:Math.min(99,r-h)})]}),c.jsx("button",{className:"icon-btn",title:"Settings",onClick:()=>De("settings"),children:"⚙️"}),c.jsx("span",{className:"tag online",title:f==="online"?"Players online now":"Offline practice mode — NPC players are simulated on this device",children:f==="online"?`● ${u} ONLINE`:"● OFFLINE MODE"})]})]})}function gw(){const a=B(f=>f.me),i=B(f=>f.myItems),s=pt(f=>f.here);if(an(500),!a)return null;let r=0;for(const f of i){if(f.location!=="display")continue;const _=wt(f.item_id);if(!_)continue;const h=Math.min(43200,Math.max(0,(Date.now()-je(f.accrued_at))/1e3));r+=_.base_income*Xl(f.mutation)*(1+a.income_bonus)*h}const m=a.lock_until?je(a.lock_until)-Date.now():0,u=!!s?.mine;return c.jsxs("div",{className:"chips",children:[c.jsxs("button",{className:"chip pending"+(r>a.income*60?" hot":""),"data-testid":"pending-chip",onClick:()=>{u||yt?.travelHome()},title:"Cash waiting on your podiums — walk over them to collect",children:["💰 ",Ue(r)," ",c.jsx("small",{children:u?"WALK OVER PODIUMS":"WAITING · GO HOME"})]}),c.jsx("button",{className:"chip lock"+(m>0?" on":""),onClick:()=>{u||yt?.travelHome()},title:"Step on the red pad at your door to lock your base",children:m>0?`🔒 LOCKED ${Math.ceil(m/1e3)}s`:"🔓 UNLOCKED"})]})}function bw(){const i=B(s=>s.feed).filter(s=>s.target_id===null).slice(-14).map(s=>({id:s.id,l:og(s)})).filter(s=>s.l);return i.length?c.jsx("div",{className:"ticker","aria-hidden":!0,children:c.jsx("div",{className:"track",children:i.map(({id:s,l:r})=>c.jsxs("span",{className:"t-"+r.tone,children:[r.icon," ",r.text]},s))},i[i.length-1].id)}):null}const yw=[{id:"base",e:"🏠",label:"BASE"},{id:"drops",e:"📦",label:"DROPS"},{id:"collection",e:"🎒",label:"COLLECTION"},{id:"market",e:"📈",label:"MARKET"},{id:"raid",e:"🥷",label:"RAID"},{id:"trade",e:"🤝",label:"TRADE"},{id:"leaderboard",e:"🏆",label:"RANKS"},{id:"profile",e:"👤",label:"PROFILE",desk:!0},{id:"settings",e:"⚙️",label:"SETTINGS",desk:!0}];function vw(){const a=B(u=>u.panel),i=B(u=>u.last?.trades.incoming||0),s=B(u=>u.last?.revenge||0),r=B(u=>Object.values(u.me?.drop_tokens||{}).reduce((f,_)=>f+(_||0),0)),m={trade:i,raid:s,drops:r};return c.jsx("nav",{className:"nav",children:c.jsx("div",{className:"nav-inner",children:yw.map(u=>c.jsxs("button",{className:(a===u.id?"on":"")+(u.desk?" desk-only":""),"data-testid":"nav-"+u.id,onClick:()=>{te("click"),De(a===u.id?null:u.id)},children:[c.jsx("span",{className:"e",children:u.e}),u.label,m[u.id]?c.jsx("span",{className:"badge",children:m[u.id]}):null]},u.id))})})}function ww(){const a=B(i=>i.toasts);return c.jsx("div",{className:"toasts","aria-live":"polite",children:a.map(i=>c.jsxs("div",{className:"toast "+i.kind,children:[i.itemId?c.jsx(Ft,{id:i.itemId,size:40}):c.jsx("span",{className:"ti",children:i.icon}),c.jsxs("div",{className:"grow",children:[c.jsxs("div",{className:"tt",children:[i.icon&&i.itemId?i.icon+" ":"",i.title]}),i.body&&c.jsx("div",{className:"tb",children:i.body})]}),i.action&&c.jsx("button",{className:"btn small primary",onClick:()=>{i.action.run(),B.setState(s=>({toasts:s.toasts.filter(r=>r.id!==i.id)}))},children:i.action.label})]},i.id))})}function xw(){const a=pt(u=>u.prompt),i=B(u=>u.panel),[s,r]=L.useState(!1);L.useEffect(()=>r(matchMedia("(pointer: coarse)").matches),[]);const m=a&&(a.kind==="carry"||a.kind==="info");return c.jsxs(c.Fragment,{children:[a&&!i&&c.jsx("div",{className:"prompt k-"+a.kind,children:c.jsxs("button",{className:"btn big "+(a.tone||"primary")+(m?" passive":""),"data-testid":"interact",disabled:a.disabled,onClick:()=>{m||yt?.interact()},children:[!s&&!m&&c.jsx("span",{className:"kbd",children:"E"})," ",c.jsx("span",{className:"pi",children:a.icon}),c.jsxs("span",{className:"pl",children:[c.jsx("b",{children:a.label}),a.sub&&c.jsx("small",{children:a.sub})]})]})}),s&&!i&&c.jsxs("div",{className:"touch-actions",children:[c.jsx("button",{className:"round jump","aria-label":"Jump",onPointerDown:()=>yt?.jump(),children:"⤒"}),c.jsx("button",{className:"round sprint","aria-label":"Sprint",onPointerDown:()=>yt?.setSprint(!0),onPointerUp:()=>yt?.setSprint(!1),onPointerCancel:()=>yt?.setSprint(!1),onPointerLeave:()=>yt?.setSprint(!1),children:"⚡"})]})]})}function jw(){const a=B(u=>u.steal),i=pt(u=>u.home),s=an(100);if(!a||a.result||a.phase!=="carry")return null;const r=Math.max(0,a.carryUntil-s),m=r<12e3;return c.jsxs("div",{className:"carry-hud"+(m?" urgent":""),"data-testid":"carry-hud",children:[c.jsx("div",{className:"arrow",style:{transform:`rotate(${i?.angle??0}rad)`},children:"➤"}),c.jsxs("div",{children:[c.jsx("div",{className:"t",children:i?.inside?"SAFE AT HOME!":"RUN HOME!"}),c.jsxs("div",{className:"s",children:[c.jsx(Ft,{id:a.itemId,size:28,mutation:a.mutation})," ",i?`${Math.round(i.dist)}m`:""," · ",Ut(r)," left"]})]})]})}function kw(){const a=pt(m=>m.hover),i=pt(m=>m.selected);if(!a||i)return null;const s=wt(a.itemId);if(!s)return null;const r=Xl(a.mutation);return c.jsxs("div",{className:"hover-tip",style:{left:a.sx,top:a.sy},children:[c.jsx(Ra,{m:a.mutation})," ",c.jsx(gi,{r:s.rarity})," ",s.name,c.jsxs("div",{className:"muted",style:{fontSize:12},children:[Ue(a.price??Pn(s.id,a.mutation))," · +",Cn(s.base_income*r)," · ",a.ownerName]})]})}function Sw(){const a=pt(h=>h.selected),i=B(h=>h.steal);if(!a)return null;const s=wt(a.itemId);if(!s)return null;const r=()=>pt.setState({selected:null}),m=Math.max(8,Math.min(window.innerWidth-258,a.sx-125)),u=Math.max(90,Math.min(window.innerHeight-330,a.sy-300)),f=Xl(a.mutation),_=a.beltId!=null;return c.jsxs("div",{className:"popover",style:{left:m,top:u},onPointerDown:h=>h.stopPropagation(),children:[c.jsxs("div",{className:"row",children:[c.jsx(Ft,{id:s.id,size:64,mutation:a.mutation}),c.jsxs("div",{className:"grow",children:[c.jsx("div",{style:{fontWeight:900,lineHeight:1.1},children:s.name}),c.jsx(gi,{r:s.rarity})," ",c.jsx(Ra,{m:a.mutation}),c.jsx("div",{className:"good-t",style:{fontWeight:900},children:pe(_?a.price:Pn(s.id,a.mutation))}),c.jsxs("div",{className:"muted",style:{fontSize:13,fontWeight:700},children:["+",Cn(s.base_income*f)," · ",_?"on the Tech Belt":a.mine?"Yours":a.ownerName]})]})]}),c.jsxs("div",{className:"col",style:{marginTop:10,gap:8},children:[_?c.jsxs("button",{className:"btn good block","data-testid":"popover-buy",onClick:()=>{r(),yt?.runToBuy(a.beltId)},children:["🛒 RUN & BUY · ",Ue(a.price)]}):a.mine?c.jsx("button",{className:"btn primary block",onClick:()=>{r(),De("base",{select:a.playerItemId})},children:"MANAGE"}):c.jsxs(c.Fragment,{children:[c.jsx("button",{className:"btn hot block","data-testid":"popover-steal",disabled:!!i&&!i.result,onClick:()=>{r(),yt?.runToSteal(a.ownerId,a.playerItemId)},children:"🥷 GO STEAL IT"}),c.jsx("button",{className:"btn block",onClick:()=>{r(),Js(a.ownerId)},children:"VIEW BASE"})]}),c.jsx("button",{className:"btn ghost small",onClick:r,children:"CLOSE"})]})]})}function Tw(){const[a,i]=L.useState(null),s=L.useRef(null),[r,m]=L.useState(!1);if(L.useEffect(()=>{const h=matchMedia("(pointer: coarse)");m(h.matches);const b=()=>m(h.matches);return h.addEventListener?.("change",b),()=>h.removeEventListener?.("change",b)},[]),!r)return null;const u=55,f=h=>{if(s.current!==h.pointerId||!a)return;let b=h.clientX-a.x,x=h.clientY-a.y;const y=Math.hypot(b,x);y>u&&(b=b/y*u,x=x/y*u),i({...a,kx:b,ky:x}),yt?.setJoystick(b/u,x/u)},_=()=>{s.current=null,i(null),yt?.setJoystick(0,0)};return c.jsxs(c.Fragment,{children:[c.jsx("div",{className:"joy-zone",onPointerDown:h=>{s.current=h.pointerId,h.target.setPointerCapture(h.pointerId),i({x:h.clientX,y:h.clientY,kx:0,ky:0})},onPointerMove:f,onPointerUp:_,onPointerCancel:_}),a?c.jsx("div",{className:"joystick",style:{left:a.x-75,top:a.y-75,pointerEvents:"none"},children:c.jsx("div",{className:"knob",style:{transform:`translate(${a.kx}px, ${a.ky}px)`}})}):c.jsx("div",{className:"joystick",style:{left:24,bottom:110,opacity:.55,pointerEvents:"none"},children:c.jsx("div",{className:"knob"})})]})}function Nw(){const a=B(u=>u.me),i=B(u=>u.catalog?.cosmetics??_i),[s,r]=L.useState(!1);if(!a)return null;const m=i.filter(u=>u.slot==="emote"&&a.owned_cosmetics.includes(u.id));return c.jsxs("div",{className:"col emote-bar",children:[s&&c.jsx("div",{className:"card tight row wrap",style:{maxWidth:240},children:m.map(u=>c.jsx("button",{className:"icon-btn",onClick:()=>{yt?.doEmote(u.data.emoji),r(!1),te("click")},children:u.data.emoji},u.id))}),c.jsxs("div",{className:"row",children:[c.jsx("button",{className:"icon-btn",title:"Emotes",onClick:()=>r(!s),children:"😀"}),c.jsx("button",{className:"icon-btn",title:"Go home",onClick:()=>{yt?.travelHome()},children:"🏠"})]})]})}const q_={basic:["#64748b","#94a3b8"],premium:["#1d4ed8","#38bdf8"],elite:["#6d28d9","#a855f7"],ultra:["#be185d","#e879f9"],event:["#c2410c","#fb923c"],secret:["#0b0612","#c084fc"]};function Ew(a,i,s,r,m,u){const[f,_]=q_[m]||q_.basic;a.save(),a.translate(i,s),a.fillStyle=F(_,.2),a.beginPath(),a.moveTo(-r/2,-r/2),a.lineTo(-r/2+r*.2,-r/2-r*.18),a.lineTo(r/2+r*.2,-r/2-r*.18),a.lineTo(r/2,-r/2),a.fill(),a.fillStyle=F(f,-.3),a.beginPath(),a.moveTo(r/2,-r/2),a.lineTo(r/2+r*.2,-r/2-r*.18),a.lineTo(r/2+r*.2,r/2-r*.18),a.lineTo(r/2,r/2),a.fill();const h=a.createLinearGradient(0,-r/2,0,r/2);h.addColorStop(0,_),h.addColorStop(1,f),a.fillStyle=h,a.fillRect(-r/2,-r/2,r,r),a.strokeStyle="rgba(255,255,255,0.5)",a.lineWidth=Math.max(1,r/18),a.strokeRect(-r/2+r*.08,-r/2+r*.08,r*.84,r*.84),a.fillStyle=m==="secret"?"#c084fc":"#ffffff",a.fillRect(-r*.08,-r/2,r*.16,r),m==="ultra"&&(a.globalAlpha=.35,a.fillStyle=i1(u),a.fillRect(-r/2,-r/2,r,r)),a.restore()}function D_({dropId:a,size:i=190}){const s=L.useRef(null);return L.useEffect(()=>{let r=0;const m=s.current,u=Math.min(2,window.devicePixelRatio||1);m.width=i*u,m.height=i*u;const f=m.getContext("2d"),_=performance.now(),h=b=>{f.setTransform(u,0,0,u,0,0),f.clearRect(0,0,i,i),Ew(f,i*.45,i*.55,i*.62,a,(b-_)/1e3),r=requestAnimationFrame(h)};return r=requestAnimationFrame(h),()=>cancelAnimationFrame(r)},[a,i]),c.jsx("canvas",{ref:s,style:{width:i,height:i}})}function sc({n:a=80,colors:i}){const s=L.useMemo(()=>Array.from({length:a},(r,m)=>({left:Math.random()*100,delay:Math.random()*.6,dur:1.8+Math.random()*2,color:i?i[m%i.length]:`hsl(${Math.random()*360},90%,60%)`,rot:Math.random()*360})),[a,i]);return c.jsx(c.Fragment,{children:s.map((r,m)=>c.jsx("i",{className:"confetti",style:{left:r.left+"%",background:r.color,animationDuration:r.dur+"s",animationDelay:r.delay+"s",transform:`rotate(${r.rot}deg)`}},m))})}function Mw(){const a=B(Z=>Z.drop),i=B(Z=>Z.catalog),s=B(Z=>Z.me),[r,m]=L.useState(performance.now()),u=L.useRef(null);if(L.useEffect(()=>{if(!a)return;let Z=0;const ee=()=>{m(performance.now()),Z=requestAnimationFrame(ee)};return Z=requestAnimationFrame(ee),()=>cancelAnimationFrame(Z)},[a]),!a||!i)return null;const f=i.drops.find(Z=>Z.id===a.drop),_=Date.now()-a.startedAt,h=a.result,b=h?qe[h.rarity].tier:0,x=b>=6?1300:0,y=1900,v=!h||_<y?"charge":_<y+x?"suspense":"reveal",w=f?Wo.filter(Z=>f.weights[Z]):Wo,A=w[Math.floor(r/Math.max(60,260-_/10))%w.length];v==="charge"&&Math.floor(_/220)!==Math.floor((_-16)/220)&&te("shake"),v==="reveal"&&h&&u.current!==h.player_item.id&&(u.current=h.player_item.id,Fs(h.rarity),h.mutation&&te("mutation"),navigator.vibrate&&b>=5&&navigator.vibrate(b>=7?[100,50,100,50,300]:120));const z=h?wt(h.item_id):null,D=()=>de({drop:null}),R=s?.drop_tokens?.[a.drop]||0,q=()=>{de({drop:null}),window.setTimeout(()=>cm(a.drop,R>0),50)},V=h?h.rarity==="ultra"?"#e879f9":qe[h.rarity].color:qe[A].color;return c.jsxs("div",{className:`drop-stage r-${h?.rarity??"common"}`,style:{"--rc":V},"data-testid":"drop-overlay",children:[v==="charge"&&c.jsxs(c.Fragment,{children:[c.jsx("div",{className:"drop-rays",style:{"--ray":qe[A].color+"33"}}),c.jsx("div",{className:"muted display",style:{fontSize:18,letterSpacing:"0.2em"},children:f?.name}),c.jsx("div",{className:"drop-crate shake"+(_>1200?" hard":""),style:{filter:`drop-shadow(0 0 ${20+_/40}px ${qe[A].color})`},children:c.jsx(D_,{dropId:a.drop})}),c.jsxs("div",{className:"reveal-rarity",style:{color:qe[A].color,fontSize:28,opacity:.8},children:[qe[A].label,"?"]})]}),v==="suspense"&&c.jsxs(c.Fragment,{children:[c.jsx("div",{className:"drop-crate shake hard",style:{filter:"brightness(0.4) drop-shadow(0 0 40px #fff)"},children:c.jsx(D_,{dropId:a.drop})}),c.jsx("div",{className:"reveal-rarity",style:{color:"#fff",fontSize:30},children:"SOMETHING RARE…"})]}),v==="reveal"&&h&&z&&c.jsxs(c.Fragment,{children:[c.jsx("div",{className:"drop-flash"}),c.jsx("div",{className:"drop-rays",style:{"--ray":V+"44"}}),b>=5&&c.jsx(sc,{n:b>=7?140:70,colors:b===9?["#c084fc","#fff","#7c3aed"]:void 0}),h.is_new&&c.jsx("span",{className:"new-badge",children:"NEW DISCOVERY!"}),c.jsx("div",{className:"reveal-item",children:c.jsx("img",{src:ac(z,256),alt:z.name,className:h.mutation?"mutf-"+h.mutation:""})}),h.mutation&&c.jsxs("div",{className:"reveal-mut",children:[c.jsx(Ra,{m:h.mutation})," MUTATION!"]}),c.jsx("div",{className:"reveal-rarity",children:qe[h.rarity].label}),c.jsx("div",{className:"reveal-name",children:z.name}),h.serial&&z.max_supply&&c.jsxs("div",{className:"supply",style:{fontSize:14,marginTop:6},children:["SERIAL #",h.serial," / ",z.max_supply]}),c.jsxs("div",{className:"row",style:{justifyContent:"center",gap:18,marginTop:10,fontWeight:900,fontSize:18},children:[c.jsx("span",{className:"good-t",children:pe(Pn(z.id,h.mutation))}),c.jsxs("span",{className:"muted",children:["+",Cn(z.base_income*Xl(h.mutation))]}),c.jsxs("span",{className:"gold-t",children:["+",h.xp," XP"]})]}),c.jsx("div",{className:"muted",style:{fontWeight:700,marginTop:4},children:h.placed?"✅ Now on display in your base — earning money.":"📦 Your base is full — it went to storage. Swap it in from BASE."}),c.jsxs("div",{className:"row",style:{marginTop:18,justifyContent:"center",flexWrap:"wrap"},children:[c.jsx("button",{className:"btn big",onClick:D,"data-testid":"drop-close",children:"CONTINUE"}),c.jsx("button",{className:"btn big primary",onClick:q,children:R>0?`OPEN ANOTHER (${R} FREE)`:`OPEN ANOTHER · ${pe(f?.price??0)}`})]})]})]})}function Aw(){const a=B(x=>x.steal),i=an(100),s=L.useRef(null);if(L.useEffect(()=>{a&&!a.result&&a.phase==="grab"&&i>=a.endsAt&&s.current!==a.raidId&&(s.current=a.raidId,ug())},[a,i]),!a)return null;const r=wt(a.itemId),m=Math.max(1,a.endsAt-a.startedAt),u=Math.max(0,Math.min(1,(i-a.startedAt)/m)),f=()=>de({steal:null});if(!a.result)return a.phase==="carry"?null:c.jsxs("div",{className:"steal-box","data-testid":"steal-box",children:[c.jsxs("div",{className:"row between",children:[c.jsx("div",{className:"big",children:"GRABBING…"}),c.jsx("div",{className:"display",style:{fontSize:22},children:Ut(a.endsAt-i)})]}),c.jsxs("div",{className:"row",style:{margin:"8px 0"},children:[c.jsx(Ft,{id:a.itemId,size:56,mutation:a.mutation}),c.jsxs("div",{className:"grow",children:[c.jsxs("div",{style:{fontWeight:900},children:[r?.name," ",c.jsx(Ra,{m:a.mutation})]}),c.jsxs("div",{className:"muted",style:{fontWeight:700},children:["from ",a.defender," · ",Math.round(a.chance*(a.defended?.3:1)*100),"% to beat the lasers",a.revenge?" · REVENGE BONUS":"",a.tutorial?" · beginner raid":""]})]})]}),c.jsx("div",{className:"steal-bar",children:c.jsx("i",{style:{width:u*100+"%"}})}),a.defended&&c.jsx("div",{className:"bad-t",style:{fontWeight:900,marginTop:8},children:"🚨 THE OWNER HIT THE ALARM! Your odds collapsed."}),a.finishing?c.jsx("div",{className:"muted",style:{marginTop:6,fontWeight:700},children:"Cracking the lasers…"}):c.jsxs("div",{className:"row",style:{marginTop:8,justifyContent:"space-between"},children:[c.jsx("span",{className:"muted",style:{fontWeight:700},children:"Then RUN it home — the owner can tag you."}),c.jsx("button",{className:"btn small ghost",onClick:()=>Xo("abort"),children:"BACK OFF"})]})]});const _=a.result.status==="success",h=a.result.status==="blocked",b=_?"ITEM STOLEN!":h?"BLOCKED!":a.result.caught?"CAUGHT!":/Too slow/i.test(a.result.note||"")?"TOO SLOW!":"ZAPPED!";return c.jsx("div",{className:"overlay",onClick:f,children:c.jsxs("div",{className:"modal center result "+(_?"win":"lose"),onClick:x=>x.stopPropagation(),"data-testid":"steal-result",children:[_&&c.jsx(sc,{n:90}),c.jsx("div",{className:"result-icon",children:_?"🔥":h?"🔒":a.result.caught?"🫵":"⚡"}),c.jsx("h2",{className:"result-title "+(_?"good-t":"bad-t"),children:b}),c.jsx("div",{style:{maxWidth:180,margin:"10px auto"},children:c.jsx(An,{id:a.itemId,mutation:a.mutation})}),_?c.jsxs("p",{className:"muted",style:{fontWeight:700},children:["It's on your podium now, earning for you. It's ",c.jsx("b",{className:"bad-t",children:"🔥 HOT"})," for 5 minutes — no selling yet, and ",a.defender," can take REVENGE."]}):c.jsxs("p",{className:"muted",style:{fontWeight:700},children:[a.result.note||"You got caught."," ",a.result.fine>0&&c.jsxs(c.Fragment,{children:["You paid a ",c.jsx("b",{className:"bad-t",children:pe(a.result.fine)})," fine to ",a.defender,"."]})," Lay low for a moment before your next raid."]}),c.jsxs("div",{className:"row",style:{justifyContent:"center",marginTop:12},children:[c.jsx("button",{className:"btn big",onClick:f,children:"CONTINUE"}),c.jsx("button",{className:"btn big hot",onClick:()=>{f(),De("raid")},children:"RAID AGAIN"})]})]})})}function Cw(){const a=B(A=>A.last?.incoming_raids[0]),i=B(A=>A.me),s=B(A=>A.myItems.filter(z=>z.location==="vault").length),r=B(A=>a?A.myItems.find(z=>z.id===a.player_item_id)?.mutation??null:null),m=an(100),[u,f]=L.useState(!1);if(!a||!i)return null;const _=wt(a.item_id),h=a.phase==="carry",b=je(h?a.deliver_after:a.ends_at),x=je(h?a.grabbed_at:a.started_at),y=b-m,v=Math.max(0,Math.min(1,(m-x)/Math.max(1,b-x))),w=s<i.vault_capacity;return c.jsxs("div",{className:"alarm"+(h?" carry":""),role:"alert","data-testid":"raid-alarm",children:[c.jsxs("div",{className:"row between",children:[c.jsx("h3",{children:h?"🏃 THEY GRABBED IT — TAG THEM!":"🚨 YOU'RE BEING ROBBED"}),c.jsx("b",{className:"display",style:{fontSize:22,color:"#fecaca"},children:y>0?Ut(y):"…"})]}),c.jsxs("div",{className:"row",style:{margin:"8px 0"},children:[c.jsx(Ft,{id:a.item_id,size:56,mutation:r}),c.jsxs("div",{className:"grow",children:[c.jsxs("div",{style:{fontWeight:900,color:"#fff"},children:[a.attacker,a.attacker_bot?" 🤖":""," ",h?"is running off with your":"is grabbing your"]}),c.jsxs("div",{style:{fontWeight:900,fontSize:18},children:[_&&c.jsx(gi,{r:_.rarity})," ",c.jsx(Ra,{m:r})," ",_?.name]})]})]}),c.jsx("div",{className:"steal-bar",style:{marginBottom:10},children:c.jsx("i",{style:{width:v*100+"%"}})}),h?c.jsx("div",{className:"row",children:c.jsx("button",{className:"btn hot grow big",onClick:()=>yt?.chase(a.attacker_id),"data-testid":"chase",children:"👊 CHASE & TAG"})}):c.jsxs("div",{className:"row",children:[c.jsx("button",{className:"btn hot grow big",disabled:a.defended||u||y<=0,"data-testid":"defend",onClick:async()=>{f(!0);try{await mg(a.id)}finally{f(!1)}},children:a.defended?"🚨 ALARM ON":"🚨 ALARM"}),c.jsxs("button",{className:"btn good grow big",disabled:!w||u||y<=0,onClick:async()=>{f(!0);try{await dg(a.player_item_id)}finally{f(!1)}},children:["🔒 VAULT ",w?"":"(FULL)"]}),c.jsx("button",{className:"btn grow big",onClick:()=>yt?.chase(a.attacker_id),children:"👊 TAG"})]}),c.jsx("div",{style:{color:"#fecaca",fontSize:13,fontWeight:700,marginTop:6},children:h?"Run into them to tag them — they drop your item and pay you a bounty.":"Alarm cuts their odds by 70%. Vault = theft fails. Or run over and tag them!"})]})}function zw(){const a=B(s=>s.banner);if(!a)return null;const i=ea(a.mutation);return c.jsxs("div",{className:"banner k-"+a.kind,style:{"--bc":a.color||(i?i.color:void 0),"--ttl":a.ttl+"ms"},"data-testid":"banner",children:[a.itemId&&c.jsx(Ft,{id:a.itemId,size:64,mutation:a.mutation}),c.jsxs("div",{children:[c.jsx("div",{className:"bt"+(a.mutation==="rainbow"?" rainbow-text":""),children:a.title}),a.sub&&c.jsx("div",{className:"bs",children:a.sub})]})]},a.id)}function $w(){const a=B(r=>r.bigReveal);if(L.useEffect(()=>{if(!a)return;const r=window.setTimeout(()=>de({bigReveal:null}),7e3);return()=>clearTimeout(r)},[a]),!a)return null;const i=a.payload,s=wt(i.item_id);return c.jsxs("div",{className:"big-reveal",onClick:()=>de({bigReveal:null}),children:[c.jsx(sc,{n:120,colors:["#c084fc","#ffffff","#7c3aed","#f0abfc"]}),c.jsxs("div",{className:"col",style:{alignItems:"center"},children:[c.jsx("h1",{children:"🚨 SECRET DISCOVERED 🚨"}),c.jsx("div",{className:"muted display",style:{letterSpacing:"0.3em"},children:"PLAYER"}),c.jsxs("div",{style:{fontSize:34,fontWeight:900},children:[i.player,i.is_bot?" 🤖":""]}),s&&c.jsx("img",{src:ac(s,256),alt:"",style:{width:220,filter:"drop-shadow(0 0 40px #c084fc)"},className:"reveal-item"}),c.jsx("div",{className:"muted display",style:{letterSpacing:"0.3em"},children:"FOUND"}),c.jsx("div",{style:{fontSize:30,fontWeight:900,color:"#f5f3ff",textShadow:"0 0 20px #c084fc"},children:i.item}),i.serial&&c.jsxs("div",{className:"supply",style:{fontSize:15},children:["#",i.serial," of ",i.max_supply]}),c.jsx("div",{className:"dim",style:{marginTop:10},children:"tap to continue"})]})]})}function Ow(){const a=B(s=>s.levelUp),i=B(s=>!!s.drop||!!s.steal?.result);return L.useEffect(()=>{if(!a||i)return;const s=window.setTimeout(()=>de({levelUp:null}),3200);return()=>clearTimeout(s)},[a,i]),!a||i?null:c.jsxs("div",{className:"levelup",onClick:()=>de({levelUp:null}),"data-testid":"level-up",children:[c.jsx(sc,{n:40,colors:["#fde047","#f59e0b","#fff"]}),c.jsx("div",{className:"lu-k",children:"LEVEL UP"}),c.jsx("div",{className:"lu-n",children:a.level}),c.jsxs("div",{className:"lu-t",children:[a.title,a.cash>0&&c.jsxs("b",{className:"good-t",children:[" · +",pe(a.cash)]})]})]})}function Rw(){const a=B(s=>s.confirm);if(!a)return null;const i=()=>de({confirm:null});return c.jsx("div",{className:"overlay",onClick:i,children:c.jsxs("div",{className:"modal",onClick:s=>s.stopPropagation(),children:[c.jsx("h2",{children:a.title}),c.jsx("p",{className:"muted",style:{fontWeight:700,fontSize:17,whiteSpace:"pre-line"},children:a.body}),c.jsxs("div",{className:"col",children:[a.hold?c.jsxs(ic,{className:"btn big block "+(a.danger?"hot":"primary"),onConfirm:()=>{i(),a.onConfirm()},children:["HOLD TO ",a.confirmLabel]}):c.jsx("button",{className:"btn big block "+(a.danger?"hot":"primary"),onClick:()=>{i(),a.onConfirm()},children:a.confirmLabel}),c.jsx("button",{className:"btn block",onClick:i,children:"CANCEL"})]})]})})}function wm(a){de({confirm:a})}const qw={collect:"walk onto the green plate",belt:"buy something off the belt",lock:"step on the red LOCK pad",drop:"open the drop",grab:"grab an item",steal:"get it home"};function Dw(){const a=B(D=>D.tutorialOpen),i=B(D=>D.me),s=B(D=>D.world),r=B(D=>D.panel),m=B(D=>D.drop),u=B(D=>D.steal),[f,_]=L.useState(()=>Math.max(1,Math.min(12,(G().me?.tutorial_step||0)+1))),h=L.useRef(0),b=s.find(D=>D.username==="RookieRick"),x=B(D=>D.catalog?.drops.find(R=>R.id==="basic")?.price??0);an(500);const v={1:{title:"👋 Welcome to STEAL THE TECH",body:"Buy gadgets off the TECH BELT, show them off in your base, collect the cash they make — and STEAL what you can't afford.",button:"LET'S GO"},2:{title:"🏠 This is your base",body:"Your NOVA Starter TV sits on a podium and piles up cash every second — even while you're away. It's soulbound: nobody can steal it.",item:"nova-starter-tv",button:"NICE",onEnter:()=>yt?.travelHome()},3:{title:"💰 Collect your cash",body:"Walk onto the glowing GREEN plate in front of your TV. Cha-ching!",waitFor:"collect",hint:"WASD / arrows or the joystick to move · drag to look around",onEnter:()=>yt?.lookAtMyBase()},4:{title:"🛒 The Tech Belt",body:"Gadgets walk along the belt through the middle of the city. We sent you $600 — walk up to one and BUY it. Anyone can buy what's on the belt, so be quick!",waitFor:"belt",onEnter:()=>yt?.lookAtBelt()},5:{title:"🌈 Rarities & mutations",body:"COMMON → UNCOMMON → RARE → EPIC → LEGENDARY → MYTHIC → ULTRA → SECRET. GOLD, DIAMOND, NEON, HOLO, GLITCH and RAINBOW mutations multiply income and value up to 10×. When a Legendary+ hits the belt, the whole city hears about it — run!",button:"GOT IT"},6:{title:"🔒 Lock your base",body:"Thieves can walk right in. Step on the red LOCK pad by your door: lasers keep everyone out for a while. Re-lock when they switch off!",waitFor:"lock",onEnter:()=>yt?.travelHome()},7:{title:"📦 Mystery drops",body:`We also sent you ${pe(x)} — one BASIC DROP. The Drop Zone is at the west end of the belt. 3% of pulls come out MUTATED.`,button:"OPEN DROPS",onButton:()=>De("drops"),waitFor:"drop"},8:{title:"🏚️ Meet your neighbour",body:`This is ${b?.username??"RookieRick"}'s base. Every base in Tech City is open for business…`,button:"NEXT",onEnter:()=>{b&&de({focusPlot:b.id})}},9:{title:"🥷 Grab something",body:"Walk up to any item on his podiums and press STEAL. Stay close while you GRAB it — his security is basic, this one always works.",waitFor:"grab"},10:{title:"🏃 RUN HOME!",body:"It's not yours until it's inside YOUR base. Follow the arrow! (Owners can tag you on the way — Rick's just a rookie.)",waitFor:"steal"},11:{title:"📈 The market",body:"Every item has a live price driven by supply and demand. List items for others to buy, snap up bargains, and watch events move prices.",button:"OPEN MARKET",onButton:()=>De("market")},12:{title:"🚀 Go build an empire",body:"Collect often, lock up when you leave, watch the belt for rare drops — and people WILL come for your best stuff. Here's a free Basic Drop to start.",button:"FINISH"}}[f];if(L.useEffect(()=>{!a||!v||h.current!==f&&(h.current=f,em(f).catch(()=>{}),v.onEnter?.())},[f,a]),L.useEffect(()=>{if(!a||!i)return;const D=i.stats||{},R=(D.steals_won||0)>0||!!i.tutorial_flags?.tutorial_raid;f===3&&(D.collects||0)>0&&_(4),f===4&&(D.belt_buys||0)>0&&_(5),f===6&&i.lock_until&&je(i.lock_until)>Date.now()&&_(7),f===7&&(D.drops_opened||0)>0&&!m&&_(8),f===9&&(u&&!u.result&&u.phase==="carry"||R)&&_(10),f===10&&R&&(!u||u.result)&&_(11)},[i,m,u,f,a]),!a||!i||!v||m||u&&u.result)return null;const w=()=>{if(te("click"),v.onButton?.(),!v.waitFor){if(f>=12){em(12).catch(()=>{}),de({tutorialOpen:!1}),De(null);return}_(f+1)}},A=()=>{em(12).catch(()=>{}),de({tutorialOpen:!1})},z=!!r;return c.jsxs("div",{className:"tutorial"+(z?" side":""),"data-testid":"tutorial",children:[c.jsxs("div",{className:"row between",children:[c.jsxs("span",{className:"steps",children:["TUTORIAL · ",f,"/12"]}),c.jsx("button",{className:"btn ghost small",onClick:A,children:"SKIP"})]}),c.jsx("h3",{children:v.title}),c.jsxs("div",{className:"row",style:{alignItems:"flex-start"},children:[v.item&&c.jsx(Ft,{id:v.item,size:72}),c.jsx("p",{className:"grow",children:v.body})]}),v.hint&&c.jsx("div",{className:"muted",style:{fontWeight:700,fontSize:13,marginBottom:6},children:v.hint}),v.button&&c.jsx("button",{className:"btn primary block big",onClick:w,"data-testid":"tutorial-next",children:v.button}),v.waitFor&&c.jsxs("div",{className:"muted tut-wait",style:{fontWeight:800},children:["⏳ Waiting for you to ",qw[v.waitFor],"…"]})]})}function Uw(){const a=B(U=>U.me),i=B(U=>U.myItems),s=B(U=>U.catalog?.upgrades??_i),r=B(U=>U.panelArg),m=B(U=>U.last?.listings??_i),[u,f]=L.useState("display"),[_,h]=L.useState(r?.select??null),[b,x]=L.useState(null),y=an(1e3),v=L.useMemo(()=>new Map(i.filter(U=>U.location==="display").map(U=>[U.slot,U])),[i]),w=i.filter(U=>U.location==="inventory"),A=i.filter(U=>U.location==="vault"),z=i.filter(U=>U.location==="listed"),D=i.find(U=>U.id===_)||null,R=(U,ie)=>Pn(ie.item_id)-Pn(U.item_id),q=(U,ie)=>s.find(ye=>ye.kind===U&&ye.level===ie+1),V=(U,ie)=>s.find(ye=>ye.kind===U&&ye.level===ie),Z=a.shield_until?je(a.shield_until)-y:0,ee=!!pt(U=>U.here?.mine),ke=i.reduce((U,ie)=>U+Qs(ie),0);return c.jsxs(nn,{title:"MY BASE",icon:"🏠",head:c.jsx("button",{className:"btn small",onClick:()=>q1(),children:"✨ AUTO-FILL"}),children:[c.jsxs("div",{className:"card tight collect-tip",children:["💰 ",c.jsx("b",{children:Ue(ke)})," waiting on your podiums — walk over the green plates (or the 💰 pad at your door) to collect.",!ee&&c.jsx("button",{className:"btn small good",style:{marginLeft:8},onClick:()=>{yt?.travelHome(),De(null)},children:"GO HOME"})]}),c.jsxs("div",{className:"stats",children:[c.jsx(nt,{k:"Base value",v:pe(a.base_value),cls:"good-t"}),c.jsx(nt,{k:"Income",v:"+"+Cn(a.income),cls:"good-t"}),c.jsx(nt,{k:"Display",v:`${v.size}/${a.slots}`}),c.jsx(nt,{k:"Security",v:`L${a.security_level}`}),c.jsx(nt,{k:"Vault",v:`${A.length}/${a.vault_capacity}`}),Z>0&&c.jsx(nt,{k:"Shield",v:Ut(Z)})]}),c.jsx(ba,{value:u,onChange:U=>{f(U),x(null)},tabs:[{id:"display",label:`Display ${v.size}/${a.slots}`},{id:"storage",label:`Storage ${w.length}`},{id:"vault",label:`Vault ${A.length}/${a.vault_capacity}`},{id:"upgrades",label:"Upgrades"}]}),D&&c.jsxs("div",{className:"card",children:[c.jsx(hg,{id:D.item_id,serial:D.serial}),c.jsx(_g,{pi:D,onDone:()=>h(null)})]}),u==="display"&&c.jsxs(c.Fragment,{children:[c.jsx("div",{className:"muted",style:{fontWeight:700},children:"Items on display earn income — and can be stolen. Tap an empty slot to fill it."}),c.jsx("div",{className:"grid items",children:Array.from({length:a.slots},(U,ie)=>{const ye=v.get(ie);return ye?c.jsx(An,{id:ye.item_id,mutation:ye.mutation,serial:ye.serial,selected:_===ye.id,onClick:()=>h(ye.id),badge:ye.soulbound?c.jsx("span",{className:"tag",children:"★"}):ye.hot_until&&je(ye.hot_until)>y?c.jsx("span",{className:"tag",children:"🔥"}):null},ye.id):c.jsxs("div",{className:"icard",style:{display:"grid",placeItems:"center",minHeight:170,borderStyle:"dashed",opacity:.8},onClick:()=>x(ie),children:[c.jsx("div",{style:{fontSize:30},children:"＋"}),c.jsxs("div",{className:"muted",style:{fontWeight:800},children:["SLOT ",ie+1]})]},ie)})}),b!==null&&c.jsxs("div",{className:"card",children:[c.jsxs("div",{className:"row between",children:[c.jsxs("b",{children:["Fill slot ",b+1]}),c.jsx("button",{className:"btn small ghost",onClick:()=>x(null),children:"✕"})]}),w.length+A.length===0?c.jsx("div",{className:"empty",children:"Nothing in storage. Open drops, trade or steal to get more!"}):c.jsx("div",{className:"grid items",style:{marginTop:8},children:[...w,...A].sort(R).map(U=>c.jsx(An,{id:U.item_id,mutation:U.mutation,serial:U.serial,badge:U.location==="vault"?c.jsx("span",{className:"tag",children:"🔒"}):null,onClick:()=>{cg(U.id,b).catch(()=>{}),x(null)}},U.id))})]})]}),u==="storage"&&c.jsxs(c.Fragment,{children:[c.jsxs("div",{className:"muted",style:{fontWeight:700},children:["Stored items are safe from thieves but earn nothing. ",z.length>0&&`${z.length} item(s) listed on the market.`]}),w.length===0&&z.length===0?c.jsx("div",{className:"empty",children:"Storage is empty."}):c.jsxs("div",{className:"grid items",children:[w.sort(R).map(U=>c.jsx(An,{id:U.item_id,mutation:U.mutation,serial:U.serial,selected:_===U.id,onClick:()=>h(U.id),badge:U.hot_until&&je(U.hot_until)>y?c.jsx("span",{className:"tag",children:"🔥 HOT"}):null},U.id)),z.map(U=>{const ie=m.find(ye=>ye.player_item_id===U.id);return c.jsx(An,{id:U.item_id,mutation:U.mutation,serial:U.serial,onClick:()=>De("market",{tab:"mine"}),badge:c.jsxs("span",{className:"tag",children:["🏷️ ",ie?Ue(ie.price):"LISTED"]})},U.id)})]})]}),u==="vault"&&c.jsxs(c.Fragment,{children:[c.jsxs("div",{className:"card tight",style:{background:"rgba(74,222,128,0.08)"},children:[c.jsxs("b",{children:["🔒 VAULT ",A.length,"/",a.vault_capacity]}),c.jsx("div",{className:"muted",style:{fontWeight:700},children:"Vaulted items can never be stolen and survive Prestige — but they don't earn income. Vault something mid-raid to foil the thief!"})]}),A.length===0?c.jsx("div",{className:"empty",children:"Your vault is empty."}):c.jsx("div",{className:"grid items",children:A.sort(R).map(U=>c.jsx(An,{id:U.item_id,mutation:U.mutation,serial:U.serial,selected:_===U.id,onClick:()=>h(U.id)},U.id))})]}),u==="upgrades"&&c.jsxs("div",{className:"col",children:[[["base","🏗️ BASE",a.base_level,U=>`${U} display slots`,"More slots = more income on display."],["security","🔐 SECURITY",a.security_level,U=>`Level ${U}`,"Each level cuts raiders' success chance by 7% and makes steals take longer."],["vault","🏦 VAULT",a.vault_level,U=>`${U} protected items`,"Vaulted items can never be stolen."]].map(([U,ie,ye,it,mt])=>{const le=V(U,ye),Q=q(U,ye);return c.jsxs("div",{className:"card",children:[c.jsxs("div",{className:"row between",children:[c.jsxs("div",{children:[c.jsxs("div",{style:{fontWeight:900,fontSize:18},children:[ie," · L",ye]}),c.jsxs("div",{className:"muted",style:{fontWeight:700},children:[le?.name," — ",le?it(le.value):""]})]}),Q?c.jsx("button",{className:"btn gold",disabled:a.cash<Q.cost,onClick:()=>D1(U).catch(()=>{}),children:pe(Q.cost)}):c.jsx("span",{className:"tag",children:"MAX"})]}),Q&&c.jsxs("div",{className:"muted",style:{marginTop:6,fontWeight:700},children:["Next: ",c.jsx("b",{style:{color:"#fde68a"},children:Q.name})," — ",it(Q.value),". ",mt]}),c.jsx("div",{className:"bar gold",style:{marginTop:8},children:c.jsx("i",{style:{width:`${ye/s.filter(ge=>ge.kind===U).length*100}%`}})})]},U)}),c.jsxs("div",{className:"card tight",children:[c.jsx("b",{children:"Security levels"}),c.jsx("div",{className:"muted",style:{fontWeight:700},children:"1 Basic Alarm · 2 Camera · 3 Security Door · 4 Advanced Scanner · 5 Elite Security · 6 Quantum Security"})]})]})]})}function _g({pi:a,onDone:i}){const s=B(R=>R.me),r=B(R=>R.myItems.filter(q=>q.location==="vault").length),m=B(R=>R.catalog?.rules),u=B(R=>R.market[a.item_id]),f=B(R=>a.mutation?R.catalog?.mutations?.find(q=>q.id===a.mutation)?.mult??1:1),[_,h]=L.useState(!1),b=wt(a.item_id),x=Math.round((u?.price??b.base_value)*f),[y,v]=L.useState(String(Math.round(x*1.05))),w=!!a.hot_until&&je(a.hot_until)>Date.now(),A=Math.floor(x*(m?.quick_sell_rate??.6)),z=()=>i?.(),D=a1(b.rarity)>=5;return a.location==="listed"?c.jsx("div",{className:"muted",children:"Listed on the market."}):c.jsxs("div",{className:"col",style:{marginTop:10},children:[c.jsxs("div",{className:"row wrap",children:[a.location!=="display"&&c.jsx("button",{className:"btn primary",onClick:()=>cg(a.id).then(z).catch(()=>{}),children:"⬆ DISPLAY"}),a.location==="display"&&c.jsx("button",{className:"btn",onClick:()=>R1(a.id).then(z).catch(()=>{}),children:"⬇ STORE"}),a.location!=="vault"&&c.jsxs("button",{className:"btn good",disabled:r>=s.vault_capacity,onClick:()=>dg(a.id).then(z).catch(()=>{}),children:["🔒 VAULT ",r>=s.vault_capacity?"(FULL)":""]}),!a.soulbound&&b.tradeable&&c.jsx(c.Fragment,{children:c.jsx("button",{className:"btn gold",disabled:w,onClick:()=>h(!_),children:"🏷️ SELL"})})]}),w&&c.jsxs("div",{className:"bad-t",style:{fontWeight:800},children:["🔥 Too hot to sell for ",Ut(je(a.hot_until)-Date.now()),"."]}),_&&!w&&c.jsxs("div",{className:"card",children:[c.jsxs("div",{className:"row between",children:[c.jsxs("b",{children:["Sell ",b.name]}),c.jsxs("span",{className:"muted",children:["Market ",pe(x)]})]}),c.jsxs("div",{className:"grid two",style:{marginTop:8},children:[c.jsxs("div",{className:"col",children:[c.jsx("div",{className:"muted",style:{fontWeight:800},children:"QUICK SELL (instant)"}),c.jsx("button",{className:"btn",onClick:()=>D?wm({title:"Quick sell?",body:`Sell ${b.name} instantly for ${pe(A)} (60% of market)?`,confirmLabel:"SELL",danger:!0,hold:!0,onConfirm:()=>g_(a.id,b.id).then(z).catch(()=>{})}):g_(a.id,b.id).then(z).catch(()=>{}),children:pe(A)})]}),c.jsxs("div",{className:"col",children:[c.jsx("div",{className:"muted",style:{fontWeight:800},children:"LIST FOR (players buy)"}),c.jsx("input",{className:"field",inputMode:"numeric",value:y,onChange:R=>v(R.target.value.replace(/[^0-9]/g,""))})]})]}),c.jsx("div",{className:"row wrap",style:{marginTop:8},children:[.95,1,1.1,1.25].map(R=>c.jsx("button",{className:"btn small",onClick:()=>v(String(Math.round(x*R))),children:R===1?"MARKET":`${R>1?"+":""}${Math.round((R-1)*100)}%`},R))}),c.jsxs("div",{className:"muted",style:{fontWeight:700,marginTop:6},children:["You receive ",pe(Math.max(0,Number(y)-Math.ceil(Number(y)*(m?.market_fee??.05))))," after the 5% market fee. Allowed range ",Ue(x*(m?.list_min??.25)),"–",Ue(x*(m?.list_max??5)),"."]}),c.jsxs("button",{className:"btn gold block big",style:{marginTop:8},onClick:()=>Y1(a.id,Number(y)).then(z).catch(()=>{}),children:["LIST FOR ",pe(Number(y)||0)]})]})]})}function Lw(){const a=B(m=>m.catalog),i=B(m=>m.me),s=B(m=>m.last?.event),r=B(m=>!!m.drop);return an(1e3),c.jsxs(nn,{title:"DROP ZONE",icon:"📦",children:[c.jsxs("div",{className:"card tight",style:{background:"rgba(34,211,238,0.07)"},children:[c.jsx("b",{children:"All drops are bought with cash you earn in the game."}),c.jsxs("div",{className:"muted",style:{fontWeight:700},children:["No real money, no deposits, no cash-outs. Odds are shown on every machine",i.luck>0?` · your Prestige luck: +${Math.round(i.luck*100)}% on Rare+`:"","."]})]}),s&&c.jsxs("div",{className:"card",style:{borderColor:"rgba(251,146,60,0.6)"},children:[c.jsxs("b",{children:[s.icon," ",s.title," is live — ",Ut(je(s.ends_at)-Date.now())," left"]}),c.jsx("div",{className:"muted",style:{fontWeight:700},children:s.description})]}),a.drops.map(m=>{const u=i.drop_tokens?.[m.id]||0,f=i.level<m.min_level,_=m.event_only&&!s,h=m.requires_key&&i.secret_keys<1,b=f||_||h,x=i.cash>=m.price,y=Object.values(m.weights).reduce((v,w)=>v+(w||0),0);return c.jsxs("div",{className:"card","data-testid":"drop-"+m.id,style:{opacity:b?.7:1},children:[c.jsxs("div",{className:"row between",children:[c.jsxs("div",{children:[c.jsx("div",{className:"display",style:{fontWeight:900,fontSize:19},children:m.name}),c.jsx("div",{className:"muted",style:{fontWeight:700},children:m.description})]}),c.jsx("div",{className:"good-t display",style:{fontSize:20,fontWeight:900},children:pe(m.price)})]}),c.jsx("div",{className:"row wrap",style:{gap:6,margin:"10px 0"},children:Wo.filter(v=>m.weights[v]).map(v=>c.jsxs("span",{className:"row",style:{gap:4,display:"inline-flex"},children:[c.jsx(gi,{r:v}),c.jsx("b",{style:{fontSize:13},children:Hw((m.weights[v]||0)/y*100)})]},v))}),b?c.jsxs("div",{className:"muted",style:{fontWeight:800},children:["🔒 ",f?`Unlocks at level ${m.min_level}`:_?"Only during live events":`Needs a Secret Key (you have ${i.secret_keys}) — earn them from weekly missions and 7-day streaks`]}):c.jsxs("div",{className:"row",children:[u>0&&c.jsxs("button",{className:"btn good big grow",disabled:r,onClick:()=>cm(m.id,!0),children:["OPEN FREE (",u,")"]}),c.jsx("button",{className:"btn primary big grow",disabled:r||!x,onClick:()=>cm(m.id,!1),"data-testid":"open-"+m.id,children:x?"OPEN":`NEED ${pe(m.price-i.cash)}`})]})]},m.id)})]})}function Hw(a){return a>=10?a.toFixed(0)+"%":a>=1?a.toFixed(1)+"%":a.toFixed(2)+"%"}const U_=["ALL","TECH","GAMING","CARS","FASHION","LUXURY","SPORTS"];function Yw(){const a=B(q=>q.catalog),i=B(q=>q.me),s=B(q=>q.myItems),r=B(q=>q.panelArg),[m,u]=L.useState("ALL"),[f,_]=L.useState(null),[h,b]=L.useState(null),x=r?.playerId||i.id,y=s.length;L.useEffect(()=>{B.getState().backend?.rpc("stt_collection",x===i.id?{}:{player_id:x}).then(b).catch(()=>{})},[x,i.id,y]);const v=new Set((h?.discovered||[]).map(q=>q.item_id)),w=a.items.filter(q=>q.droppable||q.event_only),A=w.filter(q=>m==="ALL"||q.category===m).sort((q,V)=>qe[q.rarity].tier-qe[V.rarity].tier||q.base_value-V.base_value),z=q=>q.length?Math.round(q.filter(V=>v.has(V.id)).length/q.length*100):0,D=x===i.id,R=q=>D?s.filter(V=>V.item_id===q).length:h?.owned?.[q]||0;return c.jsxs(nn,{title:D?"COLLECTION":`${h?.username??""}'S COLLECTION`,icon:"🎒",children:[c.jsxs("div",{className:"card",children:[c.jsxs("div",{className:"row between",children:[c.jsxs("b",{style:{fontSize:18},children:[v.size,"/",w.length," discovered"]}),c.jsxs("b",{className:"gold-t display",style:{fontSize:22},children:[z(w),"%"]})]}),c.jsx("div",{className:"bar gold",style:{marginTop:8},children:c.jsx("i",{style:{width:z(w)+"%"}})}),c.jsx("div",{className:"grid three",style:{marginTop:10},children:U_.slice(1).map(q=>{const V=w.filter(Z=>Z.category===q);return c.jsxs("div",{className:"stat",style:{cursor:"pointer"},onClick:()=>u(q),children:[c.jsxs("div",{className:"k",children:[Uo[q]," ",q]}),c.jsxs("div",{className:"v",children:[z(V),"%"]})]},q)})})]}),D&&c.jsxs("div",{className:"card tight",children:[c.jsxs("div",{className:"row between wrap",children:[c.jsxs("b",{children:["🎯 Collection focus: ",i.focus]}),i.level<(a.rules.focus_level||5)&&c.jsxs("span",{className:"muted",children:["Unlocks at level ",a.rules.focus_level]})]}),c.jsx("div",{className:"muted",style:{fontWeight:700,margin:"4px 0 8px"},children:"Choose what your drops lean towards. Random keeps everything in play."}),c.jsx("div",{className:"row wrap",children:["RANDOM","TECH","GAMING","CARS","FASHION","LUXURY","SPORTS"].map(q=>c.jsxs("button",{className:"btn small "+(i.focus===q?"primary":""),disabled:q!=="RANDOM"&&i.level<(a.rules.focus_level||5),onClick:()=>P1(q).catch(()=>{}),children:[Uo[q]," ",q]},q))})]}),c.jsx(ba,{value:m,onChange:u,tabs:U_.map(q=>({id:q,label:q==="ALL"?"ALL":`${Uo[q]} ${q}`}))}),f&&c.jsxs("div",{className:"card",children:[c.jsx(hg,{id:f,owned:R(f)}),c.jsxs("div",{className:"row",style:{marginTop:8},children:[c.jsx("button",{className:"btn primary",onClick:()=>De("market",{item:f}),children:"📈 MARKET"}),c.jsx("button",{className:"btn ghost",onClick:()=>_(null),children:"CLOSE"})]})]}),c.jsx("div",{className:"grid items",children:A.map(q=>{const V=v.has(q.id);return c.jsx(An,{id:q.id,unknown:!V,onClick:V?()=>_(q.id):void 0,badge:V&&R(q.id)>0?c.jsxs("span",{className:"tag",children:["×",R(q.id)]}):q.event_only?c.jsx("span",{className:"tag",children:"EVENT"}):null},q.id)})})]})}function Bw(){const a=B(u=>u.panelArg),[i,s]=L.useState(a?.tab||"board"),[r,m]=L.useState(a?.item||null);return L.useEffect(()=>{a?.item&&m(a.item),a?.tab&&s(a.tab)},[a]),c.jsx(nn,{title:"CENTRAL MARKET",icon:"📈",children:r?c.jsx(Vw,{id:r,onBack:()=>m(null)}):c.jsxs(c.Fragment,{children:[c.jsx(ba,{value:i,onChange:s,tabs:[{id:"board",label:"Price board"},{id:"deals",label:"Buy listings"},{id:"mine",label:"My listings"}]}),i==="board"&&c.jsx(Gw,{onPick:m}),i==="deals"&&c.jsx(Iw,{onPick:m}),i==="mine"&&c.jsx(Xw,{onPick:m})]})})}function Gw({onPick:a}){const i=B(v=>v.market),s=B(v=>v.catalog?.items??_i),[r,m]=L.useState(""),[u,f]=L.useState("ALL"),[_,h]=L.useState("ALL"),[b,x]=L.useState("change"),y=L.useMemo(()=>{const v=r.trim().toLowerCase();return s.filter(w=>w.tradeable).filter(w=>(u==="ALL"||w.category===u)&&(_==="ALL"||w.rarity===_)&&(!v||w.name.toLowerCase().includes(v))).map(w=>({i:w,m:i[w.id]})).filter(w=>w.m).sort((w,A)=>b==="price"?A.m.price-w.m.price:b==="demand"?A.m.demand-w.m.demand:b==="name"?w.i.name.localeCompare(A.i.name):A.m.change_24h-w.m.change_24h)},[s,i,r,u,_,b]);return c.jsxs(c.Fragment,{children:[c.jsx("input",{className:"field",placeholder:"Search items…",value:r,onChange:v=>m(v.target.value)}),c.jsxs("div",{className:"row wrap",children:[c.jsxs("select",{className:"field",style:{width:"auto",flex:1},value:u,onChange:v=>f(v.target.value),children:[c.jsx("option",{value:"ALL",children:"All categories"}),["TECH","GAMING","CARS","FASHION","LUXURY","SPORTS"].map(v=>c.jsxs("option",{value:v,children:[Uo[v]," ",v]},v))]}),c.jsxs("select",{className:"field",style:{width:"auto",flex:1},value:_,onChange:v=>h(v.target.value),children:[c.jsx("option",{value:"ALL",children:"All rarities"}),Wo.map(v=>c.jsx("option",{value:v,children:qe[v].label},v))]}),c.jsxs("select",{className:"field",style:{width:"auto",flex:1},value:b,onChange:v=>x(v.target.value),children:[c.jsx("option",{value:"change",children:"Top movers (24H)"}),c.jsx("option",{value:"price",children:"Highest price"}),c.jsx("option",{value:"demand",children:"Highest demand"}),c.jsx("option",{value:"name",children:"Name"})]})]}),c.jsxs("table",{className:"tbl",children:[c.jsx("thead",{children:c.jsxs("tr",{children:[c.jsx("th",{children:"ITEM"}),c.jsx("th",{style:{textAlign:"right"},children:"PRICE"}),c.jsx("th",{style:{textAlign:"right"},children:"24H"}),c.jsx("th",{style:{textAlign:"right"},children:"DEMAND"})]})}),c.jsx("tbody",{children:y.map(({i:v,m:w})=>{const A=Q_(w.demand);return c.jsxs("tr",{className:"click",onClick:()=>a(v.id),children:[c.jsx("td",{children:c.jsxs("div",{className:"row",style:{gap:8},children:[c.jsx(Ft,{id:v.id,size:38}),c.jsxs("div",{style:{minWidth:0},children:[c.jsx("div",{style:{lineHeight:1.1},children:v.name}),c.jsx(gi,{r:v.rarity}),v.max_supply?c.jsxs("span",{className:"supply",style:{marginLeft:4},children:[w.minted??0,"/",v.max_supply]}):null]})]})}),c.jsx("td",{style:{textAlign:"right"},className:"mono",children:Ue(w.price)}),c.jsx("td",{style:{textAlign:"right"},className:"mono "+(w.change_24h>0?"up":w.change_24h<0?"down":"flat"),children:P_(w.change_24h)}),c.jsx("td",{style:{textAlign:"right"},className:A.cls,children:A.label})]},v.id)})})]})]})}function Iw({onPick:a}){const[i,s]=L.useState(null),r=B(u=>u.me),m=()=>G().backend?.rpc("stt_listings",{}).then(s).catch(()=>s([]));return L.useEffect(()=>{m();const u=window.setInterval(m,8e3);return()=>clearInterval(u)},[]),i?i.length?c.jsx("div",{className:"list",children:i.map(u=>{const f=wt(u.item_id);if(!f)return null;const _=u.market?u.price/u.market:1;return c.jsxs("div",{className:"li",children:[c.jsx(Ft,{id:f.id,size:48}),c.jsxs("div",{className:"grow",style:{cursor:"pointer"},onClick:()=>a(f.id),children:[c.jsxs("div",{className:"t1",children:[f.name,u.serial?` #${u.serial}`:""," ",c.jsx(Ra,{m:u.mutation})]}),c.jsxs("div",{className:"t2",children:[c.jsx(gi,{r:f.rarity})," by ",u.seller,u.seller_bot?" 🤖":""," · ",_<.97?c.jsxs("span",{className:"good-t",children:[Math.round((1-_)*100),"% under market"]}):_>1.03?c.jsxs("span",{className:"bad-t",children:[Math.round((_-1)*100),"% over market"]}):"at market"]})]}),u.mine?c.jsx("button",{className:"btn small",onClick:()=>vm(u.id).then(m).catch(()=>{}),children:"CANCEL"}):c.jsx("button",{className:"btn small good",disabled:r.cash<u.price,onClick:()=>fg(u.id,f.id,u.price).then(m).catch(()=>{}),children:Ue(u.price)})]},u.id)})}):c.jsx("div",{className:"empty",children:"No listings right now. Check back soon — traders list new stock all the time."}):c.jsx("div",{className:"empty",children:"Loading listings…"})}function Xw({onPick:a}){const i=B(r=>r.last?.listings??_i),s=B(r=>r.market);return i.length?c.jsx("div",{className:"list",children:i.map(r=>{const m=wt(r.item_id);return m?c.jsxs("div",{className:"li",children:[c.jsx(Ft,{id:m.id,size:48}),c.jsxs("div",{className:"grow",style:{cursor:"pointer"},onClick:()=>a(m.id),children:[c.jsx("div",{className:"t1",children:m.name}),c.jsxs("div",{className:"t2",children:["Listed ",pe(r.price)," · market ",pe(s[m.id]?.price)," · ",_a(r.created_at)]})]}),c.jsx("button",{className:"btn small",onClick:()=>vm(r.id).catch(()=>{}),children:"CANCEL"})]},r.id):null})}):c.jsx("div",{className:"empty",children:"You have no active listings. Open an item in your BASE and tap SELL to list it."})}function Vw({id:a,onBack:i}){const s=wt(a),r=B(R=>R.me),m=B(R=>R.myItems),u=L.useMemo(()=>m.filter(R=>R.item_id===a&&R.location!=="listed"),[m,a]),[f,_]=L.useState("24H"),[h,b]=L.useState(null),[x,y]=L.useState(null),[v,w]=L.useState(null),A=()=>G().backend?.rpc("stt_market_item",{item_id:a,range:f}).then(b).catch(()=>{});L.useEffect(()=>{A();const R=window.setInterval(A,1e4);return()=>clearInterval(R)},[a,f]);const z=L.useMemo(()=>{if(!h)return[];const R=h.history.map(q=>[q[0],q[1]]);return R.push([Date.now()+G().serverOffset,h.price]),R},[h]),D=h?Q_(h.demand):null;return c.jsxs(c.Fragment,{children:[c.jsx("button",{className:"btn small ghost",style:{alignSelf:"flex-start"},onClick:i,children:"← ALL ITEMS"}),c.jsxs("div",{className:"row",children:[c.jsx(Ft,{id:a,size:84}),c.jsxs("div",{className:"grow",children:[c.jsx("div",{style:{fontWeight:900,fontSize:21,lineHeight:1.1},children:s.name}),c.jsx(gi,{r:s.rarity})," ",c.jsxs("span",{className:"muted",style:{fontWeight:700},children:[s.category," · +",Cn(s.base_income)]}),h&&c.jsxs("div",{className:"row",style:{gap:12,marginTop:4},children:[c.jsx("span",{className:"display",style:{fontSize:26,fontWeight:900},children:pe(h.price)}),c.jsxs("span",{className:h.change_24h>=0?"up":"down",style:{fontWeight:900,fontSize:18},children:[P_(h.change_24h)," 24H"]})]})]})]}),c.jsx(ba,{value:f,onChange:_,tabs:["1H","24H","7D","30D","ALL"].map(R=>({id:R,label:R}))}),c.jsxs("div",{className:"card tight",children:[c.jsxs("div",{style:{fontWeight:800,fontSize:13,color:"#94a3b8",marginBottom:4},children:["PRICE — ",f]}),h?c.jsx(pw,{points:z}):c.jsx("div",{className:"empty",children:"Loading…"})]}),h&&c.jsxs("div",{className:"stats",children:[c.jsx(nt,{k:"Base price",v:Ue(s.base_value)}),c.jsx(nt,{k:"Current",v:Ue(h.price)}),c.jsx(nt,{k:"Demand",v:c.jsx("span",{className:D.cls,children:D.label})}),c.jsx(nt,{k:"Supply",v:s.max_supply?`${h.minted??0}/${s.max_supply}`:h.supply}),c.jsx(nt,{k:"Owners",v:h.owners}),c.jsx(nt,{k:"Listed",v:h.listed}),c.jsx(nt,{k:"Sales 24H",v:h.volume_24h}),c.jsx(nt,{k:"You own",v:h.mine})]}),c.jsx("h3",{children:"Listings"}),h?h.listings.length===0?c.jsx("div",{className:"empty",style:{padding:12},children:"No one is selling this right now."}):c.jsx("div",{className:"list",children:h.listings.map(R=>c.jsxs("div",{className:"li",children:[c.jsxs("div",{className:"grow",children:[c.jsxs("div",{className:"t1",children:[pe(R.price)," ",R.serial?c.jsxs("span",{className:"supply",children:["#",R.serial]}):null," ",c.jsx(Ra,{m:R.mutation})]}),c.jsxs("div",{className:"t2",children:[c.jsx(lc,{id:R.seller_id,name:R.seller,bot:R.seller_bot})," · ",_a(R.created_at)]})]}),R.mine?c.jsx("button",{className:"btn small",onClick:()=>vm(R.id).then(A).catch(()=>{}),children:"CANCEL"}):c.jsx("button",{className:"btn good small",disabled:r.cash<R.price,onClick:()=>w(R),children:"BUY"})]},R.id))}):null,v&&c.jsxs("div",{className:"card",style:{borderColor:"#4ade80"},children:[c.jsxs("b",{children:["Buy ",s.name," for ",pe(v.price),"?"]}),c.jsxs("div",{className:"muted",style:{fontWeight:700,margin:"4px 0 10px"},children:["Seller: ",v.seller,". You'll have ",pe(r.cash-v.price)," left."]}),c.jsx(ic,{className:"btn good big block",onConfirm:()=>{fg(v.id,s.id,v.price).then(()=>{w(null),A()}).catch(()=>w(null))},children:"HOLD TO BUY"}),c.jsx("button",{className:"btn block ghost",style:{marginTop:6},onClick:()=>w(null),children:"CANCEL"})]}),c.jsx("h3",{children:"Sell yours"}),u.length===0?c.jsx("div",{className:"muted",style:{fontWeight:700},children:"You don't own this item."}):c.jsxs("div",{className:"col",children:[c.jsx("div",{className:"row wrap",children:u.map(R=>c.jsxs("button",{className:"btn small "+(x===R.id?"primary":""),onClick:()=>y(R.id),children:[R.location.toUpperCase(),R.serial?` #${R.serial}`:""]},R.id))}),x&&u.find(R=>R.id===x)&&c.jsx(_g,{pi:u.find(R=>R.id===x),onDone:()=>{y(null),A()}})]}),c.jsx("h3",{children:"Recent sales"}),h&&h.sales.length===0&&c.jsx("div",{className:"muted",children:"No recent sales."}),h&&h.sales.length>0&&c.jsx("table",{className:"tbl",children:c.jsx("tbody",{children:h.sales.map((R,q)=>c.jsxs("tr",{children:[c.jsx("td",{className:"mono",children:pe(R.price)}),c.jsx("td",{className:"muted",children:R.kind==="quick_sell"?"Quick sell":`${R.seller??"?"} → ${R.buyer??"?"}`}),c.jsx("td",{className:"dim",style:{textAlign:"right"},children:_a(R.at)})]},q))})})]})}function Pw(){const a=B(f=>f.last?.revenge||0),[i,s]=L.useState(a?"revenge":"targets"),r=B(f=>f.me),m=an(1e3),u=r.raid_cooldown_until?je(r.raid_cooldown_until)-m:0;return c.jsxs(nn,{title:"RAID BOARD",icon:"🥷",children:[c.jsxs("div",{className:"card tight",style:{background:"rgba(244,63,94,0.08)"},children:[c.jsx("b",{children:"Pick a target. Is the reward worth the risk?"}),c.jsx("div",{className:"muted",style:{fontWeight:700},children:"Higher security = lower odds and longer steals. Owners get warned and can sound the alarm or vault the item. Fail and you pay a small fine and lay low."}),u>0&&c.jsxs("div",{className:"bad-t",style:{fontWeight:900,marginTop:4},children:["⏳ Laying low — next raid in ",Ut(u)]})]}),c.jsx(ba,{value:i,onChange:s,tabs:[{id:"targets",label:"Targets"},{id:"revenge",label:"Revenge",badge:a},{id:"history",label:"History"}]}),i==="targets"&&c.jsx(Qw,{}),i==="revenge"&&c.jsx(Zw,{}),i==="history"&&c.jsx(Kw,{})]})}function Qw(){const[a,i]=L.useState("recommended"),[s,r]=L.useState(null),m=an(5e3);return L.useEffect(()=>{G().backend?.rpc("stt_raid_targets",{sort:a}).then(r).catch(()=>r([]))},[a,m]),c.jsxs(c.Fragment,{children:[c.jsx("div",{className:"row wrap",children:["recommended","value","security"].map(u=>c.jsx("button",{className:"btn small "+(a===u?"primary":""),onClick:()=>i(u),children:u==="recommended"?"Near my level":u==="value"?"Richest bases":"Weakest security"},u))}),s?c.jsx("div",{className:"list",children:s.map(u=>{const f=u.shield_until&&je(u.shield_until)>Date.now(),_=u.protected||f&&!u.revenge||u.shown===0;return c.jsxs("div",{className:"li",style:u.revenge?{borderColor:"#f43f5e"}:void 0,children:[c.jsxs("div",{className:"grow",children:[c.jsxs("div",{className:"t1",children:[c.jsx(lc,{id:u.id,name:u.username,bot:u.is_bot,level:u.level}),u.online&&!u.is_bot&&c.jsx("span",{className:"tag online",style:{marginLeft:6},children:"ONLINE"}),u.revenge&&c.jsx("span",{className:"tag",style:{marginLeft:6,color:"#fda4af"},children:"⚔️ REVENGE"})]}),c.jsxs("div",{className:"t2",children:["Base ",c.jsx("b",{className:"good-t",children:Ue(u.base_value)})," · Security ",c.jsxs("b",{children:["L",u.security_level]})," ",u.security_name]}),u.top_item&&c.jsxs("div",{className:"t2 row",style:{gap:6},children:[c.jsx(Ft,{id:u.top_item.item_id,size:26,mutation:u.top_item.mutation})," Top item: ",wt(u.top_item.item_id)?.name," (",Ue(u.top_item.price),")"]}),u.protected&&c.jsx("div",{className:"t2",children:"🐣 New-player protection"}),f&&c.jsxs("div",{className:"t2",children:["🛡️ Shielded ",Ut(je(u.shield_until)-Date.now()),u.revenge?" (revenge ignores it)":""]})]}),c.jsx("button",{className:"btn hot",disabled:!!_,onClick:()=>Js(u.id,u.revenge),children:"RAID"})]},u.id)})}):c.jsx("div",{className:"empty",children:"Scouting targets…"})]})}function Zw(){const[a,i]=L.useState(null);return L.useEffect(()=>{G().backend?.rpc("stt_revenge").then(i).catch(()=>i([]))},[]),a?a.length?c.jsx("div",{className:"list",children:a.map(s=>c.jsxs("div",{className:"li",style:{borderColor:"#f43f5e"},children:[c.jsx(Ft,{id:s.item_id,size:48}),c.jsxs("div",{className:"grow",children:[c.jsxs("div",{className:"t1",children:["🚨 ",s.attacker,s.attacker_bot?" 🤖":""," stole your ",wt(s.item_id)?.name]}),c.jsxs("div",{className:"t2",children:[_a(s.resolved_at)," · ",s.on_display?"It's on display in their base!":s.still_theirs?"They're hiding it in storage.":"They got rid of it."," · revenge expires in ",Ut(je(s.expires_at)-Date.now())]})]}),c.jsx("button",{className:"btn hot",onClick:()=>Js(s.attacker_id,!0),children:"REVENGE"})]},s.raid_id))}):c.jsx("div",{className:"empty",children:"Nobody has robbed you in the last 24 hours. Keep it that way — upgrade security!"}):c.jsx("div",{className:"empty",children:"Loading…"})}function Kw(){const[a,i]=L.useState(null);return L.useEffect(()=>{G().backend?.rpc("stt_activity").then(s=>i(s.raids)).catch(()=>i([]))},[]),a?a.length?c.jsx("div",{className:"list",children:a.map(s=>c.jsxs("div",{className:"li",children:[c.jsx(Ft,{id:s.item_id,size:40}),c.jsxs("div",{className:"grow",children:[c.jsxs("div",{className:"t1",children:[s.mine?`You → ${s.defender}`:`${s.attacker} → you`," ",c.jsx("span",{className:s.status==="success"?s.mine?"good-t":"bad-t":s.mine?"bad-t":"good-t",children:s.status==="success"?"STOLEN":s.status==="active"?"IN PROGRESS":s.status==="blocked"?"BLOCKED":"FAILED"})]}),c.jsxs("div",{className:"t2",children:[wt(s.item_id)?.name," · ",_a(s.at),s.fine?` · fine ${pe(s.fine)}`:"",s.defended?" · alarm":""]})]})]},s.id))}):c.jsx("div",{className:"empty",children:"No raids yet."}):c.jsx("div",{className:"empty",children:"Loading…"})}function Ww(){const a=B(w=>w.panelArg)||{},i=B(w=>w.me),s=B(w=>w.steal),[r,m]=L.useState(null),[u,f]=L.useState(null),_=an(4e3),h=a.playerId;if(L.useEffect(()=>{if(h){if(h===i.id){De("base");return}G().backend?.rpc("stt_base",{player_id:h}).then(m).catch(w=>f(String(w.message)))}},[h,_,s?.result]),L.useEffect(()=>{h&&de({focusPlot:h})},[h]),!h)return null;if(u)return c.jsx(nn,{title:"BASE",icon:"🥷",children:c.jsx("div",{className:"empty",children:u})});if(!r)return c.jsx(nn,{title:"VISITING…",icon:"🥷",children:c.jsx("div",{className:"empty",children:"Walking over…"})});const b=r.shield_until&&je(r.shield_until)>Date.now(),x=!!a.revenge||r.revenge_available,y=!!s&&!s.result,v=i.raid_cooldown_until?je(i.raid_cooldown_until)-Date.now():0;return c.jsxs(nn,{title:`${r.username.toUpperCase()}'S BASE`,icon:r.is_bot?"🤖":"🥷",children:[c.jsxs("div",{className:"row wrap",children:[c.jsx(lc,{id:r.id,name:r.username,bot:r.is_bot,level:r.level}),r.online&&!r.is_bot&&c.jsx("span",{className:"tag online",children:"ONLINE — they'll see you coming"}),r.prestige>0&&c.jsxs("span",{className:"tag",children:["P",r.prestige]})]}),r.bio&&c.jsxs("div",{className:"muted",style:{fontStyle:"italic"},children:["“",r.bio,"”"]}),c.jsxs("div",{className:"stats",children:[c.jsx(nt,{k:"Base value",v:Ue(r.base_value),cls:"good-t"}),c.jsx(nt,{k:"Income",v:Cn(r.income)}),c.jsx(nt,{k:"Security",v:`L${r.security_level}`}),c.jsx(nt,{k:"Vault",v:`${r.vault_used} locked`})]}),c.jsxs("div",{className:"card tight",children:[c.jsxs("b",{children:["🔐 ",r.security_name]}),c.jsx("div",{className:"muted",style:{fontWeight:700},children:r.raid_block?`⛔ ${r.raid_block}`:x?"⚔️ REVENGE: +15% odds, faster steals, ignores shields.":b?"🛡️ Shielded.":"Open for business. Choose wisely."}),v>0&&c.jsxs("div",{className:"bad-t",style:{fontWeight:800},children:["⏳ You're laying low for ",Ut(v),"."]})]}),c.jsxs("div",{className:"row wrap",children:[c.jsx("button",{className:"btn small grow",onClick:()=>De("trade",{tab:"new",with:r.id}),children:"🤝 TRADE"}),c.jsx("button",{className:"btn small grow",onClick:()=>De("profile",{playerId:r.id}),children:"👤 PROFILE"}),c.jsx("button",{className:"btn small grow",onClick:()=>De("collection",{playerId:r.id}),children:"🎒 COLLECTION"})]}),c.jsxs("h3",{children:["On display (",r.items.length,"/",r.slots,")"]}),r.items.length===0?c.jsx("div",{className:"empty",children:"Nothing on display. Smart… or broke."}):c.jsx("div",{className:"grid items",children:[...r.items].sort((w,A)=>Pn(A.item_id)-Pn(w.item_id)).map(w=>{if(!wt(w.item_id))return null;const z=w.soulbound||w.under_raid||!!r.raid_block||y||v>0;return c.jsx(An,{id:w.item_id,mutation:w.mutation,serial:w.serial,badge:w.under_raid?c.jsx("span",{className:"tag",children:"🚨 BEING STOLEN"}):w.soulbound?c.jsx("span",{className:"tag",children:"★ SAFE"}):null,footer:!w.soulbound&&c.jsxs("div",{className:"col",style:{gap:4,marginTop:6,position:"relative",zIndex:2},children:[c.jsxs("div",{className:"muted",style:{fontSize:12,fontWeight:800},children:[Math.round((w.chance??0)*100),"% · ",w.seconds,"s"]}),c.jsx("button",{className:"btn hot small block",disabled:z,"data-testid":"steal",onClick:D=>{D.stopPropagation(),De(null),yt?yt.stealFromPanel(r.id,w.id,x):Io(w.id,x).catch(()=>{})},children:"🥷 STEAL"})]})},w.id)})}),c.jsx("div",{className:"dim",style:{fontSize:13},children:"Odds are for beating the lasers during the GRAB. Then you still have to carry it home — the owner can tag you on the way."})]})}function Jw(){const a=B(y=>y.panelArg)||{},i=B(y=>y.last?.trades.incoming||0),[s,r]=L.useState(a.tab||(i?"incoming":"new")),[m,u]=L.useState(null),f=an(5e3),_=()=>G().backend?.rpc("stt_trades").then(u).catch(()=>u([]));L.useEffect(()=>{_()},[f,i]),L.useEffect(()=>{a.tab&&r(a.tab)},[a.tab]);const h=(m||[]).filter(y=>y.status==="pending"&&y.incoming),b=(m||[]).filter(y=>y.status==="pending"&&!y.incoming),x=(m||[]).filter(y=>y.status!=="pending");return c.jsxs(nn,{title:"TRADE HUB",icon:"🤝",children:[c.jsx(ba,{value:s,onChange:r,tabs:[{id:"incoming",label:"Incoming",badge:h.length},{id:"outgoing",label:"Outgoing",badge:0},{id:"new",label:"New trade"},{id:"history",label:"History"}]}),s==="incoming"&&(h.length?h.map(y=>c.jsx(im,{t:y,onDone:_},y.id)):c.jsx("div",{className:"empty",children:"No offers waiting. Show off something good and they'll come."})),s==="outgoing"&&(b.length?b.map(y=>c.jsx(im,{t:y,onDone:_},y.id)):c.jsx("div",{className:"empty",children:"No open offers."})),s==="new"&&c.jsx(Fw,{initialWith:a.with,onSent:()=>{_(),r("outgoing")}}),s==="history"&&(x.length?x.map(y=>c.jsx(im,{t:y,onDone:_},y.id)):c.jsx("div",{className:"empty",children:"No trades yet."}))]})}function ec({title:a,items:i,cash:s}){return c.jsxs("div",{className:"card tight grow",style:{minWidth:0},children:[c.jsx("div",{className:"muted",style:{fontWeight:900,fontSize:12,letterSpacing:"0.1em"},children:a}),c.jsxs("div",{className:"row wrap",style:{gap:6,marginTop:6},children:[i.map(r=>c.jsxs("div",{title:wt(r.item_id)?.name,style:{opacity:r.available===!1?.35:1,textAlign:"center",width:64},children:[c.jsx(Ft,{id:r.item_id,size:52,mutation:r.mutation}),c.jsx("div",{style:{fontSize:11,fontWeight:800,lineHeight:1.05},children:wt(r.item_id)?.name.slice(0,18)}),c.jsx(Ra,{m:r.mutation,mult:!1})]},r.id)),s>0&&c.jsxs("div",{className:"good-t",style:{fontWeight:900,fontSize:18},children:["+ ",pe(s)]}),!i.length&&!s&&c.jsx("div",{className:"dim",children:"nothing"})]})]})}function mm({give:a,get:i}){const s=a+i===0?.5:i/(a+i);return c.jsxs("div",{children:[c.jsxs("div",{className:"row between",style:{fontWeight:800,fontSize:13},children:[c.jsxs("span",{className:"muted",children:["You give ",Ue(a)]}),c.jsx("span",{className:i>=a?"good-t":"bad-t",children:i>=a?"In your favour":"Against you"}),c.jsxs("span",{className:"muted",children:["You get ",Ue(i)]})]}),c.jsx("div",{className:"fair",style:{marginTop:6},children:c.jsx("i",{style:{left:`${s*100}%`}})})]})}function im({t:a,onDone:i}){const[s,r]=L.useState(!1),[m,u]=L.useState(!1),f=B(x=>x.me),_=a.incoming?a.request_value:a.offer_value,h=a.incoming?a.offer_value:a.request_value,b=a.incoming?{id:a.from_id,name:a.from,bot:a.from_bot}:{id:a.to_id,name:a.to,bot:a.to_bot};return c.jsxs("div",{className:"card",style:a.status==="pending"&&a.incoming?{borderColor:"#22d3ee"}:void 0,children:[c.jsxs("div",{className:"row between",children:[c.jsxs("div",{children:[a.incoming?"From ":"To ",c.jsx(lc,{id:b.id,name:b.name,bot:b.bot})]}),c.jsx("span",{className:"tag",style:{color:a.status==="accepted"?"#86efac":a.status==="pending"?"#67e8f9":"#fda4af"},children:a.status})]}),a.message&&c.jsxs("div",{className:"muted",style:{fontStyle:"italic",margin:"6px 0"},children:["“",a.message,"”"]}),c.jsxs("div",{className:"row",style:{alignItems:"stretch",marginTop:6},children:[c.jsx(ec,{title:a.incoming?"THEY GIVE YOU":"YOU GIVE",items:a.offer_items,cash:a.offer_cash}),c.jsx("div",{style:{alignSelf:"center",fontSize:22},children:"⇄"}),c.jsx(ec,{title:a.incoming?"YOU GIVE":"YOU GET",items:a.request_items,cash:a.request_cash})]}),c.jsx("div",{style:{marginTop:10},children:c.jsx(mm,{give:_,get:h})}),a.note&&c.jsx("div",{className:"muted",style:{marginTop:6,fontWeight:700},children:a.note}),c.jsx("div",{className:"dim",style:{fontSize:12,marginTop:4},children:_a(a.created_at)}),a.status==="pending"&&a.incoming&&!s&&c.jsxs("div",{className:"row",style:{marginTop:10},children:[c.jsx("button",{className:"btn grow",disabled:m,onClick:async()=>{u(!0);try{await v_(a.id,!1),i()}finally{u(!1)}},children:"DECLINE"}),c.jsx("button",{className:"btn good grow",disabled:m||f.cash<a.request_cash,onClick:()=>r(!0),children:"REVIEW & ACCEPT"})]}),s&&c.jsxs("div",{className:"card",style:{marginTop:10,borderColor:"#4ade80",background:"rgba(74,222,128,0.06)"},children:[c.jsx("b",{style:{fontSize:18},children:"FINAL CONFIRMATION"}),c.jsxs("div",{className:"muted",style:{fontWeight:700,margin:"6px 0 10px"},children:["You give ",a.request_items.length," item(s)",a.request_cash?` + ${pe(a.request_cash)}`:""," and receive ",a.offer_items.length," item(s)",a.offer_cash?` + ${pe(a.offer_cash)}`:"",". This can't be undone."]}),c.jsx(ic,{className:"btn good big block",onConfirm:async()=>{u(!0);try{await v_(a.id,!0)}catch{}finally{u(!1),r(!1),i()}},children:"HOLD TO ACCEPT"}),c.jsx("button",{className:"btn ghost block",style:{marginTop:6},onClick:()=>r(!1),children:"BACK"})]}),a.status==="pending"&&!a.incoming&&c.jsx("button",{className:"btn block",style:{marginTop:10},onClick:()=>G1(a.id).then(i).catch(()=>{}),children:"CANCEL OFFER"})]})}function Fw({initialWith:a,onSent:i}){const s=B(Q=>Q.me),r=B(Q=>Q.myItems),[m,u]=L.useState(null),[f,_]=L.useState(a||null),[h,b]=L.useState(null),[x,y]=L.useState([]),[v,w]=L.useState([]),[A,z]=L.useState(""),[D,R]=L.useState(""),[q,V]=L.useState(""),[Z,ee]=L.useState(!1),[ke,U]=L.useState("");L.useEffect(()=>{G().backend?.rpc("stt_raid_targets",{sort:"value"}).then(u).catch(()=>u([]))},[]),L.useEffect(()=>{b(null),w([]),f&&G().backend?.rpc("stt_base",{player_id:f}).then(b).catch(()=>{})},[f]);const ie=L.useMemo(()=>r.filter(Q=>!Q.soulbound&&Q.location!=="listed"&&!(Q.hot_until&&je(Q.hot_until)>Date.now())&&wt(Q.item_id)?.tradeable).sort((Q,ge)=>Pn(ge.item_id)-Pn(Q.item_id)),[r]),ye=(Q,ge,ne)=>ge(Q.includes(ne)?Q.filter(K=>K!==ne):Q.length>=8?Q:[...Q,ne]),it=x.reduce((Q,ge)=>Q+Pn(r.find(ne=>ne.id===ge)?.item_id||""),0)+(Number(A)||0),mt=v.reduce((Q,ge)=>Q+Pn(h?.items.find(ne=>ne.id===ge)?.item_id||""),0)+(Number(D)||0),le=f&&(x.length||v.length)&&(Number(A)||0)<=s.cash;if(!f){const Q=(m||[]).filter(ge=>!ke||ge.username.toLowerCase().includes(ke.toLowerCase()));return c.jsxs(c.Fragment,{children:[c.jsx("div",{className:"muted",style:{fontWeight:700},children:"Who do you want to trade with? NPC traders answer in seconds; real players get a notification."}),c.jsx("input",{className:"field",placeholder:"Search players…",value:ke,onChange:ge=>U(ge.target.value)}),m?c.jsx("div",{className:"list",children:Q.map(ge=>c.jsxs("div",{className:"li click",onClick:()=>_(ge.id),children:[c.jsxs("div",{className:"grow",children:[c.jsxs("div",{className:"t1",children:[ge.username," ",ge.is_bot&&c.jsx("span",{className:"tag bot",children:"NPC"})," ",ge.online&&!ge.is_bot&&c.jsx("span",{className:"tag online",children:"ONLINE"})]}),c.jsxs("div",{className:"t2",children:["Lv ",ge.level," · base ",Ue(ge.base_value)," · ",ge.shown," items on display"]})]}),c.jsx("span",{className:"btn small",children:"CHOOSE"})]},ge.id))}):c.jsx("div",{className:"empty",children:"Loading…"})]})}if(Z){const Q=x.map(ne=>r.find(K=>K.id===ne)).filter(Boolean),ge=v.map(ne=>h?.items.find(K=>K.id===ne)).filter(Boolean);return c.jsxs("div",{className:"col",children:[c.jsx("b",{style:{fontSize:20},children:"FINAL CONFIRMATION"}),c.jsxs("div",{className:"muted",style:{fontWeight:700},children:["Sending this offer to ",h?.username,". Nothing moves until they accept too — and if anything changes hands in the meantime, the trade safely fails."]}),c.jsxs("div",{className:"row",style:{alignItems:"stretch"},children:[c.jsx(ec,{title:"YOU GIVE",items:Q.map(ne=>({id:ne.id,item_id:ne.item_id,serial:ne.serial})),cash:Number(A)||0}),c.jsx("div",{style:{alignSelf:"center",fontSize:22},children:"⇄"}),c.jsx(ec,{title:"YOU GET",items:ge.map(ne=>({id:ne.id,item_id:ne.item_id,serial:ne.serial})),cash:Number(D)||0})]}),c.jsx(mm,{give:it,get:mt}),c.jsx(ic,{className:"btn primary big block",onConfirm:()=>B1({to:f,offer_items:x,offer_cash:Number(A)||0,request_items:v,request_cash:Number(D)||0,message:q}).then(()=>{y([]),w([]),z(""),R(""),ee(!1),i()}).catch(()=>ee(!1)),children:"HOLD TO SEND OFFER"}),c.jsx("button",{className:"btn block",onClick:()=>ee(!1),children:"EDIT"})]})}return c.jsxs("div",{className:"col",children:[c.jsxs("div",{className:"row between",children:[c.jsxs("b",{children:["Trading with ",h?.username??"…"," ",h?.is_bot&&c.jsx("span",{className:"tag bot",children:"NPC"})]}),c.jsx("button",{className:"btn small ghost",onClick:()=>_(null),children:"CHANGE"})]}),c.jsx("h3",{children:"You offer"}),ie.length===0?c.jsx("div",{className:"muted",children:"You have nothing tradeable yet."}):c.jsx("div",{className:"grid items",children:ie.map(Q=>c.jsx(An,{id:Q.item_id,mutation:Q.mutation,serial:Q.serial,selected:x.includes(Q.id),onClick:()=>ye(x,y,Q.id),showIncome:!1,badge:Q.location==="vault"?c.jsx("span",{className:"tag",children:"🔒"}):null},Q.id))}),c.jsx("input",{className:"field",inputMode:"numeric",placeholder:`+ cash (you have ${pe(s.cash)})`,value:A,onChange:Q=>z(Q.target.value.replace(/[^0-9]/g,""))}),c.jsx("h3",{children:"You request"}),h?h.items.filter(Q=>!Q.soulbound).length===0?c.jsx("div",{className:"muted",children:"They have nothing on display to trade."}):c.jsx("div",{className:"grid items",children:h.items.filter(Q=>!Q.soulbound).map(Q=>c.jsx(An,{id:Q.item_id,mutation:Q.mutation,serial:Q.serial,selected:v.includes(Q.id),onClick:()=>ye(v,w,Q.id),showIncome:!1},Q.id))}):c.jsx("div",{className:"empty",children:"Loading their base…"}),c.jsx("input",{className:"field",inputMode:"numeric",placeholder:"+ cash you want from them",value:D,onChange:Q=>R(Q.target.value.replace(/[^0-9]/g,""))}),c.jsx("textarea",{className:"field",maxLength:140,placeholder:"Message (optional)",value:q,onChange:Q=>V(Q.target.value)}),c.jsx(mm,{give:it,get:mt}),c.jsx("button",{className:"btn primary big block",disabled:!le,onClick:()=>ee(!0),children:"REVIEW OFFER"})]})}const L_=[{id:"richest",label:"💵 Richest",fmt:a=>pe(a)},{id:"base_value",label:"🏠 Base value",fmt:a=>pe(a)},{id:"items",label:"📦 Most items",fmt:a=>a+" items"},{id:"secrets",label:"🕳️ Secrets",fmt:a=>a+" secret"+(a===1?"":"s")},{id:"raids",label:"🥷 Raids won",fmt:a=>a+" steals"},{id:"trades",label:"🤝 Trades",fmt:a=>a+" trades"},{id:"level",label:"⭐ Level",fmt:(a,i)=>`Lv ${i.level}${i.prestige?` · P${i.prestige}`:""}`},{id:"collection",label:"🎒 Collection",fmt:a=>a+" found"}];function ex(){const[a,i]=L.useState("base_value"),[s,r]=L.useState(null),m=an(15e3);L.useEffect(()=>{G().backend?.rpc("stt_leaderboard",{kind:a}).then(r).catch(()=>{})},[a,m]);const u=L_.find(f=>f.id===a);return c.jsxs(nn,{title:"LEADERBOARDS",icon:"🏆",children:[c.jsx(ba,{value:a,onChange:i,tabs:L_.map(f=>({id:f.id,label:f.label}))}),s?c.jsxs(c.Fragment,{children:[s.me&&c.jsxs("div",{className:"li me",children:[c.jsxs("div",{className:"rank",children:["#",s.me.rank]}),c.jsx("div",{className:"grow",children:c.jsx("div",{className:"t1",children:"You"})}),c.jsx("b",{className:"mono",children:u.fmt(Number(s.me.score),s.me)})]}),c.jsx("div",{className:"list",children:s.rows.map(f=>c.jsxs("div",{className:"li click"+(f.me?" me":""),onClick:()=>De("profile",{playerId:f.id}),children:[c.jsx("div",{className:"rank r"+f.rank,children:f.rank<=3?["🥇","🥈","🥉"][f.rank-1]:f.rank}),c.jsx("div",{className:"avatar-dot",style:{width:34,height:34,fontSize:15,background:`hsl(${Yl(f.id)},70%,55%)`},children:f.username[0]}),c.jsxs("div",{className:"grow",children:[c.jsxs("div",{className:"t1",children:[f.username," ",f.is_bot&&c.jsx("span",{className:"tag bot",children:"NPC"})]}),c.jsxs("div",{className:"t2",children:["Lv ",f.level,f.prestige?` · Prestige ${f.prestige}`:""]})]}),c.jsx("b",{className:"mono",children:u.fmt(Number(f.score),f)})]},f.id))})]}):c.jsx("div",{className:"empty",children:"Loading…"})]})}function tx(){const a=B(x=>x.panelArg)||{},i=B(x=>x.me),s=a.playerId||i.id,r=s===i.id,[m,u]=L.useState("profile"),[f,_]=L.useState(null),h=an(1e4);if(L.useEffect(()=>{G().backend?.rpc("stt_profile",r?{}:{player_id:s}).then(_).catch(()=>{})},[s,h,i.level,i.owned_cosmetics.length]),L.useEffect(()=>u("profile"),[s]),!f)return c.jsx(nn,{title:"PROFILE",icon:"👤",children:c.jsx("div",{className:"empty",children:"Loading…"})});const b=[{id:"profile",label:"Profile"},{id:"achievements",label:"Achievements"},...r?[{id:"style",label:"Cosmetics"},{id:"prestige",label:"Prestige"},{id:"activity",label:"Activity"}]:[]];return c.jsxs(nn,{title:r?"MY PROFILE":"PLAYER",icon:"👤",children:[c.jsxs("div",{className:"row",children:[c.jsxs("div",{className:"avatar-dot",style:{width:64,height:64,fontSize:28,background:`hsl(${Yl(f.id)},70%,55%)`},children:[f.username[0].toUpperCase(),c.jsx("span",{className:"lvl",children:f.level})]}),c.jsxs("div",{className:"grow",children:[c.jsxs("div",{style:{fontWeight:900,fontSize:24,lineHeight:1.1},children:[f.username," ",f.is_bot&&c.jsx("span",{className:"tag bot",children:"NPC"})]}),c.jsxs("div",{className:"muted",style:{fontWeight:800},children:[f.title," · Level ",f.level,f.prestige?` · ✨ Prestige ${f.prestige}`:""]}),c.jsxs("div",{className:"row",style:{gap:6,marginTop:4},children:[f.online&&c.jsx("span",{className:"tag online",children:"ONLINE"}),f.protected&&c.jsx("span",{className:"tag",children:"🐣 PROTECTED"}),f.shield_until&&je(f.shield_until)>Date.now()&&c.jsx("span",{className:"tag",children:"🛡️ SHIELDED"})]})]})]}),f.bio&&c.jsxs("div",{className:"muted",style:{fontStyle:"italic"},children:["“",f.bio,"”"]}),!r&&c.jsxs("div",{className:"row wrap",children:[c.jsx("button",{className:"btn grow",onClick:()=>Js(f.id),children:"🏠 VISIT BASE"}),c.jsx("button",{className:"btn grow",onClick:()=>De("trade",{tab:"new",with:f.id}),children:"🤝 TRADE"}),c.jsx("button",{className:"btn hot grow",onClick:()=>Js(f.id),children:"🥷 RAID"}),c.jsx("button",{className:"btn grow",onClick:()=>De("collection",{playerId:f.id}),children:"🎒 COLLECTION"})]}),c.jsx(ba,{value:m,onChange:u,tabs:b}),m==="profile"&&c.jsx(nx,{p:f}),m==="achievements"&&c.jsx(ax,{p:f}),m==="style"&&r&&c.jsx(lx,{}),m==="prestige"&&r&&c.jsx(sx,{}),m==="activity"&&r&&c.jsx(rx,{})]})}function nx({p:a}){return c.jsxs(c.Fragment,{children:[c.jsxs("div",{className:"stats",children:[c.jsx(nt,{k:"Base value",v:Ue(a.base_value),cls:"good-t"}),c.jsx(nt,{k:"Income",v:Cn(a.income)}),c.jsx(nt,{k:"Collection",v:`${Math.round(a.collection/Math.max(1,a.collection_total)*100)}%`}),c.jsx(nt,{k:"Legendary+",v:a.rare_items}),c.jsx(nt,{k:"Secrets",v:a.secrets.length}),c.jsx(nt,{k:"Steals",v:a.stats.steals_won??0}),c.jsx(nt,{k:"Defended",v:a.stats.raids_defended??0}),c.jsx(nt,{k:"Trades",v:a.stats.trades_done??0}),c.jsx(nt,{k:"Drops opened",v:a.stats.drops_opened??0}),c.jsx(nt,{k:"Base / Security",v:`L${a.base_level} / L${a.security_level}`})]}),a.secrets.length>0&&c.jsxs(c.Fragment,{children:[c.jsx("h3",{children:"🕳️ Secret items"}),c.jsx("div",{className:"grid items",children:a.secrets.map((i,s)=>c.jsx(An,{id:i.item_id,serial:i.serial},s))})]}),c.jsx("h3",{children:"Showcase"}),a.showcase.length===0?c.jsx("div",{className:"muted",children:"Nothing on display."}):c.jsx("div",{className:"grid items",children:a.showcase.map((i,s)=>c.jsx(An,{id:i.item_id,serial:i.serial},s))}),c.jsx("h3",{children:"Recent achievements"}),a.achievements.length===0?c.jsx("div",{className:"muted",children:"None yet."}):c.jsx("div",{className:"row wrap",children:a.achievements.slice(0,8).map(i=>c.jsxs("span",{className:"tag",style:{fontSize:13,padding:"4px 10px"},children:[i.icon," ",i.title]},i.id))}),c.jsxs("div",{className:"dim",style:{fontSize:13},children:["Joined ",_a(a.created_at)]})]})}function ax({p:a}){const i=B(r=>r.catalog?.achievements??_i),s=new Map(a.achievements.map(r=>[r.id,r]));return c.jsxs(c.Fragment,{children:[c.jsxs("div",{className:"muted",style:{fontWeight:700},children:[s.size,"/",i.length," unlocked"]}),c.jsx("div",{className:"list",children:i.map(r=>{const m=s.get(r.id);return c.jsxs("div",{className:"li",style:{opacity:m?1:.5},children:[c.jsx("div",{style:{fontSize:28,filter:m?"none":"grayscale(1)"},children:r.icon}),c.jsxs("div",{className:"grow",children:[c.jsx("div",{className:"t1",children:r.title}),c.jsxs("div",{className:"t2",children:[r.description,r.reward_cash?` · ${pe(r.reward_cash)}`:"",r.xp?` · ${r.xp} XP`:""]})]}),m?c.jsxs("span",{className:"tag online",children:["✓ ",_a(m.unlocked_at)]}):c.jsx("span",{className:"tag",children:"LOCKED"})]},r.id)})})]})}const ix=[{id:"theme",label:"Base theme"},{id:"floor",label:"Floor"},{id:"lighting",label:"Lighting"},{id:"platform",label:"Display platforms"},{id:"item_fx",label:"Item animation"},{id:"trail",label:"Player trail"},{id:"nameplate",label:"Nameplate"},{id:"emote",label:"Emotes"},{id:"wall",label:"Walls"}];function lx(){const a=B(s=>s.me),i=B(s=>s.catalog?.cosmetics??_i);return c.jsxs(c.Fragment,{children:[c.jsx("div",{className:"muted",style:{fontWeight:700},children:"Cosmetics are purely visual — they never make you stronger."}),ix.map(s=>{const r=i.filter(m=>m.slot===s.id);return r.length?c.jsxs("div",{className:"card tight",children:[c.jsx("b",{children:s.label}),c.jsx("div",{className:"list",style:{marginTop:8},children:r.map(m=>{const u=a.owned_cosmetics.includes(m.id),f=a.cosmetics?.[s.id]===m.id,_=m.unlock?m.unlock.startsWith("level:")?`Level ${m.unlock.split(":")[1]}`:m.unlock.startsWith("prestige:")?`Prestige ${m.unlock.split(":")[1]}`:"Quest reward":null,h=m.unlock&&(m.unlock.startsWith("level:")&&a.level>=Number(m.unlock.split(":")[1])||m.unlock.startsWith("prestige:")&&a.prestige>=Number(m.unlock.split(":")[1]));return c.jsxs("div",{className:"li",style:{padding:"8px 10px"},children:[m.data.glow||m.data.color?c.jsx("span",{style:{width:22,height:22,borderRadius:7,background:m.data.color==="rainbow"?"linear-gradient(90deg,#f43f5e,#fbbf24,#22d3ee,#a855f7)":m.data.glow||m.data.color}}):m.data.emoji?c.jsx("span",{style:{fontSize:22},children:m.data.emoji}):c.jsx("span",{children:"🎨"}),c.jsx("div",{className:"grow t1",style:{fontSize:15},children:m.name}),f?c.jsx("span",{className:"tag online",children:"EQUIPPED"}):u?s.id==="emote"?c.jsx("span",{className:"tag",children:"OWNED"}):c.jsx("button",{className:"btn small primary",onClick:()=>V1(m.id).catch(()=>{}),children:"EQUIP"}):m.unlock?c.jsx("button",{className:"btn small",disabled:!h,onClick:()=>w_(m.id).catch(()=>{}),children:h?"CLAIM":`🔒 ${_}`}):c.jsx("button",{className:"btn small gold",disabled:a.cash<m.price,onClick:()=>w_(m.id).catch(()=>{}),children:Ue(m.price)})]},m.id)})})]},s.id):null})]})}function sx(){const a=B(u=>u.me),s=B(u=>u.catalog?.rules)?.prestige_level??25,r=a.prestige+1,m=r<=0?0:Math.min(50,3*r-1);return c.jsxs("div",{className:"col",children:[c.jsxs("div",{className:"card",style:{borderColor:"#c084fc",background:"rgba(124,58,237,0.1)"},children:[c.jsxs("div",{className:"display",style:{fontSize:22,fontWeight:900},children:["✨ PRESTIGE ",r]}),c.jsxs("div",{className:"muted",style:{fontWeight:700,marginTop:6},children:["Reach level ",s," to prestige. You'll restart with permanent bonuses:"]}),c.jsxs("ul",{style:{fontWeight:800,lineHeight:1.6},children:[c.jsxs("li",{className:"good-t",children:["+",5*r,"% income forever"]}),c.jsxs("li",{className:"good-t",children:["+",m,"% luck on Rare-or-better drops"]}),c.jsx("li",{children:"Prestige-only base themes, trails & emotes"}),c.jsx("li",{children:"30-minute raid shield after the reset"})]}),c.jsxs("div",{className:"muted",style:{fontWeight:700},children:[c.jsx("b",{children:"You keep:"})," vault items, your collection book, cosmetics, achievements, secret keys.",c.jsx("br",{}),c.jsx("b",{children:"You lose:"})," cash, displayed & stored items, base & security upgrades, level."]})]}),c.jsx("div",{className:"bar gold",children:c.jsx("i",{style:{width:`${Math.min(100,a.level/s*100)}%`}})}),c.jsxs("div",{className:"muted center",style:{fontWeight:800},children:["Level ",a.level,"/",s]}),c.jsx("button",{className:"btn purple big block",disabled:a.level<s,onClick:()=>wm({title:`Prestige to P${r}?`,body:"Everything outside your vault (except your Starter TV) is gone. Put your favourites in the vault first!",confirmLabel:"PRESTIGE",danger:!0,hold:!0,onConfirm:()=>Q1().catch(()=>{})}),children:a.level<s?`LOCKED — LEVEL ${s}`:"PRESTIGE NOW"})]})}function rx(){const[a,i]=L.useState(null);return L.useEffect(()=>{G().backend?.rpc("stt_activity").then(i).catch(()=>{})},[]),a?c.jsxs(c.Fragment,{children:[c.jsx("div",{className:"muted",style:{fontWeight:700},children:"Every cash movement is recorded on the server (passive income is shown as your total earned)."}),c.jsx("table",{className:"tbl",children:c.jsx("tbody",{children:a.transactions.map(s=>c.jsxs("tr",{children:[c.jsx("td",{children:s.kind.replace(/_/g," ")}),c.jsxs("td",{className:"mono "+(s.amount>=0?"up":"down"),style:{textAlign:"right"},children:[s.amount>=0?"+":"",pe(s.amount)]}),c.jsx("td",{className:"dim",style:{textAlign:"right"},children:_a(s.created_at)})]},s.id))})})]}):c.jsx("div",{className:"empty",children:"Loading…"})}const ox=[{d:1,icon:"💵",label:"Cash"},{d:2,icon:"📦",label:"2× Basic Drop"},{d:3,icon:"💵",label:"Cash"},{d:4,icon:"💠",label:"Rare item"},{d:5,icon:"🎁",label:"Premium Drop"},{d:6,icon:"💰",label:"Big cash"},{d:7,icon:"🌟",label:"Event item + Secret Key"}];function cx(){const a=B(y=>y.me),[i,s]=L.useState(null),[r,m]=L.useState("daily"),u=an(4e3),[f,_]=L.useState(null),h=()=>G().backend?.rpc("stt_quests").then(y=>s(y.quests)).catch(()=>{});L.useEffect(()=>{h()},[u]);const b=a.daily,x=(i||[]).filter(y=>y.period===r);return c.jsxs(nn,{title:"MISSIONS",icon:"🎯",children:[c.jsxs("div",{className:"card",style:{borderColor:b.can_claim?"#facc15":void 0},children:[c.jsxs("div",{className:"row between",children:[c.jsxs("b",{style:{fontSize:18},children:["📅 DAILY REWARD · streak ",b.streak]}),!b.can_claim&&c.jsxs("span",{className:"muted",children:["next in ",Ut(je(b.resets_at)-Date.now())]})]}),c.jsx("div",{className:"grid",style:{gridTemplateColumns:"repeat(7, 1fr)",gap:6,marginTop:10},children:ox.map(y=>{const v=y.d===b.next_day&&b.can_claim,w=b.can_claim?y.d<b.next_day:y.d<=(b.streak-1)%7+1&&b.streak>0;return c.jsxs("div",{className:"stat center",style:{padding:6,borderColor:v?"#facc15":void 0,background:w?"rgba(74,222,128,0.12)":void 0},children:[c.jsxs("div",{className:"k",children:["DAY ",y.d]}),c.jsx("div",{style:{fontSize:24},children:w?"✅":y.icon}),c.jsx("div",{style:{fontSize:10,fontWeight:800,lineHeight:1.1},children:y.label})]},y.d)})}),c.jsx("button",{className:"btn gold big block",style:{marginTop:10},disabled:!b.can_claim,"data-testid":"claim-daily",onClick:()=>X1().then(y=>_(y)).catch(()=>{}),children:b.can_claim?`CLAIM DAY ${b.next_day}`:"CLAIMED — COME BACK TOMORROW"}),f&&c.jsxs("div",{className:"row",style:{marginTop:8,fontWeight:800},children:[f.item_id&&c.jsx(Ft,{id:f.item_id,size:48}),c.jsxs("span",{children:["Day ",f.day,": ",f.cash?pe(f.cash):""," ",f.count?`${f.count}× ${f.drop} drop`:""," ",f.item_id?"a new item!":""," ",f.secret_keys?"+ 1 Secret Key 🗝️":""]})]}),c.jsx("div",{className:"dim",style:{fontSize:12,marginTop:6},children:"Miss a day and the streak restarts at Day 1."})]}),c.jsx(ba,{value:r,onChange:m,tabs:[{id:"daily",label:"Daily"},{id:"weekly",label:"Weekly"}]}),i?c.jsxs(c.Fragment,{children:[x[0]&&c.jsxs("div",{className:"muted",style:{fontWeight:700},children:["Resets in ",Ut(je(x[0].resets_at)-Date.now())]}),c.jsx("div",{className:"list",children:x.map(y=>{const v=y.progress>=y.target,w=y.reward;return c.jsxs("div",{className:"li",style:{flexWrap:"wrap"},children:[c.jsxs("div",{className:"grow",style:{minWidth:180},children:[c.jsxs("div",{className:"t1",children:[y.claimed?"✅ ":"",y.title]}),c.jsxs("div",{className:"t2",children:["Reward: ",w.cash?`${pe(w.cash)}+`:""," ",w.xp?`${w.xp} XP`:""," ",w.tokens?Object.entries(w.tokens).map(([A,z])=>`${z}× ${A} drop`).join(", "):""," ",w.secret_keys?"🗝️ Secret Key":""," ",w.cosmetic?"🎨 cosmetic":""]}),c.jsx("div",{className:"bar good",style:{marginTop:6},children:c.jsx("i",{style:{width:`${Math.min(100,y.progress/y.target*100)}%`}})}),c.jsx("div",{className:"dim",style:{fontSize:12,fontWeight:800},children:y.metric==="earn_cash"?`${pe(y.progress)} / ${pe(y.target)}`:`${y.progress} / ${y.target}`})]}),c.jsx("button",{className:"btn good",disabled:!v||y.claimed,onClick:()=>I1(y.id).then(h).catch(()=>{}),children:y.claimed?"DONE":v?"CLAIM":"IN PROGRESS"})]},y.id)})})]}):c.jsx("div",{className:"empty",children:"Loading…"})]})}function dx(){const a=B(r=>r.last?.event),i=B(r=>r.last?.next_event_at),s=B(r=>r.catalog?.event_types??_i);return an(1e3),c.jsxs(nn,{title:"EVENT STAGE",icon:"🎪",children:[a?c.jsxs("div",{className:"card",style:{borderColor:"#fb923c",background:"rgba(251,146,60,0.08)"},children:[c.jsx("div",{style:{fontSize:44},children:a.icon}),c.jsx("div",{className:"display",style:{fontSize:26,fontWeight:900},children:a.title}),c.jsx("div",{className:"muted",style:{fontWeight:700,margin:"6px 0"},children:a.description}),c.jsxs("div",{className:"row wrap",style:{fontWeight:800},children:[a.category&&c.jsxs("span",{className:"tag",children:["Category: ",a.category]}),a.price_mult!==1&&c.jsxs("span",{className:"tag",children:["Prices ×",a.price_mult]}),a.income_mult!==1&&c.jsxs("span",{className:"tag",children:["Income ×",a.income_mult]}),a.luck_mult!==1&&c.jsxs("span",{className:"tag",children:["Mythic+ luck ×",a.luck_mult]})]}),c.jsxs("div",{className:"display",style:{fontSize:22,marginTop:10},children:[Ut(je(a.ends_at)-Date.now())," left"]}),c.jsx("button",{className:"btn primary big block",style:{marginTop:10},onClick:()=>De("drops"),children:"🎁 OPEN EVENT DROPS"})]}):c.jsxs("div",{className:"card center",children:[c.jsx("div",{className:"muted display",style:{letterSpacing:"0.2em"},children:"NEXT EVENT IN"}),c.jsx("div",{className:"display",style:{fontSize:40,fontWeight:900},children:i?Ut(je(i)-Date.now()):"—"}),c.jsx("div",{className:"muted",style:{fontWeight:700},children:"Events rotate all day. Each one shakes up the market."})]}),c.jsx("h3",{children:"Possible events"}),c.jsx("div",{className:"list",children:s.map(r=>c.jsxs("div",{className:"li",children:[c.jsx("div",{style:{fontSize:28},children:r.icon}),c.jsxs("div",{className:"grow",children:[c.jsx("div",{className:"t1",children:r.title}),c.jsx("div",{className:"t2",children:r.description})]})]},r.id))})]})}function ux(){const a=B(u=>u.feed),[i,s]=L.useState("all"),r=B(u=>u.me),m=[...a].reverse().filter(u=>i==="me"?u.target_id===r.id:!0);return c.jsxs(nn,{title:"LIVE FEED",icon:"🔔",children:[c.jsx(ba,{value:i,onChange:s,tabs:[{id:"all",label:"Everything"},{id:"me",label:"For me"}]}),m.length===0?c.jsx("div",{className:"empty",children:"Quiet… for now."}):c.jsx("div",{className:"list",children:m.map(u=>{const f=og(u);if(!f)return null;const _=u.payload?.item_id;return c.jsxs("div",{className:"li",children:[_?c.jsx(Ft,{id:_,size:36}):c.jsx("span",{style:{fontSize:24},children:f.icon}),c.jsxs("div",{className:"grow",children:[c.jsxs("div",{className:"t1",style:{fontSize:15},children:[f.icon," ",f.text]}),c.jsx("div",{className:"t2",children:_a(u.created_at,Date.now()+G().serverOffset)})]}),u.kind==="item_stolen"&&u.target_id===r.id&&c.jsx("button",{className:"btn small hot",onClick:()=>De("visit",{playerId:u.payload.attacker_id,revenge:!0}),children:"REVENGE"})]},u.id)})})]})}function mx(){const a=B(_=>_.settings),i=B(_=>_.backend),s=B(_=>_.me),[r,m]=L.useState(""),[u,f]=L.useState("");return c.jsxs(nn,{title:"SETTINGS",icon:"⚙️",children:[c.jsxs("div",{className:"card col",children:[c.jsx("b",{children:"🔊 Sound"}),c.jsxs("div",{className:"row",children:[c.jsx("span",{className:"muted",style:{width:80},children:"Volume"}),c.jsx("input",{type:"range",min:0,max:1,step:.05,value:a.volume,onChange:_=>{const h=Number(_.target.value);Rl({volume:h}),Z_(h)},onPointerUp:()=>te("coin")})]}),c.jsxs("label",{className:"row",children:[c.jsx("input",{type:"checkbox",checked:a.muted,onChange:_=>{Rl({muted:_.target.checked}),K_(_.target.checked)}})," Mute everything"]}),c.jsxs("label",{className:"row",children:[c.jsx("input",{type:"checkbox",checked:a.music,onChange:_=>{Rl({music:_.target.checked}),W_(_.target.checked)}})," Ambient music"]})]}),c.jsxs("div",{className:"card col",children:[c.jsx("b",{children:"🎨 Graphics"}),c.jsx("div",{className:"row wrap",children:["high","low"].map(_=>c.jsx("button",{className:"btn small "+(a.quality===_?"primary":""),onClick:()=>{Rl({quality:_}),window.dispatchEvent(new Event("resize"))},children:_==="high"?"High (bloom, shadows)":"Battery saver"},_))}),c.jsxs("label",{className:"row",children:[c.jsx("input",{type:"checkbox",checked:a.reduceMotion,onChange:_=>Rl({reduceMotion:_.target.checked})})," Reduce motion & screen shake"]}),c.jsxs("label",{className:"row",children:[c.jsx("input",{type:"checkbox",checked:a.showNames,onChange:_=>Rl({showNames:_.target.checked})})," Show player names"]})]}),c.jsxs("div",{className:"card col",children:[c.jsx("b",{children:"🎮 Controls"}),c.jsxs("div",{className:"muted",style:{fontWeight:700,lineHeight:1.5},children:["Desktop: ",c.jsx("b",{children:"WASD / arrows"})," to run, ",c.jsx("b",{children:"Shift"})," to sprint, ",c.jsx("b",{children:"Space"})," to jump, ",c.jsx("b",{children:"drag"})," to look around, ",c.jsx("b",{children:"scroll"})," to zoom, ",c.jsx("b",{children:"E"})," for the big action button (buy · steal · tag · enter). ",c.jsx("b",{children:"Click"})," the ground to walk there, or an item for details.",c.jsx("br",{}),"Mobile: ",c.jsx("b",{children:"left side"})," is the joystick, drag the ",c.jsx("b",{children:"right side"})," to look around, pinch to zoom, ",c.jsx("b",{children:"⤒"})," jump, ",c.jsx("b",{children:"⚡"})," sprint, and the big button does the action.",c.jsx("br",{}),"Walk over the ",c.jsx("b",{children:"green plates"})," to collect cash. The ",c.jsx("b",{children:"red pad"})," at your door locks your base."]}),c.jsxs("div",{className:"row wrap",children:[c.jsx("button",{className:"btn small",onClick:()=>{yt?.travelHome(),De(null)},children:"🏠 Teleport home"}),c.jsx("button",{className:"btn small",onClick:()=>{de({tutorialOpen:!0}),De(null)},children:"🎓 Replay tutorial"})]})]}),c.jsxs("div",{className:"card col",children:[c.jsx("b",{children:"👤 Account"}),c.jsxs("div",{className:"muted",style:{fontWeight:700},children:["Mode: ",c.jsx("b",{children:i?.mode==="online"?"ONLINE (shared server)":"OFFLINE PRACTICE"}),i?.mode==="offline"&&" — your progress is saved on this device. Other players you see are NPCs simulated locally."]}),i?.mode==="online"&&i.isGuest()&&i.upgradeGuest&&c.jsxs("div",{className:"col",children:[c.jsx("div",{className:"muted",style:{fontWeight:700},children:"You're playing as a guest. Save your account to keep it on any device:"}),c.jsx("input",{className:"field",placeholder:"email",value:r,onChange:_=>m(_.target.value)}),c.jsx("input",{className:"field",type:"password",placeholder:"password (6+ chars)",value:u,onChange:_=>f(_.target.value)}),c.jsx("button",{className:"btn primary",onClick:()=>i.upgradeGuest(r,u).then(()=>Ee({kind:"good",icon:"✅",title:"Account saved — check your inbox to confirm."})).catch(_=>Ee({kind:"bad",icon:"⛔",title:_.message})),children:"SAVE ACCOUNT"})]}),i?.mode==="online"&&!i.isGuest()&&c.jsxs("div",{className:"muted",children:["Signed in as ",i.email()]}),c.jsxs("div",{className:"row wrap",children:[c.jsx("button",{className:"btn small",onClick:()=>Gi(),children:"🔄 Resync"}),c.jsx("button",{className:"btn small",onClick:()=>$1(),children:i?.mode==="online"?"Sign out":"Back to title"}),i?.mode==="offline"&&i.reset&&c.jsx("button",{className:"btn small hot",onClick:()=>wm({title:"Delete offline save?",body:`This permanently deletes ${s?.username}'s offline progress on this device.`,confirmLabel:"DELETE",danger:!0,hold:!0,onConfirm:async()=>{await i.reset(),location.reload()}}),children:"🗑️ Reset offline save"})]})]}),c.jsxs("div",{className:"card",children:[c.jsx("b",{children:"🛡️ Fair play & economy"}),c.jsx("div",{className:"muted",style:{fontWeight:700,lineHeight:1.45},children:"Everything uses fictional in-game cash. There is no real-money purchasing, trading, betting, deposits, withdrawals or crypto. Drops are funded only by cash you earn in the game, and every drop shows its odds. All money, items, trades, raids and market sales are decided and recorded by the server."})]}),c.jsx("div",{className:"dim center",style:{fontSize:12},children:"STEAL THE TECH · all brands, items and art are fictional and drawn in code."})]})}function fx(){const a=L.useRef(null),i=L.useRef(null);L.useEffect(()=>{const r=new w2(a.current,i.current);return C_(r),window.__stt_engine=r,window.__stt_state=()=>B.getState(),window.__stt_store=B,()=>{r.destroy(),C_(null)}},[]);const s=pt(r=>r.fade);return c.jsxs(c.Fragment,{children:[c.jsx("canvas",{ref:a,className:"world-canvas","data-testid":"world"}),c.jsx("div",{ref:i,className:"world-overlay"}),c.jsx("div",{className:"fade",style:{opacity:s}})]})}class H_ extends L.Component{constructor(){super(...arguments),this.state={err:null}}static getDerivedStateFromError(i){return{err:String(i?.message||i)}}componentDidCatch(i){console.error("["+this.props.name+"]",i)}render(){return this.state.err?c.jsx("div",{className:"panel-wrap",children:c.jsx("div",{className:"panel",children:c.jsxs("div",{className:"panel-body center",children:[c.jsx("div",{style:{fontSize:40},children:"🛠️"}),c.jsx("b",{children:"This screen hit a glitch."}),c.jsx("div",{className:"muted",children:this.state.err}),c.jsx("button",{className:"btn primary",onClick:()=>{this.setState({err:null}),De(null)},children:"CLOSE"})]})})}):this.props.children}}function px(){switch(B(i=>i.panel)){case"base":return c.jsx(Uw,{});case"drops":return c.jsx(Lw,{});case"collection":return c.jsx(Yw,{});case"market":return c.jsx(Bw,{});case"raid":return c.jsx(Pw,{});case"visit":return c.jsx(Ww,{});case"trade":return c.jsx(Jw,{});case"leaderboard":return c.jsx(ex,{});case"profile":return c.jsx(tx,{});case"quests":return c.jsx(cx,{});case"event":return c.jsx(dx,{});case"feed":return c.jsx(ux,{});case"settings":return c.jsx(mx,{});default:return null}}function hx(){const a=B(s=>s.settings.reduceMotion),i=B(s=>s.tutorialOpen);return L.useEffect(()=>{const s=r=>{const m=r.target;if(m&&(m.tagName==="INPUT"||m.tagName==="TEXTAREA"||m.tagName==="SELECT"))return;r.key==="Escape"&&(pt.getState().selected?pt.setState({selected:null}):De(null));const u={b:"base",o:"drops",c:"collection",m:"market",r:"raid",t:"trade",l:"leaderboard",p:"profile",q:"quests"};if(!r.ctrlKey&&!r.metaKey&&!r.altKey&&u[r.key.toLowerCase()]&&!["w","a","s","d","e"].includes(r.key.toLowerCase())){const f=B.getState().panel;De(f===u[r.key.toLowerCase()]?null:u[r.key.toLowerCase()])}};return window.addEventListener("keydown",s),()=>window.removeEventListener("keydown",s)},[]),c.jsxs("div",{className:"game"+(a?" reduce-motion":"")+(i?" tut-open":""),children:[c.jsx(fx,{}),c.jsx(_w,{}),c.jsx(bw,{}),c.jsx(xw,{}),c.jsx(jw,{}),c.jsx(kw,{}),c.jsx(Sw,{}),c.jsx(Tw,{}),c.jsx(Nw,{}),c.jsx(vw,{}),c.jsx(H_,{name:"panel",children:c.jsx(px,{})}),c.jsxs(H_,{name:"overlays",children:[c.jsx(zw,{}),c.jsx(Cw,{}),c.jsx(Aw,{}),c.jsx(Dw,{}),c.jsx(ww,{}),c.jsx(Mw,{}),c.jsx(Ow,{}),c.jsx($w,{}),c.jsx(Rw,{})]})]})}function _x(){switch(B(i=>i.phase)){case"title":return c.jsx(k2,{});case"loading":return c.jsx(S2,{});case"auth":return c.jsx(N2,{});case"join":return c.jsx(E2,{});case"error":return c.jsx(T2,{});case"playing":return c.jsx(hx,{})}}Kv.createRoot(document.getElementById("root")).render(c.jsx(_x,{}));

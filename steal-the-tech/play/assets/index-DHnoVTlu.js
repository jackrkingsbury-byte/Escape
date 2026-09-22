(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const d of document.querySelectorAll('link[rel="modulepreload"]'))c(d);new MutationObserver(d=>{for(const f of d)if(f.type==="childList")for(const p of f.addedNodes)p.tagName==="LINK"&&p.rel==="modulepreload"&&c(p)}).observe(document,{childList:!0,subtree:!0});function u(d){const f={};return d.integrity&&(f.integrity=d.integrity),d.referrerPolicy&&(f.referrerPolicy=d.referrerPolicy),d.crossOrigin==="use-credentials"?f.credentials="include":d.crossOrigin==="anonymous"?f.credentials="omit":f.credentials="same-origin",f}function c(d){if(d.ep)return;d.ep=!0;const f=u(d);fetch(d.href,f)}})();function $b(n){return n&&n.__esModule&&Object.prototype.hasOwnProperty.call(n,"default")?n.default:n}var Bc={exports:{}},ss={};var Yp;function Ub(){if(Yp)return ss;Yp=1;var n=Symbol.for("react.transitional.element"),s=Symbol.for("react.fragment");function u(c,d,f){var p=null;if(f!==void 0&&(p=""+f),d.key!==void 0&&(p=""+d.key),"key"in d){f={};for(var _ in d)_!=="key"&&(f[_]=d[_])}else f=d;return d=f.ref,{$$typeof:n,type:c,key:p,ref:d!==void 0?d:null,props:f}}return ss.Fragment=s,ss.jsx=u,ss.jsxs=u,ss}var Bp;function Lb(){return Bp||(Bp=1,Bc.exports=Ub()),Bc.exports}var o=Lb(),Gc={exports:{}},rs={},Xc={exports:{}},Vc={};var Gp;function Hb(){return Gp||(Gp=1,(function(n){function s(X,se){var oe=X.length;X.push(se);e:for(;0<oe;){var Ge=oe-1>>>1,$e=X[Ge];if(0<d($e,se))X[Ge]=se,X[oe]=$e,oe=Ge;else break e}}function u(X){return X.length===0?null:X[0]}function c(X){if(X.length===0)return null;var se=X[0],oe=X.pop();if(oe!==se){X[0]=oe;e:for(var Ge=0,$e=X.length,zt=$e>>>1;Ge<zt;){var ot=2*(Ge+1)-1,ct=X[ot],S=ot+1,$=X[S];if(0>d(ct,oe))S<$e&&0>d($,ct)?(X[Ge]=$,X[S]=oe,Ge=S):(X[Ge]=ct,X[ot]=oe,Ge=ot);else if(S<$e&&0>d($,oe))X[Ge]=$,X[S]=oe,Ge=S;else break e}}return se}function d(X,se){var oe=X.sortIndex-se.sortIndex;return oe!==0?oe:X.id-se.id}if(n.unstable_now=void 0,typeof performance=="object"&&typeof performance.now=="function"){var f=performance;n.unstable_now=function(){return f.now()}}else{var p=Date,_=p.now();n.unstable_now=function(){return p.now()-_}}var g=[],w=[],v=1,b=null,y=3,N=!1,R=!1,G=!1,L=!1,Y=typeof setTimeout=="function"?setTimeout:null,B=typeof clearTimeout=="function"?clearTimeout:null,we=typeof setImmediate<"u"?setImmediate:null;function je(X){for(var se=u(w);se!==null;){if(se.callback===null)c(w);else if(se.startTime<=X)c(w),se.sortIndex=se.expirationTime,s(g,se);else break;se=u(w)}}function H(X){if(G=!1,je(X),!R)if(u(g)!==null)R=!0,ce||(ce=!0,J());else{var se=u(w);se!==null&&te(H,se.startTime-X)}}var ce=!1,Q=-1,ue=5,et=-1;function D(){return L?!0:!(n.unstable_now()-et<ue)}function P(){if(L=!1,ce){var X=n.unstable_now();et=X;var se=!0;try{e:{R=!1,G&&(G=!1,B(Q),Q=-1),N=!0;var oe=y;try{t:{for(je(X),b=u(g);b!==null&&!(b.expirationTime>X&&D());){var Ge=b.callback;if(typeof Ge=="function"){b.callback=null,y=b.priorityLevel;var $e=Ge(b.expirationTime<=X);if(X=n.unstable_now(),typeof $e=="function"){b.callback=$e,je(X),se=!0;break t}b===u(g)&&c(g),je(X)}else c(g);b=u(g)}if(b!==null)se=!0;else{var zt=u(w);zt!==null&&te(H,zt.startTime-X),se=!1}}break e}finally{b=null,y=oe,N=!1}se=void 0}}finally{se?J():ce=!1}}}var J;if(typeof we=="function")J=function(){we(P)};else if(typeof MessageChannel<"u"){var Z=new MessageChannel,Se=Z.port2;Z.port1.onmessage=P,J=function(){Se.postMessage(null)}}else J=function(){Y(P,0)};function te(X,se){Q=Y(function(){X(n.unstable_now())},se)}n.unstable_IdlePriority=5,n.unstable_ImmediatePriority=1,n.unstable_LowPriority=4,n.unstable_NormalPriority=3,n.unstable_Profiling=null,n.unstable_UserBlockingPriority=2,n.unstable_cancelCallback=function(X){X.callback=null},n.unstable_forceFrameRate=function(X){0>X||125<X?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):ue=0<X?Math.floor(1e3/X):5},n.unstable_getCurrentPriorityLevel=function(){return y},n.unstable_next=function(X){switch(y){case 1:case 2:case 3:var se=3;break;default:se=y}var oe=y;y=se;try{return X()}finally{y=oe}},n.unstable_requestPaint=function(){L=!0},n.unstable_runWithPriority=function(X,se){switch(X){case 1:case 2:case 3:case 4:case 5:break;default:X=3}var oe=y;y=X;try{return se()}finally{y=oe}},n.unstable_scheduleCallback=function(X,se,oe){var Ge=n.unstable_now();switch(typeof oe=="object"&&oe!==null?(oe=oe.delay,oe=typeof oe=="number"&&0<oe?Ge+oe:Ge):oe=Ge,X){case 1:var $e=-1;break;case 2:$e=250;break;case 5:$e=1073741823;break;case 4:$e=1e4;break;default:$e=5e3}return $e=oe+$e,X={id:v++,callback:se,priorityLevel:X,startTime:oe,expirationTime:$e,sortIndex:-1},oe>Ge?(X.sortIndex=oe,s(w,X),u(g)===null&&X===u(w)&&(G?(B(Q),Q=-1):G=!0,te(H,oe-Ge))):(X.sortIndex=$e,s(g,X),R||N||(R=!0,ce||(ce=!0,J()))),X},n.unstable_shouldYield=D,n.unstable_wrapCallback=function(X){var se=y;return function(){var oe=y;y=se;try{return X.apply(this,arguments)}finally{y=oe}}}})(Vc)),Vc}var Xp;function Yb(){return Xp||(Xp=1,Xc.exports=Hb()),Xc.exports}var Ic={exports:{}},fe={};var Vp;function Bb(){if(Vp)return fe;Vp=1;var n=Symbol.for("react.transitional.element"),s=Symbol.for("react.portal"),u=Symbol.for("react.fragment"),c=Symbol.for("react.strict_mode"),d=Symbol.for("react.profiler"),f=Symbol.for("react.consumer"),p=Symbol.for("react.context"),_=Symbol.for("react.forward_ref"),g=Symbol.for("react.suspense"),w=Symbol.for("react.memo"),v=Symbol.for("react.lazy"),b=Symbol.for("react.activity"),y=Symbol.for("react.view_transition"),N=Symbol.iterator;function R(S){return S===null||typeof S!="object"?null:(S=N&&S[N]||S["@@iterator"],typeof S=="function"?S:null)}var G={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},L=Object.assign,Y={};function B(S,$,ne){this.props=S,this.context=$,this.refs=Y,this.updater=ne||G}B.prototype.isReactComponent={},B.prototype.setState=function(S,$){if(typeof S!="object"&&typeof S!="function"&&S!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,S,$,"setState")},B.prototype.forceUpdate=function(S){this.updater.enqueueForceUpdate(this,S,"forceUpdate")};function we(){}we.prototype=B.prototype;function je(S,$,ne){this.props=S,this.context=$,this.refs=Y,this.updater=ne||G}var H=je.prototype=new we;H.constructor=je,L(H,B.prototype),H.isPureReactComponent=!0;var ce=Array.isArray;function Q(){}var ue={H:null,A:null,T:null,S:null},et=Object.prototype.hasOwnProperty;function D(S,$,ne){var ae=ne.ref;return{$$typeof:n,type:S,key:$,ref:ae!==void 0?ae:null,props:ne}}function P(S,$){return D(S.type,$,S.props)}function J(S){return typeof S=="object"&&S!==null&&S.$$typeof===n}function Z(S){var $={"=":"=0",":":"=2"};return"$"+S.replace(/[=:]/g,function(ne){return $[ne]})}var Se=/\/+/g;function te(S,$){return typeof S=="object"&&S!==null&&S.key!=null?Z(""+S.key):$.toString(36)}function X(S){switch(S.status){case"fulfilled":return S.value;case"rejected":throw S.reason;default:switch(typeof S.status=="string"?S.then(Q,Q):(S.status="pending",S.then(function($){S.status==="pending"&&(S.status="fulfilled",S.value=$)},function($){S.status==="pending"&&(S.status="rejected",S.reason=$)})),S.status){case"fulfilled":return S.value;case"rejected":throw S.reason}}throw S}function se(S,$,ne,ae,ke){var xe=typeof S;(xe==="undefined"||xe==="boolean")&&(S=null);var Le=!1;if(S===null)Le=!0;else switch(xe){case"bigint":case"string":case"number":Le=!0;break;case"object":switch(S.$$typeof){case n:case s:Le=!0;break;case v:return Le=S._init,se(Le(S._payload),$,ne,ae,ke)}}if(Le)return ke=ke(S),Le=ae===""?"."+te(S,0):ae,ce(ke)?(ne="",Le!=null&&(ne=Le.replace(Se,"$&/")+"/"),se(ke,$,ne,"",function(Vn){return Vn})):ke!=null&&(J(ke)&&(ke=P(ke,ne+(ke.key==null||S&&S.key===ke.key?"":(""+ke.key).replace(Se,"$&/")+"/")+Le)),$.push(ke)),1;Le=0;var ee=ae===""?".":ae+":";if(ce(S))for(var de=0;de<S.length;de++)ae=S[de],xe=ee+te(ae,de),Le+=se(ae,$,ne,xe,ke);else if(de=R(S),typeof de=="function")for(S=de.call(S),de=0;!(ae=S.next()).done;)ae=ae.value,xe=ee+te(ae,de++),Le+=se(ae,$,ne,xe,ke);else if(xe==="object"){if(typeof S.then=="function")return se(X(S),$,ne,ae,ke);throw $=String(S),Error("Objects are not valid as a React child (found: "+($==="[object Object]"?"object with keys {"+Object.keys(S).join(", ")+"}":$)+"). If you meant to render a collection of children, use an array instead.")}return Le}function oe(S,$,ne){if(S==null)return S;var ae=[],ke=0;return se(S,ae,"","",function(xe){return $.call(ne,xe,ke++)}),ae}function Ge(S){if(S._status===-1){var $=S._result,ne=$();ne.then(function(ae){(S._status===0||S._status===-1)&&(S._status=1,S._result=ae,ne.status===void 0&&(ne.status="fulfilled",ne.value=ae))},function(ae){(S._status===0||S._status===-1)&&(S._status=2,S._result=ae,ne.status===void 0&&(ne.status="rejected",ne.reason=ae))}),S._status===-1&&(S._status=0,S._result=ne)}if(S._status===1)return S._result.default;throw S._result}var $e=typeof reportError=="function"?reportError:function(S){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var $=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof S=="object"&&S!==null&&typeof S.message=="string"?String(S.message):String(S),error:S});if(!window.dispatchEvent($))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",S);return}console.error(S)};function zt(S){var $=ue.T,ne={};ne.types=$!==null?$.types:null,ue.T=ne;try{var ae=S(),ke=ue.S;ke!==null&&ke(ne,ae),typeof ae=="object"&&ae!==null&&typeof ae.then=="function"&&ae.then(Q,$e)}catch(xe){$e(xe)}finally{$!==null&&ne.types!==null&&($.types=ne.types),ue.T=$}}function ot(S){var $=ue.T;if($!==null){var ne=$.types;ne===null?$.types=[S]:ne.indexOf(S)===-1&&ne.push(S)}else zt(ot.bind(null,S))}var ct={map:oe,forEach:function(S,$,ne){oe(S,function(){$.apply(this,arguments)},ne)},count:function(S){var $=0;return oe(S,function(){$++}),$},toArray:function(S){return oe(S,function($){return $})||[]},only:function(S){if(!J(S))throw Error("React.Children.only expected to receive a single React element child.");return S}};return fe.Activity=b,fe.Children=ct,fe.Component=B,fe.Fragment=u,fe.Profiler=d,fe.PureComponent=je,fe.StrictMode=c,fe.Suspense=g,fe.ViewTransition=y,fe.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=ue,fe.__COMPILER_RUNTIME={__proto__:null,c:function(S){return ue.H.useMemoCache(S)}},fe.addTransitionType=ot,fe.cache=function(S){return function(){return S.apply(null,arguments)}},fe.cacheSignal=function(){return null},fe.cloneElement=function(S,$,ne){if(S==null)throw Error("The argument must be a React element, but you passed "+S+".");var ae=L({},S.props),ke=S.key;if($!=null)for(xe in $.key!==void 0&&(ke=""+$.key),$)!et.call($,xe)||xe==="key"||xe==="__self"||xe==="__source"||xe==="ref"&&$.ref===void 0||(ae[xe]=$[xe]);var xe=arguments.length-2;if(xe===1)ae.children=ne;else if(1<xe){for(var Le=Array(xe),ee=0;ee<xe;ee++)Le[ee]=arguments[ee+2];ae.children=Le}return D(S.type,ke,ae)},fe.createContext=function(S){return S={$$typeof:p,_currentValue:S,_currentValue2:S,_threadCount:0,Provider:null,Consumer:null},S.Provider=S,S.Consumer={$$typeof:f,_context:S},S},fe.createElement=function(S,$,ne){var ae,ke={},xe=null;if($!=null)for(ae in $.key!==void 0&&(xe=""+$.key),$)et.call($,ae)&&ae!=="key"&&ae!=="__self"&&ae!=="__source"&&(ke[ae]=$[ae]);var Le=arguments.length-2;if(Le===1)ke.children=ne;else if(1<Le){for(var ee=Array(Le),de=0;de<Le;de++)ee[de]=arguments[de+2];ke.children=ee}if(S&&S.defaultProps)for(ae in Le=S.defaultProps,Le)ke[ae]===void 0&&(ke[ae]=Le[ae]);return D(S,xe,ke)},fe.createRef=function(){return{current:null}},fe.forwardRef=function(S){return{$$typeof:_,render:S}},fe.isValidElement=J,fe.lazy=function(S){return{$$typeof:v,_payload:{_status:-1,_result:S},_init:Ge}},fe.memo=function(S,$){return{$$typeof:w,type:S,compare:$===void 0?null:$}},fe.startTransition=zt,fe.unstable_useCacheRefresh=function(){return ue.H.useCacheRefresh()},fe.use=function(S){return ue.H.use(S)},fe.useActionState=function(S,$,ne){return ue.H.useActionState(S,$,ne)},fe.useCallback=function(S,$){return ue.H.useCallback(S,$)},fe.useContext=function(S){return ue.H.useContext(S)},fe.useDebugValue=function(){},fe.useDeferredValue=function(S,$){return ue.H.useDeferredValue(S,$)},fe.useEffect=function(S,$){return ue.H.useEffect(S,$)},fe.useEffectEvent=function(S){return ue.H.useEffectEvent(S)},fe.useId=function(){return ue.H.useId()},fe.useImperativeHandle=function(S,$,ne){return ue.H.useImperativeHandle(S,$,ne)},fe.useInsertionEffect=function(S,$){return ue.H.useInsertionEffect(S,$)},fe.useLayoutEffect=function(S,$){return ue.H.useLayoutEffect(S,$)},fe.useMemo=function(S,$){return ue.H.useMemo(S,$)},fe.useOptimistic=function(S,$){return ue.H.useOptimistic(S,$)},fe.useReducer=function(S,$,ne){return ue.H.useReducer(S,$,ne)},fe.useRef=function(S){return ue.H.useRef(S)},fe.useState=function(S){return ue.H.useState(S)},fe.useSyncExternalStore=function(S,$,ne){return ue.H.useSyncExternalStore(S,$,ne)},fe.useTransition=function(){return ue.H.useTransition()},fe.version="19.3.0",fe}var Ip;function ud(){return Ip||(Ip=1,Ic.exports=Bb()),Ic.exports}var Qc={exports:{}},Ct={};var Qp;function Gb(){if(Qp)return Ct;Qp=1;var n=ud();function s(v){var b="https://react.dev/errors/"+v;if(1<arguments.length){b+="?args[]="+encodeURIComponent(arguments[1]);for(var y=2;y<arguments.length;y++)b+="&args[]="+encodeURIComponent(arguments[y])}return"Minified React error #"+v+"; visit "+b+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function u(){}var c={d:{f:u,r:function(){throw Error(s(522))},D:u,C:u,L:u,m:u,X:u,S:u,M:u},p:0,findDOMNode:null},d=Symbol.for("react.portal"),f=Symbol.for("react.recoverable"),p=Symbol.for("react.optimistic_key");function _(v,b,y){var N=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:d,key:N==null?null:N===p?p:""+N,children:v,containerInfo:b,implementation:y}}var g=n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function w(v,b){if(v==="font")return"";if(typeof b=="string")return b==="use-credentials"?b:""}return Ct.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=c,Ct.browser=function(v){return{$$typeof:f,_reason:v}},Ct.createPortal=function(v,b){var y=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!b||b.nodeType!==1&&b.nodeType!==9&&b.nodeType!==11)throw Error(s(299));return _(v,b,null,y)},Ct.flushSync=function(v){var b=g.T,y=c.p;try{if(g.T=null,c.p=2,v)return v()}finally{g.T=b,c.p=y,c.d.f()}},Ct.preconnect=function(v,b){typeof v=="string"&&(b?(b=b.crossOrigin,b=typeof b=="string"?b==="use-credentials"?b:"":void 0):b=null,c.d.C(v,b))},Ct.prefetchDNS=function(v){typeof v=="string"&&c.d.D(v)},Ct.preinit=function(v,b){if(typeof v=="string"&&b&&typeof b.as=="string"){var y=b.as,N=w(y,b.crossOrigin),R=typeof b.integrity=="string"?b.integrity:void 0,G=typeof b.fetchPriority=="string"?b.fetchPriority:void 0;y==="style"?c.d.S(v,typeof b.precedence=="string"?b.precedence:void 0,{crossOrigin:N,integrity:R,fetchPriority:G}):y==="script"&&c.d.X(v,{crossOrigin:N,integrity:R,fetchPriority:G,nonce:typeof b.nonce=="string"?b.nonce:void 0})}},Ct.preinitModule=function(v,b){if(typeof v=="string")if(typeof b=="object"&&b!==null){if(b.as==null||b.as==="script"){var y=w(b.as,b.crossOrigin);c.d.M(v,{crossOrigin:y,integrity:typeof b.integrity=="string"?b.integrity:void 0,nonce:typeof b.nonce=="string"?b.nonce:void 0,fetchPriority:typeof b.fetchPriority=="string"?b.fetchPriority:void 0})}}else b==null&&c.d.M(v)},Ct.preload=function(v,b){if(typeof v=="string"&&typeof b=="object"&&b!==null&&typeof b.as=="string"){var y=b.as,N=w(y,b.crossOrigin);c.d.L(v,y,{crossOrigin:N,integrity:typeof b.integrity=="string"?b.integrity:void 0,nonce:typeof b.nonce=="string"?b.nonce:void 0,type:typeof b.type=="string"?b.type:void 0,fetchPriority:typeof b.fetchPriority=="string"?b.fetchPriority:void 0,referrerPolicy:typeof b.referrerPolicy=="string"?b.referrerPolicy:void 0,imageSrcSet:typeof b.imageSrcSet=="string"?b.imageSrcSet:void 0,imageSizes:typeof b.imageSizes=="string"?b.imageSizes:void 0,media:typeof b.media=="string"?b.media:void 0})}},Ct.preloadModule=function(v,b){if(typeof v=="string")if(b){var y=w(b.as,b.crossOrigin);c.d.m(v,{as:typeof b.as=="string"&&b.as!=="script"?b.as:void 0,crossOrigin:y,integrity:typeof b.integrity=="string"?b.integrity:void 0,nonce:typeof b.nonce=="string"?b.nonce:void 0,fetchPriority:typeof b.fetchPriority=="string"?b.fetchPriority:void 0})}else c.d.m(v)},Ct.requestFormReset=function(v){c.d.r(v)},Ct.unstable_batchedUpdates=function(v,b){return v(b)},Ct.useFormState=function(v,b,y){return g.H.useFormState(v,b,y)},Ct.useFormStatus=function(){return g.H.useHostTransitionStatus()},Ct.version="19.3.0",Ct}var Zp;function Xb(){if(Zp)return Qc.exports;Zp=1;function n(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n)}catch(s){console.error(s)}}return n(),Qc.exports=Gb(),Qc.exports}var Pp;function Vb(){if(Pp)return rs;Pp=1;var n=Yb(),s=ud(),u=Xb();function c(e){var t="https://react.dev/errors/"+e;if(1<arguments.length){t+="?args[]="+encodeURIComponent(arguments[1]);for(var a=2;a<arguments.length;a++)t+="&args[]="+encodeURIComponent(arguments[a])}return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function d(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function f(e){for(var t=e,a=t;a&&!a.alternate;)t=a,(t.flags&4098)!==0&&(e=t.return),a=t.return;for(;t.return;)t=t.return;return t.tag===3?e:null}function p(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function _(e){if(e.tag===31){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function g(e){if(f(e)!==e)throw Error(c(188))}function w(e){var t=e.alternate;if(!t){if(t=f(e),t===null)throw Error(c(188));return t!==e?null:e}for(var a=e,l=t;;){var i=a.return;if(i===null)break;var r=i.alternate;if(r===null){if(l=i.return,l!==null){a=l;continue}break}if(i.child===r.child){for(r=i.child;r;){if(r===a)return g(i),e;if(r===l)return g(i),t;r=r.sibling}throw Error(c(188))}if(a.return!==l.return)a=i,l=r;else{for(var m=!1,h=i.child;h;){if(h===a){m=!0,a=i,l=r;break}if(h===l){m=!0,l=i,a=r;break}h=h.sibling}if(!m){for(h=r.child;h;){if(h===a){m=!0,a=r,l=i;break}if(h===l){m=!0,l=r,a=i;break}h=h.sibling}if(!m)throw Error(c(189))}}if(a.alternate!==l)throw Error(c(190))}if(a.tag!==3)throw Error(c(188));return a.stateNode.current===a?e:t}function v(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e;for(e=e.child;e!==null;){if(t=v(e),t!==null)return t;e=e.sibling}return null}function b(e,t,a,l,i,r){for(;e!==null;){if((e.tag===5||e.tag===27||e.tag===6)&&a(e,l,i,r)||(e.tag!==22||e.memoizedState===null)&&(t||e.tag!==5&&e.tag!==27)&&b(e.child,t,a,l,i,r))return!0;e=e.sibling}return!1}function y(e){for(e=e.return;e!==null;){if(e.tag===3||e.tag===5||e.tag===27)return e;e=e.return}return null}function N(e){var t=!1;for(e=e.return;e!==null&&(e.tag===4&&(t=!0),!(e.tag===3||e.tag===5||e.tag===27));)e=e.return;return t}function R(e){var t=[null,null],a=y(e);return a===null||G(t,e,a.child,{foundSelf:!1}),t}function G(e,t,a,l){for(;a!==null;){if(a===t)l.foundSelf=!0;else if(a.tag===5||a.tag===27||a.tag===6){if(l.foundSelf)return e[1]=a,!0;e[0]=a}else if((a.tag!==22||a.memoizedState===null)&&G(e,t,a.child,l))return!0;a=a.sibling}return!1}function L(e){switch(e.tag){case 5:case 27:case 6:return e.stateNode;case 3:return e.stateNode.containerInfo;default:throw Error(c(559))}}var Y=null,B=null;function we(e,t,a){return e===a?!0:e===t?(Y=e,!0):!1}function je(e,t,a){return e===a?(B=e,!1):e===t?(B!==null&&(Y=e),!0):!1}function H(e){if(e===null)return null;do e=e===null?null:e.return;while(e&&e.tag!==5&&e.tag!==27&&e.tag!==3);return e||null}function ce(e,t,a){for(var l=0,i=e;i;i=a(i))l++;i=0;for(var r=t;r;r=a(r))i++;for(;0<l-i;)e=a(e),l--;for(;0<i-l;)t=a(t),i--;for(;l--;){if(e===t||t!==null&&e===t.alternate)return e;e=a(e),t=a(t)}return null}var Q=Object.assign,ue=Symbol.for("react.element"),et=Symbol.for("react.transitional.element"),D=Symbol.for("react.portal"),P=Symbol.for("react.fragment"),J=Symbol.for("react.strict_mode"),Z=Symbol.for("react.profiler"),Se=Symbol.for("react.consumer"),te=Symbol.for("react.context"),X=Symbol.for("react.forward_ref"),se=Symbol.for("react.suspense"),oe=Symbol.for("react.suspense_list"),Ge=Symbol.for("react.memo"),$e=Symbol.for("react.lazy"),zt=Symbol.for("react.activity"),ot=Symbol.for("react.legacy_hidden"),ct=Symbol.for("react.memo_cache_sentinel"),S=Symbol.for("react.view_transition"),$=Symbol.for("react.recoverable"),ne=Symbol.iterator;function ae(e){return e===null||typeof e!="object"?null:(e=ne&&e[ne]||e["@@iterator"],typeof e=="function"?e:null)}var ke=Symbol.for("react.client.reference");function xe(e){if(e==null)return null;if(typeof e=="function")return e.$$typeof===ke?null:e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case P:return"Fragment";case Z:return"Profiler";case J:return"StrictMode";case se:return"Suspense";case oe:return"SuspenseList";case zt:return"Activity";case S:return"ViewTransition"}if(typeof e=="object")switch(e.$$typeof){case D:return"Portal";case te:return e.displayName||"Context";case Se:return(e._context.displayName||"Context")+".Consumer";case X:var t=e.render;return e=e.displayName,e||(e=t.displayName||t.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case Ge:return t=e.displayName||null,t!==null?t:xe(e.type)||"Memo";case $e:t=e._payload,e=e._init;try{return xe(e(t))}catch{}}return null}var Le=Array.isArray,ee=s.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,de=u.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,Vn={pending:!1,data:null,method:null,action:null},so=[],pl=-1;function kn(e){return{current:e}}function jt(e){0>pl||(e.current=so[pl],so[pl]=null,pl--)}function Pe(e,t){pl++,so[pl]=e.current,e.current=t}var En=kn(null),fi=kn(null),ua=kn(null),ds=kn(null);function fs(e,t){switch(Pe(ua,t),Pe(fi,e),Pe(En,null),t.nodeType){case 9:case 11:e=(e=t.documentElement)&&(e=e.namespaceURI)?K0(e):0;break;default:if(e=t.tagName,t=t.namespaceURI)t=K0(t),e=J0(t,e);else switch(e){case"svg":e=1;break;case"math":e=2;break;default:e=0}}jt(En),Pe(En,e)}function hl(){jt(En),jt(fi),jt(ua)}function ro(e){var t=e.memoizedState;t!==null&&(ni._currentValue=t.memoizedState,Pe(ds,e)),t=En.current;var a=J0(t,e.type);t!==a&&(Pe(fi,e),Pe(En,a))}function ms(e){fi.current===e&&(jt(En),jt(fi)),ds.current===e&&(jt(ds),ni._currentValue=Vn)}var oo,_d;function ca(e){if(oo===void 0)try{throw Error()}catch(a){var t=a.stack.trim().match(/\n( *(at )?)/);oo=t&&t[1]||"",_d=-1<a.stack.indexOf(`
    at`)?" (<anonymous>)":-1<a.stack.indexOf("@")?"@unknown:0:0":""}return`
`+oo+e+_d}var uo=!1;function co(e,t){if(!e||uo)return"";uo=!0;var a=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var l={DetermineComponentFrameRoot:function(){try{if(t){var z=function(){throw Error()};if(Object.defineProperty(z.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(z,[])}catch(I){var T=I}Reflect.construct(e,[],z)}else{try{z.call()}catch(I){T=I}z=!1;try{var C=Object.getOwnPropertyDescriptor(e.prototype,"props");Object.defineProperty(e.prototype,"props",{configurable:!0,set:function(){throw Error()}}),z=!0,new e}finally{z&&(C!==void 0?Object.defineProperty(e.prototype,"props",C):delete e.prototype.props)}}}else{try{throw Error()}catch(I){T=I}(z=e())&&typeof z.catch=="function"&&z.catch(function(){})}}catch(I){if(I&&T&&typeof I.stack=="string")return[I.stack,T.stack]}return[null,null]}};l.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var i=Object.getOwnPropertyDescriptor(l.DetermineComponentFrameRoot,"name");i&&i.configurable&&Object.defineProperty(l.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var r=l.DetermineComponentFrameRoot(),m=r[0],h=r[1];if(m&&h){var x=m.split(`
`),E=h.split(`
`);for(i=l=0;l<x.length&&!x[l].includes("DetermineComponentFrameRoot");)l++;for(;i<E.length&&!E[i].includes("DetermineComponentFrameRoot");)i++;if(l===x.length||i===E.length)for(l=x.length-1,i=E.length-1;1<=l&&0<=i&&x[l]!==E[i];)i--;for(;1<=l&&0<=i;l--,i--)if(x[l]!==E[i]){if(l!==1||i!==1)do if(l--,i--,0>i||x[l]!==E[i]){var O=`
`+x[l].replace(" at new "," at ");return e.displayName&&O.includes("<anonymous>")&&(O=O.replace("<anonymous>",e.displayName)),O}while(1<=l&&0<=i);break}}}finally{uo=!1,Error.prepareStackTrace=a}return(a=e?e.displayName||e.name:"")?ca(a):""}function Yh(e,t){switch(e.tag){case 26:case 27:case 5:return ca(e.type);case 16:return ca("Lazy");case 13:return e.child!==t&&t!==null?ca("Suspense Fallback"):ca("Suspense");case 19:return ca("SuspenseList");case 0:case 15:return co(e.type,!1);case 11:return co(e.type.render,!1);case 1:return co(e.type,!0);case 31:return ca("Activity");case 30:return ca("ViewTransition");default:return""}}function gd(e){try{var t="",a=null;do t+=Yh(e,a),a=e,e=e.return;while(e);return t}catch(l){return`
Error generating stack: `+l.message+`
`+l.stack}}var fo=Object.prototype.hasOwnProperty,mo=n.unstable_scheduleCallback,po=n.unstable_cancelCallback,Bh=n.unstable_shouldYield,Gh=n.unstable_requestPaint,Qt=n.unstable_now,Xh=n.unstable_getCurrentPriorityLevel,bd=n.unstable_ImmediatePriority,yd=n.unstable_UserBlockingPriority,ps=n.unstable_NormalPriority,Vh=n.unstable_LowPriority,vd=n.unstable_IdlePriority,Ih=n.log,Qh=n.unstable_setDisableYieldValue,mi=null,Zt=null;function da(e){if(typeof Ih=="function"&&Qh(e),Zt&&typeof Zt.setStrictMode=="function")try{Zt.setStrictMode(mi,e)}catch{}}var Pt=Math.clz32?Math.clz32:Kh,Zh=Math.log,Ph=Math.LN2;function Kh(e){return e>>>=0,e===0?32:31-(Zh(e)/Ph|0)|0}var hs=256,_s=262144,gs=4194304;function Ya(e){var t=e&42;if(t!==0)return t;switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:return e&-e;case 262144:case 524288:case 1048576:case 2097152:return e&3932160;case 4194304:case 8388608:case 16777216:case 33554432:return e&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return e}}function bs(e,t,a){var l=e.pendingLanes;if(l===0)return 0;var i=0,r=e.suspendedLanes,m=e.pingedLanes;e=e.warmLanes;var h=l&134217727;return h!==0?(l=h&~r,l!==0?i=Ya(l):(m&=h,m!==0?i=Ya(m):a||(a=h&~e,a!==0&&(i=Ya(a))))):(h=l&~r,h!==0?i=Ya(h):m!==0?i=Ya(m):a||(a=l&~e,a!==0&&(i=Ya(a)))),i===0?0:t!==0&&t!==i&&(t&r)===0&&(r=i&-i,a=t&-t,r>=a||r===32&&(a&4194048)!==0)?t:i}function pi(e,t){return(e.pendingLanes&~(e.suspendedLanes&~e.pingedLanes)&t)===0}function xd(e,t){(t&8)!==0&&(t|=t&32);var a=e.entangledLanes;if(a!==0)for(e=e.entanglements,a&=t;0<a;){var l=31-Pt(a),i=1<<l;t|=e[l],a&=~i}return t}function Jh(e,t){switch(e){case 1:case 2:case 4:case 8:case 64:return t+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function wd(){var e=gs;return gs<<=1,(gs&62914560)===0&&(gs=4194304),e}function ho(e){for(var t=[],a=0;31>a;a++)t.push(e);return t}function hi(e,t){e.pendingLanes|=t,t!==268435456&&(e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0)}function Wh(e,t,a,l,i,r){var m=e.pendingLanes;e.pendingLanes=a,e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0,e.expiredLanes&=a,e.entangledLanes&=a,e.errorRecoveryDisabledLanes&=a,e.shellSuspendCounter=0;var h=e.entanglements,x=e.expirationTimes,E=e.hiddenUpdates;for(a=m&~a;0<a;){var O=31-Pt(a),z=1<<O;h[O]=0,x[O]=-1;var T=E[O];if(T!==null)for(E[O]=null,O=0;O<T.length;O++){var C=T[O];C!==null&&(C.lane&=-536870913)}a&=~z}l!==0&&jd(e,l,0),r!==0&&i===0&&e.tag!==0&&(e.suspendedLanes|=r&~(m&~t))}function jd(e,t,a){e.pendingLanes|=t,e.suspendedLanes&=~t;var l=31-Pt(t);e.entangledLanes|=t,e.entanglements[l]=e.entanglements[l]|1073741824|a&261930}function Sd(e,t){var a=e.entangledLanes|=t;for(e=e.entanglements;a;){var l=31-Pt(a),i=1<<l;i&t|e[l]&t&&(e[l]|=t),a&=~i}}function Td(e,t){var a=t&-t;return a=(a&42)!==0?1:_o(a),(a&(e.suspendedLanes|t))!==0?0:a}function _o(e){switch(e){case 2:e=1;break;case 8:e=4;break;case 32:e=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:e=128;break;case 268435456:e=134217728;break;default:e=0}return e}function go(e){return e&=-e,2<e?8<e?(e&134217727)!==0?32:268435456:8:2}function Nd(){var e=de.p;return e!==0?e:(e=window.event,e===void 0?32:zp(e.type))}function kd(e,t){var a=de.p;try{return de.p=e,t()}finally{de.p=a}}var In=Math.random().toString(36).slice(2),St="__reactFiber$"+In,Yt="__reactProps$"+In,_l="__reactContainer$"+In,Ed="__reactEvents$"+In,Fh="__reactListeners$"+In,e_="__reactHandles$"+In,Ad="__reactResources$"+In,_i="__reactMarker$"+In,ys="__reactLoad$"+In;function vs(e){delete e[St],delete e[Yt],delete e[Fh],delete e[e_]}function Ba(e){var t;if(t=e[St])return t;for(var a=e.parentNode;a;){if(t=a[_l]||a[St]){if(a=t.alternate,t.child!==null||a!==null&&a.child!==null)for(e=pp(e);e!==null;){if(a=e[St])return a;e=pp(e)}return t}e=a,a=e.parentNode}return null}function gl(e){if(e=e[St]||e[_l]){var t=e.tag;if(t===5||t===6||t===13||t===31||t===26||t===27||t===3)return e}return null}function gi(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e.stateNode;throw Error(c(33))}function bl(e){var t=e[Ad];return t||(t=e[Ad]={hoistableStyles:new Map,hoistableScripts:new Map}),t}function gt(e){e[_i]=!0}function Cd(e){e[ys]=void 0}var Od=new Set,Rd={};function Ga(e,t){yl(e,t),yl(e+"Capture",t)}function yl(e,t){for(Rd[e]=t,e=0;e<t.length;e++)Od.add(t[e])}var t_=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),Md={},zd={};function n_(e){return fo.call(zd,e)?!0:fo.call(Md,e)?!1:t_.test(e)?zd[e]=!0:(Md[e]=!0,!1)}var Ue=!1;function qd(){var e=Ue;return Ue=!1,e}function xs(e,t,a){if(n_(t))if(a===null)e.removeAttribute(t);else{switch(typeof a){case"undefined":case"function":case"symbol":e.removeAttribute(t);return;case"boolean":var l=t.toLowerCase().slice(0,5);if(l!=="data-"&&l!=="aria-"){e.removeAttribute(t);return}}e.setAttribute(t,a)}}function ws(e,t,a){if(a===null)e.removeAttribute(t);else{switch(typeof a){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(t);return}e.setAttribute(t,a)}}function Qn(e,t,a,l){if(l===null)e.removeAttribute(a);else{switch(typeof l){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(a);return}e.setAttributeNS(t,a,l)}}function Kt(e){switch(typeof e){case"bigint":case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function Dd(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(t==="checkbox"||t==="radio")}function a_(e,t,a){var l=Object.getOwnPropertyDescriptor(e.constructor.prototype,t);if(!e.hasOwnProperty(t)&&typeof l<"u"&&typeof l.get=="function"&&typeof l.set=="function"){var i=l.get,r=l.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return i.call(this)},set:function(m){a=""+m,r.call(this,m)}}),Object.defineProperty(e,t,{enumerable:l.enumerable}),{getValue:function(){return a},setValue:function(m){a=""+m},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function bo(e){if(!e._valueTracker){var t=Dd(e)?"checked":"value";e._valueTracker=a_(e,t,""+e[t])}}function $d(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var a=t.getValue(),l="";return e&&(l=Dd(e)?e.checked?"true":"false":e.value),e=l,e!==a?(t.setValue(e),!0):!1}var l_=/[\n"\\]/g;function un(e){return e.replace(l_,function(t){return"\\"+t.charCodeAt(0).toString(16)+" "})}function yo(e,t,a,l,i,r,m,h){e.name="",m!=null&&typeof m!="function"&&typeof m!="symbol"&&typeof m!="boolean"?e.type=m:e.removeAttribute("type"),t!=null?m==="number"?(t===0&&e.value===""||e.value!=t)&&(e.value=""+Kt(t)):e.value!==""+Kt(t)&&(e.value=""+Kt(t)):m!=="submit"&&m!=="reset"||e.removeAttribute("value"),t!=null?m==="number"&&e.value==t?vo(e,Kt(e.value)):vo(e,Kt(t)):a!=null?vo(e,Kt(a)):l!=null&&e.removeAttribute("value"),i==null&&r!=null&&(e.defaultChecked=!!r),i!=null&&(e.checked=i&&typeof i!="function"&&typeof i!="symbol"),h!=null&&typeof h!="function"&&typeof h!="symbol"&&typeof h!="boolean"?e.name=""+Kt(h):e.removeAttribute("name")}function Ud(e,t,a,l,i,r,m,h){if(r!=null&&typeof r!="function"&&typeof r!="symbol"&&typeof r!="boolean"&&(e.type=r),t!=null||a!=null){if(!(r!=="submit"&&r!=="reset"||t!=null)){bo(e);return}a=a!=null?""+Kt(a):"",t=t!=null?""+Kt(t):a,h||t===e.value||(e.value=t),e.defaultValue=t}l=l??i,l=typeof l!="function"&&typeof l!="symbol"&&!!l,e.checked=h?e.checked:!!l,e.defaultChecked=!!l,m!=null&&typeof m!="function"&&typeof m!="symbol"&&typeof m!="boolean"&&(e.name=m),bo(e)}function vo(e,t){e.defaultValue!==""+t&&(e.defaultValue=""+t)}function vl(e,t,a,l){if(e=e.options,t){t={};for(var i=0;i<a.length;i++)t["$"+a[i]]=!0;for(a=0;a<e.length;a++)i=t.hasOwnProperty("$"+e[a].value),e[a].selected!==i&&(e[a].selected=i),i&&l&&(e[a].defaultSelected=!0)}else{for(a=""+Kt(a),t=null,i=0;i<e.length;i++){if(e[i].value===a){e[i].selected=!0,l&&(e[i].defaultSelected=!0);return}t!==null||e[i].disabled||(t=e[i])}t!==null&&(t.selected=!0)}}function Ld(e,t,a){if(t!=null&&(t=""+Kt(t),t!==e.value&&(e.value=t),a==null)){e.defaultValue!==t&&(e.defaultValue=t);return}e.defaultValue=a!=null?""+Kt(a):""}function Hd(e,t,a,l){if(t==null){if(l!=null){if(a!=null)throw Error(c(92));if(Le(l)){if(1<l.length)throw Error(c(93));l=l[0]}a=l}a==null&&(a=""),t=a}a=Kt(t),e.defaultValue=a,l=e.textContent,l===a&&l!==""&&l!==null&&(e.value=l),bo(e)}function xl(e,t){if(t){var a=e.firstChild;if(a&&a===e.lastChild&&a.nodeType===3){a.nodeValue=t;return}}e.textContent=t}var i_=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function Yd(e,t,a){var l=t.indexOf("--")===0;a==null||typeof a=="boolean"||a===""?l?e.setProperty(t,""):t==="float"?e.cssFloat="":e[t]="":l?e.setProperty(t,a):typeof a!="number"||a===0||i_.has(t)?t==="float"?e.cssFloat=a:e[t]=(""+a).trim():e[t]=a+"px"}function Bd(e,t,a){if(t!=null&&typeof t!="object")throw Error(c(62));if(e=e.style,a!=null){for(var l in a)!a.hasOwnProperty(l)||t!=null&&t.hasOwnProperty(l)||(l.indexOf("--")===0?e.setProperty(l,""):l==="float"?e.cssFloat="":e[l]="",Ue=!0);for(var i in t)l=t[i],t.hasOwnProperty(i)&&a[i]!==l&&(Yd(e,i,l),Ue=!0)}else for(var r in t)t.hasOwnProperty(r)&&Yd(e,r,t[r])}function xo(e){if(e.indexOf("-")===-1)return!1;switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var s_=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["maskType","mask-type"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),r_=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function js(e){return r_.test(""+e)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":e}function An(){}var wo=null;function jo(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var wl=null,jl=null;function Gd(e){var t=gl(e);if(t&&(e=t.stateNode)){var a=e[Yt]||null;e:switch(e=t.stateNode,t.type){case"input":if(yo(e,a.value,a.defaultValue,a.defaultValue,a.checked,a.defaultChecked,a.type,a.name),t=a.name,a.type==="radio"&&t!=null){for(a=e;a.parentNode;)a=a.parentNode;for(a=a.querySelectorAll('input[name="'+un(""+t)+'"][type="radio"]'),t=0;t<a.length;t++){var l=a[t];if(l!==e&&l.form===e.form){var i=l[Yt]||null;if(!i)throw Error(c(90));yo(l,i.value,i.defaultValue,i.defaultValue,i.checked,i.defaultChecked,i.type,i.name)}}for(t=0;t<a.length;t++)l=a[t],l.form===e.form&&$d(l)}break e;case"textarea":Ld(e,a.value,a.defaultValue);break e;case"select":t=a.value,t!=null&&vl(e,!!a.multiple,t,!1)}}}var So=!1;function Xd(e,t,a){if(So)return e(t,a);So=!0;try{var l=e(t);return l}finally{if(So=!1,(wl!==null||jl!==null)&&(jr(),wl&&(t=wl,e=jl,jl=wl=null,Gd(t),e)))for(t=0;t<e.length;t++)Gd(e[t])}}function bi(e,t){var a=e.stateNode;if(a===null)return null;var l=a[Yt]||null;if(l===null)return null;a=l[t];e:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(l=!l.disabled)||(e=e.type,l=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!l;break e;default:e=!1}if(e)return null;if(a&&typeof a!="function")throw Error(c(231,t,typeof a));return a}var Zn=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),To=!1;if(Zn)try{var yi={};Object.defineProperty(yi,"passive",{get:function(){To=!0}}),window.addEventListener("test",yi,yi),window.removeEventListener("test",yi,yi)}catch{To=!1}var fa=null,No=null,Ss=null;function Vd(){if(Ss)return Ss;var e,t=No,a=t.length,l,i="value"in fa?fa.value:fa.textContent,r=i.length;for(e=0;e<a&&t[e]===i[e];e++);var m=a-e;for(l=1;l<=m&&t[a-l]===i[r-l];l++);return Ss=i.slice(e,1<l?1-l:void 0)}function Ts(e){var t=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function Ns(){return!0}function Id(){return!1}function qt(e){function t(a,l,i,r,m){this._reactName=a,this._targetInst=i,this.type=l,this.nativeEvent=r,this.target=m,this.currentTarget=null;for(var h in e)e.hasOwnProperty(h)&&(a=e[h],this[h]=a?a(r):r[h]);return this.isDefaultPrevented=(r.defaultPrevented!=null?r.defaultPrevented:r.returnValue===!1)?Ns:Id,this.isPropagationStopped=Id,this}return Q(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var a=this.nativeEvent;a&&(a.preventDefault?a.preventDefault():typeof a.returnValue!="unknown"&&(a.returnValue=!1),this.isDefaultPrevented=Ns)},stopPropagation:function(){var a=this.nativeEvent;a&&(a.stopPropagation?a.stopPropagation():typeof a.cancelBubble!="unknown"&&(a.cancelBubble=!0),this.isPropagationStopped=Ns)},persist:function(){},isPersistent:Ns}),t}var ma={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},ks=qt(ma),vi=Q({},ma,{view:0,detail:0}),o_=qt(vi),ko,Eo,xi,Es=Q({},vi,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:Co,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==xi&&(xi&&e.type==="mousemove"?(ko=e.screenX-xi.screenX,Eo=e.screenY-xi.screenY):Eo=ko=0,xi=e),ko)},movementY:function(e){return"movementY"in e?e.movementY:Eo}}),Qd=qt(Es),u_=Q({},Es,{dataTransfer:0}),c_=qt(u_),d_=Q({},vi,{relatedTarget:0}),Ao=qt(d_),f_=Q({},ma,{animationName:0,elapsedTime:0,pseudoElement:0}),m_=qt(f_),p_=Q({},ma,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),h_=qt(p_),__=Q({},ma,{data:0}),Zd=qt(__),g_={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},b_={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},y_={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function v_(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=y_[e])?!!t[e]:!1}function Co(){return v_}var x_=Q({},vi,{key:function(e){if(e.key){var t=g_[e.key]||e.key;if(t!=="Unidentified")return t}return e.type==="keypress"?(e=Ts(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?b_[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:Co,charCode:function(e){return e.type==="keypress"?Ts(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?Ts(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),w_=qt(x_),j_=Q({},Es,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),Pd=qt(j_),S_=Q({},ma,{submitter:0}),T_=qt(S_),N_=Q({},vi,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:Co}),k_=qt(N_),E_=Q({},ma,{propertyName:0,elapsedTime:0,pseudoElement:0}),A_=qt(E_),C_=Q({},Es,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),O_=qt(C_),R_=Q({},ma,{newState:0,oldState:0,source:0}),M_=qt(R_),z_=[9,13,27,32],Oo=Zn&&"CompositionEvent"in window,wi=null;Zn&&"documentMode"in document&&(wi=document.documentMode);var q_=Zn&&"TextEvent"in window&&!wi,Kd=Zn&&(!Oo||wi&&8<wi&&11>=wi),Jd=" ",Wd=!1;function Fd(e,t){switch(e){case"keyup":return z_.indexOf(t.keyCode)!==-1;case"keydown":return t.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function ef(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var Sl=!1;function D_(e,t){switch(e){case"compositionend":return ef(t);case"keypress":return t.which!==32?null:(Wd=!0,Jd);case"textInput":return e=t.data,e===Jd&&Wd?null:e;default:return null}}function $_(e,t){if(Sl)return e==="compositionend"||!Oo&&Fd(e,t)?(e=Vd(),Ss=No=fa=null,Sl=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return Kd&&t.locale!=="ko"?null:t.data;default:return null}}var U_={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function tf(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t==="input"?!!U_[e.type]:t==="textarea"}function nf(e,t,a,l){wl?jl?jl.push(l):jl=[l]:wl=l,t=Ar(t,"onChange"),0<t.length&&(a=new ks("onChange","change",null,a,l),e.push({event:a,listeners:t}))}var ji=null,Si=null;function L_(e){X0(e,0)}function As(e){var t=gi(e);if($d(t))return e}function af(e,t){if(e==="change")return t}var lf=!1;if(Zn){var Ro;if(Zn){var Mo="oninput"in document;if(!Mo){var sf=document.createElement("div");sf.setAttribute("oninput","return;"),Mo=typeof sf.oninput=="function"}Ro=Mo}else Ro=!1;lf=Ro&&(!document.documentMode||9<document.documentMode)}function rf(){ji&&(ji.detachEvent("onpropertychange",of),Si=ji=null)}function of(e){if(e.propertyName==="value"&&As(Si)){var t=[];nf(t,Si,e,jo(e)),Xd(L_,t)}}function H_(e,t,a){e==="focusin"?(rf(),ji=t,Si=a,ji.attachEvent("onpropertychange",of)):e==="focusout"&&rf()}function Y_(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return As(Si)}function B_(e,t){if(e==="click")return As(t)}function G_(e,t){if(e==="input"||e==="change")return As(t)}function X_(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var Jt=typeof Object.is=="function"?Object.is:X_;function Ti(e,t){if(Jt(e,t))return!0;if(typeof e!="object"||e===null||typeof t!="object"||t===null)return!1;var a=Object.keys(e),l=Object.keys(t);if(a.length!==l.length)return!1;for(l=0;l<a.length;l++){var i=a[l];if(!fo.call(t,i)||!Jt(e[i],t[i]))return!1}return!0}function zo(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}function uf(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function cf(e,t){var a=uf(e);e=0;for(var l;a;){if(a.nodeType===3){if(l=e+a.textContent.length,e<=t&&l>=t)return{node:a,offset:t-e};e=l}e:{for(;a;){if(a.nextSibling){a=a.nextSibling;break e}a=a.parentNode}a=void 0}a=uf(a)}}function df(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?df(e,t.parentNode):"contains"in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function ff(e){e=e!=null&&e.ownerDocument!=null&&e.ownerDocument.defaultView!=null?e.ownerDocument.defaultView:window;for(var t=zo(e.document);t instanceof e.HTMLIFrameElement;){try{var a=typeof t.contentWindow.location.href=="string"}catch{a=!1}if(a)e=t.contentWindow;else break;t=zo(e.document)}return t}function qo(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||t==="textarea"||e.contentEditable==="true")}var V_=Zn&&"documentMode"in document&&11>=document.documentMode,Tl=null,Do=null,Ni=null,$o=!1;function mf(e,t,a){var l=a.window===a?a.document:a.nodeType===9?a:a.ownerDocument;$o||Tl==null||Tl!==zo(l)||(l=Tl,"selectionStart"in l&&qo(l)?l={start:l.selectionStart,end:l.selectionEnd}:(l=(l.ownerDocument&&l.ownerDocument.defaultView||window).getSelection(),l={anchorNode:l.anchorNode,anchorOffset:l.anchorOffset,focusNode:l.focusNode,focusOffset:l.focusOffset}),Ni&&Ti(Ni,l)||(Ni=l,l=Ar(Do,"onSelect"),0<l.length&&(t=new ks("onSelect","select",null,t,a),e.push({event:t,listeners:l}),t.target=Tl)))}function Xa(e,t){var a={};return a[e.toLowerCase()]=t.toLowerCase(),a["Webkit"+e]="webkit"+t,a["Moz"+e]="moz"+t,a}var Nl={animationend:Xa("Animation","AnimationEnd"),animationiteration:Xa("Animation","AnimationIteration"),animationstart:Xa("Animation","AnimationStart"),transitionrun:Xa("Transition","TransitionRun"),transitionstart:Xa("Transition","TransitionStart"),transitioncancel:Xa("Transition","TransitionCancel"),transitionend:Xa("Transition","TransitionEnd")},Uo={},pf={};Zn&&(pf=document.createElement("div").style,"AnimationEvent"in window||(delete Nl.animationend.animation,delete Nl.animationiteration.animation,delete Nl.animationstart.animation),"TransitionEvent"in window||delete Nl.transitionend.transition);function Va(e){if(Uo[e])return Uo[e];if(!Nl[e])return e;var t=Nl[e],a;for(a in t)if(t.hasOwnProperty(a)&&a in pf)return Uo[e]=t[a];return e}var hf=Va("animationend"),_f=Va("animationiteration"),gf=Va("animationstart"),I_=Va("transitionrun"),Q_=Va("transitionstart"),Z_=Va("transitioncancel"),bf=Va("transitionend"),yf=new Map,Lo="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");Lo.push("scrollEnd");function yn(e,t){yf.set(e,t),Ga(t,[e])}var P_=0;function Pn(e,t){if(e.name!=null&&e.name!=="auto")return e.name;if(t.autoName!==null)return t.autoName;e=jn.identifierPrefix;var a=P_++;return e="_"+e+"t_"+a.toString(32)+"_",t.autoName=e}function vf(e){if(e==null||typeof e=="string")return e;var t=null,a=Il;if(a!==null)for(var l=0;l<a.length;l++){var i=e[a[l]];if(i!=null){if(i==="none")return"none";t=t==null?i:t+(" "+i)}}return t??e.default}function Kn(e,t){return e=vf(e),t=vf(t),t==null?e==="auto"?null:e:t==="auto"?null:t}var Cs=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)},cn=[],kl=0,Ho=0;function Os(){for(var e=kl,t=Ho=kl=0;t<e;){var a=cn[t];cn[t++]=null;var l=cn[t];cn[t++]=null;var i=cn[t];cn[t++]=null;var r=cn[t];if(cn[t++]=null,l!==null&&i!==null){var m=l.pending;m===null?i.next=i:(i.next=m.next,m.next=i),l.pending=i}r!==0&&xf(a,i,r)}}function Rs(e,t,a,l){cn[kl++]=e,cn[kl++]=t,cn[kl++]=a,cn[kl++]=l,Ho|=l,e.lanes|=l,e=e.alternate,e!==null&&(e.lanes|=l)}function Yo(e,t,a,l){return Rs(e,t,a,l),Ms(e)}function Ia(e,t){return Rs(e,null,null,t),Ms(e)}function xf(e,t,a){e.lanes|=a;var l=e.alternate;l!==null&&(l.lanes|=a);for(var i=!1,r=e.return;r!==null;)r.childLanes|=a,l=r.alternate,l!==null&&(l.childLanes|=a),r.tag===22&&(e=r.stateNode,e===null||e._visibility&1||(i=!0)),e=r,r=r.return;return e.tag===3?(r=e.stateNode,i&&t!==null&&(i=31-Pt(a),e=r.hiddenUpdates,l=e[i],l===null?e[i]=[t]:l.push(t),t.lane=a|536870912),r):null}function Ms(e){if(50<Zi)throw Zi=0,wr=null,Error(c(185));for(var t=e.return;t!==null;)e=t,t=e.return;return e.tag===3?e.stateNode:null}var El={};function K_(e,t,a,l){this.tag=e,this.key=a,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=l,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function Bt(e,t,a,l){return new K_(e,t,a,l)}function Bo(e){return e=e.prototype,!(!e||!e.isReactComponent)}function Jn(e,t){var a=e.alternate;return a===null?(a=Bt(e.tag,t,e.key,e.mode),a.elementType=e.elementType,a.type=e.type,a.stateNode=e.stateNode,a.alternate=e,e.alternate=a):(a.pendingProps=t,a.type=e.type,a.flags=0,a.subtreeFlags=0,a.deletions=null),a.flags=e.flags&1206910976,a.childLanes=e.childLanes,a.lanes=e.lanes,a.child=e.child,a.memoizedProps=e.memoizedProps,a.memoizedState=e.memoizedState,a.updateQueue=e.updateQueue,t=e.dependencies,a.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},a.sibling=e.sibling,a.index=e.index,a.ref=e.ref,a.refCleanup=e.refCleanup,a}function wf(e,t){e.flags&=1206910978;var a=e.alternate;return a===null?(e.childLanes=0,e.lanes=t,e.child=null,e.subtreeFlags=0,e.memoizedProps=null,e.memoizedState=null,e.updateQueue=null,e.dependencies=null,e.stateNode=null):(e.childLanes=a.childLanes,e.lanes=a.lanes,e.child=a.child,e.subtreeFlags=0,e.deletions=null,e.memoizedProps=a.memoizedProps,e.memoizedState=a.memoizedState,e.updateQueue=a.updateQueue,e.type=a.type,t=a.dependencies,e.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),e}function zs(e,t,a,l,i,r){var m=0;if(l=e,typeof l=="function")Bo(l)&&(m=1);else if(typeof l=="string")m=Sb(e,a,En.current)?26:e==="html"||e==="head"||e==="body"?27:5;else e:switch(l){case zt:return e=Bt(31,a,t,i),e.elementType=zt,e.lanes=r,e;case P:return Qa(a.children,i,r,t);case J:m=8,i|=24;break;case Z:return e=Bt(12,a,t,i|2),e.elementType=Z,e.lanes=r,e;case se:return e=Bt(13,a,t,i),e.elementType=se,e.lanes=r,e;case oe:return e=Bt(19,a,t,i),e.elementType=oe,e.lanes=r,e;case ot:case S:return e=i|32,e=Bt(30,a,t,e),e.elementType=S,e.lanes=r,e.stateNode={autoName:null,paired:null,clones:null,ref:null},e;default:if(typeof l=="object"&&l!==null)switch(l.$$typeof){case te:m=10;break e;case Se:m=9;break e;case X:m=11;break e;case Ge:m=14;break e;case $e:m=16,l=null;break e}m=29,a=Error(c(130,e===null?"null":typeof e,"")),l=null}return t=Bt(m,a,t,i),t.elementType=e,t.type=l,t.lanes=r,t}function Qa(e,t,a,l){return e=Bt(7,e,l,t),e.lanes=a,e}function Go(e,t,a){return e=Bt(6,e,null,t),e.lanes=a,e}function jf(e){var t=Bt(18,null,null,0);return t.stateNode=e,t}function Xo(e,t,a){return t=Bt(4,e.children!==null?e.children:[],e.key,t),t.lanes=a,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}var Sf=new WeakMap;function dn(e,t){if(typeof e=="object"&&e!==null){var a=Sf.get(e);return a!==void 0?a:(t={value:e,source:t,stack:gd(t)},Sf.set(e,t),t)}return{value:e,source:t,stack:gd(t)}}var Al=[],Cl=0,qs=null,ki=0,fn=[],mn=0,pa=null,Cn=1,On="";function Wn(e,t){Al[Cl++]=ki,Al[Cl++]=qs,qs=e,ki=t}function Tf(e,t,a){fn[mn++]=Cn,fn[mn++]=On,fn[mn++]=pa,pa=e;var l=Cn;e=On;var i=32-Pt(l)-1;l&=~(1<<i),a+=1;var r=32-Pt(t)+i;if(30<r){var m=i-i%5;r=(l&(1<<m)-1).toString(32),l>>=m,i-=m,Cn=1<<32-Pt(t)+i|a<<i|l,On=r+e}else Cn=1<<r|a<<i|l,On=e}function Ds(e){e.return!==null&&(Wn(e,1),Tf(e,1,0))}function Vo(e){for(;e===qs;)qs=Al[--Cl],Al[Cl]=null,ki=Al[--Cl],Al[Cl]=null;for(;e===pa;)pa=fn[--mn],fn[mn]=null,On=fn[--mn],fn[mn]=null,Cn=fn[--mn],fn[mn]=null}function Nf(e,t){fn[mn++]=Cn,fn[mn++]=On,fn[mn++]=pa,Cn=t.id,On=t.overflow,pa=e}var bt=null,Ke=null,Ne=!1,ha=null,pn=!1,Io=Error(c(519));function _a(e){var t=Error(c(418,1<arguments.length&&arguments[1]!==void 0&&arguments[1]?"text":"HTML",""));throw Ei(dn(t,e)),Io}function kf(e){var t=e.stateNode,a=e.type,l=e.memoizedProps;switch(t[St]=e,t[Yt]=l,a){case"dialog":Ce("cancel",t),Ce("close",t);break;case"iframe":case"object":case"embed":Ce("load",t);break;case"video":case"audio":for(a=0;a<Ki.length;a++)Ce(Ki[a],t);break;case"source":Ce("error",t);break;case"img":case"image":case"link":Ce("error",t),Ce("load",t);break;case"details":Ce("toggle",t);break;case"input":Ce("invalid",t),Ud(t,l.value,l.defaultValue,l.checked,l.defaultChecked,l.type,l.name,!0);break;case"select":Ce("invalid",t);break;case"textarea":Ce("invalid",t),Hd(t,l.value,l.defaultValue,l.children)}a=l.children,typeof a!="string"&&typeof a!="number"&&typeof a!="bigint"||t.textContent===""+a||l.suppressHydrationWarning===!0||Z0(t.textContent,a)?(l.popover!=null&&(Ce("beforetoggle",t),Ce("toggle",t)),l.onScroll!=null&&Ce("scroll",t),l.onScrollEnd!=null&&Ce("scrollend",t),l.onClick!=null&&(t.onclick=An),t=!0):t=!1,t||_a(e,!0)}function $s(e){for(bt=e.return;bt;)switch(bt.tag){case 5:case 31:case 13:pn=!1;return;case 27:case 3:pn=!0;return;default:bt=bt.return}}function Ol(e){if(e!==bt)return!1;if(!Ne)return $s(e),Ne=!0,!1;var t=e.tag,a;if((a=t!==3&&t!==27)&&((a=t===5)&&(a=e.type,a=!(a!=="form"&&a!=="button")||wc(e.type,e.memoizedProps)),a=!a),a&&Ke&&_a(e),$s(e),t===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(c(317));Ke=mp(e)}else if(t===31){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(c(317));Ke=mp(e)}else t===27?(t=Ke,Ra(e.type)?(e=Oc,Oc=null,Ke=e):Ke=t):Ke=bt?_n(e.stateNode.nextSibling):null;return!0}function Za(){Ke=bt=null,Ne=!1}function Qo(){var e=ha;return e!==null&&(Vt===null?Vt=e:Vt.push.apply(Vt,e),ha=null),e}function Ei(e){ha===null?ha=[e]:ha.push(e)}var Zo=kn(null),Pa=null,Fn=null;function ga(e,t,a){Pe(Zo,t._currentValue),t._currentValue=a}function ea(e){e._currentValue=Zo.current,jt(Zo)}function Us(e,t,a){for(;e!==null;){var l=e.alternate;if((e.childLanes&t)!==t?(e.childLanes|=t,l!==null&&(l.childLanes|=t)):l!==null&&(l.childLanes&t)!==t&&(l.childLanes|=t),e===a)break;e=e.return}}function Po(e,t,a,l){var i=e.child;for(i!==null&&(i.return=e);i!==null;){var r=i.dependencies;if(r!==null){var m=i.child;r=r.firstContext;e:for(;r!==null;){var h=r;r=i;for(var x=0;x<t.length;x++)if(h.context===t[x]){r.lanes|=a,h=r.alternate,h!==null&&(h.lanes|=a),Us(r.return,a,e),l||(m=null);break e}r=h.next}}else if(i.tag===18){if(m=i.return,m===null)throw Error(c(341));m.lanes|=a,r=m.alternate,r!==null&&(r.lanes|=a),Us(m,a,e),m=null}else i.tag===13&&i.memoizedState!==null&&i.memoizedState.dehydrated===null?(i.lanes|=a,m=i.alternate,m!==null&&(m.lanes|=a),Us(i.return,a,e),m=i.child,m=m!==null?m.sibling:null):m=i.child;if(m!==null)m.return=i;else for(m=i;m!==null;){if(m===e){m=null;break}if(i=m.sibling,i!==null){i.return=m.return,m=i;break}m=m.return}i=m}}function Ka(e,t,a,l){e=null;for(var i=t,r=!1;i!==null;){if(!r){if((i.flags&524288)!==0)r=!0;else if((i.flags&262144)!==0)break}if(i.tag===10){var m=i.alternate;if(m===null)throw Error(c(387));if(m=m.memoizedProps,m!==null){var h=i.type;Jt(i.pendingProps.value,m.value)||(e!==null?e.push(h):e=[h])}}else if(i===ds.current){if(m=i.alternate,m===null)throw Error(c(387));m.memoizedState.memoizedState!==i.memoizedState.memoizedState&&(e!==null?e.push(ni):e=[ni])}i=i.return}return e!==null&&Po(t,e,a,l),t.flags|=262144,e!==null}function Ls(e){for(e=e.firstContext;e!==null;){if(!Jt(e.context._currentValue,e.memoizedValue))return!0;e=e.next}return!1}function Ja(e){Pa=e,Fn=null,e=e.dependencies,e!==null&&(e.firstContext=null)}function Tt(e){return Ef(Pa,e)}function Hs(e,t){return Pa===null&&Ja(e),Ef(e,t)}function Ef(e,t){var a=t._currentValue;if(t={context:t,memoizedValue:a,next:null},Fn===null){if(e===null)throw Error(c(308));Fn=t,e.dependencies={lanes:0,firstContext:t},e.flags|=524288}else Fn=Fn.next=t;return a}var J_=typeof AbortController<"u"?AbortController:function(){var e=[],t=this.signal={aborted:!1,addEventListener:function(a,l){e.push(l)}};this.abort=function(){t.aborted=!0,e.forEach(function(a){return a()})}},W_=n.unstable_scheduleCallback,F_=n.unstable_NormalPriority,dt={$$typeof:te,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function Ko(){return{controller:new J_,data:new Map,refCount:0}}function Ai(e){e.refCount--,e.refCount===0&&W_(F_,function(){e.controller.abort()})}function Af(e,t){if((e.pendingLanes&4194048)!==0){var a=e.transitionTypes;for(a===null&&(a=e.transitionTypes=[]),e=0;e<t.length;e++){var l=t[e];a.indexOf(l)===-1&&a.push(l)}}}var Ci=null;function eg(e){var t=e.transitionTypes;return e.transitionTypes=null,t}var Oi=null,Jo=0,Wa=0,Rl=null;function tg(e,t){if(Oi===null){var a=Oi=[];Jo=0,Wa=mc(),Rl={status:"pending",value:void 0,then:function(l){a.push(l)}}}return Jo++,t.then(Cf,Cf),t}function Cf(){if(--Jo===0&&(Ci=null,Oi!==null)){Rl!==null&&(Rl.status="fulfilled");var e=Oi;Oi=null,Wa=0,Rl=null;for(var t=0;t<e.length;t++)(0,e[t])()}}function ng(e,t){var a=[],l={status:"pending",value:null,reason:null,then:function(i){a.push(i)}};return e.then(function(){l.status="fulfilled",l.value=t;for(var i=0;i<a.length;i++)(0,a[i])(t)},function(i){for(l.status="rejected",l.reason=i,i=0;i<a.length;i++)(0,a[i])(void 0)}),l}var Of=ee.S;ee.S=function(e,t){if(j0=Qt(),typeof t=="object"&&t!==null&&typeof t.then=="function"&&tg(e,t),Ci!==null)for(var a=Kl;a!==null;)Af(a,Ci),a=a.next;if(a=e.types,a!==null){for(var l=Kl;l!==null;)Af(l,a),l=l.next;if(Wa!==0){l=Ci,l===null&&(l=Ci=[]);for(var i=0;i<a.length;i++){var r=a[i];l.indexOf(r)===-1&&l.push(r)}}}Of!==null&&Of(e,t)};var Fa=kn(null);function Wo(){var e=Fa.current;return e!==null?e:Ze.pooledCache}function Ys(e,t){t===null?Pe(Fa,Fa.current):Pe(Fa,t.pool)}function Rf(){var e=Wo();return e===null?null:{parent:dt._currentValue,pool:e}}var Ml=Error(c(460)),Fo=Error(c(474)),Bs=Error(c(542)),Gs={then:function(){}};function Mf(e){return e=e.status,e==="fulfilled"||e==="rejected"}function zf(e,t,a){switch(a=e[a],a===void 0?e.push(t):a!==t&&(t.then(An,An),t=a),t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,Df(e),e===void 0&&!("reason"in t)?Error(c(600)):e;default:if(typeof t.status=="string")t.then(An,An);else{if(e=Ze,e!==null&&100<e.shellSuspendCounter)throw Error(c(482));e=t,e.status="pending",e.then(function(l){if(t.status==="pending"){var i=t;i.status="fulfilled",i.value=l}},function(l){if(t.status==="pending"){var i=t;i.status="rejected",i.reason=l}})}switch(t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,Df(e),e}throw tl=t,Ml}}function el(e){try{var t=e._init;return t(e._payload)}catch(a){throw a!==null&&typeof a=="object"&&typeof a.then=="function"?(tl=a,Ml):a}}var tl=null;function qf(){if(tl===null)throw Error(c(459));var e=tl;return tl=null,e}function Df(e){if(e===Ml||e===Bs)throw Error(c(483))}var zl=null,Ri=0;function Xs(e){var t=Ri;return Ri+=1,zl===null&&(zl=[]),zf(zl,e,t)}function ba(e,t){t=t.props.ref,e.ref=t!==void 0?t:null}function Vs(e,t){throw t.$$typeof===ue?Error(c(525)):(e=Object.prototype.toString.call(t),Error(c(31,e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e)))}function $f(e){function t(k,j){if(e){var A=k.deletions;A===null?(k.deletions=[j],k.flags|=16):A.push(j)}}function a(k,j){if(!e)return null;for(;j!==null;)t(k,j),j=j.sibling;return null}function l(k){for(var j=new Map;k!==null;)k.key===null?j.set(k.index,k):j.set(k.key,k),k=k.sibling;return j}function i(k,j){return k=Jn(k,j),k.index=0,k.sibling=null,k}function r(k,j,A){return k.index=A,e?(A=k.alternate,A!==null?(A=A.index,A<j?(k.flags|=2,j):A):(k.flags|=134217730,j)):(k.flags|=1048576,j)}function m(k){return e&&k.alternate===null&&(k.flags|=134217730),k}function h(k,j,A,M){return j===null||j.tag!==6?(j=Go(A,k.mode,M),j.return=k,j):(j=i(j,A),j.return=k,j)}function x(k,j,A,M){var K=A.type;return K===P?(k=O(k,j,A.props.children,M,A.key),ba(k,A),k):j!==null&&(j.elementType===K||typeof K=="object"&&K!==null&&K.$$typeof===$e&&el(K)===j.type)?(j=i(j,A.props),ba(j,A),j.return=k,j):(j=zs(A.type,A.key,A.props,null,k.mode,M),ba(j,A),j.return=k,j)}function E(k,j,A,M){return j===null||j.tag!==4||j.stateNode.containerInfo!==A.containerInfo||j.stateNode.implementation!==A.implementation?(j=Xo(A,k.mode,M),j.return=k,j):(j=i(j,A.children||[]),j.return=k,j)}function O(k,j,A,M,K){return j===null||j.tag!==7?(j=Qa(A,k.mode,M,K),j.return=k,j):(j=i(j,A),j.return=k,j)}function z(k,j,A){if(typeof j=="string"&&j!==""||typeof j=="number"||typeof j=="bigint")return j=Go(""+j,k.mode,A),j.return=k,j;if(typeof j=="object"&&j!==null){switch(j.$$typeof){case et:return A=zs(j.type,j.key,j.props,null,k.mode,A),ba(A,j),A.return=k,A;case D:return j=Xo(j,k.mode,A),j.return=k,j;case $e:return j=el(j),z(k,j,A)}if(Le(j)||ae(j))return j=Qa(j,k.mode,A,null),j.return=k,j;if(typeof j.then=="function")return z(k,Xs(j),A);if(j.$$typeof===te)return z(k,Hs(k,j),A);Vs(k,j)}return null}function T(k,j,A,M){var K=j!==null?j.key:null;if(typeof A=="string"&&A!==""||typeof A=="number"||typeof A=="bigint")return K!==null?null:h(k,j,""+A,M);if(typeof A=="object"&&A!==null){switch(A.$$typeof){case et:return A.key===K?x(k,j,A,M):null;case D:return A.key===K?E(k,j,A,M):null;case $e:return A=el(A),T(k,j,A,M)}if(Le(A)||ae(A))return K!==null?null:O(k,j,A,M,null);if(typeof A.then=="function")return T(k,j,Xs(A),M);if(A.$$typeof===te)return T(k,j,Hs(k,A),M);Vs(k,A)}return null}function C(k,j,A,M,K){if(typeof M=="string"&&M!==""||typeof M=="number"||typeof M=="bigint")return k=k.get(A)||null,h(j,k,""+M,K);if(typeof M=="object"&&M!==null){switch(M.$$typeof){case et:return k=k.get(M.key===null?A:M.key)||null,x(j,k,M,K);case D:return k=k.get(M.key===null?A:M.key)||null,E(j,k,M,K);case $e:return M=el(M),C(k,j,A,M,K)}if(Le(M)||ae(M))return k=k.get(A)||null,O(j,k,M,K,null);if(typeof M.then=="function")return C(k,j,A,Xs(M),K);if(M.$$typeof===te)return C(k,j,A,Hs(j,M),K);Vs(j,M)}return null}function I(k,j,A,M){for(var K=null,Re=null,le=j,re=j=0,pt=null;le!==null&&re<A.length;re++){le.index>re?(pt=le,le=null):pt=le.sibling;var qe=T(k,le,A[re],M);if(qe===null){le===null&&(le=pt);break}e&&le&&qe.alternate===null&&t(k,le),j=r(qe,j,re),Re===null?K=qe:Re.sibling=qe,Re=qe,le=pt}if(re===A.length)return a(k,le),Ne&&Wn(k,re),K;if(le===null){for(;re<A.length;re++)le=z(k,A[re],M),le!==null&&(j=r(le,j,re),Re===null?K=le:Re.sibling=le,Re=le);return Ne&&Wn(k,re),K}for(le=l(le);re<A.length;re++)pt=C(le,k,re,A[re],M),pt!==null&&(e&&(qe=pt.alternate,qe!==null&&le.delete(qe.key===null?re:qe.key)),j=r(pt,j,re),Re===null?K=pt:Re.sibling=pt,Re=pt);return e&&le.forEach(function($a){return t(k,$a)}),Ne&&Wn(k,re),K}function W(k,j,A,M){if(A==null)throw Error(c(151));for(var K=null,Re=null,le=j,re=j=0,pt=null,qe=A.next();le!==null&&!qe.done;re++,qe=A.next()){le.index>re?(pt=le,le=null):pt=le.sibling;var $a=T(k,le,qe.value,M);if($a===null){le===null&&(le=pt);break}e&&le&&$a.alternate===null&&t(k,le),j=r($a,j,re),Re===null?K=$a:Re.sibling=$a,Re=$a,le=pt}if(qe.done)return a(k,le),Ne&&Wn(k,re),K;if(le===null){for(;!qe.done;re++,qe=A.next())qe=z(k,qe.value,M),qe!==null&&(j=r(qe,j,re),Re===null?K=qe:Re.sibling=qe,Re=qe);return Ne&&Wn(k,re),K}for(le=l(le);!qe.done;re++,qe=A.next())qe=C(le,k,re,qe.value,M),qe!==null&&(e&&(pt=qe.alternate,pt!==null&&le.delete(pt.key===null?re:pt.key)),j=r(qe,j,re),Re===null?K=qe:Re.sibling=qe,Re=qe);return e&&le.forEach(function(Db){return t(k,Db)}),Ne&&Wn(k,re),K}function ve(k,j,A,M){if(typeof A=="object"&&A!==null&&A.type===P&&A.key===null&&A.props.ref===void 0&&(A=A.props.children),typeof A=="object"&&A!==null){switch(A.$$typeof){case et:e:{for(var K=A.key;j!==null;){if(j.key===K){if(K=A.type,K===P){if(j.tag===7){a(k,j.sibling),M=i(j,A.props.children),ba(M,A),M.return=k,k=M;break e}}else if(j.elementType===K||typeof K=="object"&&K!==null&&K.$$typeof===$e&&el(K)===j.type){a(k,j.sibling),M=i(j,A.props),ba(M,A),M.return=k,k=M;break e}a(k,j);break}else t(k,j);j=j.sibling}A.type===P?(M=Qa(A.props.children,k.mode,M,A.key),ba(M,A),M.return=k,k=M):(M=zs(A.type,A.key,A.props,null,k.mode,M),ba(M,A),M.return=k,k=M)}return m(k);case D:e:{for(K=A.key;j!==null;){if(j.key===K)if(j.tag===4&&j.stateNode.containerInfo===A.containerInfo&&j.stateNode.implementation===A.implementation){a(k,j.sibling),M=i(j,A.children||[]),M.return=k,k=M;break e}else{a(k,j);break}else t(k,j);j=j.sibling}M=Xo(A,k.mode,M),M.return=k,k=M}return m(k);case $e:return A=el(A),ve(k,j,A,M)}if(Le(A))return I(k,j,A,M);if(ae(A)){if(K=ae(A),typeof K!="function")throw Error(c(150));return A=K.call(A),W(k,j,A,M)}if(typeof A.then=="function")return ve(k,j,Xs(A),M);if(A.$$typeof===te)return ve(k,j,Hs(k,A),M);Vs(k,A)}return typeof A=="string"&&A!==""||typeof A=="number"||typeof A=="bigint"?(A=""+A,j!==null&&j.tag===6?(a(k,j.sibling),M=i(j,A),M.return=k,k=M):(a(k,j),M=Go(A,k.mode,M),M.return=k,k=M),m(k)):a(k,j)}return function(k,j,A,M){try{Ri=0;var K=ve(k,j,A,M);return zl=null,K}catch(le){if(le===Ml||le===Bs)throw le;var Re=Bt(29,le,null,k.mode);return Re.lanes=M,Re.return=k,Re}}}var nl=$f(!0),Uf=$f(!1),ya=!1;function eu(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function tu(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,callbacks:null})}function va(e){return{lane:e,tag:0,payload:null,callback:null,next:null}}function xa(e,t,a){var l=e.updateQueue;if(l===null)return null;if(l=l.shared,(He&2)!==0){var i=l.pending;return i===null?t.next=t:(t.next=i.next,i.next=t),l.pending=t,t=Ms(e),xf(e,null,a),t}return Rs(e,l,t,a),Ms(e)}function Mi(e,t,a){if(t=t.updateQueue,t!==null&&(t=t.shared,(a&4194048)!==0)){var l=t.lanes;l&=e.pendingLanes,a|=l,t.lanes=a,Sd(e,a)}}function nu(e,t){var a=e.updateQueue,l=e.alternate;if(l!==null&&(l=l.updateQueue,a===l)){var i=null,r=null;if(a=a.firstBaseUpdate,a!==null){do{var m={lane:a.lane,tag:a.tag,payload:a.payload,callback:null,next:null};r===null?i=r=m:r=r.next=m,a=a.next}while(a!==null);r===null?i=r=t:r=r.next=t}else i=r=t;a={baseState:l.baseState,firstBaseUpdate:i,lastBaseUpdate:r,shared:l.shared,callbacks:l.callbacks},e.updateQueue=a;return}e=a.lastBaseUpdate,e===null?a.firstBaseUpdate=t:e.next=t,a.lastBaseUpdate=t}var au=!1;function zi(){if(au){var e=Rl;if(e!==null)throw e}}function qi(e,t,a,l){au=!1;var i=e.updateQueue;ya=!1;var r=i.firstBaseUpdate,m=i.lastBaseUpdate,h=i.shared.pending;if(h!==null){i.shared.pending=null;var x=h,E=x.next;x.next=null,m===null?r=E:m.next=E,m=x;var O=e.alternate;O!==null&&(O=O.updateQueue,h=O.lastBaseUpdate,h!==m&&(h===null?O.firstBaseUpdate=E:h.next=E,O.lastBaseUpdate=x))}if(r!==null){var z=i.baseState;m=0,O=E=x=null,h=r;do{var T=h.lane&-536870913,C=T!==h.lane;if(C?(Oe&T)===T:(l&T)===T){T!==0&&T===Wa&&(au=!0),O!==null&&(O=O.next={lane:0,tag:h.tag,payload:h.payload,callback:null,next:null});e:{var I=e,W=h;T=t;var ve=a;switch(W.tag){case 1:if(I=W.payload,typeof I=="function"){z=I.call(ve,z,T);break e}z=I;break e;case 3:I.flags=I.flags&-65537|128;case 0:if(I=W.payload,T=typeof I=="function"?I.call(ve,z,T):I,T==null)break e;z=Q({},z,T);break e;case 2:ya=!0}}T=h.callback,T!==null&&(e.flags|=64,C&&(e.flags|=8192),C=i.callbacks,C===null?i.callbacks=[T]:C.push(T))}else C={lane:T,tag:h.tag,payload:h.payload,callback:h.callback,next:null},O===null?(E=O=C,x=z):O=O.next=C,m|=T;if(h=h.next,h===null){if(h=i.shared.pending,h===null)break;C=h,h=C.next,C.next=null,i.lastBaseUpdate=C,i.shared.pending=null}}while(!0);O===null&&(x=z),i.baseState=x,i.firstBaseUpdate=E,i.lastBaseUpdate=O,r===null&&(i.shared.lanes=0),Ea|=m,e.lanes=m,e.memoizedState=z}}function Lf(e,t){if(typeof e!="function")throw Error(c(191,e));e.call(t)}function Hf(e,t){var a=e.callbacks;if(a!==null)for(e.callbacks=null,e=0;e<a.length;e++)Lf(a[e],t)}var wa=kn(null),Is=kn(0);function Yf(e,t){e=ia,Pe(Is,e),Pe(wa,t),ia=e|t.baseLanes}function lu(){Pe(Is,ia),Pe(wa,wa.current)}function iu(){ia=Is.current,jt(wa),jt(Is)}var Nt=kn(null),Rt=null;function ja(e){var t=e.alternate;Pe(kt,kt.current&1),Pe(Nt,e),Rt===null&&(t===null||wa.current!==null||t.memoizedState!==null)&&(Rt=e)}function su(e){Pe(kt,kt.current),Pe(Nt,e),Rt===null&&(Rt=e)}function Bf(e){e.tag===22?(Pe(kt,kt.current),Pe(Nt,e),Rt===null&&(Rt=e)):Sa()}function Sa(){Pe(kt,kt.current),Pe(Nt,Nt.current)}function Wt(e){jt(Nt),Rt===e&&(Rt=null),jt(kt)}var kt=kn(0);function Di(e,t){Pe(Nt,Nt.current),Pe(kt,t)}function ru(e){jt(kt),jt(Nt),Rt===e&&(Rt=null)}function Qs(e){for(var t=e;t!==null;){if(t.tag===13){var a=t.memoizedState;if(a!==null&&(a=a.dehydrated,a===null||Ac(a)||Cc(a)))return t}else if(t.tag===19&&t.memoizedProps.revealOrder!=="independent"){if((t.flags&128)!==0)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var ta=0,ye=null,Qe=null,ft=null,Zs=!1,ql=!1,al=!1,Ps=0,$i=0,Dl=null,ag=0;function at(){throw Error(c(321))}function ou(e,t){if(t===null)return!1;for(var a=0;a<t.length&&a<e.length;a++)if(!Jt(e[a],t[a]))return!1;return!0}function uu(e,t,a,l,i,r){return ta=r,ye=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,ee.H=e===null||e.memoizedState===null?Tm:Nm,al=!1,r=a(l,i),al=!1,ql&&(r=Xf(t,a,l,i)),Gf(e),r}function Gf(e){ee.H=nr;var t=Qe!==null&&Qe.next!==null;if(ta=0,ft=Qe=ye=null,Zs=!1,$i=0,Dl=null,t)throw Error(c(300));e===null||mt||(e=e.dependencies,e!==null&&Ls(e)&&(mt=!0))}function Xf(e,t,a,l){ye=e;var i=0;do{if(ql&&(Dl=null),$i=0,ql=!1,25<=i)throw Error(c(301));if(i+=1,ft=Qe=null,e.updateQueue!=null){var r=e.updateQueue;r.lastEffect=null,r.events=null,r.stores=null,r.memoCache!=null&&(r.memoCache.index=0)}ee.H=dg,r=t(a,l)}while(ql);return r}function lg(){var e=ee.H,t=e.useState()[0];return t=typeof t.then=="function"?Ui(t):t,e=e.useState()[0],(Qe!==null?Qe.memoizedState:null)!==e&&(ye.flags|=1024),t}function cu(){var e=Ps!==0;return Ps=0,e}function du(e,t,a){t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~a}function fu(e){if(Zs){for(e=e.memoizedState;e!==null;){var t=e.queue;t!==null&&(t.pending=null),e=e.next}Zs=!1}ta=0,ft=Qe=ye=null,ql=!1,$i=Ps=0,Dl=null}function Dt(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return ft===null?ye.memoizedState=ft=e:ft=ft.next=e,ft}function ut(){if(Qe===null){var e=ye.alternate;e=e!==null?e.memoizedState:null}else e=Qe.next;var t=ft===null?ye.memoizedState:ft.next;if(t!==null)ft=t,Qe=e;else{if(e===null)throw ye.alternate===null?Error(c(467)):Error(c(310));Qe=e,e={memoizedState:Qe.memoizedState,baseState:Qe.baseState,baseQueue:Qe.baseQueue,queue:Qe.queue,next:null},ft===null?ye.memoizedState=ft=e:ft=ft.next=e}return ft}function Ks(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function Ui(e){var t=$i;return $i+=1,Dl===null&&(Dl=[]),e=zf(Dl,e,t),t=ye,(ft===null?t.memoizedState:ft.next)===null&&(t=t.alternate,ee.H=t===null||t.memoizedState===null?Tm:Nm),e}function Js(e){if(e!==null&&typeof e=="object"){if(typeof e.then=="function")return Ui(e);if(e.$$typeof===$)return;if(e.$$typeof===te)return Tt(e)}throw Error(c(438,String(e)))}function mu(e){var t=null,a=ye.updateQueue;if(a!==null&&(t=a.memoCache),t==null){var l=ye.alternate;l!==null&&(l=l.updateQueue,l!==null&&(l=l.memoCache,l!=null&&(t={data:l.data.map(function(i){return i.slice()}),index:0})))}if(t==null&&(t={data:[],index:0}),a===null&&(a=Ks(),ye.updateQueue=a),a.memoCache=t,a=t.data[t.index],a===void 0)for(a=t.data[t.index]=Array(e),l=0;l<e;l++)a[l]=ct;return t.index++,a}function na(e,t){return typeof t=="function"?t(e):t}function Ws(e){var t=ut();return pu(t,Qe,e)}function pu(e,t,a){var l=e.queue;if(l===null)throw Error(c(311));l.lastRenderedReducer=a;var i=e.baseQueue,r=l.pending;if(r!==null){if(i!==null){var m=i.next;i.next=r.next,r.next=m}t.baseQueue=i=r,l.pending=null}if(r=e.baseState,i===null)e.memoizedState=r;else{t=i.next;var h=m=null,x=null,E=t,O=!1;do{var z=E.lane&-536870913;if(z!==E.lane?(Oe&z)===z:(ta&z)===z){var T=E.revertLane;if(T===0)x!==null&&(x=x.next={lane:0,revertLane:0,gesture:null,action:E.action,hasEagerState:E.hasEagerState,eagerState:E.eagerState,next:null}),z===Wa&&(O=!0);else if((ta&T)===T){E=E.next,T===Wa&&(O=!0);continue}else z={lane:0,revertLane:E.revertLane,gesture:null,action:E.action,hasEagerState:E.hasEagerState,eagerState:E.eagerState,next:null},x===null?(h=x=z,m=r):x=x.next=z,ye.lanes|=T,Ea|=T;z=E.action,al&&a(r,z),r=E.hasEagerState?E.eagerState:a(r,z)}else T={lane:z,revertLane:E.revertLane,gesture:E.gesture,action:E.action,hasEagerState:E.hasEagerState,eagerState:E.eagerState,next:null},x===null?(h=x=T,m=r):x=x.next=T,ye.lanes|=z,Ea|=z;E=E.next}while(E!==null&&E!==t);if(x===null?m=r:x.next=h,!Jt(r,e.memoizedState)&&(mt=!0,O&&(a=Rl,a!==null)))throw a;e.memoizedState=r,e.baseState=m,e.baseQueue=x,l.lastRenderedState=r}return i===null&&(l.lanes=0),[e.memoizedState,l.dispatch]}function hu(e){var t=ut(),a=t.queue;if(a===null)throw Error(c(311));a.lastRenderedReducer=e;var l=a.dispatch,i=a.pending,r=t.memoizedState;if(i!==null){a.pending=null;var m=i=i.next;do r=e(r,m.action),m=m.next;while(m!==i);Jt(r,t.memoizedState)||(mt=!0),t.memoizedState=r,t.baseQueue===null&&(t.baseState=r),a.lastRenderedState=r}return[r,l]}function Vf(e,t,a){var l=ye,i=ut(),r=Ne;if(r){if(a===void 0)throw Error(c(407));a=a()}else a=t();var m=!Jt((Qe||i).memoizedState,a);if(m&&(i.memoizedState=a,mt=!0),i=i.queue,bu(Zf.bind(null,l,i,e),[e]),e=i.getSnapshot!==t||m||ft!==null&&(ft.memoizedState.tag&1)!==0,$l(e?9:8,{destroy:void 0},Qf.bind(null,l,i,a,t),null),e){if(l.flags|=2048,Ze===null)throw Error(c(349));r||(ta&127)!==0||If(l,t,a)}return a}function If(e,t,a){e.flags|=16384,e={getSnapshot:t,value:a},t=ye.updateQueue,t===null?(t=Ks(),ye.updateQueue=t,t.stores=[e]):(a=t.stores,a===null?t.stores=[e]:a.push(e))}function Qf(e,t,a,l){t.value=a,t.getSnapshot=l,Pf(t)&&Kf(e)}function Zf(e,t,a){return a(function(){Pf(t)&&Kf(e)})}function Pf(e){var t=e.getSnapshot;e=e.value;try{var a=t();return!Jt(e,a)}catch{return!0}}function Kf(e){var t=Ia(e,2);t!==null&&It(t,e,2)}function _u(e){var t=Dt();if(typeof e=="function"){var a=e;if(e=a(),al){da(!0);try{a()}finally{da(!1)}}}return t.memoizedState=t.baseState=e,t.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:na,lastRenderedState:e},t}function Jf(e,t,a,l){return e.baseState=a,pu(e,Qe,typeof l=="function"?l:na)}function ig(e,t,a,l,i){if(tr(e))throw Error(c(485));if(e=t.action,e!==null){var r={payload:i,action:e,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(m){r.listeners.push(m)}};ee.T!==null?a(!0):r.isTransition=!1,l(r),a=t.pending,a===null?(r.next=t.pending=r,Wf(t,r)):(r.next=a.next,t.pending=a.next=r)}}function Wf(e,t){var a=t.action,l=t.payload,i=e.state;if(t.isTransition){var r=ee.T,m={};m.types=r!==null?r.types:null,ee.T=m;try{var h=a(i,l),x=ee.S;x!==null&&x(m,h),Ff(e,t,h)}catch(E){gu(e,t,E)}finally{r!==null&&m.types!==null&&(r.types=m.types),ee.T=r}}else try{r=a(i,l),Ff(e,t,r)}catch(E){gu(e,t,E)}}function Ff(e,t,a){a!==null&&typeof a=="object"&&typeof a.then=="function"?a.then(function(l){em(e,t,l)},function(l){return gu(e,t,l)}):em(e,t,a)}function em(e,t,a){t.status="fulfilled",t.value=a,tm(t),e.state=a,t=e.pending,t!==null&&(a=t.next,a===t?e.pending=null:(a=a.next,t.next=a,Wf(e,a)))}function gu(e,t,a){var l=e.pending;if(e.pending=null,l!==null){l=l.next;do t.status="rejected",t.reason=a,tm(t),t=t.next;while(t!==l)}e.action=null}function tm(e){e=e.listeners;for(var t=0;t<e.length;t++)(0,e[t])()}function nm(e,t){return t}function am(e,t){if(Ne){var a=Ze.formState;if(a!==null){e:{var l=ye;if(Ne){if(Ke){t:{for(var i=Ke,r=pn;i.nodeType!==8;){if(!r){i=null;break t}if(i=_n(i.nextSibling),i===null){i=null;break t}}r=i.data,i=r==="F!"||r==="F"?i:null}if(i){Ke=_n(i.nextSibling),l=i.data==="F!";break e}}_a(l)}l=!1}l&&(t=a[0])}}return a=Dt(),a.memoizedState=a.baseState=t,l={pending:null,lanes:0,dispatch:null,lastRenderedReducer:nm,lastRenderedState:t},a.queue=l,a=wm.bind(null,ye,l),l.dispatch=a,l=_u(!1),r=ju.bind(null,ye,!1,l.queue),l=Dt(),i={state:t,dispatch:null,action:e,pending:null},l.queue=i,a=ig.bind(null,ye,i,r,a),i.dispatch=a,l.memoizedState=e,[t,a,!1]}function lm(e){var t=ut();return im(t,Qe,e)}function im(e,t,a){if(t=pu(e,t,nm)[0],e=Ws(na)[0],typeof t=="object"&&t!==null&&typeof t.then=="function")try{var l=Ui(t)}catch(m){throw m===Ml?Bs:m}else l=t;t=ut();var i=t.queue,r=i.dispatch;return a!==t.memoizedState&&(ye.flags|=2048,$l(9,{destroy:void 0},sg.bind(null,i,a),null)),[l,r,e]}function sg(e,t){e.action=t}function sm(e){var t=ut(),a=Qe;if(a!==null)return im(t,a,e);ut(),t=t.memoizedState,a=ut();var l=a.queue.dispatch;return a.memoizedState=e,[t,l,!1]}function $l(e,t,a,l){return e={tag:e,create:a,deps:l,inst:t,next:null},t=ye.updateQueue,t===null&&(t=Ks(),ye.updateQueue=t),a=t.lastEffect,a===null?t.lastEffect=e.next=e:(l=a.next,a.next=e,e.next=l,t.lastEffect=e),e}function rm(){return ut().memoizedState}function Fs(e,t,a,l){var i=Dt();ye.flags|=e,i.memoizedState=$l(1|t,{destroy:void 0},a,l===void 0?null:l)}function er(e,t,a,l){var i=ut();l=l===void 0?null:l;var r=i.memoizedState.inst;Qe!==null&&l!==null&&ou(l,Qe.memoizedState.deps)?i.memoizedState=$l(t,r,a,l):(ye.flags|=e,i.memoizedState=$l(1|t,r,a,l))}function om(e,t){Fs(8390656,8,e,t)}function bu(e,t){er(2048,8,e,t)}function rg(e){ye.flags|=4;var t=ye.updateQueue;if(t===null)t=Ks(),ye.updateQueue=t,t.events=[e];else{var a=t.events;a===null?t.events=[e]:a.push(e)}}function um(e){var t=ut().memoizedState;return rg({ref:t,nextImpl:e}),function(){if((He&2)!==0)throw Error(c(440));return t.impl.apply(void 0,arguments)}}function cm(e,t){return er(4,2,e,t)}function dm(e,t){return er(4,4,e,t)}function fm(e,t){if(typeof t=="function"){e=e();var a=t(e);return function(){typeof a=="function"?a():t(null)}}if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function mm(e,t,a){a=a!=null?a.concat([e]):null,er(4,4,fm.bind(null,t,e),a)}function yu(){}function pm(e,t){var a=ut();t=t===void 0?null:t;var l=a.memoizedState;return t!==null&&ou(t,l[1])?l[0]:(a.memoizedState=[e,t],e)}function hm(e,t){var a=ut();t=t===void 0?null:t;var l=a.memoizedState;if(t!==null&&ou(t,l[1]))return l[0];if(l=e(),al){da(!0);try{e()}finally{da(!1)}}return a.memoizedState=[l,t],l}function vu(e,t,a){return a===void 0||(ta&1073741824)!==0&&(Oe&261930)===0?e.memoizedState=t:(e.memoizedState=a,e=T0(),ye.lanes|=e,Ea|=e,a)}function _m(e,t,a,l){return Jt(a,t)?a:wa.current!==null?(e=vu(e,a,l),Jt(e,t)||(mt=!0),e):(ta&106)===0||(ta&1073741824)!==0&&(Oe&261930)===0?(mt=!0,e.memoizedState=a):(e=T0(),ye.lanes|=e,Ea|=e,t)}function gm(e,t,a,l,i){var r=de.p;de.p=r!==0&&8>r?r:8;var m=ee.T,h={};h.types=m!==null?m.types:null,ee.T=h,ju(e,!1,t,a);try{var x=i(),E=ee.S;if(E!==null&&E(h,x),x!==null&&typeof x=="object"&&typeof x.then=="function"){var O=ng(x,l);Li(e,t,O,nn(e))}else Li(e,t,l,nn(e))}catch(z){Li(e,t,{then:function(){},status:"rejected",reason:z},nn())}finally{de.p=r,m!==null&&h.types!==null&&(m.types=h.types),ee.T=m}}function og(){}function xu(e,t,a,l){if(e.tag!==5)throw Error(c(476));var i=bm(e).queue;gm(e,i,t,Vn,a===null?og:function(){return ym(e),a(l)})}function bm(e){var t=e.memoizedState;if(t!==null)return t;t={memoizedState:Vn,baseState:Vn,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:na,lastRenderedState:Vn},next:null};var a={};return t.next={memoizedState:a,baseState:a,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:na,lastRenderedState:a},next:null},e.memoizedState=t,e=e.alternate,e!==null&&(e.memoizedState=t),t}function ym(e){var t=bm(e);t.next===null&&(t=e.alternate.memoizedState),Li(e,t.next.queue,{},nn())}function wu(){return Tt(ni)}function vm(){return ut().memoizedState}function xm(){return ut().memoizedState}function ug(e){for(var t=e.return;t!==null;){switch(t.tag){case 24:case 3:var a=nn();e=va(a);var l=xa(t,e,a);l!==null&&(It(l,t,a),Mi(l,t,a)),t={cache:Ko()},e.payload=t;return}t=t.return}}function cg(e,t,a){var l=nn();a={lane:l,revertLane:0,gesture:null,action:a,hasEagerState:!1,eagerState:null,next:null},tr(e)?jm(t,a):(a=Yo(e,t,a,l),a!==null&&(It(a,e,l),Sm(a,t,l)))}function wm(e,t,a){var l=nn();Li(e,t,a,l)}function Li(e,t,a,l){var i={lane:l,revertLane:0,gesture:null,action:a,hasEagerState:!1,eagerState:null,next:null};if(tr(e))jm(t,i);else{var r=e.alternate;if(e.lanes===0&&(r===null||r.lanes===0)&&(r=t.lastRenderedReducer,r!==null))try{var m=t.lastRenderedState,h=r(m,a);if(i.hasEagerState=!0,i.eagerState=h,Jt(h,m))return Rs(e,t,i,0),Ze===null&&Os(),!1}catch{}if(a=Yo(e,t,i,l),a!==null)return It(a,e,l),Sm(a,t,l),!0}return!1}function ju(e,t,a,l){if(l={lane:2,revertLane:mc(),gesture:null,action:l,hasEagerState:!1,eagerState:null,next:null},tr(e)){if(t)throw Error(c(479))}else t=Yo(e,a,l,2),t!==null&&It(t,e,2)}function tr(e){var t=e.alternate;return e===ye||t!==null&&t===ye}function jm(e,t){ql=Zs=!0;var a=e.pending;a===null?t.next=t:(t.next=a.next,a.next=t),e.pending=t}function Sm(e,t,a){if((a&4194048)!==0){var l=t.lanes;l&=e.pendingLanes,a|=l,t.lanes=a,Sd(e,a)}}var nr={readContext:Tt,use:Js,useCallback:at,useContext:at,useEffect:at,useImperativeHandle:at,useLayoutEffect:at,useInsertionEffect:at,useMemo:at,useReducer:at,useRef:at,useState:at,useDebugValue:at,useDeferredValue:at,useTransition:at,useSyncExternalStore:at,useId:at,useHostTransitionStatus:at,useFormState:at,useActionState:at,useOptimistic:at,useMemoCache:at,useCacheRefresh:at,useEffectEvent:at},Tm={readContext:Tt,use:Js,useCallback:function(e,t){return Dt().memoizedState=[e,t===void 0?null:t],e},useContext:Tt,useEffect:om,useImperativeHandle:function(e,t,a){a=a!=null?a.concat([e]):null,Fs(4194308,4,fm.bind(null,t,e),a)},useLayoutEffect:function(e,t){return Fs(4194308,4,e,t)},useInsertionEffect:function(e,t){Fs(4,2,e,t)},useMemo:function(e,t){var a=Dt();t=t===void 0?null:t;var l=e();if(al){da(!0);try{e()}finally{da(!1)}}return a.memoizedState=[l,t],l},useReducer:function(e,t,a){var l=Dt();if(a!==void 0){var i=a(t);if(al){da(!0);try{a(t)}finally{da(!1)}}}else i=t;return l.memoizedState=l.baseState=i,e={pending:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:i},l.queue=e,e=e.dispatch=cg.bind(null,ye,e),[l.memoizedState,e]},useRef:function(e){var t=Dt();return e={current:e},t.memoizedState=e},useState:function(e){e=_u(e);var t=e.queue,a=wm.bind(null,ye,t);return t.dispatch=a,[e.memoizedState,a]},useDebugValue:yu,useDeferredValue:function(e,t){var a=Dt();return vu(a,e,t)},useTransition:function(){var e=_u(!1);return e=gm.bind(null,ye,e.queue,!0,!1),Dt().memoizedState=e,[!1,e]},useSyncExternalStore:function(e,t,a){var l=ye,i=Dt();if(Ne){if(a===void 0)throw Error(c(407));a=a()}else{if(a=t(),Ze===null)throw Error(c(349));(Oe&127)!==0||If(l,t,a)}i.memoizedState=a;var r={value:a,getSnapshot:t};return i.queue=r,om(Zf.bind(null,l,r,e),[e]),l.flags|=2048,$l(9,{destroy:void 0},Qf.bind(null,l,r,a,t),null),a},useId:function(){var e=Dt(),t=Ze.identifierPrefix;if(Ne){var a=On,l=Cn;a=(l&~(1<<32-Pt(l)-1)).toString(32)+a,t="_"+t+"R_"+a,a=Ps++,0<a&&(t+="H"+a.toString(32)),t+="_"}else a=ag++,t="_"+t+"r_"+a.toString(32)+"_";return e.memoizedState=t},useHostTransitionStatus:wu,useFormState:am,useActionState:am,useOptimistic:function(e){var t=Dt();t.memoizedState=t.baseState=e;var a={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return t.queue=a,t=ju.bind(null,ye,!0,a),a.dispatch=t,[e,t]},useMemoCache:mu,useCacheRefresh:function(){return Dt().memoizedState=ug.bind(null,ye)},useEffectEvent:function(e){var t=Dt(),a={impl:e};return t.memoizedState=a,function(){if((He&2)!==0)throw Error(c(440));return a.impl.apply(void 0,arguments)}}},Nm={readContext:Tt,use:Js,useCallback:pm,useContext:Tt,useEffect:bu,useImperativeHandle:mm,useInsertionEffect:cm,useLayoutEffect:dm,useMemo:hm,useReducer:Ws,useRef:rm,useState:function(){return Ws(na)},useDebugValue:yu,useDeferredValue:function(e,t){var a=ut();return _m(a,Qe.memoizedState,e,t)},useTransition:function(){var e=Ws(na)[0],t=ut().memoizedState;return[typeof e=="boolean"?e:Ui(e),t]},useSyncExternalStore:Vf,useId:vm,useHostTransitionStatus:wu,useFormState:lm,useActionState:lm,useOptimistic:function(e,t){var a=ut();return Jf(a,Qe,e,t)},useMemoCache:mu,useCacheRefresh:xm,useEffectEvent:um},dg={readContext:Tt,use:Js,useCallback:pm,useContext:Tt,useEffect:bu,useImperativeHandle:mm,useInsertionEffect:cm,useLayoutEffect:dm,useMemo:hm,useReducer:hu,useRef:rm,useState:function(){return hu(na)},useDebugValue:yu,useDeferredValue:function(e,t){var a=ut();return Qe===null?vu(a,e,t):_m(a,Qe.memoizedState,e,t)},useTransition:function(){var e=hu(na)[0],t=ut().memoizedState;return[typeof e=="boolean"?e:Ui(e),t]},useSyncExternalStore:Vf,useId:vm,useHostTransitionStatus:wu,useFormState:sm,useActionState:sm,useOptimistic:function(e,t){var a=ut();return Qe!==null?Jf(a,Qe,e,t):(a.baseState=e,[e,a.queue.dispatch])},useMemoCache:mu,useCacheRefresh:xm,useEffectEvent:um};function Su(e,t,a,l){t=e.memoizedState,a=a(l,t),a=a==null?t:Q({},t,a),e.memoizedState=a,e.lanes===0&&(e.updateQueue.baseState=a)}var Tu={enqueueSetState:function(e,t,a){e=e._reactInternals;var l=nn(),i=va(l);i.payload=t,a!=null&&(i.callback=a),t=xa(e,i,l),t!==null&&(It(t,e,l),Mi(t,e,l))},enqueueReplaceState:function(e,t,a){e=e._reactInternals;var l=nn(),i=va(l);i.tag=1,i.payload=t,a!=null&&(i.callback=a),t=xa(e,i,l),t!==null&&(It(t,e,l),Mi(t,e,l))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var a=nn(),l=va(a);l.tag=2,t!=null&&(l.callback=t),t=xa(e,l,a),t!==null&&(It(t,e,a),Mi(t,e,a))}};function km(e,t,a,l,i,r,m){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(l,r,m):t.prototype&&t.prototype.isPureReactComponent?!Ti(a,l)||!Ti(i,r):!0}function Em(e,t,a,l){e=t.state,typeof t.componentWillReceiveProps=="function"&&t.componentWillReceiveProps(a,l),typeof t.UNSAFE_componentWillReceiveProps=="function"&&t.UNSAFE_componentWillReceiveProps(a,l),t.state!==e&&Tu.enqueueReplaceState(t,t.state,null)}function ll(e,t){var a=t;if("ref"in t){a={};for(var l in t)l!=="ref"&&(a[l]=t[l])}if(e=e.defaultProps){a===t&&(a=Q({},a));for(var i in e)a[i]===void 0&&(a[i]=e[i])}return a}function Am(e){Cs(e)}function Cm(e){console.error(e)}function Om(e){Cs(e)}function ar(e,t){try{var a=e.onUncaughtError;a(t.value,{componentStack:t.stack})}catch(l){setTimeout(function(){throw l})}}function Rm(e,t,a){try{var l=e.onCaughtError;l(a.value,{componentStack:a.stack,errorBoundary:t.tag===1?t.stateNode:null})}catch(i){setTimeout(function(){throw i})}}function Nu(e,t,a){return a=va(a),a.tag=3,a.payload={element:null},a.callback=function(){ar(e,t)},a}function Mm(e){return e=va(e),e.tag=3,e}function zm(e,t,a,l){var i=a.type.getDerivedStateFromError;if(typeof i=="function"){var r=l.value;e.payload=function(){return i(r)},e.callback=function(){Rm(t,a,l)}}var m=a.stateNode;m!==null&&typeof m.componentDidCatch=="function"&&(e.callback=function(){Rm(t,a,l),typeof i!="function"&&(Aa===null?Aa=new Set([this]):Aa.add(this));var h=l.stack;this.componentDidCatch(l.value,{componentStack:h!==null?h:""})})}function fg(e,t,a,l,i){if(a.flags|=32768,l!==null&&typeof l=="object"&&typeof l.then=="function"){if(t=a.alternate,t!==null&&Ka(t,a,i,!0),a=Nt.current,a!==null){switch(a.tag){case 31:case 13:case 19:return Rt===null?Sr():a.alternate===null&&lt===0&&(lt=3),a.flags&=-257,a.flags|=65536,a.lanes=i,l===Gs?a.flags|=16384:(t=a.updateQueue,t===null?a.updateQueue=new Set([l]):t.add(l),cc(e,l,i)),!1;case 22:return a.flags|=65536,l===Gs?a.flags|=16384:(t=a.updateQueue,t===null?(t={transitions:null,markerInstances:null,retryQueue:new Set([l])},a.updateQueue=t):(a=t.retryQueue,a===null?t.retryQueue=new Set([l]):a.add(l)),cc(e,l,i)),!1}throw Error(c(435,a.tag))}return cc(e,l,i),Sr(),!1}if(Ne)return t=Nt.current,t!==null?((t.flags&65536)===0&&(t.flags|=256),t.flags|=65536,t.lanes=i,l!==Io&&(e=Error(c(422),{cause:l}),Ei(dn(e,a)))):(l!==Io&&(t=Error(c(423),{cause:l}),Ei(dn(t,a))),e=e.current.alternate,e.flags|=65536,i&=-i,e.lanes|=i,l=dn(l,a),i=Nu(e.stateNode,l,i),nu(e,i),lt!==4&&(lt=2)),!1;var r=Error(c(520),{cause:l});if(r=dn(r,a),Qi===null?Qi=[r]:Qi.push(r),lt!==4&&(lt=2),t===null)return!0;l=dn(l,a),a=t;do{switch(a.tag){case 3:return a.flags|=65536,e=i&-i,a.lanes|=e,e=Nu(a.stateNode,l,e),nu(a,e),!1;case 1:if(t=a.type,r=a.stateNode,(a.flags&128)===0&&(typeof t.getDerivedStateFromError=="function"||r!==null&&typeof r.componentDidCatch=="function"&&(Aa===null||!Aa.has(r))))return a.flags|=65536,i&=-i,a.lanes|=i,i=Mm(i),zm(i,e,a,l),nu(a,i),!1;break;case 22:if(a.memoizedState!==null)return a.flags|=65536,!1}a=a.return}while(a!==null);return!1}var ku=Error(c(461)),mt=!1;function ht(e,t,a,l){t.child=e===null?Uf(t,null,a,l):nl(t,e.child,a,l)}function qm(e,t,a,l,i){a=a.render;var r=t.ref;if("ref"in l){var m={};for(var h in l)h!=="ref"&&(m[h]=l[h])}else m=l;return Ja(t),l=uu(e,t,a,m,r,i),h=cu(),e!==null&&!mt?(du(e,t,i),aa(e,t,i)):(Ne&&h&&Ds(t),t.flags|=1,ht(e,t,l,i),t.child)}function Dm(e,t,a,l,i){if(e===null){var r=a.type;return typeof r=="function"&&!Bo(r)&&r.defaultProps===void 0&&a.compare===null?(t.tag=15,t.type=r,$m(e,t,r,l,i)):(e=zs(a.type,null,l,t,t.mode,i),e.ref=t.ref,e.return=t,t.child=e)}if(r=e.child,!qu(e,i)){var m=r.memoizedProps;if(a=a.compare,a=a!==null?a:Ti,a(m,l)&&e.ref===t.ref)return aa(e,t,i)}return t.flags|=1,e=Jn(r,l),e.ref=t.ref,e.return=t,t.child=e}function $m(e,t,a,l,i){if(e!==null){var r=e.memoizedProps;if(Ti(r,l)&&e.ref===t.ref)if(mt=!1,t.pendingProps=l=r,qu(e,i))(e.flags&131072)!==0&&(mt=!0);else return t.lanes=e.lanes,aa(e,t,i)}return Eu(e,t,a,l,i)}function Um(e,t,a,l){var i=l.children,r=e!==null?e.memoizedState:null;if(e===null&&t.stateNode===null&&(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),l.mode==="hidden"){if((t.flags&128)!==0){if(r=r!==null?r.baseLanes|a:a,e!==null){for(l=t.child=e.child,i=0;l!==null;)i=i|l.lanes|l.childLanes,l=l.sibling;l=i&~r}else l=0,t.child=null;return Lm(e,t,r,a,l)}if((a&536870912)!==0)t.memoizedState={baseLanes:0,cachePool:null},e!==null&&Ys(t,r!==null?r.cachePool:null),r!==null?Yf(t,r):lu(),Bf(t);else return l=t.lanes=536870912,Lm(e,t,r!==null?r.baseLanes|a:a,a,l)}else r!==null?(Ys(t,r.cachePool),Yf(t,r),Sa(),t.memoizedState=null):(e!==null&&Ys(t,null),lu(),Sa());return ht(e,t,i,a),t.child}function Hi(e,t){return e!==null&&e.tag===22||t.stateNode!==null||(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),t.sibling}function Lm(e,t,a,l,i){var r=Wo();return r=r===null?null:{parent:dt._currentValue,pool:r},t.memoizedState={baseLanes:a,cachePool:r},e!==null&&Ys(t,null),lu(),Bf(t),e!==null&&Ka(e,t,l,!0),t.childLanes=i,null}function lr(e,t){return t=ir({mode:t.mode,children:t.children},e.mode),t.ref=e.ref,e.child=t,t.return=e,t}function Hm(e,t,a){return nl(t,e.child,null,a),e=lr(t,t.pendingProps),e.flags|=2,Wt(t),t.memoizedState=null,e}function mg(e,t,a){var l=t.pendingProps,i=(t.flags&128)!==0;if(t.flags&=-129,e===null){if(Ne){if(l.mode==="hidden")return e=lr(t,l),t.lanes=536870912,e.memoizedState={baseLanes:0,cachePool:null},Hi(null,e);if(su(t),(e=Ke)?(e=fp(e,pn),e=e!==null&&e.data==="&"?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:pa!==null?{id:Cn,overflow:On}:null,retryLane:536870912,hydrationErrors:null},a=jf(e),a.return=t,t.child=a,bt=t,Ke=null)):e=null,e===null)throw _a(t);return t.lanes=536870912,null}return lr(t,l)}var r=e.memoizedState;if(r!==null){var m=r.dehydrated;if(su(t),i)if(t.flags&256)t.flags&=-257,t=Hm(e,t,a);else if(t.memoizedState!==null)t.child=e.child,t.flags|=128,t=null;else throw Error(c(558));else if(mt||Ka(e,t,a,!1),i=(a&e.childLanes)!==0,mt||i){if(wa.current===null){if(l=Ze,l!==null&&(m=Td(l,a),m!==0&&m!==r.retryLane))throw r.retryLane=m,Ia(e,m),It(l,e,m),ku;Sr()}t=Hm(e,t,a)}else e=r.treeContext,Ke=_n(m.nextSibling),bt=t,Ne=!0,ha=null,pn=!1,e!==null&&Nf(t,e),t=lr(t,l),t.flags|=134221824;return t}return e=Jn(e.child,{mode:l.mode,children:l.children}),e.ref=t.ref,t.child=e,e.return=t,e}function Ul(e,t){var a=t.ref;if(a===null)e!==null&&e.ref!==null&&(t.flags|=4194816);else{if(typeof a!="function"&&typeof a!="object")throw Error(c(284));(e===null||e.ref!==a)&&(t.flags|=4194816)}}function Eu(e,t,a,l,i){return Ja(t),a=uu(e,t,a,l,void 0,i),l=cu(),e!==null&&!mt?(du(e,t,i),aa(e,t,i)):(Ne&&l&&Ds(t),t.flags|=1,ht(e,t,a,i),t.child)}function Ym(e,t,a,l,i,r){return Ja(t),t.updateQueue=null,a=Xf(t,l,a,i),Gf(e),l=cu(),e!==null&&!mt?(du(e,t,r),aa(e,t,r)):(Ne&&l&&Ds(t),t.flags|=1,ht(e,t,a,r),t.child)}function Bm(e,t,a,l,i){if(Ja(t),t.stateNode===null){var r=El,m=a.contextType;typeof m=="object"&&m!==null&&(r=Tt(m)),r=new a(l,r),t.memoizedState=r.state!==null&&r.state!==void 0?r.state:null,r.updater=Tu,t.stateNode=r,r._reactInternals=t,r=t.stateNode,r.props=l,r.state=t.memoizedState,r.refs={},eu(t),m=a.contextType,r.context=typeof m=="object"&&m!==null?Tt(m):El,r.state=t.memoizedState,m=a.getDerivedStateFromProps,typeof m=="function"&&(Su(t,a,m,l),r.state=t.memoizedState),typeof a.getDerivedStateFromProps=="function"||typeof r.getSnapshotBeforeUpdate=="function"||typeof r.UNSAFE_componentWillMount!="function"&&typeof r.componentWillMount!="function"||(m=r.state,typeof r.componentWillMount=="function"&&r.componentWillMount(),typeof r.UNSAFE_componentWillMount=="function"&&r.UNSAFE_componentWillMount(),m!==r.state&&Tu.enqueueReplaceState(r,r.state,null),qi(t,l,r,i),zi(),r.state=t.memoizedState),typeof r.componentDidMount=="function"&&(t.flags|=4194308),l=!0}else if(e===null){r=t.stateNode;var h=t.memoizedProps,x=ll(a,h);r.props=x;var E=r.context,O=a.contextType;m=El,typeof O=="object"&&O!==null&&(m=Tt(O));var z=a.getDerivedStateFromProps;O=typeof z=="function"||typeof r.getSnapshotBeforeUpdate=="function",h=t.pendingProps!==h,O||typeof r.UNSAFE_componentWillReceiveProps!="function"&&typeof r.componentWillReceiveProps!="function"||(h||E!==m)&&Em(t,r,l,m),ya=!1;var T=t.memoizedState;r.state=T,qi(t,l,r,i),zi(),E=t.memoizedState,h||T!==E||ya?(typeof z=="function"&&(Su(t,a,z,l),E=t.memoizedState),(x=ya||km(t,a,x,l,T,E,m))?(O||typeof r.UNSAFE_componentWillMount!="function"&&typeof r.componentWillMount!="function"||(typeof r.componentWillMount=="function"&&r.componentWillMount(),typeof r.UNSAFE_componentWillMount=="function"&&r.UNSAFE_componentWillMount()),typeof r.componentDidMount=="function"&&(t.flags|=4194308)):(typeof r.componentDidMount=="function"&&(t.flags|=4194308),t.memoizedProps=l,t.memoizedState=E),r.props=l,r.state=E,r.context=m,l=x):(typeof r.componentDidMount=="function"&&(t.flags|=4194308),l=!1)}else{r=t.stateNode,tu(e,t),m=t.memoizedProps,O=ll(a,m),r.props=O,z=t.pendingProps,T=r.context,E=a.contextType,x=El,typeof E=="object"&&E!==null&&(x=Tt(E)),h=a.getDerivedStateFromProps,(E=typeof h=="function"||typeof r.getSnapshotBeforeUpdate=="function")||typeof r.UNSAFE_componentWillReceiveProps!="function"&&typeof r.componentWillReceiveProps!="function"||(m!==z||T!==x)&&Em(t,r,l,x),ya=!1,T=t.memoizedState,r.state=T,qi(t,l,r,i),zi();var C=t.memoizedState;m!==z||T!==C||ya||e!==null&&e.dependencies!==null&&Ls(e.dependencies)?(typeof h=="function"&&(Su(t,a,h,l),C=t.memoizedState),(O=ya||km(t,a,O,l,T,C,x)||e!==null&&e.dependencies!==null&&Ls(e.dependencies))?(E||typeof r.UNSAFE_componentWillUpdate!="function"&&typeof r.componentWillUpdate!="function"||(typeof r.componentWillUpdate=="function"&&r.componentWillUpdate(l,C,x),typeof r.UNSAFE_componentWillUpdate=="function"&&r.UNSAFE_componentWillUpdate(l,C,x)),typeof r.componentDidUpdate=="function"&&(t.flags|=4),typeof r.getSnapshotBeforeUpdate=="function"&&(t.flags|=1024)):(typeof r.componentDidUpdate!="function"||m===e.memoizedProps&&T===e.memoizedState||(t.flags|=4),typeof r.getSnapshotBeforeUpdate!="function"||m===e.memoizedProps&&T===e.memoizedState||(t.flags|=1024),t.memoizedProps=l,t.memoizedState=C),r.props=l,r.state=C,r.context=x,l=O):(typeof r.componentDidUpdate!="function"||m===e.memoizedProps&&T===e.memoizedState||(t.flags|=4),typeof r.getSnapshotBeforeUpdate!="function"||m===e.memoizedProps&&T===e.memoizedState||(t.flags|=1024),l=!1)}return r=l,Ul(e,t),l=(t.flags&128)!==0,r||l?(r=t.stateNode,a=l&&typeof a.getDerivedStateFromError!="function"?null:r.render(),t.flags|=1,e!==null&&l?(t.child=nl(t,e.child,null,i),t.child=nl(t,null,a,i)):ht(e,t,a,i),t.memoizedState=r.state,e=t.child):e=aa(e,t,i),e}function Gm(e,t,a,l){return Za(),t.flags|=256,ht(e,t,a,l),t.child}var Au={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function Cu(e){return{baseLanes:e,cachePool:Rf()}}function Ou(e,t,a){return e=e!==null?e.childLanes&~a:0,t&&(e|=tn),e}function Xm(e,t,a){var l=t.pendingProps,i=!1,r=(t.flags&128)!==0,m;if((m=r)||(m=e!==null&&e.memoizedState===null?!1:(kt.current&2)!==0),m&&(i=!0,t.flags&=-129),m=(t.flags&32)!==0,t.flags&=-33,e===null){if(Ne){if(i?ja(t):Sa(),(e=Ke)?(e=fp(e,pn),e=e!==null&&e.data!=="&"?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:pa!==null?{id:Cn,overflow:On}:null,retryLane:536870912,hydrationErrors:null},a=jf(e),a.return=t,t.child=a,bt=t,Ke=null)):e=null,e===null)throw _a(t);return Cc(e)?t.lanes=32:t.lanes=536870912,null}return r=l.children,l=l.fallback,i?(Sa(),i=t.mode,r=ir({mode:"hidden",children:r},i),l=Qa(l,i,a,null),r.return=t,l.return=t,r.sibling=l,t.child=r,l=t.child,l.memoizedState=Cu(a),l.childLanes=Ou(e,m,a),t.memoizedState=Au,Hi(null,l)):(ja(t),Ru(t,r))}var h=e.memoizedState;if(h!==null){var x=h.dehydrated;if(x!==null)return pg(e,t,r,m,l,x,h,a)}return i?(Sa(),i=l.fallback,r=t.mode,h=e.child,x=h.sibling,l=Jn(h,{mode:"hidden",children:l.children}),l.subtreeFlags=h.subtreeFlags&1206910976,x!==null?i=Jn(x,i):(i=Qa(i,r,a,null),i.flags|=2),i.return=t,l.return=t,l.sibling=i,t.child=l,Hi(null,l),l=t.child,i=e.child.memoizedState,i===null?i=Cu(a):(r=i.cachePool,r!==null?(h=dt._currentValue,r=r.parent!==h?{parent:h,pool:h}:r):r=Rf(),i={baseLanes:i.baseLanes|a,cachePool:r}),l.memoizedState=i,l.childLanes=Ou(e,m,a),t.memoizedState=Au,Hi(e.child,l)):(ja(t),a=e.child,e=a.sibling,a=Jn(a,{mode:"visible",children:l.children}),a.return=t,a.sibling=null,e!==null&&(m=t.deletions,m===null?(t.deletions=[e],t.flags|=16):m.push(e)),t.child=a,t.memoizedState=null,a)}function Ru(e,t){return t=ir({mode:"visible",children:t},e.mode),t.return=e,e.child=t}function ir(e,t){return e=Bt(22,e,null,t),e.lanes=0,e}function sr(e,t,a){return nl(t,e.child,null,a),e=Ru(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function pg(e,t,a,l,i,r,m,h){if(a)return t.flags&256?(ja(t),t.flags&=-257,sr(e,t,h)):t.memoizedState!==null?(Sa(),t.child=e.child,t.flags|=128,null):(Sa(),r=i.fallback,m=t.mode,i=ir({mode:"visible",children:i.children},m),r=Qa(r,m,h,null),r.flags|=2,i.return=t,r.return=t,i.sibling=r,t.child=i,nl(t,e.child,null,h),i=t.child,i.memoizedState=Cu(h),i.childLanes=Ou(e,l,h),t.memoizedState=Au,Hi(null,i));if(ja(t),Cc(r)){if(l=r.nextSibling&&r.nextSibling.dataset,l)var x=l.dgst;return l=x,l!==""&&(i=Error(c(419)),i.stack="",i.digest=l,Ei({value:i,source:null,stack:null})),sr(e,t,h)}if(mt||Ka(e,t,h,!1),l=(h&e.childLanes)!==0,mt||l){if(wa.current!==null)return sr(e,t,h);if(l=Ze,l!==null&&(i=Td(l,h),i!==0&&i!==m.retryLane))throw m.retryLane=i,Ia(e,i),It(l,e,i),ku;return Ac(r)||Sr(),sr(e,t,h)}return Ac(r)?(t.flags|=192,t.child=e.child,null):(e=m.treeContext,Ke=_n(r.nextSibling),bt=t,Ne=!0,ha=null,pn=!1,e!==null&&Nf(t,e),t=Ru(t,i.children),t.flags|=134221824,t)}function Vm(e,t,a){e.lanes|=t;var l=e.alternate;l!==null&&(l.lanes|=t),Us(e.return,t,a)}function Im(e){for(var t=null;e!==null;){var a=e.alternate;a!==null&&Qs(a)===null&&(t=e),e=e.sibling}return t}function rr(e,t,a,l,i,r){var m=e.memoizedState;m===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:l,tail:a,tailMode:i,treeForkCount:r}:(m.isBackwards=t,m.rendering=null,m.renderingStartTime=0,m.last=l,m.tail=a,m.tailMode=i,m.treeForkCount=r)}function Mu(e){var t=e.child;for(e.child=null;t!==null;){var a=t.sibling;t.sibling=e.child,e.child=t,t=a}}function zu(e,t,a){var l=t.pendingProps,i=l.revealOrder,r=l.tail;l=l.children;var m=kt.current;if(t.flags&128)return Di(t,m),null;var h=(m&2)!==0;if(h?(m=m&1|2,t.flags|=128):m&=1,Di(t,m),i==="backwards"&&e!==null?(Mu(e),ht(e,t,l,a),Mu(e)):ht(e,t,l,a),l=Ne?ki:0,!h&&e!==null&&(e.flags&128)!==0)e:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&Vm(e,a,t);else if(e.tag===19)Vm(e,a,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break e;for(;e.sibling===null;){if(e.return===null||e.return===t)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}switch(i){case"backwards":a=Im(t.child),a===null?(i=t.child,t.child=null):(i=a.sibling,a.sibling=null,Mu(t)),rr(t,!0,i,null,r,l);break;case"unstable_legacy-backwards":for(a=null,i=t.child,t.child=null;i!==null;){if(e=i.alternate,e!==null&&Qs(e)===null){t.child=i;break}e=i.sibling,i.sibling=a,a=i,i=e}rr(t,!0,a,null,r,l);break;case"together":rr(t,!1,null,null,void 0,l);break;case"independent":t.memoizedState=null;break;default:a=Im(t.child),a===null?(i=t.child,t.child=null):(i=a.sibling,a.sibling=null),rr(t,!1,i,a,r,l)}return t.child}function Qm(e,t,a){var l=t.pendingProps;return ga(t,t.type,l.value),ht(e,t,l.children,a),t.child}function aa(e,t,a){if(e!==null&&(t.dependencies=e.dependencies),Ea|=t.lanes,(a&t.childLanes)===0)if(e!==null){if(Ka(e,t,a,!1),(a&t.childLanes)===0)return null}else return null;if(e!==null&&t.child!==e.child)throw Error(c(153));if(t.child!==null){for(e=t.child,a=Jn(e,e.pendingProps),t.child=a,a.return=t;e.sibling!==null;)e=e.sibling,a=a.sibling=Jn(e,e.pendingProps),a.return=t;a.sibling=null}return t.child}function qu(e,t){return(e.lanes&t)!==0?!0:(e=e.dependencies,!!(e!==null&&Ls(e)))}function hg(e,t,a){switch(t.tag){case 3:fs(t,t.stateNode.containerInfo),ga(t,dt,e.memoizedState.cache),Za();break;case 27:case 5:ro(t);break;case 4:fs(t,t.stateNode.containerInfo);break;case 10:ga(t,t.type,t.memoizedProps.value);break;case 31:if(t.memoizedState!==null)return t.flags|=128,su(t),null;break;case 13:var l=t.memoizedState;if(l!==null){if(l.dehydrated!==null)return ja(t),t.flags|=128,null;l=Ka(e,t,a,!1);var i=t.child.childLanes;return l||(a&i)!==0?Xm(e,t,a):(ja(t),e=aa(e,t,a),e!==null?e.sibling:null)}ja(t);break;case 19:if(t.flags&128)return zu(e,t,a);if(i=(e.flags&128)!==0,l=(a&t.childLanes)!==0,l||(Ka(e,t,a,!1),l=(a&t.childLanes)!==0),i){if(l)return zu(e,t,a);t.flags|=128}if(i=t.memoizedState,i!==null&&(i.rendering=null,i.tail=null,i.lastEffect=null),Di(t,kt.current),l)break;return null;case 22:return t.lanes=0,Um(e,t,a,t.pendingProps);case 24:ga(t,dt,e.memoizedState.cache)}return aa(e,t,a)}function Zm(e,t,a){if(e!==null)if(e.memoizedProps!==t.pendingProps)mt=!0;else{if(!qu(e,a)&&(t.flags&128)===0)return mt=!1,hg(e,t,a);mt=(e.flags&131072)!==0}else mt=!1,Ne&&(t.flags&1048576)!==0&&Tf(t,ki,t.index);switch(t.lanes=0,t.tag){case 16:e:{var l=t.pendingProps;if(e=el(t.elementType),t.type=e,typeof e=="function")Bo(e)?(l=ll(e,l),t.tag=1,t=Bm(null,t,e,l,a)):(t.tag=0,t=Eu(null,t,e,l,a));else{if(e!=null){var i=e.$$typeof;if(i===X){t.tag=11,t=qm(null,t,e,l,a);break e}else if(i===Ge){t.tag=14,t=Dm(null,t,e,l,a);break e}else if(i===te){t.tag=10,t.type=e,t=Qm(null,t,a);break e}}throw t=xe(e)||e,Error(c(306,t,""))}}return t;case 0:return Eu(e,t,t.type,t.pendingProps,a);case 1:return l=t.type,i=ll(l,t.pendingProps),Bm(e,t,l,i,a);case 3:e:{if(fs(t,t.stateNode.containerInfo),e===null)throw Error(c(387));l=t.pendingProps;var r=t.memoizedState;i=r.element,tu(e,t),qi(t,l,null,a);var m=t.memoizedState;if(l=m.cache,ga(t,dt,l),l!==r.cache&&Po(t,[dt],a,!0),zi(),l=m.element,r.isDehydrated)if(r={element:l,isDehydrated:!1,cache:m.cache},t.updateQueue.baseState=r,t.memoizedState=r,t.flags&256){t=Gm(e,t,l,a);break e}else if(l!==i){i=dn(Error(c(424)),t),Ei(i),t=Gm(e,t,l,a);break e}else for(e=t.stateNode.containerInfo,e.nodeType===9?e=e.body:e=e.nodeName==="HTML"?e.ownerDocument.body:e,Ke=_n(e.firstChild),bt=t,Ne=!0,ha=null,pn=!0,a=Uf(t,null,l,a),t.child=a;a;)a.flags=a.flags&-3|134221824,a=a.sibling;else{if(Za(),l===i){t=aa(e,t,a);break e}ht(e,t,l,a)}t=t.child}return t;case 26:return Ul(e,t),e===null?(a=yp(t.type,null,t.pendingProps,null))?t.memoizedState=a:Ne||(t.stateNode=W0(t.type,t.pendingProps,ua.current,t)):t.memoizedState=yp(t.type,e.memoizedProps,t.pendingProps,e.memoizedState),null;case 27:return ro(t),e===null&&Ne&&(l=t.stateNode=hp(t.type,t.pendingProps,ua.current),bt=t,pn=!0,i=Ke,Ra(t.type)?(Oc=i,Ke=_n(l.firstChild)):Ke=i),ht(e,t,t.pendingProps.children,a),Ul(e,t),e===null&&(t.flags|=4194304),t.child;case 5:return e===null&&Ne&&((i=l=Ke)&&(l=ub(l,t.type,t.pendingProps,pn),l!==null?(t.stateNode=l,bt=t,Ke=_n(l.firstChild),pn=!1,i=!0):i=!1),i||_a(t)),ro(t),i=t.type,r=t.pendingProps,m=e!==null?e.memoizedProps:null,l=r.children,wc(i,r)?l=null:m!==null&&wc(i,m)&&(t.flags|=32),t.memoizedState!==null&&(i=uu(e,t,lg,null,null,a),ni._currentValue=i),Ul(e,t),ht(e,t,l,a),t.child;case 6:return e===null&&Ne&&((e=a=Ke)&&(a=cb(a,t.pendingProps,pn),a!==null?(t.stateNode=a,bt=t,Ke=null,e=!0):e=!1),e||_a(t)),null;case 13:return Xm(e,t,a);case 4:return fs(t,t.stateNode.containerInfo),l=t.pendingProps,e===null?t.child=nl(t,null,l,a):ht(e,t,l,a),t.child;case 11:return qm(e,t,t.type,t.pendingProps,a);case 7:return l=t.pendingProps,Ul(e,t),ht(e,t,l,a),t.child;case 8:return ht(e,t,t.pendingProps.children,a),t.child;case 12:return ht(e,t,t.pendingProps.children,a),t.child;case 10:return Qm(e,t,a);case 9:return i=t.type._context,l=t.pendingProps.children,Ja(t),i=Tt(i),l=l(i),t.flags|=1,ht(e,t,l,a),t.child;case 14:return Dm(e,t,t.type,t.pendingProps,a);case 15:return $m(e,t,t.type,t.pendingProps,a);case 19:return zu(e,t,a);case 31:return mg(e,t,a);case 22:return Um(e,t,a,t.pendingProps);case 24:return Ja(t),l=Tt(dt),e===null?(i=Wo(),i===null&&(i=Ze,r=Ko(),i.pooledCache=r,r.refCount++,r!==null&&(i.pooledCacheLanes|=a),i=r),t.memoizedState={parent:l,cache:i},eu(t),ga(t,dt,i)):((e.lanes&a)!==0&&(tu(e,t),qi(t,null,null,a),zi()),i=e.memoizedState,r=t.memoizedState,i.parent!==l?(i={parent:l,cache:l},t.memoizedState=i,t.lanes===0&&(t.memoizedState=t.updateQueue.baseState=i),ga(t,dt,l)):(l=r.cache,ga(t,dt,l),l!==i.cache&&Po(t,[dt],a,!0))),ht(e,t,t.pendingProps.children,a),t.child;case 30:return t.stateNode===null&&(t.stateNode={autoName:null,paired:null,clones:null,ref:null}),l=t.pendingProps,l.name!=null&&l.name!=="auto"?t.flags|=e===null?18882560:18874368:Ne&&Ds(t),e!==null&&e.memoizedProps.name!==l.name?t.flags|=4194816:Ul(e,t),ht(e,t,l.children,a),t.child;case 29:throw t.pendingProps}throw Error(c(156,t.tag))}function la(e){e.flags|=4}function Du(e,t,a,l,i){var r;if((r=(e.mode&32)!==0)&&(r=a===null?jp(t,l):jp(t,l)&&(l.src!==a.src||l.srcSet!==a.srcSet)),r){if(e.flags|=16777216,(i&335544128)===i)if(e.stateNode.complete)e.flags|=8192;else if(A0())e.flags|=8192;else throw tl=Gs,Fo}else e.flags&=-16777217}function Pm(e,t){if(t.type!=="stylesheet"||(t.state.loading&4)!==0)e.flags&=-16777217;else if(e.flags|=16777216,!Sp(t))if(A0())e.flags|=8192;else throw tl=Gs,Fo}function or(e,t){t!==null&&(e.flags|=4),e.flags&16384&&(t=e.tag!==22?wd():536870912,e.lanes|=t,Gl|=t)}function Yi(e,t){if(!Ne)switch(e.tailMode){case"visible":break;case"collapsed":for(var a=e.tail,l=null;a!==null;)a.alternate!==null&&(l=a),a=a.sibling;l===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:l.sibling=null;break;default:for(t=e.tail,a=null;t!==null;)t.alternate!==null&&(a=t),t=t.sibling;a===null?e.tail=null:a.sibling=null}}function Je(e){var t=e.alternate!==null&&e.alternate.child===e.child,a=0,l=0;if(t)for(var i=e.child;i!==null;)a|=i.lanes|i.childLanes,l|=i.subtreeFlags&1206910976,l|=i.flags&1206910976,i.return=e,i=i.sibling;else for(i=e.child;i!==null;)a|=i.lanes|i.childLanes,l|=i.subtreeFlags,l|=i.flags,i.return=e,i=i.sibling;return e.subtreeFlags|=l,e.childLanes=a,t}function _g(e,t,a){var l=t.pendingProps;switch(Vo(t),t.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return Je(t),null;case 1:return Je(t),null;case 3:return a=t.stateNode,l=null,e!==null&&(l=e.memoizedState.cache),t.memoizedState.cache!==l&&(t.flags|=2048),ea(dt),hl(),a.pendingContext&&(a.context=a.pendingContext,a.pendingContext=null),(e===null||e.child===null)&&(Ol(t)?la(t):e===null||e.memoizedState.isDehydrated&&(t.flags&256)===0||(t.flags|=1024,Qo())),Je(t),null;case 26:var i=t.type,r=t.memoizedState;return e===null?(la(t),r!==null?(Je(t),Pm(t,r)):(Je(t),Du(t,i,null,l,a))):r?r!==e.memoizedState?(la(t),Je(t),Pm(t,r)):(Je(t),t.flags&=-16777217):(e=e.memoizedProps,e!==l&&la(t),Je(t),Du(t,i,e,l,a)),null;case 27:if(ms(t),a=ua.current,i=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==l&&la(t);else{if(!l){if(t.stateNode===null)throw Error(c(166));return Je(t),t.subtreeFlags&=-33554433,null}e=En.current,Ol(t)?kf(t):(e=hp(i,l,a),t.stateNode=e,la(t))}return Je(t),t.subtreeFlags&=-33554433,null;case 5:if(ms(t),i=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==l&&la(t);else{if(!l){if(t.stateNode===null)throw Error(c(166));return Je(t),t.subtreeFlags&=-33554433,null}if(r=En.current,Ol(t))kf(t);else{var m=Wi(ua.current);switch(r){case 1:r=m.createElementNS("http://www.w3.org/2000/svg",i);break;case 2:r=m.createElementNS("http://www.w3.org/1998/Math/MathML",i);break;default:switch(i){case"svg":r=m.createElementNS("http://www.w3.org/2000/svg",i);break;case"math":r=m.createElementNS("http://www.w3.org/1998/Math/MathML",i);break;case"script":r=m.createElement("div"),r.innerHTML="<script><\/script>",r=r.removeChild(r.firstChild);break;case"select":r=typeof l.is=="string"?m.createElement("select",{is:l.is}):m.createElement("select"),l.multiple?r.multiple=!0:l.size&&(r.size=l.size);break;default:r=typeof l.is=="string"?m.createElement(i,{is:l.is}):m.createElement(i)}}r[St]=t,r[Yt]=l;e:for(m=t.child;m!==null;){if(m.tag===5||m.tag===6)r.appendChild(m.stateNode);else if(m.tag!==4&&m.tag!==27&&m.child!==null){m.child.return=m,m=m.child;continue}if(m===t)break e;for(;m.sibling===null;){if(m.return===null||m.return===t)break e;m=m.return}m.sibling.return=m.return,m=m.sibling}t.stateNode=r;e:switch(At(r,i,l),i){case"button":case"input":case"select":case"textarea":l=!!l.autoFocus;break e;case"img":l=!0;break e;default:l=!1}l&&la(t)}}return Je(t),t.subtreeFlags&=-33554433,Du(t,t.type,e===null?null:e.memoizedProps,t.pendingProps,a),null;case 6:if(e&&t.stateNode!=null)e.memoizedProps!==l&&la(t);else{if(typeof l!="string"&&t.stateNode===null)throw Error(c(166));if(e=ua.current,Ol(t)){if(e=t.stateNode,a=t.memoizedProps,l=null,i=bt,i!==null)switch(i.tag){case 27:case 5:l=i.memoizedProps}e[St]=t,e=!!(e.nodeValue===a||l!==null&&l.suppressHydrationWarning===!0||Z0(e.nodeValue,a)),e||_a(t,!0)}else e=Wi(e).createTextNode(l),e[St]=t,t.stateNode=e}return Je(t),null;case 31:if(a=t.memoizedState,e===null||e.memoizedState!==null){if(l=Ol(t),a!==null){if(e===null){if(!l)throw Error(c(318));if(e=t.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(c(557));e[St]=t}else Za(),(t.flags&128)===0&&(t.memoizedState=null),t.flags|=4;Je(t),e=!1}else a=Qo(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=a),e=!0;if(!e)return t.flags&256?(Wt(t),t):(Wt(t),null);if((t.flags&128)!==0)throw Error(c(558))}return Je(t),null;case 13:if(l=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(i=Ol(t),l!==null&&l.dehydrated!==null){if(e===null){if(!i)throw Error(c(318));if(i=t.memoizedState,i=i!==null?i.dehydrated:null,!i)throw Error(c(317));i[St]=t}else Za(),(t.flags&128)===0&&(t.memoizedState=null),t.flags|=4;Je(t),i=!1}else i=Qo(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=i),i=!0;if(!i)return t.flags&256?(Wt(t),t):(Wt(t),null)}return Wt(t),(t.flags&128)!==0?(t.lanes=a,t):(a=l!==null,e=e!==null&&e.memoizedState!==null,a&&(l=t.child,i=null,l.alternate!==null&&l.alternate.memoizedState!==null&&l.alternate.memoizedState.cachePool!==null&&(i=l.alternate.memoizedState.cachePool.pool),r=null,l.memoizedState!==null&&l.memoizedState.cachePool!==null&&(r=l.memoizedState.cachePool.pool),r!==i&&(l.flags|=2048)),a!==e&&a&&(t.child.flags|=8192),or(t,t.updateQueue),Je(t),null);case 4:return hl(),e===null&&gc(t.stateNode.containerInfo),t.flags|=67108864,Je(t),null;case 10:return ea(t.type),Je(t),null;case 19:if(ru(t),l=t.memoizedState,l===null)return Je(t),null;if(i=(t.flags&128)!==0,r=l.rendering,r===null)if(i)Yi(l,!1);else{if(lt!==0||e!==null&&(e.flags&128)!==0)for(e=t.child;e!==null;){if(r=Qs(e),r!==null){for(t.flags|=128,Yi(l,!1),e=r.updateQueue,t.updateQueue=e,or(t,e),t.subtreeFlags=0,e=a,a=t.child;a!==null;)wf(a,e),a=a.sibling;return Di(t,kt.current&1|2),Ne&&Wn(t,l.treeForkCount),t.child}e=e.sibling}l.tail!==null&&Qt()>vr&&(t.flags|=128,i=!0,Yi(l,!1),t.lanes=4194304)}else{if(!i)if(e=Qs(r),e!==null){if(t.flags|=128,i=!0,e=e.updateQueue,t.updateQueue=e,or(t,e),Yi(l,!0),l.tail===null&&l.tailMode!=="collapsed"&&l.tailMode!=="visible"&&!r.alternate&&!Ne)return Je(t),null}else 2*Qt()-l.renderingStartTime>vr&&a!==536870912&&(t.flags|=128,i=!0,Yi(l,!1),t.lanes=4194304);l.isBackwards?(r.sibling=t.child,t.child=r):(e=l.last,e!==null?e.sibling=r:t.child=r,l.last=r)}if(l.tail!==null){e=l.tail;e:{for(a=e;a!==null;){if(a.alternate!==null){a=!1;break e}a=a.sibling}a=!0}return l.rendering=e,l.tail=e.sibling,l.renderingStartTime=Qt(),e.sibling=null,r=kt.current,r=i?r&1|2:r&1,l.tailMode==="visible"||l.tailMode==="collapsed"||!a||Ne?Di(t,r):(a=r,Pe(Nt,t),Pe(kt,a),Rt===null&&(Rt=t)),Ne&&Wn(t,l.treeForkCount),e}return Je(t),null;case 22:case 23:return Wt(t),iu(),l=t.memoizedState!==null,e!==null?e.memoizedState!==null!==l&&(t.flags|=8192):l&&(t.flags|=8192),l?(a&536870912)!==0&&(t.flags&128)===0&&(Je(t),t.subtreeFlags&6&&(t.flags|=8192)):Je(t),a=t.updateQueue,a!==null&&or(t,a.retryQueue),a=null,e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(a=e.memoizedState.cachePool.pool),l=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(l=t.memoizedState.cachePool.pool),l!==a&&(t.flags|=2048),e!==null&&jt(Fa),null;case 24:return a=null,e!==null&&(a=e.memoizedState.cache),t.memoizedState.cache!==a&&(t.flags|=2048),ea(dt),Je(t),null;case 25:return null;case 30:return t.flags|=33554432,Je(t),null}throw Error(c(156,t.tag))}function gg(e,t){switch(Vo(t),t.tag){case 1:return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return ea(dt),hl(),e=t.flags,(e&65536)!==0&&(e&128)===0?(t.flags=e&-65537|128,t):null;case 26:case 27:case 5:return ms(t),null;case 31:if(t.memoizedState!==null){if(Wt(t),t.alternate===null)throw Error(c(340));Za()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 13:if(Wt(t),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(c(340));Za()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return ru(t),e=t.flags,e&65536?(t.flags=e&-65537|128,e=t.memoizedState,e!==null&&(e.rendering=null,e.tail=null),t.flags|=4,t):null;case 4:return hl(),null;case 10:return ea(t.type),null;case 22:case 23:return Wt(t),iu(),e!==null&&jt(Fa),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 24:return ea(dt),null;case 25:return null;default:return null}}function Km(e,t){switch(Vo(t),t.tag){case 3:ea(dt),hl();break;case 26:case 27:case 5:ms(t);break;case 4:hl();break;case 31:t.memoizedState!==null&&Wt(t);break;case 13:Wt(t);break;case 19:ru(t);break;case 10:ea(t.type);break;case 22:case 23:Wt(t),iu(),e!==null&&jt(Fa);break;case 24:ea(dt)}}function Bi(e,t){try{var a=t.updateQueue,l=a!==null?a.lastEffect:null;if(l!==null){var i=l.next;a=i;do{if((a.tag&e)===e){l=void 0;var r=a.create,m=a.inst;l=r(),m.destroy=l}a=a.next}while(a!==i)}}catch(h){Ve(t,t.return,h)}}function Ta(e,t,a){try{var l=t.updateQueue,i=l!==null?l.lastEffect:null;if(i!==null){var r=i.next;l=r;do{if((l.tag&e)===e){var m=l.inst,h=m.destroy;if(h!==void 0){m.destroy=void 0,i=t;var x=a,E=h;try{E()}catch(O){Ve(i,x,O)}}}l=l.next}while(l!==r)}}catch(O){Ve(t,t.return,O)}}function Jm(e){var t=e.updateQueue;if(t!==null){var a=e.stateNode;try{Hf(t,a)}catch(l){Ve(e,e.return,l)}}}function Wm(e,t,a){a.props=ll(e.type,e.memoizedProps),a.state=e.memoizedState;try{a.componentWillUnmount()}catch(l){Ve(e,t,l)}}function Rn(e,t){try{var a=e.ref;if(a!==null){switch(e.tag){case 26:case 27:case 5:var l=e.stateNode;break;case 30:var i=e.stateNode,r=Pn(e.memoizedProps,i);(i.ref===null||i.ref.name!==r)&&(i.ref=ip(r)),l=i.ref;break;case 7:if(e.stateNode===null){var m=new an(e);b(e.child,!1,rb,m,void 0,void 0),e.stateNode=m}l=e.stateNode;break;default:l=e.stateNode}typeof a=="function"?e.refCleanup=a(l):a.current=l}}catch(h){Ve(e,t,h)}}function Et(e,t){var a=e.ref,l=e.refCleanup;if(a!==null)if(typeof l=="function")try{l()}catch(i){Ve(e,t,i)}finally{e.refCleanup=null,e=e.alternate,e!=null&&(e.refCleanup=null)}else if(typeof a=="function")try{a(null)}catch(i){Ve(e,t,i)}else a.current=null}function ur(e,t){if((e.tag===5||e.tag===27||e.tag===6)&&e.alternate===null&&t!==null)for(var a=0;a<t.length;a++)dp(e.stateNode,t[a])}function Fm(e){for(var t=e.return;t!==null&&(Uu(t)&&dp(e.stateNode,t.stateNode),!$u(t));)t=t.return}function Gi(e){for(var t=e.return;t!==null&&(Uu(t)&&ob(e.stateNode,t.stateNode),!$u(t));)t=t.return}function $u(e){return e.tag===5||e.tag===3||e.tag===27}function Uu(e){return e&&e.tag===7&&e.stateNode!==null}function Lu(e){var t=e.type,a=e.memoizedProps,l=e.stateNode;try{e:switch(t){case"button":case"input":case"select":case"textarea":a.autoFocus&&l.focus();break e;case"img":a.src?l.src=a.src:a.srcSet&&(l.srcset=a.srcSet)}}catch(i){Ve(e,e.return,i)}}function Hu(e,t,a){try{var l=e.stateNode;Gg(l,e.type,a,t),l[Yt]=t}catch(i){Ve(e,e.return,i)}}function e0(e){return e.tag===5||e.tag===3||e.tag===26||e.tag===27&&Ra(e.type)||e.tag===4}function Yu(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||e0(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.tag===27&&Ra(e.type)||e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function Bu(e,t,a,l){var i=e.tag;if(i===5||i===6)i=e.stateNode,t?(a.nodeType===9?a.body:a.nodeName==="HTML"?a.ownerDocument.body:a).insertBefore(i,t):(t=a.nodeType===9?a.body:a.nodeName==="HTML"?a.ownerDocument.body:a,t.appendChild(i),a=a._reactRootContainer,a!=null||t.onclick!==null||(t.onclick=An)),ur(e,l),Ue=!0;else if(i!==4&&(i===27&&(ur(e,l),l=null,Ra(e.type)&&(a=e.stateNode,t=null)),e=e.child,e!==null))for(Bu(e,t,a,l),e=e.sibling;e!==null;)Bu(e,t,a,l),e=e.sibling}function cr(e,t,a,l){var i=e.tag;if(i===5||i===6)i=e.stateNode,t?a.insertBefore(i,t):a.appendChild(i),ur(e,l),Ue=!0;else if(i!==4&&(i===27&&(ur(e,l),l=null,Ra(e.type)&&(a=e.stateNode)),e=e.child,e!==null))for(cr(e,t,a,l),e=e.sibling;e!==null;)cr(e,t,a,l),e=e.sibling}function t0(e){var t=e.stateNode,a=e.memoizedProps;try{for(var l=e.type,i=t.attributes;i.length;)t.removeAttributeNode(i[0]);At(t,l,a),t[St]=e,t[Yt]=a}catch(r){Ve(e,e.return,r)}}var dr=!1,Ft=null;function n0(e){(e.tag===30||(e.subtreeFlags&33554432)!==0)&&(dr=!0)}var Mn=null;function a0(){var e=Mn;return Mn=null,e}var Gt=0;function Ll(e,t,a,l,i){return Gt=0,l0(e.child,t,a,l,i)}function l0(e,t,a,l,i){for(var r=!1;e!==null;){if(e.tag===5){var m=e.stateNode;if(l!==null){var h=Tc(m);l.push(h),h.view&&(r=!0)}else r||Tc(m).view&&(r=!0);dr=!0,ap(m,Gt===0?t:t+"_"+Gt,a),Gt++}else(e.tag!==22||e.memoizedState===null)&&(e.tag===30&&i||l0(e.child,t,a,l,i)&&(r=!0));e=e.sibling}return r}function zn(e,t){for(;e!==null;)e.tag===5?lp(e.stateNode,e.memoizedProps):(e.tag!==22||e.memoizedState===null)&&(e.tag===30&&t||zn(e.child,t)),e=e.sibling}function fr(e){if((e.subtreeFlags&18874368)!==0)for(e=e.child;e!==null;){if((e.tag!==22||e.memoizedState===null)&&(fr(e),e.tag===30&&(e.flags&18874368)!==0&&e.stateNode.paired)){var t=e.memoizedProps;if(t.name==null||t.name==="auto")throw Error(c(544));var a=t.name;t=Kn(t.default,t.share),t!=="none"&&(Ll(e,a,t,null,!1)||zn(e.child,!1))}e=e.sibling}}function Gu(e,t){if(e.tag===30){var a=e.stateNode,l=e.memoizedProps,i=Pn(l,a),r=Kn(l.default,a.paired?l.share:l.enter);r!=="none"?Ll(e,i,r,null,!1)?(fr(e),a.paired||t||Ql(e,l.onEnter)):zn(e.child,!1):fr(e)}else if((e.subtreeFlags&33554432)!==0)for(e=e.child;e!==null;)Gu(e,t),e=e.sibling;else fr(e)}function Xu(e){if(Ft!==null&&Ft.size!==0){var t=Ft;if((e.subtreeFlags&18874368)!==0)for(e=e.child;e!==null;){if(e.tag!==22||e.memoizedState===null){if(e.tag===30&&(e.flags&18874368)!==0){var a=e.memoizedProps,l=a.name;if(l!=null&&l!=="auto"){var i=t.get(l);if(i!==void 0){var r=Kn(a.default,a.share);if(r!=="none"&&(Ll(e,l,r,null,!1)?(r=e.stateNode,i.paired=r,r.paired=i,Ql(e,a.onShare)):zn(e.child,!1)),t.delete(l),t.size===0)break}}}Xu(e)}e=e.sibling}}}function Vu(e){if(e.tag===30){var t=e.memoizedProps,a=Pn(t,e.stateNode),l=Ft!==null?Ft.get(a):void 0,i=Kn(t.default,l!==void 0?t.share:t.exit);i!=="none"&&(Ll(e,a,i,null,!1)?l!==void 0?(i=e.stateNode,l.paired=i,i.paired=l,Ft.delete(a),Ql(e,t.onShare)):Ql(e,t.onExit):zn(e.child,!1)),Ft!==null&&Xu(e)}else if((e.subtreeFlags&33554432)!==0)for(e=e.child;e!==null;)Vu(e),e=e.sibling;else Ft!==null&&Xu(e)}function i0(e){for(e=e.child;e!==null;){if(e.tag===30){var t=e.memoizedProps,a=Pn(t,e.stateNode);t=Kn(t.default,t.update),e.flags&=-5,t!=="none"&&Ll(e,a,t,e.memoizedState=[],!1)}else(e.subtreeFlags&33554432)!==0&&i0(e);e=e.sibling}}function Iu(e){if((e.subtreeFlags&18874368)!==0)for(e=e.child;e!==null;){if(e.tag!==22||e.memoizedState===null){if(e.tag===30&&(e.flags&18874368)!==0){var t=e.stateNode;t.paired!==null&&(t.paired=null,zn(e.child,!1))}Iu(e)}e=e.sibling}}function mr(e){if(e.tag===30)e.stateNode.paired=null,zn(e.child,!1),Iu(e);else if((e.subtreeFlags&33554432)!==0)for(e=e.child;e!==null;)mr(e),e=e.sibling;else Iu(e)}function s0(e){for(e=e.child;e!==null;)e.tag===30?zn(e.child,!1):(e.subtreeFlags&33554432)!==0&&s0(e),e=e.sibling}function Qu(e,t,a,l,i,r,m){for(var h=!1;t!==null;){if(t.tag===5){var x=t.stateNode;if(r!==null&&Gt<r.length){var E=r[Gt],O=Tc(x);(E.view||O.view)&&(h=!0);var z;if(z=(e.flags&4)===0)if(O.clip)z=!0;else{z=E.rect;var T=O.rect;z=z.y!==T.y||z.x!==T.x||z.height!==T.height||z.width!==T.width}z&&(e.flags|=4),O.abs?O=!E.abs:(E=E.rect,O=O.rect,O=E.height!==O.height||E.width!==O.width),O&&(e.flags|=32)}else e.flags|=32;(e.flags&4)!==0&&ap(x,Gt===0?a:a+"_"+Gt,i),h&&(e.flags&4)!==0||(Mn===null&&(Mn=[]),Mn.push(x,Gt===0?l:l+"_"+Gt,t.memoizedProps)),Gt++}else(t.tag!==22||t.memoizedState===null)&&(t.tag===30&&m?e.flags|=t.flags&32:Qu(e,t.child,a,l,i,r,m)&&(h=!0));t=t.sibling}return h}function r0(e,t){for(e=e.child;e!==null;){if(e.tag===30){var a=e.memoizedProps,l=e.stateNode,i=Pn(a,l),r=Kn(a.default,a.update),m;m=e.memoizedState,e.memoizedState=null,l=e;var h=e.child;Gt=0,i=Qu(l,h,i,i,r,m,!1),(e.flags&4)!==0&&i&&Ql(e,a.onUpdate)}else(e.subtreeFlags&33554432)!==0&&r0(e);e=e.sibling}}var yt=!1,Be=!1,qn=!1,Zu=!1,o0=typeof WeakSet=="function"?WeakSet:Set,vt=null,Dn=!1,Xi=!1,pr=!1,Pu=!1;function bg(e,t,a){if(e=e.containerInfo,vc=ai,e=ff(e),qo(e)){if("selectionStart"in e)var l={start:e.selectionStart,end:e.selectionEnd};else e:{l=(l=e.ownerDocument)&&l.defaultView||window;var i=l.getSelection&&l.getSelection();if(i&&i.rangeCount!==0){l=i.anchorNode;var r=i.anchorOffset,m=i.focusNode;i=i.focusOffset;try{l.nodeType,m.nodeType}catch{l=null;break e}var h=0,x=-1,E=-1,O=0,z=0,T=e,C=null;t:for(;;){for(var I;T!==l||r!==0&&T.nodeType!==3||(x=h+r),T!==m||i!==0&&T.nodeType!==3||(E=h+i),T.nodeType===3&&(h+=T.nodeValue.length),(I=T.firstChild)!==null;)C=T,T=I;for(;;){if(T===e)break t;if(C===l&&++O===r&&(x=h),C===m&&++z===i&&(E=h),(I=T.nextSibling)!==null)break;T=C,C=T.parentNode}T=I}l=x===-1||E===-1?null:{start:x,end:E}}else l=null}l=l||{start:0,end:0}}else l=null;for(xc={focusedElem:e,selectionRange:l},ai=!1,a=(a&335544064)===a,vt=t,t=a?9270:1024;vt!==null;){if(e=vt,a&&(l=e.deletions,l!==null))for(r=0;r<l.length;r++)a&&Vu(l[r]);if(e.alternate===null&&(e.flags&2)!==0)a&&n0(e),hr(a);else{if(e.tag===22){if(l=e.alternate,e.memoizedState!==null){l!==null&&l.memoizedState===null&&a&&Vu(l),hr(a);continue}else if(l!==null&&l.memoizedState!==null){a&&n0(e),hr(a);continue}}l=e.child,(e.subtreeFlags&t)!==0&&l!==null?(l.return=e,vt=l):(a&&i0(e),hr(a))}}Ft=null}function hr(e){for(;vt!==null;){var t=vt,a=e,l=t.alternate,i=t.flags;switch(t.tag){case 0:case 11:case 15:break;case 1:if((i&1024)!==0&&l!==null){a=void 0,i=l.memoizedProps,l=l.memoizedState;var r=t.stateNode;try{var m=ll(t.type,i);a=r.getSnapshotBeforeUpdate(m,l),r.__reactInternalSnapshotBeforeUpdate=a}catch(h){Ve(t,t.return,h)}}break;case 3:if((i&1024)!==0){if(l=t.stateNode.containerInfo,a=l.nodeType,a===9)Ec(l);else if(a===1)switch(l.nodeName){case"HEAD":case"HTML":case"BODY":Ec(l);break;default:l.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;case 30:a&&l!==null&&(a=Pn(l.memoizedProps,l.stateNode),i=t.memoizedProps,i=Kn(i.default,i.update),i!=="none"&&Ll(l,a,i,l.memoizedState=[],!0));break;default:if((i&1024)!==0)throw Error(c(163))}if(l=t.sibling,l!==null){l.return=t.return,vt=l;break}vt=t.return}}function u0(e,t,a){var l=a.flags;switch(a.tag){case 0:case 11:case 15:$n(e,a),l&4&&Bi(5,a);break;case 1:if($n(e,a),l&4)if(e=a.stateNode,t===null)try{e.componentDidMount()}catch(m){Ve(a,a.return,m)}else{var i=ll(a.type,t.memoizedProps);t=t.memoizedState;try{e.componentDidUpdate(i,t,e.__reactInternalSnapshotBeforeUpdate)}catch(m){Ve(a,a.return,m)}}l&64&&Jm(a),l&512&&Rn(a,a.return);break;case 3:if($n(e,a),l&64&&(e=a.updateQueue,e!==null)){if(t=null,a.child!==null)switch(a.child.tag){case 27:case 5:t=a.child.stateNode;break;case 1:t=a.child.stateNode}try{Hf(e,t)}catch(m){Ve(a,a.return,m)}}break;case 27:t===null&&l&4&&t0(a);case 26:case 5:$n(e,a),t===null&&l&4&&Lu(a),l&512&&Rn(a,a.return);break;case 12:$n(e,a);break;case 31:$n(e,a),l&4&&m0(e,a);break;case 13:$n(e,a),l&4&&p0(e,a),l&64&&(e=a.memoizedState,e!==null&&(e=e.dehydrated,e!==null&&(a=Cg.bind(null,a),db(e,a))));break;case 22:if(l=a.memoizedState!==null||yt,!l){var r=t!==null&&t.memoizedState!==null||Be;t=yt,i=Be,yt=l,(Be=r)&&!i?(l=2,(a.subtreeFlags&8772)!==0&&(l|=1),wn(e,a,l)):$n(e,a),yt=t,Be=i}break;case 30:$n(e,a),l&512&&Rn(a,a.return);break;case 7:l&512&&Rn(a,a.return);default:$n(e,a)}}function Ku(e,t){for(e=e.child;e!==null;)c0(e,t),e=e.sibling}function c0(e,t){switch(e.tag){case 5:case 26:try{var a=e.stateNode;if(t){var l=a.style;typeof l.setProperty=="function"?l.setProperty("display","none","important"):l.display="none"}else{var i=e.stateNode,r=e.memoizedProps.style,m=r!=null&&r.hasOwnProperty("display")?r.display:null;i.style.display=m==null||typeof m=="boolean"?"":(""+m).trim()}}catch(x){Ve(e,e.return,x)}Ju(e,t);break;case 6:try{e.stateNode.nodeValue=t?"":e.memoizedProps,Ue=!0}catch(x){Ve(e,e.return,x)}break;case 18:try{var h=e.stateNode;t?np(h,!0):np(e.stateNode,!1)}catch(x){Ve(e,e.return,x)}break;case 22:case 23:e.memoizedState===null&&Ku(e,t);break;default:Ku(e,t)}}function Ju(e,t){if(e.subtreeFlags&67108864)for(e=e.child;e!==null;){e:{var a=e,l=t;switch(a.tag){case 4:c0(a,l);break e;case 22:a.memoizedState===null&&Ju(a,l);break e;default:Ju(a,l)}}e=e.sibling}}function d0(e){var t=e.alternate;t!==null&&(e.alternate=null,d0(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&vs(t)),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}var Fe=null,Xt=!1;function vn(e,t,a){for(a=a.child;a!==null;)f0(e,t,a),a=a.sibling}function f0(e,t,a){if(Zt&&typeof Zt.onCommitFiberUnmount=="function")try{Zt.onCommitFiberUnmount(mi,a)}catch{}switch(a.tag){case 26:Be||Et(a,t),vn(e,t,a),a.memoizedState?a.memoizedState.count--:a.stateNode&&!Be&&(a=a.stateNode,a.parentNode.removeChild(a));break;case 27:Be||Et(a,t),Gi(a);var l=Fe,i=Xt;Ra(a.type)&&(Fe=a.stateNode,Xt=!1),vn(e,t,a),_p(a.stateNode,a.type,a.memoizedProps),Fe=l,Xt=i;break;case 5:Be||Et(a,t),Gi(a);case 6:if(a.tag===6&&Gi(a),l=Fe,i=Xt,Fe=null,vn(e,t,a),Fe=l,Xt=i,Fe!==null)if(Xt)try{(Fe.nodeType===9?Fe.body:Fe.nodeName==="HTML"?Fe.ownerDocument.body:Fe).removeChild(a.stateNode),Ue=!0}catch(r){Ve(a,t,r)}else try{Fe.removeChild(a.stateNode),Ue=!0}catch(r){Ve(a,t,r)}break;case 18:Fe!==null&&(Xt?(e=Fe,tp(e.nodeType===9?e.body:e.nodeName==="HTML"?e.ownerDocument.body:e,a.stateNode),li(e)):tp(Fe,a.stateNode));break;case 4:l=Fe,i=Xt,Fe=a.stateNode.containerInfo,Xt=!0,vn(e,t,a),Fe=l,Xt=i;break;case 0:case 11:case 14:case 15:Ta(2,a,t),Be||Ta(4,a,t),vn(e,t,a);break;case 1:Be||(Et(a,t),l=a.stateNode,typeof l.componentWillUnmount=="function"&&Wm(a,t,l)),vn(e,t,a);break;case 21:vn(e,t,a);break;case 22:Be=(l=Be)||a.memoizedState!==null,vn(e,t,a),Be=l;break;case 30:Et(a,t),vn(e,t,a);break;case 7:Be||Et(a,t),vn(e,t,a);break;default:vn(e,t,a)}}function m0(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null))){e=e.dehydrated;try{li(e)}catch(a){Ve(t,t.return,a)}}}function p0(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null&&(e=e.dehydrated,e!==null))))try{li(e)}catch(a){Ve(t,t.return,a)}}function yg(e){switch(e.tag){case 31:case 13:case 19:var t=e.stateNode;return t===null&&(t=e.stateNode=new o0),t;case 22:return e=e.stateNode,t=e._retryCache,t===null&&(t=e._retryCache=new o0),t;default:throw Error(c(435,e.tag))}}function _r(e,t){var a=yg(e);t.forEach(function(l){if(!a.has(l)){a.add(l);var i=Og.bind(null,e,l);l.then(i,i)}})}function $t(e,t,a){var l=t.deletions;if(l!==null)for(var i=0;i<l.length;i++){var r=l[i],m=e,h=t,x=h;e:for(;x!==null;){switch(x.tag){case 27:if(Ra(x.type)){Fe=x.stateNode,Xt=!1;break e}break;case 5:Fe=x.stateNode,Xt=!1;break e;case 3:case 4:Fe=x.stateNode.containerInfo,Xt=!0;break e}x=x.return}if(Fe===null)throw Error(c(160));f0(m,h,r),Fe=null,Xt=!1,m=r.alternate,m!==null&&(m.return=null),r.return=null}if(t.subtreeFlags&13886)for(t=t.child;t!==null;)h0(t,e,a),t=t.sibling}var xn=null;function h0(e,t,a){var l=e.alternate,i=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if(i&4&&(l=e.updateQueue,l=l!==null?l.events:null,l!==null))for(var r=0;r<l.length;r++){var m=l[r];m.ref.impl=m.nextImpl}$t(t,e,a),Ut(e),i&4&&(Ta(3,e,e.return),Bi(3,e),Ta(5,e,e.return));break;case 1:$t(t,e,a),Ut(e),i&512&&(Be||l===null||Et(l,l.return)),i&64&&yt&&(e=e.updateQueue,e!==null&&(t=e.callbacks,t!==null&&(a=e.shared.hiddenCallbacks,e.shared.hiddenCallbacks=a===null?t:a.concat(t))));break;case 26:if(r=xn,$t(t,e,a),Ut(e),i&512&&(Be||l===null||Et(l,l.return)),i&4)if(i=l!==null?l.memoizedState:null,a=e.memoizedState,l===null)if(a===null)if(e.stateNode===null)if(yt)e.stateNode=W0(e.type,e.memoizedProps,t.containerInfo,e);else{e:{t=e.type,a=e.memoizedProps,i=r.ownerDocument||r;t:switch(t){case"title":l=i.getElementsByTagName("title")[0],(!l||l[_i]||l[St]||l.namespaceURI==="http://www.w3.org/2000/svg"||l.hasAttribute("itemprop"))&&(l=i.createElement(t),i.head.insertBefore(l,i.querySelector("head > title"))),At(l,t,a),l[St]=e,gt(l),t=l;break e;case"link":if(r=wp("link","href",i).get(t+(a.href||""))){for(m=0;m<r.length;m++)if(l=r[m],l.getAttribute("href")===(a.href==null||a.href===""?null:a.href)&&l.getAttribute("rel")===(a.rel==null?null:a.rel)&&l.getAttribute("title")===(a.title==null?null:a.title)&&l.getAttribute("crossorigin")===(a.crossOrigin==null?null:a.crossOrigin)){r.splice(m,1);break t}}l=i.createElement(t),At(l,t,a),i.head.appendChild(l);break;case"meta":if(r=wp("meta","content",i).get(t+(a.content||""))){for(m=0;m<r.length;m++)if(l=r[m],l.getAttribute("content")===(a.content==null?null:""+a.content)&&l.getAttribute("name")===(a.name==null?null:a.name)&&l.getAttribute("property")===(a.property==null?null:a.property)&&l.getAttribute("http-equiv")===(a.httpEquiv==null?null:a.httpEquiv)&&l.getAttribute("charset")===(a.charSet==null?null:a.charSet)){r.splice(m,1);break t}}l=i.createElement(t),At(l,t,a),i.head.appendChild(l);break;default:throw Error(c(468,t))}l[St]=e,gt(l),t=l}e.stateNode=t}else yt||qc(r,e.type,e.stateNode);else e.stateNode=xp(r,a,e.memoizedProps);else i!==a?(i===null?(t=l.stateNode,t===null||Be||t.parentNode.removeChild(t)):i.count--,a===null?yt||qc(r,e.type,e.stateNode):xp(r,a,e.memoizedProps)):a===null&&e.stateNode!==null&&Hu(e,e.memoizedProps,l.memoizedProps);break;case 27:$t(t,e,a),Ut(e),i&512&&(Be||l===null||Et(l,l.return)),l!==null&&i&4&&Hu(e,e.memoizedProps,l.memoizedProps);break;case 5:if(r=qn,qn=!1,$t(t,e,a),qn=r,Ut(e),i&512&&(Be||l===null||Et(l,l.return)),e.flags&32){t=e.stateNode;try{xl(t,""),Ue=!0}catch(O){Ve(e,e.return,O)}}i&4&&e.stateNode!=null&&(t=e.memoizedProps,Hu(e,t,l!==null?l.memoizedProps:t)),i&1024&&(Zu=!0);break;case 6:if($t(t,e,a),Ut(e),i&4){if(e.stateNode===null)throw Error(c(162));t=e.memoizedProps,a=e.stateNode;try{a.nodeValue=t,Ue=!0}catch(O){Ve(e,e.return,O)}}break;case 3:if(Ue=!1,Or=null,r=xn,xn=Fi(t.containerInfo),$t(t,e,a),xn=r,Ut(e),i&4&&l!==null&&l.memoizedState.isDehydrated)try{li(t.containerInfo)}catch(O){Ve(e,e.return,O)}Zu&&(Zu=!1,_0(e)),Ue=!1;break;case 4:i=qn,qn=yt,l=qd(),r=xn,xn=Fi(e.stateNode.containerInfo),$t(t,e,a),Ut(e),xn=r,Ue&&Xi&&(pr=!0),Ue=l,qn=i;break;case 12:$t(t,e,a),Ut(e);break;case 31:$t(t,e,a),Ut(e),i&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,_r(e,t)));break;case 13:$t(t,e,a),Ut(e),e.child.flags&8192&&e.memoizedState!==null!=(l!==null&&l.memoizedState!==null)&&(yr=Qt()),i&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,_r(e,t)));break;case 22:r=e.memoizedState!==null,m=l!==null&&l.memoizedState!==null;var h=yt,x=Be,E=qn;yt=h||r,qn=E||r,Be=x||m,$t(t,e,a),Be=x,qn=E,yt=h,Ut(e),i&8192&&(t=e.stateNode,t._visibility=r?t._visibility&-2:t._visibility|1,!r||l===null||m||yt||Be||(t=m||Be,a=yt,l=Be,yt=r||yt,Be=t,Na(e,2),yt=a,Be=l),!r&&qn||Ku(e,r)),i&4&&(t=e.updateQueue,t!==null&&(a=t.retryQueue,a!==null&&(t.retryQueue=null,_r(e,a))));break;case 19:$t(t,e,a),Ut(e),i&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,_r(e,t)));break;case 30:i&512&&(Be||l===null||Et(l,l.return)),i=qd(),r=Xi,m=(a&335544064)===a,h=e.memoizedProps,Xi=m&&Kn(h.default,h.update)!=="none",$t(t,e,a),Ut(e),m&&l!==null&&Ue&&(e.flags|=4),Xi=r,Ue=i;break;case 21:break;case 7:i&512&&(Be||l===null||Et(l,l.return)),l&&l.stateNode!==null&&(l.stateNode._fragmentFiber=e);default:$t(t,e,a),Ut(e)}}function Ut(e){var t=e.flags;if(t&2){try{for(var a,l=e.return;l!==null;){if(e0(l)){a=l;break}l=l.return}l=null;for(var i=e.return;i!==null;){if(Uu(i)){var r=i.stateNode;l===null?l=[r]:l.push(r)}if($u(i))break;i=i.return}var m=l;if(a==null)throw Error(c(160));switch(a.tag){case 27:var h=a.stateNode,x=Yu(e);cr(e,x,h,m);break;case 5:var E=a.stateNode;a.flags&32&&(xl(E,""),a.flags&=-33);var O=Yu(e);cr(e,O,E,m);break;case 3:case 4:var z=a.stateNode.containerInfo,T=Yu(e);Bu(e,T,z,m);break;default:throw Error(c(161))}}catch(C){Ve(e,e.return,C)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function _0(e){if(e.subtreeFlags&1024)for(e=e.child;e!==null;){var t=e;_0(t),t.tag===5&&t.flags&1024&&(t=t.stateNode,ai=!0,t.reset(),ai=!1),e=e.sibling}}function Hl(e,t){if(t.subtreeFlags&9270)for(t=t.child;t!==null;)g0(t,e),t=t.sibling;else r0(t)}function g0(e,t){var a=e.alternate;if(a===null)Gu(e,!1);else switch(e.tag){case 3:if(Pu=Dn=!1,a0(),Hl(t,e),!Dn&&!pr){if(e=Mn,e!==null)for(var l=0;l<e.length;l+=3){a=e[l];var i=e[l+1];lp(a,e[l+2]),a=a.ownerDocument.documentElement,a!==null&&a.animate({opacity:[0,0],pointerEvents:["none","none"]},{duration:0,fill:"forwards",pseudoElement:"::view-transition-group("+i+")"})}e=t.containerInfo,e=e.nodeType===9?e.documentElement:e.ownerDocument.documentElement,e!==null&&e.style.viewTransitionName===""&&(e.style.viewTransitionName="none",e.animate({opacity:[0,0],pointerEvents:["none","none"]},{duration:0,fill:"forwards",pseudoElement:"::view-transition-group(root)"}),e.animate({width:[0,0],height:[0,0]},{duration:0,fill:"forwards",pseudoElement:"::view-transition"})),Pu=!0}Mn=null;break;case 5:Hl(t,e);break;case 4:l=Dn,Dn=!1,Hl(t,e),Dn&&(pr=!0),Dn=l;break;case 22:e.memoizedState===null&&(a.memoizedState!==null?Gu(e,!1):Hl(t,e));break;case 30:l=Dn,i=a0(),Dn=!1,Hl(t,e),Dn&&(e.flags|=4);var r=e.memoizedProps,m=e.stateNode;t=Pn(r,m),m=Pn(a.memoizedProps,m);var h=Kn(r.default,r.update);h==="none"?t=!1:(r=a.memoizedState,a.memoizedState=null,a=e.child,Gt=0,t=Qu(e,a,t,m,h,r,!0),Gt!==(r===null?0:r.length)&&(e.flags|=32)),(e.flags&4)!==0&&t?(Ql(e,e.memoizedProps.onUpdate),Mn=i):i!==null&&(i.push.apply(i,Mn),Mn=i),Dn=(e.flags&32)!==0?!0:l;break;default:Hl(t,e)}}function $n(e,t){if(t.subtreeFlags&8772)for(t=t.child;t!==null;)u0(e,t.alternate,t),t=t.sibling}function Na(e,t){for(e=e.child;e!==null;){var a=e,l=t;switch(a.tag){case 0:case 11:case 14:case 15:Ta(4,a,a.return),Na(a,l);break;case 1:Et(a,a.return);var i=a.stateNode;typeof i.componentWillUnmount=="function"&&Wm(a,a.return,i),Na(a,l);break;case 27:(l&2)!==0&&_p(a.stateNode,a.type,a.memoizedProps);case 5:Et(a,a.return),a.tag!==5&&a.tag!==27||Gi(a),Na(a,l);break;case 6:Gi(a);break;case 26:Et(a,a.return),i=a.stateNode,a.memoizedState!==null||i===null||Be||i.parentNode.removeChild(i),Na(a,l);break;case 22:a.memoizedState===null&&Na(a,l);break;case 30:Et(a,a.return),Na(a,l);break;case 7:Et(a,a.return);default:Na(a,l)}e=e.sibling}}function wn(e,t,a){for(a=(t.subtreeFlags&8772)!==0?a:a&-2,t=t.child;t!==null;){var l=t.alternate,i=e,r=t,m=r.flags,h=(a&1)!==0;switch(r.tag){case 0:case 11:case 15:wn(i,r,a),Bi(4,r);break;case 1:if(wn(i,r,a),l=r,i=l.stateNode,typeof i.componentDidMount=="function")try{i.componentDidMount()}catch(O){Ve(l,l.return,O)}if(l=r,i=l.updateQueue,i!==null){var x=l.stateNode;try{var E=i.shared.hiddenCallbacks;if(E!==null)for(i.shared.hiddenCallbacks=null,i=0;i<E.length;i++)Lf(E[i],x)}catch(O){Ve(l,l.return,O)}}h&&m&64&&Jm(r),Rn(r,r.return);break;case 27:(a&2)!==0&&t0(r);case 5:r.tag!==5&&r.tag!==27||Fm(r),wn(i,r,a),h&&l===null&&m&4&&Lu(r),Rn(r,r.return);break;case 6:Fm(r);break;case 26:x=r.stateNode,r.memoizedState!==null||x===null||yt||qc(Fi(x.ownerDocument),r.type,x),wn(i,r,a),h&&l===null&&m&4&&Lu(r),Rn(r,r.return);break;case 12:wn(i,r,a);break;case 31:wn(i,r,a),h&&m&4&&m0(i,r);break;case 13:wn(i,r,a),h&&m&4&&p0(i,r);break;case 22:r.memoizedState===null&&wn(i,r,a),Rn(r,r.return);break;case 30:wn(i,r,a),Rn(r,r.return);break;case 7:Rn(r,r.return);default:wn(i,r,a)}t=t.sibling}}function Wu(e,t){var a=null;e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(a=e.memoizedState.cachePool.pool),e=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(e=t.memoizedState.cachePool.pool),e!==a&&(e!=null&&e.refCount++,a!=null&&Ai(a))}function Fu(e,t){e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&Ai(e))}function hn(e,t,a,l){var i=(a&335544064)===a;if(t.subtreeFlags&(i?10262:10256))for(t=t.child;t!==null;)b0(e,t,a,l),t=t.sibling;else i&&s0(t)}function b0(e,t,a,l){var i=(a&335544064)===a;i&&t.alternate===null&&t.return!==null&&t.return.alternate!==null&&mr(t);var r=t.flags;switch(t.tag){case 0:case 11:case 15:hn(e,t,a,l),r&2048&&Bi(9,t);break;case 1:hn(e,t,a,l);break;case 3:hn(e,t,a,l),i&&Pu&&(e=e.containerInfo,e=e.nodeType===9?e.body:e.nodeName==="HTML"?e.ownerDocument.body:e,e.style.viewTransitionName==="root"&&(e.style.viewTransitionName=""),e=e.ownerDocument.documentElement,e!==null&&e.style.viewTransitionName==="none"&&(e.style.viewTransitionName="")),r&2048&&(r=null,t.alternate!==null&&(r=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==r&&(t.refCount++,r!=null&&Ai(r)));break;case 12:if(r&2048){hn(e,t,a,l),r=t.stateNode;try{var m=t.memoizedProps,h=m.id,x=m.onPostCommit;typeof x=="function"&&x(h,t.alternate===null?"mount":"update",r.passiveEffectDuration,-0)}catch(E){Ve(t,t.return,E)}}else hn(e,t,a,l);break;case 31:hn(e,t,a,l);break;case 13:hn(e,t,a,l);break;case 23:break;case 22:m=t.stateNode,h=t.alternate,t.memoizedState!==null?(i&&h!==null&&h.memoizedState===null&&mr(h),m._visibility&2?hn(e,t,a,l):Vi(e,t)):(i&&h!==null&&h.memoizedState!==null&&mr(t),m._visibility&2?hn(e,t,a,l):(m._visibility|=2,Yl(e,t,a,l,(t.subtreeFlags&10256)!==0||!1))),r&2048&&Wu(h,t);break;case 24:hn(e,t,a,l),r&2048&&Fu(t.alternate,t);break;case 30:i&&(r=t.alternate,r!==null&&(zn(r.child,!0),zn(t.child,!0))),hn(e,t,a,l);break;default:hn(e,t,a,l)}}function Yl(e,t,a,l,i){for(i=i&&((t.subtreeFlags&10256)!==0||!1),t=t.child;t!==null;){var r=e,m=t,h=a,x=l,E=m.flags;switch(m.tag){case 0:case 11:case 15:Yl(r,m,h,x,i),Bi(8,m);break;case 23:break;case 22:var O=m.stateNode;m.memoizedState!==null?O._visibility&2?Yl(r,m,h,x,i):Vi(r,m):(O._visibility|=2,Yl(r,m,h,x,i)),i&&E&2048&&Wu(m.alternate,m);break;case 24:Yl(r,m,h,x,i),i&&E&2048&&Fu(m.alternate,m);break;default:Yl(r,m,h,x,i)}t=t.sibling}}function Vi(e,t){if(t.subtreeFlags&10256)for(t=t.child;t!==null;){var a=e,l=t,i=l.flags;switch(l.tag){case 22:Vi(a,l),i&2048&&Wu(l.alternate,l);break;case 24:Vi(a,l),i&2048&&Fu(l.alternate,l);break;default:Vi(a,l)}t=t.sibling}}var il=8192;function sl(e,t,a){if(e.subtreeFlags&il)for(e=e.child;e!==null;)y0(e,t,a),e=e.sibling}function y0(e,t,a){switch(e.tag){case 26:sl(e,t,a),e.flags&il&&(e.memoizedState!==null?Tb(a,xn,e.memoizedState,e.memoizedProps):(e=e.stateNode,(t&335544128)===t&&Np(a,e)));break;case 5:sl(e,t,a),e.flags&il&&(e=e.stateNode,(t&335544128)===t&&Np(a,e));break;case 3:case 4:var l=xn;xn=Fi(e.stateNode.containerInfo),sl(e,t,a),xn=l;break;case 22:e.memoizedState===null&&(l=e.alternate,l!==null&&l.memoizedState!==null?(l=il,il=16777216,sl(e,t,a),il=l):sl(e,t,a));break;case 30:if((e.flags&il)!==0&&(l=e.memoizedProps.name,l!=null&&l!=="auto")){var i=e.stateNode;i.paired=null,Ft===null&&(Ft=new Map),Ft.set(l,i)}sl(e,t,a);break;default:sl(e,t,a)}}function v0(e){var t=e.alternate;if(t!==null&&(e=t.child,e!==null)){t.child=null;do t=e.sibling,e.sibling=null,e=t;while(e!==null)}}function Ii(e){var t=e.deletions;if((e.flags&16)!==0){if(t!==null)for(var a=0;a<t.length;a++){var l=t[a];vt=l,w0(l,e)}v0(e)}if(e.subtreeFlags&10256)for(e=e.child;e!==null;)x0(e),e=e.sibling}function x0(e){switch(e.tag){case 0:case 11:case 15:Ii(e),e.flags&2048&&Ta(9,e,e.return);break;case 3:Ii(e);break;case 12:Ii(e);break;case 22:var t=e.stateNode;e.memoizedState!==null&&t._visibility&2&&(e.return===null||e.return.tag!==13)?(t._visibility&=-3,gr(e)):Ii(e);break;default:Ii(e)}}function gr(e){var t=e.deletions;if((e.flags&16)!==0){if(t!==null)for(var a=0;a<t.length;a++){var l=t[a];vt=l,w0(l,e)}v0(e)}for(e=e.child;e!==null;){switch(t=e,t.tag){case 0:case 11:case 15:Ta(8,t,t.return),gr(t);break;case 22:a=t.stateNode,a._visibility&2&&(a._visibility&=-3,gr(t));break;default:gr(t)}e=e.sibling}}function w0(e,t){for(;vt!==null;){var a=vt;switch(a.tag){case 0:case 11:case 15:Ta(8,a,t);break;case 23:case 22:if(a.memoizedState!==null&&a.memoizedState.cachePool!==null){var l=a.memoizedState.cachePool.pool;l!=null&&l.refCount++}break;case 24:Ai(a.memoizedState.cache)}if(l=a.child,l!==null)l.return=a,vt=l;else e:for(a=e;vt!==null;){l=vt;var i=l.sibling,r=l.return;if(d0(l),l===a){vt=null;break e}if(i!==null){i.return=r,vt=i;break e}vt=r}}}var vg={getCacheForType:function(e){var t=Tt(dt),a=t.data.get(e);return a===void 0&&(a=e(),t.data.set(e,a)),a},cacheSignal:function(){return Tt(dt).controller.signal}},xg=typeof WeakMap=="function"?WeakMap:Map,He=0,Ze=null,Ae=null,Oe=0,Xe=0,en=null,ka=!1,Bl=!1,ec=!1,ia=0,lt=0,Ea=0,rl=0,br=0,tn=0,Gl=0,Qi=null,Vt=null,tc=!1,yr=0,j0=0,vr=1/0,xr=null,Aa=null,tt=0,jn=null,ol=null,Un=0,nc=0,ac=null,S0=null,Xl=null,Vl=null,Il=null,Zi=0,wr=null;function nn(){return(He&2)!==0&&Oe!==0?Oe&-Oe:ee.T!==null?mc():Nd()}function T0(){if(tn===0)if((Oe&536870912)===0||Ne){var e=_s;_s<<=1,(_s&3932160)===0&&(_s=262144),tn=e}else tn=536870912;return e=Nt.current,e!==null&&(e.flags|=32),tn}function Ql(e,t){if(t!=null){var a=e.stateNode,l=a.ref;l===null&&(l=a.ref=ip(Pn(e.memoizedProps,a))),Vl===null&&(Vl=[]),Vl.push(t.bind(null,l))}}function It(e,t,a){(e===Ze&&(Xe===2||Xe===9)||e.cancelPendingCommit!==null)&&(Zl(e,0),Ca(e,Oe,tn,!1)),hi(e,a),((He&2)===0||e!==Ze)&&(e===Ze&&((He&2)===0&&(rl|=a),lt===4&&Ca(e,Oe,tn,!1)),Ln(e))}function N0(e,t,a){if((He&6)!==0)throw Error(c(327));var l=!a&&(t&127)===0&&(t&e.expiredLanes)===0||pi(e,t),i=l?Sg(e,t):ic(e,t,!0),r=l;do{if(i===0){Bl&&!l&&Ca(e,t,0,!1);break}else{if(a=e.current.alternate,r&&!wg(a)){i=ic(e,t,!1),r=!1;continue}if(i===2){if(r=t,e.errorRecoveryDisabledLanes&r)var m=0;else m=e.pendingLanes&-536870913,m=m!==0?m:m&536870912?536870912:0;if(m!==0){t=m;e:{var h=e;i=Qi;var x=h.current.memoizedState.isDehydrated;if(x&&(Zl(h,m).flags|=256),m=ic(h,m,!1),m!==2&&m!==6){if(ec&&!x){h.errorRecoveryDisabledLanes|=r,rl|=r,i=4;break e}r=Vt,Vt=i,r!==null&&(Vt===null?Vt=r:Vt.push.apply(Vt,r))}i=m}if(r=!1,i!==2)continue}}if(i===1){Zl(e,0),Ca(e,t,0,!0);break}e:{switch(l=e,r=i,r){case 0:case 1:throw Error(c(345));case 4:if((t&4194048)!==t&&(t&62914560)!==t)break;case 6:Ca(l,t,tn,!ka);break e;case 2:Vt=null;break;case 3:case 5:break;default:throw Error(c(329))}if((t&62914560)===t&&(i=yr+300-Qt(),10<i)){if(Ca(l,t,tn,!ka),bs(l,0,!0)!==0)break e;Un=t,l.timeoutHandle=Sc(k0.bind(null,l,a,Vt,xr,tc,t,tn,rl,Gl,ka,r,"Throttled",-0,0),i);break e}k0(l,a,Vt,xr,tc,t,tn,rl,Gl,ka,r,null,-0,0)}}break}while(!0);Ln(e)}function k0(e,t,a,l,i,r,m,h,x,E,O,z,T,C){e.timeoutHandle=-1;var I=t.subtreeFlags,W=(r&335544064)===r;if(z=null,(W||I&8192||(I&16785408)===16785408)&&(z={stylesheets:null,count:0,imgCount:0,imgBytes:0,suspenseyImages:[],waitingForImages:!0,waitingForViewTransition:!1,unsuspend:An},Ft=null,y0(t,r,z),W&&(I=z,W=e.containerInfo,W=(W.nodeType===9?W:W.ownerDocument).__reactViewTransition,W!=null&&(I.count++,I.waitingForViewTransition=!0,I=ns.bind(I),W.finished.then(I,I))),I=(r&62914560)===r?yr-Qt():(r&4194048)===r?j0-Qt():0,I=Nb(z,I),I!==null)){Un=r,e.cancelPendingCommit=I(q0.bind(null,e,t,r,a,l,i,m,h,x,E,O,z,null,T,C)),Ca(e,r,m,!E);return}q0(e,t,r,a,l,i,m,h,x,E,O,z)}function wg(e){for(var t=e;;){var a=t.tag;if((a===0||a===11||a===15)&&t.flags&16384&&(a=t.updateQueue,a!==null&&(a=a.stores,a!==null)))for(var l=0;l<a.length;l++){var i=a[l],r=i.getSnapshot;i=i.value;try{if(!Jt(r(),i))return!1}catch{return!1}}if(a=t.child,t.subtreeFlags&16384&&a!==null)a.return=t,t=a;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function Ca(e,t,a,l){t=xd(e,t),t&=~br,t&=~rl,e.suspendedLanes|=t,e.pingedLanes&=~t,l&&(e.warmLanes|=t),l=e.expirationTimes;for(var i=t;0<i;){var r=31-Pt(i),m=1<<r;l[r]=-1,i&=~m}a!==0&&jd(e,a,t)}function jr(){return(He&6)===0?(Pi(0),!1):!0}function lc(){if(Ae!==null){if(Xe===0)var e=Ae.return;else e=Ae,Fn=Pa=null,fu(e),zl=null,Ri=0,e=Ae;for(;e!==null;)Km(e.alternate,e),e=e.return;Ae=null}}function Zl(e,t){var a=e.timeoutHandle;return a!==-1&&(e.timeoutHandle=-1,Ig(a)),a=e.cancelPendingCommit,a!==null&&(e.cancelPendingCommit=null,a()),Un=0,lc(),Ze=e,Ae=a=Jn(e.current,null),Oe=t,Xe=0,en=null,ka=!1,Bl=pi(e,t),ec=!1,Gl=tn=br=rl=Ea=lt=0,Vt=Qi=null,tc=!1,ia=xd(e,t),Os(),a}function E0(e,t){ye=null,ee.H=nr,t===Ml||t===Bs?(t=qf(),Xe=3):t===Fo?(t=qf(),Xe=4):Xe=t===ku?8:t!==null&&typeof t=="object"&&typeof t.then=="function"?6:1,en=t,Ae===null&&(lt=1,ar(e,dn(t,e.current)))}function A0(){var e=Nt.current;return e===null?!0:(Oe&4194048)===Oe?Rt===null:(Oe&62914560)===Oe||(Oe&536870912)!==0?e===Rt:!1}function C0(){var e=ee.H;return ee.H=nr,e===null?nr:e}function O0(){var e=ee.A;return ee.A=vg,e}function Sr(){lt=4,ka||(Oe&4194048)!==Oe&&Nt.current!==null||(Bl=!0),(Ea&134217727)===0&&(rl&134217727)===0||Ze===null||Ca(Ze,Oe,tn,!1)}function ic(e,t,a){var l=He;He|=2;var i=C0(),r=O0();(Ze!==e||Oe!==t)&&(xr=null,Zl(e,t)),t=!1;var m=lt;e:do try{if(Xe!==0&&Ae!==null){var h=Ae,x=en;switch(Xe){case 8:lc(),m=6;break e;case 3:case 2:case 9:case 6:Nt.current===null&&(t=!0);var E=Xe;if(Xe=0,en=null,Pl(e,h,x,E),a&&Bl){m=0;break e}break;default:E=Xe,Xe=0,en=null,Pl(e,h,x,E)}}jg(),m=lt;break}catch(O){E0(e,O)}while(!0);return t&&e.shellSuspendCounter++,Fn=Pa=null,He=l,ee.H=i,ee.A=r,Ae===null&&(Ze=null,Oe=0,Os()),m}function jg(){for(;Ae!==null;)R0(Ae)}function Sg(e,t){var a=He;He|=2;var l=C0(),i=O0();Ze!==e||Oe!==t?(xr=null,vr=Qt()+500,Zl(e,t)):Bl=pi(e,t);e:do try{if(Xe!==0&&Ae!==null){t=Ae;var r=en;t:switch(Xe){case 1:Xe=0,en=null,Pl(e,t,r,1);break;case 2:case 9:if(Mf(r)){Xe=0,en=null,M0(t);break}t=function(){Xe!==2&&Xe!==9||Ze!==e||(Xe=7),Ln(e)},r.then(t,t);break e;case 3:Xe=7;break e;case 4:Xe=5;break e;case 7:Mf(r)?(Xe=0,en=null,M0(t)):(Xe=0,en=null,Pl(e,t,r,7));break;case 5:var m=null;switch(Ae.tag){case 26:m=Ae.memoizedState;case 5:case 27:var h=Ae;if(m?Sp(m):h.stateNode.complete){Xe=0,en=null;var x=h.sibling;if(x!==null)Ae=x;else{var E=h.return;E!==null?(Ae=E,Tr(E)):Ae=null}break t}}Xe=0,en=null,Pl(e,t,r,5);break;case 6:Xe=0,en=null,Pl(e,t,r,6);break;case 8:lc(),lt=6;break e;default:throw Error(c(462))}}Tg();break}catch(O){E0(e,O)}while(!0);return Fn=Pa=null,ee.H=l,ee.A=i,He=a,Ae!==null?0:(Ze=null,Oe=0,Os(),lt)}function Tg(){for(;Ae!==null&&!Bh();)R0(Ae)}function R0(e){var t=Zm(e.alternate,e,ia);e.memoizedProps=e.pendingProps,t===null?Tr(e):Ae=t}function M0(e){var t=e,a=t.alternate;switch(t.tag){case 15:case 0:t=Ym(a,t,t.pendingProps,t.type,void 0,Oe);break;case 11:t=Ym(a,t,t.pendingProps,t.type.render,t.ref,Oe);break;case 5:fu(t);var l=t;l===bt&&(Ne?($s(l),l.tag===5&&l.stateNode!=null&&(Ke=l.stateNode)):($s(l),Ne=!0));default:Km(a,t),t=Ae=wf(t,ia),t=Zm(a,t,ia)}e.memoizedProps=e.pendingProps,t===null?Tr(e):Ae=t}function Pl(e,t,a,l){Fn=Pa=null,fu(t),zl=null,Ri=0;var i=t.return;try{if(fg(e,i,t,a,Oe)){lt=1,ar(e,dn(a,e.current)),Ae=null;return}}catch(r){if(i!==null)throw Ae=i,r;lt=1,ar(e,dn(a,e.current)),Ae=null;return}t.flags&32768?(Ne||l===1?e=!0:Bl||(Oe&536870912)!==0?e=!1:(ka=e=!0,(l===2||l===9||l===3||l===6)&&(l=Nt.current,l!==null&&l.tag===13&&(l.flags|=16384))),z0(t,e)):Tr(t)}function Tr(e){var t=e;do{if((t.flags&32768)!==0){z0(t,ka);return}e=t.return;var a=_g(t.alternate,t,ia);if(a!==null){Ae=a;return}if(t=t.sibling,t!==null){Ae=t;return}Ae=t=e}while(t!==null);lt===0&&(lt=5)}function z0(e,t){do{var a=gg(e.alternate,e);if(a!==null){a.flags&=32767,Ae=a;return}if(a=e.return,a!==null&&(a.flags|=32768,a.subtreeFlags=0,a.deletions=null),!t&&(e=e.sibling,e!==null)){Ae=e;return}Ae=e=a}while(e!==null);lt=6,Ae=null}function q0(e,t,a,l,i,r,m,h,x,E,O,z){e.cancelPendingCommit=null;do Nr();while(tt!==0);if((He&6)!==0)throw Error(c(327));if(t!==null){if(t===e.current)throw Error(c(177));e===Ze&&(Ae=Ze=null,Oe=0),ol=t,jn=e,Un=a,ac=i,S0=l,Ng(e,t,a,m,h,x,z)}}function Ng(e,t,a,l,i,r,m){var h=t.lanes|t.childLanes;if(nc=h,h|=Ho,Wh(e,a,h,l,i,r),Vl=null,(a&335544064)===a?(Il=eg(e),l=10262):(Il=null,l=10256),(t.subtreeFlags&l)!==0||(t.flags&l)!==0?(e.callbackNode=null,e.callbackPriority=0,Rg(ps,function(){return uc(),null})):(e.callbackNode=null,e.callbackPriority=0),dr=!1,l=(t.flags&13878)!==0,(t.subtreeFlags&13878)!==0||l){l=ee.T,ee.T=null,i=de.p,de.p=2,r=He,He|=4;try{bg(e,t,a)}finally{He=r,de.p=i,ee.T=l}}tt=1,dr?Xl=Wg(m,e.containerInfo,Il,sc,rc,Eg,oc,uc,kg):(sc(),rc(),oc())}function kg(e){if(tt!==0){var t=jn.onRecoverableError;t(e,{componentStack:null})}}function Eg(){tt===3&&(tt=0,g0(ol,jn),tt=4)}function sc(){if(tt===1){tt=0;var e=jn,t=ol,a=Un,l=(t.flags&13878)!==0;if((t.subtreeFlags&13878)!==0||l){l=ee.T,ee.T=null;var i=de.p;de.p=2;var r=He;He|=4;try{Xi=pr=!1,h0(t,e,a),a=xc;var m=ff(e.containerInfo),h=a.focusedElem,x=a.selectionRange;if(m!==h&&h&&h.ownerDocument&&df(h.ownerDocument.documentElement,h)){if(x!==null&&qo(h)){var E=x.start,O=x.end;if(O===void 0&&(O=E),"selectionStart"in h)h.selectionStart=E,h.selectionEnd=Math.min(O,h.value.length);else{var z=h.ownerDocument||document,T=z&&z.defaultView||window;if(T.getSelection){var C=T.getSelection(),I=h.textContent.length,W=Math.min(x.start,I),ve=x.end===void 0?W:Math.min(x.end,I);!C.extend&&W>ve&&(m=ve,ve=W,W=m);var k=cf(h,W),j=cf(h,ve);if(k&&j&&(C.rangeCount!==1||C.anchorNode!==k.node||C.anchorOffset!==k.offset||C.focusNode!==j.node||C.focusOffset!==j.offset)){var A=z.createRange();A.setStart(k.node,k.offset),C.removeAllRanges(),W>ve?(C.addRange(A),C.extend(j.node,j.offset)):(A.setEnd(j.node,j.offset),C.addRange(A))}}}}for(z=[],C=h;C=C.parentNode;)C.nodeType===1&&z.push({element:C,left:C.scrollLeft,top:C.scrollTop});for(typeof h.focus=="function"&&h.focus(),h=0;h<z.length;h++){var M=z[h];M.element.scrollLeft=M.left,M.element.scrollTop=M.top}}ai=!!vc,xc=vc=null}finally{He=r,de.p=i,ee.T=l}}e.current=t,tt=2}}function rc(){if(tt===2){tt=0;var e=jn,t=ol,a=(t.flags&8772)!==0;if((t.subtreeFlags&8772)!==0||a){a=ee.T,ee.T=null;var l=de.p;de.p=2;var i=He;He|=4;try{u0(e,t.alternate,t)}finally{He=i,de.p=l,ee.T=a}}tt=3}}function oc(){if(tt===4||tt===3){tt=0;var e=Xl;Xl=null,Gh();var t=jn,a=ol,l=Un,i=S0,r=(l&335544064)===l?10262:10256;if((a.subtreeFlags&r)!==0||(a.flags&r)!==0?tt=5:(tt=0,ol=jn=null,D0(t,t.pendingLanes)),r=t.pendingLanes,r===0&&(Aa=null),go(l),a=a.stateNode,Zt&&typeof Zt.onCommitFiberRoot=="function")try{Zt.onCommitFiberRoot(mi,a,void 0,(a.current.flags&128)===128)}catch{}if(i!==null){a=ee.T,r=de.p,de.p=2,ee.T=null;try{for(var m=t.onRecoverableError,h=0;h<i.length;h++){var x=i[h];m(x.value,{componentStack:x.stack})}}finally{ee.T=a,de.p=r}}if(i=Vl,m=Il,Il=null,i!==null&&(Vl=null,m===null&&(m=[]),e!==null))for(x=0;x<i.length;x++)a=(0,i[x])(m),a!==void 0&&e.finished.finally(a);(Un&3)!==0&&Nr(),Ln(t),r=t.pendingLanes,(l&261930)!==0&&(r&42)!==0?t===wr?Zi++:(Zi=0,wr=t):(Zi=0,wr=null),Pi(0)}}function D0(e,t){(e.pooledCacheLanes&=t)===0&&(t=e.pooledCache,t!=null&&(e.pooledCache=null,Ai(t)))}function Nr(){return Xl!==null&&(Xl.skipTransition(),Xl=null),sc(),rc(),oc(),uc()}function uc(){if(tt!==5)return!1;var e=jn,t=nc;nc=0;var a=go(Un),l=ee.T,i=de.p;try{de.p=32>a?32:a,ee.T=null,a=ac,ac=null;var r=jn,m=Un;if(tt=0,ol=jn=null,Un=0,(He&6)!==0)throw Error(c(331));var h=He;if(He|=4,x0(r.current),b0(r,r.current,m,a),He=h,Pi(0,!1),Zt&&typeof Zt.onPostCommitFiberRoot=="function")try{Zt.onPostCommitFiberRoot(mi,r)}catch{}return!0}finally{de.p=i,ee.T=l,D0(e,t)}}function $0(e,t,a){t=dn(a,t),t=Nu(e.stateNode,t,2),e=xa(e,t,2),e!==null&&(hi(e,2),Ln(e))}function Ve(e,t,a){if(e.tag===3)$0(e,e,a);else for(;t!==null;){if(t.tag===3){$0(t,e,a);break}else if(t.tag===1){var l=t.stateNode;if(typeof t.type.getDerivedStateFromError=="function"||typeof l.componentDidCatch=="function"&&(Aa===null||!Aa.has(l))){e=dn(a,e),a=Mm(2),l=xa(t,a,2),l!==null&&(zm(a,l,t,e),hi(l,2),Ln(l));break}}t=t.return}}function cc(e,t,a){var l=e.pingCache;if(l===null){l=e.pingCache=new xg;var i=new Set;l.set(t,i)}else i=l.get(t),i===void 0&&(i=new Set,l.set(t,i));i.has(a)||(ec=!0,i.add(a),e=Ag.bind(null,e,t,a),t.then(e,e))}function Ag(e,t,a){var l=e.pingCache;l!==null&&l.delete(t),e.pingedLanes|=e.suspendedLanes&a,e.warmLanes&=~a,Ze===e&&(Oe&a)===a&&((lt===4||lt===3&&(Oe&62914560)===Oe&&300>Qt()-yr)&&(He&2)===0?Zl(e,0):br|=a,Gl===Oe&&(Gl=0)),Ln(e)}function U0(e,t){t===0&&(t=wd()),e=Ia(e,t),e!==null&&(hi(e,t),Ln(e))}function Cg(e){var t=e.memoizedState,a=0;t!==null&&(a=t.retryLane),U0(e,a)}function Og(e,t){var a=0;switch(e.tag){case 31:case 13:var l=e.stateNode,i=e.memoizedState;i!==null&&(a=i.retryLane);break;case 19:l=e.stateNode;break;case 22:l=e.stateNode._retryCache;break;default:throw Error(c(314))}l!==null&&l.delete(t),U0(e,a)}function Rg(e,t){return mo(e,t)}var Kl=null,Jl=null,dc=!1,kr=!1,fc=!1,Oa=0;function Ln(e){e!==Jl&&e.next===null&&(Jl===null?Kl=Jl=e:Jl=Jl.next=e),kr=!0,dc||(dc=!0,zg())}function Pi(e,t){if(!fc&&kr){fc=!0;do for(var a=!1,l=Kl;l!==null;){if(e!==0){var i=l.pendingLanes;if(i===0)var r=0;else{var m=l.suspendedLanes,h=l.pingedLanes;r=(1<<31-Pt(42|e)+1)-1,r&=i&~(m&~h),r=r&201326741?r&201326741|1:r?r|2:0}r!==0&&(a=!0,B0(l,r))}else r=Oe,r=bs(l,l===Ze?r:0,l.cancelPendingCommit!==null||l.timeoutHandle!==-1),(r&3)===0||pi(l,r)||(a=!0,B0(l,r));l=l.next}while(a);fc=!1}}function Mg(){L0()}function L0(){kr=dc=!1;var e=0;Oa!==0&&Vg()&&(e=Oa);for(var t=Qt(),a=null,l=Kl;l!==null;){var i=l.next,r=H0(l,t);r===0?(l.next=null,a===null?Kl=i:a.next=i,i===null&&(Jl=a)):(a=l,(e!==0||(r&3)!==0)&&(kr=!0)),l=i}tt!==0&&tt!==5||Pi(e),Oa!==0&&(Oa=0)}function H0(e,t){for(var a=e.suspendedLanes,l=e.pingedLanes,i=e.expirationTimes,r=e.pendingLanes&-62914561;0<r;){var m=31-Pt(r),h=1<<m,x=i[m];x===-1?((h&a)===0||(h&l)!==0)&&(i[m]=Jh(h,t)):x<=t&&(e.expiredLanes|=h),r&=~h}if(t=Ze,a=Oe,a=bs(e,e===t?a:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),l=e.callbackNode,a===0||e===t&&(Xe===2||Xe===9)||e.cancelPendingCommit!==null)return l!==null&&l!==null&&po(l),e.callbackNode=null,e.callbackPriority=0;if((a&3)===0||pi(e,a)){if(t=a&-a,t===e.callbackPriority)return t;switch(l!==null&&po(l),go(a)){case 2:case 8:a=yd;break;case 32:a=ps;break;case 268435456:a=vd;break;default:a=ps}return l=Y0.bind(null,e),a=mo(a,l),e.callbackPriority=t,e.callbackNode=a,t}return l!==null&&l!==null&&po(l),e.callbackPriority=2,e.callbackNode=null,2}function Y0(e,t){if(tt!==0&&tt!==5)return e.callbackNode=null,e.callbackPriority=0,null;var a=e.callbackNode;if(Nr()&&e.callbackNode!==a)return null;var l=Oe;return l=bs(e,e===Ze?l:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),l===0?null:(N0(e,l,t),H0(e,Qt()),e.callbackNode!=null&&e.callbackNode===a?Y0.bind(null,e):null)}function B0(e,t){if(Nr())return null;N0(e,t,!0)}function zg(){Qg(function(){(He&6)!==0?mo(bd,Mg):L0()})}function mc(){if(Oa===0){var e=Wa;e===0&&(e=hs,hs<<=1,(hs&261888)===0&&(hs=256)),Oa=e}return Oa}function G0(e){return e==null||typeof e=="symbol"||typeof e=="boolean"?null:typeof e=="function"?e:js(e)}function qg(e,t,a,l,i){if(t==="submit"&&a&&a.stateNode===i){var r=G0((i[Yt]||null).action),m=l.submitter;m&&(t=(t=m[Yt]||null)?G0(t.formAction):m.getAttribute("formAction"),t!==null&&(r=t,m=null));var h=new ks("action","action",null,l,i);e.push({event:h,listeners:[{instance:null,listener:function(){if(l.defaultPrevented){if(Oa!==0){var x=new FormData(i,m);xu(a,{pending:!0,data:x,method:i.method,action:r},null,x)}}else typeof r=="function"&&(h.preventDefault(),x=new FormData(i,m),xu(a,{pending:!0,data:x,method:i.method,action:r},r,x))},currentTarget:i}]})}}for(var pc=0;pc<Lo.length;pc++){var hc=Lo[pc],Dg=hc.toLowerCase(),$g=hc[0].toUpperCase()+hc.slice(1);yn(Dg,"on"+$g)}yn(hf,"onAnimationEnd"),yn(_f,"onAnimationIteration"),yn(gf,"onAnimationStart"),yn("dblclick","onDoubleClick"),yn("focusin","onFocus"),yn("focusout","onBlur"),yn(I_,"onTransitionRun"),yn(Q_,"onTransitionStart"),yn(Z_,"onTransitionCancel"),yn(bf,"onTransitionEnd"),yl("onMouseEnter",["mouseout","mouseover"]),yl("onMouseLeave",["mouseout","mouseover"]),yl("onPointerEnter",["pointerout","pointerover"]),yl("onPointerLeave",["pointerout","pointerover"]),Ga("onChange","change click focusin focusout input keydown keyup selectionchange".split(" ")),Ga("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),Ga("onBeforeInput",["compositionend","keypress","textInput","paste"]),Ga("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" ")),Ga("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" ")),Ga("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var Ki="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),Ug=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Ki));function X0(e,t){t=(t&4)!==0;for(var a=0;a<e.length;a++){var l=e[a],i=l.event;l=l.listeners;e:{var r=void 0;if(t)for(var m=l.length-1;0<=m;m--){var h=l[m],x=h.instance,E=h.currentTarget;if(h=h.listener,x!==r&&i.isPropagationStopped())break e;r=h,i.currentTarget=E;try{r(i)}catch(O){Cs(O)}i.currentTarget=null,r=x}else for(m=0;m<l.length;m++){if(h=l[m],x=h.instance,E=h.currentTarget,h=h.listener,x!==r&&i.isPropagationStopped())break e;r=h,i.currentTarget=E;try{r(i)}catch(O){Cs(O)}i.currentTarget=null,r=x}}}}function Ce(e,t){var a=t[Ed];a===void 0&&(a=t[Ed]=new Set);var l=e+"__bubble";a.has(l)||(V0(t,e,2,!1),a.add(l))}function _c(e,t,a){var l=0;t&&(l|=4),V0(a,e,l,t)}var Er="_reactListening"+Math.random().toString(36).slice(2);function gc(e){if(!e[Er]){e[Er]=!0,Od.forEach(function(a){a!=="selectionchange"&&(Ug.has(a)||_c(a,!1,e),_c(a,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[Er]||(t[Er]=!0,_c("selectionchange",!1,t))}}function V0(e,t,a,l){switch(zp(t)){case 2:var i=Cb;break;case 8:i=Ob;break;default:i=$c}a=i.bind(null,t,a,e),i=void 0,!To||t!=="touchstart"&&t!=="touchmove"&&t!=="wheel"||(i=!0),l?i!==void 0?e.addEventListener(t,a,{capture:!0,passive:i}):e.addEventListener(t,a,!0):i!==void 0?e.addEventListener(t,a,{passive:i}):e.addEventListener(t,a,!1)}function bc(e,t,a,l,i){var r=l;if((t&1)===0&&(t&2)===0&&l!==null)e:for(;;){if(l===null)return;var m=l.tag;if(m===3||m===4){var h=l.stateNode.containerInfo;if(h===i)break;if(m===4)for(m=l.return;m!==null;){var x=m.tag;if((x===3||x===4)&&m.stateNode.containerInfo===i)return;m=m.return}for(;h!==null;){if(m=Ba(h),m===null)return;if(x=m.tag,x===5||x===6||x===26||x===27){l=r=m;continue e}h=h.parentNode}}l=l.return}Xd(function(){var E=r,O=jo(a),z=[];e:{var T=yf.get(e);if(T!==void 0){var C=ks,I=e;switch(e){case"keypress":if(Ts(a)===0)break e;case"keydown":case"keyup":C=w_;break;case"focusin":I="focus",C=Ao;break;case"focusout":I="blur",C=Ao;break;case"beforeblur":case"afterblur":C=Ao;break;case"click":if(a.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":C=Qd;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":C=c_;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":C=k_;break;case hf:case _f:case gf:C=m_;break;case bf:C=A_;break;case"scroll":case"scrollend":C=o_;break;case"wheel":C=O_;break;case"copy":case"cut":case"paste":C=h_;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":C=Pd;break;case"submit":C=T_;break;case"toggle":case"beforetoggle":C=M_}var W=(t&4)!==0,ve=!W&&(e==="scroll"||e==="scrollend"),k=W?T!==null?T+"Capture":null:T;W=[];for(var j=E,A;j!==null;){var M=j;if(A=M.stateNode,M=M.tag,M!==5&&M!==26&&M!==27||A===null||k===null||(M=bi(j,k),M!=null&&W.push(Ji(j,M,A))),ve)break;j=j.return}0<W.length&&(T=new C(T,I,null,a,O),z.push({event:T,listeners:W}))}}if((t&7)===0){e:{if(C=e==="mouseover"||e==="pointerover",T=e==="mouseout"||e==="pointerout",C&&a!==wo&&(I=a.relatedTarget||a.fromElement)&&(Ba(I)||I[_l]))break e;(T||C)&&(I=O.window===O?O:(C=O.ownerDocument)?C.defaultView||C.parentWindow:window,T?(C=a.relatedTarget||a.toElement,T=E,C=C?Ba(C):null,C!==null&&(ve=f(C),W=C.tag,C!==ve||W!==5&&W!==27&&W!==6)&&(C=null)):(T=null,C=E),T!==C&&(W=Qd,M="onMouseLeave",k="onMouseEnter",j="mouse",(e==="pointerout"||e==="pointerover")&&(W=Pd,M="onPointerLeave",k="onPointerEnter",j="pointer"),ve=T==null?I:gi(T),A=C==null?I:gi(C),I=new W(M,j+"leave",T,a,O),I.target=ve,I.relatedTarget=A,M=null,Ba(O)===E&&(W=new W(k,j+"enter",C,a,O),W.target=A,W.relatedTarget=ve,M=W),ve=M,W=T&&C?ce(T,C,Lg):null,T!==null&&I0(z,I,T,W,!1),C!==null&&ve!==null&&I0(z,ve,C,W,!0)))}e:{if(T=E?gi(E):window,C=T.nodeName&&T.nodeName.toLowerCase(),C==="select"||C==="input"&&T.type==="file")var K=af;else if(tf(T))if(lf)K=G_;else{K=Y_;var Re=H_}else C=T.nodeName,!C||C.toLowerCase()!=="input"||T.type!=="checkbox"&&T.type!=="radio"?E&&xo(E.elementType)&&(K=af):K=B_;if(K&&(K=K(e,E))){nf(z,K,a,O);break e}Re&&Re(e,T,E)}switch(Re=E?gi(E):window,e){case"focusin":(tf(Re)||Re.contentEditable==="true")&&(Tl=Re,Do=E,Ni=null);break;case"focusout":Ni=Do=Tl=null;break;case"mousedown":$o=!0;break;case"contextmenu":case"mouseup":case"dragend":$o=!1,mf(z,a,O);break;case"selectionchange":if(V_)break;case"keydown":case"keyup":mf(z,a,O)}var le;if(Oo)e:{switch(e){case"compositionstart":var re="onCompositionStart";break e;case"compositionend":re="onCompositionEnd";break e;case"compositionupdate":re="onCompositionUpdate";break e}re=void 0}else Sl?Fd(e,a)&&(re="onCompositionEnd"):e==="keydown"&&a.keyCode===229&&(re="onCompositionStart");re&&(Kd&&a.locale!=="ko"&&(Sl||re!=="onCompositionStart"?re==="onCompositionEnd"&&Sl&&(le=Vd()):(fa=O,No="value"in fa?fa.value:fa.textContent,Sl=!0)),Re=Ar(E,re),0<Re.length&&(re=new Zd(re,e,null,a,O),z.push({event:re,listeners:Re}),le?re.data=le:(le=ef(a),le!==null&&(re.data=le)))),(le=q_?D_(e,a):$_(e,a))&&(re=Ar(E,"onBeforeInput"),0<re.length&&(Re=new Zd("onBeforeInput","beforeinput",null,a,O),z.push({event:Re,listeners:re}),Re.data=le)),qg(z,e,E,a,O)}X0(z,t)})}function Ji(e,t,a){return{instance:e,listener:t,currentTarget:a}}function Ar(e,t){for(var a=t+"Capture",l=[];e!==null;){var i=e,r=i.stateNode;if(i=i.tag,i!==5&&i!==26&&i!==27||r===null||(i=bi(e,a),i!=null&&l.unshift(Ji(e,i,r)),i=bi(e,t),i!=null&&l.push(Ji(e,i,r))),e.tag===3)return l;e=e.return}return[]}function Lg(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5&&e.tag!==27);return e||null}function I0(e,t,a,l,i){for(var r=t._reactName,m=[];a!==null&&a!==l;){var h=a,x=h.alternate,E=h.stateNode;if(h=h.tag,x!==null&&x===l)break;h!==5&&h!==26&&h!==27||E===null||(x=E,i?(E=bi(a,r),E!=null&&m.unshift(Ji(a,E,x))):i||(E=bi(a,r),E!=null&&m.push(Ji(a,E,x)))),a=a.return}m.length!==0&&e.push({event:t,listeners:m})}var Hg=/\r\n?/g,Yg=/\u0000|\uFFFD/g;function Q0(e){return(typeof e=="string"?e:""+e).replace(Hg,`
`).replace(Yg,"")}function Z0(e,t){return t=Q0(t),Q0(e)===t}function Ie(e,t,a,l,i,r){switch(a){case"children":if(typeof l=="string")t==="body"||t==="textarea"&&l===""||xl(e,l);else if(typeof l=="number"||typeof l=="bigint")t!=="body"&&xl(e,""+l);else return;break;case"className":ws(e,"class",l);break;case"tabIndex":ws(e,"tabindex",l);break;case"dir":case"role":case"viewBox":case"width":case"height":ws(e,a,l);break;case"style":Bd(e,l,r);return;case"data":if(t!=="object"){ws(e,"data",l);break}case"src":case"href":if(l===""&&(t!=="a"||a!=="href")){e.removeAttribute(a);break}if(l==null||typeof l=="function"||typeof l=="symbol"||typeof l=="boolean"){e.removeAttribute(a);break}l=js(l),e.setAttribute(a,l);break;case"action":case"formAction":if(typeof l=="function"){e.setAttribute(a,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof r=="function"&&(a==="formAction"?(t!=="input"&&Ie(e,t,"name",i.name,i,null),Ie(e,t,"formEncType",i.formEncType,i,null),Ie(e,t,"formMethod",i.formMethod,i,null),Ie(e,t,"formTarget",i.formTarget,i,null)):(Ie(e,t,"encType",i.encType,i,null),Ie(e,t,"method",i.method,i,null),Ie(e,t,"target",i.target,i,null)));if(l==null||typeof l=="symbol"||typeof l=="boolean"){e.removeAttribute(a);break}l=js(l),e.setAttribute(a,l);break;case"onClick":l!=null&&(e.onclick=An);return;case"onScroll":l!=null&&Ce("scroll",e);return;case"onScrollEnd":l!=null&&Ce("scrollend",e);return;case"dangerouslySetInnerHTML":if(l!=null){if(typeof l!="object"||!("__html"in l))throw Error(c(61));if(a=l.__html,a!=null){if(i.children!=null)throw Error(c(60));r?.__html!==a&&(e.innerHTML=a)}}break;case"multiple":e.multiple=l&&typeof l!="function"&&typeof l!="symbol";break;case"muted":e.muted=l&&typeof l!="function"&&typeof l!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(l==null||typeof l=="function"||typeof l=="boolean"||typeof l=="symbol"){e.removeAttribute("xlink:href");break}a=js(l),e.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",a);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":l!=null&&typeof l!="function"&&typeof l!="symbol"?e.setAttribute(a,l):e.removeAttribute(a);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"credentialless":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":l&&typeof l!="function"&&typeof l!="symbol"?e.setAttribute(a,""):e.removeAttribute(a);break;case"capture":case"download":l===!0?e.setAttribute(a,""):l!==!1&&l!=null&&typeof l!="function"&&typeof l!="symbol"?e.setAttribute(a,l):e.removeAttribute(a);break;case"cols":case"rows":case"size":case"span":l!=null&&typeof l!="function"&&typeof l!="symbol"&&!isNaN(l)&&1<=l?e.setAttribute(a,l):e.removeAttribute(a);break;case"rowSpan":case"start":l==null||typeof l=="function"||typeof l=="symbol"||isNaN(l)?e.removeAttribute(a):e.setAttribute(a,l);break;case"popover":Ce("beforetoggle",e),Ce("toggle",e),xs(e,"popover",l);break;case"xlinkActuate":Qn(e,"http://www.w3.org/1999/xlink","xlink:actuate",l);break;case"xlinkArcrole":Qn(e,"http://www.w3.org/1999/xlink","xlink:arcrole",l);break;case"xlinkRole":Qn(e,"http://www.w3.org/1999/xlink","xlink:role",l);break;case"xlinkShow":Qn(e,"http://www.w3.org/1999/xlink","xlink:show",l);break;case"xlinkTitle":Qn(e,"http://www.w3.org/1999/xlink","xlink:title",l);break;case"xlinkType":Qn(e,"http://www.w3.org/1999/xlink","xlink:type",l);break;case"xmlBase":Qn(e,"http://www.w3.org/XML/1998/namespace","xml:base",l);break;case"xmlLang":Qn(e,"http://www.w3.org/XML/1998/namespace","xml:lang",l);break;case"xmlSpace":Qn(e,"http://www.w3.org/XML/1998/namespace","xml:space",l);break;case"is":xs(e,"is",l);break;case"innerText":case"textContent":return;default:if(!(2<a.length)||a[0]!=="o"&&a[0]!=="O"||a[1]!=="n"&&a[1]!=="N")a=s_.get(a)||a,xs(e,a,l);else return}Ue=!0}function yc(e,t,a,l,i,r){switch(a){case"style":Bd(e,l,r);return;case"dangerouslySetInnerHTML":if(l!=null){if(typeof l!="object"||!("__html"in l))throw Error(c(61));if(a=l.__html,a!=null){if(i.children!=null)throw Error(c(60));r?.__html!==a&&(e.innerHTML=a)}}break;case"children":if(typeof l=="string")xl(e,l);else if(typeof l=="number"||typeof l=="bigint")xl(e,""+l);else return;break;case"onScroll":l!=null&&Ce("scroll",e);return;case"onScrollEnd":l!=null&&Ce("scrollend",e);return;case"onClick":l!=null&&(e.onclick=An);return;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":return;case"innerText":case"textContent":return;default:if(!Rd.hasOwnProperty(a))e:{if(a[0]==="o"&&a[1]==="n"&&(i=a.endsWith("Capture"),r=a.slice(2,i?a.length-7:void 0),t=e[Yt]||null,t=t!=null?t[a]:null,typeof t=="function"&&e.removeEventListener(r,t,i),typeof l=="function")){typeof t!="function"&&t!==null&&(a in e?e[a]=null:e.hasAttribute(a)&&e.removeAttribute(a)),e.addEventListener(r,l,i);break e}Ue=!0,a in e?e[a]=l:l===!0?e.setAttribute(a,""):xs(e,a,l)}return}Ue=!0}function At(e,t,a){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":Ce("error",e),Ce("load",e);var l=!1,i=!1,r;for(r in a)if(a.hasOwnProperty(r)){var m=a[r];if(m!=null)switch(r){case"src":l=!0;break;case"srcSet":i=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error(c(137,t));default:Ie(e,t,r,m,a,null)}}i&&Ie(e,t,"srcSet",a.srcSet,a,null),l&&Ie(e,t,"src",a.src,a,null);return;case"input":Ce("invalid",e);var h=r=m=i=null,x=null,E=null;for(l in a)if(a.hasOwnProperty(l)){var O=a[l];if(O!=null)switch(l){case"name":i=O;break;case"type":m=O;break;case"checked":x=O;break;case"defaultChecked":E=O;break;case"value":r=O;break;case"defaultValue":h=O;break;case"children":case"dangerouslySetInnerHTML":if(O!=null)throw Error(c(137,t));break;default:Ie(e,t,l,O,a,null)}}Ud(e,r,h,x,E,m,i,!1);return;case"select":Ce("invalid",e),l=m=r=null;for(i in a)if(a.hasOwnProperty(i)&&(h=a[i],h!=null))switch(i){case"value":r=h;break;case"defaultValue":m=h;break;case"multiple":l=h;default:Ie(e,t,i,h,a,null)}t=r,a=m,e.multiple=!!l,t!=null?vl(e,!!l,t,!1):a!=null&&vl(e,!!l,a,!0);return;case"textarea":Ce("invalid",e),r=i=l=null;for(m in a)if(a.hasOwnProperty(m)&&(h=a[m],h!=null))switch(m){case"value":l=h;break;case"defaultValue":i=h;break;case"children":r=h;break;case"dangerouslySetInnerHTML":if(h!=null)throw Error(c(91));break;default:Ie(e,t,m,h,a,null)}Hd(e,l,i,r);return;case"option":for(x in a)a.hasOwnProperty(x)&&(l=a[x],l!=null)&&(x==="selected"?e.selected=l&&typeof l!="function"&&typeof l!="symbol":Ie(e,t,x,l,a,null));return;case"dialog":Ce("beforetoggle",e),Ce("toggle",e),Ce("cancel",e),Ce("close",e);break;case"iframe":case"object":Ce("load",e);break;case"video":case"audio":for(l=0;l<Ki.length;l++)Ce(Ki[l],e);break;case"image":Ce("error",e),Ce("load",e);break;case"details":Ce("toggle",e);break;case"embed":case"source":case"link":Ce("error",e),Ce("load",e);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for(E in a)if(a.hasOwnProperty(E)&&(l=a[E],l!=null))switch(E){case"children":case"dangerouslySetInnerHTML":throw Error(c(137,t));default:Ie(e,t,E,l,a,null)}return;default:if(xo(t)){for(O in a)a.hasOwnProperty(O)&&(l=a[O],l!==void 0&&yc(e,t,O,l,a,void 0));return}}for(h in a)a.hasOwnProperty(h)&&(l=a[h],l!=null&&Ie(e,t,h,l,a,null))}var Bg={};function Gg(e,t,a,l){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var i=null,r=null,m=null,h=null,x=null,E=null,O=null;for(C in a){var z=a[C];if(a.hasOwnProperty(C)&&z!=null)switch(C){case"checked":break;case"value":break;case"defaultValue":x=z;default:l.hasOwnProperty(C)||Ie(e,t,C,null,l,z)}}for(var T in l){var C=l[T];if(z=a[T],l.hasOwnProperty(T)&&(C!=null||z!=null))switch(T){case"type":C!==z&&(Ue=!0),r=C;break;case"name":C!==z&&(Ue=!0),i=C;break;case"checked":C!==z&&(Ue=!0),E=C;break;case"defaultChecked":C!==z&&(Ue=!0),O=C;break;case"value":C!==z&&(Ue=!0),m=C;break;case"defaultValue":C!==z&&(Ue=!0),h=C;break;case"children":case"dangerouslySetInnerHTML":if(C!=null)throw Error(c(137,t));break;default:C!==z&&Ie(e,t,T,C,l,z)}}yo(e,m,h,x,E,O,r,i);return;case"select":C=m=h=T=null;for(r in a)if(x=a[r],a.hasOwnProperty(r)&&x!=null)switch(r){case"value":break;case"multiple":C=x;default:l.hasOwnProperty(r)||Ie(e,t,r,null,l,x)}for(i in l)if(r=l[i],x=a[i],l.hasOwnProperty(i)&&(r!=null||x!=null))switch(i){case"value":r!==x&&(Ue=!0),T=r;break;case"defaultValue":r!==x&&(Ue=!0),h=r;break;case"multiple":r!==x&&(Ue=!0),m=r;default:r!==x&&Ie(e,t,i,r,l,x)}t=h,a=m,l=C,T!=null?vl(e,!!a,T,!1):!!l!=!!a&&(t!=null?vl(e,!!a,t,!0):vl(e,!!a,a?[]:"",!1));return;case"textarea":C=T=null;for(h in a)if(i=a[h],a.hasOwnProperty(h)&&i!=null&&!l.hasOwnProperty(h))switch(h){case"value":break;case"children":break;default:Ie(e,t,h,null,l,i)}for(m in l)if(i=l[m],r=a[m],l.hasOwnProperty(m)&&(i!=null||r!=null))switch(m){case"value":i!==r&&(Ue=!0),T=i;break;case"defaultValue":i!==r&&(Ue=!0),C=i;break;case"children":break;case"dangerouslySetInnerHTML":if(i!=null)throw Error(c(91));break;default:i!==r&&Ie(e,t,m,i,l,r)}Ld(e,T,C);return;case"option":for(var I in a)T=a[I],a.hasOwnProperty(I)&&T!=null&&!l.hasOwnProperty(I)&&(I==="selected"?e.selected=!1:Ie(e,t,I,null,l,T));for(x in l)T=l[x],C=a[x],l.hasOwnProperty(x)&&T!==C&&(T!=null||C!=null)&&(x==="selected"?(T!==C&&(Ue=!0),e.selected=T&&typeof T!="function"&&typeof T!="symbol"):Ie(e,t,x,T,l,C));return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var W in a)T=a[W],a.hasOwnProperty(W)&&T!=null&&!l.hasOwnProperty(W)&&Ie(e,t,W,null,l,T);for(E in l)if(T=l[E],C=a[E],l.hasOwnProperty(E)&&T!==C&&(T!=null||C!=null))switch(E){case"children":case"dangerouslySetInnerHTML":if(T!=null)throw Error(c(137,t));break;default:Ie(e,t,E,T,l,C)}return;default:if(xo(t)){for(var ve in a)T=a[ve],a.hasOwnProperty(ve)&&T!==void 0&&!l.hasOwnProperty(ve)&&yc(e,t,ve,void 0,l,T);for(O in l)T=l[O],C=a[O],!l.hasOwnProperty(O)||T===C||T===void 0&&C===void 0||yc(e,t,O,T,l,C);return}}for(var k in a)T=a[k],a.hasOwnProperty(k)&&T!=null&&!l.hasOwnProperty(k)&&Ie(e,t,k,null,l,T);for(z in l)T=l[z],C=a[z],!l.hasOwnProperty(z)||T===C||T==null&&C==null||Ie(e,t,z,T,l,C)}function P0(e){switch(e){case"css":case"script":case"font":case"img":case"image":case"input":case"link":return!0;default:return!1}}function Xg(){if(typeof performance.getEntriesByType=="function"){for(var e=0,t=0,a=performance.getEntriesByType("resource"),l=0;l<a.length;l++){var i=a[l],r=i.transferSize,m=i.initiatorType,h=i.duration;if(r&&h&&P0(m)){for(m=0,h=i.responseEnd,l+=1;l<a.length;l++){var x=a[l],E=x.startTime;if(E>h)break;var O=x.transferSize,z=x.initiatorType;O&&P0(z)&&(x=x.responseEnd,m+=O*(x<h?1:(h-E)/(x-E)))}if(--l,t+=8*(r+m)/(i.duration/1e3),e++,10<e)break}}if(0<e)return t/e/1e6}return navigator.connection&&(e=navigator.connection.downlink,typeof e=="number")?e:5}var vc=null,xc=null;function Wi(e){return e.nodeType===9?e:e.ownerDocument}function K0(e){switch(e){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function J0(e,t){if(e===0)switch(t){case"svg":return 1;case"math":return 2;default:return 0}return e===1&&t==="foreignObject"?0:e}function W0(e,t,a,l){return a=Wi(a).createElement(e),a[St]=l,a[Yt]=t,At(a,e,t),gt(a),a}function wc(e,t){return e==="textarea"||e==="noscript"||typeof t.children=="string"||typeof t.children=="number"||typeof t.children=="bigint"||typeof t.dangerouslySetInnerHTML=="object"&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var jc=null;function Vg(){var e=window.event;return e&&e.type==="popstate"?e===jc?!1:(jc=e,!0):(jc=null,!1)}var Sc=typeof setTimeout=="function"?setTimeout:void 0,Ig=typeof clearTimeout=="function"?clearTimeout:void 0,F0=typeof Promise=="function"?Promise:void 0,ep=typeof requestAnimationFrame=="function"?requestAnimationFrame:Sc,Qg=typeof queueMicrotask=="function"?queueMicrotask:typeof F0<"u"?function(e){return F0.resolve(null).then(e).catch(Zg)}:Sc;function Zg(e){setTimeout(function(){throw e})}function Ra(e){return e==="head"}function tp(e,t){var a=t,l=0;do{var i=a.nextSibling;if(e.removeChild(a),i&&i.nodeType===8)if(a=i.data,a==="/$"||a==="/&"){if(l===0){e.removeChild(i),li(t);return}l--}else if(a==="$"||a==="$?"||a==="$~"||a==="$!"||a==="&")l++;else if(a==="html")Rc(e.ownerDocument.documentElement);else if(a==="head"){a=e.ownerDocument.head,Rc(a);for(var r=a.firstChild;r;){var m=r.nextSibling,h=r.nodeName;r[_i]||h==="SCRIPT"||h==="STYLE"||h==="LINK"&&r.rel.toLowerCase()==="stylesheet"||a.removeChild(r),r=m}}else a==="body"&&Rc(e.ownerDocument.body);a=i}while(a);li(t)}function np(e,t){var a=e;e=0;do{var l=a.nextSibling;if(a.nodeType===1?t?(a._stashedDisplay=a.style.display,a.style.display="none"):(a.style.display=a._stashedDisplay||"",a.getAttribute("style")===""&&a.removeAttribute("style")):a.nodeType===3&&(t?(a._stashedText=a.nodeValue,a.nodeValue=""):a.nodeValue=a._stashedText||""),l&&l.nodeType===8)if(a=l.data,a==="/$"){if(e===0)break;e--}else a!=="$"&&a!=="$?"&&a!=="$~"&&a!=="$!"||e++;a=l}while(a)}function ap(e,t,a){if(t=CSS.escape(t)!==t?"r-"+btoa(t).replace(/=/g,""):t,e.style.viewTransitionName=t,a!=null&&(e.style.viewTransitionClass=a),a=getComputedStyle(e),a.display==="inline"){if(t=e.getClientRects(),t.length===1)var l=1;else for(var i=l=0;i<t.length;i++){var r=t[i];0<r.width&&0<r.height&&l++}l===1&&(e=e.style,e.display=t.length===1?"inline-block":"block",e.marginTop="-"+a.paddingTop,e.marginBottom="-"+a.paddingBottom)}}function lp(e,t){e=e.style,t=t.style;var a=t!=null?t.hasOwnProperty("viewTransitionName")?t.viewTransitionName:t.hasOwnProperty("view-transition-name")?t["view-transition-name"]:null:null;e.viewTransitionName=a==null||typeof a=="boolean"?"":(""+a).trim(),a=t!=null?t.hasOwnProperty("viewTransitionClass")?t.viewTransitionClass:t.hasOwnProperty("view-transition-class")?t["view-transition-class"]:null:null,e.viewTransitionClass=a==null||typeof a=="boolean"?"":(""+a).trim(),e.display==="inline-block"&&(t==null?e.display=e.margin="":(a=t.display,e.display=a==null||typeof a=="boolean"?"":a,a=t.margin,a!=null?e.margin=a:(a=t.hasOwnProperty("marginTop")?t.marginTop:t["margin-top"],e.marginTop=a==null||typeof a=="boolean"?"":a,t=t.hasOwnProperty("marginBottom")?t.marginBottom:t["margin-bottom"],e.marginBottom=t==null||typeof t=="boolean"?"":t)))}function Pg(e,t,a){return a=a.ownerDocument.defaultView,{rect:e,abs:t.position==="absolute"||t.position==="fixed",clip:t.clipPath!=="none"||t.overflow!=="visible"||t.filter!=="none"||t.mask!=="none"||t.mask!=="none"||t.borderRadius!=="0px",view:0<=e.bottom&&0<=e.right&&e.top<=a.innerHeight&&e.left<=a.innerWidth}}function Tc(e){var t=e.getBoundingClientRect(),a=getComputedStyle(e);return Pg(t,a,e)}function Kg(e){return e.documentElement.clientHeight}function Jg(e){this.addEventListener("load",e),this.addEventListener("error",e)}function Wg(e,t,a,l,i,r,m,h,x){var E=t.nodeType===9?t:t.ownerDocument;try{var O=E.startViewTransition({update:function(){var T=E.defaultView,C=T.navigation&&T.navigation.transition,I=E.fonts.status;l();var W=[];if(I==="loaded"&&(Kg(E),E.fonts.status==="loading"&&W.push(E.fonts.ready)),I=W.length,e!==null)for(var ve=e.suspenseyImages,k=0,j=0;j<ve.length;j++){var A=ve[j];if(!A.complete){var M=A.getBoundingClientRect();if(0<M.bottom&&0<M.right&&M.top<T.innerHeight&&M.left<T.innerWidth){if(k+=Tp(A),k>Rr){W.length=I;break}A=new Promise(Jg.bind(A)),W.push(A)}}}if(0<W.length)return T=Promise.race([Promise.all(W),new Promise(function(K){return setTimeout(K,500)})]).then(i,i),(C?Promise.allSettled([C.finished,T]):T).then(r,r);if(i(),C)return C.finished.then(r,r);r()},types:a});E.__reactViewTransition=O;var z=[];return O.ready.then(function(){for(var T=E.documentElement.getAnimations({subtree:!0}),C=0;C<T.length;C++){var I=T[C],W=I.effect,ve=W.pseudoElement;if(ve!=null&&ve.startsWith("::view-transition")){z.push(I),I=W.getKeyframes();for(var k=ve=void 0,j=!0,A=0;A<I.length;A++){var M=I[A],K=M.width;if(ve===void 0)ve=K;else if(ve!==K){j=!1;break}if(K=M.height,k===void 0)k=K;else if(k!==K){j=!1;break}delete M.width,delete M.height,M.transform==="none"&&delete M.transform}j&&ve!==void 0&&k!==void 0&&(W.setKeyframes(I),j=getComputedStyle(W.target,W.pseudoElement),j.width!==ve||j.height!==k)&&(j=I[0],j.width=ve,j.height=k,j=I[I.length-1],j.width=ve,j.height=k,W.setKeyframes(I))}}m()},function(T){E.__reactViewTransition===O&&(E.__reactViewTransition=null);try{typeof T=="object"&&T!==null&&T.name==="InvalidStateError"&&(T.message==="View transition was skipped because document visibility state is hidden."||T.message==="Skipping view transition because document visibility state has become hidden."||T.message==="Skipping view transition because viewport size changed."||T.message==="Transition was aborted because of invalid state")&&(T=null),T!==null&&x(T)}finally{l(),i(),m()}}),O.finished.finally(function(){for(var T=0;T<z.length;T++)z[T].cancel();E.__reactViewTransition===O&&(E.__reactViewTransition=null),h()}),O}catch{return l(),i(),m(),null}}function ul(e,t){this._scope=document.documentElement,this._selector="::view-transition-"+e+"("+t+")"}ul.prototype.animate=function(e,t){return t=typeof t=="number"?{duration:t}:Q({},t),t.pseudoElement=this._selector,this._scope.animate(e,t)},ul.prototype.getAnimations=function(){for(var e=this._scope,t=this._selector,a=e.getAnimations({subtree:!0}),l=[],i=0;i<a.length;i++){var r=a[i].effect;r!==null&&r.target===e&&r.pseudoElement===t&&l.push(a[i])}return l},ul.prototype.getComputedStyle=function(){return getComputedStyle(this._scope,this._selector)};function ip(e){return{name:e,group:new ul("group",e),imagePair:new ul("image-pair",e),old:new ul("old",e),new:new ul("new",e)}}function an(e){this._fragmentFiber=e,this._observers=this._eventListeners=null}an.prototype.addEventListener=function(e,t,a){var l=null,i=null;if(!(a!=null&&typeof a!="boolean"&&(l=a.signal||null,l!==null&&l.aborted))){this._eventListeners===null&&(this._eventListeners=[]);var r=this._eventListeners;if(rp(r,e,t,a)===-1){var m=this,h=t;a!=null&&typeof a!="boolean"&&a.once===!0&&(h=function(x){m.removeEventListener(e,t,a),typeof t=="function"?t.call(this,x):t.handleEvent(x)}),l!==null&&(i=m.removeEventListener.bind(m,e,t,a),l.addEventListener("abort",i,{once:!0}),i=l.removeEventListener.bind(l,"abort",i)),l=Wl(a),r.push({type:e,listener:t,optionsOrUseCapture:a,attachedListener:h,cleanup:i}),b(this._fragmentFiber.child,!1,Fg,e,h,l)}this._eventListeners=r}};function Fg(e,t,a,l){return L(e).addEventListener(t,a,l),!1}an.prototype.removeEventListener=function(e,t,a){var l=this._eventListeners;if(l!==null&&(t=rp(l,e,t,a),t!==-1)){var i=l[t];a=i.attachedListener;var r=i.cleanup;i=Wl(i.optionsOrUseCapture),b(this._fragmentFiber.child,!1,eb,e,a,i),l.splice(t,1),r!==null&&r()}};function eb(e,t,a,l){return L(e).removeEventListener(t,a,l),!1}function Wl(e){return e!=null&&typeof e!="boolean"&&(e.once===!0||e.signal instanceof AbortSignal)?{capture:e.capture,passive:e.passive}:e}function sp(e){return e==null?"c=0":typeof e=="boolean"?"c="+(e?"1":"0"):"c="+(e.capture?"1":"0")}function rp(e,t,a,l){if(e.length===0)return-1;l=sp(l);for(var i=0;i<e.length;i++){var r=e[i];if(r.type===t&&r.listener===a&&sp(r.optionsOrUseCapture)===l)return i}return-1}an.prototype.dispatchEvent=function(e){var t=y(this._fragmentFiber);if(t===null)return!0;t=L(t);var a=this._eventListeners;if(a!==null&&0<a.length||!e.bubbles){var l=t.nodeType===9?t.createComment(""):document.createTextNode("");if(a)for(var i=0;i<a.length;i++){var r=a[i];l.addEventListener(r.type,r.attachedListener,Wl(r.optionsOrUseCapture))}if(t.appendChild(l),e=l.dispatchEvent(e),a)for(i=0;i<a.length;i++)r=a[i],l.removeEventListener(r.type,r.attachedListener,Wl(r.optionsOrUseCapture));return t.removeChild(l),e}return t.dispatchEvent(e)},an.prototype.focus=function(e){b(this._fragmentFiber.child,!0,op,e,void 0,void 0)};function op(e,t){return e.tag===6?!1:(e=L(e),fb(e,t))}an.prototype.focusLast=function(e){var t=[];b(this._fragmentFiber.child,!0,Nc,t,void 0,void 0);for(var a=t.length-1;0<=a&&!op(t[a],e);a--);};function Nc(e,t){return t.push(e),!1}an.prototype.blur=function(){var e=y(this._fragmentFiber);e!==null&&(e=L(e),e=Wi(e).activeElement,e!==null&&b(this._fragmentFiber.child,!1,tb,e,void 0,void 0))};function tb(e,t){return e.tag===6?!1:(e=L(e),e===t||e.contains(t)?(t.blur(),!0):!1)}an.prototype.observeUsing=function(e){this._observers===null&&(this._observers=new Set),this._observers.add(e),b(this._fragmentFiber.child,!1,nb,e,void 0,void 0)};function nb(e,t){return e.tag===6||(e=L(e),t.observe(e)),!1}an.prototype.unobserveUsing=function(e){var t=this._observers;if(t!==null&&t.has(e)){t.delete(e),b(this._fragmentFiber.child,!1,ab,e,void 0,void 0);for(var a=t=0;a<Sn.length;a++){var l=Sn[a];l.fragmentInstance===this&&l.observer===e?e.unobserve(l.instance):Sn[t++]=l}Sn.length=t}};function ab(e,t){return e.tag===6||(e=L(e),t.unobserve(e)),!1}var Sn=[],kc=!1;function lb(e,t,a){Sn.push({fragmentInstance:e,observer:t,instance:a}),kc||(kc=!0,mb(function(){kc=!1;var l=Sn;Sn=[];for(var i=0;i<l.length;i++){var r=l[i];r.observer.unobserve(r.instance)}}))}an.prototype.getClientRects=function(){var e=[];return b(this._fragmentFiber.child,!1,ib,e,void 0,void 0),e};function ib(e,t){if(e.tag===6){e=e.stateNode;var a=e.ownerDocument.createRange();a.selectNodeContents(e),t.push.apply(t,a.getClientRects())}else e=L(e),t.push.apply(t,e.getClientRects());return!1}an.prototype.getRootNode=function(e){var t=y(this._fragmentFiber);return t===null?this:L(t).getRootNode(e)},an.prototype.compareDocumentPosition=function(e){var t=y(this._fragmentFiber);if(t===null)return Node.DOCUMENT_POSITION_DISCONNECTED;var a=[];b(this._fragmentFiber.child,!1,Nc,a,void 0,void 0);var l=L(t);if(a.length===0){if(a=l,N(this._fragmentFiber)){e:{for(t=this._fragmentFiber.return;t!==null;){if(t.tag===4){t=t.stateNode.containerInfo;break e}if(t.tag===3||t.tag===5||t.tag===27)break;t=t.return}t=null}t!=null&&(a=t)}t=this._fragmentFiber;var i=l=a.compareDocumentPosition(e);return a===e?i=Node.DOCUMENT_POSITION_CONTAINS:l&Node.DOCUMENT_POSITION_CONTAINED_BY&&(a=R(t)[1],a===null?i=Node.DOCUMENT_POSITION_PRECEDING:(e=L(a).compareDocumentPosition(e),i=e===0||e&Node.DOCUMENT_POSITION_FOLLOWING?Node.DOCUMENT_POSITION_FOLLOWING:Node.DOCUMENT_POSITION_PRECEDING)),i|=Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC}t=L(a[0]),i=L(a[a.length-1]);var r=N(this._fragmentFiber)?t.parentElement:l;if(r==null)return Node.DOCUMENT_POSITION_DISCONNECTED;l=r.compareDocumentPosition(t)&Node.DOCUMENT_POSITION_CONTAINED_BY,r=r.compareDocumentPosition(i)&Node.DOCUMENT_POSITION_CONTAINED_BY;var m=t.compareDocumentPosition(e),h=i.compareDocumentPosition(e),x=m&Node.DOCUMENT_POSITION_CONTAINED_BY||h&Node.DOCUMENT_POSITION_CONTAINED_BY;return h=l&&r&&m&Node.DOCUMENT_POSITION_FOLLOWING&&h&Node.DOCUMENT_POSITION_PRECEDING,t=l&&t===e||r&&i===e||x||h?Node.DOCUMENT_POSITION_CONTAINED_BY:!l&&t===e||!r&&i===e?Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC:m,t&Node.DOCUMENT_POSITION_DISCONNECTED||t&Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC||sb(t,this._fragmentFiber,a[0],a[a.length-1],e)?t:Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC};function sb(e,t,a,l,i){var r=Ba(i);if(e&Node.DOCUMENT_POSITION_CONTAINED_BY){if(a=!!r)e:{for(;r!==null;){if(r.tag===7&&(r===t||r.alternate===t)){a=!0;break e}r=r.return}a=!1}return a}if(e&Node.DOCUMENT_POSITION_CONTAINS){if(r===null)return r=i.ownerDocument,i===r||i===r.documentElement||i===r.body;e:{for(r=t,t=y(t);r!==null;){if(!(r.tag!==5&&r.tag!==3&&r.tag!==27||r!==t&&r.alternate!==t)){r=!0;break e}r=r.return}r=!1}return r}return e&Node.DOCUMENT_POSITION_PRECEDING?((t=!!r)&&!(t=r===a)&&(t=ce(a,r,H),t===null?t=!1:(b(t,!0,we,r,a),r=Y,Y=null,t=r!==null)),t):e&Node.DOCUMENT_POSITION_FOLLOWING?((t=!!r)&&!(t=r===l)&&(t=ce(l,r,H),t===null?t=!1:(b(t,!0,je,r,l),r=Y,B=Y=null,t=r!==null)),t):!1}function up(e,t){var a=e.ownerDocument.createRange();a.selectNodeContents(e),e=a.getBoundingClientRect(),window.scrollTo(window.scrollX+e.left,t?window.scrollY+e.top:window.scrollY+e.bottom-window.innerHeight)}an.prototype.scrollIntoView=function(e){if(typeof e=="object")throw Error(c(566));var t=[];b(this._fragmentFiber.child,!1,Nc,t,void 0,void 0);var a=e!==!1;if(t.length===0){var l=R(this._fragmentFiber);if(l=a?l[1]||l[0]||y(this._fragmentFiber):l[0]||l[1],l===null)return;if(l.tag===6){e=L(l),up(e,a);return}if(l=L(l),l.nodeType!==9){if(l.nodeType===11){a="host"in l?l.host:null,a!==null&&a.scrollIntoView(e);return}l.scrollIntoView(e)}}for(l=a?t.length-1:0;l!==(a?-1:t.length);){var i=t[l];i.tag===6?(i=L(i),up(i,a)):L(i).scrollIntoView(e),l+=a?-1:1}};function rb(e,t){return e=L(e),cp(e,t),!1}function cp(e,t){e.reactFragments==null&&(e.reactFragments=new Set),e.reactFragments.add(t)}function dp(e,t){var a=t._eventListeners;if(a!==null)for(var l=0;l<a.length;l++){var i=a[l];e.addEventListener(i.type,i.attachedListener,Wl(i.optionsOrUseCapture))}e.nodeType!==3&&(a=t._observers,a!==null&&a.forEach(function(r){for(var m=0,h=0;h<Sn.length;h++){var x=Sn[h];(x.fragmentInstance!==t||x.observer!==r||x.instance!==e)&&(Sn[m++]=x)}Sn.length=m,r.observe(e)}),cp(e,t))}function ob(e,t){var a=t._eventListeners;if(a!==null)for(var l=0;l<a.length;l++){var i=a[l];e.removeEventListener(i.type,i.attachedListener,Wl(i.optionsOrUseCapture))}e.nodeType!==3&&(a=t._observers,a!==null&&a.forEach(function(r){typeof r.rootMargin=="string"?lb(t,r,e):r.unobserve(e)}),e.reactFragments!=null&&e.reactFragments.delete(t))}function Ec(e){var t=e.firstChild;for(t&&t.nodeType===10&&(t=t.nextSibling);t;){var a=t;switch(t=t.nextSibling,a.nodeName){case"HTML":case"HEAD":case"BODY":Ec(a),vs(a);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(a.rel.toLowerCase()==="stylesheet")continue}e.removeChild(a)}}function ub(e,t,a,l){for(;e.nodeType===1;){var i=a;if(e.nodeName.toLowerCase()!==t.toLowerCase()){if(!l&&(e.nodeName!=="INPUT"||e.type!=="hidden"))break}else if(l){if(!e[_i])switch(t){case"meta":if(!e.hasAttribute("itemprop"))break;return e;case"link":if(r=e.getAttribute("rel"),r==="stylesheet"&&e.hasAttribute("data-precedence"))break;if(r!==i.rel||e.getAttribute("href")!==(i.href==null||i.href===""?null:i.href)||e.getAttribute("crossorigin")!==(i.crossOrigin==null?null:i.crossOrigin)||e.getAttribute("title")!==(i.title==null?null:i.title))break;return e;case"style":if(e.hasAttribute("data-precedence"))break;return e;case"script":if(r=e.getAttribute("src"),(r!==(i.src==null?null:i.src)||e.getAttribute("type")!==(i.type==null?null:i.type)||e.getAttribute("crossorigin")!==(i.crossOrigin==null?null:i.crossOrigin))&&r&&e.hasAttribute("async")&&!e.hasAttribute("itemprop"))break;return e;default:return e}}else if(t==="input"&&e.type==="hidden"){var r=i.name==null?null:""+i.name;if(i.type==="hidden"&&e.getAttribute("name")===r)return e}else return e;if(e=_n(e.nextSibling),e===null)break}return null}function cb(e,t,a){if(t==="")return null;for(;e.nodeType!==3;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!a||(e=_n(e.nextSibling),e===null))return null;return e}function fp(e,t){for(;e.nodeType!==8;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!t||(e=_n(e.nextSibling),e===null))return null;return e}function Ac(e){return e.data==="$?"||e.data==="$~"}function Cc(e){return e.data==="$!"||e.data==="$?"&&e.ownerDocument.readyState!=="loading"}function db(e,t){var a=e.ownerDocument;if(e.data==="$~")e._reactRetry=t;else if(e.data!=="$?"||a.readyState!=="loading")t();else{var l=function(){t(),a.removeEventListener("DOMContentLoaded",l)};a.addEventListener("DOMContentLoaded",l),e._reactRetry=l}}function _n(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t==="$"||t==="$!"||t==="$?"||t==="$~"||t==="&"||t==="F!"||t==="F")break;if(t==="/$"||t==="/&")return null}}return e}var Oc=null;function mp(e){e=e.nextSibling;for(var t=0;e;){if(e.nodeType===8){var a=e.data;if(a==="/$"||a==="/&"){if(t===0)return _n(e.nextSibling);t--}else a!=="$"&&a!=="$!"&&a!=="$?"&&a!=="$~"&&a!=="&"||t++}e=e.nextSibling}return null}function pp(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var a=e.data;if(a==="$"||a==="$!"||a==="$?"||a==="$~"||a==="&"){if(t===0)return e;t--}else a!=="/$"&&a!=="/&"||t++}e=e.previousSibling}return null}function fb(e,t){function a(){l=!0}if(e.ownerDocument.activeElement===e)return!0;var l=!1;try{e.ownerDocument.addEventListener("focus",a,!0),(e.focus||HTMLElement.prototype.focus).call(e,t)}finally{e.ownerDocument.removeEventListener("focus",a,!0)}return l}function mb(e){ep(function(){ep(function(t){return e(t)})})}function hp(e,t,a){switch(t=Wi(a),e){case"html":if(e=t.documentElement,!e)throw Error(c(452));return e;case"head":if(e=t.head,!e)throw Error(c(453));return e;case"body":if(e=t.body,!e)throw Error(c(454));return e;default:throw Error(c(451))}}function _p(e,t,a){for(var l in a){var i=a[l];a.hasOwnProperty(l)&&i!=null&&Ie(e,t,l,null,Bg,i)}a.dangerouslySetInnerHTML!=null&&(e.textContent=""),e.onclick===An&&(e.onclick=null),vs(e)}function Rc(e){for(var t=e.attributes;t.length;)e.removeAttributeNode(t[0]);vs(e)}var gn=new Map,gp=new Set;function Fi(e){if(typeof e.getRootNode=="function"){var t=e.getRootNode();if(t.nodeType===9||t.nodeType===11)return t}return e.nodeType===9?e:e.ownerDocument}var sa=de.d;de.d={f:pb,r:hb,D:_b,C:gb,L:bb,m:yb,X:xb,S:vb,M:wb};function pb(){var e=sa.f(),t=jr();return e||t}function hb(e){var t=gl(e);t!==null&&t.tag===5&&t.type==="form"?ym(t):sa.r(e)}var Fl=typeof document>"u"?null:document;function bp(e,t,a){var l=Fl;if(l&&typeof t=="string"&&t){var i=un(t);i='link[rel="'+e+'"][href="'+i+'"]',typeof a=="string"&&(i+='[crossorigin="'+a+'"]'),gp.has(i)||(gp.add(i),e={rel:e,crossOrigin:a,href:t},l.querySelector(i)===null&&(t=l.createElement("link"),At(t,"link",e),gt(t),l.head.appendChild(t)))}}function _b(e){sa.D(e),bp("dns-prefetch",e,null)}function gb(e,t){sa.C(e,t),bp("preconnect",e,t)}function bb(e,t,a){sa.L(e,t,a);var l=Fl;if(l&&e&&t){var i='link[rel="preload"][as="'+un(t)+'"]';t==="image"&&a&&a.imageSrcSet?(i+='[imagesrcset="'+un(a.imageSrcSet)+'"]',typeof a.imageSizes=="string"&&(i+='[imagesizes="'+un(a.imageSizes)+'"]')):i+='[href="'+un(e)+'"]';var r=i;switch(t){case"style":r=ei(e);break;case"script":r=ti(e)}if(!(gn.has(r)||(e=Q({rel:"preload",href:t==="image"&&a&&a.imageSrcSet?void 0:e,as:t},a),gn.set(r,e),l.querySelector(i)!==null||t==="style"&&l.querySelector(es(r))||t==="script"&&l.querySelector(ts(r))))){var m=l.createElement("link");At(m,"link",e),t==="style"&&(m[ys]=!0,m.onload=m.onerror=function(){Cd(m)}),gt(m),l.head.appendChild(m)}}}function yb(e,t){sa.m(e,t);var a=Fl;if(a&&e){var l=t&&typeof t.as=="string"?t.as:"script",i='link[rel="modulepreload"][as="'+un(l)+'"][href="'+un(e)+'"]',r=i;switch(l){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":r=ti(e)}if(!gn.has(r)&&(e=Q({rel:"modulepreload",href:e},t),gn.set(r,e),a.querySelector(i)===null)){switch(l){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(a.querySelector(ts(r)))return}l=a.createElement("link"),At(l,"link",e),gt(l),a.head.appendChild(l)}}}function vb(e,t,a){sa.S(e,t,a);var l=Fl;if(l&&e){var i=bl(l).hoistableStyles,r=ei(e);t=t||"default";var m=i.get(r);if(!m){var h={loading:0,preload:null};if(m=l.querySelector(es(r)))h.loading=5;else{e=Q({rel:"stylesheet",href:e,"data-precedence":t},a),(a=gn.get(r))&&Mc(e,a);var x=m=l.createElement("link");gt(x),At(x,"link",e),x._p=new Promise(function(E,O){x.onload=E,x.onerror=O}),x.addEventListener("load",function(){h.loading|=1}),x.addEventListener("error",function(){h.loading|=2}),h.loading|=4,Cr(m,t,l)}m={type:"stylesheet",instance:m,count:1,state:h},i.set(r,m)}}}function xb(e,t){sa.X(e,t);var a=Fl;if(a&&e){var l=bl(a).hoistableScripts,i=ti(e),r=l.get(i);r||(r=a.querySelector(ts(i)),r||(e=Q({src:e,async:!0},t),(t=gn.get(i))&&zc(e,t),r=a.createElement("script"),gt(r),At(r,"link",e),a.head.appendChild(r)),r={type:"script",instance:r,count:1,state:null},l.set(i,r))}}function wb(e,t){sa.M(e,t);var a=Fl;if(a&&e){var l=bl(a).hoistableScripts,i=ti(e),r=l.get(i);r||(r=a.querySelector(ts(i)),r||(e=Q({src:e,async:!0,type:"module"},t),(t=gn.get(i))&&zc(e,t),r=a.createElement("script"),gt(r),At(r,"link",e),a.head.appendChild(r)),r={type:"script",instance:r,count:1,state:null},l.set(i,r))}}function yp(e,t,a,l){var i=(i=ua.current)?Fi(i):null;if(!i)throw Error(c(446));switch(e){case"meta":case"title":return null;case"style":return typeof a.precedence=="string"&&typeof a.href=="string"?(a=ei(a.href),t=bl(i).hoistableStyles,l=t.get(a),l||(l={type:"style",instance:null,count:0,state:null},t.set(a,l)),l):{type:"void",instance:null,count:0,state:null};case"link":if(a.rel==="stylesheet"&&typeof a.href=="string"&&typeof a.precedence=="string"){e=ei(a.href);var r=bl(i).hoistableStyles,m=r.get(e);if(m||(i=i.ownerDocument||i,m={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},r.set(e,m),(r=i.querySelector(es(e)))?r._p||(m.instance=r,m.state.loading=5):(r=gn.get(e),r||(r={rel:"preload",as:"style",href:a.href,crossOrigin:a.crossOrigin,integrity:a.integrity,media:a.media,hrefLang:a.hrefLang,referrerPolicy:a.referrerPolicy},gn.set(e,r)),jb(i,e,r,m.state))),t&&l===null)throw Error(c(528,""));return m}if(t&&l!==null)throw Error(c(529,""));return null;case"script":return t=a.async,a=a.src,typeof a=="string"&&t&&typeof t!="function"&&typeof t!="symbol"?(a=ti(a),t=bl(i).hoistableScripts,l=t.get(a),l||(l={type:"script",instance:null,count:0,state:null},t.set(a,l)),l):{type:"void",instance:null,count:0,state:null};default:throw Error(c(444,e))}}function ei(e){return'href="'+un(e)+'"'}function es(e){return'link[rel="stylesheet"]['+e+"]"}function vp(e){return Q({},e,{"data-precedence":e.precedence,precedence:null})}function jb(e,t,a,l){if(t=e.querySelector('link[rel="preload"][as="style"]['+t+"]")){if(t[ys]!==!0){l.loading=1;return}}else t=e.createElement("link"),t[ys]=!0,t.onload=t.onerror=Cd.bind(null,t),At(t,"link",a),gt(t),e.head.appendChild(t);l.preload=t,t.addEventListener("load",function(){return l.loading|=1}),t.addEventListener("error",function(){return l.loading|=2})}function ti(e){return'[src="'+un(e)+'"]'}function ts(e){return"script[async]"+e}function xp(e,t,a){if(t.count++,t.instance===null)switch(t.type){case"style":var l=e.querySelector('style[data-href~="'+un(a.href)+'"]');if(l)return t.instance=l,gt(l),l;var i=Q({},a,{"data-href":a.href,"data-precedence":a.precedence,href:null,precedence:null});return l=(e.ownerDocument||e).createElement("style"),gt(l),At(l,"style",i),Cr(l,a.precedence,e),t.instance=l;case"stylesheet":i=ei(a.href);var r=e.querySelector(es(i));if(r)return t.state.loading|=4,t.instance=r,gt(r),r;l=vp(a),(i=gn.get(i))&&Mc(l,i),r=(e.ownerDocument||e).createElement("link"),gt(r);var m=r;return m._p=new Promise(function(h,x){m.onload=h,m.onerror=x}),At(r,"link",l),t.state.loading|=4,Cr(r,a.precedence,e),t.instance=r;case"script":return r=ti(a.src),(i=e.querySelector(ts(r)))?(t.instance=i,gt(i),i):(l=a,(i=gn.get(r))&&(l=Q({},a),zc(l,i)),e=e.ownerDocument||e,i=e.createElement("script"),gt(i),At(i,"link",l),e.head.appendChild(i),t.instance=i);case"void":return null;default:throw Error(c(443,t.type))}else t.type==="stylesheet"&&(t.state.loading&4)===0&&(l=t.instance,t.state.loading|=4,Cr(l,a.precedence,e));return t.instance}function Cr(e,t,a){for(var l=a.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),i=l.length?l[l.length-1]:null,r=i,m=0;m<l.length;m++){var h=l[m];if(h.dataset.precedence===t)r=h;else if(r!==i)break}r?r.parentNode.insertBefore(e,r.nextSibling):(t=a.nodeType===9?a.head:a,t.insertBefore(e,t.firstChild))}function Mc(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.title==null&&(e.title=t.title)}function zc(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.integrity==null&&(e.integrity=t.integrity)}var Or=null;function wp(e,t,a){if(Or===null){var l=new Map,i=Or=new Map;i.set(a,l)}else i=Or,l=i.get(a),l||(l=new Map,i.set(a,l));if(l.has(e))return l;for(l.set(e,null),a=a.getElementsByTagName(e),i=0;i<a.length;i++){var r=a[i];if(!(r[_i]||r[St]||e==="link"&&r.getAttribute("rel")==="stylesheet")&&r.namespaceURI!=="http://www.w3.org/2000/svg"){var m=r.getAttribute(t)||"";m=e+m;var h=l.get(m);h?h.push(r):l.set(m,[r])}}return l}function qc(e,t,a){e=e.ownerDocument||e,e.head.insertBefore(a,t==="title"?e.querySelector("head > title"):null)}function Sb(e,t,a){if(a===1||t.itemProp!=null)return!1;switch(e){case"meta":case"title":return!0;case"style":if(typeof t.precedence!="string"||typeof t.href!="string"||t.href==="")break;return!0;case"link":if(typeof t.rel!="string"||typeof t.href!="string"||t.href===""||t.onLoad||t.onError)break;return t.rel==="stylesheet"?(e=t.disabled,typeof t.precedence=="string"&&e==null):!0;case"script":if(t.async&&typeof t.async!="function"&&typeof t.async!="symbol"&&!t.onLoad&&!t.onError&&t.src&&typeof t.src=="string")return!0}return!1}function jp(e,t){return e==="img"&&t.src!=null&&t.src!==""&&t.onLoad==null&&t.loading!=="lazy"}function Sp(e){return!(e.type==="stylesheet"&&(e.state.loading&3)===0)}function Tp(e){return(e.width||100)*(e.height||100)*(typeof devicePixelRatio=="number"?devicePixelRatio:1)*.25}function Np(e,t){typeof t.decode=="function"&&(e.imgCount++,t.complete||(e.imgBytes+=Tp(t),e.suspenseyImages.push(t)),e=kb.bind(e),t.decode().then(e,e))}function Tb(e,t,a,l){if(a.type==="stylesheet"&&(typeof l.media!="string"||matchMedia(l.media).matches!==!1)&&(a.state.loading&4)===0){if(a.instance===null){var i=ei(l.href),r=t.querySelector(es(i));if(r){t=r._p,t!==null&&typeof t=="object"&&typeof t.then=="function"&&(e.count++,e=ns.bind(e),t.then(e,e)),a.state.loading|=4,a.instance=r,gt(r);return}r=t.ownerDocument||t,l=vp(l),(i=gn.get(i))&&Mc(l,i),r=r.createElement("link"),gt(r);var m=r;m._p=new Promise(function(h,x){m.onload=h,m.onerror=x}),At(r,"link",l),a.instance=r}e.stylesheets===null&&(e.stylesheets=new Map),e.stylesheets.set(a,t),(t=a.state.preload)&&(a.state.loading&3)===0&&(e.count++,a=ns.bind(e),t.addEventListener("load",a),t.addEventListener("error",a))}}var Rr=0;function Nb(e,t){return e.stylesheets&&e.count===0&&zr(e,e.stylesheets),0<e.count||0<e.imgCount?function(a){var l=setTimeout(function(){if(e.stylesheets&&zr(e,e.stylesheets),e.unsuspend){var r=e.unsuspend;e.unsuspend=null,r()}},6e4+t);0<e.imgBytes&&Rr===0&&(Rr=62500*Xg());var i=setTimeout(function(){if(e.waitingForImages=!1,e.count===0&&(e.stylesheets&&zr(e,e.stylesheets),e.unsuspend)){var r=e.unsuspend;e.unsuspend=null,r()}},(e.imgBytes>Rr?50:800)+t);return e.unsuspend=a,function(){e.unsuspend=null,clearTimeout(l),clearTimeout(i)}}:null}function kp(e){if(e.count===0&&(e.imgCount===0||!e.waitingForImages)){if(e.stylesheets)zr(e,e.stylesheets);else if(e.unsuspend){var t=e.unsuspend;e.unsuspend=null,t()}}}function ns(){this.count--,kp(this)}function kb(){this.imgCount--,kp(this)}var Mr=null;function zr(e,t){e.stylesheets=null,e.unsuspend!==null&&(e.count++,Mr=new Map,t.forEach(Eb,e),Mr=null,ns.call(e))}function Eb(e,t){if(!(t.state.loading&4)){var a=Mr.get(e);if(a)var l=a.get(null);else{a=new Map,Mr.set(e,a);for(var i=e.querySelectorAll("link[data-precedence],style[data-precedence]"),r=0;r<i.length;r++){var m=i[r];(m.nodeName==="LINK"||m.getAttribute("media")!=="not all")&&(a.set(m.dataset.precedence,m),l=m)}l&&a.set(null,l)}i=t.instance,m=i.getAttribute("data-precedence"),r=a.get(m)||l,r===l&&a.set(null,i),a.set(m,i),this.count++,l=ns.bind(this),i.addEventListener("load",l),i.addEventListener("error",l),r?r.parentNode.insertBefore(i,r.nextSibling):(e=e.nodeType===9?e.head:e,e.insertBefore(i,e.firstChild)),t.state.loading|=4}}var ni={$$typeof:te,Provider:null,Consumer:null,_currentValue:Vn,_currentValue2:Vn,_threadCount:0};function Ab(e,t,a,l,i,r,m,h,x){this.tag=1,this.containerInfo=e,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=ho(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=ho(0),this.hiddenUpdates=ho(null),this.identifierPrefix=l,this.onUncaughtError=i,this.onCaughtError=r,this.onRecoverableError=m,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=x,this.transitionTypes=null,this.incompleteTransitions=new Map}function Ep(e,t,a,l,i,r,m,h,x,E,O,z){return e=new Ab(e,t,a,m,x,E,O,z,h),t=1,r===!0&&(t|=24),r=Bt(3,null,null,t),e.current=r,r.stateNode=e,t=Ko(),t.refCount++,e.pooledCache=t,t.refCount++,r.memoizedState={element:l,isDehydrated:a,cache:t},eu(r),e}function Ap(e){return e?(e=El,e):El}function Cp(e,t,a,l,i,r){i=Ap(i),l.context===null?l.context=i:l.pendingContext=i,l=va(t),l.payload={element:a},r=r===void 0?null:r,r!==null&&(l.callback=r),a=xa(e,l,t),a!==null&&(It(a,e,t),Mi(a,e,t))}function Op(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var a=e.retryLane;e.retryLane=a!==0&&a<t?a:t}}function Dc(e,t){Op(e,t),(e=e.alternate)&&Op(e,t)}function Rp(e){if(e.tag===13||e.tag===31){var t=Ia(e,67108864);t!==null&&It(t,e,67108864),Dc(e,67108864)}}function Mp(e){if(e.tag===13||e.tag===31){var t=nn();t=_o(t);var a=Ia(e,t);a!==null&&It(a,e,t),Dc(e,t)}}var ai=!0;function Cb(e,t,a,l){var i=ee.T;ee.T=null;var r=de.p;try{de.p=2,$c(e,t,a,l)}finally{de.p=r,ee.T=i}}function Ob(e,t,a,l){var i=ee.T;ee.T=null;var r=de.p;try{de.p=8,$c(e,t,a,l)}finally{de.p=r,ee.T=i}}function $c(e,t,a,l){if(ai){var i=Uc(l);if(i===null)bc(e,t,l,qr,a),qp(e,l);else if(Mb(i,e,t,a,l))l.stopPropagation();else if(qp(e,l),t&4&&-1<Rb.indexOf(e)){for(;i!==null;){var r=gl(i);if(r!==null)switch(r.tag){case 3:if(r=r.stateNode,r.current.memoizedState.isDehydrated){var m=Ya(r.pendingLanes);if(m!==0){var h=r;for(h.pendingLanes|=2,h.entangledLanes|=2;m;){var x=1<<31-Pt(m);h.entanglements[1]|=x,m&=~x}Ln(r),(He&6)===0&&(vr=Qt()+500,Pi(0))}}break;case 31:case 13:h=Ia(r,2),h!==null&&It(h,r,2),jr(),Dc(r,2)}if(r=Uc(l),r===null&&bc(e,t,l,qr,a),r===i)break;i=r}i!==null&&l.stopPropagation()}else bc(e,t,l,null,a)}}function Uc(e){return e=jo(e),Lc(e)}var qr=null;function Lc(e){if(qr=null,e=Ba(e),e!==null){var t=f(e);if(t===null)e=null;else{var a=t.tag;if(a===13){if(e=p(t),e!==null)return e;e=null}else if(a===31){if(e=_(t),e!==null)return e;e=null}else if(a===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null)}}return qr=e,null}function zp(e){switch(e){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"fullscreenerror":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"resize":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(Xh()){case bd:return 2;case yd:return 8;case ps:case Vh:return 32;case vd:return 268435456;default:return 32}default:return 32}}var Hc=!1,Ma=null,za=null,qa=null,as=new Map,ls=new Map,Da=[],Rb="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function qp(e,t){switch(e){case"focusin":case"focusout":Ma=null;break;case"dragenter":case"dragleave":za=null;break;case"mouseover":case"mouseout":qa=null;break;case"pointerover":case"pointerout":as.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":ls.delete(t.pointerId)}}function is(e,t,a,l,i,r){return e===null||e.nativeEvent!==r?(e={blockedOn:t,domEventName:a,eventSystemFlags:l,nativeEvent:r,targetContainers:[i]},t!==null&&(t=gl(t),t!==null&&Rp(t)),e):(e.eventSystemFlags|=l,t=e.targetContainers,i!==null&&t.indexOf(i)===-1&&t.push(i),e)}function Mb(e,t,a,l,i){switch(t){case"focusin":return Ma=is(Ma,e,t,a,l,i),!0;case"dragenter":return za=is(za,e,t,a,l,i),!0;case"mouseover":return qa=is(qa,e,t,a,l,i),!0;case"pointerover":var r=i.pointerId;return as.set(r,is(as.get(r)||null,e,t,a,l,i)),!0;case"gotpointercapture":return r=i.pointerId,ls.set(r,is(ls.get(r)||null,e,t,a,l,i)),!0}return!1}function Dp(e){var t=Ba(e.target);if(t!==null){var a=f(t);if(a!==null){if(t=a.tag,t===13){if(t=p(a),t!==null){e.blockedOn=t,kd(e.priority,function(){Mp(a)});return}}else if(t===31){if(t=_(a),t!==null){e.blockedOn=t,kd(e.priority,function(){Mp(a)});return}}else if(t===3&&a.stateNode.current.memoizedState.isDehydrated){e.blockedOn=a.tag===3?a.stateNode.containerInfo:null;return}}}e.blockedOn=null}function Dr(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var a=Uc(e.nativeEvent);if(a===null){a=e.nativeEvent;var l=new a.constructor(a.type,a);wo=l,a.target.dispatchEvent(l),wo=null}else return t=gl(a),t!==null&&Rp(t),e.blockedOn=a,!1;t.shift()}return!0}function $p(e,t,a){Dr(e)&&a.delete(t)}function zb(){Hc=!1,Ma!==null&&Dr(Ma)&&(Ma=null),za!==null&&Dr(za)&&(za=null),qa!==null&&Dr(qa)&&(qa=null),as.forEach($p),ls.forEach($p)}function $r(e,t){e.blockedOn===t&&(e.blockedOn=null,Hc||(Hc=!0,n.unstable_scheduleCallback(n.unstable_NormalPriority,zb)))}var Ur=null;function Up(e){Ur!==e&&(Ur=e,n.unstable_scheduleCallback(n.unstable_NormalPriority,function(){Ur===e&&(Ur=null);for(var t=0;t<e.length;t+=3){var a=e[t],l=e[t+1],i=e[t+2];if(typeof l!="function"){if(Lc(l||a)===null)continue;break}var r=gl(a);r!==null&&(e.splice(t,3),t-=3,xu(r,{pending:!0,data:i,method:a.method,action:l},l,i))}}))}function li(e){function t(x){return $r(x,e)}Ma!==null&&$r(Ma,e),za!==null&&$r(za,e),qa!==null&&$r(qa,e),as.forEach(t),ls.forEach(t);for(var a=0;a<Da.length;a++){var l=Da[a];l.blockedOn===e&&(l.blockedOn=null)}for(;0<Da.length&&(a=Da[0],a.blockedOn===null);)Dp(a),a.blockedOn===null&&Da.shift();if(a=(e.ownerDocument||e).$$reactFormReplay,a!=null)for(l=0;l<a.length;l+=3){var i=a[l],r=a[l+1],m=i[Yt]||null;if(typeof r=="function")m||Up(a);else if(m){var h=null;if(r&&r.hasAttribute("formAction")){if(i=r,m=r[Yt]||null)h=m.formAction;else if(Lc(i)!==null)continue}else h=m.action;typeof h=="function"?a[l+1]=h:(a.splice(l,3),l-=3),Up(a)}}}function Lp(){function e(r){r.canIntercept&&r.info==="react-transition"&&r.intercept({handler:function(){return new Promise(function(m){return i=m})},focusReset:"manual",scroll:"manual"})}function t(){i!==null&&(i(),i=null),l||setTimeout(a,20)}function a(){if(!l&&!navigation.transition){var r=navigation.currentEntry;r&&r.url!=null&&navigation.navigate(r.url,{state:r.getState(),info:"react-transition",history:"replace"})}}if(typeof navigation=="object"){var l=!1,i=null;return navigation.addEventListener("navigate",e),navigation.addEventListener("navigatesuccess",t),navigation.addEventListener("navigateerror",t),setTimeout(a,100),function(){l=!0,navigation.removeEventListener("navigate",e),navigation.removeEventListener("navigatesuccess",t),navigation.removeEventListener("navigateerror",t),i!==null&&(i(),i=null)}}}function Yc(e){this._internalRoot=e}Lr.prototype.render=Yc.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(c(409));var a=t.current,l=nn();Cp(a,l,e,t,null,null)},Lr.prototype.unmount=Yc.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;Cp(e.current,2,null,e,null,null),jr(),t[_l]=null}};function Lr(e){this._internalRoot=e}Lr.prototype.unstable_scheduleHydration=function(e){if(e){var t=Nd();e={blockedOn:null,target:e,priority:t};for(var a=0;a<Da.length&&t!==0&&t<Da[a].priority;a++);Da.splice(a,0,e),a===0&&Dp(e)}};var Hp=s.version;if(Hp!=="19.3.0")throw Error(c(527,Hp,"19.3.0"));de.findDOMNode=function(e){var t=e._reactInternals;if(t===void 0)throw typeof e.render=="function"?Error(c(188)):(e=Object.keys(e).join(","),Error(c(268,e)));return e=w(t),e=e!==null?v(e):null,e=e===null?null:e.stateNode,e};var qb={bundleType:0,version:"19.3.0",rendererPackageName:"react-dom",currentDispatcherRef:ee,reconcilerVersion:"19.3.0"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var Hr=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!Hr.isDisabled&&Hr.supportsFiber)try{mi=Hr.inject(qb),Zt=Hr}catch{}}return rs.createRoot=function(e,t){if(!d(e))throw Error(c(299));var a=!1,l="",i=Am,r=Cm,m=Om;return t!=null&&(t.unstable_strictMode===!0&&(a=!0),t.identifierPrefix!==void 0&&(l=t.identifierPrefix),t.onUncaughtError!==void 0&&(i=t.onUncaughtError),t.onCaughtError!==void 0&&(r=t.onCaughtError),t.onRecoverableError!==void 0&&(m=t.onRecoverableError)),t=Ep(e,1,!1,null,null,a,l,null,i,r,m,Lp),e[_l]=t.current,gc(e),new Yc(t)},rs.hydrateRoot=function(e,t,a){if(!d(e))throw Error(c(299));var l=!1,i="",r=Am,m=Cm,h=Om,x=null;return a!=null&&(a.unstable_strictMode===!0&&(l=!0),a.identifierPrefix!==void 0&&(i=a.identifierPrefix),a.onUncaughtError!==void 0&&(r=a.onUncaughtError),a.onCaughtError!==void 0&&(m=a.onCaughtError),a.onRecoverableError!==void 0&&(h=a.onRecoverableError),a.formState!==void 0&&(x=a.formState)),t=Ep(e,1,!0,t,a??null,l,i,x,r,m,h,Lp),t.context=Ap(null),a=t.current,l=nn(),l=_o(l),i=va(l),i.callback=null,xa(a,i,l),a=l,t.current.lanes=a,hi(t,a),Ln(t),e[_l]=t.current,gc(e),new Lr(t)},rs.version="19.3.0",rs}var Kp;function Ib(){if(Kp)return Gc.exports;Kp=1;function n(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n)}catch(s){console.error(s)}}return n(),Gc.exports=Vb(),Gc.exports}var Qb=Ib(),q=ud();const Yr=$b(q),Jp=n=>{let s;const u=new Set,c=(w,v)=>{const b=typeof w=="function"?w(s):w;if(!Object.is(b,s)){const y=s;s=v??(typeof b!="object"||b===null)?b:Object.assign({},s,b),u.forEach(N=>N(s,y))}},d=()=>s,_={setState:c,getState:d,getInitialState:()=>g,subscribe:w=>(u.add(w),()=>u.delete(w))},g=s=n(c,d,_);return _},Zb=(n=>n?Jp(n):Jp),Pb=n=>n;function Kb(n,s=Pb){const u=Yr.useSyncExternalStore(n.subscribe,Yr.useCallback(()=>s(n.getState()),[n,s]),Yr.useCallback(()=>s(n.getInitialState()),[n,s]));return Yr.useDebugValue(u),u}const Wp=n=>{const s=Zb(n),u=c=>Kb(s,c);return Object.assign(u,s),u},bh=(n=>n?Wp(n):Wp),Fp={volume:.6,muted:!1,music:!1,quality:"high",reduceMotion:!1,showNames:!0,joystickLeft:!0};function Jb(){try{const n=localStorage.getItem("stt.settings");if(n)return{...Fp,...JSON.parse(n)}}catch{}return Fp}const U=bh(()=>({phase:"title",backend:null,loadingMsg:"",loadingPct:0,fatal:null,catalog:null,itemsById:{},last:null,me:null,myItems:[],syncedAt:0,serverOffset:0,feed:[],feedSince:-1,market:{},marketAt:0,world:[],worldAt:0,panel:null,panelArg:null,toasts:[],drop:null,steal:null,bigReveal:null,levelUp:null,confirm:null,settings:Jb(),tutorialOpen:!1,focusPlot:null})),Ua=[],F=()=>U.getState(),pe=n=>U.setState(n),Ye=n=>n?new Date(n).getTime()-F().serverOffset:0;let Wb=0;function Me(n){const s=++Wb,u={ttl:5e3,...n,id:s,at:Date.now()};pe(c=>({toasts:[...c.toasts.slice(-5),u]})),window.setTimeout(()=>pe(c=>({toasts:c.toasts.filter(d=>d.id!==s)})),u.ttl)}function Te(n,s=null){pe({panel:n,panelArg:s})}function ii(n){const s={...F().settings,...n};pe({settings:s});try{localStorage.setItem("stt.settings",JSON.stringify(s))}catch{}}function Fb(){const{me:n,syncedAt:s}=F();return n?n.cash+Math.floor(n.income*Math.max(0,Date.now()-s)/1e3):0}function rt(n){return F().itemsById[n]}function Tn(n){return F().market[n]?.price??F().itemsById[n]?.base_value??0}const Kr=["common","uncommon","rare","epic","legendary","mythic","ultra","limited","secret"],it={common:{label:"COMMON",color:"#a3aec2",glow:"rgba(163,174,194,0.0)",tier:1},uncommon:{label:"UNCOMMON",color:"#4ade80",glow:"rgba(74,222,128,0.35)",tier:2},rare:{label:"RARE",color:"#38bdf8",glow:"rgba(56,189,248,0.55)",tier:3},epic:{label:"EPIC",color:"#a855f7",glow:"rgba(168,85,247,0.65)",tier:4},legendary:{label:"LEGENDARY",color:"#fbbf24",glow:"rgba(251,191,36,0.7)",tier:5},mythic:{label:"MYTHIC",color:"#f43f5e",glow:"rgba(244,63,94,0.75)",tier:6},ultra:{label:"ULTRA",color:"#e879f9",glow:"rgba(232,121,249,0.8)",tier:7},limited:{label:"LIMITED",color:"#fb923c",glow:"rgba(251,146,60,0.75)",tier:8},secret:{label:"SECRET",color:"#f8fafc",glow:"rgba(248,250,252,0.9)",tier:9}},ey=n=>it[n]?.tier??1,Xr={TECH:"📺",GAMING:"🎮",CARS:"🏎️",FASHION:"👟",LUXURY:"💎",SPORTS:"🏆",RANDOM:"🎲"},oa=(n,s=90,u=65)=>`hsl(${n*120%360}, ${s}%, ${u}%)`;function ie(n){return"$"+Math.floor(Number(n)||0).toLocaleString("en-US")}function yh(n){const s=Number(n)||0,u=Math.abs(s),c=[[1e15,"Q"],[1e12,"T"],[1e9,"B"],[1e6,"M"],[1e3,"K"]];for(const[d,f]of c)if(u>=d){const p=s/d;return(p>=100?p.toFixed(0):p>=10?p.toFixed(1):p.toFixed(2)).replace(/\.0+$/,"")+f}return Math.floor(s).toString()}const We=n=>"$"+yh(n);function Gn(n){const s=Number(n)||0;return s<100?"$"+s.toFixed(s%1===0?0:1)+"/s":"$"+(s<1e6?Math.round(s).toLocaleString("en-US"):yh(s))+"/s"}function vh(n,s=1){return(n>0?"+":"")+n.toFixed(s)+"%"}function xt(n){if(n<=0)return"0s";const s=Math.ceil(n/1e3);if(s<60)return s+"s";const u=Math.floor(s/60);if(u<60)return`${u}m ${s%60}s`;const c=Math.floor(u/60);return c<24?`${c}h ${u%60}m`:`${Math.floor(c/24)}d ${c%24}h`}function Yn(n,s=Date.now()){const u=typeof n=="number"?n:new Date(n).getTime(),c=Math.max(0,Math.round((s-u)/1e3));if(c<10)return"just now";if(c<60)return c+"s ago";const d=Math.floor(c/60);if(d<60)return d+"m ago";const f=Math.floor(d/60);return f<24?f+"h ago":Math.floor(f/24)+"d ago"}function fl(n){let s=0;for(let u=0;u<n.length;u++)s=s*31+n.charCodeAt(u)|0;return Math.abs(s)%360}function xh(n){return n>=85?{label:"EXTREME",cls:"up"}:n>=65?{label:"HIGH",cls:"up"}:n>=35?{label:"MEDIUM",cls:"flat"}:{label:"LOW",cls:"down"}}let cl=null,Nn=null,Jr=.6,ml=!1,eh=!1,Br=null;function cd(){if(typeof window>"u")return null;if(!cl){const n=window.AudioContext||window.webkitAudioContext;if(!n)return null;cl=new n,Nn=cl.createGain(),Nn.gain.value=ml?0:Jr,Nn.connect(cl.destination)}return cl.state==="suspended"&&cl.resume().catch(()=>{}),cl}function wh(n){Jr=Math.max(0,Math.min(1,n)),Nn&&(Nn.gain.value=ml?0:Jr)}function jh(n){ml=n,Nn&&(Nn.gain.value=ml?0:Jr)}function Ot(n,s,u={}){const c=cd();if(!c||!Nn||ml)return;const d=c.currentTime+(u.delay||0),f=c.createOscillator(),p=c.createGain();f.type=u.type||"sine",f.frequency.setValueAtTime(n,d),u.slide&&f.frequency.exponentialRampToValueAtTime(Math.max(20,n*u.slide),d+s);const _=u.gain??.2;p.gain.setValueAtTime(1e-4,d),p.gain.exponentialRampToValueAtTime(_,d+(u.attack??.01)),p.gain.exponentialRampToValueAtTime(1e-4,d+s),f.connect(p),p.connect(Nn),f.start(d),f.stop(d+s+.05)}function ri(n,s={}){const u=cd();if(!u||!Nn||ml)return;const c=u.currentTime+(s.delay||0),d=Math.floor(u.sampleRate*n),f=u.createBuffer(1,d,u.sampleRate),p=f.getChannelData(0);for(let v=0;v<d;v++)p[v]=(Math.random()*2-1)*(1-v/d);const _=u.createBufferSource();_.buffer=f;const g=u.createBiquadFilter();g.type="bandpass",g.frequency.value=s.freq||1200;const w=u.createGain();w.gain.value=s.gain??.15,_.connect(g),g.connect(w),w.connect(Nn),_.start(c)}const dl=(n,s,u="triangle",c=.12,d=.06)=>n.forEach((f,p)=>Ot(f,s,{type:u,gain:c,delay:p*d}));function me(n){switch(n){case"click":return Ot(660,.06,{type:"square",gain:.05});case"tick":return Ot(1200,.03,{type:"square",gain:.03});case"step":return ri(.04,{gain:.03,freq:400});case"coin":return Ot(988,.08,{type:"square",gain:.06}),Ot(1319,.18,{type:"square",gain:.06,delay:.07});case"cash":return dl([784,988,1319,1568],.25,"square",.05,.05);case"error":return Ot(220,.15,{type:"sawtooth",gain:.08}),Ot(160,.2,{type:"sawtooth",gain:.08,delay:.12});case"open":return ri(.4,{gain:.2,freq:3e3}),Ot(220,.5,{type:"sawtooth",gain:.1,slide:4});case"shake":return ri(.12,{gain:.12,freq:600});case"whoosh":return ri(.35,{gain:.12,freq:2200});case"levelup":return dl([523,659,784,1047,1319],.5,"triangle",.12,.08);case"notify":return Ot(880,.1,{gain:.08}),Ot(1175,.15,{gain:.08,delay:.1});case"alarm":for(let s=0;s<4;s++)Ot(880,.22,{type:"square",gain:.07,delay:s*.45}),Ot(660,.22,{type:"square",gain:.07,delay:s*.45+.22});return;case"steal_ok":return dl([392,523,659,784,1047],.4,"square",.07,.07);case"steal_fail":return Ot(300,.3,{type:"sawtooth",gain:.1,slide:.4}),ri(.3,{gain:.1,freq:300,delay:.1});case"defend":return dl([330,440,660],.3,"square",.08,.04);case"trade":return dl([523,784,1047],.3,"triangle",.1,.1);case"buy":return dl([659,880],.2,"square",.06,.06)}}function dd(n){const s={common:[523],uncommon:[523,659],rare:[523,659,784],epic:[523,659,784,988],legendary:[523,659,784,1047,1319],mythic:[440,554,659,880,1109,1319],ultra:[392,494,587,784,988,1175,1568],limited:[440,554,659,880,1109,1319],secret:[262,330,392,523,659,784,1047,1319,1568]},u=s[n]||s.common,c=u.length;dl(u,.35+c*.08,c>5?"sawtooth":"triangle",c>5?.07:.11,.07),c>=6&&ri(1.2,{gain:.08,freq:5e3,delay:.2}),n==="secret"&&(Ot(65,2.5,{type:"sine",gain:.35,attack:.3}),Ot(98,2.5,{type:"sine",gain:.2,attack:.5,delay:.3}))}function Sh(n){if(eh=n,Br&&(clearInterval(Br),Br=null),!n)return;const s=[110,110,131,147,110,165,147,131];let u=0;Br=window.setInterval(()=>{if(!eh||ml)return;const c=s[u%s.length];Ot(c,.5,{type:"triangle",gain:.035}),u%2===0&&Ot(c*4,.12,{type:"square",gain:.012,delay:.25}),u++},420)}function ty(){cd()}const Zc=3600,Pc=2800,si=[{id:"market",label:"CENTRAL MARKET",icon:"📈",trigger:{x:1560,y:960,w:480,h:150},anchor:{x:1800,y:1050}},{id:"drops",label:"DROP ZONE",icon:"📦",trigger:{x:2330,y:1200,w:700,h:420},anchor:{x:2650,y:1560}},{id:"raid",label:"RAID BOARD",icon:"🥷",trigger:{x:680,y:1230,w:500,h:190},anchor:{x:930,y:1330}},{id:"trade",label:"TRADE HUB",icon:"🤝",trigger:{x:680,y:1650,w:500,h:190},anchor:{x:930,y:1740}},{id:"event",label:"EVENT STAGE",icon:"🎪",trigger:{x:1530,y:2040,w:540,h:160},anchor:{x:1800,y:2130}},{id:"leaderboard",label:"HALL OF FAME",icon:"🏆",trigger:{x:1440,y:1160,w:170,h:150},anchor:{x:1525,y:1260}},{id:"quests",label:"MISSIONS",icon:"🎯",trigger:{x:1990,y:1160,w:170,h:150},anchor:{x:2075,y:1260}},{id:"collection",label:"COLLECTION MUSEUM",icon:"🎒",trigger:{x:1990,y:1560,w:190,h:150},anchor:{x:2085,y:1660}}],ny=[{x:1440,y:700,w:720,h:250},{x:2400,y:1250,w:580,h:90},{x:700,y:1170,w:460,h:50},{x:720,y:1560,w:420,h:70},{x:1500,y:1880,w:600,h:150},{x:1500,y:1175,w:50,h:40},{x:2050,y:1180,w:60,h:30},{x:2045,y:1580,w:80,h:40}],he=520,_e=400,ay=[160,740,1320,1900,2480,3060],ly=[{x:1320,y:2300,door:"top"},{x:1900,y:2300,door:"top"},{x:740,y:2300,door:"top"},{x:2480,y:2300,door:"top"},{x:160,y:2300,door:"top"},{x:3060,y:2300,door:"top"},...ay.map(n=>({x:n,y:120,door:"bottom"})),{x:80,y:640,door:"right"},{x:3040,y:640,door:"left"},{x:80,y:1150,door:"right"},{x:3040,y:1150,door:"left"},{x:80,y:1660,door:"right"},{x:3040,y:1660,door:"left"}],ra=ly.map((n,s)=>({...n,index:s}));function iy(n){return{x:n.x,y:n.y,w:he,h:_e}}function ad(n){switch(n.door){case"top":return{x:n.x+he/2,y:n.y-40};case"bottom":return{x:n.x+he/2,y:n.y+_e+40};case"left":return{x:n.x-40,y:n.y+_e/2};case"right":return{x:n.x+he+40,y:n.y+_e/2}}}function ld(n){const s=ad(n),u=n.x+he/2,c=n.y+_e/2;return{x:(s.x+u*2)/3,y:(s.y+c*2)/3}}function sy(n){return n<=4?{cols:2,rows:2}:n<=8?{cols:4,rows:2}:n<=12?{cols:4,rows:3}:n<=16?{cols:4,rows:4}:n<=24?{cols:6,rows:4}:n<=32?{cols:8,rows:4}:n<=40?{cols:8,rows:5}:{cols:10,rows:5}}function Gr(n,s,u){const{cols:c,rows:d}=sy(s),f=46,p=46,_=n.door==="top",g=_?58:92,w=_?84:44,v=he-f-p,b=_e-g-w,y=v/c,N=b/d,R=u%c,G=Math.floor(u/c);return{x:n.x+f+y*(R+.5),y:n.y+g+N*(G+.5)+N*.18,cell:Math.min(y,N*1.25,96)}}function ln(n,s,u,c=0){return n>=u.x-c&&n<=u.x+u.w+c&&s>=u.y-c&&s<=u.y+u.h+c}const Hn=ld(ra[0]);function ry(n){return{x:n.x+he/2,y:n.door==="top"?n.y+_e-40:n.y+36}}function V(n,s){const u=n.replace("#",""),c=parseInt(u.length===3?u.split("").map(_=>_+_).join(""):u,16);let d=c>>16&255,f=c>>8&255,p=c&255;return s>=0?(d+=(255-d)*s,f+=(255-f)*s,p+=(255-p)*s):(d*=1+s,f*=1+s,p*=1+s),`rgb(${d|0},${f|0},${p|0})`}function Wr(n,s,u,c,d,f){const p=Math.min(f,c/2,d/2);n.beginPath(),n.moveTo(s+p,u),n.arcTo(s+c,u,s+c,u+d,p),n.arcTo(s+c,u+d,s,u+d,p),n.arcTo(s,u+d,s,u,p),n.arcTo(s,u,s+c,u,p),n.closePath()}function ze(n,s,u,c,d,f){const p=n.createLinearGradient(s,u,c,d);for(const[_,g]of f)p.addColorStop(_,g);return p}function ge(n,s,u,c,d,f,p,_,g=1.5){Wr(n,s,u,c,d,f),n.fillStyle=p,n.fill(),_&&(n.lineWidth=g,n.strokeStyle=_,n.stroke())}function Lt(n,s,u,c,d,f,p,_=3){n.fillStyle=V(p,-.45),n.beginPath(),n.moveTo(s+c,u),n.lineTo(s+c+f,u-f*.6),n.lineTo(s+c+f,u+d-f*.6),n.lineTo(s+c,u+d),n.closePath(),n.fill(),n.fillStyle=V(p,.2),n.beginPath(),n.moveTo(s,u),n.lineTo(s+f,u-f*.6),n.lineTo(s+c+f,u-f*.6),n.lineTo(s+c,u),n.closePath(),n.fill(),ge(n,s,u,c,d,_,ze(n,s,u,s,u+d,[[0,V(p,.08)],[1,V(p,-.25)]]))}function rn(n,s,u,c,d){n.save(),n.globalAlpha=.28,n.fillStyle=ze(n,s,u,s+c*.6,u+d,[[0,"#ffffff"],[.45,"rgba(255,255,255,0.15)"],[.46,"rgba(255,255,255,0)"],[1,"rgba(255,255,255,0)"]]),n.fillRect(s,u,c,d),n.restore()}function Bn(n,s,u,c,d,f,p=2){const _=f.rarity==="secret",g=_?ze(n,s,u,s+c,u+d,[[0,"#050208"],[.5,"#12061f"],[1,"#000000"]]):ze(n,s,u,s+c,u+d,[[0,V(f.color,.25)],[.55,f.accent],[1,V(f.accent,-.5)]]);ge(n,s,u,c,d,p,g),_?(n.save(),n.strokeStyle="rgba(192,132,252,0.9)",n.lineWidth=1.5,n.shadowColor="#c084fc",n.shadowBlur=10,Wr(n,s+1,u+1,c-2,d-2,p),n.stroke(),n.restore()):(n.save(),Wr(n,s,u,c,d,p),n.clip(),n.globalAlpha=.35,n.fillStyle=V(f.color,.6),n.beginPath(),n.arc(s+c*.3,u+d*.65,d*.35,0,Math.PI*2),n.fill(),n.globalAlpha=.25,n.fillStyle="#ffffff",n.beginPath(),n.arc(s+c*.72,u+d*.35,d*.22,0,Math.PI*2),n.fill(),n.restore()),rn(n,s,u,c,d)}function Ee(n,s,u,c,d,f,p=1.5){n.beginPath(),n.arc(s,u,c,0,Math.PI*2),n.fillStyle=d,n.fill(),f&&(n.lineWidth=p,n.strokeStyle=f,n.stroke())}function Vr(n,s,u,c,d){Ee(n,s,u,c,"#0b0f19",V(d,.1),1.8),n.save(),n.strokeStyle=d,n.shadowColor=d,n.shadowBlur=6,n.lineWidth=1.4,n.beginPath(),n.arc(s,u,c*.82,0,Math.PI*2),n.stroke(),n.restore(),n.fillStyle="#334155";for(let f=0;f<5;f++){const p=f/5*Math.PI*2;n.beginPath(),n.ellipse(s+Math.cos(p)*c*.42,u+Math.sin(p)*c*.42,c*.4,c*.16,p+.6,0,Math.PI*2),n.fill()}Ee(n,s,u,c*.22,V(d,-.2))}function oi(n,s,u,c,d="#cbd5e1"){Ee(n,s,u,c,"#0f172a"),Ee(n,s,u,c*.62,ze(n,s-c,u-c,s+c,u+c,[[0,V(d,.3)],[1,V(d,-.4)]])),n.strokeStyle="#1e293b",n.lineWidth=1.2;for(let f=0;f<5;f++){const p=f/5*Math.PI*2;n.beginPath(),n.moveTo(s,u),n.lineTo(s+Math.cos(p)*c*.6,u+Math.sin(p)*c*.6),n.stroke()}Ee(n,s,u,c*.15,"#0f172a")}function oy(n,s,u=1){const c=["legendary","mythic","ultra","secret","limited"].includes(s.rarity),d=88*u,f=52,p=-d/2,_=-34;n.fillStyle="#1f2937",n.beginPath(),n.moveTo(-18,26),n.lineTo(18,26),n.lineTo(24,32),n.lineTo(-24,32),n.closePath(),n.fill(),n.fillStyle="#374151",n.fillRect(-4,16,8,12),Lt(n,p,_,d,f,4,"#111827",3);const g=c?1.5:3.5;Bn(n,p+g,_+g,d-2*g,f-2*g,s,2),n.fillStyle=s.color,n.fillRect(-3,_+f-2,6,1.5)}function uy(n,s){const u=/ultrawide|49/i.test(s.name),c=u?92:72,d=u?36:44,f=-c/2,p=-36;n.fillStyle="#1f2937",n.fillRect(-4,p+d-2,8,22),ge(n,-20,22,40,7,3,"#111827"),u?(n.save(),n.beginPath(),n.moveTo(f,p+4),n.quadraticCurveTo(0,p-4,f+c,p+4),n.lineTo(f+c,p+d+4),n.quadraticCurveTo(0,p+d-4,f,p+d+4),n.closePath(),n.fillStyle="#0b1120",n.fill(),n.clip(),Bn(n,f+2,p-2,c-4,d+6,s,1),n.restore()):(Lt(n,f,p,c,d,3,"#0b1120",3),Bn(n,f+2.5,p+2.5,c-5,d-5,s,2)),n.save(),n.strokeStyle=s.color,n.shadowColor=s.color,n.shadowBlur=6,n.lineWidth=1.5,n.beginPath(),n.moveTo(-14,29),n.lineTo(14,29),n.stroke(),n.restore()}function cy(n,s){const u=/fold/i.test(s.name),c=u?50:36,d=70;Lt(n,-c/2,-d/2,c,d,3,"#0f172a",7),Bn(n,-c/2+2.5,-d/2+2.5,c-5,d-5,s,5),u&&(n.strokeStyle="rgba(255,255,255,0.25)",n.lineWidth=1,n.beginPath(),n.moveTo(0,-d/2+3),n.lineTo(0,d/2-3),n.stroke()),ge(n,-6,-d/2+5,12,3.5,2,"#020617"),n.fillStyle=V(s.color,-.2),n.fillRect(c/2+2,-12,1.8,10)}function dy(n,s){Lt(n,-40,-28,80,56,3,"#111827",6),Bn(n,-36,-24,72,48,s,3),Ee(n,0,-26,1.2,"#334155")}function fy(n,s){const u=/gaming/i.test(s.name);n.fillStyle="#111827",n.beginPath(),n.moveTo(-36,-30),n.lineTo(36,-30),n.lineTo(40,12),n.lineTo(-40,12),n.closePath(),n.fill(),n.save(),n.beginPath(),n.moveTo(-32,-26),n.lineTo(32,-26),n.lineTo(35.5,9),n.lineTo(-35.5,9),n.closePath(),n.clip(),Bn(n,-36,-27,72,37,s,0),n.restore(),n.fillStyle=ze(n,0,12,0,28,[[0,"#94a3b8"],[1,"#475569"]]),n.beginPath(),n.moveTo(-42,12),n.lineTo(42,12),n.lineTo(50,26),n.lineTo(-50,26),n.closePath(),n.fill(),n.fillStyle="#1e293b";for(let c=0;c<3;c++)for(let d=0;d<10;d++){const f=d/10,p=-38-c*2+f*(76+c*4);n.fillRect(p,14.5+c*3.4,6.4+c*.3,2.3)}u&&(n.save(),n.shadowColor=s.color,n.shadowBlur=8,n.strokeStyle=s.color,n.lineWidth=1.5,n.beginPath(),n.moveTo(-50,26.5),n.lineTo(50,26.5),n.stroke(),n.restore())}function my(n,s){const u=/cinema|rig|12k/i.test(s.name);Lt(n,-38,-20,76,44,5,u?"#1f2937":"#334155",6),ge(n,-26,-30,24,12,3,"#1f2937"),ge(n,-38,-20,16,44,5,"#111827"),Ee(n,8,2,20,"#0f172a","#475569",3),Ee(n,8,2,14,ze(n,-6,-12,22,16,[[0,V(s.color,.3)],[.5,s.accent],[1,"#020617"]])),Ee(n,3,-3,4,"rgba(255,255,255,0.55)"),Ee(n,28,-14,3,s.color),u&&(ge(n,26,-36,20,14,2,"#111827"),Bn(n,28,-34,16,10,s,1))}function py(n,s){const u=/tower/i.test(s.name);if(/boom/i.test(s.name)){Lt(n,-46,-22,92,44,5,s.accent,8),Ee(n,-24,0,15,"#0f172a",V(s.color,.2),2.5),Ee(n,24,0,15,"#0f172a",V(s.color,.2),2.5),Ee(n,-24,0,7,s.color),Ee(n,24,0,7,s.color),ge(n,-8,-14,16,8,2,V(s.color,.4)),n.strokeStyle="#cbd5e1",n.lineWidth=3,n.beginPath(),n.moveTo(-30,-22),n.quadraticCurveTo(0,-44,30,-22),n.stroke();return}const d=u?82:58;Lt(n,-22,-d/2,44,d,5,"#1f2937",6),Ee(n,0,-d/2+16,9,"#0f172a","#475569",2),Ee(n,0,-d/2+16,4,s.color),Ee(n,0,d/2-22,15,"#0f172a","#475569",2.5),Ee(n,0,d/2-22,7,s.color),n.save(),n.strokeStyle=s.color,n.shadowColor=s.color,n.shadowBlur=6,n.lineWidth=1.2,n.beginPath(),n.arc(0,d/2-22,12,0,Math.PI*2),n.stroke(),n.restore()}function hy(n,s){ge(n,-12,-44,24,30,5,V(s.accent,-.2)),ge(n,-12,14,24,30,5,V(s.accent,-.2)),Lt(n,-20,-22,40,44,3,"#1f2937",10),Bn(n,-16,-18,32,36,s,8),n.save(),n.strokeStyle="#ffffff",n.globalAlpha=.85,n.lineWidth=3,n.lineCap="round",n.beginPath(),n.arc(0,0,10,-Math.PI/2,Math.PI*.9),n.stroke(),n.restore(),ge(n,22,-6,4,10,2,"#64748b")}function _y(n,s){n.strokeStyle=V(s.accent,-.3),n.lineWidth=7,n.lineCap="round",n.beginPath(),n.arc(0,4,34,Math.PI*1.05,Math.PI*1.95),n.stroke(),n.strokeStyle=V(s.color,.1),n.lineWidth=3,n.beginPath(),n.arc(0,4,34,Math.PI*1.1,Math.PI*1.9),n.stroke();for(const u of[-1,1])ge(n,u*34-11,-8,22,36,10,ze(n,0,-8,0,28,[[0,V(s.color,.1)],[1,V(s.accent,-.3)]])),ge(n,u*34-7,-3,14,26,7,"#0f172a"),Ee(n,u*34,10,3,s.color)}function gy(n,s){n.strokeStyle="#334155",n.lineWidth=5;for(const[u,c]of[[-30,-18],[30,-18],[-30,18],[30,18]])n.beginPath(),n.moveTo(0,0),n.lineTo(u,c),n.stroke();for(const[u,c]of[[-30,-18],[30,-18],[-30,18],[30,18]])Ee(n,u,c,5,"#1f2937"),n.save(),n.globalAlpha=.45,n.fillStyle=s.color,n.beginPath(),n.ellipse(u,c-3,17,4,0,0,Math.PI*2),n.fill(),n.restore();ge(n,-16,-12,32,24,8,ze(n,0,-12,0,12,[[0,V(s.color,.25)],[1,s.accent]])),Ee(n,0,13,6,"#0f172a","#475569",1.5),Ee(n,0,13,3,V(s.color,.4)),rn(n,-16,-12,32,12)}function by(n,s){const u=/titan|rig x/i.test(s.name),c=u?52:44,d=u?86:78;Lt(n,-c/2,-d/2,c,d,10,"#0f172a",4),ge(n,-c/2+4,-d/2+4,c-8,d-8,3,"rgba(15,23,42,0.6)","rgba(148,163,184,0.35)",1);const f=(c-12)/4.2;Vr(n,-c/4+1,-d/2+16,f,s.color),Vr(n,c/4-1,-d/2+16,f,s.color),Vr(n,0,-d/2+16+f*2.4,f*1.1,V(s.color,.2)),ge(n,-c/2+7,d/2-26,c-14,7,1.5,"#1e293b"),n.save(),n.fillStyle=s.color,n.shadowColor=s.color,n.shadowBlur=8,n.fillRect(-c/2+7,d/2-20,c-14,2),n.fillRect(-c/2+2,-d/2+6,1.8,d-12),n.restore(),rn(n,-c/2,-d/2,c,d)}function yy(n,s){const u=/prototype|phantom/i.test(s.name);Lt(n,-44,-14,88,30,9,u?"#0b0b12":"#e5e7eb",5),u||ge(n,-44,-14,88,9,4,V(s.color,.2)),n.save(),n.fillStyle=u?"#c084fc":s.color,n.shadowColor=n.fillStyle,n.shadowBlur=10,n.fillRect(-36,6,72,2.2),n.restore(),ge(n,14,-4,22,3,1.5,"#1f2937"),Ee(n,-32,1,2.2,u?"#c084fc":"#22c55e"),rn(n,-44,-14,88,30)}function vy(n,s){const u=ze(n,0,-20,0,24,[[0,V(s.color,.15)],[1,V(s.accent,-.25)]]);n.beginPath(),n.moveTo(-30,-16),n.bezierCurveTo(-12,-22,12,-22,30,-16),n.bezierCurveTo(44,-12,50,18,42,26),n.bezierCurveTo(34,34,24,20,16,14),n.lineTo(-16,14),n.bezierCurveTo(-24,20,-34,34,-42,26),n.bezierCurveTo(-50,18,-44,-12,-30,-16),n.closePath(),n.fillStyle=u,n.fill(),n.strokeStyle=V(s.accent,-.5),n.lineWidth=1.5,n.stroke(),n.fillStyle="#1e293b",n.fillRect(-32,-6,14,4.5),n.fillRect(-27.3,-11,4.5,14);const c=["#22d3ee","#f43f5e","#facc15","#4ade80"];[[26,-10],[32,-4],[26,2],[20,-4]].forEach(([d,f],p)=>Ee(n,d,f,3,c[p])),Ee(n,-10,6,6,"#0f172a","#334155",2),Ee(n,10,6,6,"#0f172a","#334155",2),rn(n,-44,-20,88,16)}function xy(n,s){Lt(n,-46,-16,92,34,7,"#111827",4),ge(n,-50,-18,5,40,1,"#94a3b8");const u=/founders|frostbite/i.test(s.name)?3:2;for(let c=0;c<u;c++){const d=-46+92/(u+1)*(c+1);Vr(n,d,1,13,s.color)}n.save(),n.fillStyle=s.color,n.shadowColor=s.color,n.shadowBlur=10,n.fillRect(-44,-15,88,2),n.restore(),ge(n,-40,18,60,4,1,"#b45309")}function wy(n,s){n.fillStyle="#1f2937",n.fillRect(-46,18,4,22),n.fillRect(42,18,4,22),Lt(n,-48,12,96,7,6,"#334155",2);const u=(c,d,f,p)=>{n.fillStyle="#111827",n.fillRect(c+f/2-1.5,d+p,3,12-(d+p-0)),ge(n,c,d,f,p,2,"#0b1120"),Bn(n,c+1.5,d+1.5,f-3,p-3,s,1)};u(-44,-16,28,20),u(-15,-24,34,26),u(20,-16,28,20),Lt(n,30,-6,14,18,4,"#0f172a",2),n.save(),n.fillStyle=s.color,n.shadowColor=s.color,n.shadowBlur=8,n.fillRect(32,-3,1.5,12),n.fillRect(-46,19.5,92,1.5),n.restore(),ge(n,-14,6,26,5,1.5,"#0f172a"),ge(n,16,6,7,5,2,"#475569")}function jy(n,s){n.strokeStyle="#1f2937",n.lineWidth=6,n.beginPath(),n.ellipse(0,-6,42,26,0,Math.PI,Math.PI*2),n.stroke(),Lt(n,-40,-14,80,36,6,V(s.accent,-.2),14),ge(n,-35,-10,70,26,12,ze(n,-35,-10,35,16,[[0,"#020617"],[.5,V(s.accent,-.3)],[1,"#020617"]])),n.save(),n.globalAlpha=.8,n.fillStyle=s.color,n.shadowColor=s.color,n.shadowBlur=12,n.fillRect(-26,1,52,2.5),n.restore(),rn(n,-35,-10,70,26)}function Sy(n,s){n.fillStyle="#111827",n.beginPath(),n.moveTo(-40,-14),n.lineTo(40,-14),n.lineTo(48,16),n.lineTo(-48,16),n.closePath(),n.fill();for(let u=0;u<4;u++)for(let c=0;c<11;c++){const d=(u+.5)/4,f=-40-8*d,p=80+16*d,_=f+c/11*p+.8,g=(c*30+u*40)%360;n.fillStyle=/rgb|kryo/i.test(s.name)?`hsl(${g},80%,60%)`:"#334155",n.fillRect(_,-11+u*6.6,p/11-1.6,4.8)}n.save(),n.strokeStyle=s.color,n.shadowColor=s.color,n.shadowBlur=8,n.lineWidth=1.5,n.beginPath(),n.moveTo(-48,17),n.lineTo(48,17),n.stroke(),n.restore()}function Ty(n,s){ge(n,-48,-20,96,40,18,ze(n,0,-20,0,20,[[0,V(s.color,.1)],[1,V(s.accent,-.3)]])),ge(n,-26,-14,52,28,3,"#0b1120"),Bn(n,-24,-12,48,24,s,2),Ee(n,-37,-2,5,"#0f172a","#334155",1.5),[[36,-8],[41,-3],[36,2],[31,-3]].forEach(([u,c])=>Ee(n,u,c,2.4,"#1e293b"))}function os(n,s,u){const c=s.color,d=ze(n,0,-20,0,20,[[0,V(c,.35)],[.5,c],[1,V(c,-.45)]]);n.beginPath(),u==="suv"?(n.moveTo(-48,14),n.lineTo(-48,-2),n.lineTo(-40,-6),n.lineTo(-30,-24),n.lineTo(24,-24),n.lineTo(36,-6),n.lineTo(48,-2),n.lineTo(48,14)):u==="car"?(n.moveTo(-46,14),n.lineTo(-46,-2),n.lineTo(-38,-5),n.lineTo(-26,-22),n.lineTo(14,-22),n.lineTo(30,-6),n.lineTo(46,-2),n.lineTo(46,14)):u==="sports_car"?(n.moveTo(-48,12),n.lineTo(-48,0),n.lineTo(-30,-4),n.quadraticCurveTo(-14,-20,8,-18),n.lineTo(26,-6),n.lineTo(48,-2),n.lineTo(48,12)):(n.moveTo(-50,10),n.lineTo(-50,-2),n.lineTo(-32,-6),n.quadraticCurveTo(-10,-18,10,-14),n.lineTo(30,-6),n.lineTo(50,0),n.lineTo(50,10)),n.closePath(),n.fillStyle=d,n.fill(),n.strokeStyle=V(c,-.6),n.lineWidth=1.2,n.stroke(),n.beginPath(),u==="suv"?(n.moveTo(-36,-7),n.lineTo(-28,-21),n.lineTo(22,-21),n.lineTo(32,-7)):u==="car"?(n.moveTo(-34,-6),n.lineTo(-24,-19),n.lineTo(12,-19),n.lineTo(25,-6)):u==="sports_car"?(n.moveTo(-26,-5),n.quadraticCurveTo(-12,-16,6,-15),n.lineTo(20,-6)):(n.moveTo(-26,-6),n.quadraticCurveTo(-8,-15,8,-12),n.lineTo(22,-6)),n.closePath(),n.fillStyle=ze(n,0,-20,0,-5,[[0,"#94a3b8"],[1,"#0f172a"]]),n.fill(),Ee(n,46,2,2.5,"#fef9c3"),n.fillStyle="#ef4444",n.fillRect(-49,1,3,4),u==="hypercar"&&(n.fillStyle=V(c,-.5),n.fillRect(-50,-16,16,3),n.fillRect(-44,-13,2,8),n.save(),n.strokeStyle=s.rarity==="secret"?"#c084fc":V(c,.6),n.shadowColor=n.strokeStyle,n.shadowBlur=8,n.lineWidth=1.5,n.beginPath(),n.moveTo(-40,6),n.lineTo(40,4),n.stroke(),n.restore());const f=u==="suv"?11:u==="car"?10:10.5;oi(n,-28,13,f),oi(n,30,13,f),rn(n,-48,-22,96,18)}function Ny(n,s){const u=/moped|scoot/i.test(s.name);oi(n,-30,16,14),oi(n,32,16,14),n.strokeStyle="#475569",n.lineWidth=3,n.beginPath(),n.moveTo(-30,16),n.lineTo(-6,-2),n.lineTo(22,-2),n.lineTo(32,16),n.stroke(),n.beginPath(),n.moveTo(24,-2),n.lineTo(28,-20),n.stroke(),n.fillStyle="#1f2937",n.fillRect(22,-23,14,3);const c=ze(n,0,-14,0,6,[[0,V(s.color,.3)],[1,s.accent]]);n.beginPath(),u?(n.moveTo(-18,8),n.lineTo(-10,-8),n.lineTo(10,-8),n.lineTo(16,8),n.closePath()):(n.moveTo(-14,-2),n.quadraticCurveTo(-2,-18,18,-10),n.lineTo(22,2),n.lineTo(-12,4),n.closePath()),n.fillStyle=c,n.fill(),ge(n,-26,-8,20,6,3,"#111827"),/neon|superbike|track/i.test(s.name)&&(n.save(),n.strokeStyle=s.color,n.shadowColor=s.color,n.shadowBlur=10,n.lineWidth=1.5,n.beginPath(),n.arc(-30,16,14,0,Math.PI*2),n.arc(32,16,14,0,Math.PI*2),n.stroke(),n.restore())}function ky(n,s){const u=ze(n,0,-20,0,14,[[0,V(s.color,.25)],[1,V(s.accent,-.1)]]);n.beginPath(),n.moveTo(-44,10),n.lineTo(-44,-6),n.quadraticCurveTo(-42,-20,-26,-20),n.lineTo(-10,-14),n.quadraticCurveTo(8,-2,30,-2),n.quadraticCurveTo(46,0,46,10),n.closePath(),n.fillStyle=u,n.fill(),n.strokeStyle=V(s.accent,-.5),n.lineWidth=1.2,n.stroke(),ge(n,-46,8,94,9,4,s.rarity==="secret"?"#1e1b4b":"#f8fafc"),n.fillStyle=V(s.color,-.3),n.fillRect(-44,14,90,2),n.fillStyle=s.rarity==="secret"?"#c084fc":"#ffffff",n.beginPath(),n.moveTo(-30,2),n.lineTo(-6,-8),n.lineTo(-10,-2),n.lineTo(16,-6),n.lineTo(-8,6),n.lineTo(-4,0),n.closePath(),n.fill(),n.strokeStyle="#ffffff",n.lineWidth=1.4;for(let c=0;c<4;c++)n.beginPath(),n.moveTo(-22+c*5,-17+c*2.2),n.lineTo(-17+c*5,-13+c*2.2),n.stroke();/zero-g|hover|glow/i.test(s.name)&&(n.save(),n.fillStyle=s.rarity==="secret"?"#c084fc":s.color,n.shadowColor=n.fillStyle,n.shadowBlur=14,n.globalAlpha=.7,n.fillRect(-42,19,86,2),n.restore())}function th(n,s,u){const c=ze(n,0,-30,0,36,[[0,V(s.color,.2)],[1,V(s.accent,-.2)]]);n.beginPath(),n.moveTo(-18,-30),n.lineTo(-40,-18),n.lineTo(-48,16),n.lineTo(-36,18),n.lineTo(-30,-2),n.lineTo(-28,36),n.lineTo(28,36),n.lineTo(30,-2),n.lineTo(36,18),n.lineTo(48,16),n.lineTo(40,-18),n.lineTo(18,-30),n.quadraticCurveTo(0,-18,-18,-30),n.closePath(),n.fillStyle=c,n.fill(),n.strokeStyle=V(s.accent,-.5),n.lineWidth=1.2,n.stroke(),u?(n.strokeStyle="#e2e8f0",n.lineWidth=1.5,n.beginPath(),n.moveTo(0,-22),n.lineTo(0,36),n.stroke(),n.fillStyle=V(s.color,.4),n.fillRect(-28,30,56,6),n.fillStyle=V(s.color,-.3),n.beginPath(),n.moveTo(-18,-30),n.lineTo(-6,-14),n.lineTo(0,-22),n.lineTo(6,-14),n.lineTo(18,-30),n.quadraticCurveTo(0,-24,-18,-30),n.fill(),/reflect|aurora/i.test(s.name)&&(n.save(),n.fillStyle=/aurora/i.test(s.name)?"#a5f3fc":"#e2e8f0",n.globalAlpha=.8,n.fillRect(-28,10,56,3),n.fillRect(-44,8,8,3),n.fillRect(36,8,8,3),n.restore())):(n.strokeStyle=V(s.accent,-.4),n.lineWidth=2,n.beginPath(),n.moveTo(-16,-30),n.quadraticCurveTo(0,-6,16,-30),n.stroke(),ge(n,-16,14,32,12,4,V(s.color,-.12)),n.strokeStyle="#f8fafc",n.lineWidth=1.2,n.beginPath(),n.moveTo(-5,-16),n.lineTo(-6,-2),n.moveTo(5,-16),n.lineTo(6,-2),n.stroke()),rn(n,-40,-30,80,30)}function Ey(n,s){n.beginPath(),n.moveTo(-34,8),n.quadraticCurveTo(-34,-30,0,-30),n.quadraticCurveTo(34,-30,34,8),n.closePath(),n.fillStyle=ze(n,0,-30,0,8,[[0,V(s.color,.3)],[1,s.accent]]),n.fill(),n.beginPath(),n.moveTo(-10,6),n.quadraticCurveTo(30,0,52,14),n.quadraticCurveTo(28,18,-10,14),n.closePath(),n.fillStyle=V(s.accent,-.3),n.fill(),Ee(n,0,-29,3,V(s.accent,-.3)),ge(n,-10,-16,20,10,3,"#f8fafc"),n.fillStyle=s.accent,n.font="bold 7px system-ui, sans-serif",n.textAlign="center",n.fillText(s.brand[0],0,-8.5)}function Ay(n,s){n.strokeStyle="#1f2937",n.lineWidth=3,n.beginPath(),n.moveTo(-46,-8),n.lineTo(-40,-6),n.moveTo(46,-8),n.lineTo(40,-6),n.moveTo(-6,-4),n.quadraticCurveTo(0,-9,6,-4),n.stroke();for(const u of[-1,1])n.beginPath(),n.ellipse(u*22,2,19,13,0,0,Math.PI*2),n.fillStyle=ze(n,u*22-19,-11,u*22+19,15,[[0,V(s.color,.2)],[.6,s.accent],[1,"#020617"]]),n.fill(),n.strokeStyle="#111827",n.lineWidth=2.5,n.stroke(),rn(n,u*22-19,-11,38,13)}function Cy(n,s){n.strokeStyle=V(s.accent,-.4),n.lineWidth=5,n.beginPath(),n.arc(0,-30,10,Math.PI,Math.PI*2),n.stroke(),ge(n,-30,-32,60,70,18,ze(n,0,-32,0,38,[[0,V(s.color,.2)],[1,s.accent]]),V(s.accent,-.5)),ge(n,-20,6,40,24,8,V(s.color,-.15)),n.strokeStyle="#f8fafc",n.lineWidth=1.5,n.beginPath(),n.moveTo(-14,10),n.lineTo(14,10),n.stroke(),/holo/i.test(s.name)&&(n.save(),n.globalAlpha=.55,n.fillStyle=ze(n,-30,-32,30,38,[[0,"#f0abfc"],[.5,"#67e8f9"],[1,"#fde68a"]]),Wr(n,-30,-32,60,70,18),n.fill(),n.restore()),rn(n,-30,-32,60,40)}function Oy(n,s){const u=/gold|royal|tourbillon|gala|chrono/i.test(s.name),c=u?"#b45309":"#475569";ge(n,-13,-48,26,30,4,c),ge(n,-13,18,26,30,4,c);for(let p=0;p<4;p++)n.fillStyle="rgba(0,0,0,0.25)",n.fillRect(-13,-44+p*7,26,1.2),n.fillRect(-13,22+p*7,26,1.2);const d=u?ze(n,-26,-26,26,26,[[0,"#fde68a"],[.5,"#f59e0b"],[1,"#78350f"]]):ze(n,-26,-26,26,26,[[0,"#f1f5f9"],[1,"#475569"]]);Ee(n,0,0,26,d);const f=/skeleton|tourbillon/i.test(s.name);if(Ee(n,0,0,21,f?"#0f172a":ze(n,0,-21,0,21,[[0,V(s.color,.3)],[1,s.accent]])),f){n.strokeStyle=u?"#fbbf24":"#94a3b8",n.lineWidth=1;for(let p=0;p<6;p++)n.beginPath(),n.arc(0,0,5+p*2.6,p,p+2.5),n.stroke();Ee(n,0,8,6,"rgba(251,191,36,0.3)","#fbbf24",1)}n.fillStyle=u?"#fef3c7":"#f8fafc";for(let p=0;p<12;p++){const _=p/12*Math.PI*2;n.fillRect(Math.cos(_)*17-1,Math.sin(_)*17-1,2,2)}n.strokeStyle=u?"#fef3c7":"#f8fafc",n.lineWidth=2,n.lineCap="round",n.beginPath(),n.moveTo(0,0),n.lineTo(0,-13),n.moveTo(0,0),n.lineTo(9,5),n.stroke(),ge(n,25,-4,5,8,2,u?"#f59e0b":"#94a3b8"),rn(n,-21,-21,42,21)}function Ry(n,s){const c=!/silver/i.test(s.name)?"#fbbf24":"#e2e8f0";n.lineWidth=2.5;for(let p=0;p<=18;p++){const _=Math.PI*.12+p/18*Math.PI*.76,g=Math.cos(_)*40,w=-32+Math.sin(_)*50;n.strokeStyle=p%2?V(c,-.25):c,n.beginPath(),n.ellipse(g,w,4,2.6,_,0,Math.PI*2),n.stroke()}const d=/crown/i.test(s.name),f=ze(n,-14,16,14,42,[[0,V(c,.4)],[1,V(c,-.4)]]);n.fillStyle=f,n.beginPath(),d?(n.moveTo(-14,36),n.lineTo(-14,20),n.lineTo(-7,28),n.lineTo(0,16),n.lineTo(7,28),n.lineTo(14,20),n.lineTo(14,36)):(n.moveTo(0,16),n.lineTo(13,29),n.lineTo(0,42),n.lineTo(-13,29)),n.closePath(),n.fill(),/diamond|crown/i.test(s.name)&&(Ee(n,0,29,4,"#e0f2fe"),Ee(n,-1,28,1.5,"#ffffff"))}function My(n,s){n.lineWidth=7,n.strokeStyle=ze(n,-26,0,26,0,[[0,"#fde68a"],[.5,"#b45309"],[1,"#fde68a"]]),n.beginPath(),n.ellipse(0,12,26,20,0,0,Math.PI*2),n.stroke(),Ir(n,0,-16,13,s.color)}function Ir(n,s,u,c,d){const f=[[-1,-.35],[-.55,-.9],[.55,-.9],[1,-.35],[0,1]];n.beginPath(),f.forEach(([p,_],g)=>g?n.lineTo(s+p*c,u+_*c):n.moveTo(s+p*c,u+_*c)),n.closePath(),n.fillStyle=ze(n,s-c,u-c,s+c,u+c,[[0,V(d,.6)],[.5,d],[1,V(d,-.5)]]),n.fill(),n.strokeStyle="rgba(255,255,255,0.7)",n.lineWidth=.9,n.beginPath(),n.moveTo(s-c,u-.35*c),n.lineTo(s+c,u-.35*c),n.moveTo(s-.55*c,u-.9*c),n.lineTo(s-.3*c,u-.35*c),n.lineTo(s,u+c),n.lineTo(s+.3*c,u-.35*c),n.lineTo(s+.55*c,u-.9*c),n.stroke()}function zy(n,s){const u=s.rarity==="secret"?"#1e1b4b":/emerald/i.test(s.name)?"#34d399":/studs/i.test(s.name)?"#e0f2fe":s.color;if(/studs/i.test(s.name)){Ir(n,-20,0,18,u),Ir(n,20,0,18,u);return}Ir(n,0,4,42,u),s.rarity==="secret"&&(n.save(),n.strokeStyle="#c084fc",n.shadowColor="#c084fc",n.shadowBlur=16,n.lineWidth=2,n.beginPath(),n.arc(0,4,20,0,Math.PI*2),n.stroke(),n.restore())}function qy(n){const s=(u,c)=>{n.beginPath(),n.moveTo(u-20,c+10),n.lineTo(u-14,c-6),n.lineTo(u+14,c-6),n.lineTo(u+20,c+10),n.closePath(),n.fillStyle=ze(n,u,c-6,u,c+10,[[0,"#fde68a"],[.5,"#f59e0b"],[1,"#92400e"]]),n.fill(),n.fillStyle="rgba(255,255,255,0.45)",n.fillRect(u-12,c-4,24,2)};s(-21,22),s(21,22),s(0,6),s(-10,-10),s(12,-10)}function Dy(n,s){ge(n,-8,-44,16,14,3,"#fbbf24"),ge(n,-5,-32,10,8,1,"#d97706"),n.beginPath(),n.moveTo(-24,-24),n.lineTo(24,-24),n.lineTo(30,30),n.quadraticCurveTo(0,40,-30,30),n.closePath(),n.fillStyle="rgba(226,232,240,0.35)",n.fill(),n.strokeStyle="rgba(255,255,255,0.7)",n.lineWidth=1.5,n.stroke(),n.save(),n.clip(),n.fillStyle=ze(n,0,-10,0,36,[[0,V(s.color,.2)],[1,s.accent]]),n.fillRect(-32,-8,64,46),n.restore(),ge(n,-14,2,28,14,2,"#f8fafc"),n.fillStyle="#0f172a",n.font="bold 7px system-ui, sans-serif",n.textAlign="center",n.fillText(s.brand,0,12),rn(n,-24,-24,48,60)}function $y(n,s){const u=s.rarity==="secret";if(Ee(n,0,0,36,u?ze(n,-36,-36,36,36,[[0,"#1e1b4b"],[1,"#020617"]]):ze(n,-36,-36,36,36,[[0,V(s.color,.5)],[.6,s.color],[1,V(s.accent,-.3)]])),n.strokeStyle=u?"#c084fc":V(s.accent,-.4),n.lineWidth=2,n.beginPath(),n.arc(0,0,36,0,Math.PI*2),n.moveTo(-36,0),n.quadraticCurveTo(0,14,36,0),n.moveTo(0,-36),n.quadraticCurveTo(-14,0,0,36),n.stroke(),/championship|signature|golden/i.test(s.name)){n.fillStyle="#fbbf24",n.beginPath();for(let c=0;c<10;c++){const d=c%2?5:11,f=c/10*Math.PI*2-Math.PI/2;n.lineTo(Math.cos(f)*d-14,Math.sin(f)*d-12)}n.closePath(),n.fill()}n.save(),n.globalAlpha=.35,Ee(n,-12,-14,12,"#ffffff"),n.restore()}function Uy(n,s){const u=/hover/i.test(s.name);n.save(),n.rotate(-.18),u?(n.save(),n.fillStyle=s.color,n.shadowColor=s.color,n.shadowBlur=18,n.globalAlpha=.6,n.beginPath(),n.ellipse(0,14,40,5,0,0,Math.PI*2),n.fill(),n.restore()):(oi(n,-30,12,5.5,"#fde68a"),oi(n,30,12,5.5,"#fde68a")),ge(n,-48,-2,96,10,5,ze(n,0,-2,0,8,[[0,V(s.color,.3)],[1,s.accent]]),V(s.accent,-.5)),n.fillStyle="rgba(0,0,0,0.3)",n.fillRect(-30,0,60,2),n.restore()}function Ly(n,s){for(const c of[-28,28]){n.strokeStyle="#0f172a",n.lineWidth=4,n.beginPath(),n.arc(c,14,18,0,Math.PI*2),n.stroke(),n.strokeStyle="#94a3b8",n.lineWidth=.8;for(let d=0;d<8;d++){const f=d/8*Math.PI*2;n.beginPath(),n.moveTo(c,14),n.lineTo(c+Math.cos(f)*18,14+Math.sin(f)*18),n.stroke()}}n.strokeStyle=s.color,n.lineWidth=4,n.lineJoin="round",n.beginPath(),n.moveTo(-28,14),n.lineTo(-8,-10),n.lineTo(20,-10),n.lineTo(0,14),n.lineTo(-28,14),n.moveTo(0,14),n.lineTo(-10,-16),n.moveTo(20,-10),n.lineTo(28,14),n.moveTo(20,-10),n.lineTo(18,-20),n.stroke(),ge(n,-18,-21,16,5,2.5,"#111827"),n.strokeStyle="#111827",n.lineWidth=3,n.beginPath(),n.moveTo(12,-21),n.lineTo(26,-20),n.stroke()}function Hy(n,s){n.save(),n.rotate(-.5);const u=/golden/i.test(s.name)?"#fbbf24":s.color;n.beginPath(),n.ellipse(0,-14,22,28,0,0,Math.PI*2),n.strokeStyle=u,n.lineWidth=5,n.stroke(),n.save(),n.clip(),n.strokeStyle="rgba(255,255,255,0.6)",n.lineWidth=.8;for(let c=-22;c<=22;c+=5)n.beginPath(),n.moveTo(c,-44),n.lineTo(c,16),n.stroke(),n.beginPath(),n.moveTo(-24,c-14),n.lineTo(24,c-14),n.stroke();n.restore(),n.fillStyle=u,n.fillRect(-2.5,14,5,12),ge(n,-4,24,8,24,3,"#1f2937"),n.restore()}function Yy(n,s){n.strokeStyle="#cbd5e1",n.lineWidth=3,n.beginPath(),n.moveTo(-26,-40),n.lineTo(10,26),n.stroke(),ge(n,-32,-46,10,14,3,"#111827"),n.beginPath(),n.moveTo(6,22),n.quadraticCurveTo(30,18,30,30),n.lineTo(8,32),n.closePath(),n.fillStyle=ze(n,6,18,30,32,[[0,V(s.color,.4)],[1,s.accent]]),n.fill(),/set/i.test(s.name)&&(n.strokeStyle="#94a3b8",n.beginPath(),n.moveTo(20,-40),n.lineTo(-6,26),n.stroke(),ge(n,16,-46,10,12,3,"#111827")),Ee(n,34,36,6,"#f8fafc","#cbd5e1",1)}function By(n,s){n.save(),n.rotate(.6),n.beginPath(),n.ellipse(0,0,16,48,0,0,Math.PI*2),n.fillStyle=ze(n,-16,0,16,0,[[0,V(s.color,.3)],[1,s.accent]]),n.fill(),n.strokeStyle="#f8fafc",n.lineWidth=3,n.beginPath(),n.moveTo(0,-46),n.lineTo(0,46),n.stroke(),n.fillStyle="#0f172a",n.beginPath(),n.moveTo(-3,36),n.lineTo(0,46),n.lineTo(3,36),n.fill(),n.restore()}function Gy(n,s){const u=/platinum/i.test(s.name),c=u?["#f1f5f9","#94a3b8","#475569"]:["#fef3c7","#f59e0b","#78350f"],d=ze(n,-24,-40,24,10,[[0,c[0]],[.5,c[1]],[1,c[2]]]);n.strokeStyle=c[1],n.lineWidth=5,n.beginPath(),n.arc(-24,-18,10,Math.PI*.5,Math.PI*1.5),n.arc(24,-18,10,-Math.PI*.5,Math.PI*.5),n.stroke(),n.beginPath(),n.moveTo(-26,-40),n.lineTo(26,-40),n.quadraticCurveTo(24,0,0,6),n.quadraticCurveTo(-24,0,-26,-40),n.closePath(),n.fillStyle=d,n.fill(),n.fillStyle=c[1],n.fillRect(-4,6,8,14),Lt(n,-20,20,40,14,5,"#1f2937",2),ge(n,-12,24,24,6,1,c[1]),n.fillStyle=u?"#e879f9":s.color,n.beginPath();for(let f=0;f<10;f++){const p=f%2?4:9,_=f/10*Math.PI*2-Math.PI/2;n.lineTo(Math.cos(_)*p,-20+Math.sin(_)*p)}n.closePath(),n.fill(),rn(n,-26,-40,52,20)}const nh={tv:(n,s)=>oy(n,s,/120|150|98|holo|hyper/i.test(s.name)?1.08:1),monitor:uy,phone:cy,tablet:dy,laptop:fy,camera:my,speaker:py,smartwatch:hy,headphones:_y,drone:gy,gaming_pc:by,console:yy,controller:vy,gpu:xy,gaming_setup:wy,vr_headset:jy,keyboard:Sy,handheld:Ty,car:(n,s)=>os(n,s,"car"),suv:(n,s)=>os(n,s,"suv"),sports_car:(n,s)=>os(n,s,"sports_car"),supercar:(n,s)=>os(n,s,"supercar"),hypercar:(n,s)=>os(n,s,"hypercar"),motorbike:Ny,sneakers:ky,hoodie:(n,s)=>th(n,s,!1),jacket:(n,s)=>th(n,s,!0),cap:Ey,sunglasses:Ay,backpack:Cy,luxury_watch:Oy,chain:Ry,ring:My,diamond:zy,gold_bar:n=>qy(n),perfume:Dy,ball:$y,skateboard:Uy,bicycle:Ly,racket:Hy,golf:Yy,surfboard:By,trophy:Gy},Th=new Set(["car","suv","sports_car","supercar","hypercar","motorbike"]),Xy=new Set(["tv","monitor"]),Vy=new Set(["gaming_pc","console","laptop","keyboard","gpu","handheld","gaming_setup","tablet","vr_headset","controller"]);function Iy(n,s,u){n.save(),n.scale(u/100,u/100),n.lineJoin="round";const c=nh[s.kind]||nh.tablet;try{c(n,s)}catch(d){console.warn("art failed",s.kind,d)}n.restore()}const ah=new Map,lh=new Map;function to(n,s){const u=n.id+"@"+s;let c=ah.get(u);if(c)return c;c=document.createElement("canvas"),c.width=s,c.height=s;const d=c.getContext("2d");return d.translate(s/2,s/2),Iy(d,n,s*.86),ah.set(u,c),c}function no(n,s=128){const u=n.id+"@"+s;let c=lh.get(u);return c||(c=to(n,s).toDataURL("image/png"),lh.set(u,c)),c}function st(n,s,u,c,d,f){const p=Math.max(0,Math.min(f,c/2,d/2));n.beginPath(),n.moveTo(s+p,u),n.arcTo(s+c,u,s+c,u+d,p),n.arcTo(s+c,u+d,s,u+d,p),n.arcTo(s,u+d,s,u,p),n.arcTo(s,u,s+c,u,p),n.closePath()}function bn(n,s,u,c,d,f=.5){const p=n.createRadialGradient(s,u,0,s,u,c);p.addColorStop(0,d),p.addColorStop(1,"rgba(0,0,0,0)"),n.save(),n.globalAlpha=f,n.fillStyle=p,n.fillRect(s-c,u-c,c*2,c*2),n.restore()}function be(n,s,u,c,d,f,p={}){n.font=`${p.weight??800} ${d}px ${p.font??"'Rajdhani', 'Segoe UI', system-ui, sans-serif"}`,n.textAlign=p.align??"center",n.textBaseline="middle",p.stroke&&(n.lineWidth=Math.max(2,d/5),n.strokeStyle=p.stroke,n.lineJoin="round",n.strokeText(s,u,c)),n.fillStyle=f,n.fillText(s,u,c)}function Qy(n,s,u,c){const f=Math.floor(s.x/80)*80,p=Math.floor(s.y/80)*80;for(let _=p;_<s.y+s.h+80;_+=80)for(let g=f;g<s.x+s.w+80;g+=80){const w=g/80*7+_/80*13&7;n.fillStyle=w===0?"#0e1426":w===1?"#0c1222":"#0b1020",n.fillRect(g,_,80,80)}n.strokeStyle="rgba(56,189,248,0.07)",n.lineWidth=1,n.beginPath();for(let _=f;_<s.x+s.w+80;_+=80)n.moveTo(_,s.y),n.lineTo(_,s.y+s.h);for(let _=p;_<s.y+s.h+80;_+=80)n.moveTo(s.x,_),n.lineTo(s.x+s.w,_);if(n.stroke(),c==="high"){const _=(Math.sin(u*.6)+1)/2;bn(n,1800,1400,700,"rgba(34,211,238,0.10)",.6+_*.3)}}function Zy(n,s){const u=(c,d,f,p)=>{n.fillStyle="#151b2e",n.fillRect(c,d,f,p),n.strokeStyle="rgba(250,204,21,0.35)",n.lineWidth=3,n.setLineDash([26,22]),n.lineDashOffset=-s*20,n.beginPath(),f>p?(n.moveTo(c,d+p/2),n.lineTo(c+f,d+p/2)):(n.moveTo(c+f/2,d),n.lineTo(c+f/2,d+p)),n.stroke(),n.setLineDash([]),n.strokeStyle="rgba(56,189,248,0.25)",n.lineWidth=2,n.strokeRect(c,d,f,p)};u(60,560,3480,70),u(60,2170,3480,70),u(620,560,60,1680),u(2920,560,60,1680),u(1765,960,70,1080),u(680,1365,2240,70)}function Py(n,s,u,c){const{x:d,y:f}={x:1800,y:1400};n.save(),n.fillStyle="#121a31",n.beginPath(),n.ellipse(d,f,240,200,0,0,Math.PI*2),n.fill(),n.strokeStyle="rgba(34,211,238,0.35)",n.lineWidth=3,n.stroke();for(let p=0;p<24;p++){const _=p/24*Math.PI*2+s*.1;n.fillStyle=p%2?"rgba(34,211,238,0.5)":"rgba(232,121,249,0.5)",n.beginPath(),n.arc(d+Math.cos(_)*225,f+Math.sin(_)*186,3,0,Math.PI*2),n.fill()}n.fillStyle="#0a2a3a",n.beginPath(),n.ellipse(d,f+10,110,70,0,0,Math.PI*2),n.fill(),n.strokeStyle="#38bdf8",n.lineWidth=4,n.stroke();for(let p=0;p<3;p++){const _=(s*30+p*30)%90+10;n.strokeStyle=`rgba(125,211,252,${.5-_/200})`,n.lineWidth=2,n.beginPath(),n.ellipse(d,f+10,_,_*.6,0,0,Math.PI*2),n.stroke()}n.restore()}function Ky(n,s,u,c){if(n.fillStyle="#1e293b",st(n,1774,1394,52,22,6),n.fill(),c==="high"&&bn(n,1800,1310,140,"rgba(192,132,252,0.35)"),n.save(),n.globalAlpha=.18,n.fillStyle="#a5f3fc",n.beginPath(),n.moveTo(1778,1400),n.lineTo(1740,1230),n.lineTo(1860,1230),n.lineTo(1822,1400),n.fill(),n.restore(),u){const p=to(u,128),_=1+Math.sin(s*1.5)*.04;n.save(),n.translate(1800,1295+Math.sin(s*2)*6),n.scale(Math.cos(s*.8)*_,_),n.globalAlpha=.9,n.drawImage(p,-64,-64,128,128),n.restore(),be(n,"THE ONE EVERYONE WANTS",1800,1210,13,"#e9d5ff",{stroke:"#0b1020"}),be(n,u.name,1800,1228,16,"#ffffff",{stroke:"#0b1020"})}}function Nh(n,s,u,c,d,f,p,_){n.fillStyle=_,n.fillRect(s,u-d-f,c,f);const g=n.createLinearGradient(0,u-d,0,u);g.addColorStop(0,V(p,.1)),g.addColorStop(1,V(p,-.3)),n.fillStyle=g,n.fillRect(s,u-d,c,d)}function Jy(n,s,u,c){Nh(n,1440,950,720,210,70,"#1e2a4a","#27355c");for(let g=0;g<9;g++){const w=1460+g*78,v=n.createLinearGradient(w,760,w+60,880);v.addColorStop(0,"rgba(125,211,252,0.35)"),v.addColorStop(1,"rgba(30,64,175,0.25)"),n.fillStyle=v,n.fillRect(w,760,62,110)}n.fillStyle="#020617",n.fillRect(1460,888,680,30),n.save(),n.beginPath(),n.rect(1460,888,680,30),n.clip();let _=2160-s*90%2400;for(let g=0;g<2;g++)for(const w of u){const v=`${w.name}  ${w.price}  `;be(n,v,_,903,15,"#e2e8f0",{align:"left",weight:700}),_+=n.measureText(v).width;const b=`${w.change>=0?"▲":"▼"} ${Math.abs(w.change).toFixed(1)}%     `;be(n,b,_,903,15,w.change>=0?"#4ade80":"#f87171",{align:"left",weight:800}),_+=n.measureText(b).width}n.restore(),n.fillStyle="#0b1020",n.fillRect(1440+720/2-60,922,120,28),n.fillStyle="rgba(34,211,238,0.5)",n.fillRect(1440+720/2-60,920,120,3),c==="high"&&bn(n,1440+720/2,700,260,"rgba(34,211,238,0.35)"),be(n,"CENTRAL MARKET",1440+720/2,710,44,"#67e8f9",{stroke:"#0b1020",weight:900}),be(n,"BUY · SELL · WATCH THE PRICES MOVE",1440+720/2,745,14,"#bae6fd",{weight:700})}const Fr={basic:["#64748b","#94a3b8"],premium:["#1d4ed8","#38bdf8"],elite:["#6d28d9","#a855f7"],ultra:["#be185d","#e879f9"],event:["#c2410c","#fb923c"],secret:["#0b0612","#c084fc"]};function fd(n,s,u,c,d,f){const[p,_]=Fr[d]||Fr.basic;n.save(),n.translate(s,u),n.fillStyle=V(_,.2),n.beginPath(),n.moveTo(-c/2,-c/2),n.lineTo(-c/2+c*.2,-c/2-c*.18),n.lineTo(c/2+c*.2,-c/2-c*.18),n.lineTo(c/2,-c/2),n.fill(),n.fillStyle=V(p,-.3),n.beginPath(),n.moveTo(c/2,-c/2),n.lineTo(c/2+c*.2,-c/2-c*.18),n.lineTo(c/2+c*.2,c/2-c*.18),n.lineTo(c/2,c/2),n.fill();const g=n.createLinearGradient(0,-c/2,0,c/2);g.addColorStop(0,_),g.addColorStop(1,p),n.fillStyle=g,n.fillRect(-c/2,-c/2,c,c),n.strokeStyle="rgba(255,255,255,0.5)",n.lineWidth=Math.max(1,c/18),n.strokeRect(-c/2+c*.08,-c/2+c*.08,c*.84,c*.84),n.fillStyle=d==="secret"?"#c084fc":"#ffffff",n.fillRect(-c*.08,-c/2,c*.16,c),d==="ultra"&&(n.globalAlpha=.35,n.fillStyle=oa(f),n.fillRect(-c/2,-c/2,c,c)),n.restore()}function Wy(n,s,u,c){n.fillStyle="#131a33",st(n,2340,1180,680,440,30),n.fill(),n.strokeStyle="rgba(232,121,249,0.35)",n.lineWidth=3,n.stroke(),be(n,"DROP ZONE",2680,1140,40,"#f0abfc",{stroke:"#0b1020",weight:900});const d=2360,f=1470,p=640;n.fillStyle="#1f2937",n.fillRect(d,f,p,46),n.fillStyle="#0f172a",n.fillRect(d,f+46,p,12),n.strokeStyle="#334155",n.lineWidth=2;for(let g=0;g<28;g++){const w=d+(g*26+s*60)%p;n.beginPath(),n.moveTo(w,f+2),n.lineTo(w,f+44),n.stroke()}const _=["basic","premium","elite","ultra","event","secret"];for(let g=0;g<6;g++){const w=d+(g*110+s*60)%p;fd(n,w,f+18,26,_[(g+Math.floor(s/11))%6],s)}}function Fy(n,s,u,c,d,f){const[p,_]=Fr[s.id]||Fr.basic,g=80,w=150;f==="high"&&!s.locked&&bn(n,u,c-80,110,_,s.id==="secret"?.5:.28),n.fillStyle=V(p,-.35),n.fillRect(u-g/2+6,c-w-8,g,w);const v=n.createLinearGradient(u-g/2,0,u+g/2,0);v.addColorStop(0,V(p,-.1)),v.addColorStop(.5,p),v.addColorStop(1,V(p,-.4)),n.fillStyle=v,st(n,u-g/2,c-w,g,w,10),n.fill(),n.fillStyle="rgba(15,23,42,0.85)",st(n,u-30,c-w+12,60,64,10),n.fill(),fd(n,u-4,c-w+50+Math.sin(d*2+u)*4,30,s.id,d),n.fillStyle="rgba(255,255,255,0.12)",st(n,u-28,c-w+14,20,58,8),n.fill(),n.fillStyle="#020617",st(n,u-36,c-64,72,40,6),n.fill(),be(n,s.name.replace(" DROP",""),u,c-52,13,s.id==="ultra"?oa(d):_,{weight:900}),be(n,s.locked?"🔒":s.price,u,c-34,12,"#e2e8f0",{weight:800}),s.tokens>0&&(n.fillStyle="#22c55e",n.beginPath(),n.arc(u+g/2-6,c-w+6,11,0,Math.PI*2),n.fill(),be(n,String(s.tokens),u+g/2-6,c-w+6,12,"#052e16",{weight:900})),n.fillStyle=s.locked?"#475569":_,n.fillRect(u-20,c-14,40,4)}function ev(n,s,u,c){n.fillStyle="#1f2937",n.fillRect(740,1200,12,30),n.fillRect(1108,1200,12,30),c==="high"&&bn(n,700+460/2,1220-170/2-20,280,"rgba(244,63,94,0.28)"),n.fillStyle="#120a14",st(n,700,1030,460,170,10),n.fill(),n.strokeStyle="#f43f5e",n.lineWidth=4,n.stroke(),be(n,"🥷 RAID BOARD",700+460/2,1008,34,"#fda4af",{stroke:"#0b1020",weight:900});const g=Math.min(4,u.length);for(let w=0;w<g;w++){const v=u[w],b=720+w*(420/4),y=420/4-10;n.fillStyle="#f5f5dc",st(n,b,1044,y,144,4),n.fill(),be(n,"WANTED",b+y/2,1058,12,"#7f1d1d",{weight:900}),n.fillStyle=`hsl(${(w*70+200)%360},60%,45%)`,n.beginPath(),n.arc(b+y/2,1092,18,0,Math.PI*2),n.fill(),be(n,v.bot?"🤖":"🙂",b+y/2,1093,18,"#fff"),be(n,v.name.slice(0,11),b+y/2,1126,11,"#111827",{weight:800}),be(n,v.value,b+y/2,1144,12,"#15803d",{weight:900}),be(n,"SEC "+v.sec,b+y/2,1162,10,"#7f1d1d",{weight:800})}if(c==="high"){n.save(),n.globalAlpha=.08+.04*Math.sin(s*3),n.fillStyle="#fecdd3";const w=700+460/2+Math.sin(s*.8)*180;n.beginPath(),n.moveTo(w,1300),n.lineTo(w-60,1030),n.lineTo(w+60,1030),n.fill(),n.restore()}}function tv(n,s,u){Nh(n,720,1630,420,80,30,"#1c3a2e","#245240");for(let p=0;p<12;p++)n.fillStyle=p%2?"#22c55e":"#f8fafc",n.beginPath(),n.moveTo(720+p*(420/12),1550),n.lineTo(720+(p+1)*(420/12),1550),n.lineTo(720+(p+1)*(420/12)-4,1570),n.lineTo(720+p*(420/12)+4,1570),n.fill();n.fillStyle="#0f172a",n.fillRect(750,1580,150,40),n.fillRect(960,1580,150,40),u==="high"&&bn(n,720+420/2,1490,160,"rgba(74,222,128,0.35)"),be(n,"🤝 TRADE HUB",720+420/2,1490,32,"#86efac",{stroke:"#0b1020",weight:900}),be(n,"⇄",720+420/2,1600+Math.sin(s*3)*2,30,"#4ade80",{weight:900})}function nv(n,s,u,c,d){n.fillStyle="#1e1b3a",n.fillRect(1500,1990,600,40),n.fillStyle="#2e2a5a",n.fillRect(1500,1970,600,20),n.fillStyle="#020617",st(n,1610,1780,380,170,10),n.fill(),n.strokeStyle=u?"#fb923c":"#475569",n.lineWidth=4,n.stroke(),u?(d==="high"&&bn(n,1500+600/2,1860,260,"rgba(251,146,60,0.35)"),be(n,u.icon,1500+600/2,1825,46,"#fff"),be(n,u.title,1500+600/2,1880,30,"#fed7aa",{weight:900}),be(n,"LIVE · "+u.left+" left",1500+600/2,1915,15,"#fdba74",{weight:800})):(be(n,"NEXT EVENT",1500+600/2,1840,20,"#94a3b8",{weight:900}),be(n,c,1500+600/2,1880,34,"#e2e8f0",{weight:900}));for(const g of[1520,2010]){n.fillStyle="#111827",n.fillRect(g,1830,70,140);for(const w of[-170,-110])n.fillStyle="#334155",n.beginPath(),n.arc(g+35,2030+w,20+(u?Math.sin(s*12)*2:0),0,Math.PI*2),n.fill()}if(u&&d==="high")for(let g=0;g<3;g++){n.save(),n.globalAlpha=.12,n.fillStyle=["#f472b6","#22d3ee","#fde047"][g];const w=Math.sin(s*(1+g*.3)+g)*.5;n.translate(1600+g*200,1990),n.rotate(w),n.beginPath(),n.moveTo(0,0),n.lineTo(-50,-320),n.lineTo(50,-320),n.fill(),n.restore()}be(n,"🎪 EVENT STAGE",1500+600/2,1750,30,"#fdba74",{stroke:"#0b1020",weight:900})}function av(n,s,u,c){c==="high"&&bn(n,1525,1095,120,"rgba(251,191,36,0.35)"),n.fillStyle="#1f2937",n.beginPath(),n.moveTo(1497,1215),n.lineTo(1507,1025),n.lineTo(1543,1025),n.lineTo(1553,1215),n.fill(),n.fillStyle="#fbbf24",n.beginPath(),n.moveTo(1507,1025),n.lineTo(1525,990),n.lineTo(1543,1025),n.fill(),u.slice(0,3).forEach((p,_)=>{be(n,`${_+1}. ${p}`,1525,1055+_*34,11,["#fde68a","#e2e8f0","#fdba74"][_],{weight:900,stroke:"#0b1020"})}),be(n,"🏆 HALL OF FAME",1525,965,16,"#fde68a",{stroke:"#0b1020"})}function lv(n,s,u,c){if(n.fillStyle="#1e3a8a",st(n,2046,1120,68,90,8),n.fill(),n.fillStyle="#020617",st(n,2054,1130,52,36,4),n.fill(),be(n,"🎯",2080,1148,20,"#fff"),u>0){const p=Math.abs(Math.sin(s*4))*8;c==="high"&&bn(n,2080,1085-p,50,"rgba(250,204,21,0.6)"),be(n,"!",2080,1085-p,40,"#facc15",{stroke:"#0b1020",weight:900})}be(n,"MISSIONS",2080,1105,14,"#bfdbfe",{stroke:"#0b1020"})}function iv(n,s,u,c){n.fillStyle="#3f2f0c",n.fillRect(2039,1545,92,70),n.fillStyle="#fbbf24",n.beginPath(),n.moveTo(2031,1545),n.lineTo(2085,1515),n.lineTo(2139,1545),n.fill();for(let p=0;p<4;p++)n.fillStyle="#e7e5e4",n.fillRect(2047+p*24,1551,8,60);be(n,"COLLECTION",2085,1497,14,"#fde68a",{stroke:"#0b1020"}),be(n,u+"%",2085,1531,12,"#422006",{weight:900})}function sv(n,s,u,c,d,f){n.fillStyle="#1f2937",n.fillRect(s-3,u-90,6,90),n.fillRect(s-3,u-92,22,5),f==="high"&&bn(n,s+16,u-84,60,d,.45+Math.sin(c*2+s)*.05),n.fillStyle=d,n.beginPath(),n.arc(s+16,u-84,5,0,Math.PI*2),n.fill()}function rv(n,s,u,c,d){n.fillStyle="#3b2a1a",n.fillRect(s-4,u-40,8,40);const f=Math.sin(c+s)*2;for(let p=0;p<3;p++)n.fillStyle=`hsla(${d},70%,${30+p*8}%,0.95)`,n.beginPath(),n.arc(s+f,u-50-p*14,26-p*6,0,Math.PI*2),n.fill()}function ov(n,s,u){const d=s.door==="top"?s.y+_e-22:s.y;if(n.save(),st(n,s.x,s.y,he,_e,22),n.clip(),n.fillStyle=u.wall,n.fillRect(s.x,d,he,22),u.wallPattern==="brick"){n.strokeStyle="rgba(0,0,0,0.35)",n.lineWidth=1;for(let f=0;f<2;f++){n.beginPath(),n.moveTo(s.x,d+f*11),n.lineTo(s.x+he,d+f*11),n.stroke();for(let p=s.x+f%2*14;p<s.x+he;p+=28)n.beginPath(),n.moveTo(p,d+f*11),n.lineTo(p,d+f*11+11),n.stroke()}}else if(u.wallPattern==="glass"){n.fillStyle="rgba(186,230,253,0.25)",n.fillRect(s.x,d,he,22),n.fillStyle="rgba(255,255,255,0.25)";for(let f=s.x;f<s.x+he;f+=60)n.fillRect(f+10,d+3,14,16)}else{n.strokeStyle="rgba(255,255,255,0.08)";for(let f=s.x;f<s.x+he;f+=36)n.beginPath(),n.moveTo(f,d),n.lineTo(f,d+22),n.stroke()}n.fillStyle=u.light==="rainbow"?"#e879f9":u.light,n.globalAlpha=.8,n.fillRect(s.x,s.door==="top"?d:d+22-2,he,2),n.restore()}function uv(n,s,u,c,d,f){const{x:p,y:_}=s;n.fillStyle="rgba(0,0,0,0.35)",st(n,p+6,_+10,he,_e,22),n.fill(),n.fillStyle=u.floor,st(n,p,_,he,_e,22),n.fill(),n.save(),st(n,p,_,he,_e,22),n.clip();const g=u.light==="rainbow"?oa(c,80,60):u.light;if(n.strokeStyle=V(u.floor.startsWith("#")?u.floor:"#131a2e",.12),n.lineWidth=1,u.pattern==="hex")for(let R=_;R<_+_e+30;R+=26)for(let G=p+(R-_)/26%2*15;G<p+he+30;G+=30){n.beginPath();for(let L=0;L<6;L++){const Y=L/6*Math.PI*2;n.lineTo(G+Math.cos(Y)*14,R+Math.sin(Y)*14)}n.closePath(),n.stroke()}else if(u.pattern==="checker"){n.fillStyle="rgba(255,255,255,0.05)";for(let R=_;R<_+_e;R+=40)for(let G=p+(R-_)/40%2*40;G<p+he;G+=80)n.fillRect(G,R,40,40)}else if(u.pattern==="marble"){n.strokeStyle="rgba(255,255,255,0.07)";for(let R=0;R<12;R++)n.beginPath(),n.moveTo(p+R*50,_),n.bezierCurveTo(p+R*50+60,_+120,p+R*50-40,_+260,p+R*50+30,_+_e),n.stroke()}else{for(let R=p;R<p+he;R+=40)n.beginPath(),n.moveTo(R,_),n.lineTo(R,_+_e),n.stroke();for(let R=_;R<_+_e;R+=40)n.beginPath(),n.moveTo(p,R),n.lineTo(p+he,R),n.stroke()}n.restore(),ov(n,s,u),n.strokeStyle=g,n.lineWidth=d?5:3,n.globalAlpha=.9;const w=110;n.beginPath();const v=p+he/2,b=_+_e/2,y=[[p,_],[p+he,_],[p+he,_+_e],[p,_+_e]],N=["top","right","bottom","left"];for(let R=0;R<4;R++){const[G,L]=y[R],[Y,B]=y[(R+1)%4];if(N[R]===s.door)if(L===B){const we=Y>G?1:-1;n.moveTo(G,L),n.lineTo(v-w/2*we,L),n.moveTo(v+w/2*we,L),n.lineTo(Y,B)}else{const we=B>L?1:-1;n.moveTo(G,L),n.lineTo(G,b-w/2*we),n.moveTo(G,b+w/2*we),n.lineTo(Y,B)}else n.moveTo(G,L),n.lineTo(Y,B)}n.stroke(),n.globalAlpha=1}function cv(n,s,u,c,d,f,p,_,g){const w=c*.42,v=c*.16,b=d?it[d].color:"#334155",y=d?it[d].tier:0;n.save(),f==="glass"?n.fillStyle="rgba(148,163,184,0.25)":f==="holo"?n.fillStyle="rgba(34,211,238,0.18)":f==="screen"?n.fillStyle="rgba(30,41,59,0.9)":n.fillStyle="#1e293b",n.beginPath(),n.ellipse(s,u,w,v,0,0,Math.PI*2),n.fill(),n.strokeStyle=_?"rgba(148,163,184,0.25)":y>=3?b:"#475569",n.lineWidth=y>=5?3:2,_&&n.setLineDash([5,5]),n.stroke(),n.setLineDash([]),f==="holo"&&!_&&(n.strokeStyle="rgba(34,211,238,0.6)",n.beginPath(),n.ellipse(s,u-4-Math.sin(p*2)*3,w*.8,v*.8,0,0,Math.PI*2),n.stroke()),n.restore()}function dv(n,s,u,c,d,f){const p=it[d].color,_=c*.46;n.save(),n.fillStyle="#0f172a",n.beginPath(),n.ellipse(s,u+4,_,_*.36,0,0,Math.PI*2),n.fill();const g=n.createLinearGradient(s-_,0,s+_,0);d==="ultra"?(g.addColorStop(0,oa(f)),g.addColorStop(.5,oa(f+1)),g.addColorStop(1,oa(f+2))):d==="secret"?(g.addColorStop(0,"#1e1b4b"),g.addColorStop(.5,"#c084fc"),g.addColorStop(1,"#1e1b4b")):(g.addColorStop(0,V(p,-.3)),g.addColorStop(.5,p),g.addColorStop(1,V(p,-.3))),n.strokeStyle=g,n.lineWidth=4,n.beginPath(),n.ellipse(s,u,_,_*.34,0,0,Math.PI*2),n.stroke(),n.globalAlpha=.25,n.fillStyle=d==="ultra"?oa(f):p;for(let w=0;w<3;w++){const v=f*1.5+w/3*Math.PI*2,b=s+Math.cos(v)*_*.8;n.fillRect(b-1.5,u-c*.9,3,c*.9)}n.restore()}function fv(n,s,u,c,d,f){const p=it[d].tier;if(p<3)return;const _=d==="ultra"?oa(f):d==="secret"?"#c084fc":it[d].color,g=.35+.15*Math.sin(f*2.5+s);bn(n,s,u,c*(.7+p*.06),_,g*(p>=6?1.2:.8))}function mv(n,s,u,c,d){Xy.has(s.kind)?(n.fillStyle="#1e293b",n.fillRect(u-d*.52,c-d*.95,d*1.04,d*.72),n.fillStyle="#0f172a",n.fillRect(u-d*.06,c-d*.25,d*.12,d*.25)):Vy.has(s.kind)?(n.fillStyle="#3f3f46",n.fillRect(u-d*.46,c-d*.2,d*.92,d*.08),n.fillStyle="#27272a",n.fillRect(u-d*.42,c-d*.12,d*.05,d*.14),n.fillRect(u+d*.37,c-d*.12,d*.05,d*.14)):Th.has(s.kind)&&(n.save(),n.strokeStyle="rgba(250,204,21,0.5)",n.lineWidth=2,n.setLineDash([8,6]),n.beginPath(),n.ellipse(u,c-2,d*.62,d*.2,0,0,Math.PI*2),n.stroke(),n.restore())}function id(n,s){return Th.has(n.kind)?s*1.25:n.kind==="gaming_setup"?s*1.1:s*.92}function pv(n,s,u,c,d,f,p,_,g){const w=id(s,d),v=s.rarity,b=it[v].tier,y=b>=6?6+Math.sin(f*2+u*.01)*4:0,N=c-w*.42-y;b>=6&&dv(n,u,c,d,v,f),mv(n,s,u,c,w),p==="high"&&fv(n,u,N,w,v,f);const R=w>90?128:w>45?96:64,G=to(s,R);return n.drawImage(G,u-w/2,N-w/2,w,w),_==="orbit"&&b>=3&&(n.strokeStyle=it[v].color,n.globalAlpha=.6,n.lineWidth=1.5,n.beginPath(),n.ellipse(u,N,w*.55,w*.18,Math.sin(f)*.3,0,Math.PI*2),n.stroke(),n.globalAlpha=1),g&&be(n,"🔥",u+w*.35,N-w*.35,14,"#fff"),{cx:u,cy:N,size:w}}function hv(n,s,u,c,d){const f=(()=>{switch(s.door){case"top":return{x1:s.x+he/2-55,y1:s.y,x2:s.x+he/2+55,y2:s.y};case"bottom":return{x1:s.x+he/2-55,y1:s.y+_e,x2:s.x+he/2+55,y2:s.y+_e};case"left":return{x1:s.x,y1:s.y+_e/2-55,x2:s.x,y2:s.y+_e/2+55};case"right":return{x1:s.x+he,y1:s.y+_e/2-55,x2:s.x+he,y2:s.y+_e/2+55}}})();for(const[p,_]of[[f.x1,f.y1],[f.x2,f.y2]]){n.fillStyle="#334155",n.fillRect(p-7,_-46,14,50);const g=Math.sin(c*6+p)>0;if(n.fillStyle=g?"#ef4444":"#7f1d1d",n.beginPath(),n.arc(p,_-50,5,0,Math.PI*2),n.fill(),u>=2){const w=Math.sin(c+p)*.6;n.save(),n.translate(p,_-36),n.rotate(w),n.fillStyle="#e2e8f0",n.fillRect(0,-4,14,8),n.fillStyle="#0f172a",n.fillRect(12,-2,4,4),n.restore()}}if(u>=3&&(n.strokeStyle="#64748b",n.lineWidth=4,n.beginPath(),n.moveTo(f.x1,f.y1-46),n.lineTo(f.x2,f.y2-46),n.stroke()),u>=4){const p=(Math.sin(c*2)+1)/2,_=f.x1+(f.x2-f.x1)*p,g=f.y1+(f.y2-f.y1)*p;n.strokeStyle="rgba(34,211,238,0.8)",n.lineWidth=3,n.beginPath(),n.moveTo(_,g-44),n.lineTo(_,g),n.stroke()}if(u>=5){n.strokeStyle=`rgba(239,68,68,${.4+.3*Math.sin(c*10)})`,n.lineWidth=1.5;for(let p=1;p<=3;p++)n.beginPath(),n.moveTo(f.x1,f.y1-p*12),n.lineTo(f.x2,f.y2-p*12),n.stroke()}u>=6&&d==="high"&&(n.save(),n.globalAlpha=.1+.04*Math.sin(c*2),n.strokeStyle="#a78bfa",n.lineWidth=2,n.beginPath(),n.ellipse(s.x+he/2,s.y+_e/2,he*.55,_e*.62,0,0,Math.PI*2),n.stroke(),n.fillStyle="#7c3aed",n.fill(),n.restore())}function _v(n,s,u){n.save();const c=s.x+he/2,d=s.y+_e/2;n.globalAlpha=.16+.05*Math.sin(u*3);const f=n.createRadialGradient(c,d,40,c,d,he*.6);f.addColorStop(0,"rgba(59,130,246,0)"),f.addColorStop(1,"rgba(59,130,246,0.9)"),n.fillStyle=f,n.beginPath(),n.ellipse(c,d,he*.58,_e*.62,0,0,Math.PI*2),n.fill(),n.restore()}function gv(n,s,u,c,d,f,p,_){const{x:g,y:w}=ry(s);n.fillStyle="rgba(2,6,23,0.85)",st(n,g-150,w-26,300,56,12),n.fill(),n.strokeStyle=f,n.lineWidth=2,n.stroke(),be(n,(_?"🏠 ":p?"🤖 ":"")+u,g,w-8,20,"#f8fafc",{weight:900}),be(n,`${c}  ·  ${d}`,g,w+14,13,f,{weight:800})}function us(n,s,u,c){const d=s.moving?Math.abs(Math.sin(s.walk*2))*3:Math.sin(u*2)*.8,{x:f,y:p}=s;n.save(),n.fillStyle="rgba(0,0,0,0.35)",n.beginPath(),n.ellipse(f,p,16,6,0,0,Math.PI*2),n.fill();const _=s.moving?Math.sin(s.walk*2)*6:0;n.fillStyle="#1e293b",n.fillRect(f-8+_*.4,p-16,6,16),n.fillRect(f+2-_*.4,p-16,6,16);const g=`hsl(${s.hue},70%,50%)`,w=n.createLinearGradient(f-14,0,f+14,0);w.addColorStop(0,`hsl(${s.hue},70%,62%)`),w.addColorStop(1,`hsl(${s.hue},70%,38%)`),n.fillStyle=w,st(n,f-14,p-44-d,28,32,11),n.fill(),n.fillStyle=g;const v=s.moving?Math.sin(s.walk*2+Math.PI)*5:0;if(st(n,f-19,p-40-d+v,7,18,3),n.fill(),st(n,f+12,p-40-d-v,7,18,3),n.fill(),n.fillStyle="#f1f5f9",n.beginPath(),n.arc(f,p-56-d,13,0,Math.PI*2),n.fill(),n.fillStyle=s.bot?"#f43f5e":"#0f172a",st(n,f-10+s.dir*2,p-60-d,20,8,4),n.fill(),n.fillStyle=s.bot?"#fecdd3":`hsl(${s.hue},90%,70%)`,n.fillRect(f-6+s.dir*4,p-58-d,6,3),s.bot&&(n.strokeStyle="#94a3b8",n.lineWidth=2,n.beginPath(),n.moveTo(f,p-69-d),n.lineTo(f,p-78-d),n.stroke(),n.fillStyle="#f43f5e",n.beginPath(),n.arc(f,p-79-d,3,0,Math.PI*2),n.fill()),s.npcHat&&be(n,s.npcHat,f,p-74-d,18,"#fff"),s.carrying){const b=to(s.carrying,64);n.drawImage(b,f-20,p-110-d,40,40)}if(n.restore(),s.stealing!=null&&(n.strokeStyle="rgba(15,23,42,0.8)",n.lineWidth=6,n.beginPath(),n.arc(f,p-100,16,0,Math.PI*2),n.stroke(),n.strokeStyle="#f43f5e",n.lineWidth=4,n.beginPath(),n.arc(f,p-100,16,-Math.PI/2,-Math.PI/2+Math.PI*2*s.stealing),n.stroke(),be(n,"🥷",f,p-100,14,"#fff")),c){const b=s.name+(s.level?`  ·  Lv${s.level}`:"");n.font="800 13px 'Rajdhani', system-ui, sans-serif";const y=n.measureText(b).width+16,N=p-84-(s.bot?10:0)-(s.npcHat?10:0),R=s.nameplate||"default";n.fillStyle=R==="gold"?"rgba(120,53,15,0.9)":R==="legend"?"rgba(76,29,149,0.9)":"rgba(2,6,23,0.75)",st(n,f-y/2,N-10,y,20,10),n.fill(),(R!=="default"||s.me)&&(n.strokeStyle=R==="gold"?"#fbbf24":R==="legend"?oa(u):R==="neon"?"#22d3ee":"#facc15",n.lineWidth=2,n.stroke()),be(n,b,f,N,13,s.me?"#fde047":"#f8fafc",{weight:800})}s.emote&&(n.fillStyle="rgba(255,255,255,0.95)",st(n,f+10,p-120,40,34,12),n.fill(),be(n,s.emote,f+30,p-103,22,"#000"))}const _t=bh(()=>({prompt:null,hover:null,selected:null,here:null,fade:0})),ih={market:"market",drops:"drops",raid:"raid",trade:"trade",event:"event",leaderboard:"leaderboard",quests:"quests",collection:"collection"},Kc=[{x:1900,y:1030,hat:"🎩",name:"Max the Broker",lines:["Prices move every few seconds.","Buy low, sell to someone else.","Low supply + high demand = 📈"]},{x:2390,y:1600,hat:"📦",name:"Dropmaster Dee",lines:["Feeling lucky?","Secrets are out there…","Event Drops only during events!"]},{x:1190,y:1330,hat:"🕶️",name:"The Fixer",lines:["Everyone has something worth taking.","Security slows you down. Revenge speeds you up.","Check the board."]},{x:1170,y:1745,hat:"🧢",name:"Deal-Maker Dex",lines:["Both sides must confirm.","Fair trades make friends.","NPCs love a premium offer."]},{x:2120,y:2120,hat:"🎤",name:"MC Volt",lines:["Events shake up the market!","Stay tuned for the next event.","Make some noise!"]}],cs=[];for(let n=700;n<2950;n+=280)cs.push([n,555]),cs.push([n,2255]);for(let n=700;n<2200;n+=300)cs.push([610,n]),cs.push([2990,n]);const bv=[[1300,1500,150],[2300,1750,290],[1300,1100,180],[2300,1050,300],[1450,1700,160],[2200,1900,270],[650,2100,150],[2950,2100,300],[650,700,170],[2950,700,280]];class yv{constructor(s){this.raf=0,this.last=0,this.t=0,this.dpr=1,this.vw=0,this.vh=0,this.px=Hn.x,this.py=Hn.y,this.walk=0,this.dir=1,this.moving=!1,this.target=null,this.keys=new Set,this.joy={x:0,y:0},this.stepTimer=0,this.camX=Hn.x,this.camY=Hn.y,this.zoom=1,this.shake=0,this.particles=[],this.walkers=[],this.hits=[],this.plotOwner=new Map,this.ownerPlot=new Map,this.cashTimer=0,this.bubble=null,this.lastSteal=null,this.carrying=null,this.emote=null,this.lastFocus=null,this.lastRaidFx=null,this.lastWorldAt=0,this.unsub=null,this.resize=()=>{const u=this.canvas.getBoundingClientRect();this.dpr=Math.min(window.devicePixelRatio||1,F().settings.quality==="low"?1:2),this.vw=Math.max(1,u.width),this.vh=Math.max(1,u.height),this.canvas.width=Math.round(this.vw*this.dpr),this.canvas.height=Math.round(this.vh*this.dpr);const c=Math.min(this.vw/1250,this.vh/820);this.zoom=Math.max(.42,Math.min(1.05,c*.95))},this.onKey=u=>{if(this.typing(u))return;const c=u.key.toLowerCase();if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].includes(c)){if(F().panel&&c.startsWith("arrow"))return;this.keys.add(c),this.target=null,u.preventDefault()}else(c==="e"||c===" "||c==="enter")&&!F().panel&&(this.interact(),u.preventDefault())},this.onKeyUp=u=>this.keys.delete(u.key.toLowerCase()),this.onBlur=()=>this.keys.clear(),this.onPointerDown=u=>{if(u.pointerType==="mouse"&&u.button!==0)return;const c=this.toWorld(u.clientX,u.clientY),d=this.hitAt(c.x,c.y);if(d){me("click"),_t.setState({selected:{...d,sx:c.sx,sy:c.sy}});return}_t.setState({selected:null});const f=si.find(p=>ln(c.x,c.y,p.trigger)||this.zoneBuildingHit(p.id,c.x,c.y));if(f){this.target={x:f.anchor.x,y:f.anchor.y,zone:f.id};return}this.target={x:c.x,y:c.y},this.burst(c.x,c.y,5,"#67e8f9","spark",.4)},this.onPointerMove=u=>{if(u.pointerType!=="mouse")return;const c=this.toWorld(u.clientX,u.clientY),d=this.hitAt(c.x,c.y),f=_t.getState().hover;if(d)(!f||f.itemId!==d.itemId||Math.abs(f.sx-c.sx)>4||Math.abs(f.sy-c.sy)>4)&&_t.setState({hover:{itemId:d.itemId,ownerName:d.ownerName,sx:c.sx,sy:c.sy}}),this.canvas.style.cursor="pointer";else{f&&_t.setState({hover:null});const p=si.find(_=>ln(c.x,c.y,_.trigger)||this.zoneBuildingHit(_.id,c.x,c.y));this.canvas.style.cursor=p?"pointer":"default"}},this.onWheel=u=>{this.zoom=Math.max(.35,Math.min(1.8,this.zoom*(u.deltaY>0?.92:1.08)))},this.frame=u=>{this.raf=requestAnimationFrame(this.frame);const c=Math.min(.05,(u-(this.last||u))/1e3);this.last=u,this.t+=c;try{this.update(c,u),this.render(u)}catch(d){console.error(d)}},this.canvas=s,this.ctx=s.getContext("2d",{alpha:!1}),this.resize(),window.addEventListener("resize",this.resize),window.addEventListener("keydown",this.onKey),window.addEventListener("keyup",this.onKeyUp),window.addEventListener("blur",this.onBlur),s.addEventListener("pointerdown",this.onPointerDown),s.addEventListener("pointermove",this.onPointerMove),s.addEventListener("pointerleave",()=>_t.setState({hover:null})),s.addEventListener("wheel",this.onWheel,{passive:!0}),this.px=Hn.x,this.py=Hn.y,this.unsub=null,this.raf=requestAnimationFrame(this.frame)}destroy(){cancelAnimationFrame(this.raf),window.removeEventListener("resize",this.resize),window.removeEventListener("keydown",this.onKey),window.removeEventListener("keyup",this.onKeyUp),window.removeEventListener("blur",this.onBlur),this.unsub?.()}setJoystick(s,u){this.joy={x:s,y:u},(s||u)&&(this.target=null)}interact(){const s=_t.getState().prompt;s&&(me("click"),s.kind==="zone"?Te(ih[s.id]):s.mine?Te("base"):Te("visit",{playerId:s.playerId}))}doEmote(s){this.emote={e:s,until:performance.now()+3e3},this.burst(this.px,this.py-80,10,"#fde047")}travelTo(s,u){_t.setState({fade:1}),me("whoosh"),window.setTimeout(()=>{this.px=s,this.py=u,this.camX=s,this.camY=u,this.target=null,_t.setState({fade:0})},180)}travelToZone(s){const u=si.find(c=>c.id===s);u&&this.travelTo(u.anchor.x,u.anchor.y)}travelHome(){this.travelTo(Hn.x,Hn.y)}plotOf(s){return this.ownerPlot.get(s)}typing(s){const u=s.target;return!!u&&(u.tagName==="INPUT"||u.tagName==="TEXTAREA"||u.tagName==="SELECT"||u.isContentEditable)}toWorld(s,u){const c=this.canvas.getBoundingClientRect(),d=s-c.left,f=u-c.top;return{x:(d-this.vw/2)/this.zoom+this.camX,y:(f-this.vh/2)/this.zoom+this.camY,sx:d,sy:f}}hitAt(s,u){for(let c=this.hits.length-1;c>=0;c--){const d=this.hits[c];if(s>=d.x&&s<=d.x+d.w&&u>=d.y&&u<=d.y+d.h)return d}return null}zoneBuildingHit(s,u,c){const f={market:{x:1440,y:680,w:720,h:280},drops:{x:2380,y:1080,w:620,h:280},raid:{x:700,y:1e3,w:460,h:220},trade:{x:720,y:1480,w:420,h:150},event:{x:1500,y:1700,w:600,h:330},leaderboard:{x:1490,y:990,w:70,h:230},quests:{x:2040,y:1110,w:80,h:110},collection:{x:2030,y:1510,w:110,h:110}}[s];return f?ln(u,c,f):!1}burst(s,u,c,d,f="spark",p=1){F().settings.quality==="low"&&(c=Math.ceil(c/3));for(let _=0;_<c;_++){const g=Math.random()*Math.PI*2,w=(40+Math.random()*160)*p;this.particles.push({x:s,y:u,vx:Math.cos(g)*w,vy:Math.sin(g)*w-(f==="confetti"?120:30),life:0,max:.6+Math.random()*.9,color:f==="confetti"?`hsl(${Math.random()*360},90%,60%)`:d,size:f==="confetti"?4+Math.random()*3:2+Math.random()*3,kind:f,rot:Math.random()*6})}}floatText(s,u,c,d){this.particles.push({x:s,y:u,vx:0,vy:-40,life:0,max:1.6,color:d,size:16,kind:"text",text:c})}assignPlots(){const s=F();if(s.worldAt===this.lastWorldAt)return;this.lastWorldAt=s.worldAt;const u=s.me;this.plotOwner.clear(),this.ownerPlot.clear();const c=s.world.find(v=>v.id===u?.id);c&&(this.plotOwner.set(0,c),this.ownerPlot.set(c.id,ra[0]));const d=s.world.filter(v=>v.id!==u?.id),f=d.find(v=>v.username==="RookieRick"),p=d.filter(v=>!v.is_bot),_=d.filter(v=>v.is_bot&&v!==f);[...f?[f]:[],...p,..._].slice(0,ra.length-1).forEach((v,b)=>{this.plotOwner.set(b+1,v),this.ownerPlot.set(v.id,ra[b+1])});const w=new Set(this.walkers.map(v=>v.id));for(const v of _.slice(0,9)){if(w.has(v.id))continue;const b=this.ownerPlot.get(v.id),y=b?ad(b):{x:1800,y:1400};this.walkers.push({id:v.id,name:v.username,hue:fl(v.id),x:y.x,y:y.y,tx:y.x,ty:y.y,speed:70+Math.random()*50,walk:0,dir:1,wait:Math.random()*3,level:v.level})}}collide(s,u){for(const c of ny)if(ln(s,u,c,8))return!0;return!1}update(s,u){const c=F();if(this.assignPlots(),c.focusPlot&&c.focusPlot!==this.lastFocus){this.lastFocus=c.focusPlot;const v=this.ownerPlot.get(c.focusPlot);if(v){const b=ld(v);this.travelTo(b.x,b.y)}window.setTimeout(()=>{pe({focusPlot:null}),this.lastFocus=null},400)}let d=0,f=0;if((this.keys.has("a")||this.keys.has("arrowleft"))&&(d-=1),(this.keys.has("d")||this.keys.has("arrowright"))&&(d+=1),(this.keys.has("w")||this.keys.has("arrowup"))&&(f-=1),(this.keys.has("s")||this.keys.has("arrowdown"))&&(f+=1),(this.joy.x||this.joy.y)&&(d=this.joy.x,f=this.joy.y),!d&&!f&&this.target){const v=this.target.x-this.px,b=this.target.y-this.py,y=Math.hypot(v,b);if(y<10){const N=this.target;this.target=null,N.zone&&Te(ih[N.zone])}else d=v/y,f=b/y}const p=Math.hypot(d,f);if(this.moving=p>.05,this.moving){const v=320*Math.min(1,p),b=d/Math.max(1,p),y=f/Math.max(1,p),N=Math.max(20,Math.min(Zc-20,this.px+b*v*s)),R=Math.max(40,Math.min(Pc-20,this.py+y*v*s));this.collide(N,this.py)?this.target&&(this.target=null):this.px=N,this.collide(this.px,R)?this.target&&(this.target=null):this.py=R,this.walk+=s*6,Math.abs(b)>.1&&(this.dir=b>0?1:-1),this.stepTimer+=s,this.stepTimer>.32&&(this.stepTimer=0,c.settings.quality==="high"&&this.trail())}const _=1-Math.exp(-s*6);this.camX+=(this.px-this.camX)*_,this.camY+=(this.py-40-this.camY)*_,this.shake=Math.max(0,this.shake-s*2),this.updatePrompt();for(const v of this.walkers){if(v.wait>0){v.wait-=s;continue}const b=v.tx-v.x,y=v.ty-v.y,N=Math.hypot(b,y);if(N<8){v.wait=2+Math.random()*5;const R=[...si.map(Y=>Y.anchor),{x:1800+(Math.random()-.5)*300,y:1580}],G=this.ownerPlot.get(v.id);G&&Math.random()<.3&&R.push(ad(G));const L=R[Math.floor(Math.random()*R.length)];v.tx=L.x+(Math.random()-.5)*80,v.ty=L.y+(Math.random()-.5)*40}else v.x+=b/N*v.speed*s,v.y+=y/N*v.speed*s,v.walk+=s*5,v.dir=b>0?1:-1}for(const v of this.particles)v.life+=s,v.x+=v.vx*s,v.y+=v.vy*s,v.kind==="confetti"?v.vy+=260*s:v.kind==="spark"&&(v.vx*=.92,v.vy*=.92);this.particles=this.particles.filter(v=>v.life<v.max),this.cashTimer+=s,this.cashTimer>3&&(this.cashTimer=0,this.incomePops());const g=c.steal;if(g&&g.raidId!==this.lastSteal){this.lastSteal=g.raidId;const v=this.ownerPlot.get(g.defenderId);if(v){const b=this.plotOwner.get(v.index),y=b?.items.find(R=>R.id===g.playerItemId),N=y?Gr(v,b.slots,y.slot):ld(v);this.travelTo(N.x+30,N.y+24)}}if(g?.result&&g.raidId===this.lastSteal&&!g._fx)if(g._fx=!0,g.result.status==="success"){const v=c.itemsById[g.itemId];v&&(this.carrying={item:v,until:u+5e3}),this.burst(this.px,this.py-60,60,"#fde047","confetti"),this.shake=.6}else this.burst(this.px,this.py-40,30,"#94a3b8","smoke",.6),this.shake=.4;const w=c.last?.incoming_raids[0];w&&w.id!==this.lastRaidFx&&(this.lastRaidFx=w.id,this.shake=.8)}trail(){const u=F().me?.cosmetics?.trail;if(!u||u==="trail-none")return;const c=u==="trail-cash"?"#4ade80":u==="trail-glitch"?"#22d3ee":u==="trail-comet"?"#c084fc":"#fde047";u==="trail-cash"?this.particles.push({x:this.px,y:this.py-10,vx:0,vy:-20,life:0,max:.9,color:c,size:12,kind:"text",text:"$"}):this.burst(this.px,this.py-12,4,c,"spark",.3)}incomePops(){const s=F(),u=s.me,c=ra[0];if(!u)return;const d=1+(u.income_bonus||0),f=this.viewRect();if(ln(c.x+he/2,c.y+_e/2,f,300))for(const p of s.myItems){if(p.location!=="display"||p.slot==null)continue;const _=s.itemsById[p.item_id];if(!_)continue;const g=Gr(c,u.slots,p.slot);this.floatText(g.x+(Math.random()-.5)*16,g.y-id(_,g.cell)-6,"+"+We(_.base_income*d*3),"#4ade80")}}updatePrompt(){const s=_t.getState();let u=null,c=null;for(const d of si)if(ln(this.px,this.py,d.trigger)){u={kind:"zone",id:d.id,label:d.label,icon:d.icon};break}if(!u)for(const[d,f]of this.plotOwner){const p=ra[d];if(ln(this.px,this.py,iy(p),10)){const _=d===0;u={kind:"plot",id:f.id,label:_?"MY BASE":`${f.username}'s BASE`,icon:_?"🏠":"🥷",playerId:f.id,mine:_},c={playerId:f.id,name:f.username,mine:_};break}}(u?.id!==s.prompt?.id||c?.playerId!==s.here?.playerId)&&_t.setState({prompt:u,here:c})}viewRect(){const s=this.vw/this.zoom,u=this.vh/this.zoom;return{x:this.camX-s/2,y:this.camY-u/2,w:s,h:u}}theme(s){const u=F().catalog?.cosmetics||[],c=f=>u.find(p=>p.id===f)?.data||{},d=c(s.cosmetics?.theme||"theme-neon");return{floor:d.floor||"#131a2e",wall:d.wall||"#1e293b",wallPattern:c(s.cosmetics?.wall).pattern||"panel",glow:d.glow||"#22d3ee",pattern:c(s.cosmetics?.floor).pattern||"grid",light:c(s.cosmetics?.lighting).color||d.glow||"#22d3ee",platform:c(s.cosmetics?.platform).style||"basic"}}render(s){const u=this.ctx,c=F(),d=c.settings.quality,f=c.settings.reduceMotion?this.t*.25:this.t;u.setTransform(this.dpr,0,0,this.dpr,0,0),u.fillStyle="#070b16",u.fillRect(0,0,this.vw,this.vh);const p=c.settings.reduceMotion?0:this.shake*8,_=(Math.random()-.5)*p,g=(Math.random()-.5)*p;u.setTransform(this.dpr*this.zoom,0,0,this.dpr*this.zoom,this.dpr*(this.vw/2-this.camX*this.zoom+_),this.dpr*(this.vh/2-this.camY*this.zoom+g));const w=this.viewRect();Qy(u,w,f,d),Zy(u,f),Py(u,f);const v=c.last?.event||null,b=this.machines();Wy(u,f),this.hits=[];const y=[],N=c.me,R=Date.now();for(const[D,P]of this.plotOwner){const J=ra[D];if(!ln(J.x+he/2,J.y+_e/2,w,he))continue;const Z=D===0,Se=this.theme(P);uv(u,J,Se,f,Z);const te=Z&&N?this.myDisplayed():P.items,X=Z&&N?N.slots:P.slots,se=new Map(te.map(ot=>[ot.slot,ot])),oe=c.catalog?.cosmetics.find(ot=>ot.id===P.cosmetics?.item_fx)?.data.style||"";for(let ot=0;ot<X;ot++){const ct=Gr(J,X,ot),S=se.get(ot),$=S?c.itemsById[S.item_id]:void 0;if(cv(u,ct.x,ct.y,ct.cell,$?$.rarity:null,Se.platform,f,!$),$&&S){const ne=!!S.under_raid||Z&&c.last?.incoming_raids.some(xe=>xe.player_item_id===S.id),ae=!!S.hot_until&&Ye(S.hot_until)>R;y.push({y:ct.y,draw:()=>{const xe=pv(u,$,ct.x,ct.y,ct.cell,f,d,oe,ae);ne&&(u.strokeStyle=`rgba(239,68,68,${.6+.4*Math.sin(f*12)})`,u.lineWidth=3,u.strokeRect(xe.cx-xe.size/2,xe.cy-xe.size/2,xe.size,xe.size))}});const ke=id($,ct.cell);this.hits.push({x:ct.x-ke/2,y:ct.y-ke*.92,w:ke,h:ke*.95,playerItemId:S.id,itemId:$.id,ownerId:P.id,ownerName:P.username,mine:Z})}}y.push({y:J.door==="top"?J.y+_e-20:J.y+20,draw:()=>gv(u,J,P.username,We(Z&&N?N.base_value:P.base_value),`SEC ${Z&&N?N.security_level:P.security_level}`,Se.light==="rainbow"?"#e879f9":Se.light,P.is_bot,Z)});const Ge=Z&&N?N.security_level:P.security_level,$e=J.door==="bottom"?J.y+_e:J.door==="top"?J.y:J.y+_e/2+55;y.push({y:$e,draw:()=>hv(u,J,Ge,f,d)});const zt=Z&&N?N.shield_until:P.shield_until;if(zt&&Ye(zt)>R&&y.push({y:J.y+_e+1,draw:()=>{_v(u,J,f),be(u,"🛡️ SHIELDED "+xt(Ye(zt)-Date.now()),J.x+he/2,J.door==="top"?J.y+18:J.y+_e-16,14,"#bfdbfe",{stroke:"#0b1020"})}}),!Z&&P.protected&&y.push({y:J.y+_e+2,draw:()=>be(u,"🐣 NEW PLAYER — PROTECTED",J.x+he/2,J.door==="top"?J.y+36:J.y+_e-16,13,"#fde68a",{stroke:"#0b1020"})}),Z&&N){const ot=c.myItems.filter(ct=>ct.location==="vault").length;y.push({y:J.y+_e-30,draw:()=>{u.fillStyle="#334155",u.fillRect(J.x+he-70,J.y+_e-70,50,44),u.fillStyle="#94a3b8",u.beginPath(),u.arc(J.x+he-45,J.y+_e-48,12,0,Math.PI*2),u.fill(),be(u,`🔒 ${ot}/${N.vault_capacity}`,J.x+he-45,J.y+_e-82,12,"#e2e8f0",{stroke:"#0b1020"})}})}}const G=this.ticker();y.push({y:950,draw:()=>Jy(u,f,G,d)}),b.forEach((D,P)=>{const J=2440+P*100;y.push({y:1330,draw:()=>Fy(u,D,J,1330,f,d)})});const L=this.boardTargets();y.push({y:1220,draw:()=>ev(u,f,L,d)}),y.push({y:1630,draw:()=>tv(u,f,d)});const Y=v?{title:v.title,icon:v.icon,left:xt(Ye(v.ends_at)-Date.now())}:null,B=c.last?.next_event_at?xt(Ye(c.last.next_event_at)-Date.now()):"—";y.push({y:2030,draw:()=>nv(u,f,Y,B,d)});const we=[...c.world].sort((D,P)=>P.base_value-D.base_value).map(D=>D.username);y.push({y:1215,draw:()=>av(u,f,we,d)}),y.push({y:1210,draw:()=>lv(u,f,c.last?.quests_claimable||0,d)});const je=c.catalog?c.catalog.items.filter(D=>D.droppable||D.event_only).length:1;y.push({y:1615,draw:()=>iv(u,f,Math.round((N?.collection_count||0)/je*100))});const H=c.itemsById["quantum-120-void-oled"];y.push({y:1400,draw:()=>Ky(u,f,H,d)});for(const[D,P]of cs)ln(D,P,w,100)&&y.push({y:P,draw:()=>sv(u,D,P,f,"#fde68a",d)});for(const[D,P,J]of bv)ln(D,P,w,100)&&y.push({y:P,draw:()=>rv(u,D,P,f,J)});if((!this.bubble||s>this.bubble.until)&&Math.random()<.004){const D=Math.floor(Math.random()*Kc.length),P=Kc[D].lines;this.bubble={i:D,line:P[Math.floor(Math.random()*P.length)],until:s+4e3}}Kc.forEach((D,P)=>{ln(D.x,D.y,w,100)&&y.push({y:D.y,draw:()=>{us(u,{x:D.x,y:D.y,hue:40+P*60,dir:-1,walk:0,moving:!1,name:D.name,npcHat:D.hat},f,c.settings.showNames),this.bubble&&this.bubble.i===P&&s<this.bubble.until&&this.speech(D.x,D.y-110,this.bubble.line)}})});for(const D of this.walkers)ln(D.x,D.y,w,80)&&y.push({y:D.y,draw:()=>us(u,{x:D.x,y:D.y,hue:D.hue,dir:D.dir,walk:D.walk,moving:D.wait<=0,name:D.name,level:D.level,bot:!0},f,c.settings.showNames)});const ce=c.backend;if(ce?.presence&&N){ce.presence.update({id:N.id,name:N.username,x:Math.round(this.px),y:Math.round(this.py),dir:this.dir,moving:this.moving,emote:this.emote&&s<this.emote.until?this.emote.e:null,trail:N.cosmetics?.trail});for(const D of ce.presence.peers())ln(D.x,D.y,w,80)&&y.push({y:D.y,draw:()=>us(u,{x:D.x,y:D.y,hue:fl(D.id),dir:D.dir,walk:this.t*5,moving:D.moving,name:D.name,emote:D.emote},f,c.settings.showNames)})}const Q=c.last?.incoming_raids[0];if(Q){const D=ra[0],P=c.myItems.find(J=>J.id===Q.player_item_id);if(P&&P.slot!=null&&N){const J=Gr(D,N.slots,P.slot),Z=Ye(Q.started_at),Se=Ye(Q.ends_at),te=Math.max(0,Math.min(1,(Date.now()-Z)/Math.max(1,Se-Z)));y.push({y:J.y+20,draw:()=>{bn(u,J.x,J.y-30,120,"rgba(239,68,68,0.5)",.6+.3*Math.sin(f*10)),us(u,{x:J.x-34,y:J.y+20,hue:fl(Q.attacker_id),dir:1,walk:this.t*8,moving:!1,name:Q.attacker,bot:Q.attacker_bot,stealing:te},f,!0)}})}}const ue=c.steal,et=ue&&!ue.result?Math.max(0,Math.min(1,(Date.now()-ue.startedAt)/Math.max(1,ue.endsAt-ue.startedAt))):null;if(this.carrying&&s>this.carrying.until&&(this.carrying=null),N){const D=c.catalog?.cosmetics.find(P=>P.id===N.cosmetics?.nameplate)?.data.style;y.push({y:this.py,draw:()=>us(u,{x:this.px,y:this.py,hue:fl(N.id),dir:this.dir,walk:this.walk,moving:this.moving,name:N.username,level:N.level,nameplate:D,emote:this.emote&&s<this.emote.until?this.emote.e:null,carrying:this.carrying?.item,stealing:et,me:!0},f,!0)})}y.sort((D,P)=>D.y-P.y);for(const D of y)D.draw();this.target&&(u.strokeStyle="rgba(103,232,249,0.8)",u.lineWidth=2,u.beginPath(),u.ellipse(this.target.x,this.target.y,14+Math.sin(f*6)*3,6,0,0,Math.PI*2),u.stroke());for(const D of this.particles){const P=1-D.life/D.max;u.globalAlpha=Math.max(0,P),D.kind==="text"?be(u,D.text||"",D.x,D.y,D.size,D.color,{stroke:"#052e16",weight:900}):D.kind==="confetti"?(u.fillStyle=D.color,u.save(),u.translate(D.x,D.y),u.rotate((D.rot||0)+D.life*8),u.fillRect(-D.size/2,-D.size/4,D.size,D.size/2),u.restore()):D.kind==="smoke"?(u.fillStyle=D.color,u.beginPath(),u.arc(D.x,D.y,D.size*(1+D.life*4),0,Math.PI*2),u.fill()):(u.fillStyle=D.color,u.fillRect(D.x-D.size/2,D.y-D.size/2,D.size,D.size))}if(u.globalAlpha=1,u.setTransform(this.dpr,0,0,this.dpr,0,0),d==="high"){const D=u.createRadialGradient(this.vw/2,this.vh/2,Math.min(this.vw,this.vh)*.35,this.vw/2,this.vh/2,Math.max(this.vw,this.vh)*.75);D.addColorStop(0,"rgba(0,0,0,0)"),D.addColorStop(1,"rgba(0,0,0,0.55)"),u.fillStyle=D,u.fillRect(0,0,this.vw,this.vh)}Q&&(u.fillStyle=`rgba(220,38,38,${.08+.08*Math.sin(this.t*8)})`,u.fillRect(0,0,this.vw,this.vh)),this.minimap(u)}speech(s,u,c){const d=this.ctx;d.font="700 14px 'Rajdhani', system-ui, sans-serif";const f=d.measureText(c).width+20;d.fillStyle="rgba(255,255,255,0.95)",d.beginPath(),d.roundRect?.(s-f/2,u-16,f,30,10),d.roundRect||d.rect(s-f/2,u-16,f,30),d.fill(),be(d,c,s,u-1,14,"#0f172a",{weight:700})}myDisplayed(){return F().myItems.filter(s=>s.location==="display"&&s.slot!=null)}machines(){const s=F(),u=s.catalog?.drops||[],c=s.me;return u.map(d=>({id:d.id,name:d.name,price:We(d.price),locked:!c||c.level<d.min_level||d.event_only&&!s.last?.event||d.requires_key&&(c.secret_keys||0)<1,tokens:c?.drop_tokens?.[d.id]||0}))}ticker(){const s=F();return Object.values(s.market).filter(c=>{const d=s.itemsById[c.item_id];return d&&it[d.rarity].tier>=4}).sort((c,d)=>Math.abs(d.change_24h)-Math.abs(c.change_24h)).slice(0,10).map(c=>({name:s.itemsById[c.item_id]?.name||c.item_id,change:c.change_24h,price:We(c.price)}))}boardTargets(){const s=F();return[...s.world].filter(u=>u.id!==s.me?.id).sort((u,c)=>c.base_value-u.base_value).slice(0,4).map(u=>({name:u.username,value:We(u.base_value),sec:u.security_level,bot:u.is_bot}))}minimap(s){if(this.vw<700)return;const u=170,c=u*Pc/Zc,d=this.vw-u-16,f=this.vh-c-96,p=u/Zc,_=c/Pc;s.fillStyle="rgba(2,6,23,0.75)",s.fillRect(d-4,f-4,u+8,c+8),s.strokeStyle="rgba(56,189,248,0.4)",s.strokeRect(d-4,f-4,u+8,c+8);for(const[w,v]of this.plotOwner){const b=ra[w];s.fillStyle=w===0?"#facc15":v.is_bot?"#475569":"#38bdf8",s.fillRect(d+b.x*p,f+b.y*_,he*p,_e*_)}for(const w of si)s.fillStyle="#e879f9",s.fillRect(d+w.anchor.x*p-2,f+w.anchor.y*_-2,4,4);s.fillStyle="#ffffff",s.beginPath(),s.arc(d+this.px*p,f+this.py*_,3.5,0,Math.PI*2),s.fill();const g=this.viewRect();s.strokeStyle="rgba(255,255,255,0.5)",s.strokeRect(d+g.x*p,f+g.y*_,g.w*p,g.h*_)}}let La=null;function sh(n){La=n}const vv=`-- ============================================================================
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
`,xv=`-- ============================================================================
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
  ('w_mythic', 'weekly', 'Find a Mythic', 'find_mythic', 1, '{"cash":250000,"income_secs":1800,"xp":2000,"secret_keys":1}'::jsonb, 6),
  ('w_trades20', 'weekly', 'Complete 20 trades (direct or market)', 'complete_trades', 20, '{"cash":150000,"income_secs":1800,"xp":1500,"tokens":{"elite":1}}'::jsonb, 7),
  ('w_tvs10', 'weekly', 'Collect 10 different TVs', 'collect_tvs', 10, '{"cash":100000,"income_secs":1200,"xp":1200,"tokens":{"premium":2},"cosmetic":"plat-screenwall"}'::jsonb, 8)
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
  ('streak_7', 'Seven Day Streak', 'Claim 7 daily rewards in a row', '📅', 500, 25000, 28)
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
`,wv=`-- ============================================================================
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
`,jv=`-- ============================================================================
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
`,Sv=`-- ============================================================================
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
`,Tv=`-- ============================================================================
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
`,rh=Object.assign({"../../../supabase/migrations/20260922000001_schema.sql":vv,"../../../supabase/migrations/20260922000002_catalog.sql":xv,"../../../supabase/migrations/20260922000003_engine.sql":wv,"../../../supabase/migrations/20260922000004_world.sql":jv,"../../../supabase/migrations/20260922000005_api.sql":Sv}),Nv="idb://steal-the-tech",Jc="stt.offline.uid";function kv(n){let s=3735928559^n.length,u=1103547991^n.length;for(let c=0;c<n.length;c++){const d=n.charCodeAt(c);s=Math.imul(s^d,2654435761),u=Math.imul(u^d,1597334677)}return s=Math.imul(s^s>>>16,2246822507)^Math.imul(u^u>>>13,3266489909),u=Math.imul(u^u>>>16,2246822507)^Math.imul(s^s>>>13,3266489909),(4294967296*(2097151&u)+(s>>>0)).toString(36)}function Ev(){if(crypto.randomUUID)return crypto.randomUUID();const n=crypto.getRandomValues(new Uint8Array(16));n[6]=n[6]&15|64,n[8]=n[8]&63|128;const s=[...n].map(u=>u.toString(16).padStart(2,"0")).join("");return`${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`}function Av(n){try{return localStorage.getItem(n)}catch{return null}}function oh(n,s){try{s===null?localStorage.removeItem(n):localStorage.setItem(n,s)}catch{}}class Cv{constructor(s){this.pgliteUrl=s,this.mode="offline",this.label="Offline practice (this device)",this.worker=null,this.seq=0,this.pending=new Map,this.uid=Av(Jc)}send(s){const u=++this.seq;return new Promise((c,d)=>{this.pending.set(u,{resolve:c,reject:d}),this.worker.postMessage({...s,id:u})})}async init(s){this.progress=s,this.worker=new Worker(new URL(""+new URL("pglite.worker-a8GxeoxG.js",import.meta.url).href,import.meta.url),{type:"module"}),this.worker.onmessage=d=>{const f=d.data;if(f.type==="progress"){this.progress?.(f.msg,f.pct);return}const p=this.pending.get(f.id);p&&(this.pending.delete(f.id),f.ok?p.resolve(f.data):p.reject(new Error(f.error)))},this.worker.onerror=d=>{for(const f of this.pending.values())f.reject(new Error(d.message||"Engine crashed"));this.pending.clear()};const u=[{name:"local runtime",sql:Tv},...Object.keys(rh).sort().map(d=>({name:d.split("/").pop().replace(/^\d+_/,"").replace(".sql",""),sql:rh[d]}))],c=kv(u.map(d=>d.sql).join(`
`));await this.send({type:"init",url:this.pgliteUrl,files:u,hash:c,dataDir:Nv})}userId(){return this.uid}isGuest(){return!0}email(){return null}async signInGuest(){this.uid||(this.uid=Ev(),oh(Jc,this.uid))}async signOut(){}rpc(s,u={}){return this.uid?this.send({type:"rpc",uid:this.uid,fn:s,p:u}):Promise.reject(new Error("You need to be signed in to play."))}async reset(){try{await this.send({type:"close"})}catch{}this.worker?.terminate(),this.worker=null,oh(Jc,null);const s=new Set(["/pglite/steal-the-tech","steal-the-tech"]);try{const u=await indexedDB.databases?.()||[];for(const c of u)c.name&&c.name.includes("steal-the-tech")&&s.add(c.name)}catch{}await Promise.all([...s].map(u=>new Promise(c=>{const d=indexedDB.deleteDatabase(u);d.onsuccess=d.onerror=d.onblocked=()=>c()})))}}const Ov="modulepreload",Rv=function(n,s){return new URL(n,s).href},uh={},Mv=function(s,u,c){let d=Promise.resolve();if(u&&u.length>0){let w=function(v){return Promise.all(v.map(b=>Promise.resolve(b).then(y=>({status:"fulfilled",value:y}),y=>({status:"rejected",reason:y}))))};const p=document.getElementsByTagName("link"),_=document.querySelector("meta[property=csp-nonce]"),g=_?.nonce||_?.getAttribute("nonce");d=w(u.map(v=>{if(v=Rv(v,c),v in uh)return;uh[v]=!0;const b=v.endsWith(".css"),y=b?'[rel="stylesheet"]':"";if(c)for(let R=p.length-1;R>=0;R--){const G=p[R];if(G.href===v&&(!b||G.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${v}"]${y}`))return;const N=document.createElement("link");if(N.rel=b?"stylesheet":Ov,b||(N.as="script"),N.crossOrigin="",N.href=v,g&&N.setAttribute("nonce",g),document.head.appendChild(N),b)return new Promise((R,G)=>{N.addEventListener("load",R),N.addEventListener("error",()=>G(new Error(`Unable to preload CSS for ${v}`)))})}))}function f(p){const _=new Event("vite:preloadError",{cancelable:!0});if(_.payload=p,window.dispatchEvent(_),!_.defaultPrevented)throw p}return d.then(p=>{for(const _ of p||[])_.status==="rejected"&&f(_.reason);return s().catch(f)})};class zv{constructor(s,u){this.url=s,this.anonKey=u,this.mode="online",this.label="Online",this.uid=null,this.guest=!0,this.mail=null,this.feed=null,this.world=null,this.pushSubs=new Set,this.peerMap=new Map,this.lastSent=0,this.presence={start:c=>{this.world||!this.uid||(this.world=this.sb.channel("stt-world",{config:{broadcast:{self:!1}}}),this.world.on("broadcast",{event:"pos"},({payload:d})=>{const f=d;!f?.id||f.id===this.uid||this.peerMap.set(f.id,{...f,t:Date.now()})}).on("broadcast",{event:"bye"},({payload:d})=>{this.peerMap.delete(d.id)}).subscribe(d=>{d==="SUBSCRIBED"&&this.presence.update(c)}))},update:c=>{if(!this.world)return;const d=Date.now();d-this.lastSent<180||(this.lastSent=d,this.world.send({type:"broadcast",event:"pos",payload:{...c,t:d}}))},peers:()=>{const c=Date.now();for(const[d,f]of this.peerMap)c-f.t>8e3&&this.peerMap.delete(d);return[...this.peerMap.values()]},stop:()=>{this.world&&(this.world.send({type:"broadcast",event:"bye",payload:{id:this.uid}}),this.sb.removeChannel(this.world),this.world=null,this.peerMap.clear())}}}async init(s){s?.("Connecting to the Tech City servers…",20);const{createClient:u}=await Mv(async()=>{const{createClient:d}=await import("./index-Chk-qjf_.js");return{createClient:d}},[],import.meta.url);this.sb=u(this.url,this.anonKey,{auth:{persistSession:!0,autoRefreshToken:!0,storageKey:"stt.supabase.auth"},realtime:{params:{eventsPerSecond:20}}});const{data:c}=await this.sb.auth.getSession();this.applySession(c.session),this.sb.auth.onAuthStateChange((d,f)=>{const p=this.uid;this.applySession(f),p!==this.uid&&this.subscribeFeed()}),this.subscribeFeed(),s?.("Connected",90)}applySession(s){this.uid=s?.user?.id??null,this.guest=!!s?.user?.is_anonymous,this.mail=s?.user?.email??null}subscribeFeed(){this.feed&&this.sb.removeChannel(this.feed),this.feed=null,this.uid&&(this.feed=this.sb.channel("stt-feed-"+this.uid).on("postgres_changes",{event:"INSERT",schema:"game",table:"server_events"},s=>{const u=s.new||{};for(const c of this.pushSubs)c(u)}).subscribe())}userId(){return this.uid}isGuest(){return this.guest}email(){return this.mail}async signInGuest(){if(this.uid)return;const{error:s}=await this.sb.auth.signInAnonymously();if(s)throw new Error(/anonymous/i.test(s.message)?"Guest play is disabled on this server — sign in with email instead.":s.message)}async signInEmail(s,u,c){const{error:d}=c?await this.sb.auth.signUp({email:s,password:u}):await this.sb.auth.signInWithPassword({email:s,password:u});if(d)throw new Error(d.message);const{data:f}=await this.sb.auth.getSession();if(this.applySession(f.session),!this.uid)throw new Error("Check your inbox to confirm your email, then sign in.")}async upgradeGuest(s,u){const{error:c}=await this.sb.auth.updateUser({email:s,password:u});if(c)throw new Error(c.message)}async signOut(){this.presence.stop(),await this.sb.auth.signOut(),this.uid=null}async rpc(s,u={}){const{data:c,error:d}=await this.sb.rpc(s,{p:u});if(d)throw new Error(d.message);return c}onPush(s){return this.pushSubs.add(s),()=>this.pushSubs.delete(s)}}const qv="0.5.8";function kh(){const n=window.STT_CONFIG||{};return{supabaseUrl:(n.supabaseUrl||void 0||"").trim(),supabaseAnonKey:(n.supabaseAnonKey||void 0||"").trim(),pgliteUrl:(n.pgliteUrl||`https://cdn.jsdelivr.net/npm/@electric-sql/pglite@${qv}/dist/index.js`).trim()}}function Eh(){const n=kh();return!!(n.supabaseUrl&&n.supabaseAnonKey)}function Dv(n){const s=kh();if(n==="online"){if(!Eh())throw new Error("Online servers are not configured.");return new zv(s.supabaseUrl,s.supabaseAnonKey)}return new Cv(s.pgliteUrl)}let Qr=null,Zr=null,Pr=null,Wc=!1,Fc=!1,sd=null,ch=null;async function $v(n){const s=F().settings;wh(s.volume),jh(s.muted),Sh(s.music),pe({phase:"loading",loadingMsg:"Starting…",loadingPct:2,fatal:null});let u;try{u=Dv(n),pe({backend:u}),await u.init((c,d)=>pe({loadingMsg:c,loadingPct:d}))}catch(c){const d=String(c?.message||c);pe({phase:"error",fatal:n==="offline"?`Couldn't start the offline game engine. ${d}. Check your connection (the engine downloads once from cdn.jsdelivr.net) and reload.`:`Couldn't reach the online servers: ${d}`});return}if(n==="offline"&&await u.signInGuest(),!u.userId()){pe({phase:"auth"});return}await Ah()}async function Ah(){const n=F().backend;pe({phase:"loading",loadingMsg:"Loading the catalog…",loadingPct:96});try{const s=await n.rpc("stt_catalog"),u=Object.fromEntries(s.items.map(d=>[d.id,d]));pe({catalog:s,itemsById:u});const c=await n.rpc("stt_sync",{since:-1,items_rev:-1});if(c.needs_join){pe({phase:"join"});return}md(c,!0),await Promise.all([di(),wt()]),Ch()}catch(s){pe({phase:"error",fatal:String(s?.message||s)})}}async function Uv(n){const u=await F().backend.rpc("stt_join",{username:n});md(u,!0),await Promise.all([di(),wt()]),Ch()}function Ch(){pe({phase:"playing"});const n=F().me;n.tutorial_step<99&&pe({tutorialOpen:!0}),Rh();const s=F().backend,u=s.mode==="online";Qr=window.setInterval(()=>ui(),u?3e3:2e3),Zr=window.setInterval(()=>wt(),12e3),Pr=window.setInterval(()=>di(),15e3),s.onPush&&(sd=s.onPush(c=>{c.target_id&&c.target_id===F().me?.id&&ui()})),s.presence&&s.presence.start({id:n.id,name:n.username,x:Hn.x,y:Hn.y,dir:1,moving:!1,trail:n.cosmetics?.trail}),document.addEventListener("visibilitychange",Oh)}function Oh(){document.visibilityState==="visible"&&(ui(),wt())}function Rh(){Qr&&clearInterval(Qr),Zr&&clearInterval(Zr),Pr&&clearInterval(Pr),Qr=Zr=Pr=null,sd?.(),sd=null,document.removeEventListener("visibilitychange",Oh)}async function Lv(){Rh();const n=F().backend;n?.presence?.stop(),await n?.signOut().catch(()=>{}),pe({phase:"title",backend:null,me:null,last:null,myItems:[],feed:[],feedSince:-1,panel:null})}async function ui(){const n=F().backend;if(!(!n||!n.userId())){if(Wc){Fc=!0;return}Wc=!0;try{const{feedSince:s,me:u}=F(),c=await n.rpc("stt_sync",{since:s,items_rev:u?.items_rev??-1});c.needs_join||md(c,!1)}catch(s){console.warn("sync failed",s)}finally{Wc=!1,Fc&&(Fc=!1,ui())}}}function md(n,s){const u=F().me,c=n.server_time-Date.now(),d={last:n,me:n.me,syncedAt:Date.now(),serverOffset:c};if(n.items&&(d.myItems=n.items),n.feed.length){const _=n.feed[n.feed.length-1].id;d.feedSince=Math.max(F().feedSince,_),d.feed=[...F().feed,...n.feed.filter(g=>g.id>F().feedSince)].slice(-120)}else s&&(d.feedSince=0);if(pe(d),!s&&u)for(const _ of n.feed)Hv(_);const f=n.incoming_raids[0];f&&f.id!==ch&&(ch=f.id,me("alarm"),navigator.vibrate&&navigator.vibrate([200,100,200,100,400]));const p=F().steal;p&&n.outgoing_raid&&n.outgoing_raid.id===p.raidId&&n.outgoing_raid.defended&&!p.defended&&(pe({steal:{...p,defended:!0}}),me("alarm"))}async function di(){const n=F().backend;if(n)try{const s=await n.rpc("stt_market");pe({market:Object.fromEntries(s.items.map(u=>[u.item_id,u])),marketAt:Date.now()})}catch(s){console.warn("market failed",s)}}async function wt(){const n=F().backend;if(n)try{const s=await n.rpc("stt_world");pe({world:s.players,worldAt:Date.now()})}catch(s){console.warn("world failed",s)}}const ed=n=>n&&rt(n)?.name||"an item";function Hv(n){const s=F().me,u=n.payload||{},c=n.target_id&&s&&n.target_id===s.id,d=n.actor_id&&s&&n.actor_id===s.id;switch(n.kind){case"secret_found":pe({bigReveal:n}),dd("secret");break;case"big_pull":d||Me({kind:"epic",icon:"🌈",itemId:u.item_id,title:`${u.player} pulled ${it[u.rarity]?.label??""} ${u.item}!`,body:u.serial?`Serial #${u.serial}/${u.max_supply}`:void 0});break;case"steal":!d&&n.target_id===null&&Me({kind:"info",icon:"🔥",itemId:u.item_id,title:`${u.attacker} stole ${u.item}`,body:`from ${u.defender}${u.revenge?" — REVENGE!":""}`});break;case"raid_alert":Me({kind:"bad",icon:"🚨",itemId:u.item_id,title:"RAID ALERT",body:`Someone is attempting to steal ${u.defender}'s ${String(u.rarity).toUpperCase()} ${u.item}!`});break;case"market_alert":Me({kind:u.direction==="up"?"good":"bad",icon:u.direction==="up"?"🔥":"📉",itemId:u.item_id,title:"MARKET ALERT",body:`${u.item} is ${u.direction==="up"?"suddenly trending":"crashing"} (${u.change>0?"+":""}${u.change}% in 1h)`,action:{label:"VIEW",run:()=>Te("market",{item:u.item_id})}});break;case"supply_alert":Me({kind:"epic",icon:"⚠️",itemId:u.item_id,title:u.remaining===0?`${u.item} SOLD OUT`:`ONLY ${u.remaining} LEFT`,body:`${u.item} — supply ${u.max_supply-u.remaining}/${u.max_supply}`});break;case"event_start":me("levelup"),Me({kind:"epic",icon:u.icon,title:`${u.title} IS LIVE`,body:u.description,ttl:8e3,action:{label:"EVENT DROP",run:()=>Te("drops")}});break;case"event_end":Me({kind:"info",icon:u.icon,title:`${u.title} has ended`});break;case"raid_warning":break;case"item_stolen":c&&(me("steal_fail"),Me({kind:"bad",icon:"🚨",itemId:u.item_id,title:"ITEM STOLEN",body:`${u.attacker} stole your ${String(u.rarity||"").toUpperCase()} ${u.item||ed(u.item_id)}.`,ttl:9e3,action:{label:"REVENGE",run:()=>Te("visit",{playerId:u.attacker_id,revenge:!0})}}));break;case"raid_over":if(c){const f=u.status==="blocked";me("defend"),Me({kind:"good",icon:"🛡️",itemId:u.item_id,title:f?"THEFT BLOCKED":"RAID STOPPED",body:f?`${u.attacker} left empty-handed — your ${ed(u.item_id)} is safe.`:`${u.attacker} got caught${u.fine?` and paid you a ${ie(u.fine)} bounty`:""}.`})}break;case"raid_result":{const f=F().steal;c&&(!f||f.raidId!==u.raid_id)&&Me({kind:u.status==="success"?"good":"bad",icon:u.status==="success"?"🔥":"🚨",itemId:u.item_id,title:u.status==="success"?"ITEM STOLEN!":"RAID FAILED",body:u.status==="success"?`You got ${ed(u.item_id)} from ${u.defender}.`:u.note||""});break}case"raid_defended":break;case"trade_offer":c&&(me("notify"),Me({kind:"info",icon:"📨",title:`Trade offer from ${u.from}`,body:`They offer ${ie(u.offer_value)} in value for ${ie(u.request_value)}.`,ttl:8e3,action:{label:"VIEW",run:()=>Te("trade",{tab:"incoming"})}}));break;case"trade_declined":c&&Me({kind:"bad",icon:"🙅",title:`${u.by} declined your offer`,body:u.note||void 0,ttl:8e3});break;case"trade_failed":c&&Me({kind:"bad",icon:"⚠️",title:"Trade failed",body:u.reason});break;case"trade_done":c&&(me("trade"),Me({kind:"good",icon:"🤝",title:`Trade complete with ${u.with}`}));break;case"listing_sold":c&&(me("cash"),Me({kind:"good",icon:"💰",itemId:u.item_id,title:"SOLD!",body:`${u.buyer} bought your ${u.item} for ${ie(u.price)} (fee ${ie(u.fee)}).`}));break;case"achievement":c&&(me("levelup"),Me({kind:"epic",icon:u.icon,title:`Achievement: ${u.title}`,body:[u.cash?`+${ie(u.cash)}`:"",u.xp?`+${u.xp} XP`:""].filter(Boolean).join("  "),ttl:6e3}));break;case"level_up":c&&(me("levelup"),pe({levelUp:{level:u.level,title:u.title,cash:u.cash}}));break;case"prestige":d||Me({kind:"epic",icon:"✨",title:`${u.player} reached PRESTIGE ${u.prestige}`});break;case"big_trade":Me({kind:"info",icon:"🤝",title:"MEGA TRADE",body:`${u.a} ⇄ ${u.b} — ${ie(u.value)} changed hands`});break;case"big_sale":d||Me({kind:"info",icon:"💸",itemId:u.item_id,title:`${u.buyer} bought ${u.item}`,body:`for ${ie(u.price)} from ${u.seller}`});break}}function Mh(n){const s=n.payload||{};switch(n.kind){case"secret_found":return{icon:"🕳️",text:`${s.player} found the SECRET ${s.item}!`,tone:"secret"};case"big_pull":return{icon:"🌈",text:`${s.player} pulled ${String(s.rarity).toUpperCase()} ${s.item}${s.serial?` #${s.serial}`:""}`,tone:String(s.rarity)};case"steal":return{icon:"🔥",text:`${s.attacker} stole ${s.item} from ${s.defender}${s.revenge?" (revenge!)":""}`,tone:"bad"};case"raid_alert":return{icon:"🚨",text:`Someone is trying to steal ${s.defender}'s ${s.item}!`,tone:"bad"};case"market_alert":return{icon:s.direction==="up"?"📈":"📉",text:`${s.item} ${s.change>0?"+":""}${s.change}% in the last hour`,tone:s.direction==="up"?"good":"bad"};case"supply_alert":return{icon:"⚠️",text:`Only ${s.remaining} ${s.item} left (of ${s.max_supply})`,tone:"limited"};case"event_start":return{icon:s.icon,text:`${s.title} is live!`,tone:"epic"};case"event_end":return{icon:s.icon,text:`${s.title} ended`,tone:"info"};case"player_joined":return{icon:"👋",text:`${s.player} moved into Tech City`,tone:"info"};case"level_milestone":return{icon:"⭐",text:`${s.player} reached level ${s.level} — ${s.title}`,tone:"info"};case"prestige":return{icon:"✨",text:`${s.player} prestiged (P${s.prestige})`,tone:"epic"};case"big_trade":return{icon:"🤝",text:`${s.a} ⇄ ${s.b}: ${ie(s.value)} trade`,tone:"info"};case"big_sale":return{icon:"💸",text:`${s.buyer} bought ${s.item} for ${ie(s.price)}`,tone:"good"};case"upgrade":return{icon:"🏗️",text:`${s.player} upgraded to ${s.name}`,tone:"info"};case"item_stolen":return{icon:"🚨",text:`${s.attacker} stole your ${s.item}`,tone:"bad"};case"raid_over":return{icon:"🛡️",text:`You stopped ${s.attacker}`,tone:"good"};case"raid_result":return{icon:s.status==="success"?"🥷":"❌",text:s.status==="success"?`You stole ${s.item} from ${s.defender}`:`Raid on ${s.defender} failed`,tone:s.status==="success"?"good":"bad"};case"trade_offer":return{icon:"📨",text:`${s.from} sent you an offer`,tone:"info"};case"trade_done":return{icon:"🤝",text:`Trade with ${s.with} complete`,tone:"good"};case"listing_sold":return{icon:"💰",text:`${s.buyer} bought your ${s.item} for ${ie(s.price)}`,tone:"good"};case"achievement":return{icon:s.icon,text:`Achievement unlocked: ${s.title}`,tone:"epic"};case"level_up":return{icon:"⬆️",text:`You reached level ${s.level}`,tone:"good"};default:return null}}const Yv=["FIND","COLLECT","DISPLAY","EARN","PROTECT","RAID","STEAL","TRADE","SELL","UPGRADE","REPEAT"];function Bv(){const n=Eh(),s=u=>{ty(),me("open"),$v(u)};return o.jsxs("div",{className:"screen",children:[o.jsxs("div",{className:"logo",children:["STEAL",o.jsx("br",{}),"THE TECH",o.jsx("small",{children:"TECH CITY"})]}),o.jsx("div",{className:"tagline",children:"Collect insane tech. Show it off. Protect it. Take what you want from everyone else."}),o.jsx("div",{className:"loop",children:Yv.map(u=>o.jsx("span",{children:u},u))}),o.jsx("div",{className:"col",style:{width:"min(420px, 90vw)"},children:n?o.jsxs(o.Fragment,{children:[o.jsx("button",{className:"btn primary big block",onClick:()=>s("online"),"data-testid":"play-online",children:"▶ PLAY ONLINE"}),o.jsx("button",{className:"btn big block",onClick:()=>s("offline"),"data-testid":"play-offline",children:"OFFLINE PRACTICE"})]}):o.jsxs(o.Fragment,{children:[o.jsx("button",{className:"btn primary big block",onClick:()=>s("offline"),"data-testid":"play-offline",children:"▶ PLAY"}),o.jsxs("div",{className:"fineprint",children:["This copy runs in ",o.jsx("b",{children:"offline practice mode"}),": the full game server runs inside your browser and the other bases belong to NPC players. Connect a Supabase project (see README) to turn on real online multiplayer."]})]})}),o.jsx("div",{className:"fineprint",children:"Fictional in-game currency only — no real money, no gambling, no cash-outs. Works on phone, tablet and desktop."})]})}function Gv(){const n=U(u=>u.loadingMsg),s=U(u=>u.loadingPct);return o.jsxs("div",{className:"screen",children:[o.jsx("div",{className:"logo",style:{fontSize:"clamp(34px, 8vw, 64px)"},children:"STEAL THE TECH"}),o.jsx("div",{className:"progress",children:o.jsx("i",{style:{width:s+"%"}})}),o.jsx("div",{className:"muted",style:{fontWeight:800},children:n})]})}function Xv(){const n=U(s=>s.fatal);return o.jsxs("div",{className:"screen",children:[o.jsx("div",{style:{fontSize:60},children:"⚠️"}),o.jsx("h2",{className:"display",children:"Something went wrong"}),o.jsx("div",{className:"muted",style:{maxWidth:520,fontWeight:700},children:n}),o.jsxs("div",{className:"row",children:[o.jsx("button",{className:"btn primary",onClick:()=>location.reload(),children:"RELOAD"}),o.jsx("button",{className:"btn",onClick:()=>pe({phase:"title",fatal:null}),children:"BACK"})]})]})}function Vv(){const n=U(y=>y.backend),[s,u]=q.useState(""),[c,d]=q.useState(""),[f,p]=q.useState("in"),[_,g]=q.useState(null),[w,v]=q.useState(!1),b=async y=>{v(!0),g(null);try{await y(),await Ah()}catch(N){g(String(N.message||N))}finally{v(!1)}};return o.jsxs("div",{className:"screen",children:[o.jsx("div",{className:"logo",style:{fontSize:"clamp(34px, 8vw, 64px)"},children:"STEAL THE TECH"}),o.jsxs("div",{className:"card col",style:{width:"min(420px, 92vw)"},children:[o.jsx("button",{className:"btn primary big block",disabled:w,onClick:()=>b(()=>n.signInGuest()),"data-testid":"guest",children:"▶ PLAY AS GUEST"}),o.jsx("div",{className:"muted",style:{fontWeight:700},children:"— or keep your account on every device —"}),o.jsx("input",{className:"field",placeholder:"email",autoComplete:"email",value:s,onChange:y=>u(y.target.value)}),o.jsx("input",{className:"field",placeholder:"password",type:"password",autoComplete:f==="in"?"current-password":"new-password",value:c,onChange:y=>d(y.target.value)}),o.jsx("button",{className:"btn block big",disabled:w||!s||c.length<6,onClick:()=>b(()=>n.signInEmail(s,c,f==="up")),children:f==="in"?"SIGN IN":"CREATE ACCOUNT"}),o.jsx("button",{className:"btn ghost small",onClick:()=>p(f==="in"?"up":"in"),children:f==="in"?"New here? Create an account":"Have an account? Sign in"}),_&&o.jsx("div",{className:"bad-t",style:{fontWeight:800},children:_})]})]})}function Iv(){const[n,s]=q.useState(""),[u,c]=q.useState(null),[d,f]=q.useState(!1),p=async()=>{f(!0),c(null);try{await Uv(n.trim()),me("levelup")}catch(_){c(String(_.message||_).replace(/^.*?ERROR:\s*/i,"")),me("error")}finally{f(!1)}};return o.jsxs("div",{className:"screen",children:[o.jsx("div",{className:"logo",style:{fontSize:"clamp(34px, 8vw, 64px)"},children:"WELCOME TO TECH CITY"}),o.jsx("div",{className:"tagline",children:'Pick a name. Everyone in the city will see it — on the leaderboards, on the raid board, and on the "ITEM STOLEN" alerts.'}),o.jsxs("div",{className:"col",style:{width:"min(420px, 92vw)"},children:[o.jsx("input",{className:"field",style:{textAlign:"center",fontSize:24,minHeight:60},maxLength:16,placeholder:"YourName",value:n,"data-testid":"username",onChange:_=>s(_.target.value.replace(/[^A-Za-z0-9_]/g,"")),onKeyDown:_=>_.key==="Enter"&&n.length>=3&&p(),autoFocus:!0}),o.jsx("button",{className:"btn primary big block",disabled:d||n.length<3,onClick:p,"data-testid":"join",children:"MOVE IN"}),u&&o.jsx("div",{className:"bad-t",style:{fontWeight:800},children:u}),o.jsx("div",{className:"fineprint",children:"3–16 letters, numbers or _"})]})]})}async function nt(n,s={},u={}){const c=F().backend;if(!c)throw new Error("Not connected");try{const d=await c.rpc(n,s);return u.sync!==!1&&ui(),d}catch(d){const f=String(d?.message||d).replace(/^.*?ERROR:\s*/i,"");throw u.quiet||(me("error"),Me({kind:"bad",icon:"⛔",title:f})),new Error(f)}}async function rd(n,s=!1){if(!F().drop){pe({drop:{drop:n,startedAt:Date.now(),result:null,error:null}}),me("shake");try{const u=await nt("stt_open_drop",{drop:n,use_token:s},{quiet:!0});pe(c=>({drop:c.drop?{...c.drop,result:u}:null})),wt()}catch(u){me("error"),pe({drop:null}),Me({kind:"bad",icon:"⛔",title:u.message})}}}async function zh(n,s=null){await nt("stt_place",{player_item_id:n,slot:s}),me("click"),wt()}async function Qv(n){await nt("stt_store",{player_item_id:n}),me("click"),wt()}async function qh(n){const s=await nt("stt_vault",{player_item_id:n});me(s.saved_from_raid?"defend":"click"),s.saved_from_raid&&Me({kind:"good",icon:"🔒",title:"Locked in the vault!",body:"The thief will leave empty-handed."}),wt()}async function Zv(){await nt("stt_auto_arrange"),me("coin"),Me({kind:"good",icon:"✨",title:"Base arranged",body:"Your best earners are on display."}),wt()}async function dh(n,s){const u=await nt("stt_quick_sell",{player_item_id:n});me("cash"),Me({kind:"good",icon:"💵",itemId:s,title:`Sold for ${ie(u.price)}`,body:rt(s)?.name}),wt()}async function Pv(n){const s=await nt("stt_upgrade",{kind:n});me("levelup"),Me({kind:"epic",icon:n==="base"?"🏗️":n==="security"?"🔐":"🏦",title:`${s.name} unlocked!`,body:`${n.toUpperCase()} level ${s.level}`}),wt()}async function Dh(n,s=!1){if(F().steal&&!F().steal.result){Me({kind:"bad",icon:"🥷",title:"Finish your current raid first."});return}const u=await nt("stt_start_steal",{player_item_id:n,revenge:s});me("whoosh"),pe({steal:{raidId:u.raid_id,itemId:u.item_id,playerItemId:n,defender:u.defender,defenderId:u.defender_id,startedAt:Ye(u.started_at),endsAt:Ye(u.ends_at),chance:u.chance,tutorial:u.tutorial,revenge:u.revenge,defended:!1,result:null,finishing:!1}})}async function $h(){const n=F().steal;if(!(!n||n.finishing||n.result)){pe({steal:{...n,finishing:!0}});try{const s=await nt("stt_finish_steal",{raid_id:n.raidId},{quiet:!0});pe({steal:{...F().steal,finishing:!1,defended:s.defended,result:{status:s.status,fine:s.fine,note:s.note}}}),me(s.status==="success"?"steal_ok":"steal_fail"),s.status==="success"&&dd(rt(n.itemId)?.rarity||"common"),wt()}catch(s){pe({steal:{...F().steal,finishing:!1}}),/Still stealing/.test(s.message)?window.setTimeout($h,800):Me({kind:"bad",icon:"⛔",title:s.message})}}}async function Kv(n){await nt("stt_defend",{raid_id:n}),me("defend"),Me({kind:"good",icon:"🚨",title:"ALARM SOUNDED!",body:"The thief's odds just collapsed."})}async function Jv(n,s){await nt("stt_list",{player_item_id:n,price:Math.round(s)}),me("coin"),Me({kind:"good",icon:"🏷️",title:"Listed on the market",body:ie(s)}),di(),wt()}async function pd(n){await nt("stt_cancel_listing",{listing_id:n}),me("click"),di()}async function Uh(n,s,u){await nt("stt_buy_listing",{listing_id:n}),me("buy"),Me({kind:"good",icon:"🛒",itemId:s,title:`Bought ${rt(s)?.name??"item"}`,body:ie(u)}),di(),wt()}async function Wv(n){await nt("stt_trade_propose",n),me("trade"),Me({kind:"good",icon:"📨",title:"Offer sent",body:"Both sides must confirm before anything moves."})}async function fh(n,s){const u=await nt("stt_trade_respond",{trade_id:n,accept:s});return s&&u.ok===!1&&Me({kind:"bad",icon:"⚠️",title:"Trade failed",body:u.reason}),wt(),u}async function Fv(n){await nt("stt_trade_cancel",{trade_id:n})}async function e1(n){const s=await nt("stt_claim_quest",{quest_id:n});me("cash");const u=[s.cash?`+${ie(s.cash)}`:"",s.xp?`+${s.xp} XP`:"",s.tokens?Object.entries(s.tokens).map(([c,d])=>`+${d} ${c} drop`).join(" "):"",s.secret_keys?`+${s.secret_keys} Secret Key`:""];Me({kind:"epic",icon:"🎯",title:"Quest complete!",body:u.filter(Boolean).join("  ")})}async function t1(){const n=await nt("stt_claim_daily");return me("cash"),wt(),n}async function mh(n){await nt("stt_buy_cosmetic",{cosmetic_id:n}),me("buy")}async function n1(n){await nt("stt_equip",{cosmetic_id:n}),me("click"),wt()}async function a1(n){await nt("stt_set_focus",{focus:n}),me("click")}async function l1(){const n=await nt("stt_prestige");me("levelup"),Me({kind:"epic",icon:"✨",title:`PRESTIGE ${n.prestige}!`,body:"Permanent bonuses unlocked.",ttl:8e3}),wt()}async function td(n){return nt("stt_tutorial",{step:n},{quiet:!0})}function ci(n,s=!1){pe({focusPlot:n}),Te("visit",{playerId:n,revenge:s})}function Ht({id:n,size:s=40,className:u=""}){const c=U(d=>d.itemsById[n]);return c?o.jsx("img",{className:"item-icon "+u,src:no(c,s>80?160:96),width:s,height:s,alt:c.name,draggable:!1}):o.jsx("span",{style:{width:s,height:s,display:"inline-block"}})}function Ha({r:n}){return o.jsx("span",{className:`rlabel r-${n}`,children:it[n]?.label??n})}function i1({it:n}){const s=U(u=>u.market[n.id]?.minted);return n.max_supply?o.jsxs("span",{className:"supply",children:[s??"?","/",n.max_supply]}):null}function sn({id:n,serial:s,onClick:u,selected:c,unknown:d,footer:f,badge:p,showIncome:_=!0}){const g=U(b=>b.itemsById[n]),w=U(b=>b.market[n]?.price);if(!g)return null;const v=g.rarity;return o.jsxs("div",{className:`icard r-${v} ${c?"sel":""} ${d?"unknown":""}`,onClick:u,role:u?"button":void 0,children:[o.jsx("div",{className:"corner",children:p}),o.jsx("div",{className:"corner-r",children:!d&&g.max_supply?o.jsx(i1,{it:g}):null}),o.jsx("img",{className:"art",src:no(g,160),alt:d?"Unknown item":g.name,draggable:!1}),o.jsx("div",{className:"nm",children:d?"???":g.name}),o.jsxs("div",{style:{margin:"4px 0"},children:[o.jsx(Ha,{r:v}),s?o.jsxs("span",{className:"dim",style:{fontWeight:800,fontSize:12,marginLeft:6},children:["#",s]}):null]}),!d&&o.jsxs(o.Fragment,{children:[o.jsx("div",{className:"val",children:We(w??g.base_value)}),_&&o.jsxs("div",{className:"inc",children:["+",Gn(g.base_income)]})]}),f]})}function ao({children:n,onConfirm:s,className:u="btn primary big block",ms:c=900,disabled:d}){const[f,p]=q.useState(0),_=q.useRef(0),g=q.useRef(0),w=q.useRef(!1),v=()=>{cancelAnimationFrame(_.current),w.current||p(0)},b=()=>{if(d)return;w.current=!1,g.current=performance.now();const y=N=>{const R=Math.min(1,(N-g.current)/c);if(p(R),R>=1){w.current=!0,me("coin"),s(),window.setTimeout(()=>p(0),300);return}_.current=requestAnimationFrame(y)};_.current=requestAnimationFrame(y)};return q.useEffect(()=>()=>cancelAnimationFrame(_.current),[]),o.jsxs("button",{className:u+" hold",disabled:d,onPointerDown:b,onPointerUp:v,onPointerLeave:v,onPointerCancel:v,onKeyDown:y=>{(y.key==="Enter"||y.key===" ")&&(y.preventDefault(),s())},children:[o.jsx("i",{className:"fill",style:{transform:`scaleX(${f})`}}),o.jsx("span",{children:f>0&&f<1?"KEEP HOLDING…":n})]})}function Mt({title:n,icon:s,children:u,onClose:c,head:d}){return o.jsx("div",{className:"panel-wrap",children:o.jsxs("div",{className:"panel",role:"dialog","aria-label":n,children:[o.jsxs("div",{className:"panel-head",children:[o.jsx("span",{className:"e",children:s}),o.jsx("h2",{children:n}),d,o.jsx("button",{className:"icon-btn","aria-label":"Close",onClick:()=>{me("click"),(c||(()=>Te(null)))()},children:"✕"})]}),o.jsx("div",{className:"panel-body",children:u})]})})}function Xn({tabs:n,value:s,onChange:u}){return o.jsx("div",{className:"tabs",role:"tablist",children:n.map(c=>o.jsxs("button",{role:"tab","aria-selected":s===c.id,className:s===c.id?"on":"",onClick:()=>{me("tick"),u(c.id)},children:[c.label,c.badge?o.jsx("span",{className:"badge",children:c.badge}):null]},c.id))})}function De({k:n,v:s,cls:u=""}){return o.jsxs("div",{className:"stat",children:[o.jsx("div",{className:"k",children:n}),o.jsx("div",{className:"v "+u,children:s})]})}function lo({id:n,name:s,bot:u,level:c}){return o.jsxs("span",{className:"row",style:{gap:6,display:"inline-flex"},children:[o.jsx("b",{style:{cursor:"pointer"},onClick:()=>Te("profile",{playerId:n}),children:s}),u&&o.jsx("span",{className:"tag bot",children:"NPC"}),c?o.jsxs("span",{className:"tag",children:["Lv ",c]}):null]})}function on(n=1e3){const[s,u]=q.useState(Date.now());return q.useEffect(()=>{const c=window.setInterval(()=>u(Date.now()),n);return()=>clearInterval(c)},[n]),s}function Lh({id:n,serial:s,owned:u}){const c=rt(n),d=U(f=>f.market[n]);return c?o.jsx("div",{className:"col",children:o.jsxs("div",{className:"row",style:{alignItems:"flex-start"},children:[o.jsx("div",{style:{width:130,flex:"0 0 130px"},children:o.jsx(sn,{id:n,serial:s,showIncome:!1})}),o.jsxs("div",{className:"col grow",style:{gap:6},children:[o.jsx("div",{style:{fontWeight:900,fontSize:20},children:c.name}),o.jsxs("div",{className:"muted",style:{fontWeight:700},children:[c.brand," · ",c.category," · ",c.kind.replace("_"," ")]}),c.flavor&&o.jsxs("div",{style:{fontStyle:"italic",color:"#c7d2fe"},children:["“",c.flavor,"”"]}),o.jsxs("div",{className:"stats",children:[o.jsx(De,{k:"Market",v:ie(d?.price??c.base_value)}),o.jsx(De,{k:"Base",v:ie(c.base_value)}),o.jsx(De,{k:"Income",v:Gn(c.base_income),cls:"good-t"}),o.jsx(De,{k:"Supply",v:c.max_supply?`${d?.minted??"?"}/${c.max_supply}`:d?.supply??"—"}),u!=null&&o.jsx(De,{k:"You own",v:u})]}),!c.tradeable&&o.jsx("div",{className:"tag",children:"Soulbound · can't be sold, traded or stolen"})]})]})}):null}function s1({points:n,height:s=220}){const u=q.useRef(null),[c,d]=q.useState(520),[f,p]=q.useState(null);q.useEffect(()=>{if(!u.current)return;const R=new ResizeObserver(([G])=>d(Math.max(260,G.contentRect.width)));return R.observe(u.current),()=>R.disconnect()},[]);const _=q.useMemo(()=>{if(n.length<2)return null;const R=56,G=58,L=14,Y=26,B=n.map(te=>te[0]),we=n.map(te=>te[1]),je=Math.min(...B),H=Math.max(...B);let ce=Math.min(...we),Q=Math.max(...we);const ue=Q-ce||Q*.1||1,et=r1(ue/4);ce=Math.floor((ce-ue*.05)/et)*et,Q=Math.ceil((Q+ue*.05)/et)*et;const D=[];for(let te=ce;te<=Q+1e-9;te+=et)D.push(te);const P=te=>R+(te-je)/Math.max(1,H-je)*(c-R-G),J=te=>L+(1-(te-ce)/Math.max(1e-9,Q-ce))*(s-L-Y),Z=n.map((te,X)=>`${X?"L":"M"}${P(te[0]).toFixed(1)},${J(te[1]).toFixed(1)}`).join(""),Se=`${Z}L${P(H)},${J(ce)}L${P(je)},${J(ce)}Z`;return{X:P,Y:J,line:Z,area:Se,ticks:D,x0:je,x1:H,padL:R,padR:G,padT:L,padB:Y}},[n,c,s]);if(!_)return o.jsx("div",{className:"empty",children:"Not enough history yet — check back soon."});const g=n[n.length-1],w=g[1]>=n[0][1],v="#22d3ee",b=R=>{const G=R.currentTarget.getBoundingClientRect(),L=R.clientX-G.left;let Y=0,B=1/0;n.forEach((we,je)=>{const H=Math.abs(_.X(we[0])-L);H<B&&(B=H,Y=je)}),p(Y)},y=f!=null?n[f]:null,N=R=>{const G=new Date(R);return _.x1-_.x0>3*864e5?G.toLocaleDateString(void 0,{month:"short",day:"numeric"}):G.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})};return o.jsxs("div",{className:"chart-wrap",ref:u,onPointerMove:b,onPointerLeave:()=>p(null),style:{touchAction:"pan-y"},children:[o.jsxs("svg",{width:c,height:s,role:"img","aria-label":"Price history",children:[_.ticks.map(R=>o.jsxs("g",{children:[o.jsx("line",{x1:_.padL,x2:c-_.padR,y1:_.Y(R),y2:_.Y(R),stroke:"rgba(148,163,184,0.16)",strokeWidth:1}),o.jsx("text",{x:_.padL-8,y:_.Y(R)+4,textAnchor:"end",fill:"#94a3b8",fontSize:"12",fontWeight:700,children:We(R)})]},R)),o.jsx("text",{x:_.padL,y:s-6,fill:"#64748b",fontSize:"12",fontWeight:700,children:N(_.x0)}),o.jsx("text",{x:c-_.padR,y:s-6,fill:"#64748b",fontSize:"12",fontWeight:700,textAnchor:"end",children:N(_.x1)}),o.jsx("path",{d:_.area,fill:v,opacity:.1}),o.jsx("path",{d:_.line,fill:"none",stroke:v,strokeWidth:2,strokeLinejoin:"round",strokeLinecap:"round"}),o.jsx("circle",{cx:_.X(g[0]),cy:_.Y(g[1]),r:5,fill:v,stroke:"#0a0f20",strokeWidth:2}),o.jsx("text",{x:_.X(g[0])+9,y:_.Y(g[1])+4,fill:"#e2e8f0",fontSize:"13",fontWeight:800,children:We(g[1])}),y&&o.jsxs(o.Fragment,{children:[o.jsx("line",{x1:_.X(y[0]),x2:_.X(y[0]),y1:_.padT,y2:s-_.padB,stroke:"rgba(226,232,240,0.5)",strokeWidth:1}),o.jsx("circle",{cx:_.X(y[0]),cy:_.Y(y[1]),r:5,fill:v,stroke:"#0a0f20",strokeWidth:2})]})]}),y&&o.jsxs("div",{className:"chart-tip",style:{left:_.X(y[0]),top:_.Y(y[1])},children:[o.jsx("b",{children:ie(y[1])})," ",o.jsxs("span",{className:"muted",children:["· ",new Date(y[0]).toLocaleString(void 0,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})]})]}),o.jsxs("div",{className:"dim",style:{fontSize:12,fontWeight:700},children:[w?"▲":"▼"," over this range · hover or drag for exact prices"]})]})}function r1(n){const s=Math.pow(10,Math.floor(Math.log10(Math.max(n,1e-9)))),u=n/s;return(u<=1?1:u<=2?2:u<=2.5?2.5:u<=5?5:10)*s}function o1(){const n=U(y=>y.me),s=U(y=>y.last?.event),u=U(y=>y.last?.next_event_at),c=U(y=>y.feed.length),d=U(y=>(y.last?.quests_claimable||0)+(y.me?.daily.can_claim?1:0)),f=U(y=>y.last?.online??0),p=U(y=>y.backend?.mode),_=q.useRef(null),[g,w]=q.useState(c);if(on(1e3),q.useEffect(()=>{let y=0;const N=()=>{_.current&&(_.current.textContent=ie(Fb())),y=requestAnimationFrame(N)};return y=requestAnimationFrame(N),()=>cancelAnimationFrame(y)},[]),!n)return null;const v=Math.max(0,Math.min(100,(n.xp-n.xp_level)/Math.max(1,n.xp_next-n.xp_level)*100)),b=fl(n.id);return o.jsxs("div",{className:"hud",children:[o.jsxs("div",{className:"hud-me",onClick:()=>Te("profile"),title:"Your profile",children:[o.jsxs("div",{className:"avatar-dot",style:{background:`hsl(${b},70%,55%)`},children:[n.username[0].toUpperCase(),o.jsx("span",{className:"lvl",children:n.level})]}),o.jsxs("div",{style:{minWidth:0},children:[o.jsxs("div",{className:"name",children:[n.username," ",n.prestige>0&&o.jsxs("span",{className:"tag",style:{color:"#f0abfc"},children:["P",n.prestige]})]}),o.jsxs("div",{className:"title",children:[n.title," · Lv ",n.level]}),o.jsx("div",{className:"xp",title:`${n.xp-n.xp_level} / ${n.xp_next-n.xp_level} XP`,children:o.jsx("i",{style:{width:v+"%"}})})]})]}),o.jsxs("div",{className:"hud-mid",children:[o.jsxs("div",{className:"hud-cash",onClick:()=>Te("base"),title:"Your cash — tap for your base",children:[o.jsx("div",{className:"cash",ref:_,"data-testid":"cash",children:ie(n.cash)}),o.jsxs("div",{className:"sub",children:[o.jsxs("span",{className:"inc",children:["+",Gn(n.income)]}),o.jsxs("span",{children:["BASE ",o.jsx("b",{children:We(n.base_value)})]})]})]}),s?o.jsxs("div",{className:"event-pill",onClick:()=>Te("event"),children:[o.jsx("span",{style:{fontSize:20},children:s.icon}),o.jsx("span",{children:s.title}),o.jsx("small",{children:xt(Ye(s.ends_at)-Date.now())})]}):u?o.jsxs("div",{className:"event-pill next",onClick:()=>Te("event"),children:["🎪 ",o.jsxs("small",{children:["NEXT EVENT ",xt(Ye(u)-Date.now())]})]}):null]}),o.jsxs("div",{className:"hud-right",children:[o.jsxs("button",{className:"icon-btn",title:"Missions & daily reward",onClick:()=>Te("quests"),children:["🎯",d>0&&o.jsx("span",{className:"badge",children:d})]}),o.jsxs("button",{className:"icon-btn",title:"Live feed",onClick:()=>{w(c),Te("feed")},children:["🔔",c-g>0&&o.jsx("span",{className:"badge",children:Math.min(99,c-g)})]}),o.jsx("button",{className:"icon-btn",title:"Settings",onClick:()=>Te("settings"),children:"⚙️"}),o.jsx("span",{className:"tag online",title:p==="online"?"Players online now":"Offline practice mode — NPC players are simulated on this device",children:p==="online"?`● ${f} ONLINE`:"● OFFLINE MODE"})]})]})}function u1(){const s=U(u=>u.feed).filter(u=>u.target_id===null).slice(-14).map(u=>({id:u.id,l:Mh(u)})).filter(u=>u.l);return s.length?o.jsx("div",{className:"ticker","aria-hidden":!0,children:o.jsx("div",{className:"track",children:s.map(({id:u,l:c})=>o.jsxs("span",{className:"t-"+c.tone,children:[c.icon," ",c.text]},u))},s[s.length-1].id)}):null}const c1=[{id:"base",e:"🏠",label:"BASE"},{id:"drops",e:"📦",label:"DROPS"},{id:"collection",e:"🎒",label:"COLLECTION"},{id:"market",e:"📈",label:"MARKET"},{id:"raid",e:"🥷",label:"RAID"},{id:"trade",e:"🤝",label:"TRADE"},{id:"leaderboard",e:"🏆",label:"RANKS"},{id:"profile",e:"👤",label:"PROFILE",desk:!0},{id:"settings",e:"⚙️",label:"SETTINGS",desk:!0}];function d1(){const n=U(f=>f.panel),s=U(f=>f.last?.trades.incoming||0),u=U(f=>f.last?.revenge||0),c=U(f=>Object.values(f.me?.drop_tokens||{}).reduce((p,_)=>p+(_||0),0)),d={trade:s,raid:u,drops:c};return o.jsx("nav",{className:"nav",children:o.jsx("div",{className:"nav-inner",children:c1.map(f=>o.jsxs("button",{className:(n===f.id?"on":"")+(f.desk?" desk-only":""),"data-testid":"nav-"+f.id,onClick:()=>{me("click"),Te(n===f.id?null:f.id)},children:[o.jsx("span",{className:"e",children:f.e}),f.label,d[f.id]?o.jsx("span",{className:"badge",children:d[f.id]}):null]},f.id))})})}function f1(){const n=U(s=>s.toasts);return o.jsx("div",{className:"toasts","aria-live":"polite",children:n.map(s=>o.jsxs("div",{className:"toast "+s.kind,children:[s.itemId?o.jsx(Ht,{id:s.itemId,size:40}):o.jsx("span",{className:"ti",children:s.icon}),o.jsxs("div",{className:"grow",children:[o.jsxs("div",{className:"tt",children:[s.icon&&s.itemId?s.icon+" ":"",s.title]}),s.body&&o.jsx("div",{className:"tb",children:s.body})]}),s.action&&o.jsx("button",{className:"btn small primary",onClick:()=>{s.action.run(),U.setState(u=>({toasts:u.toasts.filter(c=>c.id!==s.id)}))},children:s.action.label})]},s.id))})}function m1(){const n=_t(c=>c.prompt),s=U(c=>c.panel);if(!n||s)return null;const u=typeof window<"u"&&matchMedia("(pointer: coarse)").matches;return o.jsx("div",{className:"prompt",children:o.jsxs("button",{className:"btn primary big","data-testid":"interact",onClick:()=>La?.interact(),children:[!u&&o.jsx("span",{className:"kbd",children:"E"})," ",n.icon," ",n.kind==="plot"?n.mine?"MANAGE MY BASE":`VISIT ${n.label}`:`ENTER ${n.label}`]})})}function p1(){const n=_t(c=>c.hover),s=_t(c=>c.selected);if(!n||s)return null;const u=rt(n.itemId);return u?o.jsxs("div",{className:"hover-tip",style:{left:n.sx,top:n.sy},children:[o.jsx(Ha,{r:u.rarity})," ",u.name,o.jsxs("div",{className:"muted",style:{fontSize:12},children:[We(Tn(u.id))," · +",Gn(u.base_income)," · ",n.ownerName]})]}):null}function h1(){const n=_t(p=>p.selected),s=U(p=>p.steal);if(!n)return null;const u=rt(n.itemId);if(!u)return null;const c=()=>_t.setState({selected:null}),d=Math.max(8,Math.min(window.innerWidth-258,n.sx-125)),f=Math.max(90,Math.min(window.innerHeight-330,n.sy-300));return o.jsxs("div",{className:"popover",style:{left:d,top:f},onPointerDown:p=>p.stopPropagation(),children:[o.jsxs("div",{className:"row",children:[o.jsx(Ht,{id:u.id,size:64}),o.jsxs("div",{className:"grow",children:[o.jsx("div",{style:{fontWeight:900,lineHeight:1.1},children:u.name}),o.jsx(Ha,{r:u.rarity}),o.jsx("div",{className:"good-t",style:{fontWeight:900},children:ie(Tn(u.id))}),o.jsxs("div",{className:"muted",style:{fontSize:13,fontWeight:700},children:["+",Gn(u.base_income)," · ",n.mine?"Yours":n.ownerName]})]})]}),o.jsxs("div",{className:"col",style:{marginTop:10,gap:8},children:[n.mine?o.jsx("button",{className:"btn primary block",onClick:()=>{c(),Te("base",{select:n.playerItemId})},children:"MANAGE"}):o.jsxs(o.Fragment,{children:[o.jsx("button",{className:"btn hot block","data-testid":"popover-steal",disabled:!!s&&!s.result,onClick:()=>{c(),Dh(n.playerItemId).catch(()=>{})},children:"🥷 STEAL"}),o.jsx("button",{className:"btn block",onClick:()=>{c(),ci(n.ownerId)},children:"VIEW BASE"})]}),o.jsx("button",{className:"btn ghost small",onClick:c,children:"CLOSE"})]})]})}function _1(){const[n,s]=q.useState(null),u=q.useRef(null),[c,d]=q.useState(!1);if(q.useEffect(()=>{const g=matchMedia("(pointer: coarse)");d(g.matches);const w=()=>d(g.matches);return g.addEventListener?.("change",w),()=>g.removeEventListener?.("change",w)},[]),!c)return null;const f=55,p=g=>{if(u.current!==g.pointerId||!n)return;let w=g.clientX-n.x,v=g.clientY-n.y;const b=Math.hypot(w,v);b>f&&(w=w/b*f,v=v/b*f),s({...n,kx:w,ky:v}),La?.setJoystick(w/f,v/f)},_=()=>{u.current=null,s(null),La?.setJoystick(0,0)};return o.jsxs(o.Fragment,{children:[o.jsx("div",{className:"joy-zone",onPointerDown:g=>{u.current=g.pointerId,g.target.setPointerCapture(g.pointerId),s({x:g.clientX,y:g.clientY,kx:0,ky:0})},onPointerMove:p,onPointerUp:_,onPointerCancel:_}),n?o.jsx("div",{className:"joystick",style:{left:n.x-75,top:n.y-75,pointerEvents:"none"},children:o.jsx("div",{className:"knob",style:{transform:`translate(${n.kx}px, ${n.ky}px)`}})}):o.jsx("div",{className:"joystick",style:{left:24,bottom:110,opacity:.55,pointerEvents:"none"},children:o.jsx("div",{className:"knob"})})]})}function g1(){const n=U(f=>f.me),s=U(f=>f.catalog?.cosmetics??Ua),[u,c]=q.useState(!1);if(!n)return null;const d=s.filter(f=>f.slot==="emote"&&n.owned_cosmetics.includes(f.id));return o.jsxs("div",{className:"col emote-bar",children:[u&&o.jsx("div",{className:"card tight row wrap",style:{maxWidth:240},children:d.map(f=>o.jsx("button",{className:"icon-btn",onClick:()=>{La?.doEmote(f.data.emoji),c(!1),me("click")},children:f.data.emoji},f.id))}),o.jsxs("div",{className:"row",children:[o.jsx("button",{className:"icon-btn",title:"Emotes",onClick:()=>c(!u),children:"😀"}),o.jsx("button",{className:"icon-btn",title:"Go home",onClick:()=>{La?.travelHome()},children:"🏠"})]})]})}function ph({dropId:n,size:s=190}){const u=q.useRef(null);return q.useEffect(()=>{let c=0;const d=u.current,f=Math.min(2,window.devicePixelRatio||1);d.width=s*f,d.height=s*f;const p=d.getContext("2d"),_=performance.now(),g=w=>{p.setTransform(f,0,0,f,0,0),p.clearRect(0,0,s,s),fd(p,s*.45,s*.55,s*.62,n,(w-_)/1e3),c=requestAnimationFrame(g)};return c=requestAnimationFrame(g),()=>cancelAnimationFrame(c)},[n,s]),o.jsx("canvas",{ref:u,style:{width:s,height:s}})}function io({n=80,colors:s}){const u=q.useMemo(()=>Array.from({length:n},(c,d)=>({left:Math.random()*100,delay:Math.random()*.6,dur:1.8+Math.random()*2,color:s?s[d%s.length]:`hsl(${Math.random()*360},90%,60%)`,rot:Math.random()*360})),[n,s]);return o.jsx(o.Fragment,{children:u.map((c,d)=>o.jsx("i",{className:"confetti",style:{left:c.left+"%",background:c.color,animationDuration:c.dur+"s",animationDelay:c.delay+"s",transform:`rotate(${c.rot}deg)`}},d))})}function b1(){const n=U(je=>je.drop),s=U(je=>je.catalog),u=U(je=>je.me),[c,d]=q.useState(performance.now()),f=q.useRef(null);if(q.useEffect(()=>{if(!n)return;let je=0;const H=()=>{d(performance.now()),je=requestAnimationFrame(H)};return je=requestAnimationFrame(H),()=>cancelAnimationFrame(je)},[n]),!n||!s)return null;const p=s.drops.find(je=>je.id===n.drop),_=Date.now()-n.startedAt,g=n.result,w=g?it[g.rarity].tier:0,v=w>=6?1300:0,b=1900,y=!g||_<b?"charge":_<b+v?"suspense":"reveal",N=p?Kr.filter(je=>p.weights[je]):Kr,R=N[Math.floor(c/Math.max(60,260-_/10))%N.length];y==="charge"&&Math.floor(_/220)!==Math.floor((_-16)/220)&&me("shake"),y==="reveal"&&g&&f.current!==g.player_item.id&&(f.current=g.player_item.id,dd(g.rarity),navigator.vibrate&&w>=5&&navigator.vibrate(w>=7?[100,50,100,50,300]:120));const G=g?rt(g.item_id):null,L=()=>pe({drop:null}),Y=u?.drop_tokens?.[n.drop]||0,B=()=>{pe({drop:null}),window.setTimeout(()=>rd(n.drop,Y>0),50)},we=g?g.rarity==="ultra"?"#e879f9":it[g.rarity].color:it[R].color;return o.jsxs("div",{className:`drop-stage r-${g?.rarity??"common"}`,style:{"--rc":we},"data-testid":"drop-overlay",children:[y==="charge"&&o.jsxs(o.Fragment,{children:[o.jsx("div",{className:"drop-rays",style:{"--ray":it[R].color+"33"}}),o.jsx("div",{className:"muted display",style:{fontSize:18,letterSpacing:"0.2em"},children:p?.name}),o.jsx("div",{className:"drop-crate shake"+(_>1200?" hard":""),style:{filter:`drop-shadow(0 0 ${20+_/40}px ${it[R].color})`},children:o.jsx(ph,{dropId:n.drop})}),o.jsxs("div",{className:"reveal-rarity",style:{color:it[R].color,fontSize:28,opacity:.8},children:[it[R].label,"?"]})]}),y==="suspense"&&o.jsxs(o.Fragment,{children:[o.jsx("div",{className:"drop-crate shake hard",style:{filter:"brightness(0.4) drop-shadow(0 0 40px #fff)"},children:o.jsx(ph,{dropId:n.drop})}),o.jsx("div",{className:"reveal-rarity",style:{color:"#fff",fontSize:30},children:"SOMETHING RARE…"})]}),y==="reveal"&&g&&G&&o.jsxs(o.Fragment,{children:[o.jsx("div",{className:"drop-flash"}),o.jsx("div",{className:"drop-rays",style:{"--ray":we+"44"}}),w>=5&&o.jsx(io,{n:w>=7?140:70,colors:w===9?["#c084fc","#fff","#7c3aed"]:void 0}),g.is_new&&o.jsx("span",{className:"new-badge",children:"NEW DISCOVERY!"}),o.jsx("div",{className:"reveal-item",children:o.jsx("img",{src:no(G,256),alt:G.name})}),o.jsx("div",{className:"reveal-rarity",children:it[g.rarity].label}),o.jsx("div",{className:"reveal-name",children:G.name}),g.serial&&G.max_supply&&o.jsxs("div",{className:"supply",style:{fontSize:14,marginTop:6},children:["SERIAL #",g.serial," / ",G.max_supply]}),o.jsxs("div",{className:"row",style:{justifyContent:"center",gap:18,marginTop:10,fontWeight:900,fontSize:18},children:[o.jsx("span",{className:"good-t",children:ie(Tn(G.id))}),o.jsxs("span",{className:"muted",children:["+",Gn(G.base_income)]}),o.jsxs("span",{className:"gold-t",children:["+",g.xp," XP"]})]}),o.jsx("div",{className:"muted",style:{fontWeight:700,marginTop:4},children:g.placed?"✅ Now on display in your base — earning money.":"📦 Your base is full — it went to storage. Swap it in from BASE."}),o.jsxs("div",{className:"row",style:{marginTop:18,justifyContent:"center",flexWrap:"wrap"},children:[o.jsx("button",{className:"btn big",onClick:L,"data-testid":"drop-close",children:"CONTINUE"}),o.jsx("button",{className:"btn big primary",onClick:B,children:Y>0?`OPEN ANOTHER (${Y} FREE)`:`OPEN ANOTHER · ${ie(p?.price??0)}`})]})]})]})}function y1(){const n=U(w=>w.steal),s=on(100),u=q.useRef(null);if(q.useEffect(()=>{n&&!n.result&&s>=n.endsAt&&u.current!==n.raidId&&(u.current=n.raidId,$h())},[n,s]),!n)return null;const c=rt(n.itemId),d=Math.max(1,n.endsAt-n.startedAt),f=Math.max(0,Math.min(1,(s-n.startedAt)/d)),p=()=>pe({steal:null});if(!n.result)return o.jsxs("div",{className:"steal-box","data-testid":"steal-box",children:[o.jsxs("div",{className:"row between",children:[o.jsx("div",{className:"big",children:"STEALING…"}),o.jsx("div",{className:"display",style:{fontSize:22},children:xt(n.endsAt-s)})]}),o.jsxs("div",{className:"row",style:{margin:"8px 0"},children:[o.jsx(Ht,{id:n.itemId,size:56}),o.jsxs("div",{className:"grow",children:[o.jsx("div",{style:{fontWeight:900},children:c?.name}),o.jsxs("div",{className:"muted",style:{fontWeight:700},children:["from ",n.defender," · ",Math.round(n.chance*(n.defended?.3:1)*100),"% chance",n.revenge?" · REVENGE BONUS":"",n.tutorial?" · beginner raid":""]})]})]}),o.jsx("div",{className:"steal-bar",children:o.jsx("i",{style:{width:f*100+"%"}})}),n.defended&&o.jsx("div",{className:"bad-t",style:{fontWeight:900,marginTop:8},children:"🚨 THE OWNER HIT THE ALARM! Your odds collapsed."}),n.finishing&&o.jsx("div",{className:"muted",style:{marginTop:6,fontWeight:700},children:"Making a run for it…"})]});const _=n.result.status==="success",g=n.result.status==="blocked";return o.jsx("div",{className:"overlay",onClick:p,children:o.jsxs("div",{className:"modal center",onClick:w=>w.stopPropagation(),"data-testid":"steal-result",children:[_&&o.jsx(io,{n:60}),o.jsx("div",{style:{fontSize:56},children:_?"🔥":g?"🔒":"🚨"}),o.jsx("h2",{className:_?"good-t":"bad-t",style:{fontSize:30},children:_?"ITEM STOLEN!":g?"BLOCKED!":"RAID FAILED"}),o.jsx("div",{style:{maxWidth:180,margin:"10px auto"},children:o.jsx(sn,{id:n.itemId})}),_?o.jsxs("p",{className:"muted",style:{fontWeight:700},children:["It's yours now. It's ",o.jsx("b",{className:"bad-t",children:"🔥 HOT"})," for 5 minutes — it can't be sold or traded yet, and ",n.defender," can try to take it back with REVENGE."]}):o.jsxs("p",{className:"muted",style:{fontWeight:700},children:[n.result.note||"You got caught."," ",n.result.fine>0&&o.jsxs(o.Fragment,{children:["You paid a ",o.jsx("b",{className:"bad-t",children:ie(n.result.fine)})," fine to ",n.defender,"."]})," Lay low for a moment before your next raid."]}),o.jsxs("div",{className:"row",style:{justifyContent:"center",marginTop:12},children:[o.jsx("button",{className:"btn big",onClick:p,children:"CONTINUE"}),o.jsx("button",{className:"btn big hot",onClick:()=>{p(),Te("raid")},children:"RAID AGAIN"})]})]})})}function v1(){const n=U(y=>y.last?.incoming_raids[0]),s=U(y=>y.me),u=U(y=>y.myItems.filter(N=>N.location==="vault").length),c=on(100),[d,f]=q.useState(!1);if(!n||!s)return null;const p=rt(n.item_id),_=Ye(n.ends_at),g=Ye(n.started_at),w=_-c,v=Math.max(0,Math.min(1,(c-g)/Math.max(1,_-g))),b=u<s.vault_capacity;return o.jsxs("div",{className:"alarm",role:"alert","data-testid":"raid-alarm",children:[o.jsxs("div",{className:"row between",children:[o.jsx("h3",{children:"🚨 WARNING — YOU'RE BEING ROBBED"}),o.jsx("b",{className:"display",style:{fontSize:22,color:"#fecaca"},children:w>0?xt(w):"…"})]}),o.jsxs("div",{className:"row",style:{margin:"8px 0"},children:[o.jsx(Ht,{id:n.item_id,size:56}),o.jsxs("div",{className:"grow",children:[o.jsxs("div",{style:{fontWeight:900,color:"#fff"},children:[n.attacker,n.attacker_bot?" 🤖":""," is stealing your"]}),o.jsxs("div",{style:{fontWeight:900,fontSize:18},children:[p&&o.jsx(Ha,{r:p.rarity})," ",p?.name]})]})]}),o.jsx("div",{className:"steal-bar",style:{marginBottom:10},children:o.jsx("i",{style:{width:v*100+"%"}})}),o.jsxs("div",{className:"row",children:[o.jsx("button",{className:"btn hot grow big",disabled:n.defended||d||w<=0,"data-testid":"defend",onClick:async()=>{f(!0);try{await Kv(n.id)}finally{f(!1)}},children:n.defended?"🚨 ALARM ACTIVE":"🚨 SOUND ALARM"}),o.jsxs("button",{className:"btn good grow big",disabled:!b||d||w<=0,onClick:async()=>{f(!0);try{await qh(n.player_item_id)}finally{f(!1)}},children:["🔒 VAULT IT ",b?"":"(FULL)"]})]}),o.jsx("div",{style:{color:"#fecaca",fontSize:13,fontWeight:700,marginTop:6},children:"Alarm cuts their odds by 70%. Vaulting makes the theft fail outright."})]})}function x1(){const n=U(c=>c.bigReveal);if(q.useEffect(()=>{if(!n)return;const c=window.setTimeout(()=>pe({bigReveal:null}),7e3);return()=>clearTimeout(c)},[n]),!n)return null;const s=n.payload,u=rt(s.item_id);return o.jsxs("div",{className:"big-reveal",onClick:()=>pe({bigReveal:null}),children:[o.jsx(io,{n:120,colors:["#c084fc","#ffffff","#7c3aed","#f0abfc"]}),o.jsxs("div",{className:"col",style:{alignItems:"center"},children:[o.jsx("h1",{children:"🚨 SECRET DISCOVERED 🚨"}),o.jsx("div",{className:"muted display",style:{letterSpacing:"0.3em"},children:"PLAYER"}),o.jsxs("div",{style:{fontSize:34,fontWeight:900},children:[s.player,s.is_bot?" 🤖":""]}),u&&o.jsx("img",{src:no(u,256),alt:"",style:{width:220,filter:"drop-shadow(0 0 40px #c084fc)"},className:"reveal-item"}),o.jsx("div",{className:"muted display",style:{letterSpacing:"0.3em"},children:"FOUND"}),o.jsx("div",{style:{fontSize:30,fontWeight:900,color:"#f5f3ff",textShadow:"0 0 20px #c084fc"},children:s.item}),s.serial&&o.jsxs("div",{className:"supply",style:{fontSize:15},children:["#",s.serial," of ",s.max_supply]}),o.jsx("div",{className:"dim",style:{marginTop:10},children:"tap to continue"})]})]})}function w1(){const n=U(s=>s.levelUp);return q.useEffect(()=>{if(!n)return;const s=window.setTimeout(()=>pe({levelUp:null}),4e3);return()=>clearTimeout(s)},[n]),n?o.jsx("div",{className:"overlay",onClick:()=>pe({levelUp:null}),children:o.jsxs("div",{className:"modal center",children:[o.jsx(io,{n:50,colors:["#fde047","#f59e0b","#fff"]}),o.jsx("div",{className:"display gold-t",style:{fontSize:18,letterSpacing:"0.3em"},children:"LEVEL UP"}),o.jsx("div",{className:"display",style:{fontSize:72,fontWeight:900,color:"#fde047",textShadow:"0 0 30px rgba(250,204,21,0.6)"},children:n.level}),o.jsx("div",{style:{fontSize:24,fontWeight:900},children:n.title}),n.cash>0&&o.jsxs("div",{className:"good-t",style:{fontSize:22,fontWeight:900,marginTop:6},children:["+",ie(n.cash)]})]})}):null}function j1(){const n=U(u=>u.confirm);if(!n)return null;const s=()=>pe({confirm:null});return o.jsx("div",{className:"overlay",onClick:s,children:o.jsxs("div",{className:"modal",onClick:u=>u.stopPropagation(),children:[o.jsx("h2",{children:n.title}),o.jsx("p",{className:"muted",style:{fontWeight:700,fontSize:17,whiteSpace:"pre-line"},children:n.body}),o.jsxs("div",{className:"col",children:[n.hold?o.jsxs(ao,{className:"btn big block "+(n.danger?"hot":"primary"),onConfirm:()=>{s(),n.onConfirm()},children:["HOLD TO ",n.confirmLabel]}):o.jsx("button",{className:"btn big block "+(n.danger?"hot":"primary"),onClick:()=>{s(),n.onConfirm()},children:n.confirmLabel}),o.jsx("button",{className:"btn block",onClick:s,children:"CANCEL"})]})]})})}function hd(n){pe({confirm:n})}function S1(){const n=U(L=>L.tutorialOpen),s=U(L=>L.me),u=U(L=>L.world),c=U(L=>L.panel),d=U(L=>L.drop),f=U(L=>L.steal),[p,_]=q.useState(()=>Math.max(1,Math.min(12,(F().me?.tutorial_step||0)+1))),g=q.useRef(0),w=u.find(L=>L.username==="RookieRick"),v=U(L=>L.catalog?.drops.find(Y=>Y.id==="basic")?.price??0),y={1:{title:"👋 Welcome to STEAL THE TECH",body:"Tech City is packed with collectors. Find tech, show it off in your base, earn money every second — and steal what you can't find.",button:"LET'S GO"},2:{title:"📺 Your first TV",body:`This NOVA 32" Starter TV is yours forever. It's soulbound, so nobody can ever steal it.`,item:"nova-starter-tv",button:"NICE"},3:{title:"🏠 This is your base",body:"Everything you put on display here physically appears in your base. You start with 4 display slots — upgrade to unlock more.",button:"NEXT",onEnter:()=>{La?.travelHome()}},4:{title:"💸 Passive income",body:"Displayed items earn money every second, even when you're away (up to 12 hours). Watch the cash counter at the top climb.",button:"NEXT"},5:{title:"📦 Your first drop — on us",body:`We just sent you ${ie(v)}. That's exactly one BASIC DROP. Head to the drop machines!`,button:"OPEN DROPS",onButton:()=>{Te("drops")}},6:{title:"🎰 Open the BASIC DROP",body:"Hit OPEN on the Basic Drop. Every drop is paid for with in-game cash you earn — never real money.",waitFor:"drop"},7:{title:"🌈 Rarities",body:"COMMON → UNCOMMON → RARE → EPIC → LEGENDARY → MYTHIC → ULTRA → SECRET. LIMITED items have a hard supply cap. Rarer = more valuable, more income, more people who want it.",button:"GOT IT"},8:{title:"🏚️ Meet your neighbour",body:`This is ${w?.username??"RookieRick"}'s base. Other players' bases are all over Tech City, and you can walk right in.`,button:"NEXT",onEnter:()=>{w&&pe({focusPlot:w.id})}},9:{title:"🥷 Stealing",body:"Tap any item in someone's base and hit STEAL. It takes a few seconds — and the owner gets a warning and can fight back. Security upgrades and your vault protect you from the same.",button:"TRY IT"},10:{title:"🎯 Beginner raid",body:`Steal something from ${w?.username??"RookieRick"}. His security is basic — this one's nearly guaranteed.`,waitFor:"steal",onEnter:()=>{w&&ci(w.id)}},11:{title:"📈 The market",body:"Every item has a live price driven by supply and demand. List items for other players to buy, snap up bargains, and watch prices react to events.",button:"OPEN MARKET",onButton:()=>Te("market")},12:{title:"🚀 Go build an empire",body:"Daily rewards, missions, upgrades, trades and raids are all waiting. Protect your best items — people WILL come for them. Here's a free Basic Drop to start.",button:"FINISH"}}[p];if(q.useEffect(()=>{!n||!y||g.current!==p&&(g.current=p,td(p).catch(()=>{}),y.onEnter?.())},[p,n]),q.useEffect(()=>{!n||!s||(p===6&&s.stats.drops_opened>0&&!d&&_(7),p===10&&(s.stats.steals_won>0||s.tutorial_flags?.tutorial_raid)&&!f&&_(11))},[s,d,f,p,n]),!n||!s||!y||d||f&&f.result)return null;const N=()=>{if(me("click"),y.onButton?.(),p>=12){td(12).catch(()=>{}),pe({tutorialOpen:!1}),Te(null);return}_(p+1)},R=()=>{td(12).catch(()=>{}),pe({tutorialOpen:!1})},G=!!c;return o.jsxs("div",{className:"tutorial"+(G?" side":""),"data-testid":"tutorial",children:[o.jsxs("div",{className:"row between",children:[o.jsxs("span",{className:"steps",children:["TUTORIAL · ",p,"/12"]}),o.jsx("button",{className:"btn ghost small",onClick:R,children:"SKIP"})]}),o.jsx("h3",{children:y.title}),o.jsxs("div",{className:"row",style:{alignItems:"flex-start"},children:[y.item&&o.jsx(Ht,{id:y.item,size:72}),o.jsx("p",{className:"grow",children:y.body})]}),y.button?o.jsx("button",{className:"btn primary block big",onClick:N,"data-testid":"tutorial-next",children:y.button}):o.jsxs("div",{className:"muted",style:{fontWeight:800},children:["⏳ Waiting for you to ",y.waitFor==="drop"?"open the drop":"pull off the steal","…"]})]})}function T1(){const n=U(H=>H.me),s=U(H=>H.myItems),u=U(H=>H.catalog?.upgrades??Ua),c=U(H=>H.panelArg),d=U(H=>H.last?.listings??Ua),[f,p]=q.useState("display"),[_,g]=q.useState(c?.select??null),[w,v]=q.useState(null),b=on(1e3),y=q.useMemo(()=>new Map(s.filter(H=>H.location==="display").map(H=>[H.slot,H])),[s]),N=s.filter(H=>H.location==="inventory"),R=s.filter(H=>H.location==="vault"),G=s.filter(H=>H.location==="listed"),L=s.find(H=>H.id===_)||null,Y=(H,ce)=>Tn(ce.item_id)-Tn(H.item_id),B=(H,ce)=>u.find(Q=>Q.kind===H&&Q.level===ce+1),we=(H,ce)=>u.find(Q=>Q.kind===H&&Q.level===ce),je=n.shield_until?Ye(n.shield_until)-b:0;return o.jsxs(Mt,{title:"MY BASE",icon:"🏠",head:o.jsx("button",{className:"btn small",onClick:()=>Zv(),children:"✨ AUTO-FILL"}),children:[o.jsxs("div",{className:"stats",children:[o.jsx(De,{k:"Base value",v:ie(n.base_value),cls:"good-t"}),o.jsx(De,{k:"Income",v:"+"+Gn(n.income),cls:"good-t"}),o.jsx(De,{k:"Display",v:`${y.size}/${n.slots}`}),o.jsx(De,{k:"Security",v:`L${n.security_level}`}),o.jsx(De,{k:"Vault",v:`${R.length}/${n.vault_capacity}`}),je>0&&o.jsx(De,{k:"Shield",v:xt(je)})]}),o.jsx(Xn,{value:f,onChange:H=>{p(H),v(null)},tabs:[{id:"display",label:`Display ${y.size}/${n.slots}`},{id:"storage",label:`Storage ${N.length}`},{id:"vault",label:`Vault ${R.length}/${n.vault_capacity}`},{id:"upgrades",label:"Upgrades"}]}),L&&o.jsxs("div",{className:"card",children:[o.jsx(Lh,{id:L.item_id,serial:L.serial}),o.jsx(Hh,{pi:L,onDone:()=>g(null)})]}),f==="display"&&o.jsxs(o.Fragment,{children:[o.jsx("div",{className:"muted",style:{fontWeight:700},children:"Items on display earn income — and can be stolen. Tap an empty slot to fill it."}),o.jsx("div",{className:"grid items",children:Array.from({length:n.slots},(H,ce)=>{const Q=y.get(ce);return Q?o.jsx(sn,{id:Q.item_id,serial:Q.serial,selected:_===Q.id,onClick:()=>g(Q.id),badge:Q.soulbound?o.jsx("span",{className:"tag",children:"★"}):Q.hot_until&&Ye(Q.hot_until)>b?o.jsx("span",{className:"tag",children:"🔥"}):null},Q.id):o.jsxs("div",{className:"icard",style:{display:"grid",placeItems:"center",minHeight:170,borderStyle:"dashed",opacity:.8},onClick:()=>v(ce),children:[o.jsx("div",{style:{fontSize:30},children:"＋"}),o.jsxs("div",{className:"muted",style:{fontWeight:800},children:["SLOT ",ce+1]})]},ce)})}),w!==null&&o.jsxs("div",{className:"card",children:[o.jsxs("div",{className:"row between",children:[o.jsxs("b",{children:["Fill slot ",w+1]}),o.jsx("button",{className:"btn small ghost",onClick:()=>v(null),children:"✕"})]}),N.length+R.length===0?o.jsx("div",{className:"empty",children:"Nothing in storage. Open drops, trade or steal to get more!"}):o.jsx("div",{className:"grid items",style:{marginTop:8},children:[...N,...R].sort(Y).map(H=>o.jsx(sn,{id:H.item_id,serial:H.serial,badge:H.location==="vault"?o.jsx("span",{className:"tag",children:"🔒"}):null,onClick:()=>{zh(H.id,w).catch(()=>{}),v(null)}},H.id))})]})]}),f==="storage"&&o.jsxs(o.Fragment,{children:[o.jsxs("div",{className:"muted",style:{fontWeight:700},children:["Stored items are safe from thieves but earn nothing. ",G.length>0&&`${G.length} item(s) listed on the market.`]}),N.length===0&&G.length===0?o.jsx("div",{className:"empty",children:"Storage is empty."}):o.jsxs("div",{className:"grid items",children:[N.sort(Y).map(H=>o.jsx(sn,{id:H.item_id,serial:H.serial,selected:_===H.id,onClick:()=>g(H.id),badge:H.hot_until&&Ye(H.hot_until)>b?o.jsx("span",{className:"tag",children:"🔥 HOT"}):null},H.id)),G.map(H=>{const ce=d.find(Q=>Q.player_item_id===H.id);return o.jsx(sn,{id:H.item_id,serial:H.serial,onClick:()=>Te("market",{tab:"mine"}),badge:o.jsxs("span",{className:"tag",children:["🏷️ ",ce?We(ce.price):"LISTED"]})},H.id)})]})]}),f==="vault"&&o.jsxs(o.Fragment,{children:[o.jsxs("div",{className:"card tight",style:{background:"rgba(74,222,128,0.08)"},children:[o.jsxs("b",{children:["🔒 VAULT ",R.length,"/",n.vault_capacity]}),o.jsx("div",{className:"muted",style:{fontWeight:700},children:"Vaulted items can never be stolen and survive Prestige — but they don't earn income. Vault something mid-raid to foil the thief!"})]}),R.length===0?o.jsx("div",{className:"empty",children:"Your vault is empty."}):o.jsx("div",{className:"grid items",children:R.sort(Y).map(H=>o.jsx(sn,{id:H.item_id,serial:H.serial,selected:_===H.id,onClick:()=>g(H.id)},H.id))})]}),f==="upgrades"&&o.jsxs("div",{className:"col",children:[[["base","🏗️ BASE",n.base_level,H=>`${H} display slots`,"More slots = more income on display."],["security","🔐 SECURITY",n.security_level,H=>`Level ${H}`,"Each level cuts raiders' success chance by 7% and makes steals take longer."],["vault","🏦 VAULT",n.vault_level,H=>`${H} protected items`,"Vaulted items can never be stolen."]].map(([H,ce,Q,ue,et])=>{const D=we(H,Q),P=B(H,Q);return o.jsxs("div",{className:"card",children:[o.jsxs("div",{className:"row between",children:[o.jsxs("div",{children:[o.jsxs("div",{style:{fontWeight:900,fontSize:18},children:[ce," · L",Q]}),o.jsxs("div",{className:"muted",style:{fontWeight:700},children:[D?.name," — ",D?ue(D.value):""]})]}),P?o.jsx("button",{className:"btn gold",disabled:n.cash<P.cost,onClick:()=>Pv(H).catch(()=>{}),children:ie(P.cost)}):o.jsx("span",{className:"tag",children:"MAX"})]}),P&&o.jsxs("div",{className:"muted",style:{marginTop:6,fontWeight:700},children:["Next: ",o.jsx("b",{style:{color:"#fde68a"},children:P.name})," — ",ue(P.value),". ",et]}),o.jsx("div",{className:"bar gold",style:{marginTop:8},children:o.jsx("i",{style:{width:`${Q/u.filter(J=>J.kind===H).length*100}%`}})})]},H)}),o.jsxs("div",{className:"card tight",children:[o.jsx("b",{children:"Security levels"}),o.jsx("div",{className:"muted",style:{fontWeight:700},children:"1 Basic Alarm · 2 Camera · 3 Security Door · 4 Advanced Scanner · 5 Elite Security · 6 Quantum Security"})]})]})]})}function Hh({pi:n,onDone:s}){const u=U(L=>L.me),c=U(L=>L.myItems.filter(Y=>Y.location==="vault").length),d=U(L=>L.catalog?.rules),f=U(L=>L.market[n.item_id]),[p,_]=q.useState(!1),g=rt(n.item_id),w=f?.price??g.base_value,[v,b]=q.useState(String(Math.round(w*1.05))),y=!!n.hot_until&&Ye(n.hot_until)>Date.now(),N=Math.floor(w*(d?.quick_sell_rate??.6)),R=()=>s?.(),G=ey(g.rarity)>=5;return n.location==="listed"?o.jsx("div",{className:"muted",children:"Listed on the market."}):o.jsxs("div",{className:"col",style:{marginTop:10},children:[o.jsxs("div",{className:"row wrap",children:[n.location!=="display"&&o.jsx("button",{className:"btn primary",onClick:()=>zh(n.id).then(R).catch(()=>{}),children:"⬆ DISPLAY"}),n.location==="display"&&o.jsx("button",{className:"btn",onClick:()=>Qv(n.id).then(R).catch(()=>{}),children:"⬇ STORE"}),n.location!=="vault"&&o.jsxs("button",{className:"btn good",disabled:c>=u.vault_capacity,onClick:()=>qh(n.id).then(R).catch(()=>{}),children:["🔒 VAULT ",c>=u.vault_capacity?"(FULL)":""]}),!n.soulbound&&g.tradeable&&o.jsx(o.Fragment,{children:o.jsx("button",{className:"btn gold",disabled:y,onClick:()=>_(!p),children:"🏷️ SELL"})})]}),y&&o.jsxs("div",{className:"bad-t",style:{fontWeight:800},children:["🔥 Too hot to sell for ",xt(Ye(n.hot_until)-Date.now()),"."]}),p&&!y&&o.jsxs("div",{className:"card",children:[o.jsxs("div",{className:"row between",children:[o.jsxs("b",{children:["Sell ",g.name]}),o.jsxs("span",{className:"muted",children:["Market ",ie(w)]})]}),o.jsxs("div",{className:"grid two",style:{marginTop:8},children:[o.jsxs("div",{className:"col",children:[o.jsx("div",{className:"muted",style:{fontWeight:800},children:"QUICK SELL (instant)"}),o.jsx("button",{className:"btn",onClick:()=>G?hd({title:"Quick sell?",body:`Sell ${g.name} instantly for ${ie(N)} (60% of market)?`,confirmLabel:"SELL",danger:!0,hold:!0,onConfirm:()=>dh(n.id,g.id).then(R).catch(()=>{})}):dh(n.id,g.id).then(R).catch(()=>{}),children:ie(N)})]}),o.jsxs("div",{className:"col",children:[o.jsx("div",{className:"muted",style:{fontWeight:800},children:"LIST FOR (players buy)"}),o.jsx("input",{className:"field",inputMode:"numeric",value:v,onChange:L=>b(L.target.value.replace(/[^0-9]/g,""))})]})]}),o.jsx("div",{className:"row wrap",style:{marginTop:8},children:[.95,1,1.1,1.25].map(L=>o.jsx("button",{className:"btn small",onClick:()=>b(String(Math.round(w*L))),children:L===1?"MARKET":`${L>1?"+":""}${Math.round((L-1)*100)}%`},L))}),o.jsxs("div",{className:"muted",style:{fontWeight:700,marginTop:6},children:["You receive ",ie(Math.max(0,Number(v)-Math.ceil(Number(v)*(d?.market_fee??.05))))," after the 5% market fee. Allowed range ",We(w*(d?.list_min??.25)),"–",We(w*(d?.list_max??5)),"."]}),o.jsxs("button",{className:"btn gold block big",style:{marginTop:8},onClick:()=>Jv(n.id,Number(v)).then(R).catch(()=>{}),children:["LIST FOR ",ie(Number(v)||0)]})]})]})}function N1(){const n=U(d=>d.catalog),s=U(d=>d.me),u=U(d=>d.last?.event),c=U(d=>!!d.drop);return on(1e3),o.jsxs(Mt,{title:"DROP ZONE",icon:"📦",children:[o.jsxs("div",{className:"card tight",style:{background:"rgba(34,211,238,0.07)"},children:[o.jsx("b",{children:"All drops are bought with cash you earn in the game."}),o.jsxs("div",{className:"muted",style:{fontWeight:700},children:["No real money, no deposits, no cash-outs. Odds are shown on every machine",s.luck>0?` · your Prestige luck: +${Math.round(s.luck*100)}% on Rare+`:"","."]})]}),u&&o.jsxs("div",{className:"card",style:{borderColor:"rgba(251,146,60,0.6)"},children:[o.jsxs("b",{children:[u.icon," ",u.title," is live — ",xt(Ye(u.ends_at)-Date.now())," left"]}),o.jsx("div",{className:"muted",style:{fontWeight:700},children:u.description})]}),n.drops.map(d=>{const f=s.drop_tokens?.[d.id]||0,p=s.level<d.min_level,_=d.event_only&&!u,g=d.requires_key&&s.secret_keys<1,w=p||_||g,v=s.cash>=d.price,b=Object.values(d.weights).reduce((y,N)=>y+(N||0),0);return o.jsxs("div",{className:"card","data-testid":"drop-"+d.id,style:{opacity:w?.7:1},children:[o.jsxs("div",{className:"row between",children:[o.jsxs("div",{children:[o.jsx("div",{className:"display",style:{fontWeight:900,fontSize:19},children:d.name}),o.jsx("div",{className:"muted",style:{fontWeight:700},children:d.description})]}),o.jsx("div",{className:"good-t display",style:{fontSize:20,fontWeight:900},children:ie(d.price)})]}),o.jsx("div",{className:"row wrap",style:{gap:6,margin:"10px 0"},children:Kr.filter(y=>d.weights[y]).map(y=>o.jsxs("span",{className:"row",style:{gap:4,display:"inline-flex"},children:[o.jsx(Ha,{r:y}),o.jsx("b",{style:{fontSize:13},children:k1((d.weights[y]||0)/b*100)})]},y))}),w?o.jsxs("div",{className:"muted",style:{fontWeight:800},children:["🔒 ",p?`Unlocks at level ${d.min_level}`:_?"Only during live events":`Needs a Secret Key (you have ${s.secret_keys}) — earn them from weekly missions and 7-day streaks`]}):o.jsxs("div",{className:"row",children:[f>0&&o.jsxs("button",{className:"btn good big grow",disabled:c,onClick:()=>rd(d.id,!0),children:["OPEN FREE (",f,")"]}),o.jsx("button",{className:"btn primary big grow",disabled:c||!v,onClick:()=>rd(d.id,!1),"data-testid":"open-"+d.id,children:v?"OPEN":`NEED ${ie(d.price-s.cash)}`})]})]},d.id)})]})}function k1(n){return n>=10?n.toFixed(0)+"%":n>=1?n.toFixed(1)+"%":n.toFixed(2)+"%"}const hh=["ALL","TECH","GAMING","CARS","FASHION","LUXURY","SPORTS"];function E1(){const n=U(B=>B.catalog),s=U(B=>B.me),u=U(B=>B.myItems),c=U(B=>B.panelArg),[d,f]=q.useState("ALL"),[p,_]=q.useState(null),[g,w]=q.useState(null),v=c?.playerId||s.id,b=u.length;q.useEffect(()=>{U.getState().backend?.rpc("stt_collection",v===s.id?{}:{player_id:v}).then(w).catch(()=>{})},[v,s.id,b]);const y=new Set((g?.discovered||[]).map(B=>B.item_id)),N=n.items.filter(B=>B.droppable||B.event_only),R=N.filter(B=>d==="ALL"||B.category===d).sort((B,we)=>it[B.rarity].tier-it[we.rarity].tier||B.base_value-we.base_value),G=B=>B.length?Math.round(B.filter(we=>y.has(we.id)).length/B.length*100):0,L=v===s.id,Y=B=>L?u.filter(we=>we.item_id===B).length:g?.owned?.[B]||0;return o.jsxs(Mt,{title:L?"COLLECTION":`${g?.username??""}'S COLLECTION`,icon:"🎒",children:[o.jsxs("div",{className:"card",children:[o.jsxs("div",{className:"row between",children:[o.jsxs("b",{style:{fontSize:18},children:[y.size,"/",N.length," discovered"]}),o.jsxs("b",{className:"gold-t display",style:{fontSize:22},children:[G(N),"%"]})]}),o.jsx("div",{className:"bar gold",style:{marginTop:8},children:o.jsx("i",{style:{width:G(N)+"%"}})}),o.jsx("div",{className:"grid three",style:{marginTop:10},children:hh.slice(1).map(B=>{const we=N.filter(je=>je.category===B);return o.jsxs("div",{className:"stat",style:{cursor:"pointer"},onClick:()=>f(B),children:[o.jsxs("div",{className:"k",children:[Xr[B]," ",B]}),o.jsxs("div",{className:"v",children:[G(we),"%"]})]},B)})})]}),L&&o.jsxs("div",{className:"card tight",children:[o.jsxs("div",{className:"row between wrap",children:[o.jsxs("b",{children:["🎯 Collection focus: ",s.focus]}),s.level<(n.rules.focus_level||5)&&o.jsxs("span",{className:"muted",children:["Unlocks at level ",n.rules.focus_level]})]}),o.jsx("div",{className:"muted",style:{fontWeight:700,margin:"4px 0 8px"},children:"Choose what your drops lean towards. Random keeps everything in play."}),o.jsx("div",{className:"row wrap",children:["RANDOM","TECH","GAMING","CARS","FASHION","LUXURY","SPORTS"].map(B=>o.jsxs("button",{className:"btn small "+(s.focus===B?"primary":""),disabled:B!=="RANDOM"&&s.level<(n.rules.focus_level||5),onClick:()=>a1(B).catch(()=>{}),children:[Xr[B]," ",B]},B))})]}),o.jsx(Xn,{value:d,onChange:f,tabs:hh.map(B=>({id:B,label:B==="ALL"?"ALL":`${Xr[B]} ${B}`}))}),p&&o.jsxs("div",{className:"card",children:[o.jsx(Lh,{id:p,owned:Y(p)}),o.jsxs("div",{className:"row",style:{marginTop:8},children:[o.jsx("button",{className:"btn primary",onClick:()=>Te("market",{item:p}),children:"📈 MARKET"}),o.jsx("button",{className:"btn ghost",onClick:()=>_(null),children:"CLOSE"})]})]}),o.jsx("div",{className:"grid items",children:R.map(B=>{const we=y.has(B.id);return o.jsx(sn,{id:B.id,unknown:!we,onClick:we?()=>_(B.id):void 0,badge:we&&Y(B.id)>0?o.jsxs("span",{className:"tag",children:["×",Y(B.id)]}):B.event_only?o.jsx("span",{className:"tag",children:"EVENT"}):null},B.id)})})]})}function A1(){const n=U(f=>f.panelArg),[s,u]=q.useState(n?.tab||"board"),[c,d]=q.useState(n?.item||null);return q.useEffect(()=>{n?.item&&d(n.item),n?.tab&&u(n.tab)},[n]),o.jsx(Mt,{title:"CENTRAL MARKET",icon:"📈",children:c?o.jsx(M1,{id:c,onBack:()=>d(null)}):o.jsxs(o.Fragment,{children:[o.jsx(Xn,{value:s,onChange:u,tabs:[{id:"board",label:"Price board"},{id:"deals",label:"Buy listings"},{id:"mine",label:"My listings"}]}),s==="board"&&o.jsx(C1,{onPick:d}),s==="deals"&&o.jsx(O1,{onPick:d}),s==="mine"&&o.jsx(R1,{onPick:d})]})})}function C1({onPick:n}){const s=U(y=>y.market),u=U(y=>y.catalog?.items??Ua),[c,d]=q.useState(""),[f,p]=q.useState("ALL"),[_,g]=q.useState("ALL"),[w,v]=q.useState("change"),b=q.useMemo(()=>{const y=c.trim().toLowerCase();return u.filter(N=>N.tradeable).filter(N=>(f==="ALL"||N.category===f)&&(_==="ALL"||N.rarity===_)&&(!y||N.name.toLowerCase().includes(y))).map(N=>({i:N,m:s[N.id]})).filter(N=>N.m).sort((N,R)=>w==="price"?R.m.price-N.m.price:w==="demand"?R.m.demand-N.m.demand:w==="name"?N.i.name.localeCompare(R.i.name):R.m.change_24h-N.m.change_24h)},[u,s,c,f,_,w]);return o.jsxs(o.Fragment,{children:[o.jsx("input",{className:"field",placeholder:"Search items…",value:c,onChange:y=>d(y.target.value)}),o.jsxs("div",{className:"row wrap",children:[o.jsxs("select",{className:"field",style:{width:"auto",flex:1},value:f,onChange:y=>p(y.target.value),children:[o.jsx("option",{value:"ALL",children:"All categories"}),["TECH","GAMING","CARS","FASHION","LUXURY","SPORTS"].map(y=>o.jsxs("option",{value:y,children:[Xr[y]," ",y]},y))]}),o.jsxs("select",{className:"field",style:{width:"auto",flex:1},value:_,onChange:y=>g(y.target.value),children:[o.jsx("option",{value:"ALL",children:"All rarities"}),Kr.map(y=>o.jsx("option",{value:y,children:it[y].label},y))]}),o.jsxs("select",{className:"field",style:{width:"auto",flex:1},value:w,onChange:y=>v(y.target.value),children:[o.jsx("option",{value:"change",children:"Top movers (24H)"}),o.jsx("option",{value:"price",children:"Highest price"}),o.jsx("option",{value:"demand",children:"Highest demand"}),o.jsx("option",{value:"name",children:"Name"})]})]}),o.jsxs("table",{className:"tbl",children:[o.jsx("thead",{children:o.jsxs("tr",{children:[o.jsx("th",{children:"ITEM"}),o.jsx("th",{style:{textAlign:"right"},children:"PRICE"}),o.jsx("th",{style:{textAlign:"right"},children:"24H"}),o.jsx("th",{style:{textAlign:"right"},children:"DEMAND"})]})}),o.jsx("tbody",{children:b.map(({i:y,m:N})=>{const R=xh(N.demand);return o.jsxs("tr",{className:"click",onClick:()=>n(y.id),children:[o.jsx("td",{children:o.jsxs("div",{className:"row",style:{gap:8},children:[o.jsx(Ht,{id:y.id,size:38}),o.jsxs("div",{style:{minWidth:0},children:[o.jsx("div",{style:{lineHeight:1.1},children:y.name}),o.jsx(Ha,{r:y.rarity}),y.max_supply?o.jsxs("span",{className:"supply",style:{marginLeft:4},children:[N.minted??0,"/",y.max_supply]}):null]})]})}),o.jsx("td",{style:{textAlign:"right"},className:"mono",children:We(N.price)}),o.jsx("td",{style:{textAlign:"right"},className:"mono "+(N.change_24h>0?"up":N.change_24h<0?"down":"flat"),children:vh(N.change_24h)}),o.jsx("td",{style:{textAlign:"right"},className:R.cls,children:R.label})]},y.id)})})]})]})}function O1({onPick:n}){const[s,u]=q.useState(null),c=U(f=>f.me),d=()=>F().backend?.rpc("stt_listings",{}).then(u).catch(()=>u([]));return q.useEffect(()=>{d();const f=window.setInterval(d,8e3);return()=>clearInterval(f)},[]),s?s.length?o.jsx("div",{className:"list",children:s.map(f=>{const p=rt(f.item_id);if(!p)return null;const _=f.market?f.price/f.market:1;return o.jsxs("div",{className:"li",children:[o.jsx(Ht,{id:p.id,size:48}),o.jsxs("div",{className:"grow",style:{cursor:"pointer"},onClick:()=>n(p.id),children:[o.jsxs("div",{className:"t1",children:[p.name,f.serial?` #${f.serial}`:""]}),o.jsxs("div",{className:"t2",children:[o.jsx(Ha,{r:p.rarity})," by ",f.seller,f.seller_bot?" 🤖":""," · ",_<.97?o.jsxs("span",{className:"good-t",children:[Math.round((1-_)*100),"% under market"]}):_>1.03?o.jsxs("span",{className:"bad-t",children:[Math.round((_-1)*100),"% over market"]}):"at market"]})]}),f.mine?o.jsx("button",{className:"btn small",onClick:()=>pd(f.id).then(d).catch(()=>{}),children:"CANCEL"}):o.jsx("button",{className:"btn small good",disabled:c.cash<f.price,onClick:()=>Uh(f.id,p.id,f.price).then(d).catch(()=>{}),children:We(f.price)})]},f.id)})}):o.jsx("div",{className:"empty",children:"No listings right now. Check back soon — traders list new stock all the time."}):o.jsx("div",{className:"empty",children:"Loading listings…"})}function R1({onPick:n}){const s=U(c=>c.last?.listings??Ua),u=U(c=>c.market);return s.length?o.jsx("div",{className:"list",children:s.map(c=>{const d=rt(c.item_id);return d?o.jsxs("div",{className:"li",children:[o.jsx(Ht,{id:d.id,size:48}),o.jsxs("div",{className:"grow",style:{cursor:"pointer"},onClick:()=>n(d.id),children:[o.jsx("div",{className:"t1",children:d.name}),o.jsxs("div",{className:"t2",children:["Listed ",ie(c.price)," · market ",ie(u[d.id]?.price)," · ",Yn(c.created_at)]})]}),o.jsx("button",{className:"btn small",onClick:()=>pd(c.id).catch(()=>{}),children:"CANCEL"})]},c.id):null})}):o.jsx("div",{className:"empty",children:"You have no active listings. Open an item in your BASE and tap SELL to list it."})}function M1({id:n,onBack:s}){const u=rt(n),c=U(Y=>Y.me),d=U(Y=>Y.myItems),f=q.useMemo(()=>d.filter(Y=>Y.item_id===n&&Y.location!=="listed"),[d,n]),[p,_]=q.useState("24H"),[g,w]=q.useState(null),[v,b]=q.useState(null),[y,N]=q.useState(null),R=()=>F().backend?.rpc("stt_market_item",{item_id:n,range:p}).then(w).catch(()=>{});q.useEffect(()=>{R();const Y=window.setInterval(R,1e4);return()=>clearInterval(Y)},[n,p]);const G=q.useMemo(()=>{if(!g)return[];const Y=g.history.map(B=>[B[0],B[1]]);return Y.push([Date.now()+F().serverOffset,g.price]),Y},[g]),L=g?xh(g.demand):null;return o.jsxs(o.Fragment,{children:[o.jsx("button",{className:"btn small ghost",style:{alignSelf:"flex-start"},onClick:s,children:"← ALL ITEMS"}),o.jsxs("div",{className:"row",children:[o.jsx(Ht,{id:n,size:84}),o.jsxs("div",{className:"grow",children:[o.jsx("div",{style:{fontWeight:900,fontSize:21,lineHeight:1.1},children:u.name}),o.jsx(Ha,{r:u.rarity})," ",o.jsxs("span",{className:"muted",style:{fontWeight:700},children:[u.category," · +",Gn(u.base_income)]}),g&&o.jsxs("div",{className:"row",style:{gap:12,marginTop:4},children:[o.jsx("span",{className:"display",style:{fontSize:26,fontWeight:900},children:ie(g.price)}),o.jsxs("span",{className:g.change_24h>=0?"up":"down",style:{fontWeight:900,fontSize:18},children:[vh(g.change_24h)," 24H"]})]})]})]}),o.jsx(Xn,{value:p,onChange:_,tabs:["1H","24H","7D","30D","ALL"].map(Y=>({id:Y,label:Y}))}),o.jsxs("div",{className:"card tight",children:[o.jsxs("div",{style:{fontWeight:800,fontSize:13,color:"#94a3b8",marginBottom:4},children:["PRICE — ",p]}),g?o.jsx(s1,{points:G}):o.jsx("div",{className:"empty",children:"Loading…"})]}),g&&o.jsxs("div",{className:"stats",children:[o.jsx(De,{k:"Base price",v:We(u.base_value)}),o.jsx(De,{k:"Current",v:We(g.price)}),o.jsx(De,{k:"Demand",v:o.jsx("span",{className:L.cls,children:L.label})}),o.jsx(De,{k:"Supply",v:u.max_supply?`${g.minted??0}/${u.max_supply}`:g.supply}),o.jsx(De,{k:"Owners",v:g.owners}),o.jsx(De,{k:"Listed",v:g.listed}),o.jsx(De,{k:"Sales 24H",v:g.volume_24h}),o.jsx(De,{k:"You own",v:g.mine})]}),o.jsx("h3",{children:"Listings"}),g?g.listings.length===0?o.jsx("div",{className:"empty",style:{padding:12},children:"No one is selling this right now."}):o.jsx("div",{className:"list",children:g.listings.map(Y=>o.jsxs("div",{className:"li",children:[o.jsxs("div",{className:"grow",children:[o.jsxs("div",{className:"t1",children:[ie(Y.price)," ",Y.serial?o.jsxs("span",{className:"supply",children:["#",Y.serial]}):null]}),o.jsxs("div",{className:"t2",children:[o.jsx(lo,{id:Y.seller_id,name:Y.seller,bot:Y.seller_bot})," · ",Yn(Y.created_at)]})]}),Y.mine?o.jsx("button",{className:"btn small",onClick:()=>pd(Y.id).then(R).catch(()=>{}),children:"CANCEL"}):o.jsx("button",{className:"btn good small",disabled:c.cash<Y.price,onClick:()=>N(Y),children:"BUY"})]},Y.id))}):null,y&&o.jsxs("div",{className:"card",style:{borderColor:"#4ade80"},children:[o.jsxs("b",{children:["Buy ",u.name," for ",ie(y.price),"?"]}),o.jsxs("div",{className:"muted",style:{fontWeight:700,margin:"4px 0 10px"},children:["Seller: ",y.seller,". You'll have ",ie(c.cash-y.price)," left."]}),o.jsx(ao,{className:"btn good big block",onConfirm:()=>{Uh(y.id,u.id,y.price).then(()=>{N(null),R()}).catch(()=>N(null))},children:"HOLD TO BUY"}),o.jsx("button",{className:"btn block ghost",style:{marginTop:6},onClick:()=>N(null),children:"CANCEL"})]}),o.jsx("h3",{children:"Sell yours"}),f.length===0?o.jsx("div",{className:"muted",style:{fontWeight:700},children:"You don't own this item."}):o.jsxs("div",{className:"col",children:[o.jsx("div",{className:"row wrap",children:f.map(Y=>o.jsxs("button",{className:"btn small "+(v===Y.id?"primary":""),onClick:()=>b(Y.id),children:[Y.location.toUpperCase(),Y.serial?` #${Y.serial}`:""]},Y.id))}),v&&f.find(Y=>Y.id===v)&&o.jsx(Hh,{pi:f.find(Y=>Y.id===v),onDone:()=>{b(null),R()}})]}),o.jsx("h3",{children:"Recent sales"}),g&&g.sales.length===0&&o.jsx("div",{className:"muted",children:"No recent sales."}),g&&g.sales.length>0&&o.jsx("table",{className:"tbl",children:o.jsx("tbody",{children:g.sales.map((Y,B)=>o.jsxs("tr",{children:[o.jsx("td",{className:"mono",children:ie(Y.price)}),o.jsx("td",{className:"muted",children:Y.kind==="quick_sell"?"Quick sell":`${Y.seller??"?"} → ${Y.buyer??"?"}`}),o.jsx("td",{className:"dim",style:{textAlign:"right"},children:Yn(Y.at)})]},B))})})]})}function z1(){const n=U(p=>p.last?.revenge||0),[s,u]=q.useState(n?"revenge":"targets"),c=U(p=>p.me),d=on(1e3),f=c.raid_cooldown_until?Ye(c.raid_cooldown_until)-d:0;return o.jsxs(Mt,{title:"RAID BOARD",icon:"🥷",children:[o.jsxs("div",{className:"card tight",style:{background:"rgba(244,63,94,0.08)"},children:[o.jsx("b",{children:"Pick a target. Is the reward worth the risk?"}),o.jsx("div",{className:"muted",style:{fontWeight:700},children:"Higher security = lower odds and longer steals. Owners get warned and can sound the alarm or vault the item. Fail and you pay a small fine and lay low."}),f>0&&o.jsxs("div",{className:"bad-t",style:{fontWeight:900,marginTop:4},children:["⏳ Laying low — next raid in ",xt(f)]})]}),o.jsx(Xn,{value:s,onChange:u,tabs:[{id:"targets",label:"Targets"},{id:"revenge",label:"Revenge",badge:n},{id:"history",label:"History"}]}),s==="targets"&&o.jsx(q1,{}),s==="revenge"&&o.jsx(D1,{}),s==="history"&&o.jsx($1,{})]})}function q1(){const[n,s]=q.useState("recommended"),[u,c]=q.useState(null),d=on(5e3);return q.useEffect(()=>{F().backend?.rpc("stt_raid_targets",{sort:n}).then(c).catch(()=>c([]))},[n,d]),o.jsxs(o.Fragment,{children:[o.jsx("div",{className:"row wrap",children:["recommended","value","security"].map(f=>o.jsx("button",{className:"btn small "+(n===f?"primary":""),onClick:()=>s(f),children:f==="recommended"?"Near my level":f==="value"?"Richest bases":"Weakest security"},f))}),u?o.jsx("div",{className:"list",children:u.map(f=>{const p=f.shield_until&&Ye(f.shield_until)>Date.now(),_=f.protected||p&&!f.revenge||f.shown===0;return o.jsxs("div",{className:"li",style:f.revenge?{borderColor:"#f43f5e"}:void 0,children:[o.jsxs("div",{className:"grow",children:[o.jsxs("div",{className:"t1",children:[o.jsx(lo,{id:f.id,name:f.username,bot:f.is_bot,level:f.level}),f.online&&!f.is_bot&&o.jsx("span",{className:"tag online",style:{marginLeft:6},children:"ONLINE"}),f.revenge&&o.jsx("span",{className:"tag",style:{marginLeft:6,color:"#fda4af"},children:"⚔️ REVENGE"})]}),o.jsxs("div",{className:"t2",children:["Base ",o.jsx("b",{className:"good-t",children:We(f.base_value)})," · Security ",o.jsxs("b",{children:["L",f.security_level]})," ",f.security_name]}),f.top_item&&o.jsxs("div",{className:"t2 row",style:{gap:6},children:[o.jsx(Ht,{id:f.top_item.item_id,size:26})," Top item: ",rt(f.top_item.item_id)?.name," (",We(f.top_item.price),")"]}),f.protected&&o.jsx("div",{className:"t2",children:"🐣 New-player protection"}),p&&o.jsxs("div",{className:"t2",children:["🛡️ Shielded ",xt(Ye(f.shield_until)-Date.now()),f.revenge?" (revenge ignores it)":""]})]}),o.jsx("button",{className:"btn hot",disabled:!!_,onClick:()=>ci(f.id,f.revenge),children:"RAID"})]},f.id)})}):o.jsx("div",{className:"empty",children:"Scouting targets…"})]})}function D1(){const[n,s]=q.useState(null);return q.useEffect(()=>{F().backend?.rpc("stt_revenge").then(s).catch(()=>s([]))},[]),n?n.length?o.jsx("div",{className:"list",children:n.map(u=>o.jsxs("div",{className:"li",style:{borderColor:"#f43f5e"},children:[o.jsx(Ht,{id:u.item_id,size:48}),o.jsxs("div",{className:"grow",children:[o.jsxs("div",{className:"t1",children:["🚨 ",u.attacker,u.attacker_bot?" 🤖":""," stole your ",rt(u.item_id)?.name]}),o.jsxs("div",{className:"t2",children:[Yn(u.resolved_at)," · ",u.on_display?"It's on display in their base!":u.still_theirs?"They're hiding it in storage.":"They got rid of it."," · revenge expires in ",xt(Ye(u.expires_at)-Date.now())]})]}),o.jsx("button",{className:"btn hot",onClick:()=>ci(u.attacker_id,!0),children:"REVENGE"})]},u.raid_id))}):o.jsx("div",{className:"empty",children:"Nobody has robbed you in the last 24 hours. Keep it that way — upgrade security!"}):o.jsx("div",{className:"empty",children:"Loading…"})}function $1(){const[n,s]=q.useState(null);return q.useEffect(()=>{F().backend?.rpc("stt_activity").then(u=>s(u.raids)).catch(()=>s([]))},[]),n?n.length?o.jsx("div",{className:"list",children:n.map(u=>o.jsxs("div",{className:"li",children:[o.jsx(Ht,{id:u.item_id,size:40}),o.jsxs("div",{className:"grow",children:[o.jsxs("div",{className:"t1",children:[u.mine?`You → ${u.defender}`:`${u.attacker} → you`," ",o.jsx("span",{className:u.status==="success"?u.mine?"good-t":"bad-t":u.mine?"bad-t":"good-t",children:u.status==="success"?"STOLEN":u.status==="active"?"IN PROGRESS":u.status==="blocked"?"BLOCKED":"FAILED"})]}),o.jsxs("div",{className:"t2",children:[rt(u.item_id)?.name," · ",Yn(u.at),u.fine?` · fine ${ie(u.fine)}`:"",u.defended?" · alarm":""]})]})]},u.id))}):o.jsx("div",{className:"empty",children:"No raids yet."}):o.jsx("div",{className:"empty",children:"Loading…"})}function U1(){const n=U(N=>N.panelArg)||{},s=U(N=>N.me),u=U(N=>N.steal),[c,d]=q.useState(null),[f,p]=q.useState(null),_=on(4e3),g=n.playerId;if(q.useEffect(()=>{if(g){if(g===s.id){Te("base");return}F().backend?.rpc("stt_base",{player_id:g}).then(d).catch(N=>p(String(N.message)))}},[g,_,u?.result]),q.useEffect(()=>{g&&pe({focusPlot:g})},[g]),!g)return null;if(f)return o.jsx(Mt,{title:"BASE",icon:"🥷",children:o.jsx("div",{className:"empty",children:f})});if(!c)return o.jsx(Mt,{title:"VISITING…",icon:"🥷",children:o.jsx("div",{className:"empty",children:"Walking over…"})});const w=c.shield_until&&Ye(c.shield_until)>Date.now(),v=!!n.revenge||c.revenge_available,b=!!u&&!u.result,y=s.raid_cooldown_until?Ye(s.raid_cooldown_until)-Date.now():0;return o.jsxs(Mt,{title:`${c.username.toUpperCase()}'S BASE`,icon:c.is_bot?"🤖":"🥷",children:[o.jsxs("div",{className:"row wrap",children:[o.jsx(lo,{id:c.id,name:c.username,bot:c.is_bot,level:c.level}),c.online&&!c.is_bot&&o.jsx("span",{className:"tag online",children:"ONLINE — they'll see you coming"}),c.prestige>0&&o.jsxs("span",{className:"tag",children:["P",c.prestige]})]}),c.bio&&o.jsxs("div",{className:"muted",style:{fontStyle:"italic"},children:["“",c.bio,"”"]}),o.jsxs("div",{className:"stats",children:[o.jsx(De,{k:"Base value",v:We(c.base_value),cls:"good-t"}),o.jsx(De,{k:"Income",v:Gn(c.income)}),o.jsx(De,{k:"Security",v:`L${c.security_level}`}),o.jsx(De,{k:"Vault",v:`${c.vault_used} locked`})]}),o.jsxs("div",{className:"card tight",children:[o.jsxs("b",{children:["🔐 ",c.security_name]}),o.jsx("div",{className:"muted",style:{fontWeight:700},children:c.raid_block?`⛔ ${c.raid_block}`:v?"⚔️ REVENGE: +15% odds, faster steals, ignores shields.":w?"🛡️ Shielded.":"Open for business. Choose wisely."}),y>0&&o.jsxs("div",{className:"bad-t",style:{fontWeight:800},children:["⏳ You're laying low for ",xt(y),"."]})]}),o.jsxs("div",{className:"row wrap",children:[o.jsx("button",{className:"btn small grow",onClick:()=>Te("trade",{tab:"new",with:c.id}),children:"🤝 TRADE"}),o.jsx("button",{className:"btn small grow",onClick:()=>Te("profile",{playerId:c.id}),children:"👤 PROFILE"}),o.jsx("button",{className:"btn small grow",onClick:()=>Te("collection",{playerId:c.id}),children:"🎒 COLLECTION"})]}),o.jsxs("h3",{children:["On display (",c.items.length,"/",c.slots,")"]}),c.items.length===0?o.jsx("div",{className:"empty",children:"Nothing on display. Smart… or broke."}):o.jsx("div",{className:"grid items",children:[...c.items].sort((N,R)=>Tn(R.item_id)-Tn(N.item_id)).map(N=>{if(!rt(N.item_id))return null;const G=N.soulbound||N.under_raid||!!c.raid_block||b||y>0;return o.jsx(sn,{id:N.item_id,serial:N.serial,badge:N.under_raid?o.jsx("span",{className:"tag",children:"🚨 BEING STOLEN"}):N.soulbound?o.jsx("span",{className:"tag",children:"★ SAFE"}):null,footer:!N.soulbound&&o.jsxs("div",{className:"col",style:{gap:4,marginTop:6,position:"relative",zIndex:2},children:[o.jsxs("div",{className:"muted",style:{fontSize:12,fontWeight:800},children:[Math.round((N.chance??0)*100),"% · ",N.seconds,"s"]}),o.jsx("button",{className:"btn hot small block",disabled:G,"data-testid":"steal",onClick:L=>{L.stopPropagation(),Dh(N.id,v).catch(()=>{})},children:"🥷 STEAL"})]})},N.id)})}),o.jsx("div",{className:"dim",style:{fontSize:13},children:"Odds shown are before the owner reacts. An alarm cuts them by 70%."})]})}function L1(){const n=U(b=>b.panelArg)||{},s=U(b=>b.last?.trades.incoming||0),[u,c]=q.useState(n.tab||(s?"incoming":"new")),[d,f]=q.useState(null),p=on(5e3),_=()=>F().backend?.rpc("stt_trades").then(f).catch(()=>f([]));q.useEffect(()=>{_()},[p,s]),q.useEffect(()=>{n.tab&&c(n.tab)},[n.tab]);const g=(d||[]).filter(b=>b.status==="pending"&&b.incoming),w=(d||[]).filter(b=>b.status==="pending"&&!b.incoming),v=(d||[]).filter(b=>b.status!=="pending");return o.jsxs(Mt,{title:"TRADE HUB",icon:"🤝",children:[o.jsx(Xn,{value:u,onChange:c,tabs:[{id:"incoming",label:"Incoming",badge:g.length},{id:"outgoing",label:"Outgoing",badge:0},{id:"new",label:"New trade"},{id:"history",label:"History"}]}),u==="incoming"&&(g.length?g.map(b=>o.jsx(nd,{t:b,onDone:_},b.id)):o.jsx("div",{className:"empty",children:"No offers waiting. Show off something good and they'll come."})),u==="outgoing"&&(w.length?w.map(b=>o.jsx(nd,{t:b,onDone:_},b.id)):o.jsx("div",{className:"empty",children:"No open offers."})),u==="new"&&o.jsx(H1,{initialWith:n.with,onSent:()=>{_(),c("outgoing")}}),u==="history"&&(v.length?v.map(b=>o.jsx(nd,{t:b,onDone:_},b.id)):o.jsx("div",{className:"empty",children:"No trades yet."}))]})}function eo({title:n,items:s,cash:u}){return o.jsxs("div",{className:"card tight grow",style:{minWidth:0},children:[o.jsx("div",{className:"muted",style:{fontWeight:900,fontSize:12,letterSpacing:"0.1em"},children:n}),o.jsxs("div",{className:"row wrap",style:{gap:6,marginTop:6},children:[s.map(c=>o.jsxs("div",{title:rt(c.item_id)?.name,style:{opacity:c.available===!1?.35:1,textAlign:"center",width:64},children:[o.jsx(Ht,{id:c.item_id,size:52}),o.jsx("div",{style:{fontSize:11,fontWeight:800,lineHeight:1.05},children:rt(c.item_id)?.name.slice(0,18)})]},c.id)),u>0&&o.jsxs("div",{className:"good-t",style:{fontWeight:900,fontSize:18},children:["+ ",ie(u)]}),!s.length&&!u&&o.jsx("div",{className:"dim",children:"nothing"})]})]})}function od({give:n,get:s}){const u=n+s===0?.5:s/(n+s);return o.jsxs("div",{children:[o.jsxs("div",{className:"row between",style:{fontWeight:800,fontSize:13},children:[o.jsxs("span",{className:"muted",children:["You give ",We(n)]}),o.jsx("span",{className:s>=n?"good-t":"bad-t",children:s>=n?"In your favour":"Against you"}),o.jsxs("span",{className:"muted",children:["You get ",We(s)]})]}),o.jsx("div",{className:"fair",style:{marginTop:6},children:o.jsx("i",{style:{left:`${u*100}%`}})})]})}function nd({t:n,onDone:s}){const[u,c]=q.useState(!1),[d,f]=q.useState(!1),p=U(v=>v.me),_=n.incoming?n.request_value:n.offer_value,g=n.incoming?n.offer_value:n.request_value,w=n.incoming?{id:n.from_id,name:n.from,bot:n.from_bot}:{id:n.to_id,name:n.to,bot:n.to_bot};return o.jsxs("div",{className:"card",style:n.status==="pending"&&n.incoming?{borderColor:"#22d3ee"}:void 0,children:[o.jsxs("div",{className:"row between",children:[o.jsxs("div",{children:[n.incoming?"From ":"To ",o.jsx(lo,{id:w.id,name:w.name,bot:w.bot})]}),o.jsx("span",{className:"tag",style:{color:n.status==="accepted"?"#86efac":n.status==="pending"?"#67e8f9":"#fda4af"},children:n.status})]}),n.message&&o.jsxs("div",{className:"muted",style:{fontStyle:"italic",margin:"6px 0"},children:["“",n.message,"”"]}),o.jsxs("div",{className:"row",style:{alignItems:"stretch",marginTop:6},children:[o.jsx(eo,{title:n.incoming?"THEY GIVE YOU":"YOU GIVE",items:n.offer_items,cash:n.offer_cash}),o.jsx("div",{style:{alignSelf:"center",fontSize:22},children:"⇄"}),o.jsx(eo,{title:n.incoming?"YOU GIVE":"YOU GET",items:n.request_items,cash:n.request_cash})]}),o.jsx("div",{style:{marginTop:10},children:o.jsx(od,{give:_,get:g})}),n.note&&o.jsx("div",{className:"muted",style:{marginTop:6,fontWeight:700},children:n.note}),o.jsx("div",{className:"dim",style:{fontSize:12,marginTop:4},children:Yn(n.created_at)}),n.status==="pending"&&n.incoming&&!u&&o.jsxs("div",{className:"row",style:{marginTop:10},children:[o.jsx("button",{className:"btn grow",disabled:d,onClick:async()=>{f(!0);try{await fh(n.id,!1),s()}finally{f(!1)}},children:"DECLINE"}),o.jsx("button",{className:"btn good grow",disabled:d||p.cash<n.request_cash,onClick:()=>c(!0),children:"REVIEW & ACCEPT"})]}),u&&o.jsxs("div",{className:"card",style:{marginTop:10,borderColor:"#4ade80",background:"rgba(74,222,128,0.06)"},children:[o.jsx("b",{style:{fontSize:18},children:"FINAL CONFIRMATION"}),o.jsxs("div",{className:"muted",style:{fontWeight:700,margin:"6px 0 10px"},children:["You give ",n.request_items.length," item(s)",n.request_cash?` + ${ie(n.request_cash)}`:""," and receive ",n.offer_items.length," item(s)",n.offer_cash?` + ${ie(n.offer_cash)}`:"",". This can't be undone."]}),o.jsx(ao,{className:"btn good big block",onConfirm:async()=>{f(!0);try{await fh(n.id,!0)}catch{}finally{f(!1),c(!1),s()}},children:"HOLD TO ACCEPT"}),o.jsx("button",{className:"btn ghost block",style:{marginTop:6},onClick:()=>c(!1),children:"BACK"})]}),n.status==="pending"&&!n.incoming&&o.jsx("button",{className:"btn block",style:{marginTop:10},onClick:()=>Fv(n.id).then(s).catch(()=>{}),children:"CANCEL OFFER"})]})}function H1({initialWith:n,onSent:s}){const u=U(Z=>Z.me),c=U(Z=>Z.myItems),[d,f]=q.useState(null),[p,_]=q.useState(n||null),[g,w]=q.useState(null),[v,b]=q.useState([]),[y,N]=q.useState([]),[R,G]=q.useState(""),[L,Y]=q.useState(""),[B,we]=q.useState(""),[je,H]=q.useState(!1),[ce,Q]=q.useState("");q.useEffect(()=>{F().backend?.rpc("stt_raid_targets",{sort:"value"}).then(f).catch(()=>f([]))},[]),q.useEffect(()=>{w(null),N([]),p&&F().backend?.rpc("stt_base",{player_id:p}).then(w).catch(()=>{})},[p]);const ue=q.useMemo(()=>c.filter(Z=>!Z.soulbound&&Z.location!=="listed"&&!(Z.hot_until&&Ye(Z.hot_until)>Date.now())&&rt(Z.item_id)?.tradeable).sort((Z,Se)=>Tn(Se.item_id)-Tn(Z.item_id)),[c]),et=(Z,Se,te)=>Se(Z.includes(te)?Z.filter(X=>X!==te):Z.length>=8?Z:[...Z,te]),D=v.reduce((Z,Se)=>Z+Tn(c.find(te=>te.id===Se)?.item_id||""),0)+(Number(R)||0),P=y.reduce((Z,Se)=>Z+Tn(g?.items.find(te=>te.id===Se)?.item_id||""),0)+(Number(L)||0),J=p&&(v.length||y.length)&&(Number(R)||0)<=u.cash;if(!p){const Z=(d||[]).filter(Se=>!ce||Se.username.toLowerCase().includes(ce.toLowerCase()));return o.jsxs(o.Fragment,{children:[o.jsx("div",{className:"muted",style:{fontWeight:700},children:"Who do you want to trade with? NPC traders answer in seconds; real players get a notification."}),o.jsx("input",{className:"field",placeholder:"Search players…",value:ce,onChange:Se=>Q(Se.target.value)}),d?o.jsx("div",{className:"list",children:Z.map(Se=>o.jsxs("div",{className:"li click",onClick:()=>_(Se.id),children:[o.jsxs("div",{className:"grow",children:[o.jsxs("div",{className:"t1",children:[Se.username," ",Se.is_bot&&o.jsx("span",{className:"tag bot",children:"NPC"})," ",Se.online&&!Se.is_bot&&o.jsx("span",{className:"tag online",children:"ONLINE"})]}),o.jsxs("div",{className:"t2",children:["Lv ",Se.level," · base ",We(Se.base_value)," · ",Se.shown," items on display"]})]}),o.jsx("span",{className:"btn small",children:"CHOOSE"})]},Se.id))}):o.jsx("div",{className:"empty",children:"Loading…"})]})}if(je){const Z=v.map(te=>c.find(X=>X.id===te)).filter(Boolean),Se=y.map(te=>g?.items.find(X=>X.id===te)).filter(Boolean);return o.jsxs("div",{className:"col",children:[o.jsx("b",{style:{fontSize:20},children:"FINAL CONFIRMATION"}),o.jsxs("div",{className:"muted",style:{fontWeight:700},children:["Sending this offer to ",g?.username,". Nothing moves until they accept too — and if anything changes hands in the meantime, the trade safely fails."]}),o.jsxs("div",{className:"row",style:{alignItems:"stretch"},children:[o.jsx(eo,{title:"YOU GIVE",items:Z.map(te=>({id:te.id,item_id:te.item_id,serial:te.serial})),cash:Number(R)||0}),o.jsx("div",{style:{alignSelf:"center",fontSize:22},children:"⇄"}),o.jsx(eo,{title:"YOU GET",items:Se.map(te=>({id:te.id,item_id:te.item_id,serial:te.serial})),cash:Number(L)||0})]}),o.jsx(od,{give:D,get:P}),o.jsx(ao,{className:"btn primary big block",onConfirm:()=>Wv({to:p,offer_items:v,offer_cash:Number(R)||0,request_items:y,request_cash:Number(L)||0,message:B}).then(()=>{b([]),N([]),G(""),Y(""),H(!1),s()}).catch(()=>H(!1)),children:"HOLD TO SEND OFFER"}),o.jsx("button",{className:"btn block",onClick:()=>H(!1),children:"EDIT"})]})}return o.jsxs("div",{className:"col",children:[o.jsxs("div",{className:"row between",children:[o.jsxs("b",{children:["Trading with ",g?.username??"…"," ",g?.is_bot&&o.jsx("span",{className:"tag bot",children:"NPC"})]}),o.jsx("button",{className:"btn small ghost",onClick:()=>_(null),children:"CHANGE"})]}),o.jsx("h3",{children:"You offer"}),ue.length===0?o.jsx("div",{className:"muted",children:"You have nothing tradeable yet."}):o.jsx("div",{className:"grid items",children:ue.map(Z=>o.jsx(sn,{id:Z.item_id,serial:Z.serial,selected:v.includes(Z.id),onClick:()=>et(v,b,Z.id),showIncome:!1,badge:Z.location==="vault"?o.jsx("span",{className:"tag",children:"🔒"}):null},Z.id))}),o.jsx("input",{className:"field",inputMode:"numeric",placeholder:`+ cash (you have ${ie(u.cash)})`,value:R,onChange:Z=>G(Z.target.value.replace(/[^0-9]/g,""))}),o.jsx("h3",{children:"You request"}),g?g.items.filter(Z=>!Z.soulbound).length===0?o.jsx("div",{className:"muted",children:"They have nothing on display to trade."}):o.jsx("div",{className:"grid items",children:g.items.filter(Z=>!Z.soulbound).map(Z=>o.jsx(sn,{id:Z.item_id,serial:Z.serial,selected:y.includes(Z.id),onClick:()=>et(y,N,Z.id),showIncome:!1},Z.id))}):o.jsx("div",{className:"empty",children:"Loading their base…"}),o.jsx("input",{className:"field",inputMode:"numeric",placeholder:"+ cash you want from them",value:L,onChange:Z=>Y(Z.target.value.replace(/[^0-9]/g,""))}),o.jsx("textarea",{className:"field",maxLength:140,placeholder:"Message (optional)",value:B,onChange:Z=>we(Z.target.value)}),o.jsx(od,{give:D,get:P}),o.jsx("button",{className:"btn primary big block",disabled:!J,onClick:()=>H(!0),children:"REVIEW OFFER"})]})}const _h=[{id:"richest",label:"💵 Richest",fmt:n=>ie(n)},{id:"base_value",label:"🏠 Base value",fmt:n=>ie(n)},{id:"items",label:"📦 Most items",fmt:n=>n+" items"},{id:"secrets",label:"🕳️ Secrets",fmt:n=>n+" secret"+(n===1?"":"s")},{id:"raids",label:"🥷 Raids won",fmt:n=>n+" steals"},{id:"trades",label:"🤝 Trades",fmt:n=>n+" trades"},{id:"level",label:"⭐ Level",fmt:(n,s)=>`Lv ${s.level}${s.prestige?` · P${s.prestige}`:""}`},{id:"collection",label:"🎒 Collection",fmt:n=>n+" found"}];function Y1(){const[n,s]=q.useState("base_value"),[u,c]=q.useState(null),d=on(15e3);q.useEffect(()=>{F().backend?.rpc("stt_leaderboard",{kind:n}).then(c).catch(()=>{})},[n,d]);const f=_h.find(p=>p.id===n);return o.jsxs(Mt,{title:"LEADERBOARDS",icon:"🏆",children:[o.jsx(Xn,{value:n,onChange:s,tabs:_h.map(p=>({id:p.id,label:p.label}))}),u?o.jsxs(o.Fragment,{children:[u.me&&o.jsxs("div",{className:"li me",children:[o.jsxs("div",{className:"rank",children:["#",u.me.rank]}),o.jsx("div",{className:"grow",children:o.jsx("div",{className:"t1",children:"You"})}),o.jsx("b",{className:"mono",children:f.fmt(Number(u.me.score),u.me)})]}),o.jsx("div",{className:"list",children:u.rows.map(p=>o.jsxs("div",{className:"li click"+(p.me?" me":""),onClick:()=>Te("profile",{playerId:p.id}),children:[o.jsx("div",{className:"rank r"+p.rank,children:p.rank<=3?["🥇","🥈","🥉"][p.rank-1]:p.rank}),o.jsx("div",{className:"avatar-dot",style:{width:34,height:34,fontSize:15,background:`hsl(${fl(p.id)},70%,55%)`},children:p.username[0]}),o.jsxs("div",{className:"grow",children:[o.jsxs("div",{className:"t1",children:[p.username," ",p.is_bot&&o.jsx("span",{className:"tag bot",children:"NPC"})]}),o.jsxs("div",{className:"t2",children:["Lv ",p.level,p.prestige?` · Prestige ${p.prestige}`:""]})]}),o.jsx("b",{className:"mono",children:f.fmt(Number(p.score),p)})]},p.id))})]}):o.jsx("div",{className:"empty",children:"Loading…"})]})}function B1(){const n=U(v=>v.panelArg)||{},s=U(v=>v.me),u=n.playerId||s.id,c=u===s.id,[d,f]=q.useState("profile"),[p,_]=q.useState(null),g=on(1e4);if(q.useEffect(()=>{F().backend?.rpc("stt_profile",c?{}:{player_id:u}).then(_).catch(()=>{})},[u,g,s.level,s.owned_cosmetics.length]),q.useEffect(()=>f("profile"),[u]),!p)return o.jsx(Mt,{title:"PROFILE",icon:"👤",children:o.jsx("div",{className:"empty",children:"Loading…"})});const w=[{id:"profile",label:"Profile"},{id:"achievements",label:"Achievements"},...c?[{id:"style",label:"Cosmetics"},{id:"prestige",label:"Prestige"},{id:"activity",label:"Activity"}]:[]];return o.jsxs(Mt,{title:c?"MY PROFILE":"PLAYER",icon:"👤",children:[o.jsxs("div",{className:"row",children:[o.jsxs("div",{className:"avatar-dot",style:{width:64,height:64,fontSize:28,background:`hsl(${fl(p.id)},70%,55%)`},children:[p.username[0].toUpperCase(),o.jsx("span",{className:"lvl",children:p.level})]}),o.jsxs("div",{className:"grow",children:[o.jsxs("div",{style:{fontWeight:900,fontSize:24,lineHeight:1.1},children:[p.username," ",p.is_bot&&o.jsx("span",{className:"tag bot",children:"NPC"})]}),o.jsxs("div",{className:"muted",style:{fontWeight:800},children:[p.title," · Level ",p.level,p.prestige?` · ✨ Prestige ${p.prestige}`:""]}),o.jsxs("div",{className:"row",style:{gap:6,marginTop:4},children:[p.online&&o.jsx("span",{className:"tag online",children:"ONLINE"}),p.protected&&o.jsx("span",{className:"tag",children:"🐣 PROTECTED"}),p.shield_until&&Ye(p.shield_until)>Date.now()&&o.jsx("span",{className:"tag",children:"🛡️ SHIELDED"})]})]})]}),p.bio&&o.jsxs("div",{className:"muted",style:{fontStyle:"italic"},children:["“",p.bio,"”"]}),!c&&o.jsxs("div",{className:"row wrap",children:[o.jsx("button",{className:"btn grow",onClick:()=>ci(p.id),children:"🏠 VISIT BASE"}),o.jsx("button",{className:"btn grow",onClick:()=>Te("trade",{tab:"new",with:p.id}),children:"🤝 TRADE"}),o.jsx("button",{className:"btn hot grow",onClick:()=>ci(p.id),children:"🥷 RAID"}),o.jsx("button",{className:"btn grow",onClick:()=>Te("collection",{playerId:p.id}),children:"🎒 COLLECTION"})]}),o.jsx(Xn,{value:d,onChange:f,tabs:w}),d==="profile"&&o.jsx(G1,{p}),d==="achievements"&&o.jsx(X1,{p}),d==="style"&&c&&o.jsx(I1,{}),d==="prestige"&&c&&o.jsx(Q1,{}),d==="activity"&&c&&o.jsx(Z1,{})]})}function G1({p:n}){return o.jsxs(o.Fragment,{children:[o.jsxs("div",{className:"stats",children:[o.jsx(De,{k:"Base value",v:We(n.base_value),cls:"good-t"}),o.jsx(De,{k:"Income",v:Gn(n.income)}),o.jsx(De,{k:"Collection",v:`${Math.round(n.collection/Math.max(1,n.collection_total)*100)}%`}),o.jsx(De,{k:"Legendary+",v:n.rare_items}),o.jsx(De,{k:"Secrets",v:n.secrets.length}),o.jsx(De,{k:"Steals",v:n.stats.steals_won??0}),o.jsx(De,{k:"Defended",v:n.stats.raids_defended??0}),o.jsx(De,{k:"Trades",v:n.stats.trades_done??0}),o.jsx(De,{k:"Drops opened",v:n.stats.drops_opened??0}),o.jsx(De,{k:"Base / Security",v:`L${n.base_level} / L${n.security_level}`})]}),n.secrets.length>0&&o.jsxs(o.Fragment,{children:[o.jsx("h3",{children:"🕳️ Secret items"}),o.jsx("div",{className:"grid items",children:n.secrets.map((s,u)=>o.jsx(sn,{id:s.item_id,serial:s.serial},u))})]}),o.jsx("h3",{children:"Showcase"}),n.showcase.length===0?o.jsx("div",{className:"muted",children:"Nothing on display."}):o.jsx("div",{className:"grid items",children:n.showcase.map((s,u)=>o.jsx(sn,{id:s.item_id,serial:s.serial},u))}),o.jsx("h3",{children:"Recent achievements"}),n.achievements.length===0?o.jsx("div",{className:"muted",children:"None yet."}):o.jsx("div",{className:"row wrap",children:n.achievements.slice(0,8).map(s=>o.jsxs("span",{className:"tag",style:{fontSize:13,padding:"4px 10px"},children:[s.icon," ",s.title]},s.id))}),o.jsxs("div",{className:"dim",style:{fontSize:13},children:["Joined ",Yn(n.created_at)]})]})}function X1({p:n}){const s=U(c=>c.catalog?.achievements??Ua),u=new Map(n.achievements.map(c=>[c.id,c]));return o.jsxs(o.Fragment,{children:[o.jsxs("div",{className:"muted",style:{fontWeight:700},children:[u.size,"/",s.length," unlocked"]}),o.jsx("div",{className:"list",children:s.map(c=>{const d=u.get(c.id);return o.jsxs("div",{className:"li",style:{opacity:d?1:.5},children:[o.jsx("div",{style:{fontSize:28,filter:d?"none":"grayscale(1)"},children:c.icon}),o.jsxs("div",{className:"grow",children:[o.jsx("div",{className:"t1",children:c.title}),o.jsxs("div",{className:"t2",children:[c.description,c.reward_cash?` · ${ie(c.reward_cash)}`:"",c.xp?` · ${c.xp} XP`:""]})]}),d?o.jsxs("span",{className:"tag online",children:["✓ ",Yn(d.unlocked_at)]}):o.jsx("span",{className:"tag",children:"LOCKED"})]},c.id)})})]})}const V1=[{id:"theme",label:"Base theme"},{id:"floor",label:"Floor"},{id:"lighting",label:"Lighting"},{id:"platform",label:"Display platforms"},{id:"item_fx",label:"Item animation"},{id:"trail",label:"Player trail"},{id:"nameplate",label:"Nameplate"},{id:"emote",label:"Emotes"},{id:"wall",label:"Walls"}];function I1(){const n=U(u=>u.me),s=U(u=>u.catalog?.cosmetics??Ua);return o.jsxs(o.Fragment,{children:[o.jsx("div",{className:"muted",style:{fontWeight:700},children:"Cosmetics are purely visual — they never make you stronger."}),V1.map(u=>{const c=s.filter(d=>d.slot===u.id);return c.length?o.jsxs("div",{className:"card tight",children:[o.jsx("b",{children:u.label}),o.jsx("div",{className:"list",style:{marginTop:8},children:c.map(d=>{const f=n.owned_cosmetics.includes(d.id),p=n.cosmetics?.[u.id]===d.id,_=d.unlock?d.unlock.startsWith("level:")?`Level ${d.unlock.split(":")[1]}`:d.unlock.startsWith("prestige:")?`Prestige ${d.unlock.split(":")[1]}`:"Quest reward":null,g=d.unlock&&(d.unlock.startsWith("level:")&&n.level>=Number(d.unlock.split(":")[1])||d.unlock.startsWith("prestige:")&&n.prestige>=Number(d.unlock.split(":")[1]));return o.jsxs("div",{className:"li",style:{padding:"8px 10px"},children:[d.data.glow||d.data.color?o.jsx("span",{style:{width:22,height:22,borderRadius:7,background:d.data.color==="rainbow"?"linear-gradient(90deg,#f43f5e,#fbbf24,#22d3ee,#a855f7)":d.data.glow||d.data.color}}):d.data.emoji?o.jsx("span",{style:{fontSize:22},children:d.data.emoji}):o.jsx("span",{children:"🎨"}),o.jsx("div",{className:"grow t1",style:{fontSize:15},children:d.name}),p?o.jsx("span",{className:"tag online",children:"EQUIPPED"}):f?u.id==="emote"?o.jsx("span",{className:"tag",children:"OWNED"}):o.jsx("button",{className:"btn small primary",onClick:()=>n1(d.id).catch(()=>{}),children:"EQUIP"}):d.unlock?o.jsx("button",{className:"btn small",disabled:!g,onClick:()=>mh(d.id).catch(()=>{}),children:g?"CLAIM":`🔒 ${_}`}):o.jsx("button",{className:"btn small gold",disabled:n.cash<d.price,onClick:()=>mh(d.id).catch(()=>{}),children:We(d.price)})]},d.id)})})]},u.id):null})]})}function Q1(){const n=U(f=>f.me),u=U(f=>f.catalog?.rules)?.prestige_level??25,c=n.prestige+1,d=c<=0?0:Math.min(50,3*c-1);return o.jsxs("div",{className:"col",children:[o.jsxs("div",{className:"card",style:{borderColor:"#c084fc",background:"rgba(124,58,237,0.1)"},children:[o.jsxs("div",{className:"display",style:{fontSize:22,fontWeight:900},children:["✨ PRESTIGE ",c]}),o.jsxs("div",{className:"muted",style:{fontWeight:700,marginTop:6},children:["Reach level ",u," to prestige. You'll restart with permanent bonuses:"]}),o.jsxs("ul",{style:{fontWeight:800,lineHeight:1.6},children:[o.jsxs("li",{className:"good-t",children:["+",5*c,"% income forever"]}),o.jsxs("li",{className:"good-t",children:["+",d,"% luck on Rare-or-better drops"]}),o.jsx("li",{children:"Prestige-only base themes, trails & emotes"}),o.jsx("li",{children:"30-minute raid shield after the reset"})]}),o.jsxs("div",{className:"muted",style:{fontWeight:700},children:[o.jsx("b",{children:"You keep:"})," vault items, your collection book, cosmetics, achievements, secret keys.",o.jsx("br",{}),o.jsx("b",{children:"You lose:"})," cash, displayed & stored items, base & security upgrades, level."]})]}),o.jsx("div",{className:"bar gold",children:o.jsx("i",{style:{width:`${Math.min(100,n.level/u*100)}%`}})}),o.jsxs("div",{className:"muted center",style:{fontWeight:800},children:["Level ",n.level,"/",u]}),o.jsx("button",{className:"btn purple big block",disabled:n.level<u,onClick:()=>hd({title:`Prestige to P${c}?`,body:"Everything outside your vault (except your Starter TV) is gone. Put your favourites in the vault first!",confirmLabel:"PRESTIGE",danger:!0,hold:!0,onConfirm:()=>l1().catch(()=>{})}),children:n.level<u?`LOCKED — LEVEL ${u}`:"PRESTIGE NOW"})]})}function Z1(){const[n,s]=q.useState(null);return q.useEffect(()=>{F().backend?.rpc("stt_activity").then(s).catch(()=>{})},[]),n?o.jsxs(o.Fragment,{children:[o.jsx("div",{className:"muted",style:{fontWeight:700},children:"Every cash movement is recorded on the server (passive income is shown as your total earned)."}),o.jsx("table",{className:"tbl",children:o.jsx("tbody",{children:n.transactions.map(u=>o.jsxs("tr",{children:[o.jsx("td",{children:u.kind.replace(/_/g," ")}),o.jsxs("td",{className:"mono "+(u.amount>=0?"up":"down"),style:{textAlign:"right"},children:[u.amount>=0?"+":"",ie(u.amount)]}),o.jsx("td",{className:"dim",style:{textAlign:"right"},children:Yn(u.created_at)})]},u.id))})})]}):o.jsx("div",{className:"empty",children:"Loading…"})}const P1=[{d:1,icon:"💵",label:"Cash"},{d:2,icon:"📦",label:"2× Basic Drop"},{d:3,icon:"💵",label:"Cash"},{d:4,icon:"💠",label:"Rare item"},{d:5,icon:"🎁",label:"Premium Drop"},{d:6,icon:"💰",label:"Big cash"},{d:7,icon:"🌟",label:"Event item + Secret Key"}];function K1(){const n=U(b=>b.me),[s,u]=q.useState(null),[c,d]=q.useState("daily"),f=on(4e3),[p,_]=q.useState(null),g=()=>F().backend?.rpc("stt_quests").then(b=>u(b.quests)).catch(()=>{});q.useEffect(()=>{g()},[f]);const w=n.daily,v=(s||[]).filter(b=>b.period===c);return o.jsxs(Mt,{title:"MISSIONS",icon:"🎯",children:[o.jsxs("div",{className:"card",style:{borderColor:w.can_claim?"#facc15":void 0},children:[o.jsxs("div",{className:"row between",children:[o.jsxs("b",{style:{fontSize:18},children:["📅 DAILY REWARD · streak ",w.streak]}),!w.can_claim&&o.jsxs("span",{className:"muted",children:["next in ",xt(Ye(w.resets_at)-Date.now())]})]}),o.jsx("div",{className:"grid",style:{gridTemplateColumns:"repeat(7, 1fr)",gap:6,marginTop:10},children:P1.map(b=>{const y=b.d===w.next_day&&w.can_claim,N=w.can_claim?b.d<w.next_day:b.d<=(w.streak-1)%7+1&&w.streak>0;return o.jsxs("div",{className:"stat center",style:{padding:6,borderColor:y?"#facc15":void 0,background:N?"rgba(74,222,128,0.12)":void 0},children:[o.jsxs("div",{className:"k",children:["DAY ",b.d]}),o.jsx("div",{style:{fontSize:24},children:N?"✅":b.icon}),o.jsx("div",{style:{fontSize:10,fontWeight:800,lineHeight:1.1},children:b.label})]},b.d)})}),o.jsx("button",{className:"btn gold big block",style:{marginTop:10},disabled:!w.can_claim,"data-testid":"claim-daily",onClick:()=>t1().then(b=>_(b)).catch(()=>{}),children:w.can_claim?`CLAIM DAY ${w.next_day}`:"CLAIMED — COME BACK TOMORROW"}),p&&o.jsxs("div",{className:"row",style:{marginTop:8,fontWeight:800},children:[p.item_id&&o.jsx(Ht,{id:p.item_id,size:48}),o.jsxs("span",{children:["Day ",p.day,": ",p.cash?ie(p.cash):""," ",p.count?`${p.count}× ${p.drop} drop`:""," ",p.item_id?"a new item!":""," ",p.secret_keys?"+ 1 Secret Key 🗝️":""]})]}),o.jsx("div",{className:"dim",style:{fontSize:12,marginTop:6},children:"Miss a day and the streak restarts at Day 1."})]}),o.jsx(Xn,{value:c,onChange:d,tabs:[{id:"daily",label:"Daily"},{id:"weekly",label:"Weekly"}]}),s?o.jsxs(o.Fragment,{children:[v[0]&&o.jsxs("div",{className:"muted",style:{fontWeight:700},children:["Resets in ",xt(Ye(v[0].resets_at)-Date.now())]}),o.jsx("div",{className:"list",children:v.map(b=>{const y=b.progress>=b.target,N=b.reward;return o.jsxs("div",{className:"li",style:{flexWrap:"wrap"},children:[o.jsxs("div",{className:"grow",style:{minWidth:180},children:[o.jsxs("div",{className:"t1",children:[b.claimed?"✅ ":"",b.title]}),o.jsxs("div",{className:"t2",children:["Reward: ",N.cash?`${ie(N.cash)}+`:""," ",N.xp?`${N.xp} XP`:""," ",N.tokens?Object.entries(N.tokens).map(([R,G])=>`${G}× ${R} drop`).join(", "):""," ",N.secret_keys?"🗝️ Secret Key":""," ",N.cosmetic?"🎨 cosmetic":""]}),o.jsx("div",{className:"bar good",style:{marginTop:6},children:o.jsx("i",{style:{width:`${Math.min(100,b.progress/b.target*100)}%`}})}),o.jsx("div",{className:"dim",style:{fontSize:12,fontWeight:800},children:b.metric==="earn_cash"?`${ie(b.progress)} / ${ie(b.target)}`:`${b.progress} / ${b.target}`})]}),o.jsx("button",{className:"btn good",disabled:!y||b.claimed,onClick:()=>e1(b.id).then(g).catch(()=>{}),children:b.claimed?"DONE":y?"CLAIM":"IN PROGRESS"})]},b.id)})})]}):o.jsx("div",{className:"empty",children:"Loading…"})]})}function J1(){const n=U(c=>c.last?.event),s=U(c=>c.last?.next_event_at),u=U(c=>c.catalog?.event_types??Ua);return on(1e3),o.jsxs(Mt,{title:"EVENT STAGE",icon:"🎪",children:[n?o.jsxs("div",{className:"card",style:{borderColor:"#fb923c",background:"rgba(251,146,60,0.08)"},children:[o.jsx("div",{style:{fontSize:44},children:n.icon}),o.jsx("div",{className:"display",style:{fontSize:26,fontWeight:900},children:n.title}),o.jsx("div",{className:"muted",style:{fontWeight:700,margin:"6px 0"},children:n.description}),o.jsxs("div",{className:"row wrap",style:{fontWeight:800},children:[n.category&&o.jsxs("span",{className:"tag",children:["Category: ",n.category]}),n.price_mult!==1&&o.jsxs("span",{className:"tag",children:["Prices ×",n.price_mult]}),n.income_mult!==1&&o.jsxs("span",{className:"tag",children:["Income ×",n.income_mult]}),n.luck_mult!==1&&o.jsxs("span",{className:"tag",children:["Mythic+ luck ×",n.luck_mult]})]}),o.jsxs("div",{className:"display",style:{fontSize:22,marginTop:10},children:[xt(Ye(n.ends_at)-Date.now())," left"]}),o.jsx("button",{className:"btn primary big block",style:{marginTop:10},onClick:()=>Te("drops"),children:"🎁 OPEN EVENT DROPS"})]}):o.jsxs("div",{className:"card center",children:[o.jsx("div",{className:"muted display",style:{letterSpacing:"0.2em"},children:"NEXT EVENT IN"}),o.jsx("div",{className:"display",style:{fontSize:40,fontWeight:900},children:s?xt(Ye(s)-Date.now()):"—"}),o.jsx("div",{className:"muted",style:{fontWeight:700},children:"Events rotate all day. Each one shakes up the market."})]}),o.jsx("h3",{children:"Possible events"}),o.jsx("div",{className:"list",children:u.map(c=>o.jsxs("div",{className:"li",children:[o.jsx("div",{style:{fontSize:28},children:c.icon}),o.jsxs("div",{className:"grow",children:[o.jsx("div",{className:"t1",children:c.title}),o.jsx("div",{className:"t2",children:c.description})]})]},c.id))})]})}function W1(){const n=U(f=>f.feed),[s,u]=q.useState("all"),c=U(f=>f.me),d=[...n].reverse().filter(f=>s==="me"?f.target_id===c.id:!0);return o.jsxs(Mt,{title:"LIVE FEED",icon:"🔔",children:[o.jsx(Xn,{value:s,onChange:u,tabs:[{id:"all",label:"Everything"},{id:"me",label:"For me"}]}),d.length===0?o.jsx("div",{className:"empty",children:"Quiet… for now."}):o.jsx("div",{className:"list",children:d.map(f=>{const p=Mh(f);if(!p)return null;const _=f.payload?.item_id;return o.jsxs("div",{className:"li",children:[_?o.jsx(Ht,{id:_,size:36}):o.jsx("span",{style:{fontSize:24},children:p.icon}),o.jsxs("div",{className:"grow",children:[o.jsxs("div",{className:"t1",style:{fontSize:15},children:[p.icon," ",p.text]}),o.jsx("div",{className:"t2",children:Yn(f.created_at,Date.now()+F().serverOffset)})]}),f.kind==="item_stolen"&&f.target_id===c.id&&o.jsx("button",{className:"btn small hot",onClick:()=>Te("visit",{playerId:f.payload.attacker_id,revenge:!0}),children:"REVENGE"})]},f.id)})})]})}function F1(){const n=U(_=>_.settings),s=U(_=>_.backend),u=U(_=>_.me),[c,d]=q.useState(""),[f,p]=q.useState("");return o.jsxs(Mt,{title:"SETTINGS",icon:"⚙️",children:[o.jsxs("div",{className:"card col",children:[o.jsx("b",{children:"🔊 Sound"}),o.jsxs("div",{className:"row",children:[o.jsx("span",{className:"muted",style:{width:80},children:"Volume"}),o.jsx("input",{type:"range",min:0,max:1,step:.05,value:n.volume,onChange:_=>{const g=Number(_.target.value);ii({volume:g}),wh(g)},onPointerUp:()=>me("coin")})]}),o.jsxs("label",{className:"row",children:[o.jsx("input",{type:"checkbox",checked:n.muted,onChange:_=>{ii({muted:_.target.checked}),jh(_.target.checked)}})," Mute everything"]}),o.jsxs("label",{className:"row",children:[o.jsx("input",{type:"checkbox",checked:n.music,onChange:_=>{ii({music:_.target.checked}),Sh(_.target.checked)}})," Ambient music"]})]}),o.jsxs("div",{className:"card col",children:[o.jsx("b",{children:"🎨 Graphics"}),o.jsx("div",{className:"row wrap",children:["high","low"].map(_=>o.jsx("button",{className:"btn small "+(n.quality===_?"primary":""),onClick:()=>{ii({quality:_}),window.dispatchEvent(new Event("resize"))},children:_==="high"?"High (glow, particles)":"Battery saver"},_))}),o.jsxs("label",{className:"row",children:[o.jsx("input",{type:"checkbox",checked:n.reduceMotion,onChange:_=>ii({reduceMotion:_.target.checked})})," Reduce motion & screen shake"]}),o.jsxs("label",{className:"row",children:[o.jsx("input",{type:"checkbox",checked:n.showNames,onChange:_=>ii({showNames:_.target.checked})})," Show player names"]})]}),o.jsxs("div",{className:"card col",children:[o.jsx("b",{children:"🎮 Controls"}),o.jsxs("div",{className:"muted",style:{fontWeight:700,lineHeight:1.5},children:["Desktop: ",o.jsx("b",{children:"WASD / arrows"})," to walk, ",o.jsx("b",{children:"click"})," the ground to walk there, ",o.jsx("b",{children:"click"})," buildings or items, ",o.jsx("b",{children:"E"})," to enter, ",o.jsx("b",{children:"scroll"})," to zoom.",o.jsx("br",{}),"Mobile: drag anywhere on the ",o.jsx("b",{children:"left side"})," for the joystick, ",o.jsx("b",{children:"tap"})," to walk / pick items, big button to enter."]}),o.jsxs("div",{className:"row wrap",children:[o.jsx("button",{className:"btn small",onClick:()=>{La?.travelHome(),Te(null)},children:"🏠 Teleport home"}),o.jsx("button",{className:"btn small",onClick:()=>{pe({tutorialOpen:!0}),Te(null)},children:"🎓 Replay tutorial"})]})]}),o.jsxs("div",{className:"card col",children:[o.jsx("b",{children:"👤 Account"}),o.jsxs("div",{className:"muted",style:{fontWeight:700},children:["Mode: ",o.jsx("b",{children:s?.mode==="online"?"ONLINE (shared server)":"OFFLINE PRACTICE"}),s?.mode==="offline"&&" — your progress is saved on this device. Other players you see are NPCs simulated locally."]}),s?.mode==="online"&&s.isGuest()&&s.upgradeGuest&&o.jsxs("div",{className:"col",children:[o.jsx("div",{className:"muted",style:{fontWeight:700},children:"You're playing as a guest. Save your account to keep it on any device:"}),o.jsx("input",{className:"field",placeholder:"email",value:c,onChange:_=>d(_.target.value)}),o.jsx("input",{className:"field",type:"password",placeholder:"password (6+ chars)",value:f,onChange:_=>p(_.target.value)}),o.jsx("button",{className:"btn primary",onClick:()=>s.upgradeGuest(c,f).then(()=>Me({kind:"good",icon:"✅",title:"Account saved — check your inbox to confirm."})).catch(_=>Me({kind:"bad",icon:"⛔",title:_.message})),children:"SAVE ACCOUNT"})]}),s?.mode==="online"&&!s.isGuest()&&o.jsxs("div",{className:"muted",children:["Signed in as ",s.email()]}),o.jsxs("div",{className:"row wrap",children:[o.jsx("button",{className:"btn small",onClick:()=>ui(),children:"🔄 Resync"}),o.jsx("button",{className:"btn small",onClick:()=>Lv(),children:s?.mode==="online"?"Sign out":"Back to title"}),s?.mode==="offline"&&s.reset&&o.jsx("button",{className:"btn small hot",onClick:()=>hd({title:"Delete offline save?",body:`This permanently deletes ${u?.username}'s offline progress on this device.`,confirmLabel:"DELETE",danger:!0,hold:!0,onConfirm:async()=>{await s.reset(),location.reload()}}),children:"🗑️ Reset offline save"})]})]}),o.jsxs("div",{className:"card",children:[o.jsx("b",{children:"🛡️ Fair play & economy"}),o.jsx("div",{className:"muted",style:{fontWeight:700,lineHeight:1.45},children:"Everything uses fictional in-game cash. There is no real-money purchasing, trading, betting, deposits, withdrawals or crypto. Drops are funded only by cash you earn in the game, and every drop shows its odds. All money, items, trades, raids and market sales are decided and recorded by the server."})]}),o.jsx("div",{className:"dim center",style:{fontSize:12},children:"STEAL THE TECH · all brands, items and art are fictional and drawn in code."})]})}function e2(){const n=q.useRef(null);q.useEffect(()=>{const u=new yv(n.current);return sh(u),window.__stt_engine=u,window.__stt_state=()=>U.getState(),window.__stt_store=U,()=>{u.destroy(),sh(null)}},[]);const s=_t(u=>u.fade);return o.jsxs(o.Fragment,{children:[o.jsx("canvas",{ref:n,className:"world-canvas","data-testid":"world"}),o.jsx("div",{className:"fade",style:{opacity:s}})]})}class gh extends q.Component{constructor(){super(...arguments),this.state={err:null}}static getDerivedStateFromError(s){return{err:String(s?.message||s)}}componentDidCatch(s){console.error("["+this.props.name+"]",s)}render(){return this.state.err?o.jsx("div",{className:"panel-wrap",children:o.jsx("div",{className:"panel",children:o.jsxs("div",{className:"panel-body center",children:[o.jsx("div",{style:{fontSize:40},children:"🛠️"}),o.jsx("b",{children:"This screen hit a glitch."}),o.jsx("div",{className:"muted",children:this.state.err}),o.jsx("button",{className:"btn primary",onClick:()=>{this.setState({err:null}),Te(null)},children:"CLOSE"})]})})}):this.props.children}}function t2(){switch(U(s=>s.panel)){case"base":return o.jsx(T1,{});case"drops":return o.jsx(N1,{});case"collection":return o.jsx(E1,{});case"market":return o.jsx(A1,{});case"raid":return o.jsx(z1,{});case"visit":return o.jsx(U1,{});case"trade":return o.jsx(L1,{});case"leaderboard":return o.jsx(Y1,{});case"profile":return o.jsx(B1,{});case"quests":return o.jsx(K1,{});case"event":return o.jsx(J1,{});case"feed":return o.jsx(W1,{});case"settings":return o.jsx(F1,{});default:return null}}function n2(){const n=U(u=>u.settings.reduceMotion),s=U(u=>u.tutorialOpen);return q.useEffect(()=>{const u=c=>{const d=c.target;if(d&&(d.tagName==="INPUT"||d.tagName==="TEXTAREA"||d.tagName==="SELECT"))return;c.key==="Escape"&&(_t.getState().selected?_t.setState({selected:null}):Te(null));const f={b:"base",o:"drops",c:"collection",m:"market",r:"raid",t:"trade",l:"leaderboard",p:"profile",q:"quests"};if(!c.ctrlKey&&!c.metaKey&&!c.altKey&&f[c.key.toLowerCase()]&&!["w","a","s","d","e"].includes(c.key.toLowerCase())){const p=U.getState().panel;Te(p===f[c.key.toLowerCase()]?null:f[c.key.toLowerCase()])}};return window.addEventListener("keydown",u),()=>window.removeEventListener("keydown",u)},[]),o.jsxs("div",{className:"game"+(n?" reduce-motion":"")+(s?" tut-open":""),children:[o.jsx(e2,{}),o.jsx(o1,{}),o.jsx(u1,{}),o.jsx(m1,{}),o.jsx(p1,{}),o.jsx(h1,{}),o.jsx(_1,{}),o.jsx(g1,{}),o.jsx(d1,{}),o.jsx(gh,{name:"panel",children:o.jsx(t2,{})}),o.jsxs(gh,{name:"overlays",children:[o.jsx(v1,{}),o.jsx(y1,{}),o.jsx(S1,{}),o.jsx(f1,{}),o.jsx(b1,{}),o.jsx(w1,{}),o.jsx(x1,{}),o.jsx(j1,{})]})]})}function a2(){switch(U(s=>s.phase)){case"title":return o.jsx(Bv,{});case"loading":return o.jsx(Gv,{});case"auth":return o.jsx(Vv,{});case"join":return o.jsx(Iv,{});case"error":return o.jsx(Xv,{});case"playing":return o.jsx(n2,{})}}Qb.createRoot(document.getElementById("root")).render(o.jsx(a2,{}));

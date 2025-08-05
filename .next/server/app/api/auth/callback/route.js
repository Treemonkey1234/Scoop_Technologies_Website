(()=>{var a={};a.id=9442,a.ids=[9442],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},78335:()=>{},79143:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>C,patchFetch:()=>B,routeModule:()=>x,serverHooks:()=>A,workAsyncStorage:()=>y,workUnitAsyncStorage:()=>z});var d={};c.r(d),c.d(d,{GET:()=>w});var e=c(96559),f=c(48088),g=c(37719),h=c(26191),i=c(81289),j=c(261),k=c(92603),l=c(39893),m=c(14823),n=c(47220),o=c(66946),p=c(47912),q=c(99786),r=c(46143),s=c(86439),t=c(43365),u=c(32190),v=c(84036);async function w(a){console.log("\uD83D\uDD0D AUTH0 CALLBACK: Starting callback processing"),console.log("\uD83D\uDD0D AUTH0 CALLBACK: Request URL:",a.url);try{let b,c=(0,v.$B)();console.log("\uD83D\uDD0D AUTH0 CALLBACK: Config validation:",c);let d=new URL(a.url),e=d.searchParams.get("code"),f=d.searchParams.get("state")||"{}";if(console.log("\uD83D\uDD0D AUTH0 CALLBACK: Code present:",!!e),console.log("\uD83D\uDD0D AUTH0 CALLBACK: State present:",!!f),!e)return console.log("\uD83D\uDD0D AUTH0 CALLBACK: No code provided, redirecting to signin"),u.NextResponse.redirect(new URL("/signin?error=no_code",v.Po.baseURL));try{b=JSON.parse(atob(f)),console.log("\uD83D\uDD0D AUTH0 CALLBACK: State data parsed:",b)}catch(a){console.log("\uD83D\uDD0D AUTH0 CALLBACK: Failed to parse state, using defaults"),b={returnTo:"/",connection:null}}console.log("\uD83D\uDD0D AUTH0 CALLBACK: Auth0 config check:",{domain:v.Po.domain,clientId:v.Po.clientId?"SET":"MISSING",clientSecret:v.Po.clientSecret?"SET":"MISSING",baseURL:v.Po.baseURL}),console.log("\uD83D\uDD0D AUTH0 CALLBACK: Starting token exchange");let g=await fetch(`https://${v.Po.domain}/oauth/token`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({grant_type:"authorization_code",client_id:v.Po.clientId,client_secret:v.Po.clientSecret,code:e,redirect_uri:`${v.Po.baseURL}/api/auth/callback`})});console.log("\uD83D\uDD0D AUTH0 CALLBACK: Token response status:",g.status),console.log("\uD83D\uDD0D AUTH0 CALLBACK: Token response headers:",Object.fromEntries(g.headers.entries()));let h=await g.json();if(console.log("\uD83D\uDD0D AUTH0 CALLBACK: Token response data:",h),!g.ok)return console.error("\uD83D\uDD0D AUTH0 CALLBACK: Token exchange failed:",h),u.NextResponse.redirect(new URL("/signin?error=token_exchange_failed",v.Po.baseURL));console.log("\uD83D\uDD0D AUTH0 CALLBACK: Starting user info fetch");let i=await fetch(`https://${v.Po.domain}/userinfo`,{headers:{Authorization:`Bearer ${h.access_token}`}});console.log("\uD83D\uDD0D AUTH0 CALLBACK: User response status:",i.status);let j=await i.json();if(console.log("\uD83D\uDD0D AUTH0 CALLBACK: User data:",j),!i.ok)return console.error("\uD83D\uDD0D AUTH0 CALLBACK: User info failed:",j),u.NextResponse.redirect(new URL("/signin?error=user_info_failed",v.Po.baseURL));console.log("\uD83D\uDD0D AUTH0 CALLBACK: Auth0 User Data:",JSON.stringify(j,null,2));try{let a=b.connection||"auth0";console.log("\uD83D\uDD0D AUTH0 CALLBACK: Logging to admin system"),await fetch(`${v.Po.baseURL}/api/admin/users?action=log-auth0-user`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:j.sub,email:j.email,name:j.name,picture:j.picture,connection:a})}),console.log("\uD83D\uDD0D AUTH0 CALLBACK: Admin logging successful")}catch(a){console.error("\uD83D\uDD0D AUTH0 CALLBACK: Failed to log Auth0 user to admin system:",a)}if(j.identities=((a,b)=>{let c=[];return a.startsWith("linkedin|")?c.push({provider:"linkedin",connection:"linkedin",user_id:a.split("|")[1],isSocial:!0,profileData:{name:b.name,email:b.email,picture:b.picture}}):a.startsWith("google-oauth2|")?c.push({provider:"google-oauth2",connection:"google-oauth2",user_id:a.split("|")[1],isSocial:!0,profileData:{name:b.name,email:b.email,picture:b.picture}}):a.startsWith("facebook|")&&c.push({provider:"facebook",connection:"facebook",user_id:a.split("|")[1],isSocial:!0,profileData:{name:b.name,email:b.email,picture:b.picture}}),c})(j.sub,j),console.log("\uD83D\uDD0D AUTH0 CALLBACK: Created identities from sub:",JSON.stringify(j.identities,null,2)),b.connection&&"/connected-accounts"===b.returnTo){let a={"google-oauth2":"Google",facebook:"Facebook",linkedin:"LinkedIn"}[b.connection];if(a&&j.email){let b=j.email.split("@")[0];j.connectedPlatform=a,j.connectedUsername=b}}let k={user:{...j,authMethod:"auth0",id:j.sub,username:j.email?.split("@")[0]||j.nickname||j.name?.split(" ")[0]||"user"},accessToken:h.access_token,expiresAt:Date.now()+1e3*h.expires_in},l=null,m=null;try{console.log("\uD83D\uDD0D AUTH0 CALLBACK: Starting JWT exchange process");let a=await fetch(`${v.Po.baseURL}/api/auth/exchange-auth0`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({auth0UserId:j.sub,email:j.email,name:j.name,username:j.email?.split("@")[0]||j.nickname||j.name?.split(" ")[0]||"user",phone:null})});if(console.log("\uD83D\uDD0D AUTH0 CALLBACK: Exchange response status:",a.status),a.ok){let b=await a.json();l=b.token,m=b.user,console.log("\uD83D\uDD0D AUTH0 CALLBACK: JWT exchange successful, token generated"),m&&(k.user={...k.user,...m,username:m.username||k.user.username,phone:m.phone||null},console.log("\uD83D\uDD0D AUTH0 CALLBACK: Updated session with backend user data:",k.user))}else{let b=await a.text();console.error("\uD83D\uDD0D AUTH0 CALLBACK: JWT exchange failed:",b)}}catch(a){console.error("\uD83D\uDD0D AUTH0 CALLBACK: JWT exchange error:",a)}let n=b.returnTo;if("/connected-accounts"===b.returnTo)j.isAccountLinking=!0,n="/connected-accounts";else if(b.returnTo&&"/"!==b.returnTo)n=b.returnTo;else{let a=m&&m.username&&m.phone;console.log("\uD83D\uDD0D AUTH0 CALLBACK: Profile completeness check:",{hasBackendUser:!!m,hasUsername:m?.username,hasPhone:m?.phone,hasCompleteProfile:a}),a?(n="/",console.log("\uD83D\uDD0D AUTH0 CALLBACK: User has complete profile, redirecting to home")):(n="/onboarding",console.log("\uD83D\uDD0D AUTH0 CALLBACK: New Auth0 user, redirecting to onboarding for profile completion or account linking"))}console.log("\uD83D\uDD0D AUTH0 CALLBACK: Final redirect path:",n);let o=new URL(n,v.Po.baseURL),p=u.NextResponse.redirect(o.toString()),q=Date.now()+1e3*h.expires_in;if(p.cookies.set("appSession",JSON.stringify(k),{httpOnly:!0,secure:!0,sameSite:"lax",maxAge:h.expires_in||3600,path:"/"}),p.cookies.set("auth0UserData",JSON.stringify(j),{httpOnly:!1,secure:!0,sameSite:"lax",maxAge:h.expires_in||3600,path:"/"}),l){p.cookies.set("authToken",l,{httpOnly:!0,secure:!0,sameSite:"lax",maxAge:604800,path:"/"}),console.log("\uD83D\uDD0D AUTH0 CALLBACK: JWT token stored in cookie");let a=JSON.stringify(l).replace(/'/g,"\\'").replace(/"/g,'\\"'),b=o.toString().replace(/'/g,"\\'").replace(/"/g,'\\"'),c=`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Redirecting...</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container { text-align: center; }
            .spinner { 
              width: 40px; 
              height: 40px; 
              border: 4px solid rgba(255,255,255,0.3); 
              border-top: 4px solid white; 
              border-radius: 50%; 
              animation: spin 1s linear infinite; 
              margin: 0 auto 20px; 
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <p>Completing authentication...</p>
          </div>
          <script>
            (function() {
              console.log('🔍 AUTH0 CALLBACK SCRIPT: Starting localStorage injection');
              try {
                // Safely parse and store JWT token
                var jwtToken = "${a}";
                if (jwtToken && jwtToken !== 'undefined' && jwtToken !== 'null') {
                  localStorage.setItem('authToken', jwtToken);
                  console.log('🔍 AUTH0 CALLBACK SCRIPT: JWT token stored in localStorage successfully');
                } else {
                  console.warn('🔍 AUTH0 CALLBACK SCRIPT: No valid JWT token to store');
                }
              } catch (error) {
                console.error('🔍 AUTH0 CALLBACK SCRIPT: Failed to store JWT token in localStorage:', error);
              }
              
              // Redirect after storing the token
              setTimeout(function() {
                var redirectUrl = "${b}";
                console.log('🔍 AUTH0 CALLBACK SCRIPT: Redirecting to', redirectUrl);
                if (redirectUrl && redirectUrl !== 'undefined') {
                  window.location.href = redirectUrl;
                } else {
                  console.error('🔍 AUTH0 CALLBACK SCRIPT: Invalid redirect URL, fallback to home');
                  window.location.href = '/';
                }
              }, 500);
            })();
          </script>
        </body>
        </html>
      `;return console.log("\uD83D\uDD0D AUTH0 CALLBACK: Returning HTML response with localStorage injection"),new u.NextResponse(c,{status:200,headers:{"Content-Type":"text/html"}})}return console.log("\uD83D\uDD0D AUTH0 CALLBACK: No JWT token, using original redirect"),console.log("\uD83D\uDD0D AUTH0 CALLBACK: Session created with expiry:",new Date(q).toISOString()),p}catch(d){console.error("\uD83D\uDD0D AUTH0 CALLBACK: Critical error in callback:",d),console.error("\uD83D\uDD0D AUTH0 CALLBACK: Error stack:",d instanceof Error?d.stack:"No stack trace");let a="callback_failed",b="Authentication failed";d instanceof Error&&(d.message.includes("fetch")?(a="network_error",b="Network error during authentication"):d.message.includes("JSON")?(a="token_parse_error",b="Token parsing error"):d.message.includes("redirect")&&(a="redirect_error",b="Redirect configuration error"),console.error("\uD83D\uDD0D AUTH0 CALLBACK: Specific error type:",a,"Message:",b));let c=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Error</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            margin: 0; 
            background: linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%);
            color: white;
          }
          .container { 
            text-align: center; 
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
            max-width: 400px;
          }
          .error-icon { font-size: 48px; margin-bottom: 20px; }
          h1 { margin: 0 0 10px; font-size: 24px; }
          p { margin: 10px 0; opacity: 0.9; }
          .retry-btn {
            background: white;
            color: #ff6b6b;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 20px;
            text-decoration: none;
            display: inline-block;
          }
          .retry-btn:hover { background: #f5f5f5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error-icon">⚠️</div>
          <h1>Authentication Error</h1>
          <p>${b}</p>
          <p>Please try signing in again.</p>
          <a href="/signin" class="retry-btn">Back to Sign In</a>
        </div>
        <script>
          console.error('🔍 AUTH0 CALLBACK: Authentication failed with error type:', '${a}');
          // Auto-redirect after 5 seconds
          setTimeout(function() {
            window.location.href = '/signin?error=${a}';
          }, 5000);
        </script>
      </body>
      </html>
    `;return new u.NextResponse(c,{status:200,headers:{"Content-Type":"text/html"}})}}let x=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/auth/callback/route",pathname:"/api/auth/callback",filename:"route",bundlePath:"app/api/auth/callback/route"},distDir:".next",projectDir:"",resolvedPagePath:"C:\\Users\\hemin\\Local Files\\Desktop\\Scoop\\Static HTML Scoop\\app\\api\\auth\\callback\\route.ts",nextConfigOutput:"",userland:d}),{workAsyncStorage:y,workUnitAsyncStorage:z,serverHooks:A}=x;function B(){return(0,g.patchFetch)({workAsyncStorage:y,workUnitAsyncStorage:z})}async function C(a,b,c){var d;let e="/api/auth/callback/route";"/index"===e&&(e="/");let g=await x.prepare(a,b,{srcPage:e,multiZoneDraftMode:"false"});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:u,params:v,nextConfig:w,isDraftMode:y,prerenderManifest:z,routerServerContext:A,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,resolvedPathname:D}=g,E=(0,j.normalizeAppPath)(e),F=!!(z.dynamicRoutes[E]||z.routes[D]);if(F&&!y){let a=!!z.routes[D],b=z.dynamicRoutes[E];if(b&&!1===b.fallback&&!a)throw new s.NoFallbackError}let G=null;!F||x.isDev||y||(G="/index"===(G=D)?"/":G);let H=!0===x.isDev||!F,I=F&&!H,J=a.method||"GET",K=(0,i.getTracer)(),L=K.getActiveScopeSpan(),M={params:v,prerenderManifest:z,renderOpts:{experimental:{dynamicIO:!!w.experimental.dynamicIO,authInterrupts:!!w.experimental.authInterrupts},supportsDynamicResponse:H,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=w.experimental)?void 0:d.cacheLife,isRevalidate:I,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>x.onRequestError(a,b,d,A)},sharedContext:{buildId:u}},N=new k.NodeNextRequest(a),O=new k.NodeNextResponse(b),P=l.NextRequestAdapter.fromNodeNextRequest(N,(0,l.signalFromNodeResponse)(b));try{let d=async c=>x.handle(P,M).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=K.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${J} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${J} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&B&&C&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=M.renderOpts.fetchMetrics;let i=M.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=M.renderOpts.collectedTags;if(!F)return await (0,o.I)(N,O,e,M.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==M.renderOpts.collectedRevalidate&&!(M.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&M.renderOpts.collectedRevalidate,d=void 0===M.renderOpts.collectedExpire||M.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:M.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await x.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:B})},A),b}},l=await x.handleResponse({req:a,nextConfig:w,cacheKey:G,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:z,isRoutePPREnabled:!1,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,responseGenerator:k,waitUntil:c.waitUntil});if(!F)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",B?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),y&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&F||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.getCacheControlHeader)(l.cacheControl)),await (0,o.I)(N,O,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};L?await g(L):await K.withPropagatedContext(a.headers,()=>K.trace(m.BaseServerSpan.handleRequest,{spanName:`${J} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":J,"http.target":a.url}},g))}catch(b){if(L||b instanceof s.NoFallbackError||await x.onRequestError(a,b,{routerKind:"App Router",routePath:E,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:B})}),F)throw b;return await (0,o.I)(N,O,new Response(null,{status:500})),null}}},84036:(a,b,c)=>{"use strict";c.d(b,{$B:()=>e,Po:()=>d});let d={domain:process.env.AUTH0_DOMAIN||"dev-av6q4m54qqcs5n00.us.auth0.com",clientId:process.env.AUTH0_CLIENT_ID||"5uKzDSRavv2WqTOvDnDqsh2pGvHQ759C",clientSecret:process.env.AUTH0_CLIENT_SECRET||"",secret:process.env.AUTH0_SECRET||"8f3e4d2a1b9c7e6f5a8b3c2d9e1f4a7b2c5d8e9f1a4b7c2e5f8a1b4c7d9e2f5a8b",baseURL:process.env.AUTH0_BASE_URL||"https://app.scoopsocials.com",issuerBaseURL:process.env.AUTH0_ISSUER_BASE_URL||`https://${process.env.AUTH0_DOMAIN||"dev-av6q4m54qqcs5n00.us.auth0.com"}`};function e(){let a=[];return process.env.AUTH0_DOMAIN||a.push("AUTH0_DOMAIN"),process.env.AUTH0_CLIENT_ID||a.push("AUTH0_CLIENT_ID"),process.env.AUTH0_CLIENT_SECRET||a.push("AUTH0_CLIENT_SECRET"),process.env.AUTH0_SECRET||a.push("AUTH0_SECRET"),process.env.AUTH0_BASE_URL||process.env.VERCEL_URL||a.push("AUTH0_BASE_URL or VERCEL_URL"),a.length>0&&(console.warn("⚠️ Missing Auth0 environment variables:",a.join(", ")),console.warn("⚠️ Using fallback values - this may cause authentication issues")),{isValid:0===a.length,missingVars:a,config:{domain:d.domain,clientId:d.clientId?"SET":"MISSING",clientSecret:d.clientSecret?"SET":"MISSING",baseURL:d.baseURL,environment:"production"}}}},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},96487:()=>{}};var b=require("../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[4985,6055],()=>b(b.s=79143));module.exports=c})();
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import path from 'path';

import express, { Express, Request, Response, NextFunction, json } from 'express';
import compression from 'compression';
import morgan from 'morgan'
import chalk from 'chalk';
import { healthCheckRouter } from './healthCheck/router';
import { dropdownRouter } from './dropdowns/router';
import { settingRouter } from './settings/router';
import { accessRouter } from './access/router';
import { promisify } from 'util';
import fs from 'fs'
import { testKnowledgeBaseRouter } from './testKnowledgeBase/router';
import { knowledgeBaseRouter } from './knowledgeBase/router';
import { pipelineRouter } from './pipeline/router';
import { fileRouter as fileRouter } from './file/router';
import { tableStorageRouter } from './tableStorage/router';

if (process.env.NODE_ENV == "development") {
  var dotenv = require("dotenv")
  const result = dotenv.config({ path: "../../.env" })

  if (result.error) {
    throw result.error
  }

}

let appInsights = require('applicationinsights');

appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true)
    .setUseDiskRetryCaching(true)
    .setSendLiveMetrics(false)
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI)
    .start();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const session = require('express-session');
const qs = require('qs');
const httpClient = require('axios').create();
const azure = require('azure-storage');

const clientDirectory = path.resolve('../../client/build');

const BASEURL = (process.env.PUBLIC_URL || '').replace(/\/$/, '');

const app: Express = express();
const readFile = promisify(fs.readFile);

var parser = require("body-parser")
var cookieParser = require('cookie-parser');

app.engine('html', require('ejs').renderFile);
app.use(compression());
app.use(parser.json({ limit: '50mb' }));
app.use(parser.urlencoded({extended: true}));
app.use(morgan("dev"))
app.use(cookieParser());



const CS_POLICIES = [
  "default-src 'none';",
  "font-src 'self' https:;",
  "img-src 'self' data:;",
  "base-uri 'none';",
  "connect-src 'self';",
  "frame-src 'self' bfemulator: https://login.microsoftonline.com https://*.botframework.com;",
  "worker-src 'self';",
  "form-action 'none';",
  "frame-ancestors 'self';",
  "manifest-src 'self';",
  'upgrade-insecure-requests;',
];

app.all('*', (req: Request, res: Response, next?: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (process.env.ENABLE_CSP === 'true') {
    //   req.__nonce__ = crypto.randomBytes(16).toString('base64');
    res.header(
      'Content-Security-Policy',
      CS_POLICIES.concat([
        //   `script-src 'self' 'nonce-${req.__nonce__}';`,
        // TODO: use nonce strategy after addressing issues with monaco-editor pacakge
        "style-src 'self' 'unsafe-inline'",
        // `style-src 'self' 'nonce-${req.__nonce__}';`,
      ]).join(' ')
    );
  }

  next?.();
});

app.use(`/static`, express.static(`${clientDirectory}/static`));
app.use(`/img`, express.static(`${clientDirectory}/img`));
app.use(`/locales`, express.static(`${clientDirectory}/locales`));
app.use(function (req, res, next) {
  // Force all requests on production to be served over https
  if (
    req.headers["x-forwarded-proto"] !== "https" &&
    process.env.NODE_ENV === "production"
  ) {
    var secureUrl = "https://" + req.hostname + req.originalUrl;
    res.redirect(302, secureUrl);
  }
  next();
});

// only register the login route if the auth provider defines one
//   if (login) {
//     app.get(`${BASEURL}/api/login`, login);
//   } else {
//     // register the route so that client that requires_auth knows not try repeatedly
//     app.get(`${BASEURL}/api/login`, (req, res) => {
//       res.redirect(`${BASEURL}#error=${encodeURIComponent('NoSupport')}`);
//     });
//   }

// always authorize all api routes, it will be a no-op if no auth provider set
//   app.use(`${BASEURL}/api`, authorize, apiRouter);

// next needs to be an arg in order for express to recognize this as the error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  if (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

const OIDCStrategy = require("passport-azure-ad").OIDCStrategy;
var passport = require("passport");
var authenticationStrategy = new OIDCStrategy(
  {
    identityMetadata: `https://login.microsoftonline.com/${process.env.TENANTID}/v2.0/.well-known/openid-configuration`,
    clientID: process.env.CLIENTID,
    redirectUrl: process.env.REDIRECT_URL,
    clientSecret: process.env.CLIENT_SECRET,
    allowHttpForRedirectUrl: true,
    scope: "openid profile",
    responseType: "code",
    responseMode: "form_post",
    validateIssuer: true,
    useCookieInsteadOfSession : false
  },
  async function (iss, sub, profile, access_token, refresh_token, done) {
    if (profile == null) {
      return done(new Error("No oid found"), null);
    }

    try {
     

      // var applicationToken = await httpClient.post(`https://login.microsoftonline.com/${process.env.TENANTID}/oauth2/v2.0/token`,
      //   qs.stringify(new Object({
      //     grant_type: "client_credentials",
      //     client_id: process.env.CLIENTID,
      //     client_secret: process.env.CLIENT_SECRET,
      //     scope: "https://graph.microsoft.com/.default"
      //   }))
      //   , { headers: { "Content-Type": "application/x-www-form-urlencoded;chartset=UTF-8" } });


      // var tableSvc = azure.createTableService(process.env.SA_CONNECTION_STRING);
      // var secGroups : any = await new Promise((resolve) => tableSvc.createTableIfNotExists("SecurityOptions", function (error, result, response) {
      //   if (!error) {
      //     // Table exists or created
      //     let query = new azure.TableQuery()
      //     let queryResults = new Array();

      //     var nextContinuationToken = null;
      //     return tableSvc.queryEntities("SecurityOptions",
      //       query,
      //       nextContinuationToken,
      //       function (error, results) {
      //         if (error) throw error;

      //         results.entries.forEach(entity => {
      //           queryResults.push(new Object({ groupId: entity.PartitionKey._, permissions: JSON.parse(entity.RowKey._), isBotManager: entity.isBotManager._ }))
      //         });

      //         if (results.continuationToken) {
      //           nextContinuationToken = results.continuationToken;
      //         }

      //         return resolve(queryResults);
      //       })
      //   }
      // }));

      // var groupIds = secGroups.map(x => x.groupId);

      // var groupsToCheck = groupIds.splice(0, 20);
      var permissions = new Array();
      // while (groupsToCheck != undefined && groupsToCheck.length > 0) {
      //   var response = await httpClient.post(`https://graph.microsoft.com/v1.0/users/${profile.oid}/checkMemberGroups`, { groupIds: groupsToCheck }, { headers: { "Authorization": `Bearer ${applicationToken.data.access_token}` } });

      //   if (response.status == 200 && response.data != null && response.data.value != null) {


      //     response.data.value.forEach(groupId => {
      //       var secGroup = secGroups.find(x => x.groupId == groupId);
      //       if (secGroup != undefined) {
      //         secGroup.permissions.forEach(permission => {
      //           if (!permissions.includes(permission)) {
      //             permissions.push(permission);
      //           }

      //           if (secGroup.isBotManager) {
      //             if (!permissions.includes("botManager")) {
      //               permissions.push("botManager");
      //             }
      //           }
      //         });
      //       }
      //     });
      //   }
      //   groupsToCheck = groupIds.splice(0, 20);
      // }

      if (process.env.NODE_ENV == 'development') {
        permissions.push("BMT_BOT_CAM_Reader",  "BMT_Settings_Reader")
      }
        return done(null, {
          id: profile.id,
          profile: profile,
          access_token: access_token,
          refresh_token: refresh_token,
          iss: iss,
          sub: sub,
          permissions: permissions
        });
    } catch (err) {
      console.error(err)
    }
  }); 

app.use(session({ secret: "anything" }))
app.use(passport.initialize());
passport.use(authenticationStrategy);

passport.serializeUser(function (user, done) {
  done(null, JSON.stringify(user));
});

passport.deserializeUser(function (obj, done) {
  done(null, JSON.parse(obj));
});
app.use(passport.session())

app.get('/login', (req, res) => {
  res.redirect("/auth/aad");
});

app.get('/auth/aad', passport.authenticate('azuread-openidconnect'));
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/')
});

app.post(
  '/auth/aad/callback',
  passport.authenticate('azuread-openidconnect'),
  function (req, res) {
    console.log('login complete!');
    // Successful authentication, redirect home.
    res.redirect('/');
  });

 

  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); } //true
    res.redirect('/login');
  }; 
  
app.use(`${BASEURL}/hc`, healthCheckRouter)

app.use(`${BASEURL}/api/testknowledgebase`, ensureAuthenticated, testKnowledgeBaseRouter);

app.use(`${BASEURL}/api/knowledgebase`, ensureAuthenticated, knowledgeBaseRouter);

app.use(`${BASEURL}/api/tablestorage`, ensureAuthenticated, tableStorageRouter);

app.use(`${BASEURL}/api/pipeline`, ensureAuthenticated, pipelineRouter);

app.use(`${BASEURL}/api/file`, ensureAuthenticated, fileRouter);

app.use(`${BASEURL}/api/dropdowns`, ensureAuthenticated, dropdownRouter)

app.use(`${BASEURL}/api/settings`, ensureAuthenticated, settingRouter)

app.use(`${BASEURL}/api/access`, ensureAuthenticated, accessRouter)

app.get('/manifest.json', async (req, res) => {
  var content = await readFile(path.resolve(clientDirectory, 'manifest.json'), "utf-8")
  res.send(content)
});

app.get('*', ensureAuthenticated, (req, res) => {
  res.render(path.resolve(clientDirectory, 'index.html'));
});

const preferredPort = process.env.PORT || 5000;
let port = preferredPort;
app.listen(port, () => {
  // We don't use the debug logger here because we always want it to be shown.
  // eslint-disable-next-line no-console
  console.log(`\n\n${chalk.green('Bot management tool now running at:')}\n\n${chalk.blue(`http://localhost:${port}`)}\n`);
});

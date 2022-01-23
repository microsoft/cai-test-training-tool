// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import path from 'path';

import express, { Express, Request, Response, NextFunction } from 'express';
import compression from 'compression';
import morgan from 'morgan'
import chalk from 'chalk';
import { healthCheckRouter } from './healthCheck/router';
import { settingRouter } from './settings/router';
import { promisify } from 'util';
import fs from 'fs'
import { testKnowledgeBaseRouter } from './testKnowledgeBase/router';
import { knowledgeBaseRouter } from './knowledgeBase/router';
import { pipelineRouter } from './pipeline/router';
import { fileRouter as fileRouter } from './file/router';
import { tableStorageRouter } from './tableStorage/router';
import { queueStorageRouter } from './queueStorage/router';
import { speechServiceRouter } from './speechService/router';
import { audioGenerationRouter } from './audioGenerationService/router';

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

const clientDirectory = path.resolve('../../client/build');

const BASEURL = (process.env.PUBLIC_URL || '').replace(/\/$/, '');

const app: Express = express();
const readFile = promisify(fs.readFile);

var parser = require("body-parser")
var cookieParser = require('cookie-parser');

app.engine('html', require('ejs').renderFile);
app.use(compression());
app.use(parser.json({ limit: '50mb' }));
app.use(parser.urlencoded({ extended: true }));
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
    process.env.NODE_ENV !== "development"
  ) {
    var secureUrl = "https://" + req.hostname + req.originalUrl;
    res.redirect(302, secureUrl);
  }
  next();
});

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
    useCookieInsteadOfSession: false
  },
  async function (iss, sub, profile, access_token, refresh_token, done) {
    if (profile == null) {
      return done(new Error("No oid found"), null);
    }

    return done(null, {
      id: profile.id,
      profile: profile,
      access_token: access_token,
      refresh_token: refresh_token,
      iss: iss,
      sub: sub,
    });
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
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
};

app.use(`${BASEURL}/hc`, healthCheckRouter)

app.use(`${BASEURL}/api/testknowledgebase`, ensureAuthenticated, testKnowledgeBaseRouter);

app.use(`${BASEURL}/api/knowledgebase`, ensureAuthenticated, knowledgeBaseRouter);

app.use(`${BASEURL}/api/tablestorage`, ensureAuthenticated, tableStorageRouter);

app.use(`${BASEURL}/api/queue`, ensureAuthenticated, queueStorageRouter);

app.use(`${BASEURL}/api/audiobatch`, ensureAuthenticated, audioGenerationRouter);

app.use(`${BASEURL}/api/pipeline`, ensureAuthenticated, pipelineRouter);

app.use(`${BASEURL}/api/file`, ensureAuthenticated, fileRouter);

app.use(`${BASEURL}/api/speech`, ensureAuthenticated, speechServiceRouter)

app.use(`${BASEURL}/api/settings`, ensureAuthenticated, settingRouter)

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
  console.log(`\n\n${chalk.green('Conversational AI Test and Training Tool now running at:')}\n\n${chalk.blue(`http://localhost:${port}`)}\n`);
});

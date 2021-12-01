
(function () {

    var endpoints = {
        "https://localhost:44317": "local",
        "https://idtestbmbatch01.azurewebsites.net": "dev"
    };

    var config = {
        tenant: 'microsoft.onmicrosoft.com',
        clientId: '4cb03e25-94d2-4cbd-9a6e-ea3c601ccba8',
        endpoints: endpoints,
        popUp: false,
        cacheLocation: 'localStorage',
        expireOffsetSeconds: 600 // Second * Mins Default is 300 seconds (5 minutes)
    };

    config.callback = onLoginCallBack;

    var authContext = new AuthenticationContext(config);


    // Check For & Handle Redirect From AAD After Login
    var isCallback = authContext.isCallback(window.location.hash);
    if (isCallback) {
        authContext.handleWindowCallback();
    }
    else {
        initAdLogin();
    }

    function initAdLogin() {

        FillData();
        return;
        var user = authContext.getCachedUser();

        if (user) {
            //Request new token (Renew token)
            authContext.acquireToken(authContext.config.clientId, onLoginCallBack);
        }
        else {
            authContext.login();
        }

    };

    function onLoginCallBack(error, accessToken) {

        console.log("Inside Call back");

        // Handle ADAL Error
        if (error || !accessToken) {
            alert('ADAL Error Occurred: ' + error);
            authContext.login();
            return;
        }

        if (accessToken) {
            var user = authContext.getCachedUser();

            var userProfile = { userName: user.userName, accessToken: accessToken };

            FillData(userProfile);
        }

    };
}());





# Overview
...

# APIs

### **Health Check API**

Check Health Status of Azure Function, e.g. used by Application Insights or your monitoring system.

**URL** : `/HealthCheck/`

**Method** : `GET` / `POST`

**Auth required** : Only deployed version, if authentication is activated (strongly recommended) 

**Permissions required** : None

**Data constraints** 
None, no request parameter or bodies are required

**Header constraints**
API key may be passed via header

#### **Success Response**
HTTP-response as text: `Healthcheck executed successfully.`

#### **Error Response**
No response

<br>

### **AudioBatchFunc API**
**URL** : `/AudioBatchFunc/`

**Method** : `GET` / `POST`

**Auth required** : Only deployed version, if authentication is activated (strongly recommended) 

**Permissions required** : Speech Service(s) app information and keys, see [Get Your Keys](GET_YOUR_KEYS.md) for instructions

**Data constraints** 
***TBD!!!***
```json
{
    ***TBD!!!***
}
```

**Header constraints**
API key must be passed via header.

Key name: "x-functions-key"
Value: "FunctionApp API Key"

#### **Success Responses**

**Condition** : Data provided, correct app information set and Speech information is valid.

**Code** : `200 OK`

**Content example** : ***TBD!!!***

```json
# Audiofiles successfully created
{
    ***TBD!!!***
}
```

#### **Error Responses**

**Condition** : If provided data is invalid, e.g. locale/region not supported.

**Code** : `400 BAD REQUEST`

**Content example** :

```
***TBD!!!***
```

# Setup

## Operations
The section below describes the frameworks to be installed locally before you can get started testing, debugging and deploying the service.

### Local Installation
First, you have to install/set up following components:
1. PowerShell
    - [Azure Command Line Interface (CLI)](https://docs.microsoft.com/de-de/cli/azure/install-azure-cli), command line tools for Azure using PowerShell
    - [Azure Functions Core Tools](https://docs.microsoft.com/de-de/azure/azure-functions/functions-run-local?tabs=windows%2Ccsharp%2Cbash#v2), download for your local runtime environment, e.g. as `.exe` -> _v3.x: Windows 64-Bit_
    - A restart is highly recommended or even required after installing these components, otherwise you might face some hiccups.
2. Python >= 3.8
    - We recommend you to use the official version from the [Python website](https://www.python.org/downloads/release/python-379/), make sure you install `pip` and set Python as `path` variable during the installation
3. Postman
    - Framework for API testing, download it [here](https://www.postman.com/downloads/)

### Testing and Debugging
1. Get your code from GitHub: `git clone https://github.com/microsoft/cai-test-training-tool` and `cd` into folder `BatchTestingTools/AudioGenerationPython.Tool.Function/`
1. Create a virtual environment: `python –m venv .venv`
1. Activate the virtual environment: `source .venv/bin/activate` (Linux) or `.venv\Scripts\activate` (Windows), type `deactivate` to disable it again if needed
1. Install the requirements: `pip install -r requirements.txt`
1. Set your keys (only for local development and debugging) in the `config.ini` (they are needed for the Speech requests)
1. For debugging and local testing, open a separate PowerShell window and execute `func start --verbose` in the root folder of the function. This enables you to do code changes during runtime without shutting down the function completely when there is an issue
1. Use [Postman](https://www.postman.com/downloads/) for testing the endpoints using the localhost request of this [collection](assets/postman_collection/looky_localhost.postman_collection.json)

### Deployment to Azure
1. Open your PowerShell
1. Activate your environment, if you haven't before: <br>
`source .venv/bin/activate` (Linux) or `.venv/Scripts/Activate.ps1` (Windows)
1. Login to your Azure Account: `az login` (a browser window will open, where you may have to log on Azure)
1. Execute the command below:<br> 
`func azure functionapp publish [insert your function name] --remote build`
1. Wait until the deployment is finished
1. (optional, only has to be done for initial deployment OR when settings are updated) Execute following command:<br>
`az webapp config appsettings set -g [insert name of resource group] -n [insert your function name] --settings "@appsettings.json"`
1. Use [Postman](https://www.postman.com/downloads/) for testing the endpoints with the [collections](assets/postman-collection/xxxx.json)

#### Google
The Google authentication-json cannot be inserted into the KeyVault directly, which is why a small detour is necessary.

For this, follow these steps:
- Open a PowerShell and login with az login
- Change directory to the respective location of the auth.json
- az keyvault secret set --vault-name "<keyvaultname" --name "CockpitGoogleAuth" --description "Google TTS Authentication" --file .\auth.json

For Google, you will have to set one key in the App Settings of the Function:
- GOOGLE_APPLICATION_CREDENTIALS_STORE

## Contributing
This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks
This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft 
trademarks or logos is subject to and must follow 
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
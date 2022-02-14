***DRAFT!!!***

![Data Science Toolkit](assets/img/data-science-toolkit-banner.JPG)

# Conversational AI Test & Training Tool

This Solution Accelerator provides Web Application which supports testing and training processes for Cognitive Services Models based on a graphical user interface.
 
Part of the application also provides support to run test cases across multiple services supporting end-2-end testing.

In addition the tool provides a deployment functionality for Microsoft QnA Maker knowledge bases to support the deployment across multiple QnA Maker services to support separate environments for training and testing of knowlegde bases vs. productive deployment.
  
## High Level Architecture

TBD!

## Deployoment of the solution

TBD!

### Setting up the required Azure services

TBD!

### Main Application

#### Run the application


To run the main application the following software must be installed:
- Node.js = 14.x
- yarn

On the `/webapp` folder run the follwoing commands in sequence:
```
yarn install
yarn build
yarn start
```

`yarn install` will ensure all required dependencies are fetched from npm.

`yarn build` will compile both server and client source codes.

`yarn start` starts the application in Production mode.

__Note:__ When running locally you can also use `yarn start:dev`. This target will start the application in Development mode (i.e. the NODE_ENV variable is set to development). The code is prepared to read the environment variables from an .env file when running in Development mode.

The application is running once the following output is seen in the console:

//TODO -- add here stuff.

#### Setting Application Settings

For the app to run there is a set of settings that need to be provided as environment variables. Locally it is recomended that these variables can be set locally using a .env file that should not be commited in a repo.
When deploying the code in an Azure Web App these variables can be set up directly in the Web App instance Configuration pane as seen in the figure below.

![Web application configuration screen](assets/img/webapp-config.jpeg)

The required settings for the running the app are the following:
| Setting Name | Description |
|--------------| ------------|
|SA_CONNECTION_STRING | Storage account connection string |
|**QNA_ACCESS_KEY_UAT** | QNA Maker Subscription Key |
|API_KNOWLEDGE_BASE | URL to the QnaMaker| 
|**CONTAINER_NAME** | "ADD HERE"|
|TENANTID | ID of the Active Directory Tennat|
|CLIENTID | Client ID of the App Registration used for authentication|
|REDIRECT_URL | Redirect URL used on the authentication flow. Should be in the format "https://\<hostname\>/auth/aad/callback"|
|CLIENT_SECRET | Client Secret of the App Registration used for user authentication|
|SPEECH_SERVICE_KEY | Subscription Key for Speech Service|
|SPEECH_SERVICE_REGION | Region of the Speech Service|
|QNA_ENV | Names of Environments you are using for the QnA Maker Testing as array: e.g. ["TEST", "DEV"] |
|QNA_KEY | Connection keys for the enironments defined for QNA_ENV as array: e.g. ["<key_for_TEST>", "<key_for_DEB>"] |
|QNA_PROD_KEY | Connection key for the production environment used in the QnA Maker Deploymwent: "<key_for_PROD>" |
|QNA_PRD_DEPLOYMENT_TEST_COVERAGE_IN_PERCENT | Percentage of test cases that will be tested in the production environment: e.g. "50" |


#### Multilanguge support
The frontend application has supports localization through the usage of the i18n library (more information available on the [i18n library official website](https://www.i18next.com/)). 

Each language has its own json file that defines the texts that appear in the lables. Those json files are stored in the public folder of the webapp as can be seen in the image below:

![Web application language files](assets/img/webapp-multilanguage.jpg)


To add a new language to the tool the following steps need to be performed:
1. Create a new folder inside `webapp/public/locales`for the new language file. The name of the new folder should match the name of the language you are adding. (e.g. If adding Spanish, the folder should be named `es`).

2. Inside the newly created folder add a `translation.json` file. To ensure that no label is missed, copy the translation.json from another language such as `en` or `de`.

3. Add the new langauge in the list of allowed languages for the app. On the `/webapp/client/src/i18nextConf.js` file, append the language to the whitelist array.
 ```javascript
.init({
    debug: true,

    whitelist: ['en','de', 'ADD HERE NEW LANGUAGE'],

    fallbackLng: 'en',

 ```

#### Deployment to Azure


### Backend Functions

### Batch Testing Function
The batch testing function depends on Azure storage account. This function uses tables, blobs and queues from the storage account.

**Creating Storage Account:**
The following steps needs to be performed:
1. Create a storage account in your subscription.
2. Add constainer with the name `voices` in the storage account's blob.
3. Create two tables in the storage account's tables with the names `BatchJobs` and `BatchJobDetails`.
4. Create three queues in the storage account's queues with the names `Customprocessingtasks`, `Speechtasks` and `voicesfilestasks`.

**Creating Azure Function**
1. Create Azure Function, App Service Plan and Windows based.
2. Switch On `Always On` feature. 

#### Code Deployment

TBD!

#### Setting Application Settings

The required settings for the running the app are the following:
| Setting Name | Description |
|--------------| ------------|
| AzureWebJobsStorage | Storage account connection string |
| TableStorageConnectionString | Queues storage account connection string, If you are following the steps in this document you will have one storage account |
| BatchJobTableName | This is the batch job table name. If you are using the table names listed in this document, then set this to `BatchJobs` |
| BatchJobDetailsTableName | This is the batch job table name. If you are using the table names listed in this document, then set this to `BatchJobDetails` |
| SpeechSubscriptionKey | This is the key for the speech subscription created earlier |
| region | This is the speech subscribtion region, for example westeurope |
| LPRCPLFunctionURL | This is the URL for the LPR function, the URL should be in the format "https://\<The LPR function URL\>/api/LicensePlateRecognizer" |
| LPRCPLFunctionKey | The LPR Function code |
| WERFunctionURL | This is the URL for the WER function, the URL should be in the format "https://\<The WER function URL\>/api/BatchTesting"|
| WERFunctionKey | The WER Function code |


## Usage of Tool

To get guidance on the usage of the Tool read the [User Guide](UserGuide.md).

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

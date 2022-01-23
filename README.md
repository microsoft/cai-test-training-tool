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

#### Multilanguge support
The frontend application has supports localization through the usage of the i18n library (more information available on the [i18n library official website](https://www.i18next.com/)). 

To add a new language to the tool the following steps need to be performed:


#### Deployment to Azure


### Backend Functions

TBD!

#### Code Deployment

TBD!

#### Setting Application Settings

TBD!

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

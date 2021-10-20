***DRAFT!!!***

# Table of contents
1. [QnA Maker Testing & Deployment](#QnATest+Deploy)
    1. [QnA Maker Testset](#Testset)
        1. [Testing a KB](#TestingKB)
            1. [Result Details](#TestingResults)
        1. [Deploying a new KB](#DeployingKB)
            1. [Result Details](#DeploymentResults)
1. [Speech Testing](#SpeechTesting)

# QnA Maker Testing & Deployment <a name="QnATest+Deploy"></a>

## QnA Maker Testset <a name="Testset"></a>

The testset must be a textfile (.txt) with the following structure:

*Question;Answer;Metadata;IsContextOnly;Propmts;QnAId;MinScore*

The 1st line can be any Text and can also be used for comments.

Prompts and MinScore columns are optional. The values are optional, however you must have the colum separation with ";" in the file. MinScore is used to define an optional Confidence Score for the answer.

Example: [Testset_Sample.txt](assets/samples/Testset_Sample.txt)

## Testing a KB <a name="TestingKB"></a>

TBD!

### Result Details <a name="DeploymentResults"></a>

To view the results of your tests you can open the "Detailansicht" after the test run is complete.
![image.png]()

## Deploying a new KB <a name="DeployingKB"></a>

To run a deployment of a QnAMaker KB into Production you must use the [Bot Management Tool](https://app-goblabla-botmanagement-uat.azurewebsites.net/deploy-initial).

After logging in to the tool navigate to the "QnA Maker Deployment" section
![image.png](assets/img/image-f1d276d1-f5b2-4a3c-a851-95f4c11e5443.png)

Select "Neues Deployment"
![image.png](assets/img/image-b74ef95a-9963-4e2c-937e-fc746e14b21c.png)

Select a Knowledge Base from the Drop-Down-List and upload a file with your testcases.
![image.png](assets/img/image-a5e92532-b00a-4dc8-bddf-e1d83d16d1f0.png)

You can add an optional comment. Then select "Deployment Starten"
![image.png](assets/img/image-f5a22b0f-d6ec-403a-be38-a36c9c4f3a58.png)

The new deployment will appear in the "QnA Deployment" section list with status "Angenommen":
![image.png](assets/img/image-d8530157-e4a9-4d3f-ba9a-cf73e66140d2.png)

### Result Details <a name="DeploymentResults"></a>

To view the results of your deployment tests you can open the "Detailansicht" after the deployment is complete.
![image.png](assets/img/image-d9dbcc79-f023-42b0-9277-4646e1c946dd.png)

# Speech Testing <a name="SpeechTesting"></a>

TBD!

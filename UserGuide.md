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

The 1st line can be any Text and can also be used for comments. This line is ignored in the testing process.

Prompts and MinScore columns are optional. The values are optional, however you must have the colum separation with ";" in the file. MinScore is used to define an optional Confidence Score for the answer.

Example: [Testset_Sample.txt](assets/samples/Testset_Sample.txt)

### Generate a testset from existing knowledge base <a name="TestsetGeneration"></a>

To create a testset based on an existing knowledge base you can use the export functionality of the QnA maker:
1. Go to https://www.qnamaker.ai/ and select the knowledge base you want to use for the testset
2. Go to the settings page, under "Export knowledge base" select "QnAs" and export the knowledge base as Excel file
3. Open the downloaded file in Excel
4. Delete the "Source" and the "SuggestedQuestions" column
5. Add a last column "MinScore" and enter a value between 0 and 100 for each entry
6. Save the file as Text (tab delimited)
7. Replace the tabs with a simicolon. You can do so using Text Editors like notepad++ using Find and Replace option using regular expressions. (Find: "\t", Replace: ";")

Make sure you only include important questions in your testset so you don't exceed 150 testcases. Otherwise the execution time will be long and the results harder to debug.

## Testing a KB <a name="TestingKB"></a>

To test a knowledge base go to the QnA testing page of the tool:

![image](https://user-images.githubusercontent.com/45654580/150695901-c69d7299-c1d9-404b-a3d4-88a078f4551e.png)

1. Select an environment that contains the knowledge base you want to test.
2. Then you can chose the knowledge base you want to test
3. Upload a test file. Make sure it is compliant to the format described above.
4. If the format check of the test file was successful, you can start the test run by clicking the start button on the bottom of the page.
5. A new entry is created on the test overview page

### Result Details <a name="DeploymentResults"></a>

To view the results of your tests you can open the details page after the test run is complete by clicking on the job id of the test run:

![image](https://user-images.githubusercontent.com/45654580/150700403-d8d938a4-aa53-472a-9557-84d5c8d77fa0.png)

![image](https://user-images.githubusercontent.com/45654580/150700420-5107d1eb-4214-41f1-903a-dc153504d971.png)



## Deploying a new KB <a name="DeployingKB"></a>

To run a deployment of a QnAMaker KB into Production you cav use the [Bot Management Tool](https://app-goblabla-botmanagement-uat.azurewebsites.net/deploy-initial). 

After logging in to the tool navigate to the "QnA Maker Deployment" section
![image](https://user-images.githubusercontent.com/45654580/150743324-df113df3-d1a1-4298-96f0-b95484aaeacb.png)

Select "New Deployment"
![image](https://user-images.githubusercontent.com/45654580/150743410-22bc2fb3-bb21-4c31-8e6d-7e96af500f1d.png)

Select a Knowledge Base from the Drop-Down-List and upload a file with your testcases. The knowledge base should be tested with the same test set using the QnA Test section before.

![image](https://user-images.githubusercontent.com/45654580/150743770-77fc6266-3f94-40ae-8473-a20afea2aceb.png)

You can add an optional comment. Then select "Start Deployment".
    
For the deployment only a certain percantage of the test cases defined in the testset is executed. This value is configured in the app settings of the tool.

The new deployment will appear in the "QnA Deployment" section list with status "In progress":
![image](https://user-images.githubusercontent.com/45654580/150744203-02d6e5a0-884c-4f70-b398-52469b132d55.png)
### Result Details <a name="DeploymentResults"></a>

To view the results of your deployment tests you can open a detailed view after the deployment is complete by clicking on the job id.
![image](https://user-images.githubusercontent.com/45654580/150743923-71076390-8b84-4f0b-bd54-828ac79daccb.png)
# Speech Testing <a name="SpeechTesting"></a>

TBD!

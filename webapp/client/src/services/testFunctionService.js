import { handleResponse } from "./utils";


async function triggerTestExecution(
  environment,
  testset,
  knowledgeBaseId,
  runId
) {
  const requestOptions = {
    method: "POST",
  };
  return fetch(
      "/api/testknowledgebase/start?" +
      new URLSearchParams({
        environment: environment,
        testset: testset,
        knowledgeBaseId: knowledgeBaseId,
        runId: runId,
      }),
    requestOptions
  ).then((response) => {
    return handleResponse(response);
  });
}

export default triggerTestExecution;

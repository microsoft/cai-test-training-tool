import { handleResponse } from "./utils";

export async function startReleasePipeline(partitionKey, kbId, testsetName, comment) {
  const requestOptions = {
    method: "POST",
  };
  return fetch(
      "/api/pipeline/start?" +
      new URLSearchParams({
        partitionKey: partitionKey,
        kbId: kbId,
        testsetName: testsetName,
        comment: comment
      }),
    requestOptions
  ).then((response) => {
    return handleResponse(response);
  });
}
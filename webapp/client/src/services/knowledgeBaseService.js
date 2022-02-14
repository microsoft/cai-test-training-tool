import { handleResponse } from "./utils";

export default async function getKnowledgeBases(environment) {
  const requestOptions = {
    method: "GET",
  };
  return fetch(
      "/api/knowledgebase/get?" +
      new URLSearchParams({
        environment: environment,
      }),
    requestOptions
  ).then((response) => {
    return handleResponse(response);
  });
}

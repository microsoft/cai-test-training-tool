export function range(start, count) {
  return Array.apply(0, Array(count)).map((element, index) => index + start);
}

export function generateRunId() {
  return String(Math.round(+new Date() / 1000)).substring(4);
}

export async function handleResponse(response) {
  if (!response.ok && response.status !== 404) {
    try {
      const body = await response.json();
      console.log(body.error_message, body.errors);
    } catch (e) {
      console.error("error converting response body: ", e);
      // throw new Error(`${response.status} ${response.statusText}`);
    }
  }
  if (!response.ok) {
    console.error("error with response: ", response);
    // throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json();
}

export function getEnvironmentVariable(variable) {
  return process.env["REACT_APP_" + variable];
}
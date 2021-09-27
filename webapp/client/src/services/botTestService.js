import httpClient from 'axios';

export async function getBots() {
  return httpClient.get(`/api/file/getcontainerhierarchy`)
  .then((response) => {
    return response.data
  });
}

export async function getNumberFromTranscript(transcript, bot) {
  return httpClient.get(`/api/file/getphonenumber/${bot}/${transcript}`)
  .then((response) => {
    return response.data
  });
}

export async function startBotTests(buildParameters) {
  return httpClient.post(`/api/pipeline/startbottest`,{
    buildParameters
  })
  .then((response) => {
    return response.data
  });
}

export async function deleteTranscript(transcript, bot) {
  return httpClient.delete(`/api/file/transcript/${bot}/${transcript}`
  ).then((response) => {
    return response.data
  });
}


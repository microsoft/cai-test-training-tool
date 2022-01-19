import httpClient from 'axios';

export async function sendMessage(body) {
  return httpClient.post(`/api/audiobatch/job`,
    body,
  
  ).then((response) => {
    return response.data
  });
}


import httpClient from 'axios';

export async function sendMessage(queueName, body) {
  return httpClient.post(`/api/queue/job?queueName=${queueName}`,
    body,
  
  ).then((response) => {
    return response.data
  });
}


import { handleResponse } from "./utils";
import httpClient from 'axios';

export async function getTableStorage(suffix) {
  return httpClient.get(`/api/tablestorage?tableName=${suffix}`)
  .then((response) => {
    return response.data
  });
}

export async function createJob(suffix, body) {
  return httpClient.post(`/api/tablestorage/job?tableName=${suffix}`,
    body
  ).then((response) => {
    return response.data
  });
}

export async function deleteEntity(tableName,partitionKey,rowKey) {
  return httpClient.delete(`/api/tablestorage/${tableName}/${partitionKey}/${rowKey}`
  ).then((response) => {
    return response.data
  });
}

export async function getEntity(tableName,partitionKey,rowKey) {
  return httpClient.get(`/api/tablestorage/${tableName}/${partitionKey}/${rowKey}`
  ).then((response) => {
    return response.data[0]
  });
}

export async function getEntityPartition(tableName,partitionKey) {
  return httpClient.get(`/api/tablestorage/${tableName}/${partitionKey}`
  ).then((response) => {
    return response.data
  });
}


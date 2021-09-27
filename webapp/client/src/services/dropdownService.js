import httpClient from 'axios';

const URLBASE = '/api/dropdowns'

export async function getAllActions() {
    return (await httpClient.get(`${URLBASE}/actions`)).data
}


export async function getActionById(botName, actionId) {
    return (await httpClient.get(`${URLBASE}/actions/${botName}/${actionId}`)).data
}


export async function updateAction(action) {
    return (await httpClient.put(`${URLBASE}/actions/${action.botName}aaaaaaa/${action.key}`, action)).status;
}

export async function createNewAction(action) {
    return (await httpClient.post(`${URLBASE}/actions`, action)).status;
}

export async function deleteAction(botName, actionId) {

    return (await httpClient.delete(`${URLBASE}/actions/${botName}/${actionId}`)).status == 200;
}

export async function getActionProperties() {
    return (await httpClient.get(`${URLBASE}/actions/baseProperties`)).data;
}
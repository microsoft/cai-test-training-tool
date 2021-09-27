import httpClient from 'axios';

const URLBASE = '/api/settings'

export async function getAllActions() {
    return (await httpClient.get(`${URLBASE}/actions`)).data
}


export async function getActionById(setting, actionId) {
    return (await httpClient.get(`${URLBASE}/actions/${setting}/${actionId}`)).data
}


export async function updateAction(action) {
    return (await httpClient.put(`${URLBASE}/actions/${action.setting}/${action.key}`, action)).status;
}

export async function createNewAction(action) {
    return (await httpClient.post(`${URLBASE}/actions`, action)).status;
}

export async function deleteAction(setting, actionId) {

    return (await httpClient.delete(`${URLBASE}/actions/${setting}/${actionId}`)).status == 200;
}

export async function getActionProperties() {
    return (await httpClient.get(`${URLBASE}/actions/baseProperties`)).data;
}
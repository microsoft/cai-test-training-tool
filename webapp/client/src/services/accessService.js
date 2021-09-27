import httpClient from 'axios';

const URLBASE = '/api/access'

export async function getAllGroups() {
    return (await httpClient.get(`${URLBASE}/groups`)).data
}

export async function hasAccessRight(group) {
    return (await httpClient.get(`${URLBASE}/groups/${group}`)).data
}

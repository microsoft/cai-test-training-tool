import httpClient from 'axios';

const URLBASE = '/api/speech'

export async function getModels() {
    return (await httpClient.get(`${URLBASE}/models`)).data
}


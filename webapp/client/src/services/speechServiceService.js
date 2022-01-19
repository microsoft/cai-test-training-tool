import httpClient from 'axios';

const URLBASE = '/api/speech'

export async function getModels() {
    return (await httpClient.get(`${URLBASE}/models`)).data
}

export async function getVoices() {
    return (await httpClient.get(`${URLBASE}/voices`)).data
}




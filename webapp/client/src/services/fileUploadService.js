import { handleResponse } from "./utils";

export const uploadFilesToBlob = async (files, containerName, path="") => {
  if (!files) return [];

  const formData = new FormData();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    formData.append(`file${i+1}`, file);
  }

  const requestOptions = {
    method: "POST",
    body: formData,
  };

  return fetch(`/api/file?container=${containerName}${path != "" ? `&path=${path}` : ""}`, requestOptions).then(
    (response) => {
      return handleResponse(response);
    }
  );
};

export const deleteFilesInBlobFolder = async (containerName, pathToFolder="") => {
  const requestOptions = {
    method: "DELETE",
  };

  return fetch(`/api/file/${containerName}/${pathToFolder}`, requestOptions).then(
    (response) => {
      return handleResponse(response);
    }
  );
};



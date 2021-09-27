import { handleResponse } from "./utils";

export const uploadFileToBlob = async (file) => {
  if (!file) return [];

  const formData = new FormData();
  formData.append("files", file);
  const requestOptions = {
    method: "POST",
    body: formData,
  };

  return fetch("/api/file", requestOptions).then(
    (response) => {
      return handleResponse(response);
    }
  );
};



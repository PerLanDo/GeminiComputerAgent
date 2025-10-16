
export const imageUrlToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            // result is "data:mime/type;base64,..." - we need to strip the prefix
            resolve((reader.result as string).split(',')[1]);
          } else {
            reject(new Error("FileReader failed to read blob."));
          }
        };
        reader.onerror = () => {
          reject(new Error("FileReader error."));
        };
        reader.readAsDataURL(blob);
      })
      .catch(error => {
        console.error('Error fetching or converting image:', error);
        reject(error);
      });
  });
};

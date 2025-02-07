import { PUBLIC_SERVER_VERSION } from "$env/static/public";

async function uploadFile(file:File) {
    // construct formdata with file key
    const formData = new FormData();
    formData.append('file', file);
    const resp = await fetch(`/api/${PUBLIC_SERVER_VERSION}/upload`, {
        method: 'POST',
        body: formData
    });
    return resp;
}

export default uploadFile;
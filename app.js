const responseField = document.getElementById('response');

const apiBaseUrlField = document.getElementById('apiBaseUrl');
const idInstanceField = document.getElementById('idInstance');
const apiTokenField = document.getElementById('apiTokenInstance');

const chatIdMessageField = document.getElementById('chatIdMessage');
const messageField = document.getElementById('message');

const chatIdFileField = document.getElementById('chatIdFile');
const fileUrlField = document.getElementById('fileUrl');

const getSettingsBtn = document.getElementById('getSettingsBtn');
const getStateInstanceBtn = document.getElementById('getStateInstanceBtn');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const sendFileByUrlBtn = document.getElementById('sendFileByUrlBtn');

function setResponse(data) {
  if (typeof data === 'string') {
    responseField.value = data;
    return;
  }

  responseField.value = JSON.stringify(data, null, 2)
}

function getCredentials() {
  const apiBaseUrl = apiBaseUrlField.value.trim();
  const idInstance = idInstanceField.value.trim();
  const apiTokenInstance = apiTokenField.value.trim();

  if (!apiBaseUrl || !idInstance || !apiTokenInstance) {
    throw new Error(
      'ERROR: fields (apiBaseUrl, idInstance, ApiTokenInstance) are not filled in.'
    );
  }

  return { apiBaseUrl, idInstance, apiTokenInstance };
}

function buildUrl(methodName, apiBaseUrl, idInstance, apiTokenInstance) {
  return new URL(
    `/waInstance${idInstance}/${methodName}/${apiTokenInstance}`,
    apiBaseUrl
  ).href
}

async function request(methodName, httpMethod = 'GET', body = null) {
  const { apiBaseUrl, idInstance, apiTokenInstance } = getCredentials();
  const url = buildUrl(methodName, apiBaseUrl, idInstance, apiTokenInstance);
  const options = {
    method: httpMethod,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(JSON.stringify(data, null, 2) || `HTTP ${res.status}`)
  }

  return data;
}

function getFileNameFromUrl(url) {
  try {
    const parsed = new URL(url);
    const part = parsed.pathname.split('/').pop();
    return part || 'file';
  } catch {
    return 'file';
  }
}

async function handleAction(button, action) {
  const originalText = button.textContent;

  try {
    button.disabled = true;
    button.textContent = 'Loading...';
    setResponse('Loading...');

    const result = await action();
    setResponse(result);
  } catch (error) {
    setResponse(error.message || 'ERROR: Unknown error');
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

// https://green-api.com/docs/api/account/GetSettings
getSettingsBtn.addEventListener('click', () => {
  handleAction(getSettingsBtn, async () => {
    return await request('getSettings', 'GET');
  });
});

// https://green-api.com/docs/api/account/GetStateInstance
getStateInstanceBtn.addEventListener('click', () => {
  handleAction(getStateInstanceBtn, async () => {
    return await request('getStateInstance', 'GET');
  });
});

// https://green-api.com/docs/api/sending/SendMessage
sendMessageBtn.addEventListener('click', () => {
  handleAction(sendMessageBtn, async () => {
    const chatId = chatIdMessageField.value.trim();
    const message = messageField.value.trim();

    if (!chatId || !message) {
      throw new Error('ERROR: fields (chatId, message) are not filled in.')
    }

    return await request('sendMessage', 'POST', {
      chatId,
      message
    });
  });
});

// https://green-api.com/docs/api/sending/SendFileByUrl
sendFileByUrlBtn.addEventListener('click', () => {
  handleAction(sendFileByUrlBtn, async () => {
    const chatId = chatIdFileField.value.trim();
    const urlFile = fileUrlField.value.trim();

    if (!chatId || !urlFile) {
      throw new Error('ERROR: fields (chatId, urlFile) are not filled in.');
    }

    return await request('sendFileByUrl', 'POST', {
      chatId,
      urlFile,
      fileName: getFileNameFromUrl(urlFile)
    });
  });
});

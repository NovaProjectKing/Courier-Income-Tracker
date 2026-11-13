import { Platform } from 'react-native';
import { clearTokens, readTokens, saveTokens } from './secureTokens';

const API_BASE = 'https://lknpd.nalog.ru/api/v1';
const APP_VERSION = '1.0.0';
const ACCESS_TOKEN_FALLBACK_MS = 55 * 60 * 1000;
let currentTokens = null;

const makeUserAgent = () =>
  `CourierIncomeTracker/${APP_VERSION} (${Platform.OS}; ReactNative)`;

const describeAuthError = (status) => {
  if (status === 400 || status === 401 || status === 403) {
    return 'Проверьте ИНН и пароль от личного кабинета «Мой налог».';
  }
  if (status === 429) return 'Слишком много попыток. Попробуйте позже.';
  if (status >= 500) return 'Сервис «Мой налог» временно недоступен.';
  return 'Не удалось войти. Проверьте данные и попробуйте ещё раз.';
};

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function tokenFields(data, previousRefreshToken) {
  const accessToken = data.access_token || data.accessToken;
  const refreshToken =
    data.refresh_token || data.refreshToken || previousRefreshToken;
  if (!accessToken || !refreshToken) {
    throw new Error('Сервис авторизации вернул неполный ответ.');
  }

  const expiresIn = Number(data.expires_in || data.expiresIn);
  return {
    accessToken,
    refreshToken,
    expiresAt:
      Date.now() +
      (Number.isFinite(expiresIn) && expiresIn > 0
        ? expiresIn * 1000
        : ACCESS_TOKEN_FALLBACK_MS),
  };
}

export async function loginToMyTax(inn, password, deviceId) {
  let response;
  try {
    response = await fetch(`${API_BASE}/auth/lkfl`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: inn,
        password,
        deviceInfo: {
          sourceDeviceId: deviceId,
          sourceType: 'WEB',
          appVersion: APP_VERSION,
          metaDetails: { userAgent: makeUserAgent() },
        },
      }),
    });
  } catch {
    throw new Error('Нет подключения к интернету. Проверьте сеть и повторите.');
  }

  const data = await readJson(response);
  if (!response.ok) throw new Error(describeAuthError(response.status));

  const tokens = tokenFields(data);
  currentTokens = tokens;
  await saveTokens(tokens);
  return tokens;
}

export async function restoreMyTaxSession() {
  currentTokens = await readTokens();
  return currentTokens;
}

export async function refreshMyTaxSession() {
  if (!currentTokens?.refreshToken) {
    currentTokens = await readTokens();
  }
  if (!currentTokens?.refreshToken) {
    throw new Error('Сессия завершена. Войдите в личный кабинет заново.');
  }

  let response;
  try {
    response = await fetch(`${API_BASE}/auth/token`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: currentTokens.refreshToken }),
    });
  } catch {
    throw new Error('Нет подключения к интернету.');
  }

  const data = await readJson(response);
  if (!response.ok) {
    if ([400, 401, 403].includes(response.status)) {
      await clearTokens();
      currentTokens = null;
      throw new Error('Сессия истекла. Войдите в «Мой налог» заново.');
    }
    throw new Error(
      response.status >= 500
        ? 'Сервис «Мой налог» временно недоступен.'
        : 'Не удалось обновить сессию.',
    );
  }

  currentTokens = tokenFields(data, currentTokens.refreshToken);
  await saveTokens(currentTokens);
  return currentTokens;
}

async function validAccessToken() {
  if (!currentTokens) currentTokens = await readTokens();
  if (!currentTokens?.refreshToken) {
    throw new Error('Сессия завершена. Войдите в «Мой налог» заново.');
  }
  if (
    !currentTokens.accessToken ||
    !currentTokens.expiresAt ||
    currentTokens.expiresAt < Date.now() + 60_000
  ) {
    await refreshMyTaxSession();
  }
  return currentTokens.accessToken;
}

export async function myTaxRequest(path, options = {}) {
  let token = await validAccessToken();
  const makeRequest = (accessToken) =>
    fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

  let response;
  try {
    response = await makeRequest(token);
  } catch {
    throw new Error('Нет подключения к интернету.');
  }

  if (response.status === 401) {
    await refreshMyTaxSession();
    token = await validAccessToken();
    try {
      response = await makeRequest(token);
    } catch {
      throw new Error('Нет подключения к интернету.');
    }
  }

  if (!response.ok) {
    if (response.status >= 500) {
      throw new Error('Сервис «Мой налог» временно недоступен.');
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error('Сессия завершена. Войдите в «Мой налог» заново.');
    }
    throw new Error(`Не удалось получить данные: ошибка ${response.status}.`);
  }

  return response;
}

export async function loadIncomeChecks() {
  const response = await myTaxRequest('/income', {
    method: 'POST',
    body: JSON.stringify({
      sortField: 'paidAt',
      sortDirection: 'DESC',
      limit: 100,
    }),
  });
  const data = await readJson(response);
  if (!Array.isArray(data.content)) {
    throw new Error('Сервис вернул список чеков в неожиданном формате.');
  }
  return data.content;
}

export async function requestIncomeCertificate() {
  const response = await myTaxRequest('/income/summary', { method: 'GET' });
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return { type: 'json', data: await readJson(response) };
  }
  return {
    type: contentType.includes('pdf') ? 'pdf' : 'text',
    data: await response.text(),
    contentType,
  };
}

export async function clearMyTaxSession() {
  currentTokens = null;
  await clearTokens();
}

import * as Keychain from 'react-native-keychain';

const TOKEN_SERVICE = 'my-income-courier.mynalog';

export async function readTokens() {
  const item = await Keychain.getGenericPassword({ service: TOKEN_SERVICE });
  if (!item) return null;

  try {
    return JSON.parse(item.password);
  } catch {
    await clearTokens();
    return null;
  }
}

export async function saveTokens(tokens) {
  await Keychain.setGenericPassword('mynalog', JSON.stringify(tokens), {
    service: TOKEN_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function clearTokens() {
  await Keychain.resetGenericPassword({ service: TOKEN_SERVICE });
}

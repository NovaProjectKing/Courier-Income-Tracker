import {
  collection,
  deleteDoc,
  doc,
  getDocFromCache,
  getDocs,
  getDocsFromCache,
  getFirestore,
  setDoc,
  writeBatch,
} from '@react-native-firebase/firestore';

const firestore = getFirestore();

const deviceDocument = (deviceId) => doc(firestore, 'devices', deviceId);
const checksCollection = (deviceId) =>
  collection(firestore, 'devices', deviceId, 'checks');
const earningsCollection = (deviceId) =>
  collection(firestore, 'devices', deviceId, 'earnings');

export async function readDeviceCache(deviceId) {
  const [profile, checks, earnings] = await Promise.all([
    getDocFromCache(deviceDocument(deviceId)).catch(() => null),
    getDocsFromCache(checksCollection(deviceId)).catch(() => null),
    getDocsFromCache(earningsCollection(deviceId)).catch(() => null),
  ]);

  return {
    profile: profile?.exists() ? profile.data() : null,
    checks: checks?.docs.map((item) => ({ id: item.id, ...item.data() })) || [],
    earnings:
      earnings?.docs.map((item) => ({ date: item.id, ...item.data() })) || [],
  };
}

export async function saveDeviceProfile(deviceId, profile) {
  await setDoc(
    deviceDocument(deviceId),
    { ...profile, updatedAt: Date.now() },
    { merge: true },
  );
}

function stableCheckId(item) {
  const remoteId = item.id || item.incomeId || item.checkId || item.uuid;
  if (remoteId) return String(remoteId).replaceAll('/', '_');
  const seed = `${item.amount}|${item.paidAt}|${item.service}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 4294967296;
  }
  return `receipt-${hash.toString(16)}`;
}

export function normalizeCheck(item) {
  const amount = Number(item.totalAmount ?? item.amount ?? 0);
  const paidAt = new Date(item.paidAt).getTime();
  if (!Number.isFinite(amount) || !Number.isFinite(paidAt)) return null;

  return {
    id: stableCheckId({
      id: item.id || item.incomeId || item.checkId || item.uuid,
      amount,
      paidAt,
      service: String(item.service || 'Услуга'),
    }),
    amount,
    paidAt,
    service: String(item.service || 'Услуга').trim(),
  };
}

async function persistChecks(deviceId, checks) {
  for (let offset = 0; offset < checks.length; offset += 400) {
    const batch = writeBatch(firestore);
    checks.slice(offset, offset + 400).forEach((check) => {
      batch.set(doc(checksCollection(deviceId), check.id), check, {
        merge: true,
      });
    });
    await batch.commit();
  }
}

async function rebuildDailyEarnings(deviceId) {
  const cached = await getDocsFromCache(checksCollection(deviceId));
  const daily = new Map();

  cached.docs.forEach((snapshot) => {
    const check = snapshot.data();
    const date = new Date(check.paidAt);
    if (Number.isNaN(date.getTime())) return;
    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
    const current = daily.get(dateKey) || { date: dateKey, amount: 0, orders: 0 };
    current.amount += Number(check.amount) || 0;
    current.orders += 1;
    daily.set(dateKey, current);
  });

  const days = [...daily.values()];
  for (let offset = 0; offset < days.length; offset += 400) {
    const batch = writeBatch(firestore);
    days.slice(offset, offset + 400).forEach((day) => {
      batch.set(doc(earningsCollection(deviceId), day.date), {
        ...day,
        tax: day.amount * 0.06,
        updatedAt: Date.now(),
      });
    });
    await batch.commit();
  }
}

export async function cacheIncomeChecks(deviceId, rawChecks) {
  const checks = rawChecks.map(normalizeCheck).filter(Boolean);
  await persistChecks(deviceId, checks);
  await rebuildDailyEarnings(deviceId);
  return readDeviceCache(deviceId);
}

async function removeCollectionDocuments(reference) {
  let documents;
  try {
    documents = (await getDocs(reference)).docs;
  } catch {
    documents = (await getDocsFromCache(reference).catch(() => null))?.docs || [];
  }

  for (let offset = 0; offset < documents.length; offset += 400) {
    const batch = writeBatch(firestore);
    documents.slice(offset, offset + 400).forEach((item) => batch.delete(item.ref));
    await batch.commit();
  }
}

export async function clearDeviceCache(deviceId) {
  await Promise.all([
    removeCollectionDocuments(checksCollection(deviceId)),
    removeCollectionDocuments(earningsCollection(deviceId)),
    deleteDoc(deviceDocument(deviceId)),
  ]);
}

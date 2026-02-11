/**
 * lib/admin/data.ts
 * 管理画面用データ取得関数
 * クライアントサイドからAPI Routeを呼び出す
 */

// ─── 型定義 ───

export type Stats = {
  totalContacts: number;
  contactsThisMonth: number;
  totalDiagnoses: number;
  diagnosesThisMonth: number;
  totalAppointments: number;
  appointmentsThisMonth: number;
  conversionRate: number;
  conversionRateChange: number;
};

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  createdAt: string;
};

export type Diagnosis = {
  id: string;
  name: string;
  phone: string;
  email: string;
  repairLocation: string;
  estimatedCostMin: number;
  estimatedCostMax: number;
  insuranceLikelihood: string;
  recommendedPlan: string;
  diagnosisDetails: string;
  severityScore: number;
  firstAidCost: number;
  insuranceReason?: string;
  imageUrls: string[];
  claimCode: string;
  adminStatus: string;
  diagnosisResult?: any;
  createdAt: string;
};

export type Appointment = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  preferredDate: string;
  preferredTime: string;
  status: string;
  notes: string;
  diagnosisSessionId: string | null;
  createdAt: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  lineUserId?: string;
  status: string;
  followUpStatus: string;
  nextAction?: string;
  nextActionDate?: string;
  notes?: string;
  contactCount: number;
  diagnosisCount: number;
  appointmentCount: number;
  lastActivity: string;
  createdAt: string;
};

export type TimelineItem = {
  type: 'contact' | 'diagnosis' | 'appointment' | 'note';
  title: string;
  description: string;
  status?: string;
  id?: string;
  createdAt: string;
};

export type FollowUp = {
  status: string;
  nextAction?: string;
  nextActionDate?: string;
};

export type DiagnosisEditHistory = {
  id: string;
  editedByName: string;
  editReason: string;
  previousData: string;
  newData: string;
  createdAt: string;
};

export type SystemSetting = {
  settingKey: string;
  settingValue: string;
  description: string;
};

// ─── API呼び出し関数 ───

async function fetchAPI(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `API Error: ${res.status}`);
  }
  return res.json();
}

// ─── ダッシュボード ───

export async function getStats(): Promise<Stats> {
  const data = await fetchAPI('/api/admin/dashboard');
  return data.stats;
}

export async function getContacts(): Promise<Contact[]> {
  const data = await fetchAPI('/api/admin/dashboard');
  return data.contacts;
}

export async function getDiagnoses(): Promise<Diagnosis[]> {
  const data = await fetchAPI('/api/admin/dashboard');
  return data.diagnoses;
}

export async function getAppointments(): Promise<Appointment[]> {
  const data = await fetchAPI('/api/admin/dashboard');
  return data.appointments;
}

// ダッシュボードデータを一括取得（パフォーマンス最適化）
export async function getDashboardData() {
  return fetchAPI('/api/admin/dashboard');
}

// ─── 顧客管理 ───

export async function getCustomers(): Promise<Customer[]> {
  const data = await fetchAPI('/api/admin/customers');
  return data.customers;
}

export async function getCustomerDetail(customerId: string) {
  const data = await fetchAPI(`/api/admin/customers/${customerId}`);
  return data as { customer: Customer; timeline: TimelineItem[] };
}

export async function getCustomerFollowUp(customerId: string): Promise<FollowUp> {
  const data = await fetchAPI(`/api/admin/customers/${customerId}`);
  return {
    status: data.customer.followUpStatus || 'new',
    nextAction: data.customer.nextAction,
    nextActionDate: data.customer.nextActionDate,
  };
}

export async function updateCustomerFollowUp(
  customerId: string,
  followUp: { status: string; nextAction?: string; nextActionDate?: string }
) {
  await fetchAPI(`/api/admin/customers/${customerId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      action: 'updateFollowUp',
      ...followUp,
    }),
  });
}

export async function addFollowUpNote(customerId: string, note: string) {
  await fetchAPI(`/api/admin/customers/${customerId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      action: 'addNote',
      note,
    }),
  });
}

// ─── 診断 ───

export async function getDiagnosisById(id: string): Promise<Diagnosis | null> {
  try {
    const data = await fetchAPI(`/api/admin/diagnosis/${id}`);
    return data.diagnosis;
  } catch {
    return null;
  }
}

export async function getDiagnosisEditHistory(diagnosisId: string): Promise<DiagnosisEditHistory[]> {
  try {
    const data = await fetchAPI(`/api/admin/diagnosis/${diagnosisId}`);
    return data.editHistory;
  } catch {
    return [];
  }
}

export async function updateDiagnosis(
  diagnosisId: string,
  updates: Partial<{
    repairLocation: string;
    estimatedCostMin: number;
    estimatedCostMax: number;
    insuranceLikelihood: string;
    recommendedPlan: string;
    diagnosisDetails: string;
    severityScore: number;
    firstAidCost: number;
    adminStatus: string;
  }>,
  editReason: string
) {
  await fetchAPI(`/api/admin/diagnosis/${diagnosisId}`, {
    method: 'PATCH',
    body: JSON.stringify({ updates, editReason }),
  });
}

// ─── 設定 ───

export async function getSystemSettings(): Promise<SystemSetting[]> {
  const data = await fetchAPI('/api/admin/settings');
  return data.settings;
}

export async function updateSystemSetting(key: string, value: string) {
  await fetchAPI('/api/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify({ key, value }),
  });
}

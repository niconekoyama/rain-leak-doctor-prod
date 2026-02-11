/**
 * lib/admin/data.ts
 * 管理画面用のデータ型定義とダミーデータ
 * 
 * Phase 3（Supabase接続）で、ここをSupabaseクエリに置き換えます。
 * 現在はUIプレビュー用のダミーデータを返します。
 */

// ─── 型定義 ───
export interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
}

export interface Diagnosis {
  id: number;
  name: string;
  phone: string;
  email?: string;
  repairLocation: string;
  estimatedCostMin: number;
  estimatedCostMax: number;
  insuranceLikelihood: 'high' | 'medium' | 'low' | 'none';
  recommendedPlan: string;
  diagnosisDetails: string;
  severityScore: number;
  firstAidCost: number;
  insuranceReason: string;
  imageUrls: string;
  claimCode: string;
  createdAt: string;
}

export interface Appointment {
  id: number;
  name: string;
  email: string;
  phone: string;
  firstChoice: string;
  secondChoice: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
  aiDiagnosisId?: number;
  createdAt: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  lineUserId?: string;
  contactCount: number;
  diagnosisCount: number;
  appointmentCount: number;
  lastActivity?: string;
  createdAt: string;
}

export interface Stats {
  totalContacts: number;
  contactsThisMonth: number;
  totalDiagnoses: number;
  diagnosesThisMonth: number;
  totalAppointments: number;
  appointmentsThisMonth: number;
  conversionRate: number;
  conversionRateChange: number;
}

export interface TimelineItem {
  type: 'contact' | 'diagnosis' | 'appointment' | 'note';
  title: string;
  description: string;
  status?: string;
  id?: number;
  createdAt: string;
}

export interface FollowUp {
  status: string;
  nextAction?: string;
  nextActionDate?: string;
}

export interface DiagnosisEditHistory {
  id: number;
  editedByName: string;
  editReason: string;
  previousData: string;
  newData: string;
  createdAt: string;
}

export interface SystemSetting {
  settingKey: string;
  settingValue: string;
  description: string;
}

// ─── ダミーデータ ───
// Phase 3でSupabaseクエリに置き換え

export const dummyStats: Stats = {
  totalContacts: 24,
  contactsThisMonth: 8,
  totalDiagnoses: 156,
  diagnosesThisMonth: 32,
  totalAppointments: 18,
  appointmentsThisMonth: 6,
  conversionRate: 34,
  conversionRateChange: 5,
};

export const dummyContacts: Contact[] = [
  {
    id: 1,
    name: '山田太郎',
    email: 'yamada@example.com',
    phone: '090-1234-5678',
    message: '2階の天井から雨漏りがしています。先日の台風以降、雨が降るたびに水滴が落ちてきます。',
    createdAt: '2026-02-10T10:30:00Z',
  },
  {
    id: 2,
    name: '佐藤花子',
    email: 'sato@example.com',
    phone: '080-9876-5432',
    message: '屋根の点検をお願いしたいです。築20年の木造住宅です。',
    createdAt: '2026-02-09T14:15:00Z',
  },
  {
    id: 3,
    name: '鈴木一郎',
    email: 'suzuki@example.com',
    phone: '070-5555-1234',
    message: 'ベランダの防水が劣化しているようで、下の部屋に水が染みてきます。',
    createdAt: '2026-02-08T09:00:00Z',
  },
];

export const dummyDiagnoses: Diagnosis[] = [
  {
    id: 1,
    name: '田中次郎',
    phone: '090-1111-2222',
    email: 'tanaka@example.com',
    repairLocation: '屋根（スレート瓦）のひび割れ・コーキング劣化',
    estimatedCostMin: 150000,
    estimatedCostMax: 350000,
    insuranceLikelihood: 'high',
    recommendedPlan: 'スタンダードプラン',
    diagnosisDetails: 'スレート瓦に複数のひび割れを確認。台風による飛来物の衝撃痕あり。コーキングの劣化も進行しており、早急な対応が必要です。',
    severityScore: 7,
    firstAidCost: 8800,
    insuranceReason: '台風による飛来物の衝撃が原因と推定され、火災保険（風災）の適用可能性が高い',
    imageUrls: '',
    claimCode: 'RLD-2026-001',
    createdAt: '2026-02-10T08:00:00Z',
  },
  {
    id: 2,
    name: '高橋美咲',
    phone: '080-3333-4444',
    repairLocation: 'ベランダ防水層の劣化・排水口詰まり',
    estimatedCostMin: 80000,
    estimatedCostMax: 200000,
    insuranceLikelihood: 'low',
    recommendedPlan: 'ライトプラン',
    diagnosisDetails: 'ベランダの防水層が経年劣化により機能低下。排水口の詰まりも確認。',
    severityScore: 4,
    firstAidCost: 8800,
    insuranceReason: '経年劣化が主因のため保険適用は難しい',
    imageUrls: '',
    claimCode: 'RLD-2026-002',
    createdAt: '2026-02-09T16:30:00Z',
  },
  {
    id: 3,
    name: '伊藤健太',
    phone: '070-5555-6666',
    email: 'ito@example.com',
    repairLocation: '外壁クラックからの浸水・シーリング劣化',
    estimatedCostMin: 200000,
    estimatedCostMax: 500000,
    insuranceLikelihood: 'medium',
    recommendedPlan: 'プレミアムプラン',
    diagnosisDetails: '外壁に幅0.5mm以上のクラックを複数確認。地震による影響の可能性あり。',
    severityScore: 6,
    firstAidCost: 8800,
    insuranceReason: '地震保険の適用可能性を確認中',
    imageUrls: '',
    claimCode: 'RLD-2026-003',
    createdAt: '2026-02-08T11:45:00Z',
  },
];

export const dummyAppointments: Appointment[] = [
  {
    id: 1,
    name: '田中次郎',
    email: 'tanaka@example.com',
    phone: '090-1111-2222',
    firstChoice: '2026年2月15日 10:00',
    secondChoice: '2026年2月16日 14:00',
    status: 'confirmed',
    notes: 'AI診断済み。屋根の現地確認が必要。',
    aiDiagnosisId: 1,
    createdAt: '2026-02-10T09:00:00Z',
  },
  {
    id: 2,
    name: '山田太郎',
    email: 'yamada@example.com',
    phone: '090-1234-5678',
    firstChoice: '2026年2月17日 13:00',
    secondChoice: '2026年2月18日 10:00',
    status: 'pending',
    notes: '',
    createdAt: '2026-02-10T11:00:00Z',
  },
  {
    id: 3,
    name: '佐藤花子',
    email: 'sato@example.com',
    phone: '080-9876-5432',
    firstChoice: '2026年2月12日 15:00',
    secondChoice: '2026年2月13日 11:00',
    status: 'completed',
    notes: '現地調査完了。見積もり作成中。',
    createdAt: '2026-02-07T08:30:00Z',
  },
];

export const dummyCustomers: Customer[] = [
  {
    id: 1,
    name: '田中次郎',
    email: 'tanaka@example.com',
    phone: '090-1111-2222',
    lineUserId: 'U1234567890',
    contactCount: 1,
    diagnosisCount: 2,
    appointmentCount: 1,
    lastActivity: '2026-02-10T09:00:00Z',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 2,
    name: '山田太郎',
    email: 'yamada@example.com',
    phone: '090-1234-5678',
    contactCount: 2,
    diagnosisCount: 1,
    appointmentCount: 1,
    lastActivity: '2026-02-10T11:00:00Z',
    createdAt: '2026-01-20T14:00:00Z',
  },
  {
    id: 3,
    name: '佐藤花子',
    email: 'sato@example.com',
    phone: '080-9876-5432',
    contactCount: 1,
    diagnosisCount: 0,
    appointmentCount: 1,
    lastActivity: '2026-02-09T14:15:00Z',
    createdAt: '2026-02-01T09:00:00Z',
  },
  {
    id: 4,
    name: '高橋美咲',
    email: '',
    phone: '080-3333-4444',
    contactCount: 0,
    diagnosisCount: 1,
    appointmentCount: 0,
    lastActivity: '2026-02-09T16:30:00Z',
    createdAt: '2026-02-05T16:00:00Z',
  },
  {
    id: 5,
    name: '鈴木一郎',
    email: 'suzuki@example.com',
    phone: '070-5555-1234',
    contactCount: 1,
    diagnosisCount: 0,
    appointmentCount: 0,
    lastActivity: '2026-02-08T09:00:00Z',
    createdAt: '2026-02-08T09:00:00Z',
  },
  {
    id: 6,
    name: '伊藤健太',
    email: 'ito@example.com',
    phone: '070-5555-6666',
    lineUserId: 'U9876543210',
    contactCount: 0,
    diagnosisCount: 1,
    appointmentCount: 0,
    lastActivity: '2026-02-08T11:45:00Z',
    createdAt: '2026-02-03T11:00:00Z',
  },
];

// ─── データ取得関数（Phase 3でSupabaseに置き換え） ───

export async function getStats(): Promise<Stats> {
  // TODO: Phase 3 - Supabaseから集計クエリ
  return dummyStats;
}

export async function getContacts(): Promise<Contact[]> {
  // TODO: Phase 3 - supabase.from('contacts').select('*').order('created_at', { ascending: false })
  return dummyContacts;
}

export async function getDiagnoses(): Promise<Diagnosis[]> {
  // TODO: Phase 3 - supabase.from('diagnoses').select('*').order('created_at', { ascending: false })
  return dummyDiagnoses;
}

export async function getAppointments(): Promise<Appointment[]> {
  // TODO: Phase 3 - supabase.from('appointments').select('*').order('created_at', { ascending: false })
  return dummyAppointments;
}

export async function getCustomers(): Promise<Customer[]> {
  // TODO: Phase 3 - Supabaseから顧客一覧取得
  return dummyCustomers;
}

export async function getCustomerDetail(customerId: string) {
  // TODO: Phase 3 - Supabaseから顧客詳細取得
  const customer = dummyCustomers.find(
    (c) => c.email === customerId || c.phone === customerId || c.id.toString() === customerId
  );
  if (!customer) return null;

  const timeline: TimelineItem[] = [
    {
      type: 'diagnosis',
      title: 'AI診断を実施',
      description: '屋根のひび割れに関するAI診断を実施しました',
      id: 1,
      createdAt: '2026-02-10T08:00:00Z',
    },
    {
      type: 'appointment',
      title: '現地調査を予約',
      description: '2026年2月15日 10:00に現地調査を予約',
      status: 'confirmed',
      createdAt: '2026-02-10T09:00:00Z',
    },
    {
      type: 'contact',
      title: 'お問い合わせ',
      description: '天井からの雨漏りについてお問い合わせ',
      createdAt: '2026-02-09T14:15:00Z',
    },
    {
      type: 'note',
      title: 'フォローアップメモ',
      description: '電話にて状況確認済み。見積もり送付予定。',
      createdAt: '2026-02-09T16:00:00Z',
    },
  ];

  return { customer, timeline };
}

export async function getCustomerFollowUp(customerId: string): Promise<FollowUp> {
  // TODO: Phase 3 - Supabaseからフォローアップデータ取得
  return {
    status: 'contacted',
    nextAction: '見積もり送付',
    nextActionDate: '2026-02-15',
  };
}

export async function getDiagnosisById(id: number): Promise<Diagnosis | null> {
  // TODO: Phase 3 - supabase.from('diagnoses').select('*').eq('id', id).single()
  return dummyDiagnoses.find((d) => d.id === id) || null;
}

export async function getDiagnosisEditHistory(diagnosisId: number): Promise<DiagnosisEditHistory[]> {
  // TODO: Phase 3 - supabase.from('diagnosis_edit_history').select('*').eq('diagnosis_id', diagnosisId)
  return [
    {
      id: 1,
      editedByName: '管理者',
      editReason: '現地調査後の修正',
      previousData: JSON.stringify({ estimatedCostMin: 100000, estimatedCostMax: 300000 }),
      newData: JSON.stringify({ estimatedCostMin: 150000, estimatedCostMax: 350000 }),
      createdAt: '2026-02-10T15:00:00Z',
    },
  ];
}

export async function getSystemSettings(): Promise<SystemSetting[]> {
  // TODO: Phase 3 - supabase.from('system_settings').select('*')
  return [
    { settingKey: 'notification_email', settingValue: 'admin@example.com', description: '通知先メールアドレス' },
    { settingKey: 'email_notifications_enabled', settingValue: 'true', description: 'メール通知の有効/無効' },
  ];
}

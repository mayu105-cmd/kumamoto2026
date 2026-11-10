import { Facility, FacilityId, HealthSymptom, SpecialNeed, AidNeed } from '../types';

export const FACILITIES: Record<FacilityId, Facility> = {
  aquadome: {
    id: 'aquadome',
    name: 'アクアドームくまもと',
    shortName: 'アクアドーム',
    totalCapacity: 150,
    address: '熊本市南区荒尾2-1-1',
    phone: '096-358-2711',
    mapZones: ['Aブロック (北側P1)', 'Bブロック (東側P2)', 'Cブロック (中央P3)', 'Dブロック (南側P4)']
  },
  keirin: {
    id: 'keirin',
    name: '熊本競輪場',
    shortName: '熊本競輪場',
    totalCapacity: 150,
    address: '熊本市中央区水前寺5-23-1',
    phone: '096-383-5215',
    mapZones: ['東ゲートエリア (P1)', 'メインスタンド前 (P2)', '西側駐車場 (P3)', '南エントランス (P4)']
  }
};

export const AGE_GROUPS = [
  '10代未満',
  '10代',
  '20代',
  '30代',
  '40代',
  '50代',
  '60代',
  '70代',
  '80代以上'
] as const;

export const VEHICLE_TYPES = [
  { id: 'kei', label: '軽自動車（ワゴン・ハスラー等）' },
  { id: 'compact', label: 'コンパクトカー（アクア・ノート等）' },
  { id: 'sedan', label: 'セダン（プリウス・クラウン等）' },
  { id: 'minivan', label: 'ミニバン（セレナ・ノア・アルファード等）' },
  { id: 'suv', label: 'SUV（ハリアー・RAV4等）' },
  { id: 'truck', label: '軽トラック・バン' },
  { id: 'other', label: 'その他車両' },
] as const;

export const HEALTH_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  good: { label: '良好', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-300' },
  caution: { label: '要注意・違和感', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-300' },
  bad: { label: '体調不良・要診察', color: 'text-red-700', bg: 'bg-red-50 border-red-300' }
};

export const SYMPTOM_OPTIONS: { id: HealthSymptom; label: string; severe?: boolean }[] = [
  { id: 'leg_swelling', label: '足のむくみ・ふくらはぎの痛み（血栓症警戒）', severe: true },
  { id: 'breathing_difficulty', label: '息苦しさ・胸の圧迫感', severe: true },
  { id: 'headache_fever', label: '頭痛・発熱・悪寒' },
  { id: 'fatigue_insomnia', label: '極度の疲労・眠れない' },
  { id: 'dehydration', label: '喉の渇き・めまい・脱水感' },
  { id: 'nausea', label: '吐き気・胃の不快感' },
  { id: 'other', label: 'その他の不調' }
];

export const SPECIAL_NEEDS_OPTIONS: { id: SpecialNeed; label: string; icon: string }[] = [
  { id: 'infant', label: '乳幼児（0〜2歳）がいる', icon: '' },
  { id: 'pregnant', label: '妊産婦がいる', icon: '' },
  { id: 'elderly', label: '後期高齢者（75歳以上）がいる', icon: '' },
  { id: 'wheelchair', label: '車椅子・歩行介助が必要', icon: '' },
  { id: 'chronic_disease', label: '基礎疾患・定時服薬・透析などがある', icon: '' },
  { id: 'pet', label: 'ペットと同乗している', icon: '' },
  { id: 'foreign_speaker', label: '日本語での会話が難しい（外国語対応）', icon: '' },
  { id: 'other', label: 'その他特別な配慮が必要', icon: '' }
];

export const AID_NEEDS_OPTIONS: { id: AidNeed; label: string; icon: string; urgencyDefault?: string }[] = [
  { id: 'water_food', label: '飲料水・食料（アルファ米・非常食等）', icon: '' },
  { id: 'blanket_warmth', label: '毛布・防寒シート・マット（エコノミー症候群予防）', icon: '' },
  { id: 'portable_toilet', label: '携帯トイレ・凝固消臭袋', icon: '' },
  { id: 'medical_consult', label: '医師・看護師の診察 / 常備薬', icon: '' },
  { id: 'baby_supplies', label: '粉ミルク・離乳食・紙おむつ', icon: '' },
  { id: 'sanitary', label: '生理用品・大人用紙おむつ・衛生用品', icon: '' },
  { id: 'power_gasoline', label: 'モバイルバッテリー・スマホ充電・給水', icon: '' },
  { id: 'other', label: 'その他個別の支援要望', icon: '' }
];

export const DEMO_ADMIN_USERS = [
  {
    id: 'admin-01',
    username: 'kumamoto_bousai',
    name: '熊本市危機管理防災課 担当者',
    role: 'admin' as const,
    facilityId: 'all' as const
  },
  {
    id: 'staff-01',
    username: 'aquadome_staff',
    name: 'アクアドーム現地救護スタッフ',
    role: 'staff' as const,
    facilityId: 'aquadome' as const
  },
  {
    id: 'staff-02',
    username: 'keirin_staff',
    name: '熊本競輪場現地救護スタッフ',
    role: 'staff' as const,
    facilityId: 'keirin' as const
  }
];


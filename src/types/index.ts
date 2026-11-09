export type FacilityId = 'aquadome' | 'keirin';

export interface Facility {
  id: FacilityId;
  name: string;
  shortName: string;
  totalCapacity: number; // 150台
  address: string;
  phone: string;
  mapZones: string[]; // 例: ["Aブロック (北側)", "Bブロック (中央東)", "Cブロック (中央西)", "Dブロック (南側)"]
}

export type HealthStatus = 'good' | 'caution' | 'bad';

export type HealthSymptom =
  | 'leg_swelling'        // 足のむくみ・ふくらはぎの痛み（エコノミークラス症候群警戒）
  | 'headache_fever'      // 頭痛・発熱
  | 'breathing_difficulty'// 息苦しさ・胸の痛み
  | 'fatigue_insomnia'    // 著しい疲労・不眠
  | 'dehydration'         // 喉の渇き・脱水感
  | 'nausea'              // 吐き気・めまい
  | 'other';              // その他症状

export type SpecialNeed =
  | 'infant'           // 乳幼児（0〜2歳）
  | 'pregnant'         // 妊産婦
  | 'elderly'          // 後期高齢者（75歳以上）
  | 'wheelchair'       // 車椅子・移動困難
  | 'chronic_disease'  // 基礎疾患（高血圧・糖尿病・透析等）
  | 'pet'              // ペット同伴
  | 'foreign_speaker'  // 外国語支援
  | 'other';           // その他配慮

export type AidNeed =
  | 'water_food'       // 飲料水・非常食
  | 'blanket_warmth'   // 毛布・防寒具・マット
  | 'portable_toilet'  // 携帯・簡易トイレ
  | 'medical_consult'  // 医師・看護師相談・処方薬
  | 'baby_supplies'    // 粉ミルク・おむつ・おしりふき
  | 'sanitary'         // 生理用品・衛生用品・ウェットティッシュ
  | 'power_gasoline'   // モバイルバッテリー・車載電源・ガソリン
  | 'other';           // その他個別ニーズ

export interface Passenger {
  id: string;
  name: string;
  ageGroup: string;
  relation: string; // 本人、配偶者、子供、親、親族、友人など
  healthStatus: HealthStatus;
  notes?: string;
}

export interface AidDistribution {
  id: string;
  item: string;
  distributedAt: string;
  staffName: string;
}

export interface DailyCheckinLog {
  id: string;
  checkinAt: string;
  healthStatus: HealthStatus;
  healthSymptoms: HealthSymptom[];
  healthNote?: string;
  aidNeeds: AidNeed[];
  aidNeedsNote?: string;
}

export interface EvacueeRecord {
  id: string; // 例: EVAC-AQ-042
  facilityId: FacilityId;
  slotNumber: number; // 1 〜 150
  name: string;
  nameKana?: string;
  ageGroup: string;
  phone: string;
  email?: string; // 更新案内送信用メールアドレス
  vehicle: {
    model: string;        // 例: プリウス
    numberPlate: string;  // 例: 熊本 500 あ 12-34
    color: string;        // 例: 白
    type: 'kei' | 'compact' | 'sedan' | 'minivan' | 'suv' | 'truck' | 'other';
  };
  passengerCount: number; // 同乗者数
  passengers: Passenger[];
  healthStatus: HealthStatus;
  healthSymptoms: HealthSymptom[];
  healthNote?: string;
  lastHealthCheckAt: string;
  lastDailyCheckinAt?: string; // 一日おき定期確認の最終日時
  lastReminderSentAt?: string; // 更新案内メールの最終送信日時
  checkinHistory?: DailyCheckinLog[]; // 定期確認の更新履歴
  specialNeeds: SpecialNeed[];
  specialNeedsNote?: string;
  aidNeeds: AidNeed[];
  aidNeedsNote?: string;
  aidDistributions: AidDistribution[];
  entryTime: string; // ISO string
  patrolStatus: 'pending' | 'patrolled' | 'needs_attention';
  lastPatrolledAt?: string;
  lastPatrolledBy?: string;
  patrolNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface EvaluatedRisk {
  riskLevel: RiskLevel;
  reasons: string[];
  isOver24h: boolean;
  hoursStaying: number;
  requiresImmediateCheck: boolean;
  economyClassSyndromeWarning: boolean;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'staff' | 'medical';
  facilityId?: FacilityId | 'all';
}


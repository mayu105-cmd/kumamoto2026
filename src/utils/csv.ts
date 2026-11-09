import { EvacueeRecord, FacilityId, HealthStatus } from '../types';
import { evaluateEvacueeRisk } from './riskAssessment';

/**
 * UTF-8 BOM付きCSVの生成 & ダウンロード
 */
export function exportToCsvWithBom(records: EvacueeRecord[]): void {
  const headers = [
    '避難者ID',
    '施設名',
    '区画番号',
    '代表者氏名',
    'フリガナ',
    '年代',
    '電話番号',
    '車両_車種',
    '車両_ナンバー',
    '車両_色',
    '車両_タイプ',
    '同乗者数(名)',
    '同乗者名簿',
    '体調状態',
    '症状一覧',
    '体調メモ',
    '特記事項・要配慮',
    '特記事項メモ',
    '支援物資ニーズ',
    '支援要望メモ',
    '入場・登録日時',
    '滞在時間(時間)',
    '24時間超判定',
    '総合リスクレベル',
    '要巡回判定',
    '見回り巡回状況',
    '最終見回り日時',
    '最終見回りスタッフ',
  ];

  const facilityNameMap: Record<FacilityId, string> = {
    aquadome: 'アクアドームくまもと',
    keirin: '熊本競輪場',
  };

  const healthStatusMap: Record<HealthStatus, string> = {
    good: '良好',
    caution: '要注意',
    bad: '体調不良',
  };

  const rows = records.map(record => {
    const risk = evaluateEvacueeRisk(record);
    const passengersStr = record.passengers
      .map(p => `${p.name}(${p.relation || '同乗'},${p.ageGroup})`)
      .join('; ');

    const rowData = [
      record.id,
      facilityNameMap[record.facilityId] || record.facilityId,
      record.slotNumber.toString(),
      record.name,
      record.nameKana || '',
      record.ageGroup,
      record.phone,
      record.vehicle.model,
      record.vehicle.numberPlate,
      record.vehicle.color,
      record.vehicle.type,
      (record.passengerCount || 1).toString(),
      passengersStr,
      healthStatusMap[record.healthStatus] || record.healthStatus,
      record.healthSymptoms.join(', '),
      record.healthNote || '',
      record.specialNeeds.join(', '),
      record.specialNeedsNote || '',
      record.aidNeeds.join(', '),
      record.aidNeedsNote || '',
      new Date(record.entryTime).toLocaleString('ja-JP'),
      risk.hoursStaying.toFixed(1),
      risk.isOver24h ? '24h超警戒' : '24h未満',
      risk.riskLevel.toUpperCase(),
      risk.requiresImmediateCheck ? '要即時確認' : '巡回済/通常',
      record.patrolStatus === 'patrolled' ? '巡回済' : record.patrolStatus === 'needs_attention' ? '要確認' : '未巡回',
      record.lastPatrolledAt ? new Date(record.lastPatrolledAt).toLocaleString('ja-JP') : '',
      record.lastPatrolledBy || '',
    ];

    // CSVセルをエスケープしてダブルクォーテーションで囲む
    return rowData
      .map(field => `"${(field ?? '').toString().replace(/"/g, '""')}"`)
      .join(',');
  });

  const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');

  // UTF-8 BOM: \uFEFF を先頭に付与
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  link.setAttribute('href', url);
  link.setAttribute('download', `熊本車中泊避難者台帳_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * JSONバックアップのエクスポート
 */
export function exportToJsonBackup(records: EvacueeRecord[]): void {
  const jsonString = JSON.stringify(records, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  link.setAttribute('href', url);
  link.setAttribute('download', `kumamoto_evacuees_backup_${timestamp}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 簡易CSVパーサー（インポート用）
 */
export function parseCsvRecords(csvText: string): Partial<EvacueeRecord>[] {
  // BOM削除
  const clean = csvText.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];

  // ヘッダー行をスキップ
  const result: Partial<EvacueeRecord>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length < 5) continue;

    const id = row[0] || `EVAC-${Date.now()}-${i}`;
    const facilityStr = row[1];
    const facilityId: FacilityId = facilityStr.includes('競輪') ? 'keirin' : 'aquadome';
    const slotNumber = parseInt(row[2], 10) || i;
    const name = row[3] || '不明';
    const nameKana = row[4] || '';
    const ageGroup = row[5] || '40代';
    const phone = row[6] || '';
    const model = row[7] || '普通乗用車';
    const numberPlate = row[8] || '';
    const color = row[9] || '白';
    const vehicleType = (row[10] as any) || 'sedan';
    const passengerCount = parseInt(row[11], 10) || 1;
    const healthStatusStr = row[13] || '';
    const healthStatus: HealthStatus = healthStatusStr.includes('不良') ? 'bad' : healthStatusStr.includes('注意') ? 'caution' : 'good';
    const healthNote = row[15] || '';
    const specialNeedsNote = row[17] || '';
    const aidNeedsNote = row[19] || '';

    result.push({
      id,
      facilityId,
      slotNumber,
      name,
      nameKana,
      ageGroup,
      phone,
      vehicle: {
        model,
        numberPlate,
        color,
        type: vehicleType,
      },
      passengerCount,
      passengers: [],
      healthStatus,
      healthSymptoms: [],
      healthNote,
      specialNeeds: [],
      specialNeedsNote,
      aidNeeds: ['water_food'],
      aidNeedsNote,
      aidDistributions: [],
      entryTime: new Date().toISOString(),
      patrolStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return result;
}

function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}


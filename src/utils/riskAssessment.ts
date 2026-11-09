import { EvacueeRecord, EvaluatedRisk, RiskLevel } from '../types';

/**
 * 熊本地震の教訓に基づいた健康リスク・エコノミークラス症候群警戒の自動判定
 */
export function evaluateEvacueeRisk(record: EvacueeRecord): EvaluatedRisk {
  const now = Date.now();
  const entryDate = new Date(record.entryTime).getTime();
  const diffHours = Math.max(0, (now - entryDate) / (1000 * 60 * 60));
  const isOver24h = diffHours >= 24;

  const reasons: string[] = [];

  // エコノミークラス症候群 (DVT: 深部静脈血栓症 / 肺血栓塞栓症) の疑い
  const hasLegSwelling = record.healthSymptoms.includes('leg_swelling');
  const hasBreathingDifficulty = record.healthSymptoms.includes('breathing_difficulty');
  const hasDehydration = record.healthSymptoms.includes('dehydration');

  let economyClassSyndromeWarning = false;
  if (hasLegSwelling) {
    economyClassSyndromeWarning = true;
    reasons.push('足のむくみ・ふくらはぎの痛み（血栓症警戒）');
  }
  if (hasBreathingDifficulty) {
    economyClassSyndromeWarning = true;
    reasons.push('呼吸困難・胸の違和感（肺塞栓症の緊急疑い）');
  }

  // 滞在時間アラート
  if (isOver24h) {
    reasons.push(`連続車中泊 ${Math.floor(diffHours)}時間（24時間超のリスク蓄積）`);
  }

  // 体調レベル
  if (record.healthStatus === 'bad') {
    reasons.push('申告体調: 不良（医療スタッフの診察推奨）');
  } else if (record.healthStatus === 'caution') {
    reasons.push('申告体調: 要注意（倦怠感・違和感あり）');
  }

  // 特記事項（要配慮）
  const hasInfant = record.specialNeeds.includes('infant');
  const hasPregnant = record.specialNeeds.includes('pregnant');
  const hasElderly = record.specialNeeds.includes('elderly');
  const hasChronic = record.specialNeeds.includes('chronic_disease');
  const hasWheelchair = record.specialNeeds.includes('wheelchair');

  if (hasPregnant) reasons.push('要配慮: 妊産婦（優先避難・体調管理）');
  if (hasInfant) reasons.push('要配慮: 乳幼児（温度管理・脱水予防）');
  if (hasElderly) reasons.push('要配慮: 高齢者（血栓・脱水・認知症リスク）');
  if (hasChronic) reasons.push('要配慮: 基礎疾患あり（服薬・透析確認）');
  if (hasWheelchair) reasons.push('要配慮: 車椅子・要介助');

  // リスクレベル決定
  let riskLevel: RiskLevel = 'low';

  if (
    record.healthStatus === 'bad' ||
    hasBreathingDifficulty ||
    (hasLegSwelling && isOver24h)
  ) {
    riskLevel = 'critical';
  } else if (
    record.healthStatus === 'caution' ||
    hasLegSwelling ||
    isOver24h ||
    (hasPregnant && diffHours >= 12) ||
    (hasChronic && isOver24h)
  ) {
    riskLevel = 'high';
  } else if (
    hasElderly ||
    hasInfant ||
    hasPregnant ||
    hasChronic ||
    hasDehydration ||
    diffHours >= 12
  ) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  // 直近巡回チェック
  const requiresImmediateCheck =
    record.patrolStatus !== 'patrolled' &&
    (riskLevel === 'critical' || riskLevel === 'high' || record.patrolStatus === 'needs_attention');

  return {
    riskLevel,
    reasons,
    isOver24h,
    hoursStaying: Number(diffHours.toFixed(1)),
    requiresImmediateCheck,
    economyClassSyndromeWarning,
  };
}

/**
 * 避難者の健康状態が「注意」「警戒」であり、巡回・見回りの対象であるかを判定する
 * 健康良好（good）で警戒理由がない場合は false（巡回対象外）
 */
export function isPatrolNeeded(record: EvacueeRecord): boolean {
  if (record.healthStatus === 'caution' || record.healthStatus === 'bad') {
    return true;
  }
  const risk = evaluateEvacueeRisk(record);
  if (
    risk.riskLevel === 'critical' ||
    risk.riskLevel === 'high' ||
    risk.economyClassSyndromeWarning ||
    record.patrolStatus === 'needs_attention'
  ) {
    return true;
  }
  return false;
}



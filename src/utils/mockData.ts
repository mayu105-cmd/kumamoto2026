import { EvacueeRecord, FacilityId } from '../types';

/**
 * 初期デモデータ生成
 * アクアドームくまもと・熊本競輪場のリアルな避難者データ
 */
export function generateInitialMockData(): EvacueeRecord[] {
  const records: EvacueeRecord[] = [];
  const now = Date.now();
  const ONE_HOUR = 3600 * 1000;

  // アクアドームくまもとのリアルな避難者サンプル
  const aquaPresets: Partial<EvacueeRecord>[] = [
    {
      slotNumber: 5,
      name: '本田 誠一',
      nameKana: 'ホンダ セイイチ',
      ageGroup: '70代',
      phone: '090-1234-5678',
      email: 'seiichi.honda@example.com',
      vehicle: { model: 'プリウス', numberPlate: '熊本 300 さ 12-34', color: 'シルバー', type: 'sedan' },
      passengerCount: 2,
      passengers: [
        { id: 'p1', name: '本田 トミエ', ageGroup: '70代', relation: '妻', healthStatus: 'caution', notes: '足のむくみと歩行困難' }
      ],
      healthStatus: 'caution',
      healthSymptoms: ['leg_swelling', 'fatigue_insomnia'],
      healthNote: '昨晩から右足のふくらはぎが痛んで張っている。座ったまま寝たためか。',
      specialNeeds: ['elderly', 'chronic_disease'],
      specialNeedsNote: '高血圧の降圧剤が残り2日分',
      aidNeeds: ['water_food', 'blanket_warmth', 'medical_consult'],
      aidNeedsNote: '医師の問診希望、足を伸ばせる毛布か段ボールベッド',
      entryTime: new Date(now - 32 * ONE_HOUR).toISOString(), // 32時間滞在 (24h超)
      patrolStatus: 'needs_attention',
    },
    {
      slotNumber: 12,
      name: '佐藤 綾乃',
      nameKana: 'サトウ アヤノ',
      ageGroup: '30代',
      phone: '080-9876-5432',
      vehicle: { model: 'セレナ', numberPlate: '熊本 501 な 88-21', color: 'ホワイト', type: 'minivan' },
      passengerCount: 3,
      passengers: [
        { id: 'p2-1', name: '佐藤 結衣', ageGroup: '10代未満', relation: '長女(1歳半)', healthStatus: 'good', notes: '離乳食' },
        { id: 'p2-2', name: '佐藤 航平', ageGroup: '30代', relation: '夫', healthStatus: 'good', notes: '物資運搬中' }
      ],
      healthStatus: 'good',
      healthSymptoms: [],
      healthNote: '車内をフラットにしているので睡眠はとれている',
      specialNeeds: ['infant'],
      specialNeedsNote: 'おむつ(Mサイズ)、離乳食、ウェットティッシュ希望',
      aidNeeds: ['baby_supplies', 'water_food'],
      entryTime: new Date(now - 14 * ONE_HOUR).toISOString(),
      patrolStatus: 'patrolled',
      lastPatrolledAt: new Date(now - 2 * ONE_HOUR).toISOString(),
      lastPatrolledBy: '現地スタッフ 田中',
      aidDistributions: [
        { id: 'ad-1', item: 'ミネラルウォーター 2L x 2', distributedAt: new Date(now - 4 * ONE_HOUR).toISOString(), staffName: '田中' }
      ]
    },
    {
      slotNumber: 23,
      name: '中村 剛',
      nameKana: 'ナカムラ ツヨシ',
      ageGroup: '40代',
      phone: '090-3344-5566',
      vehicle: { model: 'ハイエース', numberPlate: '熊本 400 た 44-01', color: 'ブラック', type: 'truck' },
      passengerCount: 1,
      passengers: [],
      healthStatus: 'good',
      healthSymptoms: [],
      specialNeeds: ['pet'],
      specialNeedsNote: '中型犬（柴犬）1頭同伴。車内でおとなしくしています',
      aidNeeds: ['water_food', 'portable_toilet'],
      entryTime: new Date(now - 20 * ONE_HOUR).toISOString(),
      patrolStatus: 'patrolled',
    },
    {
      slotNumber: 38,
      name: '木村 恵美子',
      nameKana: 'キムラ エミコ',
      ageGroup: '20代',
      phone: '070-5555-1234',
      vehicle: { model: 'フィット', numberPlate: '熊本 500 ら 77-10', color: 'ブルー', type: 'compact' },
      passengerCount: 2,
      passengers: [
        { id: 'p4', name: '木村 浩二', ageGroup: '20代', relation: '夫', healthStatus: 'good' }
      ],
      healthStatus: 'caution',
      healthSymptoms: ['nausea', 'fatigue_insomnia'],
      healthNote: '妊娠7ヶ月。つわりと狭い座席で腰と下腹部に張りを感じる。',
      specialNeeds: ['pregnant'],
      specialNeedsNote: '妊婦のため横になれるスペースまたは簡易ベッドが必要',
      aidNeeds: ['blanket_warmth', 'medical_consult', 'sanitary'],
      aidNeedsNote: '産婦人科・保健師の見回り希望',
      entryTime: new Date(now - 28 * ONE_HOUR).toISOString(), // 28時間 (24h超)
      patrolStatus: 'needs_attention',
    },
    {
      slotNumber: 45,
      name: '田中 浩二',
      nameKana: 'タナカ コウジ',
      ageGroup: '50代',
      phone: '090-7788-9900',
      vehicle: { model: 'タント', numberPlate: '熊本 580 む 33-88', color: 'ピンク', type: 'kei' },
      passengerCount: 1,
      passengers: [],
      healthStatus: 'bad',
      healthSymptoms: ['breathing_difficulty', 'leg_swelling'],
      healthNote: '両足がパンパンに腫れており、深く息を吸うと胸が痛い。',
      specialNeeds: ['chronic_disease'],
      specialNeedsNote: '糖尿病のインスリン保冷が必要',
      aidNeeds: ['medical_consult', 'water_food', 'portable_toilet'],
      aidNeedsNote: '【至急】DMATまたは医師の往診を要請！',
      entryTime: new Date(now - 36 * ONE_HOUR).toISOString(), // 36時間 (24h超)
      patrolStatus: 'needs_attention',
    },
    {
      slotNumber: 62,
      name: '山下 健一',
      nameKana: 'ヤマシタ ケンイチ',
      ageGroup: '60代',
      phone: '090-4411-2233',
      vehicle: { model: 'カローラクロス', numberPlate: '熊本 330 せ 55-90', color: 'ホワイト', type: 'suv' },
      passengerCount: 2,
      passengers: [
        { id: 'p6', name: '山下 和子', ageGroup: '60代', relation: '妻', healthStatus: 'good' }
      ],
      healthStatus: 'good',
      healthSymptoms: [],
      specialNeeds: [],
      aidNeeds: ['water_food', 'power_gasoline'],
      aidNeedsNote: 'スマホの充電器貸出希望',
      entryTime: new Date(now - 8 * ONE_HOUR).toISOString(),
      patrolStatus: 'patrolled',
    },
    {
      slotNumber: 77,
      name: '藤井 雅也',
      nameKana: 'フジイ マサヤ',
      ageGroup: '40代',
      phone: '080-1234-8888',
      vehicle: { model: 'ヴォクシー', numberPlate: '熊本 301 て 10-09', color: 'シルバー', type: 'minivan' },
      passengerCount: 4,
      passengers: [
        { id: 'p7-1', name: '藤井 由美', ageGroup: '40代', relation: '妻', healthStatus: 'good' },
        { id: 'p7-2', name: '藤井 翔太', ageGroup: '10代', relation: '長男', healthStatus: 'good' },
        { id: 'p7-3', name: '藤井 葵', ageGroup: '10代', relation: '長女', healthStatus: 'good' }
      ],
      healthStatus: 'good',
      healthSymptoms: [],
      specialNeeds: [],
      aidNeeds: ['water_food', 'portable_toilet'],
      entryTime: new Date(now - 16 * ONE_HOUR).toISOString(),
      patrolStatus: 'pending',
    },
    {
      slotNumber: 90,
      name: '吉田 マリア',
      nameKana: 'ヨシダ マリア',
      ageGroup: '30代',
      phone: '090-6677-8899',
      vehicle: { model: 'ヴィッツ', numberPlate: '熊本 500 ま 24-68', color: 'レッド', type: 'compact' },
      passengerCount: 2,
      passengers: [
        { id: 'p8', name: '吉田 カルロス', ageGroup: '30代', relation: '夫', healthStatus: 'good' }
      ],
      healthStatus: 'caution',
      healthSymptoms: ['headache_fever', 'dehydration'],
      healthNote: '微熱（37.6度）と水分不足による頭痛',
      specialNeeds: ['foreign_speaker'],
      specialNeedsNote: 'ポルトガル語・やさしい日本語での案内希望',
      aidNeeds: ['water_food', 'medical_consult', 'sanitary'],
      entryTime: new Date(now - 26 * ONE_HOUR).toISOString(),
      patrolStatus: 'pending',
    },
    {
      slotNumber: 115,
      name: '松本 勇',
      nameKana: 'マツモト イサム',
      ageGroup: '80代以上',
      phone: '096-320-1111',
      vehicle: { model: '軽トラ (キャリイ)', numberPlate: '熊本 480 け 91-00', color: 'ホワイト', type: 'truck' },
      passengerCount: 1,
      passengers: [],
      healthStatus: 'bad',
      healthSymptoms: ['leg_swelling', 'fatigue_insomnia', 'dehydration'],
      healthNote: '軽トラの運転席で2晩過ごし、足が動かしにくい。寒気がある。',
      specialNeeds: ['elderly', 'wheelchair'],
      specialNeedsNote: '足腰が立たないため体育館内の福祉避難スペースへの移送希望',
      aidNeeds: ['blanket_warmth', 'medical_consult', 'water_food'],
      entryTime: new Date(now - 40 * ONE_HOUR).toISOString(), // 40時間 (超高リスク)
      patrolStatus: 'needs_attention',
    },
    {
      slotNumber: 130,
      name: '小林 健二',
      nameKana: 'コバヤシ ケンジ',
      ageGroup: '50代',
      phone: '090-8899-0011',
      vehicle: { model: 'エクストレイル', numberPlate: '熊本 330 ひ 45-67', color: 'ブラック', type: 'suv' },
      passengerCount: 2,
      passengers: [
        { id: 'p10', name: '小林 陽子', ageGroup: '50代', relation: '妻', healthStatus: 'good' }
      ],
      healthStatus: 'good',
      healthSymptoms: [],
      specialNeeds: [],
      aidNeeds: ['portable_toilet'],
      entryTime: new Date(now - 10 * ONE_HOUR).toISOString(),
      patrolStatus: 'patrolled',
    }
  ];

  // 熊本競輪場のリアルな避難者サンプル
  const keirinPresets: Partial<EvacueeRecord>[] = [
    {
      slotNumber: 3,
      name: '高橋 秀雄',
      nameKana: 'タカハシ ヒデオ',
      ageGroup: '70代',
      phone: '090-1122-3344',
      vehicle: { model: 'クラウン', numberPlate: '熊本 300 か 99-88', color: 'パールホワイト', type: 'sedan' },
      passengerCount: 2,
      passengers: [
        { id: 'kp1', name: '高橋 キヨ', ageGroup: '70代', relation: '妻', healthStatus: 'caution', notes: '腰痛・寒冷刺激' }
      ],
      healthStatus: 'caution',
      healthSymptoms: ['leg_swelling', 'fatigue_insomnia'],
      healthNote: '夜間の冷え込みで足が痺れて動かしにくい',
      specialNeeds: ['elderly'],
      aidNeeds: ['blanket_warmth', 'water_food', 'portable_toilet'],
      entryTime: new Date(now - 30 * ONE_HOUR).toISOString(),
      patrolStatus: 'needs_attention',
    },
    {
      slotNumber: 18,
      name: '渡辺 亮',
      nameKana: 'ワタナベ リョウ',
      ageGroup: '30代',
      phone: '080-4455-6677',
      vehicle: { model: 'ステップワゴン', numberPlate: '熊本 501 わ 12-30', color: 'シルバー', type: 'minivan' },
      passengerCount: 4,
      passengers: [
        { id: 'kp2-1', name: '渡辺 真理', ageGroup: '30代', relation: '妻', healthStatus: 'good' },
        { id: 'kp2-2', name: '渡辺 蓮', ageGroup: '10代未満', relation: '長男(4歳)', healthStatus: 'good' },
        { id: 'kp2-3', name: '渡辺 紬', ageGroup: '10代未満', relation: '次女(0歳8ヶ月)', healthStatus: 'good', notes: '粉ミルク必須' }
      ],
      healthStatus: 'good',
      healthSymptoms: [],
      specialNeeds: ['infant'],
      specialNeedsNote: '乳児用液体ミルク・おむつ(Sサイズ)',
      aidNeeds: ['baby_supplies', 'water_food'],
      entryTime: new Date(now - 12 * ONE_HOUR).toISOString(),
      patrolStatus: 'patrolled',
    },
    {
      slotNumber: 33,
      name: '井上 雅人',
      nameKana: 'イノウエ マサト',
      ageGroup: '40代',
      phone: '090-2233-4455',
      vehicle: { model: 'プリウスα', numberPlate: '熊本 300 ほ 77-88', color: 'ブルー', type: 'sedan' },
      passengerCount: 1,
      passengers: [],
      healthStatus: 'bad',
      healthSymptoms: ['breathing_difficulty', 'leg_swelling', 'nausea'],
      healthNote: 'ふくらはぎを押すと強い痛みがあり赤く腫れている。呼吸が苦しい。',
      specialNeeds: ['chronic_disease'],
      specialNeedsNote: '高脂血症の既往あり',
      aidNeeds: ['medical_consult', 'water_food'],
      aidNeedsNote: '【緊急】エコノミークラス症候群・肺血栓塞栓の疑いあり。救護班至急対応',
      entryTime: new Date(now - 38 * ONE_HOUR).toISOString(),
      patrolStatus: 'needs_attention',
    },
    {
      slotNumber: 52,
      name: '坂本 幸子',
      nameKana: 'サカモト サチコ',
      ageGroup: '50代',
      phone: '090-9988-7766',
      vehicle: { model: 'スペーシア', numberPlate: '熊本 580 と 43-21', color: 'ブラウン', type: 'kei' },
      passengerCount: 2,
      passengers: [
        { id: 'kp4', name: '坂本 美咲', ageGroup: '20代', relation: '娘', healthStatus: 'good' }
      ],
      healthStatus: 'good',
      healthSymptoms: [],
      specialNeeds: ['pet'],
      specialNeedsNote: '猫2匹（キャリーバッグ保管）',
      aidNeeds: ['water_food', 'portable_toilet', 'sanitary'],
      entryTime: new Date(now - 18 * ONE_HOUR).toISOString(),
      patrolStatus: 'patrolled',
    },
    {
      slotNumber: 88,
      name: '工藤 達也',
      nameKana: 'クドウ タツヤ',
      ageGroup: '60代',
      phone: '070-1122-8899',
      vehicle: { model: 'フォレスター', numberPlate: '熊本 300 よ 65-43', color: 'ダークグレー', type: 'suv' },
      passengerCount: 1,
      passengers: [],
      healthStatus: 'caution',
      healthSymptoms: ['headache_fever', 'fatigue_insomnia'],
      healthNote: '発熱37.8度、倦怠感あり',
      specialNeeds: [],
      aidNeeds: ['medical_consult', 'water_food'],
      entryTime: new Date(now - 22 * ONE_HOUR).toISOString(),
      patrolStatus: 'pending',
    },
    {
      slotNumber: 104,
      name: '長谷川 仁美',
      nameKana: 'ハセガワ ヒトミ',
      ageGroup: '30代',
      phone: '080-6677-1122',
      vehicle: { model: 'ハリアー', numberPlate: '熊本 330 る 11-22', color: 'ブラック', type: 'suv' },
      passengerCount: 2,
      passengers: [
        { id: 'kp6', name: '長谷川 翔', ageGroup: '30代', relation: '夫', healthStatus: 'good' }
      ],
      healthStatus: 'good',
      healthSymptoms: [],
      specialNeeds: ['pregnant'],
      specialNeedsNote: '妊娠8ヶ月。体調は安定しているが冷え対策希望',
      aidNeeds: ['blanket_warmth', 'water_food'],
      entryTime: new Date(now - 15 * ONE_HOUR).toISOString(),
      patrolStatus: 'patrolled',
    }
  ];

  // ランダム生成用ヘルパー
  const lastNames = ['宮崎', '松岡', '緒方', '西村', '吉村', '福田', '野口', '古賀', '後藤', '池田', '安藤', '大塚', '平野', '河野', '内田', '村上', '原田', '森田'];
  const firstNames = ['大輔', '直樹', '陽子', '美智子', '真一', '拓也', '由加里', '裕樹', '千恵子', '武志', '翔平', '愛美', '健太', '裕子', '隆'];
  const vehicleModels = [
    { model: 'アクア', type: 'compact' as const, colors: ['白', 'シルバー', '青'] },
    { model: 'プリウス', type: 'sedan' as const, colors: ['白', '黒', 'シルバー'] },
    { model: 'N-BOX', type: 'kei' as const, colors: ['白', '黒', '赤', '茶'] },
    { model: 'ヴォクシー', type: 'minivan' as const, colors: ['黒', '白', '紫'] },
    { model: 'ハスラー', type: 'kei' as const, colors: ['オレンジ', 'カーキ', '青'] },
    { model: 'ノート', type: 'compact' as const, colors: ['白', 'ダークグレー'] },
    { model: 'RAV4', type: 'suv' as const, colors: ['白', 'グレー'] },
    { model: 'ハイゼット', type: 'truck' as const, colors: ['白', 'シルバー'] },
  ];

  // アクアドームのプリセットを登録
  aquaPresets.forEach(p => {
    const slot = p.slotNumber!;
    const padSlot = slot.toString().padStart(3, '0');
    records.push({
      id: `EVAC-AQ-${padSlot}`,
      facilityId: 'aquadome',
      slotNumber: slot,
      name: p.name || '熊本 太郎',
      nameKana: p.nameKana || 'クマモト タロウ',
      ageGroup: p.ageGroup || '40代',
      phone: p.phone || '090-0000-0000',
      vehicle: p.vehicle || { model: 'プリウス', numberPlate: '熊本 500 あ 11-11', color: '白', type: 'sedan' },
      passengerCount: p.passengerCount || 1,
      passengers: p.passengers || [],
      healthStatus: p.healthStatus || 'good',
      healthSymptoms: p.healthSymptoms || [],
      healthNote: p.healthNote,
      lastHealthCheckAt: p.lastPatrolledAt || new Date(now - 3 * ONE_HOUR).toISOString(),
      specialNeeds: p.specialNeeds || [],
      specialNeedsNote: p.specialNeedsNote,
      aidNeeds: p.aidNeeds || ['water_food'],
      aidNeedsNote: p.aidNeedsNote,
      aidDistributions: p.aidDistributions || [],
      entryTime: p.entryTime || new Date(now - 12 * ONE_HOUR).toISOString(),
      patrolStatus: p.patrolStatus || 'pending',
      lastPatrolledAt: p.lastPatrolledAt,
      lastPatrolledBy: p.lastPatrolledBy,
      createdAt: p.entryTime || new Date(now - 12 * ONE_HOUR).toISOString(),
      updatedAt: new Date(now - 1 * ONE_HOUR).toISOString(),
    });
  });

  // アクアドームにさらに数十台の車両を追加 (トータル約55台駐車中)
  const usedAquaSlots = new Set(aquaPresets.map(p => p.slotNumber!));
  for (let slot = 1; slot <= 150; slot++) {
    if (usedAquaSlots.has(slot)) continue;
    // 35%の確率で駐車中
    if ((slot * 7 + 13) % 100 < 35) {
      const v = vehicleModels[slot % vehicleModels.length];
      const ln = lastNames[slot % lastNames.length];
      const fn = firstNames[slot % firstNames.length];
      const hours = 4 + (slot % 40); // 4〜43時間
      const hasCare = slot % 5 === 0;
      const isBad = slot % 17 === 0;
      const padSlot = slot.toString().padStart(3, '0');

      records.push({
        id: `EVAC-AQ-${padSlot}`,
        facilityId: 'aquadome',
        slotNumber: slot,
        name: `${ln} ${fn}`,
        ageGroup: (30 + (slot % 5) * 10) + '代',
        phone: `090-${(1000 + slot * 17).toString().padStart(4, '0')}-${(3000 + slot * 23).toString().padStart(4, '0')}`,
        vehicle: {
          model: v.model,
          numberPlate: `熊本 ${500 + (slot % 80)} ${String.fromCharCode(12354 + (slot % 30))} ${((slot * 123) % 9000 + 1000).toString().slice(0, 2)}-${((slot * 321) % 90 + 10)}`,
          color: v.colors[slot % v.colors.length],
          type: v.type,
        },
        passengerCount: (slot % 4) + 1,
        passengers: [],
        healthStatus: isBad ? 'bad' : hasCare ? 'caution' : 'good',
        healthSymptoms: isBad ? ['leg_swelling', 'breathing_difficulty'] : hasCare ? ['fatigue_insomnia'] : [],
        healthNote: isBad ? '足の痛みを訴えている' : undefined,
        lastHealthCheckAt: new Date(now - 4 * ONE_HOUR).toISOString(),
        specialNeeds: hasCare ? ['elderly'] : [],
        aidNeeds: hasCare ? ['blanket_warmth', 'water_food'] : ['water_food'],
        aidDistributions: [],
        entryTime: new Date(now - hours * ONE_HOUR).toISOString(),
        patrolStatus: (slot % 3 === 0) ? 'patrolled' : isBad ? 'needs_attention' : 'pending',
        createdAt: new Date(now - hours * ONE_HOUR).toISOString(),
        updatedAt: new Date(now - hours * ONE_HOUR).toISOString(),
      });
    }
  }

  // 熊本競輪場のプリセットを登録
  keirinPresets.forEach(p => {
    const slot = p.slotNumber!;
    const padSlot = slot.toString().padStart(3, '0');
    records.push({
      id: `EVAC-KR-${padSlot}`,
      facilityId: 'keirin',
      slotNumber: slot,
      name: p.name || '熊本 次郎',
      nameKana: p.nameKana || 'クマモト ジロウ',
      ageGroup: p.ageGroup || '40代',
      phone: p.phone || '080-0000-0000',
      email: p.email || `evacuee-${slot}@kumamoto-shelter.jp`,
      vehicle: p.vehicle || { model: 'フィット', numberPlate: '熊本 500 い 22-22', color: '黒', type: 'compact' },
      passengerCount: p.passengerCount || 1,
      passengers: p.passengers || [],
      healthStatus: p.healthStatus || 'good',
      healthSymptoms: p.healthSymptoms || [],
      healthNote: p.healthNote,
      lastHealthCheckAt: p.lastPatrolledAt || new Date(now - 2 * ONE_HOUR).toISOString(),
      lastDailyCheckinAt: p.lastPatrolledAt || new Date(now - (slot % 2 === 0 ? 28 : 6) * ONE_HOUR).toISOString(), // 偶数スロットは28h前（一日おきの未更新対象）
      specialNeeds: p.specialNeeds || [],
      specialNeedsNote: p.specialNeedsNote,
      aidNeeds: p.aidNeeds || ['water_food'],
      aidNeedsNote: p.aidNeedsNote,
      aidDistributions: p.aidDistributions || [],
      entryTime: p.entryTime || new Date(now - 14 * ONE_HOUR).toISOString(),
      patrolStatus: p.patrolStatus || 'pending',
      lastPatrolledAt: p.lastPatrolledAt,
      lastPatrolledBy: p.lastPatrolledBy,
      createdAt: p.entryTime || new Date(now - 14 * ONE_HOUR).toISOString(),
      updatedAt: new Date(now - 2 * ONE_HOUR).toISOString(),
    });
  });

  // 熊本競輪場にさらに数十台の車両を追加 (トータル約50台駐車中)
  const usedKeirinSlots = new Set(keirinPresets.map(p => p.slotNumber!));
  for (let slot = 1; slot <= 150; slot++) {
    if (usedKeirinSlots.has(slot)) continue;
    if ((slot * 11 + 7) % 100 < 32) {
      const v = vehicleModels[(slot + 3) % vehicleModels.length];
      const ln = lastNames[(slot + 5) % lastNames.length];
      const fn = firstNames[(slot + 7) % firstNames.length];
      const hours = 3 + (slot % 36);
      const hasCare = slot % 7 === 0;
      const isBad = slot % 19 === 0;
      const padSlot = slot.toString().padStart(3, '0');

      records.push({
        id: `EVAC-KR-${padSlot}`,
        facilityId: 'keirin',
        slotNumber: slot,
        name: `${ln} ${fn}`,
        ageGroup: (20 + (slot % 6) * 10) + '代',
        phone: `080-${(2000 + slot * 13).toString().padStart(4, '0')}-${(4000 + slot * 29).toString().padStart(4, '0')}`,
        email: `evacuee-kr${padSlot}@example.com`,
        vehicle: {
          model: v.model,
          numberPlate: `熊本 ${300 + (slot % 50)} ${String.fromCharCode(12370 + (slot % 20))} ${((slot * 234) % 9000 + 1000).toString().slice(0, 2)}-${((slot * 432) % 90 + 10)}`,
          color: v.colors[(slot + 1) % v.colors.length],
          type: v.type,
        },
        passengerCount: (slot % 3) + 1,
        passengers: [],
        healthStatus: isBad ? 'bad' : hasCare ? 'caution' : 'good',
        healthSymptoms: isBad ? ['leg_swelling'] : [],
        lastHealthCheckAt: new Date(now - 5 * ONE_HOUR).toISOString(),
        lastDailyCheckinAt: new Date(now - (slot % 2 === 0 ? 30 : 8) * ONE_HOUR).toISOString(),
        specialNeeds: hasCare ? ['elderly', 'chronic_disease'] : [],
        aidNeeds: ['water_food', 'portable_toilet'],
        aidDistributions: [],
        entryTime: new Date(now - hours * ONE_HOUR).toISOString(),
        patrolStatus: (slot % 4 === 0) ? 'patrolled' : isBad ? 'needs_attention' : 'pending',
        createdAt: new Date(now - hours * ONE_HOUR).toISOString(),
        updatedAt: new Date(now - hours * ONE_HOUR).toISOString(),
      });
    }
  }

  return records;
}


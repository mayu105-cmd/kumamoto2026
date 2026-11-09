import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Trash2 } from 'lucide-react';
import { EvacueeRecord, FacilityId, HealthStatus, HealthSymptom, SpecialNeed, AidNeed, Passenger } from '../../types';
import { FACILITIES, AGE_GROUPS, VEHICLE_TYPES, SYMPTOM_OPTIONS, SPECIAL_NEEDS_OPTIONS, AID_NEEDS_OPTIONS } from '../../utils/constants';

interface RegistrationFormProps {
  existingRecords: EvacueeRecord[];
  onRegisterSuccess: (record: EvacueeRecord) => void;
  defaultFacility?: FacilityId;
  defaultSlotNumber?: number;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  existingRecords,
  onRegisterSuccess,
  defaultFacility = 'aquadome',
  defaultSlotNumber,
}) => {
  const [facilityId, setFacilityId] = useState<FacilityId>(defaultFacility);
  const [slotNumber, setSlotNumber] = useState<number>(defaultSlotNumber || 1);
  const [name, setName] = useState('');
  const [nameKana, setNameKana] = useState('');
  const [ageGroup, setAgeGroup] = useState('40代');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // 車両情報
  const [model, setModel] = useState('');
  const [numberPlate, setNumberPlate] = useState('');
  const [color, setColor] = useState('');
  const [vehicleType, setVehicleType] = useState<EvacueeRecord['vehicle']['type']>('sedan');

  // 同乗者
  const [passengers, setPassengers] = useState<Passenger[]>([]);

  // 体調
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('good');
  const [healthSymptoms, setHealthSymptoms] = useState<HealthSymptom[]>([]);
  const [healthNote, setHealthNote] = useState('');

  // 特記事項 & ニーズ
  const [specialNeeds, setSpecialNeeds] = useState<SpecialNeed[]>([]);
  const [specialNeedsNote, setSpecialNeedsNote] = useState('');
  const [aidNeeds, setAidNeeds] = useState<AidNeed[]>(['water_food']);
  const [aidNeedsNote, setAidNeedsNote] = useState('');

  // バリデーションエラー
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 現在の施設の占有済み区画
  const occupiedSlots = existingRecords
    .filter(r => r.facilityId === facilityId)
    .map(r => r.slotNumber);

  // 空いている区画のリスト (1〜150)
  const availableSlots = Array.from({ length: 150 }, (_, i) => i + 1).filter(
    num => !occupiedSlots.includes(num) || num === defaultSlotNumber
  );

  // 同乗者追加
  const handleAddPassenger = () => {
    const newPassenger: Passenger = {
      id: 'p-' + Date.now(),
      name: '',
      ageGroup: '30代',
      relation: '家族',
      healthStatus: 'good',
    };
    setPassengers([...passengers, newPassenger]);
  };

  const handleUpdatePassenger = (index: number, field: keyof Passenger, value: any) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const handleRemovePassenger = (index: number) => {
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  // 症状トグル
  const handleToggleSymptom = (symptom: HealthSymptom) => {
    setHealthSymptoms(prev =>
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  // 特記事項トグル
  const handleToggleSpecialNeed = (need: SpecialNeed) => {
    setSpecialNeeds(prev =>
      prev.includes(need) ? prev.filter(n => n !== need) : [...prev, need]
    );
  };

  // 支援ニーズトグル
  const handleToggleAidNeed = (need: AidNeed) => {
    setAidNeeds(prev =>
      prev.includes(need) ? prev.filter(n => n !== need) : [...prev, need]
    );
  };

  // フォーム送信
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = '氏名を入力してください';
    if (!phone.trim()) {
      newErrors.phone = '電話番号を入力してください（受付証の再表示や安否確認に使用されます）';
    }
    if (!email.trim()) {
      newErrors.email = 'メールアドレスを入力してください（一日おきの健康・ニーズ確認メール送信に必須です）';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      newErrors.email = '有効なメールアドレス形式（例: name@example.com）で入力してください';
    }
    if (!model.trim()) newErrors.model = '車種を入力してください（巡回時の目印になります）';
    if (!numberPlate.trim()) newErrors.numberPlate = 'ナンバー（下4桁等）を入力してください';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const facilityPrefix = facilityId === 'aquadome' ? 'AQ' : 'KR';
    const padSlot = slotNumber.toString().padStart(3, '0');
    const newRecordId = `EVAC-${facilityPrefix}-${padSlot}`;

    const newRecord: EvacueeRecord = {
      id: newRecordId,
      facilityId,
      slotNumber,
      name: name.trim(),
      nameKana: nameKana.trim() || undefined,
      ageGroup,
      phone: phone.trim(),
      email: email.trim() || undefined,
      vehicle: {
        model: model.trim(),
        numberPlate: numberPlate.trim(),
        color: color.trim() || '不明',
        type: vehicleType,
      },
      passengerCount: 1 + passengers.length,
      passengers,
      healthStatus,
      healthSymptoms,
      healthNote: healthNote.trim() || undefined,
      lastHealthCheckAt: new Date().toISOString(),
      specialNeeds,
      specialNeedsNote: specialNeedsNote.trim() || undefined,
      aidNeeds,
      aidNeedsNote: aidNeedsNote.trim() || undefined,
      aidDistributions: [],
      entryTime: new Date().toISOString(),
      patrolStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 祝賀演出
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    onRegisterSuccess(newRecord);
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* イントロ案内カード */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-xl mb-8">
        <span className="inline-block px-2.5 py-1 rounded bg-blue-500/30 text-blue-100 text-xs font-semibold mb-2">
          アプリ不要・ブラウザで完結
        </span>
        <h1 className="text-2xl font-black mb-2 flex items-center gap-2">
          <span>車中泊避難者 受付登録</span>
        </h1>
        <p className="text-blue-100 text-sm leading-relaxed">
          熊本市内の指定駐車場（アクアドーム・熊本競輪場）で車中泊される方の健康管理と支援物資配給のための登録です。
          登録後、<strong className="text-white underline">「デジタル受付証（QRコード会員証）」</strong>が発行され、食事や物資の受け取りに利用できます。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ステップ1: 避難場所・駐車区画 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              1
            </span>
            <h2 className="text-lg font-bold text-slate-900">駐車場所の選択</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                避難施設 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['aquadome', 'keirin'] as FacilityId[]).map(fid => (
                  <button
                    key={fid}
                    type="button"
                    onClick={() => {
                      setFacilityId(fid);
                      // 空き区画の最初の番号にリセット
                      const occ = existingRecords.filter(r => r.facilityId === fid).map(r => r.slotNumber);
                      const firstFree = Array.from({ length: 150 }, (_, i) => i + 1).find(n => !occ.includes(n));
                      if (firstFree) setSlotNumber(firstFree);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      facilityId === fid
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-sm">{FACILITIES[fid].name}</div>
                    <div className="text-[11px] text-slate-500">全150区画</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                駐車区画番号 (1〜150) <span className="text-red-500">*</span>
              </label>
              <select
                value={slotNumber}
                onChange={e => setSlotNumber(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-base font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {availableSlots.map(num => (
                  <option key={num} value={num}>
                    区画 No. {num.toString().padStart(3, '0')} (空き区画)
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                現在駐車している区画番号、または現地誘導員の指示した番号を選んでください。
              </p>
            </div>
          </div>
        </section>

        {/* ステップ2: 代表者情報 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              2
            </span>
            <h2 className="text-lg font-bold text-slate-900">代表者の情報</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                氏名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="例: 熊本 太郎"
                value={name}
                onChange={e => setName(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border ${
                  errors.name ? 'border-red-500 bg-red-50' : 'border-slate-300'
                } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                フリガナ
              </label>
              <input
                type="text"
                placeholder="例: クマモト タロウ"
                value={nameKana}
                onChange={e => setNameKana(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                年代 <span className="text-red-500">*</span>
              </label>
              <select
                value={ageGroup}
                onChange={e => setAgeGroup(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {AGE_GROUPS.map(ag => (
                  <option key={ag} value={ag}>{ag}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                電話番号（ハイフン付きまたは無し） <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="例: 090-1234-5678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border ${
                  errors.phone ? 'border-red-500 bg-red-50' : 'border-slate-300'
                } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
              />
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
              <p className="text-[11px] text-slate-500 mt-1">
                ※画面を閉じた後の「受付証の再表示」キーとしても使用されます。
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                メールアドレス（健康状態・支援ニーズの定期確認用） <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="例: example@kumamoto.jp"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border ${
                  errors.email ? 'border-red-500 bg-red-50' : 'border-slate-300'
                } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
              <p className="text-[11px] text-slate-500 mt-1">
                ※一日おきに健康状態・支援ニーズの更新用リンクをメールでお届けするため入力が必須となります。
              </p>
            </div>
          </div>
        </section>

        {/* ステップ3: 車両情報 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              3
            </span>
            <h2 className="text-lg font-bold text-slate-900">車両情報（巡回・物資お届け用）</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                車種名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="例: プリウス, セレナ, タント等"
                value={model}
                onChange={e => setModel(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border ${
                  errors.model ? 'border-red-500 bg-red-50' : 'border-slate-300'
                } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
              />
              {errors.model && <p className="text-xs text-red-600 mt-1">{errors.model}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ナンバープレート（下4桁または全表記） <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="例: 熊本 500 あ 12-34 (下4桁だけでも可)"
                value={numberPlate}
                onChange={e => setNumberPlate(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border ${
                  errors.numberPlate ? 'border-red-500 bg-red-50' : 'border-slate-300'
                } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
              />
              {errors.numberPlate && <p className="text-xs text-red-600 mt-1">{errors.numberPlate}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                車両のタイプ
              </label>
              <select
                value={vehicleType}
                onChange={e => setVehicleType(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              >
                {VEHICLE_TYPES.map(vt => (
                  <option key={vt.id} value={vt.id}>{vt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ボディカラー（色）
              </label>
              <input
                type="text"
                placeholder="例: 白, 黒, シルバー, 青等"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* ステップ4: 同乗者（全員分の氏名） */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                4
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">同乗者情報（全員分）</h2>
                <p className="text-xs text-slate-500">
                  現在車内に一緒にいる人数: 代表者含め <strong className="text-blue-700">{1 + passengers.length}名</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddPassenger}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition-colors"
            >
              <span>同乗者を追加</span>
            </button>
          </div>

          {passengers.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-sm">
              同乗者がいる場合は「同乗者を追加」を押して氏名をご登録ください（1人避難の場合はこのままで結構です）。
            </div>
          ) : (
            <div className="space-y-3">
              {passengers.map((p, index) => (
                <div key={p.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">同乗者 #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePassenger(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="お名前"
                      value={p.name}
                      onChange={e => handleUpdatePassenger(index, 'name', e.target.value)}
                      className="px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                    <select
                      value={p.ageGroup}
                      onChange={e => handleUpdatePassenger(index, 'ageGroup', e.target.value)}
                      className="px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 bg-white"
                    >
                      {AGE_GROUPS.map(ag => (
                        <option key={ag} value={ag}>{ag}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="続柄 (例: 配偶者, 子供)"
                      value={p.relation}
                      onChange={e => handleUpdatePassenger(index, 'relation', e.target.value)}
                      className="px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ステップ5: 体調状態・エコノミークラス症候群警戒 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              5
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>体調状態・症状チェック</span>
                <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  命を守る重要項目
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                熊本地震では車中泊での血栓症・エコノミークラス症候群が多く発生しました。正直にご申告ください。
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                現在の体調レベル <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'good', label: '良好', desc: '元気に過ごせている', bg: 'hover:border-emerald-500', active: 'border-emerald-600 bg-emerald-50 text-emerald-900' },
                  { id: 'caution', label: '要注意・違和感', desc: '疲労やだるさ・足の重さ', bg: 'hover:border-amber-500', active: 'border-amber-600 bg-amber-50 text-amber-900' },
                  { id: 'bad', label: '体調不良・診察希望', desc: '痛みや息苦しさ・発熱', bg: 'hover:border-red-500', active: 'border-red-600 bg-red-50 text-red-900' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setHealthStatus(opt.id as HealthStatus)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      healthStatus === opt.id ? `${opt.active} font-bold ring-2 ring-offset-1` : `border-slate-200 ${opt.bg}`
                    }`}
                  >
                    <div className="text-sm font-bold">{opt.label}</div>
                    <div className="text-[11px] opacity-80 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 気になる自覚症状のチェック */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                当てはまる症状があればチェックしてください（複数選択可）:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SYMPTOM_OPTIONS.map(opt => {
                  const isChecked = healthSymptoms.includes(opt.id);
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                        isChecked
                          ? opt.severe
                            ? 'bg-red-50 border-red-300 text-red-900 font-semibold'
                            : 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSymptom(opt.id)}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs leading-relaxed">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                体調に関するメモ・持病・症状の詳細（自由記述）
              </label>
              <textarea
                rows={2}
                placeholder="例: 昨晩から座ったまま寝たため右ふくらはぎが痛む。血圧の薬が切れそう、など"
                value={healthNote}
                onChange={e => setHealthNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* ステップ6: 特記事項（要配慮） */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              6
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">特記事項（要配慮・同乗者への配慮）</h2>
              <p className="text-xs text-slate-500">
                該当するものにチェックを入れてください。巡回時や支援物資の優先配給の参考にします。
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
            {SPECIAL_NEEDS_OPTIONS.map(opt => {
              const isChecked = specialNeeds.includes(opt.id);
              return (
                <label
                  key={opt.id}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleSpecialNeed(opt.id)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs">{opt.label}</span>
                </label>
              );
            })}
          </div>

          <div>
            <input
              type="text"
              placeholder="特記事項の詳細（例: 妊娠7ヶ月、透析患者、犬が興奮しやすい等）"
              value={specialNeedsNote}
              onChange={e => setSpecialNeedsNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </section>

        {/* ステップ7: 支援ニーズ（今必要な物資や支援） */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              7
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">必要な支援物資・サポート</h2>
              <p className="text-xs text-slate-500">
                行政・支援物資班が準備を進めるための希望物資を選択してください。
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
            {AID_NEEDS_OPTIONS.map(opt => {
              const isChecked = aidNeeds.includes(opt.id);
              return (
                <label
                  key={opt.id}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleAidNeed(opt.id)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs">{opt.label}</span>
                </label>
              );
            })}
          </div>

          <div>
            <input
              type="text"
              placeholder="物資や支援に関する具体的な希望（例: おむつMサイズ、温かい毛布2枚、持病の相談希望など）"
              value={aidNeedsNote}
              onChange={e => setAidNeedsNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </section>

        {/* 送信ボタン */}
        <div className="pt-4">
          <button
            type="submit"
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center transition-all transform active:scale-[0.99]"
          >
            <span>避難登録を完了し、受付証（会員証）を発行する</span>
          </button>
          <p className="text-center text-xs text-slate-500 mt-2">
            ※入力いただいた情報は熊本市災害対策支援および現地救護活動にのみ厳重に使用されます。
          </p>
        </div>
      </form>
    </div>
  );
};


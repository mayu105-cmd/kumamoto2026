import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { EvacueeRecord, FacilityId, HealthStatus, HealthSymptom, SpecialNeed, AidNeed, Passenger } from '../../types';
import { AGE_GROUPS, SYMPTOM_OPTIONS, SPECIAL_NEEDS_OPTIONS, AID_NEEDS_OPTIONS } from '../../utils/constants';

interface EvacueeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: EvacueeRecord | null;
  onSave: (updated: EvacueeRecord) => void;
}

export const EvacueeEditModal: React.FC<EvacueeEditModalProps> = ({
  isOpen,
  onClose,
  record,
  onSave,
}) => {
  if (!isOpen || !record) return null;

  const [name, setName] = useState(record.name);
  const [nameKana, setNameKana] = useState(record.nameKana || '');
  const [phone, setPhone] = useState(record.phone);
  const [email, setEmail] = useState(record.email || '');
  const [ageGroup, setAgeGroup] = useState(record.ageGroup);
  const [facilityId, setFacilityId] = useState<FacilityId>(record.facilityId);
  const [slotNumber, setSlotNumber] = useState<number>(record.slotNumber);

  // 車両
  const [model, setModel] = useState(record.vehicle.model);
  const [numberPlate, setNumberPlate] = useState(record.vehicle.numberPlate);
  const [color, setColor] = useState(record.vehicle.color);
  const [vehicleType, setVehicleType] = useState(record.vehicle.type);

  // 同乗者
  const [passengers, setPassengers] = useState<Passenger[]>(record.passengers || []);

  // 体調
  const [healthStatus, setHealthStatus] = useState<HealthStatus>(record.healthStatus);
  const [healthSymptoms, setHealthSymptoms] = useState<HealthSymptom[]>(record.healthSymptoms || []);
  const [healthNote, setHealthNote] = useState(record.healthNote || '');

  // 特記事項 & ニーズ
  const [specialNeeds, setSpecialNeeds] = useState<SpecialNeed[]>(record.specialNeeds || []);
  const [specialNeedsNote, setSpecialNeedsNote] = useState(record.specialNeedsNote || '');
  const [aidNeeds, setAidNeeds] = useState<AidNeed[]>(record.aidNeeds || []);
  const [aidNeedsNote, setAidNeedsNote] = useState(record.aidNeedsNote || '');

  const handleToggleSymptom = (s: HealthSymptom) => {
    setHealthSymptoms(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const handleToggleSpecialNeed = (n: SpecialNeed) => {
    setSpecialNeeds(prev =>
      prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]
    );
  };

  const handleToggleAidNeed = (a: AidNeed) => {
    setAidNeeds(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    );
  };

  const handleAddPassenger = () => {
    setPassengers([
      ...passengers,
      {
        id: 'p-' + Date.now(),
        name: '',
        ageGroup: '30代',
        relation: '家族',
        healthStatus: 'good',
      }
    ]);
  };

  const handleUpdatePassenger = (index: number, field: keyof Passenger, value: any) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const handleRemovePassenger = (index: number) => {
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: EvacueeRecord = {
      ...record,
      facilityId,
      slotNumber,
      name: name.trim(),
      nameKana: nameKana.trim() || undefined,
      phone: phone.trim(),
      email: email.trim() || undefined,
      ageGroup,
      vehicle: {
        model: model.trim(),
        numberPlate: numberPlate.trim(),
        color: color.trim(),
        type: vehicleType,
      },
      passengerCount: 1 + passengers.length,
      passengers,
      healthStatus,
      healthSymptoms,
      healthNote: healthNote.trim() || undefined,
      specialNeeds,
      specialNeedsNote: specialNeedsNote.trim() || undefined,
      aidNeeds,
      aidNeedsNote: aidNeedsNote.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <span className="font-mono text-xs text-blue-600 font-bold">{record.id}</span>
            <h3 className="text-lg font-black text-slate-900">避難者情報の編集</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          {/* 施設 & 区画 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">避難施設</label>
              <select
                value={facilityId}
                onChange={e => setFacilityId(e.target.value as FacilityId)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="aquadome">アクアドームくまもと</option>
                <option value="keirin">熊本競輪場</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">区画番号 (1〜150)</label>
              <input
                type="number"
                min={1}
                max={150}
                value={slotNumber}
                onChange={e => setSlotNumber(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono font-bold"
              />
            </div>
          </div>

          {/* 代表者情報 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">代表者氏名</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">フリガナ</label>
              <input
                type="text"
                value={nameKana}
                onChange={e => setNameKana(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">年代</label>
              <select
                value={ageGroup}
                onChange={e => setAgeGroup(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                {AGE_GROUPS.map(ag => (
                  <option key={ag} value={ag}>{ag}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">電話番号</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">メールアドレス（定期確認用）</label>
              <input
                type="email"
                placeholder="例: example@kumamoto.jp"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
          </div>

          {/* 車両情報 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">車種名</label>
              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ナンバープレート</label>
              <input
                type="text"
                value={numberPlate}
                onChange={e => setNumberPlate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ボディカラー</label>
              <input
                type="text"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              />
            </div>
          </div>

          {/* 体調ステータス */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">体調状態</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'good', label: '良好' },
                { id: 'caution', label: '要注意' },
                { id: 'bad', label: '体調不良' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setHealthStatus(opt.id as HealthStatus)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    healthStatus === opt.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">自覚症状チェック:</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {SYMPTOM_OPTIONS.map(opt => (
                  <label key={opt.id} className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={healthSymptoms.includes(opt.id)}
                      onChange={() => handleToggleSymptom(opt.id)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">体調メモ</label>
              <textarea
                rows={2}
                value={healthNote}
                onChange={e => setHealthNote(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
          </div>

          {/* 特記事項 & ニーズ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">特記事項（要配慮）</label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {SPECIAL_NEEDS_OPTIONS.map(opt => (
                  <label key={opt.id} className="flex items-center gap-1.5 text-xs p-1.5 bg-slate-50 rounded border border-slate-200">
                    <input
                      type="checkbox"
                      checked={specialNeeds.includes(opt.id)}
                      onChange={() => handleToggleSpecialNeed(opt.id)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">支援物資ニーズ</label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {AID_NEEDS_OPTIONS.map(opt => (
                  <label key={opt.id} className="flex items-center gap-1.5 text-xs p-1.5 bg-slate-50 rounded border border-slate-200">
                    <input
                      type="checkbox"
                      checked={aidNeeds.includes(opt.id)}
                      onChange={() => handleToggleAidNeed(opt.id)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center"
            >
              <span>変更を保存する</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


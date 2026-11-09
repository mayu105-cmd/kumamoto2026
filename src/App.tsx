import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { RegistrationForm } from './components/evacuee/RegistrationForm';
import { DigitalPass } from './components/evacuee/DigitalPass';
import { ReissuePassModal } from './components/evacuee/ReissuePassModal';
import { HealthUpdateModal } from './components/evacuee/HealthUpdateModal';
import { DailyCheckinModal } from './components/evacuee/DailyCheckinModal';
import { LoginModal } from './components/admin/LoginModal';
import { Dashboard } from './components/admin/Dashboard';
import { ParkingMap } from './components/admin/ParkingMap';
import { ParkingSlotModal } from './components/admin/ParkingSlotModal';
import { EvacueeList } from './components/admin/EvacueeList';
import { EvacueeEditModal } from './components/admin/EvacueeEditModal';
import { DataManager } from './components/admin/DataManager';
import { AidDistributor } from './components/admin/AidDistributor';
import {
  EvacueeRecord, AdminUser, FacilityId
} from './types';
import {
  loadEvacueeRecords, saveEvacueeRecords, addEvacueeRecord, updateEvacueeRecord,
  deleteEvacueeRecord, getSavedMyEvacueeId, setSavedMyEvacueeId, getSavedAdminUser,
  setSavedAdminUser, resetToInitialMockData
} from './utils/storage';

export const App: React.FC = () => {
  // レコード状態
  const [records, setRecords] = useState<EvacueeRecord[]>(() => loadEvacueeRecords());
  // 管理者認証状態
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => getSavedAdminUser());
  // 選択施設
  const [selectedFacility, setSelectedFacility] = useState<FacilityId>('aquadome');
  // 現在のタブ
  const [currentTab, setCurrentTab] = useState<
    'evacuee_register' | 'evacuee_pass' | 'admin_dashboard' | 'admin_parking' | 'admin_list' | 'admin_data'
  >('evacuee_register');

  // 車中泊避難者の会員証用レコード
  const [myRecord, setMyRecord] = useState<EvacueeRecord | null>(null);

  // モーダル管理
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isReissueOpen, setIsReissueOpen] = useState(false);
  const [isHealthUpdateOpen, setIsHealthUpdateOpen] = useState(false);
  const [isDailyCheckinOpen, setIsDailyCheckinOpen] = useState(false);
  const [dailyCheckinRecord, setDailyCheckinRecord] = useState<EvacueeRecord | null>(null);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [selectedSlotNumber, setSelectedSlotNumber] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<EvacueeRecord | null>(null);
  const [listFilterParam, setListFilterParam] = useState<string>('all');
  const [registerDefaultSlot, setRegisterDefaultSlot] = useState<number | undefined>(undefined);

  // URLパラメータ（?checkin=ID）による定期確認フォーム自動起動
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkinId = params.get('checkin');
    if (checkinId) {
      const target = records.find(r => r.id === checkinId);
      if (target) {
        setMyRecord(target);
        setDailyCheckinRecord(target);
        setIsDailyCheckinOpen(true);
        setCurrentTab('evacuee_pass');
      }
    }
  }, [records]);

  // 初回ロード時: 保存済み避難者IDがあれば会員証をセット
  useEffect(() => {
    const savedId = getSavedMyEvacueeId();
    if (savedId) {
      const found = records.find(r => r.id === savedId);
      if (found) {
        setMyRecord(found);
      }
    }
  }, [records]);

  // ストレージ同期イベント監視
  useEffect(() => {
    const handleDataChanged = () => {
      const latest = loadEvacueeRecords();
      setRecords(latest);
      if (myRecord) {
        const updatedMy = latest.find(r => r.id === myRecord.id);
        if (updatedMy) setMyRecord(updatedMy);
      }
    };

    window.addEventListener('evacuee-data-changed', handleDataChanged);
    return () => window.removeEventListener('evacuee-data-changed', handleDataChanged);
  }, [myRecord]);

  // タブ選択時のセキュリティガード
  const handleSelectTab = (tab: any) => {
    if (tab.startsWith('admin_') && !adminUser) {
      setIsLoginOpen(true);
      return;
    }
    setCurrentTab(tab);
  };

  // 避難者登録成功
  const handleRegisterSuccess = (newRecord: EvacueeRecord) => {
    addEvacueeRecord(newRecord);
    setMyRecord(newRecord);
    setSavedMyEvacueeId(newRecord.id);
    setCurrentTab('evacuee_pass');
  };

  // 避難者レコード更新
  const handleUpdateRecord = (updated: EvacueeRecord) => {
    updateEvacueeRecord(updated);
    if (myRecord && myRecord.id === updated.id) {
      setMyRecord(updated);
    }
    if (editingRecord && editingRecord.id === updated.id) {
      setEditingRecord(updated);
    }
  };

  // 避難者レコード一括更新
  const handleBatchUpdateRecords = (updatedList: EvacueeRecord[]) => {
    const updatedMap = new Map(updatedList.map(r => [r.id, r]));
    const nextRecords = records.map(r => updatedMap.get(r.id) || r);
    saveEvacueeRecords(nextRecords);
    setRecords(nextRecords);
    if (myRecord && updatedMap.has(myRecord.id)) {
      setMyRecord(updatedMap.get(myRecord.id)!);
    }
  };

  // 避難者レコード削除
  const handleDeleteRecord = (id: string) => {
    deleteEvacueeRecord(id);
    if (myRecord && myRecord.id === id) {
      setMyRecord(null);
      setSavedMyEvacueeId(null);
      setCurrentTab('evacuee_register');
    }
  };

  // 見回りトグル
  const handleTogglePatrol = (id: string) => {
    const target = records.find(r => r.id === id);
    if (!target) return;
    const isPatrolled = target.patrolStatus === 'patrolled';
    const updated: EvacueeRecord = {
      ...target,
      patrolStatus: isPatrolled ? 'pending' : 'patrolled',
      lastPatrolledAt: isPatrolled ? undefined : new Date().toISOString(),
      lastPatrolledBy: isPatrolled ? undefined : (adminUser?.name || '巡回スタッフ'),
      updatedAt: new Date().toISOString(),
    };
    handleUpdateRecord(updated);
  };

  // 区画クリック
  const handleSlotClick = (slotNumber: number, record?: EvacueeRecord) => {
    setSelectedSlotNumber(slotNumber);
    if (record) {
      setEditingRecord(record);
      setIsSlotModalOpen(true);
    }
  };

  // 空き区画からの新規登録誘導
  const handleOpenNewRegisterForSlot = (slotNumber: number) => {
    setRegisterDefaultSlot(slotNumber);
    setCurrentTab('evacuee_register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ログイン成功
  const handleLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
    setSavedAdminUser(user);
    setCurrentTab('admin_dashboard');
  };

  // ログアウト
  const handleLogout = () => {
    setAdminUser(null);
    setSavedAdminUser(null);
    setCurrentTab('evacuee_register');
  };

  // デモデータリセット
  const handleResetData = () => {
    const fresh = resetToInitialMockData();
    setRecords(fresh);
    const savedId = getSavedMyEvacueeId();
    if (savedId) {
      const match = fresh.find(r => r.id === savedId);
      setMyRecord(match || fresh[0]);
    }
  };

  // 全体一括インポート
  const handleImportRecords = (newRecords: EvacueeRecord[]) => {
    saveEvacueeRecords(newRecords);
    setRecords(newRecords);
  };

  // 選択中区画のレコード取得
  const currentSlotRecord = selectedSlotNumber
    ? records.find(r => r.facilityId === selectedFacility && r.slotNumber === selectedSlotNumber) || null
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      {/* ナビゲーションバー */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        adminUser={adminUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        onOpenReissue={() => setIsReissueOpen(true)}
        hasSavedPass={!!myRecord}
        selectedFacility={selectedFacility}
        onSelectFacility={setSelectedFacility}
      />

      {/* メインビューエリア */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* 1. 避難者登録画面 */}
        {currentTab === 'evacuee_register' && (
          <RegistrationForm
            existingRecords={records}
            onRegisterSuccess={handleRegisterSuccess}
            defaultFacility={selectedFacility}
            defaultSlotNumber={registerDefaultSlot}
          />
        )}

        {/* 2. デジタル会員証（受付証）画面 */}
        {currentTab === 'evacuee_pass' && (
          <div>
            {myRecord ? (
              <DigitalPass
                record={myRecord}
                onOpenHealthUpdate={() => setIsHealthUpdateOpen(true)}
                onOpenDailyCheckin={() => {
                  setDailyCheckinRecord(myRecord);
                  setIsDailyCheckinOpen(true);
                }}
                onReissueSearch={() => setIsReissueOpen(true)}
              />
            ) : (
              <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 text-center shadow-lg">
                <h3 className="text-lg font-bold text-slate-900 mb-2">受付証が未登録です</h3>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  まずは避難者登録を行っていただくか、以前に登録済みの場合は電話番号等で受付証を再表示してください。
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => setCurrentTab('evacuee_register')}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                  >
                    新しく避難者登録を行う
                  </button>
                  <button
                    onClick={() => setIsReissueOpen(true)}
                    className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors"
                  >
                    電話番号で受付証を再表示する
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. 行政ダッシュボード画面 */}
        {currentTab === 'admin_dashboard' && adminUser && (
          <Dashboard
            records={records}
            selectedFacility={selectedFacility}
            onSelectSlot={(slot) => {
              setSelectedSlotNumber(slot);
              const found = records.find(r => r.facilityId === selectedFacility && r.slotNumber === slot);
              if (found) {
                setEditingRecord(found);
                setIsSlotModalOpen(true);
              }
            }}
            onNavigateToParking={() => setCurrentTab('admin_parking')}
            onNavigateToList={(filter) => {
              if (filter) setListFilterParam(filter);
              setCurrentTab('admin_list');
            }}
            onQuickPatrol={handleTogglePatrol}
            onUpdateRecord={handleUpdateRecord}
            onBatchUpdateRecords={handleBatchUpdateRecords}
          />
        )}

        {/* 4. 行政駐車マップ画面 */}
        {currentTab === 'admin_parking' && adminUser && (
          <ParkingMap
            records={records}
            selectedFacility={selectedFacility}
            onSelectFacility={setSelectedFacility}
            onSlotClick={handleSlotClick}
            onOpenNewRegisterForSlot={handleOpenNewRegisterForSlot}
          />
        )}

        {/* 5. 行政避難者台帳画面 */}
        {currentTab === 'admin_list' && adminUser && (
          <EvacueeList
            records={records}
            selectedFacility={selectedFacility}
            onSelectSlot={(slot) => {
              setSelectedSlotNumber(slot);
              const found = records.find(r => r.facilityId === selectedFacility && r.slotNumber === slot);
              if (found) {
                setEditingRecord(found);
                setIsSlotModalOpen(true);
              }
            }}
            onEditRecord={(r) => {
              setEditingRecord(r);
              setIsEditModalOpen(true);
            }}
            onDeleteRecord={handleDeleteRecord}
            onTogglePatrol={handleTogglePatrol}
            onOpenNewRegister={() => {
              setCurrentTab('evacuee_register');
            }}
            initialFilter={listFilterParam}
          />
        )}

        {/* 6. 行政データ管理 & 物資配布チェッカー画面 */}
        {currentTab === 'admin_data' && adminUser && (
          <div className="space-y-12">
            <AidDistributor
              records={records}
              adminUser={adminUser}
              onUpdateRecord={handleUpdateRecord}
            />
            <DataManager
              records={records}
              onImportRecords={handleImportRecords}
              onResetData={handleResetData}
            />
          </div>
        )}
      </main>

      {/* モーダル群 */}
      {/* ログインモーダル */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* 会員証再表示モーダル */}
      <ReissuePassModal
        isOpen={isReissueOpen}
        onClose={() => setIsReissueOpen(false)}
        records={records}
        onSelectRecord={(r) => {
          setMyRecord(r);
          setSavedMyEvacueeId(r.id);
          setCurrentTab('evacuee_pass');
        }}
      />

      {/* 体調再申告モーダル */}
      {myRecord && (
        <HealthUpdateModal
          isOpen={isHealthUpdateOpen}
          onClose={() => setIsHealthUpdateOpen(false)}
          record={myRecord}
          onUpdate={handleUpdateRecord}
        />
      )}

      {/* 一日おき定期確認モーダル（健康状態＆支援ニーズ） */}
      {dailyCheckinRecord && (
        <DailyCheckinModal
          isOpen={isDailyCheckinOpen}
          onClose={() => setIsDailyCheckinOpen(false)}
          record={dailyCheckinRecord}
          onUpdate={handleUpdateRecord}
        />
      )}

      {/* 駐車区画詳細モーダル */}
      <ParkingSlotModal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        record={currentSlotRecord || editingRecord}
        adminUser={adminUser}
        onUpdateRecord={handleUpdateRecord}
        onDeleteRecord={handleDeleteRecord}
        onOpenEditModal={(r) => {
          setEditingRecord(r);
          setIsEditModalOpen(true);
        }}
      />

      {/* 避難者情報編集モーダル */}
      <EvacueeEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        record={editingRecord}
        onSave={handleUpdateRecord}
      />

      {/* フッター */}
      <Footer />
    </div>
  );
};


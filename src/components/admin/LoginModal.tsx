import React, { useState } from 'react';
import { X } from 'lucide-react';
import { AdminUser } from '../../types';
import { DEMO_ADMIN_USERS } from '../../utils/constants';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AdminUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('kumamoto_bousai');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 認証ロジック
    const matched = DEMO_ADMIN_USERS.find(u => u.username === username);
    if (matched && password.length >= 4) {
      onLoginSuccess(matched);
      onClose();
    } else if (username === 'admin' && password === 'admin') {
      onLoginSuccess(DEMO_ADMIN_USERS[0]);
      onClose();
    } else {
      setError('ユーザー名またはパスワードが正しくありません。');
    }
  };

  const handleSelectDemoUser = (user: typeof DEMO_ADMIN_USERS[0]) => {
    setUsername(user.username);
    setPassword('kumamoto2026');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
        <div className="flex justify-between items-start pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900">行政・スタッフ認証</h3>
            <p className="text-xs text-slate-500">
              災害対策本部・避難所救護スタッフ専用ポータル
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              職員ID / ユーザー名
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="ユーザー名を入力"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              パスワード
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                className="w-full px-3 py-2.5 pr-14 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-2 px-2 py-1 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title={showPassword ? 'パスワードを隠す' : 'パスワードを表示する'}
              >
                {showPassword ? '非表示' : '表示'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center"
          >
            <span>ログインして管理画面へ</span>
          </button>
        </form>

        {/* 審査・実演用のワンクリック選択アカウント */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            デモ・演習用アカウント（ワンクリック自動入力）:
          </span>
          <div className="space-y-1.5">
            {DEMO_ADMIN_USERS.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSelectDemoUser(u)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors border ${username === u.username
                    ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
              >
                <div>
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">ID: {u.username}</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                  {u.role === 'admin' ? '全体管理' : '現地'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


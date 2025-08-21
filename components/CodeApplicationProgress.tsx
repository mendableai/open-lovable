import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CodeApplicationState {
  stage: 'analyzing' | 'installing' | 'applying' | 'complete' | 'error' | null;
  packages?: string[];
  installedPackages?: string[];
  filesGenerated?: string[];
  filesUpdated?: string[];
  message?: string;
  error?: string;
  progress?: {
    current: number;
    total: number;
    action?: string;
  };
  timestamp?: string;
}

interface CodeApplicationProgressProps {
  state: CodeApplicationState;
}

const getStageIcon = (stage: string) => {
  switch (stage) {
    case 'analyzing':
      return '🔍';
    case 'installing':
      return '📦';
    case 'applying':
      return '⚡';
    case 'complete':
      return '✅';
    case 'error':
      return '❌';
    default:
      return '⏳';
  }
};

const getStageMessage = (stage: string, state: CodeApplicationState) => {
  switch (stage) {
    case 'analyzing':
      return state.message || 'تحليل الطلب وتحضير الكود...';
    case 'installing':
      return state.packages?.length 
        ? `تثبيت ${state.packages.length} حزمة: ${state.packages.slice(0, 2).join(', ')}${state.packages.length > 2 ? '...' : ''}`
        : 'تثبيت المكتبات المطلوبة...';
    case 'applying':
      return state.filesGenerated?.length 
        ? `إنشاء ${state.filesGenerated.length} ملف`
        : 'تطبيق التغييرات على المشروع...';
    case 'complete':
      return '✨ تم بنجاح! المشروع جاهز';
    case 'error':
      return state.error || 'حدث خطأ أثناء العملية';
    default:
      return state.message || 'جارٍ المعالجة...';
  }
};

export default function CodeApplicationProgress({ state }: CodeApplicationProgressProps) {
  if (!state.stage) return null;

  const isComplete = state.stage === 'complete';
  const isError = state.stage === 'error';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state.stage}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
        className={`relative overflow-hidden rounded-xl p-4 mt-3 shadow-lg ${
          isError
            ? 'bg-red-50 border border-red-200'
            : isComplete
            ? 'bg-green-50 border border-green-200'
            : 'bg-blue-50 border border-blue-200'
        }`}
      >
        {/* Animated background gradient */}
        {!isComplete && !isError && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-purple-100/50"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        )}

        <div className="relative flex items-start gap-4">
          {/* Stage Icon */}
          <motion.div
            key={state.stage}
            initial={{ scale: 0.5, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-lg"
          >
            {!isComplete && !isError ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                {getStageIcon(state.stage)}
              </motion.div>
            ) : (
              getStageIcon(state.stage)
            )}
          </motion.div>

          <div className="flex-1 min-w-0">
            {/* Main Message */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`font-medium text-sm mb-2 ${
                isError
                  ? 'text-red-800'
                  : isComplete
                  ? 'text-green-800'
                  : 'text-blue-800'
              }`}
            >
              {getStageMessage(state.stage, state)}
            </motion.div>

            {/* Progress Bar */}
            {state.progress && state.progress.total > 1 && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-3"
              >
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{state.progress.action || 'معالجة'}</span>
                  <span>{state.progress.current} / {state.progress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-blue-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(state.progress.current / state.progress.total) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}

            {/* Details */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-1"
            >
              {/* Installed Packages */}
              {state.installedPackages?.length > 0 && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">📦 مثبت:</span>{' '}
                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                    {state.installedPackages.join(', ')}
                  </span>
                </div>
              )}

              {/* Generated Files */}
              {state.filesGenerated?.length > 0 && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">📄 ملفات جديدة:</span>{' '}
                  <span className="bg-green-100 px-2 py-0.5 rounded text-green-700">
                    {state.filesGenerated.slice(0, 3).join(', ')}
                    {state.filesGenerated.length > 3 && ` +${state.filesGenerated.length - 3} أكثر`}
                  </span>
                </div>
              )}

              {/* Updated Files */}
              {state.filesUpdated?.length > 0 && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">✏️ ملفات محدثة:</span>{' '}
                  <span className="bg-blue-100 px-2 py-0.5 rounded text-blue-700">
                    {state.filesUpdated.slice(0, 3).join(', ')}
                    {state.filesUpdated.length > 3 && ` +${state.filesUpdated.length - 3} أكثر`}
                  </span>
                </div>
              )}

              {/* Timestamp */}
              {state.timestamp && (
                <div className="text-xs text-gray-500 pt-1">
                  {new Date(state.timestamp).toLocaleTimeString('ar-EG')}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Success/Error Actions */}
        {(isComplete || isError) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-3 pt-3 border-t border-gray-200"
          >
            {isComplete && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-600 font-medium">
                  🎉 تمت العملية بنجاح!
                </span>
                <button className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-full transition-colors">
                  عرض المشروع
                </button>
              </div>
            )}
            
            {isError && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-red-600 font-medium flex-1">
                  {state.error || 'حدث خطأ غير متوقع'}
                </span>
                <button className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-full transition-colors">
                  إعادة المحاولة
                </button>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
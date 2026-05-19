import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Server, Key, Link, Cpu, Plus, Trash2, CheckCircle2 } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface LLMConfig {
  id?: number;
  provider: string;
  api_key: string;
  base_url: string;
  model_name: string;
  is_active?: boolean;
  total_prompt_tokens?: number;
  total_completion_tokens?: number;
}

const Settings = () => {
  const [configs, setConfigs] = useState<LLMConfig[]>([]);
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [currentConfig, setCurrentConfig] = useState<LLMConfig>({
    provider: 'openai',
    api_key: '',
    base_url: '',
    model_name: 'gpt-3.5-turbo'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/config/llm`);
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
      }
    } catch (error) {
      console.error("获取配置失败:", error);
    }
  };

  const handleAddNew = () => {
    setEditingId('new');
    setCurrentConfig({
      provider: 'openai',
      api_key: '',
      base_url: 'https://api.openai.com/v1',
      model_name: 'gpt-3.5-turbo'
    });
  };

  const handleEdit = (config: LLMConfig) => {
    setEditingId(config.id!);
    setCurrentConfig({ ...config });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这个配置吗？')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/config/llm/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchConfigs();
        if (editingId === id) setEditingId(null);
      }
    } catch (error) {
      console.error("删除配置失败:", error);
    }
  };

  const handleSetActive = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/config/llm/${id}/active`, {
        method: 'PUT',
      });
      if (res.ok) {
        fetchConfigs();
      }
    } catch (error) {
      console.error("设置激活失败:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const url = editingId === 'new' 
        ? `${API_BASE_URL}/config/llm` 
        : `${API_BASE_URL}/config/llm/${editingId}`;
      const method = editingId === 'new' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentConfig),
      });
      
      if (res.ok) {
        setMessage({ text: '配置保存成功', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        fetchConfigs();
        setEditingId(null);
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      console.error("保存配置失败:", error);
      setMessage({ text: '保存配置失败，请检查网络连接', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'provider') {
      let defaultBaseUrl = '';
      let defaultModel = '';
      
      switch (value) {
        case 'openai':
          defaultBaseUrl = 'https://api.openai.com/v1';
          defaultModel = 'gpt-3.5-turbo';
          break;
        case 'deepseek':
          defaultBaseUrl = 'https://api.deepseek.com';
          defaultModel = 'deepseek-chat';
          break;
        case 'anthropic':
          defaultBaseUrl = '';
          defaultModel = 'claude-3-haiku-20240307';
          break;
        case 'custom':
          defaultBaseUrl = '';
          defaultModel = '';
          break;
      }
      
      setCurrentConfig(prev => ({ 
        ...prev, 
        [name]: value,
        base_url: defaultBaseUrl,
        model_name: defaultModel
      }));
    } else {
      setCurrentConfig(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8F9FA] overflow-y-auto">
      <div className="max-w-3xl w-full mx-auto py-12 px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <SettingsIcon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">系统设置</h1>
            <p className="text-sm text-gray-500 mt-1">配置 AI 智能体及其他系统参数</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Cpu className="text-indigo-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-800">已配置的模型</h2>
            </div>
            <button 
              onClick={handleAddNew}
              disabled={editingId !== null}
              className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Plus size={16} />
              添加配置
            </button>
          </div>

          <div className="p-6">
            {configs.length === 0 && editingId === null ? (
              <div className="text-center py-8 text-gray-400">
                <p>暂无模型配置，请点击右上角添加</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {configs.map(conf => (
                  <div 
                    key={conf.id} 
                    className={`relative p-5 rounded-2xl border-2 transition-all ${conf.is_active ? 'border-indigo-500 bg-indigo-50/30' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                  >
                    {conf.is_active && (
                      <div className="absolute top-4 right-4 text-indigo-600 flex items-center gap-1 text-xs font-medium bg-indigo-100 px-2 py-1 rounded-md">
                        <CheckCircle2 size={14} />
                        当前使用
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
                        <Server size={18} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 capitalize">{conf.provider}</h3>
                        <p className="text-xs text-gray-500">{conf.model_name}</p>
                      </div>
                    </div>

                    {/* Token 消耗统计 */}
                    <div className="mt-3 mb-4 bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-gray-500">上传 Token:</span>
                        <span className="font-medium font-mono">{conf.total_prompt_tokens?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">输出 Token:</span>
                        <span className="font-medium font-mono">{conf.total_completion_tokens?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-gray-200/60 mt-1.5">
                        <span className="text-gray-500 font-medium">总消耗:</span>
                        <span className="font-bold text-indigo-600 font-mono">
                          {((conf.total_prompt_tokens || 0) + (conf.total_completion_tokens || 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-2">
                      {!conf.is_active && (
                        <button 
                          onClick={() => handleSetActive(conf.id!)}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                          设为默认
                        </button>
                      )}
                      <button 
                        onClick={() => handleEdit(conf)}
                        className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 py-2 rounded-xl text-sm font-medium transition-colors"
                      >
                        编辑
                      </button>
                      <button 
                        onClick={() => handleDelete(conf.id!)}
                        className="w-10 h-10 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 编辑/新增表单 */}
        {editingId !== null && (
          <div className="bg-white rounded-3xl shadow-sm border border-indigo-100 overflow-hidden ring-4 ring-indigo-50">
            <div className="p-6 border-b border-gray-100 bg-indigo-50/30">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingId === 'new' ? '新增模型配置' : '编辑模型配置'}
              </h2>
            </div>

            <div className="p-8 space-y-6">
              {/* 服务商选择 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Server size={16} className="text-gray-400" />
                  模型服务商
                </label>
                <select 
                  name="provider"
                  value={currentConfig.provider}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  <option value="openai">OpenAI</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="custom">自定义 (兼容 OpenAI 格式)</option>
                </select>
              </div>

              {/* API Key */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Key size={16} className="text-gray-400" />
                  API Key
                </label>
                <input 
                  type="password"
                  name="api_key"
                  value={currentConfig.api_key}
                  onChange={handleChange}
                  placeholder="sk-..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Base URL */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Link size={16} className="text-gray-400" />
                  Base URL (可选)
                </label>
                <input 
                  type="text"
                  name="base_url"
                  value={currentConfig.base_url}
                  onChange={handleChange}
                  placeholder="例如: https://api.openai.com/v1"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* 模型名称 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Cpu size={16} className="text-gray-400" />
                  模型名称
                </label>
                <input 
                  type="text"
                  name="model_name"
                  value={currentConfig.model_name}
                  onChange={handleChange}
                  placeholder="例如: gpt-4o, deepseek-chat"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* 底部操作区 */}
            <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm">
                {message.text && (
                  <span className={message.type === 'success' ? 'text-emerald-600' : 'text-red-500'}>
                    {message.text}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleCancelEdit}
                  className="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-70"
                >
                  <Save size={18} />
                  {isSaving ? '保存中...' : '保存配置'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;

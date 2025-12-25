import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { getOrCreateUserId } from '../utils/userId';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const { user, updateUser, token } = useAuth();
  
  // 用户画像记录（最多2条）
  const [profileHistory, setProfileHistory] = useState([]);
  
  // 表单状态
  const [formData, setFormData] = useState({
    age_group: 'adult',
    sensitivity: 'none',
    conditions: []
  });

  // 从localStorage加载用户画像记录
  useEffect(() => {
    const savedHistory = localStorage.getItem('profileHistory');
    if (savedHistory) {
      try {
        setProfileHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load profile history:', e);
      }
    }
  }, []);

  // 当用户数据加载后，初始化表单数据
  useEffect(() => {
    if (user) {
      setFormData({
        age_group: user.profile_json?.age_group || 'adult',
        sensitivity: user.profile_json?.sensitivity || 'none',
        conditions: user.profile_json?.conditions || []
      });
      
      // 如果用户有profile_json且不是默认值，标记为已设置私人定制
      const profile = user.profile_json || {};
      const hasCustomSettings = 
        profile.age_group && profile.age_group !== 'adult' ||
        profile.sensitivity && profile.sensitivity !== 'none' ||
        (profile.conditions && profile.conditions.length > 0);
      
      if (hasCustomSettings) {
        localStorage.setItem('hasCustomProfile', 'true');
      }
    }
  }, [user]);

  // 更新用户资料
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      // 获取或创建用户ID（匿名用户）
      const userId = getOrCreateUserId();
      
      // 配置请求头
      const config = {
        headers: {
          'X-User-ID': userId
        }
      };
      
      // 如果有token，也添加到请求头
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await axios.put('/api/users/profile', data, config);
      return res.data.data;
    },
    onSuccess: (data) => {
      updateUser(data);
      
      // 添加用户画像历史记录
      const newHistoryItem = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        profile: {
          age_group: formData.age_group,
          sensitivity: formData.sensitivity,
          conditions: [...formData.conditions]
        }
      };
      
      // 更新历史记录（最多保留2条）
      const updatedHistory = [newHistoryItem, ...profileHistory].slice(0, 2);
      setProfileHistory(updatedHistory);
      localStorage.setItem('profileHistory', JSON.stringify(updatedHistory));
      
      // 标记用户已设置私人定制
      localStorage.setItem('hasCustomProfile', 'true');
      
      // 触发自定义事件，通知其他组件更新
      window.dispatchEvent(new CustomEvent('customProfileUpdated'));
      
      alert('用户画像更新成功！系统将根据您的个人属性提供个性化穿衣建议。');
      // 停留在当前页面，不跳转
    },
    onError: (error) => {
      console.error('Failed to update profile:', error);
      if (error.response?.status === 401) {
        alert('认证失败，请重新登录');
      } else {
        alert('保存失败，请重试');
      }
    }
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConditionToggle = (condition) => {
    setFormData(prev => {
      const conditions = prev.conditions || [];
      const newConditions = conditions.includes(condition)
        ? conditions.filter(c => c !== condition)
        : [...conditions, condition];
      return {
        ...prev,
        conditions: newConditions
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const profileData = {
      profile_json: {
        age_group: formData.age_group,
        sensitivity: formData.sensitivity,
        conditions: formData.conditions
      }
    };
    updateProfileMutation.mutate(profileData);
  };

  // 应用历史记录中的用户画像设置
  const handleApplyHistory = async (historyItem) => {
    // 更新表单数据
    const appliedFormData = {
      age_group: historyItem.profile.age_group || 'adult',
      sensitivity: historyItem.profile.sensitivity || 'none',
      conditions: historyItem.profile.conditions || []
    };
    setFormData(appliedFormData);
    
    // 保存用户选择到后端
    const profileData = {
      profile_json: {
        age_group: appliedFormData.age_group,
        sensitivity: appliedFormData.sensitivity,
        conditions: appliedFormData.conditions
      }
    };
    
    try {
      // 获取或创建用户ID（匿名用户）
      const userId = getOrCreateUserId();
      
      // 配置请求头
      const config = {
        headers: {
          'X-User-ID': userId
        }
      };
      
      // 如果有token，也添加到请求头
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await axios.put('/api/users/profile', profileData, config);
      const updatedUser = res.data.data;
      
      // 更新用户数据
      updateUser(updatedUser);
      
      // 更新历史记录：将应用的记录移到最前面（更新时间戳）
      const updatedHistoryItem = {
        ...historyItem,
        timestamp: new Date().toISOString() // 更新时间戳，使其成为最新记录
      };
      
      // 从历史记录中移除当前项，然后添加到最前面
      const filteredHistory = profileHistory.filter(item => item.id !== historyItem.id);
      const updatedHistory = [updatedHistoryItem, ...filteredHistory].slice(0, 2);
      setProfileHistory(updatedHistory);
      localStorage.setItem('profileHistory', JSON.stringify(updatedHistory));
      
      // 标记用户已设置私人定制
      localStorage.setItem('hasCustomProfile', 'true');
      
      // 触发自定义事件，通知其他组件更新
      window.dispatchEvent(new CustomEvent('customProfileUpdated'));
      
      alert('设置已应用并保存成功！');
      
      // 滚动到表单顶部，让用户看到已应用设置
      const formElement = document.querySelector('.settings-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (error) {
      console.error('Failed to apply profile:', error);
      if (error.response?.status === 401) {
        alert('认证失败，请重新登录');
      } else {
        alert('保存失败，请重试');
      }
    }
  };

  return (
    <div className="settings-page container">
      <div className="settings-header">
        <button 
          className="btn-back"
          onClick={() => navigate('/')}
          title="返回首页"
        >
          ← 返回
        </button>
        <h1 className="page-title">私人定制</h1>
      </div>
      
      <div className="profile-intro">
        <p className="intro-text">
          💡 设置您的个人属性后，系统将根据您的年龄、身体状态等信息，为您提供更精准的个性化穿衣建议。
        </p>
      </div>

      <div className="settings-sections">
        {/* 用户资料设置 */}
        <section className="settings-section card profile-section">
          <div className="section-header">
            <h2>👤 个人资料</h2>
            <span className="section-subtitle">完善您的信息以获得个性化建议</span>
          </div>
          <form onSubmit={handleSubmit} className="settings-form">
            <div className="form-group">
              <label>年龄段</label>
              <select
                className="input"
                value={formData.age_group}
                onChange={(e) => handleInputChange('age_group', e.target.value)}
              >
                <option value="child_0_2">0-2岁</option>
                <option value="child_3_6">3-6岁</option>
                <option value="child_7_12">7-12岁</option>
                <option value="adult">成人</option>
                <option value="elderly_65_plus">65岁以上</option>
              </select>
            </div>

            <div className="form-group">
              <label>温度敏感度</label>
              <select
                className="input"
                value={formData.sensitivity}
                onChange={(e) => handleInputChange('sensitivity', e.target.value)}
              >
                <option value="none">正常</option>
                <option value="cold">怕冷</option>
                <option value="hot">怕热</option>
              </select>
            </div>

            <div className="form-group">
              <label>健康状况</label>
              <div className="checkbox-group">
                <p className="checkbox-hint">请选择您受天气影响较大的健康状况（可多选）</p>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.conditions.includes('rheumatism')}
                    onChange={() => handleConditionToggle('rheumatism')}
                  />
                  <span>风湿/关节不适</span>
                </label>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.conditions.includes('asthma')}
                    onChange={() => handleConditionToggle('asthma')}
                  />
                  <span>哮喘</span>
                </label>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.conditions.includes('cardiovascular')}
                    onChange={() => handleConditionToggle('cardiovascular')}
                  />
                  <span>心血管疾病（高血压、心脏病等）</span>
                </label>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.conditions.includes('copd')}
                    onChange={() => handleConditionToggle('copd')}
                  />
                  <span>慢性阻塞性肺疾病（COPD）</span>
                </label>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.conditions.includes('migraine')}
                    onChange={() => handleConditionToggle('migraine')}
                  />
                  <span>偏头痛</span>
                </label>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.conditions.includes('skin_disease')}
                    onChange={() => handleConditionToggle('skin_disease')}
                  />
                  <span>皮肤病（湿疹、银屑病等）</span>
                </label>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.conditions.includes('allergy')}
                    onChange={() => handleConditionToggle('allergy')}
                  />
                  <span>过敏性疾病（过敏性鼻炎等）</span>
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={updateProfileMutation.isLoading}>
              {updateProfileMutation.isLoading ? '保存中...' : '保存设置'}
            </button>
          </form>
        </section>

        {/* 用户画像历史记录 */}
        {profileHistory.length > 0 && (
          <section className="settings-section card profile-history-section">
            <div className="section-header">
              <h2>📋 定制记录</h2>
              <span className="section-subtitle">最近保存的用户画像（最多2条）</span>
            </div>
            <div className="profile-history-list">
              {profileHistory.map((item) => {
                const date = new Date(item.timestamp);
                const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                
                // 时间段显示（今天、昨天、或具体日期）
                const now = new Date();
                const itemDate = new Date(item.timestamp);
                const diffTime = now - itemDate;
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                let timeDisplay = formattedDate;
                if (diffDays === 0) {
                  timeDisplay = `今天 ${String(itemDate.getHours()).padStart(2, '0')}:${String(itemDate.getMinutes()).padStart(2, '0')}`;
                } else if (diffDays === 1) {
                  timeDisplay = `昨天 ${String(itemDate.getHours()).padStart(2, '0')}:${String(itemDate.getMinutes()).padStart(2, '0')}`;
                }
                
                // 年龄段标签映射
                const ageGroupLabels = {
                  'child_0_2': '0-2岁',
                  'child_3_6': '3-6岁',
                  'child_7_12': '7-12岁',
                  'adult': '成人',
                  'elderly_65_plus': '65岁以上'
                };
                
                // 敏感度标签映射
                const sensitivityLabels = {
                  'none': '正常',
                  'cold': '怕冷',
                  'hot': '怕热'
                };
                
                // 健康状况标签映射
                const conditionLabels = {
                  'rheumatism': '风湿/关节不适',
                  'asthma': '哮喘',
                  'cardiovascular': '心血管疾病',
                  'copd': 'COPD',
                  'migraine': '偏头痛',
                  'skin_disease': '皮肤病',
                  'allergy': '过敏性疾病'
                };
                
                // 检查当前用户设置是否与历史记录匹配
                const currentProfile = user?.profile_json || formData;
                const isCurrentProfile = 
                  currentProfile.age_group === item.profile.age_group &&
                  currentProfile.sensitivity === item.profile.sensitivity &&
                  JSON.stringify([...(currentProfile.conditions || [])].sort()) === JSON.stringify([...(item.profile.conditions || [])].sort());
                
                return (
                  <div key={item.id} className={`profile-history-card ${isCurrentProfile ? 'is-current' : ''}`}>
                    <div className="history-card-header">
                      <div className="history-card-title">
                        <span className="history-card-icon">⚙️</span>
                        <div className="history-card-title-text">
                          <span className="history-card-label">定制方案</span>
                          <span className="history-card-date">{timeDisplay}</span>
                        </div>
                      </div>
                      {isCurrentProfile && (
                        <span className="current-status-badge">
                          <span className="status-dot"></span>
                          当前使用
                        </span>
                      )}
                    </div>
                    
                    <div className="history-card-body">
                      <div className="history-info-grid">
                        <div className="history-info-item">
                          <div className="info-icon">👤</div>
                          <div className="info-content">
                            <div className="info-label">年龄段</div>
                            <div className="info-value">{ageGroupLabels[item.profile.age_group] || item.profile.age_group}</div>
                          </div>
                        </div>
                        
                        <div className="history-info-item">
                          <div className="info-icon">🌡️</div>
                          <div className="info-content">
                            <div className="info-label">温度敏感度</div>
                            <div className="info-value">{sensitivityLabels[item.profile.sensitivity] || item.profile.sensitivity}</div>
                          </div>
                        </div>
                        
                        {item.profile.conditions && item.profile.conditions.length > 0 && (
                          <div className="history-info-item history-info-item-full">
                            <div className="info-icon">🏥</div>
                            <div className="info-content">
                              <div className="info-label">健康状况</div>
                              <div className="info-tags">
                                {item.profile.conditions.map(c => (
                                  <span key={c} className="info-tag">
                                    {conditionLabels[c] || c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {!isCurrentProfile && (
                      <div className="history-card-footer">
                        <button
                          type="button"
                          className="btn-apply-history"
                          onClick={() => handleApplyHistory(item)}
                        >
                          <span className="btn-icon">✓</span>
                          应用此设置
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Settings;

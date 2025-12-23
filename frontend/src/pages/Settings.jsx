import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import CustomSelect from '../components/CustomSelect';
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
    }
  }, [user]);

  // 更新用户资料
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      // 确保请求包含token
      const config = token ? {
        headers: {
          Authorization: `Bearer ${token}`
        }
      } : {};
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
      
      alert('用户画像更新成功！系统将根据您的个人属性提供个性化穿衣建议。');
      // 可选：保存后返回首页
      setTimeout(() => {
        navigate('/');
      }, 1000);
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
        <h1 className="page-title">私人定制 - 用户画像</h1>
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
              <CustomSelect
                value={formData.age_group}
                onChange={(e) => handleInputChange('age_group', e.target.value)}
                options={[
                  { value: 'child_0_2', label: '0-2岁' },
                  { value: 'child_3_6', label: '3-6岁' },
                  { value: 'child_7_12', label: '7-12岁' },
                  { value: 'adult', label: '成人' },
                  { value: 'elderly_65_plus', label: '65岁以上' }
                ]}
              />
            </div>

            <div className="form-group">
              <label>温度敏感度</label>
              <CustomSelect
                value={formData.sensitivity}
                onChange={(e) => handleInputChange('sensitivity', e.target.value)}
                options={[
                  { value: 'none', label: '正常' },
                  { value: 'cold', label: '怕冷' },
                  { value: 'hot', label: '怕热' }
                ]}
              />
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
              <h2>📋 历史记录</h2>
              <span className="section-subtitle">最近保存的用户画像（最多2条）</span>
            </div>
            <div className="profile-history-list">
              {profileHistory.map((item) => {
                const date = new Date(item.timestamp);
                const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                
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
                
                return (
                  <div key={item.id} className="profile-history-item">
                    <div className="history-item-header">
                      <span className="history-item-date">{formattedDate}</span>
                    </div>
                    <div className="history-item-content">
                      <div className="history-item-field">
                        <span className="field-label">年龄段：</span>
                        <span className="field-value">{ageGroupLabels[item.profile.age_group] || item.profile.age_group}</span>
                      </div>
                      <div className="history-item-field">
                        <span className="field-label">温度敏感度：</span>
                        <span className="field-value">{sensitivityLabels[item.profile.sensitivity] || item.profile.sensitivity}</span>
                      </div>
                      {item.profile.conditions && item.profile.conditions.length > 0 && (
                        <div className="history-item-field">
                          <span className="field-label">健康状况：</span>
                          <span className="field-value">
                            {item.profile.conditions.map(c => conditionLabels[c] || c).join('、')}
                          </span>
                        </div>
                      )}
                    </div>
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

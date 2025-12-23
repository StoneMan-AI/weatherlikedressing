import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [locationForm, setLocationForm] = useState({
    name: '',
    latitude: '',
    longitude: '',
    timezone: 'Asia/Shanghai',
    is_default: false
  });

  // 获取地点列表
  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await axios.get('/api/locations');
      return res.data.data;
    }
  });

  // 更新用户资料
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axios.put('/api/users/profile', data);
      return res.data.data;
    },
    onSuccess: (data) => {
      updateUser(data);
      alert('用户画像更新成功！系统将根据您的个人属性提供个性化穿衣建议。');
      // 可选：保存后返回首页
      setTimeout(() => {
        navigate('/');
      }, 1000);
    }
  });

  // 添加地点
  const addLocationMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axios.post('/api/locations', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['locations']);
      setLocationForm({
        name: '',
        latitude: '',
        longitude: '',
        timezone: 'Asia/Shanghai',
        is_default: false
      });
      alert('地点添加成功');
    }
  });

  // 删除地点
  const deleteLocationMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`/api/locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['locations']);
      alert('地点删除成功');
    }
  });

  const handleAddLocation = (e) => {
    e.preventDefault();
    if (!locationForm.name || !locationForm.latitude || !locationForm.longitude) {
      alert('请填写完整信息');
      return;
    }
    addLocationMutation.mutate({
      ...locationForm,
      latitude: parseFloat(locationForm.latitude),
      longitude: parseFloat(locationForm.longitude)
    });
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const profileData = {
      language: formData.get('language'),
      profile_json: {
        age_group: formData.get('age_group'),
        sensitivity: formData.get('sensitivity'),
        conditions: formData.getAll('conditions')
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
          <form onSubmit={handleProfileUpdate} className="settings-form">
            <div className="form-group">
              <label>语言</label>
              <select
                name="language"
                className="input"
                defaultValue={user?.language || 'zh-CN'}
              >
                <option value="zh-CN">简体中文</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="form-group">
              <label>年龄段</label>
              <select name="age_group" className="input" defaultValue={user?.profile_json?.age_group || 'adult'}>
                <option value="child_0_2">0-2岁</option>
                <option value="child_3_6">3-6岁</option>
                <option value="child_7_12">7-12岁</option>
                <option value="adult">成人</option>
                <option value="elderly_65_plus">65岁以上</option>
              </select>
            </div>

            <div className="form-group">
              <label>温度敏感度</label>
              <select name="sensitivity" className="input" defaultValue={user?.profile_json?.sensitivity || 'none'}>
                <option value="none">正常</option>
                <option value="cold">怕冷</option>
                <option value="hot">怕热</option>
              </select>
            </div>

            <div className="form-group">
              <label>健康状况</label>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="conditions"
                    value="rheumatism"
                    defaultChecked={user?.profile_json?.conditions?.includes('rheumatism')}
                  />
                  风湿/关节不适
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="conditions"
                    value="asthma"
                    defaultChecked={user?.profile_json?.conditions?.includes('asthma')}
                  />
                  哮喘
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary">
              保存设置
            </button>
          </form>
        </section>

        {/* 地点管理 */}
        <section className="settings-section card">
          <h2>地点管理</h2>

          <form onSubmit={handleAddLocation} className="settings-form">
            <div className="form-row">
              <div className="form-group">
                <label>地点名称</label>
                <input
                  type="text"
                  className="input"
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  placeholder="如：家、公司"
                  required
                />
              </div>
              <div className="form-group">
                <label>设为默认</label>
                <input
                  type="checkbox"
                  checked={locationForm.is_default}
                  onChange={(e) => setLocationForm({ ...locationForm, is_default: e.target.checked })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>纬度</label>
                <input
                  type="number"
                  step="0.000001"
                  className="input"
                  value={locationForm.latitude}
                  onChange={(e) => setLocationForm({ ...locationForm, latitude: e.target.value })}
                  placeholder="31.2304"
                  required
                />
              </div>
              <div className="form-group">
                <label>经度</label>
                <input
                  type="number"
                  step="0.000001"
                  className="input"
                  value={locationForm.longitude}
                  onChange={(e) => setLocationForm({ ...locationForm, longitude: e.target.value })}
                  placeholder="121.4737"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary">
              添加地点
            </button>
          </form>

          <div className="locations-list">
            <h3>已保存的地点</h3>
            {locations && locations.length > 0 ? (
              locations.map(location => (
                <div key={location.id} className="location-item">
                  <div>
                    <strong>{location.name}</strong>
                    {location.is_default && <span className="default-badge">默认</span>}
                    <div className="location-coords">
                      {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('确定要删除这个地点吗？')) {
                        deleteLocationMutation.mutate(location.id);
                      }
                    }}
                    className="btn btn-secondary"
                  >
                    删除
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray">暂无地点</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;

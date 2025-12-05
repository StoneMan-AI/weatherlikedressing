import React from 'react';
import './HealthAlerts.css';

const HealthAlerts = ({ messages }) => {
  if (!messages || messages.length === 0) return null;

  return (
    <div className="health-alerts card">
      <h3 className="health-alerts-title">⚠️ 健康提醒</h3>
      <div className="health-messages">
        {messages.map((msg, index) => (
          <div key={index} className="health-message">
            {msg.message}
          </div>
        ))}
      </div>
      <div className="health-disclaimer">
        <small>
          本应用提供生活建议，不作为医疗诊断。出现严重症状请就医。
        </small>
      </div>
    </div>
  );
};

export default HealthAlerts;

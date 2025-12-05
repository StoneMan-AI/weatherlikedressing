import React, { useState } from 'react';
import './RecommendationCard.css';

const RecommendationCard = ({ recommendation }) => {
  const [expanded, setExpanded] = useState(false);

  if (!recommendation) return null;

  const getScoreLabel = (score) => {
    if (score >= 12) return '温暖';
    if (score >= 3) return '舒适';
    if (score >= -7) return '偏凉';
    if (score >= -20) return '偏冷';
    return '极冷';
  };

  const getScoreColor = (score) => {
    if (score >= 12) return '#FF7A59';
    if (score >= 3) return '#4CAF50';
    if (score >= -7) return '#FFC107';
    if (score >= -20) return '#FF9800';
    return '#F44336';
  };

  const scoreLabel = getScoreLabel(recommendation.comfort_score);
  const scoreColor = getScoreColor(recommendation.comfort_score);

  return (
    <div className="recommendation-card card">
      <div className="recommendation-header">
        <div className="score-display">
          <span className="score-label">体感</span>
          <span className="score-value" style={{ color: scoreColor }}>
            {scoreLabel}
          </span>
          <span className="score-number">({recommendation.comfort_score})</span>
        </div>
        <div className="header-right">
          {recommendation.urgency && (
            <span className={`urgency-badge urgency-${recommendation.urgency}`}>
              {recommendation.urgency === '极高' ? '⚠️ 极高' :
               recommendation.urgency === '高' ? '🔴 高' :
               recommendation.urgency === '中' ? '🟡 中' : '🟢 低'}
            </span>
          )}
          <button
            className="btn-expand"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '收起' : '详细'}
          </button>
        </div>
      </div>

      <div className="recommendation-main">
        <h3>穿衣建议</h3>
        <div className="layers-list">
          {recommendation.recommendation_layers.map((layer, index) => (
            <div key={index} className="layer-item">
              <span className="layer-number">{index + 1}</span>
              <span className="layer-text">{layer}</span>
            </div>
          ))}
        </div>

        {recommendation.accessories && recommendation.accessories.length > 0 && (
          <div className="accessories">
            <strong>配饰建议：</strong>
            {recommendation.accessories.join('、')}
          </div>
        )}
      </div>

      {expanded && (
        <div className="recommendation-details">
          {recommendation.notes && (
            <div className="notes">
              <strong>温馨提示：</strong>
              {recommendation.notes}
            </div>
          )}
          <div className="reason-summary">
            <strong>计算依据：</strong>
            {recommendation.reason_summary}
          </div>
          {recommendation.confidence !== undefined && (
            <div className="confidence-info">
              <strong>推荐置信度：</strong>
              <span className="confidence-value">
                {(recommendation.confidence * 100).toFixed(0)}%
              </span>
            </div>
          )}
          {recommendation.score_details && (
            <div className="score-breakdown">
              <strong>分数明细：</strong>
              <div className="breakdown-grid">
                <span>温度：{recommendation.score_details.T_score}</span>
                <span>湿度：{recommendation.score_details.RH_score}</span>
                <span>风力：{recommendation.score_details.Wind_score}</span>
                {recommendation.score_details.Gust_score !== undefined && recommendation.score_details.Gust_score !== 0 && (
                  <span>阵风：{recommendation.score_details.Gust_score}</span>
                )}
                <span>阳光：{recommendation.score_details.Sun_score}</span>
                <span>活动：{recommendation.score_details.Activity_adj}</span>
                <span>个人：{recommendation.score_details.User_adj}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecommendationCard;

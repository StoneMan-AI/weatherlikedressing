import React, { useState } from 'react';
import './RecommendationCard.css';

const RecommendationCard = ({ recommendation, onViewTomorrow, isViewingTomorrow = false }) => {
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
        </div>
        <div className="header-right">
          {recommendation.urgency && (
            <span className={`urgency-badge urgency-${recommendation.urgency}`}>
              {recommendation.urgency === '需警惕' ? '⚠️ 需警惕' :
               recommendation.urgency === '需注意' ? '🔴 需注意' :
               recommendation.urgency === '需留意' ? '🟡 需留意' : '🟢 舒适'}
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
        <div className="recommendation-title-row">
          <h3>
            穿衣建议
            {recommendation.score_details && (
              <span className="total-score-inline">（体感分:{recommendation.comfort_score}分）</span>
            )}
          </h3>
          {onViewTomorrow && (
            <button
              className="btn-view-tomorrow"
              onClick={onViewTomorrow}
              title={isViewingTomorrow ? '查看今天' : '查看明天'}
            >
              {isViewingTomorrow ? '看今天' : '看明天'}
            </button>
          )}
        </div>
        <div className="layers-list">
          {/* 优先使用详细推荐，如果没有则使用简单格式 */}
          {recommendation.detailed_recommendations && recommendation.detailed_recommendations.length > 0 ? (
            recommendation.detailed_recommendations.map((item, index) => (
              <div key={index} className="layer-item">
                <span className="layer-number">{index + 1}</span>
                <span className="layer-text">{item.name}</span>
              </div>
            ))
          ) : (
            recommendation.recommendation_layers.map((layer, index) => (
              <div key={index} className="layer-item">
                <span className="layer-number">{index + 1}</span>
                <span className="layer-text">{layer}</span>
              </div>
            ))
          )}
        </div>

        {/* 配饰建议 */}
        {recommendation.detailed_accessories && recommendation.detailed_accessories.length > 0 ? (
          <div className="accessories">
            <strong>配饰建议：</strong>
            {recommendation.detailed_accessories.map((item, index) => (
              <span key={index}>
                {item.name}
                {index < recommendation.detailed_accessories.length - 1 ? '、' : ''}
              </span>
            ))}
          </div>
        ) : (
          recommendation.accessories && recommendation.accessories.length > 0 && (
            <div className="accessories">
              <strong>配饰建议：</strong>
              {recommendation.accessories.join('、')}
            </div>
          )
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
          <div className="comfort-explanation">
            <strong>体感温度说明：</strong>
            <p className="explanation-text">
              体感温度是通过综合温度、湿度、风力、阳光等因素计算得出的舒适度分数。
              括号中的数值是综合分数，分数越高越舒适：
            </p>
            <ul className="explanation-list">
              <li>≥12分：温暖（偏热）</li>
              <li>3-12分：舒适</li>
              <li>-7到3分：偏凉</li>
              <li>-20到-7分：偏冷</li>
              <li>&lt;-20分：极冷</li>
            </ul>
          </div>
          {recommendation.score_details && (
            <div className="score-breakdown">
              <div className="breakdown-header">
                <strong>分数明细：</strong>
              </div>
              <p className="breakdown-note">（负数表示降低舒适度，正数表示提高舒适度）</p>
              <div className="breakdown-grid">
                <span>
                  温度：{recommendation.score_details.actual_values?.temperature_c?.toFixed(1) || 'N/A'}°C 
                  <span className="score-impact">（体感值：{recommendation.score_details.T_score > 0 ? '+' : ''}{recommendation.score_details.T_score}分）</span>
                </span>
                <span>
                  湿度：{recommendation.score_details.actual_values?.relative_humidity?.toFixed(0) || 'N/A'}% 
                  <span className="score-impact">（体感值：{recommendation.score_details.RH_score > 0 ? '+' : ''}{recommendation.score_details.RH_score}分）</span>
                </span>
                <span>
                  风速：{recommendation.score_details.actual_values?.wind_m_s?.toFixed(1) || 'N/A'} m/s 
                  <span className="score-impact">（体感值：{recommendation.score_details.Wind_score > 0 ? '+' : ''}{recommendation.score_details.Wind_score}分）</span>
                </span>
                {recommendation.score_details.actual_values?.gust_m_s && recommendation.score_details.actual_values.gust_m_s > 0 && (
                  <span>
                    阵风：{recommendation.score_details.actual_values.gust_m_s.toFixed(1)} m/s 
                    <span className="score-impact">（体感值：{recommendation.score_details.Gust_score > 0 ? '+' : ''}{recommendation.score_details.Gust_score}分）</span>
                  </span>
                )}
                <span>
                  紫外线：{recommendation.score_details.actual_values?.uv_index || 'N/A'} 
                  <span className="score-impact">（体感值：{recommendation.score_details.Sun_score > 0 ? '+' : ''}{recommendation.score_details.Sun_score}分）</span>
                </span>
                <span>
                  活动量：{recommendation.score_details.Activity_adj > 0 ? '+' : ''}{recommendation.score_details.Activity_adj}分
                </span>
                <span>
                  个人调整：{recommendation.score_details.User_adj > 0 ? '+' : ''}{recommendation.score_details.User_adj}分
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecommendationCard;

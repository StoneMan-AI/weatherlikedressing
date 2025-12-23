/**
 * 增强版规则引擎 - 包含所有详细规则
 * 根据补充规则文档完善的功能
 */

class RuleEngineEnhanced {
  constructor(rulesConfig) {
    this.config = rulesConfig;
    this.weights = rulesConfig.weights;
    this.userAdjustments = rulesConfig.user_profile_adjustments;
    this.layers = rulesConfig.mappings.layers;
    this.healthRules = rulesConfig.health_rules;
  }

  /**
   * 计算舒适度分数（增强版）
   */
  calculateComfortScore(inputs) {
    const {
      temperature_c,
      relative_humidity,
      wind_m_s,
      gust_m_s = 0,
      uv_index,
      precip_prob = 0,
      is_outdoor,
      activity_level,
      user_profile
    } = inputs;

    // T_score: 温度分数
    const T_score = (temperature_c - this.weights.base_temp_reference) * this.weights.temp_multiplier;

    // RH_score: 湿度分数（细化规则）
    let RH_score = this.calculateHumidityScore(temperature_c, relative_humidity);

    // Wind_score: 风力分数
    let Wind_score = 0;
    if (wind_m_s > this.weights.wind_threshold_mps) {
      Wind_score = -(wind_m_s - this.weights.wind_threshold_mps) * this.weights.wind_multiplier;
    }

    // Gust_score: 阵风额外扣分（新增）
    let Gust_score = 0;
    if (gust_m_s > 0 && gust_m_s > wind_m_s) {
      const gustExcess = gust_m_s - wind_m_s;
      Gust_score = -gustExcess * 1.5; // 阵风每超过1m/s扣1.5分
    }

    // Sun_score: 阳光分数（按UV分级）
    let Sun_score = this.calculateSunScore(uv_index, is_outdoor);

    // Activity_adj: 活动量调整
    let Activity_adj = 0;
    if (activity_level === 'moderate') {
      Activity_adj = 2;
    } else if (activity_level === 'high') {
      Activity_adj = 5;
    }

    // User_adj: 用户画像调整（增强版）
    const User_adj = this.calculateUserAdjustmentEnhanced(user_profile, inputs);

    // 总舒适度分数
    const ComfortScore = T_score + RH_score + Wind_score + Gust_score + Sun_score + Activity_adj + User_adj;

    return {
      ComfortScore: Math.round(ComfortScore * 10) / 10,
      T_score: Math.round(T_score * 10) / 10,
      RH_score: Math.round(RH_score * 10) / 10,
      Wind_score: Math.round(Wind_score * 10) / 10,
      Gust_score: Math.round(Gust_score * 10) / 10,
      Sun_score: Math.round(Sun_score * 10) / 10,
      Activity_adj,
      User_adj
    };
  }

  /**
   * 计算湿度分数（细化规则）
   */
  calculateHumidityScore(temperature_c, relative_humidity) {
    // 湿冷：RH ≥ 70% 且 T ≤ 12°C，额外扣分
    if (relative_humidity >= 70 && temperature_c <= 12) {
      const baseScore = -((relative_humidity - 50) / 10) * this.weights.humidity_multiplier_cold;
      const dampPenalty = -2; // 湿冷额外扣分
      return baseScore + dampPenalty;
    }

    // 高湿热：RH ≥ 70% 且 T ≥ 25°C
    if (relative_humidity >= 70 && temperature_c >= 25) {
      return ((relative_humidity - 50) / 10) * this.weights.humidity_multiplier_hot * 1.2; // 增强闷热感
    }

    // 常规计算
    if (temperature_c <= 15.0) {
      return -((relative_humidity - 50) / 10) * this.weights.humidity_multiplier_cold;
    } else {
      return ((relative_humidity - 50) / 10) * this.weights.humidity_multiplier_hot;
    }
  }

  /**
   * 计算阳光分数（按UV分级）
   */
  calculateSunScore(uv_index, is_outdoor) {
    if (!is_outdoor) return 0;

    if (uv_index >= 8) {
      return 5; // 极高UV，直射热量大
    } else if (uv_index >= 6) {
      return 4; // 高UV
    } else if (uv_index >= 3) {
      return 3; // 中等UV
    }
    return 0;
  }

  /**
   * 增强的用户画像调整
   */
  calculateUserAdjustmentEnhanced(userProfile, inputs) {
    if (!userProfile) return 0;

    let adjustment = 0;

    // 年龄组调整
    if (userProfile.age_group && this.userAdjustments.age_groups[userProfile.age_group]) {
      adjustment += this.userAdjustments.age_groups[userProfile.age_group];
    }

    // 敏感度调整（支持范围）
    if (userProfile.sensitivity) {
      if (userProfile.sensitivity === 'cold') {
        // 支持可调的怕冷程度
        const coldSensitivity = userProfile.cold_sensitivity || 8; // 默认-8，可调范围-6到-12
        adjustment += -Math.max(6, Math.min(12, coldSensitivity));
      } else if (userProfile.sensitivity === 'hot') {
        const heatSensitivity = userProfile.heat_sensitivity || 8;
        adjustment += Math.max(6, Math.min(12, heatSensitivity));
      }
    }

    // 健康条件调整（增强）
    if (userProfile.conditions && Array.isArray(userProfile.conditions)) {
      userProfile.conditions.forEach(condition => {
        if (this.userAdjustments.conditions[condition]) {
          adjustment += this.userAdjustments.conditions[condition];
        }
      });

      // 风湿患者在湿冷时额外调整
      if (userProfile.conditions.includes('rheumatism')) {
        const { temperature_c, relative_humidity } = inputs;
        if (relative_humidity >= 70 && temperature_c <= 12) {
          adjustment -= 2; // 湿冷时额外扣2分（相当于提高保暖层级）
        }
      }
    }

    // 是否怀孕（新增）
    if (userProfile.is_pregnant) {
      adjustment += 2; // 孕妇更怕热
    }

    return adjustment;
  }

  /**
   * 获取穿衣推荐（增强版，考虑个性化规则）
   */
  getDressingRecommendationEnhanced(comfortScore, inputs, userProfile) {
    let baseLayer = this.getDressingRecommendation(comfortScore);
    
    // 个性化调整：65+老人在ComfortScore < 0时提高一层保暖
    if (userProfile?.age_group === 'elderly_65_plus' && comfortScore < 0) {
      const currentIndex = this.layers.findIndex(l => l.min_score === baseLayer.min_score);
      if (currentIndex > 0) {
        baseLayer = this.layers[currentIndex - 1]; // 使用更保暖的层级
      }
    }

    // 个性化调整：风湿患者在湿冷时提高保暖层级
    if (userProfile?.conditions?.includes('rheumatism')) {
      const { temperature_c, relative_humidity } = inputs;
      if (relative_humidity >= 70 && temperature_c <= 12) {
        const currentIndex = this.layers.findIndex(l => l.min_score === baseLayer.min_score);
        if (currentIndex > 0) {
          baseLayer = this.layers[currentIndex - 1];
        }
      }
    }

    // 添加针对儿童/老人的强制配饰建议
    const enhancedAccessories = [...(baseLayer.accessories || [])];
    
    if (userProfile?.age_group?.startsWith('child_') && comfortScore < 3) {
      if (!enhancedAccessories.some(a => a.includes('帽'))) {
        enhancedAccessories.push('保暖帽（儿童必备）');
      }
      if (!enhancedAccessories.some(a => a.includes('围巾'))) {
        enhancedAccessories.push('围巾（儿童建议）');
      }
      if (!enhancedAccessories.some(a => a.includes('手套'))) {
        enhancedAccessories.push('手套（儿童建议）');
      }
    }

    if (userProfile?.age_group === 'elderly_65_plus' && comfortScore < 3) {
      if (!enhancedAccessories.some(a => a.includes('帽'))) {
        enhancedAccessories.push('保暖帽（老人必备）');
      }
      if (!enhancedAccessories.some(a => a.includes('围巾'))) {
        enhancedAccessories.push('围巾（老人建议）');
      }
    }

    return {
      ...baseLayer,
      accessories: enhancedAccessories
    };
  }

  /**
   * 根据舒适度分数获取穿衣推荐（基础版）
   */
  getDressingRecommendation(comfortScore) {
    for (const layer of this.layers) {
      if (comfortScore >= layer.min_score) {
        return layer;
      }
    }
    return this.layers[this.layers.length - 1];
  }

  /**
   * 生成详细推荐理由（新增）
   */
  generateDetailedReason(inputs, scoreDetails) {
    const { temperature_c, relative_humidity, wind_m_s, gust_m_s, uv_index, precip_prob } = inputs;
    const parts = [];

    // 温度描述
    if (temperature_c < 0) {
      parts.push(`极低温${temperature_c.toFixed(1)}°C`);
    } else if (temperature_c < 10) {
      parts.push(`低温${temperature_c.toFixed(1)}°C`);
    } else if (temperature_c < 20) {
      parts.push(`温度${temperature_c.toFixed(1)}°C`);
    } else {
      parts.push(`温度${temperature_c.toFixed(1)}°C`);
    }

    // 湿度描述
    if (relative_humidity >= 70 && temperature_c <= 12) {
      parts.push(`高湿${relative_humidity}%`);
    } else if (relative_humidity >= 70 && temperature_c >= 25) {
      parts.push(`湿热${relative_humidity}%`);
    } else if (relative_humidity >= 60) {
      parts.push(`湿度${relative_humidity}%`);
    }

    // 风力描述
    if (wind_m_s >= 10) {
      parts.push(`强风${wind_m_s.toFixed(1)}m/s`);
    } else if (wind_m_s >= 5) {
      parts.push(`大风${wind_m_s.toFixed(1)}m/s`);
    } else if (wind_m_s >= 1.5) {
      parts.push(`有风${wind_m_s.toFixed(1)}m/s`);
    }

    if (gust_m_s > wind_m_s && gust_m_s >= 8) {
      parts.push(`阵风${gust_m_s.toFixed(1)}m/s`);
    }

    // 组合成理由
    const reasonParts = parts.join(' + ');
    const scoreDesc = scoreDetails.ComfortScore >= 12 ? '温暖' :
                      scoreDetails.ComfortScore >= 3 ? '舒适' :
                      scoreDetails.ComfortScore >= -7 ? '偏凉' :
                      scoreDetails.ComfortScore >= -20 ? '偏冷' : '极冷';

    return `${reasonParts} → 体感${scoreDesc}（${scoreDetails.ComfortScore}分），建议加强保暖并减少户外停留`;
  }

  /**
   * 检查降雨规则（新增）
   */
  checkRainRules(inputs) {
    const { precip_prob, temperature_c, wind_m_s } = inputs;
    const messages = [];

    if (precip_prob > 50) {
      let message = '预计有降雨，建议带雨具';
      
      if (temperature_c < 10) {
        message += '、防滑鞋';
        if (wind_m_s >= 5) {
          message += '，推荐防水羽绒或带帽外套';
        }
      }
      
      messages.push({
        id: 'rain_alert',
        message: message
      });
    }

    return messages;
  }

  /**
   * 检查健康规则（增强版）
   */
  checkHealthRulesEnhanced(inputs) {
    const healthMessages = [];
    
    // 原有健康规则
    for (const rule of this.healthRules) {
      if (this.evaluateCondition(rule.condition, inputs)) {
        healthMessages.push({
          id: rule.id,
          message: rule.message
        });
      }
    }

    // 添加新的健康规则
    const { temperature_c, relative_humidity, uv_index, aqi, user_profile } = inputs;

    // 高温高湿
    if (temperature_c >= 30 && relative_humidity >= 70) {
      healthMessages.push({
        id: 'heat_humidity_risk',
        message: '高温高湿，中暑/脱水风险，建议轻薄透气衣物、补水、避免高强度活动'
      });
    }

    // UV极高 + 儿童/老人
    if (uv_index >= 6 && user_profile) {
      const isVulnerable = user_profile.age_group?.startsWith('child_') || 
                          user_profile.age_group === 'elderly_65_plus';
      if (isVulnerable) {
        healthMessages.push({
          id: 'uv_vulnerable_risk',
          message: '紫外线强，强烈防晒，出门涂SPF≥30防晒霜并带遮阳帽/伞'
        });
      }
    }

    // 强风 + 老人/儿童
    const wind_m_s = inputs.wind_m_s || 0;
    if (wind_m_s >= 10 && user_profile) {
      const isVulnerable = user_profile.age_group?.startsWith('child_') || 
                          user_profile.age_group === 'elderly_65_plus';
      if (isVulnerable) {
        healthMessages.push({
          id: 'strong_wind_risk',
          message: '强风天气，跌倒风险高，建议尽量待在室内'
        });
      }
    }

    // AQI差 + 哮喘
    if (aqi >= 151 && user_profile?.conditions?.includes('asthma')) {
      healthMessages.push({
        id: 'aqi_asthma_risk',
        message: '空气质量差，减少户外活动并备好哮喘用药'
      });
    }

    // 降雨规则
    const rainMessages = this.checkRainRules(inputs);
    healthMessages.push(...rainMessages);

    return healthMessages;
  }

  /**
   * 计算紧急程度（新增）
   */
  calculateUrgency(inputs, scoreDetails) {
    const { temperature_c, wind_m_s, gust_m_s, aqi, precip_prob } = inputs;
    const score = scoreDetails.ComfortScore;

    // 极端情况：极高优先级
    if (score < -20 || temperature_c < -10 || (wind_m_s >= 10 && temperature_c < 0)) {
      return '极高';
    }

    // 高风险情况：高优先级
    if (score < -10 || 
        (temperature_c < 5 && wind_m_s >= 5) ||
        aqi >= 200 ||
        (gust_m_s >= 15)) {
      return '高';
    }

    // 中等风险：中优先级
    if (score < 0 || 
        precip_prob > 70 ||
        aqi >= 151) {
      return '中';
    }

    return '低';
  }

  /**
   * 计算置信度（新增）
   */
  calculateConfidence(inputs) {
    // 基于数据完整性和合理性计算置信度
    let confidence = 0.9; // 基础置信度

    // 如果有缺失数据，降低置信度
    if (!inputs.temperature_c) confidence -= 0.3;
    if (!inputs.relative_humidity) confidence -= 0.1;
    if (!inputs.wind_m_s) confidence -= 0.1;
    if (!inputs.uv_index) confidence -= 0.05;

    // 极端值可能需要降低置信度
    if (inputs.temperature_c < -30 || inputs.temperature_c > 50) {
      confidence -= 0.2;
    }

    return Math.max(0.5, Math.min(1.0, confidence));
  }

  /**
   * 评估条件表达式
   */
  evaluateCondition(condition, inputs) {
    try {
      let expr = condition;
      Object.keys(inputs).forEach(key => {
        const value = inputs[key];
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        if (typeof value === 'boolean') {
          expr = expr.replace(regex, value.toString());
        } else if (typeof value === 'number') {
          expr = expr.replace(regex, value.toString());
        } else if (typeof value === 'string') {
          expr = expr.replace(regex, `"${value}"`);
        }
      });
      expr = expr.replace(/&&/g, '&&').replace(/\|\|/g, '||');
      return Function(`"use strict"; return (${expr})`)();
    } catch (error) {
      console.error('Error evaluating condition:', condition, error);
      return false;
    }
  }

  /**
   * 生成完整的推荐结果（增强版）
   */
  generateRecommendationEnhanced(inputs) {
    // 计算舒适度分数
    const scoreDetails = this.calculateComfortScore(inputs);

    // 获取穿衣推荐（增强版，考虑个性化）
    const userProfile = inputs.user_profile || {};
    const dressingLayer = this.getDressingRecommendationEnhanced(
      scoreDetails.ComfortScore,
      inputs,
      userProfile
    );

    // 检查健康规则（增强版）
    const healthMessages = this.checkHealthRulesEnhanced(inputs);

    // 生成详细理由
    const detailedReason = this.generateDetailedReason(inputs, scoreDetails);

    // 计算紧急程度和置信度
    const urgency = this.calculateUrgency(inputs, scoreDetails);
    const confidence = this.calculateConfidence(inputs);

    return {
      comfort_score: scoreDetails.ComfortScore,
      recommendation_layers: dressingLayer.layers,
      accessories: dressingLayer.accessories,
      label: dressingLayer.label,
      notes: dressingLayer.notes,
      reason_summary: detailedReason,
      health_messages: healthMessages,
      score_details: scoreDetails,
      urgency: urgency,
      confidence: confidence
    };
  }
}

module.exports = RuleEngineEnhanced;

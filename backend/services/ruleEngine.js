/**
 * 规则引擎核心模块（增强版）
 * 基于JSON配置计算舒适度分数和穿衣推荐
 * 包含所有详细规则：阵风、降雨、湿度细化、个性化规则等
 */

class RuleEngine {
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
      User_adj,
      // 添加实际天气值，用于前端显示
      actual_values: {
        temperature_c: temperature_c != null ? temperature_c : 0,
        relative_humidity: relative_humidity != null ? relative_humidity : 0,
        wind_m_s: wind_m_s != null ? wind_m_s : 0,
        gust_m_s: gust_m_s != null ? gust_m_s : 0,
        uv_index: uv_index != null ? uv_index : 0
      }
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

      // 心血管疾病在温度变化大时额外调整（需要更稳定的温度环境）
      if (userProfile.conditions.includes('cardiovascular')) {
        const { temperature_c } = inputs;
        // 极端温度时额外扣分
        if (temperature_c < 5 || temperature_c > 30) {
          adjustment -= 1; // 极端温度时额外扣1分
        }
      }

      // 皮肤病在湿度异常时额外调整
      if (userProfile.conditions.includes('skin_disease')) {
        const { relative_humidity } = inputs;
        // 高湿度或低湿度时额外扣分
        if (relative_humidity >= 80 || relative_humidity <= 30) {
          adjustment -= 1; // 湿度异常时额外扣1分
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
   * 计算用户画像调整值（向后兼容）
   */
  calculateUserAdjustment(userProfile) {
    return this.calculateUserAdjustmentEnhanced(userProfile, {});
  }

  /**
   * 根据舒适度分数获取穿衣推荐
   */
  getDressingRecommendation(comfortScore) {
    // 从高到低找到第一个匹配的层级
    for (const layer of this.layers) {
      if (comfortScore >= layer.min_score) {
        return layer;
      }
    }
    // 如果都不匹配，返回最冷的那一层
    return this.layers[this.layers.length - 1];
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

    // 个性化调整：心血管疾病在极端温度时提高保暖层级（采用最保守策略）
    if (userProfile?.conditions?.includes('cardiovascular')) {
      const { temperature_c } = inputs;
      if (temperature_c < 5) {
        const currentIndex = this.layers.findIndex(l => l.min_score === baseLayer.min_score);
        if (currentIndex > 0) {
          baseLayer = this.layers[currentIndex - 1]; // 更保暖
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
  checkHealthRules(inputs) {
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

    // 心血管疾病相关提醒
    if (user_profile?.conditions?.includes('cardiovascular')) {
      // 温度变化大时提醒（基于当前温度范围判断）
      if (temperature_c < 5) {
        healthMessages.push({
          id: 'cardiovascular_cold_risk',
          message: '低温天气，心血管疾病患者需注意保暖，避免温度骤变，建议分层穿衣便于调节'
        });
      } else if (temperature_c > 30) {
        healthMessages.push({
          id: 'cardiovascular_heat_risk',
          message: '高温天气，心血管疾病患者需注意防暑降温，避免剧烈活动，及时补充水分'
        });
      }
    }

    // COPD相关提醒
    if (user_profile?.conditions?.includes('copd')) {
      // 空气质量差
      if (aqi >= 100) {
        healthMessages.push({
          id: 'copd_aqi_risk',
          message: '空气质量不佳，COPD患者建议减少户外活动，外出时佩戴口罩'
        });
      }
      // 极端温度
      if (temperature_c < 5) {
        healthMessages.push({
          id: 'copd_cold_risk',
          message: '低温天气，COPD患者需特别注意保暖，避免冷空气刺激呼吸道'
        });
      } else if (temperature_c > 30) {
        healthMessages.push({
          id: 'copd_heat_risk',
          message: '高温天气，COPD患者需注意防暑，避免在高温时段外出'
        });
      }
    }

    // 偏头痛相关提醒（基于气压变化，目前没有气压数据，给出一般性建议）
    if (user_profile?.conditions?.includes('migraine')) {
      // 天气变化大时可能诱发偏头痛
      const wind_m_s = inputs.wind_m_s || 0;
      if (precip_prob > 60 || (temperature_c < 10 && wind_m_s > 8)) {
        healthMessages.push({
          id: 'migraine_weather_risk',
          message: '天气变化较大，可能诱发偏头痛，建议携带常用药物，注意休息'
        });
      }
    }

    // 皮肤病相关提醒
    if (user_profile?.conditions?.includes('skin_disease')) {
      // 高湿度
      if (relative_humidity >= 80) {
        healthMessages.push({
          id: 'skin_disease_high_humidity_risk',
          message: '湿度较高，皮肤病可能加重，建议穿着透气、吸湿的衣物，保持皮肤干爽'
        });
      }
      // 低湿度
      if (relative_humidity <= 30) {
        healthMessages.push({
          id: 'skin_disease_low_humidity_risk',
          message: '湿度较低，皮肤可能干燥，建议使用保湿产品，穿着柔软舒适的衣物'
        });
      }
      // 极端温度
      if (temperature_c < 5 || temperature_c > 30) {
        healthMessages.push({
          id: 'skin_disease_temp_risk',
          message: '极端温度可能刺激皮肤，建议穿着合适的衣物保护皮肤'
        });
      }
    }

    // 过敏性疾病相关提醒
    if (user_profile?.conditions?.includes('allergy')) {
      // 空气质量差
      if (aqi >= 100) {
        healthMessages.push({
          id: 'allergy_aqi_risk',
          message: '空气质量不佳，过敏患者建议减少户外活动，外出时佩戴口罩，携带抗过敏药物'
        });
      }
      // 高湿度可能增加过敏原
      if (relative_humidity >= 70 && temperature_c >= 15 && temperature_c <= 25) {
        healthMessages.push({
          id: 'allergy_humidity_risk',
          message: '温湿度适宜，可能增加花粉、霉菌等过敏原，过敏患者需注意防护'
        });
      }
    }

    // 降雨规则
    const rainMessages = this.checkRainRules(inputs);
    healthMessages.push(...rainMessages);

    return healthMessages;
  }

  /**
   * 评估条件表达式
   */
  evaluateCondition(condition, inputs) {
    // 简单的条件评估器，支持基本的逻辑表达式
    // 例如: "temperature_c <= 5 && wind_m_s >= 5"
    
    try {
      // 替换变量为实际值
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

      // 替换逻辑运算符
      expr = expr.replace(/&&/g, '&&').replace(/\|\|/g, '||');
      
      // 评估表达式
      return Function(`"use strict"; return (${expr})`)();
    } catch (error) {
      console.error('Error evaluating condition:', condition, error);
      return false;
    }
  }

  /**
   * 生成详细推荐理由（新增）
   */
  generateDetailedReason(inputs, scoreDetails) {
    const { temperature_c, relative_humidity, wind_m_s, gust_m_s, uv_index } = inputs;
    const parts = [];

    // 温度描述
    if (temperature_c < 0) {
      parts.push(`极低温${temperature_c.toFixed(1)}°C`);
    } else if (temperature_c < 10) {
      parts.push(`低温${temperature_c.toFixed(1)}°C`);
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

    if (gust_m_s && gust_m_s > wind_m_s && gust_m_s >= 8) {
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
   * 计算紧急程度（新增）
   */
  calculateUrgency(inputs, scoreDetails) {
    const { temperature_c, wind_m_s, gust_m_s, aqi, precip_prob } = inputs;
    const score = scoreDetails.ComfortScore;

    // 极端情况：需警惕
    if (score < -20 || temperature_c < -10 || (wind_m_s >= 10 && temperature_c < 0)) {
      return '需警惕';
    }

    // 高风险情况：需注意
    if (score < -10 || 
        (temperature_c < 5 && wind_m_s >= 5) ||
        aqi >= 200 ||
        (gust_m_s >= 15)) {
      return '需注意';
    }

    // 中等风险：需留意
    if (score < 0 || 
        precip_prob > 70 ||
        aqi >= 151) {
      return '需留意';
    }

    return '舒适';
  }

  /**
   * 计算置信度（新增）
   */
  calculateConfidence(inputs) {
    // 基于数据完整性和合理性计算置信度
    let confidence = 0.9; // 基础置信度

    // 如果有缺失数据，降低置信度
    if (inputs.temperature_c === undefined || inputs.temperature_c === null) confidence -= 0.3;
    if (inputs.relative_humidity === undefined || inputs.relative_humidity === null) confidence -= 0.1;
    if (inputs.wind_m_s === undefined || inputs.wind_m_s === null) confidence -= 0.1;
    if (inputs.uv_index === undefined || inputs.uv_index === null) confidence -= 0.05;

    // 极端值可能需要降低置信度
    if (inputs.temperature_c && (inputs.temperature_c < -30 || inputs.temperature_c > 50)) {
      confidence -= 0.2;
    }

    return Math.max(0.5, Math.min(1.0, confidence));
  }

  /**
   * 获取穿衣层级的详细原因说明
   */
  getLayerReason(layer, inputs, scoreDetails) {
    const { temperature_c, relative_humidity, wind_m_s, uv_index, precip_prob } = inputs;
    const score = scoreDetails.ComfortScore;

    // 根据层级类型和天气条件生成原因
    if (layer.includes('短袖') || layer.includes('薄长袖')) {
      return `适合较暖天气（当前温度${temperature_c.toFixed(1)}°C，体感${score.toFixed(1)}分），建议在温度较高的时段穿着`;
    }
    if (layer.includes('长袖') && !layer.includes('厚')) {
      return `适合温和天气（当前温度${temperature_c.toFixed(1)}°C），提供基础保暖`;
    }
    if (layer.includes('薄外套') || layer.includes('轻外套')) {
      return `适合微凉天气（当前温度${temperature_c.toFixed(1)}°C），可应对早晚温差`;
    }
    if (layer.includes('厚外套') || layer.includes('夹克')) {
      return `适合较冷天气（当前温度${temperature_c.toFixed(1)}°C，体感${score.toFixed(1)}分），提供良好保暖`;
    }
    if (layer.includes('羽绒') || layer.includes('厚')) {
      return `适合寒冷天气（当前温度${temperature_c.toFixed(1)}°C，体感${score.toFixed(1)}分），确保充分保暖`;
    }
    if (layer.includes('保暖内衣') || layer.includes('打底')) {
      return `基础保暖层（当前温度${temperature_c.toFixed(1)}°C），贴身保暖，建议选择透气材质`;
    }
    if (layer.includes('毛衣') || layer.includes('针织')) {
      return `中间保暖层（当前温度${temperature_c.toFixed(1)}°C），提供额外保暖`;
    }

    // 默认原因
    return `根据当前天气条件（温度${temperature_c.toFixed(1)}°C，体感${score.toFixed(1)}分）推荐`;
  }

  /**
   * 获取穿衣层级的详细说明
   */
  getLayerDetails(layer, inputs) {
    const { temperature_c, relative_humidity, wind_m_s } = inputs;

    if (layer.includes('短袖') || layer.includes('薄长袖')) {
      return '建议选择透气性好的材质，如棉质或速干面料，适合户外活动';
    }
    if (layer.includes('羽绒') || layer.includes('厚')) {
      return '建议选择填充量充足的羽绒服，确保保暖效果，注意防风性能';
    }
    if (layer.includes('薄外套') || layer.includes('轻外套')) {
      return '建议选择轻薄但有一定保暖性的外套，方便携带和增减';
    }
    if (layer.includes('保暖内衣') || layer.includes('打底')) {
      return '建议选择贴身、透气、吸湿排汗的材质，避免闷热';
    }
    if (wind_m_s > 5) {
      return '建议选择防风性能好的材质，避免强风影响体感温度';
    }
    if (relative_humidity > 70) {
      return '建议选择透气、吸湿排汗的材质，保持干爽舒适';
    }

    return '建议根据个人体感适当调整，注意保暖和舒适度的平衡';
  }

  /**
   * 获取配饰的详细原因说明
   */
  getAccessoryReason(accessory, inputs, scoreDetails) {
    const { temperature_c, wind_m_s, uv_index, precip_prob } = inputs;

    if (accessory.includes('帽')) {
      if (temperature_c < 5) {
        return `天气较冷（${temperature_c.toFixed(1)}°C），头部保暖很重要，建议佩戴保暖帽`;
      }
      if (uv_index >= 6) {
        return `紫外线较强（UV指数${uv_index}），建议佩戴遮阳帽防晒`;
      }
      return '建议佩戴帽子，既可保暖又可防晒';
    }
    if (accessory.includes('围巾')) {
      return `天气较冷（${temperature_c.toFixed(1)}°C），颈部保暖可有效提升体感温度`;
    }
    if (accessory.includes('手套')) {
      return `天气较冷（${temperature_c.toFixed(1)}°C），手部保暖很重要，建议佩戴手套`;
    }
    if (accessory.includes('雨') || accessory.includes('伞')) {
      return `预计有降雨（降雨概率${precip_prob}%），建议携带雨具`;
    }
    if (accessory.includes('防晒')) {
      return `紫外线较强（UV指数${uv_index}），建议做好防晒措施`;
    }
    if (accessory.includes('口罩')) {
      return '建议佩戴口罩，既可保暖又可防护';
    }

    return '根据当前天气条件推荐';
  }

  /**
   * 获取配饰的详细说明
   */
  getAccessoryDetails(accessory, inputs) {
    const { temperature_c, uv_index } = inputs;

    if (accessory.includes('帽')) {
      if (temperature_c < 5) {
        return '建议选择保暖性能好的帽子，如毛线帽或抓绒帽';
      }
      if (uv_index >= 6) {
        return '建议选择宽檐帽或带有UPF防晒功能的帽子';
      }
      return '建议根据天气情况选择合适的帽子';
    }
    if (accessory.includes('围巾')) {
      return '建议选择柔软、保暖的材质，如羊毛或羊绒围巾';
    }
    if (accessory.includes('手套')) {
      return '建议选择保暖且灵活的手套，方便活动';
    }
    if (accessory.includes('雨') || accessory.includes('伞')) {
      return '建议携带轻便的雨具，避免被雨水打湿';
    }
    if (accessory.includes('防晒')) {
      return '建议使用SPF30+的防晒霜，并定期补涂';
    }

    return '建议根据个人需求选择合适的配饰';
  }

  /**
   * 根据天气条件生成额外的穿衣建议（类似旅行推荐）
   */
  generateAdditionalRecommendations(inputs, weatherData, scoreDetails) {
    const recommendations = [];
    const { temperature_c, wind_m_s, precip_prob, relative_humidity } = inputs;

    // 如果有daily数据，分析温差
    if (weatherData && weatherData.daily && weatherData.daily.length > 0) {
      const todayData = weatherData.daily[0];
      if (todayData.temperature_max && todayData.temperature_min) {
        const tempRange = todayData.temperature_max - todayData.temperature_min;
        
        // 如果温差大（超过8度），建议多层穿搭
        if (tempRange > 8) {
          recommendations.push({
            name: '多层穿搭（便于增减）',
            reason: `今日温差较大（${tempRange.toFixed(1)}°C），建议采用多层穿搭，早晚添加外套，中午可适当减少`,
            details: '建议携带轻薄外套，方便根据温度变化随时增减衣物'
          });
        }
      }
    }

    // 如果有降雨，建议防水装备
    if (precip_prob > 50) {
      recommendations.push({
        name: '防水外套/雨衣',
        reason: `预计有降雨（降雨概率${precip_prob}%），建议携带防水装备`,
        details: '建议携带轻便的防水外套或雨衣，避免被雨水打湿'
      });
    }

    // 如果风力大，建议防风装备
    if (wind_m_s > 8) {
      recommendations.push({
        name: '防风外套',
        reason: `风力较大（风速${wind_m_s.toFixed(1)} m/s），建议携带防风衣物`,
        details: '建议选择防风性能好的外套，避免强风影响体感温度'
      });
    }

    return recommendations;
  }

  /**
   * 根据天气条件生成额外的配饰建议
   */
  generateAdditionalAccessories(inputs, weatherData) {
    const accessories = [];
    const { temperature_c, uv_index, wind_m_s, precip_prob } = inputs;

    // 如果紫外线强，建议防晒
    if (uv_index >= 6 && inputs.is_outdoor) {
      accessories.push({
        name: '防晒霜 SPF30+',
        reason: `紫外线较强（UV指数${uv_index}），需要防晒`,
        details: '建议使用SPF30+的防晒霜，并定期补涂'
      });
      accessories.push({
        name: '遮阳帽',
        reason: `紫外线较强（UV指数${uv_index}），防止阳光直射`,
        details: '建议选择宽檐帽或带有UPF防晒功能的帽子'
      });
    }

    // 如果天气很冷，建议额外保暖配饰
    if (temperature_c < 5) {
      // 检查是否已经有保暖帽
      const hasHat = (inputs.user_profile?.conditions || []).some(c => c.includes('帽'));
      if (!hasHat) {
        accessories.push({
          name: '保暖帽',
          reason: `天气较冷（${temperature_c.toFixed(1)}°C），头部保暖很重要`,
          details: '建议选择保暖性能好的帽子，如毛线帽或抓绒帽'
        });
      }
    }

    return accessories;
  }

  /**
   * 生成完整的推荐结果（增强版）
   * @param {Object} inputs - 输入参数
   * @param {Object} weatherData - 天气数据（可选，用于分析温差等）
   */
  generateRecommendation(inputs, weatherData = null) {
    try {
      // 计算舒适度分数
      const scoreDetails = this.calculateComfortScore(inputs);

      // 验证scoreDetails
      if (!scoreDetails || typeof scoreDetails.ComfortScore !== 'number') {
        throw new Error('Invalid scoreDetails from calculateComfortScore');
      }

      // 获取穿衣推荐（增强版，考虑个性化）
      const userProfile = inputs.user_profile || {};
      const dressingLayer = this.getDressingRecommendationEnhanced(
        scoreDetails.ComfortScore,
        inputs,
        userProfile
      );

      // 检查健康规则（增强版）
      const healthMessages = this.checkHealthRules(inputs);

      // 生成详细理由
      const detailedReason = this.generateDetailedReason(inputs, scoreDetails);

      // 计算紧急程度和置信度
      const urgency = this.calculateUrgency(inputs, scoreDetails);
      const confidence = this.calculateConfidence(inputs);

      // 生成基础穿衣建议
      const baseRecommendations = (dressingLayer.layers || []).map(layer => {
        return {
          name: layer,
          reason: this.getLayerReason(layer, inputs, scoreDetails),
          details: this.getLayerDetails(layer, inputs)
        };
      });

      // 根据天气条件添加额外建议（类似旅行推荐）
      const additionalRecommendations = this.generateAdditionalRecommendations(inputs, weatherData, scoreDetails);
      
      // 合并所有建议
      const detailedRecommendations = [...baseRecommendations, ...additionalRecommendations];

      // 生成详细的配饰建议（包含原因说明）
      // 注意：日常生活推荐可以包含"尽量不出门"等建议，这与旅行推荐不同
      const baseAccessories = (dressingLayer.accessories || []).map(accessory => {
        return {
          name: accessory,
          reason: this.getAccessoryReason(accessory, inputs, scoreDetails),
          details: this.getAccessoryDetails(accessory, inputs)
        };
      });

      // 根据天气条件添加额外配饰建议
      const additionalAccessories = this.generateAdditionalAccessories(inputs, weatherData);
      const detailedAccessories = [...baseAccessories, ...additionalAccessories];

      return {
        comfort_score: scoreDetails.ComfortScore,
        recommendation_layers: dressingLayer.layers || [], // 保留原有格式，向后兼容
        detailed_recommendations: detailedRecommendations, // 新增详细格式
        accessories: dressingLayer.accessories || [], // 保留原有格式，向后兼容
        detailed_accessories: detailedAccessories, // 新增详细格式
        label: dressingLayer.label || '',
        notes: dressingLayer.notes || '',
        reason_summary: detailedReason || '',
        health_messages: healthMessages || [],
        score_details: scoreDetails,
        urgency: urgency || '舒适',
        confidence: confidence || 0.8
      };
    } catch (error) {
      console.error('Error in generateRecommendation:', error);
      console.error('Inputs:', JSON.stringify(inputs));
      throw error;
    }
  }
}

module.exports = RuleEngine;

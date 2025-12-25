/**
 * 前端推荐计算器
 * 用于在切换活动强度/场景时进行本地计算，避免重复请求后端
 */

// 规则配置（从 dressing_rules_v1.json 提取）
const RULES_CONFIG = {
  weights: {
    base_temp_reference: 15.0,
    temp_multiplier: 2.0,
    wind_threshold_mps: 1.5,
    wind_multiplier: 3.0,
    humidity_multiplier_cold: 1.2,
    humidity_multiplier_hot: 0.8
  },
  user_profile_adjustments: {
    age_groups: {
      child_0_2: -6,
      child_3_6: -4,
      child_7_12: -2,
      adult: 0,
      elderly_65_plus: -3
    },
    sensitivity: {
      none: 0,
      cold: -8,
      hot: 8
    },
    conditions: {
      rheumatism: -3,
      asthma: 0
    }
  }
};

/**
 * 计算湿度分数
 */
function calculateHumidityScore(temperature_c, relative_humidity) {
  const { humidity_multiplier_cold, humidity_multiplier_hot } = RULES_CONFIG.weights;
  
  // 湿冷：RH ≥ 70% 且 T ≤ 12°C，额外扣分
  if (relative_humidity >= 70 && temperature_c <= 12) {
    const baseScore = -((relative_humidity - 50) / 10) * humidity_multiplier_cold;
    const dampPenalty = -2; // 湿冷额外扣分
    return baseScore + dampPenalty;
  }

  // 高湿热：RH ≥ 70% 且 T ≥ 25°C
  if (relative_humidity >= 70 && temperature_c >= 25) {
    return ((relative_humidity - 50) / 10) * humidity_multiplier_hot * 1.2; // 增强闷热感
  }

  // 常规计算
  if (temperature_c <= 15.0) {
    return -((relative_humidity - 50) / 10) * humidity_multiplier_cold;
  } else {
    return ((relative_humidity - 50) / 10) * humidity_multiplier_hot;
  }
}

/**
 * 计算阳光分数
 */
function calculateSunScore(uv_index, is_outdoor) {
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
 * 计算用户画像调整
 */
function calculateUserAdjustment(userProfile, inputs) {
  if (!userProfile) return 0;

  let adjustment = 0;
  const { age_groups, sensitivity, conditions } = RULES_CONFIG.user_profile_adjustments;

  // 年龄组调整
  if (userProfile.age_group && age_groups[userProfile.age_group]) {
    adjustment += age_groups[userProfile.age_group];
  }

  // 敏感度调整
  if (userProfile.sensitivity) {
    if (userProfile.sensitivity === 'cold') {
      const coldSensitivity = userProfile.cold_sensitivity || 8;
      adjustment += -Math.max(6, Math.min(12, coldSensitivity));
    } else if (userProfile.sensitivity === 'hot') {
      const heatSensitivity = userProfile.heat_sensitivity || 8;
      adjustment += Math.max(6, Math.min(12, heatSensitivity));
    }
  }

  // 健康条件调整
  if (userProfile.conditions && Array.isArray(userProfile.conditions)) {
    userProfile.conditions.forEach(condition => {
      if (conditions[condition]) {
        adjustment += conditions[condition];
      }
    });

    // 风湿患者在湿冷时额外调整
    if (userProfile.conditions.includes('rheumatism')) {
      const { temperature_c, relative_humidity } = inputs;
      if (relative_humidity >= 70 && temperature_c <= 12) {
        adjustment -= 2;
      }
    }
  }

  return adjustment;
}

/**
 * 计算舒适度分数
 */
export function calculateComfortScore(weatherData, isOutdoor, activityLevel, userProfile = {}) {
  const { weights } = RULES_CONFIG;
  const current = weatherData.current || {};

  const temperature_c = current.temperature_c || 0;
  const relative_humidity = current.relative_humidity || 0;
  const wind_m_s = current.wind_m_s || 0;
  const gust_m_s = current.gust_m_s || 0;
  const uv_index = current.uv_index || 0;

  // T_score: 温度分数
  const T_score = (temperature_c - weights.base_temp_reference) * weights.temp_multiplier;

  // RH_score: 湿度分数
  const RH_score = calculateHumidityScore(temperature_c, relative_humidity);

  // Wind_score: 风力分数
  let Wind_score = 0;
  if (wind_m_s > weights.wind_threshold_mps) {
    Wind_score = -(wind_m_s - weights.wind_threshold_mps) * weights.wind_multiplier;
  }

  // Gust_score: 阵风额外扣分
  let Gust_score = 0;
  if (gust_m_s > 0 && gust_m_s > wind_m_s) {
    const gustExcess = gust_m_s - wind_m_s;
    Gust_score = -gustExcess * 1.5;
  }

  // Sun_score: 阳光分数
  const Sun_score = calculateSunScore(uv_index, isOutdoor);

  // Activity_adj: 活动量调整
  let Activity_adj = 0;
  if (activityLevel === 'moderate') {
    Activity_adj = 2;
  } else if (activityLevel === 'high') {
    Activity_adj = 5;
  }

  // User_adj: 用户画像调整
  const inputs = { temperature_c, relative_humidity, wind_m_s, gust_m_s, uv_index };
  const User_adj = calculateUserAdjustment(userProfile, inputs);

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
    actual_values: {
      temperature_c,
      relative_humidity,
      wind_m_s,
      gust_m_s,
      uv_index
    }
  };
}

// 穿衣推荐映射（从 dressing_rules_v1.json 提取）
const DRESSING_LAYERS = [
  {
    min_score: 12,
    label: 'warm_light',
    layers: ['短袖/薄长袖', '无需中层', '轻薄外套（可选）'],
    accessories: ['太阳镜/遮阳帽（若UV高）'],
    notes: '适合温暖天或有明显日照时短时间户外活动'
  },
  {
    min_score: 3,
    label: 'mild',
    layers: ['薄长袖', '轻毛衣', '夹克/薄羽绒'],
    accessories: ['薄围巾（建议）'],
    notes: '日常外出保守建议'
  },
  {
    min_score: -7,
    label: 'cool',
    layers: ['保暖打底（羊毛/功能性）', '羊毛衫/抓绒', '软壳/羽绒外套'],
    accessories: ['围巾/手套/保暖袜'],
    notes: '老人和儿童建议多带一层'
  },
  {
    min_score: -20,
    label: 'cold',
    layers: ['保暖内衣/羊毛打底', '羊毛衫+羽绒马甲', '中厚羽绒服'],
    accessories: ['帽子/手套/保暖袜'],
    notes: '尽量缩短户外停留时间'
  },
  {
    min_score: -999,
    label: 'extreme_cold',
    layers: ['全套厚羽绒+功能性保暖内衣'],
    accessories: ['尽量不出门/紧急保暖包'],
    notes: '极端预警级别，优先提示减少外出'
  }
];

/**
 * 根据舒适度分数获取穿衣推荐
 */
export function getDressingRecommendation(comfortScore) {
  // 找到匹配的推荐层级
  for (const layer of DRESSING_LAYERS) {
    if (comfortScore >= layer.min_score) {
      return {
        layers: [...layer.layers],
        accessories: [...layer.accessories],
        label: layer.label,
        notes: layer.notes
      };
    }
  }
  
  // 默认返回最冷的推荐
  const coldest = DRESSING_LAYERS[DRESSING_LAYERS.length - 1];
  return {
    layers: [...coldest.layers],
    accessories: [...coldest.accessories],
    label: coldest.label,
    notes: coldest.notes
  };
}

/**
 * 生成详细理由（简化版）
 */
export function generateDetailedReason(inputs, scoreDetails) {
  const parts = [];
  
  if (scoreDetails.T_score > 0) {
    parts.push(`温度较高（${inputs.temperature_c.toFixed(1)}°C）`);
  } else if (scoreDetails.T_score < 0) {
    parts.push(`温度较低（${inputs.temperature_c.toFixed(1)}°C）`);
  }
  
  if (scoreDetails.RH_score < -2) {
    parts.push(`湿度较高（${inputs.relative_humidity}%）`);
  }
  
  if (scoreDetails.Wind_score < -3) {
    parts.push(`风力较大（${inputs.wind_m_s.toFixed(1)} m/s）`);
  }
  
  if (scoreDetails.Sun_score > 0) {
    parts.push(`阳光充足（UV指数${inputs.uv_index}）`);
  }
  
  if (scoreDetails.Activity_adj > 0) {
    parts.push(`活动强度较高`);
  }
  
  return parts.length > 0 ? parts.join('，') : '天气条件正常';
}

/**
 * 重新计算推荐（基于已有的推荐结果和新的活动参数）
 * 这个方法会保留原有的推荐结构，只更新受活动参数影响的部分
 */
export function recalculateRecommendation(originalRecommendation, weatherData, isOutdoor, activityLevel, userProfile = {}) {
  const current = weatherData.current || {};
  const inputs = {
    temperature_c: current.temperature_c || 0,
    relative_humidity: current.relative_humidity || 0,
    wind_m_s: current.wind_m_s || 0,
    gust_m_s: current.gust_m_s || 0,
    uv_index: current.uv_index || 0
  };

  // 重新计算舒适度分数
  const scoreDetails = calculateComfortScore(weatherData, isOutdoor, activityLevel, userProfile);

  // 获取新的穿衣推荐
  const dressingLayer = getDressingRecommendation(scoreDetails.ComfortScore);

  // 生成详细理由
  const reasonSummary = generateDetailedReason(inputs, scoreDetails);

  // 保留原有的推荐结构，更新变化的部分
  return {
    ...originalRecommendation,
    comfort_score: scoreDetails.ComfortScore,
    score_details: scoreDetails,
    recommendation_layers: dressingLayer.layers,
    accessories: dressingLayer.accessories,
    label: dressingLayer.label,
    notes: dressingLayer.notes || originalRecommendation.notes,
    reason_summary: reasonSummary
  };
}

/**
 * 检查是否可以使用本地计算
 * 如果天气数据完整且已有推荐结果，可以使用本地计算
 */
export function canUseLocalCalculation(weatherData, originalRecommendation) {
  return (
    weatherData &&
    weatherData.current &&
    weatherData.current.temperature_c !== undefined &&
    originalRecommendation &&
    originalRecommendation.score_details
  );
}


/**
 * 旅行推荐服务
 * 根据多天天气数据和用户画像生成旅行穿衣建议、常备用品、急需用品
 */

class TravelRecommendationService {
  constructor(ruleEngine) {
    this.ruleEngine = ruleEngine;
  }

  /**
   * 生成旅行推荐
   * @param {Object} params - 参数对象
   * @param {Array} dailyWeatherData - 每日天气数据数组
   * @param {Object} userProfile - 用户画像
   * @returns {Object} 旅行推荐结果
   */
  generateTravelRecommendation(params, dailyWeatherData, userProfile = {}) {
    const { start_date, end_date } = params;
    const days = this.calculateDays(start_date, end_date);

    // 分析多天天气数据
    const weatherAnalysis = this.analyzeWeatherData(dailyWeatherData);

    // 生成穿衣建议（基于最冷和最热的情况）
    const clothingRecommendations = this.generateClothingRecommendations(
      weatherAnalysis,
      userProfile
    );

    // 生成常备用品
    const essentialItems = this.generateEssentialItems(
      weatherAnalysis,
      userProfile,
      days
    );

    // 生成急需用品（非必须）
    const optionalItems = this.generateOptionalItems(
      weatherAnalysis,
      userProfile,
      days
    );

    // 生成天气概况
    const weatherSummary = this.generateWeatherSummary(weatherAnalysis, days);

    // 生成特别提醒
    const specialNotes = this.generateSpecialNotes(
      weatherAnalysis,
      userProfile,
      days
    );

    return {
      start_date,
      end_date,
      days,
      clothing_recommendations: clothingRecommendations,
      essential_items: essentialItems,
      optional_items: optionalItems,
      weather_summary: weatherSummary,
      special_notes: specialNotes,
      weather_analysis: weatherAnalysis
    };
  }

  /**
   * 计算旅行天数
   */
  calculateDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  /**
   * 分析多天天气数据
   */
  analyzeWeatherData(dailyData) {
    if (!dailyData || dailyData.length === 0) {
      return null;
    }

    const temps = dailyData.map(d => d.temperature_max || d.temperature_2m_max || d.temperature_c || 0);
    const minTemps = dailyData.map(d => d.temperature_min || d.temperature_2m_min || d.temperature_c || 0);
    const humidities = dailyData.map(d => d.relativehumidity_2m || d.relative_humidity || 50);
    const windSpeeds = dailyData.map(d => d.wind_speed_max || d.wind_speed_10m || d.wind_m_s || 0);
    const precipProbs = dailyData.map(d => d.precipitation_probability_max || d.precip_prob || 0);
    const uvIndexes = dailyData.map(d => d.uv_index_max || d.uv_index || 0);

    return {
      min_temp: Math.min(...minTemps),
      max_temp: Math.max(...temps),
      avg_temp: temps.reduce((a, b) => a + b, 0) / temps.length,
      min_humidity: Math.min(...humidities),
      max_humidity: Math.max(...humidities),
      avg_humidity: humidities.reduce((a, b) => a + b, 0) / humidities.length,
      max_wind: Math.max(...windSpeeds),
      has_rain: precipProbs.some(p => p > 50),
      max_precip_prob: Math.max(...precipProbs),
      max_uv: Math.max(...uvIndexes),
      has_high_uv: Math.max(...uvIndexes) >= 6,
      temp_range: Math.max(...temps) - Math.min(...minTemps),
      days_count: dailyData.length
    };
  }

  /**
   * 生成穿衣建议
   */
  generateClothingRecommendations(weatherAnalysis, userProfile) {
    if (!weatherAnalysis) return [];

    const recommendations = [];
    const { min_temp, max_temp, avg_temp, has_rain, max_wind } = weatherAnalysis;

    // 基于最低温度生成基础建议
    const coldInput = {
      temperature_c: min_temp,
      relative_humidity: weatherAnalysis.avg_humidity,
      wind_m_s: max_wind,
      gust_m_s: 0,
      uv_index: weatherAnalysis.max_uv,
      is_outdoor: true,
      activity_level: 'moderate',
      user_profile: userProfile
    };

    const coldScore = this.ruleEngine.calculateComfortScore(coldInput);
    const coldRecommendation = this.ruleEngine.getDressingRecommendationEnhanced(
      coldScore.ComfortScore,
      coldInput,
      userProfile
    );

    // 基于最高温度生成建议
    const hotInput = {
      ...coldInput,
      temperature_c: max_temp
    };
    const hotScore = this.ruleEngine.calculateComfortScore(hotInput);
    const hotRecommendation = this.ruleEngine.getDressingRecommendationEnhanced(
      hotScore.ComfortScore,
      hotInput,
      userProfile
    );

    // 合并建议
    const allLayers = new Set([
      ...coldRecommendation.layers,
      ...hotRecommendation.layers
    ]);

    allLayers.forEach(layer => {
      recommendations.push({
        name: layer,
        reason: this.getClothingReason(layer, weatherAnalysis, userProfile)
      });
    });

    // 添加配饰
    const allAccessories = new Set([
      ...(coldRecommendation.accessories || []),
      ...(hotRecommendation.accessories || [])
    ]);

    allAccessories.forEach(accessory => {
      recommendations.push({
        name: accessory,
        reason: this.getAccessoryReason(accessory, weatherAnalysis, userProfile)
      });
    });

    // 根据温度范围添加建议
    if (weatherAnalysis.temp_range > 10) {
      recommendations.push({
        name: '多层穿搭（便于增减）',
        reason: '旅行期间温差较大，建议采用多层穿搭方式'
      });
    }

    if (has_rain) {
      recommendations.push({
        name: '防水外套',
        reason: '旅行期间可能有降雨'
      });
    }

    return recommendations;
  }

  /**
   * 生成常备用品
   */
  generateEssentialItems(weatherAnalysis, userProfile, days) {
    const items = [];

    // 基础常备用品
    items.push({ name: '身份证/护照', reason: '出行必备证件' });
    items.push({ name: '充电宝', reason: '保证电子设备电量充足' });
    items.push({ name: '充电器', reason: '电子设备充电' });

    // 根据天气添加
    if (weatherAnalysis.has_high_uv) {
      items.push({ name: '防晒霜 SPF30+', reason: '紫外线较强，需要防晒' });
      items.push({ name: '遮阳帽', reason: '防止阳光直射' });
    }

    if (weatherAnalysis.has_rain) {
      items.push({ name: '雨伞/雨衣', reason: '旅行期间可能有降雨' });
    }

    if (weatherAnalysis.min_temp < 10) {
      items.push({ name: '保温杯', reason: '天气较冷，建议携带热水' });
    }

    if (weatherAnalysis.max_temp > 25) {
      items.push({ name: '湿巾', reason: '天气较热，保持清爽' });
    }

    // 根据用户画像添加
    if (userProfile.age_group?.startsWith('child_')) {
      items.push({ name: '儿童常用药品', reason: '儿童抵抗力较弱，建议携带常用药品' });
      items.push({ name: '儿童湿巾', reason: '儿童清洁用品' });
    }

    if (userProfile.age_group === 'elderly_65_plus') {
      items.push({ name: '常用药品', reason: '老年人建议携带常用药品' });
      items.push({ name: '保温杯', reason: '老年人建议多喝热水' });
    }

    if (userProfile.conditions?.includes('asthma')) {
      items.push({ name: '哮喘用药', reason: '根据身体状况携带' });
    }

    // 根据旅行天数添加
    if (days > 3) {
      items.push({ name: '换洗衣物', reason: `旅行${days}天，需要换洗衣物` });
    }

    return items;
  }

  /**
   * 生成急需用品（非必须）
   */
  generateOptionalItems(weatherAnalysis, userProfile, days) {
    const items = [];

    // 根据天气添加
    if (weatherAnalysis.min_temp < 5) {
      items.push({ name: '暖宝宝', reason: '天气较冷，可提供额外保暖' });
      items.push({ name: '热水袋', reason: '夜间保暖' });
    }

    if (weatherAnalysis.max_temp > 30) {
      items.push({ name: '小风扇', reason: '天气炎热，可提供降温' });
      items.push({ name: '防蚊液', reason: '高温天气蚊虫较多' });
    }

    if (weatherAnalysis.has_rain && weatherAnalysis.min_temp < 10) {
      items.push({ name: '防滑鞋套', reason: '雨天防滑' });
    }

    if (weatherAnalysis.max_wind > 8) {
      items.push({ name: '防风镜', reason: '风力较大，保护眼睛' });
    }

    // 根据用户画像添加
    if (userProfile.age_group?.startsWith('child_')) {
      items.push({ name: '儿童玩具', reason: '安抚儿童情绪' });
      items.push({ name: '儿童零食', reason: '防止儿童饥饿' });
    }

    if (userProfile.conditions?.includes('rheumatism')) {
      items.push({ name: '护膝/护腰', reason: '保护关节' });
    }

    // 根据旅行天数添加
    if (days > 5) {
      items.push({ name: '便携式洗衣液', reason: '长期旅行清洁衣物' });
    }

    return items;
  }

  /**
   * 生成天气概况
   */
  generateWeatherSummary(weatherAnalysis, days) {
    if (!weatherAnalysis) return '';

    const parts = [];
    parts.push(`旅行期间（${days}天）天气概况：`);
    parts.push(`温度范围：${weatherAnalysis.min_temp.toFixed(1)}°C - ${weatherAnalysis.max_temp.toFixed(1)}°C`);
    parts.push(`平均温度：${weatherAnalysis.avg_temp.toFixed(1)}°C`);
    
    if (weatherAnalysis.temp_range > 10) {
      parts.push(`温差较大（${weatherAnalysis.temp_range.toFixed(1)}°C），建议采用多层穿搭`);
    }

    if (weatherAnalysis.has_rain) {
      parts.push(`预计有降雨，最大降雨概率：${weatherAnalysis.max_precip_prob}%`);
    }

    if (weatherAnalysis.has_high_uv) {
      parts.push(`紫外线较强（最高UV指数：${weatherAnalysis.max_uv}），注意防晒`);
    }

    if (weatherAnalysis.max_wind > 8) {
      parts.push(`风力较大（最大风速：${weatherAnalysis.max_wind.toFixed(1)} m/s），注意防风`);
    }

    return parts.join('；');
  }

  /**
   * 生成特别提醒
   */
  generateSpecialNotes(weatherAnalysis, userProfile, days) {
    const notes = [];

    if (!weatherAnalysis) return notes;

    // 温度相关提醒
    if (weatherAnalysis.min_temp < 0) {
      notes.push('天气极冷，建议减少户外活动时间，注意保暖防寒');
    } else if (weatherAnalysis.min_temp < 5) {
      notes.push('天气较冷，建议穿着保暖衣物，注意防寒');
    }

    if (weatherAnalysis.max_temp > 35) {
      notes.push('天气炎热，注意防暑降温，多补充水分');
    } else if (weatherAnalysis.max_temp > 30) {
      notes.push('天气较热，建议穿着轻薄透气衣物，注意防晒');
    }

    // 降雨提醒
    if (weatherAnalysis.has_rain) {
      notes.push('旅行期间可能有降雨，建议携带雨具，注意防滑');
    }

    // 紫外线提醒
    if (weatherAnalysis.has_high_uv) {
      notes.push('紫外线较强，建议涂抹防晒霜，佩戴遮阳帽和太阳镜');
    }

    // 用户画像相关提醒
    if (userProfile.age_group?.startsWith('child_')) {
      notes.push('儿童抵抗力较弱，建议携带常用药品，注意保暖和防晒');
    }

    if (userProfile.age_group === 'elderly_65_plus') {
      notes.push('老年人建议携带常用药品，注意保暖，避免长时间户外活动');
    }

    if (userProfile.conditions?.includes('asthma')) {
      notes.push('如有哮喘病史，建议携带哮喘用药，注意空气质量');
    }

    if (userProfile.conditions?.includes('rheumatism')) {
      if (weatherAnalysis.avg_humidity > 70 && weatherAnalysis.avg_temp < 15) {
        notes.push('湿冷天气可能诱发风湿不适，建议携带护具，注意保暖防潮');
      }
    }

    // 旅行天数提醒
    if (days > 7) {
      notes.push(`旅行时间较长（${days}天），建议准备充足的换洗衣物和日用品`);
    }

    return notes;
  }

  /**
   * 获取衣物原因说明
   */
  getClothingReason(layer, weatherAnalysis, userProfile) {
    if (layer.includes('短袖') || layer.includes('薄')) {
      return '适合较暖天气';
    }
    if (layer.includes('羽绒') || layer.includes('厚')) {
      return '适合较冷天气';
    }
    if (layer.includes('多层')) {
      return '适合温差较大的情况';
    }
    return '根据天气情况选择';
  }

  /**
   * 获取配饰原因说明
   */
  getAccessoryReason(accessory, weatherAnalysis, userProfile) {
    if (accessory.includes('帽') || accessory.includes('遮阳')) {
      return '防晒/保暖';
    }
    if (accessory.includes('围巾')) {
      return '保暖防风';
    }
    if (accessory.includes('手套')) {
      return '手部保暖';
    }
    if (accessory.includes('太阳镜')) {
      return '防紫外线';
    }
    return '根据天气情况选择';
  }
}

module.exports = TravelRecommendationService;


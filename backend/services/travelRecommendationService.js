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
    const dates = dailyData.map(d => d.date || d.time);

    // 计算每日温差（最高温-最低温）
    const dailyTempRanges = dailyData.map((d, i) => {
      const max = temps[i];
      const min = minTemps[i];
      return { date: dates[i], range: max - min, max, min };
    });

    // 计算平均每日温差
    const avgDailyTempRange = dailyTempRanges.reduce((sum, d) => sum + d.range, 0) / dailyTempRanges.length;

    // 找出温差最大的那一天
    const maxDailyRange = Math.max(...dailyTempRanges.map(d => d.range));
    const maxRangeDay = dailyTempRanges.find(d => d.range === maxDailyRange);

    // 分析整体温差（最高日最高温 - 最低日最低温）
    const overallTempRange = Math.max(...temps) - Math.min(...minTemps);

    // 检测异常天气：某一天温度突然变化超过10度
    const abnormalDays = [];
    for (let i = 1; i < temps.length; i++) {
      const prevAvg = (temps[i-1] + minTemps[i-1]) / 2;
      const currAvg = (temps[i] + minTemps[i]) / 2;
      const tempChange = Math.abs(currAvg - prevAvg);
      if (tempChange > 10) {
        abnormalDays.push({
          date: dates[i],
          change: tempChange,
          direction: currAvg > prevAvg ? '上升' : '下降',
          prev_temp: prevAvg,
          curr_temp: currAvg
        });
      }
    }

    // 检测极端天气
    const extremeCold = Math.min(...minTemps) < -5;
    const extremeHot = Math.max(...temps) > 35;
    const heavyRain = Math.max(...precipProbs) > 70;
    const strongWind = Math.max(...windSpeeds) > 12;

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
      temp_range: overallTempRange, // 整体温差
      avg_daily_temp_range: avgDailyTempRange, // 平均每日温差
      max_daily_temp_range: maxDailyRange, // 最大单日温差
      max_range_day: maxRangeDay, // 温差最大的那一天
      abnormal_days: abnormalDays, // 异常天气天数
      extreme_cold: extremeCold,
      extreme_hot: extremeHot,
      heavy_rain: heavyRain,
      strong_wind: strongWind,
      daily_data: dailyData, // 保留原始数据用于详细分析
      days_count: dailyData.length
    };
  }

  /**
   * 生成穿衣建议（增强版，针对具体天气数据）
   */
  generateClothingRecommendations(weatherAnalysis, userProfile) {
    if (!weatherAnalysis) return [];

    const recommendations = [];
    const { min_temp, max_temp, avg_temp, has_rain, max_wind, avg_daily_temp_range, max_daily_temp_range, max_range_day, daily_data } = weatherAnalysis;

    // 分析每日天气，生成每日具体建议
    const dailyRecommendations = {};
    
    daily_data.forEach((day, index) => {
      const dayMax = day.temperature_max || day.temperature_2m_max || 0;
      const dayMin = day.temperature_min || day.temperature_2m_min || 0;
      const dayAvg = (dayMax + dayMin) / 2;
      const dayPrecip = day.precipitation_probability_max || day.precip_prob || 0;
      const dayWind = day.wind_speed_max || day.wind_speed_10m || 0;
      const dayUv = day.uv_index_max || day.uv_index || 0;
      const dayDate = day.date || day.time;

      // 基于该日最高温生成建议
      const dayInput = {
        temperature_c: dayMax,
        relative_humidity: weatherAnalysis.avg_humidity,
        wind_m_s: dayWind,
        gust_m_s: 0,
        uv_index: dayUv,
        is_outdoor: true,
        activity_level: 'moderate',
        user_profile: userProfile
      };

      const dayScore = this.ruleEngine.calculateComfortScore(dayInput);
      const dayRecommendation = this.ruleEngine.getDressingRecommendationEnhanced(
        dayScore.ComfortScore,
        dayInput,
        userProfile
      );

      dailyRecommendations[dayDate] = {
        date: dayDate,
        max_temp: dayMax,
        min_temp: dayMin,
        avg_temp: dayAvg,
        day_range: dayMax - dayMin,
        recommendation: dayRecommendation,
        has_rain: dayPrecip > 50,
        precip_prob: dayPrecip,
        wind: dayWind,
        uv: dayUv
      };
    });

    // 基于最低温度生成基础建议（最冷情况）
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

    // 基于最高温度生成建议（最热情况）
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

    // 合并基础建议
    const allLayers = new Set([
      ...coldRecommendation.layers,
      ...hotRecommendation.layers
    ]);

    allLayers.forEach(layer => {
      recommendations.push({
        name: layer,
        reason: this.getDetailedClothingReason(layer, weatherAnalysis, dailyRecommendations, userProfile),
        details: this.getClothingDetails(layer, weatherAnalysis)
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
        reason: this.getDetailedAccessoryReason(accessory, weatherAnalysis, dailyRecommendations, userProfile),
        details: this.getAccessoryDetails(accessory, weatherAnalysis)
      });
    });

    // 根据温度范围添加详细建议
    if (weatherAnalysis.temp_range > 10) {
      if (avg_daily_temp_range > 8) {
        // 每日温差大，说明是早晚温差
        recommendations.push({
          name: '多层穿搭（便于增减）',
          reason: `旅行期间早晚温差较大（平均每日温差${avg_daily_temp_range.toFixed(1)}°C），建议采用多层穿搭，早晚添加外套，中午可适当减少`,
          details: `建议携带轻薄外套，方便根据温度变化随时增减衣物`
        });
      } else {
        // 整体温差大，说明不同日期温度差异大
        recommendations.push({
          name: '多层穿搭（便于增减）',
          reason: `旅行期间不同日期温度差异较大（整体温差${weatherAnalysis.temp_range.toFixed(1)}°C），建议准备不同厚度的衣物`,
          details: `建议携带从薄到厚的多层衣物，根据每日天气情况选择`
        });
      }
    }

    if (has_rain) {
      recommendations.push({
        name: '防水外套/雨衣',
        reason: `旅行期间可能有降雨（最大降雨概率${weatherAnalysis.max_precip_prob}%），建议携带防水装备`,
        details: '建议携带轻便的防水外套或雨衣，避免被雨水打湿影响行程'
      });
    }

    if (max_wind > 8) {
      recommendations.push({
        name: '防风外套',
        reason: `旅行期间风力较大（最大风速${max_wind.toFixed(1)} m/s），建议携带防风衣物`,
        details: '建议选择防风性能好的外套，避免强风影响体感温度'
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
   * 生成天气概况（增强版，分类说明）
   */
  generateWeatherSummary(weatherAnalysis, days) {
    if (!weatherAnalysis) return { text: '', categories: [], needs_plan_change: false };

    const categories = [];
    let needsPlanChange = false;
    const planChangeReasons = [];

    // 1. 温度概况
    const tempCategory = {
      title: '🌡️ 温度情况',
      items: [
        `温度范围：${weatherAnalysis.min_temp.toFixed(1)}°C - ${weatherAnalysis.max_temp.toFixed(1)}°C`,
        `平均温度：${weatherAnalysis.avg_temp.toFixed(1)}°C`
      ]
    };

    // 温差分析
    if (weatherAnalysis.temp_range > 10) {
      if (weatherAnalysis.avg_daily_temp_range > 8) {
        // 早晚温差大
        tempCategory.items.push(`早晚温差较大（平均每日温差${weatherAnalysis.avg_daily_temp_range.toFixed(1)}°C），建议采用多层穿搭`);
        if (weatherAnalysis.max_daily_temp_range > 12) {
          tempCategory.items.push(`其中${weatherAnalysis.max_range_day?.date || '某一天'}温差最大（${weatherAnalysis.max_daily_temp_range.toFixed(1)}°C），需特别注意`);
        }
      } else {
        // 不同日期温差大
        tempCategory.items.push(`不同日期温度差异较大（整体温差${weatherAnalysis.temp_range.toFixed(1)}°C），建议准备不同厚度的衣物`);
      }
    }

    // 异常天气检测
    if (weatherAnalysis.abnormal_days && weatherAnalysis.abnormal_days.length > 0) {
      const abnormalInfo = weatherAnalysis.abnormal_days.map(day => 
        `${day.date}温度${day.direction}${day.change.toFixed(1)}°C（从${day.prev_temp.toFixed(1)}°C到${day.curr_temp.toFixed(1)}°C）`
      ).join('；');
      tempCategory.items.push(`⚠️ 异常天气：${abnormalInfo}`);
      needsPlanChange = true;
      planChangeReasons.push(`检测到${weatherAnalysis.abnormal_days.length}天异常天气，温度变化超过10°C，建议关注并考虑调整行程`);
    }

    // 极端温度
    if (weatherAnalysis.extreme_cold) {
      tempCategory.items.push(`❄️ 极寒天气：最低温度低于-5°C，需特别注意保暖`);
      needsPlanChange = true;
      planChangeReasons.push('极寒天气可能影响出行，建议考虑调整行程或做好充分准备');
    }
    if (weatherAnalysis.extreme_hot) {
      tempCategory.items.push(`🔥 极热天气：最高温度超过35°C，需注意防暑降温`);
      needsPlanChange = true;
      planChangeReasons.push('极热天气可能影响出行舒适度，建议避免中午时段户外活动');
    }

    categories.push(tempCategory);

    // 2. 降雨情况
    if (weatherAnalysis.has_rain) {
      const rainCategory = {
        title: '🌧️ 降雨情况',
        items: [
          `预计有降雨，最大降雨概率：${weatherAnalysis.max_precip_prob}%`
        ]
      };

      if (weatherAnalysis.heavy_rain) {
        rainCategory.items.push(`⚠️ 强降雨预警：降雨概率超过70%，可能影响出行`);
        needsPlanChange = true;
        planChangeReasons.push('强降雨可能影响户外活动，建议准备雨具并考虑调整行程');
      }

      categories.push(rainCategory);
    }

    // 3. 紫外线情况
    if (weatherAnalysis.has_high_uv) {
      categories.push({
        title: '☀️ 紫外线情况',
        items: [
          `紫外线较强（最高UV指数：${weatherAnalysis.max_uv}），注意防晒`,
          '建议涂抹防晒霜，佩戴遮阳帽和太阳镜'
        ]
      });
    }

    // 4. 风力情况
    if (weatherAnalysis.max_wind > 8) {
      const windCategory = {
        title: '💨 风力情况',
        items: [
          `风力较大（最大风速：${weatherAnalysis.max_wind.toFixed(1)} m/s），注意防风`
        ]
      };

      if (weatherAnalysis.strong_wind) {
        windCategory.items.push(`⚠️ 强风预警：风速超过12 m/s，可能影响出行安全`);
        needsPlanChange = true;
        planChangeReasons.push('强风天气可能影响出行安全，建议避免户外活动或做好防护');
      }

      categories.push(windCategory);
    }

    // 5. 湿度情况（仅在异常时显示）
    if (weatherAnalysis.avg_humidity > 80 || weatherAnalysis.avg_humidity < 30) {
      categories.push({
        title: '💧 湿度情况',
        items: [
          `平均湿度：${weatherAnalysis.avg_humidity.toFixed(0)}%`,
          weatherAnalysis.avg_humidity > 80 ? '湿度较高，体感可能更热' : '湿度较低，注意补水'
        ]
      });
    }

    // 生成文本摘要
    const textParts = [];
    textParts.push(`旅行期间（${days}天）天气概况：`);
    categories.forEach(cat => {
      textParts.push(`${cat.title}：${cat.items.join('；')}`);
    });

    return {
      text: textParts.join('\n'),
      categories: categories,
      needs_plan_change: needsPlanChange,
      plan_change_reasons: planChangeReasons
    };
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
   * 获取详细衣物原因说明
   */
  getDetailedClothingReason(layer, weatherAnalysis, dailyRecommendations, userProfile) {
    const { min_temp, max_temp, avg_daily_temp_range } = weatherAnalysis;

    if (layer.includes('短袖') || layer.includes('薄长袖')) {
      return `适合较暖天气（最高温${max_temp.toFixed(1)}°C），建议在温度较高的时段穿着`;
    }
    if (layer.includes('羽绒') || layer.includes('厚')) {
      return `适合较冷天气（最低温${min_temp.toFixed(1)}°C），建议在温度较低的时段穿着`;
    }
    if (layer.includes('多层')) {
      if (avg_daily_temp_range > 8) {
        return `早晚温差大（平均每日温差${avg_daily_temp_range.toFixed(1)}°C），建议采用多层穿搭，便于根据温度变化增减`;
      }
      return `不同日期温度差异大（整体温差${weatherAnalysis.temp_range.toFixed(1)}°C），建议准备不同厚度的衣物`;
    }
    if (layer.includes('防水') || layer.includes('雨衣')) {
      return `预计有降雨（最大降雨概率${weatherAnalysis.max_precip_prob}%），建议携带防水装备`;
    }
    return `根据天气情况选择，温度范围${min_temp.toFixed(1)}°C - ${max_temp.toFixed(1)}°C`;
  }

  /**
   * 获取衣物详情说明
   */
  getClothingDetails(layer, weatherAnalysis) {
    if (layer.includes('短袖') || layer.includes('薄长袖')) {
      return '建议选择透气性好的材质，如棉质或速干面料';
    }
    if (layer.includes('羽绒') || layer.includes('厚')) {
      return '建议选择填充量充足的羽绒服，确保保暖效果';
    }
    if (layer.includes('多层')) {
      return '建议内层选择贴身透气材质，外层选择防风保暖材质';
    }
    return null;
  }

  /**
   * 获取详细配饰原因说明
   */
  getDetailedAccessoryReason(accessory, weatherAnalysis, dailyRecommendations, userProfile) {
    if (accessory.includes('帽') || accessory.includes('遮阳')) {
      if (weatherAnalysis.has_high_uv) {
        return `紫外线较强（最高UV指数${weatherAnalysis.max_uv}），建议佩戴遮阳帽防晒`;
      }
      return '建议佩戴帽子保暖/防晒';
    }
    if (accessory.includes('围巾')) {
      return `最低温度${weatherAnalysis.min_temp.toFixed(1)}°C，建议佩戴围巾保暖防风`;
    }
    if (accessory.includes('手套')) {
      return `最低温度${weatherAnalysis.min_temp.toFixed(1)}°C，建议佩戴手套保护手部`;
    }
    if (accessory.includes('太阳镜') || accessory.includes('墨镜')) {
      return `紫外线较强（最高UV指数${weatherAnalysis.max_uv}），建议佩戴太阳镜保护眼睛`;
    }
    return '根据天气情况选择';
  }

  /**
   * 获取配饰详情说明
   */
  getAccessoryDetails(accessory, weatherAnalysis) {
    if (accessory.includes('太阳镜') || accessory.includes('墨镜')) {
      return '建议选择UV400防护级别的太阳镜';
    }
    if (accessory.includes('围巾')) {
      return '建议选择保暖性好的材质，如羊毛或羊绒';
    }
    return null;
  }

  /**
   * 获取衣物原因说明（向后兼容）
   */
  getClothingReason(layer, weatherAnalysis, userProfile) {
    return this.getDetailedClothingReason(layer, weatherAnalysis, {}, userProfile);
  }

  /**
   * 获取配饰原因说明（向后兼容）
   */
  getAccessoryReason(accessory, weatherAnalysis, userProfile) {
    return this.getDetailedAccessoryReason(accessory, weatherAnalysis, {}, userProfile);
  }
}

module.exports = TravelRecommendationService;


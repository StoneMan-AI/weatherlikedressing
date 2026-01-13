/**
 * 衣服图标映射配置
 * 用于将中文衣服名称映射到PNG图片文件名和Emoji图标
 */

// 图标映射表：格式为 [中文关键词, PNG文件名, Emoji图标]
export const clothingIconMap = [
  // 衣物类 - 上装（从具体到一般）
  
  // 羽绒类
  ['中厚羽绒服', 'thick_down_jacket', '🧥'],
  ['厚羽绒', 'heavy_down', '🧥'],
  ['薄羽绒', 'light_down', '🧥'],
  ['羽绒服', 'down_jacket', '🧥'],
  ['羽绒外套', 'down_coat', '🧥'],
  ['羽绒马甲', 'down_vest', '🧥'],
  
  // 保暖内衣类
  ['保暖内衣', 'thermal_underwear', '👕'],
  ['羊毛打底', 'wool_base_layer', '👕'],
  ['打底', 'base_layer', '👕'],
  ['内衣', 'underwear', '👕'],
  
  // 毛衣/针织类
  ['羊毛衫', 'wool_sweater', '🧥'],
  ['轻毛衣', 'light_sweater', '🧥'],
  ['毛衣', 'sweater', '🧥'],
  ['针织衫', 'knit_sweater', '🧥'],
  
  // 衬衫/长袖类
  ['薄长袖', 'thin_long_sleeve', '👔'],
  ['长袖', 'long_sleeve', '👔'],
  ['衬衫', 'shirt', '👔'],
  
  // T恤/短袖类
  ['短袖', 'short_sleeve', '👕'],
  ['T恤', 't_shirt', '👕'],
  
  // 外套类
  ['冲锋衣', 'windbreaker', '🧥'],
  ['软壳', 'softshell', '🧥'],
  ['抓绒', 'fleece', '🧥'],
  ['风衣', 'trench_coat', '🧥'],
  ['大衣', 'coat', '🧥'],
  ['夹克', 'jacket', '🧥'],
  
  // 马甲/背心类
  ['马甲', 'vest', '🧥'],
  ['背心', 'tank_top', '🧥'],
  
  // 运动/休闲类
  ['卫衣', 'hoodie', '👕'],
  ['运动服', 'sportswear', '👕'],
  ['运动', 'sport', '👕'],
  
  // 衣物类 - 下装
  ['连衣裙', 'dress', '👗'],
  ['裙子', 'skirt', '👗'],
  ['打底裤', 'leggings', '👖'],
  ['牛仔裤', 'jeans', '👖'],
  ['运动裤', 'sweatpants', '👖'],
  ['休闲裤', 'casual_pants', '👖'],
  ['长裤', 'pants', '👖'],
  ['短裤', 'shorts', '🩳'],
  
  // 衣物类 - 鞋袜
  ['雨鞋', 'rain_boots', '👢'],
  ['防滑鞋', 'non_slip_shoes', '👢'],
  ['靴子', 'boots', '👢'],
  ['运动鞋', 'sneakers', '👟'],
  ['休闲鞋', 'casual_shoes', '👟'],
  ['凉鞋', 'sandals', '👡'],
  ['拖鞋', 'slippers', '🩴'],
  ['保暖袜', 'warm_socks', '🧦'],
  ['运动袜', 'sport_socks', '🧦'],
  ['袜子', 'socks', '🧦'],
  
  // 配饰类 - 头部
  ['毛线帽', 'wool_hat', '🧢'],
  ['保暖帽', 'warm_hat', '🧢'],
  ['遮阳帽', 'sun_hat', '👒'],
  ['棒球帽', 'baseball_cap', '🧢'],
  ['帽子', 'hat', '🧢'],
  ['太阳镜', 'sunglasses', '🕶️'],
  ['墨镜', 'sunglasses_dark', '🕶️'],
  ['厚围巾', 'thick_scarf', '🧣'],
  ['薄围巾', 'thin_scarf', '🧣'],
  ['丝巾', 'silk_scarf', '🧣'],
  ['围巾', 'scarf', '🧣'],
  ['手套', 'gloves', '🧤'],
  ['口罩', 'mask', '😷'],
  ['面罩', 'face_mask', '😷'],
  
  // 雨具类
  ['雨鞋套', 'rain_shoe_covers', '👢'],
  ['雨披', 'rain_poncho', '🧥'],
  ['雨衣', 'raincoat', '🧥'],
  ['雨伞', 'umbrella', '☂️'],
  ['雨具', 'rain_gear', '☂️'],
  ['防水包', 'waterproof_bag', '🎒'],
];

// 图标基础路径
export const ICON_BASE_PATH = '/icons/clothing/';

/**
 * 根据衣服名称获取图标信息
 * @param {string} itemName - 衣服名称
 * @param {string} defaultType - 默认类型（clothing/essential/other）
 * @returns {Object} { pngPath: string, emoji: string }
 */
export function getClothingIcon(itemName, defaultType = 'clothing') {
  // 按长度从长到短排序，优先匹配更具体的关键词
  const sortedMap = [...clothingIconMap].sort((a, b) => b[0].length - a[0].length);
  
  // 尝试匹配关键词（优先匹配更长的）
  for (const [key, pngName, emoji] of sortedMap) {
    if (itemName.includes(key)) {
      return {
        pngPath: `${ICON_BASE_PATH}${pngName}.png`,
        emoji: emoji,
        pngName: pngName
      };
    }
  }
  
  // 默认图标
  const defaultIcons = {
    clothing: { pngPath: null, emoji: '👕', pngName: null },
    essential: { pngPath: null, emoji: '🎒', pngName: null },
    other: { pngPath: null, emoji: '📦', pngName: null }
  };
  
  return defaultIcons[defaultType] || defaultIcons.clothing;
}

/**
 * 检查图片是否存在（通过尝试加载）
 * @param {string} imagePath - 图片路径
 * @returns {Promise<boolean>}
 */
export function checkImageExists(imagePath) {
  return new Promise((resolve) => {
    if (!imagePath) {
      resolve(false);
      return;
    }
    
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = imagePath;
  });
}


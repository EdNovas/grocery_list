const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const BRAIN = 'C:/Users/wdm17/.gemini/antigravity/brain/8b121671-de41-4c9a-9dd1-9d6e309dfcf5';
const OUT = path.join(__dirname, 'public/icons');

// Ensure output directory
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// Each sprite: [filename, cols, rows, [product_ids in row-major order]]
const SPRITES = [
  // Vegetable - Leafy (4x5)
  ['veg_leafy_icons_1773704709322.png', 5, 4, [
    1,2,3,4,5,   // 大白菜,小白菜,菠菜,生菜,油麦菜
    6,7,8,9,10,  // 空心菜,芹菜,韭菜,茼蒿,苋菜
    11,12,13,14,15, // 娃娃菜,香菜,大葱,小葱,蒜苗
    16,17,18,19,20  // 蒜薹,茴香,荠菜,芥蓝,null
  ]],
  // Vegetable - Solanaceae (4x3)
  ['veg_solanaceae_icons_1773704722916.png', 4, 3, [
    20,21,22,23,   // 番茄,茄子,青椒,红椒
    24,25,26,27,   // 尖椒,朝天椒,黄瓜,丝瓜
    28,29,30,31    // 苦瓜,西葫芦,秋葵,null
  ]],
  // Vegetable - Root (4x4)
  ['veg_root_icons_1773704736760.png', 4, 4, [
    40,41,42,43,   // 土豆,红薯,紫薯,芋头
    44,45,46,47,   // 白萝卜,胡萝卜,红萝卜,莲藕
    48,49,50,51,   // 姜,竹笋,荸荠,山药
    52,53,54,0     // 魔芋,凉薯,牛蒡,null
  ]],
  // Vegetable - Mushrooms (4x4)
  ['veg_mushroom_icons_1773704781994.png', 4, 4, [
    60,61,62,63,   // 香菇,金针菇,杏鲍菇,平菇
    64,65,66,67,   // 口蘑,海鲜菇,茶树菇,猴头菇
    68,69,70,71,   // 鸡枞菌,草菇,羊肚菌,松茸
    72,73,0,0      // 木耳,银耳,null,null
  ]],
  // Vegetable - Beans & Cauliflower (4x4)
  ['veg_bean_cauli_icons_1773704794998.png', 4, 4, [
    80,81,82,83,   // 豆角,毛豆,四季豆,豌豆
    84,85,86,87,   // 蚕豆,荷兰豆,豆芽绿,豆芽黄
    90,91,92,93,   // 花菜,西兰花,玉米,南瓜
    94,95,0,0      // 冬瓜,西葫芦2,null,null
  ]],
  // Fruit - Berries & Citrus (4x4)
  ['fruit_berry_citrus_icons_1773704807521.png', 4, 4, [
    100,101,102,103, // 草莓,蓝莓,树莓,桑葚
    110,111,112,113, // 橘子,橙子,柚子,柠檬
    114,115,116,117, // 青柠,金桔,柚子大,沃柑
    120,121,122,130  // 苹果,青苹果,梨,葡萄
  ]],
  // Fruit - Stone & Tropical (5x4)
  ['fruit_stone_tropical_icons_1773704837797.png', 4, 5, [
    131,132,133,134, // 红葡萄,无籽葡萄,阳光玫瑰,青提
    135,136,137,138, // 葡萄干(snack),西瓜,哈密瓜,甜瓜
    140,141,142,143, // 桃子,油桃,李子,樱桃
    144,145,146,147, // 杏,荔枝,龙眼,杨梅
    148,151,152,153  // 红枣鲜,芒果,菠萝,火龙果
  ]],
  // Fruit - Tropical & Other (4x4)
  ['fruit_tropical_other_icons_1773704849097.png', 4, 4, [
    154,155,156,157, // 百香果,牛油果,椰子,榴莲
    158,159,160,161, // 山竹,番石榴,木瓜,释迦
    165,166,167,168, // 石榴,猕猴桃,无花果,柿子
    169,0,0,0        // 甘蔗,null,null,null
  ]],
  // Meat - Pork & Beef (4x5)
  ['meat_pork_beef_icons_1773704863933.png', 4, 5, [
    200,201,202,203, // 五花肉,猪里脊,猪外脊,排骨
    204,205,206,207, // 猪蹄,猪肉馅,猪肝,猪大肠
    208,209,210,211, // 猪骨,棒骨,牛排,牛腩
    212,213,214,215, // 牛腱,牛筋,肥牛卷,牛肉馅
    216,217,218,0    // 牛短肋,牛肚,牛尾,null
  ]],
  // Meat - Lamb, Poultry, Processed (5x5)
  ['meat_lamb_poultry_icons_1773704897580.png', 5, 5, [
    220,221,222,223,250, // 羊排,羊腿,羊肉卷,羊肉块,整鸡
    251,252,253,254,255, // 鸡胸肉,鸡腿,鸡翅,鸡爪,鸡胗
    256,260,261,262,263, // 整鸭,鸭胸,鸭翅,鸭腿,乳鸽
    280,281,282,283,284, // 火腿,培根,香肠,腊肠,午餐肉
    285,286,287,288,0    // 肉松,腊肉,热狗,牛肉干,null
  ]],
  // Seafood - Fish (4x4)
  ['seafood_fish_icons_1773704910247.png', 4, 4, [
    300,301,302,303, // 草鱼,鲫鱼,鲈鱼,黄花鱼
    304,305,306,307, // 三文鱼,鳕鱼,鲳鱼,黑鱼
    308,309,310,311, // 罗非鱼,鲭鱼,鳗鱼,带鱼
    312,313,314,0    // 鲶鱼,桂花鱼,金枪鱼,null
  ]],
  // Seafood - Shellfish (5x4)
  ['seafood_shellfish_icons_1773704924728.png', 4, 5, [
    320,321,322,323, // 基围虾,大虾,小龙虾,螃蟹
    324,325,326,327, // 大闸蟹,帝王蟹,皮皮虾,北极虾
    330,331,332,333, // 蛤蜊,扇贝,生蚝,蛏子
    334,335,336,340, // 花甲,海螺,鲍鱼,鱿鱼
    341,0,0,0        // 章鱼,null,null,null
  ]],
  // Seafood Other + Dairy (5x4)
  ['seafood_other_dairy_icons_1773704956364.png', 4, 5, [
    342,343,344,345, // 海参(as squid rings),海带,紫菜,海苔
    346,400,401,402, // 干虾米,全脂牛奶,纯牛奶,低脂牛奶
    403,410,411,412, // 燕麦奶,酸奶,希腊酸奶,饮用酸奶
    413,414,415,416, // 鸡蛋,鸭蛋,鹌鹑蛋,蛋黄
    417,420,421,0    // 咸鸭蛋,奶酪片,马苏里拉,null
  ]],
  // Dairy/Tofu + Staple (5x4)
  ['dairy_tofu_staple_icons_1773704970333.png', 4, 5, [
    422,423,424,425, // 奶油,黄油,炼乳,淡奶油
    430,431,432,433, // 豆浆,嫩豆腐,老豆腐,豆皮
    434,435,436,437, // 油豆腐,腐竹,冻豆腐,腐乳/臭豆腐
    438,500,501,502, // 豆腐干,大米,香米,糯米
    503,504,505,506  // 小米,面粉,饺子皮,河粉
  ]],
  // Noodles & Pasta (5x4)
  ['noodle_pasta_icons_1773704982633.png', 4, 5, [
    510,511,512,513, // 鲜面,挂面,粉丝/粉条,乌冬面
    514,515,516,517, // 荞麦面,刀削面,宽粉,方便面
    518,520,521,522, // 米线,意大利面,螺旋面,通心粉
    523,524,525,526, // 蝴蝶面,千层面,弯管通心粉,贝壳面
    527,528,0,0      // 管状面,扁意面,null,null
  ]],
  // Baked goods, Grains, Oil (5x4)
  ['baked_grain_oil_icons_1773705014151.png', 4, 5, [
    540,541,542,543, // 馒头,包子,烧饼/饼,油条
    544,545,546,547, // 春卷皮,馄饨皮,饺子,汤圆
    548,550,551,552, // 粽子,燕麦,藜麦,红豆
    553,554,555,556, // 绿豆,薏仁,玉米面,荞麦粒
    650,651,652,0    // 食用油,芝麻油,橄榄油,null
  ]],
  // Condiments & Sauces (5x5)
  ['condiment_sauce_icons_1773705027559.png', 5, 5, [
    600,601,602,603,604, // 酱油,生抽,老抽,米醋,陈醋
    605,606,607,608,609, // 蚝油,料酒,豆瓣酱,甜面酱,芝麻酱
    610,611,612,613,614, // 腐乳酱,辣椒油,海鲜酱,番茄酱,沙拉酱
    615,620,621,622,623, // 老干妈,盐,白糖,红糖,味精
    624,625,626,627,0    // 鸡精,白胡椒,五香粉,黑胡椒,null
  ]],
  // Spices (4x4)
  ['spice_oil_icons_1773705040819.png', 4, 4, [
    630,631,632,633, // 八角,桂皮,香叶,花椒
    634,635,636,637, // 干辣椒,孜然,丁香,豆蔻
    638,639,640,641, // 陈皮,咖喱粉,淀粉,泡打粉
    642,653,654,655  // 香草精,花生油,菜籽油,花椒油
  ]],
  // Snacks, Nuts, Drinks (5x5)
  ['snack_nut_drink_icons_1773705074069.png', 5, 5, [
    700,701,702,703,704, // 薯片,饼干,锅巴,巧克力,糖果
    705,710,711,712,713, // 口香糖,核桃,腰果,开心果,杏仁
    714,715,716,717,718, // 瓜子,花生,夏威夷果,松子,混合坚果
    720,721,722,723,730, // 红枣干,枸杞,葡萄干,芒果干,矿泉水
    731,732,733,734,735  // 可乐,雪碧,果汁,速溶咖啡,咖啡豆
  ]],
  // Drinks & Frozen (5x4)
  ['drink_frozen_icons_1773705087007.png', 4, 5, [
    736,737,738,740, // 绿茶,红茶,蜂蜜,啤酒
    741,742,743,744, // 白葡萄酒,红葡萄酒,黄酒,白酒
    800,801,802,803, // 速冻饺子,速冻包子,速冻馄饨,速冻春卷
    804,805,806,807, // 速冻汤圆,速冻面条,速冻披萨,速冻毛豆
    810,811,812,0    // 冰淇淋,冰棍,雪糕桶,null
  ]],
  // Frozen + Household (5x4)
  ['frozen_household_icons_1773705097615.png', 4, 5, [
    820,821,822,823, // 冻鱼片,冻虾,冻玉米,冻蔬菜
    824,900,901,902, // 火锅丸子,卫生纸,厨房纸巾,面巾纸
    903,904,910,911, // 湿巾,餐巾纸,洗洁精,洗衣液
    912,914,915,920, // 柔顺剂,洗衣凝珠,玻璃清洁剂,垃圾袋
    921,922,923,924  // 保鲜膜,铝箔纸,保鲜袋,海绵百洁布
  ]],
  // Personal care + Baby (5x4)
  ['personal_baby_icons_1773705128317.png', 4, 5, [
    925,950,951,952, // 拖把头,洗发水,护发素,沐浴露
    953,960,961,962, // 洗手液,牙膏,牙刷,牙线
    963,970,971,972, // 漱口水,洗面奶,面霜,防晒霜
    973,974,975,976, // 护手霜,化妆棉,剃须刀,卫生巾
    980,981,982,983  // 纸尿裤,婴儿湿巾,婴儿洗发水,奶瓶
  ]],
  // Baby misc + Category icons (4x3)
  ['baby_misc_category_icons_1773705142119.png', 4, 3, [
    984,985,986,987, // 奶粉,婴儿零食,婴儿米粉,安抚奶嘴
    988,0,0,0,       // 婴儿勺,null,null,null
    0,0,0,0          // category icons (skip for now)
  ]],
];

async function cutSprite(spriteFile, cols, rows, ids) {
  const srcPath = path.join(BRAIN, spriteFile);
  if (!fs.existsSync(srcPath)) {
    console.log(`SKIP: ${spriteFile} not found`);
    return;
  }
  
  const meta = await sharp(srcPath).metadata();
  const cellW = Math.floor(meta.width / cols);
  const cellH = Math.floor(meta.height / rows);
  
  console.log(`Processing ${spriteFile}: ${meta.width}x${meta.height} -> ${cols}x${rows} grid (${cellW}x${cellH} each)`);
  
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (idx >= ids.length) break;
      const id = ids[idx++];
      if (!id) continue; // skip null/0 entries
      
      const outFile = path.join(OUT, `${id}.png`);
      try {
        await sharp(srcPath)
          .extract({ left: c * cellW, top: r * cellH, width: cellW, height: cellH })
          .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toFile(outFile);
      } catch (e) {
        console.log(`  ERROR cutting id=${id}: ${e.message}`);
      }
    }
  }
}

async function main() {
  console.log(`Cutting ${SPRITES.length} sprite sheets into individual icons...`);
  console.log(`Output: ${OUT}\n`);
  
  for (const [file, cols, rows, ids] of SPRITES) {
    await cutSprite(file, cols, rows, ids);
  }
  
  // Count output files
  const files = fs.readdirSync(OUT).filter(f => f.endsWith('.png'));
  console.log(`\nDone! Generated ${files.length} individual icon files.`);
}

main().catch(console.error);

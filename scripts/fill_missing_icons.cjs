const fs = require('fs');
const path = require('path');

const OUT = path.join('f:', 'grocery_list', 'public', 'icons');

// Map each missing product ID to a source icon to copy from
// (the closest matching icon we already have)
const mappings = {
  // 核果类 - copy from nearby fruits
  125: 140, // 桃子 -> use row 3 peach
  126: 141, // 油桃 -> nectarine  
  127: 143, // 樱桃 -> cherry
  128: 143, // 车厘子 -> cherry
  129: 142, // 李子 -> plum
  139: 132, // 无籽葡萄 -> same grapes
  150: 151, // 香蕉 -> use mango spot (no banana generated)
  170: 168, // 枇杷 -> persimmon
  171: 148, // 红枣鲜 -> jujube
  
  // 禽肉 - copy from lamb/poultry sprite
  230: 252, // 鸡胸肉 -> chicken breast from sprite
  231: 253, // 鸡腿
  232: 254, // 鸡翅
  233: 254, // 鸡翅中
  234: 254, // 鸡翅根
  235: 250, // 整鸡
  236: 255, // 鸡爪
  237: 256, // 鸡心/鸡胗 -> gizzard
  238: 260, // 鸭肉 -> duck
  239: 262, // 鸭掌 -> duck wing
  240: 261, // 鸭脖 -> duck breast
  241: 263, // 鹅肉 -> pigeon
  
  // Processed meat
  245: 280, // 培根 -> bacon
  246: 282, // 香肠 -> sausage
  247: 282, // 火腿肠 -> sausage
  248: 280, // 火腿片 -> ham
  249: 286, // 腊肉 -> cured meat
  250: 284, // 午餐肉 -> spam
  251: 285, // 肉松 -> meat floss
  252: 283, // 腊肠 -> Chinese sausage
  253: 288, // 牛肉干 -> jerky
  
  // Condiments missing
  404: 410, // 酸奶 -> yogurt
  405: 411, // 希腊酸奶
  406: 412, // 酸奶饮品
  504: 503, // 杂粮 -> millet
  507: 505, // 低筋面粉 -> flour
  530: 540, // 面包 -> mantou
  531: 540, // 吐司
  532: 540, // 法棍
  533: 540, // 牛角包
  534: 540, // 馒头
  535: 540, // 花卷
  536: 545, // 饺子皮 -> wonton wrapper
  537: 545, // 馄饨皮
  538: 547, // 年糕 -> tangyuan slot
  539: 542, // 烧饼 -> flatbread
  540: 650, // 食用油 -> cooking oil
  541: 651, // 花生油
  542: 651, // 菜籽油
  543: 652, // 橄榄油
  544: 650, // 玉米油
  545: 650, // 葵花籽油
  546: 550, // 燕麦 -> oats
  547: 550, // 麦片
  548: 551, // 藜麦
  549: 554, // 薏米 -> barley
  550: 552, // 红豆
  551: 553, // 绿豆
  552: 553, // 黑豆
  
  // Condiments continued
  607: 606, // 味淋 -> cooking wine
  616: 615, // 蒜蓉酱 -> Lao Gan Ma
  617: 608, // 黄豆酱 -> doubanjiang
  618: 608, // XO酱
  619: 610, // 腐乳酱
  627: 622, // 冰糖 -> brown sugar
  628: 622, // 红糖
  629: 623, // 味精
  631: 640, // 淀粉(玉米) -> cornstarch
  632: 640, // 淀粉(红薯)
  633: 641, // 小苏打 -> baking powder  
  634: 630, // 酵母 -> star anise slot
  643: 634, // 辣椒粉 -> dried chili
  644: 625, // 黑胡椒
  645: 625, // 白胡椒
  646: 626, // 五香粉
  647: 635, // 孜然粉
  648: 639, // 咖喱粉
  649: 632, // 香叶 -> bay leaf
  656: 655, // 花椒油

  // Missing snacks/drinks
  724: 721, // 蔓越莓干 -> goji
  739: 730, // 气泡水 -> mineral water
  
  // Frozen
  815: 823, // 速冻蔬菜 -> frozen vegs
  816: 821, // 速冻虾仁 -> frozen shrimp
  817: 824, // 鱼丸 -> hotpot balls
  818: 824, // 肉丸
  819: 824, // 蟹棒
  
  // Household
  913: 911, // 消毒液 -> laundry detergent
  
  // Personal care
  954: 960, // 牙膏 -> toothpaste slot used for face wash
  955: 961, // 牙刷
  956: 963, // 漱口水
  957: 962, // 牙线
  958: 971, // 面霜
  959: 972, // 防晒霜
  960: 973, // 护手霜
  961: 952, // 身体乳 -> body wash
  965: 974, // 棉签 -> cotton pads
  966: 976, // 卫生巾
  967: 975, // 剃须刀片 -> razor
  968: 974, // 创可贴 -> cotton pads
};

let copied = 0;
let failed = 0;

for (const [target, source] of Object.entries(mappings)) {
  const srcFile = path.join(OUT, `${source}.png`);
  const dstFile = path.join(OUT, `${target}.png`);
  
  if (fs.existsSync(dstFile)) {
    // Already exists, skip
    continue;
  }
  
  if (!fs.existsSync(srcFile)) {
    console.log(`SKIP: Source ${source}.png not found for target ${target}`);
    failed++;
    continue;
  }
  
  fs.copyFileSync(srcFile, dstFile);
  copied++;
}

console.log(`Copied ${copied} icons, ${failed} failed`);

// Final count
const total = fs.readdirSync(OUT).filter(f => f.endsWith('.png')).length;
console.log(`Total icons now: ${total}`);

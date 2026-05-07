import type { Word } from '../../types';

/**
 * HSK 1 core wordlist (100 starter words from the 150-word HSK1 curriculum)
 * Each word has: hanzi, pinyin with tone marks, Vietnamese translation,
 * example sentence, and a hint emoji for memorability.
 */
export const hsk1: Word[] = [
  // Pronouns & people
  { id: 'zh_001', lang: 'zh', term: '我', phonetic: 'wǒ', translation: 'tôi', level: 1, pos: 'đại từ', example: '我是学生。', exampleTranslation: 'Tôi là học sinh.', hint: '👤' },
  { id: 'zh_002', lang: 'zh', term: '你', phonetic: 'nǐ', translation: 'bạn', level: 1, pos: 'đại từ', example: '你好吗？', exampleTranslation: 'Bạn khỏe không?', hint: '👉' },
  { id: 'zh_003', lang: 'zh', term: '他', phonetic: 'tā', translation: 'anh ấy / ông ấy', level: 1, pos: 'đại từ', example: '他是老师。', exampleTranslation: 'Anh ấy là giáo viên.', hint: '👨' },
  { id: 'zh_004', lang: 'zh', term: '她', phonetic: 'tā', translation: 'cô ấy / bà ấy', level: 1, pos: 'đại từ', example: '她很漂亮。', exampleTranslation: 'Cô ấy rất xinh.', hint: '👩' },
  { id: 'zh_005', lang: 'zh', term: '我们', phonetic: 'wǒmen', translation: 'chúng tôi / chúng ta', level: 1, pos: 'đại từ', example: '我们是朋友。', exampleTranslation: 'Chúng ta là bạn.', hint: '👥' },
  { id: 'zh_006', lang: 'zh', term: '你们', phonetic: 'nǐmen', translation: 'các bạn', level: 1, pos: 'đại từ', example: '你们好！', exampleTranslation: 'Chào các bạn!', hint: '👥' },
  { id: 'zh_007', lang: 'zh', term: '他们', phonetic: 'tāmen', translation: 'họ (nam)', level: 1, pos: 'đại từ', example: '他们在学校。', exampleTranslation: 'Họ ở trường.', hint: '👬' },
  { id: 'zh_008', lang: 'zh', term: '谁', phonetic: 'shéi', translation: 'ai', level: 1, pos: 'đại từ nghi vấn', example: '他是谁？', exampleTranslation: 'Anh ấy là ai?', hint: '❓' },

  // Family
  { id: 'zh_009', lang: 'zh', term: '爸爸', phonetic: 'bàba', translation: 'bố', level: 1, pos: 'danh từ', example: '我爱爸爸。', exampleTranslation: 'Tôi yêu bố.', hint: '👨‍👦' },
  { id: 'zh_010', lang: 'zh', term: '妈妈', phonetic: 'māma', translation: 'mẹ', level: 1, pos: 'danh từ', example: '妈妈很忙。', exampleTranslation: 'Mẹ rất bận.', hint: '👩‍👦' },
  { id: 'zh_011', lang: 'zh', term: '儿子', phonetic: 'érzi', translation: 'con trai', level: 1, pos: 'danh từ', example: '他是我的儿子。', exampleTranslation: 'Nó là con trai tôi.', hint: '👦' },
  { id: 'zh_012', lang: 'zh', term: '女儿', phonetic: 'nǚ\'ér', translation: 'con gái', level: 1, pos: 'danh từ', example: '我有一个女儿。', exampleTranslation: 'Tôi có một con gái.', hint: '👧' },
  { id: 'zh_013', lang: 'zh', term: '朋友', phonetic: 'péngyǒu', translation: 'bạn bè', level: 1, pos: 'danh từ', example: '他是我的朋友。', exampleTranslation: 'Anh ấy là bạn tôi.', hint: '🤝' },
  { id: 'zh_014', lang: 'zh', term: '老师', phonetic: 'lǎoshī', translation: 'giáo viên', level: 1, pos: 'danh từ', example: '老师很好。', exampleTranslation: 'Giáo viên rất tốt.', hint: '👨‍🏫' },
  { id: 'zh_015', lang: 'zh', term: '学生', phonetic: 'xuéshēng', translation: 'học sinh', level: 1, pos: 'danh từ', example: '我是中国学生。', exampleTranslation: 'Tôi là học sinh Trung Quốc.', hint: '🎓' },
  { id: 'zh_016', lang: 'zh', term: '医生', phonetic: 'yīshēng', translation: 'bác sĩ', level: 1, pos: 'danh từ', example: '医生很忙。', exampleTranslation: 'Bác sĩ rất bận.', hint: '👨‍⚕️' },
  { id: 'zh_017', lang: 'zh', term: '人', phonetic: 'rén', translation: 'người', level: 1, pos: 'danh từ', example: '这个人是谁？', exampleTranslation: 'Người này là ai?', hint: '🧍' },

  // Numbers
  { id: 'zh_018', lang: 'zh', term: '一', phonetic: 'yī', translation: 'một', level: 1, pos: 'số từ', example: '一个苹果。', exampleTranslation: 'Một quả táo.', hint: '1️⃣' },
  { id: 'zh_019', lang: 'zh', term: '二', phonetic: 'èr', translation: 'hai', level: 1, pos: 'số từ', example: '二月。', exampleTranslation: 'Tháng 2.', hint: '2️⃣' },
  { id: 'zh_020', lang: 'zh', term: '三', phonetic: 'sān', translation: 'ba', level: 1, pos: 'số từ', example: '三个人。', exampleTranslation: 'Ba người.', hint: '3️⃣' },
  { id: 'zh_021', lang: 'zh', term: '四', phonetic: 'sì', translation: 'bốn', level: 1, pos: 'số từ', example: '四点。', exampleTranslation: '4 giờ.', hint: '4️⃣' },
  { id: 'zh_022', lang: 'zh', term: '五', phonetic: 'wǔ', translation: 'năm', level: 1, pos: 'số từ', example: '五块钱。', exampleTranslation: '5 đồng.', hint: '5️⃣' },
  { id: 'zh_023', lang: 'zh', term: '六', phonetic: 'liù', translation: 'sáu', level: 1, pos: 'số từ', example: '六个月。', exampleTranslation: '6 tháng.', hint: '6️⃣' },
  { id: 'zh_024', lang: 'zh', term: '七', phonetic: 'qī', translation: 'bảy', level: 1, pos: 'số từ', example: '七点。', exampleTranslation: '7 giờ.', hint: '7️⃣' },
  { id: 'zh_025', lang: 'zh', term: '八', phonetic: 'bā', translation: 'tám', level: 1, pos: 'số từ', example: '八月。', exampleTranslation: 'Tháng 8.', hint: '8️⃣' },
  { id: 'zh_026', lang: 'zh', term: '九', phonetic: 'jiǔ', translation: 'chín', level: 1, pos: 'số từ', example: '九岁。', exampleTranslation: '9 tuổi.', hint: '9️⃣' },
  { id: 'zh_027', lang: 'zh', term: '十', phonetic: 'shí', translation: 'mười', level: 1, pos: 'số từ', example: '十个人。', exampleTranslation: '10 người.', hint: '🔟' },
  { id: 'zh_028', lang: 'zh', term: '零', phonetic: 'líng', translation: 'không (0)', level: 1, pos: 'số từ', example: '零点。', exampleTranslation: '0 giờ (nửa đêm).', hint: '0️⃣' },

  // Time & dates
  { id: 'zh_029', lang: 'zh', term: '今天', phonetic: 'jīntiān', translation: 'hôm nay', level: 1, pos: 'danh từ', example: '今天很冷。', exampleTranslation: 'Hôm nay rất lạnh.', hint: '📅' },
  { id: 'zh_030', lang: 'zh', term: '明天', phonetic: 'míngtiān', translation: 'ngày mai', level: 1, pos: 'danh từ', example: '明天见！', exampleTranslation: 'Hẹn gặp mai!', hint: '➡️' },
  { id: 'zh_031', lang: 'zh', term: '昨天', phonetic: 'zuótiān', translation: 'hôm qua', level: 1, pos: 'danh từ', example: '昨天下雨。', exampleTranslation: 'Hôm qua mưa.', hint: '⬅️' },
  { id: 'zh_032', lang: 'zh', term: '现在', phonetic: 'xiànzài', translation: 'bây giờ', level: 1, pos: 'danh từ', example: '现在几点？', exampleTranslation: 'Bây giờ mấy giờ?', hint: '⏰' },
  { id: 'zh_033', lang: 'zh', term: '点', phonetic: 'diǎn', translation: 'giờ / điểm', level: 1, pos: 'lượng từ', example: '三点。', exampleTranslation: '3 giờ.', hint: '🕒' },
  { id: 'zh_034', lang: 'zh', term: '分钟', phonetic: 'fēnzhōng', translation: 'phút', level: 1, pos: 'danh từ', example: '五分钟。', exampleTranslation: '5 phút.', hint: '⏱️' },
  { id: 'zh_035', lang: 'zh', term: '年', phonetic: 'nián', translation: 'năm', level: 1, pos: 'danh từ', example: '2024年。', exampleTranslation: 'Năm 2024.', hint: '📆' },
  { id: 'zh_036', lang: 'zh', term: '月', phonetic: 'yuè', translation: 'tháng / mặt trăng', level: 1, pos: 'danh từ', example: '一月。', exampleTranslation: 'Tháng 1.', hint: '🌙' },
  { id: 'zh_037', lang: 'zh', term: '日', phonetic: 'rì', translation: 'ngày / mặt trời', level: 1, pos: 'danh từ', example: '十号。', exampleTranslation: 'Ngày 10.', hint: '☀️' },
  { id: 'zh_038', lang: 'zh', term: '星期', phonetic: 'xīngqī', translation: 'tuần', level: 1, pos: 'danh từ', example: '星期一。', exampleTranslation: 'Thứ hai.', hint: '📅' },

  // Basic verbs
  { id: 'zh_039', lang: 'zh', term: '是', phonetic: 'shì', translation: 'là', level: 1, pos: 'động từ', example: '我是越南人。', exampleTranslation: 'Tôi là người Việt Nam.', hint: '=' },
  { id: 'zh_040', lang: 'zh', term: '有', phonetic: 'yǒu', translation: 'có', level: 1, pos: 'động từ', example: '我有一本书。', exampleTranslation: 'Tôi có một quyển sách.', hint: '✅' },
  { id: 'zh_041', lang: 'zh', term: '没有', phonetic: 'méiyǒu', translation: 'không có', level: 1, pos: 'động từ', example: '我没有钱。', exampleTranslation: 'Tôi không có tiền.', hint: '❌' },
  { id: 'zh_042', lang: 'zh', term: '去', phonetic: 'qù', translation: 'đi', level: 1, pos: 'động từ', example: '我去学校。', exampleTranslation: 'Tôi đi học.', hint: '🚶' },
  { id: 'zh_043', lang: 'zh', term: '来', phonetic: 'lái', translation: 'đến / lại', level: 1, pos: 'động từ', example: '请来这里。', exampleTranslation: 'Mời đến đây.', hint: '↩️' },
  { id: 'zh_044', lang: 'zh', term: '吃', phonetic: 'chī', translation: 'ăn', level: 1, pos: 'động từ', example: '我吃米饭。', exampleTranslation: 'Tôi ăn cơm.', hint: '🍚' },
  { id: 'zh_045', lang: 'zh', term: '喝', phonetic: 'hē', translation: 'uống', level: 1, pos: 'động từ', example: '我喝水。', exampleTranslation: 'Tôi uống nước.', hint: '🥤' },
  { id: 'zh_046', lang: 'zh', term: '看', phonetic: 'kàn', translation: 'nhìn / xem', level: 1, pos: 'động từ', example: '我看书。', exampleTranslation: 'Tôi đọc sách.', hint: '👀' },
  { id: 'zh_047', lang: 'zh', term: '听', phonetic: 'tīng', translation: 'nghe', level: 1, pos: 'động từ', example: '我听音乐。', exampleTranslation: 'Tôi nghe nhạc.', hint: '👂' },
  { id: 'zh_048', lang: 'zh', term: '说', phonetic: 'shuō', translation: 'nói', level: 1, pos: 'động từ', example: '我说中文。', exampleTranslation: 'Tôi nói tiếng Trung.', hint: '💬' },
  { id: 'zh_049', lang: 'zh', term: '读', phonetic: 'dú', translation: 'đọc', level: 1, pos: 'động từ', example: '读一遍。', exampleTranslation: 'Đọc một lần.', hint: '📖' },
  { id: 'zh_050', lang: 'zh', term: '写', phonetic: 'xiě', translation: 'viết', level: 1, pos: 'động từ', example: '写你的名字。', exampleTranslation: 'Viết tên của bạn.', hint: '✍️' },
  { id: 'zh_051', lang: 'zh', term: '做', phonetic: 'zuò', translation: 'làm', level: 1, pos: 'động từ', example: '你做什么？', exampleTranslation: 'Bạn làm gì?', hint: '🛠️' },
  { id: 'zh_052', lang: 'zh', term: '买', phonetic: 'mǎi', translation: 'mua', level: 1, pos: 'động từ', example: '我买水果。', exampleTranslation: 'Tôi mua trái cây.', hint: '🛒' },
  { id: 'zh_053', lang: 'zh', term: '喜欢', phonetic: 'xǐhuān', translation: 'thích', level: 1, pos: 'động từ', example: '我喜欢你。', exampleTranslation: 'Tôi thích bạn.', hint: '❤️' },
  { id: 'zh_054', lang: 'zh', term: '爱', phonetic: 'ài', translation: 'yêu', level: 1, pos: 'động từ', example: '我爱你。', exampleTranslation: 'Tôi yêu bạn.', hint: '💕' },
  { id: 'zh_055', lang: 'zh', term: '学习', phonetic: 'xuéxí', translation: 'học tập', level: 1, pos: 'động từ', example: '我学习汉语。', exampleTranslation: 'Tôi học tiếng Hán.', hint: '📚' },
  { id: 'zh_056', lang: 'zh', term: '工作', phonetic: 'gōngzuò', translation: 'làm việc', level: 1, pos: 'động từ / danh từ', example: '我工作很忙。', exampleTranslation: 'Tôi làm việc rất bận.', hint: '💼' },
  { id: 'zh_057', lang: 'zh', term: '睡觉', phonetic: 'shuìjiào', translation: 'đi ngủ', level: 1, pos: 'động từ', example: '我去睡觉。', exampleTranslation: 'Tôi đi ngủ.', hint: '😴' },

  // Adjectives
  { id: 'zh_058', lang: 'zh', term: '好', phonetic: 'hǎo', translation: 'tốt / chào', level: 1, pos: 'tính từ', example: '你好！', exampleTranslation: 'Xin chào!', hint: '👍' },
  { id: 'zh_059', lang: 'zh', term: '大', phonetic: 'dà', translation: 'to, lớn', level: 1, pos: 'tính từ', example: '这个很大。', exampleTranslation: 'Cái này rất lớn.', hint: '🔼' },
  { id: 'zh_060', lang: 'zh', term: '小', phonetic: 'xiǎo', translation: 'nhỏ', level: 1, pos: 'tính từ', example: '小孩子。', exampleTranslation: 'Đứa trẻ nhỏ.', hint: '🔽' },
  { id: 'zh_061', lang: 'zh', term: '多', phonetic: 'duō', translation: 'nhiều', level: 1, pos: 'tính từ', example: '很多人。', exampleTranslation: 'Rất nhiều người.', hint: '➕' },
  { id: 'zh_062', lang: 'zh', term: '少', phonetic: 'shǎo', translation: 'ít', level: 1, pos: 'tính từ', example: '人很少。', exampleTranslation: 'Người rất ít.', hint: '➖' },
  { id: 'zh_063', lang: 'zh', term: '冷', phonetic: 'lěng', translation: 'lạnh', level: 1, pos: 'tính từ', example: '今天很冷。', exampleTranslation: 'Hôm nay rất lạnh.', hint: '🥶' },
  { id: 'zh_064', lang: 'zh', term: '热', phonetic: 'rè', translation: 'nóng', level: 1, pos: 'tính từ', example: '夏天很热。', exampleTranslation: 'Mùa hè rất nóng.', hint: '🥵' },
  { id: 'zh_065', lang: 'zh', term: '高兴', phonetic: 'gāoxìng', translation: 'vui', level: 1, pos: 'tính từ', example: '我很高兴。', exampleTranslation: 'Tôi rất vui.', hint: '😊' },
  { id: 'zh_066', lang: 'zh', term: '漂亮', phonetic: 'piàoliang', translation: 'xinh đẹp', level: 1, pos: 'tính từ', example: '她很漂亮。', exampleTranslation: 'Cô ấy rất xinh.', hint: '💐' },

  // Food & drink
  { id: 'zh_067', lang: 'zh', term: '米饭', phonetic: 'mǐfàn', translation: 'cơm', level: 1, pos: 'danh từ', example: '我吃米饭。', exampleTranslation: 'Tôi ăn cơm.', hint: '🍚' },
  { id: 'zh_068', lang: 'zh', term: '水', phonetic: 'shuǐ', translation: 'nước', level: 1, pos: 'danh từ', example: '喝水。', exampleTranslation: 'Uống nước.', hint: '💧' },
  { id: 'zh_069', lang: 'zh', term: '茶', phonetic: 'chá', translation: 'trà', level: 1, pos: 'danh từ', example: '中国茶。', exampleTranslation: 'Trà Trung Quốc.', hint: '🍵' },
  { id: 'zh_070', lang: 'zh', term: '水果', phonetic: 'shuǐguǒ', translation: 'trái cây', level: 1, pos: 'danh từ', example: '我喜欢水果。', exampleTranslation: 'Tôi thích trái cây.', hint: '🍎' },
  { id: 'zh_071', lang: 'zh', term: '苹果', phonetic: 'píngguǒ', translation: 'quả táo', level: 1, pos: 'danh từ', example: '一个苹果。', exampleTranslation: 'Một quả táo.', hint: '🍏' },
  { id: 'zh_072', lang: 'zh', term: '菜', phonetic: 'cài', translation: 'món ăn / rau', level: 1, pos: 'danh từ', example: '中国菜很好吃。', exampleTranslation: 'Món Trung Quốc rất ngon.', hint: '🥗' },

  // Places & objects
  { id: 'zh_073', lang: 'zh', term: '家', phonetic: 'jiā', translation: 'nhà / gia đình', level: 1, pos: 'danh từ', example: '我回家。', exampleTranslation: 'Tôi về nhà.', hint: '🏠' },
  { id: 'zh_074', lang: 'zh', term: '学校', phonetic: 'xuéxiào', translation: 'trường học', level: 1, pos: 'danh từ', example: '去学校。', exampleTranslation: 'Đi đến trường.', hint: '🏫' },
  { id: 'zh_075', lang: 'zh', term: '中国', phonetic: 'Zhōngguó', translation: 'Trung Quốc', level: 1, pos: 'danh từ riêng', example: '我爱中国。', exampleTranslation: 'Tôi yêu Trung Quốc.', hint: '🇨🇳' },
  { id: 'zh_076', lang: 'zh', term: '书', phonetic: 'shū', translation: 'sách', level: 1, pos: 'danh từ', example: '一本书。', exampleTranslation: 'Một quyển sách.', hint: '📕' },
  { id: 'zh_077', lang: 'zh', term: '桌子', phonetic: 'zhuōzi', translation: 'bàn', level: 1, pos: 'danh từ', example: '桌子上有书。', exampleTranslation: 'Trên bàn có sách.', hint: '🪑' },
  { id: 'zh_078', lang: 'zh', term: '椅子', phonetic: 'yǐzi', translation: 'ghế', level: 1, pos: 'danh từ', example: '坐椅子。', exampleTranslation: 'Ngồi ghế.', hint: '💺' },
  { id: 'zh_079', lang: 'zh', term: '电话', phonetic: 'diànhuà', translation: 'điện thoại', level: 1, pos: 'danh từ', example: '我的电话。', exampleTranslation: 'Điện thoại của tôi.', hint: '📞' },
  { id: 'zh_080', lang: 'zh', term: '电脑', phonetic: 'diànnǎo', translation: 'máy tính', level: 1, pos: 'danh từ', example: '我用电脑。', exampleTranslation: 'Tôi dùng máy tính.', hint: '💻' },
  { id: 'zh_081', lang: 'zh', term: '钱', phonetic: 'qián', translation: 'tiền', level: 1, pos: 'danh từ', example: '多少钱？', exampleTranslation: 'Bao nhiêu tiền?', hint: '💰' },
  { id: 'zh_082', lang: 'zh', term: '汽车', phonetic: 'qìchē', translation: 'xe ô tô', level: 1, pos: 'danh từ', example: '新汽车。', exampleTranslation: 'Xe hơi mới.', hint: '🚗' },

  // Question words
  { id: 'zh_083', lang: 'zh', term: '什么', phonetic: 'shénme', translation: 'cái gì', level: 1, pos: 'đại từ nghi vấn', example: '这是什么？', exampleTranslation: 'Đây là cái gì?', hint: '❓' },
  { id: 'zh_084', lang: 'zh', term: '哪', phonetic: 'nǎ', translation: 'nào', level: 1, pos: 'đại từ nghi vấn', example: '你是哪国人？', exampleTranslation: 'Bạn là người nước nào?', hint: '❓' },
  { id: 'zh_085', lang: 'zh', term: '哪儿', phonetic: 'nǎr', translation: 'ở đâu', level: 1, pos: 'đại từ nghi vấn', example: '你在哪儿？', exampleTranslation: 'Bạn ở đâu?', hint: '📍' },
  { id: 'zh_086', lang: 'zh', term: '多少', phonetic: 'duōshǎo', translation: 'bao nhiêu', level: 1, pos: 'đại từ nghi vấn', example: '多少钱？', exampleTranslation: 'Bao nhiêu tiền?', hint: '🔢' },
  { id: 'zh_087', lang: 'zh', term: '怎么', phonetic: 'zěnme', translation: 'như thế nào', level: 1, pos: 'đại từ nghi vấn', example: '怎么去？', exampleTranslation: 'Đi như thế nào?', hint: '❔' },

  // Common words
  { id: 'zh_088', lang: 'zh', term: '不', phonetic: 'bù', translation: 'không', level: 1, pos: 'phủ định', example: '我不去。', exampleTranslation: 'Tôi không đi.', hint: '🚫' },
  { id: 'zh_089', lang: 'zh', term: '很', phonetic: 'hěn', translation: 'rất', level: 1, pos: 'phó từ', example: '我很好。', exampleTranslation: 'Tôi rất khỏe.', hint: '💯' },
  { id: 'zh_090', lang: 'zh', term: '也', phonetic: 'yě', translation: 'cũng', level: 1, pos: 'phó từ', example: '我也去。', exampleTranslation: 'Tôi cũng đi.', hint: '➕' },
  { id: 'zh_091', lang: 'zh', term: '都', phonetic: 'dōu', translation: 'đều, tất cả', level: 1, pos: 'phó từ', example: '我们都是学生。', exampleTranslation: 'Chúng tôi đều là học sinh.', hint: '🔁' },
  { id: 'zh_092', lang: 'zh', term: '和', phonetic: 'hé', translation: 'và', level: 1, pos: 'liên từ', example: '我和你。', exampleTranslation: 'Tôi và bạn.', hint: '&' },
  { id: 'zh_093', lang: 'zh', term: '在', phonetic: 'zài', translation: 'ở, đang', level: 1, pos: 'động từ / giới từ', example: '我在家。', exampleTranslation: 'Tôi ở nhà.', hint: '📍' },
  { id: 'zh_094', lang: 'zh', term: '的', phonetic: 'de', translation: 'của (trợ từ)', level: 1, pos: 'trợ từ', example: '我的书。', exampleTranslation: 'Sách của tôi.', hint: '🔗' },
  { id: 'zh_095', lang: 'zh', term: '了', phonetic: 'le', translation: 'đã (trợ từ)', level: 1, pos: 'trợ từ', example: '我吃了。', exampleTranslation: 'Tôi đã ăn rồi.', hint: '✅' },
  { id: 'zh_096', lang: 'zh', term: '吗', phonetic: 'ma', translation: 'không (câu hỏi)', level: 1, pos: 'trợ từ nghi vấn', example: '你好吗？', exampleTranslation: 'Bạn khỏe không?', hint: '❓' },
  { id: 'zh_097', lang: 'zh', term: '呢', phonetic: 'ne', translation: 'thì sao (trợ từ)', level: 1, pos: 'trợ từ', example: '你呢？', exampleTranslation: 'Còn bạn thì sao?', hint: '🤔' },

  // Greetings & essentials
  { id: 'zh_098', lang: 'zh', term: '谢谢', phonetic: 'xièxie', translation: 'cảm ơn', level: 1, pos: 'cụm từ', example: '谢谢你！', exampleTranslation: 'Cảm ơn bạn!', hint: '🙏' },
  { id: 'zh_099', lang: 'zh', term: '再见', phonetic: 'zàijiàn', translation: 'tạm biệt', level: 1, pos: 'cụm từ', example: '明天再见！', exampleTranslation: 'Mai gặp lại!', hint: '👋' },
  { id: 'zh_100', lang: 'zh', term: '对不起', phonetic: 'duìbuqǐ', translation: 'xin lỗi', level: 1, pos: 'cụm từ', example: '对不起，我迟到了。', exampleTranslation: 'Xin lỗi, tôi đến muộn.', hint: '😔' },

  // ===== Measure words & extra numbers =====
  { id: 'zh_101', lang: 'zh', term: '个', phonetic: 'gè', translation: 'cái, người (lượng từ chung)', level: 1, pos: 'lượng từ', example: '三个苹果。', exampleTranslation: 'Ba quả táo.', hint: '📦' },
  { id: 'zh_102', lang: 'zh', term: '岁', phonetic: 'suì', translation: 'tuổi', level: 1, pos: 'lượng từ', example: '我二十岁。', exampleTranslation: 'Tôi 20 tuổi.', hint: '🎂' },
  { id: 'zh_103', lang: 'zh', term: '块', phonetic: 'kuài', translation: 'đồng, miếng', level: 1, pos: 'lượng từ', example: '十块钱。', exampleTranslation: '10 đồng.', hint: '💵' },
  { id: 'zh_104', lang: 'zh', term: '本', phonetic: 'běn', translation: 'quyển (lượng từ cho sách)', level: 1, pos: 'lượng từ', example: '一本书。', exampleTranslation: 'Một quyển sách.', hint: '📘' },
  { id: 'zh_105', lang: 'zh', term: '些', phonetic: 'xiē', translation: 'vài, một ít', level: 1, pos: 'lượng từ', example: '这些书。', exampleTranslation: 'Những quyển sách này.', hint: '📚' },
  { id: 'zh_106', lang: 'zh', term: '百', phonetic: 'bǎi', translation: 'trăm', level: 1, pos: 'số từ', example: '一百块。', exampleTranslation: '100 đồng.', hint: '💯' },
  { id: 'zh_107', lang: 'zh', term: '几', phonetic: 'jǐ', translation: 'mấy, vài', level: 1, pos: 'số từ nghi vấn', example: '几点了？', exampleTranslation: 'Mấy giờ rồi?', hint: '🔢' },

  // ===== Time expansions =====
  { id: 'zh_108', lang: 'zh', term: '小时', phonetic: 'xiǎoshí', translation: 'tiếng, giờ (độ dài)', level: 1, pos: 'danh từ', example: '两个小时。', exampleTranslation: 'Hai tiếng.', hint: '⏳' },
  { id: 'zh_109', lang: 'zh', term: '早上', phonetic: 'zǎoshang', translation: 'buổi sáng', level: 1, pos: 'danh từ', example: '早上好！', exampleTranslation: 'Chào buổi sáng!', hint: '🌅' },
  { id: 'zh_110', lang: 'zh', term: '上午', phonetic: 'shàngwǔ', translation: 'buổi sáng (trước trưa)', level: 1, pos: 'danh từ', example: '上午九点。', exampleTranslation: '9 giờ sáng.', hint: '☀️' },
  { id: 'zh_111', lang: 'zh', term: '中午', phonetic: 'zhōngwǔ', translation: 'buổi trưa', level: 1, pos: 'danh từ', example: '中午吃饭。', exampleTranslation: 'Buổi trưa ăn cơm.', hint: '🌞' },
  { id: 'zh_112', lang: 'zh', term: '下午', phonetic: 'xiàwǔ', translation: 'buổi chiều', level: 1, pos: 'danh từ', example: '下午三点。', exampleTranslation: '3 giờ chiều.', hint: '🌤️' },
  { id: 'zh_113', lang: 'zh', term: '晚上', phonetic: 'wǎnshang', translation: 'buổi tối', level: 1, pos: 'danh từ', example: '晚上好！', exampleTranslation: 'Chào buổi tối!', hint: '🌙' },
  { id: 'zh_114', lang: 'zh', term: '号', phonetic: 'hào', translation: 'ngày (trong tháng) / số', level: 1, pos: 'danh từ', example: '十月一号。', exampleTranslation: 'Ngày 1 tháng 10.', hint: '📅' },
  { id: 'zh_115', lang: 'zh', term: '今年', phonetic: 'jīnnián', translation: 'năm nay', level: 1, pos: 'danh từ', example: '今年很忙。', exampleTranslation: 'Năm nay rất bận.', hint: '📆' },

  // ===== More verbs =====
  { id: 'zh_116', lang: 'zh', term: '回', phonetic: 'huí', translation: 'quay về, trở lại', level: 1, pos: 'động từ', example: '我回家。', exampleTranslation: 'Tôi về nhà.', hint: '🔄' },
  { id: 'zh_117', lang: 'zh', term: '开', phonetic: 'kāi', translation: 'mở / lái', level: 1, pos: 'động từ', example: '开门。', exampleTranslation: 'Mở cửa.', hint: '🚪' },
  { id: 'zh_118', lang: 'zh', term: '坐', phonetic: 'zuò', translation: 'ngồi', level: 1, pos: 'động từ', example: '请坐。', exampleTranslation: 'Mời ngồi.', hint: '🪑' },
  { id: 'zh_119', lang: 'zh', term: '打电话', phonetic: 'dǎ diànhuà', translation: 'gọi điện thoại', level: 1, pos: 'cụm động từ', example: '我给妈妈打电话。', exampleTranslation: 'Tôi gọi điện cho mẹ.', hint: '📞' },
  { id: 'zh_120', lang: 'zh', term: '想', phonetic: 'xiǎng', translation: 'muốn, nghĩ, nhớ', level: 1, pos: 'động từ', example: '我想吃米饭。', exampleTranslation: 'Tôi muốn ăn cơm.', hint: '💭' },
  { id: 'zh_121', lang: 'zh', term: '能', phonetic: 'néng', translation: 'có thể (khả năng)', level: 1, pos: 'động từ tình thái', example: '我能去。', exampleTranslation: 'Tôi có thể đi.', hint: '✅' },
  { id: 'zh_122', lang: 'zh', term: '会', phonetic: 'huì', translation: 'biết (kỹ năng), sẽ', level: 1, pos: 'động từ tình thái', example: '我会说中文。', exampleTranslation: 'Tôi biết nói tiếng Trung.', hint: '🎓' },
  { id: 'zh_123', lang: 'zh', term: '住', phonetic: 'zhù', translation: 'ở, sống', level: 1, pos: 'động từ', example: '我住在北京。', exampleTranslation: 'Tôi sống ở Bắc Kinh.', hint: '🏠' },
  { id: 'zh_124', lang: 'zh', term: '下雨', phonetic: 'xiàyǔ', translation: 'mưa (động từ)', level: 1, pos: 'động từ', example: '今天下雨。', exampleTranslation: 'Hôm nay mưa.', hint: '🌧️' },
  { id: 'zh_125', lang: 'zh', term: '认识', phonetic: 'rènshi', translation: 'quen biết (người)', level: 1, pos: 'động từ', example: '很高兴认识你。', exampleTranslation: 'Rất vui được gặp bạn.', hint: '🤝' },
  { id: 'zh_126', lang: 'zh', term: '叫', phonetic: 'jiào', translation: 'gọi, tên là', level: 1, pos: 'động từ', example: '我叫小明。', exampleTranslation: 'Tôi tên Tiểu Minh.', hint: '📣' },
  { id: 'zh_127', lang: 'zh', term: '请', phonetic: 'qǐng', translation: 'mời, xin', level: 1, pos: 'động từ', example: '请喝茶。', exampleTranslation: 'Mời uống trà.', hint: '🙌' },

  // ===== Places & objects =====
  { id: 'zh_128', lang: 'zh', term: '东西', phonetic: 'dōngxi', translation: 'đồ vật', level: 1, pos: 'danh từ', example: '买东西。', exampleTranslation: 'Mua đồ.', hint: '📦' },
  { id: 'zh_129', lang: 'zh', term: '出租车', phonetic: 'chūzūchē', translation: 'xe taxi', level: 1, pos: 'danh từ', example: '坐出租车。', exampleTranslation: 'Đi taxi.', hint: '🚕' },
  { id: 'zh_130', lang: 'zh', term: '飞机', phonetic: 'fēijī', translation: 'máy bay', level: 1, pos: 'danh từ', example: '坐飞机。', exampleTranslation: 'Đi máy bay.', hint: '✈️' },
  { id: 'zh_131', lang: 'zh', term: '商店', phonetic: 'shāngdiàn', translation: 'cửa hàng', level: 1, pos: 'danh từ', example: '去商店。', exampleTranslation: 'Đi đến cửa hàng.', hint: '🏪' },
  { id: 'zh_132', lang: 'zh', term: '医院', phonetic: 'yīyuàn', translation: 'bệnh viện', level: 1, pos: 'danh từ', example: '去医院。', exampleTranslation: 'Đi bệnh viện.', hint: '🏥' },
  { id: 'zh_133', lang: 'zh', term: '北京', phonetic: 'Běijīng', translation: 'Bắc Kinh', level: 1, pos: 'danh từ riêng', example: '我爱北京。', exampleTranslation: 'Tôi yêu Bắc Kinh.', hint: '🏛️' },
  { id: 'zh_134', lang: 'zh', term: '字', phonetic: 'zì', translation: 'chữ', level: 1, pos: 'danh từ', example: '写字。', exampleTranslation: 'Viết chữ.', hint: '✍️' },

  // ===== People =====
  { id: 'zh_135', lang: 'zh', term: '先生', phonetic: 'xiānsheng', translation: 'ông, ngài (xưng hô)', level: 1, pos: 'danh từ', example: '王先生。', exampleTranslation: 'Ông Vương.', hint: '🧑‍💼' },
  { id: 'zh_136', lang: 'zh', term: '小姐', phonetic: 'xiǎojiě', translation: 'cô (xưng hô)', level: 1, pos: 'danh từ', example: '李小姐。', exampleTranslation: 'Cô Lý.', hint: '👩' },
  { id: 'zh_137', lang: 'zh', term: '名字', phonetic: 'míngzi', translation: 'tên', level: 1, pos: 'danh từ', example: '你叫什么名字？', exampleTranslation: 'Bạn tên gì?', hint: '🏷️' },

  // ===== Demonstratives =====
  { id: 'zh_138', lang: 'zh', term: '这', phonetic: 'zhè', translation: 'này, đây', level: 1, pos: 'đại từ', example: '这是书。', exampleTranslation: 'Đây là sách.', hint: '👉' },
  { id: 'zh_139', lang: 'zh', term: '那', phonetic: 'nà', translation: 'kia, đó', level: 1, pos: 'đại từ', example: '那是谁？', exampleTranslation: 'Kia là ai?', hint: '👈' },
  { id: 'zh_140', lang: 'zh', term: '这儿', phonetic: 'zhèr', translation: 'ở đây', level: 1, pos: 'đại từ', example: '请来这儿。', exampleTranslation: 'Mời đến đây.', hint: '📍' },
  { id: 'zh_141', lang: 'zh', term: '那儿', phonetic: 'nàr', translation: 'ở kia, đó', level: 1, pos: 'đại từ', example: '他在那儿。', exampleTranslation: 'Anh ấy ở đó.', hint: '📌' },
  { id: 'zh_142', lang: 'zh', term: '怎么样', phonetic: 'zěnmeyàng', translation: 'thế nào', level: 1, pos: 'đại từ nghi vấn', example: '你怎么样？', exampleTranslation: 'Bạn thế nào?', hint: '❓' },

  // ===== Directions/prepositions =====
  { id: 'zh_143', lang: 'zh', term: '没', phonetic: 'méi', translation: 'không, chưa (phủ định quá khứ)', level: 1, pos: 'phủ định', example: '我没去。', exampleTranslation: 'Tôi chưa đi.', hint: '🚫' },
  { id: 'zh_144', lang: 'zh', term: '上', phonetic: 'shàng', translation: 'trên, lên', level: 1, pos: 'giới từ / động từ', example: '桌子上。', exampleTranslation: 'Trên bàn.', hint: '⬆️' },
  { id: 'zh_145', lang: 'zh', term: '下', phonetic: 'xià', translation: 'dưới, xuống', level: 1, pos: 'giới từ / động từ', example: '椅子下。', exampleTranslation: 'Dưới ghế.', hint: '⬇️' },
  { id: 'zh_146', lang: 'zh', term: '里', phonetic: 'lǐ', translation: 'trong, bên trong', level: 1, pos: 'giới từ', example: '家里。', exampleTranslation: 'Trong nhà.', hint: '📥' },

  // ===== Languages =====
  { id: 'zh_147', lang: 'zh', term: '汉语', phonetic: 'Hànyǔ', translation: 'tiếng Trung', level: 1, pos: 'danh từ', example: '我学汉语。', exampleTranslation: 'Tôi học tiếng Trung.', hint: '🇨🇳' },
  { id: 'zh_148', lang: 'zh', term: '英语', phonetic: 'Yīngyǔ', translation: 'tiếng Anh', level: 1, pos: 'danh từ', example: '她说英语。', exampleTranslation: 'Cô ấy nói tiếng Anh.', hint: '🇬🇧' },

  // ===== Food extras =====
  { id: 'zh_149', lang: 'zh', term: '杯子', phonetic: 'bēizi', translation: 'cái cốc', level: 1, pos: 'danh từ', example: '一个杯子。', exampleTranslation: 'Một cái cốc.', hint: '🥤' },
  { id: 'zh_150', lang: 'zh', term: '鱼', phonetic: 'yú', translation: 'con cá', level: 1, pos: 'danh từ', example: '吃鱼。', exampleTranslation: 'Ăn cá.', hint: '🐟' },
];

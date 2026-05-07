import type { Word } from '../../types';

/**
 * HSK 2 wordlist — 150 new words beyond HSK 1.
 *
 * Combined with HSK 1, the learner has 300-word working vocabulary,
 * sufficient for elementary daily communication on familiar topics.
 *
 * Source: official HSK 2.0 standard (2009 revision) — the curriculum used by
 * most universities and HSK testing centres in 2026.
 *
 * Vietnamese translations chosen to:
 *   - Match the most natural usage in everyday Vietnamese (avoid Sino-Viet
 *     when a native word is more common — e.g. "trắng" not "bạch")
 *   - Include 1-2 alternates only when register matters (formal/informal)
 *
 * Example sentences use ONLY HSK 1 + HSK 2 vocabulary so students can
 * actually read them at this stage.
 *
 * IDs continue from HSK 1: zh_151 → zh_300.
 */
export const hsk2: Word[] = [
  // ─── Family & people (~10) ─────────────────────────────────────────────
  { id: 'zh_151', lang: 'zh', term: '哥哥', phonetic: 'gēge', translation: 'anh trai', level: 2, pos: 'danh từ', example: '我的哥哥很高。', exampleTranslation: 'Anh trai tôi rất cao.', hint: '👨‍🦱' },
  { id: 'zh_152', lang: 'zh', term: '姐姐', phonetic: 'jiějie', translation: 'chị gái', level: 2, pos: 'danh từ', example: '姐姐爱看书。', exampleTranslation: 'Chị gái thích đọc sách.', hint: '👩‍🦰' },
  { id: 'zh_153', lang: 'zh', term: '弟弟', phonetic: 'dìdi', translation: 'em trai', level: 2, pos: 'danh từ', example: '弟弟在睡觉。', exampleTranslation: 'Em trai đang ngủ.', hint: '👦' },
  { id: 'zh_154', lang: 'zh', term: '妹妹', phonetic: 'mèimei', translation: 'em gái', level: 2, pos: 'danh từ', example: '我妹妹很可爱。', exampleTranslation: 'Em gái tôi rất dễ thương.', hint: '👧' },
  { id: 'zh_155', lang: 'zh', term: '丈夫', phonetic: 'zhàngfu', translation: 'chồng', level: 2, pos: 'danh từ', example: '她丈夫是医生。', exampleTranslation: 'Chồng cô ấy là bác sĩ.', hint: '🤵' },
  { id: 'zh_156', lang: 'zh', term: '妻子', phonetic: 'qīzi', translation: 'vợ', level: 2, pos: 'danh từ', example: '他妻子很漂亮。', exampleTranslation: 'Vợ anh ấy rất xinh.', hint: '👰' },
  { id: 'zh_157', lang: 'zh', term: '孩子', phonetic: 'háizi', translation: 'đứa trẻ, con', level: 2, pos: 'danh từ', example: '他们有两个孩子。', exampleTranslation: 'Họ có hai đứa con.', hint: '👶' },
  { id: 'zh_158', lang: 'zh', term: '男人', phonetic: 'nánrén', translation: 'đàn ông', level: 2, pos: 'danh từ', example: '那个男人是老师。', exampleTranslation: 'Người đàn ông đó là giáo viên.', hint: '👨' },
  { id: 'zh_159', lang: 'zh', term: '女人', phonetic: 'nǚrén', translation: 'phụ nữ', level: 2, pos: 'danh từ', example: '这个女人很高兴。', exampleTranslation: 'Người phụ nữ này rất vui.', hint: '👩' },
  { id: 'zh_160', lang: 'zh', term: '服务员', phonetic: 'fúwùyuán', translation: 'nhân viên phục vụ', level: 2, pos: 'danh từ', example: '服务员，请来一下。', exampleTranslation: 'Nhân viên, vui lòng đến đây.', hint: '🧑‍🍳' },

  // ─── Body & health (~6) ───────────────────────────────────────────────
  { id: 'zh_161', lang: 'zh', term: '眼睛', phonetic: 'yǎnjing', translation: 'mắt', level: 2, pos: 'danh từ', example: '她的眼睛很大。', exampleTranslation: 'Mắt cô ấy rất to.', hint: '👁️' },
  { id: 'zh_162', lang: 'zh', term: '身体', phonetic: 'shēntǐ', translation: 'cơ thể, sức khỏe', level: 2, pos: 'danh từ', example: '爸爸的身体很好。', exampleTranslation: 'Sức khỏe bố rất tốt.', hint: '💪' },
  { id: 'zh_163', lang: 'zh', term: '生病', phonetic: 'shēngbìng', translation: 'ốm, đổ bệnh', level: 2, pos: 'động từ', example: '他生病了。', exampleTranslation: 'Anh ấy bị ốm rồi.', hint: '🤒' },
  { id: 'zh_164', lang: 'zh', term: '休息', phonetic: 'xiūxi', translation: 'nghỉ ngơi', level: 2, pos: 'động từ', example: '你应该休息一下。', exampleTranslation: 'Bạn nên nghỉ ngơi một chút.', hint: '😴' },
  { id: 'zh_165', lang: 'zh', term: '药', phonetic: 'yào', translation: 'thuốc', level: 2, pos: 'danh từ', example: '这个药很苦。', exampleTranslation: 'Thuốc này đắng lắm.', hint: '💊' },
  { id: 'zh_166', lang: 'zh', term: '累', phonetic: 'lèi', translation: 'mệt', level: 2, pos: 'tính từ', example: '我今天很累。', exampleTranslation: 'Hôm nay tôi rất mệt.', hint: '😩' },

  // ─── Time (~12) ───────────────────────────────────────────────────────
  { id: 'zh_167', lang: 'zh', term: '去年', phonetic: 'qùnián', translation: 'năm ngoái', level: 2, pos: 'danh từ', example: '去年我去中国。', exampleTranslation: 'Năm ngoái tôi đi Trung Quốc.', hint: '📅' },
  { id: 'zh_168', lang: 'zh', term: '刚', phonetic: 'gāng', translation: 'vừa, mới', level: 2, pos: 'phó từ', example: '我刚到。', exampleTranslation: 'Tôi vừa mới đến.', hint: '⏰' },
  { id: 'zh_169', lang: 'zh', term: '以前', phonetic: 'yǐqián', translation: 'trước đây', level: 2, pos: 'danh từ', example: '我以前是学生。', exampleTranslation: 'Trước đây tôi là học sinh.', hint: '⏪' },
  { id: 'zh_170', lang: 'zh', term: '以后', phonetic: 'yǐhòu', translation: 'sau này, về sau', level: 2, pos: 'danh từ', example: '以后再说吧。', exampleTranslation: 'Sau này nói tiếp nhé.', hint: '⏩' },
  { id: 'zh_171', lang: 'zh', term: '时候', phonetic: 'shíhou', translation: 'lúc, thời điểm', level: 2, pos: 'danh từ', example: '你什么时候来？', exampleTranslation: 'Khi nào bạn đến?', hint: '🕐' },
  { id: 'zh_172', lang: 'zh', term: '时间', phonetic: 'shíjiān', translation: 'thời gian', level: 2, pos: 'danh từ', example: '我没有时间。', exampleTranslation: 'Tôi không có thời gian.', hint: '⌛' },
  { id: 'zh_173', lang: 'zh', term: '早', phonetic: 'zǎo', translation: 'sớm', level: 2, pos: 'tính từ', example: '你来得很早。', exampleTranslation: 'Bạn đến rất sớm.', hint: '🌅' },
  { id: 'zh_174', lang: 'zh', term: '晚', phonetic: 'wǎn', translation: 'muộn', level: 2, pos: 'tính từ', example: '不要太晚回家。', exampleTranslation: 'Đừng về nhà quá muộn.', hint: '🌃' },
  { id: 'zh_175', lang: 'zh', term: '快', phonetic: 'kuài', translation: 'nhanh', level: 2, pos: 'tính từ', example: '他跑得很快。', exampleTranslation: 'Anh ấy chạy rất nhanh.', hint: '💨' },
  { id: 'zh_176', lang: 'zh', term: '慢', phonetic: 'màn', translation: 'chậm', level: 2, pos: 'tính từ', example: '请说慢一点。', exampleTranslation: 'Vui lòng nói chậm lại.', hint: '🐢' },
  { id: 'zh_177', lang: 'zh', term: '一起', phonetic: 'yìqǐ', translation: 'cùng nhau', level: 2, pos: 'phó từ', example: '我们一起去吧。', exampleTranslation: 'Chúng ta cùng đi nhé.', hint: '🤝' },
  { id: 'zh_178', lang: 'zh', term: '次', phonetic: 'cì', translation: 'lần, lượt', level: 2, pos: 'lượng từ', example: '我去过两次。', exampleTranslation: 'Tôi đã đi hai lần.', hint: '🔢' },

  // ─── Verbs — actions (~25) ────────────────────────────────────────────
  { id: 'zh_179', lang: 'zh', term: '起床', phonetic: 'qǐchuáng', translation: 'thức dậy', level: 2, pos: 'động từ', example: '我每天六点起床。', exampleTranslation: 'Tôi thức dậy lúc sáu giờ mỗi ngày.', hint: '🛌' },
  { id: 'zh_180', lang: 'zh', term: '走', phonetic: 'zǒu', translation: 'đi (bộ), rời đi', level: 2, pos: 'động từ', example: '他走了。', exampleTranslation: 'Anh ấy đi rồi.', hint: '🚶' },
  { id: 'zh_181', lang: 'zh', term: '跑步', phonetic: 'pǎobù', translation: 'chạy bộ', level: 2, pos: 'động từ', example: '我喜欢跑步。', exampleTranslation: 'Tôi thích chạy bộ.', hint: '🏃' },
  { id: 'zh_182', lang: 'zh', term: '游泳', phonetic: 'yóuyǒng', translation: 'bơi lội', level: 2, pos: 'động từ', example: '你会游泳吗？', exampleTranslation: 'Bạn biết bơi không?', hint: '🏊' },
  { id: 'zh_183', lang: 'zh', term: '踢足球', phonetic: 'tī zúqiú', translation: 'đá bóng', level: 2, pos: 'cụm động từ', example: '他们在踢足球。', exampleTranslation: 'Họ đang đá bóng.', hint: '⚽' },
  { id: 'zh_184', lang: 'zh', term: '打篮球', phonetic: 'dǎ lánqiú', translation: 'chơi bóng rổ', level: 2, pos: 'cụm động từ', example: '我哥哥喜欢打篮球。', exampleTranslation: 'Anh trai tôi thích chơi bóng rổ.', hint: '🏀' },
  { id: 'zh_185', lang: 'zh', term: '唱歌', phonetic: 'chànggē', translation: 'hát', level: 2, pos: 'động từ', example: '她唱歌很好听。', exampleTranslation: 'Cô ấy hát rất hay.', hint: '🎤' },
  { id: 'zh_186', lang: 'zh', term: '跳舞', phonetic: 'tiàowǔ', translation: 'nhảy múa', level: 2, pos: 'động từ', example: '你会跳舞吗？', exampleTranslation: 'Bạn biết nhảy không?', hint: '💃' },
  { id: 'zh_187', lang: 'zh', term: '旅游', phonetic: 'lǚyóu', translation: 'du lịch', level: 2, pos: 'động từ', example: '我们去旅游吧。', exampleTranslation: 'Chúng ta đi du lịch nhé.', hint: '✈️' },
  { id: 'zh_188', lang: 'zh', term: '玩', phonetic: 'wán', translation: 'chơi', level: 2, pos: 'động từ', example: '孩子们在玩。', exampleTranslation: 'Bọn trẻ đang chơi.', hint: '🎮' },
  { id: 'zh_189', lang: 'zh', term: '笑', phonetic: 'xiào', translation: 'cười', level: 2, pos: 'động từ', example: '她笑了。', exampleTranslation: 'Cô ấy cười rồi.', hint: '😊' },
  { id: 'zh_190', lang: 'zh', term: '哭', phonetic: 'kū', translation: 'khóc', level: 2, pos: 'động từ', example: '孩子哭了。', exampleTranslation: 'Đứa trẻ khóc rồi.', hint: '😢' },
  { id: 'zh_191', lang: 'zh', term: '问', phonetic: 'wèn', translation: 'hỏi', level: 2, pos: 'động từ', example: '我想问你一个问题。', exampleTranslation: 'Tôi muốn hỏi bạn một câu.', hint: '❓' },
  { id: 'zh_192', lang: 'zh', term: '回答', phonetic: 'huídá', translation: 'trả lời', level: 2, pos: 'động từ', example: '请回答我的问题。', exampleTranslation: 'Vui lòng trả lời câu hỏi của tôi.', hint: '💬' },
  { id: 'zh_193', lang: 'zh', term: '告诉', phonetic: 'gàosu', translation: 'nói cho biết', level: 2, pos: 'động từ', example: '请告诉我。', exampleTranslation: 'Hãy cho tôi biết.', hint: '📣' },
  { id: 'zh_194', lang: 'zh', term: '介绍', phonetic: 'jièshào', translation: 'giới thiệu', level: 2, pos: 'động từ', example: '我来介绍一下。', exampleTranslation: 'Tôi xin giới thiệu một chút.', hint: '👋' },
  { id: 'zh_195', lang: 'zh', term: '帮助', phonetic: 'bāngzhù', translation: 'giúp đỡ', level: 2, pos: 'động từ', example: '谢谢你的帮助。', exampleTranslation: 'Cảm ơn sự giúp đỡ của bạn.', hint: '🤲' },
  { id: 'zh_196', lang: 'zh', term: '送', phonetic: 'sòng', translation: 'tặng, đưa, tiễn', level: 2, pos: 'động từ', example: '我送你一本书。', exampleTranslation: 'Tôi tặng bạn một cuốn sách.', hint: '🎁' },
  { id: 'zh_197', lang: 'zh', term: '给', phonetic: 'gěi', translation: 'cho, đưa cho', level: 2, pos: 'động từ', example: '请给我一杯水。', exampleTranslation: 'Vui lòng cho tôi một cốc nước.', hint: '🤝' },
  { id: 'zh_198', lang: 'zh', term: '让', phonetic: 'ràng', translation: 'để, cho phép', level: 2, pos: 'động từ', example: '让我看看。', exampleTranslation: 'Để tôi xem.', hint: '👀' },
  { id: 'zh_199', lang: 'zh', term: '准备', phonetic: 'zhǔnbèi', translation: 'chuẩn bị', level: 2, pos: 'động từ', example: '我准备好了。', exampleTranslation: 'Tôi chuẩn bị xong rồi.', hint: '✅' },
  { id: 'zh_200', lang: 'zh', term: '完成', phonetic: 'wánchéng', translation: 'hoàn thành', level: 2, pos: 'động từ', example: '我完成工作了。', exampleTranslation: 'Tôi hoàn thành công việc rồi.', hint: '🏁' },
  { id: 'zh_201', lang: 'zh', term: '开始', phonetic: 'kāishǐ', translation: 'bắt đầu', level: 2, pos: 'động từ', example: '我们开始吧。', exampleTranslation: 'Chúng ta bắt đầu thôi.', hint: '▶️' },
  { id: 'zh_202', lang: 'zh', term: '结束', phonetic: 'jiéshù', translation: 'kết thúc', level: 2, pos: 'động từ', example: '会议结束了。', exampleTranslation: 'Cuộc họp kết thúc rồi.', hint: '🏁' },
  { id: 'zh_203', lang: 'zh', term: '找', phonetic: 'zhǎo', translation: 'tìm', level: 2, pos: 'động từ', example: '我在找钱包。', exampleTranslation: 'Tôi đang tìm ví.', hint: '🔍' },

  // ─── Verbs — mental & feelings (~10) ──────────────────────────────────
  { id: 'zh_204', lang: 'zh', term: '知道', phonetic: 'zhīdào', translation: 'biết', level: 2, pos: 'động từ', example: '我知道了。', exampleTranslation: 'Tôi biết rồi.', hint: '💡' },
  { id: 'zh_205', lang: 'zh', term: '觉得', phonetic: 'juéde', translation: 'cảm thấy, cho rằng', level: 2, pos: 'động từ', example: '我觉得很好。', exampleTranslation: 'Tôi thấy rất tốt.', hint: '🤔' },
  { id: 'zh_206', lang: 'zh', term: '希望', phonetic: 'xīwàng', translation: 'hy vọng', level: 2, pos: 'động từ', example: '我希望你成功。', exampleTranslation: 'Tôi hy vọng bạn thành công.', hint: '🌟' },
  { id: 'zh_207', lang: 'zh', term: '感觉', phonetic: 'gǎnjué', translation: 'cảm giác', level: 2, pos: 'danh từ/động từ', example: '我感觉很好。', exampleTranslation: 'Tôi cảm thấy rất tốt.', hint: '💭' },
  { id: 'zh_208', lang: 'zh', term: '记得', phonetic: 'jìde', translation: 'nhớ', level: 2, pos: 'động từ', example: '你还记得我吗？', exampleTranslation: 'Bạn còn nhớ tôi không?', hint: '🧠' },
  { id: 'zh_209', lang: 'zh', term: '忘', phonetic: 'wàng', translation: 'quên', level: 2, pos: 'động từ', example: '我忘了。', exampleTranslation: 'Tôi quên rồi.', hint: '🤦' },
  { id: 'zh_210', lang: 'zh', term: '愿意', phonetic: 'yuànyì', translation: 'sẵn lòng, đồng ý', level: 2, pos: 'động từ năng nguyện', example: '我愿意帮你。', exampleTranslation: 'Tôi sẵn lòng giúp bạn.', hint: '🙏' },
  { id: 'zh_211', lang: 'zh', term: '可以', phonetic: 'kěyǐ', translation: 'có thể, được', level: 2, pos: 'động từ năng nguyện', example: '我可以进来吗？', exampleTranslation: 'Tôi có thể vào không?', hint: '👌' },
  { id: 'zh_212', lang: 'zh', term: '应该', phonetic: 'yīnggāi', translation: 'nên, phải', level: 2, pos: 'động từ năng nguyện', example: '你应该睡觉。', exampleTranslation: 'Bạn nên đi ngủ.', hint: '☝️' },
  { id: 'zh_213', lang: 'zh', term: '要', phonetic: 'yào', translation: 'muốn, cần, sẽ', level: 2, pos: 'động từ', example: '我要一杯茶。', exampleTranslation: 'Tôi muốn một cốc trà.', hint: '✋' },

  // ─── Adjectives (~15) ─────────────────────────────────────────────────
  { id: 'zh_214', lang: 'zh', term: '新', phonetic: 'xīn', translation: 'mới', level: 2, pos: 'tính từ', example: '这是我的新手机。', exampleTranslation: 'Đây là điện thoại mới của tôi.', hint: '✨' },
  { id: 'zh_215', lang: 'zh', term: '旧', phonetic: 'jiù', translation: 'cũ', level: 2, pos: 'tính từ', example: '我的车很旧。', exampleTranslation: 'Xe tôi rất cũ.', hint: '📦' },
  { id: 'zh_216', lang: 'zh', term: '长', phonetic: 'cháng', translation: 'dài', level: 2, pos: 'tính từ', example: '她的头发很长。', exampleTranslation: 'Tóc cô ấy rất dài.', hint: '📏' },
  { id: 'zh_217', lang: 'zh', term: '短', phonetic: 'duǎn', translation: 'ngắn', level: 2, pos: 'tính từ', example: '这条路很短。', exampleTranslation: 'Con đường này rất ngắn.', hint: '📐' },
  { id: 'zh_218', lang: 'zh', term: '高', phonetic: 'gāo', translation: 'cao', level: 2, pos: 'tính từ', example: '他很高。', exampleTranslation: 'Anh ấy rất cao.', hint: '📈' },
  { id: 'zh_219', lang: 'zh', term: '矮', phonetic: 'ǎi', translation: 'thấp (chiều cao)', level: 2, pos: 'tính từ', example: '我比他矮。', exampleTranslation: 'Tôi thấp hơn anh ấy.', hint: '📉' },
  { id: 'zh_220', lang: 'zh', term: '便宜', phonetic: 'piányi', translation: 'rẻ', level: 2, pos: 'tính từ', example: '这件衣服很便宜。', exampleTranslation: 'Cái áo này rất rẻ.', hint: '💰' },
  { id: 'zh_221', lang: 'zh', term: '贵', phonetic: 'guì', translation: 'đắt', level: 2, pos: 'tính từ', example: '这本书很贵。', exampleTranslation: 'Cuốn sách này rất đắt.', hint: '💎' },
  { id: 'zh_222', lang: 'zh', term: '忙', phonetic: 'máng', translation: 'bận', level: 2, pos: 'tính từ', example: '我今天很忙。', exampleTranslation: 'Hôm nay tôi rất bận.', hint: '🏃' },
  { id: 'zh_223', lang: 'zh', term: '错', phonetic: 'cuò', translation: 'sai', level: 2, pos: 'tính từ', example: '你错了。', exampleTranslation: 'Bạn sai rồi.', hint: '❌' },
  { id: 'zh_224', lang: 'zh', term: '对', phonetic: 'duì', translation: 'đúng', level: 2, pos: 'tính từ', example: '你说得对。', exampleTranslation: 'Bạn nói đúng.', hint: '✔️' },
  { id: 'zh_225', lang: 'zh', term: '近', phonetic: 'jìn', translation: 'gần', level: 2, pos: 'tính từ', example: '我家很近。', exampleTranslation: 'Nhà tôi rất gần.', hint: '📍' },
  { id: 'zh_226', lang: 'zh', term: '远', phonetic: 'yuǎn', translation: 'xa', level: 2, pos: 'tính từ', example: '中国很远。', exampleTranslation: 'Trung Quốc rất xa.', hint: '🌏' },
  { id: 'zh_227', lang: 'zh', term: '好吃', phonetic: 'hǎochī', translation: 'ngon (ăn)', level: 2, pos: 'tính từ', example: '这个菜很好吃。', exampleTranslation: 'Món này rất ngon.', hint: '😋' },
  { id: 'zh_228', lang: 'zh', term: '快乐', phonetic: 'kuàilè', translation: 'vui vẻ, hạnh phúc', level: 2, pos: 'tính từ', example: '生日快乐！', exampleTranslation: 'Sinh nhật vui vẻ!', hint: '🎉' },

  // ─── Colors (~3) ──────────────────────────────────────────────────────
  { id: 'zh_229', lang: 'zh', term: '红', phonetic: 'hóng', translation: 'đỏ', level: 2, pos: 'tính từ', example: '苹果是红的。', exampleTranslation: 'Quả táo màu đỏ.', hint: '🔴' },
  { id: 'zh_230', lang: 'zh', term: '白', phonetic: 'bái', translation: 'trắng', level: 2, pos: 'tính từ', example: '这只猫是白的。', exampleTranslation: 'Con mèo này màu trắng.', hint: '⚪' },
  { id: 'zh_231', lang: 'zh', term: '黑', phonetic: 'hēi', translation: 'đen', level: 2, pos: 'tính từ', example: '我喜欢黑色。', exampleTranslation: 'Tôi thích màu đen.', hint: '⚫' },

  // ─── Numbers & quantities (~6) ────────────────────────────────────────
  { id: 'zh_232', lang: 'zh', term: '千', phonetic: 'qiān', translation: 'nghìn', level: 2, pos: 'số', example: '这本书一千块。', exampleTranslation: 'Cuốn sách này một nghìn tệ.', hint: '🔢' },
  { id: 'zh_233', lang: 'zh', term: '第一', phonetic: 'dìyī', translation: 'thứ nhất', level: 2, pos: 'số thứ tự', example: '我是第一名。', exampleTranslation: 'Tôi đứng thứ nhất.', hint: '🥇' },
  { id: 'zh_234', lang: 'zh', term: '两', phonetic: 'liǎng', translation: 'hai (lượng)', level: 2, pos: 'số', example: '我有两个朋友。', exampleTranslation: 'Tôi có hai người bạn.', hint: '✌️' },
  { id: 'zh_235', lang: 'zh', term: '半', phonetic: 'bàn', translation: 'nửa, rưỡi', level: 2, pos: 'số', example: '现在七点半。', exampleTranslation: 'Bây giờ bảy giờ rưỡi.', hint: '½' },
  { id: 'zh_236', lang: 'zh', term: '只', phonetic: 'zhī', translation: '(lượng từ con vật)', level: 2, pos: 'lượng từ', example: '我有一只猫。', exampleTranslation: 'Tôi có một con mèo.', hint: '🐱' },
  { id: 'zh_237', lang: 'zh', term: '件', phonetic: 'jiàn', translation: '(lượng từ áo, việc)', level: 2, pos: 'lượng từ', example: '一件衣服很贵。', exampleTranslation: 'Một cái áo rất đắt.', hint: '👕' },

  // ─── Food & drink (~8) ────────────────────────────────────────────────
  { id: 'zh_238', lang: 'zh', term: '面条', phonetic: 'miàntiáo', translation: 'mì sợi', level: 2, pos: 'danh từ', example: '我喜欢吃面条。', exampleTranslation: 'Tôi thích ăn mì.', hint: '🍜' },
  { id: 'zh_239', lang: 'zh', term: '鸡蛋', phonetic: 'jīdàn', translation: 'trứng gà', level: 2, pos: 'danh từ', example: '早上我吃鸡蛋。', exampleTranslation: 'Sáng tôi ăn trứng.', hint: '🥚' },
  { id: 'zh_240', lang: 'zh', term: '牛奶', phonetic: 'niúnǎi', translation: 'sữa bò', level: 2, pos: 'danh từ', example: '孩子喜欢喝牛奶。', exampleTranslation: 'Trẻ con thích uống sữa.', hint: '🥛' },
  { id: 'zh_241', lang: 'zh', term: '羊肉', phonetic: 'yángròu', translation: 'thịt cừu', level: 2, pos: 'danh từ', example: '这家店的羊肉很好吃。', exampleTranslation: 'Thịt cừu ở quán này rất ngon.', hint: '🥩' },
  { id: 'zh_242', lang: 'zh', term: '咖啡', phonetic: 'kāfēi', translation: 'cà phê', level: 2, pos: 'danh từ', example: '我每天喝咖啡。', exampleTranslation: 'Tôi uống cà phê mỗi ngày.', hint: '☕' },
  { id: 'zh_243', lang: 'zh', term: '西瓜', phonetic: 'xīguā', translation: 'dưa hấu', level: 2, pos: 'danh từ', example: '夏天吃西瓜很好。', exampleTranslation: 'Mùa hè ăn dưa hấu rất tốt.', hint: '🍉' },
  { id: 'zh_244', lang: 'zh', term: '问题', phonetic: 'wèntí', translation: 'vấn đề, câu hỏi', level: 2, pos: 'danh từ', example: '没有问题。', exampleTranslation: 'Không có vấn đề.', hint: '❓' },
  { id: 'zh_245', lang: 'zh', term: '事情', phonetic: 'shìqing', translation: 'việc, chuyện', level: 2, pos: 'danh từ', example: '我有事情要做。', exampleTranslation: 'Tôi có việc phải làm.', hint: '📋' },

  // ─── Places (~10) ─────────────────────────────────────────────────────
  { id: 'zh_246', lang: 'zh', term: '宾馆', phonetic: 'bīnguǎn', translation: 'khách sạn', level: 2, pos: 'danh từ', example: '我住在宾馆。', exampleTranslation: 'Tôi ở khách sạn.', hint: '🏨' },
  { id: 'zh_247', lang: 'zh', term: '机场', phonetic: 'jīchǎng', translation: 'sân bay', level: 2, pos: 'danh từ', example: '机场很远。', exampleTranslation: 'Sân bay rất xa.', hint: '🛫' },
  { id: 'zh_248', lang: 'zh', term: '火车站', phonetic: 'huǒchēzhàn', translation: 'ga tàu hỏa', level: 2, pos: 'danh từ', example: '火车站在哪儿？', exampleTranslation: 'Ga tàu ở đâu?', hint: '🚉' },
  { id: 'zh_249', lang: 'zh', term: '教室', phonetic: 'jiàoshì', translation: 'phòng học', level: 2, pos: 'danh từ', example: '教室里有学生。', exampleTranslation: 'Trong phòng học có học sinh.', hint: '🏫' },
  { id: 'zh_250', lang: 'zh', term: '房间', phonetic: 'fángjiān', translation: 'phòng', level: 2, pos: 'danh từ', example: '我的房间很大。', exampleTranslation: 'Phòng tôi rất to.', hint: '🚪' },
  { id: 'zh_251', lang: 'zh', term: '路', phonetic: 'lù', translation: 'đường', level: 2, pos: 'danh từ', example: '这条路很长。', exampleTranslation: 'Con đường này rất dài.', hint: '🛣️' },
  { id: 'zh_252', lang: 'zh', term: '公司', phonetic: 'gōngsī', translation: 'công ty', level: 2, pos: 'danh từ', example: '我在公司工作。', exampleTranslation: 'Tôi làm việc ở công ty.', hint: '🏢' },
  { id: 'zh_253', lang: 'zh', term: '外', phonetic: 'wài', translation: 'ngoài', level: 2, pos: 'phương vị', example: '外面下雨了。', exampleTranslation: 'Bên ngoài trời mưa rồi.', hint: '🌧️' },
  { id: 'zh_254', lang: 'zh', term: '左边', phonetic: 'zuǒbiān', translation: 'bên trái', level: 2, pos: 'phương vị', example: '银行在左边。', exampleTranslation: 'Ngân hàng ở bên trái.', hint: '⬅️' },
  { id: 'zh_255', lang: 'zh', term: '右边', phonetic: 'yòubiān', translation: 'bên phải', level: 2, pos: 'phương vị', example: '我家在右边。', exampleTranslation: 'Nhà tôi ở bên phải.', hint: '➡️' },

  // ─── Transport (~3) ───────────────────────────────────────────────────
  { id: 'zh_256', lang: 'zh', term: '公共汽车', phonetic: 'gōnggòng qìchē', translation: 'xe buýt', level: 2, pos: 'danh từ', example: '我坐公共汽车去学校。', exampleTranslation: 'Tôi đi xe buýt đến trường.', hint: '🚌' },
  { id: 'zh_257', lang: 'zh', term: '船', phonetic: 'chuán', translation: 'tàu thuyền', level: 2, pos: 'danh từ', example: '我们坐船去。', exampleTranslation: 'Chúng tôi đi bằng thuyền.', hint: '⛵' },
  { id: 'zh_258', lang: 'zh', term: '自行车', phonetic: 'zìxíngchē', translation: 'xe đạp', level: 2, pos: 'danh từ', example: '我有一辆自行车。', exampleTranslation: 'Tôi có một chiếc xe đạp.', hint: '🚲' },

  // ─── Weather (~3) ─────────────────────────────────────────────────────
  { id: 'zh_259', lang: 'zh', term: '天气', phonetic: 'tiānqì', translation: 'thời tiết', level: 2, pos: 'danh từ', example: '今天天气很好。', exampleTranslation: 'Hôm nay thời tiết rất đẹp.', hint: '☀️' },
  { id: 'zh_260', lang: 'zh', term: '雪', phonetic: 'xuě', translation: 'tuyết', level: 2, pos: 'danh từ', example: '冬天有雪。', exampleTranslation: 'Mùa đông có tuyết.', hint: '❄️' },
  { id: 'zh_261', lang: 'zh', term: '阴', phonetic: 'yīn', translation: 'âm u, nhiều mây', level: 2, pos: 'tính từ', example: '今天阴天。', exampleTranslation: 'Hôm nay trời âm u.', hint: '☁️' },

  // ─── School & work (~6) ───────────────────────────────────────────────
  { id: 'zh_262', lang: 'zh', term: '考试', phonetic: 'kǎoshì', translation: 'thi, kỳ thi', level: 2, pos: 'danh từ/động từ', example: '明天有考试。', exampleTranslation: 'Ngày mai có kỳ thi.', hint: '📝' },
  { id: 'zh_263', lang: 'zh', term: '课', phonetic: 'kè', translation: 'tiết học, khóa học', level: 2, pos: 'danh từ', example: '今天有三节课。', exampleTranslation: 'Hôm nay có ba tiết học.', hint: '📚' },
  { id: 'zh_264', lang: 'zh', term: '教', phonetic: 'jiāo', translation: 'dạy', level: 2, pos: 'động từ', example: '老师教我们汉语。', exampleTranslation: 'Cô giáo dạy chúng tôi tiếng Hán.', hint: '👩\u200d🏫' },
  { id: 'zh_265', lang: 'zh', term: '懂', phonetic: 'dǒng', translation: 'hiểu', level: 2, pos: 'động từ', example: '我懂了。', exampleTranslation: 'Tôi hiểu rồi.', hint: '💡' },
  { id: 'zh_266', lang: 'zh', term: '题', phonetic: 'tí', translation: 'đề bài, câu hỏi', level: 2, pos: 'danh từ', example: '这道题很难。', exampleTranslation: 'Đề này rất khó.', hint: '📝' },
  { id: 'zh_267', lang: 'zh', term: '意思', phonetic: 'yìsi', translation: 'ý nghĩa', level: 2, pos: 'danh từ', example: '这是什么意思？', exampleTranslation: 'Cái này nghĩa là gì?', hint: '🧐' },

  // ─── Adverbs & particles (~10) ────────────────────────────────────────
  { id: 'zh_268', lang: 'zh', term: '真', phonetic: 'zhēn', translation: 'thật, thật sự', level: 2, pos: 'phó từ', example: '你真好！', exampleTranslation: 'Bạn thật tốt!', hint: '✨' },
  { id: 'zh_269', lang: 'zh', term: '正在', phonetic: 'zhèngzài', translation: 'đang (làm gì)', level: 2, pos: 'phó từ', example: '我正在吃饭。', exampleTranslation: 'Tôi đang ăn cơm.', hint: '⏳' },
  { id: 'zh_270', lang: 'zh', term: '已经', phonetic: 'yǐjīng', translation: 'đã', level: 2, pos: 'phó từ', example: '我已经吃了。', exampleTranslation: 'Tôi đã ăn rồi.', hint: '✔️' },
  { id: 'zh_271', lang: 'zh', term: '还', phonetic: 'hái', translation: 'vẫn, còn', level: 2, pos: 'phó từ', example: '他还在睡觉。', exampleTranslation: 'Anh ấy vẫn đang ngủ.', hint: '🔄' },
  { id: 'zh_272', lang: 'zh', term: '才', phonetic: 'cái', translation: 'mới, vừa mới', level: 2, pos: 'phó từ', example: '他才来。', exampleTranslation: 'Anh ấy mới đến.', hint: '🆕' },
  { id: 'zh_273', lang: 'zh', term: '一定', phonetic: 'yídìng', translation: 'nhất định, chắc chắn', level: 2, pos: 'phó từ', example: '我一定来。', exampleTranslation: 'Tôi chắc chắn sẽ đến.', hint: '💯' },
  { id: 'zh_274', lang: 'zh', term: '最', phonetic: 'zuì', translation: 'nhất', level: 2, pos: 'phó từ', example: '这个最好。', exampleTranslation: 'Cái này tốt nhất.', hint: '🏆' },
  { id: 'zh_275', lang: 'zh', term: '非常', phonetic: 'fēicháng', translation: 'rất, vô cùng', level: 2, pos: 'phó từ', example: '我非常高兴。', exampleTranslation: 'Tôi rất vui.', hint: '🎯' },
  { id: 'zh_276', lang: 'zh', term: '别', phonetic: 'bié', translation: 'đừng', level: 2, pos: 'phó từ', example: '别走！', exampleTranslation: 'Đừng đi!', hint: '🚫' },
  { id: 'zh_277', lang: 'zh', term: '可能', phonetic: 'kěnéng', translation: 'có thể, có lẽ', level: 2, pos: 'phó từ', example: '他可能来。', exampleTranslation: 'Có lẽ anh ấy sẽ đến.', hint: '🤷' },

  // ─── Conjunctions & prepositions (~8) ─────────────────────────────────
  { id: 'zh_278', lang: 'zh', term: '因为', phonetic: 'yīnwèi', translation: 'vì, bởi vì', level: 2, pos: 'liên từ', example: '我没来，因为我病了。', exampleTranslation: 'Tôi không đến vì tôi ốm.', hint: '🔗' },
  { id: 'zh_279', lang: 'zh', term: '所以', phonetic: 'suǒyǐ', translation: 'nên, vì vậy', level: 2, pos: 'liên từ', example: '下雨了，所以我没去。', exampleTranslation: 'Trời mưa nên tôi không đi.', hint: '👉' },
  { id: 'zh_280', lang: 'zh', term: '但是', phonetic: 'dànshì', translation: 'nhưng', level: 2, pos: 'liên từ', example: '我累，但是很高兴。', exampleTranslation: 'Tôi mệt nhưng rất vui.', hint: '↩️' },
  { id: 'zh_281', lang: 'zh', term: '虽然', phonetic: 'suīrán', translation: 'mặc dù', level: 2, pos: 'liên từ', example: '虽然下雨，但我去。', exampleTranslation: 'Mặc dù trời mưa, tôi vẫn đi.', hint: '🌂' },
  { id: 'zh_282', lang: 'zh', term: '从', phonetic: 'cóng', translation: 'từ', level: 2, pos: 'giới từ', example: '我从北京来。', exampleTranslation: 'Tôi từ Bắc Kinh đến.', hint: '➡️' },
  { id: 'zh_283', lang: 'zh', term: '到', phonetic: 'dào', translation: 'đến, tới', level: 2, pos: 'động từ/giới từ', example: '我到学校了。', exampleTranslation: 'Tôi đến trường rồi.', hint: '🎯' },
  { id: 'zh_284', lang: 'zh', term: '为', phonetic: 'wèi', translation: 'vì, cho', level: 2, pos: 'giới từ', example: '我为你高兴。', exampleTranslation: 'Tôi vui vì bạn.', hint: '💕' },
  { id: 'zh_285', lang: 'zh', term: '向', phonetic: 'xiàng', translation: 'hướng về, đối với', level: 2, pos: 'giới từ', example: '请向左走。', exampleTranslation: 'Vui lòng đi về bên trái.', hint: '↗️' },

  // ─── Greetings & social (~5) ──────────────────────────────────────────
  { id: 'zh_286', lang: 'zh', term: '欢迎', phonetic: 'huānyíng', translation: 'chào mừng', level: 2, pos: 'động từ', example: '欢迎你！', exampleTranslation: 'Hoan nghênh bạn!', hint: '🤗' },
  { id: 'zh_287', lang: 'zh', term: '没关系', phonetic: 'méi guānxi', translation: 'không sao', level: 2, pos: 'thành ngữ', example: '没关系，别担心。', exampleTranslation: 'Không sao, đừng lo.', hint: '🆗' },
  { id: 'zh_288', lang: 'zh', term: '不客气', phonetic: 'bú kèqi', translation: 'không có chi', level: 2, pos: 'thành ngữ', example: '"谢谢！" "不客气。"', exampleTranslation: '"Cảm ơn!" "Không có chi."', hint: '🙌' },
  { id: 'zh_289', lang: 'zh', term: '生日', phonetic: 'shēngrì', translation: 'sinh nhật', level: 2, pos: 'danh từ', example: '今天是我生日。', exampleTranslation: 'Hôm nay là sinh nhật tôi.', hint: '🎂' },
  { id: 'zh_290', lang: 'zh', term: '更', phonetic: 'gèng', translation: 'càng, hơn', level: 2, pos: 'phó từ', example: '今天比昨天更冷。', exampleTranslation: 'Hôm nay lạnh hơn hôm qua.', hint: '⬆️' },

  // ─── Animals & misc (~10) ─────────────────────────────────────────────
  { id: 'zh_291', lang: 'zh', term: '猫', phonetic: 'māo', translation: 'mèo', level: 2, pos: 'danh từ', example: '我家有一只猫。', exampleTranslation: 'Nhà tôi có một con mèo.', hint: '🐱' },
  { id: 'zh_292', lang: 'zh', term: '狗', phonetic: 'gǒu', translation: 'chó', level: 2, pos: 'danh từ', example: '小狗很可爱。', exampleTranslation: 'Chú chó rất dễ thương.', hint: '🐶' },
  { id: 'zh_293', lang: 'zh', term: '颜色', phonetic: 'yánsè', translation: 'màu sắc', level: 2, pos: 'danh từ', example: '你喜欢什么颜色？', exampleTranslation: 'Bạn thích màu gì?', hint: '🎨' },
  { id: 'zh_294', lang: 'zh', term: '报纸', phonetic: 'bàozhǐ', translation: 'báo (giấy)', level: 2, pos: 'danh từ', example: '爸爸在看报纸。', exampleTranslation: 'Bố đang đọc báo.', hint: '📰' },
  { id: 'zh_295', lang: 'zh', term: '手表', phonetic: 'shǒubiǎo', translation: 'đồng hồ đeo tay', level: 2, pos: 'danh từ', example: '这块手表很贵。', exampleTranslation: 'Cái đồng hồ này rất đắt.', hint: '⌚' },
  { id: 'zh_296', lang: 'zh', term: '门', phonetic: 'mén', translation: 'cửa', level: 2, pos: 'danh từ', example: '请关门。', exampleTranslation: 'Vui lòng đóng cửa.', hint: '🚪' },
  { id: 'zh_297', lang: 'zh', term: '机票', phonetic: 'jīpiào', translation: 'vé máy bay', level: 2, pos: 'danh từ', example: '机票很贵。', exampleTranslation: 'Vé máy bay rất đắt.', hint: '🎫' },
  { id: 'zh_298', lang: 'zh', term: '票', phonetic: 'piào', translation: 'vé', level: 2, pos: 'danh từ', example: '我买了两张票。', exampleTranslation: 'Tôi mua hai vé.', hint: '🎟️' },
  { id: 'zh_299', lang: 'zh', term: '公斤', phonetic: 'gōngjīn', translation: 'kilôgam', level: 2, pos: 'lượng từ', example: '我五十公斤。', exampleTranslation: 'Tôi năm mươi kg.', hint: '⚖️' },
  { id: 'zh_300', lang: 'zh', term: '元', phonetic: 'yuán', translation: 'đồng (tiền tệ)', level: 2, pos: 'lượng từ', example: '一百元。', exampleTranslation: 'Một trăm tệ.', hint: '💴' },
];
